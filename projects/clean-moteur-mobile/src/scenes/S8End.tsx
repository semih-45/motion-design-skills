// Scene 8 — end card: the small top logo grows into the full-colour logo plate, slogan written by hand,
// the H2 drop lands on the plate, phone number + service area.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeInOut, easeOut, lerp, prog, springy} from '../lib/anim';
import {Logo, LOGO_H, LOGO_W} from '../components/Logo';
import {TOP_LOGO} from './TopLogo';
import {HandText, DrawPath} from '../components/Draw';
import {H2Drop} from '../components/H2Drop';
import {QR_FINAL} from './S7Cta';
import type {AdProps} from '../Ad';

const PLATE = {x: 60, y: 470, w: 960, h: 520};
const LOGO_FINAL_W = 860;

export const S8End: React.FC<AdProps> = ({phoneDisplay}) => {
  const f = useCurrentFrame();
  if (f < C.logoBig) return null;
  const m = prog(f, C.logoBig, 18, easeInOut);
  const finalLeft = (W - LOGO_FINAL_W) / 2;
  const finalTop = PLATE.y + (PLATE.h - (LOGO_FINAL_W * LOGO_H) / LOGO_W) / 2 + 10;
  const lw = lerp(TOP_LOGO.w, LOGO_FINAL_W, m);
  const left = lerp((W - TOP_LOGO.w) / 2, finalLeft, m);
  const top = lerp(TOP_LOGO.top, finalTop, m);
  const plate = prog(f, C.logoBig + 6, 14, easeOut);
  const colorMix = prog(f, C.logoBig + 8, 6);
  const push = 1 + 0.035 * prog(f, C.logoBig, 102, easeInOut);

  // drop flies from the QR centre to the plate corner
  const dP = prog(f, C.logoBig + 2, 20, easeInOut);
  const dx = lerp(QR_FINAL.x, PLATE.x + PLATE.w - 70, dP);
  const dy = lerp(QR_FINAL.y, PLATE.y + 40, dP) - Math.sin(Math.PI * dP) * 260;
  const bob = Math.sin((f - C.logoBig) / 7) * 6 * prog(f, C.logoBig + 22, 10);

  const slogan1 = prog(f, C.slogan, 14, easeInOut);
  const slogan2 = prog(f, C.slogan + 10, 12, easeInOut);
  const swoosh = prog(f, C.slogan + 20, 10, easeOut);
  const phone = springy(f, C.endPhone, 2.2, 0.55);
  const where = prog(f, C.endPhone + 8, 10, easeOut);

  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`}}>
      {/* plate */}
      <div
        style={{
          position: 'absolute',
          left: PLATE.x,
          top: PLATE.y,
          width: PLATE.w,
          height: PLATE.h,
          borderRadius: 56,
          background: 'linear-gradient(160deg, #ffffff 0%, #eef3fb 100%)',
          clipPath: `circle(${(plate * 75).toFixed(2)}% at 50% 30%)`,
          transform: `perspective(1400px) rotateX(${(1 - plate) * 14}deg)`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.5), 0 0 ${80 * plate}px rgba(30,107,255,0.35)`,
        }}
      />
      {/* logo (reversed → colour as the plate appears) */}
      <div style={{position: 'absolute', left, top}}>
        <div style={{position: 'absolute', opacity: 1 - colorMix}}>
          <Logo width={lw} variant="reversed" spin={f * 0.8} />
        </div>
        <div style={{position: 'absolute', opacity: colorMix}}>
          <Logo width={lw} variant="color" spin={f * 0.8} />
        </div>
      </div>
      {f < C.logoBig + 40 || true ? <H2Drop x={dx} y={dy + bob} size={lerp(70, 120, dP)} leaf={1} label={1} glow={0.8} /> : null}
      {/* slogan */}
      <HandText text="Redonnez une seconde jeunesse" p={slogan1} x={540} y={1110} size={84} color="#ffffff" align="center" rotate={-3} />
      <HandText text="à votre moteur !" p={slogan2} x={560} y={1205} size={96} color="#ffffff" align="center" rotate={-3} />
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <DrawPath d="M 300 1268 C 420 1250, 620 1240, 820 1236" p={swoosh} color="#E3262E" width={12} />
      </svg>
      {/* phone pill */}
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: 1350,
          transform: `translate(-50%, 0) scale(${clamp(phone, 0, 1.2)})`,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '18px 44px 18px 22px',
          borderRadius: 999,
          background: '#E3262E',
          boxShadow: '0 20px 50px rgba(227,38,46,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width={84} height={84} viewBox="0 0 64 64">
          <circle cx={32} cy={32} r={32} fill="#fff" />
          <path
            d="M 22 16 C 24 15, 27 15, 28 18 L 30 24 C 31 26, 30 28, 28 29 L 26 30 C 28 36, 31 39, 36 41 L 37.5 39 C 38.5 37, 40.5 36.5, 42.5 37.5 L 48 40 C 50 41, 50 44, 49 46 C 47 49, 44 50, 41 49.5 C 30 47, 19 36, 16.5 25 C 16 22, 18.5 18, 22 16 Z"
            fill="#E3262E"
          />
        </svg>
        <span style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: -1}}>{phoneDisplay}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: W,
          top: 1500,
          textAlign: 'center',
          fontFamily: FONT.sans,
          fontWeight: 600,
          fontSize: 36,
          color: 'rgba(255,255,255,0.85)',
          opacity: where,
          transform: `translateY(${(1 - where) * 20}px)`,
        }}
      >
        Intervention à domicile ou sur votre lieu de travail
      </div>
    </div>
  );
};

export const _u = S;
