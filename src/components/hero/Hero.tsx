"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowDown } from "lucide-react";
import { gsap } from "@/lib/animations/gsap";
import { EASE, STAGGER } from "@/lib/animations/easing";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIntroReady } from "@/components/providers/Intro";
import { IMAGES } from "@/data/generated/images";
import { PRODUCT_CATEGORIES, VARIANT_COUNT } from "@/data/products";
import { CallButton } from "@/components/ui/CallButton";
import { SectionLabel } from "@/components/ui/SectionLabel";

const HEADLINE = ["From thread", "to identity."] as const;

const FACTS = [
  { k: String(PRODUCT_CATEGORIES.length).padStart(2, "0"), v: "Product families" },
  { k: String(VARIANT_COUNT), v: "Constructions" },
  { k: "USA / EU", v: "Export markets" },
] as const;

/**
 * The opening frame. A darkened macro field of finished work sits behind the
 * statement, one specimen is held out at full fidelity on the right, and the
 * whole composition resolves in a single sequence once the loader clears.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const ready = useIntroReady();

  const specimen = IMAGES["patches-01"];
  const field = IMAGES["patches-05"];

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const q = gsap.utils.selector(el);
    const lines = q("[data-hero-line]");
    const bits = q("[data-hero-fade]");
    const rules = q("[data-hero-rule]");
    const frame = q("[data-hero-frame]");
    const photo = q("[data-hero-photo]");

    if (reduced) {
      gsap.set([lines, bits], { yPercent: 0, opacity: 1 });
      gsap.set(rules, { scaleX: 1 });
      gsap.set(frame, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(photo, { scale: 1 });
      gsap.set(bgRef.current, { opacity: 0.34, scale: 1 });
      return;
    }

    // Hold the composition still until the loader begins lifting.
    if (!ready) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      tl.fromTo(
        bgRef.current,
        { opacity: 0, scale: 1.18 },
        { opacity: 0.34, scale: 1, duration: 2.6 },
        0,
      )
        .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.1 }, 0.1)
        .fromTo(
          lines,
          { yPercent: 112 },
          { yPercent: 0, duration: 1.7, stagger: STAGGER.loose },
          0.24,
        )
        .fromTo(
          frame,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6 },
          0.42,
        )
        .fromTo(photo, { scale: 1.25 }, { scale: 1, duration: 2.2 }, 0.42)
        .fromTo(
          bits,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 1.1, stagger: STAGGER.base },
          0.72,
        );

      // Slow counter-drift as the hero leaves; the type outruns the picture.
      gsap.to(q("[data-hero-parallax-slow]"), {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(q("[data-hero-parallax-fast]"), {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, ready]);

  return (
    <section
      ref={root}
      id="top"
      className="grain relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden pt-[calc(var(--nav-h)+3rem)] pb-8"
    >
      {/* macro field of finished work, pushed far back */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ opacity: 0 }}
      >
        <Image
          src={field.src}
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
          className="scale-125 object-cover blur-[7px]"
        />
        {/* Enough veil to keep type legible, not so much that the weave dies. */}
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-0 bg-linear-to-b from-ink via-transparent to-ink" />
      </div>

      <div className="shell flex w-full flex-1 flex-col justify-center">
        <div className="grid items-center gap-y-12 lg:grid-cols-12 lg:gap-x-12">
          {/* ---- statement ---- */}
          <div className="lg:col-span-7 xl:col-span-6" data-hero-parallax-fast>
            <div data-hero-fade style={{ opacity: 0 }}>
              <SectionLabel index="01">Custom manufacturing for brands</SectionLabel>
            </div>

            <h1 className="display mt-7 text-display-lg">
              <span className="sr-only">{HEADLINE.join(" ")}</span>
              <span aria-hidden="true">
                {HEADLINE.map((line, i) => (
                  <span key={line} className="block overflow-hidden pb-[0.06em]">
                    <span
                      data-hero-line
                      className="block"
                      style={{ willChange: "transform" }}
                    >
                      {i === 1 ? (
                        <>
                          to{" "}
                          <span className="italic text-thread-yellow">identity.</span>
                        </>
                      ) : (
                        line
                      )}
                    </span>
                  </span>
                ))}
              </span>
            </h1>

            <span
              data-hero-rule
              aria-hidden="true"
              className="stitch-line mt-9 block h-px w-full max-w-md origin-left text-bone/25"
              style={{ transform: "scaleX(0)" }}
            />

            <p
              data-hero-fade
              className="mt-8 max-w-xl text-lede leading-[1.45] text-bone/62"
              style={{ opacity: 0 }}
            >
              Patches, lanyards, keychains, metal, headwear and labels — made for
              the brands, teams and organizations that care how the details land.
            </p>

            <div
              data-hero-fade
              className="mt-10 flex flex-wrap items-center gap-4"
              style={{ opacity: 0 }}
            >
              <CallButton />
              <a
                href="#products"
                data-cursor="link"
                className="group inline-flex items-center gap-2 py-3.5 text-sm text-bone/70 transition-colors hover:text-bone"
              >
                See the product universe
                <span className="relative block h-px w-8 overflow-hidden bg-bone/30">
                  <span className="absolute inset-0 origin-left scale-x-0 bg-thread-yellow transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
                </span>
              </a>
            </div>
          </div>

          {/* ---- specimen ---- */}
          <div className="lg:col-span-5 xl:col-span-6" data-hero-parallax-slow>
            <div
              data-hero-frame
              // Landscape frame matched to the source's own orientation: a
              // portrait crop of a 320x224 original would upscale ~2.3x.
              className="relative ml-auto aspect-10/7 w-full max-w-[30rem] overflow-hidden border border-bone/10 bg-ink-800 shadow-(--shadow-lift)"
              style={{ clipPath: "inset(0% 0% 100% 0%)" }}
              data-cursor="view"
            >
              <div data-hero-photo className="absolute inset-0" style={{ willChange: "transform" }}>
                <Image
                  src={specimen.src}
                  alt="A tray of finished embroidered patches, stitched edge to edge in full colour"
                  fill
                  priority
                  quality={90}
                  sizes="(min-width: 1024px) 30rem, 100vw"
                  // just enough inset to trim the plate's white margin
                  className="scale-[1.06] object-cover"
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-ink via-ink/70 to-transparent"
              />
              <span className="label-tech absolute bottom-4 left-4 text-bone/80">
                Embroidery · Merrowed edge
              </span>
            </div>
          </div>
        </div>

        {/* ---- footer strip ---- */}
        <div className="mt-14 flex flex-wrap items-end justify-between gap-8 border-t border-bone/10 pt-6">
          <dl className="flex flex-wrap gap-x-12 gap-y-4">
            {FACTS.map((f) => (
              <div key={f.v} data-hero-fade style={{ opacity: 0 }}>
                <dt className="label-tech">{f.v}</dt>
                <dd className="mt-1.5 font-mono text-xl tracking-tight text-bone">
                  {f.k}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href="#craft"
            data-hero-fade
            data-cursor="link"
            style={{ opacity: 0 }}
            className="group flex items-center gap-3 text-bone/55 transition-colors hover:text-bone"
          >
            <span className="label-tech">Scroll</span>
            <span className="grid size-9 place-items-center rounded-full border border-bone/20 transition-colors group-hover:border-bone/60">
              <ArrowDown
                className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
