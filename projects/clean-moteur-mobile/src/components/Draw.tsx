import React from 'react';
import {FONT} from '../timeline';

/** SVG path that draws itself on (p = 0..1). Use inside an <svg>. */
export const DrawPath: React.FC<{
  d: string;
  p: number;
  color: string;
  width?: number;
  opacity?: number;
  glow?: string;
  filter?: string;
}> = ({d, p, color, width = 6, opacity = 1, glow, filter}) => {
  if (p <= 0.001) return null;
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1 1"
      strokeDashoffset={1 - Math.min(1, p)}
      opacity={opacity}
      filter={filter}
      style={glow ? {filter: `drop-shadow(0 0 8px ${glow})`} : undefined}
    />
  );
};

/** Handwritten text revealed left→right like a pen writing it. */
export const HandText: React.FC<{
  text: string;
  p: number;
  x: number;
  y: number;
  size?: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  rotate?: number;
  weight?: number;
  shadow?: boolean;
}> = ({text, p, x, y, size = 56, color, align = 'left', rotate = -2, weight = 700, shadow = true}) => {
  if (p <= 0.001) return null;
  const tx = align === 'left' ? '0%' : align === 'center' ? '-50%' : '-100%';
  const clip = `inset(-20% ${((1 - Math.min(1, p)) * 100).toFixed(2)}% -20% -5%)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, -50%) rotate(${rotate}deg)`,
        fontFamily: FONT.hand,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        color,
        whiteSpace: 'nowrap',
        clipPath: clip,
        textShadow: shadow ? '0 2px 14px rgba(0,0,0,0.65)' : undefined,
      }}
    >
      {text}
    </div>
  );
};
