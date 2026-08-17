"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftSpeed: number;
  color: string;
}

const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#cfe8ff", "#ffe9c2"];

function makeStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.0015 + 0.0004,
      twinklePhase: Math.random() * Math.PI * 2,
      driftSpeed: Math.random() * 0.006 + 0.002,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    });
  }
  return stars;
}

/**
 * Fixed, full-viewport twinkling starfield. Lives at the page level, behind
 * the embedded game - the game itself keeps its own opaque screens.
 */
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = 0.00012;
      const count = Math.round(window.innerWidth * window.innerHeight * density);
      starsRef.current = makeStars(window.innerWidth, window.innerHeight, Math.min(count, 400));
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (ts: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (const star of starsRef.current) {
        star.y += star.driftSpeed;
        if (star.y > h) star.y = 0;
        const twinkle = Math.sin(ts * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        ctx.globalAlpha = star.baseAlpha * (0.5 + twinkle * 0.5);
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, #131329 0%, #05050a 60%, #020204 100%)",
      }}
    />
  );
}
