"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  DialogueLine,
  FanType,
  InventoryEntry,
  ItemEffect,
  NpcDefinition,
  PlayerStats,
} from "@/game/types";
import { getRoom, FIRST_ROOM_ID } from "@/game/data/rooms";
import { getEnemy, FINAL_GAUNTLET_IDS } from "@/game/data/enemies";
import { getAttack } from "@/game/data/attacks";
import { getItem } from "@/game/data/items";
import {
  applyLevelUp,
  applyXp,
  maxApForLevel,
  maxHpForLevel,
  xpForDefeatingEnemy,
  xpToNextLevel,
} from "@/game/state/leveling";
import { calcDamage, clamp, DESPERATE_ATTACK } from "@/game/state/battleLogic";
import { clearSave, loadSave, writeSave, type SaveData } from "@/game/state/save";

export type Direction = "up" | "down" | "left" | "right";
export type Screen = "start" | "field" | "dialogue" | "battle" | "win";
export type BattleMenu = "main" | "attacks" | "items";

export interface BattleState {
  npcId?: string;
  enemyId: string;
  enemyName: string;
  enemyType: FanType;
  enemyLevel: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAp: number;
  enemyMaxAp: number;
  enemyAttackIds: string[];
  menu: BattleMenu;
  log: string[];
  turn: "player" | "enemy";
  outcome: "ongoing" | "win" | "lose";
  isGateBoss: boolean;
  isFinalGauntlet: boolean;
}

type DialogueAfter =
  | { type: "none" }
  | { type: "startBattle"; enemyId: string; npcId: string };

interface DialogueState {
  lines: DialogueLine[];
  index: number;
  after: DialogueAfter;
}

export interface GameState {
  screen: Screen;
  currentRoomId: string;
  playerX: number;
  playerY: number;
  facing: Direction;
  player: PlayerStats;
  inventory: InventoryEntry[];
  defeatedEnemyIds: Record<string, true>;
  collectedItemIds: Record<string, true>;
  dialogue: DialogueState | null;
  battle: BattleState | null;
  toast: string | null;
  inventoryOpen: boolean;
  hasSave: boolean;
}

function freshPlayer(): PlayerStats {
  return { level: 0, xp: 0, hp: maxHpForLevel(0), maxHp: maxHpForLevel(0), ap: maxApForLevel(0), maxAp: maxApForLevel(0) };
}

function initialState(): GameState {
  return {
    screen: "start",
    currentRoomId: FIRST_ROOM_ID,
    playerX: 2,
    playerY: 7,
    facing: "down",
    player: freshPlayer(),
    inventory: [],
    defeatedEnemyIds: {},
    collectedItemIds: {},
    dialogue: null,
    battle: null,
    toast: null,
    inventoryOpen: false,
    hasSave: false,
  };
}

type Action =
  | { type: "SET_HAS_SAVE"; value: boolean }
  | { type: "NEW_GAME" }
  | { type: "LOAD_SAVE"; save: SaveData }
  | { type: "SET_PLAYER_POS"; x: number; y: number; facing: Direction }
  | { type: "ENTER_ROOM"; roomId: string; x: number; y: number; facing: Direction }
  | { type: "SET_FACING"; facing: Direction }
  | { type: "OPEN_DIALOGUE"; lines: DialogueLine[]; after: DialogueAfter }
  | { type: "ADVANCE_DIALOGUE" }
  | { type: "START_BATTLE"; npcId?: string; enemyId: string }
  | { type: "SET_BATTLE_MENU"; menu: BattleMenu }
  | { type: "BATTLE_LOG"; lines: string[] }
  | { type: "APPLY_PLAYER_DAMAGE"; amount: number }
  | { type: "APPLY_PLAYER_AP_COST"; amount: number }
  | { type: "APPLY_ENEMY_DAMAGE"; amount: number }
  | { type: "APPLY_ENEMY_AP_COST"; amount: number }
  | { type: "SET_ENEMY_HP"; hp: number }
  | { type: "SET_BATTLE_TURN"; turn: "player" | "enemy" }
  | { type: "END_BATTLE"; outcome: "win" | "lose" }
  | { type: "CLOSE_BATTLE_TO_FIELD" }
  | { type: "GAIN_XP"; amount: number }
  | { type: "GRANT_ITEM"; itemId: string }
  | { type: "COLLECT_ITEM"; pickupId: string; itemId: string }
  | { type: "CONSUME_ITEM"; itemId: string }
  | { type: "APPLY_ITEM_EFFECT_FIELD"; itemId: string }
  | { type: "APPLY_ITEM_EFFECT_BATTLE"; itemId: string }
  | { type: "TOGGLE_INVENTORY"; open?: boolean }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "CLEAR_TOAST" }
  | { type: "GO_TO_WIN" };

function invAdd(inventory: InventoryEntry[], itemId: string, count = 1): InventoryEntry[] {
  const idx = inventory.findIndex((e) => e.itemId === itemId);
  if (idx === -1) return [...inventory, { itemId, count }];
  const next = [...inventory];
  next[idx] = { ...next[idx], count: next[idx].count + count };
  return next;
}

function invRemoveOne(inventory: InventoryEntry[], itemId: string): InventoryEntry[] {
  const idx = inventory.findIndex((e) => e.itemId === itemId);
  if (idx === -1) return inventory;
  const next = [...inventory];
  const newCount = next[idx].count - 1;
  if (newCount <= 0) next.splice(idx, 1);
  else next[idx] = { ...next[idx], count: newCount };
  return next;
}

function healAmount(kind: "half" | "full", max: number, current: number): number {
  if (kind === "full") return max - current;
  return Math.min(max - current, Math.round(max / 2));
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_HAS_SAVE":
      return { ...state, hasSave: action.value };

    case "NEW_GAME":
      return { ...initialState(), screen: "field", hasSave: state.hasSave };

    case "LOAD_SAVE": {
      const s = action.save;
      return {
        ...initialState(),
        screen: "field",
        currentRoomId: s.currentRoomId,
        playerX: s.playerX,
        playerY: s.playerY,
        player: s.player,
        inventory: s.inventory,
        defeatedEnemyIds: Object.fromEntries(s.defeatedEnemyIds.map((id) => [id, true as const])),
        collectedItemIds: Object.fromEntries(s.collectedItemIds.map((id) => [id, true as const])),
        hasSave: true,
      };
    }

    case "SET_PLAYER_POS":
      return { ...state, playerX: action.x, playerY: action.y, facing: action.facing };

    case "ENTER_ROOM":
      return {
        ...state,
        currentRoomId: action.roomId,
        playerX: action.x,
        playerY: action.y,
        facing: action.facing,
      };

    case "SET_FACING":
      return { ...state, facing: action.facing };

    case "OPEN_DIALOGUE":
      return { ...state, screen: "dialogue", dialogue: { lines: action.lines, index: 0, after: action.after } };

    case "ADVANCE_DIALOGUE": {
      if (!state.dialogue) return state;
      const nextIndex = state.dialogue.index + 1;
      if (nextIndex < state.dialogue.lines.length) {
        return { ...state, dialogue: { ...state.dialogue, index: nextIndex } };
      }
      // Dialogue finished.
      const after = state.dialogue.after;
      if (after.type === "startBattle") {
        return startBattleState(state, after.npcId, after.enemyId);
      }
      return { ...state, screen: "field", dialogue: null };
    }

    case "START_BATTLE":
      return startBattleState(state, action.npcId, action.enemyId);

    case "SET_BATTLE_MENU":
      if (!state.battle) return state;
      return { ...state, battle: { ...state.battle, menu: action.menu } };

    case "BATTLE_LOG": {
      if (!state.battle) return state;
      const log = [...state.battle.log, ...action.lines].slice(-6);
      return { ...state, battle: { ...state.battle, log } };
    }

    case "APPLY_PLAYER_DAMAGE": {
      const hp = clamp(state.player.hp - action.amount, 0, state.player.maxHp);
      return { ...state, player: { ...state.player, hp } };
    }

    case "APPLY_PLAYER_AP_COST": {
      const ap = clamp(state.player.ap - action.amount, 0, state.player.maxAp);
      return { ...state, player: { ...state.player, ap } };
    }

    case "APPLY_ENEMY_DAMAGE": {
      if (!state.battle) return state;
      const enemyHp = clamp(state.battle.enemyHp - action.amount, 0, state.battle.enemyMaxHp);
      return { ...state, battle: { ...state.battle, enemyHp } };
    }

    case "APPLY_ENEMY_AP_COST": {
      if (!state.battle) return state;
      const enemyAp = clamp(state.battle.enemyAp - action.amount, 0, state.battle.enemyMaxAp);
      return { ...state, battle: { ...state.battle, enemyAp } };
    }

    case "SET_ENEMY_HP": {
      if (!state.battle) return state;
      return { ...state, battle: { ...state.battle, enemyHp: clamp(action.hp, 0, state.battle.enemyMaxHp) } };
    }

    case "SET_BATTLE_TURN":
      if (!state.battle) return state;
      return { ...state, battle: { ...state.battle, turn: action.turn, menu: "main" } };

    case "END_BATTLE": {
      if (!state.battle) return state;
      const battle = { ...state.battle, outcome: action.outcome };
      let defeatedEnemyIds = state.defeatedEnemyIds;
      if (action.outcome === "win" && (battle.isGateBoss || battle.isFinalGauntlet)) {
        defeatedEnemyIds = { ...defeatedEnemyIds, [battle.enemyId]: true };
      }
      return { ...state, battle, defeatedEnemyIds };
    }

    case "CLOSE_BATTLE_TO_FIELD": {
      if (!state.battle) return { ...state, screen: "field" };
      const wasWin = state.battle.outcome === "win";
      const isFinaleWin =
        wasWin && state.battle.isFinalGauntlet && FINAL_GAUNTLET_IDS.every((id) => state.defeatedEnemyIds[id] || id === state.battle!.enemyId);

      if (isFinaleWin) {
        return { ...state, screen: "win", battle: null };
      }

      if (!wasWin) {
        // Player lost: revive at the entry of the current room with half HP.
        const room = getRoom(state.currentRoomId);
        const entry = Object.values(room.entryPoints)[0] ?? { x: 2, y: 7 };
        return {
          ...state,
          screen: "field",
          battle: null,
          playerX: entry.x,
          playerY: entry.y,
          player: { ...state.player, hp: Math.max(1, Math.round(state.player.maxHp / 2)), ap: state.player.maxAp },
          toast: "Du wachst im Sanitätszelt wieder auf...",
        };
      }
      return { ...state, screen: "field", battle: null };
    }

    case "GAIN_XP": {
      const result = applyXp(state.player, action.amount);
      const toast =
        result.levelsGained > 0
          ? `Level Up! Du bist jetzt Level ${result.level}.`
          : state.toast;
      return {
        ...state,
        player: { level: result.level, xp: result.xp, hp: result.hp, maxHp: result.maxHp, ap: result.ap, maxAp: result.maxAp },
        toast,
      };
    }

    case "GRANT_ITEM":
      return { ...state, inventory: invAdd(state.inventory, action.itemId) };

    case "COLLECT_ITEM": {
      if (state.collectedItemIds[action.pickupId]) return state;
      const item = getItem(action.itemId);
      return {
        ...state,
        inventory: invAdd(state.inventory, action.itemId),
        collectedItemIds: { ...state.collectedItemIds, [action.pickupId]: true },
        toast: `Item erhalten: ${item.name}`,
      };
    }

    case "CONSUME_ITEM":
      return { ...state, inventory: invRemoveOne(state.inventory, action.itemId) };

    case "APPLY_ITEM_EFFECT_FIELD":
      return applyFieldItemEffect(state, action.itemId);

    case "APPLY_ITEM_EFFECT_BATTLE":
      return applyBattleItemEffect(state, action.itemId);

    case "TOGGLE_INVENTORY":
      return { ...state, inventoryOpen: action.open ?? !state.inventoryOpen };

    case "SHOW_TOAST":
      return { ...state, toast: action.message };

    case "CLEAR_TOAST":
      return { ...state, toast: null };

    case "GO_TO_WIN":
      return { ...state, screen: "win" };

    default:
      return state;
  }
}

function startBattleState(state: GameState, npcId: string | undefined, enemyId: string): GameState {
  const enemy = getEnemy(enemyId);
  return {
    ...state,
    screen: "battle",
    dialogue: null,
    battle: {
      npcId,
      enemyId: enemy.id,
      enemyName: enemy.name,
      enemyType: enemy.type,
      enemyLevel: enemy.level,
      enemyHp: maxHpForLevel(enemy.level),
      enemyMaxHp: maxHpForLevel(enemy.level),
      enemyAp: maxApForLevel(enemy.level),
      enemyMaxAp: maxApForLevel(enemy.level),
      enemyAttackIds: enemy.attackIds,
      menu: "main",
      log: [enemy.tauntLine],
      turn: "player",
      outcome: "ongoing",
      isGateBoss: !!enemy.isGateBoss,
      isFinalGauntlet: !!enemy.isFinalGauntlet,
    },
  };
}

function applyFieldItemEffect(state: GameState, itemId: string): GameState {
  const item = getItem(itemId);
  const effect = item.effect;
  let next = state;
  switch (effect.kind) {
    case "heal": {
      const amount = healAmount(effect.amount, state.player.maxHp, state.player.hp);
      if (amount <= 0) return { ...state, toast: "Energie ist bereits voll." };
      next = { ...state, player: { ...state.player, hp: state.player.hp + amount } };
      break;
    }
    case "restoreAp": {
      const amount = healAmount(effect.amount, state.player.maxAp, state.player.ap);
      if (amount <= 0) return { ...state, toast: "Attackenenergie ist bereits voll." };
      next = { ...state, player: { ...state.player, ap: state.player.ap + amount } };
      break;
    }
    case "levelUp": {
      const result = applyLevelUp(state.player, effect.amount);
      next = {
        ...state,
        player: { level: result.level, xp: result.xp, hp: result.hp, maxHp: result.maxHp, ap: result.ap, maxAp: result.maxAp },
        toast: `${item.name} eingesetzt! Level Up auf ${result.level}.`,
      };
      break;
    }
    case "xpBoost": {
      const bonus = Math.round((xpToNextLevel(state.player.level) * effect.percent) / 100);
      const result = applyXp(state.player, bonus);
      next = {
        ...state,
        player: { level: result.level, xp: result.xp, hp: result.hp, maxHp: result.maxHp, ap: result.ap, maxAp: result.maxAp },
        toast:
          result.levelsGained > 0
            ? `${item.name} eingesetzt! Level Up auf ${result.level}.`
            : `${item.name} eingesetzt: +${effect.percent}% Erfahrung.`,
      };
      break;
    }
    default:
      return { ...state, toast: `${item.name} kann hier nicht benutzt werden.` };
  }
  return { ...next, inventory: invRemoveOne(next.inventory, itemId) };
}

function applyBattleItemEffect(state: GameState, itemId: string): GameState {
  if (!state.battle) return state;
  const item = getItem(itemId);
  const effect: ItemEffect = item.effect;
  let next: GameState = state;
  const logLines: string[] = [];

  switch (effect.kind) {
    case "heal": {
      const amount = healAmount(effect.amount, state.player.maxHp, state.player.hp);
      next = { ...state, player: { ...state.player, hp: state.player.hp + amount } };
      logLines.push(`Du benutzt ${item.name} und füllst ${amount} Energie auf.`);
      break;
    }
    case "restoreAp": {
      const amount = healAmount(effect.amount, state.player.maxAp, state.player.ap);
      next = { ...state, player: { ...state.player, ap: state.player.ap + amount } };
      logLines.push(`Du benutzt ${item.name} und füllst ${amount} Attackenenergie auf.`);
      break;
    }
    case "drainEnemyHalf": {
      const drained = Math.round(state.battle.enemyHp / 2);
      next = { ...state, battle: { ...state.battle, enemyHp: clamp(state.battle.enemyHp - drained, 0, state.battle.enemyMaxHp) } };
      logLines.push(`Der Phaser zieht ${state.battle.enemyName} die halbe Energie ab!`);
      break;
    }
    case "instantWin": {
      next = { ...state, battle: { ...state.battle, enemyHp: 0 } };
      logLines.push(`Der Disruptor besiegt ${state.battle.enemyName} sofort!`);
      break;
    }
    default:
      logLines.push(`${item.name} hat hier keine Wirkung.`);
  }

  next = { ...next, inventory: invRemoveOne(next.inventory, itemId) };
  if (next.battle) next = { ...next, battle: { ...next.battle, log: [...next.battle.log, ...logLines].slice(-6) } };
  return next;
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    dispatch({ type: "SET_HAS_SAVE", value: !!loadSave() });
  }, []);

  // Autosave whenever meaningful progress changes, while playing.
  useEffect(() => {
    if (state.screen === "start") return;
    const data: SaveData = {
      player: state.player,
      inventory: state.inventory,
      currentRoomId: state.currentRoomId,
      playerX: state.playerX,
      playerY: state.playerY,
      defeatedEnemyIds: Object.keys(state.defeatedEnemyIds),
      collectedItemIds: Object.keys(state.collectedItemIds),
    };
    writeSave(data);
  }, [state.screen, state.player, state.inventory, state.currentRoomId, state.playerX, state.playerY, state.defeatedEnemyIds, state.collectedItemIds]);

  // Auto-clear toast messages after a few seconds.
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 2600);
    return () => clearTimeout(t);
  }, [state.toast]);

  const newGame = useCallback(() => {
    clearSave();
    dispatch({ type: "NEW_GAME" });
  }, []);

  const continueGame = useCallback(() => {
    const save = loadSave();
    if (save) dispatch({ type: "LOAD_SAVE", save });
    else dispatch({ type: "NEW_GAME" });
  }, []);

  const isNpcActive = useCallback(
    (npc: NpcDefinition) => {
      const s = stateRef.current;
      if (npc.requiresDefeatedEnemyId && !s.defeatedEnemyIds[npc.requiresDefeatedEnemyId]) return false;
      if (npc.interaction.kind === "battle") {
        const enemy = getEnemy(npc.interaction.enemyId);
        if ((enemy.isGateBoss || enemy.isFinalGauntlet) && s.defeatedEnemyIds[enemy.id]) return false;
      }
      return true;
    },
    []
  );

  const movePlayer = useCallback(
    (dir: Direction) => {
      const s = stateRef.current;
      if (s.screen !== "field") return;
      const room = getRoom(s.currentRoomId);
      const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      const nx = s.playerX + delta[0];
      const ny = s.playerY + delta[1];

      if (s.facing !== dir) dispatch({ type: "SET_FACING", facing: dir });

      const tile = room.tiles[ny]?.[nx];
      if (!tile || tile === "wall") return;

      const blocked = room.npcs.some((npc) => isNpcActive(npc) && npc.x === nx && npc.y === ny);
      if (blocked) return;

      dispatch({ type: "SET_PLAYER_POS", x: nx, y: ny, facing: dir });

      if (tile === "door") {
        const exit = room.exits.find((e) => e.x === nx && e.y === ny);
        if (exit) {
          const targetRoom = getRoom(exit.toRoom);
          const entry = targetRoom.entryPoints[room.id] ?? { x: 1, y: 1 };
          dispatch({ type: "ENTER_ROOM", roomId: targetRoom.id, x: entry.x, y: entry.y, facing: "right" });
        }
      }
    },
    [isNpcActive]
  );

  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.screen !== "field") return;
    const room = getRoom(s.currentRoomId);
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[s.facing];
    const tx = s.playerX + delta[0];
    const ty = s.playerY + delta[1];

    const npc = room.npcs.find((n) => isNpcActive(n) && n.x === tx && n.y === ty);
    if (npc) {
      if (npc.interaction.kind === "chat") {
        dispatch({ type: "OPEN_DIALOGUE", lines: npc.interaction.lines, after: { type: "none" } });
      } else if (npc.interaction.kind === "battle") {
        dispatch({
          type: "OPEN_DIALOGUE",
          lines: npc.interaction.pre,
          after: { type: "startBattle", npcId: npc.id, enemyId: npc.interaction.enemyId },
        });
      } else if (npc.interaction.kind === "giveItem") {
        dispatch({ type: "OPEN_DIALOGUE", lines: npc.interaction.lines, after: { type: "none" } });
        dispatch({ type: "GRANT_ITEM", itemId: npc.interaction.itemId });
      }
      return;
    }

    const pickup = room.items.find(
      (p) => !s.collectedItemIds[p.id] && ((p.x === tx && p.y === ty) || (p.x === s.playerX && p.y === s.playerY))
    );
    if (pickup) {
      dispatch({ type: "COLLECT_ITEM", pickupId: pickup.id, itemId: pickup.itemId });
    }
  }, [isNpcActive]);

  const advanceDialogue = useCallback(() => dispatch({ type: "ADVANCE_DIALOGUE" }), []);

  const runEnemyTurn = useCallback(() => {
    const s = stateRef.current;
    if (!s.battle || s.battle.outcome !== "ongoing") return;
    const usable = s.battle.enemyAttackIds.map(getAttack).filter((a) => a.apCost <= s.battle!.enemyAp);
    const attack = usable.length > 0 ? usable[Math.floor(Math.random() * usable.length)] : DESPERATE_ATTACK;
    // Der Spieler hat keinen eigenen Fan-Typ, daher wirkt bei Gegnerangriffen nie ein Typ-Bonus.
    const plainDamage =
      attack.id === DESPERATE_ATTACK.id
        ? attack.power
        : Math.max(1, Math.round(attack.power * (1 + s.battle.enemyLevel * 0.03)));

    dispatch({ type: "APPLY_ENEMY_AP_COST", amount: attack.apCost });
    dispatch({ type: "APPLY_PLAYER_DAMAGE", amount: plainDamage });
    dispatch({
      type: "BATTLE_LOG",
      lines: [`${s.battle.enemyName} setzt ${attack.name} ein! (-${plainDamage} Energie)`],
    });

    const newHp = s.player.hp - plainDamage;
    if (newHp <= 0) {
      dispatch({ type: "END_BATTLE", outcome: "lose" });
      dispatch({ type: "BATTLE_LOG", lines: ["Deine Energie ist aufgebraucht..."] });
    } else {
      dispatch({ type: "SET_BATTLE_TURN", turn: "player" });
    }
  }, []);

  const useAttack = useCallback(
    (attackId: string) => {
      const s = stateRef.current;
      if (!s.battle || s.battle.turn !== "player" || s.battle.outcome !== "ongoing") return;
      const attack = attackId === DESPERATE_ATTACK.id ? DESPERATE_ATTACK : getAttack(attackId);
      if (attack.apCost > s.player.ap) return;

      const { damage, effective } = calcDamage(attack, s.player.level, s.battle.enemyType);
      dispatch({ type: "APPLY_PLAYER_AP_COST", amount: attack.apCost });
      dispatch({ type: "APPLY_ENEMY_DAMAGE", amount: damage });
      dispatch({
        type: "BATTLE_LOG",
        lines: [
          `Du setzt ${attack.name} ein! (-${damage} Energie)${effective ? " Sehr effektiv!" : ""}`,
        ],
      });
      dispatch({ type: "SET_BATTLE_TURN", turn: "enemy" });

      const newEnemyHp = s.battle.enemyHp - damage;
      if (newEnemyHp <= 0) {
        dispatch({ type: "END_BATTLE", outcome: "win" });
        const enemy = getEnemy(s.battle.enemyId);
        dispatch({ type: "BATTLE_LOG", lines: [enemy.defeatLine] });
        dispatch({ type: "GAIN_XP", amount: xpForDefeatingEnemy(s.battle.enemyLevel) });
      } else {
        window.setTimeout(runEnemyTurn, 900);
      }
    },
    [runEnemyTurn]
  );

  const useItemInBattle = useCallback(
    (itemId: string) => {
      const s = stateRef.current;
      if (!s.battle || s.battle.turn !== "player" || s.battle.outcome !== "ongoing") return;
      const effect = getItem(itemId).effect;
      // Der Reducer wendet den Effekt async an; die neue Energie wird hier
      // parallel berechnet, um sofort zu wissen, ob der Kampf endet.
      let newEnemyHp = s.battle.enemyHp;
      if (effect.kind === "drainEnemyHalf") newEnemyHp = s.battle.enemyHp - Math.round(s.battle.enemyHp / 2);
      else if (effect.kind === "instantWin") newEnemyHp = 0;

      dispatch({ type: "APPLY_ITEM_EFFECT_BATTLE", itemId });
      dispatch({ type: "SET_BATTLE_TURN", turn: "enemy" });

      if (newEnemyHp <= 0) {
        dispatch({ type: "END_BATTLE", outcome: "win" });
        const enemy = getEnemy(s.battle.enemyId);
        dispatch({ type: "BATTLE_LOG", lines: [enemy.defeatLine] });
        dispatch({ type: "GAIN_XP", amount: xpForDefeatingEnemy(s.battle.enemyLevel) });
      } else {
        window.setTimeout(runEnemyTurn, 900);
      }
    },
    [runEnemyTurn]
  );

  const useItemInField = useCallback((itemId: string) => {
    dispatch({ type: "APPLY_ITEM_EFFECT_FIELD", itemId });
  }, []);

  const setBattleMenu = useCallback((menu: BattleMenu) => dispatch({ type: "SET_BATTLE_MENU", menu }), []);

  const closeBattleToField = useCallback(() => {
    const s = stateRef.current;
    const wasWinWithNpcDialogue =
      s.battle?.outcome === "win" && s.battle.npcId && !s.battle.isFinalGauntlet;
    if (wasWinWithNpcDialogue) {
      const room = getRoom(s.currentRoomId);
      const npc = room.npcs.find((n) => n.id === s.battle!.npcId);
      if (npc && npc.interaction.kind === "battle" && npc.interaction.post.length > 0) {
        dispatch({ type: "CLOSE_BATTLE_TO_FIELD" });
        dispatch({ type: "OPEN_DIALOGUE", lines: npc.interaction.post, after: { type: "none" } });
        return;
      }
    }
    dispatch({ type: "CLOSE_BATTLE_TO_FIELD" });
  }, []);

  const toggleInventory = useCallback((open?: boolean) => dispatch({ type: "TOGGLE_INVENTORY", open }), []);

  const activeNpcs = useMemo(() => {
    const room = getRoom(state.currentRoomId);
    return room.npcs.filter(isNpcActive);
  }, [state.currentRoomId, isNpcActive, state.defeatedEnemyIds]);

  const visibleItems = useMemo(() => {
    const room = getRoom(state.currentRoomId);
    return room.items.filter((p) => !state.collectedItemIds[p.id]);
  }, [state.currentRoomId, state.collectedItemIds]);

  return {
    state,
    activeNpcs,
    visibleItems,
    newGame,
    continueGame,
    movePlayer,
    interact,
    advanceDialogue,
    useAttack,
    useItemInBattle,
    useItemInField,
    setBattleMenu,
    closeBattleToField,
    toggleInventory,
  };
}
