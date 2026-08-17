"use client";

import type { PlayerStats } from "@/game/types";
import { xpToNextLevel } from "@/game/state/leveling";

interface Props {
  player: PlayerStats;
  roomName: string;
  ambient: string;
}

export default function HUD({ player, roomName, ambient }: Props) {
  const need = xpToNextLevel(player.level);
  const xpPct = Math.min(100, (player.xp / need) * 100);
  const hpPct = Math.min(100, (player.hp / player.maxHp) * 100);
  const apPct = Math.min(100, (player.ap / player.maxAp) * 100);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto 8px", padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 11, color: "#ffcc00" }}>{roomName}</div>
        <div style={{ fontSize: 9, color: "#8a8a9a" }}>Level {player.level}</div>
      </div>
      <div style={{ fontSize: 8, color: "#8a8a9a", marginBottom: 6 }}>{ambient}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, color: "#cfd6d9" }}>Energie</div>
          <div style={{ background: "#1a1a24", border: "2px solid #000", height: 8 }}>
            <div style={{ width: `${hpPct}%`, height: "100%", background: "#4ad06a" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, color: "#cfd6d9" }}>Attacke</div>
          <div style={{ background: "#1a1a24", border: "2px solid #000", height: 8 }}>
            <div style={{ width: `${apPct}%`, height: "100%", background: "#5690e0" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, color: "#cfd6d9" }}>XP</div>
          <div style={{ background: "#1a1a24", border: "2px solid #000", height: 8 }}>
            <div style={{ width: `${xpPct}%`, height: "100%", background: "#ffcc00" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
