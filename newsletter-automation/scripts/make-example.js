// Erzeugt examples/beispiel-newsletter.docx – zeigt die erwartete Dokumentstruktur
// und dient als Testdokument. Kann auch als Vorlage für die Redaktion genutzt werden.
import { writeFile, mkdir } from 'node:fs/promises';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, ImageRun } from 'docx';
import { png } from './png.js';

const photo = png(600, 300, (x, y) => [200 - (y >> 2), 120 + (x >> 4), 90 + (x >> 3)]);
const p = (...children) => new Paragraph({ children });
const t = (text, opts = {}) => new TextRun({ text, ...opts });
const link = (text, href) => new ExternalHyperlink({ link: href, children: [new TextRun({ text, style: 'Hyperlink' })] });

const doc = new Document({
  creator: 'Redaktion',
  title: 'Beispiel-Newsletter',
  styles: {
    paragraphStyles: [
      { id: 'Subtitle', name: 'Subtitle', basedOn: 'Normal', run: { italics: true, size: 26, color: '666666' } },
      { id: 'Caption', name: 'Caption', basedOn: 'Normal', run: { size: 18, color: '666666' } },
    ],
  },
  sections: [
    {
      children: [
        new Paragraph({ heading: HeadingLevel.TITLE, children: [t('Die Woche in fünf Minuten')] }),
        new Paragraph({ style: 'Subtitle', children: [t('Herbstbilanz, neue Radwege und ein Rezept für trübe Tage')] }),
        p(t('Liebe Leserinnen und Leser,')),
        p(t('willkommen zur neuen Ausgabe. Diese Woche haben wir '), t('drei Themen', { bold: true }), t(' für Sie ausgewählt.')),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t('Neue Radwege für die Innenstadt')] }),
        p(new ImageRun({ type: 'png', data: photo, transformation: { width: 600, height: 300 }, altText: { name: 'Radweg', description: 'Ein neuer Radweg in der Innenstadt', title: 'Radweg' } })),
        new Paragraph({ style: 'Caption', children: [t('Der neue Radweg an der Hauptstraße. Foto: Redaktion')] }),
        p(t('Der Stadtrat hat am Dienstag beschlossen, bis 2028 insgesamt '), t('zwölf Kilometer', { italics: true }), t(' neue Radwege zu bauen.')),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t('Was sich konkret ändert')] }),
        new Paragraph({ bullet: { level: 0 }, children: [t('Geschützte Spuren auf der Hauptstraße')] }),
        new Paragraph({ bullet: { level: 0 }, children: [t('Mehr Abstellplätze am Bahnhof')] }),
        p(t('→ '), link('Zum ganzen Artikel', 'https://www.example.com/radwege')),

        p(t('[ANZEIGE]')),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t('Rezept der Woche: Kürbissuppe')] }),
        p(t('Ein Klassiker, der immer funktioniert. Alle Zutaten und die Schritt-für-Schritt-Anleitung finden Sie '), link('in unserem Rezeptarchiv', 'https://www.example.com/rezepte/kuerbissuppe'), t('.')),

        p(t('[ANZEIGE: Footer-Banner]')),
      ],
    },
  ],
});

await mkdir('examples', { recursive: true });
await writeFile('examples/beispiel-newsletter.docx', await Packer.toBuffer(doc));
console.log('examples/beispiel-newsletter.docx geschrieben');
