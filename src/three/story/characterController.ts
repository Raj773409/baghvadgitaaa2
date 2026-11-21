import * as THREE from 'three';
import { clone as cloneSkinnedObject } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { CharacterAssetId } from './assetManifest';
import { resolveAnimationClipSafely } from './assetValidation';
import { FacialAnimationController } from './facialAnimationController';
import type { LoadedCharacterAsset } from './modelLoader';
import type {
  DialogueSpeakerId,
  FacialEmotionState,
  VisemeWeightsSnapshot,
} from './visemeTimeline';

export interface CharacterControllerOptions {
  asset: LoadedCharacterAsset;
  instanceLabel?: string;
  phaseOffsetSec?: number;
  speakerRole?: DialogueSpeakerId;
}

function inferDefaultSpeakerRole(assetId: CharacterAssetId): DialogueSpeakerId {
  switch (assetId) {
    case 'krishna':
      return 'krishna';
    case 'arjuna':
      return 'arjuna';
    case 'karna_hero':
      return 'karna';
    case 'bhishma_drona_hero':
      return 'bhishma';
    default:
      return 'narrator';
  }
}

/**
 * Wraps Three.js AnimationMixer, smooth crossFade state transitions,
 * explicit missing-clip fallback resolution, real glTF facial blendshapes + jaw lip-sync,
 * and procedural bone additives on an independent SkeletonUtils.clone instance.
 */
export class CharacterController {
  public readonly assetId: CharacterAssetId;
  public readonly instanceLabel: string;
  public readonly root: THREE.Group;
  public readonly mixer: THREE.AnimationMixer;
  public readonly facial: FacialAnimationController;

  private readonly actions = new Map<string, THREE.AnimationAction>();
  private readonly clips: THREE.AnimationClip[];
  private readonly bones = new Map<string, THREE.Bone>();
  private readonly baseBoneQuats = new Map<string, THREE.Quaternion>();
  private readonly clonedMaterials: THREE.Material[] = [];
  private readonly availableClipNames: string[];
  private readonly fallbackMap: Record<string, string>;
  private readonly missingWarningsLogged = new Set<string>();

  private activeAction: THREE.AnimationAction | null = null;
  private activeRequestedClip: string | null = null;
  private activeResolvedClip: string | null = null;
  private phaseOffsetSec: number;
  private tempEuler = new THREE.Euler();
  private tempQuat = new THREE.Quaternion();

  constructor(options: CharacterControllerOptions) {
    const {
      asset,
      instanceLabel = asset.manifest.id,
      phaseOffsetSec = 0,
      speakerRole = inferDefaultSpeakerRole(asset.manifest.id),
    } = options;
    this.assetId = asset.manifest.id;
    this.instanceLabel = instanceLabel;
    this.phaseOffsetSec = phaseOffsetSec;
    this.fallbackMap = asset.manifest.fallbackClipMap;

    const cloned = cloneSkinnedObject(asset.scene) as THREE.Group;
    cloned.name = `${instanceLabel}_Instance`;
    this.root = cloned;

    cloned.traverse((obj) => {
      if ((obj as THREE.Bone).isBone && obj.name) {
        this.bones.set(obj.name, obj as THREE.Bone);
        this.baseBoneQuats.set(obj.name, obj.quaternion.clone());
      }
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    this.facial = new FacialAnimationController(speakerRole, cloned, phaseOffsetSec);
    this.mixer = new THREE.AnimationMixer(cloned);
    this.clips = asset.animations;
    this.availableClipNames = asset.animations.map((c) => c.name);

    for (const clip of asset.animations) {
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity);
      this.actions.set(clip.name, action);
    }

    const firstClip = this.availableClipNames[0];
    if (firstClip) {
      this.transitionTo(firstClip, 0);
      if (this.phaseOffsetSec > 0) {
        this.mixer.update(this.phaseOffsetSec);
      }
    }
  }

  public setFactionTint(hexColor: number, mixAmount = 0.35): void {
    const targetTint = new THREE.Color(hexColor);
    this.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (
        !mesh.isMesh ||
        mesh.name.includes('FacialMorphMesh') ||
        mesh.name.includes('Eye')
      ) {
        return;
      }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const nextMats = mats.map((m) => {
        if (!m) return m;
        const clonedMat = m.clone() as THREE.MeshStandardMaterial;
        if (clonedMat.color) {
          clonedMat.color.lerp(targetTint, mixAmount);
        }
        this.clonedMaterials.push(clonedMat);
        return clonedMat;
      });
      mesh.material = Array.isArray(mesh.material) ? nextMats : nextMats[0];
    });
  }

  public getCurrentClipInfo(): { requested: string | null; resolved: string | null } {
    return {
      requested: this.activeRequestedClip,
      resolved: this.activeResolvedClip,
    };
  }

  public transitionTo(
    requestedClip: string,
    fadeSeconds = 0.45,
    timeScale = 1,
  ): void {
    if (this.activeRequestedClip === requestedClip && this.activeAction) {
      this.activeAction.setEffectiveTimeScale(timeScale);
      return;
    }

    const resolution = resolveAnimationClipSafely(
      requestedClip,
      this.availableClipNames,
      this.fallbackMap,
    );

    if (resolution.isMissing && resolution.reason && !this.missingWarningsLogged.has(requestedClip)) {
      this.missingWarningsLogged.add(requestedClip);
      console.warn(`[CharacterController:${this.instanceLabel}] ${resolution.reason}`);
    }

    const targetClipName = resolution.resolvedClip;
    if (!targetClipName) {
      return;
    }

    const nextAction = this.actions.get(targetClipName);
    if (!nextAction) return;

    this.activeRequestedClip = requestedClip;
    this.activeResolvedClip = targetClipName;

    nextAction.reset();
    nextAction.setEffectiveTimeScale(timeScale);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (this.activeAction && this.activeAction !== nextAction) {
      if (fadeSeconds > 0.01) {
        this.activeAction.crossFadeTo(nextAction, fadeSeconds, true);
      } else {
        this.activeAction.stop();
      }
    }
    this.activeAction = nextAction;
  }

  /**
   * Advances AnimationMixer, updates facial glTF blendshape morph targets + Jaw lip-sync,
   * and overlays subtle procedural bone micro-motion cleanly.
   */
  public update(
    deltaSec: number,
    elapsedSec: number,
    modifiers?: {
      krishnaTurnTowardArjuna?: number;
      arjunaBowElevation?: number;
      arjunaDistressAmount?: number;
      isActiveSpeaker?: boolean;
      visemeSnapshot?: VisemeWeightsSnapshot | null;
      emotion?: FacialEmotionState;
      emotionIntensity?: number;
      reducedMotion?: boolean;
    },
  ): void {
    // Reset procedurally modulated bones to bind pose prior to mixer.update()
    // so bones omitted from the active clip never accumulate frame-over-frame twist.
    for (const boneName of ['Neck', 'Head', 'Jaw', 'PeacockFeather', 'BowMount']) {
      const bone = this.bones.get(boneName);
      const baseQ = this.baseBoneQuats.get(boneName);
      if (bone && baseQ) {
        bone.quaternion.copy(baseQ);
      }
    }

    const dt = modifiers?.reducedMotion ? deltaSec * 0.15 : deltaSec;
    this.mixer.update(Math.min(0.1, Math.max(0, dt)));

    // Drive facial blendshape morphs + jaw lip-sync
    this.facial.update({
      deltaSec,
      elapsedSec,
      isActiveSpeaker: Boolean(modifiers?.isActiveSpeaker),
      visemeSnapshot: modifiers?.visemeSnapshot ?? null,
      emotion: modifiers?.emotion ?? 'serene',
      emotionIntensity: modifiers?.emotionIntensity ?? 0.65,
      jawBone: this.bones.get('Jaw') ?? null,
      baseJawQuat: this.baseBoneQuats.get('Jaw') ?? null,
      headBone: this.bones.get('Head') ?? null,
      reducedMotion: Boolean(modifiers?.reducedMotion),
    });

    if (!modifiers) return;

    // Krishna gaze orientation & gentle feather breeze
    if (this.assetId === 'krishna') {
      const turn = modifiers.krishnaTurnTowardArjuna ?? 0;
      const head = this.bones.get('Head');
      const neck = this.bones.get('Neck');
      if (neck) {
        this.tempEuler.set(0.03 * turn, 0.28 * turn, 0);
        this.tempQuat.setFromEuler(this.tempEuler);
        neck.quaternion.multiply(this.tempQuat);
      }
      if (head) {
        this.tempEuler.set(0.04 * turn, 0.26 * turn, -0.02 * turn);
        this.tempQuat.setFromEuler(this.tempEuler);
        head.quaternion.multiply(this.tempQuat);
      }
      const feather = this.bones.get('PeacockFeather');
      if (feather && !modifiers.reducedMotion) {
        const sway = Math.sin(elapsedSec * 2.1) * 0.055;
        this.tempEuler.set(sway * 0.5, 0, sway);
        this.tempQuat.setFromEuler(this.tempEuler);
        feather.quaternion.multiply(this.tempQuat);
      }
    }

    // Arjuna BowMount & emotional posture weighting
    if (this.assetId === 'arjuna') {
      const bowEl = modifiers.arjunaBowElevation ?? 0.5;
      const distress = modifiers.arjunaDistressAmount ?? 0;
      const bowMount = this.bones.get('BowMount');
      if (bowMount) {
        // 0 = lowered near feet, 1 = lifted ready in battle stance
        const pitch = (1 - bowEl) * 0.42 - bowEl * 0.12;
        this.tempEuler.set(pitch, 0, (1 - bowEl) * 0.2);
        this.tempQuat.setFromEuler(this.tempEuler);
        bowMount.quaternion.multiply(this.tempQuat);
      }
      const head = this.bones.get('Head');
      if (head && distress > 0.05) {
        this.tempEuler.set(distress * 0.14, 0, 0);
        this.tempQuat.setFromEuler(this.tempEuler);
        head.quaternion.multiply(this.tempQuat);
      }
    }
  }

  public getBoneWorldPosition(boneName: string, out: THREE.Vector3): boolean {
    const bone = this.bones.get(boneName);
    if (!bone) return false;
    bone.getWorldPosition(out);
    return true;
  }

  public dispose(): void {
    this.mixer.stopAllAction();
    for (const clip of this.clips) {
      this.mixer.uncacheClip(clip);
    }
    this.mixer.uncacheRoot(this.root);
    for (const mat of this.clonedMaterials) {
      mat.dispose();
    }
    this.clonedMaterials.length = 0;
    this.actions.clear();
    this.bones.clear();
    this.baseBoneQuats.clear();
  }
}
