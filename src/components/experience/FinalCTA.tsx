"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CONTACT } from "@/data/site";
import { IMAGES } from "@/data/generated/images";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { CallButton } from "@/components/ui/CallButton";

/** The product world thins out until one piece is left, then the phone number. */
const ORBIT = ["metal-02", "patches-07", "keychains-05", "labels-04"] as const;

export function FinalCTA() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const solo = IMAGES["patches-09"];

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.to("[data-orbit]", {
        opacity: 0,
        scale: 0.85,
        y: -30,
        ease: "none",
        stagger: 0.2,
        scrollTrigger: { trigger: el, start: "top 70%", end: "center center", scrub: 0.8 },
      });
      gsap.fromTo(
        "[data-solo]",
        { scale: 0.86, opacity: 0.6 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 70%", end: "center center", scrub: 0.8 },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      id="contact"
      className="grain relative overflow-hidden py-28 sm:py-40"
    >
      {/* the last few pieces, fading out */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ORBIT.map((id, i) => {
          const asset = IMAGES[id];
          const pos = [
            "left-[6%] top-[14%] w-[clamp(6rem,11vw,11rem)]",
            "right-[9%] top-[20%] w-[clamp(5rem,9vw,9rem)]",
            "left-[13%] bottom-[16%] w-[clamp(5rem,8vw,8rem)]",
            "right-[7%] bottom-[12%] w-[clamp(6rem,10vw,10rem)]",
          ][i];
          return (
            <span
              key={id}
              data-orbit
              className={`absolute ${pos} aspect-square overflow-hidden border border-bone/10 opacity-45`}
            >
              <Image src={asset.src} alt="" fill sizes="12vw" quality={70} className="object-cover" />
            </span>
          );
        })}
      </div>

      <div className="shell relative text-center">
        <div
          data-solo
          className="mx-auto aspect-square w-[clamp(7rem,13vw,12rem)] overflow-hidden border border-bone/15 shadow-(--shadow-lift)"
        >
          <Image
            src={solo.src}
            alt="A single finished embroidered patch"
            width={solo.width}
            height={solo.height}
            sizes="14vw"
            quality={88}
            className="size-full object-cover"
          />
        </div>

        <Reveal>
          <p className="label-tech mt-12">Have a design in mind?</p>
        </Reveal>

        <SplitText
          as="h2"
          lines={["Let's make", "it real."]}
          className="display mt-6 text-display-lg"
        />

        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-md text-bone/62">
            Tell us the piece, the quantity and the date. We will tell you exactly
            what it takes — no minimum, and a rush lane if the deadline is tight.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-12 flex flex-col items-center gap-8">
            <a
              href={CONTACT.phoneHref}
              data-cursor="call"
              className="display block text-[clamp(1.75rem,5.4vw,4.5rem)] tracking-[-0.03em] transition-colors duration-500 hover:text-thread-yellow"
            >
              {CONTACT.phone}
            </a>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <CallButton label="Call the team" showNumber={false} />
              <a
                href={CONTACT.emailHref}
                data-cursor="link"
                className="rounded-full border border-bone/25 px-6 py-3.5 text-sm text-bone/80 transition-colors duration-300 hover:border-bone hover:text-bone"
              >
                {CONTACT.email}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
