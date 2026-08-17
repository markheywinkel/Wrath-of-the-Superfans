"use client";

import { useEffect, useRef } from "react";
import { useGame, type Direction } from "@/game/state/useGame";
import { getRoom } from "@/game/data/rooms";
import { MOVE_INTERVAL_MS, CANVAS_WIDTH } from "@/game/engine/constants";
import GameCanvas from "@/game/components/GameCanvas";
import HUD from "@/game/components/HUD";
import DialogueBox from "@/game/components/DialogueBox";
import BattleScreen from "@/game/components/BattleScreen";
import InventoryMenu from "@/game/components/InventoryMenu";
import StartScreen from "@/game/components/StartScreen";
import WinScreen from "@/game/components/WinScreen";

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export default function GameRoot() {
  const {
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
  } = useGame();

  const heldDirs = useRef<Set<Direction>>(new Set());
  const lastMoveTs = useRef(0);
  const rafRef = useRef<number | null>(null);
  const stateScreenRef = useRef(state.screen);
  const inventoryOpenRef = useRef(state.inventoryOpen);
  stateScreenRef.current = state.screen;
  inventoryOpenRef.current = state.inventoryOpen;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) {
        e.preventDefault();
        heldDirs.current.add(dir);
        if (stateScreenRef.current === "field" && !inventoryOpenRef.current) {
          movePlayer(dir);
          lastMoveTs.current = performance.now();
        }
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (e.repeat) return;
        if (inventoryOpenRef.current) return;
        if (stateScreenRef.current === "dialogue") advanceDialogue();
        else if (stateScreenRef.current === "field") interact();
        return;
      }
      if ((e.key === "i" || e.key === "I") && !e.repeat) {
        if (stateScreenRef.current === "field" || inventoryOpenRef.current) toggleInventory();
        return;
      }
      if (e.key === "Escape" && inventoryOpenRef.current) {
        toggleInventory(false);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) heldDirs.current.delete(dir);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [movePlayer, interact, advanceDialogue, toggleInventory]);

  useEffect(() => {
    const loop = (ts: number) => {
      if (stateScreenRef.current === "field" && !inventoryOpenRef.current && heldDirs.current.size > 0) {
        if (ts - lastMoveTs.current >= MOVE_INTERVAL_MS) {
          const dir = heldDirs.current.values().next().value as Direction;
          movePlayer(dir);
          lastMoveTs.current = ts;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [movePlayer]);

  if (state.screen === "start") {
    return <StartScreen hasSave={state.hasSave} onNewGame={newGame} onContinue={continueGame} />;
  }

  if (state.screen === "win") {
    return <WinScreen player={state.player} onRestart={newGame} />;
  }

  const room = getRoom(state.currentRoomId);
  const dialogueLine = state.dialogue ? state.dialogue.lines[state.dialogue.index] : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 8px" }}>
      <HUD player={state.player} roomName={room.name} ambient={room.ambient} />
      <div style={{ position: "relative", width: "100%", maxWidth: CANVAS_WIDTH, margin: "0 auto" }}>
        <GameCanvas
          roomId={state.currentRoomId}
          playerX={state.playerX}
          playerY={state.playerY}
          facing={state.facing}
          activeNpcs={activeNpcs}
          visibleItems={visibleItems}
        />
        {state.screen === "dialogue" && dialogueLine && state.dialogue && (
          <DialogueBox line={dialogueLine} hasMore={state.dialogue.index < state.dialogue.lines.length - 1} onAdvance={advanceDialogue} />
        )}
        {state.screen === "battle" && state.battle && (
          <BattleScreen
            battle={state.battle}
            player={state.player}
            inventory={state.inventory}
            onSetMenu={setBattleMenu}
            onAttack={useAttack}
            onItem={useItemInBattle}
            onCloseResult={closeBattleToField}
          />
        )}
        {state.inventoryOpen && (
          <InventoryMenu inventory={state.inventory} onUseItem={useItemInField} onClose={() => toggleInventory(false)} />
        )}
        {state.toast && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0d0d16",
              border: "2px solid #ffcc00",
              color: "#ffe678",
              fontSize: 9,
              padding: "6px 12px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}
          >
            {state.toast}
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 8, color: "#555" }}>
        Pfeiltasten: bewegen · Leertaste: interagieren · I: Gepäck
      </div>
    </div>
  );
}
