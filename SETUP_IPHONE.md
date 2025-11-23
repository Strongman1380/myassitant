# iPhone Setup Guide - AI Assistant

## Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/wnxxbhdbsmhukllxengh
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `server/supabase_migration_enhanced.sql`
5. Click **Run** to execute the migration
6. Verify the table was created by going to **Table Editor** → You should see a `memories` table

## Step 2: Install on iPhone

Your app is already deployed at:
**https://ai-assistant-cqr142lxa-strongman1380s-projects.vercel.app**

### To install as an app on your iPhone:

1. **Open Safari** on your iPhone (must be Safari, not Chrome)
2. Go to: `https://ai-assistant-cqr142lxa-strongman1380s-projects.vercel.app`
3. Tap the **Share** button (square with arrow pointing up)
4. Scroll down and tap **Add to Home Screen**
5. Tap **Add**

The app will now appear on your home screen with a custom icon!

## Step 3: Test the App

Once installed, test these features:

### Memory System
1. Tap on **Memory** tab
2. Type something like "I like pizza" in the input field
3. Tap **Add Memory**
4. You should see it processed and added to your memory list

### Text Rewriter
1. Tap on **Text** tab
2. Type a casual message like "hey wanna grab lunch tmrw"
3. Tap **Rewrite**
4. You should see a professionally rewritten version

### Email Writer
1. Tap on **Email** tab
2. Enter a brief description like "tell my boss I'll be late tomorrow"
3. Tap **Generate Email**
4. You should see a professional email generated

## Current Deployment URL

Your latest deployment: **https://ai-assistant-cqr142lxa-strongman1380s-projects.vercel.app**

## Environment Variables (Already Set)

These are already configured in Vercel:
- ✅ OPENAI_API_KEY
- ✅ SUPABASE_URL: `https://wnxxbhdbsmhukllxengh.supabase.co`
- ✅ SUPABASE_ANON_KEY
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET

## Troubleshooting

### If memory features don't work:
1. Make sure you ran the SQL migration in Supabase (Step 1 above)
2. Check that the `memories` table exists in your Supabase project
3. Check browser console for errors

### If the app won't install:
1. Make sure you're using Safari (not Chrome)
2. The URL must be accessed via HTTPS (Vercel provides this)
3. Clear Safari cache and try again

### If API calls fail:
1. Open Safari developer tools (connect iPhone to Mac)
2. Check for 500 errors
3. Verify environment variables are set in Vercel dashboard

## Next Steps

Once everything is working, you can:
- Use the app from your iPhone home screen
- Add memories throughout the day
- Use voice dictation features
- Generate emails and rewrite texts on the go

The app works offline after installation and will sync when you're back online!
