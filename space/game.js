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
  const OBSTACLES = [...BODIES, ...STATIONS];
  const DESTINATIONS = [...BODIES.slice(1), ...STATIONS];

  // Asteroidengürtel
  const asteroids = [];
  for (let i = 0; i < 520; i++) {
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
  for (let i = 0; i < 800; i++) {
    const g = (rng() + rng()) / 2;
    dust.push({ a: rng() * TAU, rad: BELT_INNER - 20 + g * (BELT_OUTER - BELT_INNER + 40), z: (rng() - 0.5) * 16, b: rng() });
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
      const rad = Math.sqrt(r()) * (SHIP_LIMIT - 12);
      const a = r() * TAU;
      if (rad < Math.max(SUN.avoidR + 14, minRad)) continue;
      let ok = true;
      for (const b of OBSTACLES) {
        if (b.orbit && Math.abs(rad - b.orbit) < b.avoidR * 0.85 + 6) { ok = false; break; }
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
  for (const id of Object.keys(TEXTS.items)) quests[id] = 'open';
  const PLANETS = BODIES.filter(b => b.orbit > 0);

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
  const hideHint = () => { hintGone = true; hint.classList.add('gone'); };
  const intro = document.getElementById('intro');
  intro.textContent = TEXTS.intro || '';
  setTimeout(() => { if (!hintGone) hint.classList.add('ready'); }, 3600);

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!hintGone) hideHint();
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
    // Treffer auf ein anderes Raumschiff: hinfliegen und ansprechen
    let npcHit = null;
    for (const n of npcs) {
      if (n.state === 'drift') continue;
      const d = Math.hypot(ix - toSX(n.x), iy - toSY(n.y, 4));
      if (d <= 11 && d < best) { best = d; npcHit = n; }
    }
    if (npcHit) {
      flyToNpc(npcHit);
    } else if (hit) {
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
  function flyToNpc(n) {
    hideInfo();
    n.cooldown = 0;
    ship.mode = 'fly';
    ship.goal = { npc: n };
    ship.sides.clear();
    marker = null;
  }
  function flyToBody(b) {
    if (ship.mode === 'orbit' && ship.orbitBody === b) { arriveAt(b); return; }
    hideInfo();
    ship.mode = 'fly';
    ship.goal = { body: b };
    ship.sides.clear();
    marker = null;
  }
  function arriveAt(b) {
    if (b.station) {
      const t = TEXTS.stations[b.id];
      if (t) {
        const g = giverLines(t);
        openDialog(t.crew, g.lines, `${t.kicker} · ${t.name}`, g.after);
      }
      return;
    }
    if (b.orbit > 0 && !visited.has(b.id)) {
      visited.add(b.id);
      if (visited.size === PLANETS.length) award('tourist');
    }
    const due = Object.keys(TEXTS.items).filter(id => quests[id] === 'active' && TEXTS.items[id].target === b.id);
    if (due.length) {
      const lines = due.flatMap(id => TEXTS.items[id].deliver);
      openDialog([], lines, bodyName(b.id), () => { due.forEach(deliver); showInfo(b); });
    } else {
      showInfo(b);
    }
  }

  // ---------------------------------------------------------------- quests
  const bodyName = id => (TEXTS.bodies[id] || {}).name || id;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /** Welche Zeilen sagt ein Auftraggeber gerade? */
  function giverLines(t) {
    const st = quests[t.quest];
    if (st === 'open') return { lines: t.offer, after: () => acceptQuest(t.quest) };
    if (st === 'active') return { lines: t.waiting };
    return { lines: t.thanks };
  }
  function acceptQuest(id) {
    if (quests[id] !== 'open') return;
    quests[id] = 'active';
    const it = TEXTS.items[id];
    toast(`<b>${esc(TEXTS.toast.quest)}</b> ${it.icon} ${esc(it.name)} → ${esc(bodyName(it.target))}`);
    renderQuests();
  }
  function deliver(id) {
    if (quests[id] !== 'active') return;
    quests[id] = 'done';
    const it = TEXTS.items[id];
    toast(`<b>${esc(TEXTS.toast.delivered)}</b> ${it.icon} ${esc(it.name)}`);
    renderQuests();
    if (id === 'brief') award('amor');
    if (Object.values(quests).every(q => q === 'done')) milestone('meisterbote', 0.2, TEXTS.rewards.quests);
  }

  // ----------------------------------------------------- badges & rewards
  const BADGE_IDS = Object.keys(TEXTS.badges);
  const FINAL_BADGE = 'weltenbummler';
  function award(id) {
    if (badges.has(id)) return;
    badges.add(id);
    const b = TEXTS.badges[id];
    toast(`<b>${esc(TEXTS.toast.badge)}</b> ${b.icon} ${esc(b.name)}`);
    renderBadges();
    if (id !== FINAL_BADGE && BADGE_IDS.filter(x => x !== FINAL_BADGE).every(x => badges.has(x))) {
      award(FINAL_BADGE);
      const f = TEXTS.rewards.final;
      showModal({ icon: TEXTS.badges[FINAL_BADGE].icon, title: f.title, body: f.body, button: f.button, final: true });
    }
  }
  /** Meilenstein: schnellerer Antrieb + Badge + Belohnungsdialog */
  function milestone(badgeId, bonus, reward) {
    if (badges.has(badgeId)) return;
    speedBonus += bonus;
    toast(`<b>${esc(TEXTS.toast.boost)}</b> +${Math.round(bonus * 100)} %`);
    showModal({ icon: TEXTS.badges[badgeId].icon, title: reward.title, body: reward.body, button: TEXTS.rewards.continue });
    award(badgeId);
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
  function flyAgent(agent, dt, tx, ty, arriveR, exclude, maxSpeed) {
    const dist = Math.hypot(tx - agent.x, ty - agent.y);
    if (dist <= arriveR) return true;
    const want = steer(agent, tx, ty, exclude);
    const diff = turnTowards(agent, want, dist < 24 ? 6 : 3.2, dt);
    const remaining = dist - arriveR;
    const tgt = Math.min(maxSpeed, 9 + remaining * 1.3) * Math.max(0.2, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
    agent.speed += (tgt - agent.speed) * Math.min(1, dt * 2.2);
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
    agent.orbitAng += agent.orbitDir * (15 / agent.orbitR) * dt;
    const tx = b.x + Math.cos(agent.orbitAng) * agent.orbitR;
    const ty = b.y + Math.sin(agent.orbitAng) * agent.orbitR;
    const k = Math.min(1, dt * 2.5);
    agent.x += (tx - agent.x) * k;
    agent.y += (ty - agent.y) * k;
    turnTowards(agent, agent.orbitAng + agent.orbitDir * Math.PI / 2, 2, dt);
    agent.speed += (15 - agent.speed) * Math.min(1, dt * 2);
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
    const rad = Math.hypot(agent.x, agent.y);
    if (rad > SHIP_LIMIT) { agent.x *= SHIP_LIMIT / rad; agent.y *= SHIP_LIMIT / rad; }
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
      if (g.npc) arrived = flyAgent(ship, dt, g.npc.x, g.npc.y, 12, null, maxSpeed());
      else if (g.body) arrived = flyAgent(ship, dt, g.body.x, g.body.y, g.body.avoidR + 1, g.body, maxSpeed());
      else arrived = flyAgent(ship, dt, g.x, g.y, 2.5, null, maxSpeed());
      if (arrived) {
        if (g.npc) {
          ship.mode = 'idle';
          ship.goal = null;
        } else if (g.body) {
          ship.mode = 'orbit';
          ship.goal = null;
          startOrbit(ship, g.body, g.body.avoidR);
          arriveAt(g.body);
        } else {
          ship.mode = 'idle';
          ship.goal = null;
        }
      }
    } else {
      coast(ship, dt);
    }
    constrain(ship, dt);
    emitTrail(ship, 3);
  }

  function pickDestination(npc) {
    const options = DESTINATIONS.filter(d => d !== npc.target && d !== npc.prevTarget);
    npc.prevTarget = npc.target;
    npc.target = options[(Math.random() * options.length) | 0];
    npc.sides.clear();
  }

  function updateNpc(npc, dt) {
    npc.cooldown = Math.max(0, npc.cooldown - dt);
    if (npc.state === 'travel') {
      const t = npc.target;
      if (flyAgent(npc, dt, t.x, t.y, t.avoidR + 8, t, 42)) {
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
    if (dialog.open || ship.mode === 'drift' || modal.open) return;
    for (const npc of npcs) {
      if (npc.cooldown > 0 || npc.state === 'drift') continue;
      if (Math.hypot(npc.x - ship.x, npc.y - ship.y) > 28) continue;
      hideInfo();
      const dir = ship.speed > 5 ? ship.heading : npc.heading;
      const cr = Math.cos(dir) * (npc.y - ship.y) - Math.sin(dir) * (npc.x - ship.x);
      ship.mode = 'drift';
      ship.goal = null;
      marker = null;
      ship.drift = { npc, dir, side: cr >= 0 ? 1 : -1 };
      npc.state = 'drift';
      const g = giverLines(npc.texts);
      openDialog(npc.texts.crew, g.lines, npc.texts.name, () => { if (g.after) g.after(); endEncounter(npc); });
      return;
    }
  }
  function endEncounter(npc) {
    npc.state = 'travel';
    npc.cooldown = 40;
    pickDestination(npc);
    if (ship.mode === 'drift') ship.mode = 'idle';
    ship.drift = null;
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
      if (c.taken || Math.hypot(c.x - ship.x, c.y - ship.y) >= 10) continue;
      c.taken = true;
      collected.add(c.id);
      burst(c.x, c.y, 'gold');
      updateHUD('coin');
      if (collected.size >= COIN_TOTAL) setTimeout(() => milestone('meistererkunder', 0.2, TEXTS.rewards.coins), 900);
    }
    for (const c of crates) {
      if (c.taken || Math.hypot(c.x - ship.x, c.y - ship.y) >= 12) continue;
      c.taken = true;
      cratesTaken.add(c.id);
      burst(c.x, c.y, 'crate');
      updateHUD('crate');
      toast(`<b>${esc(TEXTS.toast.container)}</b> ${cratesTaken.size} / ${CRATE_TOTAL}`);
      if (cratesTaken.size >= CRATE_TOTAL) setTimeout(() => milestone('aufraeumer', 0.1, TEXTS.rewards.containers), 900);
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
    for (const st of STATIONS) {
      const a = st.a0 + (time * TAU) / st.period;
      st.x = Math.cos(a) * st.orbit;
      st.y = Math.sin(a) * st.orbit;
      st.rot = time * 0.3;
    }
    updateShip(dt);
    for (const npc of npcs) updateNpc(npc, dt);
    checkEncounters();
    updateCoins();
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

    // Kamera folgt sanft, mit leichtem Vorlauf
    const lead = ship.speed * 0.35;
    const tx = ship.x + Math.cos(ship.heading) * lead;
    const ty = ship.y + Math.sin(ship.heading) * lead;
    const k = 1 - Math.exp(-dt * 2.2);
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
  }

  // ---------------------------------------------------------------- render
  const ORBIT_DOTS = OBSTACLES.filter(b => b.orbit).map(b => {
    const n = Math.round((b.orbit * TAU) / (b.station ? 9 : 6));
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
    for (const o of ORBIT_DOTS) {
      ctx.fillStyle = o.b.station ? '#ffd27a' : '#8fa6ff';
      ctx.globalAlpha = o.b.station ? 0.12 : 0.16;
      for (const [x, y] of o.pts) {
        const sx = toSX(x), sy = toSY(y);
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

  /** Verlorener Frachtcontainer: kleine Kiste mit Blinklicht, taumelt leicht */
  function drawCrate(c) {
    const bob = Math.sin(time * 1.1 + c.phase) * 1.5;
    const sx = toSX(c.x), sy = toSY(c.y, 6 + bob);
    if (!onScreen(sx, sy, 10)) return;
    const x = Math.round(sx), y = Math.round(sy);
    const tilt = Math.sin(time * 0.6 + c.phase) > 0 ? 1 : 0; // langsames Kippen
    px(x - 4, y - 3 + tilt, '#7a3a12', 9, 7);              // Kontur
    px(x - 3, y - 2 + tilt, '#e07b2c', 4, 5);              // linke Seite
    px(x + 1, y - 2 + tilt, '#b85a1e', 3, 5);              // rechte Seite (Schatten)
    px(x - 3, y - 2 + tilt, '#f5a35a', 7, 1);              // Deckelkante
    px(x - 3, y + tilt, '#3a8aa8', 4, 1);                  // Streifen
    px(x + 1, y + tilt, '#2a6a86', 3, 1);
    px(x - 4, y - 4 + tilt, '#7a3a12', 9, 1);
    px(x - 3, y - 4 + tilt, '#ffc285', 7, 1);              // Deckel
    const on = (time + c.phase) % 1.4 < 0.3;
    px(x, y - 5 + tilt, on ? '#ff6a6a' : '#7a2a2a');
    if (on) { ctx.globalAlpha = 0.3; px(x - 1, y - 6 + tilt, '#ff6a6a', 3, 3); ctx.globalAlpha = 1; }
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
      if (quests[n.texts.quest] !== 'open' || n.state === 'drift') continue;
      const sx = toSX(n.x), sy = toSY(n.y, 4);
      if (onScreen(sx, sy, 20)) bang(sx, sy - 13);
    }
    for (const st of STATIONS) {
      const t = TEXTS.stations[st.id];
      if (!t || quests[t.quest] !== 'open') continue;
      const sx = toSX(st.x), sy = toSY(st.y, 3);
      if (onScreen(sx, sy, 30)) bang(sx, sy - st.hub - 18);
    }
    for (const [id, state] of Object.entries(quests)) {
      if (state !== 'active') continue;
      const b = BODIES.find(o => o.id === TEXTS.items[id].target);
      if (!b) continue;
      const sx = Math.round(toSX(b.x)), sy = Math.round(toSY(b.y) - b.r - 7) + bounce;
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
      if (p.kind === 'gold' || p.kind === 'crate') {
        ctx.fillStyle = p.kind === 'gold' ? (t < 0.4 ? '#fff1a8' : '#f7c948') : (t < 0.4 ? '#ffd0a0' : '#e07b2c');
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
    ctx.globalAlpha = 1;

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
    for (const n of npcs) drawList.push({ y: n.y, k: 3, o: n });
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
      }
    }
    drawQuestMarkers();
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
    const el = bump === 'coin' ? coinBox : bump === 'crate' ? crateBox : null;
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
      el.innerHTML = `<span class="ic">${b.icon}</span><span class="label">${esc(b.name)}</span>`;
      el.addEventListener('click', () => toast(`${b.icon} <b>${esc(b.name)}</b> – ${esc(b.text)}`));
      badgeEl.append(el);
    }
  }

  const questEl = document.getElementById('quests');
  function renderQuests() {
    questEl.innerHTML = '';
    for (const [id, state] of Object.entries(quests)) {
      if (state !== 'active') continue;
      const it = TEXTS.items[id];
      const li = document.createElement('li');
      li.innerHTML = `<span class="ic">${it.icon}</span><span>${esc(it.name)}</span><span class="to">→ ${esc(bodyName(it.target))}</span>`;
      questEl.append(li);
    }
  }

  const toastEl = document.getElementById('toasts');
  function toast(html) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    toastEl.append(el);
    setTimeout(() => el.remove(), 3700);
  }

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
    hideHint();
  }
  function hideInfo() { info.classList.remove('show'); }
  info.querySelector('.close').addEventListener('click', hideInfo);

  // --- Dialoge mit den Tier-Figuren
  const dialogEl = document.getElementById('dialog');
  const dialog = { open: false, lines: [], idx: 0, onEnd: null, imgs: {} };
  // Bilder vorladen, damit sie beim ersten Dialog sofort da sind
  for (const c of Object.values(TEXTS.characters)) { const im = new Image(); im.src = c.img; }

  function openDialog(crew, lines, role, onEnd) {
    if (!lines || !lines.length) { if (onEnd) onEnd(); return; }
    hideInfo();
    hideHint();
    dialog.open = true;
    dialog.lines = lines;
    dialog.idx = 0;
    dialog.onEnd = onEnd || null;
    dialog.role = role || '';
    const cast = dialogEl.querySelector('.cast'), me = dialogEl.querySelector('.cast-me');
    cast.innerHTML = '';
    me.innerHTML = '';
    dialog.imgs = {};
    const addImg = (id, parent) => {
      const c = TEXTS.characters[id];
      if (!c) return;
      const im = document.createElement('img');
      im.src = c.img;
      im.alt = c.name;
      parent.append(im);
      dialog.imgs[id] = im;
    };
    for (const id of crew) if (id !== TEXTS.player) addImg(id, cast);
    addImg(TEXTS.player, me);
    showLine();
    dialogEl.classList.add('show');
  }
  function showLine() {
    const [who, text] = dialog.lines[dialog.idx];
    const c = TEXTS.characters[who] || { name: who, tier: '' };
    dialogEl.querySelector('.name').textContent = c.name;
    dialogEl.querySelector('.role').textContent = who === TEXTS.player ? c.tier : [c.tier, dialog.role].filter(Boolean).join(' · ');
    dialogEl.querySelector('.line').textContent = text;
    for (const [id, im] of Object.entries(dialog.imgs)) im.classList.toggle('active', id === who);
    const last = dialog.idx === dialog.lines.length - 1;
    dialogEl.querySelector('.next').textContent = last ? TEXTS.dialogClose : TEXTS.dialogNext;
    dialogEl.querySelector('.progress').textContent = `${dialog.idx + 1} / ${dialog.lines.length}`;
  }
  function dialogNext() {
    if (!dialog.open) return;
    if (dialog.idx < dialog.lines.length - 1) { dialog.idx++; showLine(); return; }
    dialog.open = false;
    dialogEl.classList.remove('show');
    const cb = dialog.onEnd;
    dialog.onEnd = null;
    if (cb) cb();
    setTimeout(nextModal, 450);
  }
  dialogEl.querySelector('.next').addEventListener('click', dialogNext);

  const reward = document.getElementById('reward');
  const modal = { open: false, queue: [], current: null };
  function showModal(m) {
    if (modal.open || dialog.open) { modal.queue.push(m); return; }
    modal.open = true;
    modal.current = m;
    hideInfo();
    reward.querySelector('.reward-icon').textContent = m.icon || '';
    reward.querySelector('h2').textContent = m.title;
    reward.querySelector('.body').textContent = m.body;
    reward.querySelector('[data-action=continue]').textContent = m.button;
    reward.classList.toggle('final', !!m.final);
    reward.classList.add('show');
  }
  function closeModal() {
    if (!modal.open) return;
    if (modal.current && modal.current.final) { location.reload(); return; }
    modal.open = false;
    modal.current = null;
    reward.classList.remove('show');
    setTimeout(nextModal, 450);
  }
  function nextModal() { if (!modal.open && !dialog.open && modal.queue.length) showModal(modal.queue.shift()); }
  reward.addEventListener('click', e => {
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (act === 'continue') closeModal();
    else if (e.target === reward && !(modal.current && modal.current.final)) closeModal();
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
  requestAnimationFrame(frame);

  // kleine Debug-Schnittstelle (für Tests / Konsole)
  window.__space = {
    ship, npcs, coins, crates, BODIES, STATIONS, collected, cratesTaken, dialog, modal, quests, badges, visited,
    get speedBonus() { return speedBonus; }, closeModal,
    step: dt => updateWorld(dt), flyToPoint, flyToBody, dialogNext,
  };
})();
