// Oberfläche – läuft identisch im Browser (Upload) und als Word-Aufgabenbereich (liest das offene Dokument).
const $ = (id) => document.getElementById(id);
const state = {
  docx: null, // Blob
  docName: '',
  config: null,
  last: null, // letzte Vorschau-Antwort
  edited: { subject: false, preheader: false },
  ads: {}, // Slot → Anzeigen-ID ('' = leer)
  inWord: false,
  tab: 'html',
};

// ---------- Zugang ----------
function token() {
  try {
    return localStorage.getItem('nl-token') || '';
  } catch {
    return '';
  }
}
async function askToken() {
  const dlg = $('token-dialog');
  dlg.showModal();
  await new Promise((r) => dlg.addEventListener('close', r, { once: true }));
  try {
    localStorage.setItem('nl-token', $('token-input').value.trim());
  } catch {}
}
async function api(path, { method = 'GET', form } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(path, { method, body: form, headers: { 'x-access-token': token() } });
    if (res.status === 401) {
      await askToken();
      continue;
    }
    const data = await res.json().catch(() => ({ ok: false, error: `Serverfehler ${res.status}` }));
    if (!res.ok && !('ok' in data)) data.ok = false;
    return data;
  }
  throw new Error('Kein gültiger Zugangsschlüssel.');
}

const say = (text) => ($('buddy-says').textContent = text);

// ---------- Dokument laden ----------
function readWordDocument() {
  return new Promise((resolve, reject) => {
    Office.context.document.getFileAsync(Office.FileType.Compressed, { sliceSize: 4 * 1024 * 1024 }, (res) => {
      if (res.status !== Office.AsyncResultStatus.Succeeded) return reject(new Error(res.error.message));
      const file = res.value;
      const slices = [];
      let got = 0;
      const next = (i) =>
        file.getSliceAsync(i, (sr) => {
          if (sr.status !== Office.AsyncResultStatus.Succeeded) {
            file.closeAsync();
            return reject(new Error(sr.error.message));
          }
          slices[i] = new Uint8Array(sr.value.data);
          got += 1;
          if (got === file.sliceCount) {
            file.closeAsync();
            resolve(new Blob(slices, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
          } else next(i + 1);
        });
      next(0);
    });
  });
}

async function loadFromWord() {
  say('Ich lese das Dokument ein …');
  try {
    state.docx = await readWordDocument();
    const url = Office.context.document.url || '';
    state.docName = decodeURIComponent(url.split('/').pop() || 'Aktuelles Dokument');
    await onDocumentLoaded();
  } catch (e) {
    say(`Das Dokument konnte nicht gelesen werden: ${e.message}`);
  }
}

async function loadFromFile(file) {
  if (!file) return;
  if (!/\.docx$/i.test(file.name)) {
    say('Bitte eine Word-Datei im Format .docx wählen.');
    return;
  }
  state.docx = file;
  state.docName = file.name;
  await onDocumentLoaded();
}

async function onDocumentLoaded() {
  $('doc-name').textContent = `📄 ${state.docName}`;
  state.edited = { subject: false, preheader: false };
  $('subject').value = '';
  $('preheader').value = '';
  state.ads = {};
  ['step-content', 'step-ads', 'step-send'].forEach((id) => ($(id).disabled = false));
  await preview();
}

// ---------- Einstellungen ----------
function mode() {
  return document.querySelector('input[name="mode"]:checked').value;
}
function collectOptions() {
  const atValue = $('at').value;
  return {
    subject: $('subject').value,
    preheader: $('preheader').value,
    ads: state.ads,
    listId: $('list').value,
    abTest: { enabled: $('ab-enabled').checked, subjectB: $('subject-b').value },
    delivery: { mode: mode(), at: atValue ? new Date(atValue).toISOString() : null },
    testEmails: $('test-emails').value.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean),
    proofreadConfirmed: $('proofread').checked,
    ignoreReview: $('ignore-review').checked,
  };
}
function formData() {
  const fd = new FormData();
  fd.append('document', state.docx, state.docName.endsWith('.docx') ? state.docName : `${state.docName || 'newsletter'}.docx`);
  fd.append('options', JSON.stringify(collectOptions()));
  return fd;
}

// ---------- Vorschau ----------
let previewTimer;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(preview, 500);
}
async function preview() {
  if (!state.docx) return;
  const r = await api('/api/preview', { method: 'POST', form: formData() });
  if (r.error && !r.html) {
    say(r.error);
    return;
  }
  state.last = r;
  if (!state.edited.subject) $('subject').value = r.subject || '';
  if (!state.edited.preheader) $('preheader').value = r.preheader || '';
  // Anzeigen-Auswahl aus der Antwort übernehmen (Standard-Anzeige ist dort schon aufgelöst)
  for (const slot of r.slots) if (!(slot in state.ads)) state.ads[slot] = r.ads[slot] ?? '';
  renderAdSlots(r.slots);
  renderReview(r.review);
  renderPreview();
  renderChecks();
  const errors = r.checks.filter((c) => c.level === 'error').length;
  say(errors ? `Fast fertig – bitte noch ${errors} Punkt(e) unten klären.` : 'Sieht gut aus! Prüfen Sie die Vorschau und drücken Sie dann auf „Newsletter produzieren“.');
}

function renderPreview() {
  const r = state.last;
  if (!r) return;
  $('empty').hidden = true;
  const showCode = state.tab !== 'html';
  $('preview').hidden = showCode;
  $('code').hidden = !showCode;
  if (showCode) $('code').textContent = state.tab === 'mjml' ? r.mjml : r.text;
  else $('preview').srcdoc = r.html;
}

function renderAdSlots(slots) {
  const box = $('ad-slots');
  if (!slots.length) {
    box.innerHTML = '<p class="hint">Dieses Dokument enthält keine Werbeplätze. Ein eigener Absatz <code>[ANZEIGE]</code> oder <code>[ANZEIGE: Name]</code> fügt einen hinzu.</p>';
    return;
  }
  box.innerHTML = '';
  for (const slot of slots) {
    const label = document.createElement('label');
    label.textContent = `Werbeplatz „${slot}“`;
    const sel = document.createElement('select');
    sel.innerHTML = '<option value="">– leer lassen –</option>';
    for (const ad of state.config?.ads || []) {
      const o = document.createElement('option');
      o.value = ad.id;
      o.textContent = ad.name;
      sel.append(o);
    }
    sel.value = state.ads[slot] ?? '';
    sel.addEventListener('change', () => {
      state.ads[slot] = sel.value;
      schedulePreview();
    });
    label.append(sel);
    box.append(label);
  }
}

function renderReview(review) {
  const box = $('review-box');
  const issues = review.openComments + review.trackedChanges;
  box.hidden = false;
  box.className = `review check-item ${issues ? 'error' : 'ok'}`;
  box.textContent = issues
    ? `Korrektorat offen? ${review.openComments} Kommentar(e), ${review.trackedChanges} nicht angenommene Änderung(en).`
    : '✓ Keine offenen Kommentare oder Änderungen im Dokument.';
  $('ignore-review-box').hidden = !issues;
}

function localChecks() {
  const list = [];
  const m = mode();
  if (!$('proofread').checked) list.push({ level: 'error', message: 'Bitte bestätigen, dass das Korrektorat abgeschlossen ist.' });
  if (m === 'schedule') {
    const at = new Date($('at').value);
    if (!$('at').value || Number.isNaN(at.getTime())) list.push({ level: 'error', message: 'Bitte einen Versandzeitpunkt wählen.' });
    else if (at.getTime() < Date.now() + 2 * 60 * 1000) list.push({ level: 'error', message: 'Der Versandzeitpunkt liegt in der Vergangenheit.' });
  }
  if (m !== 'archive' && !$('list').value && state.config?.mailjetConfigured)
    list.push({ level: 'error', message: 'Bitte eine Empfängerliste wählen.' });
  if (m !== 'archive' && state.config && !state.config.mailjetConfigured)
    list.push({ level: 'info', message: 'Mailjet ist nicht verbunden – der Newsletter wird nur abgelegt (Trockenmodus).' });
  return list;
}

function renderChecks() {
  const all = [...(state.last?.checks || []), ...localChecks()];
  const box = $('checks');
  box.innerHTML = '';
  if (state.last && !all.some((c) => c.level !== 'info')) {
    all.unshift({ level: 'ok', message: '✓ Alle Prüfungen bestanden.' });
  }
  for (const c of all) {
    const d = document.createElement('div');
    d.className = `check-item ${c.level}`;
    d.textContent = c.message;
    box.append(d);
  }
  const blocked = !state.last || all.some((c) => c.level === 'error');
  $('publish').disabled = blocked;
  $('publish').textContent = buttonLabel();
}

function fmtDate(v) {
  return new Date(v).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function buttonLabel() {
  const m = mode();
  if (m === 'schedule' && $('at').value) return `Produzieren & für ${fmtDate($('at').value)} einplanen`;
  if (m === 'now') return 'Produzieren & sofort versenden';
  if (m === 'draft') return 'Produzieren & als Entwurf in Mailjet anlegen';
  if (m === 'archive') return 'Produzieren & ablegen';
  return 'Newsletter produzieren';
}

// ---------- Produzieren ----------
async function publish() {
  const o = collectOptions();
  const listName = $('list').selectedOptions[0]?.textContent || '–';
  const lines = [
    `<p><strong>Betreff:</strong> ${esc(o.subject)}${o.abTest.enabled ? `<br><strong>Betreff B:</strong> ${esc(o.abTest.subjectB)}` : ''}</p>`,
    o.delivery.mode !== 'archive' ? `<p><strong>Liste:</strong> ${esc(listName)}</p>` : '',
    `<p><strong>Versand:</strong> ${
      { schedule: `geplant für ${fmtDate($('at').value)}`, now: '<strong>sofort</strong>', draft: 'nur Entwurf, kein Versand', archive: 'kein Versand, nur ablegen' }[o.delivery.mode]
    }</p>`,
    o.testEmails.length ? `<p><strong>Testmail an:</strong> ${esc(o.testEmails.join(', '))}</p>` : '',
  ];
  $('confirm-text').innerHTML = lines.join('');
  const dlg = $('confirm');
  dlg.showModal();
  const answer = await new Promise((r) => dlg.addEventListener('close', () => r(dlg.returnValue), { once: true }));
  if (answer !== 'ok') return;

  $('publish').disabled = true;
  $('publish').textContent = 'Wird produziert …';
  say('Ich baue den Newsletter, lege ihn ab und übergebe ihn an Mailjet …');
  let r;
  try {
    r = await api('/api/publish', { method: 'POST', form: formData() });
  } catch (e) {
    r = { ok: false, error: e.message };
  }
  showResult(r);
  renderChecks();
}

function showResult(r) {
  const box = $('result');
  box.hidden = false;
  box.className = `result ${r.ok ? 'ok' : 'fail'}`;
  const items = [];
  if (r.stage === 'checks') {
    items.push('<strong>Nicht produziert – die Prüfung hat Fehler gefunden:</strong>');
    items.push('<ul>' + r.checks.filter((c) => c.level === 'error').map((c) => `<li>${esc(c.message)}</li>`).join('') + '</ul>');
  } else {
    if (r.ok) {
      const head = {
        scheduled: r.mode === 'now' ? '✓ Der Newsletter wird jetzt verschickt.' : '✓ Der Newsletter ist bei Mailjet eingeplant.',
        draft: '✓ Der Entwurf liegt in Mailjet bereit.',
        archived: r.dryRun ? '✓ Newsletter abgelegt (Trockenmodus, nichts verschickt).' : '✓ Newsletter abgelegt.',
      }[r.stage];
      items.push(`<strong>${head}</strong>`);
    } else items.push(`<strong>✗ ${esc(r.error || 'Fehler')}</strong>`);
    if (r.message) items.push(`<p>${esc(r.message)}</p>`);
    if (r.hint) items.push(`<p>${esc(r.hint)}</p>`);
    if (r.variants?.length)
      items.push(
        '<ul>' +
          r.variants
            .map((v) => `<li>${v.label ? `Variante ${v.label}: ` : ''}„${esc(v.subject)}“ – Mailjet-Entwurf ${v.draftId ?? '–'}, Status ${esc(v.status || 'offen')}${v.recipients ? `, ${v.recipients} Empfänger` : ''}</li>`)
            .join('') +
          '</ul>',
      );
    if (r.steps?.length) items.push('<details><summary>Protokoll</summary><ul>' + r.steps.map((s) => `<li>${esc(s.msg)}</li>`).join('') + '</ul></details>');
    if (r.archiveDir) items.push(`<p>Abgelegt unter <code>${esc(r.archiveDir)}</code></p>`);
  }
  box.innerHTML = items.join('');
  say(r.ok ? 'Erledigt! Alles Weitere steht unten.' : 'Da hat etwas nicht geklappt – Details stehen unten.');
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- Start ----------
async function loadConfig() {
  const cfg = await api('/api/config');
  state.config = cfg;
  const sel = $('list');
  sel.innerHTML = '<option value="">– Liste wählen –</option>';
  for (const l of cfg.lists || []) {
    const o = document.createElement('option');
    o.value = l.id;
    o.textContent = `${l.name} (${l.count ?? '?'} Empfänger)`;
    sel.append(o);
  }
  if (cfg.defaultListId) {
    if (![...sel.options].some((o) => o.value === String(cfg.defaultListId))) {
      const o = document.createElement('option');
      o.value = cfg.defaultListId;
      o.textContent = `Liste ${cfg.defaultListId}`;
      sel.append(o);
    }
    sel.value = String(cfg.defaultListId);
  }
  if (cfg.listError) say(`Mailjet-Listen konnten nicht geladen werden: ${cfg.listError}`);
  if (state.last) renderAdSlots(state.last.slots);
}

function defaultSendTime() {
  // nächster Morgen 07:00 Uhr
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function wireUp() {
  $('at').value = defaultSendTime();
  $('file').addEventListener('change', (e) => loadFromFile(e.target.files[0]));
  const drop = $('drop');
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    loadFromFile(e.dataTransfer.files[0]);
  });
  $('load-word').addEventListener('click', loadFromWord);
  $('subject').addEventListener('input', () => {
    state.edited.subject = true;
    schedulePreview();
  });
  $('preheader').addEventListener('input', () => {
    state.edited.preheader = true;
    schedulePreview();
  });
  $('ab-enabled').addEventListener('change', () => {
    $('ab-box').hidden = !$('ab-enabled').checked;
    schedulePreview();
  });
  $('subject-b').addEventListener('input', schedulePreview);
  $('ignore-review').addEventListener('change', schedulePreview);
  document.querySelectorAll('input[name="mode"]').forEach((r) =>
    r.addEventListener('change', () => {
      $('at-box').hidden = mode() !== 'schedule';
      renderChecks();
    }),
  );
  ['at', 'list', 'proofread'].forEach((id) => $(id).addEventListener('change', renderChecks));
  $('at').addEventListener('input', renderChecks);
  $('publish').addEventListener('click', publish);

  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === b));
      state.tab = b.dataset.tab;
      renderPreview();
    }),
  );
  document.querySelectorAll('[data-width]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-width]').forEach((x) => x.classList.toggle('active', x === b));
      $('preview').classList.toggle('mobile', b.dataset.width === 'mobile');
    }),
  );
  $('download-mjml').addEventListener('click', () => {
    if (!state.last) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([state.last.mjml], { type: 'text/plain' }));
    a.download = (state.docName || 'newsletter').replace(/\.docx$/i, '') + '.mjml';
    a.click();
  });
}

wireUp();
renderChecks();
loadConfig().catch((e) => say(e.message));

// Läuft die Seite in Word? Dann Dokument direkt einlesen statt Upload.
if (window.Office?.onReady) {
  Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
      state.inWord = true;
      document.body.classList.add('in-word');
      $('word-source').hidden = false;
      $('file-source').hidden = true;
      loadFromWord();
    }
  });
}
