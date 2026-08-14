/**
 * The product universe. Categories and their variants are transcribed from the
 * deck's "Product Contents" slide and the individual category slides.
 *
 * Image ids resolve against src/data/generated/images.ts, which is produced by
 * scripts/build-assets.mjs from the deck's own photography.
 */
import { IMAGES, type ImageId } from "./generated/images";
import { MERCH_BASE } from "./site";

export type ProductCategory = {
  readonly slug: string;
  readonly title: string;
  /** Small technical label, e.g. "01 / 08" is derived at render time. */
  readonly kicker: string;
  readonly description: string;
  readonly variants: readonly string[];
  readonly heroImage: ImageId;
  readonly images: readonly ImageId[];
  /**
   * Accent for this category's moments of colour. The identity carries exactly
   * two hues, so the catalogue alternates between them rather than inventing a
   * spectrum the brand does not own.
   */
  readonly accent: "blue" | "green";
};

/** Collects every generated id for a prefix, in manifest order. */
function pool(prefix: string): ImageId[] {
  return (Object.keys(IMAGES) as ImageId[])
    .filter((id) => id.startsWith(`${prefix}-`))
    .sort();
}

const patches = pool("patches");
const keychains = pool("keychains");
const pvc = pool("pvc");
const metal = pool("metal");
const hats = pool("hats");
const labels = pool("labels");
const lanyards = pool("lanyards");
const other = pool("other");

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  {
    slug: "patches",
    title: "Patches",
    kicker: "Embroidery · PVC · Woven",
    description:
      "The core of the house. Nine construction methods, from dense satin-stitch embroidery to moulded PVC, woven detail and deep-pile chenille.",
    variants: [
      "Embroidery Patch",
      "PVC Patch",
      "Woven Patch",
      "Sublimation Patch",
      "Chenille Patch",
      "Leather Patch",
      "IR Patch",
      "TPU Patch",
      "Sequin Patch",
    ],
    heroImage: patches[0]!,
    images: patches,
    accent: "blue",
  },
  {
    slug: "keychains",
    title: "Key Chains",
    kicker: "Twelve constructions",
    description:
      "Woven tags, moulded PVC, stitched leather, cast metal and acrylic — small format, high repetition, built to survive a pocket.",
    variants: [
      "Embroidery Key Chain",
      "PVC Key Chain",
      "Woven Key Chain",
      "Wrist Key Chain",
      "Metal Key Chain",
      "Leather Key Chain",
      "Silicon Key Chain",
      "Felt Key Chain",
      "Chenille Key Chain",
      "Sublimation Key Chain",
      "EVA Key Chain",
      "Acrylic Key Chain",
    ],
    heroImage: keychains[0]!,
    images: keychains,
    accent: "green",
  },
  {
    slug: "pvc",
    title: "PVC Products",
    kicker: "Moulded soft goods",
    description:
      "Soft PVC moulded in full colour with raised relief — the format that holds a logo's shape when fabric cannot.",
    variants: [
      "PVC Fridge Magnet",
      "PVC Luggage Tag",
      "PVC Bottle Opener",
      "PVC Coaster",
      "PVC Zipper Pull",
      "PVC Bar Mat",
      "PVC Lapel Pin",
    ],
    heroImage: pvc[0]!,
    images: pvc,
    accent: "blue",
  },
  {
    slug: "metal",
    title: "Metal Products",
    kicker: "Struck & enamelled",
    description:
      "Die-struck, plated and enamelled hardware. Weight in the hand is the whole point of the category.",
    variants: ["Lapel Pin", "Medal", "Coin", "Cufflinks", "Tie Clip", "Dog Tag"],
    heroImage: metal[0]!,
    images: metal,
    accent: "green",
  },
  {
    slug: "hats",
    title: "Headwear",
    kicker: "Five silhouettes",
    description:
      "Trucker, baseball, snapback, bucket and beanie — decorated with embroidery, patches or woven labels.",
    variants: ["Trucker Cap", "Baseball Cap", "Snapback Cap", "Bucket Cap", "Beanie Cap"],
    heroImage: hats[0]!,
    images: hats,
    accent: "green",
  },
  {
    slug: "labels",
    title: "Labels",
    kicker: "Inside the garment",
    description:
      "The quiet part of a brand. Printed, woven, heat transfer and silicone labels, sized to the neck, hem or cuff.",
    variants: ["Printing Label", "Woven Label", "Heat Transfer Label", "Silicon Label"],
    heroImage: labels[0]!,
    images: labels,
    accent: "green",
  },
  {
    slug: "lanyards",
    title: "Lanyards",
    kicker: "Seven weaves",
    description:
      "Polyester, tube, woven and satin webbing with heat transfer or silicone decoration, plus luggage-weight straps.",
    variants: [
      "Polyester Lanyard",
      "Tube Lanyard",
      "Heat Transfer Lanyard",
      "Silicon Lanyard",
      "Luggage Lanyard",
      "Woven Lanyard",
      "Polyester + Satin Lanyard",
    ],
    heroImage: lanyards[0]!,
    images: lanyards,
    accent: "blue",
  },
  {
    slug: "other",
    title: "Other Products",
    kicker: "The rest of the kit",
    description:
      "Everything else a brand programme needs — stickers, hang tags, luggage tags, epaulettes, silicone bracelets, felt bags and blanks.",
    variants: [
      "Sticker",
      "Hand Tag",
      "Hard PVC Luggage Tag",
      "Embroidery Luggage Tag",
      "Embroidery Epaulette",
      "Silicon Bracelet",
      "Felt Bag",
      "T-Shirt",
    ],
    heroImage: other[0]!,
    images: other,
    accent: "blue",
  },
];

export const ACCENT_VAR: Record<ProductCategory["accent"], string> = {
  blue: "var(--color-brand-blue)",
  green: "var(--color-brand-green-deep)",
};

/** Total distinct variants across the catalogue — used as a real, derived stat. */
export const VARIANT_COUNT = PRODUCT_CATEGORIES.reduce(
  (n, c) => n + c.variants.length,
  0,
);

export function categoryBySlug(slug: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug);
}

/** Canonical path for a category's own page. */
export function categoryHref(slug: string): string {
  return `${MERCH_BASE}/${slug}`;
}

/** The families either side of `slug`, wrapping at both ends. */
export function adjacentCategories(slug: string): {
  prev: ProductCategory;
  next: ProductCategory;
} {
  const i = PRODUCT_CATEGORIES.findIndex((c) => c.slug === slug);
  const n = PRODUCT_CATEGORIES.length;
  return {
    prev: PRODUCT_CATEGORIES[(i - 1 + n) % n]!,
    next: PRODUCT_CATEGORIES[(i + 1) % n]!,
  };
}
