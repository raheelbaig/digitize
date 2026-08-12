/**
 * Segments individual product photographs out of the DRU portfolio slides.
 *
 * The portfolio is a 20-page deck exported as 1920x1080 JPEGs: white slides
 * holding grids of product shots, overlaid with translucent CMY circles and a
 * grey "DIGITIZE ARE US" watermark. We isolate real product pixels by keeping
 * only saturated or dark pixels -- the pastel washes and grey watermark are
 * both desaturated *and* light, so they fall out of the mask cleanly.
 */
import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
const OUT = process.argv[3];
if (!SRC || !OUT) {
  console.error("usage: node segment-slides.mjs <srcDir> <outDir>");
  process.exit(1);
}

const AW = 960; // analysis width (half of 1920)
const SAT_MIN = 0.3; // below this a pixel is "washed out" -> overlay, not product
const DARK_MAX = 150; // max-channel below this is genuinely dark ink
// Gutters between tiles run ~8-12 analysis px, so the dilation radius has to
// stay under half of that or neighbouring tiles fuse into one blob.
const DILATE = Number(process.env.DILATE ?? 2);
const MERGE_GAP = Number(process.env.MERGE_GAP ?? 2);
const EDGE_MARGIN = 16; // ignore decorative shapes hugging the slide edges
const MIN_AREA = Number(process.env.MIN_AREA ?? 500); // analysis px^2
const MIN_SIDE = Number(process.env.MIN_SIDE ?? 26); // analysis px

function buildMask(data, w, h) {
  const mask = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < mask.length; i++, p += 3) {
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const max = r > g ? (r > b ? r : b) : g > b ? g : b;
    const min = r < g ? (r < b ? r : b) : g < b ? g : b;
    const sat = max === 0 ? 0 : (max - min) / max;
    mask[i] = sat > SAT_MIN || max < DARK_MAX ? 1 : 0;
  }
  return mask;
}

/** Rows that are almost entirely masked are the dark header / footer bands. */
function bandRows(mask, w, h) {
  const bad = new Uint8Array(h);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) n += mask[y * w + x];
    if (n > w * 0.7) bad[y] = 1;
  }
  return bad;
}

function dilate(mask, w, h, r) {
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let d = -r; d <= r && !v; d++) {
        const xx = x + d;
        if (xx >= 0 && xx < w && mask[y * w + xx]) v = 1;
      }
      tmp[y * w + x] = v;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let d = -r; d <= r && !v; d++) {
        const yy = y + d;
        if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1;
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

function components(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const boxes = [];
  const stack = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    let sp = 0;
    stack[sp++] = s;
    seen[s] = 1;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0;
    while (sp > 0) {
      const i = stack[--sp];
      const x = i % w, y = (i / w) | 0;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[sp++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[sp++] = i + 1; }
      if (y > 0 && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; stack[sp++] = i - w; }
      if (y < h - 1 && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; stack[sp++] = i + w; }
    }
    boxes.push({ x0, y0, x1, y1, area });
  }
  return boxes;
}

/** Repeatedly union boxes that overlap or sit within `gap` of each other. */
function mergeBoxes(boxes, gap) {
  let list = boxes.slice();
  let merged = true;
  while (merged) {
    merged = false;
    const next = [];
    const used = new Uint8Array(list.length);
    for (let i = 0; i < list.length; i++) {
      if (used[i]) continue;
      let a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        if (used[j]) continue;
        const b = list[j];
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ox > -gap && oy > -gap) {
          a = {
            x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0),
            x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
            area: a.area + b.area,
          };
          used[j] = 1;
          merged = true;
        }
      }
      next.push(a);
    }
    list = next;
  }
  return list;
}

const files = (await readdir(SRC)).filter((f) => /\.jpg$/i.test(f)).sort();
await mkdir(OUT, { recursive: true });
const manifest = [];

for (const file of files) {
  const page = path.basename(file, ".jpg");
  const src = path.join(SRC, file);
  const meta = await sharp(src).metadata();
  const scale = meta.width / AW;
  const ah = Math.round(meta.height / scale);

  const { data } = await sharp(src)
    .resize(AW, ah, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let mask = buildMask(data, AW, ah);

  // Blank out full-width bands (headers) and the slide's outer margins.
  const bands = bandRows(mask, AW, ah);
  for (let y = 0; y < ah; y++) {
    for (let x = 0; x < AW; x++) {
      if (bands[y] || x < EDGE_MARGIN || x >= AW - EDGE_MARGIN) mask[y * AW + x] = 0;
    }
  }

  mask = dilate(mask, AW, ah, DILATE);
  let boxes = components(mask, AW, ah)
    .filter((b) => b.area >= MIN_AREA && b.x1 - b.x0 >= MIN_SIDE && b.y1 - b.y0 >= MIN_SIDE)
    .filter((b) => b.x1 - b.x0 < AW * 0.9);
  boxes = mergeBoxes(boxes, MERGE_GAP).filter(
    (b) => b.x1 - b.x0 >= MIN_SIDE && b.y1 - b.y0 >= MIN_SIDE,
  );
  // reading order
  boxes.sort((a, b) => (Math.abs(a.y0 - b.y0) > 20 ? a.y0 - b.y0 : a.x0 - b.x0));

  const dir = path.join(OUT, page);
  await mkdir(dir, { recursive: true });

  let n = 0;
  for (const b of boxes) {
    const pad = 6;
    const left = Math.max(0, Math.round((b.x0 - pad) * scale));
    const top = Math.max(0, Math.round((b.y0 - pad) * scale));
    const width = Math.min(meta.width - left, Math.round((b.x1 - b.x0 + pad * 2) * scale));
    const height = Math.min(meta.height - top, Math.round((b.y1 - b.y0 + pad * 2) * scale));
    if (width < 40 || height < 40) continue;
    const name = `${page}_${String(++n).padStart(2, "0")}.jpg`;
    await sharp(src).extract({ left, top, width, height }).jpeg({ quality: 94 }).toFile(path.join(dir, name));
    manifest.push({ page, name, left, top, width, height });
  }
  console.log(`${page}: ${n} tiles`);
}

await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\ntotal tiles: ${manifest.length}`);
