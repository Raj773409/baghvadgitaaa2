import type { Variants } from 'motion/react';

export const ARCHITECTURAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const editorialFadeVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: ARCHITECTURAL_EASE,
    },
  },
};

export const drawerSlideVariants: Variants = {
  closed: {
    opacity: 0,
    x: '100%',
    transition: {
      duration: 0.24,
      ease: ARCHITECTURAL_EASE,
    },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.32,
      ease: ARCHITECTURAL_EASE,
    },
  },
};
