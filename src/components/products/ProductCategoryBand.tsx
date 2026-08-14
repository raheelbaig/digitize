"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ACCENT_VAR, categoryHref, type ProductCategory } from "@/data/products";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { PlateGrid } from "./PlateGrid";
import { cn } from "@/lib/utils/cn";

/** How many plates make a full sheet without turning into a dump. */
const PER_SHEET = 9;

/**
 * One family of products, laid out as a specimen sheet: a sticky identity
 * column naming the family and every construction it can be built in, beside a
 * grid of the actual pieces.
 */
export function ProductCategoryBand({
  category,
  index,
  total,
}: {
  category: ProductCategory;
  index: number;
  total: number;
}) {
  const accent = ACCENT_VAR[category.accent];
  const flip = index % 2 === 1;
  const plates = category.images.slice(0, PER_SHEET);

  return (
    <article
      aria-labelledby={`cat-${category.slug}`}
      className="shell border-t border-ink/12 py-16 sm:py-24"
    >
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        {/* ---- identity ---- */}
        <div className={cn("lg:col-span-4", flip && "lg:order-2 lg:col-start-9")}>
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+3rem)]">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="block size-2 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <span className="label-tech tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>

            <SplitText
              as="h3"
              id={`cat-${category.slug}`}
              lines={[category.title]}
              className="display mt-4 text-display-sm text-ink"
            />

            <Reveal delay={0.05}>
              <p className="label-tech mt-3">{category.kicker}</p>
              <p className="mt-5 max-w-sm leading-relaxed text-ink/62">
                {category.description}
              </p>

              <ul className="mt-7 flex flex-wrap gap-1.5">
                {category.variants.map((v) => (
                  <li
                    key={v}
                    className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[0.6875rem] tracking-tight text-ink/65"
                  >
                    {v}
                  </li>
                ))}
              </ul>

              <Link
                href={categoryHref(category.slug)}
                data-cursor="link"
                className="group mt-8 inline-flex items-center gap-2.5 border-b border-ink/25 pb-1.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink"
              >
                All {category.images.length} {category.title.toLowerCase()}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </Reveal>
          </div>
        </div>

        {/* ---- specimen sheet ---- */}
        <div className={cn("lg:col-span-8", flip && "lg:order-1 lg:col-start-1")}>
          <PlateGrid
            items={plates.map((id, i) => ({
              id,
              // No singularising: stripping a trailing "s" turned Patches into
              // "Patche". The family name reads fine as-is.
              alt: `${category.title} — sample ${i + 1} manufactured by Digitize Are Us`,
              caption: category.title,
            }))}
          />
        </div>
      </div>
    </article>
  );
}
