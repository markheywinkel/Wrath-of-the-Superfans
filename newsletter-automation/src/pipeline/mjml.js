// Newsletter-Modell + Hausdesign (config/brand.json) → MJML
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stripTags = (s) => String(s ?? '').replace(/<[^>]+>/g, '');

function formatDate(date, locale = 'de_DE') {
  return new Intl.DateTimeFormat(locale.replace('_', '-'), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function head(brand, { title, preheader }) {
  const c = brand.colors;
  const f = brand.fonts;
  const fs = brand.fontSizes;
  const fonts = [f.headline, f.body]
    .filter((x) => x?.url)
    .map((x) => `    <mj-font name="${esc(x.name)}" href="${esc(x.url)}" />`)
    .join('\n');
  return `  <mj-head>
    <mj-title>${esc(stripTags(title))}</mj-title>
${preheader ? `    <mj-preview>${esc(preheader)}</mj-preview>\n` : ''}${fonts}
    <mj-attributes>
      <mj-all font-family="${esc(f.body.stack)}" />
      <mj-section background-color="${c.content}" padding="0 24px" />
      <mj-column padding="0" />
      <mj-text color="${c.text}" font-size="${fs.body}" line-height="1.55" padding="0 0 16px 0" />
      <mj-image padding="0 0 8px 0" />
      <mj-button background-color="${c.primary}" color="${c.primaryText}" font-size="${fs.body}" font-weight="700" inner-padding="12px 24px" border-radius="4px" align="left" padding="4px 0 20px 0" />
      <mj-divider border-color="${c.divider}" border-width="1px" padding="8px 0 24px 0" />
      <mj-table color="${c.text}" font-size="${fs.small}" line-height="1.4" padding="0 0 16px 0" />
    </mj-attributes>
    <mj-style inline="inline">
      a { color: ${c.link}; text-decoration: underline; }
      h1, h2, h3, h4 { font-family: ${f.headline.stack}; color: ${c.headline}; margin: 0 0 12px 0; line-height: 1.25; }
      h1 { font-size: ${fs.title}; }
      h2 { font-size: ${fs.articleHeading}; }
      h3 { font-size: ${fs.subheading}; margin-top: 8px; }
      h4 { font-size: ${fs.body}; margin-top: 8px; }
      p { margin: 0 0 14px 0; }
      ul, ol { margin: 0 0 14px 0; padding-left: 22px; }
      li { margin: 0 0 6px 0; }
      blockquote { margin: 0 0 14px 0; padding: 4px 0 4px 16px; border-left: 4px solid ${c.primary}; font-style: italic; }
      .caption { font-size: ${fs.small}; color: ${c.muted}; }
      .muted, .muted a { color: ${c.muted}; }
    </mj-style>
    <mj-style>
      @media only screen and (max-width: 480px) {
        h1 { font-size: 26px !important; }
        h2 { font-size: 21px !important; }
      }
    </mj-style>
  </mj-head>`;
}

function headerSection(brand, date) {
  const c = brand.colors;
  const logo = brand.logo?.url
    ? `<mj-image src="${esc(brand.logo.url)}" width="${brand.logo.width || 160}px" alt="${esc(brand.logo.alt || brand.name)}"${
        brand.logo.href ? ` href="${esc(brand.logo.href)}"` : ''
      } align="left" padding="0" />`
    : `<mj-text font-family="${esc(brand.fonts.headline.stack)}" font-size="22px" font-weight="700" color="${c.primary}" padding="0">${esc(
        brand.name,
      )}</mj-text>`;
  const right = brand.showDate
    ? `<mj-text align="right" font-size="${brand.fontSizes.small}" color="${c.muted}" padding="6px 0 0 0">${esc(
        brand.newsletterName,
      )}<br />${esc(formatDate(date, brand.locale))}</mj-text>`
    : '';
  return `    <mj-section padding="24px 24px 16px 24px" border-bottom="4px solid ${c.primary}">
      <mj-column width="60%" vertical-align="middle">${logo}</mj-column>
      <mj-column width="40%" vertical-align="middle">${right}</mj-column>
    </mj-section>`;
}

// Tabellenzellen direkt stylen (globale td-Regeln würden das MJML-Layout treffen)
function styleTable(html, cellStyle) {
  return html.replace(/<(td|th)>/g, `<$1 style="${cellStyle}">`);
}

function renderBlocks(blocks, cellStyle = '') {
  const out = [];
  let textBuffer = [];
  const flush = () => {
    if (textBuffer.length) out.push(`<mj-text>${textBuffer.join('\n')}</mj-text>`);
    textBuffer = [];
  };
  for (const b of blocks) {
    if (b.type === 'html') {
      textBuffer.push(b.html);
    } else if (b.type === 'image') {
      flush();
      out.push(
        `<mj-image src="${esc(b.src)}" alt="${esc(b.alt)}"${b.href ? ` href="${esc(b.href)}"` : ''} fluid-on-mobile="true" />`,
      );
      if (b.caption) out.push(`<mj-text padding="0 0 16px 0"><p class="caption">${b.caption}</p></mj-text>`);
    } else if (b.type === 'button') {
      flush();
      out.push(`<mj-button href="${esc(b.href)}">${esc(b.text)}</mj-button>`);
    } else if (b.type === 'table') {
      flush();
      out.push(`<mj-table>${styleTable(b.html, cellStyle)}</mj-table>`);
    }
  }
  flush();
  return out.map((l) => `        ${l}`).join('\n');
}

function articleSection(section, { isFirstArticle, title, cellStyle }) {
  const parts = [];
  if (section.intro && title) parts.push(`        <mj-text padding="28px 0 12px 0"><h1>${title}</h1></mj-text>`);
  if (section.heading) {
    parts.push(
      `        <mj-text padding="${isFirstArticle && !section.intro ? '28px' : '8px'} 0 4px 0"><h2>${section.heading}</h2></mj-text>`,
    );
  }
  parts.push(renderBlocks(section.blocks, cellStyle));
  return `    <mj-section>
      <mj-column>
${parts.filter(Boolean).join('\n')}
      </mj-column>
    </mj-section>`;
}

function dividerSection() {
  return `    <mj-section><mj-column><mj-divider /></mj-column></mj-section>`;
}

function adSection(brand, ad) {
  const c = brand.colors;
  const label = `<mj-text font-size="11px" color="${c.muted}" padding="12px 0 6px 0" css-class="ad-label">${esc(
    brand.adLabel,
  ).toUpperCase()}${ad.sponsor ? ` · ${esc(ad.sponsor)}` : ''}</mj-text>`;
  const body = [];
  if (ad.image) body.push(`<mj-image src="${esc(ad.image)}" alt="${esc(ad.alt || ad.name)}" href="${esc(ad.href)}" />`);
  if (ad.headline) body.push(`<mj-text padding="4px 0 6px 0"><h3>${esc(ad.headline)}</h3></mj-text>`);
  if (ad.text) body.push(`<mj-text>${esc(ad.text)}</mj-text>`);
  if (!ad.image && ad.href) body.push(`<mj-button href="${esc(ad.href)}">${esc(ad.cta || 'Mehr erfahren')}</mj-button>`);
  return `    <mj-section background-color="${c.adBackground}" padding="0 24px 12px 24px">
      <mj-column>
        ${label}
        ${body.join('\n        ')}
      </mj-column>
    </mj-section>
    <mj-section padding="0 24px 16px 24px"><mj-column><mj-spacer height="8px" /></mj-column></mj-section>`;
}

function footerSection(brand) {
  const c = brand.colors;
  const f = brand.footer;
  const links = [
    ...(f.links || []).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`),
    `<a href="${f.unsubscribeTag || '[[UNSUB_LINK_DE]]'}">${esc(f.unsubscribeLabel || 'Abbestellen')}</a>`,
  ].join(' · ');
  return `    <mj-section background-color="${c.background}" padding="24px 24px 32px 24px">
      <mj-column>
        <mj-text font-size="${brand.fontSizes.small}" color="${c.muted}" align="center" css-class="muted" padding="0">
          <p>${esc(f.text)}</p>
          <p>${links}</p>
          <p>${esc(f.address)}</p>
        </mj-text>
      </mj-column>
    </mj-section>`;
}

/**
 * @param {object} model   aus structure.js
 * @param {object} opts
 * @param {object} opts.brand        config/brand.json
 * @param {Record<string, object|null>} opts.adsBySlot  Slot-Name → Anzeige (null = Platz leer lassen)
 * @param {string} [opts.preheader]
 * @param {Date}   [opts.date]       Versanddatum (für die Datumszeile)
 */
export function buildMjml(model, { brand, adsBySlot = {}, preheader, date = new Date() }) {
  const title = model.title || '';
  const cellStyle = `border-bottom:1px solid ${brand.colors.divider};padding:6px 8px;text-align:left;vertical-align:top;`;
  const body = [];
  let articleCount = 0;
  let prevType = null;

  if (!model.sections.some((s) => s.type === 'article' && s.intro) && title) {
    body.push(articleSection({ intro: true, blocks: [] }, { title, cellStyle }));
    prevType = 'article';
  }

  for (const section of model.sections) {
    if (section.type === 'ad') {
      const ad = adsBySlot[section.slot];
      if (ad) body.push(adSection(brand, ad));
      prevType = 'ad';
      continue;
    }
    if (prevType === 'article') body.push(dividerSection());
    body.push(articleSection(section, { isFirstArticle: articleCount === 0, title, cellStyle }));
    articleCount += 1;
    prevType = 'article';
  }

  return `<mjml lang="${esc((brand.locale || 'de_DE').slice(0, 2))}">
${head(brand, { title, preheader: preheader ?? model.preheader })}
  <mj-body background-color="${brand.colors.background}" width="${brand.width || 600}px">
    <mj-wrapper padding="24px 0 0 0">
${headerSection(brand, date)}
${body.join('\n')}
    <mj-section padding="0 24px 24px 24px"><mj-column><mj-spacer height="8px" /></mj-column></mj-section>
    </mj-wrapper>
${footerSection(brand)}
  </mj-body>
</mjml>
`;
}
