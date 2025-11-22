import { callOpenAIForJSON } from '../services/openai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const systemPrompt = `You are an email writing assistant for Brandon Hinrichs. Based on the user's description, generate a complete, well-formatted email with a personal, genuine touch.

Return your response as a JSON object with this exact format:
{
  "type": "email",
  "to": "recipient email or name if mentioned, empty string if unknown",
  "subject": "appropriate subject line",
  "body": "complete email body with greeting, content, and closing"
}

IMPORTANT EMAIL STYLE GUIDELINES:
- Start with "Hi, [Name]." (NOT "Dear [Name]" or "I hope this finds you well")
- Keep the tone friendly yet professional - conversational but polished
- Be genuine and engaging - avoid clichés and generic phrases
- Fix all grammar, spelling, and punctuation errors
- Expand on any points that need further explanation or context
- Use natural, warm language that feels personal
- End with "Thanks," on one line, then "Brandon Hinrichs" on the next line
- Use proper paragraph breaks for readability

Example format:
Hi, [Name].

[Opening that's genuine and relevant to the context]

[Body paragraphs with clear explanations and details]

Thanks,
Brandon Hinrichs`;

    const emailData = await callOpenAIForJSON(systemPrompt, prompt);

    res.status(200).json(emailData);
  } catch (error) {
    console.error('Error in /api/ai/email:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
