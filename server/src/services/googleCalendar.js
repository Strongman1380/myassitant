import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to credentials
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Get credentials from either web or installed format
 */
function getCredentials() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

  // Support both 'web' and 'installed' credential formats
  const credData = credentials.web || credentials.installed;

  if (!credData) {
    throw new Error('Invalid credentials.json format. Expected "web" or "installed" property.');
  }

  // For web credentials, use localhost redirect URI
  const redirect_uri = credData.redirect_uris
    ? credData.redirect_uris[0]
    : 'http://localhost:3001/api/calendar/oauth-callback';

  return {
    client_id: credData.client_id,
    client_secret: credData.client_secret,
    redirect_uri
  };
}

/**
 * Load or create OAuth2 client
 */
async function authorize() {
  // Check if credentials exist
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'credentials.json not found! Please follow GOOGLE_CALENDAR_SETUP.md to set up Google Calendar API.'
    );
  }

  const { client_id, client_secret, redirect_uri } = getCredentials();

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  // Check if we have a token already
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Need to get a new token
  throw new Error(
    'No token.json found. Please run the authorization flow first. ' +
    'You can do this by making a calendar request - the app will guide you through authorization.'
  );
}

/**
 * Get authorization URL for first-time setup
 */
export function getAuthUrl() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('credentials.json not found!');
  }

  const { client_id, client_secret, redirect_uri } = getCredentials();

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to ensure we get refresh token
  });

  return authUrl;
}

/**
 * Save token after authorization
 */
export function saveToken(code) {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('credentials.json not found!');
  }

  const { client_id, client_secret, redirect_uri } = getCredentials();

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  return oAuth2Client.getToken(code).then(({ tokens }) => {
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    return oAuth2Client;
  });
}

/**
 * Create a calendar event
 * @param {Object} eventData - Event details
 * @param {string} eventData.title - Event title
 * @param {string} eventData.start - Start datetime (ISO-8601)
 * @param {string} eventData.end - End datetime (ISO-8601)
 * @param {string} eventData.notes - Event description/notes
 * @param {number} eventData.reminderMinutes - Reminder minutes before event
 */
export async function createCalendarEvent(eventData) {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.title,
      description: eventData.notes || '',
      start: {
        dateTime: eventData.start,
        timeZone: 'America/Chicago', // Adjust to your timezone
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'America/Chicago', // Adjust to your timezone
      },
    };

    // Add reminder if specified
    if (eventData.reminderMinutes) {
      event.reminders = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: eventData.reminderMinutes },
        ],
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      message: 'Event created successfully!',
    };
  } catch (error) {
    console.error('Google Calendar API Error:', error);

    // Check if it's an authorization error
    if (error.message.includes('No token.json found')) {
      return {
        success: false,
        needsAuth: true,
        authUrl: getAuthUrl(),
        message: 'Authorization required. Please visit the auth URL to grant calendar access.',
      };
    }

    throw new Error('Failed to create calendar event: ' + error.message);
  }
}

/**
 * Check if Google Calendar is authorized
 */
export function isAuthorized() {
  return fs.existsSync(TOKEN_PATH) && fs.existsSync(CREDENTIALS_PATH);
}
