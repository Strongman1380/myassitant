# 🎤 Voice Dictation Feature

## Overview

All input fields in the AI Assistant now support **voice dictation** using the Web Speech API. You can speak naturally and the app will transcribe your words into text, which is then processed by GPT-4o-mini.

## How It Works

### User Flow
1. Click the microphone button (🎤) next to any text field
2. The button turns red and pulses - you're recording!
3. Speak naturally (the text appears in real-time)
4. Click the stop button (⏹) to finish recording
5. Click the action button to process with AI

### Visual Feedback
- **Microphone Button**:
  - Default: Blue with 🎤 icon
  - Recording: Red with ⏹ icon, pulsing animation
- **Text Area**:
  - Default: Gray border
  - Recording: Red pulsing border
- **Recording Indicator**:
  - Red banner appears: "🔴 Recording... speak now"
  - Fades in and out to indicate active recording

## Technical Implementation

### Frontend Components
- **Hook**: `useSpeechRecognition.ts` - Custom React hook wrapping Web Speech API
- **Integration**: Added to TextAssistant, EmailAssistant, CalendarAssistant
- **Styling**: Pulsing animations, color changes, visual indicators

### Features
- **Real-time transcription**: Text appears as you speak
- **Continuous listening**: Captures complete sentences
- **Auto-stop**: Stops recording when processing begins
- **Browser detection**: Shows warning if browser doesn't support voice

## Browser Support

### ✅ Supported
- Google Chrome (recommended)
- Microsoft Edge
- Safari (macOS & iOS)

### ❌ Not Supported
- Firefox (no Web Speech API support)
- Opera
- Older browsers

## Use Cases

### Text Messages
"hey can you meet me tomorrow at 3 I got something important to talk about"
→ AI formats with proper grammar

### Emails
"write email to my supervisor saying I need to leave work early tomorrow for a doctors appointment"
→ AI generates complete email with Dear/Sincerely

### Calendar Events
"lunch with Sarah next Tuesday at noon at the cafe remind me 15 minutes before"
→ AI parses into structured event

## Privacy & Security

- **No data stored**: Speech is processed in real-time by the browser
- **No external servers**: Web Speech API runs locally (browser may use cloud for processing)
- **Permissions**: Browser asks for microphone permission on first use
- **User control**: Recording only when button is clicked

## Future Enhancements

Potential improvements:
- [ ] Language selection (currently English only)
- [ ] Push-to-talk hotkey (e.g., Ctrl+Space)
- [ ] Visual waveform during recording
- [ ] Interim results display (live captions)
- [ ] Custom wake words
- [ ] Offline speech recognition (requires different API)

## Troubleshooting

**Microphone not working?**
- Check browser permissions (click lock icon in address bar)
- Ensure microphone is enabled in system settings
- Try refreshing the page

**Poor transcription quality?**
- Speak clearly and at normal pace
- Reduce background noise
- Use a quality microphone
- Check browser language settings

**Browser compatibility issues?**
- Update to latest browser version
- Use Chrome for best results
- Check if Web Speech API is enabled in browser settings
