/**
 * Drives the plate viewer the way a visitor would and checks its behaviour.
 *
 *   node scripts/shoot-lightbox.mjs <outDir> <baseUrl>
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(name, { width, height }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => problems.push(`[${name}] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`[${name}] ${m.text()}`));

  await page.goto(`${BASE}/custom-merch/patches`, {
    waitUntil: "networkidle2",
    timeout: 90_000,
  });
  await wait(3000);

  // Reach the gallery with real wheel events. Programmatic scrollTo fights
  // Lenis, which then drifts back toward its own target and looks like a
  // freeze failure that no visitor would ever hit.
  await page.mouse.move(width / 2, height / 2);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel({ deltaY: 320 });
    await wait(160);
  }
  await wait(1600);

  const plates = await page.$$('button[aria-label^="View larger"]');
  if (plates.length < 3) {
    problems.push(`[${name}] expected clickable plates, found ${plates.length}`);
    await page.close();
    return;
  }
  const scrollBefore = await page.evaluate(() => window.scrollY);
  // Dispatch on the element itself. A real mouse click needs the plate scrolled
  // into view, and puppeteer's scrollIntoView fights Lenis on small viewports.
  await page.evaluate(() => {
    const all = document.querySelectorAll('button[aria-label^="View larger"]');
    all[2]?.click();
  });
  await wait(1100);
  await page.screenshot({ path: path.join(OUT, `${name}-open.png`) });

  // dialog semantics + focus
  const state = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      hasDialog: Boolean(d),
      modal: d?.getAttribute("aria-modal"),
      label: d?.getAttribute("aria-label"),
      focused: document.activeElement?.getAttribute("aria-label") ?? null,
      counter: d?.querySelector(".label-tech")?.textContent?.trim() ?? null,
      imgW: d?.querySelector("img")?.getBoundingClientRect().width ?? 0,
      imgNaturalW: d?.querySelector("img")?.naturalWidth ?? 0,
      plateW:
        document
          .querySelector('button[aria-label^="View larger"]')
          ?.getBoundingClientRect().width ?? 0,
    };
  });

  // scroll must be frozen behind the overlay
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.wheel({ deltaY: 600 });
  await wait(700);
  const scrollAfter = await page.evaluate(() => window.scrollY);

  // arrow key advances
  await page.keyboard.press("ArrowRight");
  await wait(900);
  const advanced = await page.evaluate(
    () =>
      document
        .querySelector('[role="dialog"] .label-tech')
        ?.textContent?.trim() ?? null,
  );
  await page.screenshot({ path: path.join(OUT, `${name}-next.png`) });

  // escape closes
  await page.keyboard.press("Escape");
  await wait(700);
  const closed = await page.evaluate(
    () => !document.querySelector('[role="dialog"]'),
  );

  console.log(`\n--- ${name} (${width}px) ---`);
  console.log(`dialog present   ${state.hasDialog}  aria-modal=${state.modal}`);
  console.log(`labelled         ${state.label}`);
  console.log(`focus on open    ${state.focused}`);
  console.log(`counter          ${state.counter}`);
  const scale = state.imgNaturalW ? state.imgW / state.imgNaturalW : 0;
  console.log(
    `image drawn      ${Math.round(state.imgW)}px from ${state.imgNaturalW}px ` +
      `(${scale.toFixed(2)}x)   grid plate is ${Math.round(state.plateW)}px`,
  );
  console.log(`scroll frozen    ${scrollBefore === scrollAfter} (${scrollBefore} -> ${scrollAfter})`);
  console.log(`arrow advanced   ${advanced}`);
  console.log(`escape closed    ${closed}`);

  await page.close();
}

await run("desktop", { width: 1440, height: 900 });
await run("mobile", { width: 390, height: 844 });

await browser.close();
if (problems.length) {
  console.log("\n--- problems ---");
  for (const p of [...new Set(problems)]) console.log(p);
} else {
  console.log("\nno console errors");
}
