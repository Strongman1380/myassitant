import { callOpenAI } from '../services/openai.js';
import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rawInput } = req.body;

    if (!rawInput) {
      return res.status(400).json({ error: 'Missing rawInput' });
    }

    const systemPrompt = `You are a memory assistant for Brandon Hinrichs. The user will provide rough notes about themselves that they want you to remember. Your job is to:
1. Convert their raw input into a clean, well-structured fact or memory
2. Analyze and categorize the memory with metadata

Guidelines for formatting:
- Convert to third person (e.g., "I like pizza" becomes "Brandon likes pizza")
- Be concise but include important details
- Use proper grammar and punctuation
- If it's a preference, state it clearly (e.g., "Brandon prefers X over Y")
- If it's biographical info, format it cleanly (e.g., "Brandon works as a [job] at [company]")
- If it's a habit or routine, describe it clearly
- Keep it to 1-2 sentences maximum

Guidelines for categorization:
- category: Choose ONE from: biographical, preference, schedule, contact, work, personal, health, finance, hobby, goal, relationship, skill, general
- memory_type: Choose ONE from: fact, routine, habit, preference, relationship, event, goal, skill, contact_info, schedule, note
- importance_level: Choose ONE from: low, medium, high, critical
- tags: Extract 2-5 relevant searchable keywords (lowercase, single words or short phrases)
- related_entities: List any people, places, companies, or organizations mentioned

Return ONLY valid JSON in this exact format with no explanations:
{
  "content": "formatted memory here",
  "category": "category_name",
  "memory_type": "type_name",
  "importance_level": "level",
  "tags": ["tag1", "tag2", "tag3"],
  "related_entities": ["entity1", "entity2"],
  "context": "any additional helpful context or notes"
}`;

    const aiResponse = await callOpenAI(systemPrompt, rawInput);

    // Parse the JSON response
    let memoryData;
    try {
      const cleanedResponse = aiResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      memoryData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('AI returned invalid JSON format');
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('memories')
      .insert([{
        content: memoryData.content,
        raw_input: rawInput,
        category: memoryData.category || 'general',
        memory_type: memoryData.memory_type || 'fact',
        tags: memoryData.tags || [],
        importance_level: memoryData.importance_level || 'medium',
        related_entities: memoryData.related_entities || [],
        context: memoryData.context || null
      }])
      .select();

    if (error) {
      throw new Error(`Failed to save memory to database: ${error.message}`);
    }

    // Get total count
    const { count } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      success: true,
      original: rawInput,
      formatted: memoryData.content,
      metadata: {
        category: memoryData.category,
        memory_type: memoryData.memory_type,
        importance_level: memoryData.importance_level,
        tags: memoryData.tags,
        related_entities: memoryData.related_entities
      },
      totalMemories: count || 0
    });
  } catch (error) {
    console.error('Error in /api/memory/add:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
