"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useHasFinePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A small ring that trails the pointer and swells over imagery. Elements opt in
 * with data-cursor="view" | "call" | "drag"; anything interactive gets a
 * subtle grow via data-cursor="link".
 *
 * Touch devices and reduced-motion visitors never mount this.
 */
export function Cursor() {
  const fine = useHasFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    // quickTo keeps this on GSAP's ticker — no per-event style thrash
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.14, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.14, ease: "power3.out" });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-cursor]");
      const mode = el?.dataset.cursor ?? null;
      setLabel(mode === "view" ? "View" : mode === "call" ? "Call" : null);
      const scale = mode === "view" || mode === "call" ? 3.4 : mode === "link" ? 1.7 : 1;
      gsap.to(ring, { scale, duration: 0.45, ease: "expo.out" });
      gsap.to(dot, { opacity: mode ? 0 : 1, duration: 0.25 });
    };

    const onLeave = () => gsap.to([ring, dot], { autoAlpha: 0, duration: 0.25 });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([ring, dot]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: "var(--z-cursor)" }}
    >
      <div
        ref={ringRef}
        className="absolute -top-4 -left-4 grid size-8 place-items-center rounded-full border border-bone/45 opacity-0 mix-blend-difference"
      >
        {label ? (
          <span className="font-mono text-[3px] tracking-[0.16em] uppercase">
            {label}
          </span>
        ) : null}
      </div>
      <div
        ref={dotRef}
        className="absolute -top-[2px] -left-[2px] size-1 rounded-full bg-bone opacity-0 mix-blend-difference"
      />
    </div>
  );
}
