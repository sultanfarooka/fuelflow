import type { Variants } from "motion/react";

// ─── ANIMATION TIMING ────────────────────────────────────────────────────────
// Tune these to dial the page-load feel up or down. All durations are in seconds.
//
//  • PAGE_LOAD_DURATION       Full-screen fade-in on first mount / Replay.
//                              Drives screen, column, and item-level variants.
//
//  • SCENE_TRANSITION_DURATION  Brand-panel scene change (icon + title + body fade
//                              between scenes every SCENE_INTERVAL_MS).
//
//  • SCENE_GRADIENT_DURATION  Cross-fade of the radial-gradient background tint
//                              when a scene swaps.
//
//  • SCENE_ICON_POP_DURATION  Overshoot "pop" on the scene icon tile.
// ─────────────────────────────────────────────────────────────────────────────
export const PAGE_LOAD_DURATION = 1.4;
export const SCENE_TRANSITION_DURATION = 1.0;
export const SCENE_GRADIENT_DURATION = 2.6;
export const SCENE_ICON_POP_DURATION = 0.85;

export const EASE_OUT_QUART = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_BACK = [0.34, 1.56, 0.64, 1] as const;

export const SHAKE_KEYFRAMES = [0, -4, 4, -4, 4, 0];

export const INPUT_FOCUS_RING =
  "transition-[box-shadow,border-color] duration-200 ease-out";

export const screenVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: PAGE_LOAD_DURATION, ease: EASE_OUT_QUART },
  },
};

export const columnVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: PAGE_LOAD_DURATION, ease: EASE_OUT_QUART },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: PAGE_LOAD_DURATION, ease: EASE_OUT_QUART },
  },
};

export const alertVariants: Variants = {
  hidden: { opacity: 0, height: 0, y: -4 },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT_QUART },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -4,
    transition: { duration: 0.2, ease: EASE_OUT_QUART },
  },
};
