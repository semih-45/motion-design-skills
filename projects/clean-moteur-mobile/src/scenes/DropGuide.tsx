// The H2 drop through scene 3: pop-in, dive into the engine, impact, re-emerge toward camera.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, lin, prog, springy} from '../lib/anim';
import {projectAnchor} from '../three/rig';
import {H2Drop} from '../components/H2Drop';

export const DROP_CENTER = {x: 540, y: 930};

export const DropGuide: React.FC = () => {
  const f = useCurrentFrame();
  const els: React.ReactNode[] = [];
  // --- appear + dive ---
  if (f >= C.dropIn && f < C.dropHit) {
    const pop = springy(f, C.dropIn, 2.2, 0.42);
    const dive = prog(f, C.dropIn + 9, C.dropHit - C.dropIn - 9, easeIn);
    const eng = projectAnchor('head', f);
    const sx = 540;
    const sy = 470 + Math.sin((f - C.dropIn) / 4) * 6;
    const x = lerp(sx, eng.x, dive);
    const y = lerp(sy, eng.y, dive) - Math.sin(Math.PI * dive) * 60;
    const size = 190 * clamp(pop, 0, 1.2) * lerp(1, 0.28, dive);
    const ang = (Math.atan2(eng.y - sy, eng.x - sx) * 180) / Math.PI - 90;
    els.push(
      <H2Drop
        key="d1"
        x={x}
        y={y}
        size={size}
        leaf={prog(f, C.dropIn + 3, 8, easeOut)}
        label={1 - dive}
        rotate={ang * dive}
        squash={1 + 0.5 * dive}
        blur={dive * 5}
      />,
    );
  }
  // --- impact shockwave ---
  if (f >= C.dropHit && f < C.dropHit + 18) {
    const eng = projectAnchor('head', C.dropHit);
    const t = lin(f, C.dropHit, 18);
    const r = lerp(10, 330, easeOut(t));
    els.push(
      <svg key="sw" width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={eng.x} cy={eng.y} rx={r} ry={r * 0.55} fill="none" stroke="#2BD17E" strokeWidth={10 * (1 - t)} opacity={1 - t} style={{filter: 'drop-shadow(0 0 12px #2BD17E)'}} />
        <circle cx={eng.x} cy={eng.y} r={70 * (1 - t) + 10} fill="#c9ffe2" opacity={(1 - t) * 0.8} style={{filter: 'blur(14px)'}} />
        {Array.from({length: 10}).map((_, i) => {
          const a = (i / 10) * Math.PI * 2 + 0.3;
          const r0 = r * 0.5;
          const r1 = r * 0.5 + 40 * (1 - t);
          return <line key={i} x1={eng.x + Math.cos(a) * r0} y1={eng.y + Math.sin(a) * r0 * 0.7} x2={eng.x + Math.cos(a) * r1} y2={eng.y + Math.sin(a) * r1 * 0.7} stroke="#8DF5BE" strokeWidth={5} strokeLinecap="round" opacity={1 - t} />;
        })}
      </svg>,
    );
  }
  // --- re-emerge from the engine toward the camera ---
  if (f >= C.dropOut && f < C.dropOut + 12) {
    const p = prog(f, C.dropOut, 12, easeInOut);
    const eng = projectAnchor('head', f);
    const x = lerp(eng.x, DROP_CENTER.x, p);
    const y = lerp(eng.y, DROP_CENTER.y, p) - Math.sin(Math.PI * p) * 120;
    els.push(<H2Drop key="d2" x={x} y={y} size={lerp(50, 380, p)} leaf={p} label={p} blur={Math.sin(Math.PI * p) * 4} />);
  }
  return <>{els}</>;
};
