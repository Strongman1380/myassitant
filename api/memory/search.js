import { callOpenAIForJSON } from '../services/openai.js';
import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    // First, fetch all active memories
    const { data: allMemories, error: fetchError } = await supabase
      .from('memories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error('Failed to fetch memories from database');
    }

    if (!allMemories || allMemories.length === 0) {
      return res.status(200).json({
        type: 'memory_search',
        query,
        results: [],
        count: 0,
        message: 'No memories found in database'
      });
    }

    // Use AI to analyze the query and identify relevant memories
    const systemPrompt = `You are a memory search assistant for Brandon Hinrichs. The user will provide a natural language search query, and you need to identify which memories are relevant to that query.

Here are all of Brandon's memories:

${allMemories.map((m, idx) => `[${idx}] ${m.content} (Category: ${m.category}, Tags: ${m.tags?.join(', ') || 'none'})`).join('\n')}

Analyze the user's query and return the indices of the most relevant memories. Consider:
- Direct keyword matches
- Semantic similarity (related concepts)
- Category relevance
- Tag matches
- Related entities

Return ONLY a JSON object with this format:
{
  "relevantIndices": [0, 3, 7],
  "explanation": "Brief explanation of why these memories match the query"
}

If no memories are relevant, return:
{
  "relevantIndices": [],
  "explanation": "No memories found matching this query"
}`;

    const searchResult = await callOpenAIForJSON(systemPrompt, query);

    // Extract the relevant memories based on AI's analysis
    const relevantMemories = searchResult.relevantIndices
      .map(idx => allMemories[idx])
      .filter(m => m !== undefined);

    res.status(200).json({
      type: 'memory_search',
      query,
      results: relevantMemories,
      count: relevantMemories.length,
      explanation: searchResult.explanation
    });
  } catch (error) {
    console.error('Error in /api/memory/search:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
