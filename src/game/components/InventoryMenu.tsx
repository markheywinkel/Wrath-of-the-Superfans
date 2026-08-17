"use client";

import type { InventoryEntry } from "@/game/types";
import { getItem } from "@/game/data/items";

interface Props {
  inventory: InventoryEntry[];
  onUseItem: (itemId: string) => void;
  onClose: () => void;
}

export default function InventoryMenu({ inventory, onUseItem, onClose }: Props) {
  const fieldItems = inventory.filter((e) => getItem(e.itemId).usableIn.includes("field") && e.count > 0);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(4,4,10,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d0d16",
          border: "3px solid #e8e8f0",
          borderRadius: 4,
          padding: 16,
          width: 340,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 12, color: "#ffcc00", marginBottom: 10 }}>Gepäck</div>
        {fieldItems.length === 0 && <div style={{ fontSize: 9, color: "#888" }}>Noch keine benutzbaren Items gesammelt.</div>}
        {fieldItems.map((e) => {
          const item = getItem(e.itemId);
          return (
            <button
              key={e.itemId}
              onClick={() => onUseItem(e.itemId)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 9,
                lineHeight: 1.6,
                padding: "8px 10px",
                marginBottom: 6,
                background: "#20202e",
                color: "#f0f0f5",
                border: "2px solid #000",
                cursor: "pointer",
              }}
            >
              <div>
                {item.name} ×{e.count}
              </div>
              <div style={{ color: "#8a8a9a", fontSize: 8 }}>{item.description}</div>
            </button>
          );
        })}
        <div style={{ textAlign: "right", marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{ fontSize: 9, padding: "6px 14px", background: "transparent", color: "#8a8a9a", border: "1px solid #333", cursor: "pointer" }}
          >
            schließen (I / Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
