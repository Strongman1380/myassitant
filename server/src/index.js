import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import aiRoutes from './routes/ai.js';
import memoryRoutes from './routes/memory.js';
import whisperRoutes from './routes/whisper.js';
import calendarRoutes from './routes/calendar.js';
import driveRoutes from './routes/drive.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');

// Helper to check if the built client exists (used for non-Vercel, single-bundle hosting)
const hasClientDist = fs.existsSync(path.join(clientDistPath, 'index.html'));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/whisper', whisperRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/drive', driveRoutes);

// Serve static files only if the built client is present
if (hasClientDist) {
  app.use(express.static(clientDistPath));

  // The "catchall" handler: for any non-API route, serve the client app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the app for serverless environments (e.g., Vercel)
export default app;

// Start server locally only when not running in a serverless environment
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`✅ Server running on http://localhost:${config.port}`);
  });
}
