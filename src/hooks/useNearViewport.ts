import { useEffect, useState, type RefObject } from 'react';

export interface NearViewportState {
  hasEnteredViewport: boolean;
  isVisible: boolean;
}

/**
 * Tracks whether a container is currently near or inside the viewport so heavy
 * WebGL canvases stay deferred until needed and pause offscreen animation loops.
 */
export function useNearViewport(
  ref: RefObject<HTMLElement | null>,
  rootMargin = '500px 0px',
  disabled = false,
): NearViewportState {
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(
    () => typeof IntersectionObserver === 'undefined',
  );
  const [isVisible, setIsVisible] = useState<boolean>(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    if (disabled) {
      setIsVisible(false);
      return;
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const intersecting = entry.isIntersecting;
        setIsVisible(intersecting);
        if (intersecting) {
          setHasEnteredViewport(true);
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, disabled]);

  return { hasEnteredViewport, isVisible };
}
