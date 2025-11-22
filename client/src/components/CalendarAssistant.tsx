import React, { useState } from 'react';
import { CalendarResponse } from '../types';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { API_URL } from '../config';

export const CalendarAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div>
      <div className="form-group">
        <label htmlFor="calendar-prompt">Event Details</label>
        <div className="input-with-mic">
          <textarea
            id="calendar-prompt"
            placeholder="e.g., 'Schedule a meeting with John for tomorrow at 2pm to discuss the project'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
          <div className="result-actions">
            <button className="secondary-button">
              Download .ics (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
