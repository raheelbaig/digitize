"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { PROCESS_STEPS } from "@/data/site";
import { IMAGES, type ImageId } from "@/data/generated/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The production sequence as a horizontal track the page pulls through.
 *
 * The stage is held by CSS `position: sticky` inside a tall section rather
 * than by GSAP's `pin`. Pinning swaps the element to `position: fixed` behind a
 * generated spacer, which measured as ~1.9 of cumulative layout shift here;
 * sticky cannot shift layout at all. GSAP is left doing the one thing it is
 * best at — scrubbing the track's transform against scroll progress.
 *
 * Below `lg`, and for anyone who asked for reduced motion, the same content is
 * an ordinary vertical stack.
 */
export function ProcessStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();
  const horizontal = desktop && !reduced;

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || !horizontal) return;

    /** Overflow width of the track; also the section's extra scroll length. */
    const measure = () => {
      const distance = Math.max(0, track.scrollWidth - window.innerWidth);
      section.style.setProperty("--track-distance", `${distance}px`);
      return distance;
    };
    measure();

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -measure(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      const tween = gsap.getTweensOf(track)[0];

      // Panels drift against the track for depth.
      gsap.utils.toArray<HTMLElement>("[data-panel-img]").forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: img,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });
    }, section);

    ScrollTrigger.addEventListener("refreshInit", measure);
    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      ctx.revert();
      section.style.removeProperty("--track-distance");
    };
  }, [horizontal]);

  return (
    <section id="process" className="relative">
      <div className="shell pt-24 sm:pt-32">
        <SectionLabel index="05">The process</SectionLabel>
        <Reveal>
          <h2 className="display mt-8 max-w-3xl text-display-md">
            Idea to finished object, on our own machines.
          </h2>
        </Reveal>
      </div>

      {horizontal ? (
        <div
          ref={sectionRef}
          className="relative mt-10"
          // 100svh of stage plus however far the track has to travel
          style={{ height: "calc(100svh + var(--track-distance, 0px))" }}
        >
          <div className="sticky top-0 h-svh overflow-hidden">
            <div
              ref={trackRef}
              className="flex h-full items-center gap-8 pr-[10vw] pl-gutter"
              style={{ willChange: "transform" }}
            >
              {PROCESS_STEPS.map((step) => (
                <ProcessPanel key={step.n} step={step} />
              ))}
              <ClosingPanel />
            </div>
          </div>
        </div>
      ) : (
        <div className="shell mt-14 flex flex-col gap-14">
          {PROCESS_STEPS.map((step) => (
            <Reveal key={step.n} as="article">
              <ProcessPanel step={step} stacked />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function ProcessPanel({
  step,
  stacked = false,
}: {
  step: (typeof PROCESS_STEPS)[number];
  stacked?: boolean;
}) {
  const asset = IMAGES[step.image as ImageId];
  return (
    <article
      className={
        stacked
          ? // capped: the source frames are 480px wide, so a full-bleed
            // stacked panel would upscale past 2x
            "w-full max-w-2xl"
          : "relative h-[82svh] w-[clamp(22rem,42vw,40rem)] shrink-0"
      }
    >
      <div
        data-cursor="view"
        className={
          stacked
            ? "relative aspect-16/10 w-full overflow-hidden border border-bone/10 bg-ink-800"
            : "relative h-full w-full overflow-hidden border border-bone/10 bg-ink-800"
        }
      >
        <div data-panel-img className="absolute inset-0 scale-110">
          <Image
            src={asset.src}
            alt={step.body}
            fill
            sizes={stacked ? "(min-width: 672px) 42rem, 100vw" : "42vw"}
            quality={84}
            className="object-cover"
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-ink via-ink/25 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-sm text-brand-green">{step.n}</span>
            <span className="stitch-line h-px flex-1 text-bone/35" aria-hidden="true" />
          </div>
          <h3 className="display mt-4 text-3xl sm:text-4xl">{step.title}</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-bone/65">{step.body}</p>
        </div>
      </div>
    </article>
  );
}

/** Closes the track so the stage releases on a statement, not a hard edge. */
function ClosingPanel() {
  return (
    <div className="flex h-[82svh] w-[clamp(20rem,34vw,32rem)] shrink-0 flex-col justify-center">
      <p className="display text-display-sm">
        Then it ships —<br />
        <span className="text-brand-green">on your deadline.</span>
      </p>
      <p className="mt-6 max-w-xs text-bone/60">
        Standard orders are ready to ship in 8–10 days, with rush production when
        the date will not move.
      </p>
    </div>
  );
}
