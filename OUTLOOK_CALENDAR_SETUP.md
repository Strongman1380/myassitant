# Microsoft Outlook Calendar Setup Guide

## Overview

This guide will help you connect your Microsoft Outlook/Microsoft 365 calendar to the AI Assistant app.

## Prerequisites

- A Microsoft account (Outlook.com, Office 365, or Microsoft 365)
- Access to Azure Portal (free)
- Admin access to your Azure Active Directory (if using work account)

---

## Step 1: Create Azure App Registration

1. **Go to Azure Portal**
   - Navigate to [https://portal.azure.com/](https://portal.azure.com/)
   - Sign in with your Microsoft account

2. **Navigate to App Registrations**
   - In the left sidebar or search bar, find "Microsoft Entra ID" (formerly Azure Active Directory)
   - Click on "App registrations" in the left menu
   - Click "+ New registration" at the top

3. **Configure App Registration**
   - **Name**: `AI Assistant` (or any name you prefer)
   - **Supported account types**: Select one of the following:
     - **"Accounts in any organizational directory and personal Microsoft accounts"** (Recommended - works for both personal and work accounts)
     - **"Accounts in this organizational directory only"** (If only using work account)
     - **"Personal Microsoft accounts only"** (If only using personal Outlook.com)
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `http://localhost:3001/api/calendar/outlook-callback` (for local development)
   - Click **"Register"**

4. **Save Your Application (Client) ID**
   - After registration, you'll see the "Overview" page
   - **Copy** the **Application (client) ID** - you'll need this later
   - **Copy** the **Directory (tenant) ID** - you'll need this too

---

## Step 2: Create Client Secret

1. **Navigate to Certificates & Secrets**
   - In your app registration, click "Certificates & secrets" in the left menu
   - Click on the "Client secrets" tab

2. **Create New Secret**
   - Click "+ New client secret"
   - **Description**: `AI Assistant Secret` (or any description)
   - **Expires**: Choose an expiration period (6 months, 12 months, or 24 months recommended)
   - Click **"Add"**

3. **Copy the Secret Value**
   - ⚠️ **IMPORTANT**: Copy the **Value** immediately!
   - This is shown only once and cannot be retrieved later
   - If you lose it, you'll need to create a new secret

---

## Step 3: Configure API Permissions

1. **Navigate to API Permissions**
   - In your app registration, click "API permissions" in the left menu

2. **Add Required Permissions**
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Search for and add these permissions:
     - **`Calendars.ReadWrite`** - Read and write user calendars
     - **`offline_access`** - Maintain access to data you have given it access to
     - **`User.Read`** - Sign in and read user profile
   - Click "Add permissions"

3. **Grant Admin Consent (if required)**
   - If using a work/school account, you may need admin consent
   - Click "✓ Grant admin consent for [Your Organization]"
   - Confirm the action

---

## Step 4: Add Production Redirect URI (After Local Testing)

Once you're ready to deploy to production:

1. **Go back to App Registration → Authentication**
2. **Add Production Redirect URI**:
   - Click "+ Add URI"
   - Add: `https://assistant-app-strongman1380s-projects.vercel.app/api/calendar/outlook-callback`
   - Save

---

## Step 5: Configure Environment Variables

### For Local Development

Create or update your `.env` file in the project root:

```bash
# Microsoft Outlook Calendar OAuth2
MICROSOFT_CLIENT_ID=your_application_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_value_here
MICROSOFT_TENANT_ID=common  # or your specific tenant ID
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/calendar/outlook-callback
```

**Notes**:
- Replace `your_application_client_id_here` with the Application (client) ID from Step 1
- Replace `your_client_secret_value_here` with the secret value from Step 2
- Use `MICROSOFT_TENANT_ID=common` for multi-tenant (personal + work accounts)
- Use your specific tenant ID if restricting to one organization

### For Production (Vercel)

Add environment variables via Vercel CLI:

```bash
# From your project directory
echo "your_application_client_id_here" | vercel env add MICROSOFT_CLIENT_ID production
echo "your_client_secret_value_here" | vercel env add MICROSOFT_CLIENT_SECRET production
echo "common" | vercel env add MICROSOFT_TENANT_ID production
echo "https://assistant-app-strongman1380s-projects.vercel.app/api/calendar/outlook-callback" | vercel env add MICROSOFT_REDIRECT_URI production
```

Or add them via the Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with the production scope

---

## Step 6: First-Time Authorization

### For Local Development

1. **Start your local server**:
   ```bash
   cd server
   npm start
   ```

2. **Navigate to the authorization endpoint**:
   - Open your browser to: `http://localhost:3001/api/calendar/outlook-callback`
   - Or use the app UI to trigger authorization

3. **Authorize the App**:
   - Sign in with your Microsoft account
   - Review the permissions requested
   - Click "Accept" to grant access
   - You'll be redirected back to the app

4. **Token Saved**:
   - A file `outlook-token.json` will be created in your `/api` directory
   - This contains your access and refresh tokens
   - ⚠️ **Keep this file secure** - it's in `.gitignore` by default

### For Production

1. **Deploy to Vercel** with the environment variables set

2. **Trigger Authorization**:
   - Use the app and try to create an Outlook calendar event
   - If not authorized, you'll get an error with an authorization URL
   - Visit that URL to authorize
   - The token will be saved to environment variables (you'll see it in logs)

3. **Add Token to Vercel**:
   - Copy the token JSON from the logs
   - Add it as `MICROSOFT_TOKEN` environment variable:
     ```bash
     echo '{"accessToken":"...","refreshToken":"..."}' | vercel env add MICROSOFT_TOKEN production
     ```

---

## Troubleshooting

### "AADSTS50011: The redirect URI does not match"

**Solution**: Double-check that the redirect URI in your app registration exactly matches what's in your `.env` file.

### "AADSTS65001: User or administrator has not consented"

**Solution**:
1. Go to Azure Portal → Your App → API Permissions
2. Click "Grant admin consent"
3. Or ensure the authorization URL includes `prompt=consent`

### "Invalid client secret"

**Solution**:
1. The secret may have expired
2. Create a new client secret in Azure Portal
3. Update your environment variables

### "Token expired"

**Solution**: The app should automatically refresh tokens. If it doesn't:
1. Delete `outlook-token.json` (local) or remove `MICROSOFT_TOKEN` env var (production)
2. Re-authorize the app

### Events not appearing in calendar

**Possible causes**:
1. **Wrong calendar**: Event might be created in a different calendar
   - Check all your calendars in Outlook
2. **Timezone issues**: Verify timezone is set correctly in the code
3. **Permissions**: Ensure `Calendars.ReadWrite` is granted

### "Cannot read property 'accessToken'"

**Solution**: You haven't authorized yet. Follow Step 6 to complete authorization.

---

## Security Best Practices

1. **Never commit credentials**:
   - Keep `outlook-token.json` in `.gitignore`
   - Never share client secrets publicly

2. **Rotate secrets regularly**:
   - Update client secrets before they expire
   - Azure will warn you via email before expiration

3. **Use least privilege**:
   - Only request `Calendars.ReadWrite` (not `Calendars.ReadWrite.All`)
   - Don't request unnecessary scopes

4. **Monitor access**:
   - Review app permissions periodically in Azure Portal
   - Remove unused app registrations

---

## Switching Between Google and Outlook

The app supports both calendar providers. Users can select which one to use:

1. **In the UI**: Select "Google Calendar" or "Outlook Calendar" toggle
2. **Default**: The last selected provider is saved in localStorage
3. **Authorization**: Each provider needs separate authorization

---

## Additional Resources

- [Microsoft Graph Calendar API Documentation](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [Register an application with Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [Microsoft Graph API Permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [MSAL Node Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)

---

## Support

If you encounter issues not covered in this guide:
1. Check Azure Portal logs for auth errors
2. Review the application logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure redirect URIs match exactly (including http vs https)
