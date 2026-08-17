import type { Item } from "@/game/types";

export const ITEMS: Item[] = [
  {
    id: "hypospray",
    name: "Hypospray",
    description: "Füllt die halbe Energieleiste auf.",
    effect: { kind: "heal", amount: "half" },
    usableIn: ["field", "battle"],
  },
  {
    id: "strong_hypospray",
    name: "Starkes Hypospray",
    description: "Füllt die gesamte Energieleiste auf.",
    effect: { kind: "heal", amount: "full" },
    usableIn: ["field", "battle"],
  },
  {
    id: "rokeg_blood_pie",
    name: "Rokeg-Blutpastete",
    description: "Füllt den halben Attackenbalken wieder auf.",
    effect: { kind: "restoreAp", amount: "half" },
    usableIn: ["field", "battle"],
  },
  {
    id: "targ_heart",
    name: "Targ-Herz",
    description: "Füllt den gesamten Attackenbalken wieder auf.",
    effect: { kind: "restoreAp", amount: "full" },
    usableIn: ["field", "battle"],
  },
  {
    id: "tricorder",
    name: "Trikorder",
    description: "Erhöht die Erfahrung um 30% zur nächsten Stufe.",
    effect: { kind: "xpBoost", percent: 30 },
    usableIn: ["field"],
  },
  {
    id: "padd",
    name: "PADD",
    description: "Erhöht die Erfahrung um 30% zur nächsten Stufe.",
    effect: { kind: "xpBoost", percent: 30 },
    usableIn: ["field"],
  },
  {
    id: "universal_translator",
    name: "Universalübersetzer",
    description: "Erhöht die Erfahrung um 45% zur nächsten Stufe.",
    effect: { kind: "xpBoost", percent: 45 },
    usableIn: ["field"],
  },
  {
    id: "phaser",
    name: "Phaser",
    description: "Zieht dem Gegner im Kampf die halbe aktuelle Energie ab.",
    effect: { kind: "drainEnemyHalf" },
    usableIn: ["battle"],
  },
  {
    id: "disruptor",
    name: "Disruptor",
    description: "Besiegt den Gegner sofort. Gibt es nur einmal im ganzen Spiel.",
    effect: { kind: "instantWin" },
    usableIn: ["battle"],
    maxCount: 1,
  },
  // Sammelfiguren: jede erhöht das Spielerlevel sofort um 1. Sehr selten, gut versteckt.
  { id: "figur_kirk", name: "Sammelfigur: Kirk", description: "Eine seltene Kirk-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_spock", name: "Sammelfigur: Spock", description: "Eine seltene Spock-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_picard", name: "Sammelfigur: Picard", description: "Eine seltene Picard-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_riker", name: "Sammelfigur: Riker", description: "Eine seltene Riker-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_troy", name: "Sammelfigur: Troy", description: "Eine seltene Troy-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_burnham", name: "Sammelfigur: Burnham", description: "Eine seltene Burnham-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_seven", name: "Sammelfigur: 7 of 9", description: "Eine seltene 7-of-9-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_janeway", name: "Sammelfigur: Janeway", description: "Eine seltene Janeway-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_sisko", name: "Sammelfigur: Sisko", description: "Eine seltene Sisko-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
  { id: "figur_paris", name: "Sammelfigur: Tom Paris", description: "Eine seltene Tom-Paris-Sammelfigur. Erhöht dein Level um 1.", effect: { kind: "levelUp", amount: 1 }, usableIn: ["field"], maxCount: 1 },
];

export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i])
);

export function getItem(id: string): Item {
  const item = ITEMS_BY_ID[id];
  if (!item) throw new Error(`Unknown item id: ${id}`);
  return item;
}

/** Items available in unlimited quantity at the convention-hall booths (bought with no currency: free pickup, respawns are not allowed once collected per playthrough slot, but each booth offers multiple distinct slots). */
export const BOOTH_ITEM_IDS = [
  "hypospray",
  "strong_hypospray",
  "rokeg_blood_pie",
  "targ_heart",
  "tricorder",
  "padd",
  "universal_translator",
];
