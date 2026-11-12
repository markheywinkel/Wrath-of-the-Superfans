# Space

Ein ruhiges Pixel-Browserspiel: Ein kleines Raumschiff fliegt per Tippen durch ein
Sonnensystem (Sonne, 5 Planeten, 3 Monde um den Gasriesen, Asteroidengürtel als Bogen über ein Fünftel des Randes)
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

Das Spiel beginnt mit einem Startmenü (»Space Delivery«, Start-Button); danach folgt Kapitel 1.
Alle Einblendungen (Dialoge, Badges, Meldungen, große Texte beim Einsammeln, Zwischensequenzen) laufen über eine gemeinsame Warteschlange und stehen nie gleichzeitig im Bild.

Das Spiel ist in Kapitel eingeteilt:

1. **Gute Reise!** – Sonnensystem, erste Aufträge.
2. **Die Kometen kommen** – nach den ersten fünf Aufträgen (mit kurzer Zwischensequenz): neue Aufträge, Kometen, Relikte.
3. **Das Wurmloch** – sobald alle fünf Kometen gefangen sind, öffnet sich nach der Kapiteltafel (etwa vier Sekunden) dort, wo man gerade ist, ein Wurmloch (Zwischensequenz). Die übrigen Aufträge aus Kapitel 2 laufen weiter. Dahinter liegt ein großes Urlaubssystem mit lila Himmel, Doppelsonne, den weit auseinanderliegenden Planeten Monos, Qratos und Stypos, einem Asteroidengürtel über ein Drittel des Randes und den Kreuzfahrtschiffen Vida, Zida und Yipa, die schwerfällig zwischen den Planeten und um die Doppelsonne kreuzen. Die Figuren im alten Gebiet sprechen dann über das Wurmloch.
   - Im Urlaubssystem liegen zehn lila Frachtcontainer (eigener Zähler oben links) → Badge Müllabfuhr, Antrieb +10 %.
   - Zwei sehr schnelle Kometen umkreisen die Doppelsonne; jeder gefangene Komet bringt +10 %.
   - Gwynn (im Nebel) bittet um drei Alien-Relikte: eines im Nebel, eines im Sonnensystem, eines im Urlaubssystem. Alle drei gefunden → kurze Zwischensequenz: das Schiff hält an, leuchtet auf und wird golden (Antrieb +10 %), danach freut sich »Du« über die stärkeren Schilde.
   - Im Norden des Urlaubssystems liegt ein goldenes Wurmloch. Erst mit goldenem Schiff kommt man hindurch und landet im Sektor der Alten: viele schwebende Metallsphären der alten Zivilisation (Silber, Gold, Bronze), sieben davon Wohnsphären von Aliens (Gnyyyk, Shzzzn, Napppaap, Kikkyyyk, Szyyypp, Ikkk, Bbbipp). Betreten → Badge Alienforscher, Antrieb +10 %.
   - Ohne Übersetzer sprechen die Aliens nur Kauderwelsch. Gwynn schickt einen zu Balthasar; er baut aus den Relikten einen Übersetzer (sobald alle fünf Relikte bei ihm sind). Hat man mit einem Alien gesprochen und erzählt es Balthasar, zieht er selbst in den Sektor der Alten und fliegt dort umher. Die Aufgabenliste oben links führt durch die Geschichte: »Flieg zu den Aliens« (mit goldenem Schiff) → »Die Aliens verstehen« → nach Gwynns Hinweis »Balthasar finden« → mit Übersetzer »Sprich mit den Aliens«.

- Die Spielfigur heißt **Du**: Astronautin mit Helm im hellblauen Anzug. Die anderen Figuren sind Astronautinnen und Astronauten, mal mit Helm, mal ohne, in grellen Anzügen. Tippen/Klicken auf eine Stelle: Das Schiff fliegt geradlinig hin, Planeten werden umflogen.
- Tippen auf Sonne, Planet oder Mond: hinfliegen, Orbit. Name und Beschreibung erscheinen direkt am Objekt, um das man kreist.
- In der Nähe von Planeten, Stationen, dem Wrack und anderen Schiffen erscheint deren Name als kleines Schild.
- Tippen auf eine Raumstation oder ein anderes Raumschiff: hinfliegen und ansprechen. Bei Begegnungen treiben beide Schiffe nebeneinander, ein Dialog öffnet sich in der Bildmitte, das Bild dahinter wird unscharf: beide Figuren nebeneinander (wer spricht, ist etwas größer), darunter Name und Text (was »Du« sagt, in Hellblau), ganz unten »Weiter« in einer Box. Auch hinter den Kapiteltafeln (mit Filmbalken) wird das Bild unscharf. Name und Beschreibung des Schiffs stehen dabei direkt am Schiff.
- **Quests:** Jedes der drei Schiffe und jede der zwei Stationen gibt einen Auftrag (»!« über dem Auftraggeber). Den Gegenstand bringt man zum Zielplaneten (blaue Raute über dem Planeten).
- **Sammeln:** 30 Kristalle (jeder macht den Antrieb 1 % schneller) und 10 verlorene Frachtcontainer.
- **Zweite Runde:** Sind die ersten fünf Aufträge erledigt, geht es weiter:
  - Vier neue Lieferungen (Sieben Kräuter, Perlenkette, Geheimnisvoller Koffer, Kostbares Mineral).
  - Die Forschungsstation gibt den Auftrag, fünf Kometen zu fangen. Die Kometen ziehen schnelle Ellipsenbahnen um die Sonne, etwa so schnell wie das Schiff im Standardflug; mit jedem Kristall und Antriebs-Upgrade wird es leichter. Antippen eines Kometen nimmt die Verfolgung auf.
  - Fünf Relikte tauchen auf, dazu das Händlerschiff Wunderkammer mit dem Kuriositätenhändler, der sie entgegennimmt.
- **Rand:** Der Asteroidengürtel umspannt nur ein Fünftel des Systems (unten links). Fliegt man irgendwo zu weit hinaus – im Sonnensystem, im Nebel oder im Urlaubssystem –, erscheint »Du fliegst zu weit hinaus, kehr um!« und das Schiff kehrt um.
- **Nebel:** Oben rechts schließt sich fließend ein großes grünes Nebel-Gebiet an (das Wrack – eine zerschrammte, aufgerissene Metallsphäre – liegt ein gutes Stück im Inneren); ein breiter, unmarkierter Übergang führt hinein, der Nebel wird zum Rand hin allmählich dichter. Schiffe verdrängen den Nebel ein wenig, danach bildet er sich langsam nach. Darin liegt mit einem alten Raumschiffwrack und dem Dunklen Planeten. Tippt man ein Ziel im anderen Bereich an, fliegt das Schiff automatisch durch die Lücke.
  - Im Wrack wohnt eine körperlose Entität: Sie braucht das Blaue Elixier von Cies. Danach wird sie wieder zu Gwynn, einer Forscherin, und fliegt selbst durchs Gebiet.
  - Auf dem Dunklen Planeten bittet ein einsamer Reisender um fünf Teile seines Raumschiffs. Danach stellt er sich als Justus vor und fliegt ebenfalls umher.
- **Badges** (oben rechts als runde Pixel-Abzeichen; Antippen zeigt Name und Beschreibung). Ein neues Badge erscheint als eine Meldung mit Abzeichen, Name und darunter dem Geschwindigkeitsbonus:
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
  - Müllabfuhr: alle zehn Container im Urlaubssystem → Antrieb +10 %
  - Alienforscher: den Sektor der Alten betreten → Antrieb +10 %
  - Foody: bei Szyyypp (mit Übersetzer) Trrryyypb probiert → Antrieb +10 %
  - Weltenbummler: alle anderen Badges und alle Aufträge → Abschlussdialog in der Bildmitte (Hintergrund unscharf) mit »Weiterfliegen« oder »Neu beginnen«
- **Musik:** sphärische 16-Bit-Hintergrundmusik, direkt im Browser erzeugt (keine Dateien), ein eigenes Stück je Gebiet: Sonnensystem (warm, C-Dur/Lydisch), Nebel (geheimnisvoll, D-Dorisch, Wind), Urlaubssystem (entspannt, F-Dur mit leichtem Bossa-Schwung), Sektor der Alten (golden, Ganztonklänge, Glocken). Beim Gebietswechsel wird übergeblendet; die Melodie variiert bei jedem Durchlauf. Läuft schon im Startmenü (sofern der Browser Klang ohne Berührung erlaubt, sonst ab der ersten Berührung, dem ersten Klick oder Tastendruck), der Lautsprecher-Schalter schaltet auch die Musik aus. Die Stücke stehen in `game.js` unter `TRACKS`.
- Weiche Klänge (direkt im Browser erzeugt, keine Dateien) beim Einsammeln von Kristallen und Containern, bei neuen Badges und beim Abliefern. Oben rechts schaltet ein Lautsprecher-Symbol den Ton aus und an (diese Einstellung merkt sich der Browser).
- Links unten öffnet ein »i« einen Info-Dialog über das Spiel (Hintergrund unscharf, »Zurück zum Spiel«).
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
