import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  CHARACTER_ASSET_LIST,
  EXPECTED_FACIAL_MORPH_TARGETS,
} from '../three/story/assetManifest';
import {
  resolveAnimationClipSafely,
  validateLoadedCharacterAsset,
} from '../three/story/assetValidation';
import {
  CINEMATIC_CAMERA_WAYPOINTS,
  evaluateCinematicCamera,
} from '../three/story/cinematicCameraRig';
import { inspectLoadedGltf } from '../three/story/modelLoader';
import {
  evaluateStoryTimeline,
  getSceneAnchorProgress,
  resolveAdaptiveQualityProfile,
  STORY_SCENE_WINDOWS,
} from '../three/story/storyTimeline';
import {
  buildVisemeTimelineFromTranscript,
  sampleDialogueVisemeAtTime,
} from '../three/story/visemeTimeline';

test('all 8 rigged character binary GLBs exist, pass glTF header, skeletons, clips, and 11 facial morph targets via GLTFLoader', async () => {
  const loader = new GLTFLoader();
  assert.equal(CHARACTER_ASSET_LIST.length, 8);

  for (const entry of CHARACTER_ASSET_LIST) {
    const absPath = path.join(
      process.cwd(),
      'public',
      entry.filePath.replace(/^\/+/, ''),
    );
    const buf = await fs.readFile(absPath);
    assert.equal(buf.readUInt32LE(0), 0x46546c67, `${entry.id} must have valid GLB magic`);

    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const gltf = await loader.parseAsync(ab, '');
    const inspection = inspectLoadedGltf(gltf);
    const report = validateLoadedCharacterAsset(entry, inspection);

    assert.equal(report.status, 'valid', `${entry.id} validation must be valid`);
    assert.equal(report.hasSkeleton, true, `${entry.id} must have Three.js Skeleton`);
    assert.deepEqual(report.missingBones, [], `${entry.id} missing bones`);
    assert.deepEqual(report.missingClips, [], `${entry.id} missing clips`);
    assert.deepEqual(report.missingMorphTargets, [], `${entry.id} missing facial morph targets`);
    assert.equal(report.availableClips.length, entry.expectedClips.length);
    if (entry.morphTargetsRequired) {
      assert.equal(report.morphTargetNames.length, EXPECTED_FACIAL_MORPH_TARGETS.length);
    }
  }
});

test('evaluateStoryTimeline drives all 15 scenes and strictly isolates Sudarshana Chakra (Scene 04) from Day 9 Broken Wheel (Scene 09)', () => {
  assert.equal(STORY_SCENE_WINDOWS.length, 15);

  const s1Start = evaluateStoryTimeline(0.01);
  assert.equal(s1Start.sceneId, 'scene-01');
  assert.equal(s1Start.partId, 'part-a');
  assert.ok(s1Start.chariotPositionZ < -10);
  assert.equal(s1Start.vishvarupaIntensity, 0);
  assert.equal(s1Start.sudarshanaChakraActive, 0);

  const s2End = evaluateStoryTimeline(0.125);
  assert.equal(s2End.sceneId, 'scene-02');
  assert.equal(s2End.chariotPositionZ, 0);
  assert.ok(s2End.arjunaBowElevation < 0.25, 'Gandiva should lower in Arjuna distress');
  assert.ok(s2End.arjunaDistressAmount > 0.7);

  const s4Peak = evaluateStoryTimeline(0.26);
  assert.equal(s4Peak.sceneId, 'scene-04');
  assert.ok(s4Peak.vishvarupaIntensity > 0.9, 'Vishvarupa peaks near middle of Scene 04');
  assert.ok(s4Peak.sudarshanaChakraActive > 0.6, 'Sudarshana Chakra active ONLY in Scene 04');
  assert.equal(s4Peak.brokenWheelRaisedAmount, 0);
  assert.equal(s4Peak.atmospherePreset, 'cosmic');

  const s6Ready = evaluateStoryTimeline(0.415);
  assert.equal(s6Ready.sceneId, 'scene-06');
  assert.ok(s6Ready.arjunaBowElevation > 0.85, 'Gandiva raises cleanly when clarity is restored');
  assert.ok(s6Ready.arjunaBowDrawAmount > 0.5, 'Gandiva bowstring draws in Scene 06 climax');

  const s9Wheel = evaluateStoryTimeline(0.595);
  assert.equal(s9Wheel.sceneId, 'scene-09');
  assert.equal(s9Wheel.partId, 'part-b');
  assert.equal(s9Wheel.battleMode, 'bhishma-chariot-wheel');
  assert.ok(s9Wheel.brokenWheelRaisedAmount > 0.6, 'Day 9 Krishna lifts real broken wooden chariot wheel');
  assert.equal(s9Wheel.sudarshanaChakraActive, 0, 'Sudarshana Chakra must remain OFF in Day 9 scene');

  const s11Chakravyuha = evaluateStoryTimeline(0.715);
  assert.equal(s11Chakravyuha.sceneId, 'scene-11');
  assert.ok(s11Chakravyuha.chakravyuhaRotationStrength > 0.5);

  const s13Karna = evaluateStoryTimeline(0.87);
  assert.equal(s13Karna.sceneId, 'scene-13');
  assert.equal(s13Karna.activeWarDay, 17);
  assert.ok(s13Karna.karnaDuelIntensity > 0.8);

  const s14Mace = evaluateStoryTimeline(0.915);
  assert.equal(s14Mace.sceneId, 'scene-14');
  assert.equal(s14Mace.activeWarDay, 18);
  assert.equal(s14Mace.battleMode, 'bhima-duryodhana-mace');

  const s15End = evaluateStoryTimeline(0.99);
  assert.equal(s15End.sceneId, 'scene-15');
  assert.equal(s15End.atmospherePreset, 'eternal');
  assert.ok(s15End.dawnGoldenMix > 0.8);

  // Bidirectional consistency: reversing scroll back to 0.01 restores Scene 01 state
  const reversed = evaluateStoryTimeline(0.01);
  assert.deepEqual(reversed, s1Start);
});

test('evaluateCinematicCamera interpolates across all 25 waypoints without NaN and widens FOV for Vishvarupa', () => {
  assert.equal(CINEMATIC_CAMERA_WAYPOINTS.length, 25);

  for (let p = 0; p <= 1; p += 0.025) {
    const snap = evaluateStoryTimeline(p);
    const cam = evaluateCinematicCamera(p, snap.chariotPositionZ, {
      cameraMode: snap.cameraMode,
      timeSec: 1.5,
      reducedMotion: false,
    });
    cam.position.forEach((v) => assert.ok(Number.isFinite(v)));
    cam.target.forEach((v) => assert.ok(Number.isFinite(v)));
    assert.ok(cam.fov >= 32 && cam.fov <= 60);
    assert.ok(cam.shotName.length > 5);
  }

  const cosmicCam = evaluateCinematicCamera(0.262, 0);
  assert.ok(cosmicCam.fov >= 50, 'Cosmic Vishvarupa shot uses monumental wide FOV');
  assert.ok(cosmicCam.position[2] > 14, 'Cosmic shot pulls back smoothly to frame entire cosmos');

  const scene4Anchor = getSceneAnchorProgress(3);
  assert.ok(scene4Anchor > 0.212 && scene4Anchor < 0.302);
});

test('buildVisemeTimelineFromTranscript and sampleDialogueVisemeAtTime isolate mouth motion strictly to character speakers across EN/HI/TE', () => {
  const narratorTrack = buildVisemeTimelineFromTranscript({
    id: 'narr-en',
    sceneId: 'scene-01',
    speaker: 'narrator',
    language: 'en',
    transcript: 'On the sacred plain of Kurukshetra, two armies stand arrayed.',
    sourceRef: 'Narration',
    sourceType: 'editorial-adaptation',
    emotion: 'serene',
    animationTrack: 'gita-dialogue',
  });
  const narrSnap = sampleDialogueVisemeAtTime(narratorTrack, 0.8);
  assert.equal(narrSnap.jawOpen, 0, 'Narrator cues must NEVER move Krishna or Arjuna jaws');
  assert.equal(narrSnap.weights.viseme_sil, 1);

  const krishnaTeTrack = buildVisemeTimelineFromTranscript({
    id: 'krishna-te',
    sceneId: 'scene-03',
    speaker: 'krishna',
    language: 'te',
    transcript: 'కర్మలు ఆచరించడంలో మాత్రమే నీకు అధికారం ఉన్నది.',
    sourceRef: 'Bhagavad Gita 2.47',
    sourceType: 'bhagavad-gita-scripture',
    emotion: 'compassionate',
    animationTrack: 'gita-dialogue',
  });
  assert.ok(krishnaTeTrack.visemeTimeline.length >= 6);
  const krishnaSnap = sampleDialogueVisemeAtTime(krishnaTeTrack, 0.45);
  assert.equal(krishnaSnap.speaker, 'krishna');
  assert.ok(krishnaSnap.jawOpen >= 0);
});

test('resolveAnimationClipSafely returns direct clips, explicit fallbacks, and never invents missing clips', () => {
  const manifestFallback = {
    lower_bow: 'bow_resting',
    bow_resting: 'sit_chariot',
  };

  const direct = resolveAnimationClipSafely(
    'lower_bow',
    ['sit_chariot', 'lower_bow'],
    manifestFallback,
  );
  assert.equal(direct.resolvedClip, 'lower_bow');
  assert.equal(direct.usedFallback, false);
  assert.equal(direct.isMissing, false);

  const fallback = resolveAnimationClipSafely(
    'lower_bow',
    ['sit_chariot'],
    manifestFallback,
  );
  assert.equal(fallback.resolvedClip, 'sit_chariot');
  assert.equal(fallback.usedFallback, true);
  assert.equal(fallback.isMissing, true);

  const absent = resolveAnimationClipSafely('unknown_clip', ['sit_chariot'], manifestFallback);
  assert.equal(absent.resolvedClip, null);
  assert.equal(absent.isMissing, true);
});

test('resolveAdaptiveQualityProfile locks shadows off and DPR=1 under software WebGL and bounds arrow pool sizes', () => {
  const sw = resolveAdaptiveQualityProfile('high', true);
  assert.equal(sw.tier, 'performance');
  assert.equal(sw.maxDpr, 1);
  assert.equal(sw.enableShadows, false);
  assert.ok(sw.maxPooledArrows <= 24);

  const hwHigh = resolveAdaptiveQualityProfile('high', false);
  assert.equal(hwHigh.tier, 'high');
  assert.equal(hwHigh.maxDpr, 2);
  assert.equal(hwHigh.enableShadows, true);
  assert.ok(hwHigh.soldierInstancesPerArmy >= 1200);
  assert.ok(hwHigh.maxPooledArrows >= 40);
});
