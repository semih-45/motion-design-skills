import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, EASE, EASE_IN, EASE_OUT, SANS} from '../theme';
import {clamp, lerp, pop, SceneShell, useLocal} from '../lib/fx';
import {CreateButton} from '../lib/feed';
import {AppMark} from '../lib/ui';

const CX = 540;
const CY = 860;
const BW = 300;
const BH = 196;

// Each stroke: sweeping curve → around its half of the rounded button outline.
const CYAN_PATH = `M -60 1500 C 200 1520, 120 1160, 300 1080 S 520 1180, 470 ${CY + BH / 2} L ${CX - BW / 2 + 60} ${CY + BH / 2} Q ${CX - BW / 2} ${CY + BH / 2} ${CX - BW / 2} ${CY + BH / 2 - 60} L ${CX - BW / 2} ${CY - BH / 2 + 60} Q ${CX - BW / 2} ${CY - BH / 2} ${CX - BW / 2 + 60} ${CY - BH / 2} L ${CX} ${CY - BH / 2}`;
const RED_PATH = `M 1140 280 C 880 260, 960 620, 780 680 S 560 600, 610 ${CY - BH / 2} L ${CX + BW / 2 - 60} ${CY - BH / 2} Q ${CX + BW / 2} ${CY - BH / 2} ${CX + BW / 2} ${CY - BH / 2 + 60} L ${CX + BW / 2} ${CY + BH / 2 - 60} Q ${CX + BW / 2} ${CY + BH / 2} ${CX + BW / 2 - 60} ${CY + BH / 2} L ${CX} ${CY + BH / 2}`;
const LEN = 2400;

/** 11 · Cyan + red strokes draw curves, meet as the “+” button, morph into the logo + slogan, end on a dot. */
export const S11Outro: React.FC = () => {
  const f = useLocal();
  const draw = lerp(f, [-4, 30], [0, 1], EASE);
  const strokesOut = lerp(f, [32, 40], [1, 0]);
  const btnIn = pop(f, 28, 14);
  const morph = lerp(f, [44, 60], [0, 1]);
  const bw = interpolate(morph, [0, 1], [BW, 280]);
  const bh = interpolate(morph, [0, 1], [BH, 280]);
  const markO = lerp(f, [50, 60], [0, 1]);
  const word = lerp(f, [56, 68], [0, 1], EASE_OUT);
  const slogan = ['Faites-vous', 'découvrir.'].map((_, i) => lerp(f, [62 + i * 7, 74 + i * 7], [0, 1], EASE_OUT));
  // end: everything collapses into a dot, the dot shrinks away
  const collapse = lerp(f, [86, 97], [0, 1], EASE_IN);
  const dot = interpolate(f, [93, 97, 104], [0, 1, 0], {...clamp, easing: EASE});
  const drift = 1 + lerp(f, [30, 90], [0, 0.04]);
  return (
    <SceneShell id="s11" bg={C.paper} lens="light" dof={0}>
      <AbsoluteFill style={{transform: `scale(${drift * (1 - collapse)})`, transformOrigin: `${CX}px ${CY}px`, opacity: 1 - lerp(f, [92, 96], [0, 1])}}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: strokesOut}}>
          <path d={CYAN_PATH} fill="none" stroke={C.cyan} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - draw)} />
          <path d={RED_PATH} fill="none" stroke={C.red} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - draw)} />
        </svg>
        {/* + button → logo */}
        <div
          style={{
            position: 'absolute',
            left: CX - bw / 2,
            top: CY - bh / 2,
            width: bw,
            height: bh,
            transform: `scale(${btnIn})`,
            filter: `drop-shadow(0 ${24 * btnIn}px ${50 * btnIn}px rgba(40,30,20,0.22))`,
          }}
        >
          <div style={{position: 'absolute', inset: 0, opacity: 1 - markO}}>
            <CreateButton w={bw} h={bh} split={1 - morph * 0.6} plus={1 - morph} />
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: markO}}>
            <AppMark size={bw} split={1 + (1 - markO) * 2} />
          </div>
        </div>
        {/* wordmark + slogan */}
        <div
          style={{
            position: 'absolute',
            top: CY + 190,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: -2,
            color: C.ink,
            opacity: word,
            transform: `translateY(${(1 - word) * 30}px)`,
          }}
        >
          défilé
        </div>
        <div
          style={{
            position: 'absolute',
            top: CY + 330,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 22,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 76,
            letterSpacing: -1.5,
          }}
        >
          {['Faites-vous', 'découvrir.'].map((w, i) => (
            <span
              key={w}
              style={{
                color: i === 1 ? C.red : C.ink,
                opacity: slogan[i],
                filter: `blur(${(1 - slogan[i]) * 14}px)`,
                transform: `translateY(${(1 - slogan[i]) * 40}px)`,
                display: 'inline-block',
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </AbsoluteFill>
      {/* final dot */}
      <div
        style={{
          position: 'absolute',
          left: CX - 18,
          top: CY - 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: C.ink,
          transform: `scale(${dot})`,
        }}
      />
    </SceneShell>
  );
};
