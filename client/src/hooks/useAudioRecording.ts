import { useState, useRef } from 'react';

// Extend Window interface for webkit support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing] = useState(false); // Not used with Speech Recognition, kept for compatibility
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const startRecording = async () => {
    try {
      setError(null);

      // Check if browser supports Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      transcriptRef.current = '';

      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Speech recognition started - speak now');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update the full transcript
        if (finalTranscript) {
          transcriptRef.current += finalTranscript;
          console.log('Final transcript:', transcriptRef.current);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        // Provide helpful error messages
        let errorMessage = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try again and speak clearly.';
        } else if (event.error === 'network') {
          errorMessage = 'Network error. Check your connection.';
        } else {
          errorMessage = `Recognition error: ${event.error}`;
        }

        setError(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        // Don't automatically set isRecording to false here
        // Let the stopRecording function handle it
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
    }
  };

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recognitionRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      // Stop the recognition
      recognitionRef.current.stop();
      setIsRecording(false);

      // Give it a moment to process final results
      setTimeout(() => {
        const finalTranscript = transcriptRef.current.trim();

        if (finalTranscript) {
          console.log('Returning transcript:', finalTranscript);
          resolve(finalTranscript);
        } else {
          reject(new Error('No speech detected. Please speak clearly and try again.'));
        }
      }, 500);
    });
  };

  const cancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      transcriptRef.current = '';
      setIsRecording(false);
      setError(null);
    }
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
