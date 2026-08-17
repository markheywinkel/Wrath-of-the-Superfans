// Ein gemeinsames 16x16-Chibi-Sprite (Game-Boy-Stil), das per Palette
// eingefärbt wird. So braucht jede Figur im Spiel kein eigenes Pixel-Bitmap.
export const SPRITE_TEMPLATE: string[] = [
  "................",
  "................",
  ".....HHHHHH.....",
  ".....HHHHHH.....",
  ".....SSSSSS.....",
  ".....SBSSBS.....",
  ".....SSSSSS.....",
  "......SSSS......",
  "....UUUUUUUU....",
  "....UuUUUUuU....",
  "....UUUUUUUU....",
  "....UUUUUUUU....",
  "....UU....UU....",
  "....UU....UU....",
  "....BB....BB....",
  "....BB....BB....",
];

export interface SpritePalette {
  H: string; // Haare
  S: string; // Haut
  B: string; // Augen/Stiefel
  U: string; // Uniform
  u: string; // Abzeichen/Akzent
}

export type SpriteRole = "player" | "old" | "new" | "super" | "neutral" | "boss";

export const SPRITE_PALETTES: Record<SpriteRole, SpritePalette> = {
  player: { H: "#3a2a1a", S: "#f2c49b", B: "#1a1a1a", U: "#3b6ea5", u: "#e8e8e8" },
  old: { H: "#8a8a8a", S: "#f2c49b", B: "#1a1a1a", U: "#c9a227", u: "#cfd6d9" },
  new: { H: "#222222", S: "#e8b98a", B: "#1a1a1a", U: "#4a5a6a", u: "#5ec8e8" },
  super: { H: "#5a2a7a", S: "#f2c49b", B: "#1a1a1a", U: "#7a3fae", u: "#e8c93a" },
  neutral: { H: "#3a2a1a", S: "#e8b98a", B: "#1a1a1a", U: "#3f7a4a", u: "#dfe8df" },
  boss: { H: "#3a0a0a", S: "#e8b98a", B: "#1a1a1a", U: "#7a1f1f", u: "#1a1a1a" },
};
