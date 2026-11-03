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

Das Spiel ist in Kapitel eingeteilt:

1. **Gute Reise!** – Sonnensystem, erste Aufträge.
2. **Die Kometen kommen** – nach den ersten fünf Aufträgen (mit kurzer Zwischensequenz): neue Aufträge, Kometen, Relikte.
3. **Das Wurmloch** – wenn Kapitel 2 erledigt ist, öffnet sich dort, wo man gerade ist, ein Wurmloch (Zwischensequenz). Dahinter liegt ein Urlaubssystem mit Doppelsonne, den Planeten Monos, Qratos und Stypos und den Kreuzfahrtschiffen Vida, Zida und Yipa. Die Figuren im alten Gebiet sprechen dann über das Wurmloch.

- Die Spielfigur heißt **Du**: Astronautin mit Helm im hellblauen Anzug. Die anderen Figuren sind Astronautinnen und Astronauten, mal mit Helm, mal ohne, in grellen Anzügen. Tippen/Klicken auf eine Stelle: Das Schiff fliegt geradlinig hin, Planeten werden umflogen.
- Tippen auf Sonne, Planet oder Mond: hinfliegen, Orbit. Name und Beschreibung erscheinen direkt am Objekt, um das man kreist.
- In der Nähe von Planeten, Stationen, dem Wrack und anderen Schiffen erscheint deren Name als kleines Schild.
- Tippen auf eine Raumstation oder ein anderes Raumschiff: hinfliegen und ansprechen. Bei Begegnungen treiben beide Schiffe nebeneinander, ein Dialog öffnet sich unten, zentriert: beide Figuren mittig nebeneinander (wer spricht, ist etwas größer), darunter Name und Text, ganz unten »Weiter« in einer Box. Name und Beschreibung des Schiffs stehen dabei direkt am Schiff.
- **Quests:** Jedes der drei Schiffe und jede der zwei Stationen gibt einen Auftrag (»!« über dem Auftraggeber). Den Gegenstand bringt man zum Zielplaneten (blaue Raute über dem Planeten).
- **Sammeln:** 30 Kristalle und 10 verlorene Frachtcontainer.
- **Zweite Runde:** Sind die ersten fünf Aufträge erledigt, geht es weiter:
  - Vier neue Lieferungen (Sieben Kräuter, Perlenkette, Geheimnisvoller Koffer, Kostbares Mineral).
  - Die Forschungsstation gibt den Auftrag, fünf Kometen zu fangen. Die Kometen ziehen schnelle Ellipsenbahnen um die Sonne, schneller als das Schiff im Standardflug; mit jedem Antriebs-Upgrade wird es leichter. Antippen eines Kometen nimmt die Verfolgung auf.
  - Fünf Relikte tauchen auf, dazu das Händlerschiff Wunderkammer mit dem Kuriositätenhändler, der sie entgegennimmt.
- **Nebel:** Oben rechts hat der Asteroidengürtel eine Lücke. Dahinter liegt ein Nebel-Gebiet; fliegt man zu weit hinaus, erscheint »Du fliegst zu weit hinaus, kehr um!« und das Schiff kehrt um. Darin liegt mit einem alten Raumschiffwrack und dem Dunklen Planeten. Tippt man ein Ziel im anderen Bereich an, fliegt das Schiff automatisch durch die Lücke.
  - Im Wrack wohnt eine körperlose Entität: Sie braucht das Blaue Elixier von Cies. Danach wird sie wieder zu Gwynn, einer Forscherin, und fliegt selbst durchs Gebiet.
  - Auf dem Dunklen Planeten bittet ein einsamer Reisender um fünf Teile seines Raumschiffs. Danach stellt er sich als Justus vor und fliegt ebenfalls umher.
- **Badges** (oben rechts):
  - Meistererkunder: alle Kristalle → Antrieb +20 %
  - Aufräumer: alle Container → Antrieb +10 %
  - Meisterbote: alle Quests → Antrieb +20 %
  - Tourist: alle fünf Planeten besucht
  - Amor: Liebesbrief überbracht
  - Kometenjäger: alle fünf Kometen gefangen → Antrieb +30 %
  - Ahnenforscher: alle fünf Relikte zum Kuriositätenhändler gebracht → Antrieb +20 %
  - Grenzgänger: das neue Gebiet betreten → Antrieb +10 %
  - Ghostbuster: Gwynn befreit
  - Helfer in der Not: Justus’ Raumschiff zusammengesetzt
  - Weltenbummler: alle anderen Badges und alle Aufträge → Abschlussdialog mit »Weiterfliegen« oder »Neu beginnen«
- Weiche Klänge (direkt im Browser erzeugt, keine Dateien) beim Einsammeln von Kristallen und Containern, bei neuen Badges und beim Abliefern. Oben rechts schaltet ein Lautsprecher-Symbol den Ton aus und an (diese Einstellung merkt sich der Browser).
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
