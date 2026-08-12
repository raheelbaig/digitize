"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "@/lib/animations/gsap";
import { DUR, EASE } from "@/lib/animations/easing";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Seconds of hold before the reveal starts. */
  delay?: number;
  /** Travel distance in px. Kept small — this is a settle, not a slide. */
  y?: number;
  /** Stagger direct children instead of moving the wrapper as one block. */
  stagger?: number;
  start?: string;
};

/**
 * The house entrance: a short rise out of a soft blur-free fade, triggered once
 * as the element enters. Everything content-level uses this so the page has a
 * consistent rhythm instead of a different animation per section.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  y = 26,
  stagger,
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      gsap.set(stagger ? Array.from(el.children) : el, { opacity: 1, y: 0 });
      return;
    }

    const targets = stagger ? Array.from(el.children) : el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: DUR.slow,
          ease: EASE.out,
          delay,
          stagger,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, delay, y, stagger, start]);

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </Tag>
  );
}
