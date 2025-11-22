import { callOpenAI } from '../services/openai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const systemPrompt = `You are a professional text message assistant. Your job is to rewrite the user's message in a casual but professional tone while fixing any grammar, spelling, or punctuation errors. The message should sound natural and friendly, but still maintain a professional quality. Return ONLY the rewritten message with no explanations, quotes, or additional text.`;

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
