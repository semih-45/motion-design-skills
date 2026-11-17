import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function makeRenderer(canvas, W, H, dpr) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(dpr);
  r.setSize(W, H, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x000000, 0);
  const pmrem = new THREE.PMREMGenerator(r);
  r.userData = { env: pmrem.fromScene(new RoomEnvironment(), 0.03).texture };
  return r;
}

// Soft radial blob texture for contact shadows / glows
const _texCache = {};
export function radialTex(key, stops) {
  if (_texCache[key]) return _texCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (_texCache[key] = t);
}

export function blobShadow(w, d, opacity = 0.35, color = '0,0,0') {
  const tex = radialTex('shadow' + color, [[0, `rgba(${color},1)`], [0.45, `rgba(${color},0.45)`], [1, `rgba(${color},0)`]]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -1;
  return m;
}

export function glowSprite(color = '34,197,94', size = 1, opacity = 1) {
  const tex = radialTex('glow' + color, [[0, `rgba(${color},1)`], [0.25, `rgba(${color},0.55)`], [1, `rgba(${color},0)`]]);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false }));
  s.scale.setScalar(size);
  return s;
}

export function keyLights(scene, { shadow = true, intensity = 2.2, dir = [3, 6, 5], shadowSize = 4, ambient = 0.35 } = {}) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xdfe8e2, ambient);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, intensity);
  key.position.set(...dir);
  if (shadow) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const s = shadowSize;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.1, far: 40 });
    key.shadow.radius = 6;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
  }
  scene.add(key); scene.add(key.target);
  const rim = new THREE.DirectionalLight(0xeafff1, 0.6);
  rim.position.set(-4, 3, -4);
  scene.add(rim);
  return { hemi, key, rim };
}

// camera distance so a box (w,h) fills `frac` of the viewport
export function fitDistance(cam, w, h, frac = 0.8) {
  const v = THREE.MathUtils.degToRad(cam.fov) / 2;
  const dh = (h / frac) / 2 / Math.tan(v);
  const dw = (w / frac) / 2 / (Math.tan(v) * cam.aspect);
  return Math.max(dh, dw);
}

export function orbit(cam, target, radius, az, el) {
  cam.position.set(
    target.x + radius * Math.sin(az) * Math.cos(el),
    target.y + radius * Math.sin(el),
    target.z + radius * Math.cos(az) * Math.cos(el));
  cam.lookAt(target);
}

// project a world point to logical screen px
const _v = new THREE.Vector3();
export function toScreen(p, cam, W, H) {
  _v.copy(p).project(cam);
  return { x: (_v.x * 0.5 + 0.5) * W, y: (-_v.y * 0.5 + 0.5) * H };
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
