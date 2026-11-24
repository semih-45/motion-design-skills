// Scene 1 — hook: engine warning light, black smoke, giant slamming words, light → platform ring.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, lin, mixColor, prog} from '../lib/anim';
import {Emitter, Smoke} from '../components/Smoke';
import {makeCarCamera} from '../three/rig';

export const ENGINE_ICON =
  'M70 20 L150 20 L150 36 L122 36 L122 50 L180 50 L180 64 L196 64 L196 48 L214 48 L214 128 L196 128 L196 104 L180 104 L180 134 L100 134 L84 118 L56 118 L56 94 L40 94 L40 120 L24 120 L24 62 L40 62 L40 80 L56 80 L56 66 L72 50 L98 50 L98 36 L70 36 Z';

const ICON = {cx: 540, cy: 900, w: 470};

const LINES = [
  {t: 'FUMÉE', at: 'word1', dot: true},
  {t: 'PERTE DE', at: 'word2', dot: false},
  {t: 'PUISSANCE', at: 'word2', delay: 3, dot: true},
  {t: 'SURCONSOMMATION', at: 'word3', dot: true},
];

let measureCtx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number) => {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx!.font = `900 ${size}px Montserrat`;
  return measureCtx!.measureText(text).width;
};

const lightLevel = (f: number) => {
  const seq: Record<number, number> = {4: 0.85, 5: 0.15, 6: 1, 7: 0.35, 8: 0.9};
  if (f < 4) return 0;
  if (seq[f] !== undefined) return seq[f];
  return 0.92 + 0.08 * Math.sin(f * 0.9);
};

/** Ellipse of the 3D platform ring as seen at frame f (for the match cut). */
export const platformEllipse = (f: number) => {
  const cam = makeCarCamera(f);
  let minX = 1e9;
  let maxX = -1e9;
  let minY = 1e9;
  let maxY = -1e9;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * 3.08, 0.065, Math.sin(a) * 3.08).project(cam);
    const x = (p.x * 0.5 + 0.5) * W;
    const y = (-p.y * 0.5 + 0.5) * 1920;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, rx: (maxX - minX) / 2, ry: (maxY - minY) / 2};
};

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const emitters = useMemo<Emitter[]>(
    () => [
      {
        id: 'hb',
        start: 5,
        end: 64,
        perFrame: 2,
        life: 46,
        puff: (r, age) => {
          const t = age / 46;
          const x0 = r(0) * W;
          return {
            x: x0 + (r(1) - 0.5) * 120 * t + (540 - x0) * 0.25 * t,
            y: 2050 - age * (14 + r(2) * 16),
            size: 380 + 900 * t + r(3) * 200,
            alpha: 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.15)),
            rot: r(4) * 6 + age * 0.01 * (r(5) - 0.5),
            sprite: Math.floor(r(6) * 3),
          };
        },
      },
      {
        id: 'hs',
        start: 9,
        end: 62,
        perFrame: 1,
        life: 40,
        puff: (r, age) => {
          const t = age / 40;
          const left = r(0) < 0.5;
          return {
            x: (left ? -200 : W + 200) + (left ? 1 : -1) * age * (12 + r(1) * 14),
            y: 600 + r(2) * 900 - age * 4,
            size: 420 + 700 * t,
            alpha: 0.45 * Math.sin(Math.PI * t),
            rot: r(3) * 6,
            sprite: Math.floor(r(4) * 3),
          };
        },
      },
    ],
    [],
  );

  if (f >= S.problem + 14) return null;

  const L = lightLevel(f);
  const morph = prog(f, C.ringMorph, 16, easeInOut);
  const iconScale = lerp(1, 0.25, morph);
  const iconOpacity = L * (1 - prog(f, C.ringMorph + 2, 8));
  const smokeOpacity = 1 - prog(f, C.ringMorph - 2, 14, easeIn);

  // text block layout (fit-to-width lines)
  const target = 950;
  const sizes = LINES.map((l) => Math.min(250, (100 * target) / measure(l.t + '.', 100)));
  const gaps = sizes.map((s) => s * 0.9);
  const totalH = gaps.reduce((a, b) => a + b, 0);
  let y = 960 - totalH / 2 + 40;
  const exit = prog(f, C.ringMorph - 6, 9, easeIn);

  // ring morph geometry
  const ell = platformEllipse(S.problem + 6);
  const ringP = prog(f, C.ringMorph + 2, 16, easeInOut);
  const rcx = lerp(ICON.cx, ell.cx, ringP);
  const rcy = lerp(ICON.cy - 10, ell.cy, ringP);
  const rrx = lerp(150, ell.rx, ringP);
  const rry = lerp(150, ell.ry, ringP);
  const ringOpacity = prog(f, C.ringMorph, 5) * (1 - prog(f, S.problem + 4, 6));
  const ringColor = mixColor('#FF9F1C', '#5AA0FF', prog(f, C.ringMorph + 4, 10));

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* glow */}
      <div
        style={{
          position: 'absolute',
          left: ICON.cx - 700,
          top: ICON.cy - 700,
          width: 1400,
          height: 1400,
          background: 'radial-gradient(closest-side, rgba(255,140,20,0.55), rgba(255,110,0,0.16) 45%, transparent 75%)',
          opacity: iconOpacity * (1 - morph),
        }}
      />
      {/* dashboard ring hint */}
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.35 * iconOpacity * (1 - morph), filter: 'blur(2px)'}}>
        {Array.from({length: 41}).map((_, i) => {
          const a = Math.PI * (0.8 + (i / 40) * 1.4);
          const r0 = 380;
          const r1 = i % 5 === 0 ? 345 : 362;
          return (
            <line
              key={i}
              x1={ICON.cx + Math.cos(a) * r0}
              y1={ICON.cy + Math.sin(a) * r0}
              x2={ICON.cx + Math.cos(a) * r1}
              y2={ICON.cy + Math.sin(a) * r1}
              stroke="#ffb15c"
              strokeWidth={i % 5 === 0 ? 5 : 2.5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {/* engine icon */}
      <svg
        viewBox="0 0 240 160"
        width={ICON.w}
        height={(ICON.w * 160) / 240}
        style={{
          position: 'absolute',
          left: ICON.cx - ICON.w / 2,
          top: ICON.cy - (ICON.w * 160) / 240 / 2,
          opacity: iconOpacity,
          transform: `scale(${iconScale * (1 + 0.06 * (1 - prog(f, 4, 10)))})`,
          filter: 'drop-shadow(0 0 18px rgba(255,150,30,0.95)) drop-shadow(0 0 60px rgba(255,120,0,0.7))',
        }}
      >
        <defs>
          <linearGradient id="engG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD27A" />
            <stop offset="55%" stopColor="#FFA42B" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
        </defs>
        <path d={ENGINE_ICON} fill="url(#engG)" />
        <path d={ENGINE_ICON} fill="none" stroke="#FFE9B8" strokeWidth={2} opacity={0.6} />
      </svg>
      {/* smoke */}
      <Smoke emitters={emitters} opacity={smokeOpacity} />
      {/* words */}
      {LINES.map((l, i) => {
        const size = sizes[i];
        const top = y;
        y += gaps[i];
        const at = C[l.at] + (l.delay ?? 0);
        const p = prog(f, at, 6, easeOut);
        if (f < at) return null;
        const scale = lerp(1.45, 1, p) * (1 + 0.04 * (1 - lin(f, at, 40))) * lerp(1, 1.7 + i * 0.15, exit);
        const blur = lerp(16, 0, p) + exit * 18;
        const dimmed = l.at === 'word1' ? (f >= C.word2 ? 0.8 : 1) : l.at === 'word2' ? (f >= C.word3 ? 0.8 : 1) : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              width: W,
              top,
              textAlign: 'center',
              fontFamily: FONT.sans,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: -size * 0.02,
              color: '#fff',
              opacity: clamp(lin(f, at, 2)) * dimmed * (1 - exit),
              transform: `translateX(${(i % 2 ? 1 : -1) * exit * 120}px) scale(${scale})`,
              filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
              textShadow: '0 10px 40px rgba(0,0,0,0.8)',
            }}
          >
            {l.t}
            {l.dot && <span style={{color: '#E3262E'}}>.</span>}
          </div>
        );
      })}
      {/* engine light → platform ring */}
      {ringOpacity > 0.01 && (
        <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
          <ellipse
            cx={rcx}
            cy={rcy}
            rx={rrx}
            ry={rry}
            fill="none"
            stroke={ringColor}
            strokeWidth={lerp(12, 5, ringP)}
            opacity={ringOpacity}
            style={{filter: `drop-shadow(0 0 14px ${ringColor}) drop-shadow(0 0 40px ${ringColor})`}}
          />
        </svg>
      )}
      {/* impact flashes */}
      {['word1', 'word2', 'word3'].map((k) => {
        const t = f - C[k];
        if (t < 0 || t > 5) return null;
        return <div key={k} style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.1 * (1 - t / 5)}} />;
      })}
    </div>
  );
};
