import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVoiceCacheKey,
  clampPlaybackRate,
  clampVolume,
  getActiveSegmentIndex,
  normalizeVoiceLang,
  splitNarrationSegments,
  VOICE_PERSONAS,
} from './voiceAssistant.ts';

describe('voiceAssistant', () => {
  it('defines Aoede female and Charon male personas for Indian narration', () => {
    assert.equal(VOICE_PERSONAS.female.geminiVoiceName, 'Aoede');
    assert.equal(VOICE_PERSONAS.male.geminiVoiceName, 'Charon');
  });

  it('clamps playback speed and volume safely', () => {
    assert.equal(clampPlaybackRate(0.2), 0.75);
    assert.equal(clampPlaybackRate(2.5), 1.5);
    assert.equal(clampPlaybackRate(1.25), 1.25);
    assert.equal(clampVolume(-0.4), 0);
    assert.equal(clampVolume(1.8), 1);
  });

  it('splits Sanskrit and multilingual narration into clean caption lines', () => {
    const segs = splitNarrationSegments(
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    );
    assert.equal(segs.length, 2);
  });

  it('calculates proportional active caption index across audio duration', () => {
    const segs = ['Short', 'A much longer line for recitation timing'];
    assert.equal(getActiveSegmentIndex(segs, 0, 10), 0);
    assert.equal(getActiveSegmentIndex(segs, 5, 10), 1);
    assert.equal(getActiveSegmentIndex(segs, 10, 10), 1);
  });

  it('normalizes languages and cache keys safely', () => {
    assert.equal(normalizeVoiceLang('te'), 'te');
    assert.equal(normalizeVoiceLang('fr'), 'en');
    assert.equal(
      buildVoiceCacheKey({ trackId: 'ch-2/verse:47', lang: 'sa', gender: 'female' }),
      'ch-2_verse_47-sa-female.wav',
    );
  });
});
