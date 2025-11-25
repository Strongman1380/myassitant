import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import { callOpenAI } from '../services/openai.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/memory/test-connection
// Test Supabase connection
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔍 Testing Supabase connection...');

    // Try to select from memories table
    const { data, error } = await supabase
      .from('memories')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        hint: error.hint,
        details: error.details,
        message: 'Failed to connect to Supabase. Make sure you have run the SQL migration in your Supabase dashboard.'
      });
    }

    console.log('✅ Supabase connection successful!');
    res.json({
      success: true,
      message: 'Supabase connection working! The memories table exists.',
      projectUrl: process.env.SUPABASE_URL
    });
  } catch (error) {
    console.error('❌ Error testing connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/memory/add
// Body: { rawInput: string }
router.post('/add', async (req, res) => {
  try {
    console.log('📝 Memory add request received:', req.body);
    const { rawInput } = req.body;

    if (!rawInput) {
      console.error('❌ Missing rawInput in request body');
      return res.status(400).json({ error: 'Missing rawInput' });
    }

    // Use AI to format the memory AND extract metadata
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

    console.log('🤖 AI response received:', aiResponse.substring(0, 200) + '...');

    // Parse the JSON response
    let memoryData;
    try {
      // Clean up the response in case there's any markdown formatting
      const cleanedResponse = aiResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      memoryData = JSON.parse(cleanedResponse);
      console.log('✅ Parsed memory data:', memoryData);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      throw new Error('AI returned invalid JSON format');
    }

    // Save to Supabase with all metadata
    console.log('💾 Attempting to save to Supabase...');
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
      console.error('❌ Supabase error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to save memory to database: ${error.message || error.hint || 'Unknown error'}`);
    }

    console.log('✅ Memory saved to Supabase:', data);

    // Get total count
    const { count } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true });

    res.json({
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
});

// GET /api/memory/list
// Optional query params: ?category=work&importance=high
router.get('/list', async (req, res) => {
  try {
    const { category, importance, tag } = req.query;

    let query = supabase
      .from('memories')
      .select('*')
      .eq('is_active', true);

    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    if (importance) {
      query = query.eq('importance_level', importance);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to load memories from database');
    }

    res.json({
      type: 'memory_dump',
      memories: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in /api/memory/list:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/memory/categories
// Get all unique categories with counts
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to load categories from database');
    }

    // Count occurrences of each category
    const categoryCounts = data.reduce((acc, memory) => {
      acc[memory.category] = (acc[memory.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      categories: categoryCounts
    });
  } catch (error) {
    console.error('Error in /api/memory/categories:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/memory/tags
// Get all unique tags with counts
router.get('/tags', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('tags')
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to load tags from database');
    }

    // Flatten all tags and count occurrences
    const allTags = data.flatMap(memory => memory.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    res.json({
      tags: tagCounts
    });
  } catch (error) {
    console.error('Error in /api/memory/tags:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/memory/search
// Search memories by content (for client compatibility)
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing search query' });
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('is_active', true)
      .ilike('content', `%${query}%`);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to search memories');
    }

    res.json({
      results: data,
      count: data.length,
      query: query,
      explanation: `Found ${data.length} memories matching "${query}"`
    });
  } catch (error) {
    console.error('Error in /api/memory/search:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/memory/search?q=keyword
// Search memories by content
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing search query parameter "q"' });
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('is_active', true)
      .ilike('content', `%${q}%`);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to search memories');
    }

    res.json({
      results: data,
      count: data.length,
      query: q
    });
  } catch (error) {
    console.error('Error in /api/memory/search:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/memory/:id
// Soft delete a specific memory
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('memories')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to delete memory');
    }

    res.json({
      success: true,
      message: 'Memory deleted'
    });
  } catch (error) {
    console.error('Error in /api/memory/:id:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/memory/clear
// Clear all memories (useful for testing)
router.delete('/clear', async (req, res) => {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to clear memories from database');
    }

    res.json({
      success: true,
      message: 'All memories cleared'
    });
  } catch (error) {
    console.error('Error in /api/memory/clear:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/memory/parse-document
// Upload and parse a document to extract memories
router.post('/parse-document', async (req, res) => {
  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Get the uploaded file
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📄 Parsing document:', uploadedFile.originalFilename);

    // Read file content
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf8');

    // Clean up the temporary file
    fs.unlinkSync(uploadedFile.filepath);

    // Use AI to extract important information and memories from the document
    const prompt = `You are a memory extraction assistant. Analyze the following document and extract all important information that should be remembered about the person or context.

Extract facts, preferences, important dates, relationships, goals, routines, and any other relevant information. Format each piece of information as a separate, clear statement.

Return ONLY a JSON object with this exact structure:
{
  "memories": [
    "First important fact or piece of information",
    "Second important fact or piece of information",
    "Third important fact or piece of information"
  ]
}

Document content:
${fileContent.substring(0, 15000)}`;

    const aiResponse = await callOpenAI(prompt);

    // Parse the AI response
    let extractedData;
    try {
      // Try to parse as JSON
      extractedData = JSON.parse(aiResponse);
    } catch (parseError) {
      // If not valid JSON, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI did not return valid JSON');
      }
    }

    if (!extractedData.memories || !Array.isArray(extractedData.memories)) {
      throw new Error('Invalid response format from AI');
    }

    console.log(`✅ Extracted ${extractedData.memories.length} memories from document`);

    // Add each extracted memory to the database using the same formatting logic as /add
    const addedMemories = [];
    for (const memoryContent of extractedData.memories) {
      try {
        // Use AI to format each memory with proper metadata
        const formatPrompt = `You are a memory assistant for Brandon Hinrichs. Format this memory and extract metadata.

Guidelines for formatting:
- Convert to third person if needed
- Be concise but include important details
- Use proper grammar and punctuation
- Keep it to 1-2 sentences maximum

Guidelines for categorization:
- category: Choose ONE from: biographical, preference, schedule, contact, work, personal, health, finance, hobby, goal, relationship, skill, general
- memory_type: Choose ONE from: fact, routine, habit, preference, relationship, event, goal, skill, contact_info, schedule, note
- importance_level: Choose ONE from: low, medium, high, critical
- tags: Extract 2-5 relevant searchable keywords (lowercase, single words or short phrases)
- related_entities: List any people, places, companies, or organizations mentioned

Return ONLY valid JSON in this exact format:
{
  "content": "formatted memory here",
  "category": "category_name",
  "memory_type": "type_name",
  "importance_level": "level",
  "tags": ["tag1", "tag2", "tag3"],
  "related_entities": ["entity1", "entity2"],
  "context": "any additional helpful context or notes"
}`;

        const formattedResponse = await callOpenAI(formatPrompt, memoryContent);
        const cleanedResponse = formattedResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const memoryData = JSON.parse(cleanedResponse);

        // Save to Supabase
        const { data, error } = await supabase
          .from('memories')
          .insert([{
            content: memoryData.content,
            raw_input: memoryContent,
            category: memoryData.category || 'general',
            memory_type: memoryData.memory_type || 'fact',
            tags: memoryData.tags || [],
            importance_level: memoryData.importance_level || 'medium',
            related_entities: memoryData.related_entities || [],
            context: memoryData.context || null
          }])
          .select();

        if (!error && data) {
          addedMemories.push(data[0]);
        }
      } catch (error) {
        console.error('Error adding memory:', error);
        // Continue with other memories even if one fails
      }
    }

    res.json({
      success: true,
      filename: uploadedFile.originalFilename,
      memoriesExtracted: extractedData.memories.length,
      memoriesAdded: addedMemories.length,
      memories: addedMemories,
      message: `Successfully extracted and stored ${addedMemories.length} memories from ${uploadedFile.originalFilename}`,
    });
  } catch (error) {
    console.error('❌ Document parsing error:', error);

    res.status(500).json({
      error: error.message || 'Document parsing failed',
    });
  }
});

export default router;
