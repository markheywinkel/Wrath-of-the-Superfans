"use client";

import type { CSSProperties } from "react";
import type { BattleMenu, BattleState } from "@/game/state/useGame";
import type { InventoryEntry, PlayerStats } from "@/game/types";
import { ATTACKS_BY_ID, OLD_TREK_ATTACK_IDS, NEW_TREK_ATTACK_IDS, SUPERFAN_ATTACK_IDS, getAttack } from "@/game/data/attacks";
import { getItem } from "@/game/data/items";
import PixelSprite from "@/game/components/PixelSprite";

interface Props {
  battle: BattleState;
  player: PlayerStats;
  knownAttackIds: string[];
  inventory: InventoryEntry[];
  onSetMenu: (menu: BattleMenu) => void;
  onAttack: (attackId: string) => void;
  onItem: (itemId: string) => void;
  onCloseResult: () => void;
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#cfd6d9", marginBottom: 2 }}>
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div style={{ background: "#1a1a24", border: "2px solid #000", height: 10, borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 200ms" }} />
      </div>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = { old: "Old Trek", new: "New Trek", super: "Superfan" };
const TYPE_COLOR: Record<string, string> = { old: "#c9a227", new: "#4a90c8", super: "#a85fd6" };

function AttackGroup({
  title,
  ids,
  playerAp,
  onAttack,
}: {
  title: string;
  ids: string[];
  playerAp: number;
  onAttack: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: TYPE_COLOR[getAttack(ids[0]).type], marginBottom: 4 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {ids.map((id) => {
          const a = getAttack(id);
          const disabled = a.apCost > playerAp;
          return (
            <button
              key={id}
              disabled={disabled}
              onClick={() => onAttack(id)}
              title={a.description}
              style={{
                textAlign: "left",
                fontSize: 8,
                lineHeight: 1.5,
                padding: "6px 8px",
                background: disabled ? "#1a1a20" : "#20202e",
                color: disabled ? "#555" : "#f0f0f5",
                border: "2px solid #000",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div>{a.name}</div>
              <div style={{ color: "#8a8a9a" }}>
                PWR {a.power} · {a.apCost} AP
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BattleScreen({ battle, player, knownAttackIds, inventory, onSetMenu, onAttack, onItem, onCloseResult }: Props) {
  const battleItems = inventory.filter((e) => {
    const item = getItem(e.itemId);
    return item.usableIn.includes("battle") && e.count > 0;
  });
  const knownOld = OLD_TREK_ATTACK_IDS.filter((id) => knownAttackIds.includes(id));
  const knownNew = NEW_TREK_ATTACK_IDS.filter((id) => knownAttackIds.includes(id));
  const knownSuper = SUPERFAN_ATTACK_IDS.filter((id) => knownAttackIds.includes(id));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(#0c0c18, #05050a)",
        display: "flex",
        flexDirection: "column",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 220 }}>
          <div style={{ fontSize: 11, color: "#fff", marginBottom: 4 }}>
            {battle.enemyName} <span style={{ color: TYPE_COLOR[battle.enemyType] }}>[{TYPE_LABEL[battle.enemyType]}]</span>
          </div>
          <div style={{ fontSize: 9, color: "#8a8a9a", marginBottom: 6 }}>Level {battle.enemyLevel}</div>
          <Bar value={battle.enemyHp} max={battle.enemyMaxHp} color="#e05656" label="Energie" />
          <Bar value={battle.enemyAp} max={battle.enemyMaxAp} color="#5690e0" label="Attacke" />
        </div>
        <PixelSprite role={battle.enemyType === "old" || battle.enemyType === "new" || battle.enemyType === "super" ? (battle.isGateBoss || battle.isFinalGauntlet ? "boss" : battle.enemyType) : "boss"} size={96} mirror />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
        <PixelSprite role="player" size={96} />
        <div style={{ width: 220, marginLeft: 12 }}>
          <div style={{ fontSize: 11, color: "#fff", marginBottom: 6 }}>Du – Level {player.level}</div>
          <Bar value={player.hp} max={player.maxHp} color="#4ad06a" label="Energie" />
          <Bar value={player.ap} max={player.maxAp} color="#5690e0" label="Attacke" />
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          background: "#0d0d16",
          border: "3px solid #e8e8f0",
          borderRadius: 4,
          padding: 10,
          minHeight: 54,
        }}
      >
        {battle.log.slice(-3).map((l, i) => (
          <div key={i} style={{ fontSize: 9, lineHeight: 1.7, color: "#f0f0f5" }}>
            {l}
          </div>
        ))}
      </div>

      {battle.outcome === "ongoing" && (
        <div style={{ marginTop: 10, background: "#0d0d16", border: "3px solid #e8e8f0", borderRadius: 4, padding: 10, maxHeight: 220, overflowY: "auto" }}>
          {battle.turn === "enemy" && <div style={{ fontSize: 9, color: "#888" }}>{battle.enemyName} überlegt...</div>}
          {battle.turn === "player" && battle.menu === "main" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => onSetMenu("attacks")} style={menuBtnStyle}>
                ⚔ Attacke
              </button>
              <button onClick={() => onSetMenu("items")} style={menuBtnStyle}>
                🎒 Item
              </button>
            </div>
          )}
          {battle.turn === "player" && battle.menu === "attacks" && (
            <div>
              <button onClick={() => onSetMenu("main")} style={backBtnStyle}>
                ◂ zurück
              </button>
              <AttackGroup title="Old-Trek-Attacken" ids={knownOld} playerAp={player.ap} onAttack={onAttack} />
              <AttackGroup title="New-Trek-Attacken" ids={knownNew} playerAp={player.ap} onAttack={onAttack} />
              <AttackGroup title="Superfan-Attacken" ids={knownSuper} playerAp={player.ap} onAttack={onAttack} />
              {!knownAttackIds.some((id) => ATTACKS_BY_ID[id].apCost <= player.ap) && (
                <button onClick={() => onAttack("desperate_slap")} style={{ ...menuBtnStyle, width: "100%" }}>
                  Verzweifelter Klaps (0 AP)
                </button>
              )}
            </div>
          )}
          {battle.turn === "player" && battle.menu === "items" && (
            <div>
              <button onClick={() => onSetMenu("main")} style={backBtnStyle}>
                ◂ zurück
              </button>
              {battleItems.length === 0 && <div style={{ fontSize: 9, color: "#888" }}>Keine Kampf-Items im Gepäck.</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {battleItems.map((e) => {
                  const item = getItem(e.itemId);
                  return (
                    <button key={e.itemId} onClick={() => onItem(e.itemId)} title={item.description} style={{ ...menuBtnStyle, textAlign: "left" }}>
                      {item.name} ×{e.count}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {battle.outcome !== "ongoing" && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: battle.outcome === "win" ? "#4ad06a" : "#e05656", marginBottom: 10 }}>
            {battle.outcome === "win" ? "SIEG!" : "NIEDERLAGE..."}
          </div>
          <button onClick={onCloseResult} style={{ ...menuBtnStyle, padding: "10px 24px" }}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

const menuBtnStyle: CSSProperties = {
  fontSize: 10,
  padding: "10px 16px",
  background: "#20202e",
  color: "#f0f0f5",
  border: "2px solid #000",
  cursor: "pointer",
};

const backBtnStyle: CSSProperties = {
  fontSize: 9,
  padding: "4px 10px",
  background: "transparent",
  color: "#8a8a9a",
  border: "1px solid #333",
  cursor: "pointer",
  marginBottom: 8,
};
