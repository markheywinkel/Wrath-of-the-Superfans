# Space

Ein ruhiges Pixel-Browserspiel: Ein kleines Raumschiff fliegt per Tippen durch ein
Sonnensystem (Sonne, 5 Planeten, 3 Monde um den Gasriesen, Asteroidengürtel als Kartenrand)
und sammelt 30 Münzen.

Reine statische Seite – kein Build, keine Abhängigkeiten.

| Datei        | Inhalt                                                        |
|--------------|---------------------------------------------------------------|
| `index.html` | Seitengerüst, HUD, Infokasten, Belohnungsdialog               |
| `style.css`  | Pixel-UI                                                      |
| `texts.js`   | **Alle Texte** (Planeten-Infos, Belohnung) – hier betexten     |
| `game.js`    | Spiel, Steuerung, Ausweichlogik, Rendering                    |

## Lokal starten

```bash
cd space
python3 -m http.server 8000
# http://localhost:8000
```

## Steuerung

- Tippen/Klicken auf eine Stelle: Schiff fliegt geradlinig hin, Planeten werden umflogen.
- Tippen auf Sonne, Planet oder Mond: Schiff fliegt hin, geht in einen Orbit, Infokasten öffnet sich.
- Gesammelte Münzen werden im Browser (`localStorage`) gespeichert.
- Sind alle 30 gesammelt, kann der Dialog über den Münzzähler erneut geöffnet werden.

## Deployment auf space.markheywinkel.de

Läuft automatisch über die GitHub Action `.github/workflows/onecom.yml` (»Website auf One.com«):
Bei jedem Push auf den Hauptzweig werden `index.html`, `style.css`, `texts.js`, `game.js`,
`fonts/` und `htaccess` (als `.htaccess`) per SFTP nach `webroots/www/space` hochgeladen,
genauso wie Storytelling und Verticals.

Nach Textänderungen in `texts.js` also einfach committen und pushen.

Einmalig bei One.com nötig: die Subdomain `space.markheywinkel.de` anlegen, sodass sie auf
den Ordner `space` zeigt (wie bei `storytelling` und `verticals`).

Die Schrift »Pixelify Sans« (SIL Open Font License, `fonts/OFL.txt`) wird selbst ausgeliefert,
die Seite lädt nichts von fremden Servern.
