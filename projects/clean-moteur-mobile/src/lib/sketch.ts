// Deterministic hand-drawn path generators (marker / technical-sketch look).
import {random} from 'remotion';

export type Pt = {x: number; y: number};

const jit = (seed: string, amt: number) => (random(seed) - 0.5) * 2 * amt;

/** Smooth path through points (Catmull-Rom → cubic Bézier). */
export const smoothPath = (pts: Pt[]) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};

/** A hand-drawn curved stroke from a to b with a sideways bow. */
export const handCurve = (a: Pt, b: Pt, seed: string, bow = 0.18, wobble = 3) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const nx = -dy;
  const ny = dx;
  const pts: Pt[] = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const bowAmt = Math.sin(Math.PI * t) * bow;
    pts.push({
      x: a.x + dx * t + nx * bowAmt + (i > 0 && i < n ? jit(`${seed}x${i}`, wobble) : 0),
      y: a.y + dy * t + ny * bowAmt + (i > 0 && i < n ? jit(`${seed}y${i}`, wobble) : 0),
    });
  }
  return {d: smoothPath(pts), end: pts[n], before: pts[n - 1]};
};

/** Arrow head (two strokes) at tip, pointing along dir (from 'from' to 'tip'). */
export const arrowHead = (from: Pt, tip: Pt, size: number, seed: string) => {
  const ang = Math.atan2(tip.y - from.y, tip.x - from.x);
  const a1 = ang + Math.PI - 0.5 + jit(`${seed}a`, 0.08);
  const a2 = ang + Math.PI + 0.5 + jit(`${seed}b`, 0.08);
  const p1 = {x: tip.x + Math.cos(a1) * size, y: tip.y + Math.sin(a1) * size};
  const p2 = {x: tip.x + Math.cos(a2) * size, y: tip.y + Math.sin(a2) * size};
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
};

/** Loose marker ellipse that overshoots its start (like a quick circle drawn with a felt pen). */
export const handEllipse = (cx: number, cy: number, rx: number, ry: number, seed: string, turns = 1.12, tilt = -0.12) => {
  const pts: Pt[] = [];
  const n = 22;
  const start = -Math.PI * 0.75 + jit(`${seed}s`, 0.3);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + t * Math.PI * 2 * turns;
    const grow = 1 + (t - 0.5) * 0.08 + jit(`${seed}r${i}`, 0.025);
    const x = Math.cos(a) * rx * grow;
    const y = Math.sin(a) * ry * grow;
    pts.push({x: cx + x * Math.cos(tilt) - y * Math.sin(tilt), y: cy + x * Math.sin(tilt) + y * Math.cos(tilt)});
  }
  return smoothPath(pts);
};

/** Wobbly straight-ish line (for strike-throughs / underlines). */
export const handLine = (a: Pt, b: Pt, seed: string, wobble = 2.5) => {
  const pts: Pt[] = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({x: a.x + (b.x - a.x) * t + (i % n ? jit(`${seed}x${i}`, wobble) : 0), y: a.y + (b.y - a.y) * t + (i % n ? jit(`${seed}y${i}`, wobble) : 0)});
  }
  return smoothPath(pts);
};

/** Check mark path. */
export const checkPath = (x: number, y: number, s: number) =>
  `M ${x} ${y} C ${x + s * 0.15} ${y + s * 0.18}, ${x + s * 0.28} ${y + s * 0.36}, ${x + s * 0.36} ${y + s * 0.45} C ${x + s * 0.55} ${y + s * 0.05}, ${x + s * 0.75} ${y - s * 0.28}, ${x + s} ${y - s * 0.5}`;
