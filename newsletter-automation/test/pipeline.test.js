import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, InsertedTextRun, CommentRangeStart, CommentRangeEnd, CommentReference } from 'docx';
import { buildNewsletter, loadConfig } from '../src/pipeline/build.js';
import { htmlToModel } from '../src/pipeline/structure.js';
import { publishNewsletter } from '../src/publish.js';
import { createMailjet } from '../src/mailjet.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const config = await loadConfig(path.join(ROOT, 'config'));
const example = await readFile(path.join(ROOT, 'examples/beispiel-newsletter.docx'));
const tmp = await mkdtemp(path.join(tmpdir(), 'nl-test-'));
const env = { ...config, mediaDir: path.join(tmp, 'media'), outputDir: path.join(tmp, 'out'), publicBaseUrl: 'https://nl.example.com', sender: { email: 'nl@example.com', name: 'Verlag' } };
const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

test('Beispieldokument wird korrekt strukturiert', async () => {
  const r = await buildNewsletter(example, {}, env);
  assert.equal(r.model.title, 'Die Woche in fünf Minuten');
  assert.equal(r.preheader, 'Herbstbilanz, neue Radwege und ein Rezept für trübe Tage');
  assert.equal(r.subject, 'Die Woche in fünf Minuten');
  const articles = r.model.sections.filter((s) => s.type === 'article');
  assert.deepEqual(articles.map((a) => a.heading), [null, 'Neue Radwege für die Innenstadt', 'Rezept der Woche: Kürbissuppe']);
  assert.deepEqual(r.slots, ['Anzeige 1', 'Footer-Banner']);
  const radweg = articles[1].blocks;
  assert.equal(radweg[0].type, 'image');
  assert.match(radweg[0].src, /^https:\/\/nl\.example\.com\/media\/[0-9a-f]+\.png$/);
  assert.equal(radweg[0].caption, 'Der neue Radweg an der Hauptstraße. Foto: Redaktion');
  assert.deepEqual(radweg.at(-1), { type: 'button', text: 'Zum ganzen Artikel', href: 'https://www.example.com/radwege' });
  assert.equal(r.ok, true, JSON.stringify(r.checks));
  assert.ok(r.html.includes('[[UNSUB_LINK_DE]]'), 'Abmeldelink fehlt');
  assert.ok(r.html.includes('Neue Radwege für die Innenstadt'));
  assert.ok(r.html.includes('partner-a?utm_source=newsletter'), 'Standard-Anzeige fehlt');
  assert.match(r.mjml, /<mj-preview>Herbstbilanz/);
  assert.match(r.text, /» Zum ganzen Artikel: https:\/\/www\.example\.com\/radwege/);
  assert.equal((await readdir(env.mediaDir)).length, 1);
});

test('Anzeigen pro Platz wählbar bzw. leer', async () => {
  const r = await buildNewsletter(example, { ads: { 'Anzeige 1': 'partner-b-text', 'Footer-Banner': '' } }, env);
  assert.equal(r.adsBySlot['Anzeige 1'].id, 'partner-b-text');
  assert.equal(r.adsBySlot['Footer-Banner'], null);
  assert.ok(r.html.includes('NEWSLETTER20'));
  assert.ok(r.checks.some((c) => c.level === 'warning' && c.message.includes('Footer-Banner')));
});

test('Korrektorat: offene Kommentare und Änderungen blockieren', async () => {
  const doc = new Document({
    comments: { children: [{ id: 0, author: 'Korrektorat', date: new Date(), children: [new Paragraph({ children: [new TextRun('Bitte prüfen')] })] }] },
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('Titel')] }),
          new Paragraph({ children: [new CommentRangeStart(0), new TextRun('Text'), new CommentRangeEnd(0), new TextRun({ children: [new CommentReference(0)] })] }),
          new Paragraph({ children: [new InsertedTextRun({ text: 'neu', id: 1, author: 'Korrektorat', date: '2026-11-01T10:00:00Z' })] }),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  const r = await buildNewsletter(buf, { subject: 'X' }, env);
  assert.equal(r.review.openComments, 1);
  assert.equal(r.review.trackedChanges, 1);
  assert.equal(r.ok, false);
  const r2 = await buildNewsletter(buf, { subject: 'X', ignoreReview: true }, env);
  assert.equal(r2.ok, true);
});

test('Unsichere Links werden entfernt, Platzhalter gemeldet', () => {
  const m = htmlToModel('<h1>T</h1><h2>A</h2><p>Siehe <a href="javascript:alert(1)">hier</a> TODO</p>');
  assert.equal(m.sections[0].blocks[0].html, '<p>Siehe hier TODO</p>');
  assert.equal(m.warnings.length, 1);
});

function fakeMailjet({ failAt } = {}) {
  const calls = [];
  let id = 100;
  const content = {};
  const rec = (name, ...args) => {
    calls.push([name, ...args]);
    if (failAt === name) throw new Error(`kaputt bei ${name}`);
  };
  return {
    calls,
    async createDraft(d) { rec('createDraft', d); return { ID: ++id }; },
    async setContent(i, c) { rec('setContent', i); content[i] = c; },
    async getContent(i) { rec('getContent', i); return { 'Html-part': content[i].html }; },
    async sendTest(i, e) { rec('sendTest', i, e); },
    async schedule(i, d) { rec('schedule', i, d); return { Status: 'Programmed' }; },
    async getSchedule(i) { rec('getSchedule', i); return { Status: 'Programmed', Date: future }; },
    async sendNow(i) { rec('sendNow', i); return { Status: 'Programmed' }; },
    async listSubscribedEmails(l) { rec('listSubscribedEmails', l); return ['a@x.de', 'b@x.de', 'c@x.de']; },
    async createList(n) { rec('createList', n); return ++id; },
    async addEmailsToList(l, e) { rec('addEmailsToList', l, e); },
  };
}

const publishOptions = { listId: '42', proofreadConfirmed: true, delivery: { mode: 'schedule', at: future }, testEmails: ['chef@x.de'] };

test('Produzieren: ohne Korrektorat-Bestätigung passiert nichts', async () => {
  const mj = fakeMailjet();
  const r = await publishNewsletter({ docx: example, options: { ...publishOptions, proofreadConfirmed: false }, env, mailjet: mj });
  assert.equal(r.ok, false);
  assert.equal(r.stage, 'checks');
  assert.equal(mj.calls.length, 0);
});

test('Produzieren: ablegen, Entwurf, Testmail, einplanen – in dieser Reihenfolge', async () => {
  const mj = fakeMailjet();
  const r = await publishNewsletter({ docx: example, options: publishOptions, env, mailjet: mj });
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(mj.calls.map((c) => c[0]), ['createDraft', 'setContent', 'getContent', 'sendTest', 'schedule', 'getSchedule']);
  assert.equal(mj.calls[0][1].Subject ?? mj.calls[0][1].subject, 'Die Woche in fünf Minuten');
  assert.equal(mj.calls[4][2], future);
  const files = await readdir(r.archiveDir);
  assert.deepEqual(files.sort(), ['newsletter.html', 'newsletter.mjml', 'newsletter.txt', 'protokoll.json', 'quelle.docx']);
  const protocol = JSON.parse(await readFile(path.join(r.archiveDir, 'protokoll.json'), 'utf8'));
  assert.equal(protocol.mailjet.ok, true);
});

test('Produzieren: A/B-Test teilt die Liste und plant beide Varianten', async () => {
  const mj = fakeMailjet();
  const r = await publishNewsletter({
    docx: example,
    options: { ...publishOptions, testEmails: [], abTest: { enabled: true, subjectB: 'Fünf Minuten, alles Wichtige' } },
    env,
    mailjet: mj,
  });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.variants.length, 2);
  const added = mj.calls.filter((c) => c[0] === 'addEmailsToList').map((c) => c[2]);
  assert.equal(added[0].length + added[1].length, 3);
  assert.equal(new Set([...added[0], ...added[1]]).size, 3, 'Empfänger doppelt');
  const drafts = mj.calls.filter((c) => c[0] === 'createDraft').map((c) => c[1].subject);
  assert.deepEqual(drafts, ['Die Woche in fünf Minuten', 'Fünf Minuten, alles Wichtige']);
  // erst beide Entwürfe, dann erst planen
  const names = mj.calls.map((c) => c[0]);
  assert.ok(names.lastIndexOf('createDraft') < names.indexOf('schedule'));
});

test('Produzieren: Mailjet-Fehler wird sauber gemeldet, nichts eingeplant', async () => {
  const mj = fakeMailjet({ failAt: 'setContent' });
  const r = await publishNewsletter({ docx: example, options: publishOptions, env, mailjet: mj });
  assert.equal(r.ok, false);
  assert.equal(r.stage, 'mailjet');
  assert.match(r.hint, /nichts verschickt/);
  assert.ok(!mj.calls.some((c) => c[0] === 'schedule'));
});

test('Produzieren ohne Mailjet-Zugang = Trockenmodus', async () => {
  const r = await publishNewsletter({ docx: example, options: publishOptions, env, mailjet: null });
  assert.equal(r.ok, true);
  assert.equal(r.dryRun, true);
});

test('Mailjet-Client spricht die REST-API korrekt an', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify({ Data: [{ ID: 7 }] }), { status: 201 });
  };
  const mj = createMailjet({ apiKey: 'k', apiSecret: 's', fetchImpl });
  const d = await mj.createDraft({ title: 'T', subject: 'S', senderEmail: 'a@b.de', senderName: 'A', listId: '5' });
  assert.equal(d.ID, 7);
  assert.equal(seen[0].url, 'https://api.mailjet.com/v3/REST/campaigndraft');
  assert.equal(seen[0].init.headers.Authorization, 'Basic ' + Buffer.from('k:s').toString('base64'));
  assert.equal(JSON.parse(seen[0].init.body).ContactsListID, 5);

  const failing = createMailjet({ apiKey: 'k', apiSecret: 's', fetchImpl: async () => new Response(JSON.stringify({ ErrorMessage: 'Sender not validated' }), { status: 400 }) });
  await assert.rejects(() => failing.schedule(1, future), /Sender not validated/);
});
