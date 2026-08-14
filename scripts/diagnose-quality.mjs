/**
 * Answers two questions with evidence rather than opinion:
 *
 *  1. Is the source SMALL, or is it also BLURRY? A 300px photo that is
 *     genuinely sharp still looks fine at 300px. A 300px photo that was
 *     already a soft web thumbnail looks bad at any size, and no export
 *     setting fixes it.
 *  2. Does "export at higher DPI" (the Adobe route) add anything? We simulate
 *     it by rendering the same page data at 4x and cropping the same product.
 *
 * Sharpness is the variance of a Laplacian-style high-pass response, measured
 * on the luma channel and normalised. Higher = more real edge detail.
 */
import sharp from "sharp";
import path from "node:path";

const TILES = process.argv[2];
const SLIDES = process.argv[3];
const OUT = process.argv[4];

/** Variance of the high-frequency residual: a standard focus measure. */
async function sharpness(input) {
  const img = sharp(input).greyscale();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      // 4-neighbour Laplacian
      const lap =
        4 * data[i] - data[i - 1] - data[i + 1] - data[i - W] - data[i + W];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

const samples = [
  ["hats-03  (blue cap)", path.join(TILES, "page_13/page_13_18.jpg")],
  ["patches-01 (collage)", path.join(TILES, "page_04/page_04_01.jpg")],
  ["metal-02 (medals)", path.join(TILES, "page_12/page_12_02.jpg")],
  ["manufacturing (Tajima)", path.join(TILES, "page_02/page_02_04.jpg")],
];

console.log("--- intrinsic quality of the source crops ---");
console.log("(a genuinely sharp photo scores high even when it is small)\n");
for (const [name, file] of samples) {
  try {
    const meta = await sharp(file).metadata();
    const s = await sharpness(file);
    const verdict = s > 400 ? "sharp" : s > 150 ? "acceptable" : "SOFT / already degraded";
    console.log(
      `${name.padEnd(24)} ${String(meta.width + "x" + meta.height).padEnd(10)} ` +
        `sharpness ${s.toFixed(0).padStart(5)}   ${verdict}`,
    );
  } catch {
    console.log(`${name.padEnd(24)} (not found)`);
  }
}

// Reference: how a sharp photo scores. The whole slide is 1920px of real data.
const slide = path.join(SLIDES, "page_13.jpg");
const slideScore = await sharpness(slide);
console.log(`\n${"full slide 1920x1080".padEnd(24)} sharpness ${slideScore.toFixed(0)}`);

/* --- the "export at higher DPI" test ------------------------------------ */
// Acrobat exporting a page at 600 DPI renders the SAME 1920x1080 raster to a
// bigger canvas. Simulate that, then crop one product from it.
const REGION = { left: 1100, top: 300, width: 300, height: 240 }; // a cap on page 13

const native = await sharp(slide).extract(REGION).resize({ width: 900, kernel: "nearest" }).toBuffer();
// Materialise between stages: sharp allows only one resize per pipeline.
const rendered4x = await sharp(slide)
  .resize({ width: 1920 * 4, kernel: "lanczos3" }) // "export this page at 4x DPI"
  .jpeg({ quality: 97 })
  .toBuffer();

const bigExport = await sharp(rendered4x)
  .extract({
    left: REGION.left * 4,
    top: REGION.top * 4,
    width: REGION.width * 4,
    height: REGION.height * 4,
  })
  .resize({ width: 900 })
  .toBuffer();

const label = (t) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="30">
       <rect width="900" height="30" fill="#111"/>
       <text x="10" y="21" font-family="monospace" font-size="15" fill="#ffee55">${t}</text>
     </svg>`,
  );

const h = (await sharp(native).metadata()).height;
await sharp({ create: { width: 900, height: (h + 30) * 2 + 10, channels: 3, background: "#222" } })
  .composite([
    { input: label("A — the PDF's native pixels, magnified"), left: 0, top: 0 },
    { input: native, left: 0, top: 30 },
    { input: label("B — same page 'exported at 4x DPI', then magnified"), left: 0, top: h + 40 },
    { input: bigExport, left: 0, top: h + 70 },
  ])
  .jpeg({ quality: 95 })
  .toFile(OUT);

console.log(`\nwrote ${OUT}`);
console.log("A and B come from identical source pixels — B is only interpolated.");
