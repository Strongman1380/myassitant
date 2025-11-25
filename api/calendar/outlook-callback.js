import { saveToken } from '../services/outlookCalendar.js';

export default async function handler(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #dc3545;">❌ Authorization Failed</h1>
            <p>Missing authorization code. Please try again.</p>
            <a href="/" style="color: #007bff;">Return to App</a>
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
          <p>Your Microsoft Outlook Calendar is now connected.</p>
          <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">Return to App</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in /api/calendar/outlook-callback:', error);
    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #dc3545;">❌ Authorization Failed</h1>
          <p>${error.message}</p>
          <a href="/" style="color: #007bff;">Return to App</a>
        </body>
      </html>
    `);
  }
}
