// Scene 4 — 2D layer for the chat: H2 drop → message bubble morph (match cut), marker notes,
// and the notification that turns into the map pin.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, lin, prog, springy} from '../lib/anim';
import {FIRST_BUBBLE, projectChatPoint} from '../three/rig2';
import {LAYOUT} from '../three/chat';
import {DROP_CENTER} from './DropGuide';
import {arrowHead, handCurve, handEllipse} from '../lib/sketch';
import {DrawPath, HandText} from '../components/Draw';
import {HOME, mapProject} from './S5Travel';

const N = 120;

/** Teardrop outline (tip up) around (0,0), unit height ~1.1 → polar samples. */
const dropPoints = (cx: number, cy: number, size: number) => {
  const pts: {x: number; y: number}[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const x = Math.sin(t) * Math.pow(Math.sin(t / 2), 1.2) * 0.8;
    const y = -Math.cos(t);
    pts.push({x: cx + x * size * 0.5, y: cy + (y + 0.22) * size * 0.5});
  }
  return pts;
};

/** Rounded-rect outline, sampled by the same polar angles as the drop points. */
const rectPoints = (drop: {x: number; y: number}[], cx: number, cy: number, x0: number, y0: number, x1: number, y1: number, r: number) =>
  drop.map((p) => {
    const ang = Math.atan2(p.y - cy, p.x - cx);
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    // ray-box intersection from (cx,cy)
    const tx = dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity;
    const ty = dy > 0 ? (y1 - cy) / dy : dy < 0 ? (y0 - cy) / dy : Infinity;
    let t = Math.min(tx, ty);
    let x = cx + dx * t;
    let y = cy + dy * t;
    // round the corners
    const ix = clamp(x, x0 + r, x1 - r);
    const iy = clamp(y, y0 + r, y1 - r);
    if (ix !== x && iy !== y) {
      const ccx = ix;
      const ccy = iy;
      // intersect ray with corner circle
      const ox = cx - ccx;
      const oy = cy - ccy;
      const b = ox * dx + oy * dy;
      const c = ox * ox + oy * oy - r * r;
      const disc = b * b - c;
      if (disc >= 0) {
        t = -b + Math.sqrt(disc);
        x = cx + dx * t;
        y = cy + dy * t;
      }
    }
    return {x, y};
  });

const polyPath = (pts: {x: number; y: number}[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

const bubbleRect = (f: number) => {
  const a = projectChatPoint(FIRST_BUBBLE.x, FIRST_BUBBLE.y, f);
  const b = projectChatPoint(FIRST_BUBBLE.x + FIRST_BUBBLE.w, FIRST_BUBBLE.y + FIRST_BUBBLE.h, f);
  return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
};

const DropToBubble: React.FC<{f: number}> = ({f}) => {
  const t0 = C.dropOut + 12;
  const t1 = C.phoneReveal;
  if (f < t0 || f > t1 + 8) return null;
  const m = prog(f, t0, t1 - t0, easeInOut);
  const rect = bubbleRect(Math.max(f, t1));
  const cx = lerp(DROP_CENTER.x, (rect.x0 + rect.x1) / 2, m);
  const cy = lerp(DROP_CENTER.y, (rect.y0 + rect.y1) / 2, m);
  const drop = dropPoints(cx, cy, 380);
  const box = rectPoints(drop, cx, cy, rect.x0, rect.y0, rect.x1, rect.y1, ((rect.x1 - rect.x0) / FIRST_BUBBLE.w) * 18);
  const pts = drop.map((p, i) => ({x: lerp(p.x, box[i].x, m), y: lerp(p.y, box[i].y, m)}));
  const fade = 1 - prog(f, t1 + 1, 6);
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0, opacity: fade}}>
      <defs>
        <linearGradient id="bubG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c875" />
          <stop offset="100%" stopColor="#109a58" />
        </linearGradient>
      </defs>
      <path d={polyPath(pts)} fill="url(#bubG)" style={{filter: `drop-shadow(0 0 ${40 * (1 - m) + 10}px rgba(43,209,126,0.7))`}} />
      <text x={cx} y={cy + 40} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={120} fill="#fff" opacity={1 - prog(f, t0, 6)}>
        H₂
      </text>
    </svg>
  );
};

const Notes: React.FC<{f: number}> = ({f}) => {
  if (f < C.quote + 4 || f > C.notif + 6) return null;
  const out = prog(f, C.notif, 6);
  const card = LAYOUT.quote;
  const tgt = projectChatPoint(card.x - 2, card.y + card.h * 0.45, f);
  const start = {x: 70, y: 1430};
  const curve = handCurve(start, {x: tgt.x - 12, y: tgt.y + 10}, 'qa', -0.22, 2);
  const pA = prog(f, C.quote + 6, 9, easeOut);
  const pill = projectChatPoint(card.x + 80, card.y + 80, f);
  const pR = prog(f, C.quoteOk + 2, 9, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <DrawPath d={curve.d} p={pA} color="#fff" width={5} />
        <DrawPath d={arrowHead(curve.before, curve.end, 24, 'qah')} p={prog(f, C.quote + 14, 3)} color="#fff" width={5} />
        <DrawPath d={handEllipse(pill.x, pill.y, 125, 44, 'okc', 1.15, -0.05)} p={pR} color="#ffffff" width={6} />
      </svg>
      <HandText text="votre devis" p={prog(f, C.quote + 4, 9)} x={44} y={1490} size={68} color="#fff" rotate={-4} />
    </div>
  );
};

const Notification: React.FC<{f: number}> = ({f}) => {
  if (f < C.notif || f > C.pinDrop + 10) return null;
  const inP = springy(f, C.notif, 2.0, 0.55);
  const morph = prog(f, C.notif + 10, 8, easeInOut); // card → red circle
  const fall = prog(f, C.notif + 16, C.pinDrop + 8 - (C.notif + 16), easeIn);
  const home = mapProject(HOME.x, HOME.y, C.pinDrop + 8);
  const w = lerp(900, 120, morph);
  const h = lerp(168, 120, morph);
  const x = lerp(540, home.x, fall);
  const y = lerp(lerp(330, 450, clamp(inP, 0, 1.1)), home.y - 84 * home.s * 1.25, fall);
  const tipO = prog(f, C.notif + 14, 4);
  const sc = lerp(1, home.s * 1.25 * (60 / 60), fall);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${sc})`, opacity: prog(f, C.notif, 4)}}>
      {/* pin tip */}
      <div
        style={{
          position: 'absolute',
          left: -30,
          top: 18,
          width: 60,
          height: 60,
          background: '#E3262E',
          transform: 'rotate(45deg)',
          borderRadius: 8,
          opacity: tipO,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h / 2,
          borderRadius: lerp(40, 60, morph),
          background: morph > 0 ? `rgba(${Math.round(lerp(245, 227, morph))},${Math.round(lerp(248, 38, morph))},${Math.round(lerp(252, 46, morph))},${lerp(0.95, 1, morph)})` : 'rgba(245,248,252,0.95)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{opacity: 1 - prog(f, C.notif + 8, 5), display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', width: 900, flexShrink: 0}}>
          <div style={{width: 92, height: 92, borderRadius: 24, background: 'linear-gradient(135deg,#22c875,#109a58)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <svg width={54} height={54} viewBox="0 0 54 54">
              <rect x={6} y={10} width={42} height={36} rx={6} fill="none" stroke="#fff" strokeWidth={5} />
              <path d="M 16 28 L 24 36 L 39 21" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{fontFamily: FONT.sans, color: '#0B1E3F', lineHeight: 1.15}}>
            <div style={{fontWeight: 600, fontSize: 30, color: '#55627a'}}>Clean Moteur Mobile · maintenant</div>
            <div style={{fontWeight: 800, fontSize: 44}}>Rendez-vous confirmé ✓</div>
          </div>
        </div>
        {morph > 0.5 && <div style={{position: 'absolute', left: '50%', top: '50%', width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: 26, background: '#fff', opacity: prog(f, C.notif + 13, 4)}} />}
      </div>
    </div>
  );
};

export const S4Chat: React.FC = () => {
  const f = useCurrentFrame();
  if (f < C.dropOut || f > C.pinDrop + 12) return null;
  // bloom flash that hides the 3D switch car → phone
  const flash = Math.max(0, 1 - Math.abs(f - (C.phoneReveal - 1)) / 4);
  return (
    <>
      <DropToBubble f={f} />
      {flash > 0 && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 48%, rgba(220,255,236,0.95), rgba(43,209,126,0.55) 45%, rgba(43,209,126,0) 80%)', opacity: flash * 0.9}} />}
      <Notes f={f} />
      <Notification f={f} />
    </>
  );
};

export const _u = [easeOut, lin];
