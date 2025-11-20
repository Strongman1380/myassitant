import express from 'express';
import { callOpenAI, callOpenAIForJSON } from '../services/openai.js';

const router = express.Router();

// POST /api/ai/text
// Body: { message: string }
router.post('/text', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const systemPrompt = `You are a professional text message assistant. Your job is to rewrite the user's message in a casual but professional tone while fixing any grammar, spelling, or punctuation errors. The message should sound natural and friendly, but still maintain a professional quality. Return ONLY the rewritten message with no explanations, quotes, or additional text.`;

    const rewrittenMessage = await callOpenAI(systemPrompt, message);

    res.json({
      success: true,
      original: message,
      rewritten: rewrittenMessage.trim()
    });
  } catch (error) {
    console.error('Error in /api/ai/text:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/email
// Body: { prompt: string }
router.post('/email', async (req, res) => {
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

    res.json(emailData);
  } catch (error) {
    console.error('Error in /api/ai/email:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/calendar
// Body: { prompt: string }
router.post('/calendar', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const systemPrompt = `You are a calendar event parser for a user in Central Time (America/Chicago timezone). Parse the user's natural language description into a structured calendar event.

Return your response as a JSON object with this exact format:
{
  "type": "calendar",
  "title": "brief event title",
  "notes": "additional details or null",
  "start": "ISO-8601 datetime string in Central Time",
  "end": "ISO-8601 datetime string in Central Time",
  "reminderMinutesBefore": number or null
}

Important:
- Use ISO-8601 format for dates WITHOUT the Z (e.g., "2025-11-21T13:00:00" NOT "2025-11-21T13:00:00.000Z")
- The times should be in Central Time (America/Chicago), NOT UTC
- Today's date in Central Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
- Calculate dates relative to today
- When user says "3pm" they mean 3pm Central Time, so use "2025-11-21T15:00:00" (not UTC)
- If no end time specified, default to 1 hour after start
- If no reminder specified, set to null
- If you cannot parse the event, return: {"error": "Could not parse event"}`;

    const calendarData = await callOpenAIForJSON(systemPrompt, prompt);

    if (calendarData.error) {
      return res.status(400).json(calendarData);
    }

    res.json(calendarData);
  } catch (error) {
    console.error('Error in /api/ai/calendar:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
