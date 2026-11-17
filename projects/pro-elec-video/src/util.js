// Timing / easing helpers — one motion language for the whole film.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
export const easeIn = (x) => x * x * x;
export const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
// Soft spring: ~3 % overshoot, settles at 1 (premium, not bouncy).
export const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-7.5 * x) * Math.cos(8.5 * x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// Seeded random (deterministic frames)
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// in/out envelope for an element living in [a, b]
export function life(t, a, b, fin = 0.45, fout = 0.35) {
  const i = easeOut(prog(t, a, a + fin));
  const o = easeIn(prog(t, b - fout, b));
  return { i, o, v: i * (1 - o), on: t >= a && t <= b };
}
