/** Lists any image request the server rejects, with its status and reason. */
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] ?? "http://localhost:3222").replace(/\/$/, "");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });

for (const route of ["/custom-merch", "/custom-merch/patches", "/"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const bad = [];

  page.on("response", async (res) => {
    if (res.status() < 400) return;
    let body = "";
    try {
      body = (await res.text()).slice(0, 120);
    } catch {
      /* no body */
    }
    bad.push({ status: res.status(), url: res.url(), body });
  });

  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 90_000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  console.log(`\n${route}: ${bad.length} failed request(s)`);
  for (const b of bad.slice(0, 5)) {
    console.log(`  ${b.status}  ${decodeURIComponent(b.url).slice(0, 130)}`);
    if (b.body) console.log(`        ${b.body}`);
  }
  await page.close();
}

await browser.close();
