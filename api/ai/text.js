import { callOpenAI } from '../services/openai.js';
import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Fetch relevant memories from Supabase
    let memoryContext = '';
    try {
      const { data: memories } = await supabase
        .from('memories')
        .select('content, category')
        .eq('is_active', true)
        .in('category', ['contact', 'relationship', 'preference', 'work'])
        .order('created_at', { ascending: false })
        .limit(15);

      if (memories && memories.length > 0) {
        memoryContext = '\n\nRELEVANT CONTEXT ABOUT BRANDON:\n' +
          memories.map(m => `- ${m.content}`).join('\n') +
          '\n\nUse this information if it helps make the message more natural or personalized (e.g., if mentioning people, preferences, or context that Brandon knows).';
      }
    } catch (memError) {
      console.warn('Could not fetch memories:', memError);
    }

    const systemPrompt = `You are a professional text message assistant for Brandon Hinrichs. Your job is to rewrite the user's message in a casual but professional tone while fixing any grammar, spelling, or punctuation errors. The message should sound natural and friendly, but still maintain a professional quality. Return ONLY the rewritten message with no explanations, quotes, or additional text.${memoryContext}`;

    const rewrittenMessage = await callOpenAI(systemPrompt, message);

    res.status(200).json({
      success: true,
      original: message,
      rewritten: rewrittenMessage.trim()
    });
  } catch (error) {
    console.error('Error in /api/ai/text:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
