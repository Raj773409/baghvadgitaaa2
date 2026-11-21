import * as THREE from 'three';

/**
 * Procedural canvas textures for the fully-3D sanctum. Everything is painted at runtime so the
 * temple ships with zero binary assets; swap any of these for authored PBR texture sets later.
 */

export const TEMPLE_PALETTE = {
  gold: '#C89B3C',
  champagne: '#E8C878',
  ivory: '#F8F3E8',
  maroon: '#741D32',
  navy: '#101827',
} as const;

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  return [canvas, canvas.getContext('2d') as CanvasRenderingContext2D];
}

function toTexture(canvas: HTMLCanvasElement, anisotropy: number, srgb = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

/** Draws an N-petal lotus rosette centred at the current origin. */
function drawLotus(ctx: CanvasRenderingContext2D, radius: number, petals: number, fill: string, stroke?: string): void {
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.25);
    ctx.quadraticCurveTo(radius * 0.32, -radius * 0.65, 0, -radius);
    ctx.quadraticCurveTo(-radius * 0.32, -radius * 0.65, 0, -radius * 0.25);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1, radius * 0.02);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Polished ivory marble floor covering the whole hall (9 m × 10 m, z from -6.5 far to +3.5 near).
 * Includes 1 m tiles with gold-grey joints, soft veining, a maroon/gold border band and a
 * pietra-dura style lotus medallion at world (0, -2.2).
 */
export function createMarbleFloorTexture(sizePx: number, anisotropy: number): THREE.CanvasTexture {
  const H = sizePx;
  const W = Math.round(sizePx * 0.9);
  const ppm = H / 10; // pixels per metre
  const [canvas, ctx] = makeCanvas(W, H);
  const rand = seeded(4207);

  ctx.fillStyle = '#EFE6D4';
  ctx.fillRect(0, 0, W, H);

  // Cloudy marble body
  for (let i = 0; i < 60; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = (0.4 + rand() * 1.6) * ppm;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = rand() > 0.5;
    g.addColorStop(0, warm ? 'rgba(214,196,160,0.22)' : 'rgba(255,252,244,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Veins
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(${120 + rand() * 40},${105 + rand() * 30},${80 + rand() * 30},${0.06 + rand() * 0.1})`;
    ctx.lineWidth = 0.6 + rand() * 1.6;
    ctx.beginPath();
    const x0 = rand() * W;
    const y0 = rand() * H;
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(
      x0 + (rand() - 0.5) * ppm * 2,
      y0 + (rand() - 0.5) * ppm * 2,
      x0 + (rand() - 0.5) * ppm * 3,
      y0 + (rand() - 0.5) * ppm * 3,
      x0 + (rand() - 0.5) * ppm * 4,
      y0 + (rand() - 0.5) * ppm * 4,
    );
    ctx.stroke();
  }

  // 1 m tile joints with a thin gold inlay beside each joint
  for (let m = 0; m <= 10; m++) {
    const y = m * ppm;
    ctx.fillStyle = 'rgba(110,86,52,0.35)';
    ctx.fillRect(0, y - 1, W, 2);
    ctx.fillStyle = 'rgba(200,155,60,0.25)';
    ctx.fillRect(0, y + 3, W, 1);
  }
  for (let m = 0; m <= 9; m++) {
    const x = m * ppm;
    ctx.fillStyle = 'rgba(110,86,52,0.35)';
    ctx.fillRect(x - 1, 0, 2, H);
    ctx.fillStyle = 'rgba(200,155,60,0.25)';
    ctx.fillRect(x + 3, 0, 1, H);
  }

  // Maroon + gold border bands running along the side walls
  for (const side of [0.35, 9 - 0.35 - 0.22]) {
    ctx.fillStyle = 'rgba(116,29,50,0.75)';
    ctx.fillRect(side * ppm, 0, 0.22 * ppm, H);
    ctx.fillStyle = 'rgba(200,155,60,0.8)';
    ctx.fillRect(side * ppm - 2, 0, 2, H);
    ctx.fillRect((side + 0.22) * ppm, 0, 2, H);
  }

  // Lotus medallion (world x=0, z=-2.2) → canvas (4.5 m, 4.3 m)
  ctx.save();
  ctx.translate(4.5 * ppm, (-2.2 + 6.5) * ppm);
  const R = 0.95 * ppm;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(248,243,232,0.9)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, ppm * 0.025);
  ctx.strokeStyle = 'rgba(200,155,60,0.95)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.92, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(116,29,50,0.85)';
  ctx.lineWidth = Math.max(1.5, ppm * 0.012);
  ctx.stroke();
  drawLotus(ctx, R * 0.88, 16, 'rgba(116,29,50,0.55)', 'rgba(200,155,60,0.9)');
  ctx.rotate(Math.PI / 16);
  drawLotus(ctx, R * 0.66, 16, 'rgba(242,140,30,0.55)', 'rgba(200,155,60,0.9)');
  ctx.rotate(-Math.PI / 16);
  drawLotus(ctx, R * 0.44, 8, 'rgba(47,93,80,0.6)', 'rgba(200,155,60,0.9)');
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,155,60,0.95)';
  ctx.fill();
  ctx.restore();

  return toTexture(canvas, anisotropy);
}

/** Warm sandstone wall with recessed carved panels, gold-rimmed lotus roundels and a frieze. */
export function createCarvedWallTexture(
  widthM: number,
  heightM: number,
  sizePx: number,
  anisotropy: number,
  withNiches = false,
): THREE.CanvasTexture {
  const ppm = sizePx / Math.max(widthM, heightM);
  const W = widthM * ppm;
  const H = heightM * ppm;
  const [canvas, ctx] = makeCanvas(W, H);
  const rand = seeded(withNiches ? 911 : 377);

  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#B89A6E');
  base.addColorStop(0.5, '#D9C29A');
  base.addColorStop(1, '#C7AB80');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,240,210,0.06)' : 'rgba(70,45,20,0.07)';
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 1 + rand() * 2);
  }

  // Frieze (top) and dado (bottom) mouldings
  const band = (y: number, h: number, dark: string, light: string) => {
    ctx.fillStyle = dark;
    ctx.fillRect(0, y, W, h);
    ctx.fillStyle = light;
    ctx.fillRect(0, y, W, Math.max(1, h * 0.18));
  };
  band(0.25 * ppm, 0.12 * ppm, 'rgba(90,62,30,0.55)', 'rgba(255,235,190,0.5)');
  band(0.55 * ppm, 0.06 * ppm, 'rgba(200,155,60,0.85)', 'rgba(255,240,200,0.6)');
  band(H - 0.9 * ppm, 0.1 * ppm, 'rgba(90,62,30,0.55)', 'rgba(255,235,190,0.5)');
  // Dentils
  for (let x = 0; x < W; x += 0.18 * ppm) {
    ctx.fillStyle = 'rgba(80,55,25,0.45)';
    ctx.fillRect(x, 0.4 * ppm, 0.09 * ppm, 0.1 * ppm);
  }

  const panelTop = 0.85 * ppm;
  const panelBottom = H - 1.1 * ppm;
  const panelW = 1.1 * ppm;
  const gap = 0.35 * ppm;
  for (let x = gap; x + panelW < W - gap * 0.5; x += panelW + gap) {
    const h = panelBottom - panelTop;
    if (withNiches) {
      // Arched niche glowing with warm lamp light
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, panelBottom);
      ctx.lineTo(x, panelTop + panelW * 0.5);
      ctx.arc(x + panelW / 2, panelTop + panelW * 0.5, panelW / 2, Math.PI, 0);
      ctx.lineTo(x + panelW, panelBottom);
      ctx.closePath();
      const glow = ctx.createLinearGradient(0, panelTop, 0, panelBottom);
      glow.addColorStop(0, 'rgba(255,214,150,0.9)');
      glow.addColorStop(1, 'rgba(170,110,50,0.85)');
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.lineWidth = 0.05 * ppm;
      ctx.strokeStyle = 'rgba(200,155,60,0.9)';
      ctx.stroke();
      ctx.restore();
    } else {
      // Recessed carved panel: inner shadow on top/left, highlight bottom/right
      ctx.fillStyle = 'rgba(120,88,48,0.22)';
      ctx.fillRect(x, panelTop, panelW, h);
      ctx.fillStyle = 'rgba(50,30,10,0.35)';
      ctx.fillRect(x, panelTop, panelW, 0.04 * ppm);
      ctx.fillRect(x, panelTop, 0.04 * ppm, h);
      ctx.fillStyle = 'rgba(255,240,205,0.4)';
      ctx.fillRect(x, panelTop + h - 0.03 * ppm, panelW, 0.03 * ppm);
      ctx.fillRect(x + panelW - 0.03 * ppm, panelTop, 0.03 * ppm, h);
      // Lotus roundels
      for (const fy of [0.3, 0.7]) {
        ctx.save();
        ctx.translate(x + panelW / 2, panelTop + h * fy);
        ctx.beginPath();
        ctx.arc(0, 0, panelW * 0.32, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200,155,60,0.9)';
        ctx.lineWidth = 0.025 * ppm;
        ctx.stroke();
        drawLotus(ctx, panelW * 0.28, 12, 'rgba(110,78,40,0.35)', 'rgba(232,200,120,0.55)');
        ctx.restore();
      }
    }
  }
  return toTexture(canvas, anisotropy);
}

/** Matching greyscale bump for the carved wall (panel recesses read as relief). */
export function createWallBumpTexture(sizePx: number, anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(sizePx, sizePx);
  const rand = seeded(55);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, sizePx, sizePx);
  for (let i = 0; i < 3000; i++) {
    const v = 100 + Math.floor(rand() * 60);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * sizePx, rand() * sizePx, 1 + rand() * 3, 1 + rand() * 3);
  }
  const tex = toTexture(canvas, anisotropy, false);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  return tex;
}

/** Coffered ceiling: deep maroon coffers framed by gold beams with lotus rosettes. */
export function createCofferedCeilingTexture(sizePx: number, anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(sizePx, sizePx);
  ctx.fillStyle = '#3A0E18';
  ctx.fillRect(0, 0, sizePx, sizePx);
  const n = 6;
  const cell = sizePx / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = i * cell;
      const y = j * cell;
      const g = ctx.createRadialGradient(x + cell / 2, y + cell / 2, cell * 0.05, x + cell / 2, y + cell / 2, cell * 0.6);
      g.addColorStop(0, '#6A1A2C');
      g.addColorStop(1, '#2A0A12');
      ctx.fillStyle = g;
      ctx.fillRect(x + cell * 0.08, y + cell * 0.08, cell * 0.84, cell * 0.84);
      ctx.save();
      ctx.translate(x + cell / 2, y + cell / 2);
      drawLotus(ctx, cell * 0.3, 8, 'rgba(200,155,60,0.75)', 'rgba(232,200,120,0.9)');
      ctx.restore();
    }
  }
  ctx.strokeStyle = TEMPLE_PALETTE.gold;
  ctx.lineWidth = cell * 0.08;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, sizePx);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(sizePx, i * cell);
    ctx.stroke();
  }
  return toTexture(canvas, anisotropy);
}

/** Maroon velvet drape with folds, a gold border on the inner edge and a fringe at the hem. */
export function createDrapeTexture(sizePx: number, anisotropy: number, borderOnLeft: boolean): THREE.CanvasTexture {
  const W = Math.round(sizePx * 0.35);
  const H = sizePx;
  const [canvas, ctx] = makeCanvas(W, H);
  const folds = ctx.createLinearGradient(0, 0, W, 0);
  for (let i = 0; i <= 8; i++) {
    folds.addColorStop(i / 8, i % 2 === 0 ? '#5A1426' : '#8A2440');
  }
  ctx.fillStyle = folds;
  ctx.fillRect(0, 0, W, H);
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(0,0,0,0.35)');
  shade.addColorStop(0.3, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  const bx = borderOnLeft ? 0 : W - W * 0.16;
  ctx.fillStyle = TEMPLE_PALETTE.gold;
  ctx.fillRect(bx, 0, W * 0.16, H);
  ctx.fillStyle = 'rgba(116,29,50,0.9)';
  for (let y = 10; y < H; y += W * 0.2) {
    ctx.beginPath();
    ctx.arc(bx + W * 0.08, y, W * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hem + fringe
  ctx.fillStyle = TEMPLE_PALETTE.gold;
  ctx.fillRect(0, H - H * 0.05, W, H * 0.025);
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? TEMPLE_PALETTE.champagne : TEMPLE_PALETTE.gold;
    ctx.fillRect(x, H - H * 0.025, 2, H * 0.025);
  }
  return toTexture(canvas, anisotropy);
}

/** Velvet backdrop inside the torana with a soft golden prabhavali (aura) behind the deities. */
export function createSanctumBackdropTexture(sizePx: number, anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(sizePx, sizePx);
  const rand = seeded(108);
  ctx.fillStyle = '#4A0F1E';
  ctx.fillRect(0, 0, sizePx, sizePx);
  // Gold buti (small motif) pattern
  const step = sizePx / 14;
  for (let y = step / 2; y < sizePx; y += step) {
    for (let x = ((y / step) % 2) * (step / 2) + step / 2; x < sizePx; x += step) {
      ctx.save();
      ctx.translate(x, y);
      drawLotus(ctx, step * 0.18, 6, 'rgba(200,155,60,0.45)');
      ctx.restore();
    }
  }
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = `rgba(255,220,150,${rand() * 0.05})`;
    ctx.fillRect(rand() * sizePx, rand() * sizePx, 2, 2);
  }
  // Prabhavali aura
  const cx = sizePx / 2;
  const cy = sizePx * 0.42;
  const aura = ctx.createRadialGradient(cx, cy, sizePx * 0.05, cx, cy, sizePx * 0.5);
  aura.addColorStop(0, 'rgba(255,226,160,0.85)');
  aura.addColorStop(0.35, 'rgba(232,200,120,0.45)');
  aura.addColorStop(1, 'rgba(232,200,120,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, sizePx, sizePx);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(232,200,120,0.55)';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ctx.lineWidth = i % 2 === 0 ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * sizePx * 0.3, Math.sin(a) * sizePx * 0.3);
    ctx.lineTo(Math.cos(a) * sizePx * (i % 2 === 0 ? 0.46 : 0.4), Math.sin(a) * sizePx * (i % 2 === 0 ? 0.46 : 0.4));
    ctx.stroke();
  }
  ctx.restore();
  return toTexture(canvas, anisotropy);
}

/** Soft additive flame sprite (white core → saffron → transparent). */
export function createFlameSpriteTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(64, 128);
  const g = ctx.createRadialGradient(32, 84, 2, 32, 74, 50);
  g.addColorStop(0, 'rgba(255,255,240,1)');
  g.addColorStop(0.25, 'rgba(255,214,120,0.95)');
  g.addColorStop(0.55, 'rgba(255,140,40,0.55)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.bezierCurveTo(54, 50, 58, 96, 32, 124);
  ctx.bezierCurveTo(6, 96, 10, 50, 32, 4);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
