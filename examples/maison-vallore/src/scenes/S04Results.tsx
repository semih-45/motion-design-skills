import React from 'react';
import {C, NB, SANS} from '../theme';
import {Camera, lerp, SceneShell, Tap, useLocal} from '../lib/fx';
import {IconBack, IconHeart, IconMore, IconSearch} from '../lib/icons';
import {Photo, PhotoKind} from '../lib/photos';
import {Avatar, Phone} from '../lib/ui';
import {QUERY} from './S03Search';

const CARDS: {kind: PhotoKind; likes: string; cap: string; user: string; who: string; zoom?: number; ox?: number; oy?: number; tone?: string}[] = [
  {kind: 'street', likes: `48,2${NB}k`, cap: 'Le manteau camel, coupé main à Paris', user: 'maison.vallore', who: 'mv', zoom: 1.25, oy: 4},
  {kind: 'salon', likes: `31,7${NB}k`, cap: "Soie ivoire, lumière d'après-midi", user: 'maison.vallore', who: 'mv', zoom: 1.3, ox: -4},
  {kind: 'atelier', likes: `22,9${NB}k`, cap: 'Dans notre atelier du 8e', user: 'maison.vallore', who: 'mv', zoom: 1.2},
  {kind: 'street', likes: `12,4${NB}k`, cap: 'Cachemire double face — le détail', user: 'camille.dsn', who: 'camille', zoom: 2.2, oy: 8, tone: '#4a3a2a'},
];

const TABS = ['Top', 'Vidéos', 'Utilisateurs', 'Sons'];

const CARD_W = 512;
const IMG_H = 690;

export const ResultsScreen: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', inset: 0, background: '#000', fontFamily: SANS, color: '#fff'}}>
    <div style={{position: 'absolute', top: 150, left: 36, right: 36, height: 104, display: 'flex', alignItems: 'center', gap: 22}}>
      <IconBack size={54} />
      <div style={{flex: 1, height: 104, borderRadius: 24, background: C.ui3, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 18}}>
        <IconSearch size={44} color={C.text2} />
        <span style={{fontSize: 42, fontWeight: 500}}>{QUERY}</span>
      </div>
      <IconMore size={50} />
    </div>
    {/* tabs */}
    <div style={{position: 'absolute', top: 290, left: 0, right: 0, height: 92, borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', gap: 54, padding: '0 48px'}}>
      {TABS.map((t, i) => (
        <div key={t} style={{position: 'relative', fontSize: 42, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#fff' : C.text2, paddingTop: 16}}>
          {t}
          {i === 0 ? <div style={{position: 'absolute', left: -6, right: -6, bottom: 0, height: 6, background: '#fff', borderRadius: 3}} /> : null}
        </div>
      ))}
    </div>
    {/* grid */}
    {CARDS.map((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const r = lerp(f, [-6 + i * 3, 8 + i * 3], [0, 1]);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 20 + col * (CARD_W + 16),
            top: 404 + row * (IMG_H + 200),
            width: CARD_W,
            opacity: r,
            transform: `translateY(${(1 - r) * 60}px)`,
          }}
        >
          <div style={{position: 'relative', height: IMG_H, borderRadius: 22, overflow: 'hidden', background: '#222'}}>
            <Photo kind={c.kind} zoom={c.zoom} ox={c.ox} oy={c.oy} tone={c.tone} id={`rg${i}`} />
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6))'}} />
            <div style={{position: 'absolute', left: 20, bottom: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 32, fontWeight: 600}}>
              <IconHeart size={34} color="#fff" fill="none" stroke={2.2} />
              {c.likes}
            </div>
          </div>
          <div style={{fontSize: 34, fontWeight: 500, lineHeight: 1.25, marginTop: 16, height: 86, overflow: 'hidden'}}>{c.cap}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 30, color: C.text2}}>
            <Avatar who={c.who} size={46} />
            <span>{c.user}</span>
          </div>
        </div>
      );
    })}
  </div>
);

/** 4 · Two-column result grid; tap + dive into the first thumbnail. */
export const S04Results: React.FC = () => {
  const f = useLocal();
  const cx = 20 + CARD_W / 2;
  const cy = 404 + IMG_H / 2;
  return (
    <SceneShell id="s04" bg="#000" dof={10}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 560, y: 980, s: 0.92, rx: 22, ry: 16, rz: 2},
          {f: 16, x: 470, y: 860, s: 1.12, rx: 14, ry: 10, rz: 1},
          {f: 24, x: 430, y: 820, s: 1.2, rx: 12, ry: 8},
          {f: 53, x: cx, y: cy, s: 2.9, rx: 0, ry: 0},
        ]}
      >
        <Phone>
          <ResultsScreen f={f} />
          <Tap x={cx + 40} y={cy + 40} at={22} frame={f} />
        </Phone>
      </Camera>
    </SceneShell>
  );
};
