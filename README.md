# Wrath of the Superfans

Ein browserbasiertes 8-Bit-Rollenspiel im Stil von Game-Boy-Pokémon / *Zelda: A Link to the Past*.
Schauplatz ist die größte Star-Trek-Convention aller Zeiten – du läufst frei durchs Gelände, sprichst
mit anderen Besucher:innen, sammelst Items und kämpfst rundenbasiert darum, wer der ultimative
Superfan ist.

Gebaut mit **Next.js 14 (App Router) + TypeScript**, gerendert auf einem `<canvas>` – kein Asset-Pipeline
nötig, alle Sprites/Tiles werden zur Laufzeit aus Farbpaletten gezeichnet. Kein Backend, kein Build-Step
über Next.js hinaus, direkt auf **Vercel** deploybar.

## Spielen

```bash
npm install
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen.

- **Pfeiltasten**: bewegen
- **Leertaste**: Dialoge starten / weiterklicken, Gegenstände & Personen ansprechen
- **I**: Gepäck öffnen/schließen (Items außerhalb des Kampfes benutzen)
- Fortschritt wird automatisch in `localStorage` gespeichert (Start-Bildschirm bietet "Fortsetzen" an).

## Deployment auf Vercel

1. Repo bei [vercel.com/new](https://vercel.com/new) importieren.
2. Framework-Preset „Next.js“ wird automatisch erkannt, keine weitere Konfiguration nötig.
3. Deploy — fertig.

## Spielkonzept

### Fan-Typen & Effektivität

Es gibt drei Fan-Typen für Attacken und Gegner: **Old Trek**, **New Trek**, **Superfan**.

- Old-Trek-Attacken sind effektiv (1,5× Schaden) gegen New-Trek-Gegner.
- New-Trek-Attacken sind effektiv gegen Old-Trek-Gegner.
- Superfan-Attacken sind gegen **alle** Gegnertypen effektiv.

### Werte & Level

- Der Spieler startet auf **Level 0** mit 50 Energie (HP) und 20 Attackenenergie (AP).
- Pro Level: **+10 max. Energie**, **+4 max. Attackenenergie** (siehe `src/game/state/leveling.ts`).
- Erfahrungsbedarf für Level *n → n+1*: `15 + n·7` (bewusst flach kalibriert, siehe unten).
- Ein besiegter Gegner gibt `Gegnerlevel × 15` Erfahrungspunkte.
- Jede Attacke kostet AP; ist der Attackenbalken leer, bleibt nur der kostenlose
  „Verzweifelte Klaps“ (5 Schaden, nie typ-effektiv).
- Schaden = `Angriffskraft × (1 + Level·0,03) × Typ-Multiplikator`.

### Kampf-Dialoge

Jede Begegnung mit einem NPC läuft nach demselben Schema ab (Zeilen zufällig aus
Pools in `src/game/data/battleDialogues.ts`):

1. **Dialog 1** beim Ansprechen eines noch unbesiegten Gegners → Kampf beginnt.
2. **Dialog 2**, wenn der Spieler gewinnt → zurück ins Feld. Der Sieg ist **endgültig**:
   ein erneutes Ansprechen startet keinen neuen Kampf mehr.
3. **Dialog 3**, wenn der Spieler verliert → Wiederbelebung mit halber Energie am
   Raumeingang, der Gegner bleibt aktiv und kann erneut angesprochen werden (zurück zu Dialog 1).
4. **Dialog 4** beim erneuten Ansprechen eines bereits besiegten Gegners → nur Small-Talk, kein Kampf.

Da Kämpfe dadurch einmalig sind, ist die XP-Kurve so kalibriert, dass die
Rivalen **jedes einzelnen Raums** gerade ausreichen, um das nächste
Gate-Boss-Level zu erreichen – kein Grinding nötig, aber auch kein Fight
auslassbar.

### Rundenkampf

Kampfbildschirm im Pokémon-Stil: Energie- und Attackenenergie-Balken für Spieler und Gegner,
Menü mit **Attacke** (alle 30 Attacken, gruppiert nach Typ, deaktiviert wenn zu teuer) und
**Item** (nur kampftaugliche Items). Gegner wählen zufällig aus ihren erlernten, bezahlbaren Attacken.

### Die Convention (7 Räume)

Ein zusammenhängendes Gelände aus sieben Bereichen, verbunden durch Türen. Jeder Übergang wird von
einem **Gate-Boss** mit festem Level bewacht (5 / 10 / 15 / 20 / 25 / 30) – erst wer dieses
Spielerlevel erreicht hat, kann ihn bezwingen; danach ist der Weg dauerhaft frei.

1. **Convention-Halle** (Start) – mehrere Merchandise-Stände mit vielen Items.
2. **Brücke der TOS-Enterprise**
3. **Holodeck**
4. **Brücke der Enterprise-D**
5. **Borg-Schiff**
6. **Brücke der Discovery**
7. **Holodeck-Finale** – drei Level-40-Gegner (Old, New, Super) direkt hintereinander, das
   Holodeck "rekonfiguriert" sich zwischen den Kämpfen. Sieg über alle drei = Spielende.

Die normalen Rivalen in jedem Raum sind **beliebig oft wiederholbar** (klassisches „Rematch"), damit
genug Erfahrung für die Level-Sprünge zwischen den Gate-Bossen gesammelt werden kann. Gate-Bosse und
die drei Finale-Gegner sind dagegen **einmalig**.

### Items

| Item | Effekt |
|---|---|
| Hypospray | +50 % Energie |
| Starkes Hypospray | Energie voll |
| Rokeg-Blutpastete | +50 % Attackenenergie |
| Targ-Herz | Attackenenergie voll |
| Trikorder / PADD | +30 % Erfahrung zur nächsten Stufe |
| Universalübersetzer | +45 % Erfahrung zur nächsten Stufe |
| Phaser | zieht dem Gegner im Kampf die halbe aktuelle Energie ab |
| Disruptor | besiegt den Gegner sofort – existiert nur **einmal** im Spiel |
| Sammelfiguren (Kirk, Spock, Picard, Riker, Troi, Burnham, 7 of 9, Janeway, Sisko, Tom Paris) | je +1 Level, sehr selten & gut versteckt |

## Projektstruktur

```
src/
  app/                    Next.js App-Router-Einstieg (layout, page, globals.css)
  game/
    types.ts              Zentrale Typdefinitionen
    data/                 Attacken, Items, Gegner, Räume/Karten (reine Daten)
    state/                Leveling-Formeln, Kampf-Mathematik, Speicherstand, useGame()-Hook
    engine/                Canvas-Konstanten, Sprite-Paletten, Zeichenfunktionen
    components/           React-Komponenten (Canvas, HUD, Dialog, Kampf, Menüs, Screens)
```

## Design-Hinweise & bewusste Vereinfachungen

- **Pixel-Art wird zur Laufzeit gezeichnet** (Farbpaletten + ein gemeinsames 16×16-Sprite-Template),
  es gibt keine Bild-Assets. Das hält das Projekt abhängigkeitsfrei und lizenzsicher, sieht aber
  bewusst reduziert aus statt wie handgezeichnete Sprites.
- Die **New-Trek-Attackenliste** enthielt in der Anfrage nur 3 Einträge; sie wurde um 7 thematisch
  passende Attacken ergänzt, damit der Typ ausbalanciert spielbar ist (siehe Kommentar in
  `src/game/data/attacks.ts` – jederzeit ersetzbar).
- Der Spieler hat von Anfang an Zugriff auf alle Attacken aller drei Typen (Leveling verbessert nur
  die Balken, keine Attacken-Freischaltung) – das war in der Aufgabenstellung offen und wurde
  pragmatisch so festgelegt.
