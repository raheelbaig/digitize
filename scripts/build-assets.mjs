/**
 * Turns the curated slide crops into optimised site assets plus a typed
 * manifest. Run after segment-slides.mjs + score-tiles.mjs.
 *
 *   node scripts/build-assets.mjs <tilesDir> <scores.json>
 *
 * Emits public/images/**.webp and src/data/generated/images.ts
 */
import sharp from "sharp";
import { mkdir, readFile, readdir, writeFile, rm, stat } from "node:fs/promises";
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
 * Real photography, when it exists, wins over anything salvaged from the deck.
 *
 * Drop files into .assets/photography/<category>/ and that folder replaces the
 * deck crops for the whole family. Those files skip every repair step below —
 * no de-bordering, no upscaling, no artefact smoothing — because they need
 * none of it. They are only oriented, resized and encoded.
 */
const PHOTO_DIR = path.join(ROOT, ".assets", "photography");
const PHOTO_MAX_W = 1400;

/** Numeric-aware sort so "(2)" precedes "(10)". */
const natural = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

async function photographyFor(key) {
  const dir = path.join(PHOTO_DIR, key);
  try {
    if (!(await stat(dir)).isDirectory()) return null;
  } catch {
    return null;
  }
  const files = (await readdir(dir))
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort(natural);
  return files.length ? files.map((f) => path.join(dir, f)) : null;
}

/**
 * How the image should sit in its frame.
 *
 * Studio cut-outs float on white and must be contained, or the product gets
 * cropped. Photographs taken on the production floor have their own background
 * and must cover, or they sit in an ugly white margin. Rather than tag this by
 * hand per category, sample the border: a cut-out is surrounded by paper.
 */
async function borderWhiteRatio(input) {
  const S = 32;
  const { data } = await sharp(input)
    .resize(S, S, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let edge = 0, white = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (x > 1 && x < S - 2 && y > 1 && y < S - 2) continue;
      const p = (y * S + x) * 3;
      edge++;
      if (data[p] > 232 && data[p + 1] > 232 && data[p + 2] > 232) white++;
    }
  }
  return white / edge;
}

/**
 * Knocks the studio paper out of a cut-out so the product sits on the page's
 * own surface instead of inside a white box.
 *
 * The fill starts at the border and only spreads through paper, so whites that
 * are *enclosed* by the product — a white cap panel, the body of a label —
 * survive. Knocking out every white pixel instead would punch holes through
 * the middle of half the catalogue.
 *
 * Returns a WebP buffer with alpha, or null when the result looks wrong
 * (nothing removed, or so much removed that the product itself was eaten).
 */
async function knockoutPaper(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  /**
   * Seed from the corners rather than assuming pure white. Plenty of these
   * backdrops are a light grey or a faintly warm off-white, and a fixed
   * "is it 234+ on every channel" test simply refuses to start on those.
   */
  const corners = [
    0,
    (W - 1) * 4,
    (H - 1) * W * 4,
    ((H - 1) * W + W - 1) * 4,
  ].map((q) => [data[q], data[q + 1], data[q + 2]]);
  const seed = [0, 1, 2].map((c) =>
    Math.round(corners.reduce((s, px) => s + px[c], 0) / corners.length),
  );

  // Only trust the seed when it is genuinely a light backdrop; a corner that
  // caught a shadow or a product edge would otherwise drag the range off.
  const seedOk = Math.min(...seed) >= 198;
  const TOL = 22;

  // Union of the two tests, never just one: plain white backdrops are caught
  // by the fixed threshold even when a corner is dirty, and off-white or light
  // grey sweeps are caught by the seed.
  const isPaper = (i) => {
    const q = i * 4;
    const r = data[q], g = data[q + 1], b = data[q + 2];
    if (r >= 232 && g >= 232 && b >= 232) return true;
    return (
      seedOk &&
      Math.abs(r - seed[0]) <= TOL &&
      Math.abs(g - seed[1]) <= TOL &&
      Math.abs(b - seed[2]) <= TOL
    );
  };

  const outside = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  let sp = 0;
  const push = (i) => {
    if (outside[i] || !isPaper(i)) return;
    outside[i] = 1;
    stack[sp++] = i;
  };
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + W - 1);
  }
  while (sp > 0) {
    const i = stack[--sp];
    const x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }

  let removed = 0;
  for (let i = 0; i < W * H; i++) if (outside[i]) removed++;
  const frac = removed / (W * H);
  // Nothing to remove, or the frame is empty. The upper bound has to be very
  // near 1: a small product photographed on a generous white sweep genuinely
  // is 90%+ backdrop, and an earlier 0.93 ceiling was throwing those away.
  if (frac < 0.04 || frac > 0.985) return null;

  const rgba = Buffer.alloc(W * H * 4);
  data.copy(rgba);
  for (let i = 0; i < W * H; i++) if (outside[i]) rgba[i * 4 + 3] = 0;

  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: QUALITY, effort: 6, alphaQuality: 100 })
    .toBuffer();
}

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

/**
 * Manual rotations, because some photographs were simply taken upside down and
 * carry no EXIF orientation to correct. Put a rotate.json beside the images:
 *
 *   { "WhatsApp Image ... (3).jpeg": 180 }
 *
 * Guessing this automatically is not safe — a tray of loose patches genuinely
 * has items at every angle, so "the text is upside down" is not evidence the
 * photograph is.
 */
async function rotationsFor(key) {
  try {
    const raw = await readFile(path.join(PHOTO_DIR, key, "rotate.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Decides how the finished image should be presented and writes it.
 *
 * Cut-outs get their studio paper knocked out so they sit directly on the
 * page's plate surface, which is what makes a product read as a specimen
 * rather than as a screenshot of a white box. Photographs are left alone and
 * cover their frame.
 */
async function finalise(buffer, outPath) {
  let out = buffer;
  let fit = "cover";

  // `contain` is earned, not guessed: an image is only presented as a cut-out
  // once its backdrop has actually been removed. Anything else covers its
  // frame, which is what makes a leftover white box impossible rather than
  // merely unlikely. The threshold only decides whether the attempt is worth
  // making — the attempt itself decides the outcome.
  if ((await borderWhiteRatio(buffer)) > 0.6) {
    const cut = await knockoutPaper(buffer);
    if (cut) {
      out = cut;
      fit = "contain";
    }
  }

  await writeFile(outPath, out);
  const meta = await sharp(out).metadata();
  return { width: meta.width, height: meta.height, fit };
}

/** Real photography: orient, resize, encode. Nothing to repair. */
async function emitPhoto(id, srcFile, dir, turn = 0) {
  const outDir = path.join(PUB, dir);
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, `${id}.webp`);

  const rendered = await sharp(srcFile)
    // EXIF first (none of these carry it), then any manual correction
    .rotate()
    .rotate(turn)
    .resize({ width: PHOTO_MAX_W, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();

  const info = await finalise(rendered, out);
  manifest[id] = {
    src: `/images/${dir}/${id}.webp`,
    width: info.width,
    height: info.height,
    fit: info.fit,
  };
}

async function emit(id, srcRel, dir) {
  const src = path.join(TILES, srcRel);
  const outDir = path.join(PUB, dir);
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, `${id}.webp`);

  const { left: dx, top: dy, width: cw, height: ch } = await innerBox(src);

  const target = Math.min(MAX_W, Math.round(cw * UPSCALE));

  const rendered = await sharp(src)
    .extract({ left: dx, top: dy, width: cw, height: ch })
    // median blunts the JPEG blocking in the source before it gets magnified
    .median(1)
    .resize({ width: target, kernel: sharp.kernel.lanczos3 })
    // restores edge definition the resample softens; kept mild to avoid halos
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 2 })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();

  const info = await finalise(rendered, out);
  manifest[id] = {
    src: `/images/${dir}/${id}.webp`,
    width: info.width,
    height: info.height,
    fit: info.fit,
  };

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
  // Supplied photography replaces the deck entirely for this family.
  const photos = await photographyFor(group.key);
  if (photos) {
    const turns = await rotationsFor(group.key);
    let n = 0, rotated = 0;
    for (const file of photos) {
      const id = `${group.key}-${String(++n).padStart(2, "0")}`;
      const turn = Number(turns[path.basename(file)] ?? 0);
      if (turn) rotated++;
      await emitPhoto(id, file, group.key, turn);
    }
    console.log(
      `${group.key}: ${n} images  (photography${rotated ? `, ${rotated} rotated` : ""})`,
    );
    continue;
  }

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

/**
 * Next caches optimised images under .next/cache/images keyed by request URL.
 * Replacing a file leaves its URL unchanged, so without this the site keeps
 * serving the previous artwork from cache while the new file sits on disk —
 * which looks exactly like the build having silently failed.
 */
await rm(path.join(ROOT, ".next", "cache", "images"), {
  recursive: true,
  force: true,
});

const ids = Object.keys(manifest).sort();
const body = `// GENERATED by scripts/build-assets.mjs -- do not edit by hand.

export type ImageAsset = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /**
   * How the picture should sit in its frame, detected from its own edges.
   * Studio cut-outs on white are contained so nothing is cropped; photographs
   * with their own background cover the frame so there is no white margin.
   */
  readonly fit: "contain" | "cover";
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
