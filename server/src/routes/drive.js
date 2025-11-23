import express from 'express';
import {
  getDriveAuthUrl,
  isDriveAuthorized,
  saveDriveToken,
  listDriveFiles,
  downloadDriveFile
} from '../services/googleDrive.js';

const router = express.Router();

router.get('/auth-status', (req, res) => {
  try {
    if (isDriveAuthorized()) {
      return res.json({ authorized: true });
    }

    const authUrl = getDriveAuthUrl();
    res.json({
      authorized: false,
      authUrl,
      message: 'Authorize Google Drive to allow file access.'
    });
  } catch (error) {
    console.error('Error in /api/drive/auth-status:', error);
    res.status(500).json({ error: error.message || 'Unable to determine authorization status' });
  }
});

router.get('/auth-url', (req, res) => {
  try {
    const authUrl = getDriveAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error in /api/drive/auth-url:', error);
    res.status(500).json({ error: error.message || 'Unable to build auth URL' });
  }
});

router.get('/oauth-callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #dc3545;">❌ Missing authorization code</h1>
            <p>Please try authorizing again.</p>
            <a href="http://localhost:3000" style="color: #007bff;">Return to App</a>
          </body>
        </html>
      `);
    }

    await saveDriveToken(code);

    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #28a745;">✅ Google Drive Connected!</h1>
          <p>You can now close this window and return to the app.</p>
          <a href="http://localhost:3000" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">Return to App</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in /api/drive/oauth-callback:', error);
    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #dc3545;">❌ Drive authorization failed</h1>
          <p>${error.message}</p>
          <a href="http://localhost:3000" style="color: #007bff;">Return to App</a>
        </body>
      </html>
    `);
  }
});

router.get('/files', async (req, res) => {
  try {
    if (!isDriveAuthorized()) {
      return res.status(401).json({ error: 'Google Drive is not authorized yet' });
    }

    const files = await listDriveFiles();
    res.json({ files });
  } catch (error) {
    console.error('Error in /api/drive/files:', error);
    res.status(500).json({ error: error.message || 'Failed to list Google Drive files' });
  }
});

router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDriveAuthorized()) {
      return res.status(401).json({ error: 'Google Drive is not authorized yet' });
    }

    const result = await downloadDriveFile(id);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/drive/files/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to download file' });
  }
});

export default router;
