import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_ETERNAL_QUOTE } from '../content/eventContent';
import { CHAPTER_KEY_RECITATIONS, getChapterRecitation } from '../content/chapterRecitations';
import { HERO_PROGRESS_SECTIONS } from '../content/navigationContent';
import {
  CHAPTER_ENTRY_BASE_DELAY_MS,
  CHAPTER_ENTRY_STAGGER_MS,
  TOTAL_CHAPTERS,
  buildChapterIndex,
  clampChapterNumber,
  getChapterAngleDeg,
  getChapterMarkerAnimationSpec,
  polarPoint,
} from './chapters';

test('buildChapterIndex creates 18 unique numbered chapters with no fabricated scripture or titles', () => {
  const chapters = buildChapterIndex();
  assert.equal(chapters.length, TOTAL_CHAPTERS);
  assert.equal(new Set(chapters.map((c) => c.chapterNumber)).size, TOTAL_CHAPTERS);
  assert.equal(chapters[0].paddedCode, '01');
  assert.equal(chapters[0].romanNumeral, 'I');
  assert.equal(chapters[17].paddedCode, '18');
  assert.equal(chapters[17].romanNumeral, 'XVIII');

  for (const ch of chapters) {
    assert.equal(ch.approvedTitle, null);
    assert.equal(ch.approvedDescription, null);
    assert.equal(ch.verifiedSanskritVerse, null);
    assert.equal(ch.verifiedTranslation, null);
    assert.equal(ch.approvedCommentary, null);
  }
  assert.equal(APPROVED_ETERNAL_QUOTE, null);
});

test('getChapterAngleDeg distributes 18 chapters evenly at 20-degree intervals from -90 deg', () => {
  assert.equal(getChapterAngleDeg(1), -90);
  assert.equal(getChapterAngleDeg(10), 90);
  assert.equal(getChapterAngleDeg(18), 250);
  assert.equal(clampChapterNumber(0), 1);
  assert.equal(clampChapterNumber(99), 18);
});

test('polarPoint computes deterministic coordinates on radial perimeter', () => {
  const top = polarPoint(200, 200, 100, -90);
  assert.equal(top.x, 200);
  assert.equal(top.y, 100);

  const bottom = polarPoint(200, 200, 100, 90);
  assert.equal(bottom.x, 200);
  assert.equal(bottom.y, 300);
});

test('getChapterMarkerAnimationSpec sequences markers monotonically when motion is allowed and disables motion under reduced-motion', () => {
  const fullMotionSpecs = Array.from({ length: TOTAL_CHAPTERS }, (_, idx) =>
    getChapterMarkerAnimationSpec(idx, false),
  );

  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    assert.equal(fullMotionSpecs[i].shouldAnimate, true);
    assert.equal(
      fullMotionSpecs[i].delayMs,
      CHAPTER_ENTRY_BASE_DELAY_MS + i * CHAPTER_ENTRY_STAGGER_MS,
    );
    assert.equal(fullMotionSpecs[i].fromOpacity, 0);
    assert.equal(fullMotionSpecs[i].toOpacity, 1);
    if (i > 0) {
      assert.ok(fullMotionSpecs[i].delayMs > fullMotionSpecs[i - 1].delayMs);
    }
  }

  const reducedFirst = getChapterMarkerAnimationSpec(0, true);
  const reducedLast = getChapterMarkerAnimationSpec(17, true);
  assert.equal(reducedFirst.shouldAnimate, false);
  assert.equal(reducedFirst.delayMs, 0);
  assert.equal(reducedFirst.durationMs, 0);
  assert.equal(reducedFirst.fromScale, 1);
  assert.equal(reducedFirst.toScale, 1);
  assert.deepEqual(reducedFirst, reducedLast);
});

test('all 18 chapters include authentic key Sanskrit recitation verses and localized meanings', () => {
  assert.equal(CHAPTER_KEY_RECITATIONS.length, TOTAL_CHAPTERS);
  const refs = new Set<string>();
  for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
    const entry = getChapterRecitation(ch);
    assert.equal(entry.chapterNumber, ch);
    assert.ok(entry.verseReference.startsWith(`Bhagavad Gita ${ch}.`));
    assert.ok(entry.sanskritDevanagari.trim().length > 15);
    assert.ok(entry.transliteration.trim().length > 15);
    assert.ok(entry.meaning.en.trim().length > 15);
    assert.ok(entry.meaning.hi.trim().length > 15);
    assert.ok(entry.meaning.te.trim().length > 15);
    refs.add(entry.verseReference);
  }
  assert.equal(refs.size, TOTAL_CHAPTERS);
  assert.equal(getChapterRecitation(0).chapterNumber, 1);
  assert.equal(getChapterRecitation(99).chapterNumber, 18);
});

test('side-navigation progress sections cover all 10 homepage bands including chapters and global-journey', () => {
  const ids = HERO_PROGRESS_SECTIONS.map((s) => s.id);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  assert.ok(ids.includes('chapters'));
  assert.ok(ids.includes('global-journey'));
});
