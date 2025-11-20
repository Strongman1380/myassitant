# 🚀 Quick Setup Guide

## Step 1: Add Your OpenAI API Key

1. Open the file: `/server/.env`
2. Replace the empty `OPENAI_API_KEY=` with your actual key:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   PORT=3001
   ```

**Don't have an API key?**
- Go to https://platform.openai.com/api-keys
- Sign in or create an account
- Click "Create new secret key"
- Copy and paste it into the `.env` file

## Step 2: Start the Servers

You need TWO terminal windows:

### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

You should see:
```
✅ Server running on http://localhost:3001
```

### Terminal 2 - Frontend Client
```bash
cd client
npm run dev
```

You should see:
```
➜  Local:   http://localhost:3000/
```

## Step 3: Open the App

Open your browser and go to: **http://localhost:3000**

## 🧪 Test It Out

### 🎤 Voice Dictation is Available!
**All sections support voice input!** Click the microphone button (🎤) to speak, then click stop (⏹) when done.

### Text Assistant
1. Click the **💬 Text** tab
2. **Try Voice:** Click 🎤 and say: "hey can you meet me tomorrow at 3 I got something important to talk about"
3. **Or Type:** `hey man can u meet me tmrw at 3 i got somthing important to talk about`
4. Click **Format Message**
5. AI will rewrite it with proper grammar and professional tone!

### Email Assistant
1. Click the **✉️ Email** tab
2. **Try Voice:** Click 🎤 and say: "write email to my supervisor saying I need to leave work early tomorrow for a doctors appointment"
3. **Or Type:** `write email to my supervisor saying i need to leave work early tomorrow for a doctors appointment`
4. Click **Generate Email**
5. You'll get a properly formatted email with "Dear [Name]," and professional closing!

### Calendar Assistant
1. Click the **📅 Calendar** tab
2. **Try Voice:** Click 🎤 and say: "lunch with Sarah next Tuesday at noon at the cafe, remind me 15 minutes before"
3. **Or Type:** `lunch with sarah next tuesday at noon at the cafe, remind me 15 minutes before`
4. Click **Create Event**
5. See the structured calendar event!

## ⚠️ Troubleshooting

**Blank screen?**
- Check both servers are running (you should see green checkmarks)
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

**"Failed to communicate with AI" error?**
- Make sure your OpenAI API key is correct in `/server/.env`
- Restart the backend server (Terminal 1)

**Voice dictation not working?**
- Voice dictation only works in Chrome, Edge, and Safari
- Make sure to allow microphone permissions when prompted
- Firefox does NOT support Web Speech API

**Other errors?**
- Check the browser console (Press F12)
- Check the server terminal for error messages
