// Schlanker Mailjet-Client (REST API v3) für Kampagnen-Entwürfe.
// Doku: https://dev.mailjet.com/email/guides/send-campaigns/  (campaigndraft, detailcontent, test, schedule, send)
const BASE = 'https://api.mailjet.com/v3/REST';

export class MailjetError extends Error {
  constructor(message, { status, body, step } = {}) {
    super(message);
    this.status = status;
    this.body = body;
    this.step = step;
  }
}

export function createMailjet({ apiKey, apiSecret, fetchImpl = fetch }) {
  if (!apiKey || !apiSecret) return null;
  const auth = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  async function call(method, resource, body, step = resource) {
    const res = await fetchImpl(`${BASE}/${resource}`, {
      method,
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await res.text();
    let json;
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = { raw };
    }
    if (!res.ok) {
      const detail = json.ErrorMessage || json.ErrorInfo || json.raw || res.statusText;
      throw new MailjetError(`Mailjet (${step}) antwortet mit ${res.status}: ${detail}`, { status: res.status, body: json, step });
    }
    return json;
  }

  const api = {
    call,

    async listContactLists() {
      const out = [];
      for (let offset = 0; ; offset += 1000) {
        const r = await call('GET', `contactslist?Limit=1000&Offset=${offset}&IsDeleted=false`);
        out.push(...r.Data.map((l) => ({ id: l.ID, name: l.Name, count: l.SubscriberCount })));
        if (r.Data.length < 1000) break;
      }
      return out;
    },

    async createDraft({ title, subject, senderEmail, senderName, listId, locale = 'de_DE' }) {
      const r = await call(
        'POST',
        'campaigndraft',
        {
          Locale: locale,
          Sender: senderName,
          SenderName: senderName,
          SenderEmail: senderEmail,
          Subject: subject,
          ContactsListID: Number(listId),
          Title: title,
        },
        'Entwurf anlegen',
      );
      return r.Data[0];
    },

    async setContent(draftId, { html, text, mjml }) {
      const body = { 'Html-part': html, 'Text-part': text };
      if (mjml) body.MJMLContent = mjml;
      return call('POST', `campaigndraft/${draftId}/detailcontent`, body, 'Inhalt hochladen');
    },

    async getContent(draftId) {
      const r = await call('GET', `campaigndraft/${draftId}/detailcontent`, undefined, 'Inhalt prüfen');
      return r.Data[0];
    },

    async sendTest(draftId, emails) {
      return call(
        'POST',
        `campaigndraft/${draftId}/test`,
        { Recipients: emails.map((Email) => ({ Email, Name: Email })) },
        'Testmail',
      );
    },

    async schedule(draftId, isoDate) {
      const r = await call('POST', `campaigndraft/${draftId}/schedule`, { Date: isoDate }, 'Versand planen');
      return r.Data?.[0] ?? r;
    },

    async getSchedule(draftId) {
      const r = await call('GET', `campaigndraft/${draftId}/schedule`, undefined, 'Planung prüfen');
      return r.Data?.[0] ?? r;
    },

    async sendNow(draftId) {
      const r = await call('POST', `campaigndraft/${draftId}/send`, undefined, 'Sofort senden');
      return r.Data?.[0] ?? r;
    },

    async getDraft(draftId) {
      const r = await call('GET', `campaigndraft/${draftId}`, undefined, 'Entwurf prüfen');
      return r.Data[0];
    },

    // ---- für den Betreff-A/B-Test (Aufteilen einer Liste) ----

    /** Alle aktiven (nicht abgemeldeten) E-Mail-Adressen einer Liste. */
    async listSubscribedEmails(listId) {
      const unsubscribed = new Set();
      for (let offset = 0; ; offset += 1000) {
        const r = await call('GET', `listrecipient?ContactsList=${listId}&Unsub=true&Limit=1000&Offset=${offset}`, undefined, 'Abmeldungen laden');
        r.Data.forEach((d) => unsubscribed.add(d.ContactID));
        if (r.Data.length < 1000) break;
      }
      const emails = [];
      for (let offset = 0; ; offset += 1000) {
        const r = await call('GET', `contact?ContactsList=${listId}&Limit=1000&Offset=${offset}`, undefined, 'Kontakte laden');
        r.Data.filter((c) => !unsubscribed.has(c.ID) && !c.IsExcludedFromCampaigns).forEach((c) => emails.push(c.Email));
        if (r.Data.length < 1000) break;
      }
      return emails;
    },

    async createList(name) {
      const r = await call('POST', 'contactslist', { Name: name }, 'Teilliste anlegen');
      return r.Data[0].ID;
    },

    /** Fügt Adressen einer Liste hinzu und wartet, bis Mailjet den Import abgeschlossen hat. */
    async addEmailsToList(listId, emails, { pollMs = 2000, timeoutMs = 5 * 60 * 1000 } = {}) {
      for (let i = 0; i < emails.length; i += 10000) {
        const chunk = emails.slice(i, i + 10000);
        const r = await call(
          'POST',
          `contactslist/${listId}/managemanycontacts`,
          { Action: 'addnoforce', Contacts: chunk.map((Email) => ({ Email })) },
          'Teilliste befüllen',
        );
        const jobId = r.Data[0].JobID;
        const start = Date.now();
        for (;;) {
          const s = await call('GET', `contactslist/${listId}/managemanycontacts/${jobId}`, undefined, 'Import-Status');
          const status = s.Data[0]?.Status;
          if (status === 'Completed') break;
          if (status === 'Error' || Date.now() - start > timeoutMs)
            throw new MailjetError(`Import in Teilliste ${listId} fehlgeschlagen (Status ${status}).`, { step: 'Teilliste befüllen' });
          await new Promise((r2) => setTimeout(r2, pollMs));
        }
      }
    },
  };
  return api;
}

/** Fisher-Yates – zufällige, faire Aufteilung für den A/B-Test */
export function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
