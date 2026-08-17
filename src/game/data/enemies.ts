import type { EnemyDefinition } from "@/game/types";

export const ENEMIES: EnemyDefinition[] = [
  // ---------- Raum 1: Convention-Halle (alle Level 1, nur Old/New, Endgegner Level 3) ----------
  {
    id: "rival_trekkie_ola",
    name: "Trekkie Ola",
    type: "old",
    level: 1,
    attackIds: ["kirk_trivia", "spock_trivia"],
  },
  {
    id: "rival_streamer_ben",
    name: "Streamer Ben",
    type: "new",
    level: 1,
    attackIds: ["jj_abrams_trivia", "kelvin_timeline_fakten"],
  },
  {
    id: "rival_cosplay_una",
    name: "Cosplayerin Una",
    type: "new",
    level: 1,
    attackIds: ["burnham_trivia", "pike_trivia"],
  },
  {
    id: "rival_quiz_master_devi",
    name: "Quizmaster Devi",
    type: "old",
    level: 1,
    attackIds: ["mccoy_trivia", "uhura_trivia", "gorn_trivia"],
  },
  {
    id: "gate_boss_1",
    name: "Original-Cast-Zelot",
    type: "old",
    level: 3,
    attackIds: ["kirk_trivia", "spock_trivia", "picard_manöver"],
    isGateBoss: true,
  },

  // ---------- Raum 2: Brücke der TOS-Enterprise (Level 6-9) ----------
  {
    id: "rival_sulu_fan",
    name: "Steuermann-Fan Cem",
    type: "old",
    level: 6,
    attackIds: ["uhura_trivia", "gorn_trivia"],
  },
  {
    id: "rival_trivia_champ",
    name: "Trivia-Champ Noor",
    type: "new",
    level: 7,
    attackIds: ["jj_abrams_trivia", "burnham_trivia"],
  },
  {
    id: "rival_prime_directive_purist",
    name: "Direktiven-Purist Kalle",
    type: "old",
    level: 9,
    attackIds: ["picard_trivia", "borg_wissen"],
  },
  {
    id: "gate_boss_2",
    name: "Nu-Trek-Enthusiast",
    type: "new",
    level: 10,
    attackIds: ["sporenantrieb", "snap_wende", "kelvin_timeline_fakten"],
    isGateBoss: true,
  },

  // ---------- Raum 3: Holodeck (Level 11-14) ----------
  {
    id: "rival_holodeck_glitch",
    name: "Simulierter Glitch-Fan",
    type: "new",
    level: 11,
    attackIds: ["holo_ansager_sprüche", "short_treks_wissen"],
  },
  {
    id: "rival_costume_contest_king",
    name: "Kostümwettbewerbs-König Theo",
    type: "old",
    level: 12,
    attackIds: ["riker_anmachsprüche", "troy_trivia"],
  },
  {
    id: "rival_simulation_addict",
    name: "Simulations-Süchtiger Farid",
    type: "super",
    level: 14,
    attackIds: ["q_wissen", "klingonisch_c2"],
  },
  {
    id: "gate_boss_3",
    name: "TNG-Purist",
    type: "old",
    level: 15,
    attackIds: ["picard_manöver", "riker_manöver", "borg_wissen"],
    isGateBoss: true,
  },

  // ---------- Raum 4: Brücke der Enterprise D (Level 16-19) ----------
  {
    id: "rival_ops_officer",
    name: "Ops-Offizier Lena",
    type: "old",
    level: 16,
    attackIds: ["riker_trivia", "troy_trivia"],
  },
  {
    id: "rival_replicator_fan",
    name: "Replikator-Fan Timo",
    type: "new",
    level: 18,
    attackIds: ["klingon_redesign_wissen", "seven_of_nine_trivia"],
  },
  {
    id: "rival_bridge_tourist",
    name: "Brücken-Tourist Anke",
    type: "old",
    level: 19,
    attackIds: ["janeway_trivia", "sisko_trivia"],
  },
  {
    id: "gate_boss_4",
    name: "Borg-Kollektiv-Fanatiker",
    type: "old",
    level: 20,
    attackIds: ["borg_wissen", "picard_manöver", "riker_manöver"],
    isGateBoss: true,
  },

  // ---------- Raum 5: Borg-Schiff (Level 21-24) ----------
  {
    id: "rival_assimilated_fan",
    name: "Assimilierter Fan #3 von 9",
    type: "old",
    level: 21,
    attackIds: ["borg_wissen", "gorn_trivia"],
  },
  {
    id: "rival_resistance_cell",
    name: "Widerstandszelle Priya",
    type: "new",
    level: 22,
    attackIds: ["sporenantrieb", "snap_wende"],
  },
  {
    id: "rival_drone_cosplayer",
    name: "Drohnen-Cosplayer Mo",
    type: "super",
    level: 24,
    attackIds: ["fal_tor_voh", "vulkanisch_c2"],
  },
  {
    id: "gate_boss_5",
    name: "Discovery-Stan",
    type: "new",
    level: 25,
    attackIds: ["sporenantrieb", "snap_wende", "holo_ansager_sprüche"],
    isGateBoss: true,
  },

  // ---------- Raum 6: Brücke der Discovery (Level 26-29) ----------
  {
    id: "rival_spore_drive_engineer",
    name: "Sporenantrieb-Ingenieurin Zeynep",
    type: "new",
    level: 26,
    attackIds: ["sporenantrieb", "klingon_redesign_wissen"],
  },
  {
    id: "rival_burnham_superfan",
    name: "Burnham-Superfan Jonas",
    type: "new",
    level: 28,
    attackIds: ["burnham_trivia", "pike_trivia"],
  },
  {
    id: "rival_lower_decks_fan",
    name: "Lower-Decks-Fan Robin",
    type: "new",
    level: 29,
    attackIds: ["holo_ansager_sprüche", "short_treks_wissen"],
  },
  {
    id: "gate_boss_6",
    name: "Der ultimative Convention-Champion",
    type: "super",
    level: 30,
    attackIds: ["kobayashi_maru", "q_wissen", "fal_tor_voh"],
    isGateBoss: true,
  },

  // ---------- Raum 7: Holodeck-Finale (3x Level 40, direkt hintereinander) ----------
  {
    id: "finale_old",
    name: "Holo-Simulation: Der Ur-Fan",
    type: "old",
    level: 40,
    attackIds: ["enterprise_baupläne", "picard_manöver", "borg_wissen", "riker_manöver"],
    isFinalGauntlet: true,
  },
  {
    id: "finale_new",
    name: "Holo-Simulation: Die Streaming-Ära",
    type: "new",
    level: 40,
    attackIds: ["sporenantrieb", "snap_wende", "holo_ansager_sprüche", "kelvin_timeline_fakten"],
    isFinalGauntlet: true,
  },
  {
    id: "finale_super",
    name: "Holo-Simulation: Der ultimative Superfan",
    type: "super",
    level: 40,
    attackIds: ["kobayashi_maru", "fal_tor_voh", "q_wissen", "klingonisch_c2"],
    isFinalGauntlet: true,
  },
];

export const ENEMIES_BY_ID: Record<string, EnemyDefinition> = Object.fromEntries(
  ENEMIES.map((e) => [e.id, e])
);

export function getEnemy(id: string): EnemyDefinition {
  const enemy = ENEMIES_BY_ID[id];
  if (!enemy) throw new Error(`Unknown enemy id: ${id}`);
  return enemy;
}

export const FINAL_GAUNTLET_IDS = ["finale_old", "finale_new", "finale_super"];
