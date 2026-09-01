// Temporary QA harness (delete after): console errors, overflow, animation checks
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const URL = process.env.QA_URL || "http://127.0.0.1:8080/";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "screenshots", "");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "narrow", width: 643, height: 645 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch({ channel: "chrome" });
const report = {};

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, colorScheme: "dark" });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 300)));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // horizontal overflow offenders
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const bad = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 2 && r.width > 24) {
        bad.push(`${el.tagName}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)}`);
      }
    });
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, offenders: bad.slice(0, 10) };
  });

  // clipped-text check inside phone frame + mode buttons
  const clipped = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, h1, h2, p").forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 0 && getComputedStyle(el).overflow === "hidden") {
        const t = (el.innerText || "").trim().slice(0, 40);
        if (t) out.push(`${el.tagName} "${t}" scrollH=${el.scrollHeight} clientH=${el.clientHeight}`);
      }
    });
    return out.slice(0, 12);
  });

  await page.screenshot({ path: OUT + `qa-${vp.name}-top.png` });

  if (vp.name === "desktop") {
    // --- exercise the demo: play sequence ---
    const playBtn = page.getByRole("button", { name: /play sequence/i });
    await playBtn.scrollIntoViewIfNeeded();
    await playBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: OUT + "qa-demo-mid.png" });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: OUT + "qa-demo-preview.png" });

    const sidecarText = await page.locator("aside").innerText();
    report.demoRanToPreview = /sandbox mounted|ProductCard/.test(sidecarText);

    // --- mode switch morph: sketch -> patch ---
    await page.getByRole("button", { name: /ScreenToPatch/ }).first().click();
    await page.waitForTimeout(900);
    const patchVisible = await page.getByText("Checkout", { exact: false }).first().isVisible().catch(() => false);
    report.modeMorphWorks = patchVisible;

    // run patch pipeline
    await page.getByRole("button", { name: /play sequence/i }).click();
    await page.waitForTimeout(8000);
    const prText = await page.locator("aside").innerText();
    report.patchRanToPR = /pull request opened|pull\/14/.test(prText);
    await page.screenshot({ path: OUT + "qa-demo-patch-pr.png" });

    // nav pill: click Architecture nav item
    await page.getByRole("button", { name: "Architecture" }).click();
    await page.waitForTimeout(1200);
    report.navPillMoved = await page.evaluate(() => {
      const pill = document.querySelector('nav[aria-label="Primary"] button .absolute, nav[aria-label="Primary"] button > div');
      return Boolean(pill);
    });
  }

  // full-page screenshot
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + `qa-${vp.name}-full.png`, fullPage: true });

  report[vp.name] = { consoleErrors: errors, overflow };
  if (clipped.length) report[vp.name].possiblyClipped = clipped;
  await page.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
