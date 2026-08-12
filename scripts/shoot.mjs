/**
 * Visual QA harness. Drives the locally installed Chrome against the dev server
 * and writes screenshots at the breakpoints the design is specified for.
 *
 *   node scripts/shoot.mjs <outDir> [url] [--full] [--w=1440] [--scroll=0.5]
 *
 * Also reports console errors and failed requests, so regressions surface
 * without a manual browser pass.
 */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = process.argv[2] ?? "shots";
const URL_ = process.argv[3]?.startsWith("http") ? process.argv[3] : "http://localhost:3111/";
const args = process.argv.slice(2);
const full = args.includes("--full");
const only = args.find((a) => a.startsWith("--w="))?.slice(4);
const scrollArg = args.find((a) => a.startsWith("--scroll="))?.slice(9);
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844, dsf: 2 },
  { name: "tablet-768", width: 768, height: 1024, dsf: 2 },
  { name: "laptop-1280", width: 1280, height: 800, dsf: 1 },
  { name: "desktop-1440", width: 1440, height: 900, dsf: 1 },
  { name: "wide-1920", width: 1920, height: 1080, dsf: 1 },
];

const targets = only
  ? VIEWPORTS.filter((v) => String(v.width) === only)
  : VIEWPORTS;

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--disable-lcd-text"],
});

const problems = [];

for (const vp of targets) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
  });

  if (args.includes("--reduced")) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }

  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`[${vp.name}] console: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));
  page.on("requestfailed", (r) =>
    problems.push(`[${vp.name}] request failed: ${r.url()} — ${r.failure()?.errorText}`),
  );

  await page.goto(URL_, { waitUntil: "networkidle2", timeout: 90_000 });

  // Let the intro sequence finish and any entrance timelines settle.
  await new Promise((r) => setTimeout(r, 3200));

  const framesArg = args.find((a) => a.startsWith("--frames="))?.slice(9);

  if (framesArg) {
    // Scroll-driven work only animates when the viewport actually moves, so we
    // walk the page a screen at a time and shoot each resting position.
    const n = Number(framesArg);
    for (let i = 0; i < n; i++) {
      await page.evaluate(
        ([idx, total]) => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const top = (max * idx) / (total - 1);
          const w = window;
          // Lenis owns scrolling; drive it directly when present.
          const lenis = w.lenis;
          if (lenis?.scrollTo) lenis.scrollTo(top, { immediate: true });
          else w.scrollTo(0, top);
        },
        [i, n],
      );
      await new Promise((r) => setTimeout(r, 1400));
      const name = `${vp.name}-f${String(i).padStart(2, "0")}.png`;
      await page.screenshot({ path: path.join(OUT, name) });
    }
    console.log(`shot ${vp.name}: ${n} frames`);
  } else {
    if (scrollArg) {
      const frac = Number(scrollArg);
      await page.evaluate((f) => {
        const doc = document.documentElement;
        window.scrollTo({ top: (doc.scrollHeight - window.innerHeight) * f, behavior: "auto" });
      }, frac);
      await new Promise((r) => setTimeout(r, 2000));
    }
    const suffix = scrollArg ? `-s${scrollArg}` : "";
    await page.screenshot({
      path: path.join(OUT, `${vp.name}${suffix}.png`),
      fullPage: full,
    });
    console.log(`shot ${vp.name}${suffix}${full ? " (full)" : ""}`);
  }
  await page.close();
}

await browser.close();

if (problems.length) {
  console.log("\n--- problems ---");
  for (const p of [...new Set(problems)]) console.log(p);
} else {
  console.log("\nno console errors or failed requests");
}
