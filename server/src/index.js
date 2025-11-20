import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import aiRoutes from './routes/ai.js';
import memoryRoutes from './routes/memory.js';
import whisperRoutes from './routes/whisper.js';
import calendarRoutes from './routes/calendar.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/whisper', whisperRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST http://localhost:${config.port}/api/ai/text`);
  console.log(`   - POST http://localhost:${config.port}/api/ai/email`);
  console.log(`   - POST http://localhost:${config.port}/api/ai/calendar`);
  console.log(`   - POST http://localhost:${config.port}/api/whisper/transcribe`);
  console.log(`   - POST http://localhost:${config.port}/api/calendar/create`);
  console.log(`   - GET  http://localhost:${config.port}/api/calendar/auth-status`);
  console.log(`   - POST http://localhost:${config.port}/api/memory/add`);
  console.log(`   - GET  http://localhost:${config.port}/api/memory/list`);
});
