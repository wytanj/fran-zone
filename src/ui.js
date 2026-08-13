import {
  PLAN,
  gondolas,
  wallBays,
  columns,
  cashier,
  experience,
  stockRoom,
  locker,
  staffDesk,
  managerDesk,
  receiving,
  stockRacks,
  BOH,
  entrance,
  nearestFixture,
  placeName,
  STACKS,
} from './store/layout.js';

export function createHud(wisp, controls, rulers, grid) {
  const placeEl = document.getElementById('place-label');
  const coordEl = document.getElementById('coord-readout');
  const inspect = document.getElementById('inspect');
  const title = document.getElementById('inspect-title');
  const kicker = document.getElementById('inspect-kicker');
  const body = document.getElementById('inspect-body');
  const list = document.getElementById('inspect-list');
  const hint = document.getElementById('wisp-hint');
  const mini = document.getElementById('minimap');
  const ctx = mini.getContext('2d');

  document.getElementById('btn-follow').addEventListener('click', () => {
    controls.setFollow(true);
  });
  document.getElementById('btn-plan').addEventListener('click', () => {
    controls.setPlan(!controls.state.plan);
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    controls.reset();
  });
  const gridBtn = document.getElementById('btn-grid');
  gridBtn?.addEventListener('click', () => {
    const on = !grid.root.visible;
    grid.setVisible(on);
    gridBtn.classList.toggle('is-on', on);
  });
  gridBtn?.classList.toggle('is-on', grid.root.visible);

  bindJoystick(controls);
  bindMinimapPan(mini, controls);
  bindAvatar(wisp, rulers);

  let lastNear = null;
  let lastHeight = -1;

  function showFixture(data) {
    if (!data) {
      inspect.hidden = true;
      return;
    }
    inspect.hidden = false;
    kicker.textContent = data.concept ? 'VM bay' : 'Fixture';
    title.textContent = data.name ?? (data.category || 'Bay');
    body.textContent = data.concept ?? '';
    list.innerHTML = '';
    const rows = [
      data.category ? `Category · ${data.category}` : null,
      data.brands?.length ? `Brands · ${data.brands.join(', ')}` : null,
      ...(data.products ?? []).slice(0, 6),
      ...(data.vm ?? []).map((v) => v),
      ...reachNotes(wisp, data),
    ].filter(Boolean);
    for (const row of rows) {
      const li = document.createElement('li');
      li.textContent = row;
      list.appendChild(li);
    }
  }

  function drawMap() {
    const w = mini.width;
    const h = mini.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#efe8da';
    ctx.fillRect(0, 0, w, h);

    const pad = 14;
    const sx = (w - pad * 2) / 23.2;
    const sz = (h - pad * 2) / 13.2;
    const tx = (x) => pad + (x + 2.2) * sx;
    const tz = (z) => pad + (z + 0.4) * sz;

    ctx.fillStyle = '#d9d4c8';
    ctx.fillRect(tx(0), tz(0), PLAN.width * sx, PLAN.depthWest * sz);
    ctx.fillStyle = '#e8e0d2';
    ctx.fillRect(tx(11.2), tz(6.4), 7.8 * sx, 3.8 * sz);

    ctx.fillStyle = '#c8c8c2';
    for (const b of wallBays) {
      ctx.fillRect(tx(b.x - 0.45), tz(b.z - 0.2), 0.9 * sx, 0.4 * sz);
    }
    ctx.fillStyle = '#f3e27a';
    for (const g of gondolas) {
      ctx.fillRect(tx(g.x - g.w / 2), tz(g.z - 0.43), g.w * sx, 0.86 * sz);
    }
    ctx.fillStyle = '#8d8d8d';
    ctx.fillRect(tx(cashier.x - 0.9), tz(cashier.z - 0.28), 1.8 * sx, 0.55 * sz);
    ctx.fillStyle = '#d2c7b4';
    ctx.beginPath();
    ctx.arc(tx(experience.round.x), tz(experience.round.z), 1.15 * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfc8bb';
    ctx.fillRect(tx(BOH.stock.x0), tz(BOH.stock.z0), (BOH.stock.x1 - BOH.stock.x0) * sx, (BOH.stock.eastZ1 - BOH.stock.z0) * sz);
    ctx.fillRect(tx(BOH.stock.x0), tz(BOH.stock.eastZ1), (BOH.stock.jogX - BOH.stock.x0) * sx, (BOH.stock.z1 - BOH.stock.eastZ1) * sz);
    ctx.fillRect(tx(locker.x - locker.w / 2), tz(locker.z - locker.d / 2), locker.w * sx, locker.d * sz);
    ctx.fillStyle = '#b7b1a6';
    ctx.fillRect(tx(staffDesk.x - staffDesk.w / 2), tz(staffDesk.z - staffDesk.d / 2), staffDesk.w * sx, staffDesk.d * sz);
    ctx.fillRect(tx(managerDesk.x - managerDesk.w / 2), tz(managerDesk.z - managerDesk.d / 2), managerDesk.w * sx, managerDesk.d * sz);
    ctx.fillStyle = '#a39b8c';
    for (const r of stockRacks) {
      ctx.fillRect(tx(r.x - r.w / 2), tz(r.z - r.d / 2), r.w * sx, r.d * sz);
    }
    ctx.strokeStyle = 'rgba(58,36,21,0.18)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= 19; gx += 1) {
      ctx.beginPath();
      ctx.moveTo(tx(gx), tz(-0.2));
      ctx.lineTo(tx(gx), tz(11.2));
      ctx.stroke();
    }
    for (let gz = 0; gz <= 11; gz += 1) {
      ctx.beginPath();
      ctx.moveTo(tx(-1.8), tz(gz));
      ctx.lineTo(tx(19.4), tz(gz));
      ctx.stroke();
    }
    void stockRoom;
    void receiving;
    ctx.fillStyle = '#3a3a3a';
    ctx.strokeStyle = '#3a2415';
    ctx.lineWidth = 1.6;
    for (const c of columns) {
      ctx.beginPath();
      ctx.arc(tx(c.x), tz(c.z), Math.max(4.5, c.r * sx * 1.15), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = '#3a2415';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(tx(0), tz(0), PLAN.width * sx, PLAN.depthWest * sz);

    const px = tx(wisp.position.x);
    const pz = tz(wisp.position.z);
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath();
    ctx.arc(px, pz, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2415';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(58,36,21,0.12)';
    const cam = controls.state.look;
    ctx.beginPath();
    ctx.arc(tx(cam.x + controls.state.pan.x), tz(cam.z + controls.state.pan.z), 10, 0, Math.PI * 2);
    ctx.fill();

    void entrance;
  }

  function update() {
    const x = wisp.position.x;
    const z = wisp.position.z;
    placeEl.textContent = placeName(x, z);
    if (coordEl) {
      coordEl.textContent = `${x.toFixed(2)} m E  ·  ${z.toFixed(2)} m S`;
    }
    const near = nearestFixture(x, z, 2.1);
    if (near?.id !== lastNear || wisp.heightCm !== lastHeight) {
      lastNear = near?.id ?? null;
      lastHeight = wisp.heightCm;
      showFixture(near?.data);
      if (wisp.mode !== 'height') {
        hint.textContent = near?.data
          ? `Hovering ${near.data.name ?? near.data.category}.`
          : 'Walk the aisles. Pan anytime.';
      }
    }
    drawMap();
  }

  return { update, showFixture };
}

function reachNotes(wisp, data) {
  if (wisp.mode !== 'height' || !data) return [];
  const stack = data.kind === 'gondola' || data.bays ? STACKS.gondola : data.facing ? STACKS.wallbay : null;
  if (!stack) return [];
  const cm = wisp.heightCm;
  const hit = stack.parts.find((p) => cm / 100 >= p.from && cm / 100 < p.to) || (cm / 100 >= stack.total ? null : stack.parts[0]);
  if (cm / 100 >= stack.total) return [`Reach · ${cm} cm is above this ${stack.total * 100} cm fixture`];
  return [`Reach · ${cm} cm hits ${hit.label} (${Math.round(hit.from * 100)}–${Math.round(hit.to * 100)} cm)`];
}

function bindAvatar(wisp, rulers) {
  const wispBtn = document.getElementById('btn-avatar-wisp');
  const heightBtn = document.getElementById('btn-avatar-height');
  const panel = document.getElementById('height-panel');
  const range = document.getElementById('height-range');
  const value = document.getElementById('height-value');
  const name = document.getElementById('avatar-name');
  const hint = document.getElementById('wisp-hint');
  const thumb = document.getElementById('avatar-thumb');

  function applyHeight(cm) {
    const n = Math.max(0, Math.min(250, Number(cm) || 0));
    range.value = String(n);
    value.textContent = String(n);
    wisp.setHeightCm(n);
    rulers?.setHighlightCm(n);
    document.querySelectorAll('.height-presets button').forEach((btn) => {
      btn.classList.toggle('is-on', Number(btn.dataset.cm) === n);
    });
  }

  function setMode(mode) {
    wisp.setMode(mode);
    const heightOn = mode === 'height';
    wispBtn.classList.toggle('is-on', !heightOn);
    heightBtn.classList.toggle('is-on', heightOn);
    panel.hidden = !heightOn;
    rulers?.setVisible(heightOn);
    name.textContent = heightOn ? `${wisp.heightCm} cm shopper` : 'Wisp';
    hint.textContent = heightOn
      ? 'Rulers on each gondola and wallbay.'
      : 'Walk the aisles. Pan anytime.';
    thumb.style.opacity = heightOn ? '0.35' : '1';
    if (heightOn) {
      applyHeight(range.value);
    }
  }

  wispBtn.addEventListener('click', () => setMode('wisp'));
  heightBtn.addEventListener('click', () => setMode('height'));
  range.addEventListener('input', () => {
    applyHeight(range.value);
    name.textContent = `${wisp.heightCm} cm shopper`;
  });
  document.querySelectorAll('.height-presets button').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyHeight(btn.dataset.cm);
      name.textContent = `${wisp.heightCm} cm shopper`;
    });
  });
}

function bindJoystick(controls) {
  const root = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  if (!root || !knob) return;
  const base = root.querySelector('.joystick-base');
  let active = false;

  function setFrom(e) {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width / 2 - 8;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    knob.style.left = `${32 + dx}px`;
    knob.style.top = `${32 + dy}px`;
    controls.setJoystick(dx / max, -dy / max);
  }

  function clear() {
    active = false;
    knob.style.left = '32px';
    knob.style.top = '32px';
    controls.setJoystick(0, 0);
  }

  base.addEventListener('pointerdown', (e) => {
    active = true;
    base.setPointerCapture(e.pointerId);
    setFrom(e);
  });
  base.addEventListener('pointermove', (e) => {
    if (active) setFrom(e);
  });
  base.addEventListener('pointerup', clear);
  base.addEventListener('pointercancel', clear);
}

function bindMinimapPan(mini, controls) {
  let dragging = false;
  let last = { x: 0, y: 0 };
  mini.addEventListener('pointerdown', (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    mini.setPointerCapture(e.pointerId);
  });
  mini.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    controls.panBy(-dx * 2.2, -dy * 2.2);
    controls.setFollow(false);
  });
  mini.addEventListener('pointerup', () => {
    dragging = false;
  });
}
