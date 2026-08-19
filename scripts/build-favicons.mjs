/**
 * Builds the icon set from the DRU monogram.
 *
 *   node scripts/build-favicons.mjs
 *
 * Source is public/images/brand/logo-monogram.png (produced by
 * build-brand.mjs) — the full lockup's "INTERNATIONAL" line is unreadable
 * below ~64px, so the icons use the monogram.
 *
 * The icons are transparent so they take on whatever browser chrome they land
 * in. That cuts both ways: the artwork's blue (#006db7) is too deep to hold up
 * on a dark tab strip, but the green is already light for a pale one. So only
 * the blue is lifted, and only to --color-brand-blue-lit, the token the design
 * system reserves for blue on dark ground. BrandMark reaches the same place
 * with a CSS filter; a favicon has no stylesheet, so it is baked in here.
 *
 * iOS is the exception: it composites transparent home-screen icons onto black
 * with no say from us, so apple-icon gets the page's ink deliberately.
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP = path.join(ROOT, "src", "app");
const SRC = path.join(ROOT, "public", "images", "brand", "logo-monogram.png");

/** All mirror globals.css. */
const INK = "#08080c";
const BLUE = [0x00, 0x6d, 0xb7];
const GREEN = [0x00, 0xc9, 0x77];
const BLUE_LIT = [0x1f, 0x9a, 0xe4];

const DELTA = BLUE_LIT.map((v, i) => v - BLUE[i]);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/**
 * Repaint the blue half of the two-colour artwork, leaving the green as drawn.
 *
 * Each pixel gets the blue delta weighted by how blue it is relative to green,
 * rather than being snapped to one of the two. Snapping would put a seam
 * through the teal where the green R crosses the globe — 3% of the artwork,
 * too much to treat as an antialiasing rounding error. Run at full resolution
 * so the downscale antialiases the corrected colour.
 */
async function lifted() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] === 0) continue;
    const px = [data[i], data[i + 1], data[i + 2]];
    const toBlue = dist(px, BLUE);
    const blueness = dist(px, GREEN) / (toBlue + dist(px, GREEN));
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(0, Math.min(255, Math.round(px[c] + DELTA[c] * blueness)));
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toBuffer();
}

const ART = await lifted();

/**
 * Fit the mark on a square canvas. `ground` is null for a transparent icon.
 *
 * The monogram is roughly 3:2, so a square crop is mostly empty above and
 * below it; with no ground to frame the mark, the inset is near 1 to buy back
 * what presence a 16px tab strip allows.
 */
async function square(size, inset = 0.86, ground = null) {
  const mark = await sharp(ART)
    .resize({
      width: Math.round(size * inset),
      height: Math.round(size * inset),
      fit: "inside",
      withoutEnlargement: false,
    })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: ground ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Wrap PNGs in an ICO container (one directory entry per size). */
function toIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    dir.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...dir, ...entries.map((x) => x.png)]);
}

// favicon.ico — 16/32/48 so the browser picks the crispest for its chrome
const ico = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, png: await square(size, 0.98) })),
);
await writeFile(path.join(APP, "favicon.ico"), toIco(ico));

// icon.png — general-purpose raster icon
await writeFile(path.join(APP, "icon.png"), await square(512, 0.96));

// apple-icon.png — iOS home screen; ink ground, no rounding of our own
await writeFile(path.join(APP, "apple-icon.png"), await square(180, 0.8, INK));

console.log("wrote favicon.ico (16/32/48), icon.png (512), apple-icon.png (180)");
