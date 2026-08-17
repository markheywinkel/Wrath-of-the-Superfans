import type { InventoryEntry, PlayerStats } from "@/game/types";

const SAVE_KEY = "wrath-of-the-superfans:save:v1";

export interface SaveData {
  player: PlayerStats;
  knownAttackIds?: string[];
  inventory: InventoryEntry[];
  currentRoomId: string;
  playerX: number;
  playerY: number;
  defeatedEnemyIds: string[];
  collectedItemIds: string[];
}

export function loadSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage kann in manchen Kontexten (privates Fenster o.ä.) fehlschlagen - Speichern ist rein komfortabel.
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
}
