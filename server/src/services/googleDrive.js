import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DRIVE_CREDENTIALS_PATH = path.join(__dirname, '../../drive-credentials.json');
const DRIVE_TOKEN_PATH = path.join(__dirname, '../../drive-token.json');
const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

function getDriveCredentials() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET) {
    return {
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI || `${baseUrl}/api/drive/oauth-callback`
    };
  }

  if (!fs.existsSync(DRIVE_CREDENTIALS_PATH)) {
    throw new Error(
      'Google Drive credentials not configured. ' +
      'Either set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET environment variables, or create drive-credentials.json.'
    );
  }

  const credentials = JSON.parse(fs.readFileSync(DRIVE_CREDENTIALS_PATH, 'utf8'));
  const credData = credentials.web || credentials.installed;

  if (!credData) {
    throw new Error('Invalid drive-credentials.json format. Expected "web" or "installed" property.');
  }

  const redirect_uri = credData.redirect_uris
    ? credData.redirect_uris[0]
    : 'http://localhost:3001/api/drive/oauth-callback';

  return {
    client_id: credData.client_id,
    client_secret: credData.client_secret,
    redirect_uri
  };
}

async function authorizeDrive() {
  const { client_id, client_secret, redirect_uri } = getDriveCredentials();

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  if (process.env.GOOGLE_DRIVE_TOKEN) {
    try {
      const token = JSON.parse(process.env.GOOGLE_DRIVE_TOKEN);
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } catch (error) {
      console.warn('Unable to parse GOOGLE_DRIVE_TOKEN:', error.message);
    }
  }

  if (fs.existsSync(DRIVE_TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(DRIVE_TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  throw new Error(
    'No Drive token found. Please complete the OAuth flow.' +
    ' Visit /api/drive/auth-status to initiate authorization.'
  );
}

export function getDriveAuthUrl() {
  const { client_id, client_secret, redirect_uri } = getDriveCredentials();
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: DRIVE_SCOPES,
    prompt: 'consent'
  });
}

export async function saveDriveToken(code) {
  const { client_id, client_secret, redirect_uri } = getDriveCredentials();
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  try {
    fs.writeFileSync(DRIVE_TOKEN_PATH, JSON.stringify(tokens));
  } catch (error) {
    console.warn('Unable to write drive-token.json locally:', error.message);
  }

  console.log('\n🔑 Save this token manually as GOOGLE_DRIVE_TOKEN if you deploy:')
  console.log(JSON.stringify(tokens));
  console.log('\n');

  return oAuth2Client;
}

export function isDriveAuthorized() {
  if (process.env.GOOGLE_DRIVE_TOKEN) {
    return true;
  }

  return fs.existsSync(DRIVE_TOKEN_PATH);
}

export async function listDriveFiles({ pageSize = 20 } = {}) {
  const auth = await authorizeDrive();
  const drive = google.drive({ version: 'v3', auth });

  const { data } = await drive.files.list({
    pageSize,
    fields: 'files(id,name,mimeType,modifiedTime,size)'
  });

  return data.files || [];
}

export async function downloadDriveFile(fileId) {
  if (!fileId) {
    throw new Error('Missing file ID');
  }

  const auth = await authorizeDrive();
  const drive = google.drive({ version: 'v3', auth });
  const response = await drive.files.get({
    fileId,
    alt: 'media'
  }, {
    responseType: 'arraybuffer'
  });

  const buffer = Buffer.from(response.data);
  const content = buffer.toString('utf8');

  const metadata = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,modifiedTime,size'
  });

  return {
    file: metadata.data,
    content
  };
}
