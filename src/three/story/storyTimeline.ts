import type { DialogueSpeakerId } from './visemeTimeline';

export type QualityTier = 'high' | 'balanced' | 'performance';

export type StoryPartId = 'part-a' | 'part-b';

export type BattleSequenceMode =
  | 'gita-dialogue'
  | 'battle-general'
  | 'bhishma-chariot-wheel'
  | 'bhishma-bed-of-arrows'
  | 'chakravyuha-abhimanyu'
  | 'night-ghatotkacha'
  | 'karna-arjuna-duel'
  | 'bhima-duryodhana-mace'
  | 'post-war-epilogue';

export type CameraMode =
  | 'wide-battlefield'
  | 'chariot-tracking'
  | 'over-the-shoulder'
  | 'dialogue-closeup'
  | 'arrow-flight-follow'
  | 'elevated-vantage'
  | 'vishvarupa-cosmic'
  | 'duel-hero-karna-arjuna'
  | 'duel-mace-bhima-duryodhana'
  | 'epilogue-horizon';

export interface StorySceneWindow {
  sceneIndex: number;
  sceneId: string;
  partId: StoryPartId;
  warDaysLabel: string;
  start: number;
  end: number;
}

/**
 * 15 Continuous Unified Story Sequences spanning [0.00 .. 1.00]:
 *   Part A (01..07): The Bhagavad Gita Dialogue
 *   Part B (08..15): The Mahabharata — All 18 War Days + Post-War Epilogue
 */
export const STORY_SCENE_WINDOWS: ReadonlyArray<StorySceneWindow> = [
  // PART A — THE BHAGAVAD GITA (0.00 -> 0.48)
  { sceneIndex: 0, sceneId: 'scene-01', partId: 'part-a', warDaysLabel: 'Gita Prelude · Day 1 Dawn', start: 0.0, end: 0.068 },
  { sceneIndex: 1, sceneId: 'scene-02', partId: 'part-a', warDaysLabel: 'Gita Ch. 1 · Dilemma', start: 0.068, end: 0.138 },
  { sceneIndex: 2, sceneId: 'scene-03', partId: 'part-a', warDaysLabel: 'Gita Ch. 2–6 · Teaching', start: 0.138, end: 0.212 },
  { sceneIndex: 3, sceneId: 'scene-04', partId: 'part-a', warDaysLabel: 'Gita Ch. 11 · Vishvarupa', start: 0.212, end: 0.302 },
  { sceneIndex: 4, sceneId: 'scene-05', partId: 'part-a', warDaysLabel: 'Gita Ch. 7–18 · Yogas', start: 0.302, end: 0.368 },
  { sceneIndex: 5, sceneId: 'scene-06', partId: 'part-a', warDaysLabel: 'Gita Ch. 18 · Clarity', start: 0.368, end: 0.424 },
  { sceneIndex: 6, sceneId: 'scene-07', partId: 'part-a', warDaysLabel: 'Gita Closing · Eternal Word', start: 0.424, end: 0.48 },

  // PART B — THE MAHABHARATA: THE GREAT WAR (0.48 -> 1.00)
  { sceneIndex: 7, sceneId: 'scene-08', partId: 'part-b', warDaysLabel: 'Days 1–4', start: 0.48, end: 0.545 },
  { sceneIndex: 8, sceneId: 'scene-09', partId: 'part-b', warDaysLabel: 'Days 5–9', start: 0.545, end: 0.615 },
  { sceneIndex: 9, sceneId: 'scene-10', partId: 'part-b', warDaysLabel: 'Day 10', start: 0.615, end: 0.68 },
  { sceneIndex: 10, sceneId: 'scene-11', partId: 'part-b', warDaysLabel: 'Days 11–13', start: 0.68, end: 0.748 },
  { sceneIndex: 11, sceneId: 'scene-12', partId: 'part-b', warDaysLabel: 'Day 14 (Day & Night)', start: 0.748, end: 0.815 },
  { sceneIndex: 12, sceneId: 'scene-13', partId: 'part-b', warDaysLabel: 'Days 15–17', start: 0.815, end: 0.885 },
  { sceneIndex: 13, sceneId: 'scene-14', partId: 'part-b', warDaysLabel: 'Day 18', start: 0.885, end: 0.945 },
  { sceneIndex: 14, sceneId: 'scene-15', partId: 'part-b', warDaysLabel: 'Post-War Epilogue', start: 0.945, end: 1.0 },
];

export type KrishnaAnimationState =
  | 'idle_breathing'
  | 'hold_reins'
  | 'look_at_arjuna'
  | 'turn_toward_arjuna'
  | 'teaching_gesture'
  | 'open_palm_gesture'
  | 'composed_presence'
  | 'standing_posture';

export type ArjunaAnimationState =
  | 'sit_chariot'
  | 'look_at_armies'
  | 'distressed_posture'
  | 'lower_bow'
  | 'bow_resting'
  | 'listen_to_krishna'
  | 'emotional_posture'
  | 'raise_bow'
  | 'ready_to_act'
  | 'composed_warrior'
  | 'draw_bow_shoot';

export type HorseAnimationState =
  | 'idle_breathing'
  | 'walk'
  | 'trot'
  | 'run'
  | 'coordinated_pull'
  | 'head_movement';

export type AtmospherePreset =
  | 'dawn'
  | 'dilemma'
  | 'teaching'
  | 'cosmic'
  | 'wisdom'
  | 'clarity'
  | 'eternal'
  | 'war-fury'
  | 'sunset-eclipse'
  | 'night-torches'
  | 'dusk-aftermath';

export interface StoryFrameSnapshot {
  masterProgress: number;
  sceneIndex: number;
  sceneId: string;
  partId: StoryPartId;
  sceneLocalProgress: number;
  cueIndex: number;
  activeWarDay: number; // 1..18 (or 18 during post-war epilogue)
  battleMode: BattleSequenceMode;
  activeSpeaker: DialogueSpeakerId;
  cameraMode: CameraMode;
  krishnaClip: KrishnaAnimationState;
  arjunaClip: ArjunaAnimationState;
  horsesClip: HorseAnimationState;
  krishnaTurnTowardArjuna: number;
  arjunaBowElevation: number;
  arjunaBowDrawAmount: number; // 0..1 string tension + arrow draw
  arjunaDistressAmount: number;
  chariotPositionZ: number;
  chariotSpeedFactor: number;
  vishvarupaIntensity: number;
  vishvarupaPhase: number;
  sudarshanaChakraActive: number; // 0..1 ONLY in Vishvarupa (BG 11.17 interpretation)
  brokenWheelRaisedAmount: number; // 0..1 ONLY in Bhishma Day 9 sequence (real wheel prop)
  chakravyuhaRotationStrength: number; // 0..1 in Day 13
  arrowVolleyIntensity: number; // 0..1 arrow volley + arrow cam activity
  maceDuelPhase: number; // 0..1 in Day 18 Bhima vs Duryodhana
  karnaDuelIntensity: number; // 0..1 in Days 16-17
  dawnGoldenMix: number;
  activeYogaIndex: number;
  atmospherePreset: AtmospherePreset;
  sunElevationDeg: number;
  fogDensity: number;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function getSceneAnchorProgress(sceneIndex: number): number {
  const safe = Math.max(
    0,
    Math.min(STORY_SCENE_WINDOWS.length - 1, Math.round(sceneIndex)),
  );
  const win = STORY_SCENE_WINDOWS[safe];
  if (safe === 0) return 0.012;
  let localOffset = 0.48;
  if (win.sceneId === 'scene-06') localOffset = 0.58;
  else if (win.sceneId === 'scene-09') localOffset = 0.82;
  else if (win.sceneId === 'scene-11') localOffset = 0.62;
  return win.start + (win.end - win.start) * localOffset;
}

export function evaluateStoryTimeline(rawProgress: number): StoryFrameSnapshot {
  const p = clamp01(rawProgress);

  let activeWindow = STORY_SCENE_WINDOWS[0];
  for (const win of STORY_SCENE_WINDOWS) {
    if (p >= win.start && (p < win.end || win.sceneIndex === STORY_SCENE_WINDOWS.length - 1)) {
      activeWindow = win;
      break;
    }
  }

  const local = clamp01(
    (p - activeWindow.start) / Math.max(0.0001, activeWindow.end - activeWindow.start),
  );
  const cueIndex = Math.min(2, Math.floor(local * 3));

  // Chariot advances from -14m into central dialogue staging (0m) during Part A
  // then maneuvers across combat distances in Part B
  let chariotPositionZ = 0;
  let chariotSpeedFactor = 0;
  if (p <= 0.48) {
    const chariotAdvance = smoothstep(0.02, 0.11, p);
    chariotPositionZ = -14 * (1 - chariotAdvance) || 0;
    chariotSpeedFactor = p >= 0.02 && p <= 0.11 ? 1 - Math.abs(chariotAdvance - 0.5) * 1.4 : 0;
  } else if (activeWindow.sceneId === 'scene-08') {
    chariotPositionZ = THREE_LERP(0, 6, smoothstep(0.1, 0.9, local));
    chariotSpeedFactor = 0.7;
  } else if (activeWindow.sceneId === 'scene-09') {
    chariotPositionZ = 6;
    chariotSpeedFactor = 0.35;
  } else if (activeWindow.sceneId === 'scene-13') {
    chariotPositionZ = THREE_LERP(2, 8, Math.sin(local * Math.PI) * 0.6);
    chariotSpeedFactor = 0.65;
  } else {
    chariotPositionZ = 0;
    chariotSpeedFactor = 0;
  }

  let activeWarDay = 1;
  let battleMode: BattleSequenceMode = 'gita-dialogue';
  let activeSpeaker: DialogueSpeakerId = 'narrator';
  let cameraMode: CameraMode = 'chariot-tracking';
  let krishnaClip: KrishnaAnimationState = 'hold_reins';
  let arjunaClip: ArjunaAnimationState = 'sit_chariot';
  let horsesClip: HorseAnimationState = 'idle_breathing';
  let krishnaTurnTowardArjuna = 0;
  let arjunaBowElevation = 0.72;
  let arjunaBowDrawAmount = 0;
  let arjunaDistressAmount = 0;
  let vishvarupaIntensity = 0;
  let vishvarupaPhase = 0;
  let sudarshanaChakraActive = 0;
  let brokenWheelRaisedAmount = 0;
  let chakravyuhaRotationStrength = 0;
  let arrowVolleyIntensity = 0;
  let maceDuelPhase = 0;
  let karnaDuelIntensity = 0;
  let dawnGoldenMix = 0;
  let activeYogaIndex = 0;
  let atmospherePreset: AtmospherePreset = 'dawn';
  let sunElevationDeg = 11;
  let fogDensity = 0.011;

  switch (activeWindow.sceneId) {
    case 'scene-01': {
      atmospherePreset = 'dawn';
      cameraMode = local < 0.5 ? 'wide-battlefield' : 'chariot-tracking';
      activeSpeaker = cueIndex === 2 ? 'narrator' : 'narrator';
      horsesClip = local > 0.3 ? 'walk' : 'idle_breathing';
      krishnaClip = local > 0.75 ? 'look_at_arjuna' : 'hold_reins';
      arjunaClip = local > 0.65 ? 'look_at_armies' : 'sit_chariot';
      krishnaTurnTowardArjuna = smoothstep(0.75, 1.0, local) * 0.45;
      arjunaBowElevation = 0.75;
      sunElevationDeg = 8 + local * 5;
      fogDensity = 0.013 - local * 0.002;
      break;
    }
    case 'scene-02': {
      atmospherePreset = 'dilemma';
      cameraMode = local < 0.45 ? 'over-the-shoulder' : 'dialogue-closeup';
      activeSpeaker = cueIndex === 2 ? 'arjuna' : 'narrator';
      horsesClip = local < 0.45 ? 'trot' : 'head_movement';
      krishnaClip = local < 0.45 ? 'hold_reins' : 'look_at_arjuna';
      krishnaTurnTowardArjuna = 0.45 + smoothstep(0.45, 0.9, local) * 0.35;
      arjunaDistressAmount = smoothstep(0.3, 0.88, local);
      arjunaBowElevation = 0.72 * (1 - smoothstep(0.45, 0.92, local));
      if (local < 0.38) arjunaClip = 'look_at_armies';
      else if (local < 0.68) arjunaClip = 'distressed_posture';
      else if (local < 0.88) arjunaClip = 'lower_bow';
      else arjunaClip = 'bow_resting';
      sunElevationDeg = 13 - local * 2;
      fogDensity = 0.011 + arjunaDistressAmount * 0.003;
      break;
    }
    case 'scene-03': {
      atmospherePreset = 'teaching';
      cameraMode = 'dialogue-closeup';
      activeSpeaker = cueIndex === 1 || cueIndex === 2 ? 'krishna' : 'narrator';
      horsesClip = 'idle_breathing';
      krishnaTurnTowardArjuna = 0.85 + smoothstep(0.0, 0.3, local) * 0.15;
      if (local < 0.25) krishnaClip = 'turn_toward_arjuna';
      else if (local < 0.72) krishnaClip = 'teaching_gesture';
      else krishnaClip = 'open_palm_gesture';
      arjunaClip = local < 0.25 ? 'emotional_posture' : 'listen_to_krishna';
      arjunaBowElevation = 0.08;
      arjunaDistressAmount = Math.max(0.25, 0.95 - local * 0.55);
      sunElevationDeg = 14 + local * 4;
      fogDensity = 0.01;
      break;
    }
    case 'scene-04': {
      atmospherePreset = 'cosmic';
      cameraMode = 'vishvarupa-cosmic';
      vishvarupaPhase = local;
      const rise = smoothstep(0.12, 0.44, local);
      const returnBack = 1 - smoothstep(0.84, 1.0, local);
      vishvarupaIntensity = clamp01(rise * returnBack);
      // Sudarshana Chakra appears ONLY inside Vishvarupa revelation (BG 11.17 symbolic context)
      sudarshanaChakraActive = clamp01(smoothstep(0.28, 0.55, local) * returnBack);
      activeSpeaker = cueIndex === 1 ? 'krishna' : cueIndex === 2 ? 'arjuna' : 'narrator';
      horsesClip = 'idle_breathing';
      krishnaClip = vishvarupaIntensity > 0.25 ? 'composed_presence' : 'standing_posture';
      krishnaTurnTowardArjuna = 0.7;
      arjunaClip = local > 0.68 && local < 0.92 ? 'emotional_posture' : 'listen_to_krishna';
      arjunaBowElevation = 0.05;
      sunElevationDeg = 16 * (1 - vishvarupaIntensity) + 2 * vishvarupaIntensity;
      fogDensity = 0.009 * (1 - vishvarupaIntensity) + 0.004 * vishvarupaIntensity;
      break;
    }
    case 'scene-05': {
      atmospherePreset = 'wisdom';
      cameraMode = 'dialogue-closeup';
      activeYogaIndex = Math.min(3, Math.floor(local * 4));
      activeSpeaker = cueIndex === 1 ? 'krishna' : 'narrator';
      horsesClip = 'idle_breathing';
      krishnaClip = activeYogaIndex % 2 === 0 ? 'teaching_gesture' : 'open_palm_gesture';
      krishnaTurnTowardArjuna = 0.9;
      arjunaClip = 'listen_to_krishna';
      arjunaBowElevation = 0.25 + local * 0.25;
      sunElevationDeg = 18;
      fogDensity = 0.009;
      break;
    }
    case 'scene-06': {
      atmospherePreset = 'clarity';
      cameraMode = local > 0.65 ? 'arrow-flight-follow' : 'dialogue-closeup';
      activeSpeaker = cueIndex === 1 ? 'arjuna' : 'krishna';
      horsesClip = 'coordinated_pull';
      krishnaClip = 'composed_presence';
      krishnaTurnTowardArjuna = 0.65 * (1 - smoothstep(0.6, 1.0, local));
      arjunaBowElevation = 0.35 + smoothstep(0.25, 0.75, local) * 0.65;
      arjunaBowDrawAmount = smoothstep(0.55, 0.95, local);
      arrowVolleyIntensity = local > 0.75 ? 0.35 : 0;
      if (local < 0.3) arjunaClip = 'listen_to_krishna';
      else if (local < 0.65) arjunaClip = 'raise_bow';
      else if (local < 0.86) arjunaClip = 'draw_bow_shoot';
      else arjunaClip = 'composed_warrior';
      sunElevationDeg = 20 + local * 4;
      fogDensity = 0.008;
      break;
    }
    case 'scene-07': {
      atmospherePreset = 'eternal';
      cameraMode = 'epilogue-horizon';
      activeSpeaker = cueIndex === 1 ? 'krishna' : 'narrator';
      dawnGoldenMix = smoothstep(0.08, 0.85, local);
      horsesClip = 'walk';
      krishnaClip = 'composed_presence';
      krishnaTurnTowardArjuna = 0.15;
      arjunaClip = 'ready_to_act';
      arjunaBowElevation = 0.9;
      sunElevationDeg = 24 + dawnGoldenMix * 8;
      fogDensity = 0.007 - dawnGoldenMix * 0.002;
      break;
    }

    // PART B: THE MAHABHARATA — ALL 18 WAR DAYS + POST-WAR EPILOGUE
    case 'scene-08': {
      // Days 1–4: Opening formations & elephant/cavalry charges
      activeWarDay = Math.min(4, 1 + Math.floor(local * 4));
      battleMode = 'battle-general';
      atmospherePreset = 'war-fury';
      cameraMode = local > 0.55 ? 'arrow-flight-follow' : 'wide-battlefield';
      activeSpeaker = cueIndex === 1 ? 'arjuna' : 'narrator';
      horsesClip = 'trot';
      krishnaClip = 'hold_reins';
      arjunaClip = local > 0.4 ? 'draw_bow_shoot' : 'ready_to_act';
      arjunaBowElevation = 1.0;
      arjunaBowDrawAmount = 0.5 + 0.5 * Math.sin(local * Math.PI * 3);
      arrowVolleyIntensity = 0.85;
      sunElevationDeg = 28;
      fogDensity = 0.01;
      break;
    }
    case 'scene-09': {
      // Days 5–9: Bhishma's fierce command + Day 9 Chariot Wheel Incident
      activeWarDay = Math.min(9, 5 + Math.floor(local * 5));
      battleMode = local > 0.45 ? 'bhishma-chariot-wheel' : 'battle-general';
      atmospherePreset = 'war-fury';
      cameraMode = local > 0.45 ? 'chariot-tracking' : 'elevated-vantage';
      activeSpeaker = cueIndex === 1 ? 'arjuna' : cueIndex === 2 ? 'krishna' : 'narrator';
      horsesClip = 'run';
      // Krishna lifts ONLY the broken chariot wheel prop (distinct from Sudarshana Chakra)
      brokenWheelRaisedAmount = smoothstep(0.45, 0.68, local);
      krishnaClip = local > 0.48 ? 'standing_posture' : 'hold_reins';
      arjunaClip = local > 0.65 ? 'listen_to_krishna' : 'draw_bow_shoot';
      arjunaBowElevation = 0.92;
      arjunaBowDrawAmount = local < 0.5 ? 0.6 : 0;
      arrowVolleyIntensity = 0.72;
      sunElevationDeg = 22;
      fogDensity = 0.012;
      break;
    }
    case 'scene-10': {
      // Day 10: Fall of Pitamaha Bhishma on the Bed of Arrows
      activeWarDay = 10;
      battleMode = 'bhishma-bed-of-arrows';
      atmospherePreset = 'dusk-aftermath';
      cameraMode = local < 0.4 ? 'arrow-flight-follow' : 'elevated-vantage';
      activeSpeaker = cueIndex === 1 ? 'bhishma' : 'narrator';
      horsesClip = 'idle_breathing';
      krishnaClip = 'composed_presence';
      krishnaTurnTowardArjuna = 0.4;
      arjunaClip = local < 0.45 ? 'draw_bow_shoot' : 'composed_warrior';
      arjunaBowElevation = local < 0.45 ? 1.0 : 0.35;
      arjunaBowDrawAmount = local < 0.45 ? 0.85 : 0;
      arrowVolleyIntensity = local < 0.45 ? 0.9 : 0.1;
      sunElevationDeg = 12;
      fogDensity = 0.011;
      break;
    }
    case 'scene-11': {
      // Days 11–13: Drona's Command & Day 13 Chakravyuha (Abhimanyu)
      activeWarDay = local < 0.3 ? 11 : local < 0.55 ? 12 : 13;
      battleMode = 'chakravyuha-abhimanyu';
      atmospherePreset = 'war-fury';
      cameraMode = local > 0.35 ? 'elevated-vantage' : 'wide-battlefield';
      activeSpeaker = 'narrator';
      horsesClip = 'trot';
      krishnaClip = 'hold_reins';
      arjunaClip = 'ready_to_act';
      arjunaBowElevation = 0.95;
      chakravyuhaRotationStrength = smoothstep(0.15, 0.5, local);
      arrowVolleyIntensity = 0.78;
      sunElevationDeg = 25;
      fogDensity = 0.011;
      break;
    }
    case 'scene-12': {
      // Day 14: Vow of Jayadratha + Night Battle of Ghatotkacha
      activeWarDay = 14;
      battleMode = 'night-ghatotkacha';
      const nightPhase = smoothstep(0.45, 0.72, local);
      atmospherePreset = nightPhase > 0.5 ? 'night-torches' : 'sunset-eclipse';
      cameraMode = nightPhase > 0.5 ? 'wide-battlefield' : 'arrow-flight-follow';
      activeSpeaker = cueIndex === 0 ? 'krishna' : cueIndex === 1 ? 'arjuna' : 'narrator';
      horsesClip = 'run';
      krishnaClip = 'open_palm_gesture';
      arjunaClip = 'draw_bow_shoot';
      arjunaBowElevation = 1.0;
      arjunaBowDrawAmount = 0.75;
      arrowVolleyIntensity = 0.92;
      sunElevationDeg = Math.max(1.5, 10 * (1 - nightPhase));
      fogDensity = 0.013;
      break;
    }
    case 'scene-13': {
      // Days 15–17: Fall of Drona & Epic Duel of Karna vs Arjuna
      activeWarDay = local < 0.25 ? 15 : local < 0.5 ? 16 : 17;
      battleMode = 'karna-arjuna-duel';
      atmospherePreset = 'sunset-eclipse';
      cameraMode = 'duel-hero-karna-arjuna';
      activeSpeaker = cueIndex === 1 ? 'karna' : cueIndex === 2 ? 'krishna' : 'arjuna';
      horsesClip = 'coordinated_pull';
      krishnaClip = 'look_at_arjuna';
      krishnaTurnTowardArjuna = 0.6;
      arjunaClip = 'draw_bow_shoot';
      arjunaBowElevation = 1.0;
      arjunaBowDrawAmount = 0.65 + 0.35 * Math.sin(local * Math.PI * 2.5);
      karnaDuelIntensity = clamp01(smoothstep(0.15, 0.4, local));
      arrowVolleyIntensity = 0.95;
      sunElevationDeg = 14;
      fogDensity = 0.01;
      break;
    }
    case 'scene-14': {
      // Day 18: Shalya's Fall & Final Mace Duel of Bhima vs Duryodhana
      activeWarDay = 18;
      battleMode = 'bhima-duryodhana-mace';
      atmospherePreset = 'dusk-aftermath';
      cameraMode = 'duel-mace-bhima-duryodhana';
      activeSpeaker = cueIndex === 0 ? 'duryodhana' : 'narrator';
      horsesClip = 'idle_breathing';
      krishnaClip = 'composed_presence';
      arjunaClip = 'composed_warrior';
      arjunaBowElevation = 0.35;
      maceDuelPhase = local;
      sunElevationDeg = 11;
      fogDensity = 0.011;
      break;
    }
    case 'scene-15': {
      // Post-War Epilogue: Night Raid, Sorrow & Yudhishthira's Dharmic Reign
      activeWarDay = 18;
      battleMode = 'post-war-epilogue';
      atmospherePreset = 'eternal';
      cameraMode = 'epilogue-horizon';
      activeSpeaker = cueIndex === 1 ? 'krishna' : 'narrator';
      dawnGoldenMix = smoothstep(0.15, 0.9, local);
      horsesClip = 'idle_breathing';
      krishnaClip = 'composed_presence';
      krishnaTurnTowardArjuna = 0.3;
      arjunaClip = 'listen_to_krishna';
      arjunaBowElevation = 0.15;
      sunElevationDeg = 9 + dawnGoldenMix * 16;
      fogDensity = 0.008;
      break;
    }
  }

  return {
    masterProgress: p,
    sceneIndex: activeWindow.sceneIndex,
    sceneId: activeWindow.sceneId,
    partId: activeWindow.partId,
    sceneLocalProgress: local,
    cueIndex,
    activeWarDay,
    battleMode,
    activeSpeaker,
    cameraMode,
    krishnaClip,
    arjunaClip,
    horsesClip,
    krishnaTurnTowardArjuna,
    arjunaBowElevation,
    arjunaBowDrawAmount,
    arjunaDistressAmount,
    chariotPositionZ,
    chariotSpeedFactor,
    vishvarupaIntensity,
    vishvarupaPhase,
    sudarshanaChakraActive,
    brokenWheelRaisedAmount,
    chakravyuhaRotationStrength,
    arrowVolleyIntensity,
    maceDuelPhase,
    karnaDuelIntensity,
    dawnGoldenMix,
    activeYogaIndex,
    atmospherePreset,
    sunElevationDeg,
    fogDensity,
  };
}

function THREE_LERP(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface QualityProfileConfig {
  tier: QualityTier;
  maxDpr: number;
  enableShadows: boolean;
  shadowMapSize: number;
  soldierInstancesPerArmy: number;
  dustParticleCount: number;
  vishvarupaStarCount: number;
  bannerCount: number;
  maxPooledArrows: number;
  cavalryPerArmy: number;
  elephantsPerArmy: number;
}

export function resolveAdaptiveQualityProfile(
  tier: QualityTier,
  isSoftwareGl: boolean,
): QualityProfileConfig {
  if (isSoftwareGl || tier === 'performance') {
    return {
      tier: isSoftwareGl ? 'performance' : tier,
      maxDpr: 1,
      enableShadows: false,
      shadowMapSize: 512,
      soldierInstancesPerArmy: 450,
      dustParticleCount: 220,
      vishvarupaStarCount: 320,
      bannerCount: 16,
      maxPooledArrows: 24,
      cavalryPerArmy: 14,
      elephantsPerArmy: 4,
    };
  }

  if (tier === 'balanced') {
    return {
      tier,
      maxDpr: 1.5,
      enableShadows: true,
      shadowMapSize: 1024,
      soldierInstancesPerArmy: 950,
      dustParticleCount: 450,
      vishvarupaStarCount: 650,
      bannerCount: 28,
      maxPooledArrows: 36,
      cavalryPerArmy: 24,
      elephantsPerArmy: 6,
    };
  }

  return {
    tier: 'high',
    maxDpr: 2,
    enableShadows: true,
    shadowMapSize: 2048,
    soldierInstancesPerArmy: 1600,
    dustParticleCount: 850,
    vishvarupaStarCount: 1100,
    bannerCount: 40,
    maxPooledArrows: 48,
    cavalryPerArmy: 32,
    elephantsPerArmy: 8,
  };
}
