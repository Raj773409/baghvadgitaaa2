import * as THREE from 'three';
import { clamp01, type CameraMode } from './storyTimeline';

export interface CameraKeyframe {
  progress: number;
  shotName: string;
  /** X offset in meters (world space) */
  posX: number;
  /** Y height in meters */
  posY: number;
  /** Z offset RELATIVE to chariotZ when followChariot=true, else world Z */
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fov: number;
  followChariot: boolean;
}

export interface CameraEvaluation {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  shotName: string;
}

/**
 * 25 Smooth Keyframed Waypoints spanning both:
 *   Part A (0.00 -> 0.48): Scenes 01..07 (The Bhagavad Gita)
 *   Part B (0.48 -> 1.00): Scenes 08..15 (The Mahabharata 18 War Days + Epilogue)
 */
export const CINEMATIC_CAMERA_WAYPOINTS: ReadonlyArray<CameraKeyframe> = [
  // PART A — SCENE 01: Kurukshetra Dawn Aerial -> Chariot Approach (0.00 -> 0.068)
  {
    progress: 0.0,
    shotName: 'Aerial Kurukshetra Flyover',
    posX: -18,
    posY: 22,
    posZ: -54,
    targetX: 0,
    targetY: 2.2,
    targetZ: -8,
    fov: 48,
    followChariot: false,
  },
  {
    progress: 0.032,
    shotName: 'Descending Over Confronting Armies',
    posX: 11,
    posY: 9.5,
    posZ: -32,
    targetX: 0,
    targetY: 2.0,
    targetZ: -10,
    fov: 45,
    followChariot: false,
  },
  {
    progress: 0.064,
    shotName: 'Establishing Hero Chariot & Steeds',
    posX: -6.8,
    posY: 3.3,
    posZ: 8.6,
    targetX: 0,
    targetY: 1.95,
    targetZ: 0.8,
    fov: 43,
    followChariot: true,
  },
  // SCENE 02: Arjuna's Dilemma (0.068 -> 0.138)
  {
    progress: 0.088,
    shotName: 'Over-the-Shoulder Opposite Army View',
    posX: -1.45,
    posY: 2.55,
    posZ: -1.65,
    targetX: 0.25,
    targetY: 1.9,
    targetZ: 14.0,
    fov: 38,
    followChariot: true,
  },
  {
    progress: 0.125,
    shotName: 'Arjuna Emotional Close-Up',
    posX: 1.85,
    posY: 2.35,
    posZ: 1.35,
    targetX: -0.35,
    targetY: 2.05,
    targetZ: -0.25,
    fov: 34,
    followChariot: true,
  },
  // SCENE 03: Divine Teaching Begins (0.138 -> 0.212)
  {
    progress: 0.165,
    shotName: 'Krishna Charioteer Intimate Framing',
    posX: -2.15,
    posY: 2.32,
    posZ: 3.15,
    targetX: -0.1,
    targetY: 2.18,
    targetZ: 0.25,
    fov: 36,
    followChariot: true,
  },
  {
    progress: 0.205,
    shotName: 'Dialogue Two-Shot on Chariot',
    posX: 2.85,
    posY: 2.55,
    posZ: 2.8,
    targetX: 0.0,
    targetY: 2.05,
    targetZ: 0.1,
    fov: 37,
    followChariot: true,
  },
  // SCENE 04: Vishvarupa Cosmic Revelation + Sudarshana Chakra (0.212 -> 0.302)
  {
    progress: 0.225,
    shotName: 'Stillness Before Cosmic Revelation',
    posX: 0.4,
    posY: 2.35,
    posZ: 3.9,
    targetX: 0.2,
    targetY: 2.3,
    targetZ: 0.3,
    fov: 38,
    followChariot: true,
  },
  {
    progress: 0.262,
    shotName: 'Vishvarupa Monumental Cosmic Reveal',
    posX: 0.0,
    posY: 5.2,
    posZ: 17.5,
    targetX: 0.0,
    targetY: 4.8,
    targetZ: -1.5,
    fov: 54,
    followChariot: true,
  },
  {
    progress: 0.295,
    shotName: 'Arjuna Witnessing the Universal Form',
    posX: -3.4,
    posY: 2.8,
    posZ: 4.5,
    targetX: 0.0,
    targetY: 4.0,
    targetZ: -0.8,
    fov: 48,
    followChariot: true,
  },
  // SCENE 05: Wisdom of the Gita (0.302 -> 0.368)
  {
    progress: 0.335,
    shotName: 'Four Paths of Wisdom Orbit',
    posX: 4.4,
    posY: 2.95,
    posZ: -2.2,
    targetX: 0.0,
    targetY: 2.1,
    targetZ: 0.2,
    fov: 40,
    followChariot: true,
  },
  // SCENE 06: Arjuna Finds Clarity & Lifts Gandiva (0.368 -> 0.424)
  {
    progress: 0.395,
    shotName: 'Arjuna Raises Gandiva — Clarity Restored',
    posX: 2.85,
    posY: 2.32,
    posZ: 3.15,
    targetX: 0.18,
    targetY: 2.18,
    targetZ: 0.0,
    fov: 38,
    followChariot: true,
  },
  {
    progress: 0.414,
    shotName: 'Gandiva Bowstring Release & Conch Echo',
    posX: 4.15,
    posY: 2.65,
    posZ: 4.9,
    targetX: 0.25,
    targetY: 2.15,
    targetZ: 2.8,
    fov: 41,
    followChariot: true,
  },
  // SCENE 07: The Eternal Message Transition (0.424 -> 0.48)
  {
    progress: 0.455,
    shotName: 'Luminous Gita Closing Horizon',
    posX: 7.2,
    posY: 5.8,
    posZ: 12.5,
    targetX: 0,
    targetY: 2.4,
    targetZ: 0,
    fov: 45,
    followChariot: true,
  },

  // PART B — SCENE 08: Days 1–4 Grand Battle Charges (0.48 -> 0.545)
  {
    progress: 0.505,
    shotName: 'Wide Battlefield Formations — Days 1–4',
    posX: -14.0,
    posY: 11.5,
    posZ: -16.0,
    targetX: 0,
    targetY: 2.2,
    targetZ: 10.0,
    fov: 47,
    followChariot: false,
  },
  {
    progress: 0.538,
    shotName: 'Tracking Chariot Volley Advance',
    posX: 5.4,
    posY: 3.4,
    posZ: 4.2,
    targetX: 0.2,
    targetY: 2.1,
    targetZ: 12.0,
    fov: 42,
    followChariot: true,
  },

  // SCENE 09: Days 5–9 & Day 9 Broken Chariot Wheel Encounter (0.545 -> 0.615)
  {
    progress: 0.585,
    shotName: 'Day 9 — Krishna Lifts the Chariot Wheel',
    posX: -4.6,
    posY: 2.85,
    posZ: 5.8,
    targetX: -0.5,
    targetY: 2.15,
    targetZ: 0.5,
    fov: 41,
    followChariot: true,
  },

  // SCENE 10: Day 10 Fall of Bhishma & Bed of Arrows (0.615 -> 0.68)
  {
    progress: 0.648,
    shotName: 'Day 10 — Pitamaha Bhishma on Bed of Arrows',
    posX: -2.2,
    posY: 2.8,
    posZ: 6.4,
    targetX: -5.5,
    targetY: 1.0,
    targetZ: 11.0,
    fov: 40,
    followChariot: false,
  },

  // SCENE 11: Days 11–13 Drona & Chakravyuha Phalanx (0.68 -> 0.748)
  {
    progress: 0.715,
    shotName: 'Day 13 — Rotating Chakravyuha Rings',
    posX: 6.5,
    posY: 14.5,
    posZ: 1.5,
    targetX: 0.0,
    targetY: 0.6,
    targetZ: 15.5,
    fov: 48,
    followChariot: false,
  },

  // SCENE 12: Day 14 Dusk Vow & Torchlit Night Battle (0.748 -> 0.815)
  {
    progress: 0.785,
    shotName: 'Day 14 — Night Torches & Ghatotkacha Surge',
    posX: -12.5,
    posY: 7.4,
    posZ: -8.0,
    targetX: 0.0,
    targetY: 2.0,
    targetZ: 10.0,
    fov: 46,
    followChariot: false,
  },

  // SCENE 13: Days 15–17 Karna vs Arjuna Chariot Duel (0.815 -> 0.885)
  {
    progress: 0.848,
    shotName: 'Days 16–17 — Karna vs Arjuna Chariot Duel',
    posX: 8.8,
    posY: 3.8,
    posZ: 2.5,
    targetX: 0.2,
    targetY: 1.9,
    targetZ: 7.5,
    fov: 46,
    followChariot: false,
  },
  {
    progress: 0.875,
    shotName: 'Day 17 — Karna Sunken Wheel Moment',
    posX: -5.4,
    posY: 3.1,
    posZ: 8.2,
    targetX: 0.2,
    targetY: 1.7,
    targetZ: 13.5,
    fov: 43,
    followChariot: false,
  },

  // SCENE 14: Day 18 Shalya & Bhima–Duryodhana Mace Duel (0.885 -> 0.945)
  {
    progress: 0.915,
    shotName: 'Day 18 — Bhima & Duryodhana Gada Duel',
    posX: 5.2,
    posY: 2.45,
    posZ: 15.8,
    targetX: 0.0,
    targetY: 1.4,
    targetZ: 12.0,
    fov: 41,
    followChariot: false,
  },

  // SCENE 15: Post-War Epilogue & Dharmic Reign Horizon (0.945 -> 1.00)
  {
    progress: 0.968,
    shotName: 'Aftermath at Dusk — Remembrance of Dharma',
    posX: 6.5,
    posY: 5.6,
    posZ: 11.5,
    targetX: 0.0,
    targetY: 2.2,
    targetZ: 0.0,
    fov: 45,
    followChariot: true,
  },
  {
    progress: 1.0,
    shotName: 'Eternal Kurukshetra Horizon Finale',
    posX: 0.0,
    posY: 16.5,
    posZ: 28.0,
    targetX: 0.0,
    targetY: 3.0,
    targetZ: -8.0,
    fov: 50,
    followChariot: true,
  },
];

function smoothLerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface CameraDynamicOverrides {
  cameraMode?: CameraMode;
  timeSec?: number;
  reducedMotion?: boolean;
  heroArrowPos?: THREE.Vector3 | null;
  heroArrowActive?: boolean;
}

export function evaluateCinematicCamera(
  rawProgress: number,
  chariotZ: number,
  overrides?: CameraDynamicOverrides,
): CameraEvaluation {
  const p = clamp01(rawProgress);
  const wps = CINEMATIC_CAMERA_WAYPOINTS;

  let idx = 0;
  for (let i = 0; i < wps.length - 1; i++) {
    if (p >= wps[i].progress && p <= wps[i + 1].progress) {
      idx = i;
      break;
    }
    if (i === wps.length - 2) idx = i;
  }

  const a = wps[idx];
  const b = wps[Math.min(wps.length - 1, idx + 1)];
  const span = Math.max(0.0001, b.progress - a.progress);
  const linearT = clamp01((p - a.progress) / span);
  const t = linearT * linearT * (3 - 2 * linearT);

  const aPosZ = a.followChariot ? chariotZ + a.posZ : a.posZ;
  const bPosZ = b.followChariot ? chariotZ + b.posZ : b.posZ;
  const aTarZ = a.followChariot ? chariotZ + a.targetZ : a.targetZ;
  const bTarZ = b.followChariot ? chariotZ + b.targetZ : b.targetZ;

  let posX = smoothLerp(a.posX, b.posX, t);
  let posY = smoothLerp(a.posY, b.posY, t);
  let posZ = smoothLerp(aPosZ, bPosZ, t);
  let tarX = smoothLerp(a.targetX, b.targetX, t);
  let tarY = smoothLerp(a.targetY, b.targetY, t);
  let tarZ = smoothLerp(aTarZ, bTarZ, t);
  let fov = smoothLerp(a.fov, b.fov, t);
  let shotName = linearT < 0.5 ? a.shotName : b.shotName;

  // Dynamic camera refinements for arrow-flight-follow & mace duel orbit
  if (overrides && !overrides.reducedMotion) {
    const tSec = overrides.timeSec ?? 0;

    if (
      overrides.cameraMode === 'arrow-flight-follow' &&
      overrides.heroArrowActive &&
      overrides.heroArrowPos
    ) {
      const ap = overrides.heroArrowPos;
      // Smoothly blend camera behind the soaring golden arrow arc
      posX = smoothLerp(posX, ap.x + 1.85, 0.55);
      posY = smoothLerp(posY, Math.max(1.8, ap.y + 0.9), 0.55);
      posZ = smoothLerp(posZ, ap.z - 2.9, 0.55);
      tarX = smoothLerp(tarX, ap.x, 0.65);
      tarY = smoothLerp(tarY, ap.y, 0.65);
      tarZ = smoothLerp(tarZ, ap.z + 3.2, 0.65);
      fov = smoothLerp(fov, 44, 0.45);
      shotName = 'Dynamic Arrow Flight Tracking';
    } else if (overrides.cameraMode === 'duel-mace-bhima-duryodhana') {
      const orbitA = tSec * 0.28;
      posX = Math.sin(orbitA) * 5.8;
      posY = 2.45;
      posZ = 12.0 + Math.cos(orbitA) * 5.8;
      tarX = 0;
      tarY = 1.45;
      tarZ = 12.0;
    }
  }

  return {
    position: [posX, posY, posZ],
    target: [tarX, tarY, tarZ],
    fov,
    shotName,
  };
}
