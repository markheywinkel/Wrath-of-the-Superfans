// Reine Text-Version (Text-Part) des Newsletters – wichtig für Zustellbarkeit und Barrierefreiheit.
const decode = (s) =>
  String(s ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

function htmlToText(html) {
  return decode(
    html
      .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_, href, text) => `${text} (${href})`)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>/gi, '\n• ')
      .replace(/<\/(p|h\d|blockquote|ul|ol|tr)>/gi, '\n\n')
      .replace(/<\/t[dh]>/gi, ' | ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildText(model, { brand, adsBySlot = {} }) {
  const out = [];
  if (model.title) out.push(htmlToText(model.title).toUpperCase(), '');
  for (const s of model.sections) {
    if (s.type === 'ad') {
      const ad = adsBySlot[s.slot];
      if (ad) {
        out.push(`--- ${brand.adLabel}${ad.sponsor ? ` · ${ad.sponsor}` : ''} ---`);
        out.push([ad.headline, ad.text, ad.alt].filter(Boolean)[0] || ad.name, ad.href, '');
      }
      continue;
    }
    if (s.heading) out.push(htmlToText(s.heading).toUpperCase(), '');
    for (const b of s.blocks) {
      if (b.type === 'html' || b.type === 'table') out.push(htmlToText(b.html), '');
      else if (b.type === 'button') out.push(`» ${b.text}: ${b.href}`, '');
      else if (b.type === 'image') {
        if (b.alt) out.push(`[Bild: ${b.alt}]`);
        if (b.caption) out.push(htmlToText(b.caption));
        out.push('');
      }
    }
    out.push('----------------------------------------', '');
  }
  const f = brand.footer;
  out.push(f.text, ...(f.links || []).map((l) => `${l.label}: ${l.href}`));
  out.push(`${f.unsubscribeLabel}: ${f.unsubscribeTag || '[[UNSUB_LINK_DE]]'}`, f.address);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
