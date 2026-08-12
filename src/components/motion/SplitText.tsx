"use client";

import { useMemo, useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { DUR, EASE, STAGGER } from "@/lib/animations/easing";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

type SplitTextProps = {
  /** Each string is one visual line. Lines are masked and rise independently. */
  lines: readonly string[];
  /** Set when another element needs to reference this heading. */
  id?: string;
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** Run on mount rather than on scroll — used by the hero. */
  immediate?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "div";
};

/**
 * Masked line reveal. The whole heading stays a single accessible text node;
 * only the visual copies are split, so screen readers read a clean sentence.
 */
export function SplitText({
  lines,
  id,
  className,
  lineClassName,
  delay = 0,
  stagger = STAGGER.loose,
  immediate = false,
  as: Tag = "h2",
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const label = useMemo(() => lines.join(" "), [lines]);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inner = el.querySelectorAll<HTMLElement>("[data-line-inner]");

    if (reduced) {
      gsap.set(inner, { yPercent: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 108, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: DUR.cinematic,
          ease: EASE.out,
          delay,
          stagger,
          ...(immediate
            ? {}
            : { scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, delay, stagger, immediate]);

  return (
    // Tag is a union of intrinsic elements; the ref is only ever read as an
    // Element, so narrowing it here is safe.
    <Tag id={id} ref={ref as React.Ref<HTMLDivElement>} className={cn(className)}>
      {/* one accessible copy… */}
      <span className="sr-only">{label}</span>
      {/* …and the animated presentation */}
      <span aria-hidden="true">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.08em]">
            <span
              data-line-inner
              className={cn("block", lineClassName)}
              style={{ willChange: "transform, opacity" }}
            >
              {line}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
