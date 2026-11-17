import React from 'react';
import {interpolate} from 'remotion';
import {C, NB, SANS} from '../theme';
import {Camera, clamp, lerp, SceneShell, Tap, useLocal} from '../lib/fx';
import {IconArrowUpLeft, IconBack, IconSearch} from '../lib/icons';
import {Phone} from '../lib/ui';

export const QUERY = 'manteau cachemire paris';
const SUGGESTIONS = ['manteau cachemire paris 2026', 'manteau camel femme', 'tailleur sur mesure paris'];
const TRENDS = ['défilé haute couture', 'atelier paris 8e', 'soie lavallière', 'vestiaire capsule automne'];

/** Search UI on a 1080x1920 screen. */
export const SearchScreen: React.FC<{
  typed: number;
  caret: boolean;
  sugg: number[]; // per-suggestion reveal 0..1
  press?: number;
}> = ({typed, caret, sugg, press = 0}) => {
  const text = QUERY.slice(0, typed);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000', fontFamily: SANS, color: '#fff'}}>
      {/* search row */}
      <div style={{position: 'absolute', top: 150, left: 36, right: 36, height: 112, display: 'flex', alignItems: 'center', gap: 22}}>
        <IconBack size={58} />
        <div
          style={{
            flex: 1,
            height: 112,
            borderRadius: 26,
            background: C.ui3,
            display: 'flex',
            alignItems: 'center',
            padding: '0 30px',
            gap: 20,
          }}
        >
          <IconSearch size={48} color={C.text2} />
          <div style={{fontSize: 46, fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
            {text.length === 0 ? <span style={{color: C.text3, position: 'absolute', marginLeft: 12}}>Rechercher</span> : null}
            <span>{text}</span>
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: 60,
                marginLeft: 3,
                borderRadius: 2,
                background: C.red,
                opacity: caret ? 1 : 0,
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            color: C.red,
            padding: '18px 10px',
            borderRadius: 20,
            background: `rgba(254,44,85,${press * 0.22})`,
            transform: `scale(${1 - press * 0.08})`,
          }}
        >
          Rechercher
        </div>
      </div>

      {/* suggestions */}
      <div style={{position: 'absolute', top: 310, left: 0, right: 0}}>
        {SUGGESTIONS.map((s, i) => {
          const r = sugg[i] ?? 0;
          const match = s.startsWith(text) ? text.length : 0;
          return (
            <div
              key={s}
              style={{
                height: 124,
                display: 'flex',
                alignItems: 'center',
                padding: '0 48px',
                gap: 34,
                opacity: r,
                transform: `translateY(${(1 - r) * 30}px)`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <IconSearch size={46} color={C.text2} />
              <div style={{flex: 1, fontSize: 46}}>
                <span style={{fontWeight: 700}}>{s.slice(0, match)}</span>
                <span style={{fontWeight: 400, color: 'rgba(255,255,255,0.86)'}}>{s.slice(match)}</span>
              </div>
              <IconArrowUpLeft size={44} color={C.text3} />
            </div>
          );
        })}
      </div>

      {/* trending block (context when the camera pulls back) */}
      <div style={{position: 'absolute', top: 760, left: 48, right: 48}}>
        <div style={{fontSize: 40, fontWeight: 700, marginBottom: 26}}>Tendances{NB}: mode à Paris</div>
        {TRENDS.map((t, i) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 28, height: 104}}>
            <span style={{width: 40, fontSize: 42, fontWeight: 800, color: i < 3 ? C.red : C.text2}}>{i + 1}</span>
            <span style={{fontSize: 42, color: 'rgba(255,255,255,0.9)'}}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 3 · Close-up tilted search bar, query types itself, tap « Rechercher ». */
export const S03Search: React.FC = () => {
  const f = useLocal();
  const typed = Math.floor(interpolate(f, [4, 44], [0, QUERY.length], clamp));
  const typing = f >= 4 && f < 46;
  const caret = typing || Math.floor(f / 8) % 2 === 0;
  const sugg = [0, 1, 2].map((i) => lerp(f, [26 + i * 5, 36 + i * 5], [0, 1]));
  const press = interpolate(f, [65, 68, 76], [0, 1, 0], clamp);
  return (
    <SceneShell id="s03" bg="#000" dof={10}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 420, y: 210, s: 2.5, rx: 24, ry: -20, rz: -2},
          {f: 22, x: 520, y: 230, s: 2.2, rx: 20, ry: -16, rz: -1},
          {f: 46, x: 560, y: 420, s: 1.65, rx: 18, ry: -12},
          {f: 66, x: 800, y: 260, s: 2.1, rx: 14, ry: -10},
          {f: 98, x: 880, y: 230, s: 3.0, rx: 8, ry: -6},
        ]}
      >
        <Phone>
          <SearchScreen typed={typed} caret={caret} sugg={sugg} press={press} />
          <Tap x={935} y={206} at={68} frame={f} />
        </Phone>
      </Camera>
    </SceneShell>
  );
};
