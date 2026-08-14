import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  ACCENT_VAR,
  PRODUCT_CATEGORIES,
  VARIANT_COUNT,
  categoryHref,
} from "@/data/products";
import { IMAGES } from "@/data/generated/images";
import { MERCH_BASE, SITE } from "@/data/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { FinalCTA } from "@/components/experience/FinalCTA";

const description = `Eight families of custom merchandise manufactured by ${SITE.name} — patches, keychains, PVC products, metal, headwear, labels, lanyards and more, in ${VARIANT_COUNT} constructions.`;

export const metadata: Metadata = {
  title: "Custom Merch",
  description,
  alternates: { canonical: MERCH_BASE },
  openGraph: {
    type: "website",
    url: `${SITE.url}${MERCH_BASE}`,
    siteName: SITE.name,
    title: `Custom Merch — ${SITE.name}`,
    description,
  },
};

/** The index: one card per family, each opening its own page. */
export default function CustomMerchPage() {
  return (
    <>
      <section className="grain relative overflow-hidden pt-[calc(var(--nav-h)+5rem)] pb-14">
        <div className="shell">
          <SectionLabel index="01">Custom merch</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SplitText
                as="h1"
                lines={["Eight families.", `${VARIANT_COUNT} constructions.`]}
                className="display text-display-lg"
                immediate
              />
            </div>
            <Reveal className="lg:col-span-5 lg:pt-4" delay={0.15}>
              <p className="max-w-md leading-relaxed text-bone/62">
                Everything below is produced by Digitize Are Us. Open a family to
                see the full run of work and every construction it can be built
                in — then call us with your artwork.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="surface-bone py-16 sm:py-20">
        <div className="shell">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_CATEGORIES.map((category, i) => {
              const asset = IMAGES[category.heroImage];
              return (
                <li key={category.slug}>
                  <Reveal y={26} delay={(i % 3) * 0.05}>
                    <Link
                      href={categoryHref(category.slug)}
                      data-cursor="view"
                      className="group flex h-full flex-col rounded-2xl border border-ink/12 bg-white p-3 transition-shadow duration-500 ease-[var(--ease-out-expo)] hover:shadow-(--shadow-plate)"
                    >
                      <span className="relative block aspect-4/3 overflow-hidden rounded-xl bg-white">
                        <Image
                          src={asset.src}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                          quality={90}
                          className="object-contain p-3 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                        />
                      </span>

                      <span className="mt-4 flex items-start justify-between gap-3 px-2 pb-2">
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="block size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: ACCENT_VAR[category.accent] }}
                            />
                            <span className="text-lg font-medium tracking-[-0.01em] text-ink">
                              {category.title}
                            </span>
                          </span>
                          <span className="mt-1 block font-mono text-[0.6875rem] tracking-tight text-ink/50">
                            {category.variants.length} constructions ·{" "}
                            {category.images.length} pieces
                          </span>
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-ink/35 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
