import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNewsletter, loadConfig } from './pipeline/build.js';
import { publishNewsletter } from './publish.js';
import { createMailjet } from './mailjet.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN || '';
const resolveDir = (p, def) => path.resolve(ROOT, p || def);

const env = {
  mediaDir: resolveDir(process.env.MEDIA_DIR, 'media'),
  outputDir: resolveDir(process.env.OUTPUT_DIR, 'output'),
  publicBaseUrl: PUBLIC_BASE_URL,
  sender: { email: process.env.MJ_SENDER_EMAIL, name: process.env.MJ_SENDER_NAME },
  attachMjml: process.env.MJ_ATTACH_MJML === 'true',
};
const mailjet = createMailjet({ apiKey: process.env.MJ_APIKEY_PUBLIC, apiSecret: process.env.MJ_APIKEY_PRIVATE });
const configDir = path.join(ROOT, 'config');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 40 * 1024 * 1024 } });

// Bilder aus den Dokumenten müssen öffentlich erreichbar sein (werden in der E-Mail geladen)
app.use('/media', express.static(env.mediaDir, { maxAge: '365d', immutable: true }));

// Word-Add-in-Manifest mit der richtigen Server-Adresse ausliefern
app.get('/manifest.xml', async (_req, res) => {
  const xml = await readFile(path.join(ROOT, 'addin', 'manifest.xml'), 'utf8');
  res.type('application/xml').send(xml.replaceAll('https://localhost:3000', PUBLIC_BASE_URL));
});

app.use(express.static(path.join(ROOT, 'public')));

function requireToken(req, res, next) {
  if (!ACCESS_TOKEN) return next();
  const given = Buffer.from(String(req.get('x-access-token') || ''));
  const expected = Buffer.from(ACCESS_TOKEN);
  if (given.length === expected.length && timingSafeEqual(given, expected)) return next();
  res.status(401).json({ error: 'Zugangsschlüssel fehlt oder ist falsch.' });
}

function parseRequest(req) {
  if (!req.file) throw Object.assign(new Error('Kein Dokument übergeben.'), { status: 400 });
  if (!/\.docx$/i.test(req.file.originalname || '') && req.file.buffer.subarray(0, 2).toString() !== 'PK')
    throw Object.assign(new Error('Bitte ein Word-Dokument (.docx) hochladen.'), { status: 400 });
  let options = {};
  try {
    options = JSON.parse(req.body.options || '{}');
  } catch {
    throw Object.assign(new Error('Einstellungen konnten nicht gelesen werden.'), { status: 400 });
  }
  return { docx: req.file.buffer, options };
}

app.get('/api/config', requireToken, async (_req, res, next) => {
  try {
    const { brand, ads } = await loadConfig(configDir);
    let lists = [];
    let listError = null;
    if (mailjet) {
      try {
        lists = await mailjet.listContactLists();
      } catch (e) {
        listError = e.message;
      }
    }
    res.json({
      brand: { name: brand.name, newsletterName: brand.newsletterName, colors: brand.colors },
      ads: ads.map(({ id, name, sponsor, default: isDefault }) => ({ id, name, sponsor, default: !!isDefault })),
      mailjetConfigured: !!mailjet,
      lists,
      listError,
      defaultListId: process.env.MJ_DEFAULT_LIST_ID || '',
      sender: env.sender,
    });
  } catch (e) {
    next(e);
  }
});

app.post('/api/preview', requireToken, upload.single('document'), async (req, res, next) => {
  try {
    const { docx, options } = parseRequest(req);
    const config = await loadConfig(configDir);
    const r = await buildNewsletter(docx, options, { ...env, ...config, publishing: false });
    res.json({
      ok: r.ok,
      subject: r.subject,
      preheader: r.preheader,
      slots: r.slots,
      ads: Object.fromEntries(Object.entries(r.adsBySlot).map(([k, v]) => [k, v?.id ?? ''])),
      review: r.review,
      checks: r.checks,
      html: r.html,
      mjml: r.mjml,
      text: r.text,
    });
  } catch (e) {
    next(e);
  }
});

const inFlight = new Set();
app.post('/api/publish', requireToken, upload.single('document'), async (req, res, next) => {
  let key;
  try {
    const { docx, options } = parseRequest(req);
    // Schutz gegen Doppelklick: dasselbe Dokument kann nicht zweimal gleichzeitig produziert werden
    key = createHash('sha256').update(docx).digest('hex');
    if (inFlight.has(key)) return res.status(409).json({ ok: false, error: 'Dieser Newsletter wird gerade schon produziert.' });
    inFlight.add(key);
    const config = await loadConfig(configDir);
    const result = await publishNewsletter({
      docx,
      options,
      env: { ...env, ...config },
      mailjet,
      log: (m) => console.log(`[publish] ${m}`),
    });
    res.status(result.ok ? 200 : 422).json({ ...result, archiveDir: result.archiveDir && path.relative(ROOT, result.archiveDir) });
  } catch (e) {
    next(e);
  } finally {
    if (key) inFlight.delete(key);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Unbekannter Fehler' });
});

app.listen(PORT, () => {
  console.log(`Newsletter-Produktion läuft auf ${PUBLIC_BASE_URL}`);
  console.log(`  Web-Konverter:   ${PUBLIC_BASE_URL}/`);
  console.log(`  Word-Add-in:     ${PUBLIC_BASE_URL}/manifest.xml`);
  console.log(`  Mailjet:         ${mailjet ? 'verbunden' : 'NICHT konfiguriert (Trockenmodus)'}`);
  if (!ACCESS_TOKEN) console.log('  WARNUNG: APP_ACCESS_TOKEN ist leer – die Oberfläche ist ungeschützt.');
});
