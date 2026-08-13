import puppeteer from 'puppeteer';

const url = process.env.FRAN_ZONE_URL || 'http://127.0.0.1:5173/?noshadow=1';
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.setDefaultTimeout(45000);
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => Boolean(window.__franStore?.wisp));
await new Promise((r) => setTimeout(r, 700));

const before = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[data-hud]')].map((el) => ({
    id: el.dataset.hud,
    min: el.classList.contains('is-min'),
    hidden: el.hidden,
  }));
  return { panels };
});

await page.click('[data-hud="view"] .hud-min');
const after = await page.evaluate(() => {
  const view = document.querySelector('[data-hud="view"]');
  return { viewMin: view.classList.contains('is-min'), follow: Boolean(document.getElementById('btn-follow')) };
});

await page.screenshot({ path: 'tools/shots/50-mobile-hud.png' });
await browser.close();

const failed = [];
if (!before.panels.length) failed.push('no hud panels');
if (!before.panels.every((p) => p.min)) failed.push(`mobile should start minimized: ${JSON.stringify(before.panels)}`);
if (after.viewMin) failed.push('view should expand after tap');
console.log(JSON.stringify({ before, after, failed }, null, 2));
if (failed.length) process.exit(1);
console.log('hud verify ok');
