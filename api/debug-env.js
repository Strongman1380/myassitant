export default async function handler(req, res) {
  res.status(200).json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleToken: !!process.env.GOOGLE_TOKEN,
    hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    tokenLength: process.env.GOOGLE_TOKEN ? process.env.GOOGLE_TOKEN.length : 0,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'none',
  });
}
