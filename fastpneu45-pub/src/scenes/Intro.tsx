import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BRAND, HEIGHT, PHOTOS, WIDTH} from '../config';
import {DeepBackground, LightRays, Lightning, MetalText, Particles, Vignette, expoOut, prog} from '../components/fx';
import {ThreeDTire} from '../components/ThreeDTire';

const SLAM = 66; // image où le logo percute l'écran

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const light = prog(frame, 6, 46, Easing.inOut(Easing.quad));
  const back = prog(frame, SLAM - 2, SLAM + 14, expoOut);
  const orbit = interpolate(frame, [0, 75, 120], [-66, -24, -12], {easing: Easing.out(Easing.quad)});
  const spin = 0.02 * frame + 0.0016 * frame * frame;
  const slam = prog(frame, SLAM, SLAM + 11, expoOut);
  const shake = frame >= SLAM && frame < SLAM + 9 ? (9 - (frame - SLAM)) * 2.2 : 0;
  const sx = Math.sin(frame * 12.9) * shake, sy = Math.cos(frame * 17.3) * shake;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: light, transform: `translate(${sx}px, ${sy}px)`}}>
        <DeepBackground glowY={42} glow={0.42} />
        <LightRays opacity={0.8 * light} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) translateY(${-110 - back * 40}px)`, opacity: 1 - back * 0.62, filter: back > 0.02 ? `blur(${back * 7}px)` : undefined}}>
        <ThreeDTire width={WIDTH} height={HEIGHT} view={{orbit, height: 0.7 - back * 0.2, distance: 9.0 - light * 3.7 + back * 2.2, spin, light: 0.04 + light * 0.96}} />
      </AbsoluteFill>
      <Particles count={70} seed="intro" opacity={light} />
      <Lightning at={38} seed="a" x0={880} y0={-20} x1={600} y1={900} />
      <Lightning at={SLAM - 3} seed="b" x0={180} y0={-20} x1={520} y1={820} width={9} />
      <Vignette />
      {/* LOGO */}
      {frame >= SLAM ? (
        <AbsoluteFill style={{alignItems: 'center', transform: `translate(${sx}px, ${sy}px)`}}>
          <Img src={staticFile(PHOTOS.logo.src)} style={{
            position: 'absolute', top: 330, width: 1150,
            transform: `scale(${interpolate(slam, [0, 1], [2.6, 1])})`, opacity: Math.min(1, slam * 3),
            filter: `brightness(${1.15 + (1 - slam) * 1.5}) contrast(1.1) drop-shadow(0 0 40px rgba(8,123,255,0.6))`,
          }} />
        </AbsoluteFill>
      ) : null}
      {/* SLOGAN */}
      <AbsoluteFill style={{alignItems: 'center'}}>
        {BRAND.slogan.map((line, i) => {
          const at = 84 + i * 7;
          const p = prog(frame, at, at + 12, expoOut);
          return (
            <div key={i} style={{position: 'absolute', top: 1090 + i * 112, clipPath: `inset(-20% ${(1 - p) * 100}% -30% -5%)`, transform: `translateX(${(1 - p) * -90}px) skewX(${(1 - p) * -14}deg)`}}>
              <MetalText size={104} blue={i === 1} shineAt={at + 8} depth={6}>{line}</MetalText>
            </div>
          );
        })}
      </AbsoluteFill>
      {frame >= SLAM && frame < SLAM + 7 ? <AbsoluteFill style={{background: `rgba(200,235,255,${(1 - (frame - SLAM) / 7) * 0.85})`}} /> : null}
    </AbsoluteFill>
  );
};
