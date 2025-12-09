import React, { useState } from 'react';
import { CalendarResponse } from '../types';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { API_URL } from '../config';

type CalendarProvider = 'google' | 'outlook';

export const CalendarAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [provider, setProvider] = useState<CalendarProvider>(() => {
    // Load provider preference from localStorage
    const saved = localStorage.getItem('calendarProvider');
    return (saved === 'outlook' ? 'outlook' : 'google') as CalendarProvider;
  });

  const {
    isRecording,
    isTranscribing,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useAudioRecording();

  const handleVoiceToggle = async () => {
    if (isRecording) {
      try {
        const transcription = await stopRecording();
        setPrompt(transcription);
      } catch (err) {
        setError('Failed to transcribe audio. Please try again.');
      }
    } else {
      await startRecording();
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please describe the event you want to schedule.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setCreated(false);

    try {
      const response = await fetch(`${API_URL}/api/ai/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse event');
      }

      const data: CalendarResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!result) return;

    setCreating(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/calendar/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: result.title,
          start: result.start,
          end: result.end,
          notes: result.notes,
          reminderMinutes: result.reminderMinutesBefore,
          provider: provider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create calendar event');
      }

      const data = await response.json();

      if (data.success) {
        setCreated(true);
        setError('');
      } else if (data.needsAuth) {
        setError(`Calendar authorization required. Please visit: ${data.authUrl}`);
      } else {
        throw new Error(data.message || 'Failed to create event');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create calendar event');
    } finally {
      setCreating(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleProviderChange = (newProvider: CalendarProvider) => {
    setProvider(newProvider);
    localStorage.setItem('calendarProvider', newProvider);
    setCreated(false); // Reset created state when switching providers
  };

  const providerName = provider === 'google' ? 'Google Calendar' : 'Outlook Calendar';

  return (
    <div>
      <div className="form-group">
        <label htmlFor="calendar-provider">Calendar Provider</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`provider-button ${provider === 'google' ? 'active' : ''}`}
            onClick={() => handleProviderChange('google')}
            style={{
              flex: 1,
              padding: '10px',
              border: provider === 'google' ? '2px solid #4285f4' : '1px solid var(--border-color)',
              background: provider === 'google' ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: provider === 'google' ? '600' : '400',
            }}
          >
            📧 Google Calendar
          </button>
          <button
            type="button"
            className={`provider-button ${provider === 'outlook' ? 'active' : ''}`}
            onClick={() => handleProviderChange('outlook')}
            style={{
              flex: 1,
              padding: '10px',
              border: provider === 'outlook' ? '2px solid #0078d4' : '1px solid var(--border-color)',
              background: provider === 'outlook' ? 'rgba(0, 120, 212, 0.1)' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: provider === 'outlook' ? '600' : '400',
            }}
          >
            📅 Outlook Calendar
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="calendar-prompt">Event Details</label>
        <div className="input-with-mic">
          <textarea
            id="calendar-prompt"
            placeholder="e.g., 'Schedule a meeting with John for tomorrow at 2pm to discuss the project'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className={isRecording ? 'listening' : ''}
            disabled={isTranscribing}
          />
          <button
            type="button"
            className={`mic-button ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
            onClick={handleVoiceToggle}
            disabled={isTranscribing}
            title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice dictation'}
          >
            {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </button>
        </div>
        {isRecording && (
          <div className="recording-indicator">
            🔴 Recording... speak now
          </div>
        )}
        {isTranscribing && (
          <div className="transcribing-indicator">
            ⏳ Transcribing your audio...
          </div>
        )}
        {recordingError && (
          <div className="warning-message">
            {recordingError}
          </div>
        )}
      </div>

      <button
        className="action-button"
        onClick={handleSubmit}
        disabled={loading || isRecording || isTranscribing}
      >
        {loading ? 'Parsing...' : 'Create Event'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result-container">
          <h3>Event Preview</h3>
          <div className="calendar-result">
            <div className="calendar-field">
              <label>Title</label>
              <div className="calendar-field-content">{result.title}</div>
            </div>
            <div className="calendar-field">
              <label>Start Time</label>
              <div className="calendar-field-content">
                {formatDateTime(result.start)}
              </div>
            </div>
            <div className="calendar-field">
              <label>End Time</label>
              <div className="calendar-field-content">
                {formatDateTime(result.end)}
              </div>
            </div>
            {result.notes && (
              <div className="calendar-field">
                <label>Notes</label>
                <div className="calendar-field-content">{result.notes}</div>
              </div>
            )}
            {result.reminderMinutesBefore && (
              <div className="calendar-field">
                <label>Reminder</label>
                <div className="calendar-field-content">
                  {result.reminderMinutesBefore} minutes before
                </div>
              </div>
            )}
          </div>
          {created && (
            <div className="success-message" style={{ marginTop: '1rem' }}>
              ✅ Event successfully added to your {providerName}!
            </div>
          )}
          <div className="result-actions">
            <button
              className="action-button"
              onClick={handleCreateEvent}
              disabled={creating || created}
            >
              {creating ? 'Creating Event...' : created ? '✓ Event Created' : `Add to ${providerName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
