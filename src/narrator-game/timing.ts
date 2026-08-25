/** Geschätzte Lesedauer für einen Untertitel/eine Erzähler-Zeile, in Millisekunden. */
export function estimateDisplayMs(line: string) {
  return Math.max(1400, Math.min(12000, line.length * 68));
}
