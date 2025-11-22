import React, { useState } from 'react';
import { EmailResponse } from '../types';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { API_URL } from '../config';

export const EmailAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<EmailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      setError('Please describe the email you want to send.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data: EmailResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (field: 'subject' | 'body', text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openInGmail = () => {
    if (!result) return;

    const gmailUrl = new URL('https://mail.google.com/mail/');
    gmailUrl.searchParams.set('view', 'cm');
    gmailUrl.searchParams.set('fs', '1');
    if (result.to) gmailUrl.searchParams.set('to', result.to);
    gmailUrl.searchParams.set('su', result.subject);
    gmailUrl.searchParams.set('body', result.body);

    window.open(gmailUrl.toString(), '_blank');
  };

  return (
    <div>
      <div className="form-group">
        <label htmlFor="email-prompt">Email Instructions</label>
        <div className="input-with-mic">
          <textarea
            id="email-prompt"
            placeholder="e.g., 'Email my boss, let him know I finished the report and ask him to review it'"
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
        {loading ? 'Generating...' : 'Generate Email'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result-container">
          <h3>Generated Email</h3>
          <div className="email-result">
            {result.to && (
              <div className="email-field">
                <label>To:</label>
                <div className="email-field-content">{result.to}</div>
              </div>
            )}
            <div className="email-field">
              <label>Subject:</label>
              <div className="email-field-content">{result.subject}</div>
            </div>
            <div className="email-field">
              <label>Body:</label>
              <div className="email-field-content" style={{ whiteSpace: 'pre-line' }}>{result.body}</div>
            </div>
          </div>
          <div className="result-actions">
            <button
              className={`copy-button ${copiedField === 'subject' ? 'copied' : ''}`}
              onClick={() => handleCopy('subject', result.subject)}
            >
              {copiedField === 'subject' ? '✓ Copied!' : 'Copy Subject'}
            </button>
            <button
              className={`copy-button ${copiedField === 'body' ? 'copied' : ''}`}
              onClick={() => handleCopy('body', result.body)}
            >
              {copiedField === 'body' ? '✓ Copied!' : 'Copy Body'}
            </button>
            <button className="secondary-button" onClick={openInGmail}>
              Open in Gmail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
