import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

function getCredentials() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return {
      client_id: process.env.GOOGLE_CLIENT_ID.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET.trim(),
      redirect_uri: (process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/calendar/oauth-callback`).trim()
    };
  }

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('Google credentials not configured.');
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const credData = credentials.web || credentials.installed;
  if (!credData) throw new Error('Invalid credentials.json format.');

  const redirect_uri = credData.redirect_uris
    ? credData.redirect_uris[0]
    : 'http://localhost:3001/api/calendar/oauth-callback';

  return {
    client_id: credData.client_id,
    client_secret: credData.client_secret,
    redirect_uri
  };
}

async function authorize() {
  const { client_id, client_secret, redirect_uri } = getCredentials();
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  if (process.env.GOOGLE_TOKEN) {
    const token = JSON.parse(process.env.GOOGLE_TOKEN);
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  throw new Error('No Google token found. Please re-authorize with Drive permissions via /api/calendar/get-auth-url');
}

/**
 * List files from Google Drive
 * @param {Object} options
 * @param {string} options.query - Search query (Google Drive query syntax)
 * @param {string} options.folderId - Specific folder ID to list
 * @param {number} options.pageSize - Number of results (default 20)
 * @param {string} options.pageToken - For pagination
 * @param {string} options.mimeType - Filter by MIME type
 */
export async function listFiles({ query, folderId, pageSize = 20, pageToken, mimeType } = {}) {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  let q = 'trashed = false';
  if (folderId) q += ` and '${folderId}' in parents`;
  if (mimeType) q += ` and mimeType = '${mimeType}'`;
  if (query) q += ` and (name contains '${query}' or fullText contains '${query}')`;

  const response = await drive.files.list({
    q,
    pageSize,
    pageToken,
    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webViewLink)',
    orderBy: 'modifiedTime desc'
  });

  return {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken
  };
}

/**
 * Read the content of a file from Google Drive
 * Supports Google Docs, Sheets, Slides (exported as text), and plain files
 */
export async function readFileContent(fileId) {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Get file metadata first
  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime'
  });

  const { mimeType, name } = meta.data;
  let content = '';

  // Google Workspace files need to be exported
  const exportMap = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
  };

  if (exportMap[mimeType]) {
    const res = await drive.files.export({
      fileId,
      mimeType: exportMap[mimeType]
    }, { responseType: 'text' });
    content = res.data;
  } else if (mimeType === 'application/pdf') {
    // For PDFs, export as text if it's a Google Doc, otherwise note it's a PDF
    content = `[PDF file: ${name} - PDF content extraction requires additional processing]`;
  } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const res = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'text' });
    content = res.data;
  } else {
    content = `[Binary file: ${name} (${mimeType}) - cannot extract text content]`;
  }

  return {
    id: meta.data.id,
    name,
    mimeType,
    modifiedTime: meta.data.modifiedTime,
    content
  };
}

/**
 * List folders in Drive (useful for browsing)
 */
export async function listFolders(parentId) {
  return listFiles({
    folderId: parentId,
    mimeType: 'application/vnd.google-apps.folder',
    pageSize: 50
  });
}

/**
 * Check if Drive access is authorized (token exists with drive scope)
 */
export function isDriveAuthorized() {
  if (process.env.GOOGLE_TOKEN && (process.env.GOOGLE_CLIENT_ID || fs.existsSync(CREDENTIALS_PATH))) {
    try {
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      if (token.scope && token.scope.includes('drive')) return true;
      // If scope isn't stored in token, assume it might work
      return true;
    } catch { return false; }
  }
  return fs.existsSync(TOKEN_PATH) && (fs.existsSync(CREDENTIALS_PATH) || process.env.GOOGLE_CLIENT_ID);
}
