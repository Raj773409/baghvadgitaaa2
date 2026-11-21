import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getStorySceneAsset } from '../../content/storyAssets';
import { getCueDialogueTrack, type StorySceneRecord } from '../../content/storyContent';
import { useI18n } from '../../i18n';
import type { AssetValidationRecord } from '../../three/story/assetValidation';
import {
  createBattleAnimationController,
  type BattleAnimationControllerHandle,
} from '../../three/story/battleAnimationController';
import {
  createChakraController,
  type ChakraControllerHandle,
} from '../../three/story/chakraController';
import { CharacterController } from '../../three/story/characterController';
import { createAncientChariotRig, type ChariotRigHandle } from '../../three/story/chariotRig';
import { evaluateCinematicCamera } from '../../three/story/cinematicCameraRig';
import {
  createKurukshetraEnvironment,
  type KurukshetraEnvironmentHandle,
} from '../../three/story/kurukshetraEnvironment';
import {
  disposeStoryAssetBundle,
  loadCoreStoryBundle,
  loadWarPackBundle,
  type LoadedStoryAssetBundle,
  type StoryModelLoadProgress,
} from '../../three/story/modelLoader';
import {
  evaluateStoryTimeline,
  resolveAdaptiveQualityProfile,
  type QualityTier,
} from '../../three/story/storyTimeline';
import { sampleDialogueVisemeAtTime } from '../../three/story/visemeTimeline';
import {
  createVishvarupaTransform,
  type VishvarupaTransformHandle,
} from '../../three/story/vishvarupaTransform';
import {
  createWeaponSystem,
  type WeaponSystemHandle,
} from '../../three/story/weaponSystem';
import {
  createStudioEnvironment,
  detectWebGLCapability,
  isWebGLContextLost,
  scheduleAfterDraw,
} from '../../three/webglSupport';

interface StoryCanvas3DProps {
  masterProgress: number;
  activeScene: StorySceneRecord;
  isSoundPlaying: boolean;
  getSpokenTimeSec?: () => number | null;
  qualityTier: QualityTier;
  reducedMotion: boolean;
  isAutoScrolling: boolean;
  forceStaticFallback?: boolean;
  onLoadProgress: (progress: StoryModelLoadProgress) => void;
  onAssetsReady: (report: AssetValidationRecord[]) => void;
  onWarPackReady?: () => void;
  onQualityDowngrade?: (nextTier: QualityTier) => void;
  onShotNameChange?: (shotName: string) => void;
}

class WebGLErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface InnerSceneProps {
  masterProgress: number;
  masterProgressRef: React.MutableRefObject<number>;
  activeSceneRef: React.MutableRefObject<StorySceneRecord>;
  localeRef: React.MutableRefObject<'en' | 'hi' | 'te'>;
  getSpokenTimeSecRef: React.MutableRefObject<(() => number | null) | undefined>;
  isSoundPlaying: boolean;
  qualityTier: QualityTier;
  isSoftwareGl: boolean;
  reducedMotion: boolean;
  isAutoScrolling: boolean;
  onLoadProgress: (progress: StoryModelLoadProgress) => void;
  onAssetsReady: (report: AssetValidationRecord[]) => void;
  onWarPackReady?: () => void;
  onQualityDowngrade?: (nextTier: QualityTier) => void;
  onShotNameChange?: (shotName: string) => void;
  onShaderOrContextError: () => void;
}

const StoryWorldScene: React.FC<InnerSceneProps> = ({
  masterProgress,
  masterProgressRef,
  activeSceneRef,
  localeRef,
  getSpokenTimeSecRef,
  isSoundPlaying,
  qualityTier,
  isSoftwareGl,
  reducedMotion,
  isAutoScrolling,
  onLoadProgress,
  onAssetsReady,
  onWarPackReady,
  onQualityDowngrade,
  onShotNameChange,
  onShaderOrContextError,
}) => {
  const { gl, scene, camera, invalidate } = useThree();
  const rootGroupRef = useRef<THREE.Group | null>(null);

  const qualityConfig = useMemo(
    () => resolveAdaptiveQualityProfile(qualityTier, isSoftwareGl),
    [qualityTier, isSoftwareGl],
  );

  // Track persistent scene subsystems in refs so frame updates stay allocation-light
  const envRef = useRef<KurukshetraEnvironmentHandle | null>(null);
  const chariotRef = useRef<ChariotRigHandle | null>(null);
  const vishvarupaRef = useRef<VishvarupaTransformHandle | null>(null);
  const weaponRef = useRef<WeaponSystemHandle | null>(null);
  const chakraRef = useRef<ChakraControllerHandle | null>(null);
  const battleRef = useRef<BattleAnimationControllerHandle | null>(null);

  const coreBundleRef = useRef<LoadedStoryAssetBundle | null>(null);
  const warPackBundleRef = useRef<LoadedStoryAssetBundle | null>(null);

  const krishnaCtrlRef = useRef<CharacterController | null>(null);
  const arjunaCtrlRef = useRef<CharacterController | null>(null);
  const horseCtrlsRef = useRef<CharacterController[]>([]);
  const commanderCtrlsRef = useRef<CharacterController[]>([]);
  const timersRef = useRef<number[]>([]);
  const assetsLoadedRef = useRef<boolean>(false);

  const smoothCamPos = useRef(new THREE.Vector3(-18, 22, -54));
  const smoothCamTarget = useRef(new THREE.Vector3(0, 2.2, -8));
  const tempHandL = useRef(new THREE.Vector3());
  const tempHandR = useRef(new THREE.Vector3());
  const tempArjunaBowPos = useRef(new THREE.Vector3());
  const tempArjunaHandR = useRef(new THREE.Vector3());

  const prevShotRef = useRef<string>('');
  const lastCueKeyRef = useRef<string>('');
  const cueElapsedSecRef = useRef<number>(0);
  const lastFrameTsRef = useRef<number>(0);
  const lowFpsSecondsRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  const hasSnappedInitialCameraRef = useRef<boolean>(false);

  // Environment reflection PMREM setup once per renderer
  useEffect(() => {
    const { envTarget, shaderFailed } = createStudioEnvironment(gl);
    if (shaderFailed || !envTarget || isWebGLContextLost(gl)) {
      onShaderOrContextError();
      return;
    }
    scene.environment = envTarget.texture;
    return () => {
      scene.environment = null;
      envTarget.dispose();
    };
  }, [gl, scene, onShaderOrContextError]);

  // Build Kurukshetra Environment, Chariot Rig, Vishvarupa Cosmic Form, WeaponSystem, Chakra, & BattleSystem
  useEffect(() => {
    const root = rootGroupRef.current;
    if (!root) return;

    const env = createKurukshetraEnvironment(qualityConfig);
    const chariot = createAncientChariotRig();
    const vishvarupa = createVishvarupaTransform(qualityConfig);
    const weaponSys = createWeaponSystem(qualityConfig.maxPooledArrows);
    const chakraCtrl = createChakraController();
    const battleCtrl = createBattleAnimationController(qualityConfig);

    scene.fog = env.fog;
    root.add(env.group);
    root.add(chariot.group);
    root.add(vishvarupa.group);
    root.add(weaponSys.group);
    root.add(battleCtrl.group);

    envRef.current = env;
    chariotRef.current = chariot;
    vishvarupaRef.current = vishvarupa;
    weaponRef.current = weaponSys;
    chakraRef.current = chakraCtrl;
    battleRef.current = battleCtrl;

    // Re-attach already-loaded character rigs if qualityConfig recreated subsystems
    if (krishnaCtrlRef.current) chariot.krishnaMount.add(krishnaCtrlRef.current.root);
    if (arjunaCtrlRef.current) chariot.arjunaMount.add(arjunaCtrlRef.current.root);
    horseCtrlsRef.current.forEach((horseCtrl, i) => {
      const slot = chariot.horseSlots[i];
      if (slot) slot.add(horseCtrl.root);
    });
    commanderCtrlsRef.current.forEach((cmdCtrl) => {
      root.add(cmdCtrl.root);
    });
    if (warPackBundleRef.current) {
      const wAssets = warPackBundleRef.current.assets;
      battleCtrl.mountWarPackAssets({
        karnaHero: wAssets.karna_hero,
        bhishmaDronaHero: wAssets.bhishma_drona_hero,
        maceDuelists: wAssets.mace_duelists,
        warElephant: wAssets.war_elephant,
      });
    }

    invalidate();

    return () => {
      root.remove(env.group);
      root.remove(chariot.group);
      root.remove(vishvarupa.group);
      root.remove(weaponSys.group);
      root.remove(battleCtrl.group);
      commanderCtrlsRef.current.forEach((cmdCtrl) => root.remove(cmdCtrl.root));
      scene.fog = null;
      env.dispose();
      chariot.dispose();
      vishvarupa.dispose();
      weaponSys.dispose();
      chakraCtrl.dispose();
      battleCtrl.dispose();
      envRef.current = null;
      chariotRef.current = null;
      vishvarupaRef.current = null;
      weaponRef.current = null;
      chakraRef.current = null;
      battleRef.current = null;
    };
  }, [qualityConfig, scene, invalidate]);

  // Progressive Load: Core 4 Rigs first (blocking entry) -> War Pack 4 Rigs in background
  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;

    const mountBundles = async () => {
      // Phase 1: Core Part A characters & steeds
      const coreBundle = await loadCoreStoryBundle({
        renderer: gl,
        signal: abort.signal,
        onProgress: onLoadProgress,
      });
      if (disposed || abort.signal.aborted) {
        disposeStoryAssetBundle(coreBundle);
        return;
      }

      coreBundleRef.current = coreBundle;
      const chariot = chariotRef.current;
      const root = rootGroupRef.current;

      // 1. Sri Krishna Controller mounted in Charioteer seat
      if (coreBundle.assets.krishna && chariot) {
        const krishnaCtrl = new CharacterController({
          asset: coreBundle.assets.krishna,
          instanceLabel: 'SriKrishna',
          speakerRole: 'krishna',
        });
        krishnaCtrl.root.position.set(0, 0, 0);
        chariot.krishnaMount.add(krishnaCtrl.root);
        krishnaCtrlRef.current = krishnaCtrl;
      }

      // 2. Arjuna Controller mounted behind Krishna on Chariot Deck
      if (coreBundle.assets.arjuna && chariot) {
        const arjunaCtrl = new CharacterController({
          asset: coreBundle.assets.arjuna,
          instanceLabel: 'Arjuna',
          speakerRole: 'arjuna',
        });
        arjunaCtrl.root.position.set(0, 0, 0);
        chariot.arjunaMount.add(arjunaCtrl.root);
        arjunaCtrlRef.current = arjunaCtrl;
      }

      // 3. Four Coordinated Saindhava White Horses with staggered AnimationMixers
      const horseCtrls: CharacterController[] = [];
      if (coreBundle.assets.white_horses && chariot) {
        for (let i = 0; i < 4; i++) {
          const horseCtrl = new CharacterController({
            asset: coreBundle.assets.white_horses,
            instanceLabel: `WhiteHorse_${i + 1}`,
            phaseOffsetSec: i * 0.36,
          });
          chariot.horseSlots[i]?.add(horseCtrl.root);
          horseCtrls.push(horseCtrl);
        }
      }
      horseCtrlsRef.current = horseCtrls;

      // 4. Vanguard Skeletal Warrior Commanders facing off on Kurukshetra flanks
      const cmdCtrls: CharacterController[] = [];
      if (coreBundle.assets.warrior_archetype && root) {
        const placements: Array<{ x: number; z: number; ry: number; clip: string; faction: 'pandava' | 'kaurava' }> = [
          { x: -11.5, z: 18, ry: Math.PI, clip: 'raise_weapon', faction: 'kaurava' },
          { x: 11.5, z: 18, ry: Math.PI, clip: 'idle_stance', faction: 'kaurava' },
          { x: -13.5, z: 22, ry: Math.PI, clip: 'salute', faction: 'kaurava' },
          { x: -11.5, z: -20, ry: 0, clip: 'idle_stance', faction: 'pandava' },
          { x: 11.5, z: -20, ry: 0, clip: 'march', faction: 'pandava' },
          { x: 13.5, z: -24, ry: 0, clip: 'salute', faction: 'pandava' },
        ];
        placements.forEach((p, idx) => {
          const cmd = new CharacterController({
            asset: coreBundle.assets.warrior_archetype!,
            instanceLabel: `Commander_${idx + 1}`,
            phaseOffsetSec: idx * 0.4,
          });
          cmd.setFactionTint(p.faction === 'kaurava' ? 0x6b2824 : 0x9b7236, 0.32);
          cmd.root.position.set(p.x, 0, p.z);
          cmd.root.rotation.y = p.ry;
          cmd.transitionTo(p.clip, 0);
          root.add(cmd.root);
          cmdCtrls.push(cmd);
        });
      }
      commanderCtrlsRef.current = cmdCtrls;

      assetsLoadedRef.current = true;
      onAssetsReady(coreBundle.validationReport);
      invalidate();

      // Phase 2: Load Part B Mahabharata War Pack (Karna, Bhishma/Drona, Bhima/Duryodhana, Elephants) asynchronously
      const warBundle = await loadWarPackBundle({
        renderer: gl,
        signal: abort.signal,
      });
      if (disposed || abort.signal.aborted) {
        disposeStoryAssetBundle(warBundle);
        return;
      }

      warPackBundleRef.current = warBundle;
      battleRef.current?.mountWarPackAssets({
        karnaHero: warBundle.assets.karna_hero,
        bhishmaDronaHero: warBundle.assets.bhishma_drona_hero,
        maceDuelists: warBundle.assets.mace_duelists,
        warElephant: warBundle.assets.war_elephant,
      });

      onAssetsReady([...coreBundle.validationReport, ...warBundle.validationReport]);
      onWarPackReady?.();
      invalidate();
    };

    void mountBundles();

    return () => {
      disposed = true;
      abort.abort();
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
      krishnaCtrlRef.current?.dispose();
      arjunaCtrlRef.current?.dispose();
      horseCtrlsRef.current.forEach((h) => h.dispose());
      commanderCtrlsRef.current.forEach((c) => c.dispose());
      krishnaCtrlRef.current = null;
      arjunaCtrlRef.current = null;
      horseCtrlsRef.current = [];
      commanderCtrlsRef.current = [];
      disposeStoryAssetBundle(coreBundleRef.current);
      disposeStoryAssetBundle(warPackBundleRef.current);
      coreBundleRef.current = null;
      warPackBundleRef.current = null;
    };
    // Only load binary GLBs once per canvas lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useFrame((state, delta) => {
    if (isWebGLContextLost(state.gl)) return;
    const clampedDelta = Math.min(0.08, Math.max(0.001, delta || 0.016));
    elapsedTimeRef.current += clampedDelta;
    const tSec = elapsedTimeRef.current;

    const progress = masterProgressRef.current;
    const snapshot = evaluateStoryTimeline(progress);

    const cueKey = `${snapshot.sceneId}:${snapshot.cueIndex}`;
    if (cueKey !== lastCueKeyRef.current) {
      lastCueKeyRef.current = cueKey;
      cueElapsedSecRef.current = 0;
    } else if (!reducedMotion) {
      cueElapsedSecRef.current += clampedDelta;
    }
    const audioSpokenTime = getSpokenTimeSecRef.current?.();
    const effectiveSpokenTime =
      typeof audioSpokenTime === 'number' && Number.isFinite(audioSpokenTime)
        ? audioSpokenTime
        : cueElapsedSecRef.current;

    // Evaluate real-time phonetic viseme & facial emotion for the active speaker ONLY
    const activeTrack = getCueDialogueTrack(
      activeSceneRef.current,
      snapshot.cueIndex,
      localeRef.current,
    );
    const visemeSnapshot = sampleDialogueVisemeAtTime(activeTrack, effectiveSpokenTime);

    const arrowTrack = weaponRef.current?.getHeroArrowTrackingPose();
    const camEval = evaluateCinematicCamera(progress, snapshot.chariotPositionZ, {
      cameraMode: snapshot.cameraMode,
      timeSec: tSec,
      reducedMotion,
      heroArrowPos: arrowTrack?.position ?? null,
      heroArrowActive: arrowTrack?.active ?? false,
    });

    // Frame-rate-independent exponential damping across fast GSAP scrubbing
    const isInitialSnap = !hasSnappedInitialCameraRef.current;
    hasSnappedInitialCameraRef.current = true;

    if (isInitialSnap) {
      smoothCamPos.current.set(...camEval.position);
      smoothCamTarget.current.set(...camEval.target);
      camera.position.copy(smoothCamPos.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = camEval.fov;
        camera.updateProjectionMatrix();
      }
    } else {
      const dampLambda = isSoftwareGl || reducedMotion ? 11.5 : 6.8;
      smoothCamPos.current.set(
        THREE.MathUtils.damp(smoothCamPos.current.x, camEval.position[0], dampLambda, clampedDelta),
        THREE.MathUtils.damp(smoothCamPos.current.y, camEval.position[1], dampLambda, clampedDelta),
        THREE.MathUtils.damp(smoothCamPos.current.z, camEval.position[2], dampLambda, clampedDelta),
      );
      smoothCamTarget.current.set(
        THREE.MathUtils.damp(smoothCamTarget.current.x, camEval.target[0], dampLambda, clampedDelta),
        THREE.MathUtils.damp(smoothCamTarget.current.y, camEval.target[1], dampLambda, clampedDelta),
        THREE.MathUtils.damp(smoothCamTarget.current.z, camEval.target[2], dampLambda, clampedDelta),
      );
      camera.position.copy(smoothCamPos.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        const nextFov = THREE.MathUtils.damp(camera.fov, camEval.fov, dampLambda, clampedDelta);
        if (Math.abs(nextFov - camera.fov) > 0.02) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }
      }
    }
    camera.lookAt(smoothCamTarget.current);

    if (camEval.shotName !== prevShotRef.current) {
      prevShotRef.current = camEval.shotName;
      onShotNameChange?.(camEval.shotName);
    }

    // 1. Sri Krishna skeletal & facial blendshapes + isolated Sudarshana Chakra (Scene 04 only)
    if (krishnaCtrlRef.current) {
      krishnaCtrlRef.current.transitionTo(snapshot.krishnaClip, 0.55);
      krishnaCtrlRef.current.update(clampedDelta, tSec, {
        krishnaTurnTowardArjuna: snapshot.krishnaTurnTowardArjuna,
        isActiveSpeaker: snapshot.activeSpeaker === 'krishna',
        visemeSnapshot,
        emotion: visemeSnapshot.emotion,
        emotionIntensity: visemeSnapshot.emotionIntensity,
        reducedMotion,
      });

      const chakra = chakraRef.current;
      if (chakra) {
        if (snapshot.sudarshanaChakraActive > 0.02) {
          const rHandBone = krishnaCtrlRef.current.root.getObjectByName('RightHand');
          chakra.attachToHand(rHandBone ?? krishnaCtrlRef.current.root);
          chakra.setActivation(snapshot.sudarshanaChakraActive);
          chakra.setRotation(6.0);
        } else {
          chakra.unequip();
        }
        chakra.update(clampedDelta, tSec, reducedMotion);
      }
    }

    // 2. Arjuna skeletal & facial blendshapes + Gandiva stance
    if (arjunaCtrlRef.current) {
      arjunaCtrlRef.current.transitionTo(snapshot.arjunaClip, 0.55);
      arjunaCtrlRef.current.update(clampedDelta, tSec, {
        arjunaBowElevation: snapshot.arjunaBowElevation,
        arjunaDistressAmount: snapshot.arjunaDistressAmount,
        isActiveSpeaker: snapshot.activeSpeaker === 'arjuna',
        visemeSnapshot,
        emotion: snapshot.arjunaDistressAmount > 0.45 ? 'sorrow' : visemeSnapshot.emotion,
        emotionIntensity: visemeSnapshot.emotionIntensity,
        reducedMotion,
      });
    }

    // 3. White Horses & Flanking Vanguard Commanders
    const horseSpeedScale =
      snapshot.horsesClip === 'run'
        ? 1.45
        : snapshot.horsesClip === 'trot'
          ? 1.2
          : snapshot.horsesClip === 'walk'
            ? 0.95
            : 1.0;
    for (const horseCtrl of horseCtrlsRef.current) {
      horseCtrl.transitionTo(snapshot.horsesClip, 0.5, horseSpeedScale);
      horseCtrl.update(clampedDelta, tSec, { reducedMotion });
    }
    for (const cmdCtrl of commanderCtrlsRef.current) {
      cmdCtrl.update(clampedDelta, tSec, { reducedMotion });
    }

    // 4. Chariot Rig (Wheel rotation, Banner, Reins)
    const hasKrishnaL = krishnaCtrlRef.current?.getBoneWorldPosition('LeftHand', tempHandL.current);
    const hasKrishnaR = krishnaCtrlRef.current?.getBoneWorldPosition('RightHand', tempHandR.current);
    if (chariotRef.current) {
      chariotRef.current.update({
        chariotPositionZ: snapshot.chariotPositionZ,
        timeSec: tSec,
        reducedMotion,
        krishnaLeftHandWorld: hasKrishnaL ? tempHandL.current : null,
        krishnaRightHandWorld: hasKrishnaR ? tempHandR.current : null,
      });
    }

    // 5. WeaponSystem: Gandiva Bowstring, Arrow Volley Pool, & Day 9 Broken Wooden Chariot Wheel
    const hasArjunaBow = arjunaCtrlRef.current?.getBoneWorldPosition('BowMount', tempArjunaBowPos.current);
    const hasArjunaHandR = arjunaCtrlRef.current?.getBoneWorldPosition('RightHand', tempArjunaHandR.current);
    weaponRef.current?.update({
      deltaSec: clampedDelta,
      timeSec: tSec,
      chariotPositionZ: snapshot.chariotPositionZ,
      arjunaBowDrawAmount: snapshot.arjunaBowDrawAmount,
      arrowVolleyIntensity: snapshot.arrowVolleyIntensity,
      brokenWheelRaisedAmount: snapshot.brokenWheelRaisedAmount,
      arjunaBowMountPosWorld: hasArjunaBow ? tempArjunaBowPos.current : null,
      arjunaRightHandPosWorld: hasArjunaHandR ? tempArjunaHandR.current : null,
      krishnaRightHandPosWorld: hasKrishnaR ? tempHandR.current : null,
      reducedMotion,
    });

    // 6. Mahabharata Battle Controller (Chakravyuha, Torches, Bhishma, Karna, Mace Duel, Elephants)
    battleRef.current?.update({
      deltaSec: clampedDelta,
      timeSec: tSec,
      snapshot,
      visemeSnapshot,
      reducedMotion,
    });

    // 7. Kurukshetra Atmosphere & 8-Phase Vishvarupa Cosmic Form
    envRef.current?.update({
      snapshot,
      timeSec: tSec,
      reducedMotion,
    });
    vishvarupaRef.current?.update({
      intensity: snapshot.vishvarupaIntensity,
      phase: snapshot.vishvarupaPhase,
      chariotPositionZ: snapshot.chariotPositionZ,
      timeSec: tSec,
      reducedMotion,
    });

    // Adaptive GPU safeguard
    if (!isSoftwareGl && onQualityDowngrade && qualityTier !== 'performance') {
      const now = performance.now();
      if (lastFrameTsRef.current > 0) {
        const frameMs = now - lastFrameTsRef.current;
        if (frameMs > 48) {
          lowFpsSecondsRef.current += frameMs / 1000;
          if (lowFpsSecondsRef.current > 2.8) {
            lowFpsSecondsRef.current = 0;
            onQualityDowngrade(qualityTier === 'high' ? 'balanced' : 'performance');
          }
        } else {
          lowFpsSecondsRef.current = Math.max(0, lowFpsSecondsRef.current - 0.15);
        }
      }
      lastFrameTsRef.current = now;
    }

    // Software WebGL paced invalidation: continue ticking only while camera settles, auto-scrolling, or audio is speaking
    const camRemainingSq =
      (smoothCamPos.current.x - camEval.position[0]) ** 2 +
      (smoothCamPos.current.y - camEval.position[1]) ** 2 +
      (smoothCamPos.current.z - camEval.position[2]) ** 2;
    const needsContinueTick = isAutoScrolling || isSoundPlaying || camRemainingSq > 0.04;

    if (isSoftwareGl && assetsLoadedRef.current && !reducedMotion && needsContinueTick) {
      scheduleAfterDraw(
        state.gl,
        (id) => {
          timersRef.current.push(id);
          if (timersRef.current.length > 12) timersRef.current.shift();
        },
        () => invalidate(),
      );
    }
  });

  // Ensure scene invalidates once when progress, playback, or motion flags change
  useEffect(() => {
    if (isSoftwareGl) {
      invalidate();
    }
  }, [
    isSoftwareGl,
    masterProgress,
    isAutoScrolling,
    isSoundPlaying,
    reducedMotion,
    qualityTier,
    invalidate,
  ]);

  return <group ref={rootGroupRef} />;
};

export const StoryCanvas3D: React.FC<StoryCanvas3DProps> = ({
  masterProgress,
  activeScene,
  isSoundPlaying,
  getSpokenTimeSec,
  qualityTier,
  reducedMotion,
  isAutoScrolling,
  forceStaticFallback = false,
  onLoadProgress,
  onAssetsReady,
  onWarPackReady,
  onQualityDowngrade,
  onShotNameChange,
}) => {
  const { contentLocale: locale, t } = useI18n();
  const capability = useMemo(() => detectWebGLCapability(), []);
  const [contextLost, setContextLost] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const masterProgressRef = useRef<number>(masterProgress);
  masterProgressRef.current = masterProgress;

  const activeSceneRef = useRef<StorySceneRecord>(activeScene);
  activeSceneRef.current = activeScene;

  const localeRef = useRef<'en' | 'hi' | 'te'>(locale);
  localeRef.current = locale;

  const getSpokenTimeSecRef = useRef<(() => number | null) | undefined>(getSpokenTimeSec);
  getSpokenTimeSecRef.current = getSpokenTimeSec;

  const telemetry = useMemo(() => evaluateStoryTimeline(masterProgress), [masterProgress]);
  const sceneAsset = getStorySceneAsset(activeScene.id);

  const handleAssetsReady = React.useCallback(
    (report: AssetValidationRecord[]) => {
      if (report.length > 0) setAssetsLoaded(true);
      onAssetsReady(report);
    },
    [onAssetsReady],
  );

  const fallbackView = (
    <div
      data-testid="story-static-fallback"
      data-scene-index={activeScene.sceneNumber}
      data-part-id={telemetry.partId}
      data-assets-loaded={assetsLoaded ? 'true' : 'false'}
      data-active-speaker={telemetry.activeSpeaker}
      data-war-day={telemetry.activeWarDay}
      data-battle-mode={telemetry.battleMode}
      data-chakra-active={telemetry.sudarshanaChakraActive > 0.02 ? 'true' : 'false'}
      data-broken-wheel-active={telemetry.brokenWheelRaisedAmount > 0.04 ? 'true' : 'false'}
      className="relative w-full h-full bg-[#0D1120] flex items-center justify-center overflow-hidden"
    >
      <img
        src={sceneAsset.primaryImageSrc}
        alt={sceneAsset.alt[locale]}
        className="w-full h-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D1120] via-[#0D1120]/50 to-[#0D1120]/70" />
      <div className="relative z-10 max-w-lg text-center px-6 py-5 rounded-xl bg-[#101426]/92 border border-[#F3CD82]/35 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#F3CD82]">
          {t('story.webglFallbackLabel')}
        </p>
        <p className="font-editorial text-2xl text-[#FFF6E8]">
          {activeScene.title[locale]}
        </p>
        <p className="text-xs text-[#F5F0E7]/80">
          {contextLost
            ? 'WebGL context interrupted — accessible fallback mode preserved.'
            : activeScene.atmosphereNote[locale]}
        </p>
      </div>
    </div>
  );

  if (!capability.supported || forceStaticFallback || contextLost) {
    return fallbackView;
  }

  const qualityConfig = resolveAdaptiveQualityProfile(qualityTier, capability.isSoftwareGl);

  return (
    <WebGLErrorBoundary fallback={fallbackView}>
      <div
        className="w-full h-full relative"
        data-testid="story-webgl-canvas-container"
        data-scene-index={activeScene.sceneNumber}
        data-part-id={telemetry.partId}
        data-assets-loaded={assetsLoaded ? 'true' : 'false'}
        data-active-speaker={telemetry.activeSpeaker}
        data-war-day={telemetry.activeWarDay}
        data-battle-mode={telemetry.battleMode}
        data-chakra-active={telemetry.sudarshanaChakraActive > 0.02 ? 'true' : 'false'}
        data-broken-wheel-active={telemetry.brokenWheelRaisedAmount > 0.04 ? 'true' : 'false'}
      >
        <Canvas
          dpr={capability.isSoftwareGl ? 1 : [1, qualityConfig.maxDpr]}
          shadows={!capability.isSoftwareGl && qualityConfig.enableShadows}
          frameloop={capability.isSoftwareGl ? 'demand' : 'always'}
          camera={{ fov: 46, near: 0.2, far: 420, position: [-18, 22, -54] }}
          gl={{
            antialias: !capability.isSoftwareGl,
            powerPreference: capability.isSoftwareGl ? 'low-power' : 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            gl.debug.onShaderError = () => {
              setContextLost(true);
            };
            const dom = gl.domElement;
            dom.addEventListener(
              'webglcontextlost',
              (e) => {
                e.preventDefault();
                setContextLost(true);
              },
              false,
            );
            dom.addEventListener(
              'webglcontextrestored',
              () => {
                setContextLost(false);
              },
              false,
            );
          }}
        >
          <StoryWorldScene
            masterProgress={masterProgress}
            masterProgressRef={masterProgressRef}
            activeSceneRef={activeSceneRef}
            localeRef={localeRef}
            getSpokenTimeSecRef={getSpokenTimeSecRef}
            isSoundPlaying={isSoundPlaying}
            qualityTier={qualityTier}
            isSoftwareGl={capability.isSoftwareGl}
            reducedMotion={reducedMotion}
            isAutoScrolling={isAutoScrolling}
            onLoadProgress={onLoadProgress}
            onAssetsReady={handleAssetsReady}
            onWarPackReady={onWarPackReady}
            onQualityDowngrade={onQualityDowngrade}
            onShotNameChange={onShotNameChange}
            onShaderOrContextError={() => setContextLost(true)}
          />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
