import * as THREE from 'three';

function hash2D(x: number, y: number, seed: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.17) * 43758.5453;
  return v - Math.floor(v);
}

export interface MaterialTextureSet {
  colorMap?: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Carved dark twilight sandstone textures for temple pillars, architraves, and lintels.
 * Rich mineral grain, carved ornamental bands, and crisp bump/roughness variation.
 */
export function createCarvedSandstoneTextures(maxAnisotropy: number): MaterialTextureSet {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  // Base midnight-warm temple stone hue (never flat black)
  cCtx.fillStyle = '#2B2B38';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#C8C8C8';
  rCtx.fillRect(0, 0, size, size);

  // Mineral strata + stone chisel flecks
  for (let y = 0; y < size; y += 3) {
    const strata = Math.sin((y / size) * Math.PI * 10) * 6 + (hash2D(1, y, 5) - 0.5) * 14;
    const r = Math.max(30, Math.min(72, Math.round(45 + strata)));
    const g = Math.max(30, Math.min(68, Math.round(43 + strata * 0.9)));
    const b = Math.max(40, Math.min(82, Math.round(56 + strata * 0.8)));
    cCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.55)`;
    cCtx.fillRect(0, y, size, 3);

    const bumpLum = Math.max(92, Math.min(168, Math.round(128 + strata * 2.1)));
    bCtx.fillStyle = `rgb(${bumpLum}, ${bumpLum}, ${bumpLum})`;
    bCtx.fillRect(0, y, size, 3);
  }

  // Carved horizontal ornamental friezes & vertical pillar fluting cues
  const bands = [64, 192, 320, 448];
  for (const bandY of bands) {
    cCtx.fillStyle = 'rgba(182, 145, 82, 0.16)';
    cCtx.fillRect(0, bandY - 6, size, 12);

    bCtx.fillStyle = '#A8A8A8';
    bCtx.fillRect(0, bandY - 5, size, 10);
    bCtx.fillStyle = '#525252';
    bCtx.fillRect(0, bandY - 8, size, 3);
    bCtx.fillRect(0, bandY + 5, size, 3);

    // Repeating carved lotus-petal motif along frieze
    cCtx.strokeStyle = 'rgba(213, 172, 112, 0.24)';
    cCtx.lineWidth = 1.4;
    bCtx.strokeStyle = '#DEDEDE';
    bCtx.lineWidth = 1.8;
    for (let x = 0; x < size; x += 32) {
      cCtx.beginPath();
      cCtx.arc(x + 16, bandY, 8, Math.PI, 0);
      cCtx.stroke();

      bCtx.beginPath();
      bCtx.arc(x + 16, bandY, 8, Math.PI, 0);
      bCtx.stroke();
    }
  }

  // Vertical shallow fluting shadows
  for (let x = 0; x < size; x += 32) {
    cCtx.fillStyle = 'rgba(12, 14, 24, 0.22)';
    cCtx.fillRect(x, 0, 5, size);
    bCtx.fillStyle = 'rgba(65, 65, 65, 0.5)';
    bCtx.fillRect(x, 0, 5, size);
    rCtx.fillStyle = '#DEDEDE';
    rCtx.fillRect(x, 0, 5, size);
  }

  const configure = (tex: THREE.CanvasTexture, srgb = false) => {
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  const colorMap = configure(new THREE.CanvasTexture(cCanvas), true);
  const bumpMap = configure(new THREE.CanvasTexture(bCanvas));
  const roughnessMap = configure(new THREE.CanvasTexture(rCanvas));

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
 * Hand-chased antique gold leaf micro-relief for the lotus emblem and pillar collars.
 */
export function createHammeredGoldTextures(maxAnisotropy: number): MaterialTextureSet {
  const size = 256;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#4A4A4A';
  rCtx.fillRect(0, 0, size, size);

  // Fine brushed directional striations + delicate chasing veins
  for (let y = 0; y < size; y += 2) {
    const grain = (hash2D(3, y, 17) - 0.5) * 32;
    const bVal = Math.max(96, Math.min(168, Math.round(128 + grain)));
    bCtx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
    bCtx.fillRect(0, y, size, 2);

    const rVal = Math.max(48, Math.min(115, Math.round(72 + grain * 0.7)));
    rCtx.fillStyle = `rgb(${rVal}, ${rVal}, ${rVal})`;
    rCtx.fillRect(0, y, size, 2);
  }

  // Subtle hammered dimples
  for (let i = 0; i < 240; i += 1) {
    const x = hash2D(i, 1, 11) * size;
    const y = hash2D(i, 2, 23) * size;
    const radius = 2 + hash2D(i, 3, 37) * 5;
    bCtx.fillStyle = 'rgba(155, 155, 155, 0.25)';
    bCtx.beginPath();
    bCtx.arc(x, y, radius, 0, Math.PI * 2);
    bCtx.fill();
  }

  const configure = (tex: THREE.CanvasTexture) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  const bumpMap = configure(new THREE.CanvasTexture(bCanvas));
  const roughnessMap = configure(new THREE.CanvasTexture(rCanvas));

  return {
    bumpMap,
    roughnessMap,
    dispose: () => {
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/**
 * Honed dark temple courtyard paving slabs with brass-inlay seams.
 */
export function createSanctumFloorTextures(maxAnisotropy: number): MaterialTextureSet {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  cCtx.fillStyle = '#141B2D';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Smooth honed specular sheen in center of paving slabs
  rCtx.fillStyle = '#606060';
  rCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 650; i += 1) {
    const x = hash2D(i, 4, 7) * size;
    const y = hash2D(i, 5, 13) * size;
    const w = 16 + hash2D(i, 6, 19) * 56;
    const shade = hash2D(i, 7, 29) > 0.5 ? 'rgba(34, 46, 74, 0.14)' : 'rgba(10, 14, 24, 0.2)';
    cCtx.fillStyle = shade;
    cCtx.fillRect(x, y, w, 2);
  }

  // Stone slab grid with subtle warm brass joint seams
  const step = 128;
  cCtx.strokeStyle = 'rgba(213, 172, 112, 0.16)';
  cCtx.lineWidth = 2;
  bCtx.strokeStyle = '#3A3A3A';
  bCtx.lineWidth = 3;
  rCtx.strokeStyle = '#B8B8B8';
  rCtx.lineWidth = 3;

  for (let i = 0; i <= size; i += step) {
    cCtx.beginPath();
    cCtx.moveTo(i, 0);
    cCtx.lineTo(i, size);
    cCtx.stroke();
    cCtx.beginPath();
    cCtx.moveTo(0, i);
    cCtx.lineTo(size, i);
    cCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(i, 0);
    bCtx.lineTo(i, size);
    bCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(0, i);
    bCtx.lineTo(size, i);
    bCtx.stroke();

    rCtx.beginPath();
    rCtx.moveTo(i, 0);
    rCtx.lineTo(i, size);
    rCtx.stroke();
    rCtx.beginPath();
    rCtx.moveTo(0, i);
    rCtx.lineTo(size, i);
    rCtx.stroke();
  }

  const configure = (tex: THREE.CanvasTexture, srgb = false) => {
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 12);
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  const colorMap = configure(new THREE.CanvasTexture(cCanvas), true);
  const bumpMap = configure(new THREE.CanvasTexture(bCanvas));
  const roughnessMap = configure(new THREE.CanvasTexture(rCanvas));

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
