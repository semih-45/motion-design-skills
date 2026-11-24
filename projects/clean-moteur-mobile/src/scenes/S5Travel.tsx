// Scene 5 — "On se déplace": stylised top-down city plan, van following the H2 drop's glowing route,
// home + office stops, then the garage crossed out by hand.
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, lin, prog, springy} from '../lib/anim';
import {DrawPath} from '../components/Draw';
import {H2Drop} from '../components/H2Drop';
import {handEllipse, handLine, smoothPath} from '../lib/sketch';

type P = {x: number; y: number};

export const HOME: P = {x: 300, y: 640};
export const OFFICE: P = {x: 790, y: -230};
const START: P = {x: 600, y: 1500};

const ROUTE: P[] = [
  START,
  {x: 600, y: 1180},
  {x: 600, y: 930},
  {x: 300, y: 930},
  HOME,
  {x: 300, y: 330},
  {x: 790, y: 330},
  {x: 790, y: 60},
  OFFICE,
];

// Route sampled with rounded corners for smooth travel
const ROUTE_PTS: P[] = (() => {
  const out: P[] = [];
  const r = 70;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i];
    const b = ROUTE[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(2, Math.ceil(len / 20));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
    }
  }
  out.push(ROUTE[ROUTE.length - 1]);
  // smooth (moving average) to round the corners
  const sm: P[] = out.map((p, i) => {
    let sx = 0;
    let sy = 0;
    let c = 0;
    for (let k = -3; k <= 3; k++) {
      const q = out[Math.min(out.length - 1, Math.max(0, i + k))];
      sx += q.x;
      sy += q.y;
      c++;
    }
    return {x: sx / c, y: sy / c};
  });
  void r;
  return sm;
})();
const CUM: number[] = (() => {
  const c = [0];
  for (let i = 1; i < ROUTE_PTS.length; i++) c.push(c[i - 1] + Math.hypot(ROUTE_PTS[i].x - ROUTE_PTS[i - 1].x, ROUTE_PTS[i].y - ROUTE_PTS[i - 1].y));
  return c;
})();
const TOTAL = CUM[CUM.length - 1];
const lenAt = (pt: P) => {
  let best = 0;
  let bd = 1e9;
  ROUTE_PTS.forEach((p, i) => {
    const d = Math.hypot(p.x - pt.x, p.y - pt.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return CUM[best];
};
const HOME_L = lenAt(HOME);
const routeAt = (l: number) => {
  const L = clamp(l, 0, TOTAL);
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < L) i++;
  const t = (L - CUM[i - 1]) / Math.max(1e-6, CUM[i] - CUM[i - 1]);
  const a = ROUTE_PTS[i - 1];
  const b = ROUTE_PTS[i];
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x)};
};

/** Van progress along the route (in route length units). */
const vanLen = (f: number) => {
  const toHome = prog(f, C.vanStart, C.home - C.vanStart, easeInOut) * HOME_L;
  const toOffice = prog(f, C.home + 2, C.office - C.home - 2, easeInOut) * (TOTAL - HOME_L);
  return toHome + toOffice;
};

// ---- camera / projection of the ground plane ----
export const mapCam = (f: number) => {
  const tilt = lerp(8, 46, prog(f, S.travel, 40, easeInOut));
  const v = routeAt(vanLen(f));
  const cy = lerp(1000, 300, prog(f, C.vanStart - 6, C.office - C.vanStart + 6, easeInOut)) * 0.7 + v.y * 0.3;
  const cx = 540 + (v.x - 540) * 0.25;
  const zoom = lerp(1.25, 1.0, prog(f, S.travel, 30, easeOut));
  return {tilt: (tilt * Math.PI) / 180, cx, cy, zoom};
};

export const mapProject = (gx: number, gy: number, f: number) => {
  const cam = mapCam(f);
  const D = 1500;
  const dx = gx - cam.cx;
  const dy = gy - cam.cy;
  const X = dx;
  const Y = dy * Math.cos(cam.tilt);
  const Z = D - dy * Math.sin(cam.tilt);
  const s = (D / Math.max(200, Z)) * cam.zoom;
  return {x: 540 + X * s, y: 1000 + Y * s, s};
};

// ---- city geometry ----
const VX = [-260, 40, 300, 600, 790, 1100, 1350];
const HY = [-700, -420, -230, 60, 330, 640, 930, 1180, 1500, 1800];
const STREETS: {a: P; b: P; major: boolean; seed: number}[] = [];
VX.forEach((x, i) => STREETS.push({a: {x, y: -900}, b: {x, y: 2000}, major: i % 2 === 0, seed: i}));
HY.forEach((y, i) => STREETS.push({a: {x: -500, y}, b: {x: 1600, y}, major: i % 3 === 0, seed: 20 + i}));
STREETS.push({a: {x: -500, y: 1650}, b: {x: 1600, y: -450}, major: true, seed: 40});
const BLOCKS: {x: number; y: number; w: number; h: number; kind: number}[] = [];
for (let i = 0; i < VX.length - 1; i++)
  for (let j = 0; j < HY.length - 1; j++) {
    const k = random(`blk${i}-${j}`);
    BLOCKS.push({x: VX[i] + 22, y: HY[j] + 22, w: VX[i + 1] - VX[i] - 44, h: HY[j + 1] - HY[j] - 44, kind: k < 0.12 ? 2 : k < 0.6 ? 1 : 0});
  }

const quad = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

const VanTop: React.FC<{x: number; y: number; ang: number; s: number}> = ({x, y, ang, s}) => (
  <g transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI + 90}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={40} ry={78} fill="rgba(0,0,0,0.45)" style={{filter: 'blur(6px)'}} />
    <rect x={-34} y={-70} width={68} height={140} rx={14} fill="#f4f6fa" />
    <rect x={-30} y={-66} width={60} height={30} rx={10} fill="#1b2a44" />
    <rect x={-30} y={-30} width={60} height={92} rx={6} fill="#ffffff" />
    <rect x={-30} y={-10} width={60} height={10} fill="#E3262E" />
    <rect x={-30} y={2} width={60} height={6} fill="#1E6BFF" />
    <text x={0} y={36} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={15} fill="#0B1E3F" transform="rotate(-90 0 30)">
      CMM
    </text>
    <rect x={-38} y={-52} width={6} height={12} rx={3} fill="#cfd6e2" />
    <rect x={32} y={-52} width={6} height={12} rx={3} fill="#cfd6e2" />
    <circle cx={-22} cy={-72} r={4} fill="#fff7c2" />
    <circle cx={22} cy={-72} r={4} fill="#fff7c2" />
  </g>
);

const PinIcon: React.FC<{kind: 'home' | 'office'; x: number; y: number; scale: number; color: string}> = ({kind, x, y, scale, color}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={0} cy={4} rx={26} ry={9} fill="rgba(0,0,0,0.45)" style={{filter: 'blur(3px)'}} />
    <path d="M 0 0 C -10 -22, -44 -48, -44 -82 C -44 -108, -24 -126, 0 -126 C 24 -126, 44 -108, 44 -82 C 44 -48, 10 -22, 0 0 Z" fill={color} />
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
        boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
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
      <div style={{position: 'absolute', inset: 0, background: 'rgba(5,11,24,0.6)', opacity: prog(f, C.garage - 4, 8)}} />
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${cx} ${cy}) scale(${clamp(pop, 0, 1.15)})`}>
          {/* garage building, flat style */}
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

export const S5Travel: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.travel - 2 || f > S.meca + 8) return null;
  const whip = prog(f, S.meca - 6, 9, easeIn);
  const draw = prog(f, C.mapDraw, 24, easeOut);
  const pr = (p: P) => mapProject(p.x, p.y, f);

  const vl = vanLen(f);
  const van = routeAt(vl);
  const leadL = Math.min(TOTAL, vl + 150 * prog(f, C.vanStart - 8, 8));
  const drop = routeAt(leadL);
  // route drawn up to the drop
  const routeVisible: P[] = [];
  if (f >= C.vanStart - 8) {
    for (let i = 0; i < ROUTE_PTS.length && CUM[i] <= leadL; i++) routeVisible.push(ROUTE_PTS[i]);
    routeVisible.push({x: drop.x, y: drop.y});
  }
  const routeScreen = routeVisible.map(pr);
  const vanS = pr(van);
  const vanAhead = pr({x: van.x + Math.cos(van.ang) * 10, y: van.y + Math.sin(van.ang) * 10});
  const vanAng = Math.atan2(vanAhead.y - vanS.y, vanAhead.x - vanS.x);
  const dropS = pr(drop);
  const homeS = pr(HOME);
  const officeS = pr(OFFICE);
  const pinIn = f >= C.pinDrop + 8;
  const officePin = springy(f, C.office - 10, 2.4, 0.5);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${-whip * 1500}px)`,
        filter: whip > 0.02 ? `blur(${whip * 30}px)` : undefined,
        opacity: prog(f, S.travel - 2, 6),
      }}
    >
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        {/* blocks */}
        {BLOCKS.map((b, i) => {
          const pts = [pr({x: b.x, y: b.y}), pr({x: b.x + b.w, y: b.y}), pr({x: b.x + b.w, y: b.y + b.h}), pr({x: b.x, y: b.y + b.h})];
          const o = prog(f, C.mapDraw + 6 + (i % 7), 12);
          const fill = b.kind === 2 ? 'rgba(43,209,126,0.10)' : b.kind === 1 ? 'rgba(30,107,255,0.10)' : 'rgba(30,107,255,0.05)';
          return <path key={i} d={quad(pts)} fill={fill} stroke="rgba(110,160,255,0.16)" strokeWidth={1.5} opacity={o} />;
        })}
        {/* streets */}
        {STREETS.map((st, i) => {
          const a = pr(st.a);
          const b = pr(st.b);
          const p = prog(f, C.mapDraw + (i % 8) * 1.5, 18, easeOut);
          return (
            <DrawPath
              key={i}
              d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              p={draw > 0 ? p : 0}
              color={st.major ? 'rgba(160,195,255,0.55)' : 'rgba(160,195,255,0.28)'}
              width={st.major ? 5 : 2.5}
            />
          );
        })}
        {/* river */}
        <DrawPath
          d={smoothPath([{x: -400, y: 1350}, {x: 100, y: 1080}, {x: 500, y: 1100}, {x: 900, y: 820}, {x: 1500, y: 760}].map(pr))}
          p={prog(f, C.mapDraw + 4, 26)}
          color="rgba(30,107,255,0.35)"
          width={30}
        />
        {/* route glow */}
        {routeScreen.length > 1 && (
          <>
            <path d={smoothPath(routeScreen)} fill="none" stroke="#2BD17E" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.25} style={{filter: 'blur(8px)'}} />
            <path d={smoothPath(routeScreen)} fill="none" stroke="#2BD17E" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <path d={smoothPath(routeScreen)} fill="none" stroke="#d9ffe9" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 18" strokeDashoffset={-f * 3} />
          </>
        )}
        {/* pins */}
        {pinIn && <PinIcon kind="home" x={homeS.x} y={homeS.y} scale={homeS.s * 1.25} color="#E3262E" />}
        {f >= C.office - 10 && <PinIcon kind="office" x={officeS.x} y={officeS.y} scale={officeS.s * 1.25 * clamp(officePin, 0, 1.2)} color="#1E6BFF" />}
        {/* van */}
        {f >= C.vanStart - 2 && <VanTop x={vanS.x} y={vanS.y} ang={vanAng - Math.PI / 2 + Math.PI / 2} s={vanS.s * 1.05} />}
      </svg>
      {/* the H2 drop leads the way */}
      {f >= C.vanStart - 8 && f < C.office + 4 && (
        <H2Drop x={dropS.x} y={dropS.y - 30} size={70} leaf={1} label={0.9} opacity={1 - prog(f, C.office, 4)} />
      )}
      <div style={{opacity: 1 - prog(f, C.garage - 4, 6)}}>
        <Label text="À domicile" x={clamp(homeS.x, 230, 850)} y={homeS.y - 170 * homeS.s} p={springy(f, C.home, 2.4, 0.55)} />
        <Label text="Sur votre lieu de travail" x={clamp(officeS.x, 360, 720)} y={officeS.y - 175 * officeS.s} p={springy(f, C.office, 2.4, 0.55)} />
      </div>
      <Garage f={f} />
    </div>
  );
};

export const _u = [lin, handLine];
