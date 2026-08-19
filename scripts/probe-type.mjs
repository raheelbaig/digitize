import puppeteer from "puppeteer-core";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto(process.argv[2], { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 3000));
const out = await p.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { sel, text: (el.textContent || "").trim().slice(0, 28), fontSize: cs.fontSize, cls: el.className };
  };
  return [pick("#reviews-heading"), pick("#reviews h2"), pick("h2.display")].filter(Boolean);
});
console.log(JSON.stringify(out, null, 2));
await b.close();
