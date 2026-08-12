"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { DUR, EASE } from "@/lib/animations/easing";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { IMAGES, type ImageId } from "@/data/generated/images";
import { cn } from "@/lib/utils/cn";

type ImageRevealProps = {
  id: ImageId;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  /** px of counter-scroll drift. 0 disables the parallax. */
  parallax?: number;
  /** Scale the image starts at, easing back to 1 as the mask opens. */
  fromScale?: number;
  rounded?: boolean;
};

/**
 * A framed image that opens behind a clip mask while the picture itself eases
 * back from a slight overscale, then drifts against the scroll. Three layers at
 * three speeds is what gives the page its depth.
 */
export function ImageReveal({
  id,
  alt,
  className,
  imageClassName,
  sizes,
  priority = false,
  parallax = 0,
  fromScale = 1.14,
  rounded = false,
}: ImageRevealProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const asset = IMAGES[id];

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;

    if (reduced) {
      gsap.set(frame, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(img, { scale: 1, yPercent: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: frame, start: "top 88%", once: true } })
        .fromTo(
          frame,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.cinematic, ease: EASE.out },
        )
        .fromTo(
          img,
          { scale: fromScale },
          { scale: 1, duration: DUR.cinematic + 0.4, ease: EASE.out },
          0,
        );

      if (parallax !== 0) {
        gsap.fromTo(
          img,
          { yPercent: -parallax },
          {
            yPercent: parallax,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    }, frame);

    return () => ctx.revert();
  }, [reduced, parallax, fromScale]);

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative overflow-hidden bg-ink-800",
        rounded && "rounded-[2px]",
        className,
      )}
    >
      <div ref={imgRef} className="absolute inset-0" style={{ willChange: "transform" }}>
        <Image
          src={asset.src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={88}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    </div>
  );
}
