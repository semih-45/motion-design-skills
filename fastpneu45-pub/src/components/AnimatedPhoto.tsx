import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Callout, Cam, COLORS, FONT_TITRE, HEIGHT, PhotoDef, Reveal, WIDTH} from '../config';
import {clamp, expoOut, lerp, prog, SpeedLines} from './fx';

type Props = {
  photo: PhotoDef;
  durationInFrames: number;
  from: Cam;
  to: Cam;
  reveal?: Reveal;
  subject?: {x: number; y: number; rx: number; ry: number};
  sweep?: boolean;
  rackFocus?: boolean;
  speedLines?: boolean;
  callout?: Callout;
  /** assombrissement global (0 = aucun) */
  dim?: number;
  blur?: number;
};

const REVEAL_FRAMES = 8;

/**
 * Photo réelle animée : caméra virtuelle (zoom / travelling / inclinaison 3D),
 * faux relief 2.5D (le sujet se détache du décor), mise au point progressive,
 * balayage lumineux, repères néon et masque d'apparition.
 * L'image n'est jamais déformée : elle est seulement recadrée (cover).
 */
export const AnimatedPhoto: React.FC<Props> = ({
  photo, durationInFrames, from, to, reveal = 'dark', subject, sweep, rackFocus, speedLines, callout, dim = 0, blur = 0,
}) => {
  const frame = useCurrentFrame();
  // taille « cover » sans déformation
  const cover = Math.max(WIDTH / photo.w, HEIGHT / photo.h);
  const W = photo.w * cover, H = photo.h * cover;

  // mouvement : attaque rapide puis dérive lente (jamais d'image fixe)
  const fast = prog(frame, 0, Math.min(16, durationInFrames * 0.5), expoOut);
  const drift = clamp(frame / durationInFrames);
  const p = fast * 0.72 + drift * 0.28;
  const scale = lerp(from.scale, to.scale, p);
  // on garde le cadre dans l'image
  const hw = WIDTH / (2 * W * scale), hh = HEIGHT / (2 * H * scale);
  const fx = clamp(lerp(from.x, to.x, p), hw, 1 - hw);
  const fy = clamp(lerp(from.y, to.y, p), hh, 1 - hh);
  const rotX = lerp(from.rotX ?? 0, to.rotX ?? 0, p);
  const rotY = lerp(from.rotY ?? 0, to.rotY ?? 0, p);
  const rotZ = lerp(from.rotZ ?? 0, to.rotZ ?? 0, p);
  const tilt = Math.max(Math.abs(rotX), Math.abs(rotY));
  const safety = 1 + tilt * 0.012 + Math.abs(rotZ) * 0.02;

  const stage: React.CSSProperties = {
    position: 'absolute', left: 0, top: 0, width: W, height: H,
    transformOrigin: `${fx * W}px ${fy * H}px`,
    transform: `translate(${WIDTH / 2 - fx * W}px, ${HEIGHT / 2 - fy * H}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale * safety})`,
  };

  const rv = prog(frame, 0, REVEAL_FRAMES, Easing.out(Easing.cubic));
  const focusBlur = rackFocus ? interpolate(frame, [0, 12], [16, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}) : 0;
  const exposure = reveal === 'dark' ? interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1;
  const flash = reveal === 'flash' ? interpolate(frame, [0, 9], [1, 0], {extrapolateRight: 'clamp'}) : 0;

  let clip: string | undefined;
  let outerTransform: string | undefined;
  if (reveal === 'wipe') {
    const e = rv * 150 - 25;
    clip = `polygon(0 0, ${e + 25}% 0, ${e}% 100%, 0 100%)`;
  } else if (reveal === 'iris') {
    clip = `circle(${rv * 125}% at 32% 62%)`;
  } else if (reveal === 'push') {
    outerTransform = `translateX(${(1 - rv) * 100}%) skewX(${(1 - rv) * -10}deg)`;
  }

  // relief 2.5D : le sujet avance légèrement plus vite que le décor
  const depth = subject ? 0.02 + drift * 0.022 : 0;
  const sub = subject;
  const mask = sub
    ? `radial-gradient(ellipse ${sub.rx * 100}% ${sub.ry * 100}% at ${sub.x * 100}% ${sub.y * 100}%, #000 55%, transparent 100%)`
    : undefined;

  const img = <Img src={staticFile(photo.src)} style={{width: W, height: H, display: 'block'}} />;
  const baseFilter = `brightness(${(sub ? 0.8 : 0.95) * exposure * (1 - dim)}) contrast(1.12) saturate(1.08)${focusBlur + blur + (sub ? 1.2 : 0) > 0.1 ? ` blur(${focusBlur + blur + (sub ? 1.2 : 0)}px)` : ''}`;
  const subFilter = `brightness(${1.06 * exposure * (1 - dim)}) contrast(1.15) saturate(1.12)${focusBlur * 0.4 + blur > 0.1 ? ` blur(${focusBlur * 0.4 + blur}px)` : ''}`;

  const sweepP = sweep ? prog(frame, 5, 5 + Math.min(26, durationInFrames - 6), Easing.inOut(Easing.quad)) : 0;

  const content = (
    <AbsoluteFill style={{perspective: 1500, overflow: 'hidden', background: COLORS.noir}}>
      <div style={{...stage, filter: baseFilter}}>{img}</div>
      {sub ? (
        <div style={{...stage, transform: `${stage.transform} `, filter: subFilter}}>
          <div style={{
            width: W, height: H, maskImage: mask, WebkitMaskImage: mask,
            transformOrigin: `${sub.x * 100}% ${sub.y * 100}%`, transform: `scale(${1 + depth}) translate(${(drift - 0.5) * -10}px, ${(drift - 0.5) * -6}px)`,
          }}>{img}</div>
        </div>
      ) : null}
      {callout ? <div style={{...stage}}><CalloutMark c={callout} W={W} H={H} scale={scale} /></div> : null}
      {/* étalonnage bleu électrique */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,7,11,0.62) 0%, rgba(5,7,11,0) 22%, rgba(5,7,11,0) 52%, rgba(5,7,11,0.9) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(135deg, rgba(8,123,255,0.26), rgba(0,0,0,0) 45%, rgba(0,168,255,0.14))', mixBlendMode: 'screen'}} />
      {sweep && sweepP > 0 && sweepP < 1 ? (
        <AbsoluteFill style={{
          mixBlendMode: 'screen',
          background: `linear-gradient(108deg, transparent ${sweepP * 170 - 60}%, rgba(0,168,255,0.45) ${sweepP * 170 - 38}%, rgba(255,255,255,0.7) ${sweepP * 170 - 30}%, rgba(0,168,255,0.4) ${sweepP * 170 - 22}%, transparent ${sweepP * 170}%)`,
        }} />
      ) : null}
      {speedLines ? <SpeedLines opacity={interpolate(frame, [0, 6, 18, 28], [0, 0.9, 0.5, 0.15], {extrapolateRight: 'clamp'})} seed={photo.src} /> : null}
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(190,230,255,${flash})`, mixBlendMode: 'screen'}} /> : null}
    </AbsoluteFill>
  );

  if (reveal === 'slices') {
    // volets verticaux décalés (transition mécanique)
    const n = 5;
    return (
      <AbsoluteFill>
        {new Array(n).fill(0).map((_, i) => {
          const q = prog(frame, i * 1.2, REVEAL_FRAMES + i * 1.2, Easing.out(Easing.cubic));
          const l = (i * 100) / n, r = ((i + 1) * 100) / n + 0.05;
          const top = i % 2 ? 0 : (1 - q) * 100, bottom = i % 2 ? q * 100 : 100;
          return (
            <AbsoluteFill key={i} style={{clipPath: `polygon(${l}% ${top}%, ${r}% ${top}%, ${r}% ${bottom}%, ${l}% ${bottom}%)`}}>
              {content}
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{clipPath: clip, transform: outerTransform}}>{content}</AbsoluteFill>;
};

/** Repère néon tracé sur le matériel (suit l'image). */
const CalloutMark: React.FC<{c: Callout; W: number; H: number; scale: number}> = ({c, W, H, scale}) => {
  const frame = useCurrentFrame();
  const draw = prog(frame, 5, 17, Easing.out(Easing.cubic));
  const pulse = 0.75 + 0.25 * Math.sin(frame / 2.2);
  const x = c.x * W, y = c.y * H, w = c.w * W, h = c.h * H;
  const k = 1 / scale; // épaisseurs constantes à l'écran
  const stroke = 5 * k;
  const labelTop = (c.labelSide ?? 'top') === 'top';
  const perim = c.shape === 'ring' ? Math.PI * (w + h) / 1 : 2 * (w + h);
  const tick = 46 * k;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: `drop-shadow(0 0 ${10 * k}px ${COLORS.neon})`}}>
        {c.shape === 'ring' ? (
          <>
            <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="none" stroke={COLORS.neon} strokeWidth={stroke}
              strokeDasharray={`${perim * draw} ${perim}`} opacity={pulse} transform={`rotate(-90 ${x + w / 2} ${y + h / 2})`} />
            <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2 + 16 * k} ry={h / 2 + 16 * k} fill="none" stroke="#fff" strokeWidth={stroke * 0.5}
              strokeDasharray={`${14 * k} ${22 * k}`} opacity={draw * 0.8} transform={`rotate(${frame * 3} ${x + w / 2} ${y + h / 2})`} />
          </>
        ) : (
          <>
            <rect x={x} y={y} width={w} height={h} fill="rgba(0,168,255,0.10)" stroke={COLORS.neon} strokeWidth={stroke * 0.6}
              strokeDasharray={`${perim * draw} ${perim}`} opacity={pulse} />
            {[[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].map(([cx, cy, sx, sy], i) => (
              <path key={i} d={`M ${cx + sx * tick} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * tick}`} fill="none" stroke="#fff" strokeWidth={stroke * 1.5} opacity={draw} />
            ))}
          </>
        )}
      </svg>
      <div style={{
        position: 'absolute', left: x + w / 2, top: labelTop ? y - 16 * k : y + h + 16 * k,
        transform: `translate(-50%, ${labelTop ? '-100%' : '0'}) scale(${k})`, transformOrigin: labelTop ? '50% 100%' : '50% 0%',
        opacity: prog(frame, 11, 17), whiteSpace: 'nowrap',
        fontFamily: FONT_TITRE, fontWeight: 800, fontStyle: 'italic', fontSize: 44, letterSpacing: 2, color: '#fff',
        background: 'rgba(3,10,24,0.82)', border: `3px solid ${COLORS.neon}`, padding: '4px 20px 6px', borderRadius: 8,
        boxShadow: `0 0 26px rgba(0,168,255,0.8)`,
      }}>{c.label}</div>
    </>
  );
};
