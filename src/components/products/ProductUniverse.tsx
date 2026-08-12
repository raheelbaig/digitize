"use client";

import Image from "next/image";
import { PRODUCT_CATEGORIES, VARIANT_COUNT } from "@/data/products";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/motion/Marquee";
import { IMAGES } from "@/data/generated/images";
import { ProductCategoryBand } from "./ProductCategoryBand";

/** A drifting strip of finished work, used as the doorway into the archive. */
const STRIP = [
  "patches-03",
  "keychains-02",
  "metal-04",
  "hats-06",
  "labels-02",
  "lanyards-05",
  "pvc-03",
  "other-04",
  "patches-11",
  "metal-09",
  "hats-14",
  "keychains-12",
] as const;

/**
 * The catalogue, and the page's one full scene change: the cinematic dark
 * gives way to a lit archive surface, which is where studio cut-outs on white
 * actually belong.
 */
export function ProductUniverse() {
  return (
    <section id="products" className="surface-bone relative pt-24 sm:pt-32">
      <div className="shell">
        <SectionLabel index="04">The product universe</SectionLabel>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="display text-display-md text-ink">
              Eight families.
              <br />
              <span className="text-ink/40">{VARIANT_COUNT} ways to build them.</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:pt-3" delay={0.1}>
            <p className="max-w-md leading-relaxed text-ink/62">
              Every piece below was produced by Digitize Are Us. Pick the family
              closest to your idea — construction, size, backing and finish are
              decided with you on the call.
            </p>
          </Reveal>
        </div>
      </div>

      <Marquee className="mt-14" itemClassName="gap-3 pr-3" speed={62}>
        {STRIP.map((id) => {
          const asset = IMAGES[id];
          return (
            <span
              key={id}
              className="relative block aspect-4/3 h-[clamp(6.5rem,11vw,9.5rem)] shrink-0 overflow-hidden rounded-[2px] border border-ink/10 bg-white"
            >
              <Image
                src={asset.src}
                alt=""
                fill
                sizes="16vw"
                quality={82}
                className="object-contain p-2.5"
              />
            </span>
          );
        })}
      </Marquee>

      <div className="mt-14">
        {PRODUCT_CATEGORIES.map((category, i) => (
          <ProductCategoryBand
            key={category.slug}
            category={category}
            index={i}
            total={PRODUCT_CATEGORIES.length}
          />
        ))}
      </div>
    </section>
  );
}
