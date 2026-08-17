"use client";

import type { DialogueLine } from "@/game/types";

interface Props {
  line: DialogueLine;
  hasMore: boolean;
  onAdvance: () => void;
}

export default function DialogueBox({ line, hasMore, onAdvance }: Props) {
  return (
    <div
      onClick={onAdvance}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        margin: "0 auto",
        maxWidth: 640,
        background: "#0d0d16",
        border: "3px solid #e8e8f0",
        borderRadius: 4,
        padding: "14px 18px",
        cursor: "pointer",
        boxShadow: "0 -6px 0 rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontSize: 10, color: "#ffcc00", marginBottom: 8 }}>{line.speaker}</div>
      <div style={{ fontSize: 11, lineHeight: 1.7, color: "#f0f0f5" }}>{line.text}</div>
      <div style={{ textAlign: "right", marginTop: 8, fontSize: 9, color: "#888" }}>
        {hasMore ? "▼ weiter (Leertaste)" : "▸ schließen (Leertaste)"}
      </div>
    </div>
  );
}
