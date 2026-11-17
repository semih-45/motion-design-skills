import React from 'react';
import {C, EASE_OUT, NB, SANS} from '../theme';
import {Camera, lerp, SceneShell, Tap, useLocal} from '../lib/fx';
import {IconBack, IconBell, IconCheck, IconGrid, IconHeart, IconLink, IconLock, IconMore, IconPlay, IconSend, IconVerified} from '../lib/icons';
import {Photo, PhotoKind} from '../lib/photos';
import {Avatar, Phone} from '../lib/ui';

/** French short-number formatting: 312 · 48,2 k · 1,2 M */
export const fmt = (v: number) => {
  if (v < 1000) return `${Math.round(v)}`;
  if (v < 1e6) return `${(v / 1000).toFixed(1).replace('.', ',')}${NB}k`;
  return `${(v / 1e6).toFixed(1).replace('.', ',')}${NB}M`;
};

const GRID: {kind: PhotoKind; zoom: number; ox?: number; oy?: number; views: string; pin?: boolean; tone?: string}[] = [
  {kind: 'street', zoom: 1.3, oy: 3, views: `2,4${NB}M`, pin: true},
  {kind: 'salon', zoom: 1.35, views: `1,9${NB}M`, pin: true},
  {kind: 'atelier', zoom: 1.2, views: `986${NB}k`, pin: true},
  {kind: 'salon', zoom: 2.4, oy: 10, views: `412${NB}k`, tone: '#2c3440'},
  {kind: 'street', zoom: 2.6, oy: -2, views: `388${NB}k`},
  {kind: 'atelier', zoom: 2.2, ox: 10, oy: -6, views: `301${NB}k`, tone: '#3a2a20'},
];

const Stat: React.FC<{v: string; label: string}> = ({v, label}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 280}}>
    <span style={{fontSize: 54, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{v}</span>
    <span style={{fontSize: 34, color: C.text2, marginTop: 4}}>{label}</span>
  </div>
);

export const ProfileScreen: React.FC<{f: number; tapAt: number}> = ({f, tapAt}) => {
  const c = lerp(f, [4, 46], [0, 1], EASE_OUT);
  const followed = f >= tapAt + 1;
  const flip = lerp(f, [tapAt, tapAt + 8], [0, 1]);
  const press = lerp(f, [tapAt - 3, tapAt, tapAt + 4], [0, 1, 0]);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000', fontFamily: SANS, color: '#fff'}}>
      {/* header */}
      <div style={{position: 'absolute', top: 140, left: 40, right: 40, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <IconBack size={56} />
        <span style={{fontSize: 46, fontWeight: 700}}>Maison Valloré</span>
        <div style={{display: 'flex', gap: 30}}>
          <IconBell size={54} />
          <IconMore size={54} />
        </div>
      </div>
      {/* avatar */}
      <div style={{position: 'absolute', top: 270, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Avatar who="mv" size={230} />
      </div>
      <div style={{position: 'absolute', top: 530, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, fontSize: 46, fontWeight: 700}}>
        @maison.vallore <IconVerified size={40} />
      </div>
      {/* counters */}
      <div style={{position: 'absolute', top: 620, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20}}>
        <Stat v={fmt(312 * c)} label="Abonnements" />
        <div style={{width: 2, height: 60, background: C.line, marginTop: 20}} />
        <Stat v={fmt(1.2e6 * c)} label="Abonnés" />
        <div style={{width: 2, height: 60, background: C.line, marginTop: 20}} />
        <Stat v={fmt(18.4e6 * c)} label="J’aime" />
      </div>
      {/* buttons */}
      <div style={{position: 'absolute', top: 790, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16}}>
        <div
          style={{
            width: 470,
            height: 116,
            borderRadius: 18,
            background: followed ? C.ui3 : C.red,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            fontSize: 46,
            fontWeight: 700,
            transform: `scale(${1 - press * 0.06}) rotateX(${followed ? (1 - flip) * -90 : 0}deg)`,
            boxShadow: followed ? 'none' : '0 12px 40px rgba(254,44,85,0.45)',
          }}
        >
          {followed ? (
            <>
              <IconCheck size={46} /> Suivi(e)
            </>
          ) : (
            'Suivre'
          )}
        </div>
        <div style={{width: 116, height: 116, borderRadius: 18, background: C.ui3, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <IconSend size={50} />
        </div>
        <div style={{width: 116, height: 116, borderRadius: 18, background: C.ui3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>
          ▾
        </div>
      </div>
      {/* bio */}
      <div style={{position: 'absolute', top: 950, left: 80, right: 80, textAlign: 'center', fontSize: 38, lineHeight: 1.4}}>
        Prêt-à-porter de luxe · Paris 8e
        <br />
        <span style={{color: C.text2}}>Atelier &amp; salon d’essayage sur rendez-vous</span>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10, fontWeight: 600}}>
          <IconLink size={38} /> maisonvallore.fr
        </div>
      </div>
      {/* tabs */}
      <div style={{position: 'absolute', top: 1180, left: 0, right: 0, height: 100, display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.12)'}}>
        {[<IconGrid key="g" size={50} />, <IconLock key="l" size={50} color={C.text2} />, <IconHeart key="h" size={50} color={C.text2} fill="none" stroke={2} />].map((ic, i) => (
          <div key={i} style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'}}>
            {ic}
            {i === 0 ? <div style={{position: 'absolute', bottom: 0, width: 120, height: 6, background: '#fff', borderRadius: 3}} /> : null}
          </div>
        ))}
      </div>
      {/* pinned grid */}
      {GRID.map((g, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const r = lerp(f, [56 + i * 3, 70 + i * 3], [0, 1]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: col * 362,
              top: 1286 + row * 486,
              width: 356,
              height: 480,
              overflow: 'hidden',
              background: '#1b1b1d',
            }}
          >
            <div style={{position: 'absolute', inset: 0, opacity: 0.25 + r * 0.75}}>
              <Photo kind={g.kind} zoom={g.zoom} ox={g.ox} oy={g.oy} tone={g.tone} id={`pg${i}`} />
            </div>
            {g.pin ? (
              <div style={{position: 'absolute', left: 14, top: 14, padding: '6px 14px', borderRadius: 8, background: C.red, fontSize: 26, fontWeight: 700}}>Épinglé</div>
            ) : null}
            <div style={{position: 'absolute', left: 14, bottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 30, fontWeight: 600, textShadow: '0 2px 6px rgba(0,0,0,.6)'}}>
              <IconPlay size={30} /> {g.views}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 6 · Tilted profile page, counters roll up, tap « Suivre » → « Suivi(e) ». */
export const S06Profile: React.FC = () => {
  const f = useLocal();
  const tapAt = 62;
  return (
    <SceneShell id="s06" bg="#000" dof={10}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 560, s: 1.55, rx: 24, ry: -24, rz: -3},
          {f: 30, x: 540, y: 650, s: 1.3, rx: 16, ry: -14, rz: -2},
          {f: 60, x: 480, y: 830, s: 1.7, rx: 14, ry: -12, rz: -1},
          {f: 84, x: 540, y: 1080, s: 1.08, rx: 20, ry: -16},
          {f: 113, x: 540, y: 1200, s: 1.14, rx: 18, ry: -12},
        ]}
      >
        <Phone>
          <ProfileScreen f={f} tapAt={tapAt} />
          <Tap x={330} y={848} at={tapAt} frame={f} />
        </Phone>
      </Camera>
    </SceneShell>
  );
};
