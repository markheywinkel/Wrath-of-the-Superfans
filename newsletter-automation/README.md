# Newsletter-Produktion auf Knopfdruck

**Word (Online) → MJML im Hausdesign → Mailjet → Versand zum Zeitpunkt X**

Redaktion und Korrektorat arbeiten wie bisher im Online-Word-Dokument. Wenn das Korrektorat durch ist,
öffnet man in Word **Start → Newsletter produzieren**. Rechts erscheint der *Newsletter-Assistent*:

1. liest das offene Dokument ein und prüft, ob noch **Kommentare oder nicht angenommene Änderungen** drin sind,
2. zeigt die **Vorschau im Hausdesign** (Desktop/Mobil) und das erzeugte **MJML**,
3. fragt Betreff, Preheader, optional **Betreff-A/B-Test**, **Anzeigen pro Werbeplatz**, Empfängerliste, **Versandzeitpunkt** und Testmail-Empfänger ab,
4. macht einen **Prüfbericht** (fehlender Titel, Platzhalter wie „TODO“, Bilder ohne Alternativtext, kaputte Links, Termin in der Vergangenheit, Gmail-Größenlimit …),
5. und nach Klick auf **„Produzieren & für … einplanen“**:
   legt MJML, HTML, Text-Version, Originaldokument und ein Protokoll im Archiv ab → legt den Kampagnen-Entwurf in Mailjet an →
   lädt den Inhalt hoch und **prüft, ob er vollständig angekommen ist** → verschickt ggf. die Testmail → plant den Versand
   und **liest den Status bei Mailjet zurück** („Programmed“). Erst dann meldet der Assistent „eingeplant“.

Ohne Word geht dasselbe im Browser: `.docx` herunterladen (Word Online: *Datei → Speichern unter → Kopie herunterladen*)
und auf die Seite ziehen. Es ist dieselbe Oberfläche.

---

## So muss das Word-Dokument aufgebaut sein

Entscheidend sind die **Formatvorlagen**, nicht Schriftgröße oder Fettdruck. Die vorhandene Newsletter-Vorlage
nutzt diese vermutlich schon. Eine Mustervorlage liegt unter [`examples/beispiel-newsletter.docx`](examples/beispiel-newsletter.docx).

| Im Dokument                                         | Wird im Newsletter zu                                   |
| --------------------------------------------------- | ------------------------------------------------------- |
| Formatvorlage **Titel**                             | große Hauptzeile, Vorschlag für die Betreffzeile        |
| Formatvorlage **Untertitel**                        | Preheader (Vorschautext im Posteingang)                 |
| Text vor der ersten Überschrift                     | Intro / Editorial                                       |
| **Überschrift 1**                                   | neuer Artikel (mit Trennlinie davor)                    |
| **Überschrift 2** / **3**                           | Zwischenüberschrift                                     |
| Standard, fett, kursiv, Links, Listen, Zitat        | Fließtext                                               |
| Bild (+ Absatz in **Beschriftung**)                 | Bild in voller Breite mit Bildunterschrift              |
| Absatz `→ Linktext` (genau ein Link)                | Button im Hausdesign                                    |
| eigener Absatz `[ANZEIGE]` oder `[ANZEIGE: Name]`   | Werbeplatz – welche Anzeige, wird beim Produzieren gewählt |
| Tabelle                                             | einfache Tabelle                                        |

Kommentare werden nie in den Newsletter übernommen. Eigene Formatvorlagen des Hauses (z. B. „NL Teaser“) können in
`config/brand.json` unter `styleMap` zugeordnet werden, z. B. `"p[style-name='NL Teaser'] => p.preheader:fresh"`.

## Hausdesign & Anzeigen anpassen

* **`config/brand.json`** – Farben, Schriften, Logo-URL, Schriftgrößen, Footer (Impressum, Datenschutz, Adresse,
  Abmeldelink `[[UNSUB_LINK_DE]]`, den Mailjet automatisch ersetzt). Das Template selbst steht in
  `src/pipeline/mjml.js`; wer das Layout grundlegend ändern will (z. B. aus einem bestehenden Mailjet-Template),
  ändert es dort.
* **`config/ads.json`** – Anzeigen-Inventar (Bildanzeige oder Textanzeige mit Button). `"default": true` wird
  vorausgewählt.

## Einrichtung

Voraussetzung: Node.js ≥ 20 und ein Server mit **HTTPS** (Word lädt Add-ins nur über HTTPS; außerdem werden die
Bilder aus dem Dokument von dort in die E-Mails geladen). Jeder kleine Server oder Dienst wie Render, Railway,
Fly.io oder eine Azure Web App reicht.

```bash
cd newsletter-automation
npm install
cp .env.example .env      # Mailjet-Schlüssel, Absender, PUBLIC_BASE_URL, APP_ACCESS_TOKEN eintragen
npm start                 # → http://localhost:3000
```

Ohne Mailjet-Schlüssel läuft alles im **Trockenmodus**: Vorschau und Ablage funktionieren, verschickt wird nichts.
Ideal zum Ausprobieren und um das Design abzustimmen.

### Word-Add-in installieren

* **Für sich selbst testen (Word Online):** Dokument öffnen → *Start → Add-Ins → Weitere Add-Ins →
  Meine Add-Ins → Mein Add-In hochladen* → Datei von `https://IHR-SERVER/manifest.xml` herunterladen und hochladen.
* **Für die ganze Redaktion:** Microsoft-365-Admin-Center → *Einstellungen → Integrierte Apps → Benutzerdefinierte
  Apps hochladen* → URL `https://IHR-SERVER/manifest.xml`. Danach haben alle zugewiesenen Personen den Button
  „Newsletter produzieren“ im Start-Menüband.

Das Manifest wird vom Server mit der richtigen Adresse ausgeliefert; die Vorlage liegt in `addin/manifest.xml`.

## Wie verlässlich ist „geht raus“?

* Nichts wird an Mailjet geschickt, solange der Prüfbericht Fehler enthält oder das Korrektorat nicht bestätigt ist.
* Es werden **erst alle Entwürfe angelegt und geprüft**, dann erst eingeplant – bei einem Fehler unterwegs ist
  nichts verschickt, und der Assistent sagt das ausdrücklich.
* Nach dem Einplanen wird der Status bei Mailjet **zurückgelesen**; nur bei „Programmed“ gibt es den grünen Haken.
* Doppelklick-Schutz: Dasselbe Dokument kann nicht zweimal gleichzeitig produziert werden.
* Jede Produktion liegt im Archiv (`output/DATUM_betreff/`: `newsletter.mjml`, `.html`, `.txt`, `quelle.docx`,
  `protokoll.json` mit allen Mailjet-IDs und Schritten).

## A/B-Test der Betreffzeile

Ist der A/B-Test aktiv, lädt das Tool die aktiven (nicht abgemeldeten) Empfänger der gewählten Liste, teilt sie
**zufällig 50/50** in zwei neue Mailjet-Listen (`AB-…-A`, `AB-…-B`) und plant zwei Kampagnen mit je einer
Betreffvariante zum selben Zeitpunkt. Die Öffnungsraten vergleicht man danach in Mailjet. Die Teillisten bleiben
für die Auswertung bestehen und können später gelöscht werden.

Warum nicht der A/B-Test aus der Mailjet-Oberfläche? Er ist über die öffentliche API nicht dokumentiert, darauf
würde ich keinen automatisierten Versand bauen. Eine Variante „Testgruppe 20 %, Gewinner nach 2 Stunden an den
Rest“ lässt sich auf derselben Grundlage ergänzen.

## Technik in Kürze

```
Word Online ──(Office.js: Dokument als .docx)──┐
Browser-Upload (.docx) ────────────────────────┤
                                               ▼
                 mammoth (.docx → HTML anhand der Formatvorlagen)
                 → Newsletter-Modell (Titel, Artikel, Bilder, Buttons, Werbeplätze)
                 → MJML (Hausdesign aus config/brand.json) → HTML + Text-Version
                 → Prüfbericht
                 → Archiv + Mailjet API v3 (campaigndraft → detailcontent → test → schedule/send)
```

* `src/pipeline/` – Konvertierung (docx, structure, mjml, text, checks, build)
* `src/mailjet.js` – Mailjet-Client, `src/publish.js` – Produktionsablauf, `src/server.js` – Web-Server/API
* `public/` – Oberfläche (Browser und Word-Aufgabenbereich), `addin/manifest.xml` – Word-Add-in
* `npm test` – Tests (Struktur, Korrektur-Erkennung, Ablauf mit simuliertem Mailjet, A/B-Aufteilung, Fehlerfälle)
* `npm run make:example` – erzeugt das Beispieldokument neu

Mailjet bekommt das kompilierte **HTML** (das wird verschickt) plus die Text-Version. Mit `MJ_ATTACH_MJML=true`
wird zusätzlich das MJML im Entwurf hinterlegt. Das MJML liegt in jedem Fall im Archiv und kann in der Oberfläche
heruntergeladen werden.
