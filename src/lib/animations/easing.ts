/**
 * Shared motion vocabulary. Everything on the site pulls its curve and its
 * duration from here so the whole experience moves with one hand.
 */

/** GSAP named eases. `expo.out` is the house curve: fast in, long settle. */
export const EASE = {
  out: "expo.out",
  outQuint: "quint.out",
  inOut: "power3.inOut",
  linear: "none",
} as const;

/** Framer Motion cubic-bezier equivalents of the CSS tokens. */
export const BEZIER = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuint: [0.22, 1, 0.36, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** Seconds. Layered so background, image and type move at different speeds. */
export const DUR = {
  fast: 0.26,
  base: 0.62,
  slow: 1.1,
  cinematic: 1.7,
} as const;

/** Stagger steps, in seconds. */
export const STAGGER = {
  tight: 0.035,
  base: 0.07,
  loose: 0.12,
} as const;
