import { isDriveAuthorized } from '../services/googleDrive.js';
import { getAuthUrl } from '../services/googleCalendar.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authorized = isDriveAuthorized();

  if (authorized) {
    res.status(200).json({ authorized: true });
  } else {
    try {
      const authUrl = getAuthUrl();
      res.status(200).json({
        authorized: false,
        authUrl,
        message: 'Please re-authorize to grant Google Drive access'
      });
    } catch (error) {
      res.status(200).json({
        authorized: false,
        error: error.message,
        message: 'Please set up Google credentials first'
      });
    }
  }
}
