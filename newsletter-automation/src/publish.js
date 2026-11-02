// "Newsletter produzieren": bauen → prüfen → ablegen → an Mailjet übergeben → Versand planen → nachprüfen.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildNewsletter } from './pipeline/build.js';
import { shuffle } from './mailjet.js';

function slugify(s) {
  return (
    String(s || 'newsletter')
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'newsletter'
  );
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * @param {object} p
 * @param {Buffer} p.docx
 * @param {object} p.options  { subject, preheader, ads, listId, abTest:{enabled, subjectB}, delivery:{mode:'archive'|'draft'|'schedule'|'now', at}, testEmails:[], proofreadConfirmed, ignoreReview, campaignTitle }
 * @param {object} p.env      { brand, ads, mediaDir, publicBaseUrl, outputDir, sender:{email,name}, attachMjml }
 * @param {object|null} p.mailjet  createMailjet(...) oder null (Trockenmodus)
 */
export async function publishNewsletter({ docx, options, env, mailjet, log = () => {} }) {
  const built = await buildNewsletter(docx, options, { ...env, publishing: true });
  if (!built.ok) return { ok: false, stage: 'checks', checks: built.checks };

  const mode = options.delivery?.mode || 'draft';
  const title = options.campaignTitle?.trim() || `${built.subject} (${new Date().toLocaleDateString('de-DE')})`;
  const archiveDir = path.join(env.outputDir, `${stamp()}_${slugify(built.subject)}`);
  await mkdir(archiveDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(archiveDir, 'newsletter.mjml'), built.mjml),
    writeFile(path.join(archiveDir, 'newsletter.html'), built.html),
    writeFile(path.join(archiveDir, 'newsletter.txt'), built.text),
    writeFile(path.join(archiveDir, 'quelle.docx'), docx),
  ]);

  const protocol = {
    createdAt: new Date().toISOString(),
    title,
    subject: built.subject,
    preheader: built.preheader,
    options: { ...options, testEmails: options.testEmails },
    ads: Object.fromEntries(Object.entries(built.adsBySlot).map(([k, v]) => [k, v?.id ?? null])),
    checks: built.checks,
    mailjet: null,
  };
  const saveProtocol = () => writeFile(path.join(archiveDir, 'protokoll.json'), JSON.stringify(protocol, null, 2));
  await saveProtocol();

  if (mode === 'archive') return { ok: true, stage: 'archived', archiveDir, checks: built.checks, mode };
  if (!mailjet) {
    return {
      ok: true,
      stage: 'archived',
      dryRun: true,
      archiveDir,
      checks: built.checks,
      mode,
      message: 'Mailjet ist nicht konfiguriert (MJ_APIKEY_PUBLIC/PRIVATE fehlen) – Newsletter wurde nur abgelegt.',
    };
  }

  const steps = [];
  const step = (msg) => {
    steps.push({ at: new Date().toISOString(), msg });
    log(msg);
  };
  const variants = [];
  protocol.mailjet = { steps, variants };

  try {
    // 1) Empfänger bestimmen (bei A/B-Test: Liste zufällig 50/50 aufteilen)
    if (options.abTest?.enabled) {
      step('A/B-Test: Empfängerliste wird geladen und zufällig aufgeteilt …');
      const emails = shuffle(await mailjet.listSubscribedEmails(options.listId));
      if (emails.length < 2) throw new Error('Die gewählte Liste hat zu wenige aktive Empfänger für einen A/B-Test.');
      const half = Math.ceil(emails.length / 2);
      const base = `${slugify(built.subject).slice(0, 30)}-${stamp()}`;
      for (const [label, subject, part] of [
        ['A', built.subject, emails.slice(0, half)],
        ['B', options.abTest.subjectB.trim(), emails.slice(half)],
      ]) {
        const listId = await mailjet.createList(`AB-${base}-${label}`);
        await mailjet.addEmailsToList(listId, part);
        step(`Teilliste ${label} angelegt (ID ${listId}, ${part.length} Empfänger).`);
        variants.push({ label, subject, listId, recipients: part.length });
      }
    } else {
      variants.push({ label: '', subject: built.subject, listId: Number(options.listId) });
    }

    // 2) Entwürfe anlegen + Inhalt hochladen + nachprüfen (noch nichts wird verschickt)
    for (const v of variants) {
      const draft = await mailjet.createDraft({
        title: v.label ? `${title} – Variante ${v.label}` : title,
        subject: v.subject,
        senderEmail: env.sender.email,
        senderName: env.sender.name,
        listId: v.listId,
        locale: env.brand.locale,
      });
      v.draftId = draft.ID;
      await mailjet.setContent(v.draftId, { html: built.html, text: built.text, mjml: env.attachMjml ? built.mjml : undefined });
      const content = await mailjet.getContent(v.draftId);
      if (!content?.['Html-part'] || content['Html-part'].length < built.html.length * 0.9)
        throw new Error(`Inhalt von Entwurf ${v.draftId} ist bei Mailjet nicht vollständig angekommen.`);
      v.status = 'Entwurf';
      step(`Entwurf${v.label ? ` ${v.label}` : ''} angelegt (ID ${v.draftId}), Inhalt geprüft.`);
      await saveProtocol();
    }

    // 3) Testmails
    const testEmails = (options.testEmails || []).filter(Boolean);
    if (testEmails.length) {
      for (const v of variants) await mailjet.sendTest(v.draftId, testEmails);
      step(`Testmail an ${testEmails.join(', ')} verschickt.`);
    }

    // 4) Versand planen / auslösen – erst jetzt, wenn alle Entwürfe sauber angelegt sind
    if (mode === 'schedule') {
      const iso = new Date(options.delivery.at).toISOString();
      for (const v of variants) {
        await mailjet.schedule(v.draftId, iso);
        const check = await mailjet.getSchedule(v.draftId);
        v.status = check?.Status || 'Programmed';
        v.scheduledFor = check?.Date || iso;
        if (!/programmed|axtested/i.test(String(v.status)))
          throw new Error(`Mailjet meldet für Entwurf ${v.draftId} den Status „${v.status}“ statt „Programmed“.`);
        step(`Versand${v.label ? ` ${v.label}` : ''} geplant für ${v.scheduledFor} – Mailjet bestätigt Status „${v.status}“.`);
      }
    } else if (mode === 'now') {
      for (const v of variants) {
        const r = await mailjet.sendNow(v.draftId);
        v.status = r?.Status || 'Programmed';
        step(`Versand${v.label ? ` ${v.label}` : ''} ausgelöst – Mailjet meldet „${v.status}“.`);
      }
    } else {
      step('Entwurf liegt in Mailjet bereit – Versand muss dort ausgelöst werden.');
    }

    protocol.mailjet.ok = true;
    await saveProtocol();
    return { ok: true, stage: mode === 'draft' ? 'draft' : 'scheduled', mode, archiveDir, variants, steps, checks: built.checks };
  } catch (err) {
    step(`FEHLER: ${err.message}`);
    protocol.mailjet.ok = false;
    protocol.mailjet.error = { message: err.message, step: err.step, body: err.body };
    await saveProtocol();
    return {
      ok: false,
      stage: 'mailjet',
      error: err.message,
      archiveDir,
      variants,
      steps,
      checks: built.checks,
      hint: variants.some((v) => /programmed/i.test(String(v.status)))
        ? 'Achtung: Mindestens eine Variante ist bereits eingeplant. Bitte in Mailjet prüfen.'
        : 'Es wurde nichts verschickt. Angelegte Entwürfe können in Mailjet gelöscht oder weiterverwendet werden.',
    };
  }
}
