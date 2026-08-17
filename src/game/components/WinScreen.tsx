"use client";

import type { PlayerStats } from "@/game/types";
import PixelSprite from "@/game/components/PixelSprite";

interface Props {
  player: PlayerStats;
  onRestart: () => void;
}

export default function WinScreen({ player, onRestart }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 30%, #2a1f00, #05050a 70%)",
        textAlign: "center",
        padding: 20,
      }}
    >
      <PixelSprite role="player" size={110} />
      <h1 style={{ fontSize: 20, color: "#ffcc00", marginTop: 20, marginBottom: 12, letterSpacing: 1 }}>
        DU BIST DER ULTIMATIVE SUPERFAN!
      </h1>
      <p style={{ fontSize: 10, color: "#9aa", maxWidth: 440, lineHeight: 1.8, marginBottom: 18 }}>
        Alle drei Holo-Simulationen im Finale sind besiegt. Ganz WRATH CON verneigt sich vor deinem Wissen.
      </p>
      <p style={{ fontSize: 10, color: "#cfd6d9", marginBottom: 26 }}>Erreichtes Level: {player.level}</p>
      <button
        onClick={onRestart}
        style={{ fontSize: 12, padding: "12px 32px", background: "#20202e", color: "#f0f0f5", border: "2px solid #ffcc00", cursor: "pointer" }}
      >
        Neues Spiel
      </button>
    </div>
  );
}
