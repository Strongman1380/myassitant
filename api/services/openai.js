import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Call OpenAI GPT-4o-mini with a system prompt and user message
 */
export async function callOpenAI(systemPrompt, userMessage) {
  try {
    console.log('Calling OpenAI with key:', process.env.OPENAI_API_KEY?.substring(0, 20));
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    console.error('Error status:', error?.status);
    console.error('Error message:', error?.message);
    console.error('Error type:', error?.type);
    throw new Error(`OpenAI API Error: ${error?.message || error?.status || 'Unknown error'}`);
  }
}

/**
 * Call OpenAI and expect a JSON response
 */
export async function callOpenAIForJSON(systemPrompt, userMessage) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    console.error('Error status:', error?.status);
    console.error('Error message:', error?.message);
    throw new Error(`OpenAI API Error: ${error?.message || error?.status || 'Unknown error'}`);
  }
}

/**
 * Call OpenAI Whisper for audio transcription
 */
export async function callWhisper(audioFilePath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper API Error:', error);
    throw new Error('Failed to transcribe audio');
  }
}
