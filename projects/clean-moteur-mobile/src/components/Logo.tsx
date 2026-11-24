// Clean Moteur Mobile logo, rebuilt as vectors. Design box: 1000 × 420 px, scaled by `width`.
import React from 'react';
import {clamp, easeOut} from '../lib/anim';
import {FONT} from '../timeline';

export const LOGO_W = 1000;
export const LOGO_H = 420;

const gearPath = (cx: number, cy: number, rOut: number, rIn: number, teeth: number) => {
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    const pts = [
      [a0 - step * 0.22, rIn],
      [a0 - step * 0.15, rOut],
      [a0 + step * 0.15, rOut],
      [a0 + step * 0.22, rIn],
      [a0 + step * 0.5, rIn],
    ];
    pts.forEach(([a, r], k) => {
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      d += `${i === 0 && k === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `;
    });
  }
  return d + 'Z';
};

export const Logo: React.FC<{
  width: number;
  variant?: 'color' | 'reversed';
  arc?: number;
  gear?: number;
  text?: number;
  badge?: number;
  sub?: number;
  spin?: number;
}> = ({width, variant = 'color', arc = 1, gear = 1, text = 1, badge = 1, sub = 1, spin = 0}) => {
  const k = width / LOGO_W;
  const navy = variant === 'color' ? '#0B1E3F' : '#FFFFFF';
  const red = variant === 'color' ? '#E3262E' : '#FF3B43';
  const arcColor = variant === 'color' ? '#0B1E3F' : '#FFFFFF';
  const subBg = variant === 'color' ? '#0B1E3F' : 'rgba(30,107,255,0.95)';
  const textClip = `inset(-10% ${((1 - clamp(text)) * 100).toFixed(2)}% -25% 0)`;
  const g = easeOut(clamp(gear));
  return (
    <div style={{position: 'relative', width: LOGO_W * k, height: LOGO_H * k}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: LOGO_W, height: LOGO_H, transform: `scale(${k})`, transformOrigin: '0 0'}}>
        {/* car silhouette arc */}
        <svg width={LOGO_W} height={200} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path
            d="M 40 196 C 90 150, 170 104, 300 72 C 420 44, 560 40, 660 70 C 712 86, 752 110, 790 140"
            fill="none"
            stroke={arcColor}
            strokeWidth={17}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - clamp(arc)}
          />
          <path
            d="M 250 120 C 330 92, 450 80, 560 92"
            fill="none"
            stroke={arcColor}
            strokeWidth={9}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - clamp(arc * 1.4 - 0.4)}
            opacity={0.9}
          />
        </svg>
        {/* gear */}
        <svg
          width={190}
          height={190}
          viewBox="0 0 190 190"
          style={{
            position: 'absolute',
            left: 790,
            top: 18,
            opacity: g,
            transform: `scale(${0.4 + 0.6 * g}) rotate(${(1 - g) * -120 + spin}deg)`,
          }}
        >
          <path d={gearPath(95, 95, 86, 70, 12)} fill={red} />
          <circle cx={95} cy={95} r={50} fill={red} />
          <circle cx={95} cy={95} r={28} fill={variant === 'color' ? '#ffffff' : '#0B1E3F'} />
        </svg>
        {/* word mark */}
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 168,
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: 104,
            letterSpacing: -4,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            clipPath: textClip,
          }}
        >
          <span style={{color: navy}}>Clean</span>
          <span style={{color: red}}>Moteur</span>
        </div>
        {/* Mobile badge */}
        <div
          style={{
            position: 'absolute',
            left: 716,
            top: 214,
            padding: '6px 26px 12px',
            borderRadius: 999,
            background: red,
            border: `5px solid ${variant === 'color' ? '#ffffff' : '#0B1E3F'}`,
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontStyle: 'italic',
            fontSize: 56,
            color: '#fff',
            lineHeight: 1,
            transform: `scale(${clamp(badge, 0, 1.3)}) rotate(-3deg)`,
            transformOrigin: '20% 50%',
            opacity: clamp(badge * 3),
          }}
        >
          Mobile
        </div>
        {/* subtitle bar */}
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 326,
            width: 948,
            height: 78,
            borderRadius: 16,
            background: subBg,
            clipPath: `inset(0 ${((1 - clamp(sub)) * 100).toFixed(2)}% 0 0 round 16px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: 42,
            letterSpacing: 2,
            color: '#fff',
          }}
        >
          DÉCALAMINAGE &amp; NETTOYAGE FAP
        </div>
      </div>
    </div>
  );
};
