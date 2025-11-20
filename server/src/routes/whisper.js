import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { callWhisper } from '../services/openai.js';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
  },
});

// POST /api/whisper/transcribe
// Upload audio file and get transcription
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Create a temporary file from the buffer
    const tempFilePath = `/tmp/audio-${Date.now()}.webm`;
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Call Whisper API
      const transcription = await callWhisper(tempFilePath);

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      res.json({
        success: true,
        transcription: transcription,
      });
    } catch (error) {
      // Clean up temp file even if error occurs
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in /api/whisper/transcribe:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

export default router;
