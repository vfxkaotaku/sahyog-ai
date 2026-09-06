/** sources.ts — GET/POST/DELETE /api/sources */
import { Router } from 'express';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const ALLOWED_DOMAINS = ['.gov.in', '.nic.in', 'nabard.org', 'mscs.dac.gov.in', 'pfms.nic.in'];

function isAllowed(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return ALLOWED_DOMAINS.some((d) => h.endsWith(d) || h === d.replace(/^\./, ''));
  } catch { return false; }
}

router.get('/', (_req, res) => res.json(db.sources));

router.post('/', (req, res) => {
  const { name, department, url, sourceType = 'WEBSITE', language = 'hi', category = 'General' } = req.body;
  if (!url || !isAllowed(url)) {
    return res.status(400).json({ error: 'URL not in government domain whitelist (.gov.in, .nic.in)' });
  }
  const src = {
    id: uuidv4(), name: name ?? new URL(url).hostname, department: department ?? 'Government of India',
    url, sourceType, language, category, isVerifiedSource: false, enabled: true,
    status: 'NEEDS_REVIEW', lastFetched: null, chunkCount: 0, createdAt: new Date().toISOString(),
  };
  db.sources.push(src);
  return res.status(201).json(src);
});

router.delete('/:id', (req, res) => {
  const idx = db.sources.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.sources.splice(idx, 1);
  return res.json({ success: true });
});

router.post('/:id/fetch', async (req, res) => {
  const src = db.sources.find((s) => s.id === req.params.id);
  if (!src) return res.status(404).json({ error: 'Not found' });
  src.status = 'FETCHING';
  // Simulate fetch + chunking delay
  setTimeout(() => {
    src.status = 'SUCCESSFUL';
    src.lastFetched = new Date().toISOString();
    src.chunkCount = Math.floor(Math.random() * 40) + 10;
  }, 3000);
  return res.json({ message: `Fetch initiated for ${src.name}`, status: 'FETCHING' });
});

export default router;
