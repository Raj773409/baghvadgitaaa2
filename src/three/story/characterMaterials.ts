import * as THREE from 'three';
import type { CharacterAssetManifestEntry } from './assetManifest';

export interface ProceduralCharacterTextureBank {
  skinNormal: THREE.CanvasTexture;
  skinRoughness: THREE.CanvasTexture;
  silkNormal: THREE.CanvasTexture;
  silkRoughness: THREE.CanvasTexture;
  metalNormal: THREE.CanvasTexture;
  metalRoughness: THREE.CanvasTexture;
  hairNormal: THREE.CanvasTexture;
  coatNormal: THREE.CanvasTexture;
  hideNormal: THREE.CanvasTexture;
  hideRoughness: THREE.CanvasTexture;
  dispose: () => void;
}

function deterministicNoise(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.12) * 43758.5453123;
  return s - Math.floor(s);
}

/**
 * Generates a seamless tileable CanvasTexture normal map from a deterministic height evaluator.
 */
function buildNormalMapFromHeight(
  size: number,
  heightFn: (u: number, v: number) => number,
  strength: number,
  repeat: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      heights[y * size + x] = heightFn(x / size, y / size);
    }
  }

  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const dX = (heights[y * size + xNext] - heights[y * size + xPrev]) * strength;
      const dY = (heights[yNext * size + x] - heights[yPrev * size + x]) * strength;

      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * size + x) * 4;
      data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a tileable grayscale roughness modulation map (NoColorSpace).
 */
function buildRoughnessMapFromValue(
  size: number,
  valFn: (u: number, v: number) => number,
  repeat: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = Math.max(0, Math.min(255, Math.round(valFn(x / size, y / size) * 255)));
      const idx = (y * size + x) * 4;
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates a reusable procedural PBR micro-texture bank for realistic human skin,
 * silk garments, hammered gold/bronze armor, hair strands, horse coats, and elephant hide.
 */
export function createCharacterTextureBank(
  renderer?: THREE.WebGLRenderer,
): ProceduralCharacterTextureBank | null {
  if (typeof document === 'undefined') return null;

  const maxAnisotropy = renderer
    ? Math.min(8, renderer.capabilities.getMaxAnisotropy())
    : 4;

  // 1. Human skin pore + fine micro-dermis normal & oiliness variation
  const skinNormal = buildNormalMapFromHeight(
    128,
    (u, v) => {
      const n1 = deterministicNoise(Math.floor(u * 64), Math.floor(v * 64), 1);
      const cell = Math.sin(u * Math.PI * 36) * Math.sin(v * Math.PI * 36) * 0.32;
      const crease = Math.sin((u + v * 0.4) * Math.PI * 16) * 0.14;
      return n1 * 0.48 + cell + crease;
    },
    1.15,
    6,
    maxAnisotropy,
  );

  const skinRoughness = buildRoughnessMapFromValue(
    128,
    (u, v) => {
      const blotch =
        0.5 +
        0.5 * Math.sin(u * Math.PI * 8 + Math.cos(v * Math.PI * 6)) * Math.cos(v * Math.PI * 8);
      const grain = deterministicNoise(Math.floor(u * 48), Math.floor(v * 48), 2);
      return 0.72 + blotch * 0.16 + grain * 0.1;
    },
    3,
    maxAnisotropy,
  );

  // 2. Woven Kanchipuram/Banarasi silk cloth weave (warp + weft)
  const silkNormal = buildNormalMapFromHeight(
    128,
    (u, v) => {
      const warp = Math.sin(u * Math.PI * 64);
      const weft = Math.sin(v * Math.PI * 64);
      const brocade = Math.sin((u + v) * Math.PI * 12) * 0.28;
      return (warp + weft) * 0.35 + brocade;
    },
    1.35,
    8,
    maxAnisotropy,
  );

  const silkRoughness = buildRoughnessMapFromValue(
    128,
    (u, v) => {
      const weave = 0.5 + 0.5 * Math.sin(u * Math.PI * 48) * Math.sin(v * Math.PI * 48);
      return 0.68 + weave * 0.24;
    },
    6,
    maxAnisotropy,
  );

  // 3. Hammered royal gold / bronze / steel armor relief
  const metalNormal = buildNormalMapFromHeight(
    128,
    (u, v) => {
      const dimple =
        Math.sin(u * Math.PI * 18) * Math.cos(v * Math.PI * 18) * 0.4 +
        Math.sin((u * 1.4 - v * 0.8) * Math.PI * 22) * 0.25;
      const filigree = Math.sin(u * Math.PI * 8) * Math.sin(v * Math.PI * 8) * 0.25;
      const grain = deterministicNoise(Math.floor(u * 40), Math.floor(v * 40), 7) * 0.15;
      return dimple + filigree + grain;
    },
    1.5,
    4,
    maxAnisotropy,
  );

  const metalRoughness = buildRoughnessMapFromValue(
    128,
    (u, v) => {
      const patina = Math.sin(u * Math.PI * 10) * Math.sin(v * Math.PI * 10);
      const wear = deterministicNoise(Math.floor(u * 36), Math.floor(v * 36), 9);
      return 0.52 + patina * 0.18 + wear * 0.22;
    },
    4,
    maxAnisotropy,
  );

  // 4. Fine longitudinal hair strands
  const hairNormal = buildNormalMapFromHeight(
    128,
    (u, v) => {
      const strand = Math.sin(u * Math.PI * 96 + Math.sin(v * Math.PI * 6) * 1.8);
      const clump = Math.sin(u * Math.PI * 22) * 0.45;
      return strand * 0.65 + clump;
    },
    1.8,
    4,
    maxAnisotropy,
  );

  // 5. Short silky equine coat (Saindhava steeds)
  const coatNormal = buildNormalMapFromHeight(
    128,
    (u, v) => {
      const hair = Math.sin(v * Math.PI * 72 + deterministicNoise(Math.floor(u * 64), Math.floor(v * 16), 11) * 3.14);
      const sheen = Math.sin(u * Math.PI * 14) * 0.2;
      return hair * 0.55 + sheen;
    },
    1.05,
    6,
    maxAnisotropy,
  );

  // 6. Deeply creased elephant hide (Gajendra)
  const hideNormal = buildNormalMapFromHeight(
    128,
    (u, v) => {
      const deepFold = Math.sin(v * Math.PI * 18 + Math.sin(u * Math.PI * 6) * 0.9);
      const crossFold = Math.sin(u * Math.PI * 28 + Math.cos(v * Math.PI * 8) * 0.7) * 0.55;
      const pebble = deterministicNoise(Math.floor(u * 40), Math.floor(v * 40), 15) * 0.35;
      return deepFold + crossFold + pebble;
    },
    2.4,
    5,
    maxAnisotropy,
  );

  const hideRoughness = buildRoughnessMapFromValue(
    128,
    (u, v) => {
      const fold = 0.5 + 0.5 * Math.sin(v * Math.PI * 18);
      return 0.72 + fold * 0.24;
    },
    5,
    maxAnisotropy,
  );

  const allTex = [
    skinNormal,
    skinRoughness,
    silkNormal,
    silkRoughness,
    metalNormal,
    metalRoughness,
    hairNormal,
    coatNormal,
    hideNormal,
    hideRoughness,
  ];

  return {
    skinNormal,
    skinRoughness,
    silkNormal,
    silkRoughness,
    metalNormal,
    metalRoughness,
    hairNormal,
    coatNormal,
    hideNormal,
    hideRoughness,
    dispose: () => {
      for (const tex of allTex) tex.dispose();
    },
  };
}

function upgradeSingleMaterial(
  mat: THREE.Material,
  meshName: string,
  entry: CharacterAssetManifestEntry,
  bank: ProceduralCharacterTextureBank,
  disposers: Array<() => void>,
): THREE.Material {
  const std = mat as THREE.MeshStandardMaterial & Partial<THREE.MeshPhysicalMaterial>;
  if (!std || (!std.isMeshStandardMaterial && !std.isMeshPhysicalMaterial)) {
    return mat;
  }

  const mName = (std.name || '').toLowerCase();
  const isFace = meshName.includes('FacialMorphMesh') || mName.includes('skin');
  const isEyeCornea =
    meshName.includes('EyeCornea') ||
    meshName.includes('EyeMesh') ||
    mName.includes('eye_cornea') ||
    mName.includes('cornea');
  const isEyeSclera = mName.includes('eye_sclera');
  const isSilk = mName.includes('silk') || mName.includes('cloth') || mName.includes('caparison');
  const isMetal =
    mName.includes('gold') ||
    mName.includes('bronze') ||
    mName.includes('silver') ||
    mName.includes('armor') ||
    std.metalness > 0.65;
  const isHair = mName.includes('hair') || mName.includes('mane') || mName.includes('beard');
  const isHorseCoat =
    mName.includes('equine_coat') ||
    (entry.id === 'white_horses' && !isSilk && !isMetal && !isHair && !isEyeCornea);
  const isElephantHide =
    mName.includes('elephant_hide') ||
    (entry.id === 'war_elephant' && !isSilk && !isMetal && !isEyeCornea);

  const phys = new THREE.MeshPhysicalMaterial({
    name: std.name,
    color: std.color ? std.color.clone() : new THREE.Color(0xffffff),
    vertexColors: std.vertexColors,
    side: std.side,
    roughness: std.roughness,
    metalness: std.metalness,
    envMapIntensity: 1.15,
  });

  if (isEyeCornea) {
    phys.roughness = 0.04;
    phys.metalness = 0.0;
    phys.clearcoat = 1.0;
    phys.clearcoatRoughness = 0.03;
    phys.ior = 1.44;
    phys.envMapIntensity = 1.55;
  } else if (isEyeSclera) {
    phys.roughness = 0.14;
    phys.metalness = 0.0;
    phys.clearcoat = 0.85;
    phys.clearcoatRoughness = 0.06;
    phys.envMapIntensity = 1.25;
  } else if (isFace) {
    // Natural human skin dermis micro-pores + soft subsurface-like warm sheen
    phys.roughness = 0.48;
    phys.metalness = 0.02;
    phys.sheen = 0.28;
    phys.sheenRoughness = 0.62;
    phys.sheenColor = new THREE.Color(
      entry.id === 'krishna' ? 0x6ea8ff : 0xffcfb4,
    );
    phys.clearcoat = 0.08;
    phys.clearcoatRoughness = 0.52;
    phys.normalMap = bank.skinNormal;
    phys.normalScale = new THREE.Vector2(0.18, 0.18);
    phys.roughnessMap = bank.skinRoughness;
  } else if (isSilk) {
    phys.roughness = 0.56;
    phys.metalness = Math.min(0.14, std.metalness);
    phys.sheen = 0.78;
    phys.sheenRoughness = 0.4;
    phys.sheenColor = new THREE.Color(0xfff1cc);
    phys.normalMap = bank.silkNormal;
    phys.normalScale = new THREE.Vector2(0.32, 0.32);
    phys.roughnessMap = bank.silkRoughness;
  } else if (isMetal) {
    phys.roughness = Math.max(0.2, Math.min(0.34, std.roughness || 0.25));
    phys.metalness = Math.max(0.84, std.metalness || 0.88);
    phys.clearcoat = 0.24;
    phys.clearcoatRoughness = 0.2;
    phys.anisotropy = 0.35;
    phys.envMapIntensity = 1.32;
    phys.normalMap = bank.metalNormal;
    phys.normalScale = new THREE.Vector2(0.26, 0.26);
    phys.roughnessMap = bank.metalRoughness;
  } else if (isHair) {
    phys.roughness = 0.52;
    phys.metalness = 0.04;
    phys.sheen = 0.42;
    phys.sheenRoughness = 0.34;
    phys.sheenColor = new THREE.Color(0xdad4e0);
    phys.normalMap = bank.hairNormal;
    phys.normalScale = new THREE.Vector2(0.45, 0.45);
  } else if (isHorseCoat) {
    phys.roughness = 0.46;
    phys.metalness = 0.02;
    phys.sheen = 0.48;
    phys.sheenRoughness = 0.42;
    phys.sheenColor = new THREE.Color(0xfff8ed);
    phys.normalMap = bank.coatNormal;
    phys.normalScale = new THREE.Vector2(0.28, 0.28);
  } else if (isElephantHide) {
    phys.roughness = 0.84;
    phys.metalness = 0.02;
    phys.normalMap = bank.hideNormal;
    phys.normalScale = new THREE.Vector2(0.65, 0.65);
    phys.roughnessMap = bank.hideRoughness;
  }

  std.dispose();
  disposers.push(() => phys.dispose());
  return phys;
}

/**
 * Enhances all loaded character materials with physically-based skin sheen,
 * wet corneal eye speculars, woven silk threads, hammered gold filigree,
 * hair strands, and hide/coat normal detail in browser runtime.
 */
export function enhanceCharacterSceneMaterials(
  sceneRoot: THREE.Object3D,
  entry: CharacterAssetManifestEntry,
  bank: ProceduralCharacterTextureBank | null,
  disposers: Array<() => void>,
): void {
  if (!bank) return;

  sceneRoot.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) =>
        upgradeSingleMaterial(m, mesh.name || '', entry, bank, disposers),
      );
    } else {
      mesh.material = upgradeSingleMaterial(
        mesh.material,
        mesh.name || '',
        entry,
        bank,
        disposers,
      );
    }
  });
}
