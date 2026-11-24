// The guiding hydrogen drop: glossy green droplet with "H₂" and a small leaf.
import React from 'react';
import {FONT} from '../timeline';

export const DROP_PATH =
  'M 50 4 C 58 22, 86 48, 86 72 C 86 94, 70 110, 50 110 C 30 110, 14 94, 14 72 C 14 48, 42 22, 50 4 Z';

export const H2Drop: React.FC<{
  x: number;
  y: number;
  size: number; // px height of the drop
  opacity?: number;
  rotate?: number;
  squash?: number; // >1 stretches vertically (falling), <1 squashes
  leaf?: number; // 0..1 leaf growth
  label?: number; // 0..1 label opacity
  glow?: number;
  blur?: number;
}> = ({x, y, size, opacity = 1, rotate = 0, squash = 1, leaf = 1, label = 1, glow = 1, blur = 0}) => {
  if (opacity <= 0.001 || size < 1) return null;
  const s = size / 110;
  const w = 100 * s;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - size * 0.62,
        width: w,
        height: size,
        opacity,
        transform: `rotate(${rotate}deg) scale(${1 / Math.sqrt(squash)}, ${squash})`,
        transformOrigin: '50% 62%',
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      {/* outer glow */}
      <div
        style={{
          position: 'absolute',
          left: '-60%',
          top: '-35%',
          width: '220%',
          height: '170%',
          background: 'radial-gradient(closest-side, rgba(43,209,126,0.55), rgba(43,209,126,0.18) 45%, rgba(43,209,126,0) 100%)',
          opacity: glow,
        }}
      />
      <svg viewBox="0 0 100 110" width={w} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <radialGradient id="dropBody" cx="38%" cy="58%" r="65%">
            <stop offset="0%" stopColor="#8DF5BE" />
            <stop offset="35%" stopColor="#2BD17E" />
            <stop offset="80%" stopColor="#0E8F52" />
            <stop offset="100%" stopColor="#06603A" />
          </radialGradient>
          <linearGradient id="dropRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E9FFF3" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#E9FFF3" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B6F36A" />
            <stop offset="100%" stopColor="#2E9E3E" />
          </linearGradient>
        </defs>
        {/* leaf */}
        {leaf > 0.01 && (
          <g transform={`translate(66 30) rotate(-28) scale(${leaf})`}>
            <path d="M 0 0 C 8 -18, 30 -22, 40 -16 C 34 -4, 16 8, 0 0 Z" fill="url(#leafG)" />
            <path d="M 2 -1 C 14 -8, 26 -13, 37 -15" stroke="#1d6e2a" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          </g>
        )}
        <path d={DROP_PATH} fill="url(#dropBody)" />
        <path d={DROP_PATH} fill="none" stroke="url(#dropRim)" strokeWidth={2.2} />
        {/* inner refraction + specular */}
        <ellipse cx={36} cy={60} rx={9} ry={17} fill="#ffffff" opacity={0.55} transform="rotate(18 36 60)" />
        <circle cx={33} cy={84} r={3.4} fill="#ffffff" opacity={0.75} />
        <path d="M 66 96 C 74 90, 78 82, 79 74" stroke="#d9ffe9" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.5} />
      </svg>
      {label > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: size * 0.47,
            width: w,
            textAlign: 'center',
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: size * 0.3,
            color: '#fff',
            opacity: label,
            textShadow: `0 ${size * 0.01}px ${size * 0.05}px rgba(0,60,30,0.6)`,
            letterSpacing: -size * 0.004,
          }}
        >
          H<span style={{fontSize: size * 0.17, verticalAlign: 'sub'}}>2</span>
        </div>
      )}
    </div>
  );
};
