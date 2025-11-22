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

    res.status(200).json(calendarData);
  } catch (error) {
    console.error('Error in /api/ai/calendar:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
