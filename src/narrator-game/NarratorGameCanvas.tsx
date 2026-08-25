"use client";

import { useEffect, useRef } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import { drawWorld } from "./render";
import type { Input, NarratorWorld } from "./world";

interface Props {
  world: NarratorWorld;
}

const MOVE_KEYS = new Set(["ArrowLeft", "ArrowRight", "a", "A", "d", "D"]);
const JUMP_KEYS = new Set(["ArrowUp", " ", "w", "W"]);

export default function NarratorGameCanvas({ world }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);

  const input = useRef<Input>({ left: false, right: false, jumpPressed: false });
  const heldLeft = useRef(false);
  const heldRight = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        heldLeft.current = true;
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        heldRight.current = true;
        e.preventDefault();
      } else if (JUMP_KEYS.has(e.key)) {
        if (!e.repeat) input.current.jumpPressed = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") heldLeft.current = false;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") heldRight.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (ts: number) => {
      const dt = lastTs.current ? (ts - lastTs.current) / 1000 : 1 / 60;
      lastTs.current = ts;

      input.current.left = heldLeft.current;
      input.current.right = heldRight.current;
      world.update(dt, input.current);
      input.current.jumpPressed = false;

      drawWorld(ctx, world);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTs.current = null;
    };
  }, [world]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        width: "100%",
        maxWidth: CANVAS_WIDTH,
        imageRendering: "pixelated",
        display: "block",
        margin: "0 auto",
        border: "4px solid #000",
        boxShadow: "0 0 0 4px #444",
      }}
    />
  );
}
