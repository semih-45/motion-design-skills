// Motion language (see README): one signature ease-out for landings, one ease-in for exits,
// base unit 6 frames (0.2 s). Everything is a pure function of the frame.
import {Easing, random} from 'remotion';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = lerp;

// Signature curves
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1); // expo-like soft landing
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0); // exits
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const backOut = Easing.bezier(0.34, 1.45, 0.64, 1); // small overshoot for pops

/** 0..1 progress of frame within [start, start+dur], eased. */
export const prog = (
  frame: number,
  start: number,
  dur: number,
  ease: (t: number) => number = easeOut,
) => ease(clamp((frame - start) / dur));

/** Linear 0..1 */
export const lin = (frame: number, start: number, dur: number) => clamp((frame - start) / dur);

/** in → hold → out envelope (eased). */
export const envelope = (frame: number, inStart: number, inDur: number, outStart: number, outDur: number) =>
  prog(frame, inStart, inDur) * (1 - prog(frame, outStart, outDur, easeIn));

/** Damped spring 0→1 (closed form, overshoot controlled by zeta). */
export const springy = (frame: number, start: number, freq = 2.2, zeta = 0.45) => {
  const t = Math.max(0, (frame - start) / 30);
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};

/** Smooth value noise in [-1,1] for camera shake / drift. Deterministic. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = random(`n${seed}-${i}`) * 2 - 1;
  const b = random(`n${seed}-${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/** Impact shake: decaying jitter after each impact frame. Returns px offset & rotation. */
export const shake = (frame: number, impacts: {f: number; amp: number}[]) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const {f, amp} of impacts) {
    const t = frame - f;
    if (t < 0 || t > 14) continue;
    const decay = Math.exp(-t / 3.5);
    x += noise1(t * 1.7, f) * amp * decay;
    y += noise1(t * 1.7, f + 99) * amp * decay;
    r += noise1(t * 1.3, f + 7) * amp * 0.04 * decay;
  }
  return {x, y, r};
};

export const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const mixColor = (c1: string, c2: string, t: number) => {
  const p = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = p(c1);
  const b = p(c2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
