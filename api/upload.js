import formidable from 'formidable';
import fs from 'fs';

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Get the uploaded file
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📄 File uploaded:', uploadedFile.originalFilename, 'Size:', uploadedFile.size);

    // Read file content
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf8');

    // Clean up the temporary file
    fs.unlinkSync(uploadedFile.filepath);

    console.log('✅ File processed successfully');

    res.status(200).json({
      success: true,
      filename: uploadedFile.originalFilename,
      size: uploadedFile.size,
      content: fileContent,
      message: 'File uploaded and processed successfully',
    });
  } catch (error) {
    console.error('❌ Upload error:', error);

    res.status(500).json({
      error: error.message || 'File upload failed',
    });
  }
}
