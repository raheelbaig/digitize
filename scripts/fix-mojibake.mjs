/**
 * Repairs UTF-8 punctuation that was mangled by a round trip through CP1252
 * (em dashes arriving as "â€”" and so on). Scans src/ and rewrites in place.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "src");

/** mojibake -> intended character */
const FIXES = [
  ["â€”", "—"], // em dash —
  ["â€“", "–"], // en dash –
  ["â€™", "’"], // right single quote ’
  ["â€œ", "“"], // left double quote “
  ["â€", "”"], // right double quote ”
  ["Â·", "·"], // middle dot ·
  ["Â ", " "], // nbsp
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|css|md)$/.test(entry.name)) yield p;
  }
}

let touched = 0;
for await (const file of walk(ROOT)) {
  const before = await readFile(file, "utf8");
  let after = before;
  for (const [bad, good] of FIXES) after = after.split(bad).join(good);
  if (after !== before) {
    await writeFile(file, after, "utf8");
    const n = [...before].length - [...after].length;
    console.log(`fixed ${path.relative(ROOT, file)} (${n} chars collapsed)`);
    touched++;
  }
}
console.log(touched ? `\n${touched} file(s) repaired` : "nothing to repair");
