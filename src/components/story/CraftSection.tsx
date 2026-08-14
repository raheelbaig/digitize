"use client";

import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ABOUT } from "@/data/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { ImageReveal } from "@/components/motion/ImageReveal";
import type { ImageId } from "@/data/generated/images";

/** Production-floor frames that cross-fade behind the sticky heading. */
const PLATES: readonly { id: ImageId; alt: string }[] = [
  {
    id: "manufacturing-01",
    alt: "A multi-needle embroidery head stitching a run of circular badges",
  },
  {
    id: "manufacturing-02",
    alt: "Backing material running off the loom on the weaving line",
  },
  {
    id: "manufacturing-03",
    alt: "An operator finishing and squaring a stack of embroidered patches",
  },
];

export function CraftSection() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const plates = gsap.utils.toArray<HTMLElement>("[data-plate]");
      if (plates.length < 2) return;

      // Hand the sticky frame from one plate to the next across the column.
      plates.forEach((plate, i) => {
        if (i === 0) return;
        gsap.fromTo(
          plate,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: `${(i - 1) / plates.length * 100 + 8}% center`,
              end: `${i / plates.length * 100 + 8}% center`,
              scrub: 0.8,
            },
          },
        );
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="craft" className="shell py-24 sm:py-32">
      <SectionLabel index="03">{ABOUT.eyebrow}</SectionLabel>

      <div className="mt-12 grid gap-x-12 gap-y-16 lg:grid-cols-12">
        {/* ---- sticky visual ---- */}
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+3rem)]">
            <SplitText
              as="h2"
              lines={ABOUT.heading}
              className="display text-display-md"
              lineClassName="[&>*]:block"
            />

            <div
              className="relative mt-10 aspect-4/3 w-full overflow-hidden border border-bone/10 bg-ink-800"
              data-cursor="view"
            >
              {PLATES.map((plate, i) => (
                <div
                  key={plate.id}
                  data-plate={i}
                  className="absolute inset-0"
                  style={{
                    zIndex: i,
                    clipPath: i === 0 ? undefined : "inset(100% 0% 0% 0%)",
                  }}
                >
                  <ImageReveal
                    id={plate.id}
                    alt={plate.alt}
                    className="h-full w-full"
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    fromScale={1}
                  />
                </div>
              ))}
              <span className="label-tech pointer-events-none absolute bottom-4 left-4 z-10 text-bone/85">
                Production floor
              </span>
            </div>
          </div>
        </div>

        {/* ---- scrolling copy ---- */}
        <div className="lg:col-span-6 lg:pt-4">
          <Reveal>
            <p className="max-w-xl text-lede leading-[1.5] text-bone/70">{ABOUT.lede}</p>
          </Reveal>

          <dl className="mt-14 flex flex-col">
            {ABOUT.columns.map((col, i) => (
              <Reveal key={col.k} as="div" y={30}>
                <div className="grid grid-cols-[auto_1fr] gap-x-6 border-t border-bone/12 py-7">
                  <dt className="label-tech pt-1 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </dt>
                  <div>
                    <p className="text-lg font-medium tracking-tight text-bone">{col.k}</p>
                    <dd className="mt-2 max-w-md text-bone/58">{col.v}</dd>
                  </div>
                </div>
              </Reveal>
            ))}
          </dl>

          <Reveal>
            <p className="mt-12 max-w-lg border-l-2 border-brand-green pl-6 text-lg leading-[1.5] text-bone/80">
              {ABOUT.reach}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
