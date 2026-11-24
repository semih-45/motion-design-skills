// Phone + brake-disc rigs (pure functions of frame). Shared with the 2D layer for exact matches.
import * as THREE from 'three';
import {C, H, S, W} from '../timeline';
import {easeIn, easeInOut, easeOut, lerp, noise1, prog} from '../lib/anim';

export const PHONE_ORIGIN = new THREE.Vector3(100, 0, 0);
export const PHONE = {w: 0.72, h: 1.48, d: 0.078, r: 0.105, bezel: 0.02};
export const SCREEN = {w: PHONE.w - 2 * PHONE.bezel, h: PHONE.h - 2 * PHONE.bezel};
// Chat canvas, in "pt" units (scaled ×3 to pixels in the texture)
export const CHAT = {w: 390, h: Math.round((390 * SCREEN.h) / SCREEN.w), scale: 3};

export const PHONE_FOV = 30;

export type PhonePose = {pos: THREE.Vector3; rot: THREE.Euler};

export const phonePose = (f: number): PhonePose => {
  const t = (f - S.chat) / 30;
  const settle = prog(f, C.phoneReveal + 4, 34, easeOut);
  const ry = lerp(0, 0.16 * Math.sin(t * 1.1) - 0.1, settle) + noise1(t * 0.4, 3) * 0.03 * settle;
  const rx = lerp(0, -0.07 + 0.04 * Math.sin(t * 0.9), settle);
  const rz = lerp(0, 0.03 * Math.sin(t * 0.7), settle);
  const exit = prog(f, C.notif + 6, 12, easeIn);
  const pos = PHONE_ORIGIN.clone().add(new THREE.Vector3(0, 0.035 * Math.sin(t * 1.6) * settle - exit * 4.2, 0));
  return {pos, rot: new THREE.Euler(rx - exit * 0.6, ry, rz)};
};

export const phoneMatrix = (f: number) => {
  const p = phonePose(f);
  const m = new THREE.Matrix4().makeRotationFromEuler(p.rot);
  m.setPosition(p.pos);
  return m;
};

/** Chat-canvas point (pt) → phone-local 3D point on the screen surface. */
export const chatToLocal = (xPt: number, yPt: number) =>
  new THREE.Vector3(-SCREEN.w / 2 + (xPt / CHAT.w) * SCREEN.w, SCREEN.h / 2 - (yPt / CHAT.h) * SCREEN.h, PHONE.d / 2 + 0.002);

// Close-up target: the first chat bubble (where the H2 drop lands)
export const FIRST_BUBBLE = {x: 86, y: 150, w: 292, h: 116}; // must match chat.ts LAYOUT.b1

export const phoneCamera = (f: number) => {
  const pull = prog(f, C.phoneReveal, 30, easeInOut);
  const d = lerp(2.0, 3.95, pull);
  const bubbleCenter = chatToLocal(FIRST_BUBBLE.x + FIRST_BUBBLE.w / 2, FIRST_BUBBLE.y + FIRST_BUBBLE.h / 2);
  const target = PHONE_ORIGIN.clone().add(
    new THREE.Vector3(lerp(bubbleCenter.x, 0, pull), lerp(bubbleCenter.y, 0.07, pull), 0),
  );
  const cam = new THREE.PerspectiveCamera(PHONE_FOV, W / H, 0.05, 100);
  cam.position.set(target.x, target.y, target.z + d);
  cam.lookAt(target);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

export const projectChatPoint = (xPt: number, yPt: number, f: number) => {
  const cam = phoneCamera(f);
  const p = chatToLocal(xPt, yPt).applyMatrix4(phoneMatrix(f)).project(cam);
  return {x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H};
};

// ---------------- brake disc ----------------
export const DISC_ORIGIN = new THREE.Vector3(200, 0, 0);
export const DISC_FOV = 30;
export const DISC_DIST = 10.2;
// where the disc (and later the QR ring) sits; r = on-screen radius of a 1-unit disc
export const DISC_SCREEN = {x: 540, y: 1060, r: H / (2 * DISC_DIST * Math.tan((DISC_FOV * Math.PI) / 360))};

export const discCamera = (_f: number) => {
  const cam = new THREE.PerspectiveCamera(DISC_FOV, W / H, 0.1, 100);
  // shift view so the disc origin lands on DISC_SCREEN
  cam.position.set(DISC_ORIGIN.x, DISC_ORIGIN.y, DISC_DIST);
  cam.lookAt(DISC_ORIGIN);
  cam.setViewOffset(W, H, W / 2 - DISC_SCREEN.x, H / 2 - DISC_SCREEN.y, W, H);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

/** Disc pose: grows out of the brake card icon, tilts in 3D while spinning, then faces camera (→ QR ring). */
export const BRAKE_ICON_SCREEN = {x: 780, y: 812, r: 58};
export const discPose = (f: number) => {
  const grow = prog(f, C.disc - 1, 16, easeInOut);
  const face = prog(f, C.qr - 16, 14, easeInOut);
  const tilt = prog(f, C.disc + 2, 16, easeOut) * (1 - face);
  const scale = lerp(BRAKE_ICON_SCREEN.r / DISC_SCREEN.r, 1, grow);
  const rx = -0.62 * tilt;
  const ry = 0.7 * tilt;
  const t = Math.max(0, f - (C.disc - 1));
  const spin = -(0.05 * t + 0.0045 * Math.pow(Math.max(0, f - (C.qr - 18)), 2));
  const offX = ((BRAKE_ICON_SCREEN.x - DISC_SCREEN.x) / DISC_SCREEN.r) * (1 - grow);
  const offY = ((DISC_SCREEN.y - BRAKE_ICON_SCREEN.y) / DISC_SCREEN.r) * (1 - grow);
  const pos = DISC_ORIGIN.clone().add(new THREE.Vector3(offX, offY, 0));
  return {pos, rx, ry, spin, scale, face};
};

/** Spin angle (radians) of the disc at frame f — used to keep the 2D QR ring in phase. */
export const discSpin = (f: number) => discPose(f).spin;
