import React from 'react';
import {Img, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CHAT, COLORS, FONT_TEXTE, FONT_TITRE, PHOTOS, f} from '../config';
import {prog} from './fx';

const PW = 640, PH = 1250, RADIUS = 92, DEPTH = 13;

const Bubble: React.FC<{from: 'client' | 'fastpneu'; text: string; at: number}> = ({from, text, at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 15, stiffness: 190, mass: 0.6}});
  if (frame < at) return null;
  const mine = from === 'client';
  return (
    <div style={{maxHeight: s * 520, opacity: Math.min(1, s * 1.6), display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', flexShrink: 0}}>
      <div style={{
        maxWidth: '86%', margin: '8px 0', padding: '16px 22px', fontFamily: FONT_TEXTE, fontSize: 36, lineHeight: 1.26, fontWeight: 500,
        color: '#fff', borderRadius: 30, borderBottomRightRadius: mine ? 8 : 30, borderBottomLeftRadius: mine ? 30 : 8,
        background: mine ? `linear-gradient(160deg, ${COLORS.neon}, ${COLORS.bleu})` : '#1c2330',
        border: mine ? 'none' : '1.5px solid #2c3647',
        boxShadow: mine ? '0 8px 26px rgba(8,123,255,0.5)' : '0 6px 18px rgba(0,0,0,0.45)',
        transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 30}px)`, transformOrigin: mine ? '100% 100%' : '0% 100%',
      }}>{text}</div>
    </div>
  );
};

const Typing: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{display: 'flex', flexShrink: 0}}>
      <div style={{margin: '9px 0', padding: '20px 24px', borderRadius: 30, borderBottomLeftRadius: 8, background: '#1c2330', display: 'flex', gap: 9}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 13, height: 13, borderRadius: '50%', background: '#8fa3bd', transform: `translateY(${Math.sin((frame - from) / 2.2 - i * 0.9) * 5}px)`}} />
        ))}
      </div>
    </div>
  );
};

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  const msgs = CHAT.messages;
  return (
    <div style={{position: 'absolute', inset: 13, borderRadius: RADIUS - 13, overflow: 'hidden', background: '#070b12', display: 'flex', flexDirection: 'column'}}>
      {/* barre d'état + en-tête */}
      <div style={{padding: '24px 44px 0', display: 'flex', justifyContent: 'space-between', fontFamily: FONT_TEXTE, fontWeight: 600, fontSize: 23, color: '#fff'}}>
        <span>9:41</span><span style={{letterSpacing: 2}}>5G ▮▮▮</span>
      </div>
      <div style={{position: 'absolute', top: 18, left: '50%', marginLeft: -78, width: 156, height: 40, borderRadius: 22, background: '#000'}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '24px 30px 20px', borderBottom: '1.5px solid #18202d', background: 'linear-gradient(180deg,#0c1220,#090e18)'}}>
        <div style={{color: COLORS.neon, fontSize: 40, fontFamily: FONT_TEXTE, marginTop: -6}}>‹</div>
        <div style={{width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', background: '#000', border: `2.5px solid ${COLORS.bleu}`, boxShadow: `0 0 18px ${COLORS.bleu}`, flexShrink: 0}}>
          <Img src={staticFile(PHOTOS.logo.src)} style={{width: 118, marginLeft: -23, marginTop: -3}} />
        </div>
        <div>
          <div style={{fontFamily: FONT_TITRE, fontWeight: 800, fontStyle: 'italic', fontSize: 39, color: '#fff', letterSpacing: 0.5, lineHeight: 1}}>FASTPNEU45</div>
          <div style={{fontFamily: FONT_TEXTE, fontSize: 21, color: '#39d98a', marginTop: 5, display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{width: 11, height: 11, borderRadius: '50%', background: '#39d98a', display: 'inline-block'}} />En ligne · répond 7j/7
          </div>
        </div>
      </div>
      {/* fil de discussion (les nouveaux messages poussent les anciens) */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 22px 12px', overflow: 'hidden'}}>
        {msgs.map((m, i) => (
          <React.Fragment key={i}>
            {m.from === 'fastpneu' ? <Typing from={f(m.at) - 13} to={f(m.at)} /> : null}
            <Bubble from={m.from} text={m.text} at={f(m.at)} />
          </React.Fragment>
        ))}
      </div>
      <div style={{margin: '0 22px 30px', height: 66, borderRadius: 34, border: '1.5px solid #263042', background: '#0d131e', display: 'flex', alignItems: 'center', padding: '0 26px', fontFamily: FONT_TEXTE, fontSize: 24, color: '#5d6b80', justifyContent: 'space-between'}}>
        <span>Message…</span>
        <span style={{width: 46, height: 46, borderRadius: '50%', background: COLORS.bleu, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26}}>↑</span>
      </div>
      {/* reflet du verre */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(${112 + Math.sin(frame / 30) * 8}deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 22%, transparent 34%, transparent 78%, rgba(0,168,255,0.10) 100%)`}} />
    </div>
  );
};

/** Smartphone 3D (transformations CSS 3D : tranche, reflets, ombre portée). */
export const Phone3D: React.FC<{rotY: number; rotX: number; rotZ?: number; scale?: number}> = ({rotY, rotX, rotZ = 0, scale = 1}) => {
  const frame = useCurrentFrame();
  const glow = 0.55 + 0.25 * Math.sin(frame / 14);
  const layers = new Array(DEPTH).fill(0);
  return (
    <div style={{width: PW, height: PH, position: 'relative', transformStyle: 'preserve-3d', transform: `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`}}>
      {/* ombre / halo au sol */}
      <div style={{position: 'absolute', inset: -30, borderRadius: RADIUS + 30, transform: 'translateZ(-90px)', background: `rgba(8,123,255,${glow * 0.55})`, filter: 'blur(70px)'}} />
      {/* tranche métallique */}
      {layers.map((_, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: RADIUS, transform: `translateZ(${-(i + 1) * 3}px)`,
          background: i === DEPTH - 1 ? '#0b0f16' : `linear-gradient(90deg, #aeb8c6, #3c4654 12%, #1a2029 50%, #5b6675 88%, #dfe6ee)`,
        }} />
      ))}
      {/* face avant */}
      <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS, background: 'linear-gradient(145deg,#2b323d,#0a0d12 40%,#161b23)', boxShadow: `inset 0 0 0 3px #5b6675, inset 0 0 0 6px #10141b, 0 0 60px rgba(0,168,255,${glow * 0.5})`}}>
        <Screen />
      </div>
    </div>
  );
};

export const phoneIntro = (frame: number) => prog(frame, 0, 26);
