export const BASE_MAX_HP = 50;
export const HP_PER_LEVEL = 10;
export const BASE_MAX_AP = 20;
export const AP_PER_LEVEL = 4;

export function maxHpForLevel(level: number): number {
  return BASE_MAX_HP + level * HP_PER_LEVEL;
}

export function maxApForLevel(level: number): number {
  return BASE_MAX_AP + level * AP_PER_LEVEL;
}

/** XP required to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return 100 + level * 40;
}

/** XP granted for defeating an enemy of the given level. */
export function xpForDefeatingEnemy(enemyLevel: number): number {
  return enemyLevel * 15;
}

export interface LevelUpResult {
  level: number;
  xp: number;
  maxHp: number;
  maxAp: number;
  hp: number;
  ap: number;
  levelsGained: number;
}

/**
 * Applies gained XP to a player, handling (possibly multiple) level-ups.
 * On level-up, current HP/AP grow by the same amount the max grew by, so a
 * level-up always feels like a reward rather than a proportional reset.
 */
export function applyXp(
  current: { level: number; xp: number; hp: number; maxHp: number; ap: number; maxAp: number },
  gainedXp: number
): LevelUpResult {
  let { level, hp, maxHp, ap, maxAp } = current;
  let xp = current.xp + gainedXp;
  let levelsGained = 0;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    levelsGained += 1;
    const newMaxHp = maxHpForLevel(level);
    const newMaxAp = maxApForLevel(level);
    hp += newMaxHp - maxHp;
    ap += newMaxAp - maxAp;
    maxHp = newMaxHp;
    maxAp = newMaxAp;
  }

  return { level, xp, maxHp, maxAp, hp, ap, levelsGained };
}

/** Instantly raises the player by `amount` levels (used by collectible figures). */
export function applyLevelUp(
  current: { level: number; xp: number; hp: number; maxHp: number; ap: number; maxAp: number },
  amount: number
): LevelUpResult {
  let { level, hp, maxHp, ap, maxAp, xp } = current;
  for (let i = 0; i < amount; i++) {
    level += 1;
    const newMaxHp = maxHpForLevel(level);
    const newMaxAp = maxApForLevel(level);
    hp += newMaxHp - maxHp;
    ap += newMaxAp - maxAp;
    maxHp = newMaxHp;
    maxAp = newMaxAp;
  }
  return { level, xp, maxHp, maxAp, hp, ap, levelsGained: amount };
}
