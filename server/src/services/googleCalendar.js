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
 * Get credentials from either environment variables or file
 */
function getCredentials() {
  // Check for environment variables first (for production deployment)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/calendar/oauth-callback`
    };
  }

  // Fall back to credentials.json file (for local development)
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'Google Calendar credentials not configured. ' +
      'Either set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables, ' +
      'or create credentials.json file.'
    );
  }

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
  const { client_id, client_secret, redirect_uri } = getCredentials();

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  // Check for token from environment variable first (for production)
  if (process.env.GOOGLE_TOKEN) {
    try {
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      console.log('✅ Successfully parsed GOOGLE_TOKEN from environment');
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } catch (error) {
      console.error('❌ Failed to parse GOOGLE_TOKEN from environment:', error);
      throw new Error('Invalid GOOGLE_TOKEN format in environment variables');
    }
  }

  // Check if we have a token file (for local development)
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Need to get a new token
  throw new Error(
    'No token found. Please run the authorization flow first. ' +
    'You can do this by making a calendar request - the app will guide you through authorization.'
  );
}

/**
 * Get authorization URL for first-time setup
 */
export function getAuthUrl() {
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
  const { client_id, client_secret, redirect_uri } = getCredentials();

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  return oAuth2Client.getToken(code).then(({ tokens }) => {
    oAuth2Client.setCredentials(tokens);

    // Save to file if possible (local development)
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    } catch (error) {
      console.warn('Unable to write token.json file (may be in production):', error.message);
    }

    // Log token so it can be added to environment variables
    console.log('\n🔑 IMPORTANT: Save this token as GOOGLE_TOKEN environment variable:');
    console.log(JSON.stringify(tokens));
    console.log('\n');

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
    console.log('📅 Starting calendar event creation...');
    console.log('📋 Event data:', JSON.stringify(eventData, null, 2));

    const auth = await authorize();
    console.log('✅ Authorization successful');

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

    console.log('🔄 Calling Google Calendar API...');
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    console.log('✅ Event created successfully!');
    console.log('🔗 Event link:', response.data.htmlLink);

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      message: 'Event created successfully!',
    };
  } catch (error) {
    console.error('Google Calendar API Error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);

    // Check if it's an authorization error
    if (error.message.includes('No token') ||
        error.message.includes('not found') ||
        error.message.includes('authorization') ||
        error.code === 401 ||
        error.code === 403) {
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
  // Check for environment variable token
  if (process.env.GOOGLE_TOKEN && (process.env.GOOGLE_CLIENT_ID || fs.existsSync(CREDENTIALS_PATH))) {
    return true;
  }

  // Check for file-based credentials (local development)
  return fs.existsSync(TOKEN_PATH) && (fs.existsSync(CREDENTIALS_PATH) || process.env.GOOGLE_CLIENT_ID);
}
