/**
 * Turns the curated slide crops into optimised site assets plus a typed
 * manifest. Run after segment-slides.mjs + score-tiles.mjs.
 *
 *   node scripts/build-assets.mjs <tilesDir> <scores.json>
 *
 * Emits public/images/**.webp and src/data/generated/images.ts
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const [, , TILES, SCORES] = process.argv;

/**
 * `--originals <dir>` also writes each curated crop as a lossless PNG at its
 * native size, named with the same id the site uses. That folder is what you
 * feed to an AI upscaler (Topaz Gigapixel, Photoshop Super Resolution, Upscayl);
 * returning the results under the same filenames is all that is needed to
 * adopt them.
 */
const ORIGINALS = (() => {
  const i = process.argv.indexOf("--originals");
  return i === -1 ? null : process.argv[i + 1];
})();
const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public", "images");
const GEN = path.join(ROOT, "src", "data", "generated");

/**
 * The deck caps out at 1920x1080 per page, so a single product tile carries
 * only ~300px of real detail. Nothing can add detail that was never captured,
 * but two things measurably improve how sharp these read:
 *
 *  1. Encode at high quality with no resampling, so we lose nothing further.
 *  2. Publish at 2x with a proper Lanczos upscale plus unsharp masking.
 *     Next's optimiser never upscales past the source, so a 300px file shown
 *     at 300 CSS px on a 2x screen gets stretched by the browser's cheap
 *     bilinear filter. Supplying a properly resampled 2x source puts that
 *     decision in sharp's hands instead, and looks visibly cleaner on retina.
 */
const UPSCALE = 2;
const MAX_W = 1600;
const QUALITY = 94;

/**
 * Curation. `hero` is chosen by eye; the rest fill galleries in score order.
 * `exclude` drops crops that carry heavy overlay wash or read badly small.
 */
const GROUPS = [
  {
    key: "manufacturing",
    picks: [
      "page_02/page_02_04.jpg", // Tajima head stitching badges
      "page_02/page_02_08.jpg", // weaving loom
      "page_02/page_02_12.jpg", // operator finishing patch stack
      "page_02/page_02_13.jpg", // cutting / press station
      "page_02/page_02_05.jpg", // multi-head embroidery line
    ],
  },
  {
    key: "patches",
    hero: "page_04/page_04_01.jpg",
    pages: ["page_04", "page_05", "page_06"],
    limit: 30,
  },
  { key: "keychains", pages: ["page_07", "page_08", "page_09"], limit: 24 },
  { key: "pvc", pages: ["page_10"], limit: 13 },
  { key: "metal", pages: ["page_11", "page_12"], limit: 20 },
  { key: "hats", pages: ["page_13", "page_14"], limit: 22 },
  { key: "labels", pages: ["page_15"], limit: 18 },
  { key: "lanyards", pages: ["page_16", "page_17"], limit: 20 },
  { key: "other", pages: ["page_18", "page_19"], limit: 20 },
];

const scores = JSON.parse(await readFile(SCORES, "utf8"));
const byRel = new Map(scores.map((r) => [r.rel, r]));

await rm(PUB, { recursive: true, force: true });
await mkdir(PUB, { recursive: true });
await mkdir(GEN, { recursive: true });

/** @type {Record<string, {src:string,width:number,height:number}>} */
const manifest = {};

/**
 * Finds the content box inside the deck's card stroke.
 *
 * Each product sits on a bordered card in the slide, and segmentation pads
 * outward far enough to catch that stroke. A flat percentage trim can't remove
 * it without also eating into the product, so instead we look for the stroke:
 * a row or column near the edge that is mostly non-white, i.e. a drawn line
 * spanning the crop. We cut just inside the innermost one found.
 */
async function innerBox(src) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width: W, height: H } = info;

  const isDark = (p) => Math.max(data[p], data[p + 1], data[p + 2]) < 228;
  const rowInk = (y) => {
    let n = 0;
    for (let x = 0; x < W; x++) if (isDark((y * W + x) * 3)) n++;
    return n / W;
  };
  const colInk = (x) => {
    let n = 0;
    for (let y = 0; y < H; y++) if (isDark((y * W + x) * 3)) n++;
    return n / H;
  };

  const LINE = 0.6; // a stroke covers most of the span; a product rarely does
  const bandY = Math.max(2, Math.floor(H * 0.14));
  const bandX = Math.max(2, Math.floor(W * 0.14));

  let top = 0, bottom = H - 1, left = 0, right = W - 1;
  for (let y = 0; y < bandY; y++) if (rowInk(y) > LINE) top = y + 1;
  for (let y = H - 1; y > H - 1 - bandY; y--) if (rowInk(y) > LINE) bottom = y - 1;
  for (let x = 0; x < bandX; x++) if (colInk(x) > LINE) left = x + 1;
  for (let x = W - 1; x > W - 1 - bandX; x--) if (colInk(x) > LINE) right = x - 1;

  // one more pixel clears the stroke's antialiased edge
  top += 1; left += 1; bottom -= 1; right -= 1;

  const width = right - left + 1;
  const height = bottom - top + 1;
  if (width < W * 0.5 || height < H * 0.5) {
    return { left: 0, top: 0, width: W, height: H }; // implausible; leave it alone
  }
  return { left, top, width, height };
}

async function emit(id, srcRel, dir) {
  const src = path.join(TILES, srcRel);
  const outDir = path.join(PUB, dir);
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, `${id}.webp`);

  const { left: dx, top: dy, width: cw, height: ch } = await innerBox(src);

  const target = Math.min(MAX_W, Math.round(cw * UPSCALE));

  const info = await sharp(src)
    .extract({ left: dx, top: dy, width: cw, height: ch })
    // median blunts the JPEG blocking in the source before it gets magnified
    .median(1)
    .resize({ width: target, kernel: sharp.kernel.lanczos3 })
    // restores edge definition the resample softens; kept mild to avoid halos
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 2 })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out);

  manifest[id] = { src: `/images/${dir}/${id}.webp`, width: info.width, height: info.height };

  if (ORIGINALS) {
    const oDir = path.join(ORIGINALS, dir);
    await mkdir(oDir, { recursive: true });
    await sharp(src)
      .extract({ left: dx, top: dy, width: cw, height: ch })
      .png({ compressionLevel: 9 })
      .toFile(path.join(oDir, `${id}.png`));
  }
}

for (const group of GROUPS) {
  let rels = [];
  if (group.picks) {
    rels = group.picks;
  } else {
    // A crop much wider than a single deck tile is really several tiles that
    // fused across a gutter, so it carries the deck's caption text, watermark
    // and overlay circles. Those can never appear on the site.
    const MERGED_W = 600;
    const pool = scores
      .filter((r) => r.keep && group.pages.includes(r.page))
      .filter((r) => r.w <= MERGED_W)
      .filter((r) => !(group.exclude ?? []).includes(r.rel))
      .sort((a, b) => b.score - a.score);
    rels = pool.slice(0, group.limit).map((r) => r.rel);
  }
  if (group.hero) {
    rels = [group.hero, ...rels.filter((r) => r !== group.hero)].slice(0, group.limit ?? rels.length);
  }

  let n = 0;
  for (const rel of rels) {
    if (!byRel.has(rel)) {
      console.warn(`  ! missing ${rel}`);
      continue;
    }
    const id = `${group.key}-${String(++n).padStart(2, "0")}`;
    await emit(id, rel, group.key);
  }
  console.log(`${group.key}: ${n} images`);
}

/* Branding is produced by scripts/build-brand.mjs from the supplied DRU logo
   artwork; this script only handles product photography. Note that it clears
   public/images wholesale, so build-brand must run *after* it — `npm run
   assets` chains them in that order. */

const ids = Object.keys(manifest).sort();
const body = `// GENERATED by scripts/build-assets.mjs -- do not edit by hand.

export type ImageAsset = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

export const IMAGES = {
${ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(manifest[id])},`).join("\n")}
} as const satisfies Record<string, ImageAsset>;

export type ImageId = keyof typeof IMAGES;

export function img(id: ImageId): ImageAsset {
  return IMAGES[id];
}
`;
await writeFile(path.join(GEN, "images.ts"), body);
console.log(`\nmanifest: ${ids.length} assets -> src/data/generated/images.ts`);
