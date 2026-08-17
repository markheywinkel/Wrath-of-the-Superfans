import GameRoot from "@/game/components/GameRoot";
import Starfield from "@/game/components/Starfield";

export default function Home() {
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
            WRATH OF THE SUPERFANS
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 10, color: "#8a8a9a", letterSpacing: 1 }}>
            Ein 8-Bit-Rollenspiel von der größten Star-Trek-Convention aller Zeiten
          </p>
        </header>

        <div
          style={{
            width: "min(720px, 96vw)",
            height: 640,
            maxHeight: "80vh",
            overflow: "auto",
            border: "4px solid #000",
            borderRadius: 6,
            boxShadow: "0 0 0 4px #333, 0 24px 70px rgba(0,0,0,0.65)",
            background: "#05050a",
          }}
        >
          <GameRoot />
        </div>

        <footer style={{ fontSize: 8, color: "#555", letterSpacing: 0.5 }}>WRATH CON &middot; alle Rechte bei den Superfans</footer>
      </main>
    </>
  );
}
