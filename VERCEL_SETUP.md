# Vercel Deployment Setup

This project is configured for deployment on [Vercel](https://vercel.com).

## Prerequisites

1.  A Vercel account.
2.  The Vercel CLI (optional) or GitHub integration.

## Environment Variables

For the application to function correctly, you must set the following Environment Variables in your Vercel Project Settings:

### OpenAI (Required for AI features)
- `OPENAI_API_KEY`: Your OpenAI API Key (starts with `sk-...`).

### Google Drive (Required for Drive integration)
- `GOOGLE_DRIVE_CLIENT_ID`: From your Google Cloud Console.
- `GOOGLE_DRIVE_CLIENT_SECRET`: From your Google Cloud Console.
- `GOOGLE_DRIVE_REDIRECT_URI`: The URL where Google redirects after auth.
    - For production: `https://your-app-name.vercel.app/api/drive/oauth-callback`
    - Note: You must add this URI to your "Authorized redirect URIs" in Google Cloud Console.

### Supabase (Required for Memory features)
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

## Deployment Steps

1.  **Push to GitHub**: Ensure your latest changes are pushed to the `main` branch.
2.  **Import to Vercel**:
    - Go to Vercel Dashboard -> "Add New..." -> "Project".
    - Select your GitHub repository.
3.  **Configure Project**:
    - **Framework Preset**: Vite (should be detected automatically).
    - **Root Directory**: `./` (default).
    - **Build Command**: `cd client && npm install && npm run build` (should be detected from vercel.json).
    - **Output Directory**: `client/dist` (should be detected from vercel.json).
4.  **Add Environment Variables**:
    - Copy the values from your local `.env` or setup files.
5.  **Deploy**: Click "Deploy".

## Post-Deployment

- **Google Drive Auth**:
    - After deployment, update your Google Cloud Console credentials to include the new Vercel domain in "Authorized JavaScript origins" and "Authorized redirect URIs".
    - The redirect URI will be `https://<your-project>.vercel.app/api/drive/oauth-callback`.
