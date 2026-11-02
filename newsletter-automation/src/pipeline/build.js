// Gesamte Pipeline: .docx → Modell → MJML → HTML (+ Text) → Prüfbericht
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import mjml2html from 'mjml';
import { docxToHtml, inspectReviewState } from './docx.js';
import { htmlToModel } from './structure.js';
import { buildMjml } from './mjml.js';
import { buildText } from './text.js';
import { runChecks } from './checks.js';

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

export async function loadConfig(configDir) {
  const [brand, ads] = await Promise.all([
    readFile(path.join(configDir, 'brand.json'), 'utf8').then(JSON.parse),
    readFile(path.join(configDir, 'ads.json'), 'utf8').then(JSON.parse),
  ]);
  return { brand, ads: ads.ads || [] };
}

export function imageStore({ mediaDir, publicBaseUrl }) {
  return async ({ buffer, contentType }) => {
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24);
    const file = `${hash}.${EXT[contentType] || 'bin'}`;
    await mkdir(mediaDir, { recursive: true });
    await writeFile(path.join(mediaDir, file), buffer);
    return `${publicBaseUrl.replace(/\/$/, '')}/media/${file}`;
  };
}

/** Slot-Auswahl aus der Oberfläche (Slot → Anzeigen-ID) in Anzeigen-Objekte auflösen. */
export function resolveAds(slots, selection = {}, inventory = []) {
  const fallback = inventory.find((a) => a.default) || null;
  const result = {};
  for (const slot of slots) {
    const chosen = selection[slot];
    if (chosen === undefined) result[slot] = fallback; // nichts gewählt → Standard-Anzeige
    else if (chosen === '' || chosen === null) result[slot] = null; // bewusst leer
    else result[slot] = inventory.find((a) => a.id === chosen) || null;
  }
  return result;
}

/**
 * @param {Buffer} docx
 * @param {object} options  Einstellungen aus der Oberfläche (subject, preheader, ads, delivery, abTest, …)
 * @param {object} env      { brand, ads, mediaDir, publicBaseUrl, publishing }
 */
export async function buildNewsletter(docx, options, env) {
  const { brand, ads: inventory } = env;
  const [review, converted] = await Promise.all([
    inspectReviewState(docx),
    docxToHtml(docx, { storeImage: imageStore(env), styleMap: brand.styleMap || [] }),
  ]);
  const model = htmlToModel(converted.html);

  const slots = model.sections.filter((s) => s.type === 'ad').map((s) => s.slot);
  const adsBySlot = resolveAds(slots, options.ads, inventory);
  const subjectSuggestion = model.title ? model.title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';
  const resolvedOptions = {
    ...options,
    subject: options.subject?.trim() || subjectSuggestion,
    preheader: options.preheader?.trim() || model.preheader || '',
    adsBySlot,
  };

  const sendDate = options.delivery?.mode === 'schedule' && options.delivery.at ? new Date(options.delivery.at) : new Date();
  const mjml = buildMjml(model, {
    brand,
    adsBySlot,
    preheader: resolvedOptions.preheader,
    date: Number.isNaN(sendDate.getTime()) ? new Date() : sendDate,
  });
  const compiled = await mjml2html(mjml, { validationLevel: 'soft', keepComments: false });
  const text = buildText(model, { brand, adsBySlot });

  const checks = runChecks({
    model,
    review,
    options: resolvedOptions,
    mjmlErrors: compiled.errors,
    html: compiled.html,
    messages: converted.messages,
    publishing: !!env.publishing,
    publicBaseUrl: env.publicBaseUrl,
  });

  return {
    model,
    review,
    slots,
    subject: resolvedOptions.subject,
    preheader: resolvedOptions.preheader,
    adsBySlot,
    mjml,
    html: compiled.html,
    text,
    checks,
    ok: !checks.some((c) => c.level === 'error'),
  };
}
