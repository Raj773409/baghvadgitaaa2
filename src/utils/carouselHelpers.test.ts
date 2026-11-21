import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectSwipeDirection,
  formatSlideCounter,
  getAdjacentSlideIndices,
  getHorizontalSlideVectors,
  nextSlideIndex,
  normalizeSlideIndex,
  prevSlideIndex,
} from './carouselHelpers.ts';

describe('carouselHelpers', () => {
  it('normalizes and wraps carousel indices safely', () => {
    assert.equal(normalizeSlideIndex(0, 8), 0);
    assert.equal(normalizeSlideIndex(-1, 8), 7);
    assert.equal(normalizeSlideIndex(9, 8), 1);
    assert.equal(nextSlideIndex(7, 8), 0);
    assert.equal(prevSlideIndex(0, 8), 7);
  });

  it('computes adjacent slide indices for preloading', () => {
    assert.deepEqual(getAdjacentSlideIndices(0, 8), { prev: 7, current: 0, next: 1 });
    assert.deepEqual(getAdjacentSlideIndices(7, 8), { prev: 6, current: 7, next: 0 });
  });

  it('detects right-to-left and left-to-right touch swipes', () => {
    assert.equal(detectSwipeDirection(260, 180), 'next');
    assert.equal(detectSwipeDirection(180, 260), 'prev');
    assert.equal(detectSwipeDirection(200, 185), null);
  });

  it('formats two-digit slide indicators cleanly', () => {
    assert.equal(formatSlideCounter(0, 8), '01 / 08');
    assert.equal(formatSlideCounter(7, 8), '08 / 08');
  });

  it('calculates right-to-left transition vectors when advancing forward', () => {
    assert.deepEqual(getHorizontalSlideVectors('next'), {
      incomingStartXPercent: 100,
      outgoingEndXPercent: -100,
      parallaxOffsetPx: 26,
    });
    assert.deepEqual(getHorizontalSlideVectors('prev'), {
      incomingStartXPercent: -100,
      outgoingEndXPercent: 100,
      parallaxOffsetPx: -26,
    });
  });
});
