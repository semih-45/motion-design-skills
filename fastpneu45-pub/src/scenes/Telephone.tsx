import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CHAT, COLORS, FONT_TEXTE, FONT_TITRE, PHOTOS, SCENES, f} from '../config';
import {AnimatedPhoto} from '../components/AnimatedPhoto';
import {Phone3D} from '../components/Phone3D';
import {LightRays, Particles, Vignette, prog} from '../components/fx';

export const Telephone: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dur = f(SCENES.telephone.end) - f(SCENES.telephone.start);
  const enter = spring({frame, fps, config: {damping: 17, stiffness: 70, mass: 1}});
  const exit = prog(frame, dur - 9, dur, Easing.in(Easing.cubic));
  const rotY = interpolate(enter, [0, 1], [-115, -16]) + interpolate(frame, [20, dur], [0, 24], {extrapolateLeft: 'clamp'});
  const rotX = interpolate(enter, [0, 1], [26, 7]) - Math.sin(frame / 40) * 1.5;
  // légère secousse à chaque notification reçue
  let buzz = 0;
  CHAT.messages.forEach((m) => { const d = frame - f(m.at); if (m.from === 'fastpneu' && d >= 0 && d < 8) buzz = (8 - d) / 8; });
  const head = prog(frame, 6, 18);
  return (
    <AbsoluteFill style={{background: COLORS.noir}}>
      {/* la vraie intervention sur une Clio 3, en arrière-plan flou */}
      <AnimatedPhoto photo={PHOTOS.clio3} durationInFrames={dur} from={{x: 0.62, y: 0.52, scale: 1.25}} to={{x: 0.5, y: 0.5, scale: 1.05}} reveal="flash" dim={0.5} blur={9} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(8,123,255,0.28), rgba(5,7,11,0.55) 75%)'}} />
      <LightRays opacity={0.55} />
      <Particles count={45} seed="tel" />
      <Vignette strength={0.9} />
      <div style={{position: 'absolute', top: 96, left: 0, right: 0, textAlign: 'center', opacity: head * (1 - exit), transform: `translateY(${(1 - head) * -30}px)`}}>
        <div style={{fontFamily: FONT_TITRE, fontWeight: 900, fontStyle: 'italic', fontSize: 66, color: '#fff', letterSpacing: 1, textShadow: `0 0 30px ${COLORS.bleu}, 0 4px 14px #000`}}>
          UN MESSAGE <span style={{color: COLORS.neon}}>SUFFIT</span>
        </div>
      </div>
      <AbsoluteFill style={{perspective: 2300, perspectiveOrigin: '50% 45%', alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 152, transformStyle: 'preserve-3d', transform: `translateY(${(1 - enter) * 1300 - exit * 1700}px) translateX(${Math.sin(frame * 2.4) * buzz * 5}px)`}}>
          <Phone3D rotY={rotY} rotX={rotX} rotZ={interpolate(enter, [0, 1], [-14, 0]) + exit * 10} scale={0.95} />
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 1404, left: 0, right: 0, textAlign: 'center', fontFamily: FONT_TEXTE, fontSize: 22, color: 'rgba(255,255,255,0.72)', opacity: head * (1 - exit), textShadow: '0 1px 6px #000'}}>
        {CHAT.disclaimer}
      </div>
    </AbsoluteFill>
  );
};
