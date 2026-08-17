import type { TileType } from "@/game/types";
import { RENDER_TILE, TILE_SIZE } from "@/game/engine/constants";
import { SPRITE_TEMPLATE, type SpriteRole, SPRITE_PALETTES } from "@/game/engine/sprites";

const TILE_BASE_COLOR: Record<TileType, string> = {
  floor: "#2b2b3a",
  wall: "#17171f",
  door: "#caa43c",
  carpet: "#6b1f2b",
  console: "#2e3a4a",
  water: "#1f4a6b",
  grass: "#234a2e",
  path: "#4a4030",
};

const TILE_DETAIL_COLOR: Record<TileType, string> = {
  floor: "#313142",
  wall: "#0f0f15",
  door: "#e8c65c",
  carpet: "#7a2635",
  console: "#3a4a5e",
  water: "#2c5c80",
  grass: "#1c3d26",
  path: "#564a38",
};

function pseudoRandom(x: number, y: number): number {
  const n = (x * 92821 + y * 68917) % 997;
  return n / 997;
}

export function drawTile(ctx: CanvasRenderingContext2D, type: TileType, screenX: number, screenY: number, worldX: number, worldY: number): void {
  ctx.fillStyle = TILE_BASE_COLOR[type];
  ctx.fillRect(screenX, screenY, RENDER_TILE, RENDER_TILE);

  const r = pseudoRandom(worldX, worldY);
  ctx.fillStyle = TILE_DETAIL_COLOR[type];

  switch (type) {
    case "wall": {
      // Ziegel-Fugen
      ctx.fillRect(screenX, screenY + RENDER_TILE / 2 - 1, RENDER_TILE, 2);
      ctx.fillRect(screenX + RENDER_TILE / 2 - 1, screenY, 2, RENDER_TILE / 2);
      break;
    }
    case "floor":
    case "carpet":
    case "path": {
      if (r > 0.6) ctx.fillRect(screenX + RENDER_TILE * 0.25, screenY + RENDER_TILE * 0.25, RENDER_TILE * 0.5, RENDER_TILE * 0.5);
      break;
    }
    case "grass": {
      const blades = 3;
      for (let i = 0; i < blades; i++) {
        const bx = screenX + ((worldX * 13 + i * 37) % (RENDER_TILE - 6)) + 3;
        const by = screenY + ((worldY * 7 + i * 23) % (RENDER_TILE - 6)) + 3;
        ctx.fillRect(bx, by, 3, 6);
      }
      break;
    }
    case "water": {
      ctx.fillRect(screenX, screenY + RENDER_TILE * 0.4, RENDER_TILE, 3);
      break;
    }
    case "console": {
      ctx.fillStyle = "#6fe0ff";
      ctx.fillRect(screenX + RENDER_TILE * 0.2, screenY + RENDER_TILE * 0.2, RENDER_TILE * 0.6, RENDER_TILE * 0.35);
      break;
    }
    case "door": {
      ctx.fillRect(screenX + RENDER_TILE * 0.15, screenY, RENDER_TILE * 0.7, RENDER_TILE);
      break;
    }
  }
}

const PIXEL_SIZE = RENDER_TILE / TILE_SIZE;

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  role: SpriteRole,
  screenX: number,
  screenY: number,
  facingLeft: boolean,
  scale = 1
): void {
  const palette = SPRITE_PALETTES[role];
  const size = RENDER_TILE * scale;
  const offsetX = screenX - (size - RENDER_TILE) / 2;
  const offsetY = screenY - (size - RENDER_TILE);
  const px = (size / TILE_SIZE) | 0 || 1;

  for (let row = 0; row < SPRITE_TEMPLATE.length; row++) {
    const line = SPRITE_TEMPLATE[row];
    for (let col = 0; col < line.length; col++) {
      const key = line[col];
      if (key === ".") continue;
      const color = palette[key as keyof typeof palette];
      if (!color) continue;
      const drawCol = facingLeft ? line.length - 1 - col : col;
      ctx.fillStyle = color;
      ctx.fillRect(offsetX + drawCol * px, offsetY + row * px, px, px);
    }
  }
}

export function drawItemSparkle(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, hidden: boolean, t: number): void {
  const bob = Math.sin(t / 220) * 4;
  const cx = screenX + RENDER_TILE / 2;
  const cy = screenY + RENDER_TILE / 2 + bob;
  const size = hidden ? 5 : 9;
  ctx.fillStyle = hidden ? "rgba(255, 230, 120, 0.55)" : "#ffe678";
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.35, cy - size * 0.35);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx + size * 0.35, cy + size * 0.35);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.35, cy + size * 0.35);
  ctx.lineTo(cx - size, cy);
  ctx.lineTo(cx - size * 0.35, cy - size * 0.35);
  ctx.closePath();
  ctx.fill();
}
