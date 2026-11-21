/**
 * Project Eternal — High-Fidelity Anatomical Binary GLB Asset Generator (v3)
 *
 * Generates anatomically sculpted, multi-material, skeletal binary GLB assets
 * with full Bone hierarchies, Facial Morph Targets (Blendshapes), 3D Glossy Eyes,
 * Pleated Drapery, Multi-tier Regalia, and AnimationClips:
 *   Core Pack:
 *   - /public/assets/story/characters/krishna/krishna.glb
 *   - /public/assets/story/characters/arjuna/arjuna.glb
 *   - /public/assets/story/characters/horses/white_horses.glb
 *   - /public/assets/story/characters/warriors/warrior_archetype.glb
 *   War Pack (Mahabharata Part B):
 *   - /public/assets/story/characters/warriors/karna_hero.glb
 *   - /public/assets/story/characters/warriors/bhishma_drona_hero.glb
 *   - /public/assets/story/characters/warriors/mace_duelists.glb
 *   - /public/assets/story/characters/warriors/war_elephant.glb
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  CHARACTER_ASSET_MANIFEST,
  EXPECTED_FACIAL_MORPH_TARGETS,
} from '../src/three/story/assetManifest';
import { validateLoadedCharacterAsset } from '../src/three/story/assetValidation';
import { inspectLoadedGltf } from '../src/three/story/modelLoader';

if (typeof globalThis.FileReader === 'undefined') {
  class NodeFileReader {
    public result: ArrayBuffer | string | null = null;
    public onloadend: (() => void) | null = null;
    public onerror: ((err: unknown) => void) | null = null;

    async readAsArrayBuffer(blob: Blob): Promise<void> {
      try {
        this.result = await blob.arrayBuffer();
        this.onloadend?.();
      } catch (err) {
        this.onerror?.(err);
      }
    }

    async readAsDataURL(blob: Blob): Promise<void> {
      try {
        const ab = await blob.arrayBuffer();
        const b64 = Buffer.from(ab).toString('base64');
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
        this.onloadend?.();
      } catch (err) {
        this.onerror?.(err);
      }
    }
  }
  (globalThis as unknown as { FileReader: typeof NodeFileReader }).FileReader = NodeFileReader;
}

interface SubMeshPart {
  geometry: THREE.BufferGeometry;
  materialIndex: number;
  weights: Array<{ boneIndex: number; weight: number }> | 'auto';
}

interface LoftStation {
  y: number;
  rx: number;
  rz: number;
  cx?: number;
  cz?: number;
  pleatAmp?: number;
  pleatFreq?: number;
  frontBulge?: number;
  backPinch?: number;
}

function makeNamedMat(
  name: string,
  params: THREE.MeshStandardMaterialParameters,
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial(params);
  m.name = name;
  return m;
}

function colorizeGeometry(
  rawGeo: THREE.BufferGeometry,
  baseHex: number,
  shadeVariation = 0.08,
): THREE.BufferGeometry {
  if (!rawGeo.getAttribute('normal')) {
    rawGeo.computeVertexNormals();
  }
  const geo = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo.clone();
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');

  if (!geo.getAttribute('uv')) {
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      const u = Math.atan2(px, pz) / (Math.PI * 2) + 0.5;
      const v = py * 0.65 + 0.5;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(baseHex);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const ny = norm ? norm.getY(i) : 0;
    const nz = norm ? norm.getZ(i) : 0;
    const py = pos.getY(i);
    const factor =
      1 +
      ny * shadeVariation +
      nz * (shadeVariation * 0.25) +
      Math.sin(py * 14) * (shadeVariation * 0.28);
    c.copy(base).multiplyScalar(Math.max(0.66, Math.min(1.22, factor)));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Generates an anatomical cross-section lofted BufferGeometry with elliptical muscle contours,
 * pectoral swells, spinal furrows, and optional silk drapery pleating + watertight caps.
 */
function makeAnatomicalLoft(
  stations: LoftStation[],
  radialSegments = 22,
  capBottom = true,
  capTop = true,
): THREE.BufferGeometry {
  const ringVerts = radialSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const yMin = stations[0].y;
  const yMax = stations[stations.length - 1].y;
  const ySpan = Math.max(0.0001, yMax - yMin);

  for (let sIdx = 0; sIdx < stations.length; sIdx++) {
    const st = stations[sIdx];
    const vCoord = (st.y - yMin) / ySpan;
    const cx = st.cx ?? 0;
    const cz = st.cz ?? 0;
    const pleatAmp = st.pleatAmp ?? 0;
    const pleatFreq = st.pleatFreq ?? 12;
    const frontBulge = st.frontBulge ?? 0;
    const backPinch = st.backPinch ?? 0;

    for (let r = 0; r <= radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let localRx = st.rx;
      let localRz = st.rz;

      if (pleatAmp > 0) {
        const pleat = Math.sin(theta * pleatFreq) * pleatAmp;
        localRx += pleat * 0.75;
        localRz += pleat;
      }

      if (frontBulge > 0 && cosT > 0.15) {
        const pecWing = Math.sin(Math.abs(sinT) * Math.PI) * Math.pow(cosT, 1.4);
        localRz += frontBulge * (0.35 + 0.65 * pecWing);
      }

      if (backPinch > 0 && cosT < -0.5) {
        const groove = Math.exp(-Math.pow(sinT / 0.28, 2));
        localRz -= backPinch * groove;
      }

      const x = cx + sinT * localRx;
      const z = cz + cosT * localRz;
      positions.push(x, st.y, z);
      uvs.push(r / radialSegments, vCoord);
    }
  }

  for (let sIdx = 0; sIdx < stations.length - 1; sIdx++) {
    const row0 = sIdx * ringVerts;
    const row1 = (sIdx + 1) * ringVerts;
    for (let r = 0; r < radialSegments; r++) {
      const a = row0 + r;
      const b = row0 + r + 1;
      const c = row1 + r + 1;
      const d = row1 + r;
      indices.push(a, b, c, a, c, d);
    }
  }

  if (capBottom) {
    const bCenterIdx = positions.length / 3;
    const bSt = stations[0];
    positions.push(bSt.cx ?? 0, bSt.y, bSt.cz ?? 0);
    uvs.push(0.5, 0);
    for (let r = 0; r < radialSegments; r++) {
      indices.push(bCenterIdx, r + 1, r);
    }
  }

  if (capTop) {
    const tCenterIdx = positions.length / 3;
    const tSt = stations[stations.length - 1];
    const topRow = (stations.length - 1) * ringVerts;
    positions.push(tSt.cx ?? 0, tSt.y, tSt.cz ?? 0);
    uvs.push(0.5, 1);
    for (let r = 0; r < radialSegments; r++) {
      indices.push(tCenterIdx, topRow + r, topRow + r + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeCapsulePart(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments = 16,
  heightSegments = 8,
): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const capSteps = 4;
  for (let i = 0; i <= capSteps; i++) {
    const a = (i / capSteps) * (Math.PI / 2);
    pts.push(
      new THREE.Vector2(
        Math.sin(a) * radiusBottom,
        -height * 0.5 - Math.cos(a) * radiusBottom * 0.65,
      ),
    );
  }
  for (let i = 1; i < heightSegments; i++) {
    const t = i / heightSegments;
    const r = radiusBottom + (radiusTop - radiusBottom) * t;
    const bulge = Math.sin(t * Math.PI) * Math.min(radiusTop, radiusBottom) * 0.14;
    pts.push(new THREE.Vector2(r + bulge, -height * 0.5 + height * t));
  }
  for (let i = 0; i <= capSteps; i++) {
    const a = (i / capSteps) * (Math.PI / 2);
    pts.push(
      new THREE.Vector2(
        Math.cos(a) * radiusTop,
        height * 0.5 + Math.sin(a) * radiusTop * 0.65,
      ),
    );
  }
  return new THREE.LatheGeometry(pts, radialSegments);
}

function transformGeo(
  geo: THREE.BufferGeometry,
  tx: number,
  ty: number,
  tz: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): THREE.BufferGeometry {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  m.compose(new THREE.Vector3(tx, ty, tz), q, new THREE.Vector3(sx, sy, sz));
  geo.applyMatrix4(m);
  return geo;
}

/**
 * Builds an anatomically contoured human torso from waist through ribcage, pectorals,
 * trapezius shoulder shelf, and neck collar.
 */
function makeAnatomicalTorso(scaleWidth = 1, scaleDepth = 1): THREE.BufferGeometry {
  return makeAnatomicalLoft(
    [
      { y: 0.94, rx: 0.158 * scaleWidth, rz: 0.112 * scaleDepth },
      { y: 1.03, rx: 0.144 * scaleWidth, rz: 0.104 * scaleDepth, backPinch: 0.01 },
      { y: 1.14, rx: 0.168 * scaleWidth, rz: 0.118 * scaleDepth, frontBulge: 0.016, backPinch: 0.014 },
      { y: 1.25, rx: 0.194 * scaleWidth, rz: 0.132 * scaleDepth, frontBulge: 0.028, backPinch: 0.016 },
      { y: 1.34, rx: 0.204 * scaleWidth, rz: 0.128 * scaleDepth, frontBulge: 0.02, backPinch: 0.012 },
      { y: 1.41, rx: 0.162 * scaleWidth, rz: 0.102 * scaleDepth },
      { y: 1.455, rx: 0.072 * scaleWidth, rz: 0.068 * scaleDepth },
    ],
    26,
  );
}

/**
 * Builds realistic multi-tier lotus Kiriti Mukuta Crown parts pinned to Head bone.
 */
function buildRoyalCrownParts(
  headBoneIdx: number,
  baseY: number,
  goldHex: number,
  gemHex: number,
  goldMatIdx: number,
  accentMatIdx: number,
  scale = 1,
): SubMeshPart[] {
  const w = [{ boneIndex: headBoneIdx, weight: 1 }];
  const crownProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.108 * scale, 0.0),
    new THREE.Vector2(0.114 * scale, 0.022 * scale),
    new THREE.Vector2(0.098 * scale, 0.052 * scale),
    new THREE.Vector2(0.102 * scale, 0.064 * scale),
    new THREE.Vector2(0.082 * scale, 0.105 * scale),
    new THREE.Vector2(0.086 * scale, 0.118 * scale),
    new THREE.Vector2(0.062 * scale, 0.165 * scale),
    new THREE.Vector2(0.036 * scale, 0.198 * scale),
    new THREE.Vector2(0.024 * scale, 0.215 * scale),
    new THREE.Vector2(0.028 * scale, 0.232 * scale),
    new THREE.Vector2(0.008 * scale, 0.258 * scale),
    new THREE.Vector2(0.0, 0.265 * scale),
  ];

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(
        transformGeo(new THREE.LatheGeometry(crownProfile, 24), 0, baseY, -0.004),
        goldHex,
        0.12,
      ),
      materialIndex: goldMatIdx,
      weights: w,
    },
    // Engraved forehead diadem band (Ratna-Patta)
    {
      geometry: colorizeGeometry(
        transformGeo(new THREE.TorusGeometry(0.108 * scale, 0.011 * scale, 10, 28), 0, baseY + 0.014 * scale, -0.002, Math.PI / 2, 0, 0),
        goldHex,
        0.1,
      ),
      materialIndex: goldMatIdx,
      weights: w,
    },
    // Central forehead lotus ruby cabochon
    {
      geometry: colorizeGeometry(
        transformGeo(new THREE.OctahedronGeometry(0.018 * scale, 1), 0, baseY + 0.024 * scale, 0.109 * scale),
        gemHex,
        0.1,
      ),
      materialIndex: accentMatIdx,
      weights: w,
    },
  ];

  // Side carved lotus petals around crown rim
  for (let p = 0; p < 8; p++) {
    const ang = (p / 8) * Math.PI * 2;
    const px = Math.sin(ang) * 0.104 * scale;
    const pz = Math.cos(ang) * 0.104 * scale - 0.003;
    parts.push({
      geometry: colorizeGeometry(
        transformGeo(
          new THREE.ConeGeometry(0.018 * scale, 0.052 * scale, 6),
          px,
          baseY + 0.035 * scale,
          pz,
          0.18 * Math.cos(ang),
          ang,
          -0.18 * Math.sin(ang),
        ),
        goldHex,
        0.1,
      ),
      materialIndex: goldMatIdx,
      weights: w,
    });
  }

  return parts;
}

/**
 * Builds sculpted anatomical ear shells + temple hair curls + beard locks on Head/Jaw bones.
 */
function buildHeadAnatomyAccents(options: {
  headBoneIdx: number;
  jawBoneIdx: number;
  headCenterY: number;
  skinHex: number;
  hairHex: number;
  goldHex?: number;
  skinMatIdx: number;
  hairMatIdx: number;
  goldMatIdx?: number;
  hasKundala?: boolean;
  beardStyle?: 'none' | 'royal-trim' | 'elder-long';
}): SubMeshPart[] {
  const {
    headBoneIdx,
    jawBoneIdx,
    headCenterY,
    skinHex,
    hairHex,
    goldHex = 0xe1b454,
    skinMatIdx,
    hairMatIdx,
    goldMatIdx = 2,
    hasKundala = true,
    beardStyle = 'none',
  } = options;
  const hw = [{ boneIndex: headBoneIdx, weight: 1 }];
  const jw = [{ boneIndex: jawBoneIdx, weight: 0.72 }, { boneIndex: headBoneIdx, weight: 0.28 }];
  const parts: SubMeshPart[] = [];

  // 1. Sculpted 3D Outer Ears (Helix + Ear Lobe)
  for (const side of [-1, 1] as const) {
    parts.push({
      geometry: colorizeGeometry(
        transformGeo(new THREE.TorusGeometry(0.022, 0.007, 8, 16, Math.PI * 1.45), side * 0.097, headCenterY + 0.006, -0.006, 0.1, side * 1.18, 0.15, 0.78, 1.28, 0.8),
        skinHex,
        0.07,
      ),
      materialIndex: skinMatIdx,
      weights: hw,
    });
    parts.push({
      geometry: colorizeGeometry(
        transformGeo(new THREE.SphereGeometry(0.011, 10, 8), side * 0.098, headCenterY - 0.015, -0.004, 0, 0, 0, 0.7, 1.15, 0.85),
        skinHex,
        0.06,
      ),
      materialIndex: skinMatIdx,
      weights: hw,
    });
    if (hasKundala) {
      parts.push({
        geometry: colorizeGeometry(
          transformGeo(new THREE.TorusGeometry(0.017, 0.0045, 8, 16), side * 0.104, headCenterY - 0.028, 0.004, 0, Math.PI / 2, 0),
          goldHex,
          0.1,
        ),
        materialIndex: goldMatIdx,
        weights: hw,
      });
    }
  }

  // 2. Sculpted Cranial Hair Volume + Sideburn Temple Curls + Flowing Nape Locks
  parts.push({
    geometry: colorizeGeometry(
      transformGeo(
        new THREE.SphereGeometry(0.119, 26, 20, 0, Math.PI * 2, 0, Math.PI * 0.64),
        0,
        headCenterY + 0.016,
        -0.016,
        -0.28,
        0,
        0,
        0.92,
        1.08,
        0.98,
      ),
      hairHex,
      0.08,
    ),
    materialIndex: hairMatIdx,
    weights: hw,
  });

  // Natural curved locks sweeping behind ears and nape
  for (let i = -3; i <= 3; i++) {
    const angle = i * 0.34;
    const lx = Math.sin(angle) * 0.094;
    const lz = -Math.cos(angle) * 0.086 - 0.012;
    const lockCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lx, headCenterY + 0.01, lz),
      new THREE.Vector3(lx * 1.12, headCenterY - 0.065, lz - 0.015),
      new THREE.Vector3(lx * 1.18, headCenterY - 0.125, lz + 0.008),
    ]);
    parts.push({
      geometry: colorizeGeometry(new THREE.TubeGeometry(lockCurve, 10, 0.019, 8, false), hairHex, 0.08),
      materialIndex: hairMatIdx,
      weights: hw,
    });
  }

  // 3. Sculpted Jaw Beard / Mustache Geometry
  if (beardStyle === 'royal-trim') {
    const mustacheCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.044, headCenterY - 0.036, 0.072),
      new THREE.Vector3(-0.018, headCenterY - 0.031, 0.099),
      new THREE.Vector3(0, headCenterY - 0.029, 0.104),
      new THREE.Vector3(0.018, headCenterY - 0.031, 0.099),
      new THREE.Vector3(0.044, headCenterY - 0.036, 0.072),
    ]);
    parts.push({
      geometry: colorizeGeometry(new THREE.TubeGeometry(mustacheCurve, 14, 0.007, 7, false), hairHex, 0.07),
      materialIndex: hairMatIdx,
      weights: hw,
    });
    const jawCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.076, headCenterY - 0.024, 0.025),
      new THREE.Vector3(-0.056, headCenterY - 0.076, 0.055),
      new THREE.Vector3(0, headCenterY - 0.102, 0.084),
      new THREE.Vector3(0.056, headCenterY - 0.076, 0.055),
      new THREE.Vector3(0.076, headCenterY - 0.024, 0.025),
    ]);
    parts.push({
      geometry: colorizeGeometry(new THREE.TubeGeometry(jawCurve, 18, 0.016, 8, false), hairHex, 0.07),
      materialIndex: hairMatIdx,
      weights: jw,
    });
  } else if (beardStyle === 'elder-long') {
    const mustacheCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.052, headCenterY - 0.04, 0.07),
      new THREE.Vector3(-0.02, headCenterY - 0.031, 0.101),
      new THREE.Vector3(0, headCenterY - 0.029, 0.106),
      new THREE.Vector3(0.02, headCenterY - 0.031, 0.101),
      new THREE.Vector3(0.052, headCenterY - 0.04, 0.07),
    ]);
    parts.push({
      geometry: colorizeGeometry(new THREE.TubeGeometry(mustacheCurve, 14, 0.009, 7, false), hairHex, 0.06),
      materialIndex: hairMatIdx,
      weights: hw,
    });
    for (let strand = -2; strand <= 2; strand++) {
      const sx = strand * 0.017;
      const len = 0.22 - Math.abs(strand) * 0.028;
      const strandCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx, headCenterY - 0.065, 0.078),
        new THREE.Vector3(sx * 1.15, headCenterY - 0.065 - len * 0.52, 0.095),
        new THREE.Vector3(sx * 0.7, headCenterY - 0.065 - len, 0.072),
      ]);
      parts.push({
        geometry: colorizeGeometry(new THREE.TubeGeometry(strandCurve, 12, 0.018 - Math.abs(strand) * 0.002, 8, false), hairHex, 0.06),
        materialIndex: hairMatIdx,
        weights: jw,
      });
    }
  }

  return parts;
}

/**
 * Builds an anatomical sculpted facial mesh parented to the character's Head bone,
 * featuring recessed eye sockets, protruding dorsal nose + nostrils, Cupid's bow lips,
 * cheekbones, jawline, plus ALL 11 glTF Morph Targets & companion 3D Glossy Eyeballs!
 */
function buildSculptedFaceAssembly(options: {
  name: string;
  skinHex: number;
  lipHex: number;
  browHex: number;
  eyeIrisHex?: number;
  tildeMarkHex?: number;
  hasBeard?: boolean;
  beardHex?: number;
}): THREE.Group {
  const {
    name,
    skinHex,
    lipHex,
    browHex,
    eyeIrisHex = 0x241710,
    tildeMarkHex = 0xfff2cf,
    hasBeard = false,
    beardHex = 0x16141a,
  } = options;

  const faceContainer = new THREE.Group();
  faceContainer.name = `${name}_Container`;

  // High-density anatomical cranial surface (48 radial x 36 latitudinal segments)
  const headBaseRaw = new THREE.SphereGeometry(0.114, 48, 36);
  const pAttr = headBaseRaw.attributes.position;
  for (let i = 0; i < pAttr.count; i++) {
    let x = pAttr.getX(i) * 0.87;
    let y = pAttr.getY(i) * 1.11;
    let z = pAttr.getZ(i) * 0.97;

    if (z > 0.015) {
      // 1. Tapering anatomical jaw + distinct chin mentum
      if (y < -0.025) {
        const jawT = Math.min(1, (-0.025 - y) / 0.085);
        x *= 1 - 0.28 * jawT;
        if (Math.abs(x) < 0.024 && y < -0.065) {
          z += 0.008 * (1 - Math.abs(x) / 0.024);
        }
      }

      // 2. Temple flatness & subtle cheek zygomatic bone highlight
      if (Math.abs(x) > 0.044 && y > 0.015 && y < 0.055) {
        x *= 0.95;
      }
      if (Math.abs(Math.abs(x) - 0.05) < 0.024 && Math.abs(y + 0.008) < 0.022 && z > 0.045) {
        z += 0.008 * (1 - Math.hypot(Math.abs(x) - 0.05, y + 0.008) / 0.028);
      }

      // 3. Recessed orbital eye sockets (left/right at +-0.032, y=0.019) + supraorbital brow arch
      const eyeDist = Math.hypot((Math.abs(x) - 0.032) / 0.017, (y - 0.019) / 0.011);
      if (eyeDist < 1.15) {
        const recess = Math.cos(Math.min(1, eyeDist / 1.15) * (Math.PI / 2));
        z -= 0.021 * recess;
      }
      const browDist = Math.hypot((Math.abs(x) - 0.032) / 0.024, (y - 0.036) / 0.009);
      if (browDist < 1.0) {
        z += 0.0065 * Math.cos(browDist * (Math.PI / 2));
      }

      // 4. Sculpted Nose Bridge, Dorsal Ridge, Rounded Tip, and Nostril Alae
      if (Math.abs(x) < 0.022 && y > -0.024 && y < 0.036 && z > 0.06) {
        const yT = (y + 0.024) / 0.06; // 0 at base, 1 at radix between brows
        const ridgeProfile = Math.sin(Math.pow(1 - yT, 0.65) * Math.PI * 0.85);
        const latFalloff = Math.exp(-Math.pow(x / 0.009, 2));
        z += 0.023 * ridgeProfile * latFalloff;

        // Bilateral nostril wings (alae)
        const nostrilDist = Math.hypot((Math.abs(x) - 0.0115) / 0.007, (y + 0.015) / 0.007);
        if (nostrilDist < 1.0) {
          z += 0.0085 * Math.cos(nostrilDist * (Math.PI / 2));
        }
      }

      // 5. Sculpted Philtrum, Cupid's Bow Upper Lip, Mouth Crease & Fuller Lower Lip
      if (Math.abs(x) < 0.032 && y > -0.066 && y < -0.022 && z > 0.06) {
        const xFalloff = Math.cos((Math.abs(x) / 0.032) * (Math.PI / 2));
        // Upper lip
        if (y >= -0.043 && y <= -0.028) {
          const bow = 0.003 * (Math.cos(x * 165) * 0.5 + 0.5);
          z += (0.008 + bow) * xFalloff * Math.sin(((y + 0.043) / 0.015) * Math.PI);
        } else if (y > -0.046 && y < -0.043) {
          // Subtle oral seam groove
          z -= 0.004 * xFalloff;
        } else if (y >= -0.06 && y <= -0.046) {
          // Fuller curved lower lip
          z += 0.0085 * xFalloff * Math.sin(((y + 0.06) / 0.014) * Math.PI);
        } else if (y < -0.06) {
          // Mentolabial chin hollow
          z -= 0.0035 * xFalloff;
        }
      }
    }

    pAttr.setXYZ(i, x, y, z);
  }
  headBaseRaw.computeVertexNormals();

  const faceGeo = colorizeGeometry(headBaseRaw, skinHex, 0.06);
  const facePos = faceGeo.getAttribute('position');
  const faceColors = faceGeo.getAttribute('color');

  const skinCol = new THREE.Color(skinHex);
  const lipCol = new THREE.Color(lipHex);
  const browCol = new THREE.Color(browHex);
  const tilakCol = new THREE.Color(tildeMarkHex);
  const beardCol = new THREE.Color(beardHex);
  const lashShadowCol = new THREE.Color(skinHex).multiplyScalar(0.58);
  const shadowSkinCol = new THREE.Color(skinHex).multiplyScalar(0.76);
  const warmCheekCol = new THREE.Color(skinHex).lerp(new THREE.Color(lipHex), 0.14);

  const vertZones: Array<'mouth-upper' | 'mouth-lower' | 'lid-upper' | 'brow' | 'jaw-chin' | 'other'> = [];

  for (let i = 0; i < facePos.count; i++) {
    const x = facePos.getX(i);
    const y = facePos.getY(i);
    const z = facePos.getZ(i);

    let zone: (typeof vertZones)[number] = 'other';

    if (z > 0.055) {
      // Forehead Tilak mark (crisp tapered sacred vertical line)
      if (Math.abs(x) < 0.0055 && y >= 0.04 && y <= 0.084) {
        faceColors.setXYZ(i, tilakCol.r, tilakCol.g, tilakCol.b);
      }

      // Eyebrows (curved natural brow arc)
      const browCenterY = 0.038 - Math.pow((Math.abs(x) - 0.032) / 0.022, 2) * 0.004;
      if (Math.abs(Math.abs(x) - 0.033) < 0.021 && Math.abs(y - browCenterY) < 0.0055) {
        faceColors.setXYZ(i, browCol.r, browCol.g, browCol.b);
        zone = 'brow';
      }

      // Upper & Lower Orbital Rim Eyelid + Lash-line Shading (eyes themselves are true 3D eyeballs!)
      const eyeNormDist = Math.hypot((Math.abs(x) - 0.032) / 0.017, (y - 0.019) / 0.011);
      if (eyeNormDist < 1.15) {
        if (y >= 0.0185) {
          zone = 'lid-upper';
          // Subtle upper lash-line definition
          faceColors.setXYZ(
            i,
            THREE.MathUtils.lerp(skinCol.r, lashShadowCol.r, 0.55),
            THREE.MathUtils.lerp(skinCol.g, lashShadowCol.g, 0.55),
            THREE.MathUtils.lerp(skinCol.b, lashShadowCol.b, 0.55),
          );
        } else {
          faceColors.setXYZ(i, shadowSkinCol.r, shadowSkinCol.g, shadowSkinCol.b);
        }
      } else if (Math.abs(x) < 0.016 && y >= -0.024 && y < -0.015) {
        // Subtle nostril underside AO shading
        faceColors.setXYZ(i, shadowSkinCol.r, shadowSkinCol.g, shadowSkinCol.b);
      } else if (Math.abs(x) < 0.028 && y >= -0.043 && y <= -0.027) {
        faceColors.setXYZ(i, lipCol.r, lipCol.g, lipCol.b);
        zone = 'mouth-upper';
      } else if (Math.abs(x) < 0.026 && y >= -0.06 && y < -0.043) {
        faceColors.setXYZ(i, lipCol.r * 0.94, lipCol.g * 0.94, lipCol.b * 0.94);
        zone = 'mouth-lower';
      } else if (y < -0.06) {
        zone = 'jaw-chin';
        if (hasBeard && z > 0.02) {
          faceColors.setXYZ(i, beardCol.r, beardCol.g, beardCol.b);
        }
      } else if (hasBeard && y < -0.046 && Math.abs(x) > 0.028 && z > 0.025) {
        faceColors.setXYZ(i, beardCol.r, beardCol.g, beardCol.b);
        zone = 'jaw-chin';
      } else if (Math.abs(Math.abs(x) - 0.046) < 0.024 && Math.abs(y + 0.008) < 0.022) {
        // Natural warm cheek tint
        faceColors.setXYZ(i, warmCheekCol.r, warmCheekCol.g, warmCheekCol.b);
      }
    }
    vertZones.push(zone);
  }
  faceColors.needsUpdate = true;

  // Build 11 exact glTF Morph Targets matching EXPECTED_FACIAL_MORPH_TARGETS
  const morphArrays: Float32Array[] = EXPECTED_FACIAL_MORPH_TARGETS.map(() =>
    new Float32Array(facePos.array),
  );

  for (let i = 0; i < facePos.count; i++) {
    const x = facePos.getX(i);
    const y = facePos.getY(i);
    const z = facePos.getZ(i);
    const zone = vertZones[i];

    const setDelta = (morphIdx: number, dx: number, dy: number, dz: number) => {
      morphArrays[morphIdx][i * 3] = x + dx;
      morphArrays[morphIdx][i * 3 + 1] = y + dy;
      morphArrays[morphIdx][i * 3 + 2] = z + dz;
    };

    // 1: viseme_aa
    if (zone === 'mouth-lower' || zone === 'jaw-chin') {
      setDelta(1, 0, zone === 'mouth-lower' ? -0.017 : -0.012, -0.005);
    } else if (zone === 'mouth-upper') {
      setDelta(1, 0, 0.005, 0.002);
    }

    // 2: viseme_E
    if (zone === 'mouth-upper' || zone === 'mouth-lower') {
      setDelta(2, Math.sign(x) * 0.007, zone === 'mouth-upper' ? 0.004 : -0.006, 0);
    }

    // 3: viseme_oh
    if (zone === 'mouth-upper' || zone === 'mouth-lower') {
      setDelta(3, -x * 0.28, zone === 'mouth-upper' ? 0.004 : -0.01, 0.01);
    }

    // 4: viseme_PP
    if (zone === 'mouth-upper' || zone === 'mouth-lower') {
      setDelta(4, 0, zone === 'mouth-upper' ? -0.005 : 0.005, -0.003);
    }

    // 5: viseme_FF
    if (zone === 'mouth-lower') {
      setDelta(5, 0, 0.004, -0.006);
    } else if (zone === 'mouth-upper') {
      setDelta(5, 0, 0.003, 0.004);
    }

    // 6: viseme_TH
    if (zone === 'mouth-lower' || zone === 'jaw-chin') {
      setDelta(6, 0, -0.007, 0.002);
    }

    // 7: blink (upper eyelid hood sweeps forward & down cleanly over the 3D eyeball)
    if (zone === 'lid-upper') {
      setDelta(7, 0, -0.016, 0.016);
    }

    // 8: brow_furrow
    if (zone === 'brow') {
      setDelta(8, -Math.sign(x) * 0.005, -0.007, 0.003);
    }

    // 9: brow_raise
    if (zone === 'brow') {
      setDelta(9, 0, 0.01, 0);
    }

    // 10: smile
    if (zone === 'mouth-upper' || zone === 'mouth-lower') {
      const cornerLift = Math.min(1, Math.abs(x) / 0.025) * 0.007;
      setDelta(10, Math.sign(x) * 0.004, cornerLift, -0.001);
    }
  }

  faceGeo.morphAttributes.position = morphArrays.map(
    (arr) => new THREE.BufferAttribute(arr, 3),
  );

  const faceMat = makeNamedMat('skin_face', {
    vertexColors: true,
    roughness: 0.46,
    metalness: 0.02,
  });

  const faceMesh = new THREE.Mesh(faceGeo, faceMat);
  faceMesh.name = name;
  faceMesh.castShadow = true;
  faceMesh.receiveShadow = true;
  faceMesh.morphTargetDictionary = {};
  faceMesh.morphTargetInfluences = [];
  EXPECTED_FACIAL_MORPH_TARGETS.forEach((tName, idx) => {
    faceMesh.morphTargetDictionary![tName] = idx;
    faceMesh.morphTargetInfluences!.push(0);
  });
  faceMesh.userData.targetNames = [...EXPECTED_FACIAL_MORPH_TARGETS];
  faceContainer.add(faceMesh);

  // Add True 3D Glossy Eyeballs (Sclera Sphere + Dark Iris/Pupil Cornea Dome) inside recessed sockets
  const scleraMat = makeNamedMat('eye_sclera', {
    color: 0xf7f2eb,
    roughness: 0.16,
    metalness: 0.0,
  });
  const corneaMat = makeNamedMat('eye_cornea', {
    color: eyeIrisHex,
    roughness: 0.04,
    metalness: 0.05,
  });

  for (const side of [-1, 1] as const) {
    const ex = side * 0.032;
    const ey = 0.019;
    const ez = 0.086;

    const scleraMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0138, 16, 12), scleraMat);
    scleraMesh.name = `${name}_EyeSclera_${side > 0 ? 'L' : 'R'}`;
    scleraMesh.position.set(ex, ey, ez);
    scleraMesh.scale.set(1.06, 0.92, 0.96);
    faceContainer.add(scleraMesh);

    const irisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0074, 14, 10), corneaMat);
    irisMesh.name = `${name}_EyeCornea_${side > 0 ? 'L' : 'R'}`;
    irisMesh.position.set(ex, ey, ez + 0.0078);
    irisMesh.scale.set(1.0, 1.0, 0.65);
    faceContainer.add(irisMesh);
  }

  return faceContainer;
}

/**
 * Builds anatomically contoured palm, thenar eminence thumb, and 4 tapered 2-knuckle curled fingers.
 */
function buildArticulatedHandParts(
  handBoneIdx: number,
  x: number,
  y: number,
  z: number,
  skinHex: number,
  matIdx: number,
  sideSign: 1 | -1,
): SubMeshPart[] {
  const handPalm = makeAnatomicalLoft(
    [
      { y: -0.036, rx: 0.025, rz: 0.014 },
      { y: -0.016, rx: 0.028, rz: 0.016, frontBulge: 0.004 },
      { y: 0.014, rx: 0.026, rz: 0.015 },
      { y: 0.034, rx: 0.021, rz: 0.014 },
    ],
    14,
  );
  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(transformGeo(handPalm, x, y, z), skinHex, 0.05),
      materialIndex: matIdx,
      weights: [{ boneIndex: handBoneIdx, weight: 1 }],
    },
    // Thumb proximal + distal
    {
      geometry: colorizeGeometry(
        transformGeo(makeCapsulePart(0.01, 0.0085, 0.026, 8, 2), x - sideSign * 0.024, y - 0.005, z + 0.012, 0.35, 0, sideSign * 0.52),
        skinHex,
        0.04,
      ),
      materialIndex: matIdx,
      weights: [{ boneIndex: handBoneIdx, weight: 1 }],
    },
    {
      geometry: colorizeGeometry(
        transformGeo(makeCapsulePart(0.0075, 0.006, 0.022, 8, 2), x - sideSign * 0.032, y - 0.024, z + 0.023, 0.72, 0, sideSign * 0.25),
        skinHex,
        0.04,
      ),
      materialIndex: matIdx,
      weights: [{ boneIndex: handBoneIdx, weight: 1 }],
    },
  ];

  // Four proportioned, softly flexed 2-segment fingers (index -> pinky)
  const fingerLengths = [0.027, 0.031, 0.028, 0.022];
  for (let f = 0; f < 4; f++) {
    const fx = x + (f - 1.5) * 0.0125;
    const len = fingerLengths[f];
    // Proximal phalanx
    parts.push({
      geometry: colorizeGeometry(
        transformGeo(makeCapsulePart(0.0072, 0.006, len, 8, 2), fx, y - 0.044, z + 0.008, 0.34, 0, 0),
        skinHex,
        0.04,
      ),
      materialIndex: matIdx,
      weights: [{ boneIndex: handBoneIdx, weight: 1 }],
    });
    // Distal phalanx flexed inward
    parts.push({
      geometry: colorizeGeometry(
        transformGeo(makeCapsulePart(0.0058, 0.0045, len * 0.85, 8, 2), fx, y - 0.066, z + 0.022, 0.92, 0, 0),
        skinHex,
        0.04,
      ),
      materialIndex: matIdx,
      weights: [{ boneIndex: handBoneIdx, weight: 1 }],
    });
  }
  return parts;
}

/**
 * Builds sculpted anatomical bare foot + royal gold Paduka sandal base & toe strap.
 */
function buildSculptedFootParts(
  legBoneIdx: number,
  x: number,
  z: number,
  skinHex: number,
  sandalHex: number,
  skinMatIdx: number,
  goldMatIdx: number,
): SubMeshPart[] {
  const w = [{ boneIndex: legBoneIdx, weight: 1 }];
  const footShape = makeAnatomicalLoft(
    [
      { y: -0.078, rx: 0.042, rz: 0.018 },
      { y: -0.035, rx: 0.038, rz: 0.024 },
      { y: 0.025, rx: 0.044, rz: 0.022 },
      { y: 0.078, rx: 0.042, rz: 0.014 },
    ],
    14,
  );
  transformGeo(footShape, x, 0.032, z + 0.045, Math.PI / 2, 0, 0);

  return [
    {
      geometry: colorizeGeometry(footShape, skinHex, 0.05),
      materialIndex: skinMatIdx,
      weights: w,
    },
    // Paduka wooden/gold sandal sole
    {
      geometry: colorizeGeometry(
        transformGeo(makeCapsulePart(0.046, 0.042, 0.145, 12, 3), x, 0.012, z + 0.042, Math.PI / 2, 0, 0, 1, 1, 0.34),
        sandalHex,
        0.08,
      ),
      materialIndex: goldMatIdx,
      weights: w,
    },
    // Golden Anklet (Nupura)
    {
      geometry: colorizeGeometry(
        transformGeo(new THREE.TorusGeometry(0.046, 0.008, 8, 16), x, 0.082, z, Math.PI / 2, 0, 0),
        sandalHex,
        0.08,
      ),
      materialIndex: goldMatIdx,
      weights: w,
    },
  ];
}

function assembleSkinnedCharacter(
  name: string,
  rootBone: THREE.Bone,
  bones: THREE.Bone[],
  parts: SubMeshPart[],
  materials: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.add(rootBone);
  group.updateMatrixWorld(true);

  const boneWorldPositions = bones.map((b) => {
    const v = new THREE.Vector3();
    b.getWorldPosition(v);
    return v;
  });

  const byMat = new Map<number, { geos: THREE.BufferGeometry[]; skinIndices: number[]; skinWeights: number[] }>();

  for (const part of parts) {
    if (!part.geometry.getAttribute('normal')) {
      part.geometry.computeVertexNormals();
    }
    const geo = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
    const pos = geo.getAttribute('position');
    if (!geo.getAttribute('uv')) {
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
    }
    if (!geo.getAttribute('color')) {
      const cols = new Float32Array(pos.count * 3).fill(1);
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    }

    let bucket = byMat.get(part.materialIndex);
    if (!bucket) {
      bucket = { geos: [], skinIndices: [], skinWeights: [] };
      byMat.set(part.materialIndex, bucket);
    }

    const vPos = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      if (part.weights === 'auto') {
        vPos.fromBufferAttribute(pos, i);
        let bestIdx = 0;
        let secondIdx = 0;
        let bestDist = Infinity;
        let secondDist = Infinity;
        for (let bIdx = 0; bIdx < boneWorldPositions.length; bIdx++) {
          const d = vPos.distanceToSquared(boneWorldPositions[bIdx]);
          if (d < bestDist) {
            secondDist = bestDist;
            secondIdx = bestIdx;
            bestDist = d;
            bestIdx = bIdx;
          } else if (d < secondDist) {
            secondDist = d;
            secondIdx = bIdx;
          }
        }
        const inv1 = 1 / Math.max(0.002, bestDist);
        const inv2 = 1 / Math.max(0.002, secondDist);
        const sum = inv1 + inv2;
        bucket.skinIndices.push(bestIdx, secondIdx, 0, 0);
        bucket.skinWeights.push(inv1 / sum, inv2 / sum, 0, 0);
      } else {
        const w0 = part.weights[0] ?? { boneIndex: 0, weight: 1 };
        const w1 = part.weights[1] ?? { boneIndex: 0, weight: 0 };
        const total = w0.weight + w1.weight || 1;
        bucket.skinIndices.push(w0.boneIndex, w1.boneIndex, 0, 0);
        bucket.skinWeights.push(w0.weight / total, w1.weight / total, 0, 0);
      }
    }
    bucket.geos.push(geo);
  }

  const orderedMats = Array.from(byMat.keys()).sort((a, b) => a - b);
  const perMatGeos: THREE.BufferGeometry[] = [];
  const allSkinIndices: number[] = [];
  const allSkinWeights: number[] = [];

  for (const matIdx of orderedMats) {
    const bucket = byMat.get(matIdx)!;
    const merged = mergeGeometries(bucket.geos, false);
    if (!merged) throw new Error(`Failed to merge geometry bucket ${matIdx} for ${name}`);
    perMatGeos.push(merged);
    allSkinIndices.push(...bucket.skinIndices);
    allSkinWeights.push(...bucket.skinWeights);
  }

  const finalGeo = mergeGeometries(perMatGeos, true);
  if (!finalGeo) throw new Error(`Failed final geometry merge for ${name}`);
  finalGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(allSkinIndices, 4));
  finalGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(allSkinWeights, 4));

  const skinnedMaterials = orderedMats.map((idx) => materials[idx]);
  const mesh = new THREE.SkinnedMesh(finalGeo, skinnedMaterials);
  mesh.name = `${name}_SkinnedMesh`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const skeleton = new THREE.Skeleton(bones);
  mesh.add(rootBone);
  mesh.bind(skeleton);
  group.add(mesh);
  return group;
}

function makeEulerTrack(
  boneName: string,
  times: number[],
  eulersRad: Array<[number, number, number]>,
): THREE.QuaternionKeyframeTrack {
  const values: number[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const [x, y, z] of eulersRad) {
    e.set(x, y, z, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values);
}

function makeClip(
  name: string,
  duration: number,
  tracks: THREE.KeyframeTrack[],
): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, tracks);
}

/* -------------------------------------------------------------------------- */
/*  1. SRI KRISHNA (PARTHASARATHI) ANATOMICAL RIGGED GLB + FACIAL MORPHS      */
/* -------------------------------------------------------------------------- */

function buildKrishnaAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const hips = addBone('Hips', null, 0, 0.92, 0);
  const spine = addBone('Spine', hips, 0, 0.16, 0);
  const chest = addBone('Chest', spine, 0, 0.22, 0);
  const neck = addBone('Neck', chest, 0, 0.2, 0);
  const head = addBone('Head', neck, 0, 0.14, 0.01);
  addBone('Jaw', head, 0, -0.05, 0.06);
  addBone('PeacockFeather', head, 0.05, 0.24, 0.02);

  const lShoulder = addBone('LeftShoulder', chest, 0.11, 0.16, 0);
  const lUpper = addBone('LeftUpperArm', lShoulder, 0.12, -0.02, 0);
  const lFore = addBone('LeftForeArm', lUpper, 0, -0.27, 0);
  addBone('LeftHand', lFore, 0, -0.25, 0);

  const rShoulder = addBone('RightShoulder', chest, -0.11, 0.16, 0);
  const rUpper = addBone('RightUpperArm', rShoulder, -0.12, -0.02, 0);
  const rFore = addBone('RightForeArm', rUpper, 0, -0.27, 0);
  addBone('RightHand', rFore, 0, -0.25, 0);

  const lUpLeg = addBone('LeftUpLeg', hips, 0.11, -0.04, 0);
  addBone('LeftLeg', lUpLeg, 0, -0.44, 0);
  const rUpLeg = addBone('RightUpLeg', hips, -0.11, -0.04, 0);
  addBone('RightLeg', rUpLeg, 0, -0.44, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('skin_krishna', { vertexColors: true, roughness: 0.45, metalness: 0.02 }),
    makeNamedMat('silk_pitambara', { vertexColors: true, roughness: 0.52, metalness: 0.08, side: THREE.DoubleSide }),
    makeNamedMat('gold_regalia', { vertexColors: true, roughness: 0.22, metalness: 0.9 }),
    makeNamedMat('hair_curls', { vertexColors: true, roughness: 0.62, metalness: 0.04 }),
    makeNamedMat('feather_peacock', { vertexColors: true, roughness: 0.28, metalness: 0.38, side: THREE.DoubleSide }),
  ];

  const BLUE = 0x2d64b5;
  const BLUE_LIGHT = 0x3f7ad0;
  const PITAMBARA = 0xebc052;
  const UTTARIYA_IVORY = 0xf7efe0;
  const GOLD = 0xe3b654;
  const HAIR = 0x131626;
  const PEACOCK_TEAL = 0x148276;
  const PEACOCK_BLUE = 0x1c4a9c;
  const PEACOCK_GOLD = 0xd9a541;
  const RUBY = 0xa8282b;

  // Pleated Silk Pitambara Dhoti
  const dhotiPleated = makeAnatomicalLoft(
    [
      { y: 0.52, rx: 0.205, rz: 0.175, pleatAmp: 0.013, pleatFreq: 16 },
      { y: 0.68, rx: 0.188, rz: 0.155, pleatAmp: 0.01, pleatFreq: 14 },
      { y: 0.84, rx: 0.172, rz: 0.132, pleatAmp: 0.007, pleatFreq: 14 },
      { y: 0.95, rx: 0.16, rz: 0.118, pleatAmp: 0.004, pleatFreq: 12 },
    ],
    28,
  );

  // Flowing Uttariya Silk Shawl curve wrapping right-to-left over arms
  const uttariyaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.21, 1.38, -0.02),
    new THREE.Vector3(-0.18, 1.15, 0.16),
    new THREE.Vector3(0, 1.04, 0.175),
    new THREE.Vector3(0.21, 1.18, 0.12),
    new THREE.Vector3(0.18, 1.38, -0.09),
    new THREE.Vector3(-0.04, 1.32, -0.14),
    new THREE.Vector3(-0.21, 1.38, -0.02),
  ]);

  // Sculpted Upper/Lower Arm Loft
  const makeUpperArm = () =>
    makeAnatomicalLoft(
      [
        { y: -0.125, rx: 0.041, rz: 0.042 },
        { y: -0.03, rx: 0.049, rz: 0.052, frontBulge: 0.005 },
        { y: 0.07, rx: 0.055, rz: 0.058, frontBulge: 0.006 },
        { y: 0.13, rx: 0.062, rz: 0.062 },
      ],
      16,
    );
  const makeForeArm = () =>
    makeAnatomicalLoft(
      [
        { y: -0.12, rx: 0.03, rz: 0.028 },
        { y: -0.02, rx: 0.038, rz: 0.036 },
        { y: 0.08, rx: 0.045, rz: 0.044, frontBulge: 0.004 },
        { y: 0.125, rx: 0.041, rz: 0.041 },
      ],
      16,
    );
  const makeCalfPleated = () =>
    makeAnatomicalLoft(
      [
        { y: -0.19, rx: 0.044, rz: 0.042, pleatAmp: 0.004, pleatFreq: 10 },
        { y: -0.05, rx: 0.062, rz: 0.064, pleatAmp: 0.005, pleatFreq: 10 },
        { y: 0.12, rx: 0.072, rz: 0.074, pleatAmp: 0.006, pleatFreq: 10 },
        { y: 0.21, rx: 0.076, rz: 0.076 },
      ],
      16,
    );

  // Peacock feather curved rachis stem
  const quillCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.035, 1.82, 0.01),
    new THREE.Vector3(0.058, 1.91, 0.018),
    new THREE.Vector3(0.086, 2.01, 0.022),
  ]);

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(dhotiPleated, PITAMBARA, 0.12),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Hips'), weight: 0.8 }, { boneIndex: bi('Spine'), weight: 0.2 }],
    },
    // Center cascading sash pleat
    {
      geometry: colorizeGeometry(
        transformGeo(
          makeAnatomicalLoft(
            [
              { y: 0.22, rx: 0.075, rz: 0.022, pleatAmp: 0.008, pleatFreq: 8 },
              { y: 0.56, rx: 0.058, rz: 0.02, pleatAmp: 0.006, pleatFreq: 8 },
              { y: 0.92, rx: 0.044, rz: 0.018 },
            ],
            14,
          ),
          0,
          0,
          0.125,
        ),
        PITAMBARA,
        0.13,
      ),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Hips'), weight: 1 }],
    },
    // Carved Gold Kamarbandh Waistband + Clasp
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.165, 0.022, 12, 32), 0, 0.945, 0, Math.PI / 2, 0, 0, 1.0, 0.78, 1), GOLD, 0.1),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 0.9 }, { boneIndex: bi('Spine'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.OctahedronGeometry(0.032, 1), 0, 0.945, 0.136), RUBY),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 1 }],
    },
    // Anatomical Sculpted Torso
    {
      geometry: colorizeGeometry(makeAnatomicalTorso(1.02, 0.96), BLUE_LIGHT, 0.07),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Chest'), weight: 0.72 }, { boneIndex: bi('Spine'), weight: 0.28 }],
    },
    // Draped Silk Uttariya
    {
      geometry: colorizeGeometry(new THREE.TubeGeometry(uttariyaCurve, 44, 0.024, 10, true), UTTARIYA_IVORY, 0.1),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 0.85 }, { boneIndex: bi('LeftShoulder'), weight: 0.15 }],
    },
    // Vaijayanti Floral Garland & Kaustubha Jewel
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.145, 0.018, 12, 32), 0, 1.25, 0.06, 0.88, 0, 0), GOLD, 0.1),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Chest'), weight: 0.9 }, { boneIndex: bi('Neck'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.OctahedronGeometry(0.028, 1), 0, 1.28, 0.158), RUBY),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    // Sculpted Neck
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.054, 0.065, 0.115, 18, 5), 0, 1.495, 0), BLUE, 0.06),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Neck'), weight: 0.82 }, { boneIndex: bi('Chest'), weight: 0.18 }],
    },
    // Head Ears, Hair Curls, Kundala Earrings & Multi-Tier Mukuta Crown
    ...buildHeadAnatomyAccents({
      headBoneIdx: bi('Head'),
      jawBoneIdx: bi('Jaw'),
      headCenterY: 1.63,
      skinHex: BLUE_LIGHT,
      hairHex: HAIR,
      goldHex: GOLD,
      skinMatIdx: 0,
      hairMatIdx: 3,
      goldMatIdx: 2,
      hasKundala: true,
      beardStyle: 'none',
    }),
    ...buildRoyalCrownParts(bi('Head'), 1.71, GOLD, RUBY, 2, 4, 1.0),
    // Layered Peacock Feather Crest
    {
      geometry: colorizeGeometry(new THREE.TubeGeometry(quillCurve, 14, 0.0045, 7, false), PEACOCK_GOLD, 0.08),
      materialIndex: 4,
      weights: [{ boneIndex: bi('PeacockFeather'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CircleGeometry(0.064, 24), 0.084, 2.01, 0.022, 0, 0.18, -0.25, 0.72, 1.18, 1), PEACOCK_TEAL, 0.08),
      materialIndex: 4,
      weights: [{ boneIndex: bi('PeacockFeather'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CircleGeometry(0.034, 20), 0.085, 2.015, 0.025, 0, 0.18, -0.25, 0.72, 1.15, 1), PEACOCK_BLUE, 0.06),
      materialIndex: 4,
      weights: [{ boneIndex: bi('PeacockFeather'), weight: 1 }],
    },
    // Sculpted Left Arm + Armlet + Bangles + 2-Knuckle Fingers
    {
      geometry: colorizeGeometry(transformGeo(makeUpperArm(), 0.23, 1.24, 0, 0, 0, 0.08), BLUE, 0.06),
      materialIndex: 0,
      weights: [{ boneIndex: bi('LeftUpperArm'), weight: 0.9 }, { boneIndex: bi('LeftShoulder'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.055, 0.011, 10, 20), 0.232, 1.27, 0, Math.PI / 2, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('LeftUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeForeArm(), 0.25, 0.98, 0.03, -0.15, 0, 0.04), BLUE, 0.06),
      materialIndex: 0,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 0.9 }, { boneIndex: bi('LeftUpperArm'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.038, 0.008, 8, 18), 0.252, 0.875, 0.048, Math.PI / 2, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('LeftHand'), 0.255, 0.83, 0.06, BLUE_LIGHT, 0, 1),
    // Sculpted Right Arm + Armlet + Bangles + 2-Knuckle Fingers
    {
      geometry: colorizeGeometry(transformGeo(makeUpperArm(), -0.23, 1.24, 0, 0, 0, -0.08), BLUE, 0.06),
      materialIndex: 0,
      weights: [{ boneIndex: bi('RightUpperArm'), weight: 0.9 }, { boneIndex: bi('RightShoulder'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.055, 0.011, 10, 20), -0.232, 1.27, 0, Math.PI / 2, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('RightUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeForeArm(), -0.25, 0.98, 0.03, -0.15, 0, -0.04), BLUE, 0.06),
      materialIndex: 0,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 0.9 }, { boneIndex: bi('RightUpperArm'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.038, 0.008, 8, 18), -0.252, 0.875, 0.048, Math.PI / 2, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('RightHand'), -0.255, 0.83, 0.06, BLUE_LIGHT, 0, -1),
    // Draped Dhoti Legs + Sculpted Feet & Padukas
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.095, 0.074, 0.42, 18, 8), 0.11, 0.65, 0), PITAMBARA, 0.09),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftUpLeg'), weight: 0.9 }, { boneIndex: bi('Hips'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCalfPleated(), 0.11, 0.27, 0), PITAMBARA, 0.09),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('LeftLeg'), 0.11, 0, BLUE, GOLD, 0, 2),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.095, 0.074, 0.42, 18, 8), -0.11, 0.65, 0), PITAMBARA, 0.09),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightUpLeg'), weight: 0.9 }, { boneIndex: bi('Hips'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCalfPleated(), -0.11, 0.27, 0), PITAMBARA, 0.09),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('RightLeg'), -0.11, 0, BLUE, GOLD, 0, 2),
  ];

  const scene = assembleSkinnedCharacter('SriKrishnaRig', hips, bones, parts, materials);

  const faceAssembly = buildSculptedFaceAssembly({
    name: 'KrishnaFacialMorphMesh',
    skinHex: BLUE_LIGHT,
    lipHex: 0x9b4d5a,
    browHex: HAIR,
    eyeIrisHex: 0x160f0d,
    tildeMarkHex: 0xfff3d4,
  });
  faceAssembly.position.set(0, -0.01, 0.005);
  head.add(faceAssembly);

  const animations: THREE.AnimationClip[] = [
    makeClip('idle_breathing', 4, [
      makeEulerTrack('Chest', [0, 2, 4], [[-0.02, 0, 0], [0.025, 0, 0], [-0.02, 0, 0]]),
      makeEulerTrack('PeacockFeather', [0, 2, 4], [[0, 0, -0.05], [0.06, 0, 0.06], [0, 0, -0.05]]),
      makeEulerTrack('Head', [0, 2, 4], [[0.01, 0, 0], [-0.02, 0.03, 0], [0.01, 0, 0]]),
    ]),
    makeClip('standing_posture', 3.5, [
      makeEulerTrack('Chest', [0, 1.75, 3.5], [[0, 0, 0], [0.03, 0, 0], [0, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.75, 3.5], [[-2.6, 0, 0.15], [-2.75, 0, 0.18], [-2.6, 0, 0.15]]),
      makeEulerTrack('RightForeArm', [0, 1.75, 3.5], [[-0.22, 0, 0], [-0.15, 0, 0], [-0.22, 0, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.75, 3.5], [[0.08, 0, -0.06], [0.1, 0, -0.08], [0.08, 0, -0.06]]),
    ]),
    makeClip('head_turn', 3, [
      makeEulerTrack('Neck', [0, 1.5, 3], [[0, -0.15, 0], [0, 0.28, 0], [0, -0.15, 0]]),
      makeEulerTrack('Head', [0, 1.5, 3], [[0, -0.12, 0], [0.04, 0.34, 0.04], [0, -0.12, 0]]),
    ]),
    makeClip('look_at_arjuna', 3.2, [
      makeEulerTrack('Neck', [0, 1.6, 3.2], [[0, 0.32, 0], [0.04, 0.38, 0], [0, 0.32, 0]]),
      makeEulerTrack('Head', [0, 1.6, 3.2], [[0.05, 0.25, -0.03], [0.08, 0.32, -0.04], [0.05, 0.25, -0.03]]),
    ]),
    makeClip('hold_reins', 3.2, [
      makeEulerTrack('LeftUpperArm', [0, 1.6, 3.2], [[-0.52, 0.12, -0.05], [-0.58, 0.12, -0.05], [-0.52, 0.12, -0.05]]),
      makeEulerTrack('LeftForeArm', [0, 1.6, 3.2], [[-0.45, 0, 0], [-0.52, 0, 0], [-0.45, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.6, 3.2], [[-0.48, -0.1, 0.05], [-0.54, -0.1, 0.05], [-0.48, -0.1, 0.05]]),
      makeEulerTrack('RightForeArm', [0, 1.6, 3.2], [[-0.42, 0, 0], [-0.48, 0, 0], [-0.42, 0, 0]]),
      makeEulerTrack('Chest', [0, 1.6, 3.2], [[0.04, 0, 0], [0.08, 0, 0], [0.04, 0, 0]]),
    ]),
    makeClip('arm_movement', 3, [
      makeEulerTrack('RightUpperArm', [0, 1.5, 3], [[-0.45, 0, 0.18], [-0.72, 0.15, 0.24], [-0.45, 0, 0.18]]),
      makeEulerTrack('RightForeArm', [0, 1.5, 3], [[-0.65, 0, 0], [-0.88, 0.1, 0], [-0.65, 0, 0]]),
    ]),
    makeClip('teaching_gesture', 3.6, [
      makeEulerTrack('Spine', [0, 1.8, 3.6], [[0, 0.32, 0], [0.03, 0.38, 0], [0, 0.32, 0]]),
      makeEulerTrack('Head', [0, 1.8, 3.6], [[0.06, 0.26, 0], [0.09, 0.3, -0.02], [0.06, 0.26, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.8, 3.6], [[-0.68, 0.18, 0.16], [-0.86, 0.24, 0.22], [-0.68, 0.18, 0.16]]),
      makeEulerTrack('RightForeArm', [0, 1.8, 3.6], [[-0.78, 0, 0.2], [-0.62, 0.12, 0.25], [-0.78, 0, 0.2]]),
      makeEulerTrack('LeftUpperArm', [0, 1.8, 3.6], [[-0.32, 0.1, -0.08], [-0.36, 0.12, -0.08], [-0.32, 0.1, -0.08]]),
    ]),
    makeClip('open_palm_gesture', 3.6, [
      makeEulerTrack('Spine', [0, 1.8, 3.6], [[0, 0.28, 0], [0.02, 0.32, 0], [0, 0.28, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.8, 3.6], [[-0.58, -0.15, 0.28], [-0.72, -0.22, 0.36], [-0.58, -0.15, 0.28]]),
      makeEulerTrack('RightForeArm', [0, 1.8, 3.6], [[-0.45, -0.35, 0], [-0.32, -0.45, 0], [-0.45, -0.35, 0]]),
      makeEulerTrack('RightHand', [0, 1.8, 3.6], [[0, 0, -0.25], [0.1, 0, -0.32], [0, 0, -0.25]]),
    ]),
    makeClip('subtle_expression', 2.8, [
      makeEulerTrack('Head', [0, 1.4, 2.8], [[0.03, 0.1, 0], [0.06, 0.14, -0.03], [0.03, 0.1, 0]]),
      makeEulerTrack('Jaw', [0, 1.4, 2.8], [[0, 0, 0], [0.05, 0, 0], [0, 0, 0]]),
    ]),
    makeClip('sit_chariot', 3.5, [
      makeEulerTrack('LeftUpLeg', [0, 1.75, 3.5], [[-0.95, 0, 0.08], [-0.95, 0, 0.08], [-0.95, 0, 0.08]]),
      makeEulerTrack('LeftLeg', [0, 1.75, 3.5], [[1.15, 0, 0], [1.15, 0, 0], [1.15, 0, 0]]),
      makeEulerTrack('RightUpLeg', [0, 1.75, 3.5], [[-0.95, 0, -0.08], [-0.95, 0, -0.08], [-0.95, 0, -0.08]]),
      makeEulerTrack('RightLeg', [0, 1.75, 3.5], [[1.15, 0, 0], [1.15, 0, 0], [1.15, 0, 0]]),
    ]),
    makeClip('turn_toward_arjuna', 2.8, [
      makeEulerTrack('Spine', [0, 1.4, 2.8], [[0, 0.12, 0], [0, 0.56, 0], [0, 0.52, 0]]),
      makeEulerTrack('Neck', [0, 1.4, 2.8], [[0, 0.1, 0], [0, 0.34, 0], [0, 0.3, 0]]),
    ]),
    makeClip('composed_presence', 4, [
      makeEulerTrack('Chest', [0, 2, 4], [[0, 0.15, 0], [0.03, 0.18, 0], [0, 0.15, 0]]),
      makeEulerTrack('RightUpperArm', [0, 2, 4], [[-0.55, 0.1, 0.14], [-0.62, 0.14, 0.16], [-0.55, 0.1, 0.14]]),
      makeEulerTrack('PeacockFeather', [0, 2, 4], [[0, 0, -0.04], [0.05, 0, 0.05], [0, 0, -0.04]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  2. ARJUNA (PANDAVA ARCHER + GANDIVA BOW + MORPHS) RIGGED GLB              */
/* -------------------------------------------------------------------------- */

function buildArjunaAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const hips = addBone('Hips', null, 0, 0.94, 0);
  const spine = addBone('Spine', hips, 0, 0.16, 0);
  const chest = addBone('Chest', spine, 0, 0.22, 0);
  const neck = addBone('Neck', chest, 0, 0.2, 0);
  const head = addBone('Head', neck, 0, 0.14, 0.01);
  addBone('Jaw', head, 0, -0.05, 0.06);

  const lShoulder = addBone('LeftShoulder', chest, 0.12, 0.16, 0);
  const lUpper = addBone('LeftUpperArm', lShoulder, 0.13, -0.02, 0);
  const lFore = addBone('LeftForeArm', lUpper, 0, -0.27, 0);
  const lHand = addBone('LeftHand', lFore, 0, -0.25, 0);
  addBone('BowMount', lHand, 0.02, 0.0, 0.05);

  const rShoulder = addBone('RightShoulder', chest, -0.12, 0.16, 0);
  const rUpper = addBone('RightUpperArm', rShoulder, -0.13, -0.02, 0);
  const rFore = addBone('RightForeArm', rUpper, 0, -0.27, 0);
  addBone('RightHand', rFore, 0, -0.25, 0);

  const lUpLeg = addBone('LeftUpLeg', hips, 0.115, -0.04, 0);
  addBone('LeftLeg', lUpLeg, 0, -0.45, 0);
  const rUpLeg = addBone('RightUpLeg', hips, -0.115, -0.04, 0);
  addBone('RightLeg', rUpLeg, 0, -0.45, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('skin_arjuna', { vertexColors: true, roughness: 0.5, metalness: 0.02 }),
    makeNamedMat('bronze_armor', { vertexColors: true, roughness: 0.24, metalness: 0.88 }),
    makeNamedMat('silk_cloth', { vertexColors: true, roughness: 0.52, metalness: 0.08, side: THREE.DoubleSide }),
    makeNamedMat('hair_beard', { vertexColors: true, roughness: 0.64, metalness: 0.04 }),
    makeNamedMat('gold_gandiva', { vertexColors: true, roughness: 0.2, metalness: 0.92 }),
  ];

  const SKIN = 0xa8714e;
  const BRONZE = 0xd6a049;
  const CRIMSON = 0x8e2424;
  const IVORY = 0xf2e7d2;
  const HAIR = 0x16141a;
  const GANDIVA = 0xf4cc70;

  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.28, 1.56, 0.14),
    new THREE.Vector3(0.28, 1.24, 0.26),
    new THREE.Vector3(0.28, 0.86, 0.18),
    new THREE.Vector3(0.28, 0.48, 0.26),
    new THREE.Vector3(0.28, 0.18, 0.14),
  ]);
  const bowGeo = colorizeGeometry(new THREE.TubeGeometry(bowCurve, 32, 0.017, 10, false), GANDIVA, 0.09);

  const pleatedDhoti = makeAnatomicalLoft(
    [
      { y: 0.54, rx: 0.212, rz: 0.18, pleatAmp: 0.013, pleatFreq: 16 },
      { y: 0.72, rx: 0.19, rz: 0.155, pleatAmp: 0.01, pleatFreq: 14 },
      { y: 0.93, rx: 0.168, rz: 0.122, pleatAmp: 0.005, pleatFreq: 12 },
    ],
    26,
  );

  const makeUpperArm = () =>
    makeAnatomicalLoft(
      [
        { y: -0.125, rx: 0.044, rz: 0.044 },
        { y: -0.02, rx: 0.055, rz: 0.056, frontBulge: 0.006 },
        { y: 0.08, rx: 0.062, rz: 0.064, frontBulge: 0.006 },
        { y: 0.13, rx: 0.068, rz: 0.068 },
      ],
      16,
    );

  const sashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.21, 1.38, -0.02),
    new THREE.Vector3(0.18, 1.15, 0.17),
    new THREE.Vector3(-0.02, 1.05, 0.18),
    new THREE.Vector3(-0.21, 1.18, 0.12),
    new THREE.Vector3(-0.18, 1.38, -0.09),
    new THREE.Vector3(0.04, 1.32, -0.15),
    new THREE.Vector3(0.21, 1.38, -0.02),
  ]);

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(pleatedDhoti, IVORY, 0.1),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 0.85 }, { boneIndex: bi('Spine'), weight: 0.15 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.172, 0.024, 10, 28), 0, 0.95, 0, Math.PI / 2, 0, 0, 1, 0.82, 1), CRIMSON, 0.08),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 0.9 }, { boneIndex: bi('Spine'), weight: 0.1 }],
    },
    // Sculpted Muscle Bronze Cuirass (Kavacha)
    {
      geometry: colorizeGeometry(makeAnatomicalTorso(1.1, 1.05), BRONZE, 0.11),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 0.75 }, { boneIndex: bi('Spine'), weight: 0.25 }],
    },
    // Suncrest Pectoral Emblem + Armored Rib Bands
    {
      geometry: colorizeGeometry(transformGeo(new THREE.OctahedronGeometry(0.046, 1), 0, 1.28, 0.155), GANDIVA),
      materialIndex: 4,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    // Layered Bronze Shoulder Pauldrons
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.092, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), 0.23, 1.38, 0, 0, 0, -0.35), BRONZE, 0.1),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftShoulder'), weight: 0.8 }, { boneIndex: bi('Chest'), weight: 0.2 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.092, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), -0.23, 1.38, 0, 0, 0, 0.35), BRONZE, 0.1),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightShoulder'), weight: 0.8 }, { boneIndex: bi('Chest'), weight: 0.2 }],
    },
    // Crimson Commander Sash
    {
      geometry: colorizeGeometry(new THREE.TubeGeometry(sashCurve, 38, 0.024, 10, true), CRIMSON, 0.09),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Chest'), weight: 0.85 }, { boneIndex: bi('RightShoulder'), weight: 0.15 }],
    },
    // Ornate Quiver + Individual Feathered Arrow Shafts
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.052, 0.038, 0.48, 14), -0.1, 1.27, -0.18, 0.15, 0, 0.28), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    ...[-1, 0, 1].flatMap((a) => [
      {
        geometry: colorizeGeometry(
          transformGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 6), -0.16 + a * 0.022, 1.52, -0.22 + Math.abs(a) * 0.015, 0.15, 0, 0.28),
          GANDIVA,
        ),
        materialIndex: 4,
        weights: [{ boneIndex: bi('Chest'), weight: 1 }],
      },
      {
        geometry: colorizeGeometry(
          transformGeo(new THREE.ConeGeometry(0.014, 0.045, 6), -0.175 + a * 0.022, 1.59, -0.23 + Math.abs(a) * 0.015, 0.15, 0, 0.28),
          IVORY,
        ),
        materialIndex: 2,
        weights: [{ boneIndex: bi('Chest'), weight: 1 }],
      },
    ]),
    // Neck + Head Ears, Hair, Beard & Kiriti Crown
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.058, 0.068, 0.115, 16, 5), 0, 1.5, 0), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Neck'), weight: 0.8 }, { boneIndex: bi('Chest'), weight: 0.2 }],
    },
    ...buildHeadAnatomyAccents({
      headBoneIdx: bi('Head'),
      jawBoneIdx: bi('Jaw'),
      headCenterY: 1.635,
      skinHex: SKIN,
      hairHex: HAIR,
      goldHex: GANDIVA,
      skinMatIdx: 0,
      hairMatIdx: 3,
      goldMatIdx: 4,
      hasKundala: true,
      beardStyle: 'royal-trim',
    }),
    ...buildRoyalCrownParts(bi('Head'), 1.715, BRONZE, GANDIVA, 1, 4, 1.02),
    // Left Arm + Bracer + Sculpted Hand + Gandiva Bow
    {
      geometry: colorizeGeometry(transformGeo(makeUpperArm(), 0.25, 1.24, 0, 0, 0, 0.08), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('LeftUpperArm'), weight: 0.9 }, { boneIndex: bi('LeftShoulder'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.05, 0.038, 0.24, 14, 6), 0.27, 0.98, 0.04, -0.15, 0, 0.04), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 0.9 }, { boneIndex: bi('LeftUpperArm'), weight: 0.1 }],
    },
    ...buildArticulatedHandParts(bi('LeftHand'), 0.275, 0.84, 0.07, SKIN, 0, 1),
    {
      geometry: bowGeo,
      materialIndex: 4,
      weights: [{ boneIndex: bi('BowMount'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 12), 0.28, 0.86, 0.18), CRIMSON),
      materialIndex: 2,
      weights: [{ boneIndex: bi('BowMount'), weight: 1 }],
    },
    // Right Arm + Bracer + Sculpted Hand
    {
      geometry: colorizeGeometry(transformGeo(makeUpperArm(), -0.25, 1.24, 0, 0, 0, -0.08), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('RightUpperArm'), weight: 0.9 }, { boneIndex: bi('RightShoulder'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.05, 0.038, 0.24, 14, 6), -0.27, 0.98, 0.04, -0.15, 0, -0.04), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 0.9 }, { boneIndex: bi('RightUpperArm'), weight: 0.1 }],
    },
    ...buildArticulatedHandParts(bi('RightHand'), -0.275, 0.84, 0.07, SKIN, 0, -1),
    // Warrior Legs, Greaves & Royal Sandals
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.098, 0.076, 0.43, 16, 6), 0.115, 0.65, 0), IVORY),
      materialIndex: 2,
      weights: [{ boneIndex: bi('LeftUpLeg'), weight: 0.9 }, { boneIndex: bi('Hips'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.068, 0.046, 0.39, 16, 6), 0.115, 0.27, 0), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('LeftLeg'), 0.115, 0, SKIN, BRONZE, 0, 4),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.098, 0.076, 0.43, 16, 6), -0.115, 0.65, 0), IVORY),
      materialIndex: 2,
      weights: [{ boneIndex: bi('RightUpLeg'), weight: 0.9 }, { boneIndex: bi('Hips'), weight: 0.1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.068, 0.046, 0.39, 16, 6), -0.115, 0.27, 0), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('RightLeg'), -0.115, 0, SKIN, BRONZE, 0, 4),
  ];

  const scene = assembleSkinnedCharacter('ArjunaRig', hips, bones, parts, materials);

  const faceAssembly = buildSculptedFaceAssembly({
    name: 'ArjunaFacialMorphMesh',
    skinHex: SKIN,
    lipHex: 0x82483e,
    browHex: HAIR,
    eyeIrisHex: 0x1d140f,
    tildeMarkHex: 0xd94336,
    hasBeard: true,
    beardHex: HAIR,
  });
  faceAssembly.position.set(0, -0.01, 0.005);
  head.add(faceAssembly);

  const animations: THREE.AnimationClip[] = [
    makeClip('sit_chariot', 3.6, [
      makeEulerTrack('LeftUpLeg', [0, 1.8, 3.6], [[-0.85, 0, 0.08], [-0.85, 0, 0.08], [-0.85, 0, 0.08]]),
      makeEulerTrack('LeftLeg', [0, 1.8, 3.6], [[1.05, 0, 0], [1.05, 0, 0], [1.05, 0, 0]]),
      makeEulerTrack('RightUpLeg', [0, 1.8, 3.6], [[-0.85, 0, -0.08], [-0.85, 0, -0.08], [-0.85, 0, -0.08]]),
      makeEulerTrack('RightLeg', [0, 1.8, 3.6], [[1.05, 0, 0], [1.05, 0, 0], [1.05, 0, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.8, 3.6], [[-0.35, 0, 0.08], [-0.39, 0, 0.08], [-0.35, 0, 0.08]]),
    ]),
    makeClip('look_at_armies', 4, [
      makeEulerTrack('Neck', [0, 1.4, 2.8, 4], [[0, -0.22, 0], [0, 0.24, 0], [0.05, 0.05, 0], [0, -0.22, 0]]),
      makeEulerTrack('Head', [0, 1.4, 2.8, 4], [[0.04, -0.26, 0], [0.04, 0.26, 0], [0.08, 0.05, 0], [0.04, -0.26, 0]]),
    ]),
    makeClip('head_turn', 3, [
      makeEulerTrack('Neck', [0, 1.5, 3], [[0, 0.18, 0], [0, -0.25, 0], [0, 0.18, 0]]),
      makeEulerTrack('Head', [0, 1.5, 3], [[0.03, 0.22, 0], [0.04, -0.28, 0], [0.03, 0.22, 0]]),
    ]),
    makeClip('distressed_posture', 3.6, [
      makeEulerTrack('Spine', [0, 1.8, 3.6], [[0.24, 0, 0], [0.29, 0, 0], [0.24, 0, 0]]),
      makeEulerTrack('Chest', [0, 1.8, 3.6], [[0.22, 0, 0], [0.26, 0, 0], [0.22, 0, 0]]),
      makeEulerTrack('Neck', [0, 1.8, 3.6], [[0.3, 0, 0], [0.35, 0, 0], [0.3, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.8, 3.6], [[-1.08, 0.22, -0.1], [-1.14, 0.25, -0.1], [-1.08, 0.22, -0.1]]),
      makeEulerTrack('RightForeArm', [0, 1.8, 3.6], [[-1.18, 0, 0], [-1.24, 0, 0], [-1.18, 0, 0]]),
      makeEulerTrack('BowMount', [0, 1.8, 3.6], [[0.55, 0, 0.3], [0.58, 0, 0.32], [0.55, 0, 0.3]]),
    ]),
    makeClip('lower_bow', 2.6, [
      makeEulerTrack('LeftUpperArm', [0, 1.3, 2.6], [[-0.55, 0, 0.1], [-0.15, 0, 0.08], [0.08, 0, 0.06]]),
      makeEulerTrack('LeftForeArm', [0, 1.3, 2.6], [[-0.65, 0, 0], [-0.32, 0, 0], [-0.15, 0, 0]]),
      makeEulerTrack('BowMount', [0, 1.3, 2.6], [[0.1, 0, 0], [0.48, 0, 0.22], [0.68, 0, 0.32]]),
      makeEulerTrack('Spine', [0, 1.3, 2.6], [[0.06, 0, 0], [0.16, 0, 0], [0.24, 0, 0]]),
    ]),
    makeClip('arm_movement', 3, [
      makeEulerTrack('RightUpperArm', [0, 1.5, 3], [[-0.5, 0, -0.1], [-0.85, 0.2, -0.05], [-0.5, 0, -0.1]]),
      makeEulerTrack('RightForeArm', [0, 1.5, 3], [[-0.8, 0, 0], [-1.05, 0, 0], [-0.8, 0, 0]]),
    ]),
    makeClip('bow_resting', 3.4, [
      makeEulerTrack('LeftUpperArm', [0, 1.7, 3.4], [[0.08, 0, 0.08], [0.1, 0, 0.08], [0.08, 0, 0.08]]),
      makeEulerTrack('BowMount', [0, 1.7, 3.4], [[0.68, 0, 0.32], [0.71, 0, 0.34], [0.68, 0, 0.32]]),
      makeEulerTrack('Spine', [0, 1.7, 3.4], [[0.22, 0, 0], [0.25, 0, 0], [0.22, 0, 0]]),
    ]),
    makeClip('emotional_posture', 3.4, [
      makeEulerTrack('Spine', [0, 1.7, 3.4], [[0.18, -0.18, 0], [0.22, -0.22, 0], [0.18, -0.18, 0]]),
      makeEulerTrack('Head', [0, 1.7, 3.4], [[0.22, -0.25, 0.06], [0.26, -0.28, 0.06], [0.22, -0.25, 0.06]]),
      makeEulerTrack('RightUpperArm', [0, 1.7, 3.4], [[-0.95, 0.28, 0.12], [-1.02, 0.3, 0.12], [-0.95, 0.28, 0.12]]),
      makeEulerTrack('RightForeArm', [0, 1.7, 3.4], [[-1.05, 0, 0], [-1.1, 0, 0], [-1.05, 0, 0]]),
    ]),
    makeClip('listen_to_krishna', 3.6, [
      makeEulerTrack('Spine', [0, 1.8, 3.6], [[0.06, -0.34, 0], [0.08, -0.36, 0], [0.06, -0.34, 0]]),
      makeEulerTrack('Neck', [0, 1.8, 3.6], [[0.04, -0.26, 0], [0.07, -0.28, 0], [0.04, -0.26, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.8, 3.6], [[-0.65, 0.25, 0.15], [-0.68, 0.28, 0.15], [-0.65, 0.25, 0.15]]),
      makeEulerTrack('RightForeArm', [0, 1.8, 3.6], [[-0.95, 0, 0.2], [-0.98, 0, 0.2], [-0.95, 0, 0.2]]),
      makeEulerTrack('LeftUpperArm', [0, 1.8, 3.6], [[-0.45, -0.15, 0.05], [-0.47, -0.15, 0.05], [-0.45, -0.15, 0.05]]),
    ]),
    makeClip('raise_bow', 2.8, [
      makeEulerTrack('Spine', [0, 1.4, 2.8], [[0.14, 0, 0], [0.04, 0.12, 0], [0, 0.18, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.4, 2.8], [[0.05, 0, 0.1], [-0.72, 0.1, 0.22], [-1.18, 0.12, 0.25]]),
      makeEulerTrack('LeftForeArm', [0, 1.4, 2.8], [[-0.25, 0, 0], [-0.35, 0, 0], [-0.28, 0, 0]]),
      makeEulerTrack('BowMount', [0, 1.4, 2.8], [[0.45, 0, 0.2], [0.1, 0, 0.05], [0, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.4, 2.8], [[-0.35, 0, 0], [-0.85, -0.2, -0.28], [-1.05, -0.25, -0.35]]),
    ]),
    makeClip('ready_to_act', 3.4, [
      makeEulerTrack('Spine', [0, 1.7, 3.4], [[-0.02, 0.14, 0], [0, 0.16, 0], [-0.02, 0.14, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.7, 3.4], [[-1.12, 0.12, 0.22], [-1.16, 0.12, 0.22], [-1.12, 0.12, 0.22]]),
      makeEulerTrack('BowMount', [0, 1.7, 3.4], [[0, 0, 0], [0.03, 0, 0], [0, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.7, 3.4], [[-0.95, -0.2, -0.3], [-1.02, -0.22, -0.32], [-0.95, -0.2, -0.3]]),
    ]),
    makeClip('composed_warrior', 3.6, [
      makeEulerTrack('Chest', [0, 1.8, 3.6], [[-0.04, 0, 0], [0, 0, 0], [-0.04, 0, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.8, 3.6], [[-0.82, 0.08, 0.14], [-0.86, 0.08, 0.14], [-0.82, 0.08, 0.14]]),
      makeEulerTrack('BowMount', [0, 1.8, 3.6], [[0.04, 0, 0], [0.04, 0, 0], [0.04, 0, 0]]),
    ]),
    makeClip('draw_bow_shoot', 2.4, [
      makeEulerTrack('Spine', [0, 0.9, 1.7, 2.4], [[0, 0.22, 0], [0, 0.28, 0], [-0.03, 0.22, 0], [0, 0.22, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 0.9, 1.7, 2.4], [[-1.28, 0.08, 0.14], [-1.32, 0.06, 0.12], [-1.3, 0.06, 0.12], [-1.28, 0.08, 0.14]]),
      makeEulerTrack('LeftForeArm', [0, 0.9, 1.7, 2.4], [[-0.18, 0, 0], [-0.14, 0, 0], [-0.16, 0, 0], [-0.18, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 0.9, 1.7, 2.4], [[-1.12, -0.15, -0.38], [-1.24, -0.45, -0.78], [-1.18, -0.28, -0.52], [-1.12, -0.15, -0.38]]),
      makeEulerTrack('RightForeArm', [0, 0.9, 1.7, 2.4], [[-1.08, 0, 0], [-1.45, 0.22, 0], [-0.72, 0, 0], [-1.08, 0, 0]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  3. WHITE WARHORSES (ANATOMICAL SAINDHAVA EQUINE RIG) GLB                  */
/* -------------------------------------------------------------------------- */

function buildWhiteHorsesAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const bodyRoot = addBone('BodyRoot', null, 0, 1.15, 0);
  const pelvis = addBone('Pelvis', bodyRoot, 0, 0.02, -0.45);
  const chest = addBone('Chest', bodyRoot, 0, 0.04, 0.42);
  const neckBase = addBone('NeckBase', chest, 0, 0.18, 0.25);
  const neckMid = addBone('NeckMid', neckBase, 0, 0.28, 0.18);
  const head = addBone('Head', neckMid, 0, 0.24, 0.16);
  addBone('EarL', head, 0.07, 0.14, -0.05);
  addBone('EarR', head, -0.07, 0.14, -0.05);

  const tailBase = addBone('TailBase', pelvis, 0, 0.15, -0.35);
  addBone('TailTip', tailBase, 0, -0.34, -0.14);

  const flShoulder = addBone('FrontLeftShoulder', chest, 0.17, -0.14, 0.08);
  addBone('FrontLeftKnee', flShoulder, 0, -0.45, 0);
  const frShoulder = addBone('FrontRightShoulder', chest, -0.17, -0.14, 0.08);
  addBone('FrontRightKnee', frShoulder, 0, -0.45, 0);

  const blHip = addBone('BackLeftHip', pelvis, 0.18, -0.12, -0.06);
  addBone('BackLeftHock', blHip, 0, -0.45, 0);
  const brHip = addBone('BackRightHip', pelvis, -0.18, -0.12, -0.06);
  addBone('BackRightHock', brHip, 0, -0.45, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('equine_coat', { vertexColors: true, roughness: 0.44, metalness: 0.03 }),
    makeNamedMat('mane_hair', { vertexColors: true, roughness: 0.62, metalness: 0.04, side: THREE.DoubleSide }),
    makeNamedMat('silk_caparison', { vertexColors: true, roughness: 0.56, metalness: 0.08, side: THREE.DoubleSide }),
    makeNamedMat('gold_bridle', { vertexColors: true, roughness: 0.24, metalness: 0.88 }),
    makeNamedMat('eye_cornea', { vertexColors: true, roughness: 0.05, metalness: 0.05 }),
  ];

  const WHITE_COAT = 0xf5f2ec;
  const MUZZLE = 0xd9c6bc;
  const MANE = 0xe8e5df;
  const CRIMSON = 0x8f2020;
  const GOLD = 0xdfb152;
  const HOOF = 0x3b3532;
  const EYE_DARK = 0x16110e;

  // Anatomical equine barrel: broad rounded croup -> tucked loin -> deep ribcage & brisket
  const equineBarrel = makeAnatomicalLoft(
    [
      { y: -0.58, rx: 0.24, rz: 0.26, cz: 0.02 },
      { y: -0.35, rx: 0.27, rz: 0.30, cz: 0.01 },
      { y: -0.12, rx: 0.24, rz: 0.26, cz: 0.02 },
      { y: 0.16, rx: 0.27, rz: 0.32, cz: -0.02 },
      { y: 0.42, rx: 0.26, rz: 0.31, cz: -0.01 },
      { y: 0.60, rx: 0.19, rz: 0.23, cz: 0.03 },
    ],
    22,
  );
  transformGeo(equineBarrel, 0, 1.19, 0.0, Math.PI / 2, 0, 0);

  // Tapered equine head + cheekbones + tapered muzzle
  const horseHeadGeo = makeAnatomicalLoft(
    [
      { y: -0.22, rx: 0.046, rz: 0.052 },
      { y: -0.12, rx: 0.054, rz: 0.062 },
      { y: 0.02, rx: 0.084, rz: 0.105 },
      { y: 0.14, rx: 0.088, rz: 0.098 },
      { y: 0.21, rx: 0.056, rz: 0.062 },
    ],
    18,
  );
  transformGeo(horseHeadGeo, 0, 1.85, 1.12, 1.18, 0, 0);

  // Flowing mane crest locks along arched neck
  const maneParts: SubMeshPart[] = [];
  for (let m = 0; m < 6; m++) {
    const t = m / 5;
    const my = 1.44 + t * 0.44;
    const mz = 0.64 + t * 0.28;
    const lock = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, my, mz),
      new THREE.Vector3(0.05, my - 0.06, mz - 0.05),
      new THREE.Vector3(0.075, my - 0.14, mz - 0.08),
    ]);
    maneParts.push({
      geometry: colorizeGeometry(new THREE.TubeGeometry(lock, 8, 0.022, 6, false), MANE, 0.07),
      materialIndex: 1,
      weights: [{ boneIndex: bi(t < 0.5 ? 'NeckBase' : 'NeckMid'), weight: 1 }],
    });
  }

  // Flowing multi-strand curved tail
  const tailStrands: SubMeshPart[] = [-1, 0, 1].map((s) => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.32, -0.62),
      new THREE.Vector3(s * 0.03, 1.16, -0.82),
      new THREE.Vector3(s * 0.05, 0.78, -0.92),
    ]);
    return {
      geometry: colorizeGeometry(new THREE.TubeGeometry(c, 12, 0.028 - Math.abs(s) * 0.004, 7, false), MANE, 0.08),
      materialIndex: 1,
      weights: [{ boneIndex: bi('TailTip'), weight: 0.78 }, { boneIndex: bi('TailBase'), weight: 0.22 }],
    };
  });

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(equineBarrel, WHITE_COAT, 0.07),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Chest'), weight: 0.52 }, { boneIndex: bi('Pelvis'), weight: 0.48 }],
    },
    // Embroidered crimson saddle cloth + golden trim
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.305, 0.315, 0.64, 22, 1, false, -Math.PI * 0.44, Math.PI * 0.88), 0, 1.24, -0.05, Math.PI / 2, Math.PI, 0), CRIMSON, 0.08),
      materialIndex: 2,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 0.6 }, { boneIndex: bi('Chest'), weight: 0.4 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.245, 0.026, 10, 26), 0, 1.21, 0.48, 0.48, 0, 0), GOLD),
      materialIndex: 3,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    // Arched equine neck
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.145, 0.21, 0.44, 18, 6), 0, 1.48, 0.68, 0.64, 0, 0), WHITE_COAT),
      materialIndex: 0,
      weights: [{ boneIndex: bi('NeckBase'), weight: 0.65 }, { boneIndex: bi('NeckMid'), weight: 0.35 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.105, 0.145, 0.35, 16, 6), 0, 1.72, 0.86, 0.5, 0, 0), WHITE_COAT),
      materialIndex: 0,
      weights: [{ boneIndex: bi('NeckMid'), weight: 0.7 }, { boneIndex: bi('Head'), weight: 0.3 }],
    },
    // Sculpted Head & Muzzle + Glossy 3D Horse Eyes + Gold Headstall Bridle
    {
      geometry: colorizeGeometry(horseHeadGeo, WHITE_COAT, 0.06),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.058, 14, 10), 0, 1.77, 1.29, 0, 0, 0, 0.9, 0.86, 1.05), MUZZLE),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    // Glossy 3D dark horse eyes on left/right brow ridges
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.021, 12, 10), 0.072, 1.90, 1.08), EYE_DARK),
      materialIndex: 4,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.021, 12, 10), -0.072, 1.90, 1.08), EYE_DARK),
      materialIndex: 4,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.064, 0.011, 8, 18), 0, 1.81, 1.22, 1.18, 0, 0), GOLD),
      materialIndex: 3,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    // Ears
    {
      geometry: colorizeGeometry(transformGeo(new THREE.ConeGeometry(0.026, 0.11, 10), 0.068, 2.02, 0.96, -0.25, 0, -0.15), WHITE_COAT),
      materialIndex: 0,
      weights: [{ boneIndex: bi('EarL'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.ConeGeometry(0.026, 0.11, 10), -0.068, 2.02, 0.96, -0.25, 0, 0.15), WHITE_COAT),
      materialIndex: 0,
      weights: [{ boneIndex: bi('EarR'), weight: 1 }],
    },
    ...maneParts,
    ...tailStrands,
    // Sculpted Legs + Fetlocks + Hooves
    ...[
      { x: 0.17, z: 0.5, upper: 'FrontLeftShoulder', lower: 'FrontLeftKnee' },
      { x: -0.17, z: 0.5, upper: 'FrontRightShoulder', lower: 'FrontRightKnee' },
      { x: 0.18, z: -0.52, upper: 'BackLeftHip', lower: 'BackLeftHock' },
      { x: -0.18, z: -0.52, upper: 'BackRightHip', lower: 'BackRightHock' },
    ].flatMap((leg) => [
      {
        geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.092, 0.054, 0.42, 14, 5), leg.x, 0.84, leg.z), WHITE_COAT, 0.06),
        materialIndex: 0,
        weights: [{ boneIndex: bi(leg.upper), weight: 0.9 }, { boneIndex: bi('BodyRoot'), weight: 0.1 }],
      },
      {
        geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.048, 0.036, 0.4, 14, 5), leg.x, 0.36, leg.z), WHITE_COAT, 0.05),
        materialIndex: 0,
        weights: [{ boneIndex: bi(leg.lower), weight: 1 }],
      },
      // Fetlock joint
      {
        geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.044, 10, 8), leg.x, 0.12, leg.z - 0.01), WHITE_COAT),
        materialIndex: 0,
        weights: [{ boneIndex: bi(leg.lower), weight: 1 }],
      },
      {
        geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.042, 0.054, 0.08, 14), leg.x, 0.04, leg.z), HOOF),
        materialIndex: 3,
        weights: [{ boneIndex: bi(leg.lower), weight: 1 }],
      },
    ]),
  ];

  const scene = assembleSkinnedCharacter('SaindhavaHorseRig', bodyRoot, bones, parts, materials);

  const animations: THREE.AnimationClip[] = [
    makeClip('idle_breathing', 3.4, [
      makeEulerTrack('Chest', [0, 1.7, 3.4], [[-0.015, 0, 0], [0.025, 0, 0], [-0.015, 0, 0]]),
      makeEulerTrack('NeckMid', [0, 1.7, 3.4], [[0, 0, 0], [0.05, 0, 0], [0, 0, 0]]),
      makeEulerTrack('Head', [0, 1.7, 3.4], [[0, 0, 0], [-0.06, 0.04, 0], [0, 0, 0]]),
      makeEulerTrack('TailBase', [0, 1.7, 3.4], [[0, 0, -0.05], [0.08, 0, 0.06], [0, 0, -0.05]]),
    ]),
    makeClip('head_movement', 2.8, [
      makeEulerTrack('NeckMid', [0, 1.4, 2.8], [[-0.04, -0.06, 0], [0.12, 0.08, 0], [-0.04, -0.06, 0]]),
      makeEulerTrack('Head', [0, 1.4, 2.8], [[0.06, -0.08, 0], [-0.14, 0.1, 0], [0.06, -0.08, 0]]),
    ]),
    makeClip('ear_movement', 1.8, [
      makeEulerTrack('EarL', [0, 0.9, 1.8], [[0, 0, 0], [-0.22, 0.18, 0], [0, 0, 0]]),
      makeEulerTrack('EarR', [0, 0.9, 1.8], [[0, 0, 0], [0.16, -0.2, 0], [0, 0, 0]]),
    ]),
    makeClip('tail_movement', 2.4, [
      makeEulerTrack('TailBase', [0, 1.2, 2.4], [[0, 0, -0.12], [0.1, 0, 0.14], [0, 0, -0.12]]),
      makeEulerTrack('TailTip', [0, 1.2, 2.4], [[0.06, 0, -0.16], [-0.08, 0, 0.18], [0.06, 0, -0.16]]),
    ]),
    makeClip('walk', 1.6, [
      makeEulerTrack('FrontLeftShoulder', [0, 0.4, 0.8, 1.2, 1.6], [[0.24, 0, 0], [0, 0, 0], [-0.24, 0, 0], [0, 0, 0], [0.24, 0, 0]]),
      makeEulerTrack('FrontLeftKnee', [0, 0.4, 0.8, 1.2, 1.6], [[0.05, 0, 0], [-0.42, 0, 0], [0.04, 0, 0], [0.08, 0, 0], [0.05, 0, 0]]),
      makeEulerTrack('FrontRightShoulder', [0, 0.4, 0.8, 1.2, 1.6], [[-0.24, 0, 0], [0, 0, 0], [0.24, 0, 0], [0, 0, 0], [-0.24, 0, 0]]),
      makeEulerTrack('FrontRightKnee', [0, 0.4, 0.8, 1.2, 1.6], [[0.04, 0, 0], [0.08, 0, 0], [0.05, 0, 0], [-0.42, 0, 0], [0.04, 0, 0]]),
      makeEulerTrack('BackLeftHip', [0, 0.4, 0.8, 1.2, 1.6], [[-0.22, 0, 0], [0, 0, 0], [0.22, 0, 0], [0, 0, 0], [-0.22, 0, 0]]),
      makeEulerTrack('BackRightHip', [0, 0.4, 0.8, 1.2, 1.6], [[0.22, 0, 0], [0, 0, 0], [-0.22, 0, 0], [0, 0, 0], [0.22, 0, 0]]),
      makeEulerTrack('NeckMid', [0, 0.8, 1.6], [[0.06, 0, 0], [-0.06, 0, 0], [0.06, 0, 0]]),
    ]),
    makeClip('trot', 1.1, [
      makeEulerTrack('FrontLeftShoulder', [0, 0.275, 0.55, 0.825, 1.1], [[0.38, 0, 0], [0, 0, 0], [-0.36, 0, 0], [0, 0, 0], [0.38, 0, 0]]),
      makeEulerTrack('FrontLeftKnee', [0, 0.275, 0.55, 0.825, 1.1], [[0.06, 0, 0], [-0.62, 0, 0], [0.05, 0, 0], [0.1, 0, 0], [0.06, 0, 0]]),
      makeEulerTrack('BackRightHip', [0, 0.275, 0.55, 0.825, 1.1], [[0.36, 0, 0], [0, 0, 0], [-0.34, 0, 0], [0, 0, 0], [0.36, 0, 0]]),
      makeEulerTrack('FrontRightShoulder', [0, 0.275, 0.55, 0.825, 1.1], [[-0.36, 0, 0], [0, 0, 0], [0.38, 0, 0], [0, 0, 0], [-0.36, 0, 0]]),
      makeEulerTrack('FrontRightKnee', [0, 0.275, 0.55, 0.825, 1.1], [[0.05, 0, 0], [0.1, 0, 0], [0.06, 0, 0], [-0.62, 0, 0], [0.05, 0, 0]]),
      makeEulerTrack('BackLeftHip', [0, 0.275, 0.55, 0.825, 1.1], [[-0.34, 0, 0], [0, 0, 0], [0.36, 0, 0], [0, 0, 0], [-0.34, 0, 0]]),
      makeEulerTrack('NeckMid', [0, 0.55, 1.1], [[0.08, 0, 0], [-0.08, 0, 0], [0.08, 0, 0]]),
    ]),
    makeClip('run', 0.8, [
      makeEulerTrack('FrontLeftShoulder', [0, 0.4, 0.8], [[0.55, 0, 0], [-0.52, 0, 0], [0.55, 0, 0]]),
      makeEulerTrack('FrontRightShoulder', [0, 0.4, 0.8], [[0.42, 0, 0], [-0.45, 0, 0], [0.42, 0, 0]]),
      makeEulerTrack('BackLeftHip', [0, 0.4, 0.8], [[-0.5, 0, 0], [0.5, 0, 0], [-0.5, 0, 0]]),
      makeEulerTrack('BackRightHip', [0, 0.4, 0.8], [[-0.4, 0, 0], [0.44, 0, 0], [-0.4, 0, 0]]),
      makeEulerTrack('BodyRoot', [0, 0.4, 0.8], [[-0.08, 0, 0], [0.08, 0, 0], [-0.08, 0, 0]]),
    ]),
    makeClip('harness_movement', 2.6, [
      makeEulerTrack('Chest', [0, 1.3, 2.6], [[0.06, 0, 0], [0.12, 0, 0], [0.06, 0, 0]]),
      makeEulerTrack('NeckBase', [0, 1.3, 2.6], [[0.08, 0, 0], [0.16, 0, 0], [0.08, 0, 0]]),
      makeEulerTrack('Head', [0, 1.3, 2.6], [[-0.08, 0, 0], [-0.14, 0.04, 0], [-0.08, 0, 0]]),
    ]),
    makeClip('coordinated_pull', 1.8, [
      makeEulerTrack('Chest', [0, 0.9, 1.8], [[0.08, 0, 0], [0.14, 0, 0], [0.08, 0, 0]]),
      makeEulerTrack('NeckBase', [0, 0.9, 1.8], [[0.1, 0, 0], [0.16, 0, 0], [0.1, 0, 0]]),
      makeEulerTrack('FrontLeftShoulder', [0, 0.45, 0.9, 1.35, 1.8], [[0.2, 0, 0], [0, 0, 0], [-0.18, 0, 0], [0, 0, 0], [0.2, 0, 0]]),
      makeEulerTrack('FrontRightShoulder', [0, 0.45, 0.9, 1.35, 1.8], [[-0.18, 0, 0], [0, 0, 0], [0.2, 0, 0], [0, 0, 0], [-0.18, 0, 0]]),
      makeEulerTrack('TailBase', [0, 0.9, 1.8], [[0.1, 0, -0.08], [0.15, 0, 0.08], [0.1, 0, -0.08]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  4. KURUKSHETRA COMMANDER / WARRIOR ARCHETYPE GLB                           */
/* -------------------------------------------------------------------------- */

function buildWarriorAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const hips = addBone('Hips', null, 0, 0.92, 0);
  const spine = addBone('Spine', hips, 0, 0.16, 0);
  const chest = addBone('Chest', spine, 0, 0.22, 0);
  addBone('Head', chest, 0, 0.3, 0);
  const lUpper = addBone('LeftUpperArm', chest, 0.22, 0.14, 0);
  addBone('LeftForeArm', lUpper, 0, -0.26, 0);
  const rUpper = addBone('RightUpperArm', chest, -0.22, 0.14, 0);
  addBone('RightForeArm', rUpper, 0, -0.26, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('bronze_armor', { vertexColors: true, roughness: 0.32, metalness: 0.8 }),
    makeNamedMat('cloth_tunic', { vertexColors: true, roughness: 0.6, metalness: 0.06 }),
    makeNamedMat('skin_warrior', { vertexColors: true, roughness: 0.5, metalness: 0.03 }),
  ];

  const shieldProfile = [
    new THREE.Vector2(0.0, 0.055),
    new THREE.Vector2(0.055, 0.048),
    new THREE.Vector2(0.18, 0.025),
    new THREE.Vector2(0.26, 0.0),
    new THREE.Vector2(0.24, -0.015),
    new THREE.Vector2(0.0, -0.01),
  ];

  const parts: SubMeshPart[] = [
    // Pleated skirt & sculpted legs
    {
      geometry: colorizeGeometry(
        makeAnatomicalLoft(
          [
            { y: 0.54, rx: 0.2, rz: 0.17, pleatAmp: 0.012, pleatFreq: 14 },
            { y: 0.74, rx: 0.178, rz: 0.145, pleatAmp: 0.008, pleatFreq: 12 },
            { y: 0.94, rx: 0.155, rz: 0.12 },
          ],
          20,
        ),
        0x6f2321,
        0.09,
      ),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Hips'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.072, 0.05, 0.48, 12, 4), 0.105, 0.28, 0), 0x8f6b3e),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Hips'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.072, 0.05, 0.48, 12, 4), -0.105, 0.28, 0), 0x8f6b3e),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Hips'), weight: 1 }],
    },
    // Anatomical cuirass
    {
      geometry: colorizeGeometry(makeAnatomicalTorso(1.06, 1.02), 0x8f6b3e, 0.1),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Chest'), weight: 0.75 }, { boneIndex: bi('Spine'), weight: 0.25 }],
    },
    // Sculpted Head + Crested Helmet
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.105, 18, 14), 0, 1.62, 0, 0, 0, 0, 0.9, 1.08, 0.96), 0x946144),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    ...buildRoyalCrownParts(bi('Head'), 1.69, 0xc99c49, 0x991e1e, 0, 1, 0.92),
    // Left arm + Domed Shield
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.056, 0.044, 0.42, 12, 4), 0.24, 1.12, 0.02), 0x8f6b3e),
      materialIndex: 0,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 0.6 }, { boneIndex: bi('LeftUpperArm'), weight: 0.4 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.LatheGeometry(shieldProfile, 22), 0.3, 1.0, 0.1, 0, 0, -Math.PI / 2), 0xb8863b, 0.1),
      materialIndex: 0,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 1 }],
    },
    // Right arm + Leaf Spear
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.056, 0.044, 0.42, 12, 4), -0.24, 1.12, 0.02), 0x8f6b3e),
      materialIndex: 0,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 0.6 }, { boneIndex: bi('RightUpperArm'), weight: 0.4 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.015, 0.015, 2.35, 8), -0.27, 1.38, 0.06), 0x5c3e26),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.ConeGeometry(0.036, 0.24, 8), -0.27, 2.66, 0.06, 0, 0, 0, 1.1, 1, 0.45), 0xe2c785),
      materialIndex: 0,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 1 }],
    },
  ];

  const scene = assembleSkinnedCharacter('WarriorCommanderRig', hips, bones, parts, materials);

  const animations: THREE.AnimationClip[] = [
    makeClip('idle_stance', 3.2, [
      makeEulerTrack('Chest', [0, 1.6, 3.2], [[0, 0, 0], [0.03, 0, 0], [0, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 1.6, 3.2], [[-0.25, 0, 0], [-0.3, 0, 0], [-0.25, 0, 0]]),
    ]),
    makeClip('march', 1.6, [
      makeEulerTrack('Chest', [0, 0.8, 1.6], [[0.05, -0.06, 0], [0.05, 0.06, 0], [0.05, -0.06, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 0.8, 1.6], [[0.25, 0, 0], [-0.25, 0, 0], [0.25, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 0.8, 1.6], [[-0.35, 0, 0], [-0.15, 0, 0], [-0.35, 0, 0]]),
    ]),
    makeClip('raise_weapon', 2.2, [
      makeEulerTrack('RightUpperArm', [0, 1.1, 2.2], [[-0.25, 0, 0], [-1.35, 0, -0.15], [-0.25, 0, 0]]),
      makeEulerTrack('Chest', [0, 1.1, 2.2], [[0, 0, 0], [-0.06, 0, 0], [0, 0, 0]]),
    ]),
    makeClip('salute', 2.4, [
      makeEulerTrack('RightUpperArm', [0, 1.2, 2.4], [[-0.2, 0, 0], [-0.85, 0.35, 0], [-0.2, 0, 0]]),
      makeEulerTrack('Head', [0, 1.2, 2.4], [[0, 0, 0], [0.12, 0, 0], [0, 0, 0]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  5. KARNA (RADHEYA · SOLAR KAVACHA + VIJAYA BOW + MORPHS)                  */
/* -------------------------------------------------------------------------- */

function buildKarnaHeroAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const hips = addBone('Hips', null, 0, 0.94, 0);
  const spine = addBone('Spine', hips, 0, 0.16, 0);
  const chest = addBone('Chest', spine, 0, 0.22, 0);
  const neck = addBone('Neck', chest, 0, 0.2, 0);
  const head = addBone('Head', neck, 0, 0.14, 0.01);
  addBone('Jaw', head, 0, -0.05, 0.06);

  const lUpper = addBone('LeftUpperArm', chest, 0.24, 0.14, 0);
  const lFore = addBone('LeftForeArm', lUpper, 0, -0.27, 0);
  const lHand = addBone('LeftHand', lFore, 0, -0.25, 0);
  addBone('BowMount', lHand, 0.02, 0, 0.05);

  const rUpper = addBone('RightUpperArm', chest, -0.24, 0.14, 0);
  const rFore = addBone('RightForeArm', rUpper, 0, -0.27, 0);
  addBone('RightHand', rFore, 0, -0.25, 0);

  const lUpLeg = addBone('LeftUpLeg', hips, 0.115, -0.04, 0);
  addBone('LeftLeg', lUpLeg, 0, -0.45, 0);
  const rUpLeg = addBone('RightUpLeg', hips, -0.115, -0.04, 0);
  addBone('RightLeg', rUpLeg, 0, -0.45, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('skin_karna', { vertexColors: true, roughness: 0.48, metalness: 0.02 }),
    makeNamedMat('gold_kavacha', { vertexColors: true, roughness: 0.18, metalness: 0.92 }),
    makeNamedMat('silk_scarlet', { vertexColors: true, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }),
    makeNamedMat('hair_karna', { vertexColors: true, roughness: 0.64, metalness: 0.04 }),
  ];

  const SKIN = 0xb07b53;
  const SOLAR_GOLD = 0xf4be4b;
  const SCARLET = 0x991e1e;
  const HAIR = 0x161418;

  const vijayaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.28, 1.56, 0.14),
    new THREE.Vector3(0.28, 1.24, 0.25),
    new THREE.Vector3(0.28, 0.86, 0.18),
    new THREE.Vector3(0.28, 0.48, 0.25),
    new THREE.Vector3(0.28, 0.18, 0.14),
  ]);

  const pleatedDhoti = makeAnatomicalLoft(
    [
      { y: 0.54, rx: 0.21, rz: 0.175, pleatAmp: 0.012, pleatFreq: 16 },
      { y: 0.74, rx: 0.188, rz: 0.15, pleatAmp: 0.009, pleatFreq: 14 },
      { y: 0.93, rx: 0.165, rz: 0.122, pleatAmp: 0.005, pleatFreq: 12 },
    ],
    24,
  );

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(pleatedDhoti, SCARLET, 0.1),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 0.85 }, { boneIndex: bi('Spine'), weight: 0.15 }],
    },
    // Divine Surya-Kavacha (Muscled Solar Breastplate)
    {
      geometry: colorizeGeometry(makeAnatomicalTorso(1.12, 1.06), SOLAR_GOLD, 0.11),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 0.8 }, { boneIndex: bi('Spine'), weight: 0.2 }],
    },
    // Surya Chest Suncrest + Shoulder Shields
    {
      geometry: colorizeGeometry(transformGeo(new THREE.OctahedronGeometry(0.056, 1), 0, 1.28, 0.16), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), 0.24, 1.38, 0, 0, 0, -0.35), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), -0.24, 1.38, 0, 0, 0, 0.35), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 1 }],
    },
    // Crimson Commander Mantle
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.22, 0.34, 0.78, 16, 1, true, Math.PI * 0.65, Math.PI * 0.7), 0, 1.05, -0.14), SCARLET, 0.08),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Chest'), weight: 0.7 }, { boneIndex: bi('Hips'), weight: 0.3 }],
    },
    // Neck + Head Accents (Ears, Hair, Surya Kundala Rings, Crown)
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.06, 0.068, 0.11, 16, 4), 0, 1.5, 0), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Neck'), weight: 1 }],
    },
    ...buildHeadAnatomyAccents({
      headBoneIdx: bi('Head'),
      jawBoneIdx: bi('Jaw'),
      headCenterY: 1.635,
      skinHex: SKIN,
      hairHex: HAIR,
      goldHex: SOLAR_GOLD,
      skinMatIdx: 0,
      hairMatIdx: 3,
      goldMatIdx: 1,
      hasKundala: true,
      beardStyle: 'none',
    }),
    ...buildRoyalCrownParts(bi('Head'), 1.715, SOLAR_GOLD, SCARLET, 1, 2, 1.03),
    // Arms & Vijaya Bow
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.062, 0.048, 0.24, 14, 5), 0.25, 1.24, 0), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.052, 0.04, 0.24, 14, 5), 0.27, 0.98, 0.04), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('LeftHand'), 0.275, 0.84, 0.07, SKIN, 0, 1),
    {
      geometry: colorizeGeometry(new THREE.TubeGeometry(vijayaCurve, 28, 0.017, 10, false), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('BowMount'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.062, 0.048, 0.24, 14, 5), -0.25, 1.24, 0), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.052, 0.04, 0.24, 14, 5), -0.27, 0.98, 0.04), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('RightHand'), -0.275, 0.84, 0.07, SKIN, 0, -1),
    // Legs + Royal Feet
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.092, 0.072, 0.43, 14, 5), 0.115, 0.65, 0), SCARLET),
      materialIndex: 2,
      weights: [{ boneIndex: bi('LeftUpLeg'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.068, 0.048, 0.39, 14, 5), 0.115, 0.27, 0), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('LeftLeg'), 0.115, 0, SKIN, SOLAR_GOLD, 0, 1),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.092, 0.072, 0.43, 14, 5), -0.115, 0.65, 0), SCARLET),
      materialIndex: 2,
      weights: [{ boneIndex: bi('RightUpLeg'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.068, 0.048, 0.39, 14, 5), -0.115, 0.27, 0), SOLAR_GOLD),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('RightLeg'), -0.115, 0, SKIN, SOLAR_GOLD, 0, 1),
  ];

  const scene = assembleSkinnedCharacter('KarnaHeroRig', hips, bones, parts, materials);

  const faceAssembly = buildSculptedFaceAssembly({
    name: 'KarnaFacialMorphMesh',
    skinHex: SKIN,
    lipHex: 0x7e463a,
    browHex: HAIR,
    eyeIrisHex: 0x1a120d,
    tildeMarkHex: 0xf4be4b,
  });
  faceAssembly.position.set(0, -0.01, 0.005);
  head.add(faceAssembly);

  const animations: THREE.AnimationClip[] = [
    makeClip('idle_duel', 3.2, [
      makeEulerTrack('Chest', [0, 1.6, 3.2], [[0, -0.12, 0], [0.04, -0.1, 0], [0, -0.12, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.6, 3.2], [[-0.95, 0.08, 0.16], [-1.02, 0.08, 0.16], [-0.95, 0.08, 0.16]]),
    ]),
    makeClip('draw_vijaya', 2.4, [
      makeEulerTrack('Spine', [0, 0.9, 1.7, 2.4], [[0, -0.18, 0], [0, -0.24, 0], [0, -0.18, 0], [0, -0.18, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 0.9, 1.7, 2.4], [[-1.25, 0.06, 0.14], [-1.32, 0.04, 0.12], [-1.28, 0.06, 0.14], [-1.25, 0.06, 0.14]]),
      makeEulerTrack('RightUpperArm', [0, 0.9, 1.7, 2.4], [[-1.1, -0.15, -0.35], [-1.24, -0.45, -0.75], [-1.14, -0.22, -0.45], [-1.1, -0.15, -0.35]]),
    ]),
    makeClip('wheel_strain', 2.6, [
      makeEulerTrack('Spine', [0, 1.3, 2.6], [[0.45, 0, 0], [0.58, 0.06, 0], [0.45, 0, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.3, 2.6], [[-0.92, 0.15, 0.1], [-1.04, 0.18, 0.12], [-0.92, 0.15, 0.1]]),
      makeEulerTrack('RightUpperArm', [0, 1.3, 2.6], [[-0.92, -0.15, -0.1], [-1.04, -0.18, -0.12], [-0.92, -0.15, -0.1]]),
    ]),
    makeClip('salute', 2.4, [
      makeEulerTrack('RightUpperArm', [0, 1.2, 2.4], [[-0.2, 0, 0], [-0.88, 0.3, 0], [-0.2, 0, 0]]),
      makeEulerTrack('Head', [0, 1.2, 2.4], [[0, 0, 0], [0.1, 0, 0], [0, 0, 0]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  6. PITAMAHA BHISHMA & PRECEPTOR ELDER HERO RIG + MORPHS                   */
/* -------------------------------------------------------------------------- */

function buildBhishmaDronaHeroAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const hips = addBone('Hips', null, 0, 0.94, 0);
  const spine = addBone('Spine', hips, 0, 0.16, 0);
  const chest = addBone('Chest', spine, 0, 0.22, 0);
  const neck = addBone('Neck', chest, 0, 0.2, 0);
  const head = addBone('Head', neck, 0, 0.14, 0.01);
  addBone('Jaw', head, 0, -0.05, 0.06);

  const lUpper = addBone('LeftUpperArm', chest, 0.24, 0.14, 0);
  const lFore = addBone('LeftForeArm', lUpper, 0, -0.27, 0);
  addBone('LeftHand', lFore, 0, -0.25, 0);

  const rUpper = addBone('RightUpperArm', chest, -0.24, 0.14, 0);
  const rFore = addBone('RightForeArm', rUpper, 0, -0.27, 0);
  addBone('RightHand', rFore, 0, -0.25, 0);

  const lUpLeg = addBone('LeftUpLeg', hips, 0.115, -0.04, 0);
  addBone('LeftLeg', lUpLeg, 0, -0.45, 0);
  const rUpLeg = addBone('RightUpLeg', hips, -0.115, -0.04, 0);
  addBone('RightLeg', rUpLeg, 0, -0.45, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('skin_elder', { vertexColors: true, roughness: 0.52, metalness: 0.02 }),
    makeNamedMat('silver_armor', { vertexColors: true, roughness: 0.25, metalness: 0.86 }),
    makeNamedMat('silk_white', { vertexColors: true, roughness: 0.54, metalness: 0.06, side: THREE.DoubleSide }),
    makeNamedMat('hair_silver', { vertexColors: true, roughness: 0.6, metalness: 0.04 }),
  ];

  const SKIN = 0xc9a58c;
  const SILVER_STEEL = 0xdbe0ea;
  const WHITE_SILK = 0xf5f3ee;
  const WHITE_BEARD = 0xe9eaee;

  const elderBowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.28, 1.54, 0.14),
    new THREE.Vector3(0.28, 1.2, 0.24),
    new THREE.Vector3(0.28, 0.84, 0.16),
    new THREE.Vector3(0.28, 0.48, 0.24),
    new THREE.Vector3(0.28, 0.18, 0.14),
  ]);

  const pleatedDhoti = makeAnatomicalLoft(
    [
      { y: 0.54, rx: 0.205, rz: 0.17, pleatAmp: 0.012, pleatFreq: 16 },
      { y: 0.74, rx: 0.185, rz: 0.148, pleatAmp: 0.008, pleatFreq: 14 },
      { y: 0.93, rx: 0.162, rz: 0.12 },
    ],
    24,
  );

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(pleatedDhoti, WHITE_SILK, 0.08),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 0.85 }, { boneIndex: bi('Spine'), weight: 0.15 }],
    },
    {
      geometry: colorizeGeometry(makeAnatomicalTorso(1.06, 1.02), SILVER_STEEL, 0.09),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 0.8 }, { boneIndex: bi('Spine'), weight: 0.2 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.06, 0.068, 0.11, 14, 4), 0, 1.5, 0), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Neck'), weight: 1 }],
    },
    ...buildHeadAnatomyAccents({
      headBoneIdx: bi('Head'),
      jawBoneIdx: bi('Jaw'),
      headCenterY: 1.635,
      skinHex: SKIN,
      hairHex: WHITE_BEARD,
      goldHex: SILVER_STEEL,
      skinMatIdx: 0,
      hairMatIdx: 3,
      goldMatIdx: 1,
      hasKundala: false,
      beardStyle: 'elder-long',
    }),
    ...buildRoyalCrownParts(bi('Head'), 1.715, SILVER_STEEL, WHITE_SILK, 1, 2, 0.98),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.056, 0.045, 0.24, 14, 5), 0.25, 1.24, 0), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.048, 0.038, 0.24, 14, 5), 0.27, 0.98, 0.04), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('LeftHand'), 0.275, 0.84, 0.07, SKIN, 0, 1),
    {
      geometry: colorizeGeometry(new THREE.TubeGeometry(elderBowCurve, 26, 0.015, 8, false), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftHand'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.056, 0.045, 0.24, 14, 5), -0.25, 1.24, 0), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.048, 0.038, 0.24, 14, 5), -0.27, 0.98, 0.04), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('RightHand'), -0.275, 0.84, 0.07, SKIN, 0, -1),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.092, 0.072, 0.43, 14, 5), 0.115, 0.65, 0), WHITE_SILK),
      materialIndex: 2,
      weights: [{ boneIndex: bi('LeftUpLeg'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.068, 0.048, 0.39, 14, 5), 0.115, 0.27, 0), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('LeftLeg'), 0.115, 0, SKIN, SILVER_STEEL, 0, 1),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.092, 0.072, 0.43, 14, 5), -0.115, 0.65, 0), WHITE_SILK),
      materialIndex: 2,
      weights: [{ boneIndex: bi('RightUpLeg'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.068, 0.048, 0.39, 14, 5), -0.115, 0.27, 0), SILVER_STEEL),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('RightLeg'), -0.115, 0, SKIN, SILVER_STEEL, 0, 1),
  ];

  const scene = assembleSkinnedCharacter('BhishmaDronaRig', hips, bones, parts, materials);

  const faceAssembly = buildSculptedFaceAssembly({
    name: 'BhishmaFacialMorphMesh',
    skinHex: SKIN,
    lipHex: 0x8f5b52,
    browHex: WHITE_BEARD,
    eyeIrisHex: 0x2a2320,
    tildeMarkHex: 0xf4f2ed,
    hasBeard: true,
    beardHex: WHITE_BEARD,
  });
  faceAssembly.position.set(0, -0.01, 0.005);
  head.add(faceAssembly);

  const animations: THREE.AnimationClip[] = [
    makeClip('command_stance', 3.4, [
      makeEulerTrack('Chest', [0, 1.7, 3.4], [[0, 0, 0], [0.03, 0, 0], [0, 0, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.7, 3.4], [[-0.6, 0, 0.1], [-0.65, 0, 0.1], [-0.6, 0, 0.1]]),
    ]),
    makeClip('draw_bow', 2.4, [
      makeEulerTrack('LeftUpperArm', [0, 1.2, 2.4], [[-1.18, 0.08, 0.15], [-1.28, 0.08, 0.15], [-1.18, 0.08, 0.15]]),
      makeEulerTrack('RightUpperArm', [0, 1.2, 2.4], [[-1.08, -0.25, -0.45], [-1.22, -0.42, -0.72], [-1.08, -0.25, -0.45]]),
    ]),
    makeClip('arrow_bed_repose', 3.6, [
      makeEulerTrack('Hips', [0, 1.8, 3.6], [[-1.32, 0, 0], [-1.32, 0, 0], [-1.32, 0, 0]]),
      makeEulerTrack('Spine', [0, 1.8, 3.6], [[-0.12, 0, 0], [-0.1, 0, 0], [-0.12, 0, 0]]),
      makeEulerTrack('Head', [0, 1.8, 3.6], [[0.18, 0, 0], [0.22, 0.04, 0], [0.18, 0, 0]]),
      makeEulerTrack('LeftUpperArm', [0, 1.8, 3.6], [[0.15, 0, -0.2], [0.15, 0, -0.2], [0.15, 0, -0.2]]),
      makeEulerTrack('RightUpperArm', [0, 1.8, 3.6], [[0.15, 0, 0.2], [0.15, 0, 0.2], [0.15, 0, 0.2]]),
    ]),
    makeClip('bless', 2.6, [
      makeEulerTrack('RightUpperArm', [0, 1.3, 2.6], [[-0.85, 0.1, 0.25], [-0.95, 0.12, 0.28], [-0.85, 0.1, 0.25]]),
      makeEulerTrack('RightForeArm', [0, 1.3, 2.6], [[-0.65, 0, 0], [-0.55, 0, 0], [-0.65, 0, 0]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  7. HEAVY GADA (MACE) DUELIST RIG — BHIMA & DURYODHANA + MORPHS            */
/* -------------------------------------------------------------------------- */

function buildMaceDuelistAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const hips = addBone('Hips', null, 0, 0.94, 0);
  const spine = addBone('Spine', hips, 0, 0.16, 0);
  const chest = addBone('Chest', spine, 0, 0.24, 0);
  const neck = addBone('Neck', chest, 0, 0.2, 0);
  const head = addBone('Head', neck, 0, 0.14, 0.01);
  addBone('Jaw', head, 0, -0.05, 0.06);

  const lUpper = addBone('LeftUpperArm', chest, 0.27, 0.14, 0);
  addBone('LeftForeArm', lUpper, 0, -0.28, 0);

  const rUpper = addBone('RightUpperArm', chest, -0.27, 0.14, 0);
  const rFore = addBone('RightForeArm', rUpper, 0, -0.28, 0);
  addBone('GadaMount', rFore, 0, -0.25, 0.04);

  const lUpLeg = addBone('LeftUpLeg', hips, 0.13, -0.04, 0);
  addBone('LeftLeg', lUpLeg, 0, -0.45, 0);
  const rUpLeg = addBone('RightUpLeg', hips, -0.13, -0.04, 0);
  addBone('RightLeg', rUpLeg, 0, -0.45, 0);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('skin_heavy', { vertexColors: true, roughness: 0.49, metalness: 0.02 }),
    makeNamedMat('bronze_gada', { vertexColors: true, roughness: 0.24, metalness: 0.88 }),
    makeNamedMat('silk_sash', { vertexColors: true, roughness: 0.52, metalness: 0.08, side: THREE.DoubleSide }),
    makeNamedMat('hair_warrior', { vertexColors: true, roughness: 0.64, metalness: 0.04 }),
  ];

  const SKIN = 0xa06b4c;
  const BRONZE = 0xce9a44;
  const SASH = 0xa33228;
  const HAIR = 0x16141a;

  const flutedGadaHead = makeAnatomicalLoft(
    [
      { y: -0.15, rx: 0.04, rz: 0.04 },
      { y: -0.08, rx: 0.11, rz: 0.11, pleatAmp: 0.016, pleatFreq: 12 },
      { y: 0.02, rx: 0.15, rz: 0.15, pleatAmp: 0.02, pleatFreq: 12 },
      { y: 0.11, rx: 0.11, rz: 0.11, pleatAmp: 0.014, pleatFreq: 12 },
      { y: 0.18, rx: 0.032, rz: 0.032 },
      { y: 0.23, rx: 0.008, rz: 0.008 },
    ],
    24,
  );
  transformGeo(flutedGadaHead, -0.31, 1.24, 0.88, Math.PI * 0.42, 0, 0);

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(
        makeAnatomicalLoft(
          [
            { y: 0.54, rx: 0.23, rz: 0.195, pleatAmp: 0.012, pleatFreq: 16 },
            { y: 0.74, rx: 0.205, rz: 0.17, pleatAmp: 0.008, pleatFreq: 14 },
            { y: 0.94, rx: 0.185, rz: 0.145 },
          ],
          22,
        ),
        SASH,
        0.09,
      ),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Hips'), weight: 0.85 }, { boneIndex: bi('Spine'), weight: 0.15 }],
    },
    {
      geometry: colorizeGeometry(makeAnatomicalTorso(1.22, 1.15), BRONZE, 0.1),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Chest'), weight: 0.8 }, { boneIndex: bi('Spine'), weight: 0.2 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.066, 0.076, 0.11, 14, 4), 0, 1.52, 0), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Neck'), weight: 1 }],
    },
    ...buildHeadAnatomyAccents({
      headBoneIdx: bi('Head'),
      jawBoneIdx: bi('Jaw'),
      headCenterY: 1.65,
      skinHex: SKIN,
      hairHex: HAIR,
      goldHex: BRONZE,
      skinMatIdx: 0,
      hairMatIdx: 3,
      goldMatIdx: 1,
      hasKundala: true,
      beardStyle: 'royal-trim',
    }),
    ...buildRoyalCrownParts(bi('Head'), 1.73, BRONZE, SASH, 1, 2, 1.06),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.074, 0.056, 0.25, 14, 5), 0.28, 1.26, 0), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('LeftUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.058, 0.044, 0.25, 14, 5), 0.3, 0.99, 0.04), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('LeftForeArm'), 0.305, 0.85, 0.07, SKIN, 0, 1),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.074, 0.056, 0.25, 14, 5), -0.28, 1.26, 0), SKIN),
      materialIndex: 0,
      weights: [{ boneIndex: bi('RightUpperArm'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.058, 0.044, 0.25, 14, 5), -0.3, 0.99, 0.04), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightForeArm'), weight: 1 }],
    },
    ...buildArticulatedHandParts(bi('RightForeArm'), -0.305, 0.85, 0.07, SKIN, 0, -1),
    // Fluted Royal Gada War Mace
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.022, 0.026, 1.15, 12), -0.31, 1.05, 0.34, Math.PI * 0.42, 0, 0), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('GadaMount'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(flutedGadaHead, BRONZE, 0.13),
      materialIndex: 1,
      weights: [{ boneIndex: bi('GadaMount'), weight: 1 }],
    },
    // Heavy Legs & Feet
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.112, 0.084, 0.43, 14, 5), 0.13, 0.65, 0), SASH),
      materialIndex: 2,
      weights: [{ boneIndex: bi('LeftUpLeg'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.078, 0.055, 0.39, 14, 5), 0.13, 0.27, 0), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('LeftLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('LeftLeg'), 0.13, 0, SKIN, BRONZE, 0, 1),
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.112, 0.084, 0.43, 14, 5), -0.13, 0.65, 0), SASH),
      materialIndex: 2,
      weights: [{ boneIndex: bi('RightUpLeg'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.078, 0.055, 0.39, 14, 5), -0.13, 0.27, 0), BRONZE),
      materialIndex: 1,
      weights: [{ boneIndex: bi('RightLeg'), weight: 1 }],
    },
    ...buildSculptedFootParts(bi('RightLeg'), -0.13, 0, SKIN, BRONZE, 0, 1),
  ];

  const scene = assembleSkinnedCharacter('MaceDuelistRig', hips, bones, parts, materials);

  const faceAssembly = buildSculptedFaceAssembly({
    name: 'MaceDuelistFacialMorphMesh',
    skinHex: SKIN,
    lipHex: 0x764236,
    browHex: HAIR,
    eyeIrisHex: 0x1a120d,
    tildeMarkHex: 0xc99642,
    hasBeard: true,
    beardHex: HAIR,
  });
  faceAssembly.position.set(0, -0.01, 0.005);
  head.add(faceAssembly);

  const animations: THREE.AnimationClip[] = [
    makeClip('gada_guard', 2.6, [
      makeEulerTrack('LeftUpLeg', [0, 1.3, 2.6], [[-0.22, 0, 0.1], [-0.26, 0, 0.1], [-0.22, 0, 0.1]]),
      makeEulerTrack('RightUpLeg', [0, 1.3, 2.6], [[0.24, 0, -0.1], [0.28, 0, -0.1], [0.24, 0, -0.1]]),
      makeEulerTrack('RightUpperArm', [0, 1.3, 2.6], [[-0.95, 0.25, -0.25], [-1.05, 0.3, -0.25], [-0.95, 0.25, -0.25]]),
    ]),
    makeClip('gada_swing_overhead', 2.0, [
      makeEulerTrack('Spine', [0, 0.7, 1.4, 2.0], [[0, -0.2, 0], [-0.12, -0.3, 0], [0.24, 0.35, 0], [0, -0.2, 0]]),
      makeEulerTrack('RightUpperArm', [0, 0.7, 1.4, 2.0], [[-1.0, 0.1, -0.2], [-2.5, -0.2, -0.35], [-0.45, 0.45, 0.2], [-1.0, 0.1, -0.2]]),
    ]),
    makeClip('gada_clash', 1.8, [
      makeEulerTrack('Spine', [0, 0.6, 1.2, 1.8], [[0.1, 0, 0], [0.22, 0.18, 0], [-0.08, -0.1, 0], [0.1, 0, 0]]),
      makeEulerTrack('RightUpperArm', [0, 0.6, 1.2, 1.8], [[-1.15, 0.2, -0.25], [-1.55, 0.4, -0.1], [-0.85, 0.15, -0.3], [-1.15, 0.2, -0.25]]),
      makeEulerTrack('LeftUpperArm', [0, 0.6, 1.2, 1.8], [[-0.9, 0.3, 0.2], [-1.1, 0.5, 0.3], [-0.8, 0.25, 0.2], [-0.9, 0.3, 0.2]]),
    ]),
    makeClip('kneel_strike', 2.4, [
      makeEulerTrack('LeftUpLeg', [0, 1.2, 2.4], [[-0.65, 0, 0], [-0.95, 0, 0], [-0.65, 0, 0]]),
      makeEulerTrack('LeftLeg', [0, 1.2, 2.4], [[1.1, 0, 0], [1.45, 0, 0], [1.1, 0, 0]]),
      makeEulerTrack('Spine', [0, 1.2, 2.4], [[0.25, 0, 0], [0.38, 0, 0], [0.25, 0, 0]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  8. GAJENDRA ARMORED WAR ELEPHANT RIG GLB                                  */
/* -------------------------------------------------------------------------- */

function buildWarElephantAsset(): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const boneMap = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const addBone = (name: string, parent: THREE.Bone | null, x: number, y: number, z: number) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    boneMap.set(name, b);
    bones.push(b);
    return b;
  };

  const bodyRoot = addBone('BodyRoot', null, 0, 1.9, 0);
  const neck = addBone('Neck', bodyRoot, 0, 0.22, 1.05);
  const head = addBone('Head', neck, 0, 0.15, 0.55);
  const trunkBase = addBone('TrunkBase', head, 0, -0.18, 0.45);
  addBone('TrunkTip', trunkBase, 0, -0.65, 0.12);
  addBone('EarL', head, 0.48, 0.08, -0.12);
  addBone('EarR', head, -0.48, 0.08, -0.12);

  addBone('FrontLeftLeg', bodyRoot, 0.46, -0.35, 0.72);
  addBone('FrontRightLeg', bodyRoot, -0.46, -0.35, 0.72);
  addBone('BackLeftLeg', bodyRoot, 0.46, -0.35, -0.78);
  addBone('BackRightLeg', bodyRoot, -0.46, -0.35, -0.78);

  const bi = (n: string) => bones.indexOf(boneMap.get(n)!);

  const materials = [
    makeNamedMat('elephant_hide', { vertexColors: true, roughness: 0.82, metalness: 0.02 }),
    makeNamedMat('silk_caparison', { vertexColors: true, roughness: 0.54, metalness: 0.1, side: THREE.DoubleSide }),
    makeNamedMat('gold_howdah', { vertexColors: true, roughness: 0.24, metalness: 0.88 }),
    makeNamedMat('eye_cornea', { vertexColors: true, roughness: 0.05, metalness: 0.04 }),
  ];

  const HIDE = 0x5c5b61;
  const CAPARISON = 0x8f1f21;
  const GOLD = 0xdfb152;
  const IVORY = 0xf4eee0;
  const EYE_DARK = 0x16110e;

  // Anatomical Elephant Torso Loft
  const elephantTorso = makeAnatomicalLoft(
    [
      { y: -1.02, rx: 0.64, rz: 0.72 },
      { y: -0.45, rx: 0.82, rz: 0.90 },
      { y: 0.15, rx: 0.86, rz: 0.96 },
      { y: 0.68, rx: 0.80, rz: 0.88 },
      { y: 1.02, rx: 0.60, rz: 0.68 },
    ],
    22,
  );
  transformGeo(elephantTorso, 0, 1.96, 0, Math.PI / 2, 0, 0);

  // Curved Sculpted Broad Ear Silhouette (ExtrudeGeometry with Bevel)
  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0.34);
  earShape.bezierCurveTo(0.28, 0.38, 0.52, 0.14, 0.48, -0.22);
  earShape.bezierCurveTo(0.42, -0.44, 0.15, -0.52, 0, -0.38);
  earShape.lineTo(0, 0.34);
  const earGeoL = new THREE.ExtrudeGeometry(earShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  const earGeoR = earGeoL.clone();

  // Curved Ivory Tusk Geometry
  const makeTusk = (side: 1 | -1) => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.24, 2.02, 1.98),
      new THREE.Vector3(side * 0.3, 1.84, 2.38),
      new THREE.Vector3(side * 0.26, 1.98, 2.74),
      new THREE.Vector3(side * 0.22, 2.18, 2.9),
    ]);
    return new THREE.TubeGeometry(c, 18, 0.045, 10, false);
  };

  // Ornate 4-pillar Gold Howdah
  const howdahParts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(transformGeo(new THREE.BoxGeometry(1.02, 0.28, 1.02), 0, 2.86, 0.05), GOLD, 0.1),
      materialIndex: 2,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.BoxGeometry(0.96, 0.22, 0.96), 0, 3.06, 0.05), CAPARISON, 0.08),
      materialIndex: 1,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 1 }],
    },
    ...[
      [-0.44, -0.38],
      [0.44, -0.38],
      [-0.44, 0.48],
      [0.44, 0.48],
    ].map(([px, pz]) => ({
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.62, 10), px, 3.42, pz), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 1 }],
    })),
    {
      geometry: colorizeGeometry(transformGeo(new THREE.ConeGeometry(0.68, 0.28, 4), 0, 3.84, 0.05, 0, Math.PI / 4, 0), GOLD, 0.1),
      materialIndex: 2,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 1 }],
    },
  ];

  const parts: SubMeshPart[] = [
    {
      geometry: colorizeGeometry(elephantTorso, HIDE, 0.08),
      materialIndex: 0,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.92, 0.96, 1.42, 20, 1, false, -Math.PI * 0.48, Math.PI * 0.96), 0, 2.05, 0, Math.PI / 2, Math.PI, 0), CAPARISON, 0.08),
      materialIndex: 1,
      weights: [{ boneIndex: bi('BodyRoot'), weight: 1 }],
    },
    ...howdahParts,
    // Domed Skull with twin Kumbha bosses + Golden Mukhapatti Forehead Armour
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.56, 18, 14), 0, 2.28, 1.55), HIDE, 0.07),
      materialIndex: 0,
      weights: [{ boneIndex: bi('Head'), weight: 0.8 }, { boneIndex: bi('Neck'), weight: 0.2 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.32, 0.26, 0.08, 16), 0, 2.48, 2.02, Math.PI / 2, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    // Glossy 3D Elephant Eyes
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.042, 12, 10), 0.36, 2.24, 1.88), EYE_DARK),
      materialIndex: 3,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.SphereGeometry(0.042, 12, 10), -0.36, 2.24, 1.88), EYE_DARK),
      materialIndex: 3,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    // Beveled Anatomical Ears
    {
      geometry: colorizeGeometry(transformGeo(earGeoL, 0.48, 2.28, 1.4, 0, -0.42, 0), HIDE, 0.07),
      materialIndex: 0,
      weights: [{ boneIndex: bi('EarL'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(earGeoR, -0.48, 2.28, 1.4, 0, Math.PI + 0.42, 0), HIDE, 0.07),
      materialIndex: 0,
      weights: [{ boneIndex: bi('EarR'), weight: 1 }],
    },
    // Articulated Muscular Trunk
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.165, 0.11, 0.68, 14, 6), 0, 1.75, 2.02, -0.18, 0, 0), HIDE, 0.08),
      materialIndex: 0,
      weights: [{ boneIndex: bi('TrunkBase'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(makeCapsulePart(0.1, 0.055, 0.58, 12, 6), 0, 1.15, 2.16, 0.25, 0, 0), HIDE, 0.08),
      materialIndex: 0,
      weights: [{ boneIndex: bi('TrunkTip'), weight: 1 }],
    },
    // Curved Ivory Tusks + Gold War Bands
    {
      geometry: colorizeGeometry(makeTusk(1), IVORY, 0.05),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(makeTusk(-1), IVORY, 0.05),
      materialIndex: 1,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.056, 0.015, 8, 16), 0.28, 1.91, 2.48, 0.35, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    {
      geometry: colorizeGeometry(transformGeo(new THREE.TorusGeometry(0.056, 0.015, 8, 16), -0.28, 1.91, 2.48, 0.35, 0, 0), GOLD),
      materialIndex: 2,
      weights: [{ boneIndex: bi('Head'), weight: 1 }],
    },
    // 4 Pillar Legs with Padded Feet
    ...[
      { x: 0.46, z: 0.72, b: 'FrontLeftLeg' },
      { x: -0.46, z: 0.72, b: 'FrontRightLeg' },
      { x: 0.46, z: -0.78, b: 'BackLeftLeg' },
      { x: -0.46, z: -0.78, b: 'BackRightLeg' },
    ].flatMap((leg) => [
      {
        geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.25, 0.22, 1.4, 14), leg.x, 0.78, leg.z), HIDE, 0.07),
        materialIndex: 0,
        weights: [{ boneIndex: bi(leg.b), weight: 1 }],
      },
      {
        geometry: colorizeGeometry(transformGeo(new THREE.CylinderGeometry(0.24, 0.27, 0.14, 14), leg.x, 0.07, leg.z), HIDE, 0.05),
        materialIndex: 0,
        weights: [{ boneIndex: bi(leg.b), weight: 1 }],
      },
    ]),
  ];

  const scene = assembleSkinnedCharacter('WarElephantRig', bodyRoot, bones, parts, materials);

  const animations: THREE.AnimationClip[] = [
    makeClip('idle_sway', 3.6, [
      makeEulerTrack('BodyRoot', [0, 1.8, 3.6], [[0, 0, -0.02], [0, 0, 0.02], [0, 0, -0.02]]),
      makeEulerTrack('TrunkBase', [0, 1.8, 3.6], [[0.08, 0, -0.08], [0.16, 0, 0.08], [0.08, 0, -0.08]]),
      makeEulerTrack('EarL', [0, 1.8, 3.6], [[0, 0, 0], [0, -0.18, 0], [0, 0, 0]]),
      makeEulerTrack('EarR', [0, 1.8, 3.6], [[0, 0, 0], [0, 0.18, 0], [0, 0, 0]]),
    ]),
    makeClip('march_charge', 1.8, [
      makeEulerTrack('FrontLeftLeg', [0, 0.9, 1.8], [[0.24, 0, 0], [-0.24, 0, 0], [0.24, 0, 0]]),
      makeEulerTrack('BackRightLeg', [0, 0.9, 1.8], [[0.22, 0, 0], [-0.22, 0, 0], [0.22, 0, 0]]),
      makeEulerTrack('FrontRightLeg', [0, 0.9, 1.8], [[-0.24, 0, 0], [0.24, 0, 0], [-0.24, 0, 0]]),
      makeEulerTrack('BackLeftLeg', [0, 0.9, 1.8], [[-0.22, 0, 0], [0.22, 0, 0], [-0.22, 0, 0]]),
      makeEulerTrack('TrunkBase', [0, 0.9, 1.8], [[0.25, 0, 0], [0.55, 0, 0], [0.25, 0, 0]]),
    ]),
    makeClip('trumpet_rear', 2.4, [
      makeEulerTrack('Head', [0, 1.2, 2.4], [[-0.1, 0, 0], [-0.38, 0, 0], [-0.1, 0, 0]]),
      makeEulerTrack('TrunkBase', [0, 1.2, 2.4], [[0.1, 0, 0], [-1.05, 0, 0], [0.1, 0, 0]]),
      makeEulerTrack('TrunkTip', [0, 1.2, 2.4], [[0, 0, 0], [-0.65, 0, 0], [0, 0, 0]]),
    ]),
  ];

  return { scene, animations };
}

/* -------------------------------------------------------------------------- */
/*  EXPORT & VERIFY ALL BINARY .GLB FILES                                     */
/* -------------------------------------------------------------------------- */

async function exportGlbFile(
  filePath: string,
  scene: THREE.Group,
  animations: THREE.AnimationClip[],
): Promise<number> {
  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(scene, {
    binary: true,
    animations,
  });

  if (!(glbBuffer instanceof ArrayBuffer)) {
    throw new Error(`Expected ArrayBuffer binary GLB for ${filePath}`);
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const nodeBuf = Buffer.from(glbBuffer);
  await fs.writeFile(filePath, nodeBuf);
  return nodeBuf.byteLength;
}

async function main() {
  const cwd = process.cwd();
  const gltfLoader = new GLTFLoader();

  const builders: Array<{
    key: keyof typeof CHARACTER_ASSET_MANIFEST;
    build: () => { scene: THREE.Group; animations: THREE.AnimationClip[] };
  }> = [
    { key: 'krishna', build: buildKrishnaAsset },
    { key: 'arjuna', build: buildArjunaAsset },
    { key: 'white_horses', build: buildWhiteHorsesAsset },
    { key: 'warrior_archetype', build: buildWarriorAsset },
    { key: 'karna_hero', build: buildKarnaHeroAsset },
    { key: 'bhishma_drona_hero', build: buildBhishmaDronaHeroAsset },
    { key: 'mace_duelists', build: buildMaceDuelistAsset },
    { key: 'war_elephant', build: buildWarElephantAsset },
  ];

  for (const item of builders) {
    const entry = CHARACTER_ASSET_MANIFEST[item.key];
    const outPath = path.join(cwd, 'public', entry.filePath.replace(/^\/+/, ''));
    const { scene, animations } = item.build();
    const bytes = await exportGlbFile(outPath, scene, animations);

    const raw = await fs.readFile(outPath);
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const loaded = await gltfLoader.parseAsync(ab, '');
    const inspection = inspectLoadedGltf(loaded);
    const validation = validateLoadedCharacterAsset(entry, inspection);

    if (validation.status !== 'valid') {
      throw new Error(
        `Validation failed for ${item.key}: missingBones=[${validation.missingBones.join(',')}] missingMorphs=[${validation.missingMorphTargets.join(',')}] missingClips=[${validation.missingClips.join(',')}]`,
      );
    }

    console.log(
      `Generated & Verified ${entry.filePath} (${bytes.toLocaleString()} bytes, ${inspection.triangleCount} tris, ${inspection.boneNames.length} bones, ${inspection.morphTargetNames.length} morphTargets, ${inspection.clipNames.length} clips)`,
    );
  }
}

main().catch((err) => {
  console.error('Failed to generate Story GLB assets:', err);
  process.exit(1);
});
