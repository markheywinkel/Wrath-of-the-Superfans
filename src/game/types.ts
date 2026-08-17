// Core shared types for Wrath of the Superfans

export type FanType = "old" | "new" | "super";

export interface Attack {
  id: string;
  name: string;
  type: FanType;
  /** Base power of the attack, used in damage calculation. */
  power: number;
  /** Attack-energy (AP) cost to use this move. */
  apCost: number;
  description: string;
}

export type ItemEffect =
  | { kind: "heal"; amount: "half" | "full" }
  | { kind: "restoreAp"; amount: "half" | "full" }
  | { kind: "levelUp"; amount: number }
  | { kind: "xpBoost"; percent: number }
  | { kind: "drainEnemyHalf" }
  | { kind: "instantWin" };

export interface Item {
  id: string;
  name: string;
  description: string;
  effect: ItemEffect;
  /** Where the item may be used from. */
  usableIn: Array<"field" | "battle">;
  /** How many copies exist in the whole game world (undefined = shop/common, unlimited stock at booths). */
  maxCount?: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  type: FanType;
  level: number;
  attackIds: string[];
  /** Is this a gate boss that blocks a room transition? */
  isGateBoss?: boolean;
  isFinalGauntlet?: boolean;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

// Vor jedem Kampf (Dialog 1), nach Sieg (Dialog 2), nach Niederlage (Dialog 3)
// und beim erneuten Ansprechen eines bereits besiegten Gegners (Dialog 4)
// werden zufällige Zeilen aus den globalen Pools in src/game/data/battleDialogues.ts
// gezogen - Gegner brauchen dafür keine eigenen Dialogzeilen mehr.
export type NpcInteraction =
  | { kind: "battle"; enemyId: string }
  | { kind: "chat"; lines: DialogueLine[] }
  | { kind: "giveItem"; itemId: string; lines: DialogueLine[]; oneTime?: boolean };

export interface NpcDefinition {
  id: string;
  name: string;
  x: number;
  y: number;
  sprite: FanType | "neutral" | "boss";
  interaction: NpcInteraction;
  /** If set, this NPC only becomes visible/interactable once the referenced enemy id has been defeated. Used to chain the final gauntlet fights. */
  requiresDefeatedEnemyId?: string;
}

export interface ItemPickup {
  id: string;
  itemId: string;
  x: number;
  y: number;
  hidden?: boolean;
}

export type TileType = "floor" | "wall" | "door" | "carpet" | "console" | "water" | "grass" | "path";

export interface RoomDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Row-major grid of tile type codes. */
  tiles: TileType[][];
  npcs: NpcDefinition[];
  items: ItemPickup[];
  /** Tile coordinates the player enters at when arriving from the given previous room id ("start" for game start). */
  entryPoints: Record<string, { x: number; y: number }>;
  /** Exits: tile position -> target room + required min player level (via gate boss) */
  exits: Array<{
    x: number;
    y: number;
    toRoom: string;
    requiresGateBossId?: string;
  }>;
  ambient: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
}

export interface InventoryEntry {
  itemId: string;
  count: number;
}
