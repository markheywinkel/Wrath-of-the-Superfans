# Space

Ein ruhiges Pixel-Browserspiel: Ein kleines Raumschiff fliegt per Tippen durch ein
Sonnensystem (Sonne, 5 Planeten, 3 Monde um den Gasriesen, Asteroidengürtel als Kartenrand)
und sammelt 30 Kristalle.

Reine statische Seite – kein Build, keine Abhängigkeiten.

| Datei        | Inhalt                                                        |
|--------------|---------------------------------------------------------------|
| `index.html` | Seitengerüst, HUD, Infokasten, Belohnungsdialog               |
| `style.css`  | Pixel-UI                                                      |
| `texts.js`   | **Alle Texte** (Intro, Planeten-Infos, Dialoge, Belohnung) – hier betexten |
| `game.js`    | Spiel, Steuerung, Ausweichlogik, Rendering                    |

## Lokal starten

```bash
cd space
python3 -m http.server 8000
# http://localhost:8000
```

## Spielablauf

- Die Spielfigur heißt **Du**: Astronautin mit Helm im hellblauen Anzug. Die anderen Figuren sind Astronautinnen und Astronauten, mal mit Helm, mal ohne, in grellen Anzügen. Tippen/Klicken auf eine Stelle: Das Schiff fliegt geradlinig hin, Planeten werden umflogen.
- Tippen auf Sonne, Planet oder Mond: hinfliegen, Orbit, Infokasten.
- Tippen auf eine Raumstation oder ein anderes Raumschiff: hinfliegen und ansprechen. Bei Begegnungen treiben beide Schiffe nebeneinander, ein Dialog öffnet sich, zentriert: beide Figuren mittig nebeneinander (wer spricht, ist etwas größer), darunter Name, Funktion und Text, ganz unten »Weiter«.
- **Quests:** Jedes der drei Schiffe und jede der zwei Stationen gibt einen Auftrag (»!« über dem Auftraggeber). Den Gegenstand bringt man zum Zielplaneten (blaue Raute über dem Planeten).
- **Sammeln:** 30 Kristalle und 10 verlorene Frachtcontainer.
- **Badges** (oben rechts):
  - Meistererkunder: alle Kristalle → Antrieb +20 %
  - Aufräumer: alle Container → Antrieb +10 %
  - Meisterbote: alle Quests → Antrieb +20 %
  - Tourist: alle fünf Planeten besucht
  - Amor: Liebesbrief überbracht
  - Weltenbummler: alle anderen Badges → Abschlussdialog mit »Weiterfliegen« oder »Neu beginnen«
- Weiche Klänge (direkt im Browser erzeugt, keine Dateien) beim Einsammeln von Kristallen und Containern, beim Beschleunigen, bei neuen Badges und beim Abliefern. Oben rechts schaltet ein Lautsprecher-Symbol den Ton aus und an (diese Einstellung merkt sich der Browser).
- Es wird nichts gespeichert: Neuladen startet das Spiel von vorn.

## Deployment auf space.markheywinkel.de

Läuft automatisch über die GitHub Action `.github/workflows/onecom.yml` (»Website auf One.com«):
Bei jedem Push auf den Hauptzweig werden `index.html`, `style.css`, `texts.js`, `game.js`,
`fonts/` und `htaccess` (als `.htaccess`) per SFTP nach `webroots/www/space` hochgeladen,
genauso wie Storytelling und Verticals.

Nach Textänderungen in `texts.js` also einfach committen und pushen.

Einmalig bei One.com nötig: die Subdomain `space.markheywinkel.de` anlegen, sodass sie auf
den Ordner `space` zeigt (wie bei `storytelling` und `verticals`).

Die Schrift Poppins (wie auf den Storytelling-Seiten, SIL Open Font License, `fonts/OFL.txt`) wird selbst ausgeliefert,
die Seite lädt nichts von fremden Servern.
