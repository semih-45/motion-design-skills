// Scene 5 — "On se déplace": navigation-app style map (light basemap, 3D buildings, street names,
// blue route), the van follows the H2 drop to home then to the office; then the garage crossed out.
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, prog, springy} from '../lib/anim';
import {DrawPath} from '../components/Draw';
import {H2Drop} from '../components/H2Drop';
import {handEllipse, handLine, smoothPath} from '../lib/sketch';

type P = {x: number; y: number};

export const HOME: P = {x: 300, y: 640};
export const OFFICE: P = {x: 790, y: -230};
const START: P = {x: 600, y: 1500};

const ROUTE: P[] = [START, {x: 600, y: 1180}, {x: 600, y: 930}, {x: 300, y: 930}, HOME, {x: 300, y: 330}, {x: 790, y: 330}, {x: 790, y: 60}, OFFICE];

// Route sampled + smoothed (rounded corners)
const ROUTE_PTS: P[] = (() => {
  const out: P[] = [];
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i];
    const b = ROUTE[i + 1];
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 20));
    for (let k = 0; k < n; k++) out.push({x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n});
  }
  out.push(ROUTE[ROUTE.length - 1]);
  return out.map((_, i) => {
    let sx = 0;
    let sy = 0;
    for (let k = -3; k <= 3; k++) {
      const q = out[Math.min(out.length - 1, Math.max(0, i + k))];
      sx += q.x;
      sy += q.y;
    }
    return {x: sx / 7, y: sy / 7};
  });
})();
const CUM: number[] = (() => {
  const c = [0];
  for (let i = 1; i < ROUTE_PTS.length; i++) c.push(c[i - 1] + Math.hypot(ROUTE_PTS[i].x - ROUTE_PTS[i - 1].x, ROUTE_PTS[i].y - ROUTE_PTS[i - 1].y));
  return c;
})();
const TOTAL = CUM[CUM.length - 1];
const HOME_L = (() => {
  let best = 0;
  let bd = 1e9;
  ROUTE_PTS.forEach((p, i) => {
    const d = Math.hypot(p.x - HOME.x, p.y - HOME.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return CUM[best];
})();
const routeAt = (l: number) => {
  const L = clamp(l, 0, TOTAL);
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < L) i++;
  const t = (L - CUM[i - 1]) / Math.max(1e-6, CUM[i] - CUM[i - 1]);
  const a = ROUTE_PTS[i - 1];
  const b = ROUTE_PTS[i];
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x)};
};

const vanLen = (f: number) =>
  prog(f, C.vanStart, C.home - C.vanStart, easeInOut) * HOME_L + prog(f, C.home + 2, C.office - C.home - 2, easeInOut) * (TOTAL - HOME_L);

// ---- camera / projection (ground plane, h = height above ground) ----
export const mapCam = (f: number) => {
  const tilt = lerp(10, 50, prog(f, S.travel, 40, easeInOut));
  const v = routeAt(vanLen(f));
  const cy = lerp(1000, 300, prog(f, C.vanStart - 6, C.office - C.vanStart + 6, easeInOut)) * 0.7 + v.y * 0.3;
  const cx = 540 + (v.x - 540) * 0.25;
  const zoom = lerp(1.3, 1.05, prog(f, S.travel, 30, easeOut));
  return {tilt: (tilt * Math.PI) / 180, cx, cy, zoom};
};

export const mapProject = (gx: number, gy: number, f: number, h = 0) => {
  const cam = mapCam(f);
  const D = 1500;
  const dx = gx - cam.cx;
  const dy = gy - cam.cy;
  const Y = dy * Math.cos(cam.tilt) - h * Math.sin(cam.tilt);
  const Z = D - dy * Math.sin(cam.tilt) - h * Math.cos(cam.tilt);
  const s = (D / Math.max(220, Z)) * cam.zoom;
  return {x: 540 + dx * s, y: 1000 + Y * s, s};
};

// ---- city geometry (ground units) ----
const VX = [-560, -260, 40, 300, 600, 790, 1100, 1350, 1650];
const HY = [-1000, -700, -420, -230, 60, 330, 640, 930, 1180, 1500, 1800, 2100];
type Road = {a: P; b: P; w: number; major: boolean; name?: string; labelAt?: P};
const ROADS: Road[] = [];
VX.forEach((x, i) => ROADS.push({a: {x, y: -1300}, b: {x, y: 2400}, w: i === 4 ? 46 : 30, major: i === 4}));
HY.forEach((y, i) => ROADS.push({a: {x: -900, y}, b: {x: 2000, y}, w: i === 7 ? 46 : 30, major: i === 7}));
ROADS.push({a: {x: -700, y: 1900}, b: {x: 1900, y: -700}, w: 40, major: true});
const NAMES: {name: string; at: P; along: P}[] = [
  {name: 'Rue de la République', at: {x: 600, y: 1330}, along: {x: 0, y: 1}},
  {name: 'Boulevard Voltaire', at: {x: 455, y: 930}, along: {x: 1, y: 0}},
  {name: 'Rue Victor Hugo', at: {x: 300, y: 470}, along: {x: 0, y: 1}},
  {name: 'Avenue Jean Jaurès', at: {x: 980, y: 330}, along: {x: 1, y: 0}},
  {name: 'Rue Pasteur', at: {x: 790, y: -80}, along: {x: 0, y: 1}},
  {name: 'Rue des Lilas', at: {x: 150, y: 60}, along: {x: 1, y: 0}},
  {name: 'Rue Gambetta', at: {x: 1100, y: 800}, along: {x: 0, y: 1}},
];

type Bld = {x0: number; y0: number; x1: number; y1: number; h: number};
const BUILDINGS: Bld[] = [];
const PARKS: {x0: number; y0: number; x1: number; y1: number}[] = [];
const TREES: P[] = [];
for (let i = 0; i < VX.length - 1; i++)
  for (let j = 0; j < HY.length - 1; j++) {
    const x0 = VX[i] + 34;
    const x1 = VX[i + 1] - 34;
    const y0 = HY[j] + 34;
    const y1 = HY[j + 1] - 34;
    const k = random(`blk${i}-${j}`);
    if (k < 0.13) {
      PARKS.push({x0, y0, x1, y1});
      for (let t = 0; t < 7; t++) TREES.push({x: x0 + 20 + random(`tx${i}${j}${t}`) * (x1 - x0 - 40), y: y0 + 20 + random(`ty${i}${j}${t}`) * (y1 - y0 - 40)});
      continue;
    }
    const nx = x1 - x0 > 230 ? 2 : 1;
    const ny = y1 - y0 > 230 ? 2 : 1;
    for (let a = 0; a < nx; a++)
      for (let b = 0; b < ny; b++) {
        if (random(`b${i}${j}${a}${b}`) < 0.15) continue;
        const cw = (x1 - x0) / nx;
        const ch = (y1 - y0) / ny;
        const g = 10;
        BUILDINGS.push({
          x0: x0 + a * cw + g,
          y0: y0 + b * ch + g,
          x1: x0 + (a + 1) * cw - g,
          y1: y0 + (b + 1) * ch - g,
          h: 18 + random(`h${i}${j}${a}${b}`) * 50,
        });
      }
  }
BUILDINGS.sort((p, q) => p.y1 - q.y1);
const POIS: {at: P; kind: 'P' | 'pharma' | 'fuel'}[] = [
  {at: {x: 450, y: 1060}, kind: 'P'},
  {at: {x: 700, y: 480}, kind: 'pharma'},
  {at: {x: 950, y: 190}, kind: 'fuel'},
  {at: {x: 160, y: 780}, kind: 'P'},
];

const poly = (pts: {x: number; y: number}[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

// ---- pieces ----
const VanTop: React.FC<{x: number; y: number; ang: number; s: number}> = ({x, y, ang, s}) => (
  <g transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI + 90}) scale(${s})`}>
    <circle cx={0} cy={0} r={86} fill="rgba(30,107,255,0.16)" />
    <ellipse cx={4} cy={8} rx={40} ry={78} fill="rgba(0,0,0,0.3)" style={{filter: 'blur(5px)'}} />
    <rect x={-34} y={-70} width={68} height={140} rx={14} fill="#ffffff" stroke="#1b2a44" strokeWidth={3} />
    <rect x={-29} y={-64} width={58} height={28} rx={9} fill="#1b2a44" />
    <rect x={-31} y={-8} width={62} height={10} fill="#E3262E" />
    <rect x={-31} y={4} width={62} height={6} fill="#1E6BFF" />
    <circle cx={-22} cy={-72} r={4} fill="#ffe680" />
    <circle cx={22} cy={-72} r={4} fill="#ffe680" />
  </g>
);

const MapPin: React.FC<{kind: 'home' | 'office'; x: number; y: number; scale: number; color: string}> = ({kind, x, y, scale, color}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={0} cy={3} rx={22} ry={8} fill="rgba(0,0,0,0.3)" style={{filter: 'blur(3px)'}} />
    <path d="M 0 0 C -10 -22, -44 -48, -44 -82 C -44 -108, -24 -126, 0 -126 C 24 -126, 44 -108, 44 -82 C 44 -48, 10 -22, 0 0 Z" fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth={2} />
    <circle cx={0} cy={-84} r={30} fill="#fff" />
    {kind === 'home' ? (
      <g fill={color}>
        <path d="M -17 -82 L 0 -98 L 17 -82 L 17 -66 L -17 -66 Z" />
        <rect x={-5} y={-76} width={10} height={10} fill="#fff" />
      </g>
    ) : (
      <g fill={color}>
        <rect x={-14} y={-104} width={28} height={38} rx={2} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={-9 + c * 11} y={-99 + r * 11} width={7} height={7} fill="#fff" />))}
      </g>
    )}
  </g>
);

const Poi: React.FC<{x: number; y: number; s: number; kind: 'P' | 'pharma' | 'fuel'}> = ({x, y, s, kind}) => {
  const col = kind === 'P' ? '#1E6BFF' : kind === 'pharma' ? '#18a058' : '#e8710a';
  const r = clamp(20 * s, 10, 30);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={col} stroke="#fff" strokeWidth={3} />
      {kind === 'P' && (
        <text y={r * 0.38} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={r * 1.1} fill="#fff">
          P
        </text>
      )}
      {kind === 'pharma' && <path d={`M ${-r * 0.45} 0 H ${r * 0.45} M 0 ${-r * 0.45} V ${r * 0.45}`} stroke="#fff" strokeWidth={r * 0.28} strokeLinecap="round" />}
      {kind === 'fuel' && <rect x={-r * 0.32} y={-r * 0.45} width={r * 0.64} height={r * 0.9} rx={r * 0.1} fill="#fff" />}
    </g>
  );
};

const Label: React.FC<{text: string; x: number; y: number; p: number}> = ({text, x, y, p}) => {
  if (p <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${clamp(p, 0, 1.2)})`,
        transformOrigin: '50% 100%',
        padding: '16px 30px',
        borderRadius: 26,
        background: '#ffffff',
        color: '#0B1E3F',
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: 50,
        whiteSpace: 'nowrap',
        boxShadow: '0 14px 34px rgba(11,30,63,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span style={{width: 18, height: 18, borderRadius: 9, background: '#2BD17E', display: 'inline-block'}} />
      {text}
    </div>
  );
};

const NavBanner: React.FC<{f: number}> = ({f}) => {
  const p = springy(f, C.vanStart - 4, 2.2, 0.6);
  if (f < C.vanStart - 4) return null;
  const out = prog(f, C.garage - 4, 6);
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        width: W - 80,
        top: 300,
        height: 140,
        borderRadius: 30,
        background: '#0F7B45',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        transform: `translateY(${(1 - clamp(p, 0, 1.1)) * -60}px)`,
        opacity: clamp(p * 2) * (1 - out),
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '0 34px',
        fontFamily: FONT.sans,
        color: '#fff',
      }}
    >
      <svg width={84} height={84} viewBox="0 0 84 84">
        <path d="M 26 70 L 26 40 C 26 30, 32 24, 42 24 L 58 24" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 50 12 L 64 24 L 50 36" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{lineHeight: 1.1}}>
        <div style={{fontWeight: 600, fontSize: 30, opacity: 0.85}}>Clean Moteur Mobile</div>
        <div style={{fontWeight: 800, fontSize: 52}}>En route vers vous</div>
      </div>
    </div>
  );
};

const Garage: React.FC<{f: number}> = ({f}) => {
  const pop = springy(f, C.garage, 2.2, 0.5);
  if (f < C.garage) return null;
  const strike = prog(f, C.garageStrike, 7, easeOut);
  const ring = prog(f, C.garageStrike - 6, 8, easeOut);
  const tA = prog(f, C.garage + 6, 12, easeOut);
  const tB = prog(f, C.garage + 10, 12, easeOut);
  const cx = 540;
  const cy = 860;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(5,11,24,0.84)', opacity: prog(f, C.garage - 4, 8)}} />
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${cx} ${cy}) scale(${clamp(pop, 0, 1.15)})`}>
          <rect x={-250} y={-170} width={500} height={360} rx={26} fill="#13274a" />
          <path d="M -270 -140 L 0 -270 L 270 -140 Z" fill="#1E6BFF" />
          <rect x={-150} y={-120} width={300} height={56} rx={12} fill="#ffffff" />
          <text x={0} y={-80} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={40} fill="#0B1E3F" letterSpacing={4}>
            GARAGE
          </text>
          <rect x={-190} y={-40} width={380} height={230} rx={10} fill="#dfe6f3" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={-176} y={-28 + i * 36} width={352} height={24} rx={4} fill="#b8c4da" />
          ))}
        </g>
        <DrawPath d={handEllipse(cx, cy - 20, 340, 330, 'gring', 1.08, 0.05)} p={ring} color="#E3262E" width={18} />
        <DrawPath d={handLine({x: cx - 250, y: cy + 230}, {x: cx + 250, y: cy - 270}, 'gstrike', 4)} p={strike} color="#E3262E" width={22} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 1270, width: W, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 900, color: '#fff', lineHeight: 1.05}}>
        <div style={{overflow: 'hidden', height: 96}}>
          <div style={{fontSize: 84, transform: `translateY(${(1 - tA) * 105}%)`}}>Plus besoin</div>
        </div>
        <div style={{overflow: 'hidden', height: 100}}>
          <div style={{fontSize: 74, transform: `translateY(${(1 - tB) * 105}%)`}}>
            d'aller au <span style={{color: '#FF3B43'}}>garage !</span>
          </div>
        </div>
      </div>
    </>
  );
};

// ---- the map ----
const MapLayer: React.FC<{f: number}> = ({f}) => {
  const cam = mapCam(f);
  const pr = (p: P, h = 0) => mapProject(p.x, p.y, f, h);
  // visible ground window (avoid projecting things behind the camera)
  const wx0 = cam.cx - 1500;
  const wx1 = cam.cx + 1500;
  const wy0 = cam.cy - 1900;
  const wy1 = cam.cy + 1000;
  const inWin = (p: P) => p.x > wx0 - 400 && p.x < wx1 + 400 && p.y > wy0 - 400 && p.y < wy1 + 300;
  const clipY = (a: P, b: P): [P, P] | null => {
    // clip a segment to y in [wy0, wy1]
    let A = a;
    let B = b;
    const lo = wy0;
    const hi = wy1;
    if ((A.y < lo && B.y < lo) || (A.y > hi && B.y > hi)) return null;
    const cut = (p: P, q: P, y: number): P => ({x: p.x + ((q.x - p.x) * (y - p.y)) / (q.y - p.y || 1e-6), y});
    if (A.y < lo) A = cut(A, B, lo);
    if (B.y < lo) B = cut(B, A, lo);
    if (A.y > hi) A = cut(A, B, hi);
    if (B.y > hi) B = cut(B, A, hi);
    return [A, B];
  };
  const roadPoly = (r: Road, extra: number) => {
    const seg = clipY(r.a, r.b);
    if (!seg) return null;
    const [a, b] = seg;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = (-(b.y - a.y) / len) * (r.w / 2 + extra);
    const ny = ((b.x - a.x) / len) * (r.w / 2 + extra);
    return poly([pr({x: a.x + nx, y: a.y + ny}), pr({x: b.x + nx, y: b.y + ny}), pr({x: b.x - nx, y: b.y - ny}), pr({x: a.x - nx, y: a.y - ny})]);
  };

  const ground = poly([pr({x: wx0, y: wy0}), pr({x: wx1, y: wy0}), pr({x: wx1, y: wy1}), pr({x: wx0, y: wy1})]);
  const river = [{x: -900, y: 1420}, {x: -300, y: 1250}, {x: 100, y: 1080}, {x: 500, y: 1100}, {x: 900, y: 820}, {x: 1500, y: 760}, {x: 2000, y: 600}];

  // route drawn up to the H2 drop
  const vl = vanLen(f);
  const leadL = Math.min(TOTAL, vl + 150 * prog(f, C.vanStart - 8, 8));
  const drop = routeAt(leadL);
  const routeVisible: P[] = [];
  if (f >= C.vanStart - 8) {
    for (let i = 0; i < ROUTE_PTS.length && CUM[i] <= leadL; i++) routeVisible.push(ROUTE_PTS[i]);
    routeVisible.push({x: drop.x, y: drop.y});
  }
  const routeD = routeVisible.length > 1 ? smoothPath(routeVisible.map((p) => pr(p))) : '';
  const van = routeAt(vl);
  const vanS = pr(van);
  const vanAhead = pr({x: van.x + Math.cos(van.ang) * 10, y: van.y + Math.sin(van.ang) * 10});
  const vanAng = Math.atan2(vanAhead.y - vanS.y, vanAhead.x - vanS.x);
  const dropS = pr(drop);
  const homeS = pr(HOME);
  const officeS = pr(OFFICE);
  const officePin = springy(f, C.office - 10, 2.4, 0.5);

  return (
    <>
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="mapFog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe3ea" />
            <stop offset="1" stopColor="#eef0f3" />
          </linearGradient>
        </defs>
        <rect width={W} height={1920} fill="url(#mapFog)" />
        <path d={ground} fill="#f1f3f4" />
        {/* parks + water */}
        {PARKS.map((p, i) => (inWin({x: p.x0, y: p.y1}) ? <path key={i} d={poly([pr({x: p.x0, y: p.y0}), pr({x: p.x1, y: p.y0}), pr({x: p.x1, y: p.y1}), pr({x: p.x0, y: p.y1})])} fill="#c9e7c4" /> : null))}
        <path d={smoothPath(river.filter((p) => p.y > wy0 - 200 && p.y < wy1 + 400).map((p) => pr(p)))} fill="none" stroke="#a9d3f5" strokeWidth={70 * pr({x: cam.cx, y: 1000}).s} strokeLinecap="round" />
        {/* roads: border then fill */}
        {ROADS.map((r, i) => {
          const d = roadPoly(r, 5);
          return d ? <path key={`rb${i}`} d={d} fill={r.major ? '#e9b949' : '#d6d9de'} /> : null;
        })}
        {ROADS.map((r, i) => {
          const d = roadPoly(r, 0);
          return d ? <path key={`rf${i}`} d={d} fill={r.major ? '#fde293' : '#ffffff'} /> : null;
        })}
        {/* trees */}
        {TREES.filter(inWin).map((t, i) => {
          const p = pr(t, 6);
          return <circle key={`t${i}`} cx={p.x} cy={p.y} r={clamp(13 * p.s, 4, 22)} fill="#9fd19a" stroke="#86c181" strokeWidth={1.5} />;
        })}
        {/* street names */}
        {NAMES.filter((n) => inWin(n.at)).map((n, i) => {
          const a = pr(n.at);
          const b = pr({x: n.at.x + n.along.x * 60, y: n.at.y + n.along.y * 60});
          let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          if (ang > 90) ang -= 180;
          if (ang < -90) ang += 180;
          const fs = clamp(24 * a.s, 14, 34);
          return (
            <text
              key={`n${i}`}
              x={a.x}
              y={a.y}
              transform={`rotate(${ang} ${a.x} ${a.y})`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Montserrat"
              fontWeight={600}
              fontSize={fs}
              fill="#5f6368"
              stroke="#ffffff"
              strokeWidth={fs * 0.28}
              paintOrder="stroke"
            >
              {n.name}
            </text>
          );
        })}
        {/* 3D buildings (far → near) */}
        {BUILDINGS.filter((b) => inWin({x: b.x0, y: b.y1})).map((b, i) => {
          const A = pr({x: b.x0, y: b.y1});
          const B = pr({x: b.x1, y: b.y1});
          const Cc = pr({x: b.x1, y: b.y0});
          const Dd = pr({x: b.x0, y: b.y0});
          const At = pr({x: b.x0, y: b.y1}, b.h);
          const Bt = pr({x: b.x1, y: b.y1}, b.h);
          const Ct = pr({x: b.x1, y: b.y0}, b.h);
          const Dt = pr({x: b.x0, y: b.y0}, b.h);
          return (
            <g key={`b${i}`} stroke="#c8ccd3" strokeWidth={1}>
              {b.x0 > cam.cx && <path d={poly([Dd, A, At, Dt])} fill="#dcdfe4" />}
              {b.x1 < cam.cx && <path d={poly([B, Cc, Ct, Bt])} fill="#dcdfe4" />}
              <path d={poly([A, B, Bt, At])} fill="#d2d6dc" />
              <path d={poly([At, Bt, Ct, Dt])} fill="#e8eaed" />
            </g>
          );
        })}
        {/* POIs */}
        {POIS.filter((p) => inWin(p.at)).map((p, i) => {
          const s = pr(p.at, 10);
          return <Poi key={`p${i}`} x={s.x} y={s.y} s={s.s} kind={p.kind} />;
        })}
        {/* route */}
        {routeD && (
          <>
            <path d={routeD} fill="none" stroke="#0b4fc4" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
            <path d={routeD} fill="none" stroke="#3d84ff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* pins */}
        {f >= C.pinDrop + 8 && <MapPin kind="home" x={homeS.x} y={homeS.y} scale={homeS.s * 1.25} color="#E3262E" />}
        {f >= C.office - 10 && <MapPin kind="office" x={officeS.x} y={officeS.y} scale={officeS.s * 1.25 * clamp(officePin, 0, 1.2)} color="#1E6BFF" />}
        {f >= C.vanStart - 2 && <VanTop x={vanS.x} y={vanS.y} ang={vanAng} s={vanS.s * 1.05} />}
      </svg>
      {f >= C.vanStart - 8 && f < C.office + 4 && <H2Drop x={dropS.x} y={dropS.y - 30} size={74} leaf={1} label={0.9} opacity={1 - prog(f, C.office, 4)} />}
      <div style={{opacity: 1 - prog(f, C.garage - 4, 6)}}>
        <Label text="À domicile" x={clamp(homeS.x, 230, 850)} y={homeS.y - 170 * homeS.s} p={springy(f, C.home, 2.4, 0.55)} />
        <Label text="Sur votre lieu de travail" x={clamp(officeS.x, 360, 540)} y={officeS.y - 175 * officeS.s} p={springy(f, C.office, 2.4, 0.55)} />
      </div>
      {/* top/bottom fades keep the white logo readable and blend with the rest of the film */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 330, background: 'linear-gradient(180deg, rgba(5,11,24,0.96) 0%, rgba(5,11,24,0.75) 55%, rgba(5,11,24,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: 260, background: 'linear-gradient(0deg, rgba(5,11,24,0.9), rgba(5,11,24,0))'}} />
      {/* re-centre button */}
      <div
        style={{
          position: 'absolute',
          left: 930,
          top: 1500,
          width: 96,
          height: 96,
          borderRadius: 48,
          background: '#fff',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: prog(f, C.vanStart, 8) * (1 - prog(f, C.garage - 4, 6)),
        }}
      >
        <svg width={44} height={44} viewBox="0 0 44 44">
          <path d="M 22 4 L 36 38 L 22 30 L 8 38 Z" fill="#1E6BFF" />
        </svg>
      </div>
      <NavBanner f={f} />
    </>
  );
};

export const S5Travel: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.travel - 2 || f > S.meca + 8) return null;
  const whip = prog(f, S.meca - 6, 9, easeIn);
  // map opens with an iris from the centre (where the notification becomes the pin)
  const iris = prog(f, C.mapDraw - 2, 16, easeOut);
  const R = iris * 1300;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${-whip * 1500}px)`,
        filter: whip > 0.02 ? `blur(${whip * 30}px)` : undefined,
      }}
    >
      <div style={{position: 'absolute', inset: 0, clipPath: `circle(${R.toFixed(1)}px at 540px 980px)`}}>
        <MapLayer f={f} />
      </div>
      {iris > 0 && iris < 1 && (
        <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
          <circle cx={540} cy={980} r={R} fill="none" stroke="#3d84ff" strokeWidth={8} opacity={1 - iris} style={{filter: 'drop-shadow(0 0 14px #3d84ff)'}} />
        </svg>
      )}
      <Garage f={f} />
    </div>
  );
};
