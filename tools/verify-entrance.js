import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.FRAN_ZONE_URL || 'http://127.0.0.1:5173/?noshadow=1';
const outDir = path.resolve('tools/shots');
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.setDefaultTimeout(45000);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => Boolean(window.__franStore?.wisp));
await new Promise((r) => setTimeout(r, 800));

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  document.getElementById('inspect').hidden = true;
  wisp.root.position.set(21.1, 0.62, 3.4);
  controls.reset();
  controls.setFollow(false);
  controls.state.look.set(19.4, 1.15, 3.4);
  controls.state.yaw = Math.PI / 2;
  controls.state.pitch = 0.12;
  controls.state.dist = 4.4;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '40-entrance-mall.png') });

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  wisp.root.position.set(17.4, 0.62, 3.4);
  controls.reset();
  controls.setFollow(false);
  controls.state.look.set(18.6, 1.2, 3.4);
  controls.state.yaw = -Math.PI / 2;
  controls.state.pitch = 0.1;
  controls.state.dist = 3.6;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '41-entrance-inside.png') });

await page.evaluate(() => {
  window.__franStore.controls.setPlan(true);
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '42-entrance-plan.png') });

await browser.close();
const real = errors.filter((e) => !/MeshDepthMaterial|Shader Error|Program Info Log/i.test(e));
if (real.length) {
  console.error(real.join('\n'));
  process.exit(1);
}
console.log('entrance shots ok');
