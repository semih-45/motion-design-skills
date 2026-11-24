// Scenes 2 & 3 — 2D layer over the 3D car: hand-drawn annotations (red → green), exhaust smoke,
// shine glint and the "Décalaminage à l'hydrogène" title.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, lin, prog} from '../lib/anim';
import {AnchorName, projectAnchor} from '../three/rig';
import {arrowHead, checkPath, handCurve, handEllipse} from '../lib/sketch';
import {DrawPath, HandText} from '../components/Draw';
import {Emitter, Smoke} from '../components/Smoke';

type Ann = {
  anchor: AnchorName;
  bad: string;
  good: string;
  ann: string;
  fix: string;
  lx: number; // label position
  ly: number;
  align: 'left' | 'right' | 'center';
  ax: number; // arrow start offset from label
  ay: number;
  ring: [number, number];
};

export const ANNS: Ann[] = [
  {anchor: 'head', bad: 'Soupapes encrassées', good: 'Soupapes propres', ann: 'ann1', fix: 'fix1', lx: 1010, ly: 618, align: 'right', ax: -170, ay: 46, ring: [34, 22]},
  {anchor: 'egr', bad: 'Vanne EGR calaminée', good: 'Vanne EGR nettoyée', ann: 'ann2', fix: 'fix2', lx: 64, ly: 505, align: 'left', ax: 380, ay: 46, ring: [26, 20]},
  {anchor: 'turbo', bad: 'Turbo encrassé', good: 'Turbo nettoyé', ann: 'ann3', fix: 'fix3', lx: 1010, ly: 1255, align: 'right', ax: -170, ay: -48, ring: [30, 24]},
  {anchor: 'fap', bad: 'FAP colmaté', good: 'FAP nettoyé', ann: 'ann4', fix: 'fix4', lx: 520, ly: 1385, align: 'center', ax: -10, ay: -48, ring: [64, 22]},
  {anchor: 'tail', bad: 'Fumées excessives', good: 'Fumées réduites', ann: 'ann5', fix: 'fix5', lx: 52, ly: 1175, align: 'left', ax: 70, ay: -46, ring: [30, 24]},
];

const RED = '#FF3B44';
const GREEN = '#2BD17E';

const GoodLabel: React.FC<{a: Ann; i: number; pText: number; pCheck: number}> = ({a, i, pText, pCheck}) => {
  if (pText <= 0.001) return null;
  const tx = a.align === 'left' ? '0%' : a.align === 'center' ? '-50%' : '-100%';
  return (
    <div
      style={{
        position: 'absolute',
        left: a.lx,
        top: a.ly,
        transform: `translate(${tx}, -50%) rotate(${i % 2 ? 2 : -2}deg)`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontFamily: FONT.hand,
          fontWeight: 700,
          fontSize: 74,
          lineHeight: 1,
          color: GREEN,
          clipPath: `inset(-20% ${((1 - Math.min(1, pText)) * 100).toFixed(2)}% -20% -5%)`,
          textShadow: '0 2px 14px rgba(0,0,0,0.65)',
        }}
      >
        {a.good}
      </span>
      <svg width={56} height={56} viewBox="0 0 56 56" style={{overflow: 'visible'}}>
        <DrawPath d={checkPath(6, 30, 44)} p={pCheck} color={GREEN} width={8} />
      </svg>
    </div>
  );
};

const Annotation: React.FC<{a: Ann; f: number; i: number}> = ({a, f, i}) => {
  const t0 = C[a.ann];
  const t1 = C[a.fix];
  if (f < t0) return null;
  const out = prog(f, C.unXray + 4, 8, easeIn);
  if (out >= 1) return null;
  const anchor = projectAnchor(a.anchor, f);
  const start = {x: a.lx + a.ax, y: a.ly + a.ay};
  // arrow stops short of the target so it doesn't cover the part
  const dx = anchor.x - start.x;
  const dy = anchor.y - start.y;
  const len = Math.hypot(dx, dy);
  const stop = Math.max(a.ring[0], a.ring[1]) + 14;
  const tip = {x: anchor.x - (dx / len) * stop, y: anchor.y - (dy / len) * stop};
  const curve = handCurve(start, tip, `arr${i}`, i % 2 ? 0.14 : -0.14, 2.5);
  const head = arrowHead(curve.before, curve.end, 26, `ah${i}`);
  const ring = handEllipse(anchor.x, anchor.y, a.ring[0], a.ring[1], `ring${i}`);

  const pRing = prog(f, t0, 8, easeOut);
  const pArrow = prog(f, t0 + 3, 8, easeOut);
  const pHead = prog(f, t0 + 10, 3);
  const pText = prog(f, t0 + 2, 10, easeInOut);
  const fixed = f >= t1;
  const pErase = prog(f, t1, 4);
  const pGood = prog(f, t1 + 2, 8, easeInOut);
  const pCheck = prog(f, t1 + 8, 5, easeOut);
  const color = fixed ? GREEN : RED;
  const flash = fixed ? 1 - lin(f, t1, 10) : 0;

  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g style={{filter: `drop-shadow(0 0 ${6 + flash * 18}px ${color}aa)`}}>
          <DrawPath d={ring} p={pRing} color={color} width={6} />
          <DrawPath d={curve.d} p={pArrow} color={color} width={5.5} />
          <DrawPath d={head} p={pHead} color={color} width={5.5} />
        </g>
      </svg>
      {!fixed || pErase < 1 ? (
        <div style={{opacity: 1 - pErase}}>
          <HandText text={a.bad} p={pText} x={a.lx} y={a.ly} size={74} color={RED} align={a.align} rotate={i % 2 ? 2 : -2} />
        </div>
      ) : null}
      {fixed && <GoodLabel a={a} i={i} pText={pGood} pCheck={pCheck} />}
    </div>
  );
};

export const S2S3Car: React.FC = () => {
  const f = useCurrentFrame();
  const emitters = useMemo<Emitter[]>(
    () => [
      {
        id: 'tail',
        start: C.ann5 - 6,
        end: C.fix5 - 6,
        perFrame: 2,
        life: 34,
        puff: (r, age, birth) => {
          const a = projectAnchor('tail', birth);
          const t = age / 34;
          return {
            x: a.x - age * (7 + r(0) * 6) - 10,
            y: a.y - age * (2.2 + r(1) * 3) + Math.sin(age * 0.2 + r(2) * 6) * 6,
            size: 90 + 420 * t + r(3) * 60,
            alpha: 1.0 * Math.sin(Math.PI * Math.min(1, t * 1.3)) * (0.7 + 0.3 * r(4)),
            rot: r(5) * 6 + age * 0.02,
            sprite: 3,
          };
        },
      },
    ],
    [],
  );
  if (f < S.problem || f > S.chat + 10) return null;

  // glint sweep when the car turns glossy again
  const glintP = lin(f, C.unXray + 4, 16);
  const smokeFade = 1 - prog(f, C.fix5 - 8, 14);

  // title
  const tIn = (d: number) => prog(f, C.title3 + d, 12, easeOut);
  const tOut = prog(f, C.dropOut + 2, 10, easeIn);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Smoke emitters={emitters} opacity={smokeFade} />
      {ANNS.map((a, i) => (
        <Annotation key={i} a={a} f={f} i={i} />
      ))}
      {glintP > 0 && glintP < 1 && (
        <div
          style={{
            position: 'absolute',
            left: lerp(-700, 1300, glintP),
            top: 500,
            width: 260,
            height: 1000,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)',
            transform: 'rotate(18deg)',
            mixBlendMode: 'overlay',
            filter: 'blur(6px)',
          }}
        />
      )}
      {f >= C.title3 && tOut < 1 && (
        <div style={{position: 'absolute', left: 0, top: 300, width: W, textAlign: 'center', opacity: 1 - tOut, transform: `translateY(${-tOut * 40}px)`}}>
          <div style={{overflow: 'hidden', height: 128}}>
            <div
              style={{
                fontFamily: FONT.sans,
                fontWeight: 900,
                fontSize: 112,
                letterSpacing: -3,
                color: '#fff',
                lineHeight: 1.1,
                transform: `translateY(${(1 - tIn(0)) * 110}%)`,
              }}
            >
              Décalaminage
            </div>
          </div>
          <div style={{overflow: 'hidden', height: 128, marginTop: -8}}>
            <div
              style={{
                fontFamily: FONT.sans,
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 104,
                letterSpacing: -3,
                lineHeight: 1.12,
                color: GREEN,
                transform: `translateY(${(1 - tIn(4)) * 110}%)`,
                textShadow: '0 0 40px rgba(43,209,126,0.45)',
              }}
            >
              à l'hydrogène
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 22,
              padding: '14px 34px',
              borderRadius: 999,
              background: 'rgba(43,209,126,0.12)',
              border: '2px solid rgba(43,209,126,0.55)',
              fontFamily: FONT.sans,
              fontWeight: 700,
              fontSize: 44,
              color: '#fff',
              opacity: tIn(10),
              transform: `translateY(${(1 - tIn(10)) * 30}px) scale(${lerp(0.9, 1, tIn(10))})`,
            }}
          >
            Efficace
            <span style={{width: 12, height: 12, borderRadius: 6, background: GREEN, display: 'inline-block'}} />
            Plus écologique
          </div>
        </div>
      )}
    </div>
  );
};

export const _unused = clamp;
