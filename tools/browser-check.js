import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.FRAN_ZONE_URL || 'http://127.0.0.1:5173/?noshadow=1';
const outDir = path.resolve('tools/shots');

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage();
page.setDefaultTimeout(45000);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForSelector('#store');
await page.waitForFunction(() => Boolean(window.__franStore?.wisp));
await new Promise((r) => setTimeout(r, 1200));

await page.screenshot({ path: path.join(outDir, '01-entrance.png') });

await page.keyboard.down('w');
await new Promise((r) => setTimeout(r, 1800));
await page.keyboard.up('w');
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({ path: path.join(outDir, '02-walk.png') });

await page.keyboard.down('ArrowLeft');
await new Promise((r) => setTimeout(r, 700));
await page.keyboard.up('ArrowLeft');
await page.screenshot({ path: path.join(outDir, '03-pan.png') });

await page.click('#btn-plan');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '04-plan.png') });

await page.click('#btn-reset');
await page.mouse.move(720, 450);
await page.mouse.down({ button: 'middle' });
await page.mouse.move(880, 520, { steps: 8 });
await page.mouse.up({ button: 'middle' });
await page.screenshot({ path: path.join(outDir, '05-mmb-pan.png') });

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  wisp.root.position.set(12.4, 0.62, 3.4);
  controls.reset();
  controls.state.yaw = Math.PI * 0.72;
  controls.state.pitch = 0.28;
  controls.state.dist = 5.4;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '06-aisle-side.png') });

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  wisp.root.position.set(4.2, 0.62, 3.1);
  controls.reset();
  controls.state.yaw = Math.PI * 0.15;
  controls.state.pitch = 0.22;
  controls.state.dist = 5.8;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '07-cash-wrap.png') });

const report = await page.evaluate(() => {
  const { wisp, scene } = window.__franStore;
  return {
    wisp: { x: wisp.position.x, y: wisp.position.y, z: wisp.position.z },
    children: scene.children.length,
    place: document.getElementById('place-label')?.textContent,
    inspect: !document.getElementById('inspect')?.hidden,
  };
});

await browser.close();

const real = errors.filter(
  (e) => !/MeshDepthMaterial|Shader Error|Program Info Log/i.test(e),
);
if (real.length) {
  console.error('PAGE ERRORS\n' + real.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, report, shots: outDir }, null, 2));
