// On-screen claim during the brake-disc shot (text only, no voice-over).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, W} from '../timeline';
import {clamp, easeIn, lerp, prog, springy} from '../lib/anim';

export const PriceClaim: React.FC = () => {
  const f = useCurrentFrame();
  const t0 = C.priceClaim;
  const out = prog(f, C.ctaWhere - 10, 8, easeIn);
  if (f < t0 || out >= 1) return null;
  const pop = clamp(springy(f, t0, 2.6, 0.45), 0, 1.25);
  const blur = lerp(10, 0, prog(f, t0, 4));
  const flash = Math.max(0, 1 - (f - t0) / 6);
  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2,
        top: 1452,
        transform: `translate(-50%, ${out * 40}px) rotate(-3deg) scale(${lerp(1.5, 1, Math.min(1, pop)) * (pop > 1 ? pop : 1)})`,
        opacity: clamp(pop * 3) * (1 - out),
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        padding: '14px 40px 18px',
        borderRadius: 30,
        background: '#E3262E',
        boxShadow: `0 24px 50px rgba(0,0,0,0.45), 0 0 ${40 * flash}px rgba(255,255,255,${0.6 * flash})`,
        border: '4px solid #ffffff',
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 1.02,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{fontSize: 66, letterSpacing: -1}}>PRIX DÉFIANT</div>
      <div style={{fontSize: 50, letterSpacing: 0.5}}>TOUTE CONCURRENCE</div>
    </div>
  );
};
