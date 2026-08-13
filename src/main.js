import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildStore } from './store/build.js';
import { createRulers } from './store/rulers.js';
import { createFloorGrid } from './store/grid.js';
import { createXray } from './store/xray.js';
import { createWisp } from './wisp.js';
import { createControls } from './controls.js';
import { createHud } from './ui.js';
import { spawn, onWalkable, placeName, stockRacks, BOH, blockersAt } from './store/layout.js';

async function boot() {
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  RectAreaLightUniformsLib.init();

  const canvas = document.getElementById('store');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const noShadow = new URLSearchParams(location.search).has('noshadow');
  renderer.shadowMap.enabled = !noShadow;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c1914);
  scene.fog = new THREE.Fog(0x1c1914, 22, 42);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.08, 80);
  camera.position.set(20, 3.2, 3.4);
  const ortho = new THREE.OrthographicCamera(-16, 16, 10, -10, 0.4, 80);
  ortho.up.set(0, 0, -1);

  const built = buildStore(scene);
  const wisp = createWisp(scene, spawn);
  const rulers = createRulers(scene);
  const grid = createFloorGrid();
  scene.add(grid.root);
  const xray = createXray([built.root, grid.root]);

  function applyPlanVisual(on) {
    xray.setEnabled(on);
    scene.fog.near = on ? 90 : 22;
    scene.fog.far = on ? 140 : 42;
    scene.background.set(on ? 0x2c2822 : 0x1c1914);
    rulers.setVisible(!on && wisp.mode === 'height');
  }

  const controls = createControls(camera, canvas, wisp, {
    getCamera: () => (controls.state.plan ? ortho : camera),
    onPlanChange: applyPlanVisual,
  });
  const hud = createHud(wisp, controls, rulers, grid);

  function fitOrtho() {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const s = controls.state.planScale;
    ortho.left = -s * aspect;
    ortho.right = s * aspect;
    ortho.top = s;
    ortho.bottom = -s;
    ortho.updateProjectionMatrix();
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    fitOrtho();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    controls.update(dt);
    wisp.update(dt, t);
    hud.update();
    const active = controls.state.plan ? ortho : camera;
    if (controls.state.plan) {
      fitOrtho();
      const focus = controls.state.look.clone().add(controls.state.pan);
      ortho.position.set(focus.x, 32, focus.z);
      ortho.up.set(0, 0, -1);
      ortho.lookAt(focus.x, 0, focus.z);
    }
    renderer.render(scene, active);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__franStore = {
    scene,
    camera,
    ortho,
    renderer,
    wisp,
    controls,
    rulers,
    grid,
    xray,
    onWalkable,
    placeName,
    blockersAt,
    boh: { racks: stockRacks.length, stock: BOH.stock },
    walkTo: (x, z) => wisp.walkTo(x, z),
  };
  } catch (err) {
    console.error(err);
    const help = document.getElementById('help');
    if (help) help.textContent = `Could not start the store: ${err.message}`;
  }
}

boot();
