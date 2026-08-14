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
 * The source PNG is transparent, so both sit on any surface. The globe's
 * continents are cut-outs rather than white fill, which means they read as the
 * page behind them — intended, and why the logo is never placed over imagery.
 */

const LOCKUP = BRAND_LOCKUP;
const MONOGRAM = BRAND_MONOGRAM;

/**
 * Both marks render small — a nav chip or a footer plate — but their intrinsic
 * files are several hundred px so they stay crisp on high-DPR screens. Without
 * `sizes`, Next would build a srcset from the intrinsic width and ship the
 * full-size asset during the intro.
 */
const SIZES = "200px";

type Props = {
  className?: string;
  priority?: boolean;
  /** Pass false when adjacent text already names the brand. */
  labelled?: boolean;
  /**
   * Sit the logo on its intended white ground. The mark's globe is the deep
   * brand blue, which falls to roughly 3.8:1 against the page's near-black —
   * legible, but muddy. On dark surfaces the plate keeps the artwork exactly
   * as drawn instead of recolouring it.
   */
  plate?: boolean;
};

const PLATE = "inline-flex items-center justify-center rounded-md bg-bone px-2 py-1.5";

export function BrandLockup({
  className,
  priority = false,
  labelled = true,
  plate = false,
}: Props) {
  const img = (
    <Image
      src={LOCKUP.src}
      alt={labelled ? `${SITE.name} International` : ""}
      aria-hidden={labelled ? undefined : true}
      width={LOCKUP.width}
      height={LOCKUP.height}
      priority={priority}
      sizes={SIZES}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
  return plate ? <span className={PLATE}>{img}</span> : img;
}

export function BrandMark({
  className,
  priority = false,
  labelled = true,
  plate = false,
}: Props) {
  const img = (
    <Image
      src={MONOGRAM.src}
      alt={labelled ? SITE.name : ""}
      aria-hidden={labelled ? undefined : true}
      width={MONOGRAM.width}
      height={MONOGRAM.height}
      priority={priority}
      sizes={SIZES}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
  return plate ? <span className={PLATE}>{img}</span> : img;
}
