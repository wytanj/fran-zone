/**
 * Pull brand + product names from fran-skums files and write src/store/catalog.js.
 * Images are not in SKUMS exports — names become the shelf labels.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skums = join(here, '..', '..', 'fran-skums');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function bucket(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('cosmetic') || c.includes('makeup')) return 'makeup';
  if (c.includes('hair') || c.includes('body')) return 'hair';
  return 'skincare';
}

function productKind(name) {
  const n = (name || '').toLowerCase();
  if (/\b(spf|sun ?screen|sun ?cream|sun stick|tone.?up sun)\b/.test(n)) return 'suncare';
  if (/\b(sheet mask|mask pack|sleeping mask|wash.?off mask)\b/.test(n)) return 'mask';
  if (/\b(serum|ampoule|essence)\b/.test(n)) return 'serum';
  if (/\b(cleanser|cleansing|foam|oil cleanser|balm cleanser)\b/.test(n)) return 'cleanser';
  if (/\b(shampoo|conditioner|treatment|hair|body wash|lotion)\b/.test(n)) return 'hair';
  if (/\b(lip|tint|mascara|foundation|cushion|blush|eyeshadow|liner)\b/.test(n)) return 'makeup';
  return 'skincare';
}

const brandRows = readFileSync(join(skums, 'sample-brands.csv'), 'utf8')
  .split(/\r?\n/)
  .map(parseCsvLine)
  .filter((cells) => /^\d+$/.test(cells[1] || '') && cells[2]);

const brands = [];
const seen = new Set();
for (const cells of brandRows) {
  const name = cells[2];
  const key = name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  brands.push({
    name,
    category: bucket(cells[3]),
    country: cells[4] || 'Korea',
    official: (cells[5] || '').toLowerCase() === 'yes',
  });
}

const productsByBrand = new Map();
const kindByBrand = new Map();
const rawProducts = readFileSync(join(skums, 'product-list.csv'), 'utf8').split(/\r?\n/);
let dataStart = 0;
for (let i = 0; i < Math.min(40, rawProducts.length); i += 1) {
  const cells = parseCsvLine(rawProducts[i] || '');
  if (/^\d{6,}$/.test(cells[0] || '') && cells.length >= 6) {
    dataStart = i;
    break;
  }
}

for (let i = dataStart; i < rawProducts.length; i += 1) {
  const cells = parseCsvLine(rawProducts[i] || '');
  if (!/^\d{6,}$/.test(cells[0] || '')) continue;
  const brand = cells[2];
  const name = cells[3];
  if (!brand || !name) continue;
  const key = brand.toLowerCase();
  if (!productsByBrand.has(key)) productsByBrand.set(key, []);
  const list = productsByBrand.get(key);
  if (list.length >= 4) continue;
  if (list.some((p) => p.toLowerCase() === name.toLowerCase())) continue;
  list.push(name);
  if (!kindByBrand.has(key)) kindByBrand.set(key, productKind(name));
}

function brandsFor(cat) {
  return brands
    .filter((b) => {
      if (cat === 'makeup') return b.category === 'makeup';
      if (cat === 'hair') return b.category === 'hair';
      if (cat === 'suncare') {
        const kind = kindByBrand.get(b.name.toLowerCase());
        return b.category === 'skincare' && (kind === 'suncare' || /joseon|isntree|tocobo|skin1004|round lab|anua/i.test(b.name));
      }
      if (cat === 'mask') {
        const kind = kindByBrand.get(b.name.toLowerCase());
        return b.category === 'skincare' && (kind === 'mask' || /mediheal|biodance|vt|numbuzin|abib|dr\. althea/i.test(b.name));
      }
      if (cat === 'serum' || cat === 'cleanser' || cat === 'skincare') return b.category === 'skincare';
      return true;
    })
    .map((b) => b.name);
}

function productsFor(brandName) {
  return productsByBrand.get(brandName.toLowerCase()) || [];
}

function take(list, start, count) {
  if (!list.length) return [];
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(list[(start + i) % list.length]);
  return out;
}

const skin = brandsFor('skincare');
const makeup = brandsFor('makeup');
const hair = brandsFor('hair');
const sun = brandsFor('suncare');
const mask = brandsFor('mask');

const plan = {
  gondolas: {
    NL: { brands: take(skin, 0, 4) },
    NM: { brands: take(skin, 8, 4) },
    NR: { brands: take(makeup, 0, 5) },
    SL: { brands: take(hair, 0, 4) },
    SM: { brands: take(skin, 16, 4) },
    SR: { brands: take(sun, 0, 4) },
  },
  wallBays: {
    hair: take(hair, 0, 6),
    makeup: take(makeup, 0, 8),
    skincare: take(skin, 0, 5),
    suncare: take(sun, 0, 3),
    skincareEast: take(skin, 24, 2),
  },
  mask: take(mask, 0, 6),
};

const used = new Set(
  [
    ...Object.values(plan.gondolas).flatMap((g) => g.brands),
    ...Object.values(plan.wallBays).flat(),
    ...plan.mask,
  ].map((n) => n.toLowerCase()),
);

const catalog = {
  source: 'fran-skums sample-brands.csv + product-list.csv',
  brandCount: brands.length,
  brands: brands.filter((b) => used.has(b.name.toLowerCase())),
  productsByBrand: Object.fromEntries(
    [...used].map((key) => {
      const named = brands.find((b) => b.name.toLowerCase() === key);
      return [named?.name || key, productsByBrand.get(key) || []];
    }),
  ),
  plan,
};

const file = `/** Generated from fran-skums. Do not edit by hand — run scripts/build-catalog.mjs */
export const catalog = ${JSON.stringify(catalog, null, 2)};

export function productsForBrand(name) {
  return catalog.productsByBrand[name] || [];
}
`;

writeFileSync(join(here, '..', 'src', 'store', 'catalog.js'), file);
console.log(
  JSON.stringify(
    {
      brands: brands.length,
      withProducts: productsByBrand.size,
      skin: skin.length,
      makeup: makeup.length,
      hair: hair.length,
      plan,
    },
    null,
    2,
  ),
);
