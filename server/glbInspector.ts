import fs from 'node:fs';
import path from 'node:path';

export interface GlbBinaryInspection {
  id: string;
  filePath: string;
  exists: boolean;
  validGlb: boolean;
  byteLength: number;
  gltfVersion: number | null;
  meshesCount: number;
  primitivesCount: number;
  skinsCount: number;
  jointsCount: number;
  morphTargetCount: number;
  morphTargetNames: string[];
  animationCount: number;
  animationNames: string[];
  materialsCount: number;
}

const CHARACTER_GLB_PATHS: ReadonlyArray<{ id: string; publicPath: string }> = [
  { id: 'krishna', publicPath: '/assets/story/characters/krishna/krishna.glb' },
  { id: 'arjuna', publicPath: '/assets/story/characters/arjuna/arjuna.glb' },
  { id: 'white_horses', publicPath: '/assets/story/characters/horses/white_horses.glb' },
  { id: 'warrior_archetype', publicPath: '/assets/story/characters/warriors/warrior_archetype.glb' },
  { id: 'karna_hero', publicPath: '/assets/story/characters/warriors/karna_hero.glb' },
  { id: 'bhishma_drona_hero', publicPath: '/assets/story/characters/warriors/bhishma_drona_hero.glb' },
  { id: 'mace_duelists', publicPath: '/assets/story/characters/warriors/mace_duelists.glb' },
  { id: 'war_elephant', publicPath: '/assets/story/characters/warriors/war_elephant.glb' },
];

export function inspectSingleGlbFile(
  id: string,
  publicPath: string,
  rootDir: string,
): GlbBinaryInspection {
  const diskPath = path.join(rootDir, 'public', publicPath.replace(/^\//, ''));
  if (!fs.existsSync(diskPath)) {
    return {
      id,
      filePath: publicPath,
      exists: false,
      validGlb: false,
      byteLength: 0,
      gltfVersion: null,
      meshesCount: 0,
      primitivesCount: 0,
      skinsCount: 0,
      jointsCount: 0,
      morphTargetCount: 0,
      morphTargetNames: [],
      animationCount: 0,
      animationNames: [],
      materialsCount: 0,
    };
  }

  const buf = fs.readFileSync(diskPath);
  if (buf.length < 20 || buf.toString('ascii', 0, 4) !== 'glTF') {
    return {
      id,
      filePath: publicPath,
      exists: true,
      validGlb: false,
      byteLength: buf.length,
      gltfVersion: null,
      meshesCount: 0,
      primitivesCount: 0,
      skinsCount: 0,
      jointsCount: 0,
      morphTargetCount: 0,
      morphTargetNames: [],
      animationCount: 0,
      animationNames: [],
      materialsCount: 0,
    };
  }

  const gltfVersion = buf.readUInt32LE(4);
  const chunk0Length = buf.readUInt32LE(12);
  const chunk0Type = buf.readUInt32LE(16);
  let json: Record<string, unknown> = {};
  if (chunk0Type === 0x4e4f534a && 20 + chunk0Length <= buf.length) {
    try {
      json = JSON.parse(buf.toString('utf8', 20, 20 + chunk0Length)) as Record<string, unknown>;
    } catch {
      json = {};
    }
  }

  const meshes = Array.isArray(json.meshes) ? (json.meshes as Array<Record<string, unknown>>) : [];
  let primitivesCount = 0;
  let morphTargetCount = 0;
  const morphTargetNames = new Set<string>();

  for (const mesh of meshes) {
    const primitives = Array.isArray(mesh.primitives)
      ? (mesh.primitives as Array<Record<string, unknown>>)
      : [];
    primitivesCount += primitives.length;
    for (const prim of primitives) {
      if (Array.isArray(prim.targets)) {
        morphTargetCount = Math.max(morphTargetCount, prim.targets.length);
      }
    }
    const extras = mesh.extras as { targetNames?: unknown } | undefined;
    if (extras && Array.isArray(extras.targetNames)) {
      for (const name of extras.targetNames) {
        if (typeof name === 'string') morphTargetNames.add(name);
      }
    }
  }

  const skins = Array.isArray(json.skins) ? (json.skins as Array<{ joints?: unknown[] }>) : [];
  const jointsCount = skins.reduce(
    (sum, s) => sum + (Array.isArray(s.joints) ? s.joints.length : 0),
    0,
  );
  const animations = Array.isArray(json.animations)
    ? (json.animations as Array<{ name?: string }>)
    : [];
  const materials = Array.isArray(json.materials) ? json.materials : [];

  return {
    id,
    filePath: publicPath,
    exists: true,
    validGlb: true,
    byteLength: buf.length,
    gltfVersion,
    meshesCount: meshes.length,
    primitivesCount,
    skinsCount: skins.length,
    jointsCount,
    morphTargetCount: Math.max(morphTargetCount, morphTargetNames.size),
    morphTargetNames: Array.from(morphTargetNames),
    animationCount: animations.length,
    animationNames: animations.map((a, idx) => a.name || `Clip ${idx + 1}`),
    materialsCount: materials.length,
  };
}

export function inspectAllStoryGlbs(rootDir: string): GlbBinaryInspection[] {
  return CHARACTER_GLB_PATHS.map((entry) =>
    inspectSingleGlbFile(entry.id, entry.publicPath, rootDir),
  );
}
