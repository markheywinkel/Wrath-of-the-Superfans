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

  const SHIP_LIMIT = 680;   // so weit darf das Schiff vom Zentrum weg
  const BELT_INNER = 708;
  const BELT_OUTER = 792;
  const COIN_TOTAL = 30;
  const CRATE_TOTAL = 10;
  const SHIP_MAX_SPEED = 78;
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
  let LIGHT2 = null; // Mittelpunkt der Doppelsonne im Urlaubssystem (wird später gesetzt)
  function sunLight(x, y) {
    let cx = 0, cy = 0;
    if (LIGHT2 && Math.hypot(x - LIGHT2.x, y - LIGHT2.y) < 1400) { cx = LIGHT2.x; cy = LIGHT2.y; }
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
    return camVec(-dx / d, -dy / d);
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
  function texDark(seed) {
    const f = norm01(forSphere((x, y, z) => fbm(x * 2.5, y * 2.5, z * 2.5, seed, 5)));
    const g = G([[0, '#08060e'], [0.5, '#1a1426'], [1, '#2e2440']]);
    const c = norm01(forSphere((x, y, z) => {
      const w = fbm(x * 2, y * 2, z * 2, seed + 3, 3) * 2;
      return fbm(x * 2 + w, y * 6, z * 2 - w, seed + 9, 5);
    }));
    const cloud = new Float32Array(c.length);
    for (let i = 0; i < c.length; i++) cloud[i] = smooth(0.45, 0.8, c[i]) * 0.32; // düstere Gewitterwolken
    return { tex: makeTex(i => grad(g, f[i])), cloud };
  }
  function texStar(seed, stops) {
    const f = norm01(forSphere((x, y, z) => fbm(x * 6, y * 6, z * 6, seed, 4)));
    const g = G(stops);
    return { tex: makeTex(i => grad(g, f[i])) };
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
  function makeSunGlow(r, color = '#ffb347') {
    const R = Math.round(r * 2.8);
    const D = R * 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = D;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(D, D);
    const col = hex(color);
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

  // ---------------------------------------------------------------- ships
  /*
   * Schiffsmodelle: Dreiecke im Modellraum (x = vorne, y = rechts, z = oben).
   * Jedes Schiff wird pro Frame mit Z-Buffer in ein kleines Sprite gerastert.
   */
  // Bumerang (Spieler): geschwungene V-Form, Strahl aus der Kerbe hinten
  const BOOMERANG = (() => {
    const V = [
      [6, 0, 1.0],      // 0 Nase
      [1.5, -5.5, 0.6], // 1 Vorderkante links
      [-6.5, -10, 0.1], // 2 Spitze links
      [-3.6, -6, 0.5],  // 3 Hinterkante links
      [-1.2, 0, 0.9],   // 4 Kerbe hinten (Triebwerk)
      [-3.6, 6, 0.5],   // 5 Hinterkante rechts
      [-6.5, 10, 0.1],  // 6 Spitze rechts
      [1.5, 5.5, 0.6],  // 7 Vorderkante rechts
      [1.2, 0, 2.3],    // 8 Grat oben
      [0, 0, -0.8],     // 9 Unterseite
      [3.4, 0, 1.95], [0.6, -1.2, 2.45], [0.6, 1.2, 2.45], [-0.2, 0, 2.75], // 10-13 Cockpit
    ];
    const F = [
      [8, 0, 1, 'hull'], [8, 1, 2, 'hull'], [8, 2, 3, 'accent'], [8, 3, 4, 'accent'],
      [8, 4, 5, 'accent'], [8, 5, 6, 'accent'], [8, 6, 7, 'hull'], [8, 7, 0, 'hull'],
      [9, 1, 0, 'under'], [9, 2, 1, 'under'], [9, 3, 2, 'under'], [9, 4, 3, 'under'],
      [9, 5, 4, 'under'], [9, 6, 5, 'under'], [9, 7, 6, 'under'], [9, 0, 7, 'under'],
      [10, 13, 11, 'glass'], [10, 12, 13, 'glass'],
    ];
    return { V, F, engine: 4, scale: 1.25 };
  })();

  // Pfeil (früheres Spielerschiff)
  const ARROW = {
    V: [
      [9, 0, 0.6], [-6, -7, 0], [-6, 7, 0], [-1, 0, 3], [-6, 0, 1.6], [-2, 0, -1.5],
      [4, 0, 2.05], [0.5, -1.3, 2.8], [0.5, 1.3, 2.8], [-1, 0, 3.35],
    ],
    F: [
      [0, 3, 1, 'hull'], [0, 2, 3, 'hull'], [3, 4, 1, 'accent'], [3, 2, 4, 'accent'],
      [0, 1, 5, 'under'], [0, 5, 2, 'under'], [1, 4, 5, 'under'], [4, 2, 5, 'under'],
      [6, 9, 7, 'glass'], [6, 8, 9, 'glass'],
    ],
    engine: 4, scale: 1.1,
  };

  // Untertasse
  const SAUCER = (() => {
    const V = [[0, 0, 1.8], [0, 0, -0.7], [0, 0, 3.3]]; // 0 oben, 1 unten, 2 Kuppelspitze
    const N = 10, rim = 3, dome = 3 + N;
    for (let i = 0; i < N; i++) { const a = (i / N) * TAU; V.push([Math.cos(a) * 6.5, Math.sin(a) * 6.5, 0.5]); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; V.push([Math.cos(a) * 2.3, Math.sin(a) * 2.3, 1.9]); }
    const F = [];
    for (let i = 0; i < N; i++) {
      const a = rim + i, b = rim + ((i + 1) % N);
      F.push([0, a, b, i % 2 ? 'accent' : 'hull']);
      F.push([1, b, a, 'under']);
    }
    for (let i = 0; i < 6; i++) F.push([2, dome + i, dome + ((i + 1) % 6), 'glass']);
    return { V, F, engine: rim + N / 2, scale: 1.1 };
  })();

  // Kreuzfahrtschiff: langer Rumpf, gestufte Decks, Schornstein
  const CRUISER = (() => {
    const V = [], F = [];
    const box = (x0, x1, y0, y1, z0, z1, top, side) => {
      const b = V.length;
      V.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      const q = (a, b2, c, d, col) => { F.push([b + a, b + b2, b + c, col], [b + a, b + c, b + d, col]); };
      q(4, 5, 6, 7, top); q(0, 1, 5, 4, side); q(1, 2, 6, 5, side); q(2, 3, 7, 6, side); q(3, 0, 4, 7, side); q(0, 1, 2, 3, 'under');
    };
    box(-12, 10, -4, 4, 0, 2.6, 'hull', 'hull');
    const b = V.length;
    V.push([10, -4, 0], [10, 4, 0], [15, 0, 0.4], [10, -4, 2.6], [10, 4, 2.6], [15, 0, 2.8]);
    F.push([b, b + 2, b + 3, 'hull'], [b + 2, b + 5, b + 3, 'hull'], [b + 1, b + 4, b + 2, 'hull'], [b + 2, b + 4, b + 5, 'hull'], [b + 3, b + 5, b + 4, 'hull'], [b, b + 1, b + 2, 'under']);
    box(-10, 7, -3, 3, 2.6, 4.4, 'accent', 'glass');
    box(-8, 4, -2.4, 2.4, 4.4, 6, 'hull', 'glass');
    box(-6.5, -3.5, -1, 1, 6, 8.4, 'accent', 'accent');
    const engine = V.push([-12.6, 0, 1.3]) - 1;
    return { V, F, engine, scale: 1.05 };
  })();

  const pal = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, hex(v)]));
  const OUTLINE = hex('#070914');

  function makeShipSprite() {
    const SB = 48;
    const cv = document.createElement('canvas');
    cv.width = cv.height = SB;
    const cx = cv.getContext('2d');
    return { SB, cv, cx, img: cx.createImageData(SB, SB), z: new Float32Array(SB * SB), mask: new Uint8Array(SB * SB) };
  }

  function renderModel(spr, model, colors, heading, bank, L) {
    const { SB, img, z, mask } = spr;
    const d = img.data;
    d.fill(0); z.fill(-1e9);
    const ch = Math.cos(heading), sh = Math.sin(heading), cb = Math.cos(bank), sb = Math.sin(bank);
    const S = model.scale;
    const P = model.V.map(([x, y, zz]) => {
      const y1 = y * cb - zz * sb, z1 = y * sb + zz * cb;
      const xw = (x * ch - y1 * sh) * S, yw = (x * sh + y1 * ch) * S, zw = z1 * S;
      return [SB / 2 + xw, SB / 2 + SIN_E * yw - COS_E * zw, COS_E * yw + SIN_E * zw, xw, yw, zw];
    });
    const edge = (a, b, px, py) => (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    for (const [ia, ib, ic, cname] of model.F) {
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
      const col = colors[cname];
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
    spr.cx.putImageData(img, 0, 0);
    const e = P[model.engine];
    return { ex: e[0] - SB / 2, ey: e[1] - SB / 2, back: model.V[model.engine][0] * S };
  }

  // ----------------------------------------------------------------- world
  const rng = mulberry32(20261102);
  const BODIES = [
    { id: 'sun', r: 24, orbit: 0, period: 1, rotPeriod: 160, emissive: true, tex: texSun(3) },
    { id: 'ignis', r: 9, orbit: 115, rotPeriod: -120, tex: texEmber(11), atmo: hex('#ffb070') },
    {
      id: 'aqua', r: 11, orbit: 190, rotPeriod: 70, atmo: hex('#8ec6ff'),
      tex: texTerra(21, {
        seaQ: 0.6, cloudQ: 0.62, polar: 1.2,
        ocean: [[0, '#0f2c66'], [0.6, '#1b4ea3'], [0.92, '#2f7fd6'], [1, '#58a6e8']],
        land: [[0, '#d8c88a'], [0.06, '#6aa84f'], [0.35, '#3f7f3a'], [0.65, '#7f8a4e'], [0.85, '#8f735a'], [1, '#e6e6e6']],
      }),
    },
    {
      id: 'thalassa', r: 10, orbit: 265, rotPeriod: 85, atmo: hex('#9fe6ff'),
      tex: texTerra(37, {
        seaQ: 0.78, cloudQ: 0.52, polar: 1.28,
        ocean: [[0, '#0e3f63'], [0.6, '#16679a'], [0.9, '#2aa0c4'], [1, '#6fd3e0']],
        land: [[0, '#efe0a8'], [0.1, '#9cc76a'], [0.5, '#5aa05a'], [1, '#c9b98a']],
      }),
    },
    {
      id: 'gigas', r: 22, orbit: 430, rotPeriod: 45, tex: texGigas(53),
      moons: [
        { r: 3, orbit: 34, period: 26, tex: texMoon(61, [[0, '#5e5e68'], [0.5, '#9a9aa4'], [1, '#d4d4dc']]) },
        { r: 4, orbit: 45, period: 41, tex: texMoon(67, [[0, '#6a3a2c'], [0.5, '#a8705a'], [1, '#e0b090']]) },
        { r: 3, orbit: 56, period: 60, tex: texMoon(71, [[0, '#7890a4'], [0.5, '#bccfdc'], [1, '#f0f6fa']]) },
      ],
    },
    { id: 'glacies', r: 8, orbit: 555, rotPeriod: -95, tex: texGlacies(83), atmo: hex('#d8f4ff') },
    // im Nebel-Gebiet außerhalb des Sonnensystems (feste Position, siehe ZONE)
    { id: 'dark', zone: true, r: 16, orbit: 0, rotPeriod: 240, tex: texDark(97), atmo: hex('#5a4a8a') },
    // Kapitel 3: Urlaubssystem hinter dem Wurmloch (Doppelsonne, drei riesige Planeten)
    { id: 'aurel', resort: true, binary: 1, r: 18, orbit: 0, rotPeriod: 120, emissive: true, tex: texSun(5) },
    { id: 'azur', resort: true, binary: -1, r: 13, orbit: 0, rotPeriod: -90, emissive: true, tex: texStar(7, [[0, '#3a6aff'], [0.45, '#6aa0ff'], [0.75, '#b8d8ff'], [1, '#f0f8ff']]) },
    {
      id: 'monos', resort: true, r: 26, orbit: 250, rotPeriod: 90, atmo: hex('#9ff0ff'),
      tex: texTerra(111, {
        seaQ: 0.55, cloudQ: 0.72, polar: 1.45,
        ocean: [[0, '#0e5a7a'], [0.6, '#1a9ac0'], [0.9, '#5ad8e8'], [1, '#a8f0f0']],
        land: [[0, '#f4e4b0'], [0.12, '#7ad070'], [0.5, '#3a9a50'], [1, '#c8d890']],
      }),
    },
    {
      id: 'qratos', resort: true, r: 30, orbit: 440, rotPeriod: 110, atmo: hex('#b8fff0'),
      tex: texTerra(127, {
        seaQ: 0.5, cloudQ: 0.76, polar: 1.45,
        ocean: [[0, '#0a4a5a'], [0.5, '#1aa0a8'], [0.85, '#5ae0d0'], [1, '#b8fff0']],
        land: [[0, '#fff0c0'], [0.2, '#9ae070'], [1, '#4aa060']],
      }),
    },
    {
      id: 'stypos', resort: true, r: 24, orbit: 640, rotPeriod: -80, atmo: hex('#d0f0ff'),
      tex: texTerra(139, {
        seaQ: 0.62, cloudQ: 0.74, polar: 1.45,
        ocean: [[0, '#103a8a'], [0.6, '#2a6ad0'], [0.9, '#6ab0f0'], [1, '#d0f0ff']],
        land: [[0, '#fff4d0'], [0.25, '#f0d890'], [0.6, '#d8b870'], [1, '#a8c870']],
      }),
    },
  ];
  const keplerPeriod = orbit => 95 * Math.pow(orbit / 115, 1.5); // sehr gemächlich
  // Startwinkel: die fünf Planeten gleichmäßig verteilt (72° Abstand)
  const PLANET_START = Math.PI / 2 + TAU / 10;
  BODIES.forEach((b, i) => {
    if (b.orbit > 0) b.period = keplerPeriod(b.orbit);
    b.a0 = i === 0 ? 0 : PLANET_START + (i - 1) * (TAU / 5);
    b.x = 0; b.y = 0; b.rot = 0;
    b.spr = makeSprite(b.r, b.atmo ? 3 : 2);
    if (b.moons) {
      b.avoidR = Math.max(...b.moons.map(m => m.orbit + m.r)) + 12;
      b.coreR = b.avoidR - 8;
      b.moons.forEach((m, k) => { m.a0 = (k / b.moons.length) * TAU; m.x = 0; m.y = 0; m.rot = 0; m.spr = makeSprite(m.r, 1); m.parent = b; });
    } else {
      b.avoidR = Math.round(b.r * 1.5 + 12);
      b.coreR = b.r + 3;
    }
  });
  const SUN = BODIES[0];
  const sunGlow = makeSunGlow(SUN.r);
  // Urlaubssystem: weit weg vom Sonnensystem, nur durch das Wurmloch erreichbar
  const RESORT = { x: 0, y: 3400, r: 780 };
  LIGHT2 = RESORT;
  for (const b of BODIES) if (b.resort) { b.cx = RESORT.x; b.cy = RESORT.y; }
  for (const [id, a] of [['monos', 0.3], ['qratos', 2.4], ['stypos', 4.4]]) BODIES.find(b => b.id === id).a0 = a;
  const resortGlows = { aurel: makeSunGlow(18, '#ffc86a'), azur: makeSunGlow(13, '#8ab8ff') };
  // Wurmloch: öffnet sich zu Beginn von Kapitel 3 dort, wo man gerade ist; Gegenstück im Urlaubssystem
  const WH = { open: false, t: 0, cool: 0, a: { x: 0, y: 0 }, b: { x: RESORT.x - 260, y: RESORT.y + 700 } };
  const rocks = makeRocks();

  // Raumstationen: eine hinter den bewohnbaren Planeten, eine ganz außen
  const STATIONS = [
    { id: 'inner', station: true, type: 'spindle', orbit: 335, size: 13, hub: 6, coreR: 18, avoidR: 30, a0: 0.3 },
    { id: 'outer', station: true, type: 'ring', orbit: 628, size: 18, hub: 5, coreR: 27, avoidR: 38, a0: PLANET_START + 2.5 * (TAU / 5) },
  ];
  for (const st of STATIONS) {
    st.period = keplerPeriod(st.orbit);
    st.x = 0; st.y = 0; st.rot = 0;
    st.tex = texMoon(st.orbit, [[0, '#56607a'], [0.5, '#9aa4bc'], [1, '#e2e8f4']]);
    st.spr = makeSprite(st.hub, 1);
  }
  // ---------------------------------------------------------- neues Gebiet
  // oben rechts führt ein Korridor aus dem Sonnensystem in ein rundes Nebel-Gebiet (Viertel der Fläche)
  const GATE_ANG = -Math.PI / 4;                      // oben rechts
  const GATE_UX = Math.cos(GATE_ANG), GATE_UY = Math.sin(GATE_ANG);
  const GATE_HALF = 120;                              // halbe Breite des Übergangs
  const ZONE_R = 600;
  const ZONE_D = SHIP_LIMIT + 10 + ZONE_R;            // schließt fast nahtlos an den Rand des Systems an
  const ZONE = { x: GATE_UX * ZONE_D, y: GATE_UY * ZONE_D, r: ZONE_R, d1: ZONE_R + 520 };
  const GATE_HALF_ANG = (GATE_HALF + 22) / 750;       // Winkelbreite der Lücke im Gürtel
  const inGate = ang => Math.abs(angDiff(ang, GATE_ANG)) < GATE_HALF_ANG;

  /** Nächster erlaubter Punkt: Sonnensystem, Korridor oder neues Gebiet. */
  function projectAllowed(x, y, m = 0) {
    const dr = Math.hypot(x - RESORT.x, y - RESORT.y);
    if (dr < RESORT.r + 900) {   // im Urlaubssystem: eigene, kreisförmige Grenze
      if (dr <= RESORT.r - m) return [x, y];
      return [RESORT.x + (x - RESORT.x) * (RESORT.r - m) / dr, RESORT.y + (y - RESORT.y) * (RESORT.r - m) / dr];
    }
    const r = Math.hypot(x, y);
    if (r <= SHIP_LIMIT - m) return [x, y];
    const dz = Math.hypot(x - ZONE.x, y - ZONE.y);
    if (dz <= ZONE.r - m) return [x, y];
    const along = x * GATE_UX + y * GATE_UY, perp = -x * GATE_UY + y * GATE_UX;
    const a0 = SHIP_LIMIT - 40, a1 = ZONE_D;
    if (along >= a0 && along <= a1 && Math.abs(perp) <= GATE_HALF - m) return [x, y];
    const cands = [
      [x * (SHIP_LIMIT - m) / r, y * (SHIP_LIMIT - m) / r],
      [ZONE.x + (x - ZONE.x) * (ZONE.r - m) / dz, ZONE.y + (y - ZONE.y) * (ZONE.r - m) / dz],
    ];
    const ca = clamp(along, a0, a1), cp = clamp(perp, -(GATE_HALF - m), GATE_HALF - m);
    cands.push([ca * GATE_UX - cp * GATE_UY, ca * GATE_UY + cp * GATE_UX]);
    let best = cands[0], bd = Infinity;
    for (const c of cands) { const d = Math.hypot(c[0] - x, c[1] - y); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  /** Liegt ein Punkt im Sonnensystem, im neuen Gebiet oder im Korridor dazwischen? */
  function regionOf(x, y) {
    if (Math.hypot(x - RESORT.x, y - RESORT.y) <= RESORT.r + 900) return 'resort';
    if (Math.hypot(x, y) <= SHIP_LIMIT + 2) return 'sys';
    if (Math.hypot(x - ZONE.x, y - ZONE.y) <= ZONE.r + 2) return 'zone';
    return 'gate';
  }
  /** Zwischenziele, damit das Schiff durch die Lücke im Gürtel fliegt statt am Rand hängen zu bleiben. */
  function routeBetween(fx, fy, tx, ty) {
    const G1 = [GATE_UX * (SHIP_LIMIT - 70), GATE_UY * (SHIP_LIMIT - 70)];
    const G2 = [GATE_UX * (ZONE_D - ZONE_R + 40), GATE_UY * (ZONE_D - ZONE_R + 40)];
    const a = regionOf(fx, fy), b = regionOf(tx, ty);
    if (a === b || a === 'resort' || b === 'resort') return [];
    if (a === 'sys') return b === 'zone' ? [G1, G2] : [G1];
    if (a === 'zone') return b === 'sys' ? [G2, G1] : [G2];
    return b === 'sys' ? [G1] : [G2];
  }

  const DARK = BODIES.find(b => b.id === 'dark');
  // Lage im Nebel: entlang = vom Eingang weg in die Tiefe, quer = seitlich
  const inZone = (along, across) => ({ x: ZONE.x + GATE_UX * along - GATE_UY * across, y: ZONE.y + GATE_UY * along + GATE_UX * across });
  Object.assign(DARK, inZone(250, 200));
  const WRECK = Object.assign({ id: 'wreck', zone: true, fixed: true, avoidR: 54, coreR: 40, size: 40 }, inZone(40, -150));

  const OBSTACLES = [...BODIES, ...STATIONS, WRECK];
  const DESTINATIONS = [...BODIES.slice(1), ...STATIONS].filter(d => !d.zone && !d.resort);
  // Wegpunkte, zwischen denen Gwynn und Justus später im Gebiet umherfliegen
  const ZONE_DESTS = [DARK, WRECK,
    Object.assign({ id: 'wp1', avoidR: 14, coreR: 0 }, inZone(-280, 60)),
    Object.assign({ id: 'wp2', avoidR: 14, coreR: 0 }, inZone(120, 330)),
    Object.assign({ id: 'wp3', avoidR: 14, coreR: 0 }, inZone(330, -260))];

  // fünf Schiffsteile des einsamen Reisenden, verstreut im Gebiet
  const PART_TOTAL = 5;
  const zoneParts = (() => {
    const r = mulberry32(5150), list = [];
    let tries = 0;
    while (list.length < PART_TOTAL && tries++ < 5000) {
      const a = r() * TAU, d = 60 + Math.sqrt(r()) * (ZONE.r - 110);
      const x = ZONE.x + Math.cos(a) * d, y = ZONE.y + Math.sin(a) * d;
      if (Math.hypot(x - DARK.x, y - DARK.y) < 80 || Math.hypot(x - WRECK.x, y - WRECK.y) < 90) continue;
      if (list.some(p => Math.hypot(p.x - x, p.y - y) < 120)) continue;
      list.push({ id: list.length, x, y, phase: r() * TAU, v: (r() * 3) | 0, taken: false, active: false });
    }
    return list;
  })();

  // Das Gebiet ist ein grüner Nebel: Schwaden in Moos-, Smaragd- und Giftgrün füllen es ganz aus
  const FOG_PALETTES = [['#3f8a5a', '#163626'], ['#2a8a7a', '#103a32'], ['#7aa83a', '#26381a']];
  const fogSprites = FOG_PALETTES.map(([c1h, c2h]) => [18, 26, 36].map(R => {
    const D = R * 2, cv = document.createElement('canvas');
    cv.width = cv.height = D;
    const cx = cv.getContext('2d'), img = cx.createImageData(D, D);
    const c1 = hex(c1h), c2 = hex(c2h);
    for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) {
      const d = Math.hypot(i + 0.5 - R, j + 0.5 - R) / R;
      if (d >= 1) continue;
      const a = (1 - d) * (1 - d);
      const q = Math.floor(a * 5 + BAYER[(j & 3) * 4 + (i & 3)]) / 5;
      if (q <= 0) continue;
      const col = mix(c2, c1, 1 - d);
      const k = (j * D + i) * 4;
      img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = Math.min(255, q * 255);
    }
    cx.putImageData(img, 0, 0);
    return { cv, R };
  }));
  const fogBack = [], fogFront = [];
  {
    const r = mulberry32(31337);
    for (let gy = -ZONE.r - 30; gy <= ZONE.r + 30; gy += 44) {
      for (let gx = -ZONE.r - 30; gx <= ZONE.r + 30; gx += 44) {
        const x = ZONE.x + gx + (r() - 0.5) * 30, y = ZONE.y + gy + (r() - 0.5) * 30;
        if (Math.hypot(x - ZONE.x, y - ZONE.y) > ZONE.r + 10) continue;
        const p = Math.min(2, Math.floor(vnoise(x / 170, y / 170, 3, 21) * 3));
        const fade = clamp((ZONE.r + 10 - Math.hypot(x - ZONE.x, y - ZONE.y)) / 120, 0.18, 1);
        fogBack.push({ x, y, p, s: 1 + ((r() * 2) | 0), ph: r() * TAU, dx: 0, dy: 0, fade });
        if (r() < 0.12) fogFront.push({ x: x + 10, y: y - 10, p, s: 2, ph: r() * TAU, dx: 0, dy: 0, fade });
      }
    }
    // ein paar zarte Schwaden im Übergang, damit der Nebel allmählich beginnt
    for (let t = SHIP_LIMIT - 30; t <= ZONE_D - ZONE.r + 40; t += 22) {
      for (let k = 0; k < 4; k++) {
        const off = (r() * 2 - 1) * (GATE_HALF + 30);
        const x = GATE_UX * t - GATE_UY * off, y = GATE_UY * t + GATE_UX * off;
        fogBack.push({ x, y, p: (r() * 3) | 0, s: (r() * 2) | 0, ph: r() * TAU, dx: 0, dy: 0, fade: 0.12 + r() * 0.12 });
      }
    }
  }

  // altes Raumschiffwrack: einmal vorgezeichnet
  const wreckSprite = (() => {
    const Wd = 104, Ht = 52, cv = document.createElement('canvas');
    cv.width = Wd; cv.height = Ht;
    const c = cv.getContext('2d');
    const P = (x, y, col, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const out = '#0c0a12';
    // vorderes Rumpfstück
    P(6, 18, out, 48, 16); P(2, 22, out, 6, 8);
    P(7, 19, '#8a8f9e', 46, 14); P(3, 23, '#7a7f8e', 5, 6);
    P(7, 19, '#b4b8c4', 46, 3); P(7, 29, '#5a5e6c', 46, 4);
    for (let x = 12; x < 50; x += 6) P(x, 24, '#1a1c26', 3, 2);
    P(24, 24, '#e8c86a', 1, 1); P(42, 24, '#7fe0ff', 1, 1);
    P(16, 27, '#8a5a3a', 6, 2); P(36, 21, '#8a5a3a', 4, 2);
    P(30, 12, out, 10, 8); P(31, 13, '#9aa0ae', 8, 6); P(31, 13, '#c4c8d2', 8, 2);   // Brückenturm
    // Bruchkante mit Spanten
    for (let y = 19; y < 33; y += 3) P(53, y, '#4a4e5a', 3, 1);
    // hinteres Rumpfstück, leicht versetzt
    P(60, 22, out, 36, 18); P(61, 23, '#7e8392', 34, 16); P(61, 23, '#a8adb9', 34, 3); P(61, 35, '#50545f', 34, 4);
    for (let y = 25; y < 37; y += 5) P(95, y, '#2a2c36', 6, 3);                     // Triebwerke
    P(70, 28, '#8a5a3a', 8, 2); P(84, 26, '#1a1c26', 3, 2);
    for (let x = 58; x < 62; x++) P(x, 24 + (x % 2) * 8, '#4a4e5a', 1, 6);
    P(72, 8, out, 6, 15); P(73, 9, '#8a8f9e', 4, 13);                                 // abgeknickte Flosse
    // Trümmer
    P(50, 40, '#6a6e7a', 3, 2); P(46, 10, '#6a6e7a', 2, 2); P(98, 14, '#6a6e7a', 2, 3); P(20, 40, '#5a5e6c', 4, 2);
    // Schäden: ausgefranste Kanten, Löcher, Brandspuren, Rost, Kabel, mehr Trümmer
    const C = (x, y, w = 1, h = 1) => c.clearRect(x, y, w, h);
    C(26, 19, 3, 2); C(47, 31, 4, 2); C(18, 32, 2, 1); C(66, 22, 4, 2); C(90, 37, 3, 2); C(80, 22, 2, 1); C(36, 12, 2, 2);
    P(10, 27, '#2a1a14', 9, 3); P(12, 26, '#3a2418', 5, 1); P(63, 33, '#2a1a14', 11, 3); P(40, 29, '#3a2418', 6, 2); P(84, 23, '#2a1a14', 6, 2);
    for (const [x, y, w, h] of [[20, 22, 3, 3], [46, 26, 4, 2], [77, 25, 3, 4], [88, 31, 2, 3], [33, 30, 2, 2], [64, 27, 2, 2]]) {
      P(x - 1, y - 1, '#3a3e48', w + 2, h + 2); P(x, y, '#05040a', w, h);
    }
    for (const [x, y, h] of [[29, 25, 4], [43, 22, 3], [70, 30, 5], [86, 34, 4], [15, 23, 3]]) P(x, y, '#8a4a2a', 1, h);
    P(24, 20, '#6a5040', 6, 1); P(62, 24, '#6a5040', 8, 1);
    for (let y = 22; y < 40; y += 3) P(58, y, '#4a4e5a', 2, 1);
    P(53, 33, '#c8a040'); P(54, 34, '#c8a040'); P(55, 36, '#c8a040'); P(55, 37, '#a87a30'); P(56, 39, '#a87a30');
    P(57, 44, '#5a5e6c', 2, 2); P(84, 46, '#4a4e5a', 3, 1); P(12, 12, '#6a6e7a', 2, 1); P(100, 42, '#5a5e6c', 2, 2); P(30, 46, '#4a4e5a', 2, 1); P(64, 6, '#6a6e7a', 1, 2);
    return { cv, Wd, Ht };
  })();

  // Asteroidengürtel: nur ein Bogen über 20 % des Umfangs (unten links), an den Enden ausgedünnt
  const BELT_ARC_C = Math.PI * 0.75, BELT_ARC_HALF = Math.PI * 0.2;
  const arcAngle = () => {
    for (;;) {
      const u = rng() * 2 - 1;
      if (rng() < 1 - Math.pow(Math.abs(u), 4)) return BELT_ARC_C + u * BELT_ARC_HALF;
    }
  };
  const asteroids = [];
  for (let i = 0; i < 170; i++) {
    const g = (rng() + rng() + rng()) / 3; // dichter in der Mitte
    const roll = rng();
    asteroids.push({
      a: arcAngle(),
      rad: BELT_INNER + g * (BELT_OUTER - BELT_INNER),
      z: (rng() - 0.5) * 12,
      s: roll < 0.45 ? 1 : roll < 0.78 ? 2 : roll < 0.94 ? 3 : 4,
      v: (rng() * 4) | 0,
    });
  }
  const dust = [];
  for (let i = 0; i < 220; i++) {
    const g = (rng() + rng()) / 2;
    dust.push({ a: arcAngle(), rad: BELT_INNER - 20 + g * (BELT_OUTER - BELT_INNER + 40), z: (rng() - 0.5) * 16, b: rng() });
  }
  {
    const C = -Math.PI / 2, HALF = Math.PI / 3;   // 120° = ein Drittel
    const arc = () => { for (;;) { const u = rng() * 2 - 1; if (rng() < 1 - Math.pow(Math.abs(u), 4)) return C + u * HALF; } };
    for (let i = 0; i < 260; i++) {
      const g = (rng() + rng() + rng()) / 3, roll = rng();
      asteroids.push({ res: true, a: arc(), rad: RESORT.r + 30 + g * 80, z: (rng() - 0.5) * 12,
        s: roll < 0.45 ? 1 : roll < 0.78 ? 2 : roll < 0.94 ? 3 : 4, v: (rng() * 4) | 0 });
    }
    for (let i = 0; i < 300; i++) {
      const g = (rng() + rng()) / 2;
      dust.push({ res: true, a: arc(), rad: RESORT.r + 10 + g * 120, z: (rng() - 0.5) * 16, b: rng() });
    }
  }
  const BELT_PERIOD = 2600;

  // Münzen und Container – verteilt zwischen den Bahnen, nie auf einer Bahn
  function scatter(count, seed, gap, avoid, minRad) {
    const r = mulberry32(seed);
    const list = [];
    let minGap = gap, tries = 0;
    while (list.length < count && tries < 30000) {
      tries++;
      if (tries % 5000 === 0) minGap -= 6;
      const rad = Math.sqrt(r()) * (SHIP_LIMIT - 85); // Abstand zum Rand des Systems
      const a = r() * TAU;
      if (rad < Math.max(SUN.avoidR + 14, minRad)) continue;
      let ok = true;
      for (const b of OBSTACLES) {
        if (b.orbit && !b.resort && Math.abs(rad - b.orbit) < b.avoidR * 0.85 + 6) { ok = false; break; }
      }
      if (!ok) continue;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      for (const c of list) if (Math.hypot(c.x - x, c.y - y) < minGap) { ok = false; break; }
      for (const c of avoid) if (Math.hypot(c.x - x, c.y - y) < 26) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: list.length, x, y, phase: r() * TAU, taken: false });
    }
    return list;
  }
  const coins = scatter(COIN_TOTAL, 777, 48, [], 0);
  // verlorene Frachtcontainer: eher weiter draußen, weit auseinander
  const crates = scatter(CRATE_TOTAL, 4711, 150, coins, 150);
  // zweite Runde: fünf Relikte einer untergegangenen Zivilisation
  const RELIC_TOTAL = 5;
  const relics = scatter(RELIC_TOTAL, 9001, 170, coins.concat(crates), 120);

  // Kapitel 3: zehn Frachtcontainer im Urlaubssystem (zwischen den Bahnen, weit auseinander)
  const RES_CRATE_TOTAL = 10;
  const resortCrates = (() => {
    const r = mulberry32(8080), list = [], RB = BODIES.filter(b => b.resort && b.orbit);
    let gap = 160, tries = 0;
    while (list.length < RES_CRATE_TOTAL && tries++ < 30000) {
      if (tries % 5000 === 0) gap -= 10;
      const rad = 140 + Math.sqrt(r()) * (RESORT.r - 220), a = r() * TAU;
      if (RB.some(b => Math.abs(rad - b.orbit) < b.avoidR * 0.85 + 8)) continue;
      const x = RESORT.x + Math.cos(a) * rad, y = RESORT.y + Math.sin(a) * rad;
      if (list.some(c => Math.hypot(c.x - x, c.y - y) < gap) || Math.hypot(x - WH.b.x, y - WH.b.y) < 70) continue;
      list.push({ id: list.length, x, y, phase: r() * TAU, taken: false, res: true });
    }
    return list;
  })();
  let resCratesTaken = 0;
  // Kapitel 3: drei Alien-Relikte – im Nebel, im Sonnensystem, im Urlaubssystem
  const ALIEN_TOTAL = 3;
  const alienRelics = [
    Object.assign({ id: 0 }, inZone(-150, 330)),
    { id: 1, x: Math.cos(2.6) * 515, y: Math.sin(2.6) * 515 },
    { id: 2, x: RESORT.x - 470, y: RESORT.y - 275 },
  ].map(o => Object.assign(o, { phase: o.id * 2.1, active: false, taken: false }));
  let aliensFound = 0;

  // zweite Runde: fünf Kometen auf langen Ellipsenbahnen um die Sonne, schneller als das Schiff im Standardflug
  const COMET_TOTAL = 5;
  const comets = [
    { a: 380, e: 0.70, w: 0.4, v: 68 },
    { a: 330, e: 0.60, w: 2.1, v: 72 },
    { a: 360, e: 0.72, w: 3.6, v: 76 },
    { a: 300, e: 0.50, w: 5.0, v: 80 },
    { a: 410, e: 0.58, w: 1.2, v: 84 },
  ].map((c, i) => Object.assign(c, { id: i, b: c.a * Math.sqrt(1 - c.e * c.e), E: i * 1.3 + 0.5, x: 0, y: 0, vx: 0, vy: 0, active: false, caught: false }));
  // Kapitel 3: zwei sehr schnelle Kometen um die Doppelsonne, jeder bringt +10 % Geschwindigkeit
  const fastComets = [
    { a: 440, e: 0.60, w: 0.7, v: 160 },
    { a: 520, e: 0.40, w: 3.9, v: 185 },
  ].map((c, i) => Object.assign(c, { id: 10 + i, fast: true, cx: RESORT.x, cy: RESORT.y, b: c.a * Math.sqrt(1 - c.e * c.e), E: i * 2.5, x: 0, y: 0, vx: 0, vy: 0, active: true, caught: false }));
  const allComets = comets.concat(fastComets);
  function cometPos(c, E) {
    const px = c.a * (Math.cos(E) - c.e), py = c.b * Math.sin(E); // Sonne im Brennpunkt
    const cw = Math.cos(c.w), sw = Math.sin(c.w);
    return [(c.cx || 0) + px * cw - py * sw, (c.cy || 0) + px * sw + py * cw];
  }
  for (const c of allComets) [c.x, c.y] = cometPos(c, c.E);

  // ----------------------------------------------------------------- state
  const makeAgent = (o) => Object.assign({
    x: 0, y: 0, heading: 0, speed: 0, bank: 0, turnVel: 0, sides: new Map(),
    orbitBody: null, orbitAng: 0, orbitR: 0, orbitDir: 1,
  }, o);

  const ship = makeAgent({
    x: 0, y: 150, heading: -Math.PI / 2,
    mode: 'idle', goal: null, drift: null,
    model: BOOMERANG,
    colors: pal({ hull: '#eef1f8', accent: '#f08a4b', under: '#566381', glass: '#5fd3ff' }),
    spr: makeShipSprite(),
    beam: ['#ffffff', '#d8f4ff', '#9fe0ff', '#62b8ff', '#3a8cff', '#2a62e0', '#1f44b0', '#18307e'],
    trail: ['#d8f4ff', '#62b8ff', '#2f4fb0'],
    beamLen: 18,
  });

  /** Belohnung der Alien-Relikte: das Schiff wird golden */
  function makeGolden() {
    ship.colors = pal({ hull: '#ffd86a', accent: '#fff4c8', under: '#8a6420', glass: '#fffbe8' });
    ship.beam = ['#ffffff', '#fff6d0', '#ffe48a', '#ffd04a', '#f0b632', '#d0901a', '#a86a10', '#6a4008'];
    ship.trail = ['#fff6d0', '#ffd04a', '#a86a10'];
  }

  const NPC_LOOK = [
    { model: ARROW, colors: pal({ hull: '#ffe08a', accent: '#8a6cff', under: '#6b5a3a', glass: '#9fffe0' }) },
    { model: SAUCER, colors: pal({ hull: '#ffb3d1', accent: '#ffffff', under: '#7a4a66', glass: '#a8f0ff' }) },
    { model: ARROW, colors: pal({ hull: '#9fe8a8', accent: '#2f8a6a', under: '#3a5a4a', glass: '#ffe9a8' }) },
  ];
  const NPC_START = ['aqua', 'gigas', 'thalassa'];
  const npcs = TEXTS.ships.map((t, i) => {
    const look = NPC_LOOK[i % NPC_LOOK.length];
    const start = DESTINATIONS.find(d => d.id === NPC_START[i]) || DESTINATIONS[i];
    return makeAgent({
      idx: i, texts: t, model: look.model, colors: look.colors, spr: makeShipSprite(),
      state: 'linger', target: start, linger: 3 + i * 2, cooldown: 12,
      orbitBody: start, orbitAng: rng() * TAU, orbitR: start.avoidR + 8, orbitDir: i % 2 ? -1 : 1,
      beam: ['#fff6d8', '#ffd27a', '#ff9a4a', '#e0643a', '#9a3a2a'],
      trail: ['#ffe6a0', '#ff9a4a', '#6a5aa8'],
      beamLen: 5,
    });
  });
  const outerStation = DESTINATIONS.find(d => d.id === 'outer');
  const dealerNpc = makeAgent({
    idx: npcs.length, texts: TEXTS.dealer, dealer: true, hidden: true,
    model: ARROW, colors: pal({ hull: '#ffb31a', accent: '#5a3aa8', under: '#5a3a1a', glass: '#c9a2ff' }), spr: makeShipSprite(),
    state: 'linger', target: outerStation, linger: 9999, cooldown: 0,
    orbitBody: outerStation, orbitAng: 0, orbitR: outerStation.avoidR + 8, orbitDir: 1,
    beam: ['#fff0d8', '#ffc97a', '#c98aff', '#7a4ad0', '#3a2a7a'],
    trail: ['#ffe6c0', '#c98aff', '#4a3a8a'],
    beamLen: 5,
  });
  npcs.push(dealerNpc);
  const zoneNpc = (texts, colors, start) => makeAgent({
    idx: npcs.length, texts, hidden: true, dests: ZONE_DESTS,
    model: ARROW, colors: pal(colors), spr: makeShipSprite(),
    state: 'linger', target: start, linger: 9999, cooldown: 0,
    orbitBody: start, orbitAng: 0, orbitR: start.avoidR + 8, orbitDir: 1,
    beam: ['#ffffff', '#c8f8ff', '#7fe0ff', '#3a9ae8', '#1a4a8a'],
    trail: ['#e8fdff', '#7fe0ff', '#3a4a8a'],
    beamLen: 5,
  });
  const gwynnNpc = zoneNpc(TEXTS.zone.gwynn, { hull: '#e8fffa', accent: '#3affd0', under: '#3a6a68', glass: '#c8a2ff' }, WRECK);
  npcs.push(gwynnNpc);
  const justusNpc = zoneNpc(TEXTS.zone.justus, { hull: '#b8bcc8', accent: '#ff7a3a', under: '#4a4e5a', glass: '#ffd84a' }, DARK);
  npcs.push(justusNpc);
  // Kapitel 3: drei Kreuzfahrtschiffe verkehren zwischen den Urlaubsplaneten
  const RESORT_PLANETS = BODIES.filter(b => b.resort && !b.emissive);
  // Ziel »Doppelsonne«: Umlauf um beide Sonnen zugleich (Mittelpunkt des Urlaubssystems)
  const TWIN_SUNS = { id: 'twin', x: RESORT.x, y: RESORT.y, avoidR: 84, coreR: 0 };
  const RESORT_DESTS = [...RESORT_PLANETS, TWIN_SUNS];
  const CRUISE_LOOK = ['#ff5ad0', '#3ad0ff', '#ffd84a'];
  const resortNpcs = TEXTS.resort.ships.map((t, i) => {
    const start = RESORT_PLANETS[i % RESORT_PLANETS.length];
    return makeAgent({
      idx: npcs.length + i, texts: t, greet: true, dests: RESORT_DESTS, vmax: 14, orbitV: 5, turnMul: 0.3,
      model: CRUISER, colors: pal({ hull: '#f4f6fa', accent: CRUISE_LOOK[i % 3], under: '#2a3a6a', glass: '#5ab8ff' }), spr: makeShipSprite(),
      state: 'linger', target: start, linger: 4 + i * 3, cooldown: 6,
      orbitBody: start, orbitAng: i * 2, orbitR: start.avoidR + 10, orbitDir: 1,
      beam: ['#ffffff', '#ffe8c8', '#ffb86a', '#e07a3a'],
      trail: ['#fff4e0', '#ffc88a', '#8a6aa8'],
      beamLen: 4,
    });
  });
  npcs.push(...resortNpcs);
  function revealNpc(n, at) {
    n.hidden = false;
    n.x = at.x + 30; n.y = at.y + 30;
    n.state = 'travel';
    n.cooldown = 30;
    pickDestination(n);
  }

  const cam = { x: ship.x, y: ship.y };
  const particles = [];
  let time = 0;
  let marker = null; // {x, y, t}
  // Fortschritt wird bewusst nicht gespeichert: Neuladen = Neustart
  const collected = new Set();
  const cratesTaken = new Set();
  const visited = new Set();
  const badges = new Set();
  let speedBonus = 0;
  const maxSpeed = () => SHIP_MAX_SPEED * (1 + speedBonus);
  // Quests: Gegenstand -> 'open' | 'active' | 'done'
  const quests = {};
  const GIVERS = [...TEXTS.ships, ...Object.values(TEXTS.stations)];
  const ROUND1 = GIVERS.map(g => g.quest);
  const ROUND2 = GIVERS.filter(g => g.round2).map(g => g.round2.quest);
  for (const id of ROUND1.concat(ROUND2)) quests[id] = 'open';
  let round = 1;
  let cometsCaught = 0;
  const relicsFound = new Set();
  let relicsGiven = 0, dealerMet = false;
  // neues Gebiet: Blaues Elixier ('open' → 'active' → 'carrying' → 'done'), Schiffsteile
  quests.elixier = 'open';
  quests.teile = 'open';
  let partsFound = 0;
  let chapter = 1;
  // Kapitel 3: Aufträge der Kreuzfahrtschiffe (einschließlich Folgeaufträgen)
  const CH3 = [];
  for (const t of TEXTS.resort.ships) { CH3.push(t.quest); if (t.next) CH3.push(t.next.quest); }
  for (const id of CH3) quests[id] = 'open';
  quests.alien = 'open';   // Kapitel 3: Gwynns Alien-Relikte
  const ALL_QUESTS = () => ROUND1.concat(ROUND2, ['elixier', 'teile', 'alien'], CH3);
  const PLANETS = BODIES.filter(b => b.orbit > 0 && !b.resort);

  // ---------------------------------------------------------------- canvas
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 320, H = 240, pxPerCss = 1;
  let nebula = null, nebulaResort = null, stars = [];

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

  /** Hintergrund-Nebel; im Urlaubssystem eine hellere, lila Variante */
  function makeNebula(baseH, purpleH, tealH, amount) {
    const NW = W + 80, NH = H + 60;
    const cv = document.createElement('canvas');
    cv.width = NW; cv.height = NH;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(NW, NH);
    const base = hex(baseH), purple = hex(purpleH), teal = hex(tealH);
    for (let j = 0; j < NH; j++) {
      for (let i = 0; i < NW; i++) {
        const n = fbm(i / 110, j / 110, 0.5, 7, 4);
        const m = fbm(i / 70 + 40, j / 70, 2.5, 13, 3);
        const a = smooth(0.48, 0.72, n);
        const q = Math.floor(a * 4 + BAYER[(j & 3) * 4 + (i & 3)]) / 4;
        const col = mix(base, mix(purple, teal, smooth(0.35, 0.65, m)), q * amount);
        const k = (j * NW + i) * 4;
        img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    return cv;
  }
  function buildBackground() {
    // Nebel: nur minimale Parallaxe, daher ohne Kachelung
    nebula = makeNebula('#04050d', '#2c1a52', '#0f3a4c', 0.55);
    nebulaResort = makeNebula('#22163f', '#7a48b0', '#b066b8', 0.7);

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
  const intro = document.getElementById('intro');
  const CHAPTER_TIME = 4.5; // Dauer der Kapiteltafel (siehe .intro.play in style.css)
  let chapterTimer = 0;
  /** Kapiteltafel: das Bild dahinter wird unscharf, solange der Titel steht */
  function showChapter(i) {
    const c = TEXTS.chapters[i] || { num: '', title: TEXTS.intro };
    intro.innerHTML = `<span class="num">${c.num}</span><span class="title">${c.title}</span>`;
    intro.classList.remove('play'); void intro.offsetWidth; intro.classList.add('play');
    document.body.classList.add('blur');
    clearTimeout(chapterTimer);
    chapterTimer = setTimeout(() => document.body.classList.remove('blur'), (CHAPTER_TIME - 0.6) * 1000);
  }

  window.addEventListener('pointerdown', () => sfx.init(), { capture: true });
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (cine.active) return;
    if (dialog.open) { dialogNext(); return; }
    const ix = e.clientX * pxPerCss, iy = e.clientY * pxPerCss;

    // Treffer auf Himmelskörper (Monde -> Mutterplanet) oder Raumstation
    let hit = null, best = Infinity;
    for (const b of BODIES) {
      const cands = [[b.x, b.y, 0, b.r]];
      if (b.moons) for (const m of b.moons) cands.push([m.x, m.y, 0, m.r + 2]);
      for (const [x, y, z, r] of cands) {
        const d = Math.hypot(ix - toSX(x), iy - toSY(y, z));
        if (d <= r + 5 && d < best) { best = d; hit = b; }
      }
    }
    for (const st of STATIONS) {
      const d = Math.hypot(ix - toSX(st.x), iy - toSY(st.y, 3));
      if (d <= st.size + 5 && d < best) { best = d; hit = st; }
    }
    {
      const d = Math.hypot(ix - toSX(WRECK.x), iy - toSY(WRECK.y, 4));
      if (d <= 34 && d < best) { best = d; hit = WRECK; }
    }
    // Treffer auf ein anderes Raumschiff: hinfliegen und ansprechen
    let npcHit = null;
    for (const n of npcs) {
      if (n.hidden || n.state === 'drift') continue;
      const d = Math.hypot(ix - toSX(n.x), iy - toSY(n.y, 4));
      if (d <= 11 && d < best) { best = d; npcHit = n; }
    }
    // Treffer auf einen Kometen: hinterherfliegen
    let cometHit = null;
    for (const c of allComets) {
      if (!c.active || c.caught) continue;
      const d = Math.hypot(ix - toSX(c.x), iy - toSY(c.y, 6));
      if (d <= 12 && d < best) { best = d; cometHit = c; npcHit = null; }
    }
    if (cometHit) {
      hideInfo();
      ship.route = routeBetween(ship.x, ship.y, cometHit.x, cometHit.y);
      ship.mode = 'fly';
      ship.goal = { comet: cometHit };
      ship.sides.clear();
      marker = null;
    } else if (npcHit) {
      flyToNpc(npcHit);
    } else if (hit) {
      flyToBody(hit);
    } else {
      let x = ix - W / 2 + cam.x;
      let y = (iy - H / 2) / SIN_E + cam.y;
      const reg = regionOf(ship.x, ship.y);
      const [px2, py2] = projectAllowed(x, y, 4);
      const moved = Math.hypot(px2 - x, py2 - y) > 8;
      const edge = !moved ? null
        : reg === 'zone' && Math.hypot(x - ZONE.x, y - ZONE.y) > ZONE.r ? 'zone'
        : reg === 'resort' ? 'resort'
        : reg === 'sys' && Math.hypot(x, y) > SHIP_LIMIT ? 'sys' : null;
      flyToPoint(px2, py2);
      if (edge) ship.goal.warn = edge;
    }
  });

  function flyToPoint(x, y) {
    hideInfo();
    ship.route = routeBetween(ship.x, ship.y, x, y);
    ship.mode = 'fly';
    ship.goal = { x, y };
    ship.sides.clear();
    marker = { x, y, t: 0 };
  }
  function flyToNpc(n) {
    hideInfo();
    ship.route = routeBetween(ship.x, ship.y, n.x, n.y);
    n.cooldown = 0;
    ship.mode = 'fly';
    ship.goal = { npc: n };
    ship.sides.clear();
    marker = null;
  }
  function flyToBody(b) {
    if (ship.mode === 'orbit' && ship.orbitBody === b) { arriveAt(b); return; }
    hideInfo();
    ship.route = routeBetween(ship.x, ship.y, b.x, b.y);
    ship.mode = 'fly';
    ship.goal = { body: b };
    ship.sides.clear();
    marker = null;
  }
  function arriveAt(b) {
    if (b.id === 'wreck') { arriveWreck(); return; }
    if (b.id === 'dark') { arriveDark(); return; }
    if (b.station) {
      const t = TEXTS.stations[b.id];
      if (t) {
        showInfo(b);
        const g = giverLines(t);
        openDialog(t.with, g.lines, t.name || '', g.after);
      }
      return;
    }
    if (b.orbit > 0 && !b.resort && !visited.has(b.id)) {
      visited.add(b.id);
      if (visited.size === PLANETS.length) award('tourist');
    }
    const due = Object.keys(TEXTS.items).filter(id => quests[id] === 'active' && TEXTS.items[id].target === b.id);
    const fetchHere = b.id === TEXTS.zone.elixir.from && quests.elixier === 'active';
    if (due.length || fetchHere) {
      const lines = due.flatMap(id => TEXTS.items[id].deliver).concat(fetchHere ? TEXTS.zone.elixir.pickup : []);
      openDialog(null, lines, bodyName(b.id), () => {
        due.forEach(deliver);
        if (fetchHere) {
          quests.elixier = 'carrying';
          toast(TEXTS.toast.received, esc(TEXTS.zone.elixir.name), 'deliver');
          renderQuests();
        }
        showInfo(b);
      });
    } else {
      showInfo(b);
    }
  }

  /** Raumschiffwrack: die körperlose Entität bittet um das Blaue Elixier. */
  function arriveWreck() {
    const E = TEXTS.zone.entity, st = quests.elixier;
    if (st === 'done') { showInfo(WRECK); return; }
    let lines, after = null;
    if (st === 'open') { lines = E.offer; after = () => acceptQuest('elixier'); }
    else if (st === 'active') lines = E.waiting;
    else {
      lines = E.complete;
      after = () => {
        quests.elixier = 'done';
        toast(TEXTS.toast.delivered, esc(TEXTS.zone.elixir.name), 'deliver');
        revealNpc(gwynnNpc, WRECK);
        award('ghostbuster');
        renderQuests();
        checkFinal();
      };
    }
    openDialog(E.with, lines, bodyName('wreck'), () => { if (after) after(); showInfo(WRECK); });
  }

  /** Dunkler Planet: ein einsamer Reisender sucht die Teile seines Raumschiffs. */
  function arriveDark() {
    const R = TEXTS.zone.traveler, st = quests.teile;
    if (st === 'done') { showInfo(DARK); return; }
    let lines, after = null;
    if (st === 'open') { lines = R.offer; after = () => acceptQuest('teile'); }
    else if (partsFound < PART_TOTAL) lines = R.waiting.map(([w, t]) => [w, t.replace('{rest}', PART_TOTAL - partsFound)]);
    else {
      lines = R.complete;
      after = () => {
        quests.teile = 'done';
        toast(TEXTS.toast.delivered, esc(TEXTS.zone.partsName), 'deliver');
        revealNpc(justusNpc, DARK);
        award('helfer');
        renderQuests();
        checkFinal();
      };
    }
    openDialog(R.with, lines, bodyName('dark'), () => { if (after) after(); showInfo(DARK); });
  }

  // ----------------------------------------------------------------- sound
  /*
   * Weiche, leise Klänge, direkt im Browser erzeugt (Web Audio, keine Dateien).
   * Der Audio-Kontext startet beim ersten Tippen (Vorgabe der Browser).
   */
  const sfx = (() => {
    let ac = null, out = null, echo = null;
    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      out = ac.createGain(); out.gain.value = 0.22;
      const soft = ac.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 5200;
      out.connect(soft); soft.connect(ac.destination);
      // leichtes Echo für einen weichen, räumlichen Klang
      echo = ac.createDelay(1); echo.delayTime.value = 0.18;
      const fb = ac.createGain(); fb.gain.value = 0.28;
      const wet = ac.createGain(); wet.gain.value = 0.35;
      echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(soft);
    }
    function tone(freq, start, dur, vol = 0.5, type = 'sine', glideTo = 0, attack = 0.02) {
      const t0 = ac.currentTime + start;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(out); g.connect(echo);
      o.start(t0); o.stop(t0 + dur + 0.05);
    }
    // Ton an/aus (nur diese Einstellung merkt sich der Browser, kein Spielstand)
    let muted = false;
    try { muted = localStorage.getItem('space.muted') === '1'; } catch (_) { /* egal */ }
    const play = {
      // Kristall: weicher, warmer Glockenton (tief, sanft einschwingend, lang ausklingend)
      crystal() { tone(659.25, 0, 1.1, 0.2, 'sine', 0, 0.035); tone(987.77, 0.1, 1.3, 0.12, 'sine', 0, 0.05); },
      // Frachtcontainer: weiches, tiefes »Plopp« mit Schimmer
      crate() { tone(196, 0, 0.35, 0.45, 'sine', 140); tone(392, 0.04, 0.4, 0.2, 'triangle'); tone(784, 0.1, 0.45, 0.08); },
      // Badge: kleine, warme Dur-Arpeggio
      badge() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.7, 0.24, 'triangle')); },
      // Abgeliefert: freundliches Zwei-Ton-»Ding-Dong«
      deliver() { tone(659.25, 0, 0.55, 0.3, 'triangle'); tone(987.77, 0.16, 0.8, 0.26, 'triangle'); },
      // Komet: weich aufsteigendes Schimmern
      comet() { [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.12, 1.2, 0.14, 'sine', 0, 0.06)); },
      // Relikt: tiefer, warmer, etwas geheimnisvoller Klang
      relic() { tone(220, 0, 1.4, 0.2, 'sine', 0, 0.08); tone(329.63, 0.15, 1.4, 0.12, 'sine', 0, 0.1); },
    };
    return {
      init,
      play(name) {
        if (muted || !ac || !play[name]) return;
        const go = () => { try { play[name](); } catch (_) { /* ohne Ton weiter */ } };
        if (ac.state === 'running') go();
        else ac.resume().then(go, () => {}); // erster Ton direkt nach dem Start
      },
      get muted() { return muted; },
      setMuted(m) {
        muted = m;
        try { localStorage.setItem('space.muted', m ? '1' : '0'); } catch (_) { /* egal */ }
      },
    };
  })();

  // ---------------------------------------------------------------- quests
  const bodyName = id => (TEXTS.bodies[id] || {}).name || id;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /** Aktueller Auftrag eines Auftraggebers: erste Runde, danach die zweite. */
  function currentQuest(t) {
    if (round >= 2 && t.round2 && quests[t.quest] === 'done') return t.round2;
    if (t.next && quests[t.quest] === 'done') return t.next;
    return t;
  }
  /** Kapitel 3: Was die Figuren im alten Gebiet über das Wurmloch sagen */
  const wormLine = who => [[who, TEXTS.wormholeTalk[who] || TEXTS.wormholeTalk.default]];
  const isResortTexts = t => TEXTS.resort.ships.includes(t);
  /** Welche Zeilen sagt ein Auftraggeber gerade? */
  function giverLines(t) {
    const q = currentQuest(t);
    const st = quests[q.quest];
    if (st === 'open') return { lines: q.offer, after: () => acceptQuest(q.quest) };
    if (st === 'active') return { lines: q.waiting };
    if (chapter >= 3 && !isResortTexts(t)) return { lines: wormLine(t.with) };
    return { lines: q.thanks };
  }
  function acceptQuest(id) {
    if (quests[id] !== 'open') return;
    quests[id] = 'active';
    if (id === 'elixier') {
      toast(TEXTS.toast.quest, `${esc(TEXTS.zone.elixir.name)}: <span class="nm">${esc(bodyName(TEXTS.zone.elixir.from))}</span> → <span class="nm">${esc(bodyName('wreck'))}</span>`);
      renderQuests();
      return;
    }
    if (id === 'teile') {
      for (const p of zoneParts) p.active = true;
      toast(TEXTS.toast.quest, `${esc(TEXTS.zone.partsName)} ${partsFound} / ${PART_TOTAL}`);
      renderQuests();
      return;
    }
    if (id === 'alien') {
      for (const a of alienRelics) a.active = true;
      toast(TEXTS.toast.quest, `${esc(TEXTS.questList.alien)} ${aliensFound} / ${ALIEN_TOTAL}`);
      renderQuests();
      return;
    }
    if (id === 'kometen') {
      toast(TEXTS.toast.quest, `${esc(TEXTS.questList.comets)} ${cometsCaught} / ${COMET_TOTAL}`);
      renderQuests();
      checkComets();
      return;
    }
    const it = TEXTS.items[id];
    toast(TEXTS.toast.quest, `${esc(it.name)} → <span class="nm">${esc(bodyName(it.target))}</span>`);
    renderQuests();
  }
  function deliver(id) {
    if (quests[id] !== 'active') return;
    quests[id] = 'done';
    const it = TEXTS.items[id];
    toast(TEXTS.toast.delivered, esc(it.name), 'deliver');
    renderQuests();
    if (id === 'brief') award('amor');
    if (round === 1 && ROUND1.every(q => quests[q] === 'done')) {
      milestone('meisterbote', 0.2);
      queueChapter2();
    }
    checkChapter3();
    checkFinal();
  }

  /** Zweite Runde: neue Aufträge, fünf Kometen, fünf Relikte und der Kuriositätenhändler. */
  function startRound2() {
    if (round >= 2) return;
    round = 2;
    for (const c of comets) c.active = true;
    for (const r of relics) r.active = true;
    const a = Math.random() * TAU;
    dealerNpc.x = Math.cos(a) * (SHIP_LIMIT - 20);
    dealerNpc.y = Math.sin(a) * (SHIP_LIMIT - 20);
    dealerNpc.hidden = false;
    dealerNpc.state = 'travel';
    dealerNpc.cooldown = 6;
    pickDestination(dealerNpc);
    toast(TEXTS.toast.round2, esc(TEXTS.toast.round2Body));
    renderQuests();
  }

  /** Kapitel 2: Zwischensequenz, die Kamera fliegt zu einem der Kometen */
  function queueChapter2() {
    let focusObj = null;
    notify.queue.push({
      type: 'cine', chapter: 1, dur: 7.2,
      start: () => {
        chapter = 2;
        startRound2();
        focusObj = comets.slice().sort((a, b) => Math.hypot(a.x - ship.x, a.y - ship.y) - Math.hypot(b.x - ship.x, b.y - ship.y))[0];
      },
      focus: () => focusObj,
    });
    pump();
  }
  /** Kapitel 3 beginnt, sobald alle fünf Kometen gefangen sind: ein Wurmloch öffnet sich */
  function checkChapter3() {
    if (chapter !== 2) return;
    if (quests.kometen !== 'done') return;
    chapter = 3;
    updateHUD();
    notify.queue.push({
      type: 'cine', chapter: 2, dur: 10.5, focus: () => WH.a,
      start: () => { placeWormhole(); setTimeout(() => { WH.open = true; WH.t = 0; WH.cool = 0; }, 4000); },
    });
    toast(TEXTS.resort.opened, '');
    pump();
  }

  function checkComets() {
    if (quests.kometen !== 'active' || cometsCaught < COMET_TOTAL) return;
    quests.kometen = 'done';
    renderQuests();
    setTimeout(() => { milestone('kometenjaeger', 0.3); checkChapter3(); checkFinal(); }, 900);
  }

  /** Kapitel 3: Gwynn sucht drei Alien-Relikte */
  function alienLines() {
    const A = TEXTS.zone.gwynn.alien, st = quests.alien;
    if (st === 'open') return { lines: A.offer, after: () => acceptQuest('alien') };
    if (st === 'active') return { lines: A.waiting.map(([w, t]) => [w, t.replace('{rest}', ALIEN_TOTAL - aliensFound)]) };
    return { lines: A.thanks };
  }

  /** Was sagt der Kuriositätenhändler? Übergibt dabei alle gefundenen Relikte. */
  function dealerLines() {
    const D = TEXTS.dealer;
    const fill = (arr, n, rest) => arr.map(([w, t]) => [w, t.replace('{n}', n).replace('{rest}', rest)]);
    if (relicsGiven >= RELIC_TOTAL) return { lines: chapter >= 3 ? wormLine(D.with) : D.thanks };
    let lines = dealerMet ? [] : D.intro.slice();
    let hand = null;
    const n = relicsFound.size;
    if (n > relicsGiven) {
      lines = lines.concat(n >= RELIC_TOTAL ? D.complete : fill(D.handIn, n, RELIC_TOTAL - n));
      hand = () => {
        relicsGiven = n;
        toast(TEXTS.toast.relicsGiven, `${n} / ${RELIC_TOTAL}`, 'deliver');
        if (n >= RELIC_TOTAL) { milestone('ahnenforscher', 0.2); checkChapter3(); }
      };
    } else if (dealerMet) {
      lines = lines.concat(fill(D.missing, relicsGiven, RELIC_TOTAL - relicsGiven));
    }
    return { lines, after: () => { dealerMet = true; if (hand) hand(); renderQuests(); checkFinal(); } };
  }

  // ----------------------------------------------------- badges & rewards
  const BADGE_IDS = Object.keys(TEXTS.badges);
  const FINAL_BADGE = 'weltenbummler';
  /* Abzeichen: runde Pixel-Medaillen (13×13), Symbol 7×7 – '#' hell, '+' dunkel */
  const BADGE_ART = {
    meistererkunder: ['#2f7fd8', ['...#...', '..###..', '.##+##.', '###+###', '.##+##.', '..###..', '...#...']],
    aufraeumer: ['#c8641f', ['#######', '#+++++#', '#######', '#+++++#', '#+++++#', '#+++++#', '#######']],
    meisterbote: ['#2e9e6a', ['.......', '#######', '#+###+#', '##+#+##', '###+###', '#######', '.......']],
    tourist: ['#6a5ad8', ['.......', '..###..', '.#####.', '+++++++', '.#####.', '..###..', '.......']],
    amor: ['#e0457a', ['.......', '.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']],
    kometenjaeger: ['#1f9fb8', ['.....++', '...++..', '.##+...', '####...', '####...', '.##....', '.......']],
    ahnenforscher: ['#a8743a', ['.#####.', '..###..', '.#####.', '#######', '#+++++#', '.#####.', '..###..']],
    grenzgaenger: ['#55709a', ['#++++..', '#+++++.', '#++++..', '#......', '#......', '#......', '##.....']],
    ghostbuster: ['#7a4fc0', ['..###..', '.#####.', '.#+#+#.', '.#####.', '.#####.', '.#####.', '.#.#.#.']],
    helfer: ['#c99a1c', ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..']],
    muellabfuhr: ['#5a8a3a', ['.#####.', '#######', '.#+#+#.', '.#+#+#.', '.#+#+#.', '.#+#+#.', '..###..']],
    weltenbummler: ['#f0b632', ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.']],
  };
  const badgeIcons = {};
  function badgeIcon(id) {
    if (badgeIcons[id]) return badgeIcons[id];
    const [col, sym] = BADGE_ART[id] || ['#7fe0ff', []];
    const c = document.createElement('canvas'); c.width = c.height = 13;
    const x = c.getContext('2d');
    const base = hex(col);
    const mix = (k, t) => `rgb(${base.map(v => Math.round(v + (t - v) * k)).join(',')})`;
    for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
      const d = Math.hypot(i - 6, j - 6);
      if (d > 6.4) continue;
      // Rand dunkel, Fläche in der Farbe, oben links ein Glanz
      x.fillStyle = d > 5.3 ? mix(0.55, 10) : (i + j < 7 && d > 3.8 ? mix(0.35, 255) : col);
      x.fillRect(i, j, 1, 1);
    }
    sym.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      x.fillStyle = ch === '#' ? mix(0.82, 255) : mix(0.45, 20);
      x.fillRect(i + 3, j + 3, 1, 1);
    }));
    return (badgeIcons[id] = c.toDataURL());
  }

  const speedLine = bonus => `<div class="t-sub">${esc(TEXTS.toast.speed.replace('{n}', Math.round(bonus * 100)))}</div>`;
  function award(id, bonus = 0) {
    if (badges.has(id)) return;
    badges.add(id);
    const b = TEXTS.badges[id];
    toast(TEXTS.toast.badge, `<img class="t-badge" src="${badgeIcon(id)}" alt="">${esc(b.name)}` + (bonus ? speedLine(bonus) : ''), 'badge');
    renderBadges();
    if (id !== FINAL_BADGE) checkFinal();
  }
  /** Das Spiel endet erst, wenn alle Badges und alle Aufträge beider Runden geschafft sind. */
  function checkFinal() {
    if (badges.has(FINAL_BADGE)) return;
    if (!BADGE_IDS.filter(x => x !== FINAL_BADGE).every(x => badges.has(x))) return;
    if (!ALL_QUESTS().every(q => quests[q] === 'done')) return;
    award(FINAL_BADGE);
    const f = TEXTS.rewards.final;
    showModal({ title: f.title, body: f.body, button: f.button, restart: f.restart, final: true });
  }
  /** Meilenstein: Badge-Meldung, darunter der Geschwindigkeitsbonus */
  function milestone(badgeId, bonus) {
    if (badges.has(badgeId)) return;
    speedBonus += bonus;
    award(badgeId, bonus);
  }

  // ----------------------------------------------------------- flight logic
  /** Richtung zum Ziel; liegt ein Körper im Weg, wird tangential um ihn herum gesteuert. */
  function steer(agent, tx, ty, exclude) {
    const px = agent.x, py = agent.y;
    const dx = tx - px, dy = ty - py;
    const len = Math.hypot(dx, dy) || 1e-6;
    const ux = dx / len, uy = dy / len;
    let best = null, bestAlong = Infinity;
    for (const o of OBSTACLES) {
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
    for (const k of agent.sides.keys()) if (!best || k !== best.o) agent.sides.delete(k);
    if (!best) return Math.atan2(dy, dx);

    const { o, R, cx, cy, dist } = best;
    let side = agent.sides.get(o);
    if (side === undefined) {
      side = cx * dy - cy * dx >= 0 ? 1 : -1;
      agent.sides.set(o, side);
    }
    const a = Math.atan2(cy, cx);
    if (dist > R) return a + side * (Math.asin(Math.min(1, R / dist)) + 0.06);
    return a + side * (Math.PI / 2 + 0.8 * (R - dist) / R);
  }

  function turnTowards(agent, target, rate, dt) {
    const diff = angDiff(agent.heading, target);
    const turn = clamp(diff, -rate * dt, rate * dt);
    agent.heading += turn;
    agent.turnVel = turn / Math.max(dt, 1e-4);
    return diff;
  }

  /** Fliegt auf (tx, ty) zu; true, sobald arriveR erreicht ist. */
  function flyAgent(agent, dt, tx, ty, arriveR, exclude, maxSpeed, chase = false) {
    const dist = Math.hypot(tx - agent.x, ty - agent.y);
    if (dist <= arriveR) return true;
    const want = steer(agent, tx, ty, exclude);
    const diff = turnTowards(agent, want, (dist < 24 ? 6 : 3.2) * (agent.turnMul || 1), dt);
    const remaining = dist - arriveR;
    const tgt = (chase ? maxSpeed : Math.min(maxSpeed, 9 + remaining * 1.3)) * Math.max(0.2, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
    agent.speed += (tgt - agent.speed) * Math.min(1, dt * 2.2 * (agent.turnMul || 1));
    agent.x += Math.cos(agent.heading) * agent.speed * dt;
    agent.y += Math.sin(agent.heading) * agent.speed * dt;
    return false;
  }

  function startOrbit(agent, b, R) {
    agent.orbitBody = b;
    agent.orbitR = R;
    agent.orbitAng = Math.atan2(agent.y - b.y, agent.x - b.x);
    const rx = agent.x - b.x, ry = agent.y - b.y;
    agent.orbitDir = rx * Math.sin(agent.heading) - ry * Math.cos(agent.heading) >= 0 ? 1 : -1;
  }

  function orbitAgent(agent, dt) {
    const b = agent.orbitBody;
    const ov = agent.orbitV || 15;
    agent.orbitAng += agent.orbitDir * (ov / agent.orbitR) * dt;
    const tx = b.x + Math.cos(agent.orbitAng) * agent.orbitR;
    const ty = b.y + Math.sin(agent.orbitAng) * agent.orbitR;
    const k = Math.min(1, dt * 2.5);
    agent.x += (tx - agent.x) * k;
    agent.y += (ty - agent.y) * k;
    turnTowards(agent, agent.orbitAng + agent.orbitDir * Math.PI / 2, 2 * (agent.turnMul || 1), dt);
    agent.speed += (ov - agent.speed) * Math.min(1, dt * 2);
  }

  function coast(agent, dt) {
    agent.speed *= Math.exp(-dt * 3);
    agent.turnVel *= Math.exp(-dt * 4);
    agent.x += Math.cos(agent.heading) * agent.speed * dt;
    agent.y += Math.sin(agent.heading) * agent.speed * dt;
  }

  function constrain(agent, dt) {
    for (const o of OBSTACLES) {
      const dx = agent.x - o.x, dy = agent.y - o.y, d = Math.hypot(dx, dy) || 1e-6;
      const min = o.coreR + 2;
      if (d < min) { agent.x = o.x + (dx / d) * min; agent.y = o.y + (dy / d) * min; }
    }
    [agent.x, agent.y] = projectAllowed(agent.x, agent.y);
    agent.bank += (clamp(agent.turnVel * 0.22, -0.55, 0.55) - agent.bank) * Math.min(1, dt * 5);
  }

  function emitTrail(agent, rate) {
    if (agent.speed <= 6 || particles.length > 600) return;
    const n = agent.speed > 40 ? rate : 1;
    const back = agent.model.V[agent.model.engine][0] * agent.model.scale - 1;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: agent.x + Math.cos(agent.heading) * back + (Math.random() - 0.5) * 1.5,
        y: agent.y + Math.sin(agent.heading) * back + (Math.random() - 0.5) * 1.5,
        z: 5,
        vx: -Math.cos(agent.heading) * 14 + (Math.random() - 0.5) * 5,
        vy: -Math.sin(agent.heading) * 14 + (Math.random() - 0.5) * 5,
        vz: (Math.random() - 0.5) * 2,
        life: 0, max: 0.7 + Math.random() * 0.8, kind: 'trail', cols: agent.trail,
      });
    }
  }

  function updateShip(dt) {
    if (ship.mode === 'orbit') {
      orbitAgent(ship, dt);
    } else if (ship.mode === 'drift') {
      // Seite an Seite mit einem anderen Schiff treiben
      turnTowards(ship, ship.drift.dir, 1.5, dt);
      ship.speed += (6 - ship.speed) * Math.min(1, dt * 1.5);
      ship.x += Math.cos(ship.heading) * ship.speed * dt;
      ship.y += Math.sin(ship.heading) * ship.speed * dt;
    } else if (ship.mode === 'fly' && ship.goal) {
      const g = ship.goal;
      let arrived;
      if (ship.route && ship.route.length) {
        const w = ship.route[0];
        if (flyAgent(ship, dt, w[0], w[1], 18, null, maxSpeed(), true)) ship.route.shift();
        arrived = false;
      } else if (g.comet) {
        if (g.comet.caught) arrived = true;
        else {
          // Vorhalt: dorthin fliegen, wo der Komet gleich sein wird
          const c = g.comet;
          const lead = Math.min(1.5, Math.hypot(c.x - ship.x, c.y - ship.y) / maxSpeed());
          arrived = flyAgent(ship, dt, c.x + c.vx * lead, c.y + c.vy * lead, 2, null, maxSpeed(), true);
        }
      } else if (g.npc) arrived = flyAgent(ship, dt, g.npc.x, g.npc.y, 12, null, maxSpeed());
      else if (g.body) arrived = flyAgent(ship, dt, g.body.x, g.body.y, g.body.avoidR + 1, g.body, maxSpeed());
      else arrived = flyAgent(ship, dt, g.x, g.y, 2.5, null, maxSpeed());
      if (arrived) {
        if (g.npc || g.comet) {
          ship.mode = 'idle';
          ship.goal = null;
        } else if (g.body) {
          ship.mode = 'orbit';
          ship.goal = null;
          startOrbit(ship, g.body, g.body.avoidR);
          showInfo(g.body);
          arriveAt(g.body);
        } else {
          ship.mode = 'idle';
          ship.goal = null;
          if (g.warn) {
            // zu weit hinaus: Warnung und automatisch umkehren
            pickupText(TEXTS.warnEdge);
            const c = g.warn === 'zone' ? ZONE : g.warn === 'sys' ? { x: 0, y: 0 } : RESORT;
            const k = g.warn === 'sys' ? 0.8 : 0.62;
            flyToPoint(c.x + (ship.x - c.x) * k, c.y + (ship.y - c.y) * k);
          }
        }
      }
    } else {
      coast(ship, dt);
    }
    constrain(ship, dt);
    emitTrail(ship, 3);
  }

  function pickDestination(npc) {
    const options = (npc.dests || DESTINATIONS).filter(d => d !== npc.target && d !== npc.prevTarget);
    npc.prevTarget = npc.target;
    npc.target = options[(Math.random() * options.length) | 0];
    npc.sides.clear();
  }

  function updateNpc(npc, dt) {
    if (npc.hidden) return;
    npc.cooldown = Math.max(0, npc.cooldown - dt);
    if (npc.state === 'travel') {
      const t = npc.target;
      if (flyAgent(npc, dt, t.x, t.y, t.avoidR + 8, t, npc.vmax || 42)) {
        npc.state = 'linger';
        npc.linger = 4 + Math.random() * 6;
        startOrbit(npc, t, t.avoidR + 8);
      }
    } else if (npc.state === 'linger') {
      orbitAgent(npc, dt);
      npc.linger -= dt;
      if (npc.linger <= 0) { npc.state = 'travel'; pickDestination(npc); }
    } else if (npc.state === 'drift') {
      // neben dem Spieler herschweben
      const dir = ship.drift.dir;
      const side = ship.drift.side;
      const tx = ship.x + Math.cos(dir + side * Math.PI / 2) * 22;
      const ty = ship.y + Math.sin(dir + side * Math.PI / 2) * 22;
      const k = Math.min(1, dt * 1.6);
      const nx = npc.x + (tx - npc.x) * k, ny = npc.y + (ty - npc.y) * k;
      npc.speed = Math.hypot(nx - npc.x, ny - npc.y) / Math.max(dt, 1e-4);
      npc.x = nx; npc.y = ny;
      turnTowards(npc, dir, 1.5, dt);
    }
    constrain(npc, dt);
    emitTrail(npc, 1);
  }

  /** Begegnung: Spieler und Schiff treiben nebeneinander, Dialog öffnet sich. */
  function checkEncounters() {
    if (dialog.open || ship.mode === 'drift' || modal.open || cine.active || notify.queue.some(n => n.type === 'modal' || n.type === 'cine')) return;
    for (const npc of npcs) {
      if (npc.hidden || npc.cooldown > 0 || npc.state === 'drift') continue;
      if (Math.hypot(npc.x - ship.x, npc.y - ship.y) > 28) continue;
      const dir = ship.speed > 5 ? ship.heading : npc.heading;
      const cr = Math.cos(dir) * (npc.y - ship.y) - Math.sin(dir) * (npc.x - ship.x);
      ship.mode = 'drift';
      ship.goal = null;
      ship.route = [];
      marker = null;
      ship.drift = { npc, dir, side: cr >= 0 ? 1 : -1 };
      npc.state = 'drift';
      showInfo(npc);
      let g = npc.dealer ? dealerLines()
        : npc === gwynnNpc && chapter >= 3 ? alienLines()
        : npc.texts.talk ? { lines: chapter >= 3 ? wormLine(npc.texts.with) : npc.texts.talk }
        : giverLines(npc.texts);
      if (npc.greet) {
        // Figuren im Urlaubssystem freuen sich immer über Boten
        const G = TEXTS.resort.greetings;
        g = Object.assign({}, g, { lines: [[npc.texts.with, G[(Math.random() * G.length) | 0]]].concat(g.lines) });
      }
      openDialog(npc.texts.with, g.lines, npc.texts.name, () => { if (g.after) g.after(); endEncounter(npc); });
      return;
    }
  }
  function endEncounter(npc) {
    npc.state = 'travel';
    npc.cooldown = 40;
    pickDestination(npc);
    if (ship.mode === 'drift') ship.mode = 'idle';
    ship.drift = null;
    if (infoTarget === npc) hideInfo();
  }

  function burst(x, y, kind) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      particles.push({
        x, y, z: 5,
        vx: Math.cos(a) * 26, vy: Math.sin(a) * 26, vz: 6 + Math.random() * 10,
        life: 0, max: 0.6 + Math.random() * 0.4, kind,
      });
    }
  }

  function updateCoins() {
    for (const c of coins) {
      if (c.taken || Math.hypot(c.x - ship.x, c.y - ship.y) >= 17) continue;
      c.taken = true;
      collected.add(c.id);
      speedBonus += 0.01;   // jeder Kristall macht den Antrieb 1 % schneller
      burst(c.x, c.y, 'gold');
      sfx.play('crystal');
      updateHUD('coin');
      pickupText(`${TEXTS.pickup.crystal} ${collected.size} / ${COIN_TOTAL}`, TEXTS.pickup.crystalBoost);
      if (collected.size >= COIN_TOTAL) setTimeout(() => milestone('meistererkunder', 0.2), 2000);
    }
    for (const c of crates) {
      if (c.taken || Math.hypot(c.x - ship.x, c.y - ship.y) >= 19) continue;
      c.taken = true;
      cratesTaken.add(c.id);
      burst(c.x, c.y, 'crate');
      sfx.play('crate');
      updateHUD('crate');
      pickupText(`${TEXTS.pickup.container} ${cratesTaken.size} / ${CRATE_TOTAL}`);
      if (cratesTaken.size >= CRATE_TOTAL) setTimeout(() => milestone('aufraeumer', 0.1), 2000);
    }
    for (const c of resortCrates) {
      if (c.taken || Math.hypot(c.x - ship.x, c.y - ship.y) >= 19) continue;
      c.taken = true;
      resCratesTaken++;
      burst(c.x, c.y, 'crate');
      sfx.play('crate');
      updateHUD('crate2');
      pickupText(`${TEXTS.pickup.container} ${resCratesTaken} / ${RES_CRATE_TOTAL}`);
      if (resCratesTaken >= RES_CRATE_TOTAL) setTimeout(() => { milestone('muellabfuhr', 0.1); checkFinal(); }, 2000);
    }
    for (const a of alienRelics) {
      if (!a.active || a.taken || Math.hypot(a.x - ship.x, a.y - ship.y) >= 18) continue;
      a.taken = true;
      aliensFound++;
      burst(a.x, a.y, 'relic');
      sfx.play('relic');
      pickupText(`${TEXTS.pickup.alien} ${aliensFound} / ${ALIEN_TOTAL}`);
      if (aliensFound >= ALIEN_TOTAL) {
        quests.alien = 'done';
        setTimeout(() => {
          speedBonus += 0.1;
          makeGolden();
          toast(TEXTS.toast.golden, speedLine(0.1), 'badge');
          checkFinal();
        }, 2000);
      }
      renderQuests();
    }
    for (const r of relics) {
      if (!r.active || r.taken || Math.hypot(r.x - ship.x, r.y - ship.y) >= 18) continue;
      r.taken = true;
      relicsFound.add(r.id);
      burst(r.x, r.y, 'relic');
      sfx.play('relic');
      pickupText(`${TEXTS.pickup.relic} ${relicsFound.size} / ${RELIC_TOTAL}`);
      renderQuests();
    }
    for (const c of comets) {
      if (!c.active || c.caught || Math.hypot(c.x - ship.x, c.y - ship.y) >= 14) continue;
      c.caught = true;
      cometsCaught++;
      burst(c.x, c.y, 'comet');
      sfx.play('comet');
      pickupText(`${TEXTS.pickup.comet} ${cometsCaught} / ${COMET_TOTAL}`);
      renderQuests();
      checkComets();
    }
    for (const c of fastComets) {
      if (c.caught || Math.hypot(c.x - ship.x, c.y - ship.y) >= 14) continue;
      c.caught = true;
      speedBonus += 0.1;
      burst(c.x, c.y, 'comet');
      sfx.play('comet');
      pickupText(TEXTS.pickup.fastComet, TEXTS.toast.speed.replace('{n}', 10));
    }
  }

  function teleportTo(to, towardX, towardY) {
    const dx = towardX - to.x, dy = towardY - to.y, d = Math.hypot(dx, dy) || 1;
    [ship.x, ship.y] = projectAllowed(to.x + (dx / d) * 48, to.y + (dy / d) * 48, 12);
    ship.heading = Math.atan2(dy, dx);
    ship.speed = 30;
    ship.mode = 'idle'; ship.goal = null; ship.route = []; marker = null;
    hideInfo();
    cam.x = ship.x; cam.y = ship.y;
    WH.cool = 2.5;
    const fl = document.getElementById('flash');
    fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    sfx.play('comet');
  }
  function updateWormhole(dt) {
    if (!WH.open) return;
    WH.t = Math.min(1, WH.t + dt * 0.45);
    WH.cool = Math.max(0, WH.cool - dt);
    if (WH.cool > 0 || cine.active) return;
    if (Math.hypot(ship.x - WH.a.x, ship.y - WH.a.y) < 16) teleportTo(WH.b, RESORT.x, RESORT.y);
    else if (Math.hypot(ship.x - WH.b.x, ship.y - WH.b.y) < 16) teleportTo(WH.a, 0, 0);
  }
  function placeWormhole() {
    const h = ship.heading;
    [WH.a.x, WH.a.y] = projectAllowed(ship.x + Math.cos(h) * 80, ship.y + Math.sin(h) * 80, 30);
  }

  const cine = { active: false, t: 0, dur: 0, focus: null };
  function runCine(it) {
    cine.active = true; cine.t = 0; cine.dur = it.dur; cine.focus = it.focus || null;
    document.body.classList.add('cine');
    hideInfo();
    ship.mode = 'idle'; ship.goal = null; ship.route = []; marker = null;
    if (it.start) it.start();
    setTimeout(() => showChapter(it.chapter), 300);
  }
  function updateCine(dt) {
    if (!cine.active) return;
    cine.t += dt;
    if (cine.t < cine.dur) return;
    cine.active = false;
    document.body.classList.remove('cine');
    notify.busy = false;
    setTimeout(pump, 300);
  }

  function updateZone() {
    for (const p of zoneParts) {
      if (!p.active || p.taken || Math.hypot(p.x - ship.x, p.y - ship.y) >= 18) continue;
      p.taken = true;
      partsFound++;
      burst(p.x, p.y, 'crate');
      sfx.play('crate');
      pickupText(`${TEXTS.pickup.part} ${partsFound} / ${PART_TOTAL}`);
      renderQuests();
    }
    if (!badges.has('grenzgaenger') && Math.hypot(ship.x - ZONE.x, ship.y - ZONE.y) < ZONE.r - 20) {
      milestone('grenzgaenger', 0.1);
    }
  }

  function updateComets(dt) {
    for (const c of allComets) {
      if (!c.active || c.caught) continue;
      // gleichmäßige Bahngeschwindigkeit v entlang der Ellipse
      const dP = Math.hypot(c.a * Math.sin(c.E), c.b * Math.cos(c.E)) || 1;
      c.E += (c.v * dt) / dP;
      const [x, y] = cometPos(c, c.E);
      if (dt > 0) { c.vx = (x - c.x) / dt; c.vy = (y - c.y) / dt; }
      c.x = x; c.y = y;
    }
  }

  function updateWorld(dt) {
    time += dt;
    updateFog(dt);
    for (const b of BODIES) {
      if (b.binary) {
        const a = (time * TAU) / 50, d = b.binary > 0 ? 24 : 36;
        b.x = RESORT.x + Math.cos(a) * d * b.binary;
        b.y = RESORT.y + Math.sin(a) * d * b.binary;
      } else if (b.orbit) {
        const a = b.a0 + (time * TAU) / b.period;
        b.x = (b.cx || 0) + Math.cos(a) * b.orbit;
        b.y = (b.cy || 0) + Math.sin(a) * b.orbit;
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
    for (const st of STATIONS) {
      const a = st.a0 + (time * TAU) / st.period;
      st.x = Math.cos(a) * st.orbit;
      st.y = Math.sin(a) * st.orbit;
      st.rot = time * 0.3;
    }
    updateComets(dt);
    updateShip(dt);
    for (const npc of npcs) updateNpc(npc, dt);
    updateCine(dt);
    updateWormhole(dt);
    checkEncounters();
    updateCoins();
    updateZone();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }
      const drag = Math.exp(-dt * 2);
      p.vx *= drag; p.vy *= drag;
      if (p.kind !== 'trail') p.vz -= 30 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    if (marker) marker.t += dt;

    // Kamera folgt sanft, mit leichtem Vorlauf; in Zwischensequenzen auf das gezeigte Objekt
    const lead = ship.speed * 0.35;
    let tx = ship.x + Math.cos(ship.heading) * lead;
    let ty = ship.y + Math.sin(ship.heading) * lead;
    const f = cine.active && cine.t < cine.dur - 1.3 && cine.focus && cine.focus();
    if (f) { tx = f.x; ty = f.y; }
    const k = 1 - Math.exp(-dt * (f ? 1.6 : 2.2));
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
  }

  // ---------------------------------------------------------------- render
  const ORBIT_DOTS = OBSTACLES.filter(b => b.orbit).map(b => {
    const n = Math.round((b.orbit * TAU) / (b.station ? 9 : 6));
    return { b, cx: b.cx || 0, cy: b.cy || 0, pts: Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * b.orbit, Math.sin((i / n) * TAU) * b.orbit]) };
  });

  function drawBackground() {
    const ox = Math.round(-40 - clamp(cam.x * 0.03, -38, 38));
    const oy = Math.round(-30 - clamp(cam.y * SIN_E * 0.03, -28, 28));
    ctx.drawImage(nebula, ox, oy);
    const fr = clamp((RESORT.r + 700 - Math.hypot(cam.x - RESORT.x, cam.y - RESORT.y)) / 500, 0, 1);
    if (fr > 0) { ctx.globalAlpha = fr; ctx.drawImage(nebulaResort, ox, oy); ctx.globalAlpha = 1; }
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
    for (const o of ORBIT_DOTS) {
      ctx.fillStyle = o.b.station ? '#ffd27a' : '#8fa6ff';
      ctx.globalAlpha = o.b.station ? 0.12 : 0.16;
      for (const [x, y] of o.pts) {
        const sx = toSX(x + o.cx), sy = toSY(y + o.cy);
        if (sx >= 0 && sx < W && sy >= 0 && sy < H) ctx.fillRect(sx | 0, sy | 0, 1, 1);
      }
    }
    // Mondbahnen
    ctx.fillStyle = '#8fa6ff';
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
      if (!d.res && inGate(a)) continue;
      const sx = toSX((d.res ? RESORT.x : 0) + Math.cos(a) * d.rad), sy = toSY((d.res ? RESORT.y : 0) + Math.sin(a) * d.rad, d.z);
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
    if (b.id === 'dark') drawStorm(b);
  }

  // --- Raumstationen (pixelweise gezeichnet)
  const HULL = G([[0, '#2e3448'], [0.45, '#7c87a3'], [1, '#eef2fa']]);
  const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  function px(x, y, col, w = 1, h = 1) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  function drawPanel(x0, y0, w) {
    px(x0, y0, '#1d3a78', w, 3);
    for (let i = 0; i < w; i++) if (i % 3 !== 2) px(x0 + i, y0, '#5f9cf0');
    for (let i = 0; i < w; i++) if (i % 3 !== 2) px(x0 + i, y0 + 1, '#2d5fb8');
  }

  function drawStation(st) {
    const sx = toSX(st.x), sy = toSY(st.y, 3);
    if (!onScreen(sx, sy, 50)) return;
    const L = bodyLight(st.x, st.y);
    const spin = time * (st.type === 'ring' ? 0.22 : 0.32);
    const R = st.size;
    const back = [], front = [];
    const shade = (wx, wy) => { const c = camVec(wx, wy); return clamp(0.25 + 0.75 * Math.max(0, c[0] * L[0] + c[1] * L[1] + c[2] * L[2]) + 0.15, 0, 1); };

    if (st.type === 'ring') {
      const n = Math.round((R * TAU) / 1.4);
      for (let i = 0; i < n; i++) {
        const a = spin + (i / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const seg = { x: sx + ca * R, y: sy + sa * R * SIN_E, s: shade(ca, sa), win: i % 5 === 0, kind: 'seg' };
        (sa < 0 ? back : front).push(seg);
      }
      for (let k = 0; k < 4; k++) {
        const a = spin + k * (Math.PI / 2), ca = Math.cos(a), sa = Math.sin(a);
        const pts = [];
        for (let t = st.hub / R; t < 0.95; t += 1 / R) pts.push([sx + ca * R * t, sy + sa * R * SIN_E * t]);
        (sa < 0 ? back : front).push({ kind: 'spoke', pts });
      }
    } else {
      for (let k = 0; k < 3; k++) {
        const a = spin + (k / 3) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const pts = [];
        for (let t = 0.45; t < 0.8; t += 1 / R) pts.push([sx + ca * R * t, sy + sa * R * SIN_E * t]);
        const item = { kind: 'module', x: sx + ca * R, y: sy + sa * R * SIN_E, s: shade(ca, sa), pts, k };
        (sa < 0 ? back : front).push(item);
      }
    }
    const drawItem = it => {
      if (it.kind === 'seg') {
        const c = grad(HULL, it.s);
        px(it.x - 1, it.y - 1, rgb(c), 2, 2);
        if (it.win && it.s > 0.3) px(it.x, it.y - 1, '#ffe08a');
      } else if (it.kind === 'spoke') {
        for (const [x, y] of it.pts) px(x, y, '#8a93ad');
      } else if (it.kind === 'module') {
        for (const [x, y] of it.pts) px(x, y, '#8a93ad');
        const c = grad(HULL, it.s), d = grad(HULL, it.s * 0.6);
        px(it.x - 3, it.y - 2, rgb(d), 7, 5);
        px(it.x - 3, it.y - 2, rgb(c), 6, 4);
        px(it.x - 2, it.y - 3, rgb(c), 4, 1);
        px(it.x - 1, it.y - 1, it.k === 0 ? '#ffb36b' : '#ffe08a', 2, 1);
      }
    };
    back.sort((p, q) => (p.y || 0) - (q.y || 0)).forEach(drawItem);

    // Mast mit Antenne, Solarpaneele
    const top = sy - st.hub - (st.type === 'ring' ? 8 : 9);
    px(sx, top, '#9aa4bc', 1, sy - top);
    if (st.type === 'ring') {
      const py = sy - st.hub - 3;
      px(sx - R - 3, py + 1, '#6b7590', R + 3 - st.hub, 1);
      px(sx + st.hub, py + 1, '#6b7590', R + 3 - st.hub, 1);
      drawPanel(sx - R - 13, py, 10);
      drawPanel(sx + R + 3, py, 10);
    } else {
      drawPanel(sx - 10, top + 2, 8);
      drawPanel(sx + 2, top + 2, 8);
    }
    // Kern
    renderSphere(st.spr, st.hub, st, L);
    ctx.drawImage(st.spr.cv, Math.round(sx - st.spr.D / 2), Math.round(sy - st.spr.D / 2));
    // Blinklichter
    const blink = (time + st.orbit * 0.01) % 1.6;
    if (blink < 0.35) {
      ctx.globalAlpha = 0.35; px(sx - 1, top - 1, '#ff5a5a', 3, 3); ctx.globalAlpha = 1;
      px(sx, top, '#ff7a7a');
    } else {
      px(sx, top, '#7a2a2a');
    }
    if ((time * 0.8 + 0.5) % 2 < 0.25) px(sx + (st.type === 'ring' ? R + 13 : 10), top + 2, '#7dffb0');
    front.sort((p, q) => (p.y || 0) - (q.y || 0)).forEach(drawItem);
  }

  /** Kristall: schwebender, sich drehender Edelstein mit Facetten */
  const CRYSTAL_PROFILE = [0.25, 0.6, 0.9, 1, 1, 0.8, 0.6, 0.4, 0.2]; // halbe Breite je Zeile, oben -> unten
  function drawCoin(c) {
    const bob = Math.sin(time * 1.6 + c.phase) * 1.2;
    const sx = toSX(c.x), sy = toSY(c.y, 6 + bob);
    if (!onScreen(sx, sy, 10)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const spin = Math.cos(time * 1.7 + c.phase);
    const hw = 1.5 + Math.abs(spin) * 2.2;
    const front = spin > 0;
    // weicher Schein
    ctx.globalAlpha = 0.18 + 0.08 * Math.sin(time * 2 + c.phase);
    px(x - 4, y - 4, '#7fe0ff', 9, 9);
    ctx.globalAlpha = 1;
    for (let i = 0; i < CRYSTAL_PROFILE.length; i++) {
      const dy = i - 4;
      const w = Math.max(0, Math.round(hw * CRYSTAL_PROFILE[i]));
      px(x - w - 1, y + dy, '#123a6a', w * 2 + 3, 1); // Kontur
    }
    for (let i = 0; i < CRYSTAL_PROFILE.length; i++) {
      const dy = i - 4;
      const w = Math.max(0, Math.round(hw * CRYSTAL_PROFILE[i]));
      const upper = dy < 0;
      // linke und rechte Facette tauschen beim Drehen die Helligkeit
      const lite = upper ? '#e6fdff' : '#9fe8ff';
      const dark = upper ? '#4ab8f0' : '#2a7fd0';
      px(x - w, y + dy, front ? lite : dark, w, 1);
      px(x, y + dy, front ? dark : lite, w + 1, 1);
      px(x, y + dy, upper ? '#c8f6ff' : '#5fc8ff', 1, 1); // Mittelgrat
    }
    px(x - 1, y - 2, '#ffffff');
    const sp = (time * 0.5 + c.phase) % 3;
    if (sp < 0.3) {
      ctx.globalAlpha = 1 - sp / 0.3;
      px(x + 3, y - 7, '#ffffff', 1, 3);
      px(x + 2, y - 6, '#ffffff', 3, 1);
      ctx.globalAlpha = 1;
    }
  }

  /** Verlorener Frachtcontainer: kleine Kiste mit Blinklicht, taumelt leicht */
  function drawCrate(c) {
    const bob = Math.sin(time * 1.1 + c.phase) * 1.5;
    const sx = toSX(c.x), sy = toSY(c.y, 6 + bob);
    if (!onScreen(sx, sy, 10)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const tilt = Math.sin(time * 0.6 + c.phase) > 0 ? 1 : 0; // langsames Kippen
    // im Urlaubssystem: lila Container mit gelbem Streifen
    const K = c.res ? ['#4a2a6a', '#a86ad0', '#7a48a8', '#d0a0f0', '#ffd84a', '#c8a030', '#f0d0ff']
      : ['#7a3a12', '#e07b2c', '#b85a1e', '#f5a35a', '#3a8aa8', '#2a6a86', '#ffc285'];
    px(x - 4, y - 3 + tilt, K[0], 9, 7);              // Kontur
    px(x - 3, y - 2 + tilt, K[1], 4, 5);              // linke Seite
    px(x + 1, y - 2 + tilt, K[2], 3, 5);              // rechte Seite (Schatten)
    px(x - 3, y - 2 + tilt, K[3], 7, 1);              // Deckelkante
    px(x - 3, y + tilt, K[4], 4, 1);                  // Streifen
    px(x + 1, y + tilt, K[5], 3, 1);
    px(x - 4, y - 4 + tilt, K[0], 9, 1);
    px(x - 3, y - 4 + tilt, K[6], 7, 1);              // Deckel
    const on = (time + c.phase) % 1.4 < 0.3;
    px(x, y - 5 + tilt, on ? '#ff6a6a' : '#7a2a2a');
    if (on) { ctx.globalAlpha = 0.3; px(x - 1, y - 6 + tilt, '#ff6a6a', 3, 3); ctx.globalAlpha = 1; }
  }

  /** Komet: heller Kopf mit Schweif, der von der Sonne weg zeigt */
  function drawComet(c) {
    const sx = toSX(c.x), sy = toSY(c.y, 6);
    if (!onScreen(sx, sy, 50)) return;
    const rx = c.x - (c.cx || 0), ry = c.y - (c.cy || 0);
    const d = Math.hypot(rx, ry) || 1;
    const ax = rx / d, ay = ry / d;                   // weg von der Sonne
    const sp = Math.hypot(c.vx, c.vy) || 1;
    const bx = -c.vx / sp, by = -c.vy / sp;           // entgegen der Flugrichtung
    const len = 34 + 26 * Math.min(1, 160 / d);       // nah an der Sonne länger
    for (let i = 1; i < len; i++) {
      const t = i / len;
      // Ionenschweif (bläulich, gerade von der Sonne weg), vorne zwei Pixel breit
      const ix = toSX(c.x + ax * i), iy = toSY(c.y + ay * i, 6);
      ctx.globalAlpha = 0.75 * (1 - t);
      px(ix, iy, t < 0.25 ? '#ffffff' : t < 0.55 ? '#bfe8ff' : '#7fc8ff', t < 0.4 ? 2 : 1, 1);
      // Staubschweif (warmweiß, leicht entlang der Bahn gebogen)
      if (i % 2 === 0) {
        const mx = ax * 0.6 + bx * 0.4, my = ay * 0.6 + by * 0.4;
        ctx.globalAlpha = 0.45 * (1 - t);
        px(toSX(c.x + mx * i * 0.8), toSY(c.y + my * i * 0.8, 6), '#fff4e0');
      }
    }
    const x = Math.round(sx), y = Math.round(sy);
    const pulse = 0.5 + 0.5 * Math.sin(time * 6 + c.id);
    ctx.globalAlpha = 0.15 + 0.1 * pulse;
    px(x - 5, y - 5, '#9fe0ff', 11, 11);
    ctx.globalAlpha = 0.45;
    px(x - 3, y - 2, '#cfefff', 7, 5); px(x - 2, y - 3, '#cfefff', 5, 7);
    ctx.globalAlpha = 1;
    px(x - 1, y - 2, '#ffffff', 3, 5); px(x - 2, y - 1, '#ffffff', 5, 3);
    if (pulse > 0.8) { px(x, y - 5, '#ffffff', 1, 2); px(x, y + 4, '#ffffff', 1, 2); px(x - 5, y, '#ffffff', 2, 1); px(x + 4, y, '#ffffff', 2, 1); }
  }

  /** Raumschiffwrack, solange die Entität darin wohnt mit geisterhaftem Schimmer */
  function drawWreck() {
    const sx = toSX(WRECK.x), sy = toSY(WRECK.y, 4);
    if (!onScreen(sx, sy, 70)) return;
    const S = wreckSprite;
    ctx.drawImage(S.cv, Math.round(sx - S.Wd / 2), Math.round(sy - S.Ht / 2));
    if (quests.elixier !== 'done') {
      const p = 0.5 + 0.5 * Math.sin(time * 1.4);
      ctx.globalAlpha = 0.12 + 0.12 * p;
      px(sx - 30 + Math.sin(time * 0.7) * 6, sy - 8, '#bff6ff', 9, 9);
      ctx.globalAlpha = 0.35 + 0.35 * p;
      px(sx - 27 + Math.sin(time * 0.7) * 6, sy - 5, '#e8fdff', 3, 3);
      ctx.globalAlpha = 1;
    }
    if ((time % 2.4) < 0.3) px(sx + 22, sy - 14, '#7fe0ff');
  }

  /** Alien-Relikt: schwebender, türkis leuchtender Kristallkörper mit kreisenden Funken */
  function drawAlien(o) {
    const bob = Math.sin(time * 1.5 + o.phase) * 1.5;
    const sx = toSX(o.x), sy = toSY(o.y, 8 + bob);
    if (!onScreen(sx, sy, 16)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const glow = 0.5 + 0.5 * Math.sin(time * 2.4 + o.phase);
    ctx.globalAlpha = 0.14 + 0.14 * glow;
    px(x - 7, y - 7, '#5affc8', 15, 15);
    ctx.globalAlpha = 1;
    const rows = ['...#...', '..#+#..', '.#+*+#.', '#+***+#', '.#+*+#.', '..#+#..', '...#...'];
    const col = { '#': '#0a1e1a', '+': '#2ac8a0', '*': glow > 0.5 ? '#e8fff8' : '#9affe0' };
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(x - 3 + i, y - 3 + j, col[ch]); }));
    for (let k = 0; k < 3; k++) {
      const a = time * 1.8 + o.phase + (k * TAU) / 3;
      px(x + Math.cos(a) * 8, y + Math.sin(a) * 4, '#bfffe8');
    }
  }

  /** Schiffsteil: verbogene Metallplatte mit orangem Streifen */
  function drawPart(p) {
    const bob = Math.sin(time * 1.2 + p.phase) * 1.2;
    const sx = toSX(p.x), sy = toSY(p.y, 6 + bob);
    if (!onScreen(sx, sy, 12)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const t = ((time * 0.8 + p.phase) % TAU) < Math.PI ? 0 : 1;
    px(x - 4, y - 3, '#0c0a12', 9, 7);
    px(x - 3, y - 2, t ? '#9aa0ae' : '#b4b8c4', 7, 5);
    px(x - 3, y, '#ff7a3a', 7, 1);
    px(x - 2, y - 1, '#4a4e5a'); px(x + 2, y + 1, '#4a4e5a');
    if (p.v === 1) px(x + 3, y - 4, '#0c0a12', 2, 2);
    if (p.v === 2) px(x - 5, y + 1, '#9aa0ae', 2, 1);
  }

  function drawStorm(b) {
    // Blitze in den Gewitterwolken des Dunklen Planeten
    if (!b.flash || b.flash <= 0) {
      if (Math.random() < 0.012) { b.flash = 0.2; b.fx = (Math.random() - 0.5) * b.r * 1.2; b.fy = (Math.random() - 0.5) * b.r; }
      return;
    }
    b.flash -= 1 / 60;
    const sx = Math.round(toSX(b.x) + b.fx), sy = Math.round(toSY(b.y) + b.fy);
    ctx.globalAlpha = 0.25;
    px(sx - 5, sy - 5, '#c8d0ff', 11, 11);
    ctx.globalAlpha = 1;
    px(sx, sy - 3, '#f4f6ff'); px(sx + 1, sy - 2, '#f4f6ff'); px(sx, sy - 1, '#f4f6ff'); px(sx + 1, sy, '#f4f6ff'); px(sx, sy + 1, '#dfe6ff');
  }

  /** Schiffe verdrängen den Nebel ein wenig; danach zieht er sich langsam wieder zusammen. */
  const FOG_PUSH_R = 58, FOG_PUSH = 34;
  function updateFog(dt) {
    const movers = [ship];
    for (const n of npcs) if (!n.hidden && Math.hypot(n.x - ZONE.x, n.y - ZONE.y) < ZONE.r + 900) movers.push(n);
    if (!movers.some(m => Math.hypot(m.x - ZONE.x, m.y - ZONE.y) < ZONE.d1)) {
      // niemand in der Nähe: nur zurückfließen lassen
      for (const list of [fogBack, fogFront]) for (const f of list) { const k = Math.min(1, dt * 0.45); f.dx -= f.dx * k; f.dy -= f.dy * k; }
      return;
    }
    for (const list of [fogBack, fogFront]) for (const f of list) {
      let tx = 0, ty = 0;
      for (const m of movers) {
        const ex = f.x - m.x, ey = f.y - m.y, d = Math.hypot(ex, ey);
        if (d >= FOG_PUSH_R || d < 0.01) continue;
        const s = (1 - d / FOG_PUSH_R) * FOG_PUSH * (0.4 + 0.6 * Math.min(1, m.speed / 30));
        tx += (ex / d) * s; ty += (ey / d) * s;
      }
      // schnell ausweichen, langsam nachbilden
      const out = tx * tx + ty * ty > f.dx * f.dx + f.dy * f.dy;
      const k = Math.min(1, dt * (out ? 5 : 0.45));
      f.dx += (tx - f.dx) * k; f.dy += (ty - f.dy) * k;
    }
  }
  function drawFogLayer(list, alphaInner, alphaWall) {
    for (const f of list) {
      const spr = fogSprites[f.p][f.s];
      const sx = toSX(f.x + f.dx + Math.sin(time * 0.15 + f.ph) * 7), sy = toSY(f.y + f.dy + Math.cos(time * 0.12 + f.ph) * 7);
      if (!onScreen(sx, sy, spr.R + 4)) continue;
      const thin = 1 - Math.min(0.85, Math.hypot(f.dx, f.dy) / FOG_PUSH);
      ctx.globalAlpha = (f.wall ? alphaWall : alphaInner) * thin * (f.fade ?? 1);
      ctx.drawImage(spr.cv, Math.round(sx - spr.R), Math.round(sy - spr.R));
    }
    ctx.globalAlpha = 1;
  }
  /** Nebel hinter den Objekten, dazu ein leichter Farbschleier, solange man im Nebel ist */
  function drawFogBack() {
    const f = clamp((ZONE.r + 60 - Math.hypot(cam.x - ZONE.x, cam.y - ZONE.y)) / 160, 0, 1);
    if (f > 0) { ctx.globalAlpha = 0.22 * f; ctx.fillStyle = '#123a24'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    drawFogLayer(fogBack, 0.55, 0.55);
  }
  function drawFog() { drawFogLayer(fogFront, 0.2, 0.85); }

  /** Wurmloch: wirbelnde Ringe in Violett und Türkis mit hellem Kern */
  function drawWormhole(p, s) {
    const sx = toSX(p.x), sy = toSY(p.y, 4);
    if (!onScreen(sx, sy, 40) || s <= 0) return;
    const cols = ['#3a1a6a', '#6a3ab0', '#a87aff', '#7fe0ff', '#e8fdff'];
    for (let k = 0; k < 5; k++) {
      const r = 24 * s * (1 - k * 0.17), n = Math.max(6, Math.round(r * 2.6));
      const dir = k % 2 ? -1 : 1;
      ctx.globalAlpha = 0.45 + k * 0.1;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + time * (1.2 + k * 0.5) * dir;
        const wob = 1 + 0.08 * Math.sin(a * 3 + time * 2);
        px(sx + Math.cos(a) * r * wob, sy + Math.sin(a) * r * SIN_E * wob * 1.2, cols[k], k < 2 ? 2 : 1, 1);
      }
    }
    ctx.globalAlpha = 0.85;
    px(sx - 3 * s, sy - 1, '#0a0614', Math.max(1, 6 * s), 3);
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 4);
    px(sx, sy, '#ffffff');
    ctx.globalAlpha = 1;
  }

  /** Relikt: alte Steintafel mit leuchtenden Zeichen */
  function drawRelic(r) {
    const bob = Math.sin(time * 1.3 + r.phase) * 1.2;
    const sx = toSX(r.x), sy = toSY(r.y, 6 + bob);
    if (!onScreen(sx, sy, 12)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const glow = 0.5 + 0.5 * Math.sin(time * 2 + r.phase);
    ctx.globalAlpha = 0.12 + 0.12 * glow;
    px(x - 5, y - 6, '#b98aff', 11, 13);
    ctx.globalAlpha = 1;
    px(x - 3, y - 4, '#1e1828', 7, 9);                 // Kontur
    px(x - 2, y - 3, '#6a5a78', 5, 7);                 // Stein
    px(x - 2, y - 3, '#9a8aa8', 5, 1);                 // Oberkante
    px(x + 2, y - 2, '#4a3e58', 1, 6);                 // Schatten
    ctx.globalAlpha = 0.6 + 0.4 * glow;
    const gc = '#9ff0ff';
    px(x - 1, y - 1, gc); px(x + 1, y - 1, gc); px(x, y, gc); px(x - 1, y + 2, gc); px(x + 1, y + 1, gc);
    ctx.globalAlpha = 1;
  }

  /** Quest-Hinweise: »!« über Auftraggebern, Raute über Zielplaneten */
  function drawQuestMarkers() {
    const bounce = Math.round(Math.sin(time * 3) * 1.5);
    const bang = (x, y) => {
      x = Math.round(x); y = Math.round(y) + bounce;
      px(x - 1, y - 7, '#1a1204', 4, 10);
      px(x, y - 6, '#ffd84a', 2, 5);
      px(x, y + 1, '#ffd84a', 2, 1);
    };
    for (const n of npcs) {
      if (n.hidden || n.state === 'drift') continue;
      const wants = n.dealer
        ? relicsGiven < RELIC_TOTAL && (!dealerMet || relicsFound.size > relicsGiven)
        : n === gwynnNpc ? chapter >= 3 && quests.alien === 'open'
        : n.texts.talk ? false : quests[currentQuest(n.texts).quest] === 'open';
      if (!wants) continue;
      const sx = toSX(n.x), sy = toSY(n.y, 4);
      if (onScreen(sx, sy, 20)) bang(sx, sy - 13);
    }
    for (const st of STATIONS) {
      const t = TEXTS.stations[st.id];
      if (!t || quests[currentQuest(t).quest] !== 'open') continue;
      const sx = toSX(st.x), sy = toSY(st.y, 3);
      if (onScreen(sx, sy, 30)) bang(sx, sy - st.hub - 18);
    }
    const zx = toSX(WRECK.x), zy = toSY(WRECK.y, 4);
    if (quests.elixier === 'open' && onScreen(zx, zy, 40)) bang(zx, zy - 30);
    const dx = toSX(DARK.x), dy = toSY(DARK.y);
    if (quests.teile === 'open' && onScreen(dx, dy, 40)) bang(dx, dy - DARK.r - 14);
    const targets = [];
    for (const [id, state] of Object.entries(quests)) {
      if (state !== 'active' || !TEXTS.items[id]) continue;
      const b = BODIES.find(o => o.id === TEXTS.items[id].target);
      if (b) targets.push([toSX(b.x), toSY(b.y) - b.r - 7]);
    }
    if (quests.elixier === 'active') { const b = BODIES.find(o => o.id === TEXTS.zone.elixir.from); targets.push([toSX(b.x), toSY(b.y) - b.r - 7]); }
    if (quests.elixier === 'carrying') targets.push([zx, zy - 28]);
    if (quests.teile === 'active' && partsFound >= PART_TOTAL) targets.push([dx, dy - DARK.r - 7]);
    for (const [tx, ty] of targets) {
      const sx = Math.round(tx), sy = Math.round(ty) + bounce;
      if (!onScreen(sx, sy, 10)) continue;
      px(sx - 1, sy - 3, '#1a1204', 3, 7); px(sx - 3, sy - 1, '#1a1204', 7, 3);
      px(sx, sy - 2, '#7fe0ff', 1, 5); px(sx - 2, sy, '#7fe0ff', 5, 1); px(sx - 1, sy - 1, '#7fe0ff', 3, 3);
      px(sx, sy - 1, '#ffffff');
    }
  }

  /** Energiestrahl aus dem Heck: Länge wächst mit der Geschwindigkeit. */
  function drawBeam(agent, sx, sy, eng) {
    const f = clamp(agent.speed / (agent === ship ? maxSpeed() : SHIP_MAX_SPEED), 0, 1);
    if (f < 0.04) return;
    let bx = -Math.cos(agent.heading), by = -Math.sin(agent.heading) * SIN_E;
    const bl = Math.hypot(bx, by) || 1;
    bx /= bl; by /= bl;
    const cols = agent.beam;
    const boost = agent === ship ? 1 + speedBonus : 1;
    const len = Math.max(2, (agent.beamLen * boost * (0.35 + 0.65 * f)) * (0.9 + Math.random() * 0.2));
    const nx = -by, ny = bx; // Querachse für die Strahlbreite
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const c = cols[Math.min(cols.length - 1, Math.floor(t * cols.length))];
      const x = sx + eng.ex + bx * i, y = sy + eng.ey + by * i;
      ctx.globalAlpha = 1 - t * 0.55;
      px(x, y, c);
      if (agent === ship && t < 0.45) {
        // breiter, leuchtender Kern
        ctx.globalAlpha = 0.55 * (1 - t / 0.45);
        px(x + nx, y + ny, cols[Math.min(cols.length - 1, 2 + Math.floor(t * 4))]);
        px(x - nx, y - ny, cols[Math.min(cols.length - 1, 2 + Math.floor(t * 4))]);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawAgent(agent) {
    const bob = Math.sin(time * 1.8 + (agent.idx || 0) * 2) * 0.8;
    const sx = toSX(agent.x), sy = toSY(agent.y, 4 + bob);
    if (!onScreen(sx, sy, 40)) return;
    const Lb = sunLight(agent.x, agent.y);
    const Ls = [Lb[0] * 0.7, Lb[1] * 0.7 - COS_E * 0.6, Lb[2] * 0.7 + SIN_E * 0.6]; // Sonne + etwas Licht von oben
    const ll = Math.hypot(...Ls);
    const eng = renderModel(agent.spr, agent.model, agent.colors, agent.heading, agent.bank, Ls.map(v => v / ll));
    const beamBehind = Math.sin(agent.heading) > 0; // Schiff fliegt auf uns zu -> Strahl hinter dem Rumpf
    if (beamBehind) drawBeam(agent, sx, sy, eng);
    const SB = agent.spr.SB;
    ctx.drawImage(agent.spr.cv, Math.round(sx - SB / 2), Math.round(sy - SB / 2));
    if (!beamBehind) drawBeam(agent, sx, sy, eng);
  }

  function drawParticles() {
    for (const p of particles) {
      const sx = toSX(p.x), sy = toSY(p.y, p.z);
      if (!onScreen(sx, sy, 2)) continue;
      const t = p.life / p.max;
      if (p.kind !== 'trail') {
        const pc = { gold: ['#e6fdff', '#5fd3ff'], crate: ['#ffd0a0', '#e07b2c'], comet: ['#ffffff', '#9fe0ff'], relic: ['#e8d8ff', '#a87aff'] }[p.kind] || ['#ffffff', '#cccccc'];
        ctx.fillStyle = t < 0.4 ? pc[0] : pc[1];
        ctx.globalAlpha = 1 - t;
      } else {
        ctx.fillStyle = p.cols[t < 0.2 ? 0 : t < 0.5 ? 1 : 2];
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
    for (const b of BODIES) {
      const gl = resortGlows[b.id];
      if (!gl) continue;
      const gx = toSX(b.x), gy = toSY(b.y);
      if (onScreen(gx, gy, gl.R)) ctx.drawImage(gl.cv, Math.round(gx - gl.R), Math.round(gy - gl.R));
    }
    ctx.globalAlpha = 1;

    drawFogBack();
    drawMarkers();
    drawParticles();

    // alles Räumliche nach Tiefe (Welt-y) sortiert zeichnen
    drawList.length = 0;
    for (const b of BODIES) {
      drawList.push({ y: b.y, k: 0, o: b });
      if (b.moons) for (const m of b.moons) drawList.push({ y: m.y, k: 1, o: m });
    }
    for (const st of STATIONS) drawList.push({ y: st.y, k: 5, o: st });
    for (const c of coins) if (!c.taken) drawList.push({ y: c.y, k: 2, o: c });
    for (const c of crates) if (!c.taken) drawList.push({ y: c.y, k: 6, o: c });
    drawList.push({ y: ship.y, k: 3, o: ship });
    for (const n of npcs) if (!n.hidden) drawList.push({ y: n.y, k: 3, o: n });
    for (const c of allComets) if (c.active && !c.caught) drawList.push({ y: c.y, k: 7, o: c });
    for (const c of resortCrates) if (!c.taken) drawList.push({ y: c.y, k: 6, o: c });
    for (const a of alienRelics) if (a.active && !a.taken) drawList.push({ y: a.y, k: 12, o: a });
    for (const r of relics) if (r.active && !r.taken) drawList.push({ y: r.y, k: 8, o: r });
    drawList.push({ y: WRECK.y, k: 9, o: WRECK });
    if (WH.open) { drawList.push({ y: WH.a.y, k: 11, o: WH.a }); drawList.push({ y: WH.b.y, k: 11, o: WH.b }); }
    for (const p of zoneParts) if (p.active && !p.taken) drawList.push({ y: p.y, k: 10, o: p });
    const rotA = (time * TAU) / BELT_PERIOD;
    for (const a of asteroids) {
      const ang = a.a + rotA;
      if (!a.res && inGate(ang)) continue;
      const x = (a.res ? RESORT.x : 0) + Math.cos(ang) * a.rad, y = (a.res ? RESORT.y : 0) + Math.sin(ang) * a.rad;
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
        case 3: drawAgent(it.o); break;
        case 4: {
          const a = it.o;
          let k = Math.round((((it.ang + Math.PI) % TAU) / TAU) * 8) % 8;
          if (k < 0) k += 8;
          const spr = rocks[a.s - 1][a.v][k];
          ctx.drawImage(spr.cv, Math.round(it.sx - spr.D / 2), Math.round(it.sy - spr.D / 2));
          break;
        }
        case 5: drawStation(it.o); break;
        case 6: drawCrate(it.o); break;
        case 7: drawComet(it.o); break;
        case 8: drawRelic(it.o); break;
        case 9: drawWreck(); break;
        case 11: drawWormhole(it.o, it.o === WH.a ? WH.t : 1); break;
        case 10: drawPart(it.o); break;
        case 12: drawAlien(it.o); break;
      }
    }
    drawFog();
    drawQuestMarkers();
    positionInfo();
    updateLabels();
  }

  // -------------------------------------------------------------------- UI
  const coinBox = document.getElementById('coinBox'), crateBox = document.getElementById('crateBox');
  document.getElementById('coinTotal').textContent = COIN_TOTAL;
  document.getElementById('crateTotal').textContent = CRATE_TOTAL;
  function updateHUD(bump) {
    document.getElementById('coinCount').textContent = collected.size;
    document.getElementById('crateCount').textContent = cratesTaken.size;
    coinBox.classList.toggle('complete', collected.size >= COIN_TOTAL);
    crateBox.classList.toggle('complete', cratesTaken.size >= CRATE_TOTAL);
    const c2 = document.getElementById('crate2Box');
    c2.hidden = chapter < 3;
    document.getElementById('crate2Count').textContent = resCratesTaken;
    c2.classList.toggle('complete', resCratesTaken >= RES_CRATE_TOTAL);
    const el = bump === 'coin' ? coinBox : bump === 'crate' ? crateBox : bump === 'crate2' ? c2 : null;
    if (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }

  const badgeEl = document.getElementById('badges');
  function renderBadges() {
    badgeEl.innerHTML = '';
    for (const id of BADGE_IDS) {
      if (!badges.has(id)) continue;
      const b = TEXTS.badges[id];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'badge' + (id === FINAL_BADGE ? ' top' : '');
      el.title = `${b.name}: ${b.text}`;
      el.setAttribute('aria-label', el.title);
      el.innerHTML = `<img src="${badgeIcon(id)}" alt="">`;
      el.addEventListener('click', () => toast(b.name, esc(b.text)));
      badgeEl.append(el);
    }
  }

  const questEl = document.getElementById('quests');
  function renderQuests() {
    questEl.innerHTML = '';
    const add = html => { const li = document.createElement('li'); li.className = 'box'; li.innerHTML = html; questEl.append(li); };
    for (const [id, state] of Object.entries(quests)) {
      if (state !== 'active' || !TEXTS.items[id]) continue;
      const it = TEXTS.items[id];
      add(`<span class="nm">${esc(it.name)}</span> <span class="to">→ <span class="nm">${esc(bodyName(it.target))}</span></span>`);
    }
    if (quests.alien === 'active') {
      add(`<span class="nm">${esc(TEXTS.questList.alien)}</span> <span class="to">${aliensFound} / ${ALIEN_TOTAL}</span>`);
    }
    if (quests.kometen === 'active') {
      add(`<span class="nm">${esc(TEXTS.questList.comets)}</span> <span class="to">${cometsCaught} / ${COMET_TOTAL}</span>`);
    }
    if (quests.elixier === 'active') {
      add(`<span class="nm">${esc(TEXTS.zone.elixir.name)}</span> <span class="to">aus <span class="nm">${esc(bodyName(TEXTS.zone.elixir.from))}</span> holen</span>`);
    }
    if (quests.elixier === 'carrying') {
      add(`<span class="nm">${esc(TEXTS.zone.elixir.name)}</span> <span class="to">→ <span class="nm">${esc(bodyName('wreck'))}</span></span>`);
    }
    if (quests.teile === 'active') {
      add(`<span class="nm">${esc(TEXTS.zone.partsName)}</span> <span class="to">${partsFound} / ${PART_TOTAL} → <span class="nm">${esc(bodyName('dark'))}</span></span>`);
    }
    if (round >= 2 && relicsGiven < RELIC_TOTAL && (dealerMet || relicsFound.size > 0)) {
      add(`<span class="nm">${esc(TEXTS.questList.relics)}</span> <span class="to">${relicsFound.size} / ${RELIC_TOTAL} → <span class="nm">${esc(TEXTS.dealer.name)}</span></span>`);
    }
  }

  // großer Text im Bild beim Einsammeln
  const pickupEl = document.getElementById('pickup');
  function pickupText(text, sub) {
    pickupEl.innerHTML = `<span class="main">${esc(text)}</span>` + (sub ? `<span class="sub">${esc(sub)}</span>` : '');
    pickupEl.classList.remove('show');
    void pickupEl.offsetWidth;
    pickupEl.classList.add('show');
  }

  const info = document.getElementById('info');
  // Ortsinfo erscheint direkt am Objekt, um das man kreist (oder neben dem man treibt)
  let infoTarget = null;
  function infoFor(o) {
    if (!o) return null;
    if (o.texts) return { kicker: '', name: o.texts.name, body: o.texts.desc || '' };   // Raumschiff
    if (o.station) { const t = TEXTS.stations[o.id]; return t ? { kicker: '', name: t.name, body: t.desc || '' } : null; }
    return TEXTS.bodies[o.id] || null;
  }
  /** Bildschirmposition eines Objekts: [x, Oberkante, Unterkante] in Spielpixeln */
  function objScreen(o) {
    if (o.texts) { const sx = toSX(o.x), sy = toSY(o.y, 4); return [sx, sy - 12, sy + 9]; }
    if (o.station) { const sx = toSX(o.x), sy = toSY(o.y, 3); return [sx, sy - o.hub - 16, sy + o.size * SIN_E + 5]; }
    if (o.id === 'wreck') { const sx = toSX(o.x), sy = toSY(o.y, 4); return [sx, sy - 28, sy + 24]; }
    const sx = toSX(o.x), sy = toSY(o.y); return [sx, sy - o.r - 6, sy + o.r + 4];
  }
  function showInfo(o) {
    const t = infoFor(o);
    if (!t) return;
    info.querySelector('.kicker').textContent = t.kicker || '';
    info.querySelector('.name').textContent = t.name || '';
    info.querySelector('.body').textContent = t.body || '';
    infoTarget = o;
    info.classList.add('show');
    positionInfo();
  }
  function hideInfo() { info.classList.remove('show'); infoTarget = null; }
  function positionInfo() {
    if (!infoTarget) return;
    const [sx, top, bottom] = objScreen(infoTarget);
    const k = 1 / pxPerCss, h = info.offsetHeight, w = info.offsetWidth;
    let x = clamp(sx * k, w / 2 + 8, window.innerWidth - w / 2 - 8);
    let y = top * k - 18;                                 // über dem Objekt (Platz für »!«)
    if (y - h < 70) y = bottom * k + 12 + h;              // zu weit oben: unter das Objekt
    info.style.left = x + 'px';
    info.style.top = y + 'px';
  }

  // Namensschilder an Planeten, Stationen und Schiffen in der Nähe
  const labelsEl = document.getElementById('labels');
  const labelPool = new Map();
  const LABEL_NEAR = 190;
  function updateLabels() {
    const seen = new Set();
    const cands = [...BODIES, ...STATIONS, WRECK, ...npcs.filter(n => !n.hidden)];
    for (const o of cands) {
      if (o === infoTarget) continue;
      const d = Math.hypot(o.x - ship.x, o.y - ship.y);
      if (d > LABEL_NEAR) continue;
      const t = infoFor(o);
      if (!t || !t.name) continue;
      const [sx, , bottom] = objScreen(o);
      if (!onScreen(sx, bottom, 20)) continue;
      let el = labelPool.get(o);
      if (!el) { el = document.createElement('div'); el.className = 'label'; labelsEl.append(el); labelPool.set(o, el); }
      if (el.textContent !== t.name) el.textContent = t.name;
      el.style.left = sx / pxPerCss + 'px';
      el.style.top = (bottom + 2) / pxPerCss + 'px';
      el.style.opacity = d < LABEL_NEAR - 40 ? 1 : (LABEL_NEAR - d) / 40;
      seen.add(o);
    }
    for (const [o, el] of labelPool) if (!seen.has(o)) el.style.opacity = 0;
  }

  // --- grobe Pixel-Astronauten (16 × 18 Pixel), aus »look« in texts.js gezeichnet
  const portraitCache = {};
  function portrait(id) {
    if (portraitCache[id]) return portraitCache[id];
    const c = TEXTS.characters[id] || {};
    const L = Object.assign({ suit: '#ff2fa0', helmet: true, visor: '#ffd84a', skin: '#f1c7a0', hair: '#2a1a12', hairStyle: 'short' }, c.look || {});
    const GW = 16, GH = 18;
    const grid = Array.from({ length: GH }, () => Array(GW).fill(null));
    const set = (x, y, col) => { if (x >= 0 && x < GW && y >= 0 && y < GH) grid[y][x] = col; };
    const rect = (x0, y0, w, h, col) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, col); };
    const dark = '#0c0a14';
    const shade = (hexc, k) => { const v = hex(hexc).map(n => Math.max(0, Math.min(255, Math.round(n * k)))); return `rgb(${v[0]},${v[1]},${v[2]})`; };
    const suitD = shade(L.suit, 0.72), suitL = shade(L.suit, 1.25);
    const white = '#eef0f6', grey = '#a8b0c4', greyD = '#6a7290';

    if (L.ghost) {
      // körperlose, leuchtende Gestalt mit wehendem Saum
      const g1 = '#e8fdff', g2 = '#9fe8ff', g3 = '#5ab8e8';
      rect(4, 2, 8, 8, g2); rect(3, 3, 10, 6, g2); rect(5, 1, 6, 1, g2);
      rect(5, 3, 6, 5, g1);
      rect(4, 10, 8, 4, g2); rect(5, 14, 6, 2, g2);
      set(4, 14, g3); set(6, 16, g3); set(9, 16, g3); set(11, 14, g3); set(7, 17, g3);
      set(6, 6, '#1a3a5a'); set(9, 6, '#1a3a5a');
      rect(6, 11, 4, 2, g1);
    } else {
    // Rucksack hinter dem Körper
    rect(2, 12, 1, 5, greyD); rect(13, 12, 1, 5, greyD);
    // Anzug
    rect(3, 12, 10, 6, L.suit);
    rect(3, 12, 2, 2, white); rect(11, 12, 2, 2, white);      // Schulterpolster
    rect(3, 14, 1, 3, suitD); rect(12, 14, 1, 3, suitD);       // Arme (Schatten)
    rect(3, 17, 1, 1, grey); rect(12, 17, 1, 1, grey);         // Handschuhe
    rect(6, 13, 4, 3, white);                                   // Brustmodul
    set(6, 14, '#ff4a4a'); set(7, 14, '#4aff8a'); set(8, 14, '#ffd84a'); set(9, 14, greyD);
    rect(6, 15, 4, 1, grey);
    rect(4, 17, 8, 1, suitD);                                   // Gürtel
    set(5, 12, suitL); set(10, 12, suitL);
    // Halsring
    rect(5, 11, 6, 1, grey);

    if (L.helmet) {
      // runder Helm mit farbigem, spiegelndem Visier
      rect(4, 1, 8, 10, white);
      rect(3, 2, 1, 8, white); rect(12, 2, 1, 8, white);
      set(4, 1, null); set(11, 1, null);
      rect(5, 3, 6, 6, L.visor);
      rect(4, 4, 1, 4, L.visor); rect(11, 4, 1, 4, L.visor);
      rect(5, 8, 6, 1, shade(L.visor, 0.7)); rect(10, 4, 1, 4, shade(L.visor, 0.8));
      set(5, 4, '#ffffff'); set(6, 3, '#ffffff'); set(5, 5, '#ffffff'); // Spiegelung
      set(12, 5, grey); set(12, 6, '#ff4a4a');                         // Helmlampe
      rect(4, 10, 8, 1, grey);
    } else {
      // Kopf ohne Helm
      rect(5, 4, 6, 7, L.skin);
      set(5, 4, null); set(10, 4, null);
      set(6, 7, dark); set(9, 7, dark);                 // Augen
      set(7, 9, shade(L.skin, 0.75)); set(8, 9, shade(L.skin, 0.75)); // Mund
      set(4, 7, L.skin); set(11, 7, L.skin);            // Ohren
      const H = L.hair;
      if (L.hairStyle === 'short') { rect(5, 3, 6, 2, H); set(5, 5, H); set(10, 5, H); }
      if (L.hairStyle === 'long') { rect(5, 3, 6, 2, H); rect(4, 4, 1, 7, H); rect(11, 4, 1, 7, H); set(5, 5, H); set(10, 5, H); }
      if (L.hairStyle === 'bun') { rect(5, 3, 6, 2, H); rect(6, 1, 4, 2, H); set(5, 5, H); set(10, 5, H); }
      if (L.hairStyle === 'mohawk') { rect(7, 1, 2, 4, H); }
      if (L.hairStyle === 'bald') { set(6, 4, shade(L.skin, 1.1)); }
      // Headset
      set(4, 6, greyD); set(4, 8, greyD); set(5, 9, greyD);
    }

    }
    // Kontur
    const cv = document.createElement('canvas');
    cv.width = GW + 2; cv.height = GH + 2;
    const cx = cv.getContext('2d');
    const filled = (x, y) => y >= 0 && y < GH && x >= 0 && x < GW && grid[y][x];
    if (L.ghost) cx.globalAlpha = 0.85;
    cx.fillStyle = L.ghost ? '#3a8ac0' : dark;
    for (let y = -1; y <= GH; y++) for (let x = -1; x <= GW; x++) {
      if (filled(x, y)) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) cx.fillRect(x + 1, y + 1, 1, 1);
    }
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (grid[y][x]) { cx.fillStyle = grid[y][x]; cx.fillRect(x + 1, y + 1, 1, 1); }
    return (portraitCache[id] = cv.toDataURL());
  }

  // --- Dialoge
  const dialogEl = document.getElementById('dialog');
  const figThem = dialogEl.querySelector('.figure.them'), figMe = dialogEl.querySelector('.figure.me');
  const dialog = { open: false, lines: [], idx: 0, onEnd: null, partner: null };

  /** Die Spielfigur (»Du«) spricht immer mit genau einer Figur (partner) – oder allein (partner = null). */
  function openDialog(partner, lines, role, onEnd) {
    if (!lines || !lines.length) { if (onEnd) onEnd(); return; }
    document.body.classList.add('talk');
    dialog.open = true;
    dialog.lines = lines;
    dialog.idx = 0;
    dialog.onEnd = onEnd || null;
    dialog.role = role || '';
    dialog.partner = partner && partner !== TEXTS.player ? partner : null;
    figMe.src = portrait(TEXTS.player);
    figThem.hidden = !dialog.partner;
    if (dialog.partner) figThem.src = portrait(dialog.partner);
    showLine();
    dialogEl.classList.add('show');
  }
  function showLine() {
    const [who, text] = dialog.lines[dialog.idx];
    const c = TEXTS.characters[who] || { name: who, tier: '' };
    const isMe = who === TEXTS.player;
    if (!isMe && who !== dialog.partner) {
      dialog.partner = who;
      figThem.src = portrait(who);
      figThem.hidden = false;
    }
    figThem.classList.toggle('active', !isMe);
    figMe.classList.toggle('active', isMe);
    dialogEl.querySelector('.name').textContent = c.name;
    // unter dem Namen nur der Ort (Schiff, Station oder Planet), keine Funktion
    dialogEl.querySelector('.line').textContent = text;
    dialogEl.classList.toggle('me-speaks', isMe);
    const last = dialog.idx === dialog.lines.length - 1;
    dialogEl.querySelector('.next').textContent = last ? TEXTS.dialogClose : TEXTS.dialogNext;
  }
  function dialogNext() {
    if (!dialog.open) return;
    if (dialog.idx < dialog.lines.length - 1) { dialog.idx++; showLine(); return; }
    dialog.open = false;
    dialogEl.classList.remove('show');
    document.body.classList.remove('talk');
    const cb = dialog.onEnd;
    dialog.onEnd = null;
    if (cb) cb();
    setTimeout(pump, 500);
  }
  dialogEl.querySelector('.next').addEventListener('click', dialogNext);

  // --- Ton-Schalter oben rechts
  const soundBtn = document.getElementById('sound');
  function renderSound() {
    const m = sfx.muted;
    soundBtn.classList.toggle('muted', m);
    soundBtn.setAttribute('aria-pressed', String(!m));
    soundBtn.title = m ? 'Ton an' : 'Ton aus';
    soundBtn.setAttribute('aria-label', soundBtn.title);
  }
  soundBtn.addEventListener('click', () => { sfx.setMuted(!sfx.muted); renderSound(); if (!sfx.muted) sfx.play('crystal'); });
  renderSound();

  // --- Meldungen und Belohnungen: eine Warteschlange, alles nacheinander
  const toastEl = document.getElementById('toasts');
  const reward = document.getElementById('reward');
  const modal = { open: false, current: null };
  const notify = { queue: [], busy: false };
  const TOAST_TIME = 2800;
  /** Einblendung: Titel (groß, ExtraBold) und darunter der Inhalt (HTML, bereits maskiert). */
  function toast(title, bodyHtml, sound) {
    const html = `<div class="t-title">${esc(title)}</div>` + (bodyHtml ? `<div class="t-body">${bodyHtml}</div>` : '');
    notify.queue.push({ type: 'toast', html, sound });
    pump();
  }
  function showModal(m) { notify.queue.push(Object.assign({ type: 'modal' }, m)); pump(); }
  function pump() {
    if (notify.busy || dialog.open || !notify.queue.length) return;
    const it = notify.queue.shift();
    notify.busy = true;
    if (it.type === 'cine') {
      runCine(it);
    } else if (it.type === 'toast') {
      if (it.sound) sfx.play(it.sound);
      const el = document.createElement('div');
      el.className = 'toast box';
      el.innerHTML = it.html;
      toastEl.append(el);
      setTimeout(() => { el.remove(); notify.busy = false; pump(); }, TOAST_TIME);
    } else {
      modal.open = true;
      modal.current = it;
      hideInfo();
      reward.querySelector('h2').textContent = it.title;
      reward.querySelector('.body').textContent = it.body;
      reward.querySelector('[data-action=continue]').textContent = it.button;
      reward.querySelector('[data-action=restart]').textContent = it.restart || '';
      reward.classList.toggle('final', !!it.final);
      reward.classList.add('show');
    }
  }
  function closeModal() {
    if (!modal.open) return;
    modal.open = false;
    modal.current = null;
    reward.classList.remove('show');
    setTimeout(() => { notify.busy = false; pump(); }, 500);
  }
  reward.addEventListener('click', e => {
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (act === 'restart') location.reload();
    else if (act === 'continue' || e.target === reward) closeModal();
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
  // NPCs auf ihre Startbahnen setzen
  updateWorld(0);
  for (const n of npcs) {
    const b = n.orbitBody;
    n.x = b.x + Math.cos(n.orbitAng) * n.orbitR;
    n.y = b.y + Math.sin(n.orbitAng) * n.orbitR;
    n.heading = n.orbitAng + n.orbitDir * Math.PI / 2;
  }
  // Kapitel 1: Tafel mit Filmbalken wie bei den anderen Kapiteln
  notify.queue.push({ type: 'cine', chapter: 0, dur: 4.6 });
  pump();
  requestAnimationFrame(frame);

  // --- Mobil: kein versehentliches Hineinzoomen (iOS Safari ignoriert user-scalable=no)
  const stop = e => e.preventDefault();
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, stop, { passive: false });
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 || e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', stop, { passive: false });
  // falls doch gezoomt wurde (z. B. über die Bedienungshilfen), Ansicht zurücksetzen
  const vpMeta = document.querySelector('meta[name=viewport]');
  const vpContent = vpMeta.content;
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => {
      if (visualViewport.scale <= 1.01) return;
      vpMeta.content = vpContent.replace('maximum-scale=1', 'maximum-scale=1.01');
      requestAnimationFrame(() => { vpMeta.content = vpContent; });
    });
  }

  // kleine Debug-Schnittstelle (für Tests / Konsole)
  window.__space = {
    ship, npcs, coins, crates, BODIES, STATIONS, collected, cratesTaken, dialog, modal, quests, badges, visited,
    get speedBonus() { return speedBonus; }, closeModal, notify,
    fogBack, comets, fastComets, resortCrates, alienRelics, relics, dealerNpc, startRound2, relicsFound, RESORT, WH, resortNpcs, cine,
    get chapter() { return chapter; }, setChapter: v => { chapter = v; updateHUD(); }, get speedBonusPct() { return Math.round(speedBonus * 100); }, ZONE, WRECK, DARK, zoneParts, gwynnNpc, justusNpc, projectAllowed,
    get partsFound() { return partsFound; },
    get round() { return round; }, get relicsGiven() { return relicsGiven; }, get cometsCaught() { return cometsCaught; },
    award, step: dt => updateWorld(dt), flyToPoint, flyToBody, dialogNext, portrait, sfx,
  };
})();
