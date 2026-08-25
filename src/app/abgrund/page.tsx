import type { Metadata } from "next";
import NarratorGameRoot from "@/narrator-game/NarratorGameRoot";
import Starfield from "@/game/components/Starfield";

export const metadata: Metadata = {
  title: "Der Abgrund",
  description: "Ein 2D-Jump'n'Run mit Erzähler-Voice-Over und Untertiteln.",
};

export default function AbgrundPage() {
  return (
    <>
      <Starfield />
      <main
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: "32px 16px",
        }}
      >
        <header style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              color: "#ffcc00",
              letterSpacing: 3,
              textShadow: "0 0 12px rgba(255,204,0,0.35)",
            }}
          >
            DER ABGRUND
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 10, color: "#8a8a9a", letterSpacing: 1 }}>
            Ein 2D-Jump&apos;n&apos;Run mit Erzähler
          </p>
        </header>

        <NarratorGameRoot />

        <a
          href="/"
          style={{
            fontSize: 8,
            color: "#8a8a9a",
            letterSpacing: 0.5,
            textDecoration: "none",
            border: "1px solid #333",
            borderRadius: 3,
            padding: "6px 10px",
          }}
        >
          ← zurück zu Wrath of the Superfans
        </a>

        <footer style={{ fontSize: 8, color: "#555", letterSpacing: 0.5 }}>WRATH CON &middot; alle Rechte bei den Superfans</footer>
      </main>
    </>
  );
}
