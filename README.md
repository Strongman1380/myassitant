# 🤖 AI Assistant Web App

A developer-first web application that acts as your personal AI assistant for messages, emails, calendar events, and memory management.

## 📋 Features

- **💬 Text Assistant**: 🎤 **Voice dictation** or type rough messages - AI formats them professionally with proper grammar and spelling
- **✉️ Email Assistant**: 🎤 **Voice dictation** or describe what you need - AI generates complete emails with proper salutations (Dear X) and professional closings
- **📅 Calendar Assistant**: 🎤 **Voice dictation** or type event details - AI parses natural language into structured calendar events
- **🧠 Memory Assistant**: Store and manage personal facts and preferences

### 🎤 Voice Dictation

All input fields support **voice dictation**! Simply:
1. Click the microphone button (🎤)
2. Speak naturally
3. Click the stop button (⏹) when done
4. AI will process your spoken words

**Browser Support**: Works in Chrome, Edge, and Safari (uses Web Speech API)

## 🤖 AI Integration

This app uses **OpenAI GPT-4o-mini** to:
- Fix grammar, spelling, and punctuation in text messages
- Generate professionally formatted emails with proper structure
- Parse natural language into calendar events
- Provide casual but professional communication assistance

## 🏗️ Project Structure

```
assistant/
├── server/          # Node.js + Express backend
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   │   ├── ai.js
│   │   │   └── memory.js
│   │   └── config/
│   │       └── env.js
│   ├── package.json
│   └── .env.example
├── client/          # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── TextAssistant.tsx
│   │   │   ├── EmailAssistant.tsx
│   │   │   ├── CalendarAssistant.tsx
│   │   │   └── MemoryAssistant.tsx
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation & Setup

#### 1. Install Server Dependencies

```bash
cd server
npm install
```

#### 2. Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
```

**IMPORTANT:** You MUST add your OpenAI API key for the app to work! Get one at https://platform.openai.com/api-keys

#### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### Running the Application

You'll need **two terminal windows** - one for the server and one for the client.

#### Terminal 1: Start the Backend Server

```bash
cd server
npm run dev
```

You should see:
```
✅ Server running on http://localhost:3001
📡 API endpoints:
   - POST http://localhost:3001/api/ai/text
   - POST http://localhost:3001/api/ai/email
   - POST http://localhost:3001/api/ai/calendar
   - POST http://localhost:3001/api/memory/add
   - GET  http://localhost:3001/api/memory/list
```

#### Terminal 2: Start the Frontend

```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

#### 4. Open Your Browser

Navigate to: **http://localhost:3000**

## 🧪 Testing the App

### Text Assistant (Currently Working with Dummy Data)

1. Click on the **💬 Text** tab
2. Type a message: `hey can u meet me tomorrow at 3?`
3. Select a tone: **Professional**
4. Click **Rewrite Message**
5. You should see a dummy response like: `hey can u meet me tomorrow at 3? (Professional)`
6. Click **Copy to Clipboard** to copy the result

### Email Assistant

1. Click on the **✉️ Email** tab
2. Describe an email: `Write to my boss explaining I need to leave early tomorrow for a doctor's appointment`
3. Click **Generate Email**
4. View the generated subject and body
5. Use **Copy Subject** / **Copy Body** buttons
6. Click **Open in Gmail** to compose in Gmail

### Calendar Assistant

1. Click on the **📅 Calendar** tab
2. Describe an event: `Schedule lunch with John next Wednesday at 1 pm at Applebee's, remind me 30 minutes before`
3. Click **Create Event**
4. View the parsed event details

### Memory Assistant

1. Click on the **🧠 Memory** tab
2. Add facts: `My name is Brandon`
3. Add more: `PO email is officer@example.com`
4. All stored memories will appear below
5. These memories can later be used as context for AI responses

## 🔄 Current Status

✅ **Completed:**
- Full project structure
- Express backend with all API endpoints
- React frontend with all 4 modes
- Dummy responses for testing
- Complete UI with copy/paste functionality

🚧 **Next Steps:**
1. Replace dummy responses with real OpenAI API calls
2. Implement proper AI prompting with tone awareness
3. Add memory context injection into AI prompts
4. Implement .ics file download for calendar events
5. Add persistent storage for memories (JSON file or database)

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express
- CORS
- dotenv

**Frontend:**
- React 18
- TypeScript
- Vite
- CSS3

## 📝 API Documentation

### POST /api/ai/text
Rewrite a message in a specific tone.

**Request:**
```json
{
  "message": "string",
  "tone": "Professional" | "Supportive" | "Short & Clear"
}
```

**Response:**
```json
{
  "success": true,
  "original": "string",
  "tone": "string",
  "rewritten": "string"
}
```

### POST /api/ai/email
Generate an email from a description.

**Request:**
```json
{
  "prompt": "string"
}
```

**Response:**
```json
{
  "type": "email",
  "to": "string",
  "subject": "string",
  "body": "string"
}
```

### POST /api/ai/calendar
Parse natural language into a calendar event.

**Request:**
```json
{
  "prompt": "string"
}
```

**Response:**
```json
{
  "type": "calendar",
  "title": "string",
  "notes": "string | null",
  "start": "ISO-8601 datetime",
  "end": "ISO-8601 datetime",
  "reminderMinutesBefore": "number | null"
}
```

### POST /api/memory/add
Store a new memory/fact.

**Request:**
```json
{
  "fact": "string"
}
```

**Response:**
```json
{
  "success": true,
  "fact": "string",
  "totalMemories": number
}
```

### GET /api/memory/list
Retrieve all stored memories.

**Response:**
```json
{
  "type": "memory_dump",
  "memories": ["string", "string", ...]
}
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes (for AI features) |
| `PORT` | Server port (default: 3001) | No |

## 📦 Dependencies

### Server
- `express`: Web framework
- `cors`: Enable CORS
- `dotenv`: Environment variable management

### Client
- `react`: UI framework
- `react-dom`: React DOM renderer
- `typescript`: Type safety
- `vite`: Build tool and dev server
- `@vitejs/plugin-react`: Vite React plugin

## 🤝 Contributing

This is a personal development project. Feel free to fork and customize for your own use!

## 📄 License

ISC

---

**Built with ❤️ for personal productivity**
# myassitant
