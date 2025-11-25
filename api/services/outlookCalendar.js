import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to tokens
const TOKEN_PATH = path.join(__dirname, '../../outlook-token.json');

// Required scopes for calendar access
const SCOPES = ['Calendars.ReadWrite', 'offline_access', 'User.Read'];

/**
 * Get Microsoft credentials from environment variables
 */
function getCredentials() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/calendar/outlook-callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Microsoft Outlook credentials not configured. ' +
      'Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET environment variables.'
    );
  }

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    tenantId: tenantId.trim(),
    redirectUri: redirectUri.trim(),
  };
}

/**
 * Create MSAL configuration
 */
function getMsalConfig() {
  const { clientId, clientSecret, tenantId, redirectUri } = getCredentials();

  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  };
}

/**
 * Create authenticated Microsoft Graph client
 */
async function getGraphClient() {
  const token = await getAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, token.accessToken);
    },
  });
}

/**
 * Get access token from storage or refresh if needed
 */
async function getAccessToken() {
  // Check for token from environment variable first (for production)
  if (process.env.MICROSOFT_TOKEN) {
    try {
      console.log('✅ Using Microsoft token from environment variables');
      const tokenData = JSON.parse(process.env.MICROSOFT_TOKEN);

      // Check if token is expired
      if (tokenData.expiresOn && new Date(tokenData.expiresOn) > new Date()) {
        return tokenData;
      }

      // Token expired, try to refresh
      if (tokenData.refreshToken) {
        return await refreshAccessToken(tokenData.refreshToken);
      }

      throw new Error('Token expired and no refresh token available');
    } catch (error) {
      console.error('❌ Failed to use MICROSOFT_TOKEN from environment:', error);
      throw error;
    }
  }

  // Check if we have a token file (for local development)
  if (fs.existsSync(TOKEN_PATH)) {
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    // Check if token is expired
    if (tokenData.expiresOn && new Date(tokenData.expiresOn) > new Date()) {
      return tokenData;
    }

    // Token expired, try to refresh
    if (tokenData.refreshToken) {
      return await refreshAccessToken(tokenData.refreshToken);
    }
  }

  throw new Error(
    'No Microsoft token found. Please run the authorization flow first.'
  );
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  const msalConfig = getMsalConfig();
  const cca = new ConfidentialClientApplication(msalConfig);

  const refreshTokenRequest = {
    refreshToken,
    scopes: SCOPES,
  };

  try {
    const response = await cca.acquireTokenByRefreshToken(refreshTokenRequest);

    const tokenData = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || refreshToken,
      expiresOn: response.expiresOn,
      account: response.account,
    };

    // Save refreshed token to file if possible
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      console.log('✅ Refreshed token saved to file');
    } catch (error) {
      console.warn('Unable to write outlook-token.json file (may be in production):', error.message);
    }

    return tokenData;
  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
    throw new Error('Failed to refresh Microsoft token. Please re-authorize.');
  }
}

/**
 * Get authorization URL for first-time setup
 */
export function getAuthUrl() {
  const { redirectUri } = getCredentials();
  const msalConfig = getMsalConfig();
  const cca = new ConfidentialClientApplication(msalConfig);

  const authCodeUrlParameters = {
    scopes: SCOPES,
    redirectUri,
    prompt: 'consent', // Force consent screen to ensure we get refresh token
  };

  return cca.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Save token after authorization
 */
export async function saveToken(code) {
  const { redirectUri } = getCredentials();
  const msalConfig = getMsalConfig();
  const cca = new ConfidentialClientApplication(msalConfig);

  const tokenRequest = {
    code,
    scopes: SCOPES,
    redirectUri,
  };

  try {
    const response = await cca.acquireTokenByCode(tokenRequest);

    const tokenData = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresOn: response.expiresOn,
      account: response.account,
    };

    // Save to file if possible (local development)
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      console.log('✅ Token saved to file');
    } catch (error) {
      console.warn('Unable to write outlook-token.json file (may be in production):', error.message);
    }

    // Log token so it can be added to environment variables
    console.log('\n🔑 IMPORTANT: Save this token as MICROSOFT_TOKEN environment variable:');
    console.log(JSON.stringify(tokenData));
    console.log('\n');

    return tokenData;
  } catch (error) {
    console.error('❌ Failed to acquire token:', error);
    throw new Error('Failed to exchange authorization code for token: ' + error.message);
  }
}

/**
 * Create a calendar event in Outlook
 * @param {Object} eventData - Event details
 * @param {string} eventData.title - Event title
 * @param {string} eventData.start - Start datetime (ISO-8601)
 * @param {string} eventData.end - End datetime (ISO-8601)
 * @param {string} eventData.notes - Event description/notes
 * @param {number} eventData.reminderMinutes - Reminder minutes before event
 */
export async function createCalendarEvent(eventData) {
  try {
    const graphClient = await getGraphClient();

    const event = {
      subject: eventData.title,
      start: {
        dateTime: eventData.start,
        timeZone: 'America/Chicago', // Adjust to your timezone
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'America/Chicago', // Adjust to your timezone
      },
    };

    // Add description if provided
    if (eventData.notes) {
      event.body = {
        contentType: 'Text',
        content: eventData.notes,
      };
    }

    // Add reminder if specified
    if (eventData.reminderMinutes) {
      event.isReminderOn = true;
      event.reminderMinutesBeforeStart = eventData.reminderMinutes;
    }

    const response = await graphClient
      .api('/me/calendar/events')
      .post(event);

    return {
      success: true,
      eventId: response.id,
      htmlLink: response.webLink,
      message: 'Event created successfully in Outlook Calendar!',
    };
  } catch (error) {
    console.error('Microsoft Graph API Error:', error);

    // Check if it's an authorization error
    if (error.statusCode === 401 || error.message.includes('token')) {
      return {
        success: false,
        needsAuth: true,
        authUrl: await getAuthUrl(),
        message: 'Authorization required. Please visit the auth URL to grant calendar access.',
      };
    }

    throw new Error('Failed to create Outlook calendar event: ' + error.message);
  }
}

/**
 * Check if Microsoft Outlook Calendar is authorized
 */
export function isAuthorized() {
  // Check for environment variable token
  if (process.env.MICROSOFT_TOKEN && process.env.MICROSOFT_CLIENT_ID) {
    return true;
  }

  // Check for file-based token (local development)
  return fs.existsSync(TOKEN_PATH) && process.env.MICROSOFT_CLIENT_ID;
}
