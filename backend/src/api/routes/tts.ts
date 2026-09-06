/**
 * tts.ts — Dynamic Text-to-Speech Streaming for ESP32 Physical Speaker
 * Synthesizes dynamic Gemini AI answers into raw 8-bit unsigned PCM (11025 Hz).
 * Streams directly into ESP32 DAC GPIO 25 over HTTP.
 * Supports Marathi (mr), Hindi (hi), and English (en).
 */

import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

router.get('/pcm', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'hi';
  const rawText = (req.query.text as string) || 'नमस्ते';

  // Clean text: remove markdown symbols, brackets, asterisks, URLs
  const cleanText = rawText
    .replace(/[#*`_\[\]()]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300); // Up to ~300 chars for prompt, natural 10-15s response

  if (!cleanText) {
    res.status(400).send('Empty text');
    return;
  }

  const scriptPath = path.resolve(__dirname, '../../../../backend/scripts/tts_pcm.py');

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  const py = spawn('python', [scriptPath, lang, cleanText]);

  py.stdout.pipe(res);

  py.stderr.on('data', (data) => {
    console.warn(`[TTS Python stderr]: ${data}`);
  });

  py.on('error', (err) => {
    console.error('[TTS Spawn error]:', err);
    if (!res.headersSent) {
      res.status(500).send('TTS error');
    }
  });
});

export default router;
