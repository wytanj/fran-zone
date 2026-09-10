# Idea: Fran Zone Heist (Pizza Possum energy)

> **Superseded for build planning by [FRAN_GAME.md](FRAN_GAME.md) — this file remains the short idea note.**

**Date:** 2026-09-08  
**Status:** funny future mode · idea only · not a build unlock  
**Host:** `fran-zone` (Bugis+ 3D floor — https://fran-zone.vercel.app)  
**Not this:** `fran-web` SUNFALL / Fran Sun Run (TowerFall-inspired arena boss fight)

---

## Why not just extend fran-web TowerFall?

`fran-web` already went deep on **TowerFall → SUNFALL**: arena platforms, arrows/rays, bosses mapped to skincare villains (Sebum, Dry Skin, Dark Circles, Breakout, The Sun), creeps, PartyKit lobby. That’s a **fight game**.

This idea wants **snackable aisle chaos** — grab stuff, don’t get caught, one more run. That’s Pizza Possum DNA, and it wants the **real store** as the map. fran-zone already has:

- Real Bugis+ metres + fixtures (wallbays, gondolas, endcaps, lightboxes, cash wrap)
- **Wisp** walker (WASD / stick / click-to-move)
- Catalog hooks from fran-skums brands/products (even if merch is still partly procedural)

Reuse the *floor*, not the arena combat stack.

---

## One-liner

**60 seconds. Steal as many Fran products as you can. Don’t get caught. Daily leaderboard.**

You are a mischievous Wisp (or a tiny raccoon BA — TBD). Mall dogs / security / “glow cops” patrol. Bushes → endcaps / mask wall / stock-room doorway. Fat score from hero SKUs and giant “tester cakes.” Steal the crown = swipe the **cashier lightbox hero** or the **mask-wall centerpiece**.

---

## Loop (Pizza Possum → Fran)

| Possum | Fran Zone Heist |
|--------|------------------|
| Eat food for score / keys | **Yoink** shelf products (tap/overlap pickup) |
| Guard dogs | Patrolling **security / brand ambassadors on break / UV dogs** (cute, not scary) |
| Hide in bushes | Duck behind **gondolas, endcaps, Barrisol disc, BOH door** |
| Giant cake | Oversized **hero SKU / gift set** on a bay (slow chomp, huge points) |
| Crown + king pizza | Final flex: yoink the **queue lightbox** or **mask-wall icon** |
| Personal high score | **Daily leaderboard** (SGT day bucket) + optional weekly |
| Local co-op raccoon | 2 Wisps, shared timer, combined haul (later) |

### Timer
- Hard **60s** run (arcade coin feel).  
- Optional “overtime crumb”: +5s if you bank a hero in the last 10s (risk).

### Score
- Base: +1 per SKU stolen (or weighted by fran-skums price tier later).  
- Combos: same bay streak, category set bonus (e.g. full suncare pocket).  
- Caught = run ends; haul still submits (Possum-style “your snack score”).

### Catch rules (keep simple)
- Line of sight + proximity, not full stealth sim.  
- One hit = busted (snackable, not souls-like).  
- Smoke bomb / tester spray = Fran power-up (P1).

---

## What we reuse from fran-zone vs fran-web

| Need | Source |
|------|--------|
| Map / fixtures / metres | **fran-zone** `store/layout.js`, fixtures, products |
| Avatar locomotion | **fran-zone** Wisp controls |
| Pickup juice / particles | Steal lightly from **fran-web** `Pickup.ts` / fx (optional) |
| Daily leaderboard + rooms | New thin API (or PartyKit day-bucket) — **don’t** overload SUNFALL fight protocol |
| Brand/SKU names | fran-skums catalog path fran-zone already uses |

---

## Modes

1. **Solo Heist** — 60s, local, submit score with display name / device id.  
2. **Daily Board** — SGT midnight reset; top 20 on the landing overlay.  
3. **Later: Duo Chaos** — 2P local or link co-op, shared timer.  
4. **Not day-one:** full TowerFall campaign inside the store (keep SUNFALL for that fantasy).

---

## Tone / brand guardrails

- Chaotic cute, never “real shoplifting instructional.” Framing: **dream heist / mischief sim / “what if Wisp went feral at closing.”**  
- Security is goofy. No realistic CCTV training vibes.  
- Products are clearly toys/props in-game even when named after real SKUs.

---

## Smallest build path (when unlocked)

1. Heist mode toggle on fran-zone (browse Wisp vs Heist Wisp).  
2. Pickup volumes on a subset of shelf products + running haul HUD + 60s clock.  
3. 1–2 dumb patrols + hide volumes.  
4. End screen + daily leaderboard (even a single Supabase/PartyKit table).  
5. Juice: yoink VFX, fat hero SKU, catch sting.

Park: planogram SoT wiring, real inventory deduction (never), SUNFALL boss fights in-aisle.

---

## Open asks for J T

1. Player fantasy: **Wisp** vs raccoon/possum mascot?  
2. Leaderboard identity: anonymous nickname vs FWB login later?  
3. Host under `fran-zone.vercel.app/heist` or separate subdomain?  
4. Ship as mall QR distraction (queue / experience zone) or staff-party only?

---

*Heyfran CoS idea note — Pizza Possum loop on the Bugis+ play-canvas; SUNFALL stays the TowerFall arena on fran-web.*