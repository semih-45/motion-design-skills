import React from 'react';
import {C, SANS, SERIF} from '../theme';

/* App mark for the fictional short-video app « défilé ». */
export const AppMark: React.FC<{size: number; split?: number}> = ({size, split = 1}) => {
  const o = size * 0.035 * split;
  const tri = (dx: number, dy: number, color: string, blend?: boolean) => (
    <path
      d="M38 28 Q38 22 43.5 25 L74 43.5 Q79 46.5 74 49.5 L43.5 68 Q38 71 38 65 Z"
      transform={`translate(${dx} ${dy})`}
      fill={color}
      style={blend ? {mixBlendMode: 'screen'} : undefined}
    />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', overflow: 'visible'}}>
      <rect x="0" y="0" width="100" height="100" rx="27" fill={C.ink} />
      <circle cx="50" cy="50" r="31" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />
      {tri(-o * (100 / size) * 1, -o * (100 / size) * 0.6, C.cyan, true)}
      {tri(o * (100 / size) * 1, o * (100 / size) * 0.6, C.red, true)}
      {tri(0, 0, '#fff')}
    </svg>
  );
};

export const StatusBar: React.FC<{dark?: boolean}> = ({dark = true}) => {
  const c = dark ? '#fff' : '#000';
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 76px 0',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 38,
        color: c,
        zIndex: 20,
      }}
    >
      <span>9:41</span>
      <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
        <svg width="44" height="28" viewBox="0 0 22 14">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 5.5} y={10 - i * 3} width="4" height={4 + i * 3} rx="1" fill={c} />
          ))}
        </svg>
        <svg width="40" height="28" viewBox="0 0 20 14">
          <path d="M10 13l3-3.5a4.5 4.5 0 00-6 0L10 13zM3.5 6.5a9.5 9.5 0 0113 0L15 8a7.5 7.5 0 00-10 0L3.5 6.5zM.5 3.5a14 14 0 0119 0L18 5A12 12 0 002 5L.5 3.5z" fill={c} />
        </svg>
        <svg width="62" height="30" viewBox="0 0 31 15">
          <rect x="0.5" y="0.5" width="26" height="14" rx="4" fill="none" stroke={c} strokeOpacity="0.5" />
          <rect x="2.5" y="2.5" width="20" height="10" rx="2.4" fill={c} />
          <rect x="28" y="5" width="2" height="5" rx="1" fill={c} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
};

/** Phone body. Content is laid out on a 1080x1920 screen. */
export const Phone: React.FC<{
  children: React.ReactNode;
  bg?: string;
  bezel?: boolean;
  status?: boolean;
  style?: React.CSSProperties;
}> = ({children, bg = '#000', bezel = true, status = true, style}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1080,
      height: 1920,
      borderRadius: 120,
      background: bg,
      overflow: 'hidden',
      boxShadow: bezel
        ? '0 0 0 22px #0d0d0f, 0 0 0 25px #3a3a40, 0 0 0 27px #0b0b0c, 0 60px 160px rgba(0,0,0,0.65)'
        : undefined,
      ...style,
    }}
  >
    {children}
    {status ? <StatusBar /> : null}
    {bezel ? (
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 540 - 130,
          width: 260,
          height: 76,
          borderRadius: 40,
          background: '#000',
          zIndex: 30,
        }}
      />
    ) : null}
  </div>
);

const AV: Record<string, [string, string]> = {
  mv: ['#c79b6b', '#8b5f38'],
  ines: ['#e7b7a8', '#b06a5c'],
  camille: ['#a9c3d8', '#5a7690'],
  giulia: ['#d9c38e', '#9a7b39'],
  lea: ['#b9a6d6', '#6f5a95'],
  hugo: ['#9cc7ae', '#4d7f62'],
  sofia: ['#e2a3b4', '#a3546b'],
  lucie: ['#f0c39a', '#b2774a'],
  noe: ['#a7b4c7', '#566479'],
  ana: ['#c9b39d', '#7c634b'],
};

/** Avatar: monogram in a soft gradient disc (no real faces). */
export const Avatar: React.FC<{who: keyof typeof AV | string; size: number; label?: string; ring?: string}> = ({
  who,
  size,
  label,
  ring,
}) => {
  const [a, b] = AV[who] ?? ['#888', '#444'];
  const isMV = who === 'mv';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 25%, ${a}, ${b})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isMV ? '#fff8ee' : 'rgba(255,255,255,0.95)',
        fontFamily: isMV ? SERIF : SANS,
        fontWeight: isMV ? 600 : 700,
        fontSize: size * (isMV ? 0.44 : 0.38),
        letterSpacing: isMV ? size * 0.01 : 0,
        boxShadow: ring ? `0 0 0 ${size * 0.05}px #000, 0 0 0 ${size * 0.09}px ${ring}` : undefined,
        flexShrink: 0,
      }}
    >
      {label ?? (isMV ? 'MV' : who.slice(0, 1).toUpperCase())}
    </div>
  );
};

/** Tiny wordmark for Maison Valloré. */
export const VallorWordmark: React.FC<{size: number; color?: string}> = ({size, color = '#fff'}) => (
  <div style={{fontFamily: SERIF, fontWeight: 500, fontSize: size, letterSpacing: size * 0.18, color, textTransform: 'uppercase'}}>
    Maison Valloré
  </div>
);
