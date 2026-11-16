import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BRAND, COLORS, FONT_TITRE, HEIGHT, MAP, WIDTH} from '../config';
import {MetalText, Particles, Vignette, expoOut, prog} from '../components/fx';

const CX = 470, CY = 890, KX = 100, KY = 104;
/** projection GPS → écran, avec dilatation radiale pour aérer le centre (carte stylisée) */
const project = (lat: number, lon: number) => {
  const x = (lon - MAP.centre.lon) * 74.63, y = (lat - MAP.centre.lat) * 110.57;
  const r = Math.hypot(x, y);
  if (r < 1e-6) return {x: CX, y: CY};
  const k = Math.pow(r, 0.72) / r;
  return {x: CX + x * k * KX, y: CY - y * k * KY};
};
// tracé simplifié de la Loire (points GPS approximatifs)
const LOIRE = [[47.872, 2.09], [47.885, 2.03], [47.893, 1.975], [47.897, 1.94], [47.8965, 1.905], [47.892, 1.885], [47.887, 1.86], [47.88, 1.835], [47.868, 1.79], [47.86, 1.75]];

export const ZoneIntervention: React.FC = () => {
  const frame = useCurrentFrame();
  const cities = useMemo(() => MAP.villes.map((v) => ({...v, p: project(v.lat, v.lon)})), []);
  const loire = useMemo(() => {
    const pts = LOIRE.map(([la, lo]) => project(la, lo));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
    }
    return d;
  }, []);
  const zoom = interpolate(frame, [0, 26, 135], [1.7, 1.0, 1.04], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const tilt = interpolate(frame, [0, 30], [52, 22], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const rz = interpolate(frame, [0, 135], [-5, 2.5]);
  const sweep = (frame * 5) % 360;
  const others = cities.filter((c) => !c.principal);
  const hub = cities.find((c) => c.principal)!;
  return (
    <AbsoluteFill style={{background: COLORS.noir}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 45% at 45% 47%, rgba(8,123,255,0.30), transparent 72%)'}} />
      <AbsoluteFill style={{perspective: 1700, perspectiveOrigin: '50% 40%'}}>
        <AbsoluteFill style={{transformOrigin: `${CX}px ${CY}px`, transform: `rotateX(${tilt}deg) rotateZ(${rz}deg) scale(${zoom})`}}>
          <svg width={WIDTH} height={HEIGHT} style={{overflow: 'visible'}}>
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse" x={CX} y={CY}>
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,168,255,0.16)" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="2.4" fill="rgba(120,200,255,0.5)" />
              </pattern>
              <radialGradient id="fade"><stop offset="55%" stopColor="#fff" /><stop offset="100%" stopColor="#000" /></radialGradient>
              <mask id="m"><ellipse cx={CX} cy={CY} rx={900} ry={760} fill="url(#fade)" /></mask>
              <filter id="glow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <radialGradient id="zone"><stop offset="0%" stopColor="rgba(8,123,255,0.42)" /><stop offset="70%" stopColor="rgba(8,123,255,0.16)" /><stop offset="100%" stopColor="rgba(8,123,255,0)" /></radialGradient>
            </defs>
            <g mask="url(#m)">
              <rect x={-700} y={-300} width={WIDTH + 1400} height={HEIGHT + 600} fill="url(#grid)" />
              {/* zone couverte */}
              <ellipse cx={CX + 20} cy={CY - 10} rx={560 * prog(frame, 6, 40, expoOut)} ry={450 * prog(frame, 6, 40, expoOut)} fill="url(#zone)" />
              {[150, 300, 450].map((r, i) => (
                <ellipse key={r} cx={CX} cy={CY} rx={r * prog(frame, 4 + i * 5, 26 + i * 5, expoOut)} ry={r * prog(frame, 4 + i * 5, 26 + i * 5, expoOut) * (KY / KX)}
                  fill="none" stroke="rgba(0,168,255,0.42)" strokeWidth={2} strokeDasharray="6 12" />
              ))}
              {/* onde radar */}
              {[0, 45, 90].map((o) => {
                const q = ((frame + o) % 135) / 135;
                return <ellipse key={o} cx={CX} cy={CY} rx={q * 620} ry={q * 620 * (KY / KX)} fill="none" stroke={COLORS.neon} strokeWidth={3} opacity={(1 - q) * 0.7} />;
              })}
              <path d={`M ${CX} ${CY} L ${CX + Math.cos((sweep * Math.PI) / 180) * 620} ${CY + Math.sin((sweep * Math.PI) / 180) * 620}`} stroke="rgba(0,168,255,0.5)" strokeWidth={3} />
              {/* la Loire */}
              <path d={loire} fill="none" stroke="rgba(60,150,255,0.30)" strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={`${prog(frame, 2, 34)} 1`} />
              <path d={loire} fill="none" stroke="rgba(140,205,255,0.55)" strokeWidth={3} pathLength={1} strokeDasharray={`${prog(frame, 2, 34)} 1`} />
            </g>
            {/* liaisons lumineuses Orléans → communes */}
            {others.map((c, i) => {
              const at = 10 + i * 4;
              const g = prog(frame, at, at + 11, expoOut);
              const ex = hub.p.x + (c.p.x - hub.p.x) * g, ey = hub.p.y + (c.p.y - hub.p.y) * g;
              const pulse = ((frame - at) % 34) / 34;
              return (
                <g key={c.nom} filter="url(#glow)">
                  <line x1={hub.p.x} y1={hub.p.y} x2={ex} y2={ey} stroke={COLORS.bleu} strokeWidth={5} opacity={0.9} strokeLinecap="round" />
                  <line x1={hub.p.x} y1={hub.p.y} x2={ex} y2={ey} stroke="#cfeaff" strokeWidth={1.6} />
                  {g >= 1 ? <circle cx={hub.p.x + (c.p.x - hub.p.x) * pulse} cy={hub.p.y + (c.p.y - hub.p.y) * pulse} r={6} fill="#fff" /> : null}
                </g>
              );
            })}
            {/* maillage entre communes voisines */}
            {others.map((c, i) => {
              const nx = others[(i + 1) % others.length];
              const g = prog(frame, 50 + i * 2, 66 + i * 2);
              return <line key={'r' + c.nom} x1={c.p.x} y1={c.p.y} x2={c.p.x + (nx.p.x - c.p.x) * g} y2={c.p.y + (nx.p.y - c.p.y) * g} stroke="rgba(0,168,255,0.55)" strokeWidth={2} strokeDasharray="4 9" />;
            })}
            {/* points lumineux */}
            {cities.map((c, i) => {
              const at = c.principal ? 4 : 19 + (i - 1) * 4;
              const s = prog(frame, at, at + 9, Easing.out(Easing.back(2.5)));
              const ring = ((frame - at) % 40) / 40;
              const r = c.principal ? 21 : 12;
              return (
                <g key={'n' + c.nom} opacity={frame >= at ? 1 : 0}>
                  <circle cx={c.p.x} cy={c.p.y} r={r + ring * 46} fill="none" stroke={COLORS.neon} strokeWidth={3} opacity={1 - ring} />
                  <circle cx={c.p.x} cy={c.p.y} r={r * s * 1.9} fill="rgba(8,123,255,0.45)" filter="url(#glow)" />
                  <circle cx={c.p.x} cy={c.p.y} r={r * s} fill={c.principal ? '#fff' : COLORS.neon} stroke="#fff" strokeWidth={3} filter="url(#glow)" />
                </g>
              );
            })}
          </svg>
          {/* étiquettes */}
          {cities.map((c, i) => {
            const at = c.principal ? 8 : 22 + (i - 1) * 4;
            const p = prog(frame, at, at + 8);
            const off = c.principal ? 40 : 24;
            const pos: React.CSSProperties =
              c.side === 'top' ? {left: c.p.x, top: c.p.y - off, transform: `translate(-50%, -100%)`}
              : c.side === 'bottom' ? {left: c.p.x, top: c.p.y + off, transform: `translate(-50%, 0)`}
              : c.side === 'left' ? {left: c.p.x - off, top: c.p.y, transform: `translate(-100%, -50%)`}
              : {left: c.p.x + off, top: c.p.y, transform: `translate(0, -50%)`};
            return (
              <div key={'l' + c.nom} style={{position: 'absolute', ...pos, opacity: p, whiteSpace: 'nowrap'}}>
                <div style={{
                  fontFamily: FONT_TITRE, fontWeight: c.principal ? 900 : 700, fontStyle: c.principal ? 'italic' : 'normal',
                  fontSize: c.principal ? 70 : 34, letterSpacing: c.principal ? 2 : 0.6, color: '#fff', lineHeight: 1,
                  textTransform: c.principal ? 'uppercase' : 'none',
                  padding: c.principal ? '4px 20px 8px' : '3px 12px 5px', borderRadius: 8,
                  background: c.principal ? `linear-gradient(180deg, ${COLORS.neon}, ${COLORS.bleu})` : 'rgba(4,10,22,0.82)',
                  border: c.principal ? '2px solid #fff' : '1.5px solid rgba(0,168,255,0.7)',
                  boxShadow: c.principal ? `0 0 34px ${COLORS.bleu}` : '0 0 14px rgba(8,123,255,0.45)',
                  transform: `scale(${0.7 + 0.3 * p})`,
                }}>{c.nom}</div>
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      <Particles count={30} seed="zone" opacity={0.7} />
      <Vignette strength={0.75} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,7,11,0.95) 0%, rgba(5,7,11,0.75) 20%, rgba(5,7,11,0) 30%)'}} />
      {/* TITRE */}
      <div style={{position: 'absolute', top: 138, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {MAP.titre.map((line, i) => {
          const at = 3 + i * 5;
          const p = prog(frame, at, at + 11, expoOut);
          return (
            <div key={i} style={{clipPath: `inset(-20% ${(1 - p) * 50}% -30% ${(1 - p) * 50}%)`, transform: `scale(${1.25 - 0.25 * p})`, marginBottom: -2}}>
              <MetalText size={i === 2 ? 122 : 102} blue={i === 2} depth={6} shineAt={at + 9}>{line}</MetalText>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1335, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        {(() => {
          const p = prog(frame, 52, 66, expoOut);
          return (
            <div style={{
              transform: `skewX(-10deg) scale(${0.8 + 0.2 * p})`, opacity: p, padding: '8px 34px 12px', background: `linear-gradient(90deg, ${COLORS.bleu}, ${COLORS.neon})`,
              border: '3px solid #fff', boxShadow: `0 0 44px ${COLORS.bleu}`, borderRadius: 10,
              fontFamily: FONT_TITRE, fontWeight: 900, fontStyle: 'italic', fontSize: 62, color: '#fff', letterSpacing: 1.5, whiteSpace: 'nowrap', textShadow: '0 3px 0 rgba(0,30,90,0.7)',
            }}>{BRAND.zone}</div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
