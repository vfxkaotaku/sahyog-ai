/**
 * chat.ts — POST /api/chat
 * Multi-device AI chatbot response engine backed by synchronized government schemes.
 */

import { Router } from 'express';
import { queryRag } from '../../services/ai/ragService';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { publishDeviceCommand } from '../../services/mqtt/mqttBridge';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { query, language = 'en', deviceId = 'BOT-001' } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }

    // Signal hardware kiosk node in real-time
    publishDeviceCommand(deviceId, 'THINKING');

    // Query RAG engine grounded in synced schemes
    const ragResult = await queryRag(query, language);
    const now = new Date().toISOString();
    const convId = `c-${Date.now().toString().slice(-6)}`;

    // Signal hardware node to speak
    publishDeviceCommand(deviceId, 'SPEAK', {
      scheme: ragResult.scheme?.name || 'Rural Assistance',
    });

    // Store in conversations history
    db.conversations.unshift({
      id: uuidv4(),
      conversationId: convId,
      deviceId,
      userQuestion: query,
      aiResponse: ragResult.answer,
      schemeName: ragResult.scheme?.name,
      schemeId: ragResult.scheme?.schemeId,
      informationSource: 'Demo Government Portal',
      timestamp: now,
    });

    // Log device activity
    db.deviceLogs.unshift({
      id: uuidv4(),
      timestamp: now,
      deviceId,
      event: `${deviceId} answered inquiry (${ragResult.scheme ? ragResult.scheme.name : 'General inquiry'})`,
      status: 'SUCCESS',
    });

    // Update device lastSeen
    const device = db.devices.find((d) => d.deviceId.toLowerCase() === deviceId.toLowerCase());
    if (device) {
      device.lastSeen = now;
    }

    return res.json({
      ...ragResult,
      deviceId,
      conversationId: convId,
      language,
    });
  } catch (err) {
    console.error('[/api/chat error]', err);
    return res.status(500).json({ error: 'Internal RAG retrieval error' });
  }
});

export default router;
