/** Confirms the header logo returns the visitor to the homepage. */
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] ?? "http://localhost:3222").replace(/\/$/, "");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SELECTOR = 'header a[aria-label*="home"]';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

await page.goto(`${BASE}/custom-merch/hats`, { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 3000));

const href = await page.evaluate(
  (sel) => document.querySelector(sel)?.getAttribute("href") ?? null,
  SELECTOR,
);
console.log("from            /custom-merch/hats");
console.log("logo href       ", href);

await page.click(SELECTOR);
await new Promise((r) => setTimeout(r, 2600));

console.log("after click     ", new URL(page.url()).pathname);
console.log(
  "h1 now          ",
  await page.evaluate(() => document.querySelector("h1")?.textContent?.slice(0, 34) ?? null),
);

await browser.close();
