/**
 * portal.ts — Demo Government Information Portal API & Sync Service
 * Exposes structured scheme data and supports central synchronization.
 */

import { Router } from 'express';
import { db, generateChunksFromSchemes } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/portal/schemes ──────────────────────────────────────────────────
router.get('/schemes', (_req, res) => {
  return res.json({
    portalName: 'DEMO GOVERNMENT INFORMATION PORTAL',
    disclaimer: 'This is a simulated government information portal created for prototype testing. The information shown here is dummy data and is not official government information.',
    totalSchemes: db.schemes.length,
    lastUpdated: '06/09/2026',
    schemes: db.schemes,
  });
});

// ─── GET /api/portal/schemes/:id ──────────────────────────────────────────────
router.get('/schemes/:id', (req, res) => {
  const scheme = db.schemes.find(
    (s) => s.schemeId.toLowerCase() === req.params.id.toLowerCase()
  );
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }
  return res.json(scheme);
});

// ─── GET /api/portal/status ───────────────────────────────────────────────────
router.get('/status', (_req, res) => {
  const ds = db.dataSources[0];
  return res.json({
    portalName: 'DEMO GOVERNMENT INFORMATION PORTAL',
    dataSourceName: ds?.name || 'Demo Government Information Portal API',
    dataSourceUrl: ds?.url || 'http://localhost:3001/api/portal/schemes',
    dataSourceType: ds?.type || 'PORTAL_API',
    syncStatus: ds?.syncStatus || 'SYNCED',
    lastSync: ds?.lastSync || new Date().toISOString(),
    totalSchemes: db.schemes.length,
    totalChunks: db.chunks.length,
  });
});

// ─── POST /api/portal/sync ────────────────────────────────────────────────────
router.post('/sync', (req, res) => {
  const { deviceId = 'BOT-001' } = req.body;
  const now = new Date().toISOString();

  // Update Data Source status
  if (db.dataSources[0]) {
    db.dataSources[0].syncStatus = 'SYNCING';
  }

  // Generate updated chunks from all current schemes
  const newChunks = generateChunksFromSchemes(db.schemes);
  db.chunks = newChunks;

  // Update source record
  if (db.sources[0]) {
    db.sources[0].lastFetched = now;
    db.sources[0].chunkCount = newChunks.length;
    db.sources[0].status = 'SUCCESSFUL';
  }

  // Update Data Source status to SYNCED
  if (db.dataSources[0]) {
    db.dataSources[0].syncStatus = 'SYNCED';
    db.dataSources[0].lastSync = now;
    db.dataSources[0].schemeCount = db.schemes.length;
  }

  // Update device knowledge timestamp
  const targetDev = db.devices.find((d) => d.deviceId === deviceId);
  if (targetDev) {
    targetDev.knowledgeLastUpdated = '06/09/2026';
    targetDev.lastSeen = now;
  }

  // Log sync event
  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: now,
    deviceId,
    event: `${deviceId} synchronized ${db.schemes.length} schemes (${newChunks.length} chunks) from Demo Government Portal`,
    status: 'SUCCESS',
  });

  console.log(`[Sync] Synchronized ${db.schemes.length} schemes into ${newChunks.length} RAG chunks for ${deviceId}.`);

  return res.json({
    success: true,
    message: 'Government data successfully synchronized into central database and RAG knowledge index.',
    schemeCount: db.schemes.length,
    chunkCount: newChunks.length,
    lastSync: now,
    targetDevice: deviceId,
  });
});

export default router;
