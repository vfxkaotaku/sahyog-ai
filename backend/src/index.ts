/**
 * SAHYOG AI Backend — index.ts
 * Express + Socket.IO + MQTT Server
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import chatRouter from './api/routes/chat';
import sourcesRouter from './api/routes/sources';
import devicesRouter from './api/routes/devices';
import cameraRouter from './api/routes/camera';
import printerRouter from './api/routes/printer';
import portalRouter from './api/routes/portal';
import conversationsRouter from './api/routes/conversations';
import ttsRouter from './api/routes/tts';
import { initMqttBridge } from './services/mqtt/mqttBridge';
import { initDatabase } from './db/database';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment.' },
});
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/portal', portalRouter);
app.use('/api/chat', chatRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/camera', cameraRouter);
app.use('/api/printer', printerRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/tts', ttsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── Socket.IO: device event relay ───────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('device_command', (data: { deviceId: string; command: string; payload?: unknown }) => {
    console.log(`[Socket.IO] Command to ${data.deviceId}:`, data.command);
    // Forward to MQTT (if bridge is live)
    io.emit(`device_ack_${data.deviceId}`, { command: data.command, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Export io for MQTT bridge
export { io };

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function bootstrap() {
  await initDatabase();
  initMqttBridge(io);

  httpServer.listen(PORT, () => {
    console.log(`\n🌿 SAHYOG AI Backend running at http://localhost:${PORT}`);
    console.log(`   CORS:       ${CORS_ORIGIN}`);
    console.log(`   MQTT:       ${process.env.MQTT_BROKER_URL}`);
    console.log(`   Env:        ${process.env.NODE_ENV}`);
    console.log(`   Health:     http://localhost:${PORT}/api/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
