import { useEffect, type RefObject } from 'react';
import { ensureGsapRegistered, gsap, prefersReducedMotion, ScrollTrigger } from './gsapSetup';

/**
 * Restrained compositor-only section reveal wired to real document-flow scrolling.
 * Guarantees elements never remain stuck hidden at opacity 0 on anchor jumps,
 * programmatic scroll, or initial layout changes.
 */
export function useScrollReveal(
  sectionRef: RefObject<HTMLElement | null>,
  selector: string,
): void {
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || prefersReducedMotion()) return;
    ensureGsapRegistered();

    const targets = Array.from(el.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      const rect = el.getBoundingClientRect();
      // If section is already above or inside the viewport on mount, settle immediately without hiding
      if (rect.top < window.innerHeight * 0.92) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { y: 18, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
        },
      );
    }, el);

    // Failsafe IntersectionObserver ensures elements always settle to opacity 1 even if ScrollTrigger is bypassed
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          gsap.to(targets, {
            y: 0,
            opacity: 1,
            duration: 0.35,
            stagger: 0.04,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            overwrite: 'auto',
          });
          observer.disconnect();
        }
      },
      { threshold: 0.02 },
    );
    observer.observe(el);

    const handleRefresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', handleRefresh, { once: true });

    return () => {
      window.removeEventListener('load', handleRefresh);
      observer.disconnect();
      ctx.revert();
    };
  }, [sectionRef, selector]);
}
