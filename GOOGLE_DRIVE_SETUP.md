# Google Drive Integration Setup

This project now includes a dedicated Google Drive connector under `/api/drive/*`. Follow these steps to grant the app read-only access to your Drive files:

1. **Enable the Google Drive API**
   - Visit the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard).
   - Create or select the project you already use for this assistant.
   - Enable the **Google Drive API**.

2. **Create OAuth credentials**
   - In the credentials screen, add a **Web application** credential.
   - Add the redirect URI you use locally (`http://localhost:3001/api/drive/oauth-callback`) and your deployed origin as a redirect as well (e.g., `https://your-app-domain/api/drive/oauth-callback`).
   - Download the JSON file and either:
     - Save it as `drive-credentials.json` at the repo root (next to `server/`), or
     - Set the environment variables `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, and optionally `GOOGLE_DRIVE_REDIRECT_URI`.

3. **Authorize the app**
   - Start the backend (`npm run dev` inside `server`) and the client (`npm run dev` inside `client`).
   - Visit `http://localhost:3000` (or your deployed app).
   - Navigate to the memory assistant and click **Connect Drive** (opens the authorization consent screen). If you don't see the consent screen, open `/api/drive/auth-status` manually.
   - Complete the consent to have Google redirect to `/api/drive/oauth-callback` which stores `drive-token.json`.
   - For production, copy the printed JSON token and set it via `GOOGLE_DRIVE_TOKEN` (the console logs show the payload after authorization).

4. **Using the Drive integration**
   - The Drive panel in the memory assistant now shows connection status, file listings, and previews.
   - After authorization, click **Load Files** to fetch the first batch. Click any file to load its text output.
   - You can use those contents as a prompt for memory capture or other assistants in the app.

5. **Security notes**
   - The Drive token is read-only and scoped to `https://www.googleapis.com/auth/drive.readonly`.
   - Tokens are cached locally in `drive-token.json`; treat that file like a secret.
   - On deployment, persist the same token via the `GOOGLE_DRIVE_TOKEN` env var instead of relying on files.
