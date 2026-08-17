import type { Attack } from "@/game/types";

// Old-Trek-Attacken: effektiv gegen "New Trek"-Gegner.
const oldTrekAttacks: Attack[] = [
  { id: "enterprise_baupläne", name: "Enterprise-Baupläne", type: "old", power: 13, apCost: 6, description: "Du breitest detaillierte Baupläne der NCC-1701 aus und erschlägst dein Gegenüber mit Fakten." },
  { id: "kirk_trivia", name: "Kirk-Trivia", type: "old", power: 9, apCost: 4, description: "Ein spontanes Zitat-Duell über James T. Kirk." },
  { id: "spock_trivia", name: "Spock-Trivia", type: "old", power: 9, apCost: 4, description: "Faszinierend logisches Fachwissen über den Vulkanier." },
  { id: "mccoy_trivia", name: "McCoy-Trivia", type: "old", power: 9, apCost: 4, description: "'Verdammt, ich bin Arzt, kein...' – Trivia über Pille McCoy." },
  { id: "uhura_trivia", name: "Uhura-Trivia", type: "old", power: 9, apCost: 4, description: "Kommunikationswissen rund um Nyota Uhura." },
  { id: "gorn_trivia", name: "Gorn-Trivia", type: "old", power: 10, apCost: 4, description: "Zischendes Spezialwissen über die Echsen von Cestus III." },
  { id: "picard_trivia", name: "Picard-Trivia", type: "old", power: 9, apCost: 4, description: "'Tea, Earl Grey, hot.' – Wissenswertes über Jean-Luc Picard." },
  { id: "picard_manöver", name: "Picard-Manöver", type: "old", power: 17, apCost: 8, description: "Ein getarntes taktisches Manöver, das jeden Gegner verwirrt." },
  { id: "riker_trivia", name: "Riker-Trivia", type: "old", power: 9, apCost: 4, description: "Fakten über den ersten Offizier William Riker." },
  { id: "riker_manöver", name: "Riker-Manöver", type: "old", power: 15, apCost: 7, description: "Ein selbstbewusster taktischer Schachzug im Riker-Stil." },
  { id: "riker_anmachsprüche", name: "Riker-Anmachsprüche", type: "old", power: 14, apCost: 6, description: "Charmeoffensive mit den schlimmsten Anmachsprüchen der Sternenflotte." },
  { id: "troy_trivia", name: "Troy-Trivia", type: "old", power: 9, apCost: 4, description: "Empathisches Fachwissen über Deanna Troi." },
  { id: "borg_wissen", name: "Borg-Wissen", type: "old", power: 16, apCost: 7, description: "Widerstand ist zwecklos – geballtes Kollektiv-Wissen." },
  { id: "janeway_trivia", name: "Janeway-Trivia", type: "old", power: 9, apCost: 4, description: "Kaffee, schwarz – Trivia über Captain Janeway." },
  { id: "sisko_trivia", name: "Sisko-Trivia", type: "old", power: 10, apCost: 4, description: "Bajoranisches Spezialwissen über Captain Sisko." },
];

// New-Trek-Attacken: effektiv gegen "Old Trek"-Gegner.
// Hinweis: Vom Nutzer wurden bislang nur die ersten drei Attacken vorgegeben
// ("weitere Attacken kommen noch"). Die übrigen sind thematisch passend
// ergänzt, damit der Typ spielbar/ausbalanciert ist, und können jederzeit
// ersetzt werden (siehe src/game/data/attacks.ts).
const newTrekAttacks: Attack[] = [
  { id: "sporenantrieb", name: "Sporenantrieb 1x1", type: "new", power: 16, apCost: 7, description: "Ein Sprung durchs Mycel-Netzwerk trifft den Gegner aus dem Nichts." },
  { id: "jj_abrams_trivia", name: "J.J. Abrams-Trivia", type: "new", power: 9, apCost: 4, description: "Lens-Flare-lastiges Wissen über die Kelvin-Filme." },
  { id: "kelvin_timeline_fakten", name: "Kelvin-Timeline-Fakten", type: "new", power: 10, apCost: 4, description: "Fakten über die alternative Zeitlinie ab 2233." },
  { id: "burnham_trivia", name: "Burnham-Trivia", type: "new", power: 9, apCost: 4, description: "Wissen über Michael Burnham und ihre Meuterei." },
  { id: "pike_trivia", name: "Pike-Trivia", type: "new", power: 9, apCost: 4, description: "Strange-New-Worlds-Fachwissen über Captain Pike." },
  { id: "seven_of_nine_trivia", name: "Seven-of-Nine-Trivia", type: "new", power: 10, apCost: 4, description: "Wissen über Seven of Nine und ihre Rückkehr in Picard." },
  { id: "short_treks_wissen", name: "Short-Treks-Wissen", type: "new", power: 9, apCost: 4, description: "Obskures Detailwissen aus den Kurzfilmen." },
  { id: "snap_wende", name: "Snap-Wende", type: "new", power: 15, apCost: 7, description: "Ein blitzschnelles taktisches Manöver im modernen Stil." },
  { id: "holo_ansager_sprüche", name: "Holo-Ansager-Sprüche", type: "new", power: 13, apCost: 6, description: "Lower-Decks-Sprüche, die den Gegner aus dem Konzept bringen." },
  { id: "klingon_redesign_wissen", name: "Klingonisches Discovery-Redesign", type: "new", power: 12, apCost: 5, description: "Streitgespräch über das neue Klingonen-Design." },
];

// Superfan-Attacken: effektiv gegen alle Gegner-Typen.
const superfanAttacks: Attack[] = [
  { id: "klingonisch_c2", name: "Klingonisch C2", type: "super", power: 18, apCost: 8, description: "Fließendes Klingonisch, Niveau C2, brüllt jeden Zweifel nieder." },
  { id: "vulkanisch_c2", name: "Vulkanisch C2", type: "super", power: 18, apCost: 8, description: "Perfektes Vulkanisch – logisch unwiderlegbar." },
  { id: "q_wissen", name: "Q-Wissen", type: "super", power: 20, apCost: 9, description: "Allwissendes Q-Kontinuum-Wissen, mit einem Fingerschnippen serviert." },
  { id: "fal_tor_voh", name: "Fal-tor-voh", type: "super", power: 22, apCost: 10, description: "Das Ritual der Wiedervereinigung von Geist und Seele – zutiefst beeindruckend." },
  { id: "kobayashi_maru", name: "Kobayashi Maru", type: "super", power: 25, apCost: 12, description: "Der ultimative Test, den man laut Definition nicht gewinnen kann – und du gewinnst trotzdem." },
];

export const ATTACKS: Attack[] = [...oldTrekAttacks, ...newTrekAttacks, ...superfanAttacks];

export const ATTACKS_BY_ID: Record<string, Attack> = Object.fromEntries(
  ATTACKS.map((a) => [a.id, a])
);

export function getAttack(id: string): Attack {
  const attack = ATTACKS_BY_ID[id];
  if (!attack) throw new Error(`Unknown attack id: ${id}`);
  return attack;
}

export const OLD_TREK_ATTACK_IDS = oldTrekAttacks.map((a) => a.id);
export const NEW_TREK_ATTACK_IDS = newTrekAttacks.map((a) => a.id);
export const SUPERFAN_ATTACK_IDS = superfanAttacks.map((a) => a.id);

/** Der Spieler startet mit genau diesen 4 Attacken (2 Old-Trek, 2 New-Trek). */
export const STARTER_ATTACK_IDS = ["kirk_trivia", "spock_trivia", "jj_abrams_trivia", "kelvin_timeline_fakten"];
