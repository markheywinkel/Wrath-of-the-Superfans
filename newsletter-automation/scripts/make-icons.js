// Erzeugt die Icons für das Word-Add-in (Briefumschlag in Hausfarbe).
import { writeFile, mkdir } from 'node:fs/promises';
import { png } from './png.js';

const RED = [200, 16, 46];
const WHITE = [255, 255, 255];
await mkdir('public/assets', { recursive: true });
for (const size of [16, 32, 64, 80, 128]) {
  const s = size;
  const img = png(s, s, (x, y) => {
    const m = s * 0.1;
    const top = s * 0.22, bottom = s * 0.78;
    if (x < m || x > s - m || y < top || y > bottom) return [0, 0, 0, 0];
    // Umschlag-Klappe: V-Linie
    const cx = s / 2;
    const vy = top + (Math.abs(x - cx) < cx - m ? (cx - m - Math.abs(x - cx)) * ((s * 0.3) / (cx - m)) : 0);
    if (Math.abs(y - vy) < Math.max(1, s * 0.05)) return [...WHITE, 255];
    return [...RED, 255];
  });
  await writeFile(`public/assets/icon-${s}.png`, img);
}
console.log('Icons geschrieben');
