"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { DUR, EASE } from "@/lib/animations/easing";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { IMAGES, type ImageId } from "@/data/generated/images";
import { cn } from "@/lib/utils/cn";

/**
 * One archival plate. The portfolio's product shots are studio cut-outs on
 * white and only ~300px wide, so they are presented at close to native size on
 * a white card and contained rather than cropped — the honest treatment, and
 * the one that stays sharp.
 */
export function ProductPlate({
  id,
  alt,
  className,
  delay = 0,
}: {
  id: ImageId;
  alt: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const asset = IMAGES[id];

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: DUR.slow,
          ease: EASE.out,
          delay,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, delay]);

  return (
    <figure
      ref={ref}
      data-cursor="view"
      style={{ opacity: 0 }}
      className={cn(
        "group relative aspect-4/3 overflow-hidden rounded-[2px] border border-ink/10 bg-white",
        "transition-shadow duration-500 ease-[var(--ease-out-expo)] hover:shadow-(--shadow-plate)",
        className,
      )}
    >
      <Image
        src={asset.src}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 45vw"
        quality={90}
        className="object-contain p-3 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
      />
    </figure>
  );
}
