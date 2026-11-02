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

## Deployment auf space.markheywinkel.de (eigener Webserver)

Die Seite besteht nur aus vier statischen Dateien, die direkt im Document-Root der
Subdomain liegen müssen:

```
index.html
style.css
texts.js
game.js
```

1. Beim Hoster die Subdomain `space.markheywinkel.de` anlegen und ihr ein eigenes
   Verzeichnis zuweisen (z. B. `/space`). Der DNS-Eintrag zeigt dann wie bei den anderen
   Seiten auf den eigenen Server.
2. Die vier Dateien per FTP/SFTP in dieses Verzeichnis hochladen, oder per rsync:

   ```bash
   rsync -av --exclude README.md space/ USER@SERVER:/pfad/zum/space-verzeichnis/
   ```

3. HTTPS-Zertifikat für die Subdomain aktivieren (z. B. Let's Encrypt im Hoster-Panel).

Es wird kein PHP, keine Datenbank und kein Build benötigt. Einzige externe Ressource ist
die Schrift „Pixelify Sans“ von Google Fonts. Fehlt sie, fällt die Seite auf eine
Monospace-Schrift zurück.

Nach Textänderungen in `texts.js` reicht es, nur diese Datei neu hochzuladen.
