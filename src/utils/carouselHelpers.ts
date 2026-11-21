export function normalizeSlideIndex(index: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const floored = Math.trunc(index);
  return ((floored % total) + total) % total;
}

export function nextSlideIndex(current: number, total: number): number {
  return normalizeSlideIndex(current + 1, total);
}

export function prevSlideIndex(current: number, total: number): number {
  return normalizeSlideIndex(current - 1, total);
}

export function getAdjacentSlideIndices(current: number, total: number): {
  prev: number;
  current: number;
  next: number;
} {
  const safeCurrent = normalizeSlideIndex(current, total);
  return {
    prev: prevSlideIndex(safeCurrent, total),
    current: safeCurrent,
    next: nextSlideIndex(safeCurrent, total),
  };
}

export function detectSwipeDirection(
  startX: number,
  endX: number,
  thresholdPx = 42,
): 'next' | 'prev' | null {
  if (!Number.isFinite(startX) || !Number.isFinite(endX)) return null;
  const deltaX = endX - startX;
  if (Math.abs(deltaX) < thresholdPx) return null;
  // Swiping right-to-left (negative delta) advances to next image moving right-to-left
  return deltaX < 0 ? 'next' : 'prev';
}

export function formatSlideCounter(index: number, total: number): string {
  const safeTotal = Math.max(1, Math.trunc(total));
  const safeIndex = normalizeSlideIndex(index, safeTotal) + 1;
  return `${String(safeIndex).padStart(2, '0')} / ${String(safeTotal).padStart(2, '0')}`;
}

export function getHorizontalSlideVectors(direction: 'next' | 'prev'): {
  incomingStartXPercent: number;
  outgoingEndXPercent: number;
  parallaxOffsetPx: number;
} {
  // Always move right-to-left when advancing forward ('next')
  if (direction === 'next') {
    return {
      incomingStartXPercent: 100,
      outgoingEndXPercent: -100,
      parallaxOffsetPx: 26,
    };
  }
  return {
    incomingStartXPercent: -100,
    outgoingEndXPercent: 100,
    parallaxOffsetPx: -26,
  };
}
