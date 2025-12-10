import express from 'express';
import { createCalendarEvent, isAuthorized, getAuthUrl, saveToken } from '../services/googleCalendar.js';

const router = express.Router();

// GET /api/calendar/debug
// Debug endpoint to check configuration
router.get('/debug', (req, res) => {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasToken = !!process.env.GOOGLE_TOKEN;
  const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

  let tokenInfo = null;
  if (process.env.GOOGLE_TOKEN) {
    try {
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      tokenInfo = {
        hasAccessToken: !!token.access_token,
        hasRefreshToken: !!token.refresh_token,
        tokenType: token.token_type,
        expiryDate: token.expiry_date ? new Date(token.expiry_date).toISOString() : 'not set',
        scope: token.scope,
      };
    } catch (e) {
      tokenInfo = { error: 'Failed to parse token: ' + e.message };
    }
  }

  res.json({
    credentials: {
      hasClientId,
      hasClientSecret,
      hasRedirectUri,
      hasToken,
    },
    tokenInfo,
    authorized: isAuthorized(),
  });
});

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

// GET /api/calendar/reauthorize
// Get auth URL to re-authorize (even if already authorized)
router.get('/reauthorize', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: 'Failed to generate authorization URL',
    });
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

    const { tokens } = await saveToken(code);
    const tokenJson = JSON.stringify(tokens);

    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #28a745; text-align: center;">✅ Authorization Successful!</h1>
          <p style="text-align: center;">Your Google Calendar is now connected.</p>

          <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🔑 Update GOOGLE_TOKEN in Vercel:</h3>
            <p>Copy the token below and update your <code>GOOGLE_TOKEN</code> environment variable in Vercel:</p>
            <textarea id="token" readonly style="width: 100%; height: 150px; font-family: monospace; font-size: 12px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">${tokenJson}</textarea>
            <button onclick="navigator.clipboard.writeText(document.getElementById('token').value); this.textContent='Copied!'" style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Copy Token
            </button>
          </div>

          <div style="text-align: center;">
            <a href="https://vercel.com/strongman1380s-projects/assistant-app/settings/environment-variables" target="_blank" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px;">
              Go to Vercel Environment Variables
            </a>
          </div>
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
