// Deterministic sprite-based smoke on a 2D canvas (fbm-noise puffs).
import React, {useLayoutEffect, useRef} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {H, W} from '../timeline';

let SPRITES: HTMLCanvasElement[] | null = null;

const makeSprite = (seed: number, rgb: [number, number, number]) => {
  const N = 192;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  const img = g.createImageData(N, N);
  // value-noise fbm
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const cc = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v;
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const nx = x / N;
      const ny = y / N;
      let n = 0;
      let amp = 0.5;
      let fr = 3;
      for (let o = 0; o < 5; o++) {
        n += amp * vnoise(nx * fr, ny * fr);
        amp *= 0.5;
        fr *= 2;
      }
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy) * 2;
      const fall = Math.max(0, 1 - r);
      const a = Math.max(0, Math.min(1, (n - 0.34) * 2.6)) * fall * fall * (3 - 2 * fall);
      const i = (y * N + x) * 4;
      const shade = 0.75 + 0.5 * (n - 0.5);
      img.data[i] = Math.min(255, rgb[0] * shade);
      img.data[i + 1] = Math.min(255, rgb[1] * shade);
      img.data[i + 2] = Math.min(255, rgb[2] * shade);
      img.data[i + 3] = a * 255;
    }
  g.putImageData(img, 0, 0);
  return c;
};

const sprites = () => {
  if (!SPRITES) {
    SPRITES = [
      makeSprite(1, [44, 40, 37]),
      makeSprite(2, [60, 55, 50]),
      makeSprite(3, [26, 26, 28]),
      makeSprite(4, [96, 100, 108]),
    ];
  }
  return SPRITES;
};

export type Puff = {x: number; y: number; size: number; alpha: number; rot: number; sprite: number};

export type Emitter = {
  id: string;
  start: number;
  end: number;
  perFrame: number;
  life: number;
  /** returns a puff state given seed-random fn r(k) and age (frames) and birth frame */
  puff: (r: (k: number) => number, age: number, birth: number) => Puff | null;
};

export const Smoke: React.FC<{emitters: Emitter[]; opacity?: number; blend?: GlobalCompositeOperation}> = ({emitters, opacity = 1, blend = 'source-over'}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    if (opacity <= 0) return;
    const sp = sprites();
    g.globalCompositeOperation = blend;
    for (const e of emitters) {
      const b0 = Math.max(e.start, Math.floor(f - e.life));
      const b1 = Math.min(e.end, f);
      for (let b = b0; b <= b1; b++) {
        for (let k = 0; k < e.perFrame; k++) {
          const seed = `${e.id}-${b}-${k}`;
          const r = (n: number) => random(`${seed}-${n}`);
          const age = f - b;
          if (age < 0 || age > e.life) continue;
          const p = e.puff(r, age, b);
          if (!p || p.alpha <= 0.003) continue;
          g.save();
          g.globalAlpha = Math.min(1, p.alpha * opacity);
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.drawImage(sp[p.sprite % sp.length], -p.size / 2, -p.size / 2, p.size, p.size);
          g.restore();
        }
      }
    }
  }, [f, emitters, opacity, blend]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H}} />;
};
