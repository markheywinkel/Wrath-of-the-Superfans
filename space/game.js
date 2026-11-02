/*
 * Space – ein ruhiges Pixel-Sonnensystem.
 *
 * Welt: flache Bahnebene (x, y) plus Höhe z. Die Kamera blickt unter 30° schräg
 * von oben darauf (isometrische Anmutung): Kreise werden zu Ellipsen 2:1.
 * Gerendert wird in eine niedrig aufgelöste Canvas, die per CSS pixelig
 * hochskaliert wird. Planeten, Monde, Sonne und Raumschiff werden pro Pixel
 * als beleuchtete 3D-Körper gezeichnet.
 */
(() => {
  'use strict';

  const TEXTS = window.SPACE_TEXTS;
  const TAU = Math.PI * 2;
  const SIN_E = 0.5;        // Bildschirm-Stauchung der Bahnebene
  const COS_E = 0.8660254;  // Höhenanteil

  const SHIP_LIMIT = 600;   // so weit darf das Schiff vom Zentrum weg
  const BELT_INNER = 628;
  const BELT_OUTER = 712;
  const COIN_TOTAL = 30;
  const SHIP_MAX_SPEED = 78;
  const STORAGE_KEY = 'space.coins.v1';
  const MAP_W = 128, MAP_H = 64;
  const LEVELS = 5;
  const AMBIENT = 0.16;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

  // ------------------------------------------------------------------ utils
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash3(x, y, z, s) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, z, s) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const a = hash3(xi, yi, zi, s), b = hash3(xi + 1, yi, zi, s);
    const c = hash3(xi, yi + 1, zi, s), d = hash3(xi + 1, yi + 1, zi, s);
    const e = hash3(xi, yi, zi + 1, s), f = hash3(xi + 1, yi, zi + 1, s);
    const g = hash3(xi, yi + 1, zi + 1, s), h = hash3(xi + 1, yi + 1, zi + 1, s);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (h - g) * u;
    const y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
    return y1 + (y2 - y1) * w;
  }
  function fbm(x, y, z, s, oct = 5) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * vnoise(x * f, y * f, z * f, s + i * 17);
      norm += amp; amp *= 0.5; f *= 2.03;
    }
    return sum / norm;
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const G = arr => arr.map(([t, h]) => [t, hex(h)]);
  function grad(stops, t) {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i];
        const k = (t - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k];
      }
    }
    return stops[stops.length - 1][1];
  }
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  function angDiff(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  // Licht-Richtung (Welt-Ebene, normiert) -> Kamera-Koordinaten (x rechts, y runter, z zum Betrachter)
  const camVec = (dx, dy, dz = 0) => [dx, SIN_E * dy - COS_E * dz, COS_E * dy + SIN_E * dz];
  function sunLight(x, y) {
    const d = Math.hypot(x, y) || 1;
    return camVec(-x / d, -y / d);
  }
  // Sonnenlicht plus etwas Fülllicht von vorne, damit auch die "Nachtseite" lesbar bleibt
  function bodyLight(x, y) {
    const L = sunLight(x, y);
    const v = [L[0] * 0.8, L[1] * 0.8, L[2] * 0.8 + 0.5];
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  // ------------------------------------------------------------- textures
  function forSphere(fn) {
    const out = new Float32Array(MAP_W * MAP_H);
    let i = 0;
    for (let v = 0; v < MAP_H; v++) {
      const lat = (0.5 - (v + 0.5) / MAP_H) * Math.PI;
      const cl = Math.cos(lat), sl = Math.sin(lat);
      for (let u = 0; u < MAP_W; u++) {
        const lon = ((u + 0.5) / MAP_W) * TAU;
        out[i++] = fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat, lon);
      }
    }
    return out;
  }
  function norm01(a) {
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < a.length; i++) { if (a[i] < mn) mn = a[i]; if (a[i] > mx) mx = a[i]; }
    const r = mx - mn || 1;
    for (let i = 0; i < a.length; i++) a[i] = (a[i] - mn) / r;
    return a;
  }
  function quantile(a, q) {
    const s = Float32Array.from(a).sort();
    return s[Math.min(s.length - 1, Math.floor(q * s.length))];
  }
  function makeTex(fn) {
    const tex = new Uint8ClampedArray(MAP_W * MAP_H * 3);
    for (let i = 0; i < MAP_W * MAP_H; i++) {
      const v = Math.floor(i / MAP_W), u = i % MAP_W;
      const lat = (0.5 - (v + 0.5) / MAP_H) * Math.PI;
      const lon = ((u + 0.5) / MAP_W) * TAU;
      const c = fn(i, lat, lon);
      tex[i * 3] = c[0]; tex[i * 3 + 1] = c[1]; tex[i * 3 + 2] = c[2];
    }
    return tex;
  }

  function texSun(seed) {
    const f = norm01(forSphere((x, y, z) => fbm(x * 6, y * 6, z * 6, seed, 4)));
    const g = G([[0, '#ff7414'], [0.45, '#ffa932'], [0.75, '#ffd85e'], [1, '#fff6c8']]);
    return { tex: makeTex(i => grad(g, f[i])) };
  }
  function texEmber(seed) {
    const f = norm01(forSphere((x, y, z) => {
      const w = fbm(x * 2.5, y * 2.5, z * 2.5, seed + 5, 3) * 2.2;
      return fbm(x * 1.8 + w, y * 7 + w * 0.6, z * 1.8 - w, seed, 5);
    }));
    const g = G([[0, '#6e1f0e'], [0.3, '#b8481a'], [0.55, '#e38330'], [0.8, '#f6bd66'], [1, '#fff0c6']]);
    return { tex: makeTex(i => grad(g, f[i])) };
  }
  function texTerra(seed, o) {
    const h = norm01(forSphere((x, y, z) => fbm(x * 1.7, y * 1.7, z * 1.7, seed, 6)));
    const pol = forSphere((x, y, z, lat) => Math.abs(lat) + (fbm(x * 4, y * 4, z * 4, seed + 3, 3) - 0.5) * 0.6);
    const sea = quantile(h, o.seaQ);
    const oc = G(o.ocean), ld = G(o.land), ice = hex('#eef6ff');
    const tex = makeTex(i => {
      if (pol[i] > o.polar) return ice;
      const v = h[i];
      if (v < sea) return grad(oc, 1 - (sea - v) / sea);
      return grad(ld, (v - sea) / (1 - sea));
    });
    const c = norm01(forSphere((x, y, z) => {
      const w = fbm(x * 2, y * 2, z * 2, seed + 11, 3) * 1.6;
      return fbm(x * 2.2 + w, y * 4.5, z * 2.2 + w, seed + 7, 5);
    }));
    const cq = quantile(c, o.cloudQ);
    const cloud = new Float32Array(c.length);
    for (let i = 0; i < c.length; i++) cloud[i] = smooth(cq, cq + 0.12, c[i]) * 0.95;
    return { tex, cloud };
  }
  function texGigas(seed) {
    const det = forSphere((x, y, z) => fbm(x * 3, y * 10, z * 3, seed, 4));
    const ws = forSphere((x, y, z) => fbm(x * 1.5, y * 1.5, z * 1.5, seed + 9, 3));
    const g = G([[0, '#f3e6c6'], [0.35, '#ddb680'], [0.65, '#b9804e'], [1, '#8a5636']]);
    const spotOuter = hex('#c25a3c'), spotInner = hex('#e7a070');
    return {
      tex: makeTex((i, lat, lon) => {
        const b = Math.sin(lat) * 10 + (ws[i] - 0.5) * 3 + (det[i] - 0.5) * 1.2;
        const v = 0.5 + 0.5 * Math.sin(b * Math.PI * 0.9);
        let col = grad(g, v * 0.85 + det[i] * 0.15);
        const dl = angDiff(1.6, lon), dlat = lat + 0.35;
        const e = (dl * Math.cos(lat) / 0.32) ** 2 + (dlat / 0.14) ** 2;
        if (e < 1) col = mix(col, e < 0.4 ? spotInner : spotOuter, 0.85);
        return col;
      }),
    };
  }
  function texGlacies(seed) {
    const f = norm01(forSphere((x, y, z) => fbm(x * 2.2, y * 2.2, z * 2.2, seed, 4)));
    const r = norm01(forSphere((x, y, z) => fbm(x * 3.5, y * 3.5, z * 3.5, seed + 4, 4)));
    const g = G([[0, '#93c3e2'], [0.5, '#d2ecf9'], [1, '#ffffff']]);
    const crack = hex('#6a9cc4');
    return { tex: makeTex(i => (1 - Math.abs(r[i] * 2 - 1) > 0.95 ? crack : grad(g, f[i]))) };
  }
  function texMoon(seed, stops) {
    const f = norm01(forSphere((x, y, z) => fbm(x * 3, y * 3, z * 3, seed, 5)));
    const g = G(stops);
    return { tex: makeTex(i => grad(g, f[i])) };
  }

  // -------------------------------------------------------------- sprites
  function makeSprite(r, pad = 2) {
    const D = 2 * (r + pad);
    const cv = document.createElement('canvas');
    cv.width = cv.height = D;
    const cx = cv.getContext('2d');
    return { cv, cx, img: cx.createImageData(D, D), D };
  }

  /** Zeichnet eine beleuchtete Kugel pixelweise in ihr Sprite. */
  function renderSphere(spr, r, b, L) {
    const { D, img } = spr;
    const d = img.data;
    const c = D / 2;
    const tex = b.tex.tex, cloud = b.tex.cloud;
    const rot = b.rot, crot = b.cloudRot || 0;
    const atmo = b.atmo, emissive = b.emissive;
    const lx = L[0], ly = L[1], lz = L[2];
    const halo2 = atmo ? (1 + 1.8 / r) ** 2 : 1;
    for (let j = 0; j < D; j++) {
      for (let i = 0; i < D; i++) {
        const k = (j * D + i) * 4;
        const px = (i + 0.5 - c) / r, py = (j + 0.5 - c) / r;
        const rr = px * px + py * py;
        if (rr > 1) {
          d[k + 3] = 0;
          if (rr < halo2) {
            const inv = 1 / Math.sqrt(rr);
            const l = (px * inv * lx + py * inv * ly) * 0.8 + lz * 0.3 + 0.2;
            if (l > 0.1) {
              d[k] = atmo[0]; d[k + 1] = atmo[1]; d[k + 2] = atmo[2];
              d[k + 3] = l > 0.55 ? 150 : 70;
            }
          }
          continue;
        }
        const nz = Math.sqrt(1 - rr);
        const lat = Math.asin(clamp(-COS_E * py + SIN_E * nz, -1, 1));
        const lon = Math.atan2(SIN_E * py + COS_E * nz, px);
        const v = Math.min(MAP_H - 1, ((0.5 - lat / Math.PI) * MAP_H) | 0);
        let u = ((lon + rot) / TAU) % 1; if (u < 0) u += 1;
        const ti = v * MAP_W + (((u * MAP_W) | 0) % MAP_W);
        let R = tex[ti * 3], Gc = tex[ti * 3 + 1], B = tex[ti * 3 + 2];
        if (cloud) {
          let u2 = ((lon + crot) / TAU) % 1; if (u2 < 0) u2 += 1;
          const a = cloud[v * MAP_W + (((u2 * MAP_W) | 0) % MAP_W)];
          if (a > 0) { R += (246 - R) * a; Gc += (248 - Gc) * a; B += (255 - B) * a; }
        }
        const bay = BAYER[(j & 3) * 4 + (i & 3)];
        let s, dif = 0;
        if (emissive) {
          s = 0.62 + 0.38 * Math.sqrt(nz);
        } else {
          dif = px * lx + py * ly + nz * lz;
          s = AMBIENT + (1 - AMBIENT) * Math.max(0, dif);
        }
        let q = Math.floor(s * LEVELS + bay) / LEVELS;
        if (q > 1) q = 1;
        R *= q; Gc *= q; B *= q;
        if (!emissive) {
          if (q < 0.3) { Gc += 4; B += 16; }
          if (atmo) {
            const rim = 1 - nz;
            const k2 = rim * rim * 0.8 * clamp(dif + 0.35, 0, 1);
            R += (atmo[0] - R) * k2; Gc += (atmo[1] - Gc) * k2; B += (atmo[2] - B) * k2;
          }
        }
        d[k] = R; d[k + 1] = Gc; d[k + 2] = B; d[k + 3] = 255;
      }
    }
    spr.cx.putImageData(img, 0, 0);
  }

  /** Dithered Glow der Sonne (einmalig vorberechnet). */
  function makeSunGlow(r) {
    const R = Math.round(r * 2.8);
    const D = R * 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = D;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(D, D);
    const col = hex('#ffb347');
    for (let j = 0; j < D; j++) {
      for (let i = 0; i < D; i++) {
        const dist = Math.hypot(i + 0.5 - R, j + 0.5 - R);
        if (dist < r - 1 || dist > R) continue;
        const t = Math.exp(-(dist - r) / (r * 0.55)) * 0.45;
        const q = Math.floor(t * 6 + BAYER[(j & 3) * 4 + (i & 3)]) / 6;
        if (q <= 0) continue;
        const k = (j * D + i) * 4;
        img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2];
        img.data[k + 3] = Math.min(255, q * 255);
      }
    }
    cx.putImageData(img, 0, 0);
    return { cv, R };
  }

  /** Asteroiden-Sprites: 4 Größen x 4 Formen x 8 Lichtrichtungen. */
  function makeRocks() {
    const g = G([[0, '#2c2732'], [0.35, '#5d5460'], [0.7, '#968c90'], [1, '#cfc6c0']]);
    const out = [];
    for (let s = 1; s <= 4; s++) {
      const shapes = [];
      for (let v = 0; v < 4; v++) {
        const dirs = [];
        for (let k = 0; k < 8; k++) {
          const phi = (k / 8) * TAU;
          const L = camVec(Math.cos(phi) * 0.85, Math.sin(phi) * 0.85, 0.5);
          const D = 2 * s + 3, c = D / 2;
          const cv = document.createElement('canvas');
          cv.width = cv.height = D;
          const cx = cv.getContext('2d');
          const img = cx.createImageData(D, D);
          for (let j = 0; j < D; j++) {
            for (let i = 0; i < D; i++) {
              const dx = i + 0.5 - c, dy = j + 0.5 - c;
              const th = Math.atan2(dy, dx);
              const R = s * (0.78 + 0.45 * vnoise(Math.cos(th) * 1.4 + v * 7, Math.sin(th) * 1.4, v, 99)) + 0.35;
              if (Math.hypot(dx, dy) > R) continue;
              const nx = dx / (R + 0.4), ny = dy / (R + 0.4);
              const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
              const l = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
              const q = Math.round((0.15 + 0.85 * l) * 3) / 3;
              const col = grad(g, q);
              const p = (j * D + i) * 4;
              img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = 255;
            }
          }
          cx.putImageData(img, 0, 0);
          dirs.push({ cv, D });
        }
        shapes.push(dirs);
      }
      out.push(shapes);
    }
    return out;
  }

  // ------------------------------------------------------------------ ship
  const SHIP_V = [
    [9, 0, 0.6], [-6, -7, 0], [-6, 7, 0], [-1, 0, 3], [-6, 0, 1.6], [-2, 0, -1.5],
    [4, 0, 2.05], [0.5, -1.3, 2.8], [0.5, 1.3, 2.8], [-1, 0, 3.35],
  ];
  const SHIP_COL = { hull: hex('#e9edf5'), accent: hex('#f08a4b'), under: hex('#5d6a86'), glass: hex('#5fd3ff') };
  const SHIP_F = [
    [0, 3, 1, 'hull'], [0, 2, 3, 'hull'], [3, 4, 1, 'accent'], [3, 2, 4, 'accent'],
    [0, 1, 5, 'under'], [0, 5, 2, 'under'], [1, 4, 5, 'under'], [4, 2, 5, 'under'],
    [6, 9, 7, 'glass'], [6, 8, 9, 'glass'],
  ];
  const SHIP_SCALE = 0.95;
  const SB = 34;
  const shipSpr = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = SB;
    const cx = cv.getContext('2d');
    return { cv, cx, img: cx.createImageData(SB, SB), z: new Float32Array(SB * SB), mask: new Uint8Array(SB * SB) };
  })();
  const OUTLINE = hex('#070914');

  function renderShip(heading, bank, L) {
    const { img, z, mask } = shipSpr;
    const d = img.data;
    d.fill(0); z.fill(-1e9);
    const ch = Math.cos(heading), sh = Math.sin(heading), cb = Math.cos(bank), sb = Math.sin(bank);
    const P = SHIP_V.map(([x, y, zz]) => {
      const y1 = y * cb - zz * sb, z1 = y * sb + zz * cb;
      const xw = (x * ch - y1 * sh) * SHIP_SCALE, yw = (x * sh + y1 * ch) * SHIP_SCALE, zw = z1 * SHIP_SCALE;
      return [SB / 2 + xw, SB / 2 + SIN_E * yw - COS_E * zw, COS_E * yw + SIN_E * zw, xw, yw, zw];
    });
    const edge = (a, b, px, py) => (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    for (const [ia, ib, ic, cname] of SHIP_F) {
      const a = P[ia], b = P[ib], c = P[ic];
      const ux = b[3] - a[3], uy = b[4] - a[4], uz = b[5] - a[5];
      const vx = c[3] - a[3], vy = c[4] - a[4], vz = c[5] - a[5];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      let [cx, cy, cz] = camVec(nx, ny, nz);
      if (cz < 0) { cx = -cx; cy = -cy; cz = -cz; }
      const dif = Math.max(0, cx * L[0] + cy * L[1] + cz * L[2]);
      const s = Math.ceil((0.4 + 0.6 * dif) * 4) / 4;
      const col = SHIP_COL[cname];
      const R = col[0] * s, Gc = col[1] * s, B = col[2] * s;
      const area = edge(a, b, c[0], c[1]);
      if (Math.abs(area) < 1e-6) continue;
      const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
      const x1 = Math.min(SB - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
      const y1 = Math.min(SB - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const px = x + 0.5, py = y + 0.5;
          const w0 = edge(b, c, px, py) / area, w1 = edge(c, a, px, py) / area, w2 = edge(a, b, px, py) / area;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const depth = w0 * a[2] + w1 * b[2] + w2 * c[2];
          const p = y * SB + x;
          if (depth <= z[p]) continue;
          z[p] = depth;
          d[p * 4] = R; d[p * 4 + 1] = Gc; d[p * 4 + 2] = B; d[p * 4 + 3] = 255;
        }
      }
    }
    // dunkle Pixel-Kontur für Lesbarkeit
    for (let p = 0; p < SB * SB; p++) mask[p] = d[p * 4 + 3] ? 1 : 0;
    for (let y = 1; y < SB - 1; y++) {
      for (let x = 1; x < SB - 1; x++) {
        const p = y * SB + x;
        if (mask[p]) continue;
        if (mask[p - 1] || mask[p + 1] || mask[p - SB] || mask[p + SB]) {
          d[p * 4] = OUTLINE[0]; d[p * 4 + 1] = OUTLINE[1]; d[p * 4 + 2] = OUTLINE[2]; d[p * 4 + 3] = 230;
        }
      }
    }
    shipSpr.cx.putImageData(img, 0, 0);
    // Heck-Position (für Triebwerk) relativ zur Sprite-Mitte
    return { ex: P[4][0] - SB / 2, ey: P[4][1] - SB / 2 };
  }

  // ----------------------------------------------------------------- world
  const rng = mulberry32(20261102);
  const BODIES = [
    { id: 'sun', r: 24, orbit: 0, period: 1, rotPeriod: 160, emissive: true, tex: texSun(3) },
    { id: 'ember', r: 9, orbit: 115, rotPeriod: -120, tex: texEmber(11), atmo: hex('#ffb070') },
    {
      id: 'aqua', r: 11, orbit: 195, rotPeriod: 70, atmo: hex('#8ec6ff'),
      tex: texTerra(21, {
        seaQ: 0.6, cloudQ: 0.62, polar: 1.2,
        ocean: [[0, '#0f2c66'], [0.6, '#1b4ea3'], [0.92, '#2f7fd6'], [1, '#58a6e8']],
        land: [[0, '#d8c88a'], [0.06, '#6aa84f'], [0.35, '#3f7f3a'], [0.65, '#7f8a4e'], [0.85, '#8f735a'], [1, '#e6e6e6']],
      }),
    },
    {
      id: 'thalassa', r: 10, orbit: 275, rotPeriod: 85, atmo: hex('#9fe6ff'),
      tex: texTerra(37, {
        seaQ: 0.78, cloudQ: 0.52, polar: 1.28,
        ocean: [[0, '#0e3f63'], [0.6, '#16679a'], [0.9, '#2aa0c4'], [1, '#6fd3e0']],
        land: [[0, '#efe0a8'], [0.1, '#9cc76a'], [0.5, '#5aa05a'], [1, '#c9b98a']],
      }),
    },
    {
      id: 'gigas', r: 22, orbit: 405, rotPeriod: 45, tex: texGigas(53),
      moons: [
        { r: 3, orbit: 34, period: 26, tex: texMoon(61, [[0, '#5e5e68'], [0.5, '#9a9aa4'], [1, '#d4d4dc']]) },
        { r: 4, orbit: 45, period: 41, tex: texMoon(67, [[0, '#6a3a2c'], [0.5, '#a8705a'], [1, '#e0b090']]) },
        { r: 3, orbit: 56, period: 60, tex: texMoon(71, [[0, '#7890a4'], [0.5, '#bccfdc'], [1, '#f0f6fa']]) },
      ],
    },
    { id: 'glacies', r: 8, orbit: 545, rotPeriod: -95, tex: texGlacies(83), atmo: hex('#d8f4ff') },
  ];
  for (const b of BODIES) {
    if (b.orbit > 0) b.period = 95 * Math.pow(b.orbit / 115, 1.5); // Kepler-artig, sehr gemächlich
    b.a0 = rng() * TAU;
    b.x = 0; b.y = 0; b.rot = 0;
    b.spr = makeSprite(b.r, b.atmo ? 3 : 2);
    if (b.moons) {
      b.avoidR = Math.max(...b.moons.map(m => m.orbit + m.r)) + 12;
      b.coreR = b.avoidR - 8;
      for (const m of b.moons) { m.a0 = rng() * TAU; m.x = 0; m.y = 0; m.rot = 0; m.spr = makeSprite(m.r, 1); m.parent = b; }
    } else {
      b.avoidR = Math.round(b.r * 1.5 + 12);
      b.coreR = b.r + 3;
    }
  }
  const SUN = BODIES[0];
  const sunGlow = makeSunGlow(SUN.r);
  const rocks = makeRocks();

  // Asteroidengürtel
  const asteroids = [];
  for (let i = 0; i < 460; i++) {
    const g = (rng() + rng() + rng()) / 3; // dichter in der Mitte
    const roll = rng();
    asteroids.push({
      a: rng() * TAU,
      rad: BELT_INNER + g * (BELT_OUTER - BELT_INNER),
      z: (rng() - 0.5) * 12,
      s: roll < 0.45 ? 1 : roll < 0.78 ? 2 : roll < 0.94 ? 3 : 4,
      v: (rng() * 4) | 0,
    });
  }
  const dust = [];
  for (let i = 0; i < 700; i++) {
    const g = (rng() + rng()) / 2;
    dust.push({ a: rng() * TAU, rad: BELT_INNER - 20 + g * (BELT_OUTER - BELT_INNER + 40), z: (rng() - 0.5) * 16, b: rng() });
  }
  const BELT_PERIOD = 2600;

  // Münzen – verteilt zwischen den Planetenbahnen, nie auf einer Bahn
  const coins = (() => {
    const r = mulberry32(777);
    const list = [];
    let minGap = 46, tries = 0;
    while (list.length < COIN_TOTAL && tries < 20000) {
      tries++;
      if (tries % 4000 === 0) minGap -= 6;
      const rad = Math.sqrt(r()) * (SHIP_LIMIT - 12);
      const a = r() * TAU;
      if (rad < SUN.avoidR + 14) continue;
      let ok = true;
      for (const b of BODIES) {
        if (b.orbit && Math.abs(rad - b.orbit) < b.avoidR * 0.85 + 6) { ok = false; break; }
      }
      if (!ok) continue;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      for (const c of list) if (Math.hypot(c.x - x, c.y - y) < minGap) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: list.length, x, y, phase: r() * TAU, taken: false });
    }
    return list;
  })();

  // ----------------------------------------------------------------- state
  const ship = {
    x: -30, y: 152, heading: -0.6, speed: 0, bank: 0, turnVel: 0,
    mode: 'idle', goal: null, sides: new Map(),
    orbitBody: null, orbitAng: 0, orbitR: 0, orbitDir: 1,
  };
  const cam = { x: ship.x, y: ship.y };
  const particles = [];
  let time = 0;
  let marker = null; // {x, y, t}
  let rewardShown = false;

  const collected = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) for (const id of saved) if (coins[id]) { coins[id].taken = true; collected.add(id); }
  } catch (_) { /* privater Modus o.ä. – dann eben ohne Speichern */ }
  if (collected.size >= COIN_TOTAL) rewardShown = true;
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...collected])); } catch (_) { /* ignore */ }
  }

  // ---------------------------------------------------------------- canvas
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 320, H = 240, pxPerCss = 1;
  let nebula = null, stars = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw = window.innerWidth, ch = window.innerHeight;
    const shortDev = Math.min(cw, ch) * dpr;
    const s = Math.max(1, Math.round(shortDev / 300));
    W = Math.ceil((cw * dpr) / s);
    H = Math.ceil((ch * dpr) / s);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = (W * s) / dpr + 'px';
    canvas.style.height = (H * s) / dpr + 'px';
    pxPerCss = dpr / s;
    ctx.imageSmoothingEnabled = false;
    buildBackground();
  }

  function buildBackground() {
    // Nebel: nur minimale Parallaxe, daher ohne Kachelung
    const NW = W + 80, NH = H + 60;
    const cv = document.createElement('canvas');
    cv.width = NW; cv.height = NH;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(NW, NH);
    const base = hex('#04050d'), purple = hex('#2c1a52'), teal = hex('#0f3a4c');
    for (let j = 0; j < NH; j++) {
      for (let i = 0; i < NW; i++) {
        const n = fbm(i / 110, j / 110, 0.5, 7, 4);
        const m = fbm(i / 70 + 40, j / 70, 2.5, 13, 3);
        const a = smooth(0.48, 0.72, n);
        const q = Math.floor(a * 4 + BAYER[(j & 3) * 4 + (i & 3)]) / 4;
        const col = mix(base, mix(purple, teal, smooth(0.35, 0.65, m)), q * 0.55);
        const k = (j * NW + i) * 4;
        img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    nebula = cv;

    const r = mulberry32(4242);
    stars = [];
    const n = Math.round((W * H) / 520);
    const palette = ['#ffffff', '#cfe0ff', '#fff2d0', '#b8c8ff'];
    for (let i = 0; i < n; i++) {
      const layer = r() < 0.6 ? 0 : r() < 0.75 ? 1 : 2;
      stars.push({
        x: r() * W, y: r() * H, layer,
        p: [0.03, 0.07, 0.13][layer],
        b: [0.35, 0.6, 0.9][layer] * (0.6 + r() * 0.4),
        tw: 0.4 + r() * 1.6, ph: r() * TAU,
        col: palette[(r() * palette.length) | 0],
        big: layer === 2 && r() < 0.25,
      });
    }
  }

  const toSX = x => x - cam.x + W / 2;
  const toSY = (y, z = 0) => (y - cam.y) * SIN_E - z * COS_E + H / 2;
  const onScreen = (sx, sy, m) => sx > -m && sx < W + m && sy > -m && sy < H + m;

  // ----------------------------------------------------------------- input
  const hint = document.getElementById('hint');
  hint.textContent = TEXTS.hint;
  let hintGone = false;

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    const ix = e.clientX * pxPerCss, iy = e.clientY * pxPerCss;
    if (!hintGone) { hintGone = true; hint.classList.add('gone'); }

    // Treffer auf Himmelskörper (inkl. Monde -> Mutterplanet)
    let hit = null, best = Infinity;
    for (const b of BODIES) {
      const cands = [[b.x, b.y, b.r]];
      if (b.moons) for (const m of b.moons) cands.push([m.x, m.y, m.r + 2]);
      for (const [x, y, r] of cands) {
        const d = Math.hypot(ix - toSX(x), iy - toSY(y));
        if (d <= r + 5 && d < best) { best = d; hit = b; }
      }
    }
    if (hit) {
      flyToBody(hit);
    } else {
      let x = ix - W / 2 + cam.x;
      let y = (iy - H / 2) / SIN_E + cam.y;
      const rad = Math.hypot(x, y);
      if (rad > SHIP_LIMIT - 4) { x *= (SHIP_LIMIT - 4) / rad; y *= (SHIP_LIMIT - 4) / rad; }
      flyToPoint(x, y);
    }
  });

  function flyToPoint(x, y) {
    hideInfo();
    ship.mode = 'fly';
    ship.goal = { x, y };
    ship.sides.clear();
    marker = { x, y, t: 0 };
  }
  function flyToBody(b) {
    if (ship.mode === 'orbit' && ship.orbitBody === b) { showInfo(b); return; }
    hideInfo();
    ship.mode = 'fly';
    ship.goal = { body: b };
    ship.sides.clear();
    marker = null;
  }
  function enterOrbit(b) {
    ship.mode = 'orbit';
    ship.goal = null;
    ship.orbitBody = b;
    ship.orbitR = b.avoidR;
    ship.orbitAng = Math.atan2(ship.y - b.y, ship.x - b.x);
    const rx = ship.x - b.x, ry = ship.y - b.y;
    const cr = rx * Math.sin(ship.heading) - ry * Math.cos(ship.heading);
    ship.orbitDir = cr >= 0 ? 1 : -1;
    showInfo(b);
  }

  // ------------------------------------------------------------ ship logic
  function obstacles() {
    const list = [];
    for (const b of BODIES) list.push(b);
    return list;
  }

  /** Richtung zum Ziel; liegt ein Körper im Weg, wird tangential um ihn herum gesteuert. */
  function steer(px, py, tx, ty, exclude) {
    const dx = tx - px, dy = ty - py;
    const len = Math.hypot(dx, dy) || 1e-6;
    const ux = dx / len, uy = dy / len;
    let best = null, bestAlong = Infinity;
    for (const o of obstacles()) {
      if (o === exclude) continue;
      let R = o.avoidR;
      const tdist = Math.hypot(tx - o.x, ty - o.y);
      if (tdist < R) R = Math.max(o.coreR + 3, tdist - 2); // Ziel liegt nahe am Körper
      const cx = o.x - px, cy = o.y - py;
      const dist = Math.hypot(cx, cy);
      const along = cx * ux + cy * uy;
      if (dist >= R) {
        if (along <= 0) continue;
        const perp = Math.abs(cx * uy - cy * ux);
        if (perp >= R) continue;
        if (along - Math.sqrt(R * R - perp * perp) > len) continue;
      } else if (along <= 0) {
        continue; // wir fliegen ohnehin weg
      }
      if (along < bestAlong) { bestAlong = along; best = { o, R, cx, cy, dist }; }
    }
    for (const k of ship.sides.keys()) if (!best || k !== best.o) ship.sides.delete(k);
    if (!best) return Math.atan2(dy, dx);

    const { o, R, cx, cy, dist } = best;
    let side = ship.sides.get(o);
    if (side === undefined) {
      side = cx * dy - cy * dx >= 0 ? 1 : -1;
      ship.sides.set(o, side);
    }
    const a = Math.atan2(cy, cx);
    if (dist > R) return a + side * (Math.asin(Math.min(1, R / dist)) + 0.06);
    return a + side * (Math.PI / 2 + 0.8 * (R - dist) / R);
  }

  function turnTowards(target, rate, dt) {
    const diff = angDiff(ship.heading, target);
    const turn = clamp(diff, -rate * dt, rate * dt);
    ship.heading += turn;
    ship.turnVel = turn / Math.max(dt, 1e-4);
    return diff;
  }

  function updateShip(dt) {
    if (ship.mode === 'orbit') {
      const b = ship.orbitBody;
      ship.orbitAng += ship.orbitDir * (15 / ship.orbitR) * dt;
      const tx = b.x + Math.cos(ship.orbitAng) * ship.orbitR;
      const ty = b.y + Math.sin(ship.orbitAng) * ship.orbitR;
      const k = Math.min(1, dt * 2.5);
      ship.x += (tx - ship.x) * k;
      ship.y += (ty - ship.y) * k;
      turnTowards(ship.orbitAng + ship.orbitDir * Math.PI / 2, 2, dt);
      ship.speed += (15 - ship.speed) * Math.min(1, dt * 2);
    } else if (ship.mode === 'fly' && ship.goal) {
      const g = ship.goal;
      let tx, ty, arriveR, exclude = null;
      if (g.body) { tx = g.body.x; ty = g.body.y; arriveR = g.body.avoidR + 1; exclude = g.body; }
      else { tx = g.x; ty = g.y; arriveR = 2.5; }
      const dist = Math.hypot(tx - ship.x, ty - ship.y);
      if (dist <= arriveR) {
        if (g.body) enterOrbit(g.body);
        else { ship.mode = 'idle'; ship.goal = null; }
      } else {
        const want = steer(ship.x, ship.y, tx, ty, exclude);
        const diff = turnTowards(want, dist < 24 ? 6 : 3.2, dt);
        const remaining = dist - arriveR;
        const tgt = Math.min(SHIP_MAX_SPEED, 9 + remaining * 1.3) * Math.max(0.2, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
        ship.speed += (tgt - ship.speed) * Math.min(1, dt * 2.2);
        ship.x += Math.cos(ship.heading) * ship.speed * dt;
        ship.y += Math.sin(ship.heading) * ship.speed * dt;
      }
    } else {
      ship.speed *= Math.exp(-dt * 3);
      ship.turnVel *= Math.exp(-dt * 4);
      ship.x += Math.cos(ship.heading) * ship.speed * dt;
      ship.y += Math.sin(ship.heading) * ship.speed * dt;
    }

    // nie in einen Körper hinein, nie über den Gürtel hinaus
    for (const o of obstacles()) {
      const dx = ship.x - o.x, dy = ship.y - o.y, d = Math.hypot(dx, dy) || 1e-6;
      const min = o.coreR + 2;
      if (d < min) { ship.x = o.x + (dx / d) * min; ship.y = o.y + (dy / d) * min; }
    }
    const rad = Math.hypot(ship.x, ship.y);
    if (rad > SHIP_LIMIT) { ship.x *= SHIP_LIMIT / rad; ship.y *= SHIP_LIMIT / rad; }

    ship.bank += (clamp(ship.turnVel * 0.22, -0.55, 0.55) - ship.bank) * Math.min(1, dt * 5);

    // Triebwerks-Partikel
    if (ship.speed > 6 && particles.length < 400) {
      const n = ship.speed > 40 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const back = -6.5 * SHIP_SCALE;
        particles.push({
          x: ship.x + Math.cos(ship.heading) * back + (Math.random() - 0.5) * 1.5,
          y: ship.y + Math.sin(ship.heading) * back + (Math.random() - 0.5) * 1.5,
          z: 4 + 1.5 * SHIP_SCALE,
          vx: -Math.cos(ship.heading) * 12 + (Math.random() - 0.5) * 6,
          vy: -Math.sin(ship.heading) * 12 + (Math.random() - 0.5) * 6,
          vz: (Math.random() - 0.5) * 2,
          life: 0, max: 0.7 + Math.random() * 0.7, kind: 'trail',
        });
      }
    }
  }

  function updateCoins() {
    for (const c of coins) {
      if (c.taken) continue;
      if (Math.hypot(c.x - ship.x, c.y - ship.y) < 10) {
        c.taken = true;
        collected.add(c.id);
        save();
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU;
          particles.push({
            x: c.x, y: c.y, z: 5,
            vx: Math.cos(a) * 26, vy: Math.sin(a) * 26, vz: 6 + Math.random() * 10,
            life: 0, max: 0.6 + Math.random() * 0.4, kind: 'gold',
          });
        }
        updateHUD(true);
        if (collected.size >= COIN_TOTAL && !rewardShown) {
          rewardShown = true;
          setTimeout(showReward, 1200);
        }
      }
    }
  }

  function updateWorld(dt) {
    time += dt;
    for (const b of BODIES) {
      if (b.orbit) {
        const a = b.a0 + (time * TAU) / b.period;
        b.x = Math.cos(a) * b.orbit;
        b.y = Math.sin(a) * b.orbit;
      }
      b.rot = (time * TAU) / b.rotPeriod;
      b.cloudRot = b.rot * 1.3 + 1.7;
      if (b.moons) {
        for (const m of b.moons) {
          const a = m.a0 + (time * TAU) / m.period;
          m.x = b.x + Math.cos(a) * m.orbit;
          m.y = b.y + Math.sin(a) * m.orbit;
          m.rot = a; // gebundene Rotation
        }
      }
    }
    updateShip(dt);
    updateCoins();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }
      const drag = Math.exp(-dt * 2);
      p.vx *= drag; p.vy *= drag;
      if (p.kind === 'gold') p.vz -= 30 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    if (marker) marker.t += dt;

    // Kamera folgt sanft, mit leichtem Vorlauf
    const lead = ship.speed * 0.35;
    const tx = ship.x + Math.cos(ship.heading) * lead;
    const ty = ship.y + Math.sin(ship.heading) * lead;
    const k = 1 - Math.exp(-dt * 2.2);
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
  }

  // ---------------------------------------------------------------- render
  const ORBIT_DOTS = BODIES.filter(b => b.orbit).map(b => {
    const n = Math.round((b.orbit * TAU) / 6);
    return { b, pts: Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * b.orbit, Math.sin((i / n) * TAU) * b.orbit]) };
  });

  function drawBackground() {
    const ox = Math.round(-40 - clamp(cam.x * 0.03, -38, 38));
    const oy = Math.round(-30 - clamp(cam.y * SIN_E * 0.03, -28, 28));
    ctx.drawImage(nebula, ox, oy);
    for (const s of stars) {
      let x = (s.x - cam.x * s.p) % W; if (x < 0) x += W;
      let y = (s.y - cam.y * SIN_E * s.p) % H; if (y < 0) y += H;
      const tw = 0.65 + 0.35 * Math.sin(time * s.tw + s.ph);
      ctx.globalAlpha = s.b * tw;
      ctx.fillStyle = s.col;
      const xi = x | 0, yi = y | 0;
      ctx.fillRect(xi, yi, 1, 1);
      if (s.big && tw > 0.8) {
        ctx.globalAlpha = s.b * (tw - 0.6);
        ctx.fillRect(xi - 1, yi, 1, 1); ctx.fillRect(xi + 1, yi, 1, 1);
        ctx.fillRect(xi, yi - 1, 1, 1); ctx.fillRect(xi, yi + 1, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawOrbits() {
    ctx.fillStyle = '#8fa6ff';
    ctx.globalAlpha = 0.16;
    for (const o of ORBIT_DOTS) {
      for (const [x, y] of o.pts) {
        const sx = toSX(x), sy = toSY(y);
        if (sx >= 0 && sx < W && sy >= 0 && sy < H) ctx.fillRect(sx | 0, sy | 0, 1, 1);
      }
    }
    // Mondbahnen
    ctx.globalAlpha = 0.1;
    for (const b of BODIES) {
      if (!b.moons) continue;
      for (const m of b.moons) {
        const n = Math.round((m.orbit * TAU) / 5);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          const sx = toSX(b.x + Math.cos(a) * m.orbit), sy = toSY(b.y + Math.sin(a) * m.orbit);
          if (sx >= 0 && sx < W && sy >= 0 && sy < H) ctx.fillRect(sx | 0, sy | 0, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawDust() {
    const rotA = (time * TAU) / BELT_PERIOD;
    ctx.fillStyle = '#9a8f9e';
    for (const d of dust) {
      const a = d.a + rotA;
      const sx = toSX(Math.cos(a) * d.rad), sy = toSY(Math.sin(a) * d.rad, d.z);
      if (!onScreen(sx, sy, 2)) continue;
      ctx.globalAlpha = 0.12 + d.b * 0.22;
      ctx.fillRect(sx | 0, sy | 0, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawEllipseDots(cx, cy, r, n, color, alpha) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + time * 0.4;
      ctx.fillRect(Math.round(toSX(cx + Math.cos(a) * r)), Math.round(toSY(cy + Math.sin(a) * r)), 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawMarkers() {
    if (marker && ship.mode === 'fly' && ship.goal && !ship.goal.body) {
      const pulse = 5 + Math.sin(marker.t * 4) * 1.5;
      drawEllipseDots(marker.x, marker.y, pulse * 2, 12, '#9fd4ff', 0.75);
      ctx.fillStyle = '#e6f4ff';
      ctx.fillRect(Math.round(toSX(marker.x)), Math.round(toSY(marker.y)), 1, 1);
    }
    if (ship.mode === 'fly' && ship.goal && ship.goal.body) {
      const b = ship.goal.body;
      drawEllipseDots(b.x, b.y, b.avoidR, Math.round(b.avoidR * 0.9), '#9fd4ff', 0.55);
    }
  }

  function drawBody(b) {
    const sx = toSX(b.x), sy = toSY(b.y);
    if (!onScreen(sx, sy, b.spr.D)) return;
    renderSphere(b.spr, b.r, b, b.emissive ? [0, 0, 1] : bodyLight(b.x, b.y));
    ctx.drawImage(b.spr.cv, Math.round(sx - b.spr.D / 2), Math.round(sy - b.spr.D / 2));
  }

  function drawCoin(c) {
    const bob = Math.sin(time * 1.6 + c.phase) * 1.2;
    const sx = toSX(c.x), sy = toSY(c.y, 5 + bob);
    if (!onScreen(sx, sy, 8)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const spin = Math.cos(time * 2.2 + c.phase);
    const hw = Math.round(Math.abs(spin) * 3);
    for (let dy = -3; dy <= 3; dy++) {
      const row = Math.round(hw * Math.sqrt(Math.max(0, 1 - (dy / 3.6) ** 2)));
      ctx.fillStyle = dy === -3 || dy === 3 ? '#c98a1e' : '#f7c948';
      ctx.fillRect(x - row, y + dy, row * 2 + 1, 1);
    }
    if (hw >= 1) { ctx.fillStyle = '#b8741a'; ctx.fillRect(x + hw, y - 2, 1, 5); }
    if (hw >= 2) { ctx.fillStyle = '#fff1a8'; ctx.fillRect(x - hw + 1, y - 2, 1, 3); }
    if (hw >= 3) { ctx.fillStyle = '#d99a2b'; ctx.fillRect(x + 1, y - 1, 1, 3); }
    const sp = (time * 0.5 + c.phase) % 3;
    if (sp < 0.3) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1 - sp / 0.3;
      ctx.fillRect(x + 3, y - 5, 1, 3);
      ctx.fillRect(x + 2, y - 4, 3, 1);
      ctx.globalAlpha = 1;
    }
  }

  function drawFlame(sx, sy, eng) {
    const f = clamp(ship.speed / SHIP_MAX_SPEED, 0, 1);
    if (f < 0.04) return;
    const bx = -Math.cos(ship.heading), by = -Math.sin(ship.heading) * SIN_E;
    const bl = Math.hypot(bx, by) || 1;
    const len = 1 + f * 4 + Math.random() * 1.5;
    const cols = ['#fffbe0', '#ffd25a', '#ff9a3a', '#ff6a2a', '#c23a20', '#7a2418'];
    for (let i = 0; i < len; i++) {
      ctx.fillStyle = cols[Math.min(cols.length - 1, i)];
      ctx.fillRect(Math.round(sx + eng.ex + (bx / bl) * i), Math.round(sy + eng.ey + (by / bl) * i), 1, 1);
    }
  }

  function drawShip() {
    const bob = Math.sin(time * 1.8) * 0.8;
    const sx = toSX(ship.x), sy = toSY(ship.y, 4 + bob);
    const L = sunLight(ship.x, ship.y);
    const Ls = [L[0] * 0.7, L[1] * 0.7 - COS_E * 0.6, L[2] * 0.7 + SIN_E * 0.6]; // Sonne + etwas Licht von oben
    const ll = Math.hypot(...Ls);
    const eng = renderShip(ship.heading, ship.bank, Ls.map(v => v / ll));
    const flameBehind = Math.sin(ship.heading) > 0; // Schiff fliegt auf uns zu -> Flamme hinter dem Rumpf
    if (flameBehind) drawFlame(sx, sy, eng);
    ctx.drawImage(shipSpr.cv, Math.round(sx - SB / 2), Math.round(sy - SB / 2));
    if (!flameBehind) drawFlame(sx, sy, eng);
  }

  function drawParticles() {
    for (const p of particles) {
      const sx = toSX(p.x), sy = toSY(p.y, p.z);
      if (!onScreen(sx, sy, 2)) continue;
      const t = p.life / p.max;
      if (p.kind === 'gold') {
        ctx.fillStyle = t < 0.4 ? '#fff1a8' : '#f7c948';
        ctx.globalAlpha = 1 - t;
      } else {
        ctx.fillStyle = t < 0.2 ? '#ffe6a0' : t < 0.5 ? '#ff9a4a' : '#6a5aa8';
        ctx.globalAlpha = (1 - t) * 0.8;
      }
      ctx.fillRect(sx | 0, sy | 0, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  const drawList = [];
  function render() {
    drawBackground();
    drawOrbits();
    drawDust();

    // Sonnen-Glow
    const gs = sunGlow;
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(time * 0.8);
    ctx.drawImage(gs.cv, Math.round(toSX(0) - gs.R), Math.round(toSY(0) - gs.R));
    ctx.globalAlpha = 1;

    drawMarkers();
    drawParticles();

    // alles Räumliche nach Tiefe (Welt-y) sortiert zeichnen
    drawList.length = 0;
    for (const b of BODIES) {
      drawList.push({ y: b.y, k: 0, o: b });
      if (b.moons) for (const m of b.moons) drawList.push({ y: m.y, k: 1, o: m });
    }
    for (const c of coins) if (!c.taken) drawList.push({ y: c.y, k: 2, o: c });
    drawList.push({ y: ship.y, k: 3, o: ship });
    const rotA = (time * TAU) / BELT_PERIOD;
    for (const a of asteroids) {
      const ang = a.a + rotA;
      const x = Math.cos(ang) * a.rad, y = Math.sin(ang) * a.rad;
      const sx = toSX(x), sy = toSY(y, a.z);
      if (!onScreen(sx, sy, 8)) continue;
      drawList.push({ y, k: 4, o: a, sx, sy, ang });
    }
    drawList.sort((p, q) => p.y - q.y);

    for (const it of drawList) {
      switch (it.k) {
        case 0: drawBody(it.o); break;
        case 1: {
          const m = it.o;
          const sx = toSX(m.x), sy = toSY(m.y);
          if (!onScreen(sx, sy, 10)) break;
          renderSphere(m.spr, m.r, m, bodyLight(m.x, m.y));
          ctx.drawImage(m.spr.cv, Math.round(sx - m.spr.D / 2), Math.round(sy - m.spr.D / 2));
          break;
        }
        case 2: drawCoin(it.o); break;
        case 3: drawShip(); break;
        case 4: {
          const a = it.o;
          let k = Math.round((((it.ang + Math.PI) % TAU) / TAU) * 8) % 8;
          if (k < 0) k += 8;
          const spr = rocks[a.s - 1][a.v][k];
          ctx.drawImage(spr.cv, Math.round(it.sx - spr.D / 2), Math.round(it.sy - spr.D / 2));
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------------- UI
  const hud = document.getElementById('hud');
  const elCount = document.getElementById('coinCount');
  document.getElementById('coinTotal').textContent = COIN_TOTAL;
  function updateHUD(bump) {
    elCount.textContent = collected.size;
    hud.classList.toggle('complete', collected.size >= COIN_TOTAL);
    if (bump) { hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump'); }
  }
  hud.addEventListener('click', () => { if (collected.size >= COIN_TOTAL) showReward(); });

  const info = document.getElementById('info');
  function showInfo(b) {
    const t = TEXTS.bodies[b.id];
    if (!t) return;
    info.querySelector('.kicker').textContent = t.kicker || '';
    info.querySelector('.name').textContent = t.name || '';
    info.querySelector('.body').textContent = t.body || '';
    const dl = info.querySelector('.facts');
    dl.innerHTML = '';
    for (const [k, v] of t.facts || []) {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    }
    info.classList.add('show');
    hintGone = true; hint.classList.add('gone');
  }
  function hideInfo() { info.classList.remove('show'); }
  info.querySelector('.close').addEventListener('click', hideInfo);

  const reward = document.getElementById('reward');
  const coinSvg = document.querySelector('.coin-icon').outerHTML;
  reward.querySelector('.reward-coins').innerHTML = coinSvg + coinSvg + coinSvg;
  reward.querySelector('h2').textContent = TEXTS.reward.title;
  reward.querySelector('.body').textContent = TEXTS.reward.body;
  reward.querySelector('[data-action=continue]').textContent = TEXTS.reward.continue;
  reward.querySelector('[data-action=restart]').textContent = TEXTS.reward.restart;
  function showReward() { hideInfo(); reward.classList.add('show'); }
  function hideReward() { reward.classList.remove('show'); }
  reward.addEventListener('click', e => {
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (act === 'continue' || e.target === reward) hideReward();
    if (act === 'restart') {
      collected.clear();
      for (const c of coins) c.taken = false;
      rewardShown = false;
      save();
      updateHUD(true);
      hideReward();
    }
  });

  // ------------------------------------------------------------------ loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    updateWorld(dt);
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  updateHUD(false);
  updateWorld(0);
  requestAnimationFrame(frame);

  // kleine Debug-Schnittstelle (für Tests / Konsole)
  window.__space = { ship, coins, BODIES, collected, step: dt => updateWorld(dt), flyToPoint, flyToBody };
})();
