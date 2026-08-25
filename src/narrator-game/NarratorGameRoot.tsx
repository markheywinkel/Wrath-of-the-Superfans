"use client";

import { useRef, useState } from "react";
import { CANVAS_WIDTH } from "./constants";
import NarratorGameCanvas from "./NarratorGameCanvas";
import Subtitles from "./Subtitles";
import { useVoiceOver } from "./useVoiceOver";
import { NarratorWorld } from "./world";

export default function NarratorGameRoot() {
  const [started, setStarted] = useState(false);
  const voiceOver = useVoiceOver();
  const worldRef = useRef<NarratorWorld | null>(null);

  const start = () => {
    if (worldRef.current) {
      setStarted(true);
      return;
    }
    worldRef.current = new NarratorWorld(voiceOver.speak);
    setStarted(true);
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: CANVAS_WIDTH, margin: "0 auto" }}>
      {started && worldRef.current ? (
        <>
          <NarratorGameCanvas world={worldRef.current} />
          <Subtitles text={voiceOver.subtitle} />
          <button
            onClick={voiceOver.toggleMuted}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(5,5,10,0.75)",
              border: "2px solid #ffcc00",
              color: "#ffcc00",
              fontFamily: "inherit",
              fontSize: 8,
              padding: "6px 8px",
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            {voiceOver.muted ? "🔇 Ton aus" : "🔊 Ton an"}
          </button>
        </>
      ) : (
        <StartGate onStart={start} voiceSupported={voiceOver.supported} />
      )}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 8, color: "#555" }}>
        Pfeiltasten / A,D: bewegen · Leertaste / Pfeil hoch: springen
      </div>
    </div>
  );
}

function StartGate({ onStart, voiceSupported }: { onStart: () => void; voiceSupported: boolean }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onStart();
      }}
      style={{
        width: "100%",
        aspectRatio: "780 / 440",
        maxWidth: CANVAS_WIDTH,
        border: "4px solid #000",
        boxShadow: "0 0 0 4px #444",
        background: "#0c0814",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        cursor: "pointer",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 13, color: "#ffcc00", letterSpacing: 2 }}>KLICKEN ODER TASTE DRÜCKEN</div>
      <div style={{ fontSize: 9, color: "#8a8a9a", maxWidth: 420, lineHeight: 1.7 }}>
        um zu beginnen{voiceSupported ? " (mit Erzähler-Stimme und Untertiteln)" : " (Untertitel, Sprachausgabe hier nicht verfügbar)"}
      </div>
    </div>
  );
}
