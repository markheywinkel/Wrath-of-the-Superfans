// Liest ein .docx (Word / Word Online) ein:
//  1. Prüft den Korrektur-Status (offene Kommentare, nicht angenommene Änderungen)
//  2. Wandelt den Inhalt per mammoth in semantisches HTML um – anhand der Formatvorlagen
//     (Titel, Überschrift 1, Überschrift 2, Standard …), nicht anhand von Schriftgrößen.
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Formatvorlagen → HTML. Word speichert eingebaute Vorlagen meist mit englischem Namen
// ("heading 1"), selbst angelegte oder lokalisierte Vorlagen aber auch deutsch.
// Eigene Vorlagen des Hauses lassen sich in config/brand.json unter "styleMap" ergänzen.
const DEFAULT_STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Titel'] => h1:fresh",
  "p[style-name='Subtitle'] => p.preheader:fresh",
  "p[style-name='Untertitel'] => p.preheader:fresh",
  "p[style-name='heading 1'] => h2:fresh",
  "p[style-name='Heading 1'] => h2:fresh",
  "p[style-name='Überschrift 1'] => h2:fresh",
  "p[style-name='heading 2'] => h3:fresh",
  "p[style-name='Heading 2'] => h3:fresh",
  "p[style-name='Überschrift 2'] => h3:fresh",
  "p[style-name='heading 3'] => h4:fresh",
  "p[style-name='Heading 3'] => h4:fresh",
  "p[style-name='Überschrift 3'] => h4:fresh",
  "p[style-name='Caption'] => p.caption:fresh",
  "p[style-name='Beschriftung'] => p.caption:fresh",
  "p[style-name='Quote'] => blockquote > p:fresh",
  "p[style-name='Zitat'] => blockquote > p:fresh",
  "p[style-name='Intense Quote'] => blockquote > p:fresh",
  "p[style-name='Intensives Zitat'] => blockquote > p:fresh",
  "u => u",
  "strike => s",
  // Kommentare werden nicht in den Newsletter übernommen
  "comment-reference => !",
];

/**
 * Zählt offene Kommentare und nicht angenommene Änderungen (Track Changes).
 * Beides deutet darauf hin, dass das Korrektorat noch nicht abgeschlossen ist.
 */
export async function inspectReviewState(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = (await zip.file('word/document.xml')?.async('string')) ?? '';
  const commentsXml = (await zip.file('word/comments.xml')?.async('string')) ?? '';
  // Kommentare, die in Word als "erledigt" markiert sind, stehen in commentsExtended.xml (done="1")
  const commentsExtXml = (await zip.file('word/commentsExtended.xml')?.async('string')) ?? '';

  const comments = (commentsXml.match(/<w:comment\b/g) || []).length;
  const resolved = (commentsExtXml.match(/w15:done="1"/g) || []).length;
  const insertions = (documentXml.match(/<w:ins\b/g) || []).length;
  const deletions = (documentXml.match(/<w:del\b/g) || []).length;
  const formatChanges = (documentXml.match(/<w:rPrChange\b|<w:pPrChange\b/g) || []).length;

  return {
    openComments: Math.max(0, comments - resolved),
    resolvedComments: resolved,
    trackedChanges: insertions + deletions + formatChanges,
  };
}

/**
 * @param {Buffer} buffer  .docx-Datei
 * @param {object} opts
 * @param {(image:{buffer:Buffer, contentType:string, altText?:string}) => Promise<string>} opts.storeImage
 *        legt ein Bild ab und liefert die öffentliche URL (E-Mails brauchen absolute URLs, kein base64)
 * @param {string[]} [opts.styleMap] zusätzliche mammoth-Style-Mappings
 */
export async function docxToHtml(buffer, { storeImage, styleMap = [] } = {}) {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [...styleMap, ...DEFAULT_STYLE_MAP],
      includeDefaultStyleMap: true,
      convertImage: mammoth.images.imgElement(async (image) => {
        const imgBuffer = await image.read();
        const src = storeImage
          ? await storeImage({ buffer: imgBuffer, contentType: image.contentType, altText: image.altText })
          : `data:${image.contentType};base64,${imgBuffer.toString('base64')}`;
        return { src, alt: image.altText || '' };
      }),
    },
  );
  return {
    html: result.value,
    messages: result.messages.map((m) => ({ type: m.type, message: m.message })),
  };
}
