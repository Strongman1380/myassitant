// Vercel serverless doesn't need dotenv - env vars are injected automatically
export const config = {
  port: 3001,
  openaiApiKey: process.env.OPENAI_API_KEY,
};
