import * as THREE from 'three';
import { PLAN, onWalkable } from './store/layout.js';

/**
 * Third-person browse camera.
 * Orbit: left-drag. Pan (required): middle-drag, Shift+left-drag, arrows, two-finger drag.
 * Plan mode: top-down, pan is the primary move.
 */
export function createControls(camera, canvas, wisp, opts = {}) {
  const state = {
    follow: true,
    plan: false,
    planScale: 8.4,
    yaw: Math.PI * 0.5,
    pitch: 0.42,
    dist: 4.6,
    pan: new THREE.Vector3(),
    look: new THREE.Vector3(wisp.position.x, 0.7, wisp.position.z),
    dragging: null,
    last: { x: 0, y: 0 },
    down: { x: 0, y: 0 },
    pointers: new Map(),
    pinch: 0,
    keys: new Set(),
    joystick: { x: 0, z: 0 },
  };

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const right = new THREE.Vector3();
  const fwd = new THREE.Vector3();

  function activeCamera() {
    return opts.getCamera?.() || camera;
  }

  function applyCamera() {
    const focus = state.look.clone();
    focus.add(state.pan);
    if (state.plan) {
      return;
    }
    const cp = Math.cos(state.pitch);
    const sp = Math.sin(state.pitch);
    const cy = Math.cos(state.yaw);
    const sy = Math.sin(state.yaw);
    camera.position.set(
      focus.x + sy * cp * state.dist,
      focus.y + sp * state.dist + 0.55,
      focus.z + cy * cp * state.dist,
    );
    camera.lookAt(focus.x, focus.y + 0.25, focus.z);
  }

  function panBy(dx, dz) {
    const speed = state.plan ? 0.018 : 0.006 * state.dist;
    if (state.plan) {
      state.pan.x += -dx * speed * 1.4;
      state.pan.z += -dz * speed * 1.4;
      return;
    }
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
    fwd.normalize();
    right.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    state.pan.addScaledVector(right, -dx * speed);
    state.pan.addScaledVector(fwd, dz * speed);
    if (state.plan) state.follow = false;
  }

  function onPointerDown(e) {
    canvas.setPointerCapture(e.pointerId);
    state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (state.pointers.size === 2) {
      const pts = [...state.pointers.values()];
      state.pinch = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      state.dragging = 'pinch';
      return;
    }
    const isPan = e.button === 1 || e.shiftKey || e.button === 2;
    state.dragging = isPan ? 'pan' : 'orbit';
    state.last.x = e.clientX;
    state.last.y = e.clientY;
    state.down.x = e.clientX;
    state.down.y = e.clientY;
  }

  function onPointerMove(e) {
    if (state.pointers.has(e.pointerId)) {
      state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (state.dragging === 'pinch' && state.pointers.size === 2) {
      const pts = [...state.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      if (state.pinch > 0) {
        const delta = (state.pinch - dist) * 0.02;
        state.dist = THREE.MathUtils.clamp(state.dist + delta, 2.2, 18);
      }
      if (state.last.x) panBy(midX - state.last.x, midY - state.last.y);
      state.pinch = dist;
      state.last.x = midX;
      state.last.y = midY;
      return;
    }
    if (!state.dragging || state.dragging === 'pinch') return;
    const dx = e.clientX - state.last.x;
    const dy = e.clientY - state.last.y;
    state.last.x = e.clientX;
    state.last.y = e.clientY;
    if (state.dragging === 'pan' || state.plan) {
      panBy(dx, dy);
      return;
    }
    state.yaw -= dx * 0.005;
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.004, 0.12, 1.25);
  }

  function onPointerUp(e) {
    state.pointers.delete(e.pointerId);
    if (state.pointers.size === 0) state.dragging = null;
  }

  function onWheel(e) {
    e.preventDefault();
    if (state.plan) {
      state.planScale = THREE.MathUtils.clamp(state.planScale + e.deltaY * 0.012, 5.2, 14);
      return;
    }
    const next = state.dist + e.deltaY * 0.008;
    state.dist = THREE.MathUtils.clamp(next, 2.2, 18);
  }

  function onClick(e) {
    if (Math.hypot(e.clientX - state.down.x, e.clientY - state.down.y) > 6) return;
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, activeCamera());
    if (ray.ray.intersectPlane(floor, hit) && onWalkable(hit.x, hit.z)) {
      wisp.walkTo(hit.x, hit.z);
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('click', onClick);

  window.addEventListener('keydown', (e) => {
    state.keys.add(e.key.toLowerCase());
    if (e.key === 'f' || e.key === 'F') setFollow(true);
    if (e.key === 'p' || e.key === 'P') setPlan(!state.plan);
  });
  window.addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));

  function setFollow(on) {
    const wasPlan = state.plan;
    state.follow = on;
    if (on) {
      state.pan.set(0, 0, 0);
      state.plan = false;
    }
    document.getElementById('btn-follow')?.classList.toggle('is-on', state.follow && !state.plan);
    document.getElementById('btn-plan')?.classList.toggle('is-on', state.plan);
    if (wasPlan && !state.plan) opts.onPlanChange?.(false);
  }

  function setPlan(on) {
    state.plan = on;
    if (on) {
      state.follow = false;
      state.look.set(8.4, 0.7, 5.8);
      state.pan.set(0, 0, 0);
      state.dist = 16;
      state.pitch = 1.2;
      state.planScale = 8.4;
    } else {
      state.follow = true;
      state.dist = 4.6;
      state.pitch = 0.42;
      state.pan.set(0, 0, 0);
    }
    document.getElementById('btn-plan')?.classList.toggle('is-on', state.plan);
    document.getElementById('btn-follow')?.classList.toggle('is-on', state.follow && !state.plan);
    opts.onPlanChange?.(on);
  }

  function reset() {
    state.follow = true;
    state.plan = false;
    state.yaw = Math.PI * 0.5;
    state.pitch = 0.42;
    state.dist = 4.6;
    state.pan.set(0, 0, 0);
    state.look.set(wisp.position.x, 0.7, wisp.position.z);
    document.getElementById('btn-plan')?.classList.remove('is-on');
    document.getElementById('btn-follow')?.classList.add('is-on');
    opts.onPlanChange?.(false);
  }

  function wishFromKeys() {
    const k = state.keys;
    let x = state.joystick.x;
    let z = state.joystick.z;
    if (k.has('w')) z += 1;
    if (k.has('s')) z -= 1;
    if (k.has('a')) x -= 1;
    if (k.has('d')) x += 1;
    // Arrow keys pan the camera — required.
    if (k.has('arrowleft')) panBy(18, 0);
    if (k.has('arrowright')) panBy(-18, 0);
    if (k.has('arrowup')) panBy(0, 18);
    if (k.has('arrowdown')) panBy(0, -18);
    if (x === 0 && z === 0) return null;
    if (state.plan) {
      const wish = new THREE.Vector3(x, 0, -z);
      if (wish.lengthSq() > 0) wish.normalize();
      return wish;
    }
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    right.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const wish = new THREE.Vector3();
    wish.addScaledVector(right, x);
    wish.addScaledVector(fwd, z);
    if (wish.lengthSq() > 0) wish.normalize();
    return wish;
  }

  function update(dt) {
    if (state.follow && !state.plan) {
      state.look.x += (wisp.position.x - state.look.x) * (1 - Math.exp(-6 * dt));
      state.look.z += (wisp.position.z - state.look.z) * (1 - Math.exp(-6 * dt));
      state.look.y += (wisp.getFocusY() - state.look.y) * (1 - Math.exp(-6 * dt));
      if (wisp.mode === 'height') {
        const want = 4.6 + Math.max(0, wisp.heightCm / 100 - 1.2) * 1.4;
        state.dist += (want - state.dist) * (1 - Math.exp(-3 * dt));
      }
    }
    state.pan.x = THREE.MathUtils.clamp(state.pan.x, -PLAN.width, PLAN.width);
    state.pan.z = THREE.MathUtils.clamp(state.pan.z, -8, 10);
    const wish = wishFromKeys();
    if (wish) {
      wisp.clearDest();
      wisp.setWish(wish.x, wish.z);
    }
    applyCamera();
  }

  function panTo(x, z) {
    state.follow = false;
    state.look.set(x, 0.7, z);
    state.pan.set(0, 0, 0);
    document.getElementById('btn-follow')?.classList.remove('is-on');
  }

  return {
    state,
    update,
    setFollow,
    setPlan,
    reset,
    panTo,
    panBy,
    getCamera: activeCamera,
    setJoystick(x, z) {
      state.joystick.x = x;
      state.joystick.z = z;
    },
  };
}
