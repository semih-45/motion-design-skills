// Scene 5 — "On se déplace": navigation-app view of the real centre of Orléans
// (OpenStreetMap data, see map-src/build_orleans.py). The van follows the H2 drop over the Pont George V,
// up Rue Royale, along Rue Jeanne-d'Arc ("À domicile") to Bd Alexandre-Martin ("Sur votre lieu de travail").
// Then the garage gets crossed out.
import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, S, W, H} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, prog, springy} from '../lib/anim';
import {DrawPath} from '../components/Draw';
import {H2Drop} from '../components/H2Drop';
import {handEllipse, handLine, smoothPath} from '../lib/sketch';
import ORL from '../data/orleans.json';

type P = {x: number; y: number};
type Pt = [number, number];
const D = ORL as unknown as {
  roads: {c: string; w: number; n: string; p: Pt[]}[];
  buildings: {h: number; p: Pt[]}[];
  water: {closed: boolean; p: Pt[]}[];
  parks: Pt[][];
  route: Pt[];
  routeLen: number;
  homeLen: number;
  start: Pt;
  home: Pt;
  office: Pt;
  labels: {n: string; x: number; y: number; dx: number; dy: number}[];
  places: {n: string; x: number; y: number}[];
  landmarks: {name: string; x: number; y: number}[];
};

export const HOME: P = {x: D.home[0], y: D.home[1]};
export const OFFICE: P = {x: D.office[0], y: D.office[1]};

// ---- route helpers (metres) ----
const ROUTE: P[] = D.route.map(([x, y]) => ({x, y}));
const CUM: number[] = (() => {
  const c = [0];
  for (let i = 1; i < ROUTE.length; i++) c.push(c[i - 1] + Math.hypot(ROUTE[i].x - ROUTE[i - 1].x, ROUTE[i].y - ROUTE[i - 1].y));
  return c;
})();
const TOTAL = CUM[CUM.length - 1];
// distance along the route of the point closest to HOME (projected on segments, not just vertices)
const HOME_L = (() => {
  let best = 0;
  let bd = 1e9;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i];
    const b = ROUTE[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const L2 = vx * vx + vy * vy || 1e-9;
    const t = clamp(((HOME.x - a.x) * vx + (HOME.y - a.y) * vy) / L2);
    const d = Math.hypot(a.x + vx * t - HOME.x, a.y + vy * t - HOME.y);
    if (d < bd) {
      bd = d;
      best = CUM[i] + Math.sqrt(L2) * t;
    }
  }
  return best;
})();
const routeAt = (l: number) => {
  const L = clamp(l, 0, TOTAL);
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < L) i++;
  const t = (L - CUM[i - 1]) / Math.max(1e-6, CUM[i] - CUM[i - 1]);
  const a = ROUTE[i - 1];
  const b = ROUTE[i];
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x)};
};
const vanLen = (f: number) =>
  prog(f, C.vanStart, C.home - C.vanStart, easeInOut) * HOME_L + prog(f, C.home + 2, C.office - C.home - 2, easeInOut) * (TOTAL - HOME_L);

// ---- camera: overview (pin drop) → navigation follow ----
export const mapCam = (f: number) => {
  const follow = prog(f, C.vanStart - 4, 18, easeInOut);
  const v = routeAt(vanLen(f) + 90);
  // smooth the follow point by averaging a little ahead/behind
  const v2 = routeAt(vanLen(f) + 220);
  const fx = (v.x + v2.x) / 2;
  const fy = (v.y + v2.y) / 2 + 60;
  const ov = {cx: (D.start[0] + HOME.x) / 2 + 40, cy: (D.start[1] + HOME.y) / 2 + 20};
  const arrive = prog(f, C.office - 6, 12, easeInOut);
  return {
    cx: lerp(ov.cx, fx, follow),
    cy: lerp(ov.cy, fy, follow),
    zoom: lerp(0.78, 1.55, follow) + 0.25 * arrive,
    tilt: (lerp(22, 50, follow) * Math.PI) / 180,
  };
};

const DIST = 1500;
const SCREEN_CY = 1010;
export const mapProject = (gx: number, gy: number, f: number, h = 0) => projectWith(mapCam(f), gx, gy, h);
const projectWith = (cam: ReturnType<typeof mapCam>, gx: number, gy: number, h = 0) => {
  const dx = gx - cam.cx;
  const dy = gy - cam.cy;
  const Y = dy * Math.cos(cam.tilt) - h * Math.sin(cam.tilt);
  const Z = DIST - dy * Math.sin(cam.tilt) - h * Math.cos(cam.tilt);
  const s = (DIST / Math.max(220, Z)) * cam.zoom;
  return {x: 540 + dx * s, y: SCREEN_CY + Y * s, s};
};

// ---- static preprocessing ----
const BLD = D.buildings
  .map((b) => {
    const n = b.p.length;
    let a2 = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = b.p[i];
      const [x1, y1] = b.p[(i + 1) % n];
      a2 += x0 * y1 - x1 * y0;
      cx += x0;
      cy += y0;
    }
    return {...b, cx: cx / n, cy: cy / n, ccw: a2 > 0, maxY: Math.max(...b.p.map((q) => q[1]))};
  })
  .sort((p, q) => p.maxY - q.maxY);
const ROAD_STYLE: Record<string, {fill: string; casing: string; order: number}> = {
  service: {fill: '#ffffff', casing: '#dfe2e6', order: 0},
  ped: {fill: '#f7f7f5', casing: '#e2e2df', order: 1},
  minor: {fill: '#ffffff', casing: '#d5d9de', order: 2},
  medium: {fill: '#ffffff', casing: '#c9ced6', order: 3},
  major: {fill: '#fde293', casing: '#e8b84a', order: 4},
};
const ROADS = [...D.roads].sort((a, b) => ROAD_STYLE[a.c].order - ROAD_STYLE[b.c].order);

const drawMap = (g: CanvasRenderingContext2D, f: number) => {
  const cam = mapCam(f);
  const pr = (x: number, y: number, h = 0) => projectWith(cam, x, y, h);
  // visible ground window (metres)
  const span = 1150 / cam.zoom;
  const wx0 = cam.cx - span * 0.75;
  const wx1 = cam.cx + span * 0.75;
  const wy0 = cam.cy - span * 1.9;
  const wy1 = cam.cy + span * 0.95;
  const vis = (x: number, y: number, m = 0) => x > wx0 - m && x < wx1 + m && y > wy0 - m && y < wy1 + m;

  // sky / haze then land
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#dfe4ec');
  sky.addColorStop(1, '#eef0f3');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const corner = [pr(wx0 - 600, wy0 - 400), pr(wx1 + 600, wy0 - 400), pr(wx1 + 600, wy1 + 200), pr(wx0 - 600, wy1 + 200)];
  g.fillStyle = '#f1f3f4';
  g.beginPath();
  corner.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
  g.fill();

  const fillPoly = (pts: Pt[], color: string, h = 0) => {
    g.beginPath();
    pts.forEach(([x, y], i) => {
      const p = pr(x, y, h);
      if (i) g.lineTo(p.x, p.y);
      else g.moveTo(p.x, p.y);
    });
    g.closePath();
    g.fillStyle = color;
    g.fill();
  };
  // parks, water
  for (const p of D.parks) if (p.some(([x, y]) => vis(x, y, 200))) fillPoly(p, '#c8e6c0');
  for (const w of D.water) if (w.closed) fillPoly(w.p, '#a8d3f4');

  // roads: casing pass then fill pass, width follows perspective scale
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const pass of [0, 1]) {
    for (const r of ROADS) {
      const st = ROAD_STYLE[r.c];
      for (let i = 0; i < r.p.length - 1; i++) {
        const [x0, y0] = r.p[i];
        const [x1, y1] = r.p[i + 1];
        if (!vis(x0, y0, 80) && !vis(x1, y1, 80)) continue;
        const a = pr(x0, y0);
        const b = pr(x1, y1);
        const s = (a.s + b.s) / 2;
        g.strokeStyle = pass ? st.fill : st.casing;
        g.lineWidth = Math.max(1, (r.w + (pass ? 0 : 3)) * s);
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
    }
  }

  // 3D buildings, far → near. Only walls facing the camera are drawn.
  const camGy = cam.cy + DIST * Math.sin(cam.tilt);
  g.lineWidth = 1;
  for (const b of BLD) {
    if (!vis(b.cx, b.cy, 30)) continue;
    const n = b.p.length;
    const top = b.p.map(([x, y]) => pr(x, y, b.h));
    for (let i = 0; i < n; i++) {
      const [x0, y0] = b.p[i];
      const [x1, y1] = b.p[(i + 1) % n];
      // outward normal (depends on ring orientation; y axis points south)
      let nx = y1 - y0;
      let ny = -(x1 - x0);
      if (b.ccw) {
        nx = -nx;
        ny = -ny;
      }
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      if (nx * (cam.cx - mx) + ny * (camGy - my) <= 0) continue;
      const len = Math.hypot(nx, ny) || 1;
      const light = 0.5 + 0.5 * ((-nx / len) * 0.6 + (ny / len) * 0.8);
      const c = Math.round(196 + 30 * light);
      const p0 = pr(x0, y0);
      const p1 = pr(x1, y1);
      g.beginPath();
      g.moveTo(p0.x, p0.y);
      g.lineTo(p1.x, p1.y);
      g.lineTo(top[(i + 1) % n].x, top[(i + 1) % n].y);
      g.lineTo(top[i].x, top[i].y);
      g.closePath();
      g.fillStyle = `rgb(${c - 6},${c - 3},${c + 2})`;
      g.fill();
    }
    g.beginPath();
    top.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
    g.fillStyle = b.h > 40 ? '#ece6da' : '#e9ebee';
    g.fill();
    g.strokeStyle = '#cfd3d9';
    g.stroke();
  }

  // street names (with halo), along the street
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const l of D.labels) {
    if (!vis(l.x, l.y, 0)) continue;
    const a = pr(l.x, l.y);
    const b = pr(l.x + l.dx * 30, l.y + l.dy * 30);
    let ang = Math.atan2(b.y - a.y, b.x - a.x);
    if (ang > Math.PI / 2) ang -= Math.PI;
    if (ang < -Math.PI / 2) ang += Math.PI;
    const fs = clamp(15 * a.s, 19, 34);
    g.save();
    g.translate(a.x, a.y);
    g.rotate(ang);
    g.font = `600 ${fs}px Montserrat`;
    g.lineWidth = fs * 0.3;
    g.strokeStyle = '#ffffff';
    g.strokeText(l.n, 0, 0);
    g.fillStyle = '#5f6368';
    g.fillText(l.n, 0, 0);
    g.restore();
  }

  // place names
  for (const pl of D.places) {
    if (!vis(pl.x, pl.y, 0)) continue;
    const p = pr(pl.x, pl.y, 4);
    const water = pl.n === 'La Loire';
    const fs = clamp((water ? 20 : 15) * p.s, 22, 46);
    g.font = `${water ? 'italic 700' : '700'} ${fs}px Montserrat`;
    g.lineWidth = fs * 0.3;
    g.strokeStyle = water ? 'rgba(255,255,255,0.7)' : '#ffffff';
    g.strokeText(pl.n, p.x, p.y);
    g.fillStyle = water ? '#2f78c4' : '#3c4043';
    g.fillText(pl.n, p.x, p.y);
  }
  for (const lm of D.landmarks) {
    if (!vis(lm.x, lm.y, 0)) continue;
    const p = pr(lm.x, lm.y, 52);
    const r = clamp(13 * p.s, 12, 26);
    g.fillStyle = '#7b61c4';
    g.beginPath();
    g.arc(p.x, p.y - r * 1.6, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.fillRect(p.x - r * 0.12, p.y - r * 2.15, r * 0.24, r * 1.1);
    g.fillRect(p.x - r * 0.42, p.y - r * 1.85, r * 0.84, r * 0.22);
    const fs = clamp(15 * p.s, 20, 34);
    g.font = `700 ${fs}px Montserrat`;
    g.lineWidth = fs * 0.3;
    g.strokeStyle = '#ffffff';
    g.strokeText(lm.name, p.x, p.y + r * 0.2);
    g.fillStyle = '#5b3fa8';
    g.fillText(lm.name, p.x, p.y + r * 0.2);
  }
};

const MapCanvas: React.FC<{f: number}> = ({f}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    drawMap(c.getContext('2d')!, f);
  }, [f]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H}} />;
};

// ---- overlay pieces ----
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

const Label: React.FC<{text: string; sub: string; x: number; y: number; p: number}> = ({text, sub, x, y, p}) => {
  if (p <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${clamp(p, 0, 1.2)})`,
        transformOrigin: '50% 100%',
        padding: '16px 30px 18px',
        borderRadius: 26,
        background: '#ffffff',
        color: '#0B1E3F',
        fontFamily: FONT.sans,
        whiteSpace: 'nowrap',
        boxShadow: '0 14px 34px rgba(11,30,63,0.35)',
        lineHeight: 1.1,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800, fontSize: 50}}>
        <span style={{width: 18, height: 18, borderRadius: 9, background: '#2BD17E', display: 'inline-block'}} />
        {text}
      </div>
      <div style={{fontWeight: 600, fontSize: 30, color: '#5f6368', marginTop: 6, paddingLeft: 32}}>{sub}</div>
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
        <path d="M 42 74 L 42 22" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
        <path d="M 26 36 L 42 20 L 58 36" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{lineHeight: 1.1}}>
        <div style={{fontWeight: 600, fontSize: 30, opacity: 0.85}}>Clean Moteur Mobile · Orléans</div>
        <div style={{fontWeight: 800, fontSize: 52}}>En route vers vous</div>
      </div>
    </div>
  );
};

const CityTitle: React.FC<{f: number}> = ({f}) => {
  const a = prog(f, C.mapDraw + 2, 10, easeOut) * (1 - prog(f, C.vanStart + 2, 8, easeIn));
  if (a <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: W,
        top: 640,
        textAlign: 'center',
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: 120,
        letterSpacing: -2,
        color: '#0B1E3F',
        opacity: a,
        transform: `scale(${lerp(1.1, 1, a)})`,
        textShadow: '0 0 18px #fff, 0 0 30px #fff, 0 0 4px #fff',
      }}
    >
      Orléans
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

const Overlays: React.FC<{f: number}> = ({f}) => {
  const cam = mapCam(f);
  const pr = (p: P, h = 0) => projectWith(cam, p.x, p.y, h);
  const vl = vanLen(f);
  const leadL = Math.min(TOTAL, vl + 110 * prog(f, C.vanStart - 8, 8));
  const drop = routeAt(leadL);
  const routeVisible: P[] = [];
  if (f >= C.vanStart - 8) {
    for (let i = 0; i < ROUTE.length && CUM[i] <= leadL; i++) routeVisible.push(ROUTE[i]);
    routeVisible.push({x: drop.x, y: drop.y});
  }
  const routeD = routeVisible.length > 1 ? smoothPath(routeVisible.map((p) => pr(p))) : '';
  const van = routeAt(vl);
  const vanS = pr(van);
  const vanAhead = pr({x: van.x + Math.cos(van.ang) * 6, y: van.y + Math.sin(van.ang) * 6});
  const vanAng = Math.atan2(vanAhead.y - vanS.y, vanAhead.x - vanS.x);
  const dropS = pr(drop);
  const homeS = pr(HOME);
  const officeS = pr(OFFICE);
  const officePin = springy(f, C.office - 10, 2.4, 0.5);
  const pinScale = (s: number) => clamp(s * 0.9, 0.6, 1.5);
  return (
    <>
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        {routeD && (
          <>
            <path d={routeD} fill="none" stroke="#0b4fc4" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
            <path d={routeD} fill="none" stroke="#3d84ff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {f >= C.pinDrop + 8 && <MapPin kind="home" x={homeS.x} y={homeS.y} scale={pinScale(homeS.s)} color="#E3262E" />}
        {f >= C.office - 10 && <MapPin kind="office" x={officeS.x} y={officeS.y} scale={pinScale(officeS.s) * clamp(officePin, 0, 1.2)} color="#1E6BFF" />}
        {f >= C.vanStart - 2 && <VanTop x={vanS.x} y={vanS.y} ang={vanAng} s={clamp(vanS.s * 0.42, 0.45, 0.9)} />}
      </svg>
      {f >= C.vanStart - 8 && f < C.office + 4 && <H2Drop x={dropS.x} y={dropS.y - 30} size={74} leaf={1} label={0.9} opacity={1 - prog(f, C.office, 4)} />}
      <div style={{opacity: 1 - prog(f, C.garage - 4, 6)}}>
        <Label text="À domicile" sub="Rue Jeanne-d'Arc, Orléans" x={clamp(homeS.x, 330, 750)} y={homeS.y - 150 * pinScale(homeS.s)} p={springy(f, C.home, 2.4, 0.55)} />
        <Label text="Sur votre lieu de travail" sub="Bd Alexandre-Martin, Orléans" x={clamp(officeS.x, 360, 720)} y={officeS.y - 150 * pinScale(officeS.s)} p={springy(f, C.office, 2.4, 0.55)} />
      </div>
    </>
  );
};

export const S5Travel: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.travel - 2 || f > S.meca + 8) return null;
  const whip = prog(f, S.meca - 6, 9, easeIn);
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
        <MapCanvas f={f} />
        <Overlays f={f} />
        <CityTitle f={f} />
        {/* fades keep the white logo readable and blend into the rest of the film */}
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 330, background: 'linear-gradient(180deg, rgba(5,11,24,0.96) 0%, rgba(5,11,24,0.75) 55%, rgba(5,11,24,0) 100%)'}} />
        <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: 260, background: 'linear-gradient(0deg, rgba(5,11,24,0.9), rgba(5,11,24,0))'}} />
        <div style={{position: 'absolute', left: 40, top: 1612, fontFamily: FONT.sans, fontWeight: 500, fontSize: 20, color: 'rgba(255,255,255,0.7)'}}>
          Carte © OpenStreetMap contributors
        </div>
        <NavBanner f={f} />
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

export const _u = easeOut;
