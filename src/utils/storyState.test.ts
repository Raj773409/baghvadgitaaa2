import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_REGISTRY,
  MAHABHARATA_18_DAYS,
  STORY_SCENES,
} from '../content/storyContent';
import { STORY_ASSET_MANIFEST } from '../content/storyAssets';
import {
  advanceSceneElapsedMs,
  clampSceneIndex,
  computeStoryOverallProgressPct,
  createDefaultStoryProgress,
  deserializeStoryProgress,
  getActiveCueIndex,
  getNextSceneIndex,
  getPrevSceneIndex,
  parseStorySceneParam,
  recordSceneCompleted,
  recordSceneVisited,
  serializeStoryProgress,
  TOTAL_STORY_SCENES,
} from './storyState';

test('story dataset contains all 15 connected Bhagavad Gita & Mahabharata War sequences with strict provenance separation', () => {
  assert.equal(STORY_SCENES.length, 15);
  assert.equal(TOTAL_STORY_SCENES, 15);

  STORY_SCENES.forEach((scene, idx) => {
    assert.equal(scene.sceneNumber, idx + 1);
    assert.equal(scene.paddedCode, String(idx + 1).padStart(2, '0'));
    assert.ok(scene.title.en.trim().length > 3);
    assert.ok(scene.title.hi.trim().length > 3);
    assert.ok(scene.title.te.trim().length > 3);
    assert.ok(scene.cues.length >= 3, `Scene ${scene.id} must have >= 3 cues`);

    if (idx < 7) {
      assert.equal(scene.partId, 'part-a');
      assert.ok(scene.featuredVerses.length >= 1, `Part A scene ${scene.id} must cite canonical Gita verses`);
      for (const verse of scene.featuredVerses) {
        assert.equal(verse.editorialStatus, 'canonical-reference');
        assert.ok(verse.sanskritDevanagari.length > 10);
        assert.ok(verse.transliteration.length > 10);
        assert.ok(verse.translation.en.length > 10);
        assert.ok(verse.translation.hi.length > 10);
        assert.ok(verse.translation.te.length > 10);
      }
    } else {
      assert.equal(scene.partId, 'part-b');
      assert.equal(scene.featuredVerses.length, 0, `Part B scene ${scene.id} must not invent Bhagavad Gita shlokas`);
      assert.ok((scene.parvaCitation ?? '').includes('Mahabharata'), `Part B scene ${scene.id} must cite Mahabharata Parva`);
    }

    const asset = STORY_ASSET_MANIFEST[scene.id];
    assert.ok(asset, `Missing story asset entry for ${scene.id}`);
    assert.ok(asset.primaryImageSrc.startsWith('/assets/aistudio/'), 'Must use local asset manifest path');
    assert.equal(asset.sceneNumber, scene.sceneNumber);
  });
});

test('MAHABHARATA_18_DAYS covers all 18 Kurukshetra War Days cleanly and CHARACTER_REGISTRY spans key figures', () => {
  assert.equal(MAHABHARATA_18_DAYS.length, 18);
  MAHABHARATA_18_DAYS.forEach((rec, i) => {
    assert.equal(rec.day, i + 1);
    assert.ok(rec.linkedSceneIndex >= 7 && rec.linkedSceneIndex <= 14);
    assert.ok(rec.title.en.length > 3 && rec.title.hi.length > 3 && rec.title.te.length > 3);
  });
  assert.ok(CHARACTER_REGISTRY.length >= 12);
});

test('Scene 03 and Scene 05 expose structured teaching pillars and Scene 07 exposes enduring values', () => {
  const scene03 = STORY_SCENES[2];
  const scene05 = STORY_SCENES[4];
  const scene07 = STORY_SCENES[6];

  assert.ok((scene03.teachingPillars?.length ?? 0) >= 5);
  assert.ok((scene05.teachingPillars?.length ?? 0) >= 4);
  assert.equal(scene07.eternalValues?.length, 7);
});

test('story index clamping and prev/next navigation stay bounded across 0..14', () => {
  assert.equal(clampSceneIndex(-4), 0);
  assert.equal(clampSceneIndex(99), 14);
  assert.equal(clampSceneIndex(Number.NaN), 0);

  assert.equal(getPrevSceneIndex(0), null);
  assert.equal(getPrevSceneIndex(3), 2);
  assert.equal(getNextSceneIndex(14), null);
  assert.equal(getNextSceneIndex(6), 7);
});

test('advanceSceneElapsedMs applies playback speed accurately and signals completion', () => {
  const stepNormal = advanceSceneElapsedMs(0, 1000, 1, 10000);
  assert.equal(stepNormal.elapsedMs, 1000);
  assert.equal(stepNormal.completed, false);

  const stepFast = advanceSceneElapsedMs(4000, 2000, 1.5, 10000);
  assert.equal(stepFast.elapsedMs, 7000);
  assert.equal(stepFast.completed, false);

  const stepDone = advanceSceneElapsedMs(9500, 1000, 1, 10000);
  assert.equal(stepDone.elapsedMs, 10000);
  assert.equal(stepDone.completed, true);
});

test('cue timing and overall story progress calculations map linearly and stay bounded across 15 scenes', () => {
  assert.equal(getActiveCueIndex(0, 21000, 3), 0);
  assert.equal(getActiveCueIndex(7500, 21000, 3), 1);
  assert.equal(getActiveCueIndex(20999, 21000, 3), 2);

  assert.equal(Math.round(computeStoryOverallProgressPct(0, 0)), 0);
  assert.equal(Math.round(computeStoryOverallProgressPct(14, 1)), 100);
});

test('story progress serialization supports resume, revisit, and invalid storage fallback', () => {
  const validIds = STORY_SCENES.map((s) => s.id);
  let state = createDefaultStoryProgress('scene-01');
  state = recordSceneVisited(state, 11, 'scene-12');
  state = recordSceneCompleted(state, 'scene-01');

  const roundTrip = deserializeStoryProgress(serializeStoryProgress(state), validIds);
  assert.equal(roundTrip.currentSceneIndex, 11);
  assert.ok(roundTrip.visitedSceneIds.includes('scene-12'));
  assert.ok(roundTrip.completedSceneIds.includes('scene-01'));

  const corrupted = deserializeStoryProgress('{bad-json', validIds);
  assert.equal(corrupted.currentSceneIndex, 0);
  assert.deepEqual(corrupted.visitedSceneIds, ['scene-01']);
});

test('parseStorySceneParam resolves ?scene=1..15 query parameters safely', () => {
  assert.equal(parseStorySceneParam('?scene=1'), 0);
  assert.equal(parseStorySceneParam('?scene=4'), 3);
  assert.equal(parseStorySceneParam('?scene=9'), 8);
  assert.equal(parseStorySceneParam('?scene=12'), 11);
  assert.equal(parseStorySceneParam('?scene=15'), 14);
  assert.equal(parseStorySceneParam('?scene=0'), null);
  assert.equal(parseStorySceneParam('?scene=16'), null);
  assert.equal(parseStorySceneParam('?scene=abc'), null);
});
