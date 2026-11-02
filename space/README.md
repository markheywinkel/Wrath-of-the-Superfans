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

## Deployment auf space.markheilwinkel.de (Vercel)

1. Auf vercel.com ein **neues Projekt** aus diesem Repo anlegen.
2. **Root Directory:** `space`, **Framework Preset:** `Other`, Build-Command leer lassen.
3. Unter *Settings → Domains* `space.markheilwinkel.de` hinzufügen.
4. Beim Domain-Anbieter einen DNS-Eintrag setzen: `CNAME space → cname.vercel-dns.com`.

Jeder andere statische Hoster (Netlify, GitHub Pages, eigener Webspace) funktioniert genauso:
einfach den Inhalt von `space/` hochladen.
