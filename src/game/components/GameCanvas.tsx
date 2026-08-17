"use client";

import { useEffect, useRef } from "react";
import { getRoom } from "@/game/data/rooms";
import type { Direction } from "@/game/state/useGame";
import type { NpcDefinition, ItemPickup } from "@/game/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH, RENDER_TILE, VIEW_TILES_X, VIEW_TILES_Y } from "@/game/engine/constants";
import { drawItemSparkle, drawSprite, drawTile } from "@/game/engine/render";
import type { SpriteRole } from "@/game/engine/sprites";

interface Props {
  roomId: string;
  playerX: number;
  playerY: number;
  facing: Direction;
  activeNpcs: NpcDefinition[];
  visibleItems: ItemPickup[];
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function GameCanvas({ roomId, playerX, playerY, facing, activeNpcs, visibleItems }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualPos = useRef({ x: playerX, y: playerY });
  const targetPos = useRef({ x: playerX, y: playerY, roomId });
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);

  // Snap the visual position instantly on room change; otherwise let it glide.
  useEffect(() => {
    if (targetPos.current.roomId !== roomId) {
      visualPos.current = { x: playerX, y: playerY };
    }
    targetPos.current = { x: playerX, y: playerY, roomId };
  }, [playerX, playerY, roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const loop = (ts: number) => {
      const dt = lastTs.current ? ts - lastTs.current : 16;
      lastTs.current = ts;

      const lerp = 1 - Math.exp(-dt / 70);
      visualPos.current.x += (targetPos.current.x - visualPos.current.x) * lerp;
      visualPos.current.y += (targetPos.current.y - visualPos.current.y) * lerp;

      const room = getRoom(targetPos.current.roomId);

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const camX = clamp(visualPos.current.x - VIEW_TILES_X / 2 + 0.5, 0, Math.max(0, room.width - VIEW_TILES_X));
      const camY = clamp(visualPos.current.y - VIEW_TILES_Y / 2 + 0.5, 0, Math.max(0, room.height - VIEW_TILES_Y));

      const startX = Math.floor(camX) - 1;
      const startY = Math.floor(camY) - 1;
      const endX = startX + VIEW_TILES_X + 2;
      const endY = startY + VIEW_TILES_Y + 2;

      for (let ty = startY; ty <= endY; ty++) {
        const rowTiles = room.tiles[ty];
        if (!rowTiles) continue;
        for (let tx = startX; tx <= endX; tx++) {
          const tile = rowTiles[tx];
          if (!tile) continue;
          const sx = Math.round((tx - camX) * RENDER_TILE);
          const sy = Math.round((ty - camY) * RENDER_TILE);
          drawTile(ctx, tile, sx, sy, tx, ty);
        }
      }

      // Items (unsammelte Objekte)
      for (const item of visibleItems) {
        const sx = Math.round((item.x - camX) * RENDER_TILE);
        const sy = Math.round((item.y - camY) * RENDER_TILE);
        drawItemSparkle(ctx, sx, sy, !!item.hidden, ts);
      }

      // NPCs, dann Spieler nach Y sortiert für simples Depth-Sorting.
      type Drawable = { y: number; draw: () => void };
      const drawables: Drawable[] = [];

      for (const npc of activeNpcs) {
        const sx = Math.round((npc.x - camX) * RENDER_TILE);
        const sy = Math.round((npc.y - camY) * RENDER_TILE);
        const role = npc.sprite as SpriteRole;
        const scale = role === "boss" ? 1.2 : 1;
        drawables.push({ y: npc.y, draw: () => drawSprite(ctx, role, sx, sy, false, scale) });
      }

      const playerSx = Math.round((visualPos.current.x - camX) * RENDER_TILE);
      const playerSy = Math.round((visualPos.current.y - camY) * RENDER_TILE);
      drawables.push({
        y: visualPos.current.y,
        draw: () => drawSprite(ctx, "player", playerSx, playerSy, facing === "left"),
      });

      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) d.draw();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTs.current = null;
    };
  }, [activeNpcs, visibleItems, facing]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ width: "100%", maxWidth: CANVAS_WIDTH, imageRendering: "pixelated", display: "block", margin: "0 auto", border: "4px solid #000", boxShadow: "0 0 0 4px #444" }}
    />
  );
}
