export const TOTAL_GITA_CHAPTERS = 18;
export const BOOKMARK_STORAGE_KEY = 'eternal.gita3d.bookmarks.v1';

export type BookCameraPreset = 'desk' | 'reading' | 'close' | 'spine';

/**
 * Smooth cubic-in-out easing curve used for 3D page turn and cover opening transitions.
 */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Computes realistic vertical curl (arc lift) and inward foreshortening for a single turning
 * parchment leaf across normalized width coordinate u ∈ [0, 1] at turn progress p ∈ [0, 1].
 */
export function computePageCurlDisplacement(
  u: number,
  turnProgress: number,
  direction: 'next' | 'prev',
): {
  angleRad: number;
  archLift: number;
} {
  const safeU = Math.min(1, Math.max(0, u));
  const eased = easeInOutCubic(turnProgress);

  // Page pivots from 0 (right resting stack) to -PI (left resting stack) when advancing 'next',
  // or reverses back from -PI to 0 when turning 'prev'.
  const sweep = direction === 'next' ? eased * Math.PI : (1 - eased) * Math.PI;

  // Natural paper stiffness: spine stays stiff (small lag), outer edge bends in an S-like arc
  const midpointArch = Math.sin(eased * Math.PI);
  const lagFactor = direction === 'next' ? -0.34 : 0.34;
  const localFlex = lagFactor * midpointArch * Math.pow(safeU, 1.45);
  const angleRad = sweep + localFlex;

  // Subtle parchment belly lift peaking at mid-turn
  const archLift = midpointArch * 0.16 * Math.sin(safeU * Math.PI);

  return { angleRad, archLift };
}

export function clampChapterNumber(chapter: number): number {
  if (!Number.isFinite(chapter)) return 1;
  return Math.min(TOTAL_GITA_CHAPTERS, Math.max(1, Math.round(chapter)));
}

export function computeReadingProgressPercent(chapterNumber: number): number {
  const safe = clampChapterNumber(chapterNumber);
  return Math.round((safe / TOTAL_GITA_CHAPTERS) * 100);
}

export function clampBookFontScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.4, Math.max(0.85, Number(scale.toFixed(2))));
}

export function toggleChapterBookmark(
  existing: ReadonlyArray<number>,
  chapterNumber: number,
): number[] {
  const target = clampChapterNumber(chapterNumber);
  const set = new Set(existing.map(clampChapterNumber));
  if (set.has(target)) {
    set.delete(target);
  } else {
    set.add(target);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function loadBookmarks(
  storage: Pick<Storage, 'getItem'> | null | undefined,
): number[] {
  try {
    if (!storage) return [];
    const raw = storage.getItem(BOOKMARK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_GITA_CHAPTERS),
      ),
    ).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function saveBookmarks(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  bookmarks: ReadonlyArray<number>,
): void {
  try {
    if (storage) {
      const clean = Array.from(new Set(bookmarks.map(clampChapterNumber))).sort((a, b) => a - b);
      storage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(clean));
    }
  } catch {
    // Ignore storage restriction
  }
}
