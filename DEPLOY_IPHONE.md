# Deploying AI Assistant (PWA)

Your AI Assistant is configured as a Progressive Web App (PWA) that can be installed on iPhone like a native app.

## Architecture Overview

This is a **monorepo** with separate frontend and backend:
- **Frontend (client/)**: React + Vite PWA - deployed to Vercel or GitHub Pages
- **Backend (server/)**: Express + OpenAI + Supabase - must be deployed separately to Render/Railway

## Option A: Deploy to Vercel (Recommended)

### Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and create a new **Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `assistant-backend` (or your choice)
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. For Google Calendar integration, you'll need to set up OAuth credentials as environment variables (not file-based)
6. Click **Create Web Service** and wait for deployment
7. **Copy the server URL** (e.g., `https://assistant-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# From repo root, run:
vercel --prod
```

When prompted:
- Accept the detected settings
- Link to existing project or create new one

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Vercel will auto-detect the `vercel.json` config
4. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://assistant-backend.onrender.com`)
5. Click **Deploy**

### Step 3: Configure Environment Variables

After first deployment, add these in **Vercel Dashboard → Project → Settings → Environment Variables**:

```
VITE_API_URL=https://assistant-backend.onrender.com
```

Then trigger a redeploy for the variable to take effect.

### Step 4: Verify Deployment

1. Visit your Vercel URL (e.g., `https://assistant-abc123.vercel.app`)
2. Check that `/health` endpoint returns JSON (this proxies to your backend)
3. Open browser console - there should be no 404 errors for icons/manifest
4. Test a text rewrite to confirm API connectivity

---

## Option B: Deploy to GitHub Pages

### Step 1: Deploy Backend (Same as Above)

Follow **Step 1** from Option A to deploy your backend to Render.

### Step 2: Enable GitHub Pages

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The `.github/workflows/deploy.yml` workflow is already configured

### Step 3: Add GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

```
VITE_API_URL=https://assistant-backend.onrender.com
```

### Step 4: Deploy

```bash
git add .
git commit -m "Configure deployment"
git push origin main
```

The GitHub Action will automatically build and deploy. Your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

**Note**: If using a custom repo name, you may need to update `base` in `client/vite.config.ts`:
```ts
base: '/YOUR_REPO_NAME/',
```

---

## Install on iPhone

1. Open your deployed URL in **Safari** on iPhone:
   - Vercel: `https://your-app.vercel.app`
   - GitHub Pages: `https://username.github.io/repo-name/`
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

The app will appear on your home screen with the custom icon and run in fullscreen mode without browser chrome.

---

## Local Development & Testing

### Test on iPhone (Same Wi-Fi)

1. Find your computer's local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   ```

2. Create `client/.env.local`:
   ```
   VITE_API_URL=http://YOUR_COMPUTER_IP:3001
   ```

3. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm install
   npm start

   # Terminal 2 - Frontend
   cd client
   npm install
   npm run dev
   ```

4. On your iPhone, visit `http://YOUR_COMPUTER_IP:3000` in Safari
5. You can "Add to Home Screen" here too, but it only works while your computer is running

### Environment Variables Reference

**Backend (server/.env)**:
```
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...
```

**Frontend (client/.env.local)**:
```
VITE_API_URL=http://localhost:3001
# Or for production: https://your-backend.onrender.com
```

---

## Troubleshooting

### Vercel: API calls failing
- Ensure `VITE_API_URL` is set in Vercel environment variables
- Redeploy after adding/changing env vars
- Check that backend is deployed and healthy at `/health` endpoint

### GitHub Pages: Blank page or 404
- Check if `base` in `vite.config.ts` matches your repo name
- Verify GitHub Pages is enabled and using "GitHub Actions" source
- Check Actions tab for build errors

### iPhone: App won't install
- Must use Safari (not Chrome or other browsers)
- URL must be HTTPS (GitHub Pages and Vercel both use HTTPS)
- Check browser console for manifest errors

### Icons not loading
- Ensure `client/public/` directory contains all icon files referenced in `vite.config.ts`
- Files needed: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `icon.svg`, `favicon.ico`
