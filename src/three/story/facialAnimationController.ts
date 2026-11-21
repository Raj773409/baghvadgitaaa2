import * as THREE from 'three';
import type {
  DialogueSpeakerId,
  FacialEmotionState,
  VisemeShape,
  VisemeWeightsSnapshot,
} from './visemeTimeline';

export const ALL_VISEME_SHAPES: ReadonlyArray<VisemeShape> = [
  'viseme_sil',
  'viseme_aa',
  'viseme_E',
  'viseme_oh',
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
];

export interface FacialUpdateParams {
  deltaSec: number;
  elapsedSec: number;
  isActiveSpeaker: boolean;
  visemeSnapshot: VisemeWeightsSnapshot | null;
  emotion: FacialEmotionState;
  emotionIntensity: number;
  jawBone?: THREE.Bone | null;
  baseJawQuat?: THREE.Quaternion | null;
  headBone?: THREE.Bone | null;
  reducedMotion?: boolean;
}

/**
 * Drives real glTF facial blendshape morph targets (visemes, blink, brow_furrow,
 * brow_raise, smile) + Jaw bone fallback rotation with single-speaker isolation
 * and natural involuntary blinking.
 */
export class FacialAnimationController {
  public readonly role: DialogueSpeakerId;
  private readonly morphMeshes: Array<THREE.Mesh | THREE.SkinnedMesh> = [];
  private readonly currentWeights: Record<string, number> = {
    viseme_sil: 1,
    viseme_aa: 0,
    viseme_E: 0,
    viseme_oh: 0,
    viseme_PP: 0,
    viseme_FF: 0,
    viseme_TH: 0,
    blink: 0,
    brow_furrow: 0,
    brow_raise: 0,
    smile: 0,
  };

  private nextBlinkAtSec = 2.1;
  private blinkProgress = -1; // -1 = open, 0..1 = blinking
  private currentJawAngle = 0;
  private readonly tempEuler = new THREE.Euler();
  private readonly tempQuat = new THREE.Quaternion();

  constructor(role: DialogueSpeakerId, root: THREE.Object3D, seedOffsetSec = 0) {
    this.role = role;
    this.nextBlinkAtSec = 1.8 + (seedOffsetSec % 2.4);

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh | THREE.SkinnedMesh;
      if (mesh.isMesh && mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        this.morphMeshes.push(mesh);
      }
    });
  }

  public getMorphMeshCount(): number {
    return this.morphMeshes.length;
  }

  public getSupportedMorphTargetNames(): string[] {
    const names = new Set<string>();
    for (const mesh of this.morphMeshes) {
      if (mesh.morphTargetDictionary) {
        for (const k of Object.keys(mesh.morphTargetDictionary)) {
          names.add(k);
        }
      }
    }
    return Array.from(names);
  }

  public update(params: FacialUpdateParams): void {
    const {
      deltaSec,
      elapsedSec,
      isActiveSpeaker,
      visemeSnapshot,
      emotion,
      emotionIntensity,
      jawBone,
      baseJawQuat,
      reducedMotion = false,
    } = params;

    const dt = Math.min(0.08, Math.max(0.001, deltaSec));
    const dampFactor = 1 - Math.exp(-16 * dt);
    const emotionDamp = 1 - Math.exp(-6 * dt);

    // 1. Single-speaker lip-sync targets: ONLY activeSpeaker animates mouth visemes
    const targetVisemes: Record<VisemeShape, number> = {
      viseme_sil: 1,
      viseme_aa: 0,
      viseme_E: 0,
      viseme_oh: 0,
      viseme_PP: 0,
      viseme_FF: 0,
      viseme_TH: 0,
    };
    let targetJawOpen = 0;

    if (
      isActiveSpeaker &&
      visemeSnapshot &&
      visemeSnapshot.speaker === this.role
    ) {
      for (const shape of ALL_VISEME_SHAPES) {
        targetVisemes[shape] = visemeSnapshot.weights[shape] ?? 0;
      }
      targetJawOpen = visemeSnapshot.jawOpen;
    }

    for (const shape of ALL_VISEME_SHAPES) {
      this.currentWeights[shape] = THREE.MathUtils.lerp(
        this.currentWeights[shape] ?? 0,
        targetVisemes[shape],
        dampFactor,
      );
    }

    // 2. Natural involuntary blink (skipped if reducedMotion hides rapid micro-blinks? Keep gentle)
    if (!reducedMotion) {
      if (this.blinkProgress >= 0) {
        this.blinkProgress += dt / 0.16;
        if (this.blinkProgress >= 1) {
          this.blinkProgress = -1;
          this.nextBlinkAtSec = elapsedSec + 2.8 + ((elapsedSec * 1.73) % 2.1);
          this.currentWeights.blink = 0;
        } else {
          this.currentWeights.blink = Math.sin(this.blinkProgress * Math.PI);
        }
      } else if (elapsedSec >= this.nextBlinkAtSec) {
        this.blinkProgress = 0;
      }
    } else {
      this.currentWeights.blink = 0;
    }

    // 3. Facial Expression Morphs mapped cleanly to Emotion State
    const intensity = Math.max(0, Math.min(1, emotionIntensity));
    const targetFurrow =
      emotion === 'sorrow' || emotion === 'battle_focus' ? 0.78 * intensity : 0;
    const targetRaise =
      emotion === 'awe' ? 0.85 * intensity : emotion === 'compassionate' ? 0.28 * intensity : 0;
    const targetSmile =
      emotion === 'serene' || emotion === 'compassionate' ? 0.62 * intensity : 0;

    this.currentWeights.brow_furrow = THREE.MathUtils.lerp(
      this.currentWeights.brow_furrow,
      targetFurrow,
      emotionDamp,
    );
    this.currentWeights.brow_raise = THREE.MathUtils.lerp(
      this.currentWeights.brow_raise,
      targetRaise,
      emotionDamp,
    );
    this.currentWeights.smile = THREE.MathUtils.lerp(
      this.currentWeights.smile,
      targetSmile,
      emotionDamp,
    );

    // 4. Write blended weights to glTF morphTargetInfluences
    for (const mesh of this.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;
      if (!dict || !infl) continue;

      for (const [key, value] of Object.entries(this.currentWeights)) {
        const idx = dict[key];
        if (typeof idx === 'number' && idx >= 0 && idx < infl.length) {
          infl[idx] = value;
        }
      }
    }

    // 5. Fallback / Additive Jaw bone hinge synced to active syllable openness
    if (jawBone && baseJawQuat) {
      this.currentJawAngle = THREE.MathUtils.lerp(
        this.currentJawAngle,
        targetJawOpen * 0.24,
        dampFactor,
      );
      this.tempEuler.set(this.currentJawAngle, 0, 0);
      this.tempQuat.setFromEuler(this.tempEuler);
      jawBone.quaternion.copy(baseJawQuat).multiply(this.tempQuat);
    }
  }
}
