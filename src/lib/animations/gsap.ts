"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration point. GSAP owns everything scroll-driven: pinning,
 * horizontal tracks, timeline sequencing and parallax. Framer Motion is only
 * used for component-level UI transitions, so the two never fight.
 */
let registered = false;
if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger);
  // Transforms on the compositor; no layout reads mid-timeline.
  gsap.config({ force3D: true, nullTargetWarn: false });
  registered = true;
}

export { gsap, ScrollTrigger };
