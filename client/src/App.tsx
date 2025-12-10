import { useState, useRef, useEffect } from 'react';
import { AssistantMode, TextResponse, EmailResponse, CalendarResponse } from './types';
import { useAudioRecording } from './hooks/useAudioRecording';
import { API_URL } from './config';
import './App.css';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: AssistantMode;
  data?: TextResponse | EmailResponse | CalendarResponse;
  timestamp: Date;
};

const MODES: Array<{
  id: AssistantMode;
  label: string;
  icon: string;
}> = [
  { id: 'text', label: 'Message', icon: '💬' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
];

function App() {
  const [mode, setMode] = useState<AssistantMode>('text');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [calendarCreating, setCalendarCreating] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    isTranscribing,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useAudioRecording();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceToggle = async () => {
    if (isRecording) {
      try {
        const transcription = await stopRecording();
        setInput(transcription);
        inputRef.current?.focus();
      } catch {
        console.error('Failed to transcribe');
      }
    } else {
      await startRecording();
    }
  };

  const generateId = () => Math.random().toString(36).substring(7);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      mode,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let endpoint = '';
      let body = {};

      switch (mode) {
        case 'text':
          endpoint = '/api/ai/text';
          body = { message: input };
          break;
        case 'email':
          endpoint = '/api/ai/email';
          body = { prompt: input };
          break;
        case 'calendar':
          endpoint = '/api/ai/calendar';
          body = { prompt: input };
          break;
        default:
          endpoint = '/api/ai/text';
          body = { message: input };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();

      let assistantContent = '';
      if (mode === 'text') {
        assistantContent = (data as TextResponse).rewritten;
        // Auto-copy to clipboard
        navigator.clipboard.writeText(assistantContent);
      } else if (mode === 'email') {
        const emailData = data as EmailResponse;
        assistantContent = `**To:** ${emailData.to}\n**Subject:** ${emailData.subject}\n\n${emailData.body}`;
      } else if (mode === 'calendar') {
        const calData = data as CalendarResponse;
        assistantContent = `**${calData.title}**\nStart: ${formatDateTime(calData.start)}\nEnd: ${formatDateTime(calData.end)}${calData.notes ? `\nNotes: ${calData.notes}` : ''}`;
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        mode,
        data,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        mode,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreateCalendarEvent = async (messageId: string, data: CalendarResponse) => {
    setCalendarCreating(messageId);
    try {
      const response = await fetch(`${API_URL}/api/calendar/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          start: data.start,
          end: data.end,
          notes: data.notes,
          reminderMinutes: data.reminderMinutesBefore,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: m.content + '\n\n✅ Added to Google Calendar!' }
              : m
          )
        );
      } else if (result.needsAuth) {
        window.open(result.authUrl, '_blank');
      }
    } catch {
      console.error('Failed to create calendar event');
    } finally {
      setCalendarCreating(null);
    }
  };

  const handleOpenGmail = (data: EmailResponse) => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.to)}&su=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    window.open(gmailUrl, '_blank');
  };

  const getPlaceholder = () => {
    switch (mode) {
      case 'text':
        return 'Type a message to rewrite...';
      case 'email':
        return 'Describe the email you want to write...';
      case 'calendar':
        return 'Describe the event to schedule...';
      default:
        return 'Type your message...';
    }
  };

  return (
    <div className="chat-app">
      {/* Header */}
      <header className="chat-header">
        <h1 className="chat-title">Assistant</h1>
        <button
          className={`knowledge-btn ${showKnowledge ? 'active' : ''}`}
          onClick={() => setShowKnowledge(!showKnowledge)}
        >
          🧠 Knowledge
        </button>
      </header>

      {/* Knowledge Panel */}
      {showKnowledge && (
        <div className="knowledge-panel">
          <div className="knowledge-content">
            <h3>Personal Knowledge Base</h3>
            <p>Store and search your personal information, facts, and context.</p>
            <a href="/memory" className="knowledge-link">
              Open Memory Manager →
            </a>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon">✨</div>
            <h2>How can I help you today?</h2>
            <p>Select a mode below and start typing or use voice input.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-bubble">
              <div className="message-header">
                <span className="message-mode">
                  {MODES.find((m) => m.id === message.mode)?.icon}{' '}
                  {MODES.find((m) => m.id === message.mode)?.label}
                </span>
              </div>
              <div className="message-content">
                {message.content.split('\n').map((line, i) => (
                  <p key={i}>{line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}</p>
                ))}
              </div>

              {/* Action buttons for assistant messages */}
              {message.role === 'assistant' && message.data && (
                <div className="message-actions">
                  {message.mode === 'text' && (
                    <button onClick={() => handleCopy((message.data as TextResponse).rewritten)}>
                      📋 Copy
                    </button>
                  )}
                  {message.mode === 'email' && (
                    <>
                      <button onClick={() => handleCopy((message.data as EmailResponse).body)}>
                        📋 Copy Body
                      </button>
                      <button onClick={() => handleOpenGmail(message.data as EmailResponse)}>
                        📧 Open Gmail
                      </button>
                    </>
                  )}
                  {message.mode === 'calendar' && !message.content.includes('✅') && (
                    <button
                      onClick={() => handleCreateCalendarEvent(message.id, message.data as CalendarResponse)}
                      disabled={calendarCreating === message.id}
                    >
                      {calendarCreating === message.id ? '⏳ Creating...' : '📅 Add to Calendar'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-bubble loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {/* Mode Selector */}
        <div className="mode-selector">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <span className="mode-icon">{m.icon}</span>
              <span className="mode-label">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div className="input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={loading || isTranscribing}
            rows={1}
            className={isRecording ? 'recording' : ''}
          />
          <button
            className={`voice-btn ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
            onClick={handleVoiceToggle}
            disabled={isTranscribing || loading}
          >
            {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </button>
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
          >
            {loading ? '...' : '→'}
          </button>
        </div>

        {(isRecording || recordingError) && (
          <div className="input-status">
            {isRecording && <span className="recording-status">🔴 Recording...</span>}
            {recordingError && <span className="error-status">{recordingError}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
