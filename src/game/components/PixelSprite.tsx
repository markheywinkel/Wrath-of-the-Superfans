"use client";

import { useEffect, useRef } from "react";
import { drawSprite } from "@/game/engine/render";
import { RENDER_TILE } from "@/game/engine/constants";
import type { SpriteRole } from "@/game/engine/sprites";

interface Props {
  role: SpriteRole;
  size?: number;
  mirror?: boolean;
}

export default function PixelSprite({ role, size = 96, mirror = false }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const factor = size / RENDER_TILE;
    ctx.scale(factor, factor);
    drawSprite(ctx, role, 0, 0, mirror);
    ctx.restore();
  }, [role, size, mirror]);

  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: "pixelated" }} />;
}
