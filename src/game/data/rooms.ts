import type { RoomDefinition } from "@/game/types";
import { blankGrid, fillRect, setTile } from "@/game/data/mapUtils";

// Jeder "Gate"-Raum folgt demselben Muster: ein offener Bereich zum Grinden im
// Westen, eine Trennwand mit genau einer Lücke (bewacht vom Gate-Boss) und ein
// Ausgang im Osten, der erst nach dessen Niederlage passierbar wird.
function makeGateRoom(opts: {
  id: string;
  name: string;
  width: number;
  height: number;
  chokeY: number;
  interior: RoomDefinition["tiles"][number][number];
  entryFrom: string;
  entryX?: number;
}) {
  const { width, height, chokeY } = opts;
  const grid = blankGrid(width, height, opts.interior);
  const partitionX = width - 4;
  fillRect(grid, partitionX, 1, partitionX, height - 2, "wall");
  setTile(grid, partitionX, chokeY, opts.interior);
  setTile(grid, width - 1, chokeY, "door");
  return grid;
}

// ---------------- Raum 1: Convention-Halle ----------------
const HALL_W = 26;
const HALL_H = 15;
const hallGrid = blankGrid(HALL_W, HALL_H, "carpet");
const hallPartitionX = HALL_W - 4;
fillRect(hallGrid, hallPartitionX, 1, hallPartitionX, HALL_H - 2, "wall");
setTile(hallGrid, hallPartitionX, 7, "carpet");
setTile(hallGrid, HALL_W - 1, 7, "door");
// Messestände (Booths)
fillRect(hallGrid, 3, 2, 4, 3, "console");
fillRect(hallGrid, 8, 2, 9, 3, "console");
fillRect(hallGrid, 13, 2, 14, 3, "console");
fillRect(hallGrid, 3, 10, 4, 11, "console");
fillRect(hallGrid, 8, 10, 9, 11, "console");
fillRect(hallGrid, 13, 10, 14, 11, "console");

const hallRoom: RoomDefinition = {
  id: "hall",
  name: "Convention-Halle",
  width: HALL_W,
  height: HALL_H,
  tiles: hallGrid,
  entryPoints: { start: { x: 2, y: 7 } },
  ambient: "Der Geruch von Popcorn und Latex-Ohren liegt in der Luft. Überall Stände voller Merchandise.",
  npcs: [
    { id: "rival_trekkie_ola", name: "Trekkie Ola", x: 6, y: 6, sprite: "old", interaction: { kind: "battle", enemyId: "rival_trekkie_ola" } },
    { id: "rival_streamer_ben", name: "Streamer Ben", x: 11, y: 6, sprite: "new", interaction: { kind: "battle", enemyId: "rival_streamer_ben" } },
    { id: "rival_cosplay_una", name: "Cosplayerin Una", x: 16, y: 6, sprite: "super", interaction: { kind: "battle", enemyId: "rival_cosplay_una" } },
    { id: "rival_quiz_master_devi", name: "Quizmaster Devi", x: 19, y: 11, sprite: "old", interaction: { kind: "battle", enemyId: "rival_quiz_master_devi" } },
    { id: "npc_organizer", name: "Congress-Organisatorin", x: 12, y: 12, sprite: "neutral", interaction: { kind: "chat", lines: [{ speaker: "Organisatorin", text: "Willkommen bei WRATH CON! Sammle Items an den Ständen und beweise dich im Kampf." }, { speaker: "Organisatorin", text: "Hinter der Absperrung im Osten wartet der erste Wächter. Level 5 solltest du schon sein." }] } },
    { id: "gate_boss_1", name: "Original-Cast-Zelot", x: hallPartitionX, y: 7, sprite: "boss", interaction: { kind: "battle", enemyId: "gate_boss_1" } },
  ],
  items: [
    { id: "hall_ip1", itemId: "hypospray", x: 5, y: 4 },
    { id: "hall_ip2", itemId: "hypospray", x: 10, y: 4 },
    { id: "hall_ip3", itemId: "tricorder", x: 15, y: 4 },
    { id: "hall_ip4", itemId: "padd", x: 5, y: 12 },
    { id: "hall_ip5", itemId: "rokeg_blood_pie", x: 10, y: 12 },
    { id: "hall_ip6", itemId: "targ_heart", x: 15, y: 12 },
    { id: "hall_ip7", itemId: "universal_translator", x: 20, y: 3 },
    { id: "hall_ip8", itemId: "figur_kirk", x: 2, y: 13, hidden: true },
  ],
  exits: [{ x: HALL_W - 1, y: 7, toRoom: "tos_bridge", requiresGateBossId: "gate_boss_1" }],
};

// ---------------- Gemeinsame Maße für die Gate-Räume ----------------
const GW = 22;
const GH = 13;
const CHOKE_Y = 6;

function gateExit(toRoom: string, requiresGateBossId: string) {
  return [{ x: GW - 1, y: CHOKE_Y, toRoom, requiresGateBossId }];
}

// ---------------- Raum 2: Brücke der TOS-Enterprise ----------------
const tosBridgeRoom: RoomDefinition = {
  id: "tos_bridge",
  name: "Brücke der TOS-Enterprise",
  width: GW,
  height: GH,
  tiles: makeGateRoom({ id: "tos_bridge", name: "", width: GW, height: GH, chokeY: CHOKE_Y, interior: "floor", entryFrom: "hall" }),
  entryPoints: { hall: { x: 1, y: 6 } },
  ambient: "Blinkende Konsolen im Retro-Look. Der Käptn-Sessel steht mitten im Raum.",
  npcs: [
    { id: "rival_sulu_fan", name: "Steuermann-Fan Cem", x: 5, y: 4, sprite: "old", interaction: { kind: "battle", enemyId: "rival_sulu_fan" } },
    { id: "rival_trivia_champ", name: "Trivia-Champ Noor", x: 10, y: 8, sprite: "new", interaction: { kind: "battle", enemyId: "rival_trivia_champ" } },
    { id: "rival_prime_directive_purist", name: "Direktiven-Purist Kalle", x: 14, y: 4, sprite: "old", interaction: { kind: "battle", enemyId: "rival_prime_directive_purist" } },
    { id: "gate_boss_2", name: "Nu-Trek-Enthusiast", x: GW - 4, y: CHOKE_Y, sprite: "boss", interaction: { kind: "battle", enemyId: "gate_boss_2" } },
  ],
  items: [
    { id: "tos_ip1", itemId: "strong_hypospray", x: 4, y: 9 },
    { id: "tos_ip2", itemId: "targ_heart", x: 8, y: 3 },
    { id: "tos_ip3", itemId: "figur_spock", x: 16, y: 10, hidden: true },
  ],
  exits: gateExit("holodeck1", "gate_boss_2"),
};

// ---------------- Raum 3: Holodeck ----------------
const holodeck1Room: RoomDefinition = {
  id: "holodeck1",
  name: "Holodeck",
  width: GW,
  height: GH,
  tiles: makeGateRoom({ id: "holodeck1", name: "", width: GW, height: GH, chokeY: CHOKE_Y, interior: "grass", entryFrom: "tos_bridge" }),
  entryPoints: { tos_bridge: { x: 1, y: 6 } },
  ambient: "Ein gelb-schwarzes Gitternetz flackert an den Wänden. Die Simulation läuft auf Hochtouren.",
  npcs: [
    { id: "rival_holodeck_glitch", name: "Simulierter Glitch-Fan", x: 5, y: 3, sprite: "new", interaction: { kind: "battle", enemyId: "rival_holodeck_glitch" } },
    { id: "rival_costume_contest_king", name: "Kostümwettbewerbs-König Theo", x: 9, y: 9, sprite: "old", interaction: { kind: "battle", enemyId: "rival_costume_contest_king" } },
    { id: "rival_simulation_addict", name: "Simulations-Süchtiger Farid", x: 14, y: 3, sprite: "super", interaction: { kind: "battle", enemyId: "rival_simulation_addict" } },
    { id: "gate_boss_3", name: "TNG-Purist", x: GW - 4, y: CHOKE_Y, sprite: "boss", interaction: { kind: "battle", enemyId: "gate_boss_3" } },
  ],
  items: [
    { id: "holo1_ip1", itemId: "hypospray", x: 4, y: 8 },
    { id: "holo1_ip2", itemId: "tricorder", x: 11, y: 4 },
    { id: "holo1_ip3", itemId: "figur_picard", x: 16, y: 10, hidden: true },
  ],
  exits: gateExit("enterpriseD_bridge", "gate_boss_3"),
};

// ---------------- Raum 4: Brücke der Enterprise D ----------------
const enterpriseDRoom: RoomDefinition = {
  id: "enterpriseD_bridge",
  name: "Brücke der Enterprise-D",
  width: GW,
  height: GH,
  tiles: makeGateRoom({ id: "enterpriseD_bridge", name: "", width: GW, height: GH, chokeY: CHOKE_Y, interior: "carpet", entryFrom: "holodeck1" }),
  entryPoints: { holodeck1: { x: 1, y: 6 } },
  ambient: "Elegantes Holzdekor und der berühmte Kommandosessel mit Armlehnen-Displays.",
  npcs: [
    { id: "rival_ops_officer", name: "Ops-Offizierin Lena", x: 5, y: 4, sprite: "old", interaction: { kind: "battle", enemyId: "rival_ops_officer" } },
    { id: "rival_replicator_fan", name: "Replikator-Fan Timo", x: 9, y: 9, sprite: "new", interaction: { kind: "battle", enemyId: "rival_replicator_fan" } },
    { id: "rival_bridge_tourist", name: "Brücken-Tourist Anke", x: 14, y: 4, sprite: "old", interaction: { kind: "battle", enemyId: "rival_bridge_tourist" } },
    { id: "gate_boss_4", name: "Borg-Kollektiv-Fanatiker", x: GW - 4, y: CHOKE_Y, sprite: "boss", interaction: { kind: "battle", enemyId: "gate_boss_4" } },
  ],
  items: [
    { id: "ent_d_ip1", itemId: "strong_hypospray", x: 4, y: 9 },
    { id: "ent_d_ip2", itemId: "padd", x: 11, y: 3 },
    { id: "ent_d_ip3", itemId: "phaser", x: 17, y: 9, hidden: true },
    { id: "ent_d_ip4", itemId: "figur_riker", x: 16, y: 4, hidden: true },
  ],
  exits: gateExit("borg_ship", "gate_boss_4"),
};

// ---------------- Raum 5: Borg-Schiff ----------------
const borgShipRoom: RoomDefinition = {
  id: "borg_ship",
  name: "Borg-Schiff",
  width: GW,
  height: GH,
  tiles: makeGateRoom({ id: "borg_ship", name: "", width: GW, height: GH, chokeY: CHOKE_Y, interior: "floor", entryFrom: "enterpriseD_bridge" }),
  entryPoints: { enterpriseD_bridge: { x: 1, y: 6 } },
  ambient: "Grünes Licht, surrende Regenerationsnischen an den Wänden. Es riecht nach heißer Elektronik.",
  npcs: [
    { id: "rival_assimilated_fan", name: "Assimilierter Fan #3 von 9", x: 5, y: 3, sprite: "old", interaction: { kind: "battle", enemyId: "rival_assimilated_fan" } },
    { id: "rival_resistance_cell", name: "Widerstandszelle Priya", x: 9, y: 9, sprite: "new", interaction: { kind: "battle", enemyId: "rival_resistance_cell" } },
    { id: "rival_drone_cosplayer", name: "Drohnen-Cosplayer Mo", x: 14, y: 3, sprite: "super", interaction: { kind: "battle", enemyId: "rival_drone_cosplayer" } },
    { id: "gate_boss_5", name: "Discovery-Stan", x: GW - 4, y: CHOKE_Y, sprite: "boss", interaction: { kind: "battle", enemyId: "gate_boss_5" } },
  ],
  items: [
    { id: "borg_ip1", itemId: "rokeg_blood_pie", x: 4, y: 8 },
    { id: "borg_ip2", itemId: "universal_translator", x: 11, y: 4 },
    { id: "borg_ip3", itemId: "figur_troy", x: 16, y: 9, hidden: true },
    { id: "borg_ip4", itemId: "figur_seven", x: 3, y: 10, hidden: true },
  ],
  exits: gateExit("discovery_bridge", "gate_boss_5"),
};

// ---------------- Raum 6: Brücke der Discovery ----------------
const discoveryBridgeRoom: RoomDefinition = {
  id: "discovery_bridge",
  name: "Brücke der Discovery",
  width: GW,
  height: GH,
  tiles: makeGateRoom({ id: "discovery_bridge", name: "", width: GW, height: GH, chokeY: CHOKE_Y, interior: "carpet", entryFrom: "borg_ship" }),
  entryPoints: { borg_ship: { x: 1, y: 6 } },
  ambient: "Holografische Displays schweben über glänzenden Konsolen. Alles wirkt sehr aufgeräumt und neu.",
  npcs: [
    { id: "rival_spore_drive_engineer", name: "Sporenantrieb-Ingenieurin Zeynep", x: 5, y: 4, sprite: "new", interaction: { kind: "battle", enemyId: "rival_spore_drive_engineer" } },
    { id: "rival_burnham_superfan", name: "Burnham-Superfan Jonas", x: 9, y: 9, sprite: "new", interaction: { kind: "battle", enemyId: "rival_burnham_superfan" } },
    { id: "rival_lower_decks_fan", name: "Lower-Decks-Fan Robin", x: 14, y: 4, sprite: "new", interaction: { kind: "battle", enemyId: "rival_lower_decks_fan" } },
    { id: "gate_boss_6", name: "Der ultimative Convention-Champion", x: GW - 4, y: CHOKE_Y, sprite: "boss", interaction: { kind: "battle", enemyId: "gate_boss_6" } },
  ],
  items: [
    { id: "disco_ip1", itemId: "targ_heart", x: 4, y: 9 },
    { id: "disco_ip2", itemId: "strong_hypospray", x: 11, y: 3 },
    { id: "disco_ip3", itemId: "figur_burnham", x: 16, y: 9, hidden: true },
    { id: "disco_ip4", itemId: "figur_janeway", x: 17, y: 3, hidden: true },
    { id: "disco_ip5", itemId: "disruptor", x: 19, y: 10, hidden: true },
  ],
  exits: gateExit("holodeck_finale", "gate_boss_6"),
};

// ---------------- Raum 7: Holodeck-Finale ----------------
const FINALE_W = 20;
const FINALE_H = 12;
const finaleGrid = blankGrid(FINALE_W, FINALE_H, "grass");

const holodeckFinaleRoom: RoomDefinition = {
  id: "holodeck_finale",
  name: "Holodeck-Finale",
  width: FINALE_W,
  height: FINALE_H,
  tiles: finaleGrid,
  entryPoints: { discovery_bridge: { x: 1, y: 6 } },
  ambient: "Das Holodeck flackert und rekonfiguriert sich nach jedem Kampf neu – bereit für die nächste Simulation.",
  npcs: [
    { id: "finale_old", name: "Holo-Simulation: Der Ur-Fan", x: 6, y: 6, sprite: "boss", interaction: { kind: "battle", enemyId: "finale_old" } },
    { id: "finale_new", name: "Holo-Simulation: Die Streaming-Ära", x: 10, y: 6, sprite: "boss", requiresDefeatedEnemyId: "finale_old", interaction: { kind: "battle", enemyId: "finale_new" } },
    { id: "finale_super", name: "Holo-Simulation: Der ultimative Superfan", x: 14, y: 6, sprite: "boss", requiresDefeatedEnemyId: "finale_new", interaction: { kind: "battle", enemyId: "finale_super" } },
  ],
  items: [
    { id: "finale_ip1", itemId: "figur_sisko", x: 3, y: 3, hidden: true },
    { id: "finale_ip2", itemId: "figur_paris", x: 17, y: 9, hidden: true },
  ],
  exits: [],
};

export const ROOMS: RoomDefinition[] = [
  hallRoom,
  tosBridgeRoom,
  holodeck1Room,
  enterpriseDRoom,
  borgShipRoom,
  discoveryBridgeRoom,
  holodeckFinaleRoom,
];

export const ROOMS_BY_ID: Record<string, RoomDefinition> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r])
);

export function getRoom(id: string): RoomDefinition {
  const room = ROOMS_BY_ID[id];
  if (!room) throw new Error(`Unknown room id: ${id}`);
  return room;
}

export const FIRST_ROOM_ID = "hall";
