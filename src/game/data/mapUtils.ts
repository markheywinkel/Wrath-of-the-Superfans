import type { TileType } from "@/game/types";

/** Builds a rectangular room: wall border, floor interior. */
export function blankGrid(width: number, height: number, interior: TileType = "floor"): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      row.push(isBorder ? "wall" : interior);
    }
    grid.push(row);
  }
  return grid;
}

/** Fills an inclusive rectangle with the given tile type. Mutates and returns the grid. */
export function fillRect(
  grid: TileType[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tile: TileType
): TileType[][] {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (grid[y] && grid[y][x] !== undefined) grid[y][x] = tile;
    }
  }
  return grid;
}

/** Sets a single tile. Mutates and returns the grid. */
export function setTile(grid: TileType[][], x: number, y: number, tile: TileType): TileType[][] {
  if (grid[y] && grid[y][x] !== undefined) grid[y][x] = tile;
  return grid;
}
