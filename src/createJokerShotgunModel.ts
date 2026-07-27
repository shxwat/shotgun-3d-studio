import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  preset?: 'cyberprint' | 'printedsteel' | 'wood' | 'stealth';
};

export type SubAssemblyTransform = {
  obj: THREE.Object3D;
  homePos: THREE.Vector3;
  explodePos: THREE.Vector3;
  homeRot: THREE.Euler;
  explodeRot: THREE.Euler;
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.Material>;
  parts: {
    pumpHandle?: THREE.Object3D;
    shellMesh?: THREE.Object3D;
    barrelMesh?: THREE.Mesh;
    triggerMesh?: THREE.Mesh;
    muzzlePoint?: THREE.Vector3;
  };
  subAssemblies: Record<string, SubAssemblyTransform>;
  setPreset: (preset: 'cyberprint' | 'printedsteel' | 'wood' | 'stealth') => void;
};

// -----------------------------------------------------------------------------
// High-Resolution 2048x2048 Textures for 3D Print Skins
// -----------------------------------------------------------------------------

function createCyberPrintTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 2048, 2048);
  grad.addColorStop(0, '#151824');
  grad.addColorStop(0.5, '#0b0d14');
  grad.addColorStop(1.0, '#1a1d2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 2048);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 2.5;
  const size = 48;
  for (let y = 0; y < 2048; y += size) {
    for (let x = 0; x < 2048; x += size * 1.5) {
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y);
      ctx.lineTo(x + size, y + size * 0.25);
      ctx.lineTo(x + size, y + size * 0.75);
      ctx.lineTo(x + size * 0.5, y + size);
      ctx.lineTo(x, y + size * 0.75);
      ctx.lineTo(x, y + size * 0.25);
      ctx.closePath();
      ctx.stroke();
    }
  }

  ctx.shadowColor = '#00f5d4'; ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(100, 300); ctx.bezierCurveTo(600, 100, 1200, 700, 1900, 200); ctx.stroke();

  ctx.strokeStyle = '#00f5d4'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(100, 350); ctx.bezierCurveTo(600, 150, 1200, 750, 1900, 250); ctx.stroke();

  ctx.fillStyle = '#00f5d4'; ctx.font = 'bold 130px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('CYBER 12G', 1024, 900);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 45px monospace';
  ctx.fillText('⚡ 3D PRINTED CYBER EDITION ⚡', 1024, 980);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrintedSteelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#23262d';
  ctx.fillRect(0, 0, 2048, 2048);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 3;
  for (let i = -2048; i < 4096; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 2048, 2048); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 2048, 2048); ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 90px monospace';
  ctx.fillText('TACTICAL 12-GAUGE MODEL 870', 300, 700);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 50px monospace';
  ctx.fillText('▲ 3D PRINTED MILITARY STEEL ▲', 300, 800);
  ctx.fillText('SER. NO. RS-870942-TX', 300, 870);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrintedWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 2048, 0);
  grad.addColorStop(0, '#5a361e');
  grad.addColorStop(0.3, '#3a2010');
  grad.addColorStop(0.6, '#6a4227');
  grad.addColorStop(1.0, '#381f0d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 2048);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 6.0;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    let y = i * 70;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(600, y + 120, 1400, y - 120, 2048, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 100px serif';
  ctx.fillText('🌿 3D ENGRAVED WOOD EDITION 🌿', 300, 900);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrintedStealthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f1015';
  ctx.fillRect(0, 0, 2048, 2048);

  ctx.fillStyle = '#1c1e28';
  for (let i = 0; i < 45; i++) {
    ctx.beginPath();
    let x = Math.random() * 2048;
    let y = Math.random() * 2048;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 180, y + 50);
    ctx.lineTo(x + 120, y + 220);
    ctx.lineTo(x - 50, y + 160);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = 'bold 85px monospace';
  ctx.fillText('STEALTH 12G // 3D CARBON PRINT', 300, 900);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// -----------------------------------------------------------------------------
// ULTRA-HIGH DETAIL ANATOMICAL MODEL MATCHING IMAGE 1 EXACTLY
// -----------------------------------------------------------------------------

export function createJokerShotgunModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'ShotgunRoot';

  const shadowCast = options.castShadow ?? true;
  const shadowReceive = options.receiveShadow ?? false;

  const cyberTex = createCyberPrintTexture();
  const steelTex = createPrintedSteelTexture();
  const woodTex = createPrintedWoodTexture();
  const stealthTex = createPrintedStealthTexture();

  // Fine-tuned firearms materials matching Image 1
  const matReceiver = new THREE.MeshStandardMaterial({
    map: cyberTex,
    color: 0xffffff,
    roughness: 0.40,
    metalness: 0.72,
  });

  const matBarrel = new THREE.MeshStandardMaterial({
    color: 0x1b1d24,
    roughness: 0.35,
    metalness: 0.80,
  });

  const matStock = new THREE.MeshStandardMaterial({
    map: cyberTex,
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.15,
  });

  const matRecoilPad = new THREE.MeshStandardMaterial({
    color: 0x0f1013,
    roughness: 0.92,
    metalness: 0.0,
  });

  const matSilverTrigger = new THREE.MeshStandardMaterial({
    color: 0xeff3f6,
    roughness: 0.10,
    metalness: 0.98,
  });

  const matSightBead = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    roughness: 0.2,
    metalness: 0.1,
  });

  const matShellRed = new THREE.MeshStandardMaterial({
    color: 0xc81e28,
    roughness: 0.35,
    metalness: 0.1,
  });

  const matBrass = new THREE.MeshStandardMaterial({
    color: 0xdfb438,
    roughness: 0.18,
    metalness: 0.95,
  });

  const materialsRecord: Record<string, THREE.Material> = {
    'receiver': matReceiver,
    'barrel': matBarrel,
    'stock': matStock,
    'recoil_pad': matRecoilPad,
    'silver': matSilverTrigger,
    'sight': matSightBead,
  };

  const nodes: Record<string, THREE.Object3D> = {};
  const meshes: Record<string, THREE.Mesh> = {};
  const subAssemblies: Record<string, SubAssemblyTransform> = {};

  function helperMesh(
    name: string,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
    parentObj?: THREE.Object3D
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    mesh.castShadow = shadowCast;
    mesh.receiveShadow = shadowReceive;
    meshes[name] = mesh;
    nodes[name] = mesh;
    if (parentObj) parentObj.add(mesh);
    return mesh;
  }

  // Sub-Assembly Groups
  const grpReceiver = new THREE.Group(); grpReceiver.name = 'ReceiverAssembly'; root.add(grpReceiver);
  const grpBarrel = new THREE.Group(); grpBarrel.name = 'BarrelAssembly'; root.add(grpBarrel);
  const grpPump = new THREE.Group(); grpPump.name = 'PumpAssembly'; root.add(grpPump);
  const grpStock = new THREE.Group(); grpStock.name = 'StockAssembly'; root.add(grpStock);
  const grpTrigger = new THREE.Group(); grpTrigger.name = 'TriggerAssembly'; root.add(grpTrigger);
  const grpShell = new THREE.Group(); grpShell.name = 'ShellAssembly'; grpReceiver.add(grpShell);

  subAssemblies['ReceiverAssembly'] = { obj: grpReceiver, homePos: new THREE.Vector3(0, 0, 0), explodePos: new THREE.Vector3(0, 0, 0), homeRot: new THREE.Euler(0,0,0), explodeRot: new THREE.Euler(0,0,0) };
  subAssemblies['BarrelAssembly'] = { obj: grpBarrel, homePos: new THREE.Vector3(0, 0, 0), explodePos: new THREE.Vector3(0.4, 0.35, 0), homeRot: new THREE.Euler(0,0,0), explodeRot: new THREE.Euler(0,0,0.08) };
  subAssemblies['PumpAssembly'] = { obj: grpPump, homePos: new THREE.Vector3(0, 0, 0), explodePos: new THREE.Vector3(0.3, -0.3, 0), homeRot: new THREE.Euler(0,0,0), explodeRot: new THREE.Euler(0,0,-0.08) };
  subAssemblies['StockAssembly'] = { obj: grpStock, homePos: new THREE.Vector3(0, 0, 0), explodePos: new THREE.Vector3(-0.5, -0.2, 0), homeRot: new THREE.Euler(0,0,0), explodeRot: new THREE.Euler(0,0,-0.12) };
  subAssemblies['TriggerAssembly'] = { obj: grpTrigger, homePos: new THREE.Vector3(0, 0, 0), explodePos: new THREE.Vector3(-0.15, -0.35, 0), homeRot: new THREE.Euler(0,0,0), explodeRot: new THREE.Euler(0,0,0.15) };

  // ---------------------------------------------------------------------------
  // 1. RECEIVER GEOMETRY WITH ULTRA-SMOOTH CHAMFERS MATCHING IMAGE 1
  // ---------------------------------------------------------------------------
  const shapeRec = new THREE.Shape();
  shapeRec.moveTo(0.55, 0.12);
  shapeRec.lineTo(0.55, -0.10);
  shapeRec.lineTo(0.05, -0.10);
  shapeRec.bezierCurveTo(-0.15, -0.10, -0.30, -0.14, -0.42, -0.15);
  shapeRec.lineTo(-0.58, -0.06);
  shapeRec.lineTo(-0.35, 0.05); // 45-degree sloped rear chamfer
  shapeRec.bezierCurveTo(-0.20, 0.12, 0.10, 0.12, 0.55, 0.12);

  const geoReceiverExtrude = new THREE.ExtrudeGeometry(shapeRec, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 8,
  });
  geoReceiverExtrude.center();
  helperMesh('receiver_body', geoReceiverExtrude, matReceiver, [0.05, 0.02, 0.0], [0, 0, 0], [1, 1, 1], grpReceiver);

  const geoEjectPort = new THREE.BoxGeometry(0.32, 0.11, 0.01);
  helperMesh('ejection_port_bevel', geoEjectPort, matReceiver, [0.12, 0.045, 0.09], [0, 0, 0], [1, 1, 1], grpReceiver);

  const geoBolt = new THREE.CylinderGeometry(0.052, 0.052, 0.30, 24);
  geoBolt.rotateZ(Math.PI / 2);
  helperMesh('bolt_carrier', geoBolt, matBarrel, [0.12, 0.045, 0.065], [0, 0, 0], [1, 1, 1], grpReceiver);

  // ---------------------------------------------------------------------------
  // 2. SYNTHETIC BUTTSTOCK WITH THUMB NOTCH & ERGONOMIC PISTOL GRIP
  // ---------------------------------------------------------------------------
  const shapeStock = new THREE.Shape();
  shapeStock.moveTo(-0.32, 0.04);
  shapeStock.bezierCurveTo(-0.45, -0.02, -0.55, -0.05, -0.70, 0.01); // Thumb rest notch cutout!
  shapeStock.bezierCurveTo(-0.95, 0.02, -1.35, 0.02, -1.65, 0.04);  // Comb top line
  shapeStock.lineTo(-1.65, -0.42);                                  // Heel to toe back edge
  shapeStock.bezierCurveTo(-1.35, -0.38, -0.95, -0.34, -0.75, -0.30);
  shapeStock.bezierCurveTo(-0.62, -0.26, -0.52, -0.16, -0.42, -0.14); // Deep wrist neck swoop
  shapeStock.closePath();

  const geoStockExtrude = new THREE.ExtrudeGeometry(shapeStock, {
    depth: 0.13,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 8,
  });
  geoStockExtrude.center();
  helperMesh('buttstock_body', geoStockExtrude, matStock, [-1.02, -0.16, 0.0], [0, 0, 0], [1, 1, 1], grpStock);

  const shapePad = new THREE.Shape();
  shapePad.moveTo(-1.65, -0.42);
  shapePad.lineTo(-1.72, -0.42);
  shapePad.lineTo(-1.72, 0.04);
  shapePad.lineTo(-1.65, 0.04);
  shapePad.closePath();

  const geoPadExtrude = new THREE.ExtrudeGeometry(shapePad, { depth: 0.135, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3 });
  geoPadExtrude.center();
  helperMesh('stock_recoil_pad', geoPadExtrude, matRecoilPad, [-1.68, -0.16, 0.0], [0, 0, 0], [1, 1, 1], grpStock);

  // ---------------------------------------------------------------------------
  // 3. BARREL ASSEMBLY & VENTILATED SIGHT RIB MATCHING IMAGE 1
  // ---------------------------------------------------------------------------
  const geoBarrel = new THREE.CylinderGeometry(0.040, 0.040, 1.62, 32);
  geoBarrel.rotateZ(Math.PI / 2);
  const meshBarrel = helperMesh('shotgun_barrel_tube', geoBarrel, matBarrel, [1.35, 0.06, 0.0], [0, 0, 0], [1, 1, 1], grpBarrel);

  const geoRib = new THREE.BoxGeometry(1.62, 0.020, 0.030);
  helperMesh('barrel_ventilated_rib', geoRib, matBarrel, [1.35, 0.11, 0.0], [0, 0, 0], [1, 1, 1], grpBarrel);

  const geoRibSlot = new THREE.BoxGeometry(0.12, 0.016, 0.04);
  for (let i = 0; i < 6; i++) {
    helperMesh(`rib_slot_${i}`, geoRibSlot, matReceiver, [0.75 + i * 0.22, 0.11, 0.0], [0, 0, 0], [1, 1, 1], grpBarrel);
  }

  const geoSight = new THREE.CylinderGeometry(0.008, 0.008, 0.020, 16);
  geoSight.rotateZ(Math.PI / 2);
  helperMesh('front_sight_bead', geoSight, matSightBead, [2.14, 0.125, 0.0], [0, 0, 0], [1, 1, 1], grpBarrel);

  // ---------------------------------------------------------------------------
  // 4. MAGAZINE TUBE & MOLDED POLYMER FOREND PUMP HANDLE MATCHING IMAGE 1
  // ---------------------------------------------------------------------------
  const geoMagTube = new THREE.CylinderGeometry(0.036, 0.036, 1.25, 32);
  geoMagTube.rotateZ(Math.PI / 2);
  helperMesh('magazine_tube', geoMagTube, matBarrel, [1.15, -0.04, 0.0], [0, 0, 0], [1, 1, 1], grpPump);

  const geoMagCap = new THREE.CylinderGeometry(0.040, 0.040, 0.07, 32);
  geoMagCap.rotateZ(Math.PI / 2);
  helperMesh('magazine_cap', geoMagCap, matBarrel, [1.74, -0.04, 0.0], [0, 0, 0], [1, 1, 1], grpPump);

  const geoClamp = new THREE.BoxGeometry(0.05, 0.14, 0.07);
  helperMesh('barrel_clamp', geoClamp, matBarrel, [1.68, 0.01, 0.0], [0, 0, 0], [1, 1, 1], grpPump);

  const grpPumpHandle = new THREE.Group();
  grpPumpHandle.name = 'ForendPumpHandleGroup';
  grpPump.add(grpPumpHandle);
  nodes['forend_pump_handle'] = grpPumpHandle;

  // Sleek molded polymer forend shape
  const geoPumpBase = new THREE.CylinderGeometry(0.058, 0.058, 0.52, 32);
  geoPumpBase.rotateZ(Math.PI / 2);
  helperMesh('forend_pump_base', geoPumpBase, matStock, [1.05, -0.04, 0.0], [0, 0, 0], [1, 1, 1], grpPumpHandle);

  const geoPumpRib = new THREE.TorusGeometry(0.060, 0.005, 16, 32);
  geoPumpRib.rotateY(Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    helperMesh(`pump_rib_${i}`, geoPumpRib, matStock, [0.81 + i * 0.036, -0.04, 0.0], [0, 0, 0], [1, 1, 1], grpPumpHandle);
  }

  // ---------------------------------------------------------------------------
  // 5. TEARDROP TRIGGER GUARD & SILVER CHROME TRIGGER BLADE MATCHING IMAGE 1
  // ---------------------------------------------------------------------------
  const shapeGuard = new THREE.Shape();
  shapeGuard.absarc(0, 0, 0.065, 0, Math.PI * 2, false);
  const holeGuard = new THREE.Path();
  holeGuard.absarc(0, 0, 0.052, 0, Math.PI * 2, true);
  shapeGuard.holes.push(holeGuard);

  const geoGuardExtrude = new THREE.ExtrudeGeometry(shapeGuard, { depth: 0.038, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3 });
  geoGuardExtrude.center();
  helperMesh('trigger_guard_loop', geoGuardExtrude, matReceiver, [-0.28, -0.15, 0.0], [0, 0, 0], [1.3, 0.8, 1], grpTrigger);

  const geoTriggerBlade = new THREE.BoxGeometry(0.016, 0.070, 0.012);
  const meshTrigger = helperMesh('trigger_blade', geoTriggerBlade, matSilverTrigger, [-0.26, -0.14, 0.0], [0, 0, 0.45], [1, 1, 1], grpTrigger);

  // ---------------------------------------------------------------------------
  // 6. REALISTIC 12-GAUGE SHOTGUN SHELL
  // ---------------------------------------------------------------------------
  const grpRealShell = new THREE.Group();
  grpRealShell.name = 'Real12GaugeShellGroup';
  grpShell.add(grpRealShell);

  const geoShellHull = new THREE.CylinderGeometry(0.024, 0.024, 0.13, 32);
  geoShellHull.rotateZ(Math.PI / 2);
  helperMesh('shotgun_shell_hull', geoShellHull, matShellRed, [0.12, 0.045, 0.0], [0, 0, 0], [1, 1, 1], grpRealShell);

  const geoShellBrass = new THREE.CylinderGeometry(0.025, 0.025, 0.045, 32);
  geoShellBrass.rotateZ(Math.PI / 2);
  helperMesh('shotgun_shell_brass', geoShellBrass, matBrass, [0.035, 0.045, 0.0], [0, 0, 0], [1, 1, 1], grpRealShell);

  // ---------------------------------------------------------------------------
  // Preset Switcher Function
  // ---------------------------------------------------------------------------
  function setPreset(p: 'cyberprint' | 'printedsteel' | 'wood' | 'stealth') {
    if (p === 'wood') {
      matStock.map = woodTex;
      matReceiver.map = woodTex;
      matStock.color.setHex(0xffffff);
      matReceiver.color.setHex(0xffffff);
      (meshTrigger as THREE.Mesh).material = matBrass;
    } else if (p === 'printedsteel') {
      matStock.map = steelTex;
      matReceiver.map = steelTex;
      matStock.color.setHex(0xffffff);
      matReceiver.color.setHex(0xffffff);
      (meshTrigger as THREE.Mesh).material = matSilverTrigger;
    } else if (p === 'stealth') {
      matStock.map = stealthTex;
      matReceiver.map = stealthTex;
      matStock.color.setHex(0xffffff);
      matReceiver.color.setHex(0xffffff);
      (meshTrigger as THREE.Mesh).material = matSilverTrigger;
    } else {
      matStock.map = cyberTex;
      matReceiver.map = cyberTex;
      matStock.color.setHex(0xffffff);
      matReceiver.color.setHex(0xffffff);
      (meshTrigger as THREE.Mesh).material = matSilverTrigger;
    }
    matStock.needsUpdate = true;
    matReceiver.needsUpdate = true;
  }

  const runtime: ProceduralModelRuntime = {
    nodes,
    meshes,
    materials: materialsRecord,
    parts: {
      pumpHandle: grpPumpHandle,
      shellMesh: grpRealShell,
      barrelMesh: meshBarrel,
      triggerMesh: meshTrigger,
      muzzlePoint: new THREE.Vector3(2.15, 0.06, 0),
    },
    subAssemblies,
    setPreset,
  };

  root.userData.sculptRuntime = runtime;
  return root;
}

// -----------------------------------------------------------------------------
// Studio Look-Dev Lights
// -----------------------------------------------------------------------------

export function createJokerShotgunLookDevLights(style: string = 'reference'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'LookDevLights';

  const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
  keyLight.position.set(3, 4, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  group.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x88aacc, 0.7);
  fillLight.position.set(-4, 2, -2);
  group.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x00f5d4, 1.3);
  rimLight.position.set(2, 3, -4);
  group.add(rimLight);

  const ambLight = new THREE.AmbientLight(0x22242b, 0.85);
  group.add(ambLight);

  return group;
}

// -----------------------------------------------------------------------------
// Environment Map Setup
// -----------------------------------------------------------------------------

export function createJokerShotgunEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const roomEnv = new RoomEnvironment(renderer);
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromScene(roomEnv).texture;
  roomEnv.dispose();
  pmremGenerator.dispose();
  return envMap;
}

// -----------------------------------------------------------------------------
// Camera Framing Helper
// -----------------------------------------------------------------------------

export function frameJokerShotgunCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
) {
  camera.position.set(0.1, 0.1, 3.4);
  camera.lookAt(target);
}

// -----------------------------------------------------------------------------
// Post-Processing Composer Setup
// -----------------------------------------------------------------------------

export function createJokerShotgunPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.25,
    0.5,
    0.85
  );
  composer.addPass(bloomPass);

  return composer;
}
