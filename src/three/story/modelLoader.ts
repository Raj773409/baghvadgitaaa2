import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {
  CHARACTER_ASSET_LIST,
  CHARACTER_ASSET_MANIFEST,
  type AssetLoadPriority,
  type CharacterAssetId,
  type CharacterAssetManifestEntry,
} from './assetManifest';
import {
  validateLoadedCharacterAsset,
  type AssetValidationRecord,
  type LoadedModelInspection,
} from './assetValidation';
import {
  createCharacterTextureBank,
  enhanceCharacterSceneMaterials,
} from './characterMaterials';

export interface LoadedCharacterAsset {
  manifest: CharacterAssetManifestEntry;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  inspection: LoadedModelInspection;
  validation: AssetValidationRecord;
}

export interface StoryModelLoadProgress {
  loadedAssets: number;
  totalAssets: number;
  ratio: number; // 0..1 genuine item + byte ratio
  activeItemLabel: string;
}

export interface LoadedStoryAssetBundle {
  assets: Record<CharacterAssetId, LoadedCharacterAsset | null>;
  validationReport: AssetValidationRecord[];
  disposers: Array<() => void>;
}

export function inspectLoadedGltf(gltf: GLTF): LoadedModelInspection {
  const boneNamesSet = new Set<string>();
  const morphNamesSet = new Set<string>();
  let hasSkeleton = false;
  let meshCount = 0;
  let triangleCount = 0;

  gltf.scene.traverse((obj) => {
    if ((obj as THREE.Bone).isBone && obj.name) {
      boneNamesSet.add(obj.name);
    }
    const mesh = obj as THREE.Mesh | THREE.SkinnedMesh;
    if (mesh.isMesh) {
      meshCount += 1;
      const geo = mesh.geometry;
      if (geo) {
        if (geo.index) {
          triangleCount += Math.round(geo.index.count / 3);
        } else {
          const pos = geo.getAttribute('position');
          if (pos) triangleCount += Math.round(pos.count / 3);
        }
      }
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh && (mesh as THREE.SkinnedMesh).skeleton) {
        hasSkeleton = true;
        for (const b of (mesh as THREE.SkinnedMesh).skeleton.bones) {
          if (b.name) boneNamesSet.add(b.name);
        }
      }

      // Extract named morph targets from dictionary and/or userData targetNames
      if (mesh.morphTargetDictionary) {
        for (const key of Object.keys(mesh.morphTargetDictionary)) {
          if (key) morphNamesSet.add(key);
        }
      }
      const userTargetNames = mesh.userData?.targetNames;
      if (Array.isArray(userTargetNames)) {
        for (const name of userTargetNames) {
          if (typeof name === 'string' && name.length > 0) {
            morphNamesSet.add(name);
          }
        }
      }
    }
  });

  if (!hasSkeleton && boneNamesSet.size > 0) {
    hasSkeleton = true;
  }

  return {
    hasSkeleton,
    boneNames: Array.from(boneNamesSet),
    morphTargetNames: Array.from(morphNamesSet),
    meshCount,
    triangleCount,
    clipNames: (gltf.animations ?? []).map((clip) => clip.name),
  };
}

export async function loadStoryCharacterBundle(options: {
  renderer?: THREE.WebGLRenderer;
  priorities?: ReadonlyArray<AssetLoadPriority>;
  onProgress?: (progress: StoryModelLoadProgress) => void;
  signal?: AbortSignal;
}): Promise<LoadedStoryAssetBundle> {
  const { renderer, priorities = ['core', 'war-pack'], onProgress, signal } = options;

  const manager = new THREE.LoadingManager();
  const dracoLoader = new DRACOLoader(manager);
  dracoLoader.setDecoderPath('/decoders/draco/');
  dracoLoader.preload();

  const ktx2Loader = new KTX2Loader(manager);
  ktx2Loader.setTranscoderPath('/decoders/basis/');
  if (renderer) {
    try {
      ktx2Loader.detectSupport(renderer);
    } catch {
      // KTX2 hardware probe non-fatal
    }
  }

  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.setDRACOLoader(dracoLoader);
  gltfLoader.setKTX2Loader(ktx2Loader);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  const textureBank = createCharacterTextureBank(renderer);
  const materialDisposers: Array<() => void> = [];
  if (textureBank) {
    materialDisposers.push(() => textureBank.dispose());
  }

  const targetEntries = CHARACTER_ASSET_LIST.filter((entry) =>
    priorities.includes(entry.priority),
  );

  const totalAssets = targetEntries.length;
  const assetFractions = new Map<CharacterAssetId, number>();
  let completedCount = 0;

  const emitProgress = (label: string) => {
    if (!onProgress) return;
    let sum = 0;
    for (const entry of targetEntries) {
      sum += assetFractions.get(entry.id) ?? 0;
    }
    const ratio = totalAssets > 0 ? Math.min(1, Math.max(0, sum / totalAssets)) : 1;
    onProgress({
      loadedAssets: completedCount,
      totalAssets,
      ratio,
      activeItemLabel: label,
    });
  };

  emitProgress(targetEntries[0]?.name ?? 'Kurukshetra');

  const loadedEntries: Record<CharacterAssetId, LoadedCharacterAsset | null> = {
    krishna: null,
    arjuna: null,
    white_horses: null,
    warrior_archetype: null,
    karna_hero: null,
    bhishma_drona_hero: null,
    mace_duelists: null,
    war_elephant: null,
  };
  const validationReport: AssetValidationRecord[] = [];
  const loadedObjects: THREE.Object3D[] = [];

  await Promise.all(
    targetEntries.map(async (manifestEntry) => {
      if (signal?.aborted) return;
      try {
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          gltfLoader.load(
            manifestEntry.filePath,
            (result) => resolve(result),
            (evt) => {
              if (evt.lengthComputable && evt.total > 0) {
                assetFractions.set(manifestEntry.id, Math.min(0.95, evt.loaded / evt.total));
                emitProgress(manifestEntry.name);
              }
            },
            (err) => reject(err),
          );
        });

        if (signal?.aborted) return;

        gltf.scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Ensure morphTargetDictionary is normalized if targetNames exist on userData
            if (
              !mesh.morphTargetDictionary &&
              Array.isArray(mesh.userData?.targetNames)
            ) {
              const dict: Record<string, number> = {};
              (mesh.userData.targetNames as string[]).forEach((name, idx) => {
                dict[name] = idx;
              });
              mesh.morphTargetDictionary = dict;
              mesh.updateMorphTargets();
            }
          }
        });

        enhanceCharacterSceneMaterials(gltf.scene, manifestEntry, textureBank, materialDisposers);

        const inspection = inspectLoadedGltf(gltf);
        const validation = validateLoadedCharacterAsset(manifestEntry, inspection);

        loadedEntries[manifestEntry.id] = {
          manifest: manifestEntry,
          scene: gltf.scene,
          animations: gltf.animations ?? [],
          inspection,
          validation,
        };
        loadedObjects.push(gltf.scene);
        validationReport.push(validation);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed loading ${manifestEntry.filePath}`;
        const failedValidation = validateLoadedCharacterAsset(
          manifestEntry,
          null,
          message,
        );
        loadedEntries[manifestEntry.id] = null;
        validationReport.push(failedValidation);
      } finally {
        completedCount += 1;
        assetFractions.set(manifestEntry.id, 1);
        emitProgress(manifestEntry.name);
      }
    }),
  );

  // Order report strictly matching manifest order
  const orderedOrder = CHARACTER_ASSET_LIST.map((entry) => entry.id);
  validationReport.sort(
    (a, b) => orderedOrder.indexOf(a.id) - orderedOrder.indexOf(b.id),
  );

  return {
    assets: loadedEntries,
    validationReport,
    disposers: [
      () => dracoLoader.dispose(),
      () => ktx2Loader.dispose(),
      ...materialDisposers,
      () => {
        for (const root of loadedObjects) {
          root.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.geometry?.dispose();
              const mats = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];
              for (const m of mats) {
                if (!m) continue;
                const matAny = m as THREE.MeshStandardMaterial;
                matAny.map?.dispose?.();
                matAny.normalMap?.dispose?.();
                matAny.roughnessMap?.dispose?.();
                matAny.metalnessMap?.dispose?.();
                m.dispose();
              }
            }
          });
        }
      },
    ],
  };
}

export function loadCoreStoryBundle(options: {
  renderer?: THREE.WebGLRenderer;
  onProgress?: (progress: StoryModelLoadProgress) => void;
  signal?: AbortSignal;
}): Promise<LoadedStoryAssetBundle> {
  return loadStoryCharacterBundle({
    ...options,
    priorities: ['core'],
  });
}

export function loadWarPackBundle(options: {
  renderer?: THREE.WebGLRenderer;
  onProgress?: (progress: StoryModelLoadProgress) => void;
  signal?: AbortSignal;
}): Promise<LoadedStoryAssetBundle> {
  return loadStoryCharacterBundle({
    ...options,
    priorities: ['war-pack'],
  });
}

export function disposeStoryAssetBundle(bundle: LoadedStoryAssetBundle | null): void {
  if (!bundle) return;
  for (const fn of bundle.disposers) {
    try {
      fn();
    } catch {
      // ignore disposal errors on torn-down context
    }
  }
}

export { CHARACTER_ASSET_MANIFEST };
