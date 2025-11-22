# Deploy Backend to Render

This guide walks you through deploying your AI Assistant backend to Render.

## Prerequisites

1. GitHub account with your code pushed
2. Render account (free at [render.com](https://render.com))
3. OpenAI API key
4. Supabase project (URL and anon key)
5. (Optional) Google Calendar OAuth credentials

## Step 1: Prepare Your Environment Variables

Before deploying, gather these values from your local `server/.env` file:

### Required Variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NODE_ENV=production`
- `PORT=3001`

### Optional (for Google Calendar):
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `BASE_URL` - Will be your Render URL (e.g., `https://assistant-backend.onrender.com`)
- `GOOGLE_REDIRECT_URI` - Your Render URL + `/api/calendar/oauth-callback`
- `GOOGLE_TOKEN` - You'll get this after first authorization (see Step 4)

## Step 2: Create Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repository: `https://github.com/Strongman1380/myassitant`
4. Configure the service:

### Basic Settings:
   - **Name**: `assistant-backend` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Instance Type:
   - Select **Free** (or paid for better performance)

## Step 3: Add Environment Variables

In the Render dashboard, scroll to **Environment Variables** and add:

```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-...your-key...
SUPABASE_URL=https://...your-project....supabase.co
SUPABASE_ANON_KEY=eyJ...your-key...
```

### For Google Calendar (Optional):
```
GOOGLE_CLIENT_ID=...your-client-id....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...your-secret...
BASE_URL=https://assistant-backend.onrender.com
GOOGLE_REDIRECT_URI=https://assistant-backend.onrender.com/api/calendar/oauth-callback
```

**Note**: Replace `assistant-backend.onrender.com` with your actual Render URL (you'll see it after deployment starts).

## Step 4: Update Google OAuth Redirect URI (If Using Calendar)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://your-render-url.onrender.com/api/calendar/oauth-callback
   ```
6. Save changes

## Step 5: Deploy

1. Click **Create Web Service**
2. Render will start building and deploying
3. Wait for the deployment to complete (first build takes ~2-5 minutes)
4. Once live, copy your service URL (e.g., `https://assistant-backend.onrender.com`)

## Step 6: Authorize Google Calendar (If Using)

1. Visit your backend URL + `/api/calendar/auth-status`:
   ```
   https://your-render-url.onrender.com/api/calendar/auth-status
   ```

2. You'll get a response with an `authUrl`. Open this URL in your browser

3. Sign in with your Google account and authorize calendar access

4. After authorization, check the Render logs (Dashboard → Logs tab)

5. Look for a line that says:
   ```
   🔑 IMPORTANT: Save this token as GOOGLE_TOKEN environment variable:
   {"access_token":"...","refresh_token":"...","scope":"...","token_type":"Bearer","expiry_date":...}
   ```

6. Copy the entire JSON object

7. Go back to Render → **Environment** → **Environment Variables**

8. Add a new variable:
   - **Key**: `GOOGLE_TOKEN`
   - **Value**: Paste the entire JSON token

9. Save and redeploy (Render will auto-redeploy when you save env vars)

## Step 7: Update Vercel Frontend

Now that your backend is deployed, update your Vercel frontend:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `ai-assistant` project
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   ```
   VITE_API_URL=https://your-render-url.onrender.com
   ```
5. Go to **Deployments** tab
6. Click the **⋯** menu on the latest deployment
7. Click **Redeploy**

## Step 8: Test Your Deployment

1. Visit your Vercel frontend URL
2. Test each feature:
   - Text rewriting
   - Email composition
   - Memory storage
   - Calendar event creation (if configured)

### Health Check:
Visit `https://your-render-url.onrender.com/health` - should return:
```json
{"status":"ok","timestamp":"2025-11-22T..."}
```

## Troubleshooting

### Backend won't start:
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure `PORT=3001` is set

### Frontend can't reach backend:
- Verify `VITE_API_URL` is set in Vercel
- Check that backend is deployed and healthy
- Ensure no CORS errors in browser console

### Calendar authorization fails:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that redirect URI is added in Google Cloud Console
- Ensure `BASE_URL` and `GOOGLE_REDIRECT_URI` match your Render URL

### "Cold starts" (Render free tier):
- Free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid tier for always-on service

## Updating Your Deployment

When you push changes to GitHub:

1. Render will automatically detect the changes
2. Click **Manual Deploy** → **Deploy latest commit**
3. Or enable **Auto-Deploy** in Render settings

## Environment Variable Management

To update environment variables:

1. Go to Render Dashboard → Your Service
2. Click **Environment** tab
3. Add/edit variables
4. Render will automatically redeploy with new values

## Cost

- **Render Free Tier**: $0/month (spins down after 15 min inactivity)
- **Render Starter**: $7/month (always on, better performance)
- **Vercel Free Tier**: $0/month (plenty for personal use)
- **OpenAI API**: Pay per use (typically $1-5/month for personal use)
- **Supabase Free Tier**: $0/month (500MB database, 1GB file storage)

**Total estimated cost for personal use**: $0-10/month
