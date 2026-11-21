import * as THREE from 'three';
import { WORLD_CONTINENT_POLYGONS } from '../utils/worldLandmasses';

function pseudoNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Generates seamless tileable architectural travertine stone textures (color, bump, roughness)
 * tuned for the Contemporary Cultural Luxury pavilion aesthetic.
 */
export function createTravertineStoneTextures(maxAnisotropy: number): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  cCtx.fillStyle = '#DED7CB';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#B8B8B8';
  rCtx.fillRect(0, 0, size, size);

  // Fine mineral bands & honed limestone strata
  for (let y = 0; y < size; y += 2) {
    const wave = Math.sin((y / size) * Math.PI * 14) * 6 + (pseudoNoise(1, y, 9) - 0.5) * 12;
    const lum = Math.max(185, Math.min(242, Math.round(220 + wave)));
    cCtx.fillStyle = `rgba(${lum}, ${lum - 5}, ${lum - 14}, 0.35)`;
    cCtx.fillRect(0, y, size, 2);

    const bVal = Math.max(85, Math.min(185, Math.round(128 + wave * 2.0)));
    bCtx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
    bCtx.fillRect(0, y, size, 2);
  }

  // Subtle architectural slab panel seams
  cCtx.strokeStyle = 'rgba(72, 68, 60, 0.22)';
  cCtx.lineWidth = 1.5;
  bCtx.strokeStyle = 'rgba(42, 42, 42, 0.72)';
  bCtx.lineWidth = 2.5;
  const rows = 4;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.lineTo(size, y);
    cCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(size, y);
    bCtx.stroke();

    const offset = r % 2 === 0 ? size * 0.3 : size * 0.72;
    cCtx.beginPath();
    cCtx.moveTo(offset, y);
    cCtx.lineTo(offset, y + rowH);
    cCtx.stroke();
  }

  const configure = (tex: THREE.CanvasTexture, srgb = false) => {
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  const colorMap = configure(new THREE.CanvasTexture(colorCanvas), true);
  const bumpMap = configure(new THREE.CanvasTexture(bumpCanvas));
  const roughnessMap = configure(new THREE.CanvasTexture(roughCanvas));

  return {
    colorMap,
    bumpMap,
    roughnessMap,
    dispose: () => {
      colorMap.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/**
 * Subdivides and smooths coarse lon/lat continent polygons using Chaikin corner-cutting
 * plus deterministic coastal micro-perturbation so landmasses read organically at close orbital range.
 */
function smoothCoastlinePolygon(
  poly: ReadonlyArray<[number, number]>,
  iterations = 3,
): Array<[number, number]> {
  let pts: Array<[number, number]> = poly.map(([lon, lat]) => [lon, lat]);
  for (let iter = 0; iter < iterations; iter++) {
    const next: Array<[number, number]> = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % n];
      const qx = x0 * 0.75 + x1 * 0.25;
      const qy = y0 * 0.75 + y1 * 0.25;
      const rx = x0 * 0.25 + x1 * 0.75;
      const ry = y0 * 0.25 + y1 * 0.75;
      if (iter === 1) {
        const j1 = (pseudoNoise(i, iter, 19) - 0.5) * 1.15;
        const j2 = (pseudoNoise(i, iter, 31) - 0.5) * 1.15;
        next.push([qx + j1, qy - j2], [rx - j2, ry + j1]);
      } else {
        next.push([qx, qy], [rx, ry]);
      }
    }
    pts = next;
  }
  return pts;
}

const URBAN_LIGHT_HUBS: ReadonlyArray<[number, number, number]> = [
  // [lon, lat, densityWeight] — Major global metropolitan & coastal clusters
  [77.2, 28.6, 1.4], [72.8, 19.0, 1.3], [77.6, 13.0, 1.2], [88.3, 22.5, 1.2], [80.2, 13.1, 1.0], // India
  [55.3, 25.2, 1.1], [46.7, 24.7, 0.9], [31.2, 30.0, 1.1], // Middle East & Nile
  [-0.1, 51.5, 1.3], [-6.2, 53.3, 0.9], [2.3, 48.8, 1.3], [4.9, 52.3, 1.2], [13.4, 52.5, 1.2], // W. Europe
  [9.2, 45.4, 1.1], [12.5, 41.9, 1.0], [-3.7, 40.4, 1.1], [2.1, 41.4, 0.9], // S. Europe
  [37.6, 55.7, 1.2], [30.3, 59.9, 0.9], // Russia
  [116.4, 39.9, 1.4], [121.5, 31.2, 1.4], [114.1, 22.3, 1.3], [104.1, 30.6, 1.1], // China
  [139.7, 35.7, 1.4], [135.5, 34.7, 1.2], [127.0, 37.5, 1.2], // Japan & Korea
  [103.8, 1.3, 1.0], [100.5, 13.7, 1.0], [106.8, -6.2, 1.0], // SE Asia
  [-74.0, 40.7, 1.5], [-87.6, 41.8, 1.2], [-118.2, 34.0, 1.3], [-122.4, 37.7, 1.1], [-95.3, 29.7, 1.1], [-79.3, 43.6, 1.2], // N. America
  [-99.1, 19.4, 1.1], [-46.6, -23.5, 1.3], [-43.2, -22.9, 1.1], [-58.4, -34.6, 1.0], // Latin America
  [28.0, -26.2, 1.1], [18.4, -33.9, 0.9], [3.3, 6.5, 1.0], // Africa
  [151.2, -33.8, 1.2], [144.9, -37.8, 1.1], [174.7, -36.8, 0.9], // Oceania
];

/**
 * Generates high-resolution equirectangular nocturnal Earth textures:
 * - Deep oceanic navy bathymetry & smoothed charcoal-indigo continental shelves
 * - Subtle antique-bronze coastlines without harsh polygon seams
 * - Crisp pinpoint nocturnal city-light constellations clustered around metropolitan belts
 */
export function createCartographicEarthTextures(maxAnisotropy: number): {
  colorMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;
  const eCtx = emissiveCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Deep nocturnal ocean bathymetry gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0C1829');
  oceanGrad.addColorStop(0.5, '#070F1B');
  oceanGrad.addColorStop(1, '#0C1829');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, width, height);

  // Satin dark ocean vs matte continental terrain
  rCtx.fillStyle = '#969696';
  rCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#484848';
  bCtx.fillRect(0, 0, width, height);

  const projectLon = (lon: number) => ((lon + 180) / 360) * width;
  const projectLat = (lat: number) => ((90 - lat) / 180) * height;

  // Extremely faint celestial graticule
  ctx.strokeStyle = 'rgba(130, 165, 210, 0.06)';
  ctx.lineWidth = 0.8;
  for (let lon = -180; lon <= 180; lon += 20) {
    const x = projectLon(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = projectLat(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const smoothedPolygons = WORLD_CONTINENT_POLYGONS.map((poly) =>
    smoothCoastlinePolygon(poly, 2),
  );

  const traceContinentPath = (
    targetCtx: CanvasRenderingContext2D,
    poly: ReadonlyArray<[number, number]>,
  ) => {
    targetCtx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = projectLon(lon);
      const y = projectLat(lat);
      if (idx === 0) targetCtx.moveTo(x, y);
      else targetCtx.lineTo(x, y);
    });
    targetCtx.closePath();
  };

  // Single landmass mask canvas for O(1) masking of all city-light layers
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mCtx = maskCanvas.getContext('2d')!;
  mCtx.fillStyle = '#FFFFFF';

  for (const poly of smoothedPolygons) {
    traceContinentPath(mCtx, poly);
    mCtx.fill();

    // Organic continental fill & delicate atmospheric coastal rim
    traceContinentPath(ctx, poly);
    ctx.fillStyle = '#142032';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 162, 106, 0.24)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Matte terrain roughness
    traceContinentPath(rCtx, poly);
    rCtx.fillStyle = '#D0D0D0';
    rCtx.fill();

    // Soft elevated landmass shelf in bump map
    traceContinentPath(bCtx, poly);
    bCtx.fillStyle = '#A8A8A8';
    bCtx.fill();
    bCtx.strokeStyle = '#C8C8C8';
    bCtx.lineWidth = 1.6;
    bCtx.stroke();

    // Subtle faint coastal luminescence on emissive texture
    traceContinentPath(eCtx, poly);
    eCtx.strokeStyle = 'rgba(213, 172, 112, 0.14)';
    eCtx.lineWidth = 1.0;
    eCtx.stroke();
  }

  // Render nocturnal city lights onto a transparent canvas, then mask once via destination-in
  const lightsCanvas = document.createElement('canvas');
  lightsCanvas.width = width;
  lightsCanvas.height = height;
  const lCtx = lightsCanvas.getContext('2d')!;

  // 1. Dense pinpoint metropolitan clusters around major urban hubs
  for (let h = 0; h < URBAN_LIGHT_HUBS.length; h++) {
    const [hubLon, hubLat, weight] = URBAN_LIGHT_HUBS[h];
    const count = Math.round(40 * weight);

    const hx = projectLon(hubLon);
    const hy = projectLat(hubLat);
    const halo = lCtx.createRadialGradient(hx, hy, 0, hx, hy, 12 * weight);
    halo.addColorStop(0, 'rgba(255, 214, 148, 0.44)');
    halo.addColorStop(0.5, 'rgba(233, 174, 120, 0.12)');
    halo.addColorStop(1, 'rgba(233, 174, 120, 0)');
    lCtx.fillStyle = halo;
    lCtx.beginPath();
    lCtx.arc(hx, hy, 12 * weight, 0, Math.PI * 2);
    lCtx.fill();

    for (let i = 0; i < count; i++) {
      const angle = pseudoNoise(h, i, 5) * Math.PI * 2;
      const dist = Math.pow(pseudoNoise(h, i, 11), 1.65) * 14 * weight;
      const lon = hubLon + Math.cos(angle) * dist * 1.15;
      const lat = hubLat + Math.sin(angle) * dist * 0.72;
      const x = projectLon(lon);
      const y = projectLat(lat);
      const r = 0.45 + pseudoNoise(h, i, 23) * 0.85;
      const alpha = 0.35 + pseudoNoise(h, i, 37) * 0.58;

      lCtx.fillStyle = `rgba(252, 208, 142, ${alpha.toFixed(2)})`;
      lCtx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  // 2. Fine ambient regional scatter across continental interiors
  for (let i = 0; i < 1200; i++) {
    const lon = -165 + pseudoNoise(i, 1, 7) * 336;
    const lat = -50 + pseudoNoise(i, 2, 13) * 116;
    const x = projectLon(lon);
    const y = projectLat(lat);
    const r = 0.45 + pseudoNoise(i, 3, 29) * 0.7;
    const alpha = 0.16 + pseudoNoise(i, 4, 41) * 0.36;

    lCtx.fillStyle = `rgba(240, 190, 122, ${alpha.toFixed(2)})`;
    lCtx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // 3. Ultra-fine illuminated regional corridors inside landmasses
  lCtx.strokeStyle = 'rgba(213, 172, 112, 0.12)';
  lCtx.lineWidth = 0.6;
  for (let i = 0; i < 160; i++) {
    const lon = -135 + pseudoNoise(i, 5, 3) * 280;
    const lat = -38 + pseudoNoise(i, 6, 11) * 98;
    const dx = (pseudoNoise(i, 7, 17) - 0.5) * 34;
    const dy = (pseudoNoise(i, 8, 23) - 0.5) * 22;
    const x1 = projectLon(lon);
    const y1 = projectLat(lat);
    lCtx.beginPath();
    lCtx.moveTo(x1, y1);
    lCtx.lineTo(x1 + dx, y1 + dy);
    lCtx.stroke();
  }

  // Mask city lights cleanly to landmasses in one GPU/canvas blit
  lCtx.globalCompositeOperation = 'destination-in';
  lCtx.drawImage(maskCanvas, 0, 0);

  eCtx.drawImage(lightsCanvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.52;
  ctx.drawImage(lightsCanvas, 0, 0);
  ctx.restore();

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = maxAnisotropy;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;

  return { colorMap, emissiveMap, roughnessMap, bumpMap };
}
