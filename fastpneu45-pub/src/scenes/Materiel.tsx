import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {COLORS, FONT_TITRE, SCENES, SHOTS_MATERIEL, Shot, f} from '../config';
import {AnimatedPhoto} from '../components/AnimatedPhoto';
import {MetalText, Particles, expoOut, prog} from '../components/fx';

const OVERLAP = 9; // images pendant lesquelles un plan reste sous le suivant

const ShotTitle: React.FC<{shot: Shot; duration: number}> = ({shot, duration}) => {
  const frame = useCurrentFrame();
  if (!shot.title) return null;
  const out = prog(frame, duration - 5, duration, (n) => n * n);
  const longest = Math.max(...shot.title.map((l) => l.length));
  const size = Math.min(132, Math.floor(960 / (longest * 0.47)));
  const pk = prog(frame, 2, 11, expoOut);
  return (
    <div style={{position: 'absolute', left: 62, top: 1085, opacity: 1 - out, transform: `translateX(${out * -80}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: pk, transform: `translateX(${(1 - pk) * -50}px)`, marginBottom: 10}}>
        <div style={{width: 64 * pk, height: 8, background: COLORS.neon, boxShadow: `0 0 18px ${COLORS.neon}`, transform: 'skewX(-20deg)'}} />
        <div style={{fontFamily: FONT_TITRE, fontWeight: 800, fontStyle: 'italic', fontSize: 46, color: COLORS.neon, letterSpacing: 3, textShadow: '0 2px 10px #000'}}>{shot.kicker}</div>
      </div>
      {shot.title.map((line, i) => {
        const at = 3 + i * 3;
        const p = prog(frame, at, at + 10, expoOut);
        return (
          <div key={i} style={{clipPath: `inset(-20% ${(1 - p) * 100}% -30% -5%)`, transform: `translateX(${(1 - p) * -70}px) skewX(${(1 - p) * -12}deg)`, marginBottom: 6}}>
            <MetalText size={size} blue={i === 1} depth={6} shineAt={at + 6}>{line}</MetalText>
          </div>
        );
      })}
    </div>
  );
};

/** Cadre technique discret (HUD) commun à la scène. */
const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const corner = (s: React.CSSProperties) => <div style={{position: 'absolute', width: 70, height: 70, borderColor: 'rgba(255,255,255,0.75)', borderStyle: 'solid', borderWidth: 0, ...s}} />;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: prog(frame, 4, 14)}}>
      {corner({left: 40, top: 150, borderLeftWidth: 4, borderTopWidth: 4})}
      {corner({right: 40, top: 150, borderRightWidth: 4, borderTopWidth: 4})}
      <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', fontFamily: FONT_TITRE, fontWeight: 700, fontSize: 34, letterSpacing: 8, color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 12px #000'}}>
        FASTPNEU45 <span style={{color: COLORS.neon}}>//</span> ATELIER MOBILE
      </div>
    </AbsoluteFill>
  );
};

export const Materiel: React.FC = () => {
  const s0 = SCENES.materiel.start;
  return (
    <AbsoluteFill style={{background: COLORS.noir}}>
      {SHOTS_MATERIEL.map((shot, i) => {
        const dur = f(shot.end) - f(shot.start);
        const last = i === SHOTS_MATERIEL.length - 1;
        return (
          <Sequence key={i} from={f(shot.start) - f(s0)} durationInFrames={dur + (last ? 0 : OVERLAP)}>
            <AnimatedPhoto photo={shot.photo} durationInFrames={dur} from={shot.from} to={shot.to} reveal={shot.reveal}
              subject={shot.subject} sweep={shot.sweep} rackFocus={shot.rackFocus} speedLines={shot.speedLines} callout={shot.callout} />
          </Sequence>
        );
      })}
      <Particles count={26} seed="mat" opacity={0.7} />
      {SHOTS_MATERIEL.map((shot, i) => {
        const dur = f(shot.end) - f(shot.start);
        return (
          <Sequence key={i} from={f(shot.start) - f(s0)} durationInFrames={dur}>
            <ShotTitle shot={shot} duration={dur} />
          </Sequence>
        );
      })}
      <Hud />
    </AbsoluteFill>
  );
};
