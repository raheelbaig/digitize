"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { IMAGES, type ImageId } from "@/data/generated/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Three materials, held side by side at close to native resolution and drifting
 * at different rates. This is the page's slow beat — it earns the "look closer"
 * claim by staying sharp rather than faking a macro zoom the source cannot
 * support.
 */
const PLATES: readonly { id: ImageId; k: string; v: string; alt: string }[] = [
  {
    id: "patches-06",
    k: "Thread",
    v: "Satin stitch, merrowed edge",
    alt: "Embroidered patches showing dense satin stitching and a merrowed border",
  },
  {
    id: "metal-03",
    k: "Metal",
    v: "Die-struck, soft enamel",
    alt: "Die-struck metal pins finished in soft enamel with a polished plating",
  },
  {
    id: "labels-03",
    k: "Weave",
    v: "Woven label, cut and folded",
    alt: "Woven clothing labels with fine detail woven directly into the tape",
  },
];

export function MacroDetail() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      // Staggered counter-drift gives the row depth without any scaling.
      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((plate, i) => {
        gsap.fromTo(
          plate,
          { yPercent: 6 + i * 5 },
          {
            yPercent: -(6 + i * 5),
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          },
        );
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="grain relative overflow-hidden py-28 sm:py-36">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel index="06">Detail</SectionLabel>
            <SplitText
              as="h2"
              lines={["Look closer."]}
              className="display mt-8 text-display-md"
            />
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-sm text-lede leading-[1.45] text-bone/62">
                Quality is visible{" "}
                <span className="text-thread-yellow">before it is explained.</span>{" "}
                Stitch density, edge finish, plating depth — the things a buyer
                notices in the hand.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {PLATES.map((plate, i) => {
                const asset = IMAGES[plate.id];
                return (
                  <figure key={plate.id} data-drift className="min-w-0">
                    <div
                      data-cursor="view"
                      // 4:3 matches the source orientation; a portrait crop
                      // would throw away half the frame and upscale ~2.5x
                      className="relative aspect-4/3 overflow-hidden rounded-xs border border-bone/12 bg-white"
                    >
                      <Image
                        src={asset.src}
                        alt={plate.alt}
                        fill
                        sizes="(min-width: 1024px) 20vw, 30vw"
                        quality={92}
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="mt-3">
                      <p className="font-mono text-xs tracking-[0.16em] text-bone uppercase">
                        {plate.k}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-bone/50">{plate.v}</p>
                    </figcaption>
                    <span className="sr-only">{i + 1} of {PLATES.length}</span>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
