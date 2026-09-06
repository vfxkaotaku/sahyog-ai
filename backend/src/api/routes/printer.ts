/**
 * printer.ts — Thermal POS Receipt Printer API for Chatbot Devices
 * Generates device-specific print jobs and formatted thermal receipt data.
 */

import { Router } from 'express';
import { db, PrintJobRow } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/printer/jobs — List print jobs ──────────────────────────────────
router.get('/jobs', (req, res) => {
  const { deviceId } = req.query;
  let jobs = db.printJobs;
  if (deviceId && typeof deviceId === 'string') {
    jobs = jobs.filter((j) => j.deviceId.toLowerCase() === deviceId.toLowerCase());
  }
  return res.json(jobs);
});

// ─── POST /api/printer/jobs — Dispatch print job from BOT-001 ─────────────────
router.post('/jobs', (req, res) => {
  const {
    deviceId = 'BOT-001',
    conversationId = `c-${Date.now().toString().slice(-6)}`,
    userQuestion,
    chatbotAnswer,
    schemeName = 'Government Assistance Scheme',
    eligibility = 'Rural citizens & farmers',
    benefits = 'Direct financial & technical assistance',
    documentsRequired = ['Aadhaar Card', 'Land Record / ID', 'Bank Passbook'],
    applicationProcess = 'Apply online at official portal or visit Gram Panchayat',
    informationSource = 'Demo Government Portal',
    lastUpdated = '06/09/2026',
  } = req.body;

  if (!userQuestion || !chatbotAnswer) {
    return res.status(400).json({ error: 'userQuestion and chatbotAnswer are required' });
  }

  const newJob: PrintJobRow = {
    id: uuidv4(),
    deviceId,
    conversationId,
    userQuestion,
    chatbotAnswer,
    schemeName,
    eligibility,
    benefits,
    documentsRequired: Array.isArray(documentsRequired) ? documentsRequired : [documentsRequired],
    applicationProcess,
    informationSource,
    lastUpdated,
    status: 'PRINTED',
    createdAt: new Date().toISOString(),
  };

  db.printJobs.unshift(newJob);

  // Log device event
  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: newJob.createdAt,
    deviceId,
    event: `${deviceId} print requested (${schemeName})`,
    status: 'SUCCESS',
  });

  // Also log print completed
  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId,
    event: `${deviceId} print completed successfully`,
    status: 'INFO',
  });

  return res.status(201).json({
    success: true,
    message: `Print job successfully created for ${deviceId}`,
    job: newJob,
  });
});

// ─── POST /api/printer/receipt — Render raw thermal receipt ───────────────────
router.post('/receipt', (req, res) => {
  const {
    deviceId = 'BOT-001',
    userQuestion,
    chatbotAnswer,
    schemeName,
    eligibility,
    benefits,
    documentsRequired,
    informationSource = 'Demo Government Portal',
    lastUpdated = '06/09/2026',
  } = req.body;

  const receiptId = `RCPT-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-GB');

  const receiptText = `
================================
       GOVERNMENT ASSISTANT
              DEMO
================================

DEVICE: ${deviceId}
DATE: ${dateStr}
RECEIPT ID: ${receiptId}

QUESTION:
${userQuestion || 'General Inquiry'}

--------------------------------

SOLUTION:

${schemeName || 'Government Scheme'}

ELIGIBILITY:
${eligibility || 'Eligible citizens'}

BENEFITS:
${benefits || 'Govt subsidy & support'}

DOCUMENTS:
${(documentsRequired || []).join('\n') || 'Aadhaar, Land Record, Bank Account'}

--------------------------------

SOURCE:
${informationSource}

LAST UPDATED:
${lastUpdated}

================================
`;

  return res.json({
    success: true,
    receiptId,
    deviceId,
    receiptText,
    generatedAt: new Date().toISOString(),
  });
});

// ─── POST /api/notification/whatsapp — Send receipt to WhatsApp ───────────────
router.post('/whatsapp', (req, res) => {
  const { phone, deviceId = 'BOT-001', schemeName } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId,
    event: `${deviceId} dispatched WhatsApp receipt to ${phone} (${schemeName})`,
    status: 'SUCCESS',
  });

  return res.json({
    success: true,
    phone,
    deviceId,
    message: `Receipt dispatched via WhatsApp gateway to ${phone}`,
    dispatchedAt: new Date().toISOString(),
  });
});

export default router;
