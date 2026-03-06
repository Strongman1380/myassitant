import OpenAI from 'openai';
import fs from 'fs';
import { config } from '../config/env.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Call OpenAI GPT-4o-mini with a system prompt and user message
 */
export async function callOpenAI(systemPrompt, userMessage) {
  try {
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
    throw new Error('Failed to communicate with AI');
  }
}

/**
 * Call OpenAI with conversation history
 */
export async function callOpenAIWithHistory(systemPrompt, userMessage, history = []) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to communicate with AI');
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
    throw new Error('Failed to communicate with AI');
  }
}

/**
 * Call OpenAI with Pica tools for connected integrations (social media, data fetching, etc.)
 */
export async function callOpenAIWithPicaTools(systemPrompt, userMessage, history = []) {
  try {
    const { Pica } = await import('@picahq/ai');
    const pica = new Pica(config.picaSecretKey || process.env.PICA_SECRET_KEY);

    const tools = await pica.getTools({ identity: 'brandon-hinrichs' });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0.7,
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls in a loop until no more tool calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      const toolResults = await pica.executeToolCalls(assistantMessage.tool_calls);

      for (const result of toolResults) {
        messages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: JSON.stringify(result.result),
        });
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.7,
      });

      assistantMessage = response.choices[0].message;
    }

    return assistantMessage.content;
  } catch (error) {
    console.error('OpenAI with Pica Error:', error);
    throw new Error(`OpenAI with Pica Error: ${error.message}`);
  }
}

/**
 * Call OpenAI Whisper for audio transcription
 */
export async function callWhisper(audioFilePath) {
  try {
    console.log('📁 Audio file path:', audioFilePath);
    console.log('📊 File exists:', fs.existsSync(audioFilePath));
    if (fs.existsSync(audioFilePath)) {
      const stats = fs.statSync(audioFilePath);
      console.log('📏 File size:', stats.size, 'bytes');
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper API Error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`Whisper API Error: ${error.message}`);
  }
}
