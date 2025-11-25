import formidable from 'formidable';
import fs from 'fs';
import { callOpenAI } from '../services/openai.js';
import { addMemory } from '../services/supabase.js';

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

    console.log('📄 Parsing document:', uploadedFile.originalFilename);

    // Read file content
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf8');

    // Clean up the temporary file
    fs.unlinkSync(uploadedFile.filepath);

    // Use AI to extract important information and memories from the document
    const prompt = `You are a memory extraction assistant. Analyze the following document and extract all important information that should be remembered about the person or context.

Extract facts, preferences, important dates, relationships, goals, routines, and any other relevant information. Format each piece of information as a separate, clear statement.

Return ONLY a JSON object with this exact structure:
{
  "memories": [
    "First important fact or piece of information",
    "Second important fact or piece of information",
    "Third important fact or piece of information"
  ]
}

Document content:
${fileContent.substring(0, 15000)}`;

    const aiResponse = await callOpenAI(prompt);

    // Parse the AI response
    let extractedData;
    try {
      // Try to parse as JSON
      extractedData = JSON.parse(aiResponse);
    } catch (parseError) {
      // If not valid JSON, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI did not return valid JSON');
      }
    }

    if (!extractedData.memories || !Array.isArray(extractedData.memories)) {
      throw new Error('Invalid response format from AI');
    }

    console.log(`✅ Extracted ${extractedData.memories.length} memories from document`);

    // Add each extracted memory to the database
    const addedMemories = [];
    for (const memoryContent of extractedData.memories) {
      try {
        const result = await addMemory(memoryContent);
        addedMemories.push(result);
      } catch (error) {
        console.error('Error adding memory:', error);
        // Continue with other memories even if one fails
      }
    }

    res.status(200).json({
      success: true,
      filename: uploadedFile.originalFilename,
      memoriesExtracted: extractedData.memories.length,
      memoriesAdded: addedMemories.length,
      memories: addedMemories,
      message: `Successfully extracted and stored ${addedMemories.length} memories from ${uploadedFile.originalFilename}`,
    });
  } catch (error) {
    console.error('❌ Document parsing error:', error);

    res.status(500).json({
      error: error.message || 'Document parsing failed',
    });
  }
}
