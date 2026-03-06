import { config } from '../config/env.js';

/**
 * Search the web using Google Custom Search API
 * @param {string} query - The search query
 * @param {number} numResults - Number of results to return (max 10)
 * @returns {Promise<Array>} Array of search results
 */
export async function searchWeb(query, numResults = 5) {
  const apiKey = config.googleSearchApiKey;
  const searchEngineId = config.googleSearchEngineId;

  if (!apiKey || !searchEngineId) {
    console.warn('⚠️ Google Search API not configured');
    return null;
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', Math.min(numResults, 10).toString());

    console.log('🔍 Searching web for:', query);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Search API Error:', error);
      throw new Error(error.error?.message || 'Search failed');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Format results
    const results = data.items.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink
    }));

    console.log('✅ Found ' + results.length + ' search results');
    return results;
  } catch (error) {
    console.error('Web search error:', error);
    throw error;
  }
}

/**
 * Format search results for AI context
 * @param {Array} results - Search results from searchWeb
 * @returns {string} Formatted string for AI context
 */
export function formatSearchResultsForAI(results) {
  if (!results || results.length === 0) {
    return 'No search results found.';
  }

  return results.map((r, i) =>
    '[' + (i + 1) + '] ' + r.title + '\n   URL: ' + r.link + '\n   ' + r.snippet
  ).join('\n\n');
}
