"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { setLenis } from "@/lib/animations/lenisRef";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Lenis owns the scroll position; GSAP's ticker drives it so ScrollTrigger and
 * the smoothing run on one clock. Without that shared clock the two drift and
 * pinned sections visibly jitter.
 *
 * When reduced motion is requested we never construct Lenis at all — native
 * scrolling stays exactly as the OS intends.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      // long, flat curve — weight rather than bounce
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);
    setLenis(lenis);

    // Handle for the screenshot harness to drive scroll deterministically.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
    }

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links have to be handed to Lenis or they jump.
    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!(el instanceof HTMLAnchorElement)) return;
      const id = el.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.4 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
