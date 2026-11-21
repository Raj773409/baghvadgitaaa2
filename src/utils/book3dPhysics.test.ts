import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampBookFontScale,
  clampChapterNumber,
  computePageCurlDisplacement,
  computeReadingProgressPercent,
  easeInOutCubic,
  loadBookmarks,
  saveBookmarks,
  toggleChapterBookmark,
} from './book3dPhysics.ts';

describe('book3dPhysics', () => {
  it('computes smooth cubic easing bounds', () => {
    assert.equal(easeInOutCubic(0), 0);
    assert.equal(easeInOutCubic(0.5), 0.5);
    assert.equal(easeInOutCubic(1), 1);
  });

  it('produces zero arch lift at rest and positive belly lift mid-turn', () => {
    const start = computePageCurlDisplacement(0.5, 0, 'next');
    const mid = computePageCurlDisplacement(0.5, 0.5, 'next');
    const end = computePageCurlDisplacement(0.5, 1, 'next');

    assert.equal(Math.round(start.archLift * 1000), 0);
    assert.ok(mid.archLift > 0.05);
    assert.ok(Math.abs(end.angleRad - Math.PI) < 0.001);
  });

  it('calculates chapter bounds and reading progress', () => {
    assert.equal(clampChapterNumber(0), 1);
    assert.equal(clampChapterNumber(24), 18);
    assert.equal(computeReadingProgressPercent(1), 6);
    assert.equal(computeReadingProgressPercent(9), 50);
    assert.equal(computeReadingProgressPercent(18), 100);
  });

  it('toggles, sorts, and persists bookmarks safely', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };
    let marks = toggleChapterBookmark([], 12);
    marks = toggleChapterBookmark(marks, 2);
    assert.deepEqual(marks, [2, 12]);
    saveBookmarks(storage, marks);
    assert.deepEqual(loadBookmarks(storage), [2, 12]);
    marks = toggleChapterBookmark(marks, 2);
    assert.deepEqual(marks, [12]);
  });

  it('clamps book typography scale cleanly', () => {
    assert.equal(clampBookFontScale(0.5), 0.85);
    assert.equal(clampBookFontScale(2), 1.4);
    assert.equal(clampBookFontScale(1.15), 1.15);
  });
});
