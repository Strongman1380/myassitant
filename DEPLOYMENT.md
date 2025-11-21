# Deployment Guide

This guide will walk you through deploying your AI Assistant to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works fine)
- OpenAI API key
- Supabase account (for Memory feature)

## Step 1: Push to GitHub

Your repository is already set up at: https://github.com/Strongman1380/myassitant

Make sure all your latest changes are pushed:

```bash
cd "/Users/brandonhinrichs/Local Repositories/Web Applications/Assistant"
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from your project directory:
```bash
cd "/Users/brandonhinrichs/Local Repositories/Web Applications/Assistant"
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? **myassistant** (or your preferred name)
   - Directory? **./** (current directory)
   - Override settings? **No**

### Option B: Using Vercel Dashboard

1. Go to [https://vercel.com/new](https://vercel.com/new)

2. Click "Import Git Repository"

3. Select your GitHub repository: `Strongman1380/myassistant`

4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** (leave default)
   - **Output Directory:** (leave default)

5. Click "Deploy"

## Step 3: Configure Environment Variables

After deployment, you need to add environment variables:

1. Go to your project in Vercel Dashboard

2. Click **Settings** → **Environment Variables**

3. Add the following variables:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `OPENAI_API_KEY` | Your OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `SUPABASE_URL` | Your Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API |
| `PORT` | 3001 | (Optional) |

4. Click **Save** after adding each variable

5. **Redeploy** your project to apply the environment variables:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Click **Redeploy**

## Step 4: Update API URL in Frontend

After deployment, you'll get a URL like `https://myassistant.vercel.app`

You need to update the API_URL in your frontend files to point to your production server:

1. Update `client/src/components/TextAssistant.tsx`:
   ```typescript
   const API_URL = 'https://your-app-name.vercel.app';
   ```

2. Update `client/src/components/EmailAssistant.tsx`:
   ```typescript
   const API_URL = 'https://your-app-name.vercel.app';
   ```

3. Update `client/src/components/CalendarAssistant.tsx`:
   ```typescript
   const API_URL = 'https://your-app-name.vercel.app';
   ```

4. Update `client/src/components/MemoryAssistant.tsx`:
   ```typescript
   const API_URL = 'https://your-app-name.vercel.app';
   ```

5. Commit and push:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

Vercel will automatically redeploy with the new changes.

## Step 5: Set Up Supabase (Memory Feature)

1. Go to your Supabase project

2. Run the migration SQL:
   - Click **SQL Editor** in the sidebar
   - Click **New query**
   - Copy the contents of `server/supabase_migration_enhanced.sql`
   - Paste and click **Run**

3. Verify the table was created:
   - Click **Table Editor**
   - You should see the `memories` table

## Features That Work on Vercel

✅ **Text Assistant** - Rewrite messages
✅ **Email Assistant** - Draft professional emails
✅ **Memory Assistant** - Store and retrieve memories
❌ **Calendar Assistant** - Requires OAuth setup (see limitations below)

## Limitations

### Google Calendar Integration

The Calendar feature requires OAuth2 authentication which is more complex to set up in a serverless environment. For production, you have two options:

1. **Disable Calendar Feature** - Remove it from the UI for now
2. **Use a Different Hosting Solution** - Deploy the backend to a server with persistent storage (e.g., Railway, Render, or DigitalOcean)

### Voice Recording

The voice recording feature uses the browser's MediaRecorder API and OpenAI Whisper. It should work on Vercel, but:
- Requires HTTPS (Vercel provides this automatically)
- Microphone permission required in browser
- Large audio files may hit Vercel's 4.5MB request limit

## Troubleshooting

### Build Fails

**Error:** "Type error: ..."
- Make sure TypeScript compiles locally: `cd client && npm run build`
- Fix any TypeScript errors before deploying

### API Calls Fail

**Error:** "Failed to fetch"
- Check that environment variables are set in Vercel
- Verify API_URL in frontend files points to your Vercel URL
- Check Vercel Function Logs for backend errors

### Memory Feature Not Working

**Error:** "Failed to add memory"
- Verify Supabase credentials are correct in Vercel environment variables
- Check that the SQL migration was run in Supabase
- Verify RLS policies allow public access (since it's a personal app)

### CORS Errors

If you see CORS errors:
- The backend already has CORS enabled for all origins
- Vercel should handle this automatically
- If issues persist, you may need to configure custom headers in `vercel.json`

## Monitoring

### View Logs

1. Go to Vercel Dashboard
2. Click your project
3. Go to **Deployments**
4. Click on a deployment
5. Click **Functions** to see serverless function logs

### Check Performance

- Vercel provides analytics in the **Analytics** tab
- Monitor function execution time and errors

## Updating Your Deployment

Every time you push to GitHub, Vercel will automatically redeploy:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Watch the deployment progress in Vercel Dashboard.

## Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Add your domain
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificate

## Cost

- **Vercel:** Free tier includes:
  - 100GB bandwidth/month
  - 100GB-hours serverless function execution
  - Unlimited deployments

- **Supabase:** Free tier includes:
  - 500MB database storage
  - 1GB file storage
  - 50,000 monthly active users

For personal use, the free tiers should be more than sufficient!

## Support

If you run into issues:
- Check Vercel function logs
- Verify environment variables are set
- Test API endpoints directly in browser
- Check browser console for frontend errors

---

**Your app will be live at:** `https://your-app-name.vercel.app`

Enjoy your AI Assistant! 🎉
