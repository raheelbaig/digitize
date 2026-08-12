/**
 * Scores each segmented tile so the weak ones (stray text runs, crops sitting
 * under the deck's translucent CMY circles) can be dropped before curation.
 */
import sharp from "sharp";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , TILES, OUTJSON] = process.argv;

const pages = (await readdir(TILES, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const rows = [];

for (const page of pages) {
  const dir = path.join(TILES, page);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort();

  for (const file of files) {
    const full = path.join(dir, file);
    const meta = await sharp(full).metadata();
    // analyse a small copy; we only need aggregate statistics
    const { data } = await sharp(full)
      .resize(120, 120, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let ink = 0, wash = 0, gray = 0, white = 0, satSum = 0, satN = 0, n = 0;
    for (let p = 0; p < data.length; p += 3) {
      const r = data[p], g = data[p + 1], b = data[p + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      n++;
      const isWhite = min > 238 && sat < 0.05;
      if (isWhite) white++;
      else {
        ink++;
        satSum += sat;
        satN++;
      }
      // pastel overlay: bright but faintly tinted
      if (max > 232 && sat > 0.06 && sat < 0.32) wash++;
      // flat neutral grey, the tone the watermark is set in
      if (sat < 0.06 && max > 200 && max < 238) gray++;
    }

    const inkFrac = ink / n;
    const washFrac = wash / n;
    const whiteFrac = white / n;
    const grayFrac = gray / n;
    // The watermark is grey lettering laid over the slide's white ground, so
    // it shows up as grey AND white together. A product shot on a grey studio
    // backdrop has plenty of grey but almost no pure white, so it is spared.
    const ghosted = whiteFrac > 0.28 && grayFrac > 0.085;
    const colourfulness = satN ? satSum / satN : 0;
    const aspect = meta.width / meta.height;

    // Text runs: sparse dark marks, almost no colour, wide and short.
    const textish = colourfulness < 0.17 && inkFrac < 0.34 && aspect > 1.7;

    // Plates are shown on white cards, so any surviving deck furniture reads
    // immediately. There are far more candidates than slots, so reject hard.
    const keep =
      !textish &&
      !ghosted &&
      inkFrac > 0.045 &&
      washFrac < 0.1 &&
      meta.width >= 150 &&
      meta.height >= 110;

    // higher = better: colourful, well-filled, free of overlay and watermark
    const score =
      colourfulness * 2 + Math.min(inkFrac, 0.6) - washFrac * 3 - grayFrac;

    rows.push({
      page,
      file,
      rel: `${page}/${file}`,
      w: meta.width,
      h: meta.height,
      aspect: +aspect.toFixed(2),
      inkFrac: +inkFrac.toFixed(3),
      washFrac: +washFrac.toFixed(3),
      whiteFrac: +whiteFrac.toFixed(3),
      grayFrac: +grayFrac.toFixed(3),
      ghosted,
      colourfulness: +colourfulness.toFixed(3),
      textish,
      keep,
      score: +score.toFixed(3),
    });
  }
}

rows.sort((a, b) => (a.page === b.page ? b.score - a.score : a.page < b.page ? -1 : 1));
await writeFile(OUTJSON, JSON.stringify(rows, null, 2));

const kept = rows.filter((r) => r.keep);
console.log(`scored ${rows.length} tiles, keeping ${kept.length}`);
for (const p of pages) {
  const all = rows.filter((r) => r.page === p);
  console.log(`  ${p}: ${all.filter((r) => r.keep).length}/${all.length}`);
}
