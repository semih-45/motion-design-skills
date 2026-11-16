import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {COLORS, FONT_TITRE, HEIGHT, WIDTH} from '../config';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const expoOut = Easing.out(Easing.exp);
export const cubicOut = Easing.out(Easing.cubic);
export const power4InOut = Easing.inOut(Easing.poly(4));
/** progression 0→1 entre deux images, avec easing */
export const prog = (frame: number, from: number, to: number, easing: (n: number) => number = cubicOut) =>
  interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Particules bleues flottantes (déterministes). */
export const Particles: React.FC<{count?: number; seed?: string; opacity?: number; speed?: number; rise?: boolean}> = ({
  count = 60, seed = 'p', opacity = 1, speed = 1, rise = true,
}) => {
  const frame = useCurrentFrame();
  const parts = useMemo(
    () => new Array(count).fill(0).map((_, i) => ({
      x: random(seed + 'x' + i) * WIDTH,
      y: random(seed + 'y' + i) * HEIGHT,
      z: 0.25 + random(seed + 'z' + i) * 0.75,
      ph: random(seed + 'p' + i) * Math.PI * 2,
      hue: random(seed + 'h' + i),
    })),
    [count, seed],
  );
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {parts.map((p, i) => {
        const t = frame * speed;
        const y = (((p.y - (rise ? t * 2.2 * p.z : 0)) % HEIGHT) + HEIGHT) % HEIGHT;
        const x = p.x + Math.sin(t / 28 + p.ph) * 26 * p.z;
        const size = 3 + p.z * 7;
        const tw = 0.45 + 0.55 * Math.sin(t / 9 + p.ph * 3);
        const c = p.hue > 0.75 ? '#DDF1FF' : p.hue > 0.35 ? COLORS.neon : COLORS.bleu;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
            background: c, opacity: tw * p.z, boxShadow: `0 0 ${size * 2.4}px ${size * 0.6}px ${c}`,
            filter: p.z < 0.45 ? 'blur(2px)' : undefined,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Éclair procédural (SVG) déclenché à `at`, visible ~10 images. */
export const Lightning: React.FC<{at: number; seed: string; x0: number; y0: number; x1: number; y1: number; width?: number}> = ({
  at, seed, x0, y0, x1, y1, width = 7,
}) => {
  const frame = useCurrentFrame();
  const local = frame - at;
  const path = useMemo(() => {
    const build = (ax: number, ay: number, bx: number, by: number, n: number, amp: number, s: string) => {
      let d = `M ${ax} ${ay}`;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const jx = i === n ? 0 : (random(s + 'x' + i) - 0.5) * amp;
        const jy = i === n ? 0 : (random(s + 'y' + i) - 0.5) * amp * 0.4;
        d += ` L ${lerp(ax, bx, t) + jx} ${lerp(ay, by, t) + jy}`;
      }
      return d;
    };
    const main = build(x0, y0, x1, y1, 11, 150, seed);
    const mx = lerp(x0, x1, 0.45), my = lerp(y0, y1, 0.45);
    const branch = build(mx, my, mx + (random(seed + 'b') - 0.5) * 500, my + 330, 6, 100, seed + 'br');
    return {main, branch};
  }, [seed, x0, y0, x1, y1]);
  if (local < 0 || local > 11) return null;
  const flicker = [1, 0.25, 1, 0.8, 0.15, 0.7, 0.5, 0.3, 0.2, 0.12, 0.06, 0.02][local];
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${(x1 / WIDTH) * 100}% ${(y1 / HEIGHT) * 100}%, rgba(0,168,255,${0.55 * flicker}), transparent 65%)`}} />
      <svg width={WIDTH} height={HEIGHT} style={{opacity: flicker}}>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={path.main} stroke={COLORS.bleu} strokeWidth={width * 5} opacity={0.5} style={{filter: 'blur(18px)'}} />
          <path d={path.main} stroke={COLORS.neon} strokeWidth={width * 1.8} style={{filter: 'blur(4px)'}} />
          <path d={path.main} stroke="#fff" strokeWidth={width * 0.6} />
          <path d={path.branch} stroke={COLORS.neon} strokeWidth={width} style={{filter: 'blur(3px)'}} />
          <path d={path.branch} stroke="#fff" strokeWidth={width * 0.3} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Faisceaux de lumière volumétrique. */
export const LightRays: React.FC<{opacity?: number; originX?: number; originY?: number}> = ({opacity = 1, originX = 50, originY = -8}) => {
  const frame = useCurrentFrame();
  const rot = Math.sin(frame / 50) * 6;
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none', filter: 'blur(22px)'}}>
      <div style={{
        position: 'absolute', inset: '-30%',
        background: `repeating-conic-gradient(from ${150 + rot}deg at ${originX}% ${originY + 22}%, rgba(8,123,255,0) 0deg, rgba(0,168,255,0.34) 4deg, rgba(8,123,255,0) 9deg, rgba(8,123,255,0) 15deg)`,
        maskImage: `radial-gradient(ellipse 60% 75% at ${originX}% ${originY + 22}%, #000 5%, transparent 75%)`,
        WebkitMaskImage: `radial-gradient(ellipse 60% 75% at ${originX}% ${originY + 22}%, #000 5%, transparent 75%)`,
      }} />
    </AbsoluteFill>
  );
};

/** Traits de vitesse horizontaux. */
export const SpeedLines: React.FC<{opacity?: number; seed?: string; count?: number}> = ({opacity = 1, seed = 's', count = 16}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const y = random(seed + 'y' + i) * HEIGHT;
        const len = 180 + random(seed + 'l' + i) * 520;
        const sp = 70 + random(seed + 'v' + i) * 90;
        const x = ((random(seed + 'x' + i) * 2200 + frame * sp) % (WIDTH + len * 2)) - len;
        const h = 2 + random(seed + 'h' + i) * 4;
        return <div key={i} style={{
          position: 'absolute', top: y, left: x, width: len, height: h, borderRadius: h,
          background: `linear-gradient(90deg, transparent, ${i % 3 ? COLORS.neon : '#fff'})`, opacity: 0.25 + random(seed + 'o' + i) * 0.5,
        }} />;
      })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.8}) => (
  <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse 75% 62% at 50% 46%, transparent 45%, rgba(3,5,9,${strength}) 100%)`}} />
);

/** Fond noir profond avec halo bleu. */
export const DeepBackground: React.FC<{glowY?: number; glow?: number}> = ({glowY = 40, glow = 0.35}) => (
  <AbsoluteFill style={{background: COLORS.noir}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 48% at 50% ${glowY}%, rgba(8,123,255,${glow}), transparent 70%)`}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 108%, rgba(0,168,255,0.22), transparent 70%)'}} />
  </AbsoluteFill>
);

/** Titre massif métallique avec extrusion 3D + reflet animé. */
export const MetalText: React.FC<{
  children: string; size: number; blue?: boolean; italic?: boolean; shineAt?: number; depth?: number; letterSpacing?: number; style?: React.CSSProperties;
}> = ({children, size, blue = false, italic = true, shineAt, depth = 8, letterSpacing = 0, style}) => {
  const frame = useCurrentFrame();
  const base: React.CSSProperties = {
    fontFamily: FONT_TITRE, fontWeight: 900, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 0.95,
    letterSpacing, whiteSpace: 'nowrap', textTransform: 'uppercase', padding: '0 0.12em',
  };
  const extr = new Array(depth).fill(0).map((_, i) => `${i + 1}px ${i + 1}px 0 ${blue ? '#02245a' : '#0a2c66'}`).join(', ');
  const grad = blue
    ? 'linear-gradient(180deg, #7fd0ff 0%, #1c8dff 38%, #0a56d6 52%, #0a6cff 60%, #58c1ff 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f1f5fa 40%, #8b97a8 54%, #cdd6e2 62%, #ffffff 100%)';
  const shine = shineAt === undefined ? -1 : prog(frame, shineAt, shineAt + 22, Easing.inOut(Easing.quad));
  return (
    <div style={{position: 'relative', display: 'inline-block', ...style}}>
      <div style={{...base, color: blue ? '#02245a' : '#0a2c66', textShadow: `${extr}, ${depth + 6}px ${depth + 10}px 22px rgba(0,0,0,0.75), 0 0 46px rgba(8,123,255,0.55)`}}>{children}</div>
      <div style={{...base, position: 'absolute', inset: 0, backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{children}</div>
      {shine > 0 && shine < 1 ? (
        <div style={{
          ...base, position: 'absolute', inset: 0, color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text',
          backgroundImage: `linear-gradient(105deg, transparent ${shine * 140 - 30}%, rgba(255,255,255,0.95) ${shine * 140 - 15}%, transparent ${shine * 140}%)`,
        }}>{children}</div>
      ) : null}
    </div>
  );
};

/** Transition « volets mécaniques » bleus, centrée sur un point de coupe. */
export const CutTransition: React.FC<{at: number; variant?: number}> = ({at, variant = 0}) => {
  const frame = useCurrentFrame();
  const local = frame - at;
  const IN = 7, OUT = 9;
  if (local < -IN || local > OUT) return null;
  const bars = 6;
  const dir = variant % 2 ? -1 : 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', transform: `skewX(${-14 * dir}deg) scaleX(1.5)`}}>
      {new Array(bars).fill(0).map((_, i) => {
        const delay = (dir > 0 ? i : bars - 1 - i) * 0.7;
        const cover = local < 0
          ? prog(local, -IN + delay * 0.5, 0, Easing.in(Easing.cubic))
          : 1 - prog(local, delay * 0.5, OUT - 2 + delay * 0.4, Easing.out(Easing.cubic));
        const fromLeft = local < 0 ? dir > 0 : dir < 0;
        return (
          <div key={i} style={{
            position: 'absolute', top: `${(i * 100) / bars}%`, height: `${100 / bars + 0.3}%`, width: `${cover * 100}%`,
            left: fromLeft ? 0 : undefined, right: fromLeft ? undefined : 0,
            background: i % 2 ? `linear-gradient(90deg, #031a3d, ${COLORS.bleu})` : `linear-gradient(90deg, ${COLORS.noir}, #06224f)`,
            boxShadow: `0 0 40px ${COLORS.neon}`,
            borderRight: fromLeft ? `6px solid ${COLORS.neon}` : undefined, borderLeft: fromLeft ? undefined : `6px solid ${COLORS.neon}`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};
