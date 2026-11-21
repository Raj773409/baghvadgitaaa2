import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_WELCOME_PREFERENCES,
  deserializeWelcomePreferences,
  getActiveNarrationCaption,
  getWelcomeNarrationScript,
  getWelcomeSceneAtTime,
  resolveWelcomeNarrationLocale,
  serializeWelcomePreferences,
  shouldShowWelcomeOnLoad,
  WELCOME_SCENES,
  WELCOME_TOTAL_DURATION_SEC,
} from './welcomeExperience';

test('WELCOME_SCENES spans 6 contiguous scenes across ~16.8 seconds', () => {
  assert.equal(WELCOME_SCENES.length, 6);
  assert.equal(WELCOME_SCENES[0].id, 'awakening');
  assert.equal(WELCOME_SCENES[5].id, 'homepage-transition');
  assert.equal(WELCOME_SCENES[0].startSec, 0);
  assert.equal(WELCOME_SCENES[5].endSec, WELCOME_TOTAL_DURATION_SEC);
  assert.ok(WELCOME_TOTAL_DURATION_SEC >= 15 && WELCOME_TOTAL_DURATION_SEC <= 18);

  for (let i = 1; i < WELCOME_SCENES.length; i += 1) {
    assert.equal(
      WELCOME_SCENES[i].startSec,
      WELCOME_SCENES[i - 1].endSec,
      `Scene ${WELCOME_SCENES[i].id} must seamlessly follow ${WELCOME_SCENES[i - 1].id}`,
    );
  }
});

test('getWelcomeSceneAtTime resolves every scene and local progress deterministically', () => {
  const s1 = getWelcomeSceneAtTime(0.5);
  assert.equal(s1.scene.id, 'awakening');
  assert.ok(s1.sceneLocalProgress > 0 && s1.sceneLocalProgress < 1);

  const s2 = getWelcomeSceneAtTime(3.2);
  assert.equal(s2.scene.id, 'temple-entrance');

  const s3 = getWelcomeSceneAtTime(6.8);
  assert.equal(s3.scene.id, 'sacred-light');

  const s4 = getWelcomeSceneAtTime(10.2);
  assert.equal(s4.scene.id, 'voice-welcome');

  const s5 = getWelcomeSceneAtTime(14.5);
  assert.equal(s5.scene.id, 'grand-title');

  const s6 = getWelcomeSceneAtTime(16.2);
  assert.equal(s6.scene.id, 'homepage-transition');

  const clampedMax = getWelcomeSceneAtTime(999);
  assert.equal(clampedMax.scene.id, 'homepage-transition');
  assert.equal(clampedMax.normalizedProgress, 1);
  assert.equal(clampedMax.sceneLocalProgress, 1);
});

test('shouldShowWelcomeOnLoad respects first-visit, returning-visitor, session, and query overrides', () => {
  // First-time visitor
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: false, localVisited: false, search: '' }),
    true,
  );

  // Returning visitor or intra-session revisit
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: true, localVisited: false, search: '' }),
    false,
  );
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: false, localVisited: true, search: '' }),
    false,
  );

  // Query overrides
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: true, localVisited: true, search: '?welcome=1' }),
    true,
  );
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: true, localVisited: true, search: '?replayWelcome=true' }),
    true,
  );
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: false, localVisited: false, search: '?skipIntro=1' }),
    false,
  );
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: false, localVisited: false, search: '?welcome=0' }),
    false,
  );
  assert.equal(
    shouldShowWelcomeOnLoad({ sessionSeen: false, localVisited: false, search: '?welcome=false' }),
    false,
  );
});

test('welcome preferences serialize and deserialize safely across malformed inputs', () => {
  assert.deepEqual(deserializeWelcomePreferences(null), DEFAULT_WELCOME_PREFERENCES);
  assert.deepEqual(deserializeWelcomePreferences('{invalid-json'), DEFAULT_WELCOME_PREFERENCES);

  const encoded = serializeWelcomePreferences({
    soundMuted: true,
    reducedMotionOverride: true,
  });
  assert.deepEqual(deserializeWelcomePreferences(encoded), {
    soundMuted: true,
    reducedMotionOverride: true,
  });
});

test('multilingual narration scripts cover TE, EN, and HI with exact copy and captions', () => {
  const teScript = getWelcomeNarrationScript('te');
  assert.ok(teScript.fullText.includes('భగవద్గీత విశ్వ మహోత్సవం 2027కు హృదయపూర్వక స్వాగతం.'));
  assert.ok(teScript.fullText.includes('శాశ్వత జ్ఞానం'));
  assert.equal(teScript.audioUrl, '/audio/welcome-te.wav');

  const enScript = getWelcomeNarrationScript('en');
  assert.ok(enScript.fullText.includes('With great joy, we welcome you to Bhagavad Gita Vishwa Mahotsav 2027.'));
  assert.equal(enScript.audioUrl, '/audio/welcome-en.wav');

  const hiScript = getWelcomeNarrationScript('hi');
  assert.ok(hiScript.fullText.includes('भगवद्गीता विश्व महोत्सव २०२७'));
  assert.equal(hiScript.audioUrl, '/audio/welcome-hi.wav');

  assert.equal(resolveWelcomeNarrationLocale('fr'), 'en');
  assert.equal(resolveWelcomeNarrationLocale('te'), 'te');
  assert.equal(resolveWelcomeNarrationLocale('hi'), 'hi');

  const firstCaption = getActiveNarrationCaption(teScript, 0.1);
  const secondCaption = getActiveNarrationCaption(teScript, 0.75);
  assert.notEqual(firstCaption, secondCaption);
  assert.ok(firstCaption.length > 10);
  assert.ok(secondCaption.length > 10);
});
