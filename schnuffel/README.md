# Schnuffels Wohnzimmer

Ein begehbares 3D-Wohnzimmer im Cel-Shading-Look, nachgebaut nach Fotos eines Altbau-Wohnzimmers.
Man steuert die Spielfigur Schnuffel durch den Raum und kann mit Dingen interagieren:
Lampen und Deckenlicht schalten, fernsehen, Ukulele spielen, Pflanzen gießen, Totoro knuddeln,
Wasser trinken, aufs Sofa setzen und Bücher lesen.

Reine statische Seite – kein Build, keine Abhängigkeiten, lädt nichts von fremden Servern.

| Datei / Ordner | Inhalt                                                              |
|----------------|---------------------------------------------------------------------|
| `index.html`   | Komplette Seite: Raum, Spielfigur, Steuerung, HUD                   |
| `vendor/`      | three.js r128 (MIT-Lizenz, `vendor/LICENSE-three.txt`)              |
| `fonts/`       | Fredoka & Nunito (SIL Open Font License, `fonts/OFL-*.txt`)         |
| `htaccess`     | Wird beim Upload als `.htaccess` in den Ordner gelegt               |

## Lokal starten

```bash
cd schnuffel
python3 -m http.server 8000
# http://localhost:8000
```

## Steuerung

- **WASD / Pfeiltasten**: laufen · **Leertaste**: hüpfen · **E**: benutzen
- **Maus ziehen**: Kamera drehen · **Mausrad**: zoomen
- Am Handy: Joystick links, „Hüpfen“ rechts, Aktion durch Tippen auf die Anzeige unten in der Mitte.

## Deployment auf markheywinkel.de/schnuffel

Der Inhalt dieses Ordners muss nach `webroots/www/schnuffel` auf den One.com-Webspace
(`htaccess` dabei als `.htaccess`). Dafür in der Upload-Action »Website auf One.com« im Repo
`digitales-storytelling` einen Schritt analog zu `space` ergänzen – nur mit Zielordner
`schnuffel` statt einer Subdomain. Eine Subdomain ist nicht nötig, weil die Seite als
Unterordner der Hauptdomain läuft.
