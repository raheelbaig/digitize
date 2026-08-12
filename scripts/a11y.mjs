/** Structural accessibility checks against the rendered page. */
import puppeteer from "puppeteer-core";

const URL_ = process.argv[2] ?? "http://localhost:3222/";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL_, { waitUntil: "networkidle2", timeout: 90_000 });
await new Promise((r) => setTimeout(r, 3000));

const report = await page.evaluate(() => {
  const out = {};

  // headings, in document order
  out.headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
    level: Number(h.tagName[1]),
    text: (h.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 58),
  }));

  // heading level jumps (e.g. h2 -> h4)
  out.jumps = [];
  let prev = 0;
  for (const h of out.headings) {
    if (prev && h.level > prev + 1) out.jumps.push(`h${prev} -> h${h.level}: "${h.text}"`);
    prev = h.level;
  }

  const imgs = [...document.querySelectorAll("img")];
  out.imgTotal = imgs.length;
  out.imgNoAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
  out.imgEmptyAlt = imgs.filter((i) => i.getAttribute("alt") === "").length;
  out.imgNoDims = imgs.filter(
    (i) => !i.width || !i.height,
  ).length;

  // interactive elements with no accessible name
  const named = (el) =>
    (el.textContent ?? "").trim() ||
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.querySelector("img[alt]:not([alt=''])") ||
    el.querySelector(".sr-only");
  out.namelessControls = [...document.querySelectorAll("a[href],button")]
    .filter((el) => !named(el))
    .map((el) => el.tagName.toLowerCase() + "." + (el.className || "").slice(0, 40));

  out.landmarks = {
    main: document.querySelectorAll("main").length,
    header: document.querySelectorAll("header").length,
    footer: document.querySelectorAll("footer").length,
    nav: document.querySelectorAll("nav").length,
  };

  out.htmlLang = document.documentElement.lang;
  out.title = document.title;
  out.metaDescription =
    document.querySelector('meta[name="description"]')?.getAttribute("content")?.length ?? 0;
  out.h1Count = document.querySelectorAll("h1").length;

  // any link that opens a new tab without rel protection
  out.unsafeTargets = [...document.querySelectorAll('a[target="_blank"]')].filter(
    (a) => !(a.getAttribute("rel") ?? "").includes("noreferrer"),
  ).length;

  return out;
});

// keyboard reachability: tab through and collect the focus ring order
const tabOrder = [];
for (let i = 0; i < 14; i++) {
  await page.keyboard.press("Tab");
  tabOrder.push(
    await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "(none)";
      const label =
        (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 34) ||
        el.getAttribute("aria-label") ||
        "";
      return `${el.tagName.toLowerCase()} "${label}"`;
    }),
  );
}

console.log(`title            ${report.title}`);
console.log(`html lang        ${report.htmlLang}`);
console.log(`meta desc chars  ${report.metaDescription}`);
console.log(`h1 count         ${report.h1Count}`);
console.log(`landmarks        ${JSON.stringify(report.landmarks)}`);
console.log(`images           ${report.imgTotal} total, ${report.imgNoAlt} missing alt, ${report.imgEmptyAlt} decorative, ${report.imgNoDims} without dimensions`);
console.log(`unsafe _blank    ${report.unsafeTargets}`);
console.log(`nameless ctrls   ${report.namelessControls.length ? report.namelessControls.join(", ") : "none"}`);
console.log(`heading jumps    ${report.jumps.length ? report.jumps.join(" | ") : "none"}`);
console.log(`\nheading outline:`);
for (const h of report.headings) console.log(`  ${"  ".repeat(h.level - 1)}h${h.level} ${h.text}`);
console.log(`\nfirst 14 tab stops:`);
for (const t of tabOrder) console.log(`  ${t}`);

await browser.close();
