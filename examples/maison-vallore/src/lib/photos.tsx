import React from 'react';
import {random} from 'remotion';

/*
 * Editorial "photos" recreated as vector illustrations (no bitmaps):
 *  - street : camel cashmere coat in a Parisian street, golden hour
 *  - salon  : ivory silk dress in a Haussmann salon
 *  - atelier: tailor's hands at work (chalk, tape, scissors)
 * Each is a 1080x1920 portrait SVG that fills its container (slice).
 */

export type PhotoKind = 'street' | 'salon' | 'atelier';

const L = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ */
/* Street                                                              */
/* ------------------------------------------------------------------ */

// Perspective façade: near edge x0 (top t0 / bottom b0) → far edge x1 (t1 / b1)
const facadePt = (
  u: number,
  v: number,
  e: {x0: number; x1: number; t0: number; b0: number; t1: number; b1: number},
) => {
  const d = u / (u + 2.6 * (1 - u)); // foreshortening
  const x = L(e.x0, e.x1, d);
  const top = L(e.t0, e.t1, d);
  const bot = L(e.b0, e.b1, d);
  return [x, L(top, bot, v)] as const;
};

const quad = (pts: (readonly [number, number])[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const Facade: React.FC<{e: {x0: number; x1: number; t0: number; b0: number; t1: number; b1: number}; seed: string; tone: string}> = ({
  e,
  seed,
  tone,
}) => {
  const wins: React.ReactNode[] = [];
  const cols = 7;
  const floors = 6;
  for (let i = 0; i < cols; i++) {
    for (let j = 1; j < floors; j++) {
      const u0 = (i + 0.28) / cols;
      const u1 = (i + 0.72) / cols;
      const v0 = j / (floors + 0.6) + 0.02;
      const v1 = v0 + 0.1;
      const lit = random(`${seed}${i}${j}`) > 0.72;
      wins.push(
        <polygon
          key={`w${i}-${j}`}
          points={quad([facadePt(u0, v0, e), facadePt(u1, v0, e), facadePt(u1, v1, e), facadePt(u0, v1, e)])}
          fill={lit ? '#f7c98a' : '#3e3a3c'}
          opacity={lit ? 0.9 : 0.78}
        />,
      );
      // wrought-iron balcony line
      wins.push(
        <polyline
          key={`b${i}-${j}`}
          points={quad([facadePt(u0 - 0.02, v1 + 0.006, e), facadePt(u1 + 0.02, v1 + 0.006, e)])}
          stroke="#1c1a1b"
          strokeWidth={j === 2 || j === 5 ? 6 : 3}
          fill="none"
        />,
      );
    }
  }
  // cornice lines
  const cornices = [0.17, 0.34, 0.86].map((v) => (
    <polyline key={v} points={quad([facadePt(0, v, e), facadePt(1, v, e)])} stroke="#b59c7a" strokeWidth={5} fill="none" opacity={0.7} />
  ));
  return (
    <g>
      <polygon points={quad([facadePt(0, 0, e), facadePt(1, 0, e), facadePt(1, 1, e), facadePt(0, 1, e)])} fill={tone} />
      {cornices}
      {wins}
      {/* ground-floor shopfront */}
      <polygon
        points={quad([facadePt(0.05, 0.88, e), facadePt(0.95, 0.88, e), facadePt(0.95, 1, e), facadePt(0.05, 1, e)])}
        fill="#2a2522"
        opacity={0.85}
      />
    </g>
  );
};

export const StreetPhoto: React.FC<{id?: string}> = ({id = 'st'}) => (
  <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{display: 'block'}}>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3d5ae" />
        <stop offset="0.5" stopColor="#f2c48f" />
        <stop offset="1" stopColor="#d69a63" />
      </linearGradient>
      <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b59d84" />
        <stop offset="1" stopColor="#5d5148" />
      </linearGradient>
      <radialGradient id={`${id}-sun`} cx="0.62" cy="0.36" r="0.5">
        <stop offset="0" stopColor="#fff2d6" stopOpacity="0.95" />
        <stop offset="1" stopColor="#ffd59a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#d7a874" />
        <stop offset="0.45" stopColor="#c0905e" />
        <stop offset="1" stopColor="#7f5634" />
      </linearGradient>
      <linearGradient id={`${id}-coatV`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#3a2414" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f0c7a2" />
        <stop offset="1" stopColor="#b98260" />
      </linearGradient>
      <filter id={`${id}-bg`}>
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id={`${id}-soft`}>
        <feGaussianBlur stdDeviation="1.4" />
      </filter>
    </defs>
    <rect width="1080" height="1920" fill={`url(#${id}-sky)`} />
    <g filter={`url(#${id}-bg)`}>
      {/* distant tower silhouette in the haze */}
      <path d="M562 520 L572 520 L590 760 L612 840 L598 840 L578 780 L556 780 L536 840 L522 840 L544 760 Z" fill="#b48a68" opacity="0.45" />
      <Facade seed="L" tone="#e3cfae" e={{x0: -40, x1: 470, t0: -260, b0: 1560, t1: 560, b1: 1090}} />
      <Facade seed="R" tone="#d9c19c" e={{x0: 1120, x1: 640, t0: -200, b0: 1580, t1: 600, b1: 1090}} />
      <polygon points="-40,1560 470,1090 640,1090 1120,1580 1120,1920 -40,1920" fill={`url(#${id}-ground)`} />
      {/* cobblestone rows */}
      {Array.from({length: 14}).map((_, i) => {
        const y = 1100 + Math.pow(i / 13, 1.8) * 820;
        return <line key={i} x1="0" x2="1080" y1={y} y2={y} stroke="#3f3631" strokeWidth={1 + i * 0.5} opacity="0.35" />;
      })}
      {/* passers-by, far away */}
      <rect x="452" y="1010" width="18" height="70" rx="8" fill="#3b302b" opacity="0.6" />
      <rect x="690" y="1000" width="22" height="86" rx="9" fill="#4a3a30" opacity="0.6" />
    </g>
    <rect width="1080" height="1920" fill={`url(#${id}-sun)`} />

    {/* ground shadow */}
    <ellipse cx="560" cy="1770" rx="250" ry="34" fill="#2c2018" opacity="0.45" filter={`url(#${id}-soft)`} />
    {/* legs (black trousers) + shoes */}
    <path d="M470 1480 L520 1480 L512 1730 L478 1730 Z" fill="#1b1918" />
    <path d="M560 1480 L612 1480 L640 1700 L604 1708 Z" fill="#232020" />
    <path d="M466 1726 Q500 1716 526 1730 L528 1752 L462 1752 Z" fill="#0d0c0c" />
    <path d="M598 1702 Q628 1690 652 1702 L660 1724 L598 1728 Z" fill="#0d0c0c" />
    {/* handbag arm side (behind coat) */}
    <path d="M700 1060 Q730 1150 728 1240 L700 1250 Q690 1150 676 1080 Z" fill="#9a6c43" />
    <rect x="676" y="1210" width="128" height="100" rx="14" fill="#151313" />
    <path d="M700 1214 Q740 1160 780 1214" fill="none" stroke="#151313" strokeWidth="9" />
    <rect x="726" y="1236" width="26" height="8" rx="3" fill="#d4af6a" />
    {/* coat body */}
    <path
      d="M420 760 Q540 730 660 760 L700 830 Q720 1100 760 1500 Q560 1530 330 1500 Q370 1100 382 830 Z"
      fill={`url(#${id}-coat)`}
    />
    <path d="M420 760 Q540 730 660 760 L700 830 Q720 1100 760 1500 Q560 1530 330 1500 Q370 1100 382 830 Z" fill={`url(#${id}-coatV)`} />
    {/* front opening + lapels */}
    <path d="M548 800 L560 1500" stroke="#6e4a2c" strokeWidth="4" opacity="0.7" />
    <path d="M492 760 L548 980 L470 860 Z" fill="#d9ad7c" />
    <path d="M600 760 L552 980 L640 860 Z" fill="#a8784b" />
    {/* black turtleneck */}
    <path d="M512 742 Q546 760 584 742 L566 800 Q546 810 528 800 Z" fill="#141213" />
    {/* belt */}
    <path d="M378 1060 Q540 1085 716 1060 L720 1102 Q540 1126 374 1102 Z" fill="#a87a4c" />
    <path d="M540 1090 L515 1250 L535 1252 L556 1100 Z" fill="#a0724a" />
    <path d="M556 1094 L590 1230 L608 1222 L572 1090 Z" fill="#94683f" />
    {/* folds */}
    <path d="M420 1140 Q410 1320 400 1490" stroke="#8a603b" strokeWidth="5" fill="none" opacity="0.55" />
    <path d="M650 1140 Q668 1330 690 1495" stroke="#6f4a2b" strokeWidth="5" fill="none" opacity="0.55" />
    {/* left sleeve + hand */}
    <path d="M384 820 Q340 980 352 1220 L404 1226 Q404 1010 432 860 Z" fill="#c69462" />
    <ellipse cx="378" cy="1246" rx="26" ry="34" fill={`url(#${id}-skin)`} />
    {/* neck + head */}
    <rect x="526" y="690" width="38" height="66" rx="16" fill="#c99272" />
    <ellipse cx="545" cy="640" rx="54" ry="68" fill={`url(#${id}-skin)`} />
    {/* hair: sleek low bun */}
    <path d="M490 640 Q486 560 545 556 Q606 558 602 636 Q596 594 548 590 Q506 592 490 640 Z" fill="#2a1c13" />
    <ellipse cx="596" cy="628" rx="26" ry="24" fill="#24170f" />
    {/* sunglasses */}
    <rect x="506" y="626" width="38" height="20" rx="9" fill="#111" />
    <rect x="550" y="626" width="38" height="20" rx="9" fill="#111" />
    <rect x="542" y="632" width="10" height="4" fill="#111" />
    <path d="M532 680 Q546 688 560 680" stroke="#9d4a43" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* rim light from the sun */}
    <path d="M660 760 L700 830 Q720 1100 760 1500" stroke="#ffe2b0" strokeWidth="6" fill="none" opacity="0.55" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Salon                                                               */
/* ------------------------------------------------------------------ */

export const SalonPhoto: React.FC<{id?: string}> = ({id = 'sa'}) => (
  <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{display: 'block'}}>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#efe9df" />
        <stop offset="1" stopColor="#cfc6b8" />
      </linearGradient>
      <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8c5f3a" />
        <stop offset="1" stopColor="#5a3a22" />
      </linearGradient>
      <linearGradient id={`${id}-silk`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#d9cdb6" />
        <stop offset="0.22" stopColor="#fbf6ea" />
        <stop offset="0.38" stopColor="#e8dcc5" />
        <stop offset="0.55" stopColor="#fffaf0" />
        <stop offset="0.75" stopColor="#d6c8ae" />
        <stop offset="1" stopColor="#ad9f86" />
      </linearGradient>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f3d2b6" />
        <stop offset="1" stopColor="#c9967a" />
      </linearGradient>
      <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fffaf0" stopOpacity="0.75" />
        <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
      </linearGradient>
      <filter id={`${id}-bg`}>
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id={`${id}-soft`}>
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>
    <g filter={`url(#${id}-bg)`}>
      <rect width="1080" height="1920" fill={`url(#${id}-wall)`} />
      {/* ceiling cornice */}
      <rect x="0" y="120" width="1080" height="26" fill="#f7f3ec" />
      <rect x="0" y="150" width="1080" height="10" fill="#c9bfae" />
      {/* boiserie panels */}
      {[440, 760].map((x) => (
        <g key={x}>
          <rect x={x} y="240" width="260" height="620" fill="none" stroke="#fbf8f2" strokeWidth="10" />
          <rect x={x + 6} y="246" width="260" height="620" fill="none" stroke="#bcb1a0" strokeWidth="4" opacity="0.7" />
          <rect x={x} y="920" width="260" height="420" fill="none" stroke="#fbf8f2" strokeWidth="10" />
          <rect x={x + 6} y="926" width="260" height="420" fill="none" stroke="#bcb1a0" strokeWidth="4" opacity="0.7" />
        </g>
      ))}
      {/* tall French window */}
      <rect x="40" y="190" width="340" height="1180" fill="#fffaf1" />
      <rect x="40" y="190" width="340" height="1180" fill="none" stroke="#e2dacb" strokeWidth="20" />
      <line x1="210" y1="190" x2="210" y2="1370" stroke="#e2dacb" strokeWidth="14" />
      {[420, 650, 880, 1110].map((y) => (
        <line key={y} x1="40" y1={y} x2="380" y2={y} stroke="#e2dacb" strokeWidth="10" />
      ))}
      {/* curtain */}
      <path d="M380 170 Q430 700 400 1400 L470 1400 Q480 700 440 170 Z" fill="#e6dccb" />
      {/* parquet */}
      <rect x="0" y="1370" width="1080" height="550" fill={`url(#${id}-floor)`} />
      {Array.from({length: 22}).map((_, i) => {
        const x = -400 + i * 90;
        return <line key={i} x1={540 + (x - 540) * 0.35} y1="1370" x2={x} y2="1920" stroke="#3e2816" strokeWidth="3" opacity="0.4" />;
      })}
      {/* chandelier */}
      <g opacity="0.8">
        <line x1="640" y1="0" x2="640" y2="180" stroke="#a88c58" strokeWidth="4" />
        <ellipse cx="640" cy="230" rx="120" ry="40" fill="none" stroke="#c8a96a" strokeWidth="6" />
        {Array.from({length: 11}).map((_, i) => (
          <circle key={i} cx={530 + i * 22} cy={262 + Math.sin(i) * 8} r="7" fill="#fff6dd" />
        ))}
      </g>
    </g>
    {/* light spill from the window */}
    <polygon points="380,300 380,1370 980,1920 520,1920 40,1370" fill={`url(#${id}-ray)`} opacity="0.5" />
    {/* floor shadow */}
    <ellipse cx="640" cy="1760" rx="260" ry="40" fill="#2b1a0f" opacity="0.4" filter={`url(#${id}-soft)`} />
    {/* dress — long bias-cut slip */}
    <path
      d="M560 700 L700 700 Q726 900 730 1060 Q780 1400 860 1760 Q640 1800 430 1760 Q510 1400 540 1060 Q536 900 560 700 Z"
      fill={`url(#${id}-silk)`}
    />
    {/* satin folds */}
    <path d="M600 1060 Q590 1400 540 1760" stroke="#fffdf6" strokeWidth="10" fill="none" opacity="0.8" />
    <path d="M660 1070 Q690 1400 760 1770" stroke="#c4b498" strokeWidth="9" fill="none" opacity="0.6" />
    <path d="M625 1080 Q640 1420 650 1780" stroke="#efe5d2" strokeWidth="6" fill="none" opacity="0.8" />
    <path d="M556 960 Q630 990 718 960" stroke="#cbbb9e" strokeWidth="5" fill="none" opacity="0.6" />
    {/* bodice cowl */}
    <path d="M560 712 Q630 790 700 712" stroke="#cdbfa5" strokeWidth="6" fill="none" />
    {/* straps */}
    <line x1="578" y1="708" x2="590" y2="640" stroke="#e9dfcc" strokeWidth="4" />
    <line x1="684" y1="708" x2="672" y2="640" stroke="#e9dfcc" strokeWidth="4" />
    {/* shoulders, arms */}
    <path d="M574 640 Q630 610 690 640 L700 700 L562 700 Z" fill={`url(#${id}-skin)`} />
    <path d="M566 650 Q530 800 540 1000 L566 1004 Q566 820 596 680 Z" fill={`url(#${id}-skin)`} />
    <path d="M690 650 Q736 820 724 1000 L700 1002 Q706 820 672 680 Z" fill="#c99579" />
    {/* neck + head */}
    <rect x="612" y="560" width="38" height="70" rx="16" fill="#d9ab8d" />
    <ellipse cx="630" cy="510" rx="50" ry="64" fill={`url(#${id}-skin)`} />
    <path d="M578 512 Q574 440 632 434 Q690 438 684 508 Q676 470 634 466 Q592 470 578 512 Z" fill="#7a5532" />
    <circle cx="674" cy="470" r="30" fill="#6e4b2b" />
    <path d="M618 548 Q630 556 642 548" stroke="#a65b52" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* rim light from window */}
    <path d="M560 700 Q536 900 540 1060 Q510 1400 430 1760" stroke="#ffffff" strokeWidth="5" fill="none" opacity="0.7" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Atelier                                                             */
/* ------------------------------------------------------------------ */

const Finger: React.FC<{x: number; y: number; len: number; w: number; rot: number; fill: string}> = ({x, y, len, w, rot, fill}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2} y={-len} width={w} height={len} rx={w / 2} fill={fill} />
    <rect x={-w / 2 + 6} y={-len + 6} width={w - 12} height={w * 0.75} rx={(w - 12) / 2} fill="#f3d1bd" opacity="0.8" />
  </g>
);

export const AtelierPhoto: React.FC<{id?: string}> = ({id = 'at'}) => (
  <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{display: 'block'}}>
    <defs>
      <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7a5133" />
        <stop offset="1" stopColor="#3f2716" />
      </linearGradient>
      <linearGradient id={`${id}-wool`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#c99a68" />
        <stop offset="1" stopColor="#8c6340" />
      </linearGradient>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e6b494" />
        <stop offset="1" stopColor="#b07a5b" />
      </linearGradient>
      <radialGradient id={`${id}-light`} cx="0.5" cy="0.42" r="0.65">
        <stop offset="0" stopColor="#ffe1b0" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0.5" />
      </radialGradient>
      <filter id={`${id}-bg`}>
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${id}-sh`}>
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <rect width="1080" height="1920" fill={`url(#${id}-wood)`} />
    <g filter={`url(#${id}-bg)`} opacity="0.35">
      {Array.from({length: 16}).map((_, i) => (
        <path key={i} d={`M-50 ${i * 130} Q540 ${i * 130 + 60} 1130 ${i * 130 - 20}`} stroke="#2a180b" strokeWidth="3" fill="none" />
      ))}
    </g>
    {/* wool cloth */}
    <g transform="rotate(-9 540 960)">
      <rect x="120" y="260" width="900" height="1420" fill="#000" opacity="0.4" filter={`url(#${id}-sh)`} />
      <rect x="100" y="230" width="900" height="1420" fill={`url(#${id}-wool)`} />
      {/* twill texture */}
      {Array.from({length: 60}).map((_, i) => (
        <line key={i} x1={100 + i * 26} y1="230" x2={100 + i * 26 - 300} y2="1650" stroke="#6e4a2c" strokeWidth="2" opacity="0.18" />
      ))}
      {/* chalk pattern piece */}
      <path
        d="M300 420 Q420 380 560 400 L640 520 Q700 760 690 1000 Q560 1060 330 1040 Q300 760 300 420 Z"
        fill="none"
        stroke="#fbf6ea"
        strokeWidth="6"
        strokeDasharray="22 12"
        opacity="0.85"
      />
      <path d="M560 400 Q600 470 640 520" stroke="#fbf6ea" strokeWidth="5" fill="none" opacity="0.85" />
      <text x="420" y="760" fill="#fbf6ea" opacity="0.7" fontFamily="Cormorant Garamond, serif" fontSize="44" fontStyle="italic">
        dos — 36
      </text>
    </g>
    {/* tape measure */}
    <path d="M-40 1480 Q380 1380 640 1520 Q860 1640 1120 1560" stroke="#e8c544" strokeWidth="54" fill="none" />
    <path d="M-40 1480 Q380 1380 640 1520 Q860 1640 1120 1560" stroke="#2b2516" strokeWidth="44" fill="none" strokeDasharray="2 18" opacity="0.55" />
    {/* scissors */}
    <g transform="translate(760 340) rotate(28)">
      <path d="M0 0 L26 -10 L330 6 L26 18 Z" fill="#d9dde2" />
      <path d="M0 10 L26 30 L320 50 L20 4 Z" fill="#aeb4bb" />
      <ellipse cx="-50" cy="-14" rx="52" ry="30" fill="none" stroke="#151515" strokeWidth="18" />
      <ellipse cx="-44" cy="44" rx="46" ry="26" fill="none" stroke="#151515" strokeWidth="18" />
      <circle cx="18" cy="10" r="8" fill="#6a6f75" />
    </g>
    {/* pin cushion */}
    <circle cx="210" cy="1690" r="92" fill="#7d1d2a" />
    <circle cx="190" cy="1670" r="60" fill="#9b2a3a" opacity="0.6" />
    {[[-30, -70], [20, -80], [50, -40], [-60, -20]].map(([dx, dy], i) => (
      <g key={i}>
        <line x1="210" y1="1690" x2={210 + dx * 1.6} y2={1690 + dy * 1.6} stroke="#d8d8d8" strokeWidth="4" />
        <circle cx={210 + dx * 1.6} cy={1690 + dy * 1.6} r="9" fill={i % 2 ? '#f0e6d2' : '#1a1a1a'} />
      </g>
    ))}
    {/* left hand flattening the cloth */}
    <g>
      <path d="M-60 1180 L220 1060 L270 1200 L-20 1330 Z" fill="#20283a" />
      <path d="M200 1050 L250 1030 L300 1180 L250 1205 Z" fill="#f2efe8" />
      <ellipse cx="350" cy="1080" rx="120" ry="92" fill={`url(#${id}-skin)`} transform="rotate(-28 350 1080)" />
      <Finger x={400} y={1020} len={170} w={44} rot={52} fill="#dca586" />
      <Finger x={420} y={1060} len={185} w={46} rot={66} fill="#d7a081" />
      <Finger x={426} y={1102} len={170} w={44} rot={80} fill="#d39b7c" />
      <Finger x={414} y={1140} len={138} w={40} rot={96} fill="#cd9576" />
      <Finger x={300} y={1010} len={120} w={46} rot={18} fill="#dca586" />
    </g>
    {/* right hand holding tailor's chalk */}
    <g>
      <path d="M1140 880 L860 830 L840 980 L1140 1040 Z" fill="#20283a" />
      <path d="M870 820 L830 816 L812 980 L852 986 Z" fill="#f2efe8" />
      <ellipse cx="740" cy="900" rx="110" ry="86" fill={`url(#${id}-skin)`} transform="rotate(18 740 900)" />
      <Finger x={680} y={850} len={150} w={42} rot={-62} fill="#dca586" />
      <Finger x={664} y={900} len={140} w={42} rot={-80} fill="#d7a081" />
      <rect x="500" y="860" width="110" height="64" rx="6" fill="#f6f1e6" transform="rotate(-24 560 892)" />
      <Finger x={690} y={950} len={130} w={44} rot={-104} fill="#d39b7c" />
      <Finger x={720} y={830} len={110} w={46} rot={-30} fill="#dca586" />
    </g>
    <rect width="1080" height="1920" fill={`url(#${id}-light)`} />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Generic photo w/ crop + tone (for thumbnails)                       */
/* ------------------------------------------------------------------ */

export const Photo: React.FC<{
  kind: PhotoKind;
  zoom?: number;
  ox?: number;
  oy?: number;
  tone?: string;
  id?: string;
  style?: React.CSSProperties;
}> = ({kind, zoom = 1, ox = 0, oy = 0, tone, id, style}) => {
  const Comp = kind === 'street' ? StreetPhoto : kind === 'salon' ? SalonPhoto : AtelierPhoto;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', ...style}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom}) translate(${ox}%, ${oy}%)`}}>
        <Comp id={id ?? `${kind}`} />
      </div>
      {tone ? <div style={{position: 'absolute', inset: 0, background: tone, mixBlendMode: 'soft-light'}} /> : null}
    </div>
  );
};
