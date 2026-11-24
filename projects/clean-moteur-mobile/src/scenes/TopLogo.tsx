// Small reversed logo at the top during scenes 2–7 (inside the Snapchat-safe area).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, S, W} from '../timeline';
import {prog} from '../lib/anim';
import {Logo} from '../components/Logo';

export const TOP_LOGO = {w: 290, top: 158};

export const TopLogo: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.problem || f >= C.logoBig) return null;
  const o = prog(f, S.problem + 8, 12) * 0.92;
  return (
    <div style={{position: 'absolute', left: (W - TOP_LOGO.w) / 2, top: TOP_LOGO.top, opacity: o, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))'}}>
      <Logo width={TOP_LOGO.w} variant="reversed" spin={f * 0.8} />
    </div>
  );
};
