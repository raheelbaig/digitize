/** Builds a labelled contact sheet per slide so crops can be reviewed by eye. */
import sharp from "sharp";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const [, , TILES, OUT, SCORES] = process.argv;
const CELL = 200, COLS = 8, PAD = 6, LABEL = 18;

/** Optional: keep only tiles that passed scoring, ordered best-first. */
let rank = null;
if (SCORES) {
  const rows = JSON.parse(await readFile(SCORES, "utf8"));
  rank = new Map();
  for (const r of rows) if (r.keep) rank.set(r.rel, r.score);
}

const pages = (await readdir(TILES, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

await mkdir(OUT, { recursive: true });

for (const page of pages) {
  const dir = path.join(TILES, page);
  let files = (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort();
  if (rank) {
    files = files
      .filter((f) => rank.has(`${page}/${f}`))
      .sort((a, b) => rank.get(`${page}/${b}`) - rank.get(`${page}/${a}`));
  }
  if (!files.length) continue;

  const rows = Math.ceil(files.length / COLS);
  const W = COLS * (CELL + PAD) + PAD;
  const H = rows * (CELL + PAD + LABEL) + PAD;

  const layers = [];
  for (let i = 0; i < files.length; i++) {
    const col = i % COLS, row = (i / COLS) | 0;
    const left = PAD + col * (CELL + PAD);
    const top = PAD + row * (CELL + PAD + LABEL);
    const buf = await sharp(path.join(dir, files[i]))
      .resize(CELL, CELL, { fit: "contain", background: "#ffffff" })
      .toBuffer();
    layers.push({ input: buf, left, top });
    const idx = files[i].replace(`${page}_`, "").replace(".jpg", "");
    const svg = `<svg width="${CELL}" height="${LABEL}"><text x="2" y="13" font-family="monospace" font-size="12" fill="#c00">${idx}</text></svg>`;
    layers.push({ input: Buffer.from(svg), left, top: top + CELL });
  }

  await sharp({ create: { width: W, height: H, channels: 3, background: "#eeeeee" } })
    .composite(layers)
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT, `${page}_sheet.jpg`));
  console.log(`${page}: ${files.length} tiles -> sheet`);
}
