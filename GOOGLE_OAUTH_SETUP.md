# Google Calendar OAuth Setup - Final Step

Your credentials have been configured! Now you need to add the redirect URI to your Google Cloud Console.

## Add Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **my-ai-assistant-478813**
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, click **+ ADD URI**
6. Add this exact URI:
   ```
   http://localhost:3001/api/calendar/oauth-callback
   ```
7. Click **SAVE**

## Test the Integration

1. Make sure both servers are running:
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:3000`

2. In the app, click on **Calendar Assistant**

3. Describe a calendar event (via voice or text), like:
   ```
   "Meeting with John tomorrow at 2pm for 1 hour to discuss the project proposal"
   ```

4. Click **Generate Event**

5. Click **Add to Google Calendar**

6. You'll be redirected to Google's authorization page - click **Allow**

7. After authorization, you'll be redirected back and the event will be created!

## How It Works

- **First time**: You'll need to authorize the app to access your Google Calendar
- **After authorization**: Events are created automatically without needing to re-authorize
- **Token storage**: Your OAuth token is saved in `server/token.json` (gitignored for security)

## Troubleshooting

If you get an error about redirect URI mismatch:
- Double-check that you added the exact URI: `http://localhost:3001/api/calendar/oauth-callback`
- Make sure there are no extra spaces or typos
- Wait a few seconds after saving in Google Cloud Console for changes to propagate

If authorization fails:
- Check that your `credentials.json` file exists in `/server`
- Make sure the server is running on port 3001
- Check server logs for any error messages
