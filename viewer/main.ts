import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createJokerShotgunModel,
  createJokerShotgunLookDevLights,
  createJokerShotgunEnvironment,
  frameJokerShotgunCamera,
} from '../src/createJokerShotgunModel.ts';

(window as any).__ready = true;

const params = new URLSearchParams(location.search);
const initialMode = (params.get('mode') as 'clay' | 'eval' | 'hero') || 'hero';

const stage = document.getElementById('stage')!;
const fpsVal = document.getElementById('fps-val')!;

// -----------------------------------------------------------------------------
// WebGL Renderer Setup
// -----------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

const envTex = createJokerShotgunEnvironment(renderer);
scene.environment = envTex;

// -----------------------------------------------------------------------------
// Model & Runtime Setup
// -----------------------------------------------------------------------------
const model = createJokerShotgunModel({ castShadow: true, receiveShadow: false, preset: 'cyberprint' });
scene.add(model);

const runtime = (model.userData as any).sculptRuntime;
const parts = runtime.parts;
const subAssemblies = runtime.subAssemblies;

// Studio Lighting
const lights = createJokerShotgunLookDevLights('reference');
scene.add(lights);

// Ground Shadow Plane
const box = new THREE.Box3().setFromObject(model);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());

const groundY = box.min.y - 0.05;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(size.x * 4, size.z * 6),
  new THREE.ShadowMaterial({ opacity: 0.45 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(center.x, groundY, center.z);
ground.receiveShadow = true;
scene.add(ground);

// -----------------------------------------------------------------------------
// 1. CLEAN MECHANICAL BLUEPRINT GUIDELINES FOR DISASSEMBLY
// -----------------------------------------------------------------------------
const assemblyLinesGroup = new THREE.Group();
assemblyLinesGroup.visible = false;
scene.add(assemblyLinesGroup);

const matBlueprintLine = new THREE.LineDashedMaterial({
  color: 0x38bdf8,
  dashSize: 0.05,
  gapSize: 0.03,
  transparent: true,
  opacity: 0.65,
});

const lineGeometries: THREE.BufferGeometry[] = [];
Object.values(subAssemblies).forEach((sub: any) => {
  const points = [sub.homePos.clone(), sub.explodePos.clone()];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  lineGeometries.push(geo);
  const line = new THREE.Line(geo, matBlueprintLine);
  line.computeLineDistances();
  assemblyLinesGroup.add(line);
});

function updateAssemblyBlueprintLines(progress: number) {
  assemblyLinesGroup.visible = progress > 0.05;
  let idx = 0;
  Object.values(subAssemblies).forEach((sub: any) => {
    const geo = lineGeometries[idx++];
    if (geo) {
      const positions = geo.attributes.position as THREE.BufferAttribute;
      positions.setXYZ(0, sub.homePos.x, sub.homePos.y, sub.homePos.z);
      positions.setXYZ(1, sub.obj.position.x, sub.obj.position.y, sub.obj.position.z);
      positions.needsUpdate = true;
    }
  });
  matBlueprintLine.opacity = Math.min(1.0, progress * 1.5);
}

// -----------------------------------------------------------------------------
// 2. EJECTED SHOTGUN SHELL PHYSICS (FALLS PAST BOTTOM OF SCREEN)
// -----------------------------------------------------------------------------
type EjectedShell = {
  mesh: THREE.Object3D;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
};

const activeEjectedShells: EjectedShell[] = [];

function spawnEjectedShell() {
  if (!parts.shellMesh) return;

  const clone = parts.shellMesh.clone(true);
  clone.visible = true;
  clone.scale.set(1, 1, 1);
  scene.add(clone);

  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = (child as THREE.Mesh).material;
      if (Array.isArray(m)) {
        (child as THREE.Mesh).material = m.map(mat => mat.clone());
        (child as THREE.Mesh).material.forEach(mat => { mat.transparent = true; });
      } else if (m) {
        (child as THREE.Mesh).material = m.clone();
        ((child as THREE.Mesh).material as THREE.Material).transparent = true;
      }
    }
  });

  const worldPos = new THREE.Vector3(0.12, 0.05, 0.09);
  subAssemblies['ReceiverAssembly'].obj.localToWorld(worldPos);
  clone.position.copy(worldPos);

  const shell: EjectedShell = {
    mesh: clone,
    pos: worldPos.clone(),
    vel: new THREE.Vector3(
      0.3 + Math.random() * 0.3,
      0.9 + Math.random() * 0.4,
      1.2 + Math.random() * 0.5
    ),
    rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
    rotVel: new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    ),
    life: 0,
  };

  activeEjectedShells.push(shell);
}

function updateEjectedShells(delta: number) {
  const gravity = -16.0;
  for (let i = activeEjectedShells.length - 1; i >= 0; i--) {
    const s = activeEjectedShells[i];
    s.life += delta;

    s.vel.y += gravity * delta;
    s.pos.addScaledVector(s.vel, delta);
    s.rot.addScaledVector(s.rotVel, delta);

    s.mesh.position.copy(s.pos);
    s.mesh.rotation.set(s.rot.x, s.rot.y, s.rot.z);

    if (s.pos.y < -0.8) {
      s.mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat && mat.opacity !== undefined) {
            mat.opacity -= delta * 4.0;
          }
        }
      });
    }

    if (s.pos.y < -2.5 || s.life > 1.5) {
      scene.remove(s.mesh);
      activeEjectedShells.splice(i, 1);
    }
  }
}

// -----------------------------------------------------------------------------
// 3. VOLUMETRIC GUNPOWDER SMOKE SYSTEM
// -----------------------------------------------------------------------------
const muzzlePoint = parts.muzzlePoint || new THREE.Vector3(2.15, 0.08, 0);

const muzzleLight = new THREE.PointLight(0xffaa22, 0, 12);
muzzleLight.position.copy(muzzlePoint);
scene.add(muzzleLight);

const muzzleFlashGeo = new THREE.ConeGeometry(0.18, 0.5, 16);
muzzleFlashGeo.rotateZ(-Math.PI / 2);
const matMuzzleFlash = new THREE.MeshBasicMaterial({
  color: 0xffaa22,
  transparent: true,
  opacity: 0,
});
const muzzleFlashMesh = new THREE.Mesh(muzzleFlashGeo, matMuzzleFlash);
muzzleFlashMesh.position.copy(muzzlePoint);
scene.add(muzzleFlashMesh);

const smokeGroup = new THREE.Group();
scene.add(smokeGroup);

const smokeGeo = new THREE.DodecahedronGeometry(0.08, 1);

type SmokeParticle = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleGrowth: number;
};

const smokePool: SmokeParticle[] = [];
for (let i = 0; i < 40; i++) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd5dadf,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(smokeGeo, mat);
  mesh.visible = false;
  smokeGroup.add(mesh);
  smokePool.push({
    mesh,
    velocity: new THREE.Vector3(),
    rotSpeed: new THREE.Vector3(),
    life: 0,
    maxLife: 1.5,
    scaleGrowth: 2.5,
  });
}

function spawnShotgunMuzzleSmoke() {
  for (let i = 0; i < 25; i++) {
    const p = smokePool[i];
    p.mesh.position.copy(muzzlePoint);
    p.mesh.position.x += (Math.random() - 0.2) * 0.1;
    p.mesh.position.y += (Math.random() - 0.5) * 0.1;

    p.velocity.set(
      1.8 + Math.random() * 2.5,
      0.3 + Math.random() * 0.8,
      (Math.random() - 0.5) * 0.8
    );
    p.rotSpeed.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    p.life = 0;
    p.maxLife = 1.2 + Math.random() * 0.8;
    p.scaleGrowth = 2.0 + Math.random() * 2.0;

    (p.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xd5dadf);
    (p.mesh.material as THREE.MeshStandardMaterial).opacity = 0.75;
    p.mesh.scale.set(0.4, 0.4, 0.4);
    p.mesh.visible = true;
  }
}

// -----------------------------------------------------------------------------
// Camera & Orbit Controls
// -----------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
frameJokerShotgunCamera(camera, center);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = true;
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.0;
controls.autoRotate = false;
controls.autoRotateSpeed = 2.0;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
};
controls.target.copy(center);

// -----------------------------------------------------------------------------
// State & Animation Handles
// -----------------------------------------------------------------------------
let isExploded = false;
let explodeProgress = 0;
let isPumpRacking = false;
let pumpProgress = 0;
let isFiring = false;
let fireProgress = 0;
let isSlowMo = false;

let isCamTransitioning = false;
let targetCamPos = camera.position.clone();
let targetCamLook = center.clone();

function transitionCameraTo(pos: THREE.Vector3, look: THREE.Vector3) {
  targetCamPos.copy(pos);
  targetCamLook.copy(look);
  isCamTransitioning = true;
}

if (initialMode === 'eval') {
  scene.background = new THREE.Color(0xffffff);
  camera.position.set(0.15, 0.0, 3.6);
}

if (parts.shellMesh) {
  parts.shellMesh.visible = false;
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------
function triggerPumpAction() {
  if (isPumpRacking) return;
  isPumpRacking = true;
  pumpProgress = 0;
  spawnEjectedShell();
}

function triggerFireAction() {
  if (isFiring) return;
  isFiring = true;
  fireProgress = 0;
  muzzleLight.intensity = 25;
  matMuzzleFlash.opacity = 1.0;
  spawnShotgunMuzzleSmoke();
  triggerPumpAction();
}

function triggerReloadAction() {
  triggerPumpAction();
}

// -----------------------------------------------------------------------------
// UI Control Event Handlers
// -----------------------------------------------------------------------------
const btnExplode = document.getElementById('btn-explode-toggle');
if (btnExplode) {
  btnExplode.addEventListener('click', () => {
    isExploded = !isExploded;
    btnExplode.classList.toggle('active', isExploded);
    btnExplode.innerText = isExploded ? 'Reassemble' : 'Disassemble';
  });
}

document.getElementById('btn-fire')?.addEventListener('click', triggerFireAction);
document.getElementById('btn-pump')?.addEventListener('click', triggerPumpAction);
document.getElementById('btn-reload')?.addEventListener('click', triggerReloadAction);

// 3D Print Finish Presets
const presetBtns = ['preset-cyberprint', 'preset-printedsteel', 'preset-wood', 'preset-stealth'];
presetBtns.forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    presetBtns.forEach(b => document.getElementById(b)?.classList.remove('active'));
    btn.classList.add('active');
    const p = id.replace('preset-', '') as any;
    runtime.setPreset(p);
  });
});

// Camera View Presets
document.getElementById('cam-hero')?.addEventListener('click', () => {
  transitionCameraTo(new THREE.Vector3(0.1, 0.2, 3.4), center);
});
document.getElementById('cam-side')?.addEventListener('click', () => {
  transitionCameraTo(new THREE.Vector3(0.15, 0.0, 3.6), center);
});
document.getElementById('cam-muzzle')?.addEventListener('click', () => {
  transitionCameraTo(new THREE.Vector3(2.4, 0.3, 1.2), new THREE.Vector3(1.5, 0.12, 0));
});
document.getElementById('cam-pump')?.addEventListener('click', () => {
  transitionCameraTo(new THREE.Vector3(1.1, -0.2, 1.5), new THREE.Vector3(1.0, -0.01, 0));
});

// Settings
const toggleSlowMo = document.getElementById('toggle-slowmo') as HTMLInputElement;
toggleSlowMo?.addEventListener('change', () => { isSlowMo = toggleSlowMo.checked; });

const toggleOrbit = document.getElementById('toggle-orbit') as HTMLInputElement;
toggleOrbit?.addEventListener('change', () => {
  controls.autoRotate = toggleOrbit.checked;
});

controls.addEventListener('start', () => {
  isCamTransitioning = false;
});

// Keybindings
window.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') btnExplode?.click();
  if (e.code === 'Space') { e.preventDefault(); triggerFireAction(); }
  if (e.key === 'r' || e.key === 'R') triggerReloadAction();
  if (e.key === '1') document.getElementById('preset-cyberprint')?.click();
  if (e.key === '2') document.getElementById('preset-printedsteel')?.click();
  if (e.key === '3') document.getElementById('preset-wood')?.click();
  if (e.key === '4') document.getElementById('preset-stealth')?.click();
});

// Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// -----------------------------------------------------------------------------
// Render Loop
// -----------------------------------------------------------------------------
let clock = new THREE.Clock();
let frameCount = 0;
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  let delta = clock.getDelta();
  if (isSlowMo) delta *= 0.1;

  // FPS Counter
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    if (fpsVal) fpsVal.innerText = frameCount.toString();
    frameCount = 0;
    lastTime = now;
  }

  if (isCamTransitioning) {
    camera.position.lerp(targetCamPos, 0.08);
    controls.target.lerp(targetCamLook, 0.08);
    if (camera.position.distanceTo(targetCamPos) < 0.01) {
      isCamTransitioning = false;
    }
  }

  // 1. Clean Smooth Disassembly Interpolation
  const targetExp = isExploded ? 1.0 : 0.0;
  explodeProgress = THREE.MathUtils.lerp(explodeProgress, targetExp, delta * 4.0);

  Object.values(subAssemblies).forEach((sub: any) => {
    sub.obj.position.lerpVectors(sub.homePos, sub.explodePos, explodeProgress);
    sub.obj.rotation.x = THREE.MathUtils.lerp(sub.homeRot.x, sub.explodeRot.x, explodeProgress);
    sub.obj.rotation.y = THREE.MathUtils.lerp(sub.homeRot.y, sub.explodeRot.y, explodeProgress);
    sub.obj.rotation.z = THREE.MathUtils.lerp(sub.homeRot.z, sub.explodeRot.z, explodeProgress);
  });

  // Update Clean Technical Blueprint Guidelines
  updateAssemblyBlueprintLines(explodeProgress);

  // 2. Shell Ejection
  updateEjectedShells(delta);

  // 3. Volumetric Gunfire Smoke
  smokePool.forEach(p => {
    if (p.mesh.visible) {
      p.life += delta;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
      } else {
        const progress = p.life / p.maxLife;
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.mesh.rotation.x += p.rotSpeed.x * delta;
        p.mesh.rotation.y += p.rotSpeed.y * delta;
        p.mesh.scale.addScalar(delta * p.scaleGrowth);

        const mat = p.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = (1.0 - progress) * 0.8;
      }
    }
  });

  // 4. Muzzle Flash FX update
  if (isFiring) {
    fireProgress += delta * 7;
    muzzleLight.intensity = Math.max(0, 25 * (1 - fireProgress));
    matMuzzleFlash.opacity = Math.max(0, 1 - fireProgress);
    if (fireProgress >= 1.0) isFiring = false;
  }

  // 5. Pump Action Racking Animation
  if (isPumpRacking) {
    pumpProgress += delta * 3.5;
    const slideOffset = Math.sin(Math.min(pumpProgress, Math.PI)) * -0.28;
    if (parts.pumpHandle) {
      parts.pumpHandle.position.x = slideOffset;
    }
    if (pumpProgress >= Math.PI) {
      isPumpRacking = false;
      if (parts.pumpHandle) parts.pumpHandle.position.x = 0;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
