"use client";

import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/**
 * The section transition: a single stitch travelling across the viewport as
 * the seam between two scenes. It is the one motif reused everywhere, which is
 * what makes the page feel like one continuous piece rather than a stack.
 */
export function StitchDivider({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const line = el.querySelector("[data-stitch]");
    if (!line) return;

    if (reduced) {
      gsap.set(line, { scaleX: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            end: "top 42%",
            scrub: 0.6,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} className={cn("shell py-14 sm:py-20", className)}>
      <div className="flex items-center gap-5">
        <span
          data-stitch
          aria-hidden="true"
          className="stitch-line block h-px flex-1 origin-left text-current opacity-35"
          style={{ transform: "scaleX(0)" }}
        />
        {label ? <span className="label-tech shrink-0">{label}</span> : null}
      </div>
    </div>
  );
}
