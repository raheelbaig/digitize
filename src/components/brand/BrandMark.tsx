import Image from "next/image";
import { SITE } from "@/data/site";
import { BRAND_LOCKUP, BRAND_MONOGRAM } from "@/data/generated/brand";
import { cn } from "@/lib/utils/cn";

/**
 * The DRU International identity, from the client's supplied artwork.
 *
 * Two forms, as the logo itself dictates:
 *
 * - `BrandLockup` — the full mark including "INTERNATIONAL". Used where there
 *   is room for it to be read: the loader and the footer.
 * - `BrandMark` — the DRU monogram alone. "INTERNATIONAL" is set small enough
 *   that it turns to mush below roughly 64px, so tight spots (the navbar) get
 *   the monogram instead of an illegible full lockup.
 *
 * The source PNG is transparent, so both sit straight on the page. The globe's
 * continents are cut-outs rather than white fill, which means they read as the
 * surface behind them — intended, and why the logo is never placed over imagery.
 */

const LOCKUP = BRAND_LOCKUP;
const MONOGRAM = BRAND_MONOGRAM;

/**
 * Both marks render small — a nav chip, a footer block — but their intrinsic
 * files are several hundred px so they stay crisp on high-DPR screens. Without
 * `sizes`, Next would build a srcset from the intrinsic width and ship the
 * full-size asset during the intro.
 */
const SIZES = "320px";

/**
 * Every surface the logo lands on is near-black, and the artwork's globe is the
 * deep brand blue (#006db7) — around 3.8:1 there, which sinks into the page.
 * Lifting the artwork brings that blue up to roughly `--color-brand-blue-lit`,
 * the token the design system already reserves for blue on dark ground, without
 * boxing the mark in a white plate.
 */
const ON_DARK = "brightness-125 saturate-105";

type Props = {
  className?: string;
  priority?: boolean;
  /** Pass false when adjacent text already names the brand. */
  labelled?: boolean;
};

export function BrandLockup({ className, priority = false, labelled = true }: Props) {
  return (
    <Image
      src={LOCKUP.src}
      alt={labelled ? `${SITE.name} International` : ""}
      aria-hidden={labelled ? undefined : true}
      width={LOCKUP.width}
      height={LOCKUP.height}
      priority={priority}
      sizes={SIZES}
      className={cn("h-auto w-auto object-contain", ON_DARK, className)}
    />
  );
}

export function BrandMark({ className, priority = false, labelled = true }: Props) {
  return (
    <Image
      src={MONOGRAM.src}
      alt={labelled ? SITE.name : ""}
      aria-hidden={labelled ? undefined : true}
      width={MONOGRAM.width}
      height={MONOGRAM.height}
      priority={priority}
      sizes={SIZES}
      className={cn("h-auto w-auto object-contain", ON_DARK, className)}
    />
  );
}
