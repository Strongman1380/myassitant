import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { config } from '../config/env.js';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: config.microsoftClientId,
    authority: `https://login.microsoftonline.com/${config.microsoftTenantId}`,
    clientSecret: config.microsoftClientSecret,
  },
};

let accessToken = null;
let tokenExpiry = null;

// Create MSAL client
const msalClient = new ConfidentialClientApplication(msalConfig);

/**
 * Get access token for Microsoft Graph API
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const tokenRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await msalClient.acquireTokenByClientCredential(tokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    accessToken = response.accessToken;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (response.expiresIn * 1000) - (5 * 60 * 1000);

    return accessToken;
  } catch (error) {
    console.error('Error acquiring access token:', error);
    throw new Error('Failed to authenticate with Microsoft Graph API');
  }
}

/**
 * Create a Microsoft Graph client
 */
async function getGraphClient() {
  const token = await getAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, token);
    },
  });
}

/**
 * Check if Outlook Calendar is configured
 */
export function isOutlookConfigured() {
  return !!(
    config.microsoftClientId &&
    config.microsoftTenantId &&
    config.microsoftClientSecret
  );
}

/**
 * Create a calendar event in Outlook
 */
export async function createOutlookEvent({ title, start, end, notes, reminderMinutes }) {
  try {
    if (!isOutlookConfigured()) {
      throw new Error('Outlook Calendar is not configured. Please set MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, and MICROSOFT_CLIENT_SECRET environment variables.');
    }

    // Get the user email/ID from config (required for application permissions)
    const userEmail = config.microsoftUserEmail;
    if (!userEmail) {
      throw new Error('MICROSOFT_USER_EMAIL environment variable is required to create calendar events.');
    }

    const client = await getGraphClient();

    // Build the event object
    const event = {
      subject: title,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'UTC',
      },
    };

    // Add body/notes if provided
    if (notes) {
      event.body = {
        contentType: 'text',
        content: notes,
      };
    }

    // Add reminder if specified
    if (reminderMinutes) {
      event.isReminderOn = true;
      event.reminderMinutesBeforeStart = reminderMinutes;
    }

    // Create the event in the specified user's calendar
    // Using /users/{email}/events instead of /me/events for application permissions
    const result = await client
      .api(`/users/${userEmail}/events`)
      .post(event);

    console.log('✅ Outlook event created:', result.id);

    return {
      success: true,
      eventId: result.id,
      webLink: result.webLink,
      message: 'Event successfully added to Outlook Calendar',
    };
  } catch (error) {
    console.error('❌ Error creating Outlook event:', error);

    if (error.statusCode === 401) {
      throw new Error('Outlook Calendar authentication failed. Please check your Microsoft credentials.');
    }

    throw new Error(error.message || 'Failed to create Outlook calendar event');
  }
}

/**
 * Get authorization URL for Outlook Calendar (for user-delegated auth)
 * Note: This is for future enhancement if you want user-specific calendars
 */
export function getOutlookAuthUrl() {
  if (!isOutlookConfigured()) {
    throw new Error('Outlook Calendar is not configured');
  }

  const redirectUri = `${config.apiUrl || 'http://localhost:3001'}/api/calendar/outlook-callback`;

  return `https://login.microsoftonline.com/${config.microsoftTenantId}/oauth2/v2.0/authorize?` +
    `client_id=${config.microsoftClientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_mode=query` +
    `&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite offline_access')}`;
}
