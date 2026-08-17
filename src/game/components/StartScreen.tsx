"use client";

import type { CSSProperties } from "react";
import PixelSprite from "@/game/components/PixelSprite";

interface Props {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}

export default function StartScreen({ hasSave, onNewGame, onContinue }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 20%, #1a1a3a, #05050a 70%)",
        textAlign: "center",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <PixelSprite role="old" size={64} />
        <PixelSprite role="player" size={72} />
        <PixelSprite role="new" size={64} />
        <PixelSprite role="super" size={64} />
      </div>
      <h1 style={{ fontSize: 22, color: "#ffcc00", letterSpacing: 2, marginBottom: 6 }}>WRATH OF THE</h1>
      <h1 style={{ fontSize: 26, color: "#fff", letterSpacing: 2, marginBottom: 20 }}>SUPERFANS</h1>
      <p style={{ fontSize: 10, color: "#9aa", maxWidth: 420, lineHeight: 1.8, marginBottom: 28 }}>
        Willkommen auf der größten Star-Trek-Convention aller Zeiten. Erkunde das Gelände, sammle Items, kämpfe
        rundenbasiert gegen andere Fans – und beweise, dass DU der ultimative Superfan bist.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onNewGame} style={btnStyle}>
          Neues Spiel
        </button>
        {hasSave && (
          <button onClick={onContinue} style={btnStyle}>
            Fortsetzen
          </button>
        )}
      </div>
      <div style={{ marginTop: 30, fontSize: 8, color: "#666", lineHeight: 1.8 }}>
        Pfeiltasten: bewegen &nbsp;·&nbsp; Leertaste: interagieren / Dialog &nbsp;·&nbsp; I: Gepäck
      </div>
    </div>
  );
}

const btnStyle: CSSProperties = {
  fontSize: 12,
  padding: "12px 32px",
  background: "#20202e",
  color: "#f0f0f5",
  border: "2px solid #ffcc00",
  cursor: "pointer",
};
