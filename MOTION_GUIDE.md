# Motion & 3D Performance Guide

## 1. Motion Architecture

- **GSAP + ScrollTrigger** (`src/animations/gsapSetup.ts`, `src/components/sections/EternalMessage.tsx`): Used for scroll-driven depth reveals inside `gsap.context()` with full `.revert()` cleanup on unmount.
- **Framer Motion (`motion/react`)** (`src/animations/motionPresets.ts`): Handles discrete UI state transitions (chapter detail panel cross-fades, mobile navigation drawer slide). GSAP and Framer Motion never animate the same DOM element.
- **Three.js 3D Motion**:
  - `HeroEnvironment.tsx`: Slow forward camera dolly (`0.14 rad/s` cosine oscillation) and exponentially damped pointer parallax (`1 - Math.exp(-3.2 * dt)`), automatically suspended when scrolled out of view via `IntersectionObserver` and paused/replaced on mobile (`< 768px`) or `prefers-reduced-motion: reduce`.
  - `GlobalJourneyGlobe.tsx`: On-demand rendering coalesced through `requestRender()`, smooth camera focus transitions (`1 - Math.exp(-4.5 * dt)`), and `OrbitControls` with `enableZoom = false` so page scrolling is never hijacked.

## 2. Accessibility & Reduced Motion

- `prefersReducedMotion()` disables GSAP scroll choreography, hero camera drift, and globe transitions.
- CSS transitions in `src/styles/animations.css` honor `@media (prefers-reduced-motion: reduce)`.
- Routine UI interactions settle within `150ms–200ms` using compositor-friendly properties (`transform`, `opacity`, `colors`).
- On software-rendered WebGL environments (`SwiftShader`, `llvmpipe`, `WARP`), pixel ratio is capped at `1`, shadows are disabled, and frames are paced via `fenceSync` (`scheduleAfterDraw`) so UI controls stay responsive.
