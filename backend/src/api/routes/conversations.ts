/**
 * conversations.ts — API for storing and retrieving chatbot conversations
 */

import { Router } from 'express';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/conversations ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { deviceId } = req.query;
  let convs = db.conversations;
  if (deviceId && typeof deviceId === 'string') {
    convs = convs.filter((c) => c.deviceId.toLowerCase() === deviceId.toLowerCase());
  }
  return res.json(convs);
});

// ─── POST /api/conversations ──────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { deviceId = 'BOT-001', userQuestion, aiResponse, schemeName, schemeId, informationSource } = req.body;
  if (!userQuestion || !aiResponse) {
    return res.status(400).json({ error: 'userQuestion and aiResponse are required' });
  }

  const record = {
    id: uuidv4(),
    conversationId: `c-${Date.now().toString().slice(-6)}`,
    deviceId,
    userQuestion,
    aiResponse,
    schemeName: schemeName || undefined,
    schemeId: schemeId || undefined,
    informationSource: informationSource || 'Demo Government Portal',
    timestamp: new Date().toISOString(),
  };

  db.conversations.unshift(record);
  return res.status(201).json(record);
});

export default router;
