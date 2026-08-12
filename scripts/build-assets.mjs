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
const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public", "images");
const GEN = path.join(ROOT, "src", "data", "generated");

const MAX_W = 1600;
const QUALITY = 86;

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

/** Segmentation pads outward, which can catch the neighbouring card's hairline
 *  border. Shave a little back off before publishing. */
const TRIM = 0.025;

async function emit(id, srcRel, dir) {
  const src = path.join(TILES, srcRel);
  const outDir = path.join(PUB, dir);
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, `${id}.webp`);

  const meta = await sharp(src).metadata();
  const dx = Math.round(meta.width * TRIM);
  const dy = Math.round(meta.height * TRIM);

  const info = await sharp(src)
    .extract({
      left: dx,
      top: dy,
      width: meta.width - dx * 2,
      height: meta.height - dy * 2,
    })
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);
  manifest[id] = { src: `/images/${dir}/${id}.webp`, width: info.width, height: info.height };
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

/* ---- brand mark: crop the CMY circles and knock the white out ---- */
{
  const src = path.join(TILES, "page_01/page_01_01.jpg");
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  // The circles are the only strongly saturated pixels; the wordmark is black.
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 3;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max > 60 && (max - min) / max > 0.45) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const pad = 4;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;

  const { data: cd } = await sharp(src)
    .extract({ left: x0, top: y0, width: cw, height: ch })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // White -> transparent, un-premultiplying so edges stay clean on any ground.
  const rgba = Buffer.alloc(cw * ch * 4);
  for (let i = 0, p = 0, q = 0; i < cw * ch; i++, p += 3, q += 4) {
    const r = cd[p], g = cd[p + 1], b = cd[p + 2];
    const min = Math.min(r, g, b);
    const a = 255 - min;
    rgba[q + 3] = a;
    if (a === 0) continue;
    const k = 255 / a;
    rgba[q] = Math.max(0, Math.min(255, Math.round((r - min) * k)));
    rgba[q + 1] = Math.max(0, Math.min(255, Math.round((g - min) * k)));
    rgba[q + 2] = Math.max(0, Math.min(255, Math.round((b - min) * k)));
  }

  const outDir = path.join(PUB, "brand");
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, "logo-mark.png");
  const li = await sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } })
    .resize({ width: 512, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(out);
  manifest["logo-mark"] = { src: "/images/brand/logo-mark.png", width: li.width, height: li.height };

  // Untouched original for light backgrounds (mark + black wordmark).
  const fo = path.join(outDir, "logo-full.webp");
  const fi = await sharp(src).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 92 }).toFile(fo);
  manifest["logo-full"] = { src: "/images/brand/logo-full.webp", width: fi.width, height: fi.height };
  console.log(`brand: logo-mark ${li.width}x${li.height}, logo-full ${fi.width}x${fi.height}`);
}

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
