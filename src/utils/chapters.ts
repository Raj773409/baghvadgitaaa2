export interface ChapterRecord {
  chapterNumber: number;
  romanNumeral: string;
  paddedCode: string;
  angleDeg: number;
  /**
   * Verified chapter title, description, Sanskrit verse, translation, commentary,
   * and audio URLs remain null until independently verified and approved.
   */
  approvedTitle: string | null;
  approvedDescription: string | null;
  verifiedSanskritVerse: string | null;
  verifiedTranslation: string | null;
  approvedCommentary: string | null;
  approvedAudioUrl: string | null;
}

const ROMAN_NUMERALS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
] as const;

export const TOTAL_CHAPTERS = 18;

export function buildChapterIndex(): ChapterRecord[] {
  return Array.from({ length: TOTAL_CHAPTERS }, (_, idx) => {
    const chapterNumber = idx + 1;
    return {
      chapterNumber,
      romanNumeral: ROMAN_NUMERALS[idx],
      paddedCode: String(chapterNumber).padStart(2, '0'),
      angleDeg: getChapterAngleDeg(chapterNumber),
      approvedTitle: null,
      approvedDescription: null,
      verifiedSanskritVerse: null,
      verifiedTranslation: null,
      approvedCommentary: null,
      approvedAudioUrl: null,
    };
  });
}

/**
 * Returns the radial angle in degrees (starting at -90 deg / 12 o'clock)
 * for one of the 18 chapters on the architectural dial.
 */
export function getChapterAngleDeg(chapterNumber: number): number {
  const normalized = clampChapterNumber(chapterNumber);
  return -90 + (normalized - 1) * (360 / TOTAL_CHAPTERS);
}

export function clampChapterNumber(chapterNumber: number): number {
  if (!Number.isFinite(chapterNumber)) return 1;
  return Math.min(TOTAL_CHAPTERS, Math.max(1, Math.round(chapterNumber)));
}

export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((cx + radius * Math.cos(rad)).toFixed(3)),
    y: Number((cy + radius * Math.sin(rad)).toFixed(3)),
  };
}

export interface ChapterMarkerAnimationSpec {
  shouldAnimate: boolean;
  delayMs: number;
  durationMs: number;
  easing: string;
  fromOpacity: number;
  toOpacity: number;
  fromScale: number;
  toScale: number;
}

export const CHAPTER_ENTRY_BASE_DELAY_MS = 80;
export const CHAPTER_ENTRY_STAGGER_MS = 32;
export const CHAPTER_ENTRY_DURATION_MS = 380;
export const CHAPTER_ENTRY_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Computes compositor-friendly Web Animations API timing parameters for each
 * of the 18 chapter markers, collapsing motion when prefers-reduced-motion is active.
 */
export function getChapterMarkerAnimationSpec(
  markerIndex: number,
  reducedMotion: boolean,
): ChapterMarkerAnimationSpec {
  const safeIndex = Number.isFinite(markerIndex)
    ? Math.max(0, Math.min(TOTAL_CHAPTERS - 1, Math.floor(markerIndex)))
    : 0;

  if (reducedMotion) {
    return {
      shouldAnimate: false,
      delayMs: 0,
      durationMs: 0,
      easing: 'linear',
      fromOpacity: 1,
      toOpacity: 1,
      fromScale: 1,
      toScale: 1,
    };
  }

  return {
    shouldAnimate: true,
    delayMs: CHAPTER_ENTRY_BASE_DELAY_MS + safeIndex * CHAPTER_ENTRY_STAGGER_MS,
    durationMs: CHAPTER_ENTRY_DURATION_MS,
    easing: CHAPTER_ENTRY_EASING,
    fromOpacity: 0,
    toOpacity: 1,
    fromScale: 0.72,
    toScale: 1,
  };
}
