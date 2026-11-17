import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {Camera, SceneShell, useLocal} from '../lib/fx';
import {Phone} from '../lib/ui';
import {SearchScreen} from './S03Search';

const PW = 500; // on-screen phone width
const PS = PW / 1080;
const PX = 540;
const PY = 900;
const ROT = -7;

const Bokeh: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 40%, #6a3d1c 0%, #2c180c 55%, #120905 100%)'}}>
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="bk-blur">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <g filter="url(#bk-blur)">
        {Array.from({length: 26}).map((_, i) => {
          const x = random(`bx${i}`) * 1180 - 50;
          const y = random(`by${i}`) * 2000 - 40 - f * (0.4 + random(`bs${i}`));
          const r = 40 + random(`br${i}`) * 120;
          const hue = ['#ffb35a', '#ffd38f', '#ff8a3d', '#fff1cf', '#e0703a'][i % 5];
          return <circle key={i} cx={x} cy={y} r={r} fill={hue} opacity={0.18 + random(`bo${i}`) * 0.35} />;
        })}
      </g>
    </svg>
  </AbsoluteFill>
);

/** Left hand (palm + thumb behind/over the phone, fingertips on the right edge). */
const Hand: React.FC<{layer: 'back' | 'front'}> = ({layer}) => {
  const hw = PW / 2;
  const hh = (1920 * PS) / 2;
  return (
    <svg
      width="1400"
      height="1600"
      viewBox="-700 -800 1400 1600"
      style={{position: 'absolute', left: -700, top: -800, overflow: 'visible'}}
    >
      <defs>
        <linearGradient id={`hs-${layer}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2bf98" />
          <stop offset="1" stopColor="#a8694a" />
        </linearGradient>
        <filter id={`hb-${layer}`}>
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <g filter={`url(#hb-${layer})`}>
        {layer === 'back' ? (
          <>
            {/* knit sleeve + wrist */}
            <path d={`M${-hw - 260} ${hh + 520} L${-hw + 40} ${hh + 80} L${-hw + 260} ${hh + 260} L${-hw - 20} ${hh + 700} Z`} fill="#d9c7ad" />
            {/* fingers wrapping behind the right edge */}
            <rect x={hw - 140} y={-hh * 0.32} width={230} height={hh * 1.2} rx={90} fill="#b9785a" />
            {[-0.2, 0.12, 0.42, 0.7].map((t, i) => (
              <rect key={i} x={hw - 40} y={hh * t - 40} width={130} height={82} rx={41} fill={i % 2 ? '#c98a69' : '#d39677'} />
            ))}
            {/* palm under the phone */}
            <ellipse cx={-hw + 120} cy={hh - 40} rx={250} ry={180} fill={`url(#hs-${layer})`} transform={`rotate(-30 ${-hw + 120} ${hh - 40})`} />
          </>
        ) : (
          <>
            {/* thumb along the left edge */}
            <rect x={-hw - 60} y={hh * 0.05} width={92} height={330} rx={46} fill={`url(#hs-${layer})`} transform={`rotate(14 ${-hw} ${hh * 0.3})`} />
            <rect x={-hw - 36} y={hh * 0.05 + 10} width={56} height={70} rx={26} fill="#f6d2bb" opacity="0.8" transform={`rotate(14 ${-hw} ${hh * 0.3})`} />
            {/* fingertips wrapping the right edge */}
            {[-0.2, 0.12, 0.42, 0.7].map((t, i) => (
              <g key={i}>
                <rect x={hw - 30} y={hh * t - 36} width={96} height={74} rx={37} fill={i % 2 ? '#c98a69' : '#d99c7a'} />
                <rect x={hw - 20} y={hh * t - 26} width={34} height={52} rx={16} fill="#f3cdb5" opacity="0.75" />
              </g>
            ))}
          </>
        )}
      </g>
    </svg>
  );
};

/** 2 · Warm, blurry photo of hands holding a phone — the camera pushes into its screen. */
export const S02Hands: React.FC = () => {
  const f = useLocal();
  return (
    <SceneShell id="s02" bg="#1a0e07" dof={14}>
      <Bokeh f={f} />
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 980, s: 0.86, rx: 10, ry: -12, rz: -3},
          {f: 22, x: 540, y: 930, s: 1.02, rx: 6, ry: -6, rz: -1},
          {f: 60, x: PX, y: PY, s: 2.32, rx: 0, ry: 0, rz: -ROT},
        ]}
      >
        <div style={{position: 'absolute', left: PX, top: PY, transform: `rotate(${ROT}deg)`}}>
          <Hand layer="back" />
          <div
            style={{
              position: 'absolute',
              left: -PW / 2,
              top: (-1920 * PS) / 2,
              width: 1080,
              height: 1920,
              transform: `scale(${PS})`,
              transformOrigin: '0 0',
            }}
          >
            <Phone style={{boxShadow: '0 0 0 26px #0d0d0f, 0 0 0 30px #4a4a52, 0 0 0 33px #0b0b0c, 0 80px 200px rgba(0,0,0,0.7), 0 0 260px rgba(255,190,120,0.35)'}}>
              <SearchScreen typed={0} caret={Math.floor(f / 8) % 2 === 0} sugg={[0, 0, 0]} />
              {/* screen glare */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(125deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 38%)',
                  zIndex: 40,
                }}
              />
            </Phone>
          </div>
          <Hand layer="front" />
        </div>
      </Camera>
      {/* warm light wash */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 75% 20%, rgba(255,180,90,0.25), rgba(0,0,0,0) 60%)', mixBlendMode: 'screen'}} />
    </SceneShell>
  );
};
