"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ACCENT_VAR,
  PRODUCT_CATEGORIES,
  adjacentCategories,
  categoryHref,
  type ProductCategory,
} from "@/data/products";
import { MERCH_BASE } from "@/data/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { PlateGrid } from "@/components/products/PlateGrid";
import { CallButton } from "@/components/ui/CallButton";

/**
 * A single product family. Everything shown is transcribed from the portfolio
 * deck — the family name, its construction list and its photography. No
 * specifications, minimums or lead times are invented here; the terms that do
 * exist live on the homepage, sourced from the deck's own advantages panel.
 */
export function CategoryDetail({ category }: { category: ProductCategory }) {
  const accent = ACCENT_VAR[category.accent];
  const { prev, next } = adjacentCategories(category.slug);
  const index = PRODUCT_CATEGORIES.findIndex((c) => c.slug === category.slug);

  return (
    <>
      {/* ---- header ---- */}
      <section className="grain relative overflow-hidden pt-[calc(var(--nav-h)+5rem)] pb-16 sm:pb-20">
        <div className="shell">
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href={MERCH_BASE}
                  data-cursor="link"
                  className="label-tech transition-colors hover:text-bone"
                >
                  Custom Merch
                </Link>
              </li>
              <li aria-hidden="true" className="label-tech opacity-40">
                /
              </li>
              <li>
                <span className="label-tech text-bone/80" aria-current="page">
                  {category.title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="block size-2 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <SectionLabel index={String(index + 1).padStart(2, "0")}>
                  {category.kicker}
                </SectionLabel>
              </div>

              <SplitText
                as="h1"
                lines={[category.title]}
                className="display mt-6 text-display-lg"
                immediate
              />

              <Reveal delay={0.15}>
                <p className="mt-8 max-w-xl text-lede leading-[1.45] text-bone/62">
                  {category.description}
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.2}>
                <p className="label-tech">
                  {category.variants.length} constructions
                </p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {category.variants.map((v) => (
                    <li
                      key={v}
                      className="rounded-full border border-bone/18 px-3 py-1.5 font-mono text-[0.6875rem] tracking-tight text-bone/75"
                    >
                      {v}
                    </li>
                  ))}
                </ul>

                <div className="mt-9">
                  <CallButton label="Talk about this" showNumber={false} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---- the work ---- */}
      <section className="surface-bone py-16 sm:py-24">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/12 pb-6">
            <h2 className="display text-display-sm text-ink">The work</h2>
            <p className="label-tech">
              {category.images.length} pieces produced by Digitize Are Us
            </p>
          </div>

          <PlateGrid
            className="mt-8"
            columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            items={category.images.map((id, i) => ({
              id,
              // No singularising: stripping a trailing "s" turned Patches into
              // "Patche". The family name reads fine as-is.
              alt: `${category.title} — sample ${i + 1} manufactured by Digitize Are Us`,
              caption: category.title,
            }))}
          />
        </div>
      </section>

      {/* ---- move on ---- */}
      <section className="shell py-16 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryStep category={prev} direction="prev" />
          <CategoryStep category={next} direction="next" />
        </div>
      </section>
    </>
  );
}

function CategoryStep({
  category,
  direction,
}: {
  category: ProductCategory;
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={categoryHref(category.slug)}
      data-cursor="link"
      className={`group flex items-center justify-between gap-4 rounded-2xl border border-bone/12 p-6 transition-colors duration-500 hover:border-bone/35 sm:p-8 ${
        isNext ? "sm:flex-row-reverse sm:text-right" : ""
      }`}
    >
      {isNext ? (
        <ArrowRight
          aria-hidden="true"
          className="size-5 shrink-0 text-bone/45 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
        />
      ) : (
        <ArrowLeft
          aria-hidden="true"
          className="size-5 shrink-0 text-bone/45 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-x-1"
        />
      )}
      <span className="min-w-0">
        <span className="label-tech block">{isNext ? "Next" : "Previous"}</span>
        <span className="display mt-1.5 block truncate text-2xl sm:text-3xl">
          {category.title}
        </span>
      </span>
    </Link>
  );
}
