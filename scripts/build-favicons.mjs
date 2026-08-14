/**
 * Builds the icon set from the DRU monogram.
 *
 *   node scripts/build-favicons.mjs
 *
 * Source is public/images/brand/logo-monogram.png (produced by
 * build-brand.mjs) — the full lockup's "INTERNATIONAL" line is unreadable
 * below ~64px, so the icons use the monogram.
 *
 * The artwork is dark blue and green with transparent counters, which vanishes
 * on a dark browser chrome. Every icon therefore sits on the brand's white
 * ground, matching how the logo is designed to be seen.
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP = path.join(ROOT, "src", "app");
const SRC = path.join(ROOT, "public", "images", "brand", "logo-monogram.png");

const GROUND = "#ffffff";

/** Fit the mark on a square white ground with breathing room. */
async function square(size, inset = 0.86) {
  const mark = await sharp(SRC)
    .resize({
      width: Math.round(size * inset),
      height: Math.round(size * inset),
      fit: "inside",
      withoutEnlargement: false,
    })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: GROUND },
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
  [16, 32, 48].map(async (size) => ({ size, png: await square(size, 0.92) })),
);
await writeFile(path.join(APP, "favicon.ico"), toIco(ico));

// icon.png — general-purpose raster icon
await writeFile(path.join(APP, "icon.png"), await square(512, 0.84));

// apple-icon.png — iOS home screen; no transparency, no rounding of our own
await writeFile(path.join(APP, "apple-icon.png"), await square(180, 0.8));

console.log("wrote favicon.ico (16/32/48), icon.png (512), apple-icon.png (180)");
