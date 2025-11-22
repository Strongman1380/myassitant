export default function handler(req, res) {
  res.status(200).json({
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasGoogleClient: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not found'
  });
}
