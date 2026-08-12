/**
 * Rasterises src/app/icon.svg into the two formats SVG favicons cannot cover:
 *
 *   favicon.ico     32px, for browsers without SVG favicon support
 *   apple-icon.png  180px on solid ink — iOS composites home-screen icons onto
 *                   black, so a transparent mark would lose its yellow lobe
 *
 * Run: node scripts/build-favicons.mjs
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const APP = path.resolve(import.meta.dirname, "..", "src", "app");
const svg = await readFile(path.join(APP, "icon.svg"));

/** Wrap a PNG in a single-entry ICO container. */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12); // offset

  return Buffer.concat([header, entry, png]);
}

// --- favicon.ico (transparent, 32px) ---
const ico32 = await sharp(svg, { density: 384 })
  .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await writeFile(path.join(APP, "favicon.ico"), pngToIco(ico32, 32));

// --- apple-icon.png (180px, ink ground, mark inset) ---
const mark = await sharp(svg, { density: 720 })
  .resize(140, 140, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

await sharp({
  create: { width: 180, height: 180, channels: 4, background: "#08080c" },
})
  .composite([{ input: mark, gravity: "centre" }])
  .png()
  .toFile(path.join(APP, "apple-icon.png"));

console.log("wrote favicon.ico (32px) and apple-icon.png (180px)");
