import { createCalendarEvent as createGoogleEvent } from '../services/googleCalendar.js';
import { createCalendarEvent as createOutlookEvent } from '../services/outlookCalendar.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, start, end, notes, reminderMinutes, provider = 'google' } = req.body;

    console.log('📅 Creating calendar event...');
    console.log('Provider:', provider);
    console.log('Environment check:', {
      google: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasToken: !!process.env.GOOGLE_TOKEN,
      },
      outlook: {
        hasClientId: !!process.env.MICROSOFT_CLIENT_ID,
        hasClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
        hasToken: !!process.env.MICROSOFT_TOKEN,
      }
    });

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: title, start, end' });
    }

    // Validate provider
    if (provider !== 'google' && provider !== 'outlook') {
      return res.status(400).json({ error: 'Invalid provider. Must be "google" or "outlook"' });
    }

    // Route to appropriate calendar service
    const createCalendarEvent = provider === 'outlook' ? createOutlookEvent : createGoogleEvent;

    const result = await createCalendarEvent({
      title,
      start,
      end,
      notes,
      reminderMinutes,
    });

    console.log(`✅ Calendar event created successfully in ${provider}`);
    res.status(200).json({ ...result, provider });
  } catch (error) {
    console.error('❌ Error in /api/calendar/create:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to create calendar event' });
  }
}
