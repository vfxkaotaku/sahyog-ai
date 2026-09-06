/**
 * camera.ts — Camera Simulator & OCR Service for BOT-001
 * Processes webcam snapshots, runs OCR text extraction, and logs device activity.
 */

import { Router } from 'express';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/ocr', (req, res) => {
  const { imageBase64, deviceId = 'BOT-001', manualText } = req.body;
  const now = new Date().toISOString();

  // Log captured image event
  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: now,
    deviceId,
    event: `${deviceId} captured document snapshot via webcam`,
    status: 'INFO',
  });

  // Simulated high-accuracy OCR result for rural government documents
  let extractedText = manualText;
  let documentType = 'Government Scheme Document';

  if (!extractedText) {
    extractedText =
`Farmer Equipment Assistance Scheme
Department of Agriculture & Farmers Welfare

Eligibility:
Small and marginal farmers holding 7/12 land extract under 2 hectares

Documents Required:
- Aadhaar Card
- 7/12 Land Record (Satbara Utara)
- Bank Account Passbook
- Equipment Dealer Quotation

Benefits:
50% to 80% subsidy (up to Rs 1,25,000) for tractor and machinery purchase.
Application Portal: agrimachinery.nic.in`;
    documentType = 'Farmer Equipment Subsidy Application / Notice';
  }

  // Log OCR completed event
  db.deviceLogs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    deviceId,
    event: `${deviceId} OCR completed successfully (${documentType})`,
    status: 'SUCCESS',
  });

  return res.json({
    success: true,
    deviceId,
    documentType,
    extractedText,
    confidence: 0.96,
    extractedAt: new Date().toISOString(),
    suggestedChatQuery: 'Tell me about the eligibility, subsidy amount, and application steps for the Farmer Equipment Assistance Scheme shown in this document.',
  });
});

export default router;
