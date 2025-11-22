import { createCalendarEvent } from '../services/googleCalendar.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, start, end, notes, reminderMinutes } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: title, start, end' });
    }

    const result = await createCalendarEvent({
      title,
      start,
      end,
      notes,
      reminderMinutes,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/calendar/create:', error);
    res.status(500).json({ error: error.message || 'Failed to create calendar event' });
  }
}
