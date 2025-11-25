import { useState, useRef } from 'react';
import { API_URL } from '../config';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder with webm format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setError(null);
        console.log('Recording started - speak now');
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (err) {
      console.error('Error starting recording:', err);

      let errorMessage = 'Failed to start recording';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsRecording(false);
    }
  };

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          // Combine all audio chunks into a single blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          if (audioBlob.size === 0) {
            throw new Error('No audio data recorded. Please try again.');
          }

          console.log('Audio recorded, size:', audioBlob.size, 'bytes');

          // Send to OpenAI Whisper API for transcription
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch(`${API_URL}/api/whisper/transcribe`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Transcription failed');
          }

          const data = await response.json();
          const transcript = data.transcription || data.text || data.transcript;

          if (!transcript || transcript.trim() === '') {
            throw new Error('No speech detected. Please speak clearly and try again.');
          }

          console.log('Transcription:', transcript);
          setIsTranscribing(false);

          // Clean up media stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          resolve(transcript);
        } catch (err) {
          console.error('Transcription error:', err);
          setIsTranscribing(false);
          setError(err instanceof Error ? err.message : 'Transcription failed');

          // Clean up media stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          reject(err);
        }
      };

      // Stop recording
      mediaRecorder.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setError(null);
  };

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
