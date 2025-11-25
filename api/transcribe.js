import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max file size
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Get the uploaded audio file
    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📝 Transcribing audio file:', audioFile.originalFilename, 'Size:', audioFile.size);

    // Create a read stream from the uploaded file
    const fileStream = fs.createReadStream(audioFile.filepath);

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1', // You can also use 'gpt-4o-transcribe' if available
      language: 'en', // Optional: specify language
      response_format: 'json',
    });

    // Clean up the temporary file
    fs.unlinkSync(audioFile.filepath);

    console.log('✅ Transcription successful:', transcription.text);

    res.status(200).json({
      text: transcription.text,
      transcript: transcription.text, // Alias for compatibility
    });
  } catch (error) {
    console.error('❌ Transcription error:', error);

    // Clean up any temporary files on error
    try {
      const form = formidable();
      const [, files] = await form.parse(req);
      const audioFile = files.audio?.[0];
      if (audioFile?.filepath) {
        fs.unlinkSync(audioFile.filepath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    res.status(500).json({
      error: error.message || 'Transcription failed',
    });
  }
}
