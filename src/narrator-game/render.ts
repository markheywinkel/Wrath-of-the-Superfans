import {
  ABYSS_EDGE_X,
  ABYSS_FAR_EDGE_X,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GROUND_Y,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "./constants";
import type { NarratorWorld } from "./world";

function drawSky(ctx: CanvasRenderingContext2D, t: number, darkness: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  const topL = 18 - 14 * darkness;
  const botL = 34 - 30 * darkness;
  grad.addColorStop(0, `hsl(255, 45%, ${Math.max(2, topL)}%)`);
  grad.addColorStop(1, `hsl(275, 40%, ${Math.max(4, botL)}%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    const sx = (i * 137.5) % CANVAS_WIDTH;
    const sy = (i * 71.3) % (GROUND_Y - 20);
    const flicker = 0.35 + 0.35 * Math.abs(Math.sin(t * 1.3 + i));
    ctx.globalAlpha = flicker * (0.4 + 0.6 * darkness);
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawParallaxHills(ctx: CanvasRenderingContext2D, cameraX: number) {
  const factor = 0.35;
  ctx.fillStyle = "#241a3d";
  for (let i = -1; i < 8; i++) {
    const baseX = i * 260 - ((cameraX * factor) % 260);
    ctx.beginPath();
    ctx.moveTo(baseX, GROUND_Y);
    ctx.lineTo(baseX + 130, GROUND_Y - 90);
    ctx.lineTo(baseX + 260, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGroundAndPit(ctx: CanvasRenderingContext2D, cameraX: number) {
  const worldLeft = cameraX;
  const worldRight = cameraX + CANVAS_WIDTH;

  const segments: Array<[number, number]> = [];
  if (worldLeft < ABYSS_EDGE_X) segments.push([worldLeft, Math.min(worldRight, ABYSS_EDGE_X)]);
  if (worldRight > ABYSS_FAR_EDGE_X) segments.push([Math.max(worldLeft, ABYSS_FAR_EDGE_X), worldRight]);

  for (const [from, to] of segments) {
    const sx = from - cameraX;
    const width = to - from;
    if (width <= 0) continue;
    ctx.fillStyle = "#2b2140";
    ctx.fillRect(sx, GROUND_Y, width, CANVAS_HEIGHT - GROUND_Y);
    ctx.fillStyle = "#6a4fa0";
    ctx.fillRect(sx, GROUND_Y, width, 5);
  }

  const pitFrom = Math.max(worldLeft, ABYSS_EDGE_X);
  const pitTo = Math.min(worldRight, ABYSS_FAR_EDGE_X);
  if (pitTo > pitFrom) {
    const sx = pitFrom - cameraX;
    const width = pitTo - pitFrom;
    const grad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, "#0c0814");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(sx, GROUND_Y, width, CANVAS_HEIGHT - GROUND_Y);
    ctx.fillStyle = "#4a3a70";
    ctx.fillRect(sx - 3, GROUND_Y, 3, CANVAS_HEIGHT - GROUND_Y);
    ctx.fillRect(sx + width, GROUND_Y, 3, CANVAS_HEIGHT - GROUND_Y);
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  facing: "left" | "right",
  walkPhase: number,
  falling: boolean
) {
  const x = Math.round(screenX - PLAYER_WIDTH / 2);
  const y = Math.round(screenY - PLAYER_HEIGHT);
  const bob = falling ? 0 : Math.round(Math.sin(walkPhase) * 2);

  ctx.fillStyle = "#3a2a55";
  ctx.fillRect(x + 3, y + PLAYER_HEIGHT - 4, PLAYER_WIDTH - 6, 4);

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(x + 4, y + 14 + bob, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 24);

  ctx.fillStyle = "#f0c9a0";
  ctx.fillRect(x + 6, y + bob, PLAYER_WIDTH - 12, 14);

  ctx.fillStyle = "#1a1a1a";
  const eyeX = facing === "right" ? x + PLAYER_WIDTH - 10 : x + 6;
  ctx.fillRect(eyeX, y + 5 + bob, 3, 3);

  ctx.fillStyle = "#c99a20";
  if (falling) {
    ctx.fillRect(x - 3, y + 16, 5, 14);
    ctx.fillRect(x + PLAYER_WIDTH - 2, y + 16, 5, 14);
  } else {
    const legSwing = Math.round(Math.sin(walkPhase) * 4);
    ctx.fillRect(x + 5, y + PLAYER_HEIGHT - 10 + Math.max(0, legSwing), 5, 10);
    ctx.fillRect(x + PLAYER_WIDTH - 10, y + PLAYER_HEIGHT - 10 + Math.max(0, -legSwing), 5, 10);
  }
}

function drawTitleCard(ctx: CanvasRenderingContext2D, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,204,0,0.55)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffcc00";
  ctx.font = "700 30px 'Press Start 2P', ui-monospace, monospace";
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  wrapText(ctx, "DAS IST EIN", cx, cy - 34);
  wrapText(ctx, "SPIEL ÜBER", cx, cy);
  wrapText(ctx, "DAS LEBEN", cx, cy + 34);
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillText(text, x, y);
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: NarratorWorld) {
  ctx.imageSmoothingEnabled = false;

  if (world.phase === "final_fall" || world.phase === "ending") {
    const darkness = world.phase === "ending" ? 1 : Math.min(1, world.finalFallStage / 2 + 0.15);
    drawSky(ctx, world.t, darkness);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const streakX = (i * 53.7) % CANVAS_WIDTH;
      const speed = 260 + (i % 5) * 40;
      const streakY = CANVAS_HEIGHT - ((world.t * speed + i * 61) % (CANVAS_HEIGHT + 40));
      ctx.beginPath();
      ctx.moveTo(streakX, streakY);
      ctx.lineTo(streakX, streakY + 18);
      ctx.stroke();
    }

    if (world.phase === "final_fall") {
      const px = CANVAS_WIDTH / 2 + world.finalOffsetX;
      const py = CANVAS_HEIGHT / 2 + Math.sin(world.t * 2.4) * 10;
      drawPlayer(ctx, px, py, world.facing, world.t * 6, true);
    }

    if (world.phase === "ending") {
      const { bg, text } = world.getEndingProgress();
      ctx.fillStyle = `rgba(0,0,0,${bg})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawTitleCard(ctx, text);
    }
    return;
  }

  const darkness = 0;
  drawSky(ctx, world.t, darkness);
  drawParallaxHills(ctx, world.cameraX);
  drawGroundAndPit(ctx, world.cameraX);

  const screenX = world.x - world.cameraX;
  const screenY = world.y;
  const walking = world.phase === "playing" && world.vx !== 0 && world.onGround;
  const falling = !world.onGround && world.phase === "playing";
  drawPlayer(ctx, screenX, screenY, world.facing, world.t * (walking ? 9 : 3), falling && !walking);
}
