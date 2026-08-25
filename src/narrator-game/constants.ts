export const CANVAS_WIDTH = 780;
export const CANVAS_HEIGHT = 440;

export const GROUND_Y = 340;

export const GRAVITY = 1900;
export const JUMP_VELOCITY = -640;
export const MOVE_SPEED = 230;

export const PLAYER_WIDTH = 26;
export const PLAYER_HEIGHT = 40;

/** "Ein Bildschirm" - eine Kamerabreite, wie im Skript als Distanzmaß benutzt. */
export const SCREEN_WIDTH = CANVAS_WIDTH;

/**
 * Randbreite, die von der fernen Abgrundseite am rechten Bildschirmrand
 * sichtbar bleibt, wenn die Kamera an der Kante einrastet (siehe Skript:
 * "die gegenüberliegende Seite ist am rechten Bildschirmrand zu sehen").
 */
const FAR_EDGE_MARGIN = 60;

/**
 * Breiter als jede erreichbare Sprungweite (siehe unten), damit der Abgrund
 * garantiert unüberwindbar ist - unabhängig vom Timing des Sprungs.
 * Max. Sprungweite = MOVE_SPEED * (2 * |JUMP_VELOCITY| / GRAVITY) ≈ 158px.
 */
export const PIT_WIDTH = SCREEN_WIDTH / 2 - FAR_EDGE_MARGIN;

/** Weltposition, an der der Spieler nach dem Einlaufen die Kontrolle übernimmt. */
export const HANDOFF_X = CANVAS_WIDTH / 2;

export const ABYSS_EDGE_X = HANDOFF_X + SCREEN_WIDTH * 4;
export const ABYSS_FAR_EDGE_X = ABYSS_EDGE_X + PIT_WIDTH;

/** Kamera bleibt spätestens hier stehen, sodass die ferne Kante am rechten Rand steht. */
export const CAMERA_LOCK_X = ABYSS_EDGE_X - SCREEN_WIDTH / 2;

export const INTRO_START_X = -120;
export const INTRO_SPEED = 190;

export const RESPAWN_X = ABYSS_EDGE_X - 60;

export const FALL_OUT_Y = CANVAS_HEIGHT + 80;
