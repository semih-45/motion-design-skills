import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS, FONT_TITRE, FPS, VOICE_OVER} from '../config';
import {prog} from './fx';

/** Sous-titres synchronisés sur la voix off (définis dans config.ts). */
export const Subtitles: React.FC<{y?: number}> = ({y = 1452}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let active: {text: string; start: number} | null = null;
  for (const line of VOICE_OVER) {
    for (const [text, a, b] of line.subs) {
      if (t >= line.start + a - 0.03 && t < line.start + b + 0.12) active = {text, start: line.start + a - 0.03};
    }
  }
  if (!active) return null;
  const p = prog(frame, active.start * FPS, active.start * FPS + 5);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{
          fontFamily: FONT_TITRE, fontWeight: 700, fontSize: 56, lineHeight: 1.1, color: '#fff', textAlign: 'center', maxWidth: 900,
          padding: '12px 34px 16px', borderRadius: 18, background: 'rgba(3,6,12,0.78)', borderBottom: `4px solid ${COLORS.bleu}`,
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)', letterSpacing: 0.4,
          opacity: p, transform: `translateY(${(1 - p) * 14}px) scale(${0.95 + 0.05 * p})`,
        }}>{active.text}</div>
      </div>
    </AbsoluteFill>
  );
};
