// 3D smartphone: titanium frame, black glass, live chat texture.
import * as THREE from 'three';
import {drawChat} from './chat';
import {CHAT, PHONE, PhonePose, SCREEN} from './rig2';

export type PhoneBuild = {root: THREE.Group; update: (f: number, pose: PhonePose) => void};

const roundRectShape = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};

const planarUV = (g: THREE.BufferGeometry, w: number, h: number) => {
  const pos = g.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
};

export const buildPhone = (): PhoneBuild => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const bevel = 0.012;
  const frameGeo = new THREE.ExtrudeGeometry(roundRectShape(PHONE.w - 2 * bevel, PHONE.h - 2 * bevel, PHONE.r - bevel), {
    depth: PHONE.d - 2 * bevel,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 5,
    curveSegments: 24,
  });
  frameGeo.translate(0, 0, -(PHONE.d - 2 * bevel) / 2);
  const titanium = new THREE.MeshPhysicalMaterial({color: '#aeb6c2', metalness: 1, roughness: 0.22, clearcoat: 0.6, envMapIntensity: 1.3});
  body.add(new THREE.Mesh(frameGeo, titanium));

  // front black glass (bezel)
  const front = new THREE.Mesh(
    new THREE.ShapeGeometry(roundRectShape(PHONE.w - 0.006, PHONE.h - 0.006, PHONE.r - 0.004), 32),
    new THREE.MeshPhysicalMaterial({color: '#020305', metalness: 0.1, roughness: 0.06, clearcoat: 1, envMapIntensity: 0.8}),
  );
  front.position.z = PHONE.d / 2 + 0.0005;
  body.add(front);

  // screen with canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = CHAT.w * CHAT.scale;
  canvas.height = CHAT.h * CHAT.scale;
  const g = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  const screenGeo = new THREE.ShapeGeometry(roundRectShape(SCREEN.w, SCREEN.h, PHONE.r - PHONE.bezel), 32);
  planarUV(screenGeo, SCREEN.w, SCREEN.h);
  const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  screen.position.z = PHONE.d / 2 + 0.0012;
  body.add(screen);

  // glass reflection layer
  const refl = new THREE.Mesh(
    new THREE.ShapeGeometry(roundRectShape(PHONE.w - 0.006, PHONE.h - 0.006, PHONE.r - 0.004), 32),
    new THREE.MeshStandardMaterial({color: '#ffffff', metalness: 1, roughness: 0.12, transparent: true, opacity: 0.07, depthWrite: false}),
  );
  refl.position.z = PHONE.d / 2 + 0.002;
  body.add(refl);

  // side buttons
  const btnMat = titanium;
  const addBtn = (x: number, y: number, h: number) => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, h, 4, 8), btnMat);
    b.position.set(x, y, 0);
    body.add(b);
  };
  addBtn(PHONE.w / 2 + 0.003, 0.33, 0.13);
  addBtn(-PHONE.w / 2 - 0.003, 0.42, 0.06);
  addBtn(-PHONE.w / 2 - 0.003, 0.28, 0.1);
  addBtn(-PHONE.w / 2 - 0.003, 0.14, 0.1);

  // back camera bump (visible when tilting)
  const bump = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundRectShape(0.27, 0.27, 0.06), {depth: 0.01, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 3}),
    new THREE.MeshPhysicalMaterial({color: '#9aa3b0', metalness: 0.6, roughness: 0.3}),
  );
  bump.position.set(-0.17, 0.53, -PHONE.d / 2 - 0.014);
  body.add(bump);

  const update = (f: number, pose: PhonePose) => {
    root.position.copy(pose.pos);
    root.rotation.copy(pose.rot);
    g.setTransform(CHAT.scale, 0, 0, CHAT.scale, 0, 0);
    drawChat(g, f);
    tex.needsUpdate = true;
  };
  return {root, update};
};
