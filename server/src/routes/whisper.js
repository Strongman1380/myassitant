import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import { callWhisper } from '../services/openai.js';

const router = express.Router();

// POST /api/whisper/transcribe
// Upload audio file and get transcription
router.post('/transcribe', async (req, res) => {
  try {
    // Parse the multipart form data using formidable
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Get the uploaded audio file
    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('🎤 Transcribing audio:', audioFile.originalFilename || 'recording.webm');

    try {
      // Call Whisper API with the uploaded file path
      const transcription = await callWhisper(audioFile.filepath);

      // Clean up temp file
      fs.unlinkSync(audioFile.filepath);

      res.json({
        success: true,
        transcription: transcription,
      });
    } catch (error) {
      // Clean up temp file even if error occurs
      if (fs.existsSync(audioFile.filepath)) {
        fs.unlinkSync(audioFile.filepath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in /api/whisper/transcribe:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

export default router;
