# fran zone

Interactive 3D play-canvas of **FRAN @ Bugis+ #01-04**.

Built from the Studio J furniture plan (`layout.pdf`), Anak retail renders (`anak-renders.pdf`), the VM bay sheet, and the FRAN brand tokens shared with fran-mobile, fran-pos, fran-crm, fran-hrm, and fran-skums.

## Run

Live: **https://fran-zone.vercel.app**

```bash
npm install
npm run dev
```

Open the printed local URL. The store is modelled at 1 unit = 1 metre.

Brand and product names on bays come from fran-skums (`sample-brands.csv` + `product-list.csv`). Refresh with `npm run catalog`.

## What’s in the scene

- Sales floor from the PL-01 plan (178 m²), including the east mall opening
- 26 wallbays with category LED headers and brand logo strips
- 2× 2-bay gondolas and 4× 3-bay gondolas + endcaps (glass hygiene on the 3-bays)
- Cash wrap, yellow canopy, graffiti brand wall
- Experience zone: terrazzo, disc Barrisol, round tester table, angled mask wall
- Stock room and locker as back-of-house volumes

## Wisp

Wisp is the browse character. WASD or click the floor to walk the aisles. On a phone, use the yellow stick.

## Panning

Panning is first-class, not an afterthought:

- Middle-mouse drag, **Shift + left drag**, or right drag
- Arrow keys
- Two-finger drag on touch
- Drag the furniture-plan minimap
- **Plan** flips to a top-down view you can pan across the unit

`F` re-attaches the camera to Wisp. `P` toggles plan view.
