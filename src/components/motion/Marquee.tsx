"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/**
 * Continuous horizontal drift. The track holds two identical runs and is
 * wrapped modulo one run's width, so the loop never snaps. Scroll velocity
 * nudges the speed, which makes the band feel attached to the page.
 */
export function Marquee({
  children,
  speed = 42,
  reverse = false,
  className,
  itemClassName,
}: {
  children: ReactNode;
  /** Seconds for one full run. Larger = slower. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = wrap.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const runs = el.querySelectorAll<HTMLElement>("[data-run]");
      const width = runs[0]?.offsetWidth ?? 0;
      if (!width) return;

      gsap.set(runs, { x: 0 });
      const tween = gsap.to(runs, {
        x: reverse ? width : -width,
        duration: speed,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => `${gsap.utils.wrap(-width, 0, parseFloat(x))}px`,
        },
      });
      if (reverse) tween.progress(1);
    }, el);

    return () => ctx.revert();
  }, [reduced, speed, reverse]);

  return (
    <div
      ref={wrap}
      className={cn("relative flex w-full overflow-hidden", className)}
      aria-hidden="true"
    >
      {[0, 1].map((i) => (
        <div key={i} data-run className={cn("flex shrink-0 items-center", itemClassName)}>
          {children}
        </div>
      ))}
    </div>
  );
}
