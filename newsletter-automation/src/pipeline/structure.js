// Macht aus dem mammoth-HTML ein Newsletter-Modell:
//
//   Titel (Formatvorlage "Titel")            → Hauptüberschrift / Betreff-Vorschlag
//   Untertitel                               → Preheader (Vorschautext im Posteingang)
//   Text vor der ersten Überschrift 1        → Intro / Editorial
//   Überschrift 1                            → neuer Artikel-Block
//   Überschrift 2 / 3                        → Zwischenüberschrift im Artikel
//   Standard-Absätze, Listen, Zitate         → Fließtext
//   Bild (+ Absatz "Beschriftung")           → Bild mit Bildunterschrift
//   Absatz "→ Linktext" (mit genau 1 Link)   → Button
//   Absatz "[ANZEIGE]" / "[ANZEIGE: Name]"   → Werbeplatz (wird beim Produzieren befüllt)
import { parse, NodeType } from 'node-html-parser';

const AD_RE = /^\[\s*(?:anzeige|werbung|ad)\s*(?:[:\-–]\s*([^\]]*?))?\s*\]$/i;
const BUTTON_RE = /^\s*(?:→|->|»|\[button\])\s*/i;
const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub', 'br', 'a']);
export const SAFE_HREF_RE = /^(https?:\/\/|mailto:|tel:|\[\[)/i;

function sanitizeInline(node, ctx) {
  let out = '';
  for (const child of node.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      out += child.rawText; // mammoth liefert bereits escaptes HTML
      continue;
    }
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const tag = child.rawTagName?.toLowerCase();
    if (tag === 'img') continue; // Bilder werden separat behandelt
    if (tag === 'br') {
      out += '<br />';
      continue;
    }
    const inner = sanitizeInline(child, ctx);
    if (tag === 'a') {
      const href = (child.getAttribute('href') || '').trim();
      if (href.startsWith('#')) {
        out += inner; // interne Sprungmarken (z. B. Fußnoten) ergeben im Newsletter keinen Sinn
      } else if (SAFE_HREF_RE.test(href)) {
        ctx.links.push({ href, text: child.text.trim() });
        out += `<a href="${escapeAttr(href)}">${inner}</a>`;
      } else {
        ctx.warnings.push(`Link „${child.text.trim()}“ hat eine ungültige Adresse (${href || 'leer'}) und wurde entfernt.`);
        out += inner;
      }
    } else if (INLINE_TAGS.has(tag)) {
      out += `<${tag}>${inner}</${tag}>`;
    } else {
      out += inner; // unbekannte Tags auspacken
    }
  }
  return out;
}

function escapeAttr(s) {
  return String(s).replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;');
}

function extractImages(node) {
  return node.querySelectorAll('img').map((img) => {
    const link = img.closest('a');
    const href = link?.getAttribute('href');
    return {
      type: 'image',
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      href: href && SAFE_HREF_RE.test(href) ? href : undefined,
    };
  });
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToModel(html) {
  const root = parse(`<div>${html}</div>`).firstChild;
  const ctx = { links: [], warnings: [] };
  const model = { title: null, preheader: null, sections: [], links: ctx.links, warnings: ctx.warnings };

  let current = null;
  let adCounter = 0;
  const ensureArticle = () => {
    if (!current) {
      current = { type: 'article', heading: null, intro: model.sections.length === 0, blocks: [] };
      model.sections.push(current);
    }
    return current;
  };

  for (const el of root.childNodes) {
    if (el.nodeType !== NodeType.ELEMENT_NODE) continue;
    const tag = el.rawTagName.toLowerCase();
    const cls = el.getAttribute('class') || '';
    const text = decode(el.text).trim();

    if (tag === 'h1') {
      if (!model.title) {
        model.title = sanitizeInline(el, ctx).trim();
        continue;
      }
      // weiterer Titel → wie Überschrift 1 behandeln
    }
    if (tag === 'h1' || tag === 'h2') {
      current = { type: 'article', heading: sanitizeInline(el, ctx).trim(), intro: false, blocks: [] };
      model.sections.push(current);
      continue;
    }
    if (tag === 'p' && cls.includes('preheader')) {
      if (!model.preheader) model.preheader = text;
      else ensureArticle().blocks.push({ type: 'html', html: `<p>${sanitizeInline(el, ctx)}</p>` });
      continue;
    }
    if (tag === 'p' && AD_RE.test(text)) {
      adCounter += 1;
      const name = text.match(AD_RE)[1]?.trim();
      model.sections.push({ type: 'ad', slot: name || `Anzeige ${adCounter}` });
      current = null; // Text nach der Anzeige beginnt einen neuen Block
      continue;
    }
    if (!text && el.querySelectorAll('img').length === 0) continue; // leere Absätze

    const article = ensureArticle();

    if (tag === 'p' && cls.includes('caption')) {
      const last = article.blocks.at(-1);
      if (last?.type === 'image' && !last.caption) {
        last.caption = sanitizeInline(el, ctx).trim();
        continue;
      }
      article.blocks.push({ type: 'html', html: `<p class="caption">${sanitizeInline(el, ctx)}</p>` });
      continue;
    }

    if (tag === 'p') {
      const images = extractImages(el);
      article.blocks.push(...images);
      if (!text) continue;
      const anchors = el.querySelectorAll('a');
      if (BUTTON_RE.test(text) && anchors.length === 1) {
        const href = anchors[0].getAttribute('href') || '';
        if (SAFE_HREF_RE.test(href)) {
          ctx.links.push({ href, text });
          article.blocks.push({ type: 'button', text: text.replace(BUTTON_RE, '').trim(), href });
          continue;
        }
      }
      article.blocks.push({ type: 'html', html: `<p>${sanitizeInline(el, ctx).trim()}</p>` });
      continue;
    }

    if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      const level = tag === 'h3' ? 'h3' : 'h4';
      article.blocks.push({ type: 'html', html: `<${level}>${sanitizeInline(el, ctx).trim()}</${level}>` });
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      article.blocks.push({ type: 'html', html: renderList(el, ctx) });
      continue;
    }

    if (tag === 'blockquote') {
      const paras = el.querySelectorAll('p').map((p) => `<p>${sanitizeInline(p, ctx).trim()}</p>`);
      article.blocks.push({ type: 'html', html: `<blockquote>${paras.join('') || sanitizeInline(el, ctx)}</blockquote>` });
      continue;
    }

    if (tag === 'table') {
      const rows = el.querySelectorAll('tr').map(
        (tr) =>
          '<tr>' +
          tr.childNodes
            .filter((c) => c.nodeType === NodeType.ELEMENT_NODE && /^t[dh]$/i.test(c.rawTagName))
            .map((c) => {
              const t = c.rawTagName.toLowerCase();
              const cellHtml = c.childNodes
                .filter((n) => n.nodeType === NodeType.ELEMENT_NODE)
                .map((n) => sanitizeInline(n, ctx).trim())
                .filter(Boolean)
                .join('<br />');
              return `<${t}>${cellHtml || sanitizeInline(c, ctx)}</${t}>`;
            })
            .join('') +
          '</tr>',
      );
      article.blocks.push({ type: 'table', html: rows.join('') });
      continue;
    }

    // Fallback: als Absatz übernehmen
    article.blocks.push({ type: 'html', html: `<p>${sanitizeInline(el, ctx).trim()}</p>` });
  }

  // leere Artikel (z. B. Überschrift ohne Inhalt bleibt erhalten, aber Intro ohne Inhalt nicht)
  model.sections = model.sections.filter((s) => s.type !== 'article' || s.heading || s.blocks.length);
  return model;
}

function renderList(listEl, ctx) {
  const tag = listEl.rawTagName.toLowerCase();
  const items = listEl.childNodes
    .filter((c) => c.nodeType === NodeType.ELEMENT_NODE && c.rawTagName.toLowerCase() === 'li')
    .map((li) => {
      const nested = li.childNodes
        .filter((c) => c.nodeType === NodeType.ELEMENT_NODE && /^(ul|ol)$/i.test(c.rawTagName))
        .map((c) => renderList(c, ctx))
        .join('');
      const clone = parse(li.toString()).firstChild;
      clone.querySelectorAll('ul,ol').forEach((n) => n.remove());
      return `<li>${sanitizeInline(clone, ctx).trim()}${nested}</li>`;
    });
  return `<${tag}>${items.join('')}</${tag}>`;
}
