import { createCalendarEvent } from '../services/googleCalendar.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📅 Creating calendar event...');
    console.log('Environment check:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasToken: !!process.env.GOOGLE_TOKEN,
      hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI
    });

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

    console.log('✅ Calendar event created successfully');
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in /api/calendar/create:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to create calendar event' });
  }
}
