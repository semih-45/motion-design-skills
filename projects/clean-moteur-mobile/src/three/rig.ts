// Pure, frame-driven camera + turntable rig for the 3D car scene.
// Shared by the WebGL layer and the 2D annotation layer so labels track the 3D parts exactly.
import * as THREE from 'three';
import {C, H, S, W} from '../timeline';
import {clamp, easeInOut, easeOut, lerp, prog} from '../lib/anim';

export const CAR_FOV = 26;

// Car-local anchor points (x forward, y up, z = side facing camera).
export const ANCHORS = {
  head: new THREE.Vector3(1.36, 0.84, 0.12), // cylinder head / valves
  egr: new THREE.Vector3(1.02, 0.8, 0.3),
  turbo: new THREE.Vector3(1.3, 0.62, 0.48),
  fap: new THREE.Vector3(0.38, 0.22, 0.3),
  tail: new THREE.Vector3(-2.42, 0.27, 0.52),
  engine: new THREE.Vector3(1.38, 0.72, 0.0),
};
export type AnchorName = keyof typeof ANCHORS;

/** Turntable yaw (radians). Negative turns the nose toward the camera. */
export const carYaw = (f: number) => {
  const a = lerp(-12, -38, prog(f, S.problem, 150, easeOut));
  const b = lerp(0, -10, prog(f, S.solution, 90, easeInOut));
  return ((a + b) * Math.PI) / 180;
};

/** Camera pose: spherical around a target, camera sits on the +z side. */
export const carCamera = (f: number) => {
  const elev = lerp(5, 21, prog(f, S.problem, 60, easeInOut)) + lerp(0, -4, prog(f, C.unXray, 30, easeInOut));
  const dist = lerp(20.5, 22.5, prog(f, S.problem, 150, easeOut)) + lerp(0, 1.5, prog(f, S.solution, 90, easeInOut));
  const tY = lerp(0.95, 0.62, prog(f, S.problem, 60, easeInOut));
  const az = (lerp(96, 90, prog(f, S.problem, 220, easeInOut)) * Math.PI) / 180; // azimuth from +x toward +z
  const e = (elev * Math.PI) / 180;
  const target = new THREE.Vector3(0.1, tY, 0);
  const pos = new THREE.Vector3(
    target.x + dist * Math.cos(e) * Math.cos(az),
    target.y + dist * Math.sin(e),
    target.z + dist * Math.cos(e) * Math.sin(az),
  );
  return {pos, target, fov: CAR_FOV};
};

// The car is placed lower than centre so annotations have room above.
export const CAR_VIEW_SHIFT_Y = -40; // px (negative = car drawn lower)

export const makeCarCamera = (f: number) => {
  const {pos, target, fov} = carCamera(f);
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 200);
  cam.position.copy(pos);
  cam.lookAt(target);
  cam.setViewOffset(W, H, 0, -CAR_VIEW_SHIFT_Y, W, H);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

const PLATFORM_Y = 0.06;

export const carMatrix = (f: number) => {
  const m = new THREE.Matrix4();
  m.makeRotationY(carYaw(f));
  m.setPosition(0, PLATFORM_Y, 0);
  return m;
};

/** Project a car-local point to screen pixels at frame f. */
export const projectCarPoint = (local: THREE.Vector3, f: number) => {
  const cam = makeCarCamera(f);
  const p = local.clone().applyMatrix4(carMatrix(f)).project(cam);
  return {x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, behind: p.z > 1};
};

export const projectAnchor = (name: AnchorName, f: number) => projectCarPoint(ANCHORS[name], f);

/** Project a world point (no car transform). */
export const projectWorld = (p: THREE.Vector3, f: number) => {
  const cam = makeCarCamera(f);
  const q = p.clone().project(cam);
  return {x: (q.x * 0.5 + 0.5) * W, y: (-q.y * 0.5 + 0.5) * H};
};

export const xraySweep = (f: number) => {
  // returns sweep position along car x: +2.6 (nothing x-rayed) → -2.6 (all x-rayed)
  const into = prog(f, C.xray, 16, easeInOut);
  const out = prog(f, C.unXray, 16, easeInOut);
  if (f < C.unXray) return lerp(2.7, -2.7, into);
  return lerp(-2.7, 2.7, out);
};

export const scanHeight = (f: number) => lerp(-0.05, 1.62, prog(f, C.carScan, 22, easeInOut));

export const hoodAngle = (f: number) => {
  const open = prog(f, C.hoodOpen, 16, easeOut);
  const close = prog(f, C.unXray + 6, 14, easeInOut);
  return (58 * Math.PI) / 180 * clamp(open - close);
};
