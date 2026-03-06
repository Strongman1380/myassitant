import express from 'express';
import {
  generateAuthKitToken,
  getConnectedIntegrations,
  postToSocialMedia,
  fetchFromIntegration,
} from '../services/pica.js';

const router = express.Router();

// POST /api/pica/token - Generate AuthKit token for the frontend widget
router.post('/token', async (req, res) => {
  try {
    const token = await generateAuthKitToken();
    res.json({ token });
  } catch (error) {
    console.error('Error generating Pica token:', error);
    res.status(500).json({ error: error.message || 'Failed to generate token' });
  }
});

// GET /api/pica/integrations - List connected integrations
router.get('/integrations', async (req, res) => {
  try {
    const integrations = await getConnectedIntegrations();
    res.json({ success: true, integrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch integrations' });
  }
});

// POST /api/pica/post/social - Unified social media posting
router.post('/post/social', async (req, res) => {
  try {
    const { platform, message, imageUrl, connectionKey, platformConfig } = req.body;

    if (!platform || !message || !connectionKey) {
      return res.status(400).json({ error: 'Missing required fields: platform, message, connectionKey' });
    }

    const result = await postToSocialMedia({ platform, message, imageUrl, connectionKey, platformConfig });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error posting to social media:', error);
    res.status(500).json({ error: error.message || 'Failed to post' });
  }
});

// POST /api/pica/fetch - Fetch data from a connected integration
router.post('/fetch', async (req, res) => {
  try {
    const { connectionKey, method = 'GET', path } = req.body;

    if (!connectionKey || !path) {
      return res.status(400).json({ error: 'Missing required fields: connectionKey, path' });
    }

    const result = await fetchFromIntegration(connectionKey, method, path);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error fetching from integration:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch data' });
  }
});

export default router;
