// Background (night-blue gradient, soft lights, tech grid, particles) + film grain/vignette.
import React from 'react';
import {Img, random, staticFile, useCurrentFrame} from 'remotion';
import {C, H, S, W} from '../timeline';
import {clamp, lerp, mixColor, prog} from '../lib/anim';

const PARTICLES = Array.from({length: 46}, (_, i) => ({
  x: random(`px${i}`) * W,
  y: random(`py${i}`) * H,
  r: 1 + random(`pr${i}`) * 2.2,
  sp: 0.25 + random(`ps${i}`) * 0.9,
  ph: random(`pp${i}`) * Math.PI * 2,
}));

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const on = prog(f, C.ringMorph - 4, 18);
  // scene tint for the main glow
  const greenMix = prog(f, C.dropHit - 6, 12) * (1 - prog(f, S.chat + 4, 16));
  const glowColor = mixColor('#1E6BFF', '#2BD17E', greenMix * 0.75);
  const gy = lerp(980, 900, Math.sin(f / 70) * 0.5 + 0.5);
  const gridShift = (f * 0.6) % 72;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0B1E3F 0%, #081530 45%, #050B18 100%)'}} />
      <div
        style={{
          position: 'absolute',
          left: -300,
          top: gy - 900,
          width: W + 600,
          height: 1800,
          background: `radial-gradient(closest-side, ${glowColor}55, ${glowColor}1c 50%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 600 + Math.sin(f / 60) * 80,
          top: 120,
          width: 900,
          height: 700,
          background: 'radial-gradient(closest-side, rgba(79,141,255,0.16), transparent)',
        }}
      />
      {/* tech grid */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="grid" width={72} height={72} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${gridShift})`}>
            <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(110,160,255,0.11)" strokeWidth={1} />
          </pattern>
          <radialGradient id="gridMask" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="gm">
            <rect width={W} height={H} fill="url(#gridMask)" />
          </mask>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" mask="url(#gm)" />
        {PARTICLES.map((p, i) => {
          const y = (((p.y - f * p.sp * 1.4) % H) + H) % H;
          const tw = 0.25 + 0.35 * (Math.sin(f / 9 + p.ph) * 0.5 + 0.5);
          return <circle key={i} cx={p.x + Math.sin(f / 40 + p.ph) * 12} cy={y} r={p.r} fill="#9cc2ff" opacity={tw} />;
        })}
      </svg>
    </div>
  );
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const idx = f % 8;
  const ox = Math.floor(random(`gx${f}`) * 256);
  const oy = Math.floor(random(`gy${f}`) * 256);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 75% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', mixBlendMode: 'overlay', opacity: 0.16}}>
        <div style={{position: 'absolute', left: -ox, top: -oy, width: W + 512, height: H + 512, display: 'flex', flexWrap: 'wrap'}}>
          {Array.from({length: Math.ceil((W + 512) / 512) * Math.ceil((H + 512) / 512)}).map((_, i) => (
            <Img key={i} src={staticFile(`grain/g${idx}.png`)} style={{width: 512, height: 512, display: 'block'}} />
          ))}
        </div>
      </div>
    </>
  );
};

export const fadeBlack = (f: number) => clamp(1 - f / 2);
