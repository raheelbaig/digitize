/**
 * Captures the Custom Merch dropdown in its open state, and the new routes.
 *
 *   node scripts/shoot-menu.mjs <outDir> <baseUrl>
 */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = process.argv[2];
const BASE = (process.argv[3] ?? "http://localhost:3222").replace(/\/$/, "");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

const problems = [];
const shot = async (name, url, { width = 1440, height = 900, after } = {}) => {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => problems.push(`[${name}] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`[${name}] ${m.text()}`));
  page.on("requestfailed", (r) =>
    problems.push(`[${name}] failed: ${r.url()} — ${r.failure()?.errorText}`),
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 90_000 });
  await new Promise((r) => setTimeout(r, 3200));
  if (after) await after(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`shot ${name}`);
  await page.close();
};

/** `window.lenis` is only exposed in dev builds, so fall back to native. */
const scrollTo = async (page, y) => {
  await page.evaluate((top) => {
    const lenis = window.lenis;
    if (typeof lenis?.scrollTo === "function") lenis.scrollTo(top, { immediate: true });
    else window.scrollTo(0, top);
  }, y);
  await new Promise((r) => setTimeout(r, 1400));
};

/** Hover the trigger and wait for the panel's entrance to settle. */
const openMenu = async (page) => {
  const trigger = await page.$("[data-merch-trigger]");
  if (!trigger) {
    problems.push("merch trigger not found");
    return;
  }
  const box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await new Promise((r) => setTimeout(r, 1100));
};

await shot("home-menu-open", `${BASE}/`, { after: openMenu });
await shot("home-menu-compact", `${BASE}/`, {
  after: async (page) => {
    await scrollTo(page, 1400);
    await openMenu(page);
  },
});
await shot("merch-index", `${BASE}/custom-merch`);
await shot("category-patches", `${BASE}/custom-merch/patches`);
await shot("category-hats", `${BASE}/custom-merch/hats`);
await shot("category-patches-work", `${BASE}/custom-merch/patches`, {
  after: async (page) => {
    await scrollTo(page, 900);
  },
});
await shot("mobile-menu", `${BASE}/`, {
  width: 390,
  height: 844,
  after: async (page) => {
    await page.click('button[aria-label="Open menu"]');
    await new Promise((r) => setTimeout(r, 900));
  },
});
await shot("mobile-category", `${BASE}/custom-merch/patches`, {
  width: 390,
  height: 844,
});

await browser.close();

if (problems.length) {
  console.log("\n--- problems ---");
  for (const p of [...new Set(problems)]) console.log(p);
} else {
  console.log("\nno console errors or failed requests");
}
