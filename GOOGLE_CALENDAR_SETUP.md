# Google Calendar API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "AI Assistant" → Click "Create"
4. Wait for project creation (you'll see a notification)

## Step 2: Enable Google Calendar API

1. In the search bar, type "Calendar API"
2. Click on "Google Calendar API"
3. Click "Enable"
4. Wait for it to enable

## Step 3: Create OAuth Credentials

1. Click "Credentials" in the left sidebar
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted to configure consent screen:
   - Click "Configure Consent Screen"
   - Select "External" → Click "Create"
   - Fill in:
     - App name: "AI Assistant"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Click "Save and Continue" (skip scopes for now)
   - Click "Save and Continue" (skip test users for now)
   - Click "Back to Dashboard"

4. Go back to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Desktop app"
6. Name: "AI Assistant Desktop"
7. Click "Create"
8. **IMPORTANT:** Download the JSON file (click "Download JSON")
9. Save it as `credentials.json` in your `server/` folder

## Step 4: Add Required Scopes

1. Go back to "OAuth consent screen"
2. Click "Edit App"
3. Click "Add or Remove Scopes"
4. Find and add:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Click "Update" → "Save and Continue"

## Step 5: Configure Your App

The credentials.json file should look like this:
```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "ai-assistant-xxxxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

Place this file in `/server/credentials.json`

## Step 6: First Run Authorization

The first time you create a calendar event, the app will:
1. Open a browser window
2. Ask you to sign in to Google
3. Ask you to authorize calendar access
4. Save a `token.json` file for future use

After that, it will automatically add events to your calendar!

## Security Notes

- ✅ `credentials.json` and `token.json` are already in `.gitignore`
- ✅ These files stay on your local machine only
- ✅ This is your personal OAuth token - don't share it
- ✅ You can revoke access anytime from Google Account settings

## Troubleshooting

**"Access blocked" error?**
- Make sure you added yourself as a test user in OAuth consent screen
- Or publish the app (but it's not needed for personal use)

**Token expired?**
- Delete `token.json` and run again to re-authorize

**Calendar not showing events?**
- Check that the correct Google account is authorized
- Verify events are being created in "Events" view, not "Tasks"
