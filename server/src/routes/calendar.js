import express from 'express';
import { createCalendarEvent, isAuthorized, getAuthUrl, saveToken } from '../services/googleCalendar.js';

const router = express.Router();

// POST /api/calendar/create
// Body: { title, start, end, notes, reminderMinutes }
router.post('/create', async (req, res) => {
  try {
    const { title, start, end, notes, reminderMinutes } = req.body;

    console.log('📅 Calendar event creation request:', {
      title,
      start,
      end,
      notes,
      reminderMinutes,
    });

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

    console.log('✅ Calendar event created successfully:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/calendar/create:', error);
    res.status(500).json({ error: error.message || 'Failed to create calendar event' });
  }
});

// GET /api/calendar/auth-status
// Check if Google Calendar is authorized
router.get('/auth-status', (req, res) => {
  const authorized = isAuthorized();

  if (authorized) {
    res.json({ authorized: true });
  } else {
    try {
      const authUrl = getAuthUrl();
      res.json({
        authorized: false,
        authUrl,
        message: 'Please visit the auth URL to grant calendar access',
      });
    } catch (error) {
      res.json({
        authorized: false,
        error: error.message,
        message: 'Please set up credentials.json first. See GOOGLE_CALENDAR_SETUP.md',
      });
    }
  }
});

// GET /api/calendar/oauth-callback
// Handle OAuth redirect from Google
router.get('/oauth-callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #dc3545;">❌ Authorization Failed</h1>
            <p>Missing authorization code. Please try again.</p>
            <a href="http://localhost:3000" style="color: #007bff;">Return to App</a>
          </body>
        </html>
      `);
    }

    await saveToken(code);

    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #28a745;">✅ Authorization Successful!</h1>
          <p>You can now close this window and return to the app.</p>
          <p>Your Google Calendar is now connected.</p>
          <a href="http://localhost:3000" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">Return to App</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in /api/calendar/oauth-callback:', error);
    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #dc3545;">❌ Authorization Failed</h1>
          <p>${error.message}</p>
          <a href="http://localhost:3000" style="color: #007bff;">Return to App</a>
        </body>
      </html>
    `);
  }
});

// POST /api/calendar/auth-callback
// Save OAuth token after user authorizes
// Body: { code }
router.post('/auth-callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    await saveToken(code);

    res.json({
      success: true,
      message: 'Authorization successful! You can now create calendar events.',
    });
  } catch (error) {
    console.error('Error in /api/calendar/auth-callback:', error);
    res.status(500).json({ error: error.message || 'Failed to save authorization' });
  }
});

export default router;
