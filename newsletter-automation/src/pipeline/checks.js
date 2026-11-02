// Prüfbericht: alles, was vor dem Versand schiefgehen könnte.
// level: "error" blockiert das Produzieren, "warning" muss man sich anschauen, "info" nur zur Kenntnis.
const PLACEHOLDER_RE = /\b(TODO|TBD|XXX+|Lorem ipsum)\b|\?\?\?|\[\[?(?:hier|link|bild|text)[^\]]*\]?\]/i;

export function runChecks({ model, review, options, mjmlErrors = [], html = '', messages = [], publishing = false, publicBaseUrl = '' }) {
  const checks = [];
  const add = (level, message) => checks.push({ level, message });

  // Korrektorat
  if (review.openComments > 0)
    add(options.ignoreReview ? 'warning' : 'error', `Im Dokument gibt es noch ${review.openComments} offene(n) Kommentar(e).`);
  if (review.trackedChanges > 0)
    add(
      options.ignoreReview ? 'warning' : 'error',
      `Im Dokument gibt es noch ${review.trackedChanges} nicht angenommene Änderung(en) (Änderungen nachverfolgen).`,
    );
  if (publishing && !options.proofreadConfirmed) add('error', 'Bitte bestätigen, dass das Korrektorat abgeschlossen ist.');

  // Struktur
  if (!model.title) add('error', 'Kein Titel gefunden. Die Hauptzeile muss mit der Formatvorlage „Titel“ formatiert sein.');
  const articles = model.sections.filter((s) => s.type === 'article' && s.heading);
  if (articles.length === 0) add('warning', 'Keine Artikel-Überschriften (Formatvorlage „Überschrift 1“) gefunden.');
  articles.filter((a) => a.blocks.length === 0).forEach((a) => add('warning', `Artikel „${strip(a.heading)}“ hat keinen Text.`));

  // Betreff & Preheader
  const subject = (options.subject || '').trim();
  if (!subject) add('error', 'Betreffzeile fehlt.');
  else if (subject.length > 78) add('warning', `Betreffzeile ist mit ${subject.length} Zeichen sehr lang (wird oft abgeschnitten).`);
  if (options.abTest?.enabled) {
    const b = (options.abTest.subjectB || '').trim();
    if (!b) add('error', 'A/B-Test ist aktiv, aber Betreff B fehlt.');
    else if (b === subject) add('error', 'Betreff A und B sind identisch.');
  }
  const preheader = options.preheader ?? model.preheader;
  if (!preheader) add('warning', 'Kein Preheader (Vorschautext). Tipp: Formatvorlage „Untertitel“ unter dem Titel verwenden.');

  // Inhalte
  const allHtml = model.sections.flatMap((s) => (s.type === 'article' ? [s.heading || '', ...s.blocks.map((b) => b.html || b.text || b.caption || '')] : [])).join('\n');
  const placeholder = strip(allHtml).match(PLACEHOLDER_RE);
  if (placeholder) add('warning', `Möglicher Platzhalter im Text gefunden: „${placeholder[0]}“.`);

  const images = model.sections.flatMap((s) => (s.type === 'article' ? s.blocks.filter((b) => b.type === 'image') : []));
  images.filter((i) => !i.alt).forEach((i) => add('warning', `Bild ohne Alternativtext: ${shortUrl(i.src)} (in Word: Rechtsklick → Alternativtext bearbeiten).`));
  if (images.some((i) => i.src?.startsWith('data:'))) add('error', 'Bilder konnten nicht abgelegt werden (keine öffentliche URL).');
  if (/localhost|127\.0\.0\.1/.test(publicBaseUrl) && images.length) {
    const sending = publishing && options.delivery?.mode !== 'archive';
    add(sending ? 'error' : 'warning', 'Bilder würden von „localhost“ geladen – für den Versand muss PUBLIC_BASE_URL eine öffentlich erreichbare Adresse sein.');
  }

  model.links.filter((l) => l.href.startsWith('http://')).forEach((l) => add('warning', `Unverschlüsselter Link (http): ${l.href}`));
  model.warnings.forEach((w) => add('warning', w));

  // Anzeigen
  const slots = model.sections.filter((s) => s.type === 'ad').map((s) => s.slot);
  for (const slot of slots) {
    if (!options.adsBySlot?.[slot]) add('warning', `Werbeplatz „${slot}“ bleibt leer.`);
  }

  // Versand
  if (publishing && options.delivery?.mode === 'schedule') {
    const at = new Date(options.delivery.at);
    if (Number.isNaN(at.getTime())) add('error', 'Versandzeitpunkt fehlt oder ist ungültig.');
    else if (at.getTime() < Date.now() + 2 * 60 * 1000) add('error', 'Versandzeitpunkt liegt in der Vergangenheit (oder in weniger als 2 Minuten).');
  }
  if (publishing && options.delivery?.mode !== 'archive' && !options.listId) add('error', 'Keine Empfängerliste gewählt.');

  // Technik
  mjmlErrors.forEach((e) => add('error', `MJML: ${e.formattedMessage || e.message}`));
  const kb = Buffer.byteLength(html, 'utf8') / 1024;
  if (kb > 100) add('warning', `HTML ist ${kb.toFixed(0)} KB groß – Gmail kürzt E-Mails ab ca. 102 KB.`);
  messages
    .filter((m) => /unrecognised|unrecognized/i.test(m.message))
    .forEach((m) => add('info', `Unbekannte Formatvorlage (als normaler Text übernommen): ${m.message.replace(/^Unrecognised (paragraph|run) style: /i, '')}`));

  return checks;
}

const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const shortUrl = (u = '') => (u.length > 60 ? `${u.slice(0, 57)}…` : u);
