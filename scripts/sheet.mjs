/** Tiles a flat folder of screenshots into one labelled review sheet. */
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const [, , DIR, OUT, colsArg] = process.argv;
const COLS = Number(colsArg ?? 3);
const CW = 460, CH = 288, PAD = 6, LAB = 16;

const files = (await readdir(DIR)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
const rows = Math.ceil(files.length / COLS);
const W = COLS * (CW + PAD) + PAD;
const H = rows * (CH + PAD + LAB) + PAD;

const layers = [];
for (let i = 0; i < files.length; i++) {
  const c = i % COLS, r = Math.floor(i / COLS);
  const left = PAD + c * (CW + PAD);
  const top = PAD + r * (CH + PAD + LAB);
  layers.push({
    input: await sharp(path.join(DIR, files[i]))
      .resize(CW, CH, { fit: "contain", background: "#222" })
      .toBuffer(),
    left,
    top,
  });
  const label = files[i].replace(/\.(png|jpe?g|webp)$/i, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${LAB}"><text x="3" y="12" font-family="monospace" font-size="11" fill="#ffee55">${label}</text></svg>`;
  layers.push({ input: Buffer.from(svg), left, top: top + CH });
}

await sharp({ create: { width: W, height: H, channels: 3, background: "#111111" } })
  .composite(layers)
  .jpeg({ quality: 80 })
  .toFile(OUT);

console.log(`sheet ${W}x${H} from ${files.length} shots -> ${OUT}`);
