/**
 * devices.ts — Multi-Device Chatbot Fleet Management API
 * Supports CRUD, dynamic Device ID routing, status, and activity logs.
 */

import { Router } from 'express';
import { db, DeviceRow } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/devices ─────────────────────────────────────────────────────────
router.get('/', (_req, res) => res.json(db.devices));

// ─── GET /api/devices/logs — All device activity logs ──────────────────────────
router.get('/logs', (req, res) => {
  const { deviceId } = req.query;
  let logs = db.deviceLogs;
  if (deviceId && typeof deviceId === 'string') {
    logs = logs.filter((l) => l.deviceId.toLowerCase() === deviceId.toLowerCase());
  }
  return res.json(logs);
});

// ─── POST /api/devices/logs — Log a device activity event ──────────────────────
router.post('/logs', (req, res) => {
  const { deviceId = 'BOT-001', event, status = 'INFO' } = req.body;
  if (!event) return res.status(400).json({ error: 'event is required' });

  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId,
    event,
    status: status as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
  };

  db.deviceLogs.unshift(logEntry);

  // Update device lastSeen
  const device = db.devices.find((d) => d.deviceId.toLowerCase() === deviceId.toLowerCase());
  if (device) {
    device.lastSeen = logEntry.timestamp;
  }

  return res.status(201).json(logEntry);
});

// ─── POST /api/devices — Add a new Chatbot Device ─────────────────────────────
router.post('/', (req, res) => {
  const {
    deviceId,
    name,
    locationLabel,
    deviceType = 'KIOSK',
    commMethod = 'MQTT',
    mqttServer = 'broker.hivemq.com:1883',
    mqttTopic,
  } = req.body;

  if (!deviceId || !name) {
    return res.status(400).json({ error: 'Device ID and Name are required.' });
  }

  // Check for duplicate Device ID
  const existing = db.devices.find(
    (d) => d.deviceId.toLowerCase() === deviceId.trim().toLowerCase()
  );
  if (existing) {
    return res.status(409).json({ error: `Device ID ${deviceId} already exists.` });
  }

  const newDevice: DeviceRow = {
    id: uuidv4(),
    deviceId: deviceId.trim().toUpperCase(),
    name: name.trim(),
    locationLabel: locationLabel || 'Gram Panchayat Center',
    deviceType: deviceType as any,
    commMethod: commMethod as any,
    mqttServer: mqttServer || 'broker.hivemq.com:1883',
    mqttTopic: mqttTopic || `chatbot/${deviceId.trim().toUpperCase()}`,
    firmwareVersion: '1.2.0',
    status: 'ONLINE',
    internetStatus: 'CONNECTED',
    currentState: 'IDLE',
    wifiRssi: -60,
    lastSeen: new Date().toISOString(),
    knowledgeLastUpdated: '06/09/2026',
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  db.devices.push(newDevice);

  // Log device addition
  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId: newDevice.deviceId,
    event: `${newDevice.deviceId} added to central management system (${newDevice.name})`,
    status: 'SUCCESS',
  });

  return res.status(201).json(newDevice);
});

// ─── PUT /api/devices/:id — Edit / Enable / Disable Chatbot Device ────────────
router.put('/:id', (req, res) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const { name, locationLabel, deviceType, commMethod, mqttServer, mqttTopic, enabled, status } = req.body;

  if (name !== undefined) device.name = name;
  if (locationLabel !== undefined) device.locationLabel = locationLabel;
  if (deviceType !== undefined) device.deviceType = deviceType;
  if (commMethod !== undefined) device.commMethod = commMethod;
  if (mqttServer !== undefined) device.mqttServer = mqttServer;
  if (mqttTopic !== undefined) device.mqttTopic = mqttTopic;
  if (enabled !== undefined) device.enabled = Boolean(enabled);
  if (status !== undefined) device.status = status;

  device.lastSeen = new Date().toISOString();

  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId: device.deviceId,
    event: `${device.deviceId} configuration updated (Enabled: ${device.enabled}, Status: ${device.status})`,
    status: 'INFO',
  });

  return res.json(device);
});

// ─── DELETE /api/devices/:id — Remove Chatbot Device ──────────────────────────
router.delete('/:id', (req, res) => {
  const idx = db.devices.findIndex((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Device not found' });

  const removed = db.devices.splice(idx, 1)[0];

  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId: removed.deviceId,
    event: `${removed.deviceId} removed from central management system`,
    status: 'WARNING',
  });

  return res.json({ success: true, removedId: removed.id, deviceId: removed.deviceId });
});

// ─── POST /api/devices/:id/command — Send command to device ────────────────────
router.post('/:id/command', (req, res) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const { command, payload } = req.body;
  console.log(`[Command] Sent to ${device.deviceId} via ${device.mqttTopic}/command: ${command}`, payload);

  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId: device.deviceId,
    event: `Command "${command}" dispatched to ${device.deviceId}`,
    status: 'INFO',
  });

  return res.json({
    success: true,
    deviceId: device.deviceId,
    command,
    topic: `${device.mqttTopic}/command`,
    note: 'Command routed successfully',
  });
});

export default router;
