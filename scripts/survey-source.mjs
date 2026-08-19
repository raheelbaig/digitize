/**
 * Read-only survey of an approved image source: what pages exist, how many
 * product images they carry and at what intrinsic resolution. Downloads
 * nothing beyond normal page rendering.
 *
 *   node scripts/survey-source.mjs <url>
 */
import puppeteer from "puppeteer-core";

const URL_ = process.argv[2];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
);

let status = 0;
page.on("response", (r) => {
  if (r.url().replace(/\/$/, "") === URL_.replace(/\/$/, "")) status = r.status();
});

await page.goto(URL_, { waitUntil: "networkidle2", timeout: 90_000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 700) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 130));
  }
});
await new Promise((r) => setTimeout(r, 2000));

const info = await page.evaluate(() => {
  const imgs = [...document.images]
    .map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight }))
    .filter((i) => i.w >= 200);
  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && !h.startsWith("#") && !h.startsWith("mailto") && !h.startsWith("tel"));
  return {
    title: document.title,
    platform: document.querySelector('meta[name="generator"]')?.content ?? "(unknown)",
    imgs,
    links: [...new Set(links)],
  };
});

console.log(`status    ${status}`);
console.log(`title     ${info.title}`);
console.log(`generator ${info.platform}`);
console.log(`\nproduct-sized images: ${info.imgs.length}`);
const widths = info.imgs.map((i) => i.w).sort((a, b) => a - b);
if (widths.length) {
  console.log(`width  min ${widths[0]}  median ${widths[Math.floor(widths.length / 2)]}  max ${widths.at(-1)}`);
}
for (const i of info.imgs.slice(0, 14)) {
  console.log(`  ${String(i.w + "x" + i.h).padEnd(11)} ${i.src.slice(0, 96)}`);
}

const product = info.links.filter((h) => /patch|hat|cap|keychain|lanyard|label|pin|coin|sticker|shirt|chenille|leather|velcro|pvc|metal/i.test(h));
console.log(`\nproduct-ish routes: ${product.length}`);
for (const h of product.slice(0, 30)) console.log(`  ${h}`);

await browser.close();
