import React, { useState } from 'react';
import { TextResponse } from '../types';
import { useAudioRecording } from '../hooks/useAudioRecording';

const API_URL = 'http://localhost:3001';

export const TextAssistant: React.FC = () => {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<TextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
        setMessage(transcription);
      } catch (err) {
        setError('Failed to transcribe audio. Please try again.');
      }
    } else {
      await startRecording();
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter a message to format.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const data: TextResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.rewritten) {
      await navigator.clipboard.writeText(result.rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div className="form-group">
        <label htmlFor="message">Your Message</label>
        <div className="input-with-mic">
          <textarea
            id="message"
            placeholder="Dictate or type your raw message here. For example: 'hey man, running late, probably like 15 min, sorry'"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
        {loading ? 'Processing...' : 'Rewrite Message'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result-container">
          <h3>Formatted Message</h3>
          <div className="result-text">{result.rewritten}</div>
          <div className="result-actions">
            <button
              className={`copy-button ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
