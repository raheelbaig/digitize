/**
 * Exhaustive audit of every image the PDF contains, so claims about its
 * maximum resolution are evidence rather than assumption.
 *
 *   node scripts/audit-pdf.mjs "<file.pdf>"
 *
 * Walks all indirect objects (including any inside object streams) and reports
 * every image XObject with its declared pixel dimensions, filter and stream
 * length. Image data cannot live inside an object stream, so a raw scan of the
 * file is guaranteed to see all of them.
 */
import { readFile } from "node:fs/promises";
import zlib from "node:zlib";

const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node scripts/audit-pdf.mjs "<file.pdf>"');
  process.exit(1);
}

const data = await readFile(SRC);
const ascii = data.toString("latin1");

// --- every occurrence of an image XObject, however it is nested -------------
const marker = /\/Subtype\s*\/Image/g;
const hits = [...ascii.matchAll(marker)];

console.log(`file            ${SRC}`);
console.log(`size            ${(data.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`/Subtype /Image occurrences: ${hits.length}\n`);

const intOf = (dict, key) => {
  const m = dict.match(new RegExp(`/${key}\\s+(\\d+)`));
  return m ? Number(m[1]) : null;
};

const rows = [];
for (const hit of hits) {
  // widen to the enclosing dictionary
  const start = ascii.lastIndexOf("<<", hit.index);
  const end = ascii.indexOf("stream", hit.index);
  const dict = ascii.slice(start, end === -1 ? hit.index + 400 : end);

  const filter = (dict.match(/\/Filter\s*(\/\w+|\[[^\]]*\])/) ?? [, "-"])[1];
  const len = intOf(dict, "Length");
  rows.push({
    w: intOf(dict, "Width"),
    h: intOf(dict, "Height"),
    bpc: intOf(dict, "BitsPerComponent"),
    filter,
    bytes: len,
  });
}

rows.sort((a, b) => (b.w ?? 0) * (b.h ?? 0) - (a.w ?? 0) * (a.h ?? 0));
console.log("all image XObjects, largest first:");
for (const r of rows) {
  console.log(
    `  ${String(`${r.w}x${r.h}`).padEnd(12)} ${String(r.bpc ?? "?").padEnd(3)}bpc  ` +
      `${String(r.filter).padEnd(16)} ${r.bytes?.toLocaleString() ?? "?"} bytes`,
  );
}

const max = rows[0];
console.log(
  `\nlargest image in the file: ${max.w}x${max.h} (${(
    (max.w * max.h) / 1e6
  ).toFixed(2)} MP)`,
);

// --- confirm nothing is hiding inside object streams ------------------------
let objStmImages = 0;
const objStm = /\/Type\s*\/ObjStm/g;
let m;
while ((m = objStm.exec(ascii))) {
  const sIdx = ascii.indexOf("stream", m.index);
  const eIdx = ascii.indexOf("endstream", sIdx);
  if (sIdx === -1 || eIdx === -1) continue;
  let p = sIdx + 6;
  if (ascii[p] === "\r") p++;
  if (ascii[p] === "\n") p++;
  try {
    const inflated = zlib.inflateSync(data.subarray(p, eIdx)).toString("latin1");
    objStmImages += (inflated.match(/\/Subtype\s*\/Image/g) ?? []).length;
  } catch {
    /* not flate, or truncated — ignore */
  }
}
console.log(`image XObjects inside object streams: ${objStmImages} (expected 0)`);
