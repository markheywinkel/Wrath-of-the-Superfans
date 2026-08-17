export const TILE_SIZE = 16;
export const SCALE = 3;
export const RENDER_TILE = TILE_SIZE * SCALE;

export const VIEW_TILES_X = 13;
export const VIEW_TILES_Y = 9;

export const CANVAS_WIDTH = VIEW_TILES_X * RENDER_TILE;
export const CANVAS_HEIGHT = VIEW_TILES_Y * RENDER_TILE;

/** Milliseconds between grid steps while a direction is held. Konstant, keine Beschleunigung. */
export const MOVE_INTERVAL_MS = 180;
