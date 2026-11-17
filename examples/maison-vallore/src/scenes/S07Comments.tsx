import React from 'react';
import {C, NB, SANS} from '../theme';
import {Camera, lerp, pop, SceneShell, useLocal} from '../lib/fx';
import {FeedVideo, POSTS} from '../lib/feed';
import {IconClose, IconEmoji, IconHeart} from '../lib/icons';
import {Avatar, Phone} from '../lib/ui';

const COMMENTS = [
  {who: 'camille', user: 'camille.dsn', text: 'Sublime, ce manteau camel', meta: '2 h', likes: '1 204'},
  {who: 'giulia', user: 'giulia.mi', text: `Vous livrez à Milan${NB}?`, meta: '1 h', likes: '386'},
  {who: 'lea', user: 'lea_rvr', text: 'Cette soie est incroyable', meta: '48 min', likes: '952'},
  {who: 'hugo', user: 'hugo.lmb', text: 'La coupe des épaules, parfaite.', meta: '12 min', likes: '74'},
];

/** 7 · Comment sheet slides up over the coat video. */
export const S07Comments: React.FC = () => {
  const f = useLocal();
  const up = lerp(f, [-4, 14], [0, 1]);
  const panelTop = 620 + (1 - up) * 1300;
  return (
    <SceneShell id="s07" bg="#000" dof={9}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 1000, s: 1.0, rx: 14, ry: 14, rz: 1},
          {f: 53, x: 540, y: 1060, s: 1.32, rx: 8, ry: 6},
        ]}
      >
        <Phone>
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${-up * 330}px) scale(${1 - up * 0.04})`}}>
            <FeedVideo post={POSTS[0]} frame={f + 60} id="s07v" />
          </div>
          <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${up * 0.35})`}} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: panelTop,
              height: 1300,
              background: '#161618',
              borderRadius: '44px 44px 0 0',
              fontFamily: SANS,
              color: '#fff',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 40, fontWeight: 700}}>
              1 248 commentaires
              <div style={{position: 'absolute', right: 44}}>
                <IconClose size={48} />
              </div>
            </div>
            {COMMENTS.map((c, i) => {
              const r = pop(f, 6 + i * 6, 14);
              return (
                <div
                  key={c.user}
                  style={{
                    display: 'flex',
                    gap: 28,
                    padding: '22px 44px',
                    opacity: Math.min(1, r) * (i === 3 ? 0.55 : 1),
                    transform: `translateY(${(1 - r) * 50}px)`,
                  }}
                >
                  <Avatar who={c.who} size={100} />
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 32, color: C.text2, fontWeight: 600}}>{c.user}</div>
                    <div style={{fontSize: 44, marginTop: 6, lineHeight: 1.25}}>{c.text}</div>
                    <div style={{fontSize: 30, color: C.text3, marginTop: 10, display: 'flex', gap: 30}}>
                      <span>{c.meta}</span>
                      <span style={{fontWeight: 600}}>Répondre</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 20, color: C.text2, fontSize: 28}}>
                    <IconHeart size={42} color={C.text2} fill="none" stroke={2} />
                    {c.likes}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 1300 - 180 - 0,
                height: 180,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 22,
                padding: '30px 40px',
                background: '#161618',
              }}
            >
              <Avatar who="mv" size={84} />
              <div style={{flex: 1, height: 84, borderRadius: 42, background: C.ui3, display: 'flex', alignItems: 'center', padding: '0 34px', fontSize: 36, color: C.text3}}>
                Ajouter un commentaire…
              </div>
              <div style={{paddingTop: 16}}>
                <IconEmoji size={52} color={C.text2} />
              </div>
            </div>
          </div>
        </Phone>
      </Camera>
    </SceneShell>
  );
};
