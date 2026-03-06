import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const KNOWLEDGE_PATH = path.join(__dirname, '../../../Chat GPT Knowledge/conversations.json');

// Extract text content from ChatGPT conversation mapping
function extractConversationText(mapping) {
  const messages = [];

  for (const [nodeId, node] of Object.entries(mapping)) {
    if (node.message && node.message.content && node.message.content.parts) {
      const role = node.message.author?.role || 'unknown';
      const text = node.message.content.parts.join(' ').trim();
      if (text && role === 'user') {
        messages.push(text);
      }
    }
  }

  return messages.join('\n\n');
}

// Use AI to extract memories from conversation
async function extractMemoriesFromConversation(title, userMessages) {
  if (!userMessages || userMessages.length < 50) {
    return []; // Skip very short conversations
  }

  const prompt = `Analyze this ChatGPT conversation and extract ONLY personal facts about the user (Brandon Hinrichs).

Conversation Title: ${title}

User's messages:
${userMessages.slice(0, 8000)}

Extract personal facts such as:
- Biographical info (name, age, location, family)
- Work/career information
- Preferences and habits
- Health information
- Relationships and contacts
- Goals and interests
- Schedules and routines

Return a JSON array of memories. Each memory should be a concise fact about the user.
Format: {"memories": ["fact 1", "fact 2", ...]}

If no personal facts are found, return: {"memories": []}
Do NOT include general knowledge or topics discussed - ONLY facts about the user personally.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.memories || [];
  } catch (error) {
    console.error('Error extracting memories:', error.message);
    return [];
  }
}

// Store memory in Supabase
async function storeMemory(content, source) {
  try {
    // Use AI to categorize and format the memory
    const formatPrompt = `Categorize and format this personal fact for storage.

Fact: ${content}

Return JSON with:
{
  "content": "formatted fact as a complete sentence",
  "category": "one of: biographical, preference, schedule, contact, work, personal, health, finance, hobby, goal, relationship, skill, general",
  "memory_type": "one of: fact, routine, habit, preference, relationship, event",
  "importance_level": "one of: low, medium, high, critical",
  "tags": ["relevant", "tags"],
  "related_entities": ["names", "places", "organizations"]
}`;

    const formatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: formatPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const metadata = JSON.parse(formatResponse.choices[0].message.content);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('memories')
      .insert({
        content: metadata.content,
        raw_input: content,
        category: metadata.category,
        memory_type: metadata.memory_type,
        importance_level: metadata.importance_level,
        tags: metadata.tags,
        related_entities: metadata.related_entities,
        context: `Imported from ChatGPT: ${source}`,
      });

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        console.log('  Skipping duplicate memory');
        return false;
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error storing memory:', error.message);
    return false;
  }
}

// Main import function
async function importKnowledge() {
  console.log('📚 Loading ChatGPT conversations...');

  const rawData = fs.readFileSync(KNOWLEDGE_PATH, 'utf-8');
  const conversations = JSON.parse(rawData);

  console.log(`Found ${conversations.length} conversations\n`);

  let totalMemories = 0;
  let processedConversations = 0;

  // Process conversations (most recent first based on update_time)
  const sortedConversations = conversations
    .filter(c => c.mapping && Object.keys(c.mapping).length > 0)
    .sort((a, b) => (b.update_time || 0) - (a.update_time || 0));

  // Limit to most recent 100 conversations to avoid rate limits
  const toProcess = sortedConversations.slice(0, 100);

  for (const conv of toProcess) {
    processedConversations++;
    const title = conv.title || 'Untitled';

    console.log(`[${processedConversations}/${toProcess.length}] Processing: ${title}`);

    const userMessages = extractConversationText(conv.mapping);
    const memories = await extractMemoriesFromConversation(title, userMessages);

    if (memories.length > 0) {
      console.log(`  Found ${memories.length} memories`);

      for (const memory of memories) {
        const stored = await storeMemory(memory, title);
        if (stored) {
          totalMemories++;
          console.log(`  ✅ Stored: ${memory.slice(0, 60)}...`);
        }
      }
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Processed: ${processedConversations} conversations`);
  console.log(`   Stored: ${totalMemories} memories`);
}

// Run the import
importKnowledge().catch(console.error);
