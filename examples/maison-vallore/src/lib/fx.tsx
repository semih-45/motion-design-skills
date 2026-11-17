import React, {createContext, useContext} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, H, LEAD, W} from '../theme';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Clamped interpolate with optional easing. */
export const lerp = (
  f: number,
  input: number[],
  output: number[],
  easing: (t: number) => number = EASE,
) => interpolate(f, input, output, {...clamp, easing});

/** Damped spring-like progress (no overshoot) between two frames. */
export const prog = (f: number, a: number, b: number, easing = EASE) => lerp(f, [a, b], [0, 1], easing);

/** Overshooting "pop" curve for UI elements (0 → 1.06 → 1). */
export const pop = (f: number, start: number, dur = 12) => {
  const t = Math.max(0, Math.min(1, (f - start) / dur));
  if (t <= 0) return 0;
  // damped oscillation
  return 1 - Math.exp(-6 * t) * Math.cos(7 * t) * (1 - t * 0.2);
};

/* ------------------------------------------------------------------ */
/* Scene-local time                                                    */
/* ------------------------------------------------------------------ */

type SceneInfo = {lead: number; length: number; hasIn: boolean; hasOut: boolean};
export const SceneCtx = createContext<SceneInfo>({lead: 0, length: 60, hasIn: false, hasOut: false});

/** Frame relative to the scene's nominal start (negative during the incoming transition). */
export const useLocal = () => {
  const f = useCurrentFrame();
  const {lead} = useContext(SceneCtx);
  return f - lead;
};

/* ------------------------------------------------------------------ */
/* Virtual camera (3D tilt + focus-point dolly)                         */
/* ------------------------------------------------------------------ */

export type CamKey = {
  f: number;
  /** focus point in content coordinates (brought to screen centre) */
  x?: number;
  y?: number;
  s?: number;
  rx?: number;
  ry?: number;
  rz?: number;
};

const camVal = (frame: number, keys: CamKey[], k: keyof CamKey, def: number) => {
  if (keys.length === 1) return (keys[0][k] as number | undefined) ?? def;
  const fs = keys.map((q) => q.f);
  const vs = keys.map((q) => (q[k] as number | undefined) ?? def);
  return interpolate(frame, fs, vs, {...clamp, easing: EASE});
};

export const Camera: React.FC<{
  keys: CamKey[];
  frame: number;
  width?: number;
  height?: number;
  perspective?: number;
  children: React.ReactNode;
}> = ({keys, frame, width = W, height = H, perspective = 2400, children}) => {
  const x = camVal(frame, keys, 'x', width / 2);
  const y = camVal(frame, keys, 'y', height / 2);
  const s = camVal(frame, keys, 's', 1);
  const rx = camVal(frame, keys, 'rx', 0);
  const ry = camVal(frame, keys, 'ry', 0);
  const rz = camVal(frame, keys, 'rz', 0);
  return (
    <AbsoluteFill style={{perspective, perspectiveOrigin: '50% 50%', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: (W - width) / 2,
          top: (H - height) / 2,
          width,
          height,
          transformOrigin: `${x}px ${y}px`,
          transform: `translate(${width / 2 - x}px, ${height / 2 - y}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Lens: depth of field, vignette, grain                               */
/* ------------------------------------------------------------------ */

export const DepthOfField: React.FC<{blur?: number; inner?: number}> = ({blur = 9, inner = 38}) => (
  <AbsoluteFill
    style={{
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      maskImage: `radial-gradient(ellipse 72% 58% at 50% 50%, transparent ${inner}%, black 100%)`,
      WebkitMaskImage: `radial-gradient(ellipse 72% 58% at 50% 50%, transparent ${inner}%, black 100%)`,
      pointerEvents: 'none',
    }}
  />
);

export const Vignette: React.FC<{strength?: number; light?: boolean}> = ({strength = 0.75, light}) => (
  <AbsoluteFill
    style={{
      background: light
        ? `radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,32,24,${strength * 0.32}) 100%)`
        : `radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.06}) => {
  const f = useCurrentFrame();
  const dx = Math.floor(random(`gx${f}`) * 200);
  const dy = Math.floor(random(`gy${f}`) * 200);
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none', overflow: 'hidden'}}>
      <svg width={W + 200} height={H + 200} style={{position: 'absolute', left: -dx, top: -dy}}>
        <filter id="grainF">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainF)" />
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Chromatic aberration (cyan / red split) as an SVG filter            */
/* ------------------------------------------------------------------ */

export const ChromaFilter: React.FC<{id: string; amount: number}> = ({id, amount}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={amount} dy={amount * 0.25} result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
        <feOffset in="gb" dx={-amount} dy={-amount * 0.25} result="gb2" />
        <feBlend in="r2" in2="gb2" mode="screen" />
      </filter>
    </defs>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Scene shell: zoom-through transition + motion blur + CA + lens       */
/* ------------------------------------------------------------------ */

export const SceneShell: React.FC<{
  id: string;
  bg: string;
  lens?: 'dark' | 'light' | 'none';
  dof?: number;
  children: React.ReactNode;
}> = ({id, bg, lens = 'dark', dof = 9, children}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {lead, hasIn, hasOut} = useContext(SceneCtx);
  const end = durationInFrames; // sequence-local

  // Incoming: 0 → 1 across the 2*lead overlap
  const pin = hasIn ? interpolate(f, [0, lead * 2], [0, 1], {...clamp, easing: EASE}) : 1;
  // Outgoing: 0 → 1 across the last 2*lead frames
  const pout = hasOut ? interpolate(f, [end - LEAD * 2, end], [0, 1], {...clamp, easing: EASE}) : 0;

  const scale = interpolate(pin, [0, 1], [0.62, 1]) * interpolate(pout, [0, 1], [1, 2.6]);
  const opacity = interpolate(pin, [0, 0.55], [0, 1], clamp);
  // motion intensity peaks at mid-transition
  const intensity = Math.max(Math.sin(Math.PI * (1 - pin)) * (pin < 1 ? 1 : 0), Math.sin(Math.PI * pout));
  const blur = intensity * 14;
  const ca = intensity * 26;
  const filterId = `ca-${id}`;
  const ghosts = intensity > 0.08 ? [1.045, 1.09] : [];
  const filter = intensity > 0.02 ? `url(#${filterId}) blur(${blur.toFixed(2)}px)` : undefined;

  return (
    <AbsoluteFill style={{opacity}}>
      <ChromaFilter id={filterId} amount={ca} />
      <AbsoluteFill style={{backgroundColor: bg, filter, overflow: 'hidden'}}>
        <AbsoluteFill style={{transform: `scale(${scale})`}}>{children}</AbsoluteFill>
        {/* radial zoom blur: two faint scaled echoes of the frame */}
        {ghosts.map((g, i) => (
          <AbsoluteFill
            key={g}
            style={{transform: `scale(${scale * (1 + (g - 1) * intensity)})`, opacity: (0.32 - i * 0.12) * intensity}}
          >
            {children}
          </AbsoluteFill>
        ))}
        {lens !== 'none' && dof > 0 ? <DepthOfField blur={dof} /> : null}
        {lens !== 'none' ? <Vignette light={lens === 'light'} strength={lens === 'light' ? 0.6 : 0.8} /> : null}
        <Grain opacity={lens === 'light' ? 0.04 : 0.07} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Touch cursor                                                        */
/* ------------------------------------------------------------------ */

/** Semi-transparent white touch indicator. `at` = frame of the press. */
export const Tap: React.FC<{x: number; y: number; at: number; frame: number; size?: number; double?: number}> = ({
  x,
  y,
  at,
  frame,
  size = 92,
  double,
}) => {
  const presses = double ? [at, at + double] : [at];
  const first = presses[0];
  const last = presses[presses.length - 1];
  const appear = interpolate(frame, [first - 10, first - 3], [0, 1], clamp);
  const leave = interpolate(frame, [last + 8, last + 16], [1, 0], clamp);
  const o = appear * leave;
  if (o <= 0) return null;
  let press = 0;
  for (const p of presses) {
    press = Math.max(press, interpolate(frame, [p - 3, p, p + 5], [0, 1, 0], clamp));
  }
  const drift = interpolate(frame, [first - 10, first], [26, 0], {...clamp, easing: EASE});
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none', zIndex: 50}}>
      {presses.map((p) => {
        const r = interpolate(frame, [p, p + 14], [0, 1], clamp);
        if (frame < p || r >= 1) return null;
        return (
          <div
            key={p}
            style={{
              position: 'absolute',
              left: -size,
              top: -size,
              width: size * 2,
              height: size * 2,
              borderRadius: '50%',
              border: `${4 * (1 - r)}px solid rgba(255,255,255,${0.9 * (1 - r)})`,
              transform: `scale(${0.4 + r * 0.9})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.42)',
          border: '3px solid rgba(255,255,255,0.85)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.35), inset 0 0 18px rgba(255,255,255,0.4)',
          opacity: o,
          transform: `translate(${drift}px, ${drift * 1.2}px) scale(${1 - press * 0.22})`,
        }}
      />
    </div>
  );
};

export const paperBg = C.paper;
