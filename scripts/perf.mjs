/**
 * Measures the production page: transfer weight by type, LCP, CLS and long
 * tasks. Run against `next start`, not the dev server.
 *
 *   node scripts/perf.mjs http://localhost:3222/
 */
import puppeteer from "puppeteer-core";

const URL_ = process.argv[2] ?? "http://localhost:3222/";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

// Encoded (on-the-wire) sizes come from CDP; response.buffer() would report
// the decompressed payload and overstate transfer by ~3x for JS.
const byType = new Map();
let total = 0;
const typeById = new Map();

const cdp = await page.createCDPSession();
await cdp.send("Network.enable");
cdp.on("Network.responseReceived", (e) => typeById.set(e.requestId, e.type));
cdp.on("Network.loadingFinished", (e) => {
  const type = (typeById.get(e.requestId) ?? "Other").toLowerCase();
  const size = e.encodedDataLength ?? 0;
  total += size;
  byType.set(type, (byType.get(type) ?? 0) + size);
});

await page.evaluateOnNewDocument(() => {
  window.__vitals = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0, shifts: [] };
  const describe = (n) => {
    if (!n || n.nodeType !== 1) return "(unknown)";
    const el = /** @type {Element} */ (n);
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 3).join(".");
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""}`;
  };
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__vitals.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__vitals.cls += e.value;
      if (e.value > 0.01) {
        window.__vitals.shifts.push({
          value: +e.value.toFixed(4),
          nodes: [...(e.sources ?? [])].slice(0, 3).map((s) => describe(s.node)),
        });
      }
    }
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__vitals.longTasks++;
      window.__vitals.longTaskMs += e.duration;
    }
  }).observe({ type: "longtask", buffered: true });
});

await page.goto(URL_, { waitUntil: "networkidle2", timeout: 90_000 });
await new Promise((r) => setTimeout(r, 3500));

const initial = await page.evaluate(() => ({ ...window.__vitals }));

// Walk the page with real wheel events so Lenis smooths them exactly as it
// would for a visitor. Instant jumps make pinned sections register as layout
// shifts that a person scrolling would never experience.
await page.mouse.move(720, 450);
for (let i = 0; i < 90; i++) {
  await page.mouse.wheel({ deltaY: 320 });
  await new Promise((r) => setTimeout(r, 70));
  const done = await page.evaluate(
    () =>
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 4,
  );
  if (done) break;
}
await new Promise((r) => setTimeout(r, 2500));

const after = await page.evaluate(() => ({ ...window.__vitals }));
const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

console.log(`\nURL          ${URL_}`);
console.log(`page height  ${docHeight}px (${(docHeight / 900).toFixed(1)} viewports)`);
console.log(`\n--- initial viewport ---`);
console.log(`LCP          ${initial.lcp.toFixed(0)} ms`);
console.log(`CLS          ${initial.cls.toFixed(4)}`);
console.log(`long tasks   ${initial.longTasks} (${initial.longTaskMs.toFixed(0)} ms total)`);

console.log(`\n--- after scrolling the whole page ---`);
console.log(`CLS          ${after.cls.toFixed(4)}`);
console.log(`long tasks   ${after.longTasks} (${after.longTaskMs.toFixed(0)} ms total)`);

const top = after.shifts.sort((a, b) => b.value - a.value).slice(0, 8);
if (top.length) {
  console.log(`\n--- biggest shifts ---`);
  for (const s of top) console.log(`${String(s.value).padEnd(8)} ${s.nodes.join(" , ")}`);
}

console.log(`\n--- transfer (encoded / on the wire) ---`);
for (const [type, size] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${type.padEnd(12)} ${kb(size)}`);
}
console.log(`${"TOTAL".padEnd(12)} ${kb(total)}`);

await browser.close();
