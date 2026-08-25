"use client";

interface Props {
  text: string | null;
}

export default function Subtitles({ text }: Props) {
  if (!text) return null;
  return (
    <div
      data-testid="subtitle"
      style={{
        position: "absolute",
        left: "50%",
        bottom: 18,
        transform: "translateX(-50%)",
        maxWidth: "90%",
        background: "rgba(5,5,10,0.82)",
        border: "2px solid #ffcc00",
        borderRadius: 3,
        padding: "10px 16px",
        fontSize: 10,
        lineHeight: 1.6,
        color: "#f4f4fa",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}
