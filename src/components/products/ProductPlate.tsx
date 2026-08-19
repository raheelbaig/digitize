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
  onOpen,
}: {
  id: ImageId;
  alt: string;
  className?: string;
  delay?: number;
  /** When given, the plate becomes a button that opens the viewer. */
  onOpen?: () => void;
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

  // Cut-outs float on white and need padding around them; photographs carry
  // their own background and should fill the tile edge to edge.
  const contained = asset.fit === "contain";

  const picture = (
    <Image
      src={asset.src}
      alt={onOpen ? "" : alt}
      fill
      sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 45vw"
      quality={contained ? 90 : 82}
      className={cn(
        "transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]",
        contained ? "object-contain p-3" : "object-cover",
      )}
    />
  );

  const frame = cn(
    "group relative block aspect-4/3 w-full overflow-hidden rounded-md border",
    contained
      ? "plate-ground plate-ground-hover border-ink/8"
      : "border-ink/12 bg-ink-800",
    "transition-shadow duration-500 ease-[var(--ease-out-expo)] hover:shadow-(--shadow-plate)",
    className,
  );

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {onOpen ? (
        // The button carries the description, so the image inside is decorative
        // — otherwise the name is announced twice.
        <button
          type="button"
          onClick={onOpen}
          data-cursor="view"
          aria-label={`View larger: ${alt}`}
          className={cn(frame, "cursor-pointer")}
        >
          {picture}
        </button>
      ) : (
        <figure data-cursor="view" className={frame}>
          {picture}
        </figure>
      )}
    </div>
  );
}
