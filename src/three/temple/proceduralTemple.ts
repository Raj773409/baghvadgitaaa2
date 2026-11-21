import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createCarvedSandstoneTextures,
  createHammeredGoldTextures,
  type MaterialTextureSet,
} from '../welcome/templeMaterials';
import {
  TEMPLE_PALETTE,
  createCarvedWallTexture,
  createCofferedCeilingTexture,
  createDrapeTexture,
  createFlameSpriteTexture,
  createMarbleFloorTexture,
  createSanctumBackdropTexture,
  createWallBumpTexture,
} from './procedural/templeTextures';

/**
 * Fully-3D procedural sanctum ("3D Sanctum" mode).
 *
 * World layout (metres, y-up; camera ≈ (0,1.75,2.6) → (0,1.35,-2.5)):
 *   floor y=0 · hall x∈[-4.5,4.5], z∈[-6.5,3.5] · ceiling y=5.2
 *   kept EMPTY for the parent: x∈[-1.2,1.2]×z∈[-0.6,0.9] (book stand + diyas) and a 0.6 m
 *   sphere around (0,1.6,-3.4) (circling aarti lamp)
 *   altar platform z∈[-6.2,-4.6], top y=0.75 · deity slot (0,0.75,-5.3), height ≈1.9
 *   priest slot (-0.95,0,-3.6) facing the altar
 *
 * Deities and people are NEVER modelled from primitives. Until licensed models are dropped at
 * DEITY_MODEL_URL / PANDIT_MODEL_URL, the altar shows the supplied devotional painting in a
 * gold frame and the priest slot stays empty.
 */

export interface TempleLayer {
  group: THREE.Group;
  update(timeSec: number, dtSec: number): void;
  dispose(): void;
}

export interface ProceduralTempleOptions {
  renderer: THREE.WebGLRenderer;
  quality: 'low' | 'high';
  deityFallbackTexture: THREE.Texture;
}

export const DEITY_MODEL_URL = '/assets/temple/deities/radha-krishna.glb';
export const PANDIT_MODEL_URL = '/assets/temple/characters/pandit.glb';

const DEITY_SLOT = new THREE.Vector3(0, 0.75, -5.3);
const DEITY_HEIGHT = 1.9;
const PRIEST_SLOT = new THREE.Vector3(-0.95, 0, -3.6);
const PRIEST_HEIGHT = 1.7;

/**
 * True only when a real binary model is served. The SPA fallback answers unknown paths with
 * index.html (200, text/html), so status alone is not enough.
 */
async function modelAssetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return false;
    const type = (res.headers.get('content-type') ?? '').toLowerCase();
    if (type.includes('text/html')) return false;
    const len = Number(res.headers.get('content-length') ?? '1');
    return len > 0;
  } catch {
    return false;
  }
}

export function hasLicensedDeityModel(): Promise<boolean> {
  return modelAssetExists(DEITY_MODEL_URL);
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Points along a multi-foil (scalloped) arch, left → right. Cusps sit on the base ellipse and
 * each lobe bulges outward, giving the inward-pointing cusps of a traditional cusped arch.
 */
function multiFoilPoints(
  springY: number,
  rx: number,
  ry: number,
  lobes: number,
  depth: number,
  samples: number,
): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = Math.PI - (Math.PI * i) / samples;
    const bx = rx * Math.cos(t);
    const by = springY + ry * Math.sin(t);
    const nx = Math.cos(t) / rx;
    const ny = Math.sin(t) / ry;
    const nl = Math.hypot(nx, ny) || 1;
    const bulge = depth * Math.abs(Math.sin(lobes * t));
    pts.push(new THREE.Vector2(bx + (nx / nl) * bulge, by + (ny / nl) * bulge));
  }
  return pts;
}

/** Parabolic catenary approximation between two points. */
function catenaryPoint(a: THREE.Vector3, b: THREE.Vector3, sag: number, s: number, out: THREE.Vector3): THREE.Vector3 {
  out.lerpVectors(a, b, s);
  out.y -= sag * 4 * s * (1 - s);
  return out;
}

function pillarProfile(): THREE.Vector2[] {
  // (radius, height) from the plinth top upward; lotus-bell capital and abacus at the top.
  const p: Array<[number, number]> = [
    [0, 0], [0.4, 0], [0.4, 0.12], [0.36, 0.16], [0.36, 0.3], [0.32, 0.34], [0.3, 0.4],
    [0.27, 0.48], [0.25, 0.55], [0.25, 1.2], [0.245, 2.0], [0.24, 2.8], [0.22, 2.9],
    [0.23, 2.95], [0.26, 3.0], [0.31, 3.12], [0.36, 3.25], [0.4, 3.38], [0.41, 3.45],
    [0.33, 3.47], [0.36, 3.5], [0.36, 3.65], [0, 3.65],
  ];
  return p.map(([r, y]) => new THREE.Vector2(r, y));
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildProceduralTemple(opts: ProceduralTempleOptions): TempleLayer {
  const { renderer, quality, deityFallbackTexture } = opts;
  const high = quality === 'high';
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const radialSegs = high ? 28 : 14;
  const group = new THREE.Group();
  group.name = 'ProceduralTemple';

  const ownedTextures: THREE.Texture[] = [];
  const ownedTextureSets: MaterialTextureSet[] = [];
  const own = <T extends THREE.Texture>(t: T): T => {
    ownedTextures.push(t);
    return t;
  };

  // ---------------- Materials ----------------
  const sandstoneTex = createCarvedSandstoneTextures(aniso);
  const goldTex = createHammeredGoldTextures(aniso);
  ownedTextureSets.push(sandstoneTex, goldTex);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#E3CFA6',
    roughness: 1,
    roughnessMap: sandstoneTex.roughnessMap,
    bumpMap: sandstoneTex.bumpMap,
    bumpScale: 1.4,
    metalness: 0,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: TEMPLE_PALETTE.gold,
    metalness: 1,
    roughness: 0.55,
    roughnessMap: goldTex.roughnessMap,
    bumpMap: goldTex.bumpMap,
    bumpScale: 0.8,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#B8862A',
    metalness: 0.92,
    roughness: 0.32,
    side: THREE.DoubleSide,
  });
  const altarMarbleMat = new THREE.MeshStandardMaterial({ color: '#F3EBDC', roughness: 0.2, metalness: 0 });

  // ---------------- Floor ----------------
  const floorTex = own(createMarbleFloorTexture(high ? 2048 : 1024, aniso));
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 10),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.16, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -1.5);
  floor.receiveShadow = true;
  group.add(floor);

  // ---------------- Walls & ceiling ----------------
  const wallBump = own(createWallBumpTexture(512, aniso));
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 5.2),
    new THREE.MeshStandardMaterial({
      map: own(createCarvedWallTexture(9, 5.2, high ? 1024 : 512, aniso)),
      bumpMap: wallBump,
      bumpScale: 1.2,
      roughness: 0.85,
    }),
  );
  backWall.position.set(0, 2.6, -6.5);
  backWall.receiveShadow = true;
  group.add(backWall);

  const sideWallMat = new THREE.MeshStandardMaterial({
    map: own(createCarvedWallTexture(10, 5.2, high ? 1024 : 512, aniso, true)),
    bumpMap: wallBump,
    bumpScale: 1.2,
    roughness: 0.85,
    emissive: new THREE.Color('#3A2410'),
    emissiveIntensity: 0.25,
  });
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.2), sideWallMat);
    wall.rotation.y = -sx * (Math.PI / 2);
    wall.position.set(sx * 4.5, 2.6, -1.5);
    wall.receiveShadow = true;
    group.add(wall);
  }

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 10),
    new THREE.MeshStandardMaterial({ map: own(createCofferedCeilingTexture(high ? 1024 : 512, aniso)), roughness: 0.7 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 5.2, -1.5);
  group.add(ceiling);

  // ---------------- Pillars (merged) ----------------
  const PILLAR_Z = [1.5, -1.2, -3.9];
  const PLINTH_H = 0.2;
  const COLUMN_TOP = PLINTH_H + 3.65; // 3.85
  const LINTEL_BOTTOM = 4.27;
  const stoneParts: THREE.BufferGeometry[] = [];
  const goldParts: THREE.BufferGeometry[] = [];
  const lathe = new THREE.LatheGeometry(pillarProfile(), radialSegs);
  for (const sx of [-1, 1]) {
    for (const z of PILLAR_Z) {
      const x = sx * 3.2;
      stoneParts.push(new THREE.BoxGeometry(0.95, PLINTH_H, 0.95).translate(x, PLINTH_H / 2, z));
      stoneParts.push(lathe.clone().translate(x, PLINTH_H, z));
      stoneParts.push(
        new THREE.BoxGeometry(0.78, LINTEL_BOTTOM - COLUMN_TOP, 0.78).translate(x, (COLUMN_TOP + LINTEL_BOTTOM) / 2, z),
      );
      for (const by of [0.55, 1.2, 2.0, 2.85]) {
        goldParts.push(
          new THREE.TorusGeometry(0.252, 0.024, 8, radialSegs).rotateX(Math.PI / 2).translate(x, PLINTH_H + by, z),
        );
      }
      goldParts.push(new THREE.TorusGeometry(0.405, 0.03, 8, radialSegs).rotateX(Math.PI / 2).translate(x, PLINTH_H + 3.45, z));
      goldParts.push(new THREE.BoxGeometry(0.82, 0.05, 0.82).translate(x, COLUMN_TOP + 0.025, z));
    }
  }
  lathe.dispose();

  // Lintels: one beam along each side + one across the hall above every arch row
  for (const sx of [-1, 1]) {
    stoneParts.push(new THREE.BoxGeometry(0.7, 0.42, 6.4).translate(sx * 3.2, LINTEL_BOTTOM + 0.21, -1.2));
  }
  for (const z of PILLAR_Z) {
    stoneParts.push(new THREE.BoxGeometry(7.1, 0.42, 0.6).translate(0, LINTEL_BOTTOM + 0.21, z));
    goldParts.push(new THREE.BoxGeometry(7.1, 0.045, 0.62).translate(0, LINTEL_BOTTOM + 0.02, z));
  }

  // ---------------- Cusped arches spanning the hall ----------------
  const archFoil = multiFoilPoints(3.0, 2.8, 0.95, 7, 0.18, high ? 140 : 70);
  const spandrel = new THREE.Shape();
  spandrel.moveTo(-3.3, LINTEL_BOTTOM);
  spandrel.lineTo(3.3, LINTEL_BOTTOM);
  spandrel.lineTo(3.3, 3.0);
  for (let i = archFoil.length - 1; i >= 0; i--) spandrel.lineTo(archFoil[i].x, archFoil[i].y);
  spandrel.lineTo(-3.3, 3.0);
  spandrel.closePath();
  const archGeo = new THREE.ExtrudeGeometry(spandrel, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: high ? 2 : 1,
    curveSegments: 4,
  });
  archGeo.translate(0, 0, -0.21);
  const trimCurve = new THREE.CatmullRomCurve3(archFoil.map((p) => new THREE.Vector3(p.x, p.y, 0)));
  const trimGeo = new THREE.TubeGeometry(trimCurve, high ? 160 : 80, 0.028, 6, false);
  for (const z of PILLAR_Z) {
    stoneParts.push(archGeo.clone().translate(0, 0, z));
    goldParts.push(trimGeo.clone().translate(0, 0, z + 0.25));
  }
  archGeo.dispose();
  trimGeo.dispose();

  const toNonIndexedUv = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
    // mergeGeometries needs identical attribute sets; ExtrudeGeometry is non-indexed.
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    if (!n.getAttribute('uv')) {
      n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.getAttribute('position').count * 2), 2));
    }
    return n;
  };

  const stoneMerged = mergeGeometries(stoneParts.map(toNonIndexedUv), false);
  const goldMerged = mergeGeometries(goldParts.map(toNonIndexedUv), false);
  if (stoneMerged) {
    const mesh = new THREE.Mesh(stoneMerged, stoneMat);
    mesh.castShadow = high;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  if (goldMerged) {
    const mesh = new THREE.Mesh(goldMerged, goldMat);
    mesh.castShadow = high;
    group.add(mesh);
  }

  // ---------------- Altar platform ----------------
  const altar = new THREE.Group();
  const steps: Array<{ w: number; y0: number; z0: number }> = [
    { w: 4.4, y0: 0, z0: -4.6 },
    { w: 3.8, y0: 0.25, z0: -4.85 },
    { w: 3.2, y0: 0.5, z0: -5.1 },
  ];
  const zBack = -6.2;
  for (const s of steps) {
    const depth = s.z0 - zBack;
    const step = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.25, depth), altarMarbleMat);
    step.position.set(0, s.y0 + 0.125, zBack + depth / 2);
    step.receiveShadow = true;
    step.castShadow = high;
    altar.add(step);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(s.w + 0.01, 0.035, 0.035), goldMat);
    trim.position.set(0, s.y0 + 0.235, s.z0);
    altar.add(trim);
  }
  group.add(altar);

  // ---------------- Torana (gold cusped arch) + sanctum backdrop ----------------
  const torana = new THREE.Group();
  torana.position.set(0, 0.75, -5.85);
  const toranaShape = new THREE.Shape();
  toranaShape.moveTo(-1.6, 0);
  toranaShape.lineTo(1.6, 0);
  toranaShape.lineTo(1.6, 3.0);
  toranaShape.lineTo(-1.6, 3.0);
  toranaShape.closePath();
  const opening = new THREE.Path();
  const toranaFoil = multiFoilPoints(1.85, 1.3, 0.75, 5, 0.12, high ? 110 : 60);
  opening.moveTo(-1.3, 0.08);
  for (const p of toranaFoil) opening.lineTo(p.x, p.y);
  opening.lineTo(1.3, 0.08);
  opening.closePath();
  toranaShape.holes.push(opening);
  const toranaMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(toranaShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: high ? 2 : 1,
      curveSegments: 4,
    }),
    goldMat,
  );
  toranaMesh.castShadow = high;
  torana.add(toranaMesh);
  // Kalasha finial + lotus-bud corner finials
  const kalasha = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0], [0.16, 0], [0.18, 0.06], [0.2, 0.14], [0.16, 0.24], [0.08, 0.3], [0.1, 0.36],
        [0.06, 0.44], [0.03, 0.56], [0, 0.62],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      radialSegs,
    ),
    goldMat,
  );
  kalasha.position.set(0, 3.0, 0.07);
  torana.add(kalasha);
  for (const sx of [-1, 1]) {
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.09, radialSegs, 10), goldMat);
    bud.scale.set(1, 1.6, 1);
    bud.position.set(sx * 1.48, 3.1, 0.07);
    torana.add(bud);
  }
  group.add(torana);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 2.95),
    new THREE.MeshStandardMaterial({
      map: own(createSanctumBackdropTexture(high ? 1024 : 512, aniso)),
      roughness: 0.9,
      emissive: new THREE.Color('#FFD9A0'),
      emissiveIntensity: 0.12,
    }),
  );
  backdrop.position.set(0, 0.75 + 1.47, -5.95);
  group.add(backdrop);

  // Curtain rod + drapes
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.2, 12).rotateZ(Math.PI / 2), goldMat);
  rod.position.set(0, 4.18, -5.7);
  group.add(rod);

  interface Drape {
    mesh: THREE.Mesh;
    base: Float32Array;
  }
  const drapes: Drape[] = [];
  for (const sx of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(0.9, 3.4, 6, 14);
    const mat = new THREE.MeshStandardMaterial({
      map: own(createDrapeTexture(high ? 512 : 256, aniso, sx > 0)),
      roughness: 0.92,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx * 1.95, 0.75 + 1.7, -5.72);
    mesh.receiveShadow = true;
    group.add(mesh);
    drapes.push({ mesh, base: Float32Array.from(geo.getAttribute('position').array as Float32Array) });
  }

  // ---------------- Deity slot: framed devotional painting fallback ----------------
  const simhasana = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 0.8), goldMat);
  simhasana.position.set(DEITY_SLOT.x, DEITY_SLOT.y + 0.08, DEITY_SLOT.z);
  simhasana.castShadow = high;
  simhasana.receiveShadow = true;
  group.add(simhasana);

  const fallback = new THREE.Group();
  const img = deityFallbackTexture.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : 4 / 3;
  const paintW = 2.2;
  const paintH = paintW / aspect;
  const frameBorder = 0.14;
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-paintW / 2 - frameBorder, -paintH / 2 - frameBorder);
  frameShape.lineTo(paintW / 2 + frameBorder, -paintH / 2 - frameBorder);
  frameShape.lineTo(paintW / 2 + frameBorder, paintH / 2 + frameBorder);
  frameShape.lineTo(-paintW / 2 - frameBorder, paintH / 2 + frameBorder);
  frameShape.closePath();
  const frameHole = new THREE.Path();
  frameHole.moveTo(-paintW / 2, -paintH / 2);
  frameHole.lineTo(-paintW / 2, paintH / 2);
  frameHole.lineTo(paintW / 2, paintH / 2);
  frameHole.lineTo(paintW / 2, -paintH / 2);
  frameHole.closePath();
  frameShape.holes.push(frameHole);
  const frame = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: high ? 3 : 1,
    }),
    goldMat,
  );
  frame.castShadow = high;
  fallback.add(frame);

  // Cusped crest above the frame
  const crestShape = new THREE.Shape();
  const crestFoil = multiFoilPoints(0, 0.75, 0.32, 5, 0.06, high ? 80 : 40);
  crestShape.moveTo(-0.75, 0);
  for (const p of crestFoil) crestShape.lineTo(p.x, p.y);
  crestShape.lineTo(0.75, 0);
  crestShape.closePath();
  const crest = new THREE.Mesh(
    new THREE.ExtrudeGeometry(crestShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }),
    goldMat,
  );
  crest.position.set(0, paintH / 2 + frameBorder - 0.01, 0.01);
  fallback.add(crest);

  const backing = new THREE.Mesh(
    new THREE.PlaneGeometry(paintW + frameBorder * 2, paintH + frameBorder * 2),
    new THREE.MeshStandardMaterial({ color: '#2A0A12', roughness: 1 }),
  );
  backing.position.z = -0.005;
  backing.rotation.y = Math.PI;
  fallback.add(backing);

  const painting = new THREE.Mesh(
    new THREE.PlaneGeometry(paintW, paintH),
    new THREE.MeshStandardMaterial({
      map: deityFallbackTexture,
      emissiveMap: deityFallbackTexture,
      emissive: new THREE.Color('#FFFFFF'),
      emissiveIntensity: 0.22,
      roughness: 0.45,
      metalness: 0,
    }),
  );
  painting.position.z = 0.045;
  fallback.add(painting);

  const paintingBaseY = DEITY_SLOT.y + 0.16;
  fallback.position.set(DEITY_SLOT.x, paintingBaseY + frameBorder + paintH / 2, DEITY_SLOT.z - 0.05);
  fallback.rotation.x = -0.04;
  group.add(fallback);

  // ---------------- Hanging bells & lamps ----------------
  const flameTex = own(createFlameSpriteTexture());
  const flameMat = new THREE.SpriteMaterial({
    map: flameTex,
    color: '#FFC870',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const bellGeo = new THREE.LatheGeometry(
    [
      [0, 0.24], [0.035, 0.235], [0.055, 0.2], [0.065, 0.14], [0.085, 0.07], [0.12, 0.015], [0.13, 0], [0.11, 0.004],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    radialSegs,
  );
  const chainGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 6);
  interface Swinger {
    pivot: THREE.Group;
    phase: number;
    amp: number;
  }
  const swingers: Swinger[] = [];
  const hang = (x: number, z: number, bottomY: number, build: (g: THREE.Group, len: number) => void, phase: number, amp: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 5.2, z);
    const len = 5.2 - bottomY;
    const chain = new THREE.Mesh(chainGeo, brassMat);
    chain.scale.y = len;
    chain.position.y = -len / 2;
    pivot.add(chain);
    const item = new THREE.Group();
    item.position.y = -len;
    build(item, len);
    pivot.add(item);
    group.add(pivot);
    swingers.push({ pivot, phase, amp });
  };

  for (const [x, z, phase] of [
    [-1.7, -4.4, 0],
    [1.7, -4.4, 1.7],
    // z=-0.4 keeps these chains clear of the arch/lintel row at z=-1.2
    [-2.3, -0.4, 0.9],
    [2.3, -0.4, 2.6],
  ] as Array<[number, number, number]>) {
    hang(
      x,
      z,
      3.35,
      (item) => {
        const bell = new THREE.Mesh(bellGeo, brassMat);
        bell.position.y = -0.24;
        item.add(bell);
      },
      phase,
      0.035,
    );
  }

  const lampBowlGeo = new THREE.LatheGeometry(
    [[0, 0], [0.12, 0.02], [0.17, 0.07], [0.185, 0.1], [0.165, 0.1]].map(([r, y]) => new THREE.Vector2(r, y)),
    radialSegs,
  );
  const flames: Array<{ sprite: THREE.Sprite; base: number; seed: number }> = [];
  const lampLights: Array<{ light: THREE.PointLight; base: number; seed: number }> = [];
  const LAMPS: Array<[number, number, boolean]> = [
    [-2.0, -1.6, true],
    [2.0, -1.6, true],
    [-2.0, -4.3, false],
    [2.0, -4.3, false],
  ];
  LAMPS.forEach(([x, z, lit], i) => {
    hang(
      x,
      z,
      3.0,
      (item) => {
        const bowl = new THREE.Mesh(lampBowlGeo, brassMat);
        item.add(bowl);
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2;
          const sprite = new THREE.Sprite(flameMat);
          sprite.position.set(Math.cos(a) * 0.12, 0.16, Math.sin(a) * 0.12);
          sprite.scale.set(0.07, 0.12, 1);
          item.add(sprite);
          flames.push({ sprite, base: 0.12, seed: i * 3.1 + k * 1.7 });
        }
        if (lit) {
          const light = new THREE.PointLight('#FFB45E', 3.5, 6, 2);
          light.position.set(0, 0.25, 0);
          item.add(light);
          lampLights.push({ light, base: 3.5, seed: i * 2.3 });
        }
      },
      i * 1.3,
      0.02,
    );
  });

  // ---------------- Garlands (instanced beads) ----------------
  type GarlandKind = 'marigold' | 'jasmine' | 'mixed';
  interface Garland {
    a: THREE.Vector3;
    b: THREE.Vector3;
    sag: number;
    kind: GarlandKind;
    fallbackOnly?: boolean;
  }
  const garlands: Garland[] = [];
  for (const sx of [-1, 1]) {
    const x = sx * 3.0;
    garlands.push({ a: new THREE.Vector3(x, 3.35, 1.4), b: new THREE.Vector3(x, 3.35, -1.1), sag: 0.45, kind: 'mixed' });
    garlands.push({ a: new THREE.Vector3(x, 3.35, -1.3), b: new THREE.Vector3(x, 3.35, -3.8), sag: 0.45, kind: 'mixed' });
  }
  garlands.push({ a: new THREE.Vector3(-2.9, 3.05, -3.62), b: new THREE.Vector3(2.9, 3.05, -3.62), sag: 0.55, kind: 'marigold' });
  garlands.push({ a: new THREE.Vector3(-2.9, 3.1, -0.92), b: new THREE.Vector3(2.9, 3.1, -0.92), sag: 0.5, kind: 'mixed' });
  garlands.push({ a: new THREE.Vector3(-1.55, 3.6, -5.68), b: new THREE.Vector3(1.55, 3.6, -5.68), sag: 0.35, kind: 'jasmine' });
  for (const x of [-2.75, -2.3, 2.3, 2.75]) {
    garlands.push({ a: new THREE.Vector3(x, 3.02, -3.62), b: new THREE.Vector3(x, 2.05, -3.62), sag: 0, kind: 'marigold' });
  }
  const frameTopY = paintingBaseY + frameBorder * 2 + paintH;
  garlands.push({
    a: new THREE.Vector3(-paintW / 2, frameTopY, DEITY_SLOT.z + 0.02),
    b: new THREE.Vector3(paintW / 2, frameTopY, DEITY_SLOT.z + 0.02),
    sag: 0.32,
    kind: 'mixed',
    fallbackOnly: true,
  });

  const garlandLength = (g: Garland) => {
    let len = 0;
    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();
    catenaryPoint(g.a, g.b, g.sag, 0, p0);
    for (let i = 1; i <= 24; i++) {
      catenaryPoint(g.a, g.b, g.sag, i / 24, p1);
      len += p1.distanceTo(p0);
      p0.copy(p1);
    }
    return len;
  };

  const buildBeads = (list: Garland[], targetBeads: number): THREE.InstancedMesh | null => {
    if (list.length === 0) return null;
    const lengths = list.map(garlandLength);
    const total = lengths.reduce((s, l) => s + l, 0);
    const counts = lengths.map((l) => Math.max(6, Math.round((l / total) * targetBeads)));
    const n = counts.reduce((s, c) => s + c, 0);
    const beadGeo = new THREE.IcosahedronGeometry(0.04, high ? 1 : 0);
    const beadMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
    const mesh = new THREE.InstancedMesh(beadGeo, beadMat, n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    const MARIGOLD = ['#F28C1E', '#F6B21E', '#E8741A'];
    const JASMINE = '#F7F3E6';
    let idx = 0;
    list.forEach((g, gi) => {
      for (let i = 0; i < counts[gi]; i++) {
        const t = counts[gi] === 1 ? 0.5 : i / (counts[gi] - 1);
        catenaryPoint(g.a, g.b, g.sag, t, p);
        e.set(i * 1.3, i * 0.7, i * 2.1);
        q.setFromEuler(e);
        const jas = g.kind === 'jasmine' || (g.kind === 'mixed' && Math.floor(i / 5) % 2 === 1);
        const k = jas ? 0.7 : 1 + ((i * 7) % 3) * 0.08;
        s.set(k, k * (jas ? 1.3 : 0.85), k);
        m.compose(p, q, s);
        mesh.setMatrixAt(idx, m);
        c.set(jas ? JASMINE : MARIGOLD[(i + gi) % MARIGOLD.length]);
        mesh.setColorAt(idx, c);
        idx++;
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  };

  const beadBudget = high ? 600 : 200;
  const hallBeads = buildBeads(garlands.filter((g) => !g.fallbackOnly), Math.round(beadBudget * 0.88));
  if (hallBeads) group.add(hallBeads);
  const frameBeads = buildBeads(garlands.filter((g) => g.fallbackOnly), Math.round(beadBudget * 0.12));
  if (frameBeads) group.add(frameBeads); // separate so it hides with the painting

  // ---------------- Lights (max 4 in this layer) ----------------
  const altarLight = new THREE.PointLight('#FFC77A', 10, 9, 2);
  altarLight.position.set(0, 2.4, -4.3);
  if (high) {
    altarLight.castShadow = true;
    altarLight.shadow.mapSize.set(1024, 1024);
    altarLight.shadow.bias = -0.0005;
  }
  group.add(altarLight);

  const rim = new THREE.SpotLight('#FFE2B0', 30, 12, 0.42, 0.7, 2);
  rim.position.set(0, 4.9, -3.6);
  rim.target.position.set(0, 1.7, -5.4);
  group.add(rim);
  group.add(rim.target);
  // (the 2 remaining lights are the lit hanging lamps above)

  // ---------------- Licensed model slots (async) ----------------
  const mixers: THREE.AnimationMixer[] = [];
  const loadedRoots: THREE.Object3D[] = [];
  let disposed = false;
  const loader = new GLTFLoader();

  const placeModel = (gltf: GLTF, slot: THREE.Vector3, height: number, clipPattern: RegExp, firstClipFallback: boolean) => {
    const root = gltf.scene;
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) root.scale.multiplyScalar(height / size.y);
    box.setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.x += slot.x - center.x;
    root.position.z += slot.z - center.z;
    root.position.y += slot.y - box.min.y;
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = high;
        o.receiveShadow = true;
      }
    });
    const clip = gltf.animations.find((a) => clipPattern.test(a.name)) ?? (firstClipFallback ? gltf.animations[0] : undefined);
    if (clip) {
      const mixer = new THREE.AnimationMixer(root);
      mixer.clipAction(clip).play();
      mixers.push(mixer);
    }
    loadedRoots.push(root);
    return root;
  };

  void hasLicensedDeityModel().then((found) => {
    if (!found || disposed) return;
    loader.load(
      DEITY_MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene, deityFallbackTexture);
          return;
        }
        const root = placeModel(gltf, new THREE.Vector3(DEITY_SLOT.x, DEITY_SLOT.y + 0.16, DEITY_SLOT.z), DEITY_HEIGHT, /idle/i, false);
        group.add(root);
        fallback.visible = false;
        if (frameBeads) frameBeads.visible = false;
      },
      undefined,
      (err) => console.warn('[temple] Deity model failed to load; keeping the devotional painting.', err),
    );
  });

  void modelAssetExists(PANDIT_MODEL_URL).then((found) => {
    if (!found || disposed) return;
    loader.load(
      PANDIT_MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene, deityFallbackTexture);
          return;
        }
        const root = placeModel(gltf, PRIEST_SLOT, PRIEST_HEIGHT, /aarti/i, true);
        // Face the altar
        root.rotation.y = Math.atan2(DEITY_SLOT.x - PRIEST_SLOT.x, DEITY_SLOT.z - PRIEST_SLOT.z);
        group.add(root);
      },
      undefined,
      (err) => console.warn('[temple] Pandit model failed to load.', err),
    );
  });

  // ---------------- Update ----------------
  const update = (t: number, dt: number) => {
    for (const d of drapes) {
      const pos = d.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const x = d.base[i * 3];
        const y = d.base[i * 3 + 1];
        const fall = (1.7 - y) / 3.4; // 0 at the rod, 1 at the hem
        arr[i * 3 + 2] = d.base[i * 3 + 2] + Math.sin(t * 0.9 + x * 3 + y * 0.8) * 0.035 * fall + Math.sin(x * 9) * 0.02;
      }
      pos.needsUpdate = true;
      d.mesh.geometry.computeVertexNormals();
    }
    for (const s of swingers) {
      s.pivot.rotation.z = Math.sin(t * 1.1 + s.phase) * s.amp;
      s.pivot.rotation.x = Math.sin(t * 0.8 + s.phase * 1.3) * s.amp * 0.5;
    }
    const flicker = (seed: number) =>
      Math.sin(t * 13 + seed) * 0.5 + Math.sin(t * 7.3 + seed * 2.1) * 0.35 + Math.sin(t * 23 + seed) * 0.15;
    for (const f of flames) {
      const n = flicker(f.seed);
      f.sprite.scale.set(0.07 * (1 + n * 0.08), f.base * (1 + n * 0.15), 1);
    }
    for (const l of lampLights) l.light.intensity = l.base * (0.9 + flicker(l.seed) * 0.1);
    for (const m of mixers) m.update(dt);
  };

  // ---------------- Dispose ----------------
  const dispose = () => {
    disposed = true;
    for (const m of mixers) m.stopAllAction();
    mixers.length = 0;
    for (const root of loadedRoots) disposeObject(root, deityFallbackTexture);
    loadedRoots.length = 0;
    disposeObject(group, deityFallbackTexture);
    bellGeo.dispose();
    chainGeo.dispose();
    lampBowlGeo.dispose();
    flameMat.dispose();
    for (const tex of ownedTextures) tex.dispose();
    for (const set of ownedTextureSets) set.dispose();
    group.clear();
  };

  return { group, update, dispose };
}

/** Disposes geometries, materials and their textures under `root` (except `keep`). */
function disposeObject(root: THREE.Object3D, keep?: THREE.Texture): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
    // Sprites share one module-level geometry inside three.js — never dispose it.
    if (mesh.geometry && !(o as THREE.Sprite).isSprite) geometries.add(mesh.geometry);
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) mat.forEach((m) => materials.add(m));
    else if (mat) materials.add(mat);
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) {
    for (const value of Object.values(m)) {
      if (value instanceof THREE.Texture && value !== keep) value.dispose();
    }
    m.dispose();
  }
}
