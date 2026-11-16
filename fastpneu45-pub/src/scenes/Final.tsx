import React from 'react';
import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BRAND, COLORS, FINAL, FONT_TITRE, HEIGHT, PHOTOS, WIDTH, f} from '../config';
import {AnimatedPhoto} from '../components/AnimatedPhoto';
import {QRCode} from '../components/QRCode';
import {ThreeDTire} from '../components/ThreeDTire';
import {DeepBackground, LightRays, Lightning, MetalText, Particles, Vignette, expoOut, prog} from '../components/fx';

const Stamp: React.FC<{text: string; at: number; top: number; blue?: boolean}> = ({text, at, top, blue}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = prog(frame, at, at + 8, expoOut);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${3 - 2 * p}) rotate(${-5 + (1 - p) * -8}deg)`, opacity: Math.min(1, p * 2)}}>
      <MetalText size={250} blue={blue} depth={11}>{text}</MetalText>
    </div>
  );
};

/** 1er temps : « jour et nuit » sur deux photos réelles de nuit. */
const NightBeat: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const cut = f(FINAL.stamps[1].at);
  return (
    <AbsoluteFill style={{background: COLORS.noir}}>
      <Sequence durationInFrames={cut + 9}>
        <AnimatedPhoto photo={PHOTOS.jantes} durationInFrames={cut} from={{x: 0.5, y: 0.3, scale: 1.5, rotY: 8}} to={{x: 0.48, y: 0.5, scale: 1.12, rotY: -3}}
          reveal="flash" subject={{x: 0.42, y: 0.62, rx: 0.42, ry: 0.14}} sweep dim={0.12} />
      </Sequence>
      <Sequence from={cut} durationInFrames={duration - cut}>
        <AnimatedPhoto photo={PHOTOS.nuit} durationInFrames={duration - cut} from={{x: 0.55, y: 0.5, scale: 1.0, rotX: 4}} to={{x: 0.3, y: 0.2, scale: 1.6, rotX: 0, rotY: 5}}
          reveal="wipe" subject={{x: 0.27, y: 0.2, rx: 0.2, ry: 0.13}} rackFocus dim={0.05} />
      </Sequence>
      <Particles count={30} seed="night" />
      <Stamp text={FINAL.stamps[0].text} at={f(FINAL.stamps[0].at)} top={760} />
      <Stamp text={FINAL.stamps[1].text} at={cut + 1} top={1010} blue />
      <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', opacity: prog(frame, 4, 14), fontFamily: FONT_TITRE, fontWeight: 800, fontStyle: 'italic', fontSize: 58, letterSpacing: 6, color: '#fff', textShadow: `0 0 26px ${COLORS.bleu}, 0 3px 12px #000`}}>
        DE JOUR <span style={{color: COLORS.neon}}>COMME DE NUIT</span>
      </div>
    </AbsoluteFill>
  );
};

const Line: React.FC<{at: number; top: number; children: React.ReactNode; from?: 'left' | 'right' | 'scale'}> = ({at, top, children, from = 'left'}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 13, expoOut);
  const tr = from === 'scale' ? `scale(${1.5 - 0.5 * p})` : `translateX(${(1 - p) * (from === 'left' ? -160 : 160)}px) skewX(${(1 - p) * (from === 'left' ? -12 : 12)}deg)`;
  return <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.5), transform: tr}}>{children}</div>;
};

/** 2e temps : écran final (coordonnées, QR code). */
const EndCard: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const slam = prog(frame, 0, 12, expoOut);
  const FLARE = duration - 27; // impact final
  const flare = frame >= FLARE ? interpolate(frame, [FLARE, FLARE + 3, FLARE + 16], [0, 1, 0], {extrapolateRight: 'clamp'}) : 0;
  const breathe = 1 + Math.sin(frame / 22) * 0.008;
  const pulse = prog(frame, 136, 150) * (1 - prog(frame, 150, 170)); // « FASTPNEU45 » prononcé
  const qr = prog(frame, 62, 80, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{background: COLORS.noir}}>
      <DeepBackground glowY={24} glow={0.4 + flare * 0.4 + pulse * 0.15} />
      <LightRays opacity={0.6} originY={-14} />
      <AbsoluteFill style={{opacity: 0.42 + flare * 0.3, filter: 'blur(3px)', transform: 'translateY(-500px)'}}>
        <ThreeDTire width={WIDTH} height={HEIGHT} view={{orbit: 22 + Math.sin(frame / 60) * 10, height: 0.2, distance: 6.6 - slam * 0.8, spin: frame * 0.085, light: 1}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,7,11,0.25) 0%, rgba(5,7,11,0.1) 30%, rgba(5,7,11,0.92) 46%, rgba(5,7,11,0.96) 100%)'}} />
      <Particles count={55} seed="end" />
      <Vignette strength={0.7} />
      {/* LOGO */}
      <AbsoluteFill style={{alignItems: 'center'}}>
        <Img src={staticFile(PHOTOS.logo.src)} style={{
          position: 'absolute', top: 96, width: 1130, opacity: Math.min(1, slam * 2.5),
          transform: `scale(${(2.3 - 1.3 * slam) * breathe * (1 + pulse * 0.05 + flare * 0.03)})`,
          filter: `brightness(${1.15 + (1 - slam) * 1.3 + pulse * 0.35 + flare * 0.6}) contrast(1.1) drop-shadow(0 0 ${36 + pulse * 40 + flare * 60}px rgba(8,123,255,0.75))`,
        }} />
      </AbsoluteFill>
      {/* DEVIS GRATUIT */}
      <Line at={9} top={742} from="scale">
        <div style={{transform: 'skewX(-10deg)', background: `linear-gradient(180deg, ${COLORS.neon}, ${COLORS.bleu} 60%, #0652c9)`, border: '4px solid #fff', borderRadius: 14, padding: '2px 46px 12px', boxShadow: `0 0 60px ${COLORS.bleu}, 0 14px 30px rgba(0,0,0,0.6)`}}>
          <div style={{fontFamily: FONT_TITRE, fontWeight: 900, fontStyle: 'italic', fontSize: 124, lineHeight: 1, color: '#fff', letterSpacing: 2, textShadow: '4px 5px 0 rgba(0,30,95,0.85)'}}>{BRAND.devis}</div>
        </div>
      </Line>
      <Line at={24} top={908} from="right">
        <div style={{fontFamily: FONT_TITRE, fontWeight: 800, fontStyle: 'italic', fontSize: 66, color: '#fff', letterSpacing: 3, textShadow: `0 0 24px ${COLORS.bleu}`, whiteSpace: 'nowrap'}}>
          DISPONIBLE <span style={{color: COLORS.neon}}>7J/7 — 24H/24</span>
        </div>
      </Line>
      {/* TÉLÉPHONE */}
      <Line at={38} top={992} from="left">
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{width: 104, height: 104, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 34px rgba(34,197,94,0.7)', transform: `rotate(${Math.sin(frame / 1.6) * (frame % 45 < 14 ? 9 : 0)}deg)`}}>
            <svg width="58" height="58" viewBox="0 0 24 24"><path fill="#fff" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>
          </div>
          <MetalText size={150} depth={7} shineAt={52} italic>{BRAND.telephone}</MetalText>
        </div>
      </Line>
      {/* QR + SITE + SNAPCHAT */}
      <div style={{position: 'absolute', top: 1160, left: 70, right: 70, display: 'flex', alignItems: 'center', gap: 40, opacity: prog(frame, 60, 70), transform: `translateY(${(1 - prog(frame, 60, 74, expoOut)) * 70}px)`}}>
        <div style={{padding: 10, borderRadius: 26, background: `linear-gradient(135deg, ${COLORS.neon}, ${COLORS.bleu})`, boxShadow: `0 0 50px rgba(8,123,255,0.8)`, flexShrink: 0}}>
          <QRCode value={BRAND.siteUrl} size={258} reveal={qr} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
          <div style={{fontFamily: FONT_TITRE, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: COLORS.neon}}>◂ SCANNEZ · DEVIS EN LIGNE</div>
          <div style={{fontFamily: FONT_TITRE, fontWeight: 900, fontStyle: 'italic', fontSize: 98, lineHeight: 0.95, color: '#fff', textShadow: `0 0 30px ${COLORS.bleu}`}}>{BRAND.site}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: prog(frame, 74, 84), marginTop: 4}}>
            <div style={{width: 58, height: 58, borderRadius: 15, background: '#FFE100', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg width="38" height="38" viewBox="0 0 24 24"><path fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" d="M12 3 C8.5 3 6.5 5.5 6.5 9 V13 L4 15 L6.5 16 L5.5 19 L9 18 L12 20.5 L15 18 L18.5 19 L17.5 16 L20 15 L17.5 13 V9 C17.5 5.5 15.5 3 12 3 Z" /></svg>
            </div>
            <div style={{fontFamily: FONT_TITRE, fontWeight: 800, fontSize: 56, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap'}}>SNAPCHAT : <span style={{color: '#FFE100'}}>{BRAND.snapchat}</span></div>
          </div>
        </div>
      </div>
      {/* impact lumineux final */}
      <Lightning at={FLARE} seed="f1" x0={940} y0={-20} x1={610} y1={470} width={9} />
      <Lightning at={FLARE + 1} seed="f2" x0={120} y0={-20} x1={470} y1={520} width={7} />
      {flare > 0 ? <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 40% at 50% 24%, rgba(170,225,255,${flare * 0.75}), transparent 70%)`, mixBlendMode: 'screen'}} /> : null}
      {frame < 7 ? <AbsoluteFill style={{background: `rgba(200,235,255,${(1 - frame / 7) * 0.8})`}} /> : null}
    </AbsoluteFill>
  );
};

export const Final: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const night = f(FINAL.nuitEnd);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={night}><NightBeat duration={night} /></Sequence>
      <Sequence from={night}><EndCard duration={durationInFrames - night} /></Sequence>
    </AbsoluteFill>
  );
};
