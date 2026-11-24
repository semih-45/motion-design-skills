// Scene 6 — "Et aussi… la petite mécanique": flat service cards; the brake card's icon becomes the 3D disc.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, prog, springy} from '../lib/anim';
import {HandText} from '../components/Draw';
import {H2Drop} from '../components/H2Drop';

export const CARD_W = 430;
export const CARD_H = 250;
export const BRAKE_ICON = {x: 780, y: 812, r: 62};

const Icon: React.FC<{kind: string; color: string}> = ({kind, color}) => {
  switch (kind) {
    case 'oil':
      return (
        <svg width={124} height={124} viewBox="0 0 124 124">
          <path d="M 18 52 L 74 52 L 96 40 L 112 46 L 86 70 L 86 92 L 18 92 Z" fill={color} />
          <rect x={30} y={40} width={22} height={12} rx={3} fill={color} />
          <path d="M 108 58 C 104 66, 100 72, 100 78 C 100 84, 104 88, 108 88 C 112 88, 116 84, 116 78 C 116 72, 112 66, 108 58 Z" fill={color} opacity={0.85} />
        </svg>
      );
    case 'disc':
      return (
        <svg width={124} height={124} viewBox="0 0 124 124">
          <circle cx={62} cy={62} r={58} fill={color} />
          <circle cx={62} cy={62} r={22} fill="rgba(0,0,0,0.28)" />
          {Array.from({length: 12}).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={62 + Math.cos(a) * 42} cy={62 + Math.sin(a) * 42} r={4.5} fill="rgba(0,0,0,0.3)" />;
          })}
        </svg>
      );
    case 'battery':
      return (
        <svg width={124} height={124} viewBox="0 0 124 124">
          <rect x={14} y={34} width={96} height={64} rx={10} fill={color} />
          <rect x={28} y={24} width={16} height={12} rx={3} fill={color} />
          <rect x={80} y={24} width={16} height={12} rx={3} fill={color} />
          <path d="M 30 66 L 44 66 M 37 59 L 37 73 M 80 66 L 94 66" stroke="#2BD17E" strokeWidth={6} strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={124} height={124} viewBox="0 0 124 124">
          <rect x={12} y={24} width={100} height={70} rx={12} fill={color} />
          <path d="M 24 62 L 44 62 L 52 44 L 64 80 L 74 56 L 80 62 L 100 62" stroke="#F4F7FC" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x={48} y={98} width={28} height={10} rx={4} fill={color} />
        </svg>
      );
  }
};

const CARDS = [
  {label: 'Vidange', icon: 'oil', bg: '#1E6BFF', fg: '#ffffff', cx: 300, cy: 850, at: 'card1', rot: -3},
  {label: 'Freins', icon: 'disc', bg: '#E3262E', fg: '#ffffff', cx: 780, cy: 850, at: 'card2', rot: 2.5},
  {label: 'Batterie', icon: 'battery', bg: '#2BD17E', fg: '#05210F', cx: 300, cy: 1130, at: 'card3', rot: 2},
  {label: 'Diagnostic', icon: 'diag', bg: '#F4F7FC', fg: '#0B1E3F', cx: 780, cy: 1130, at: 'card4', rot: -2.5},
];

export const S6Meca: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.meca - 6 || f > C.qr + 8) return null;
  const enter = prog(f, S.meca - 6, 10, easeOut);
  const titleOut = prog(f, C.qr - 16, 10, easeIn);
  const scatter = prog(f, C.disc, 12, easeInOut);
  const tB = prog(f, C.mecaTitle + 6, 12, easeOut);
  const tC = prog(f, C.mecaTitle + 10, 12, easeOut);

  // H2 drop: arcs in and taps the brake card at C.disc
  const dIn = prog(f, C.card4 + 2, C.disc - C.card4 - 2, easeIn);
  const dx = lerp(140, BRAKE_ICON.x, dIn);
  const dy = lerp(480, BRAKE_ICON.y, dIn) - Math.sin(Math.PI * dIn) * 180;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${(1 - enter) * 1500}px)`,
        filter: enter < 0.98 ? `blur(${(1 - enter) * 28}px)` : undefined,
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: 1 - titleOut}}>
        <HandText text="Et aussi…" p={prog(f, C.mecaTitle, 10, easeInOut)} x={540} y={370} size={104} color="#2BD17E" align="center" rotate={-3} />
        <div style={{position: 'absolute', left: 0, top: 430, width: W, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 900, color: '#fff', lineHeight: 1}}>
          <div style={{overflow: 'hidden', height: 112}}>
            <div style={{fontSize: 100, letterSpacing: -3, transform: `translateY(${(1 - tB) * 105}%)`}}>la petite</div>
          </div>
          <div style={{overflow: 'hidden', height: 118}}>
            <div style={{fontSize: 108, letterSpacing: -3, transform: `translateY(${(1 - tC) * 105}%)`}}>mécanique</div>
          </div>
        </div>
      </div>
      {CARDS.map((c, i) => {
        const t = C[c.at];
        if (f < t) return null;
        const pop = clamp(springy(f, t, 2.3, 0.5), 0, 1.2);
        const isBrake = c.icon === 'disc';
        const away = isBrake ? 0 : scatter;
        const vx = (c.cx - 540) * 0.9;
        const vy = (c.cy - 990) * 0.9;
        const brakeFade = isBrake ? prog(f, C.disc, 6) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: c.cx - CARD_W / 2,
              top: c.cy - CARD_H / 2,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 40,
              transform: `translate(${vx * away}px, ${vy * away}px) rotate(${c.rot * (1 + away * 4)}deg) scale(${pop * (1 - away * 0.4) * (1 + brakeFade * 0.15)})`,
              opacity: 1 - away,
              boxShadow: `0 24px 50px rgba(0,0,0,${0.4 * (1 - brakeFade)})`,
              filter: away > 0.05 ? `blur(${away * 10}px)` : undefined,
            }}
          >
            {/* card background fades for the brake card so the 3D disc takes over */}
            <div style={{position: 'absolute', inset: 0, borderRadius: 40, background: c.bg, opacity: 1 - brakeFade}} />
            <div style={{position: 'absolute', left: CARD_W / 2 - 62, top: 22, opacity: isBrake ? 1 - prog(f, C.disc - 1, 3) : 1}}>
              <Icon kind={c.icon} color={c.fg} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: CARD_W,
                bottom: 26,
                textAlign: 'center',
                fontFamily: FONT.sans,
                fontWeight: 800,
                fontSize: 50,
                color: c.fg,
                opacity: 1 - brakeFade,
              }}
            >
              {c.label}
            </div>
          </div>
        );
      })}
      {f >= C.card4 + 2 && f < C.disc + 1 && <H2Drop x={dx} y={dy} size={lerp(110, 60, dIn)} rotate={dIn * 20} squash={1 + 0.3 * dIn} blur={dIn * 3} />}
      {f >= C.disc && f < C.disc + 14 && (
        <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
          {(() => {
            const t = (f - C.disc) / 14;
            const r = lerp(40, 420, easeOut(t));
            return <circle cx={BRAKE_ICON.x} cy={BRAKE_ICON.y} r={r} fill="none" stroke="#2BD17E" strokeWidth={10 * (1 - t)} opacity={1 - t} style={{filter: 'drop-shadow(0 0 12px #2BD17E)'}} />;
          })()}
        </svg>
      )}
    </div>
  );
};
