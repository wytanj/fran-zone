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
await page.waitForFunction(() => Boolean(window.__franStore?.wisp));
await new Promise((r) => setTimeout(r, 900));

const walk = await page.evaluate(async () => {
  const { wisp, onWalkable, placeName, boh, blockersAt } = window.__franStore;

  const corridor = [];
  for (let z = 6.2; z <= 8.2; z += 0.1) {
    const x = 4.1;
    corridor.push({ x, z: +z.toFixed(2), walk: onWalkable(x, z), hit: blockersAt(x, z) });
  }
  const samples = [
    ['sales', 8.0, 3.5],
    ['stock-door', 3.88, 7.2],
    ['receiving', 3.88, 7.8],
    ['staff', 3.6, 8.6],
    ['mid-aisle', 6.4, 8.2],
    ['south-aisle', 5.4, 9.95],
    ['stock-deep', 5.0, 10.7],
    ['locker-door', 0.2, 6.0],
    ['locker', -0.9, 6.3],
    ['experience', 13.2, 7.8],
    ['outside', 1.0, 9.0],
  ];
  const points = samples.map(([id, x, z]) => ({
    id,
    x,
    z,
    walk: onWalkable(x, z),
    place: placeName(x, z),
  }));

  function tick(n = 90) {
    for (let i = 0; i < n; i += 1) wisp.update(0.05, i * 0.05);
  }

  wisp.root.position.set(17.35, 0.62, 3.35);
  wisp.walkTo(6.2, 8.4);
  tick(220);
  const intoStock = {
    x: +wisp.position.x.toFixed(2),
    z: +wisp.position.z.toFixed(2),
    place: placeName(wisp.position.x, wisp.position.z),
  };

  wisp.root.position.set(4.2, 0.62, 3.4);
  wisp.walkTo(-0.8, 6.3);
  tick(140);
  const intoLocker = {
    x: +wisp.position.x.toFixed(2),
    z: +wisp.position.z.toFixed(2),
    place: placeName(wisp.position.x, wisp.position.z),
  };

  return { points, corridor, intoStock, intoLocker, racks: boh.racks };
});

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  wisp.root.position.set(4.1, 0.62, 5.9);
  controls.reset();
  controls.state.yaw = 0.02;
  controls.state.pitch = 0.18;
  controls.state.dist = 4.2;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '33-stock-door-sales.png') });

await page.evaluate(() => {
  document.getElementById('inspect').hidden = true;
  window.__franStore.controls.setPlan(true);
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: path.join(outDir, '30-plan-xray.png') });

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  wisp.root.position.set(6.2, 0.62, 8.4);
  controls.setPlan(false);
  controls.setFollow(true);
  controls.state.yaw = Math.PI * 0.12;
  controls.state.pitch = 0.48;
  controls.state.dist = 6.4;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '31-stock-walk.png') });

await page.evaluate(() => {
  const { wisp, controls } = window.__franStore;
  wisp.root.position.set(-0.7, 0.62, 6.3);
  controls.reset();
  controls.state.yaw = Math.PI * 0.55;
  controls.state.pitch = 0.32;
  controls.state.dist = 3.8;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(outDir, '32-locker-walk.png') });

await browser.close();

const real = errors.filter((e) => !/MeshDepthMaterial|Shader Error|Program Info Log/i.test(e));
const mustWalk = ['sales', 'stock-door', 'receiving', 'staff', 'mid-aisle', 'south-aisle', 'stock-deep', 'locker-door', 'locker', 'experience'];
const failed = [];
for (const id of mustWalk) {
  const p = walk.points.find((s) => s.id === id);
  if (!p?.walk) failed.push(`${id} should be walkable`);
}
if (walk.points.find((s) => s.id === 'outside')?.walk) failed.push('outside should be blocked');
if (walk.racks !== 14) failed.push(`expected 14 racks, got ${walk.racks}`);
const blockedCell = walk.corridor.find((c) => !c.walk || (c.hit && c.hit.length));
if (blockedCell) failed.push(`door corridor blocked at ${JSON.stringify(blockedCell)}`);
if (!/stock/i.test(walk.intoStock.place)) failed.push(`walk into stock failed: ${JSON.stringify(walk.intoStock)}`);
if (!/locker/i.test(walk.intoLocker.place)) failed.push(`walk into locker failed: ${JSON.stringify(walk.intoLocker)}`);

console.log(JSON.stringify({ walk, failed, errors: real }, null, 2));
if (real.length || failed.length) process.exit(1);
console.log('BOH + xray verify ok');
