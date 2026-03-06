import express from 'express';
import { callOpenAI, callOpenAIForJSON, callOpenAIWithHistory, callOpenAIWithPicaTools } from '../services/openai.js';
import { config } from '../config/env.js';
import { searchWeb, formatSearchResultsForAI } from '../services/webSearch.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Search memories for relevant context
async function searchMemories(query) {
  try {
    // Use AI to extract search terms from the query
    const searchTermsPrompt = `Extract 2-4 key search terms from this message that might match personal memories/facts.
Message: "${query}"
Return JSON: {"terms": ["term1", "term2"]}
Focus on: work, job, name, email, family, location, preferences.`;

    const result = await callOpenAIForJSON(searchTermsPrompt, query);
    const terms = result.terms || [];

    if (terms.length === 0) return [];

    console.log('🔎 Searching memories for terms:', terms);

    // Build a simple text search query for each term
    let allMemories = [];

    for (const term of terms) {
      const { data, error } = await supabase
        .from('memories')
        .select('content, category')
        .ilike('content', '%' + term + '%')
        .limit(5);

      if (!error && data) {
        allMemories = allMemories.concat(data);
      }
    }

    // Deduplicate by content
    const seen = new Set();
    const uniqueMemories = allMemories.filter(m => {
      if (seen.has(m.content)) return false;
      seen.add(m.content);
      return true;
    });

    console.log('🧠 Found', uniqueMemories.length, 'unique memories');
    return uniqueMemories.slice(0, 10);
  } catch (error) {
    console.error('Error searching memories:', error);
    return [];
  }
}

// Format memories for AI context
function formatMemoriesForAI(memories) {
  if (!memories || memories.length === 0) return '';

  const formatted = memories.map(m => `- ${m.content}`).join('\n');
  return `\n\nPERSONAL KNOWLEDGE ABOUT BRANDON:\n${formatted}`;
}

// POST /api/ai/assistant
// Body: { message: string }
router.post('/assistant', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Build context from recent conversation for search query optimization
    const recentContext = history.slice(-4).map(m => m.role + ': ' + m.content).join('\n');

    // Step 1: Determine if we need to search the web
    const needsSearchPrompt = `You are a search query optimizer. Analyze the user's message IN CONTEXT of the recent conversation and determine if you need to search the web.

Recent conversation:
${recentContext}

Current message: ${message}

Return a JSON response with:
{
  "needsSearch": true/false,
  "searchQuery": "optimized search query if needed, or null"
}

IMPORTANT:
- Use conversation context to understand what the user is asking about
- If user says "the weather" or just a location name, look at previous messages to understand the full request
- Generate SPECIFIC search queries that will find the exact information requested:
  - For weather: "weather forecast [location]" or "[location] weather today"
  - For news: "[topic] news today" or "latest [topic] news"
  - For stocks: "[symbol] stock price today"
  - For sports: "[team] score today" or "[sport] results"

You should search the web for:
- Weather forecasts (ALWAYS search for weather requests)
- Current events, news, recent happenings
- Stock prices, sports scores, real-time data
- Specific facts about recent events
- Product information, pricing, availability

You do NOT need to search for:
- General knowledge (history, science facts, how things work)
- Personal assistance (scheduling, reminders, writing help)
- Conversational messages (greetings, thanks)
- Creative tasks (writing, brainstorming)`;

    const searchDecision = await callOpenAIForJSON(needsSearchPrompt, message);

    let searchContext = '';
    let searchResults = null;

    if (searchDecision.needsSearch && searchDecision.searchQuery) {
      console.log('🔍 Assistant needs web search for:', searchDecision.searchQuery);
      try {
        searchResults = await searchWeb(searchDecision.searchQuery);
        if (searchResults && searchResults.length > 0) {
          searchContext = '\n\nWEB SEARCH RESULTS:\n' + formatSearchResultsForAI(searchResults);
          console.log('✅ Found', searchResults.length, 'results');
        }
      } catch (searchError) {
        console.error('Search failed:', searchError.message);
        // Continue without search results
      }
    }

    // Step 2: Search personal memories for context
    let memoryContext = '';
    try {
      const memories = await searchMemories(message);
      if (memories.length > 0) {
        memoryContext = formatMemoriesForAI(memories);
        console.log('🧠 Found', memories.length, 'relevant memories');
      }
    } catch (memError) {
      console.error('Memory search failed:', memError.message);
    }

    // Step 3: Generate the response with all context
    const systemPrompt = `You are a helpful personal assistant for Brandon Hinrichs. You help with various tasks including:
- Answering questions
- Providing information and advice
- Helping plan and organize tasks
- General conversation and assistance

Be friendly, helpful, and concise in your responses. Use a conversational but professional tone.

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${memoryContext ? '\nYou have access to personal knowledge about Brandon below. Use this to personalize your responses and remember details about him.' + memoryContext : ''}
${searchContext ? '\nYou have access to recent web search results below. Use them to provide accurate, up-to-date information. Cite sources when relevant.' + searchContext : ''}`;

    let response;
    if (config.picaSecretKey) {
      response = await callOpenAIWithPicaTools(systemPrompt, message, history);
    } else {
      response = await callOpenAIWithHistory(systemPrompt, message, history);
    }

    res.json({
      success: true,
      message: response.trim(),
      searchedWeb: searchResults !== null && searchResults.length > 0
    });
  } catch (error) {
    console.error('Error in /api/ai/assistant:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/text
// Body: { message: string }
router.post('/text', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const systemPrompt = `You are a professional text message assistant. Your job is to rewrite the user's message in a casual but professional tone while fixing any grammar, spelling, or punctuation errors. The message should sound natural and friendly, but still maintain a professional quality. Return ONLY the rewritten message with no explanations, quotes, or additional text.`;

    const rewrittenMessage = await callOpenAI(systemPrompt, message);

    res.json({
      success: true,
      original: message,
      rewritten: rewrittenMessage.trim()
    });
  } catch (error) {
    console.error('Error in /api/ai/text:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/email
// Body: { prompt: string }
router.post('/email', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const systemPrompt = `You are an email writing assistant for Brandon Hinrichs. Based on the user's description, generate a complete, well-formatted email with a personal, genuine touch.

Return your response as a JSON object with this exact format:
{
  "type": "email",
  "to": "recipient email or name if mentioned, empty string if unknown",
  "subject": "appropriate subject line",
  "body": "complete email body with greeting, content, and closing"
}

IMPORTANT EMAIL STYLE GUIDELINES:
- Start with "Hi, [Name]." (NOT "Dear [Name]" or "I hope this finds you well")
- Keep the tone friendly yet professional - conversational but polished
- Be genuine and engaging - avoid clichés and generic phrases
- Fix all grammar, spelling, and punctuation errors
- Expand on any points that need further explanation or context
- Use natural, warm language that feels personal
- End with "Thanks," on one line, then "Brandon Hinrichs" on the next line
- Use proper paragraph breaks for readability

Example format:
Hi, [Name].

[Opening that's genuine and relevant to the context]

[Body paragraphs with clear explanations and details]

Thanks,
Brandon Hinrichs`;

    const emailData = await callOpenAIForJSON(systemPrompt, prompt);

    res.json(emailData);
  } catch (error) {
    console.error('Error in /api/ai/email:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/calendar
// Body: { prompt: string }
router.post('/calendar', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const systemPrompt = `You are a calendar event parser for a user in Central Time (America/Chicago timezone). Parse the user's natural language description into a structured calendar event.

Return your response as a JSON object with this exact format:
{
  "type": "calendar",
  "title": "brief event title",
  "notes": "additional details or null",
  "start": "ISO-8601 datetime string in Central Time",
  "end": "ISO-8601 datetime string in Central Time",
  "reminderMinutesBefore": number or null
}

Important:
- Use ISO-8601 format for dates WITHOUT the Z (e.g., "2025-11-21T13:00:00" NOT "2025-11-21T13:00:00.000Z")
- The times should be in Central Time (America/Chicago), NOT UTC
- Today's date in Central Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
- Calculate dates relative to today
- When user says "3pm" they mean 3pm Central Time, so use "2025-11-21T15:00:00" (not UTC)
- If no end time specified, default to 1 hour after start
- If no reminder specified, set to null
- If you cannot parse the event, return: {"error": "Could not parse event"}`;

    const calendarData = await callOpenAIForJSON(systemPrompt, prompt);

    if (calendarData.error) {
      return res.status(400).json(calendarData);
    }

    res.json(calendarData);
  } catch (error) {
    console.error('Error in /api/ai/calendar:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
