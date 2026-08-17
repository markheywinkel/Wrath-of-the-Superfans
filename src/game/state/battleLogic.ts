import type { Attack, FanType } from "@/game/types";

/** Old schlägt New, New schlägt Old, Super ist gegen alle effektiv. */
export function isEffective(attackType: FanType, defenderType: FanType): boolean {
  if (attackType === "super") return true;
  if (attackType === "old" && defenderType === "new") return true;
  if (attackType === "new" && defenderType === "old") return true;
  return false;
}

export const EFFECTIVE_MULTIPLIER = 1.5;

/** Fallback-Attacke, wenn der Attackenbalken leer ist. Kostet 0 AP, ist nie typ-effektiv. */
export const DESPERATE_ATTACK: Attack = {
  id: "desperate_slap",
  name: "Verzweifelter Klaps",
  type: "old",
  power: 5,
  apCost: 0,
  description: "Kein Attackenenergie mehr übrig – nur noch ein verzweifelter Schlag.",
};

export interface DamageResult {
  damage: number;
  effective: boolean;
}

export function calcDamage(
  attack: Attack,
  attackerLevel: number,
  defenderType: FanType
): DamageResult {
  if (attack.id === DESPERATE_ATTACK.id) {
    return { damage: DESPERATE_ATTACK.power, effective: false };
  }
  const effective = isEffective(attack.type, defenderType);
  const multiplier = effective ? EFFECTIVE_MULTIPLIER : 1;
  const levelFactor = 1 + attackerLevel * 0.03;
  const raw = attack.power * levelFactor * multiplier;
  return { damage: Math.max(1, Math.round(raw)), effective };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
