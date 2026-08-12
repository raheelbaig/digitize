"use client";

import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SectionLabel } from "@/components/ui/SectionLabel";

const STATEMENT =
  "A logo lives on a screen until someone can hold it. We make the held version — stitched, woven, moulded and struck, in the material your brand will actually be seen in.";

/**
 * The thesis. Words resolve from near-invisible to full as the block crosses
 * the viewport, so reading and scrolling become the same gesture.
 */
export function BrandStatement() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const words = el.querySelectorAll("[data-word]");

    if (reduced) {
      gsap.set(words, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: {
            trigger: el,
            start: "top 78%",
            end: "bottom 68%",
            scrub: 0.7,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="shell py-28 sm:py-40">
      <SectionLabel index="02">The idea</SectionLabel>
      <p className="display mt-10 max-w-5xl text-display-md leading-[1.06] tracking-[-0.03em]">
        <span className="sr-only">{STATEMENT}</span>
        <span aria-hidden="true">
          {STATEMENT.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-word className="inline-block">
              {word}
              {" "}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}
