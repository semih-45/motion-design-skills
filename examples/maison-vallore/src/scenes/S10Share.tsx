import React from 'react';
import {C, SANS} from '../theme';
import {Camera, lerp, pop, SceneShell, Tap, useLocal} from '../lib/fx';
import {FeedVideo, POSTS} from '../lib/feed';
import {IconBubble, IconCheck, IconClose, IconDownload, IconLink, IconMail, IconSearch, IconStory} from '../lib/icons';
import {Avatar, Phone} from '../lib/ui';

const CONTACTS = [
  {who: 'ines', name: 'Inès Morel', label: 'IM'},
  {who: 'camille', name: 'Camille D.', label: 'CD'},
  {who: 'hugo', name: 'Hugo L.', label: 'HL'},
  {who: 'lea', name: 'Léa R.', label: 'LR'},
  {who: 'sofia', name: 'Sofia M.', label: 'SM'},
];

const APPS: {label: string; bg: string; icon: React.ReactNode}[] = [
  {label: 'Copier le lien', bg: '#3a3a3f', icon: <IconLink size={56} />},
  {label: 'Messages', bg: '#2fb35b', icon: <IconBubble size={58} />},
  {label: 'E-mail', bg: '#3d7cf5', icon: <IconMail size={56} />},
  {label: 'Story', bg: 'linear-gradient(135deg,#8a4dff,#ff4d8d)', icon: <IconStory size={58} />},
  {label: 'Enregistrer', bg: '#3a3a3f', icon: <IconDownload size={56} />},
];

const SHEET_H = 900;
const PICK = 18;
const SEND = 38;

/** 10 · « Envoyer à » sheet: pick Inès, hit Envoyer, toast « Envoyé ✓ ». */
export const S10Share: React.FC = () => {
  const f = useLocal();
  const up = lerp(f, [-6, 12], [0, 1]) * (1 - lerp(f, [42, 54], [0, 1]));
  const sheetTop = 1920 - SHEET_H * up;
  const picked = f >= PICK;
  const pickPop = pop(f, PICK, 10);
  const sendBtn = lerp(f, [PICK + 2, PICK + 12], [0, 1]);
  const sendPress = lerp(f, [SEND - 3, SEND, SEND + 4], [0, 1, 0]);
  const toast = pop(f, SEND + 6, 12) * (1 - lerp(f, [66, 72], [0, 1]));
  const sx = (i: number) => 108 + i * 216;
  return (
    <SceneShell id="s10" bg="#000" dof={9}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 1180, s: 1.0, rx: 14, ry: -14, rz: -1},
          {f: 26, x: 540, y: 1430, s: 1.3, rx: 12, ry: -8},
          {f: 44, x: 540, y: 1500, s: 1.3, rx: 10, ry: -6},
          {f: 68, x: 540, y: 1050, s: 1.12, rx: 8, ry: 6},
        ]}
      >
        <Phone>
          <FeedVideo post={POSTS[1]} frame={f + 120} liked id="s10v" likesLabel="91,9 k" />
          <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.45 * up})`}} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: sheetTop,
              height: SHEET_H + 40,
              borderRadius: '44px 44px 0 0',
              background: '#161618',
              fontFamily: SANS,
              color: '#fff',
            }}
          >
            <div style={{height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 40, fontWeight: 700}}>
              <div style={{position: 'absolute', left: 44}}>
                <IconSearch size={46} />
              </div>
              Envoyer à
              <div style={{position: 'absolute', right: 44}}>
                <IconClose size={46} />
              </div>
            </div>
            {/* contacts */}
            {CONTACTS.map((c, i) => {
              const sel = i === 0 && picked;
              return (
                <div key={c.who} style={{position: 'absolute', left: sx(i) - 90, top: 150, width: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
                  <div style={{position: 'relative', transform: `scale(${sel ? 0.92 + 0.08 * pickPop : 1})`}}>
                    <Avatar who={c.who} size={140} label={c.label} ring={sel ? C.red : undefined} />
                    {sel ? (
                      <div
                        style={{
                          position: 'absolute',
                          right: -6,
                          bottom: -4,
                          width: 54,
                          height: 54,
                          borderRadius: 27,
                          background: C.red,
                          border: '5px solid #161618',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: `scale(${pickPop})`,
                        }}
                      >
                        <IconCheck size={32} stroke={3.4} />
                      </div>
                    ) : null}
                  </div>
                  <span style={{fontSize: 30, color: sel ? '#fff' : C.text2, fontWeight: sel ? 700 : 500, whiteSpace: 'nowrap'}}>{c.name}</span>
                </div>
              );
            })}
            <div style={{position: 'absolute', left: 40, right: 40, top: 410, height: 1, background: C.line}} />
            {/* apps */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 450, opacity: 1 - sendBtn * 0.6}}>
              {APPS.map((a, i) => (
                <div key={a.label} style={{position: 'absolute', left: sx(i) - 90, width: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
                  <div style={{width: 120, height: 120, borderRadius: 60, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{a.icon}</div>
                  <span style={{fontSize: 28, color: C.text2, whiteSpace: 'nowrap'}}>{a.label}</span>
                </div>
              ))}
            </div>
            {/* send bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 660,
                height: 240,
                background: '#161618',
                padding: '24px 40px',
                transform: `translateY(${(1 - sendBtn) * 260}px)`,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div
                style={{
                  height: 128,
                  borderRadius: 22,
                  background: C.red,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 46,
                  fontWeight: 700,
                  transform: `scale(${1 - sendPress * 0.05})`,
                  boxShadow: '0 16px 44px rgba(254,44,85,0.4)',
                }}
              >
                Envoyer
              </div>
            </div>
          </div>
          {/* toast */}
          {toast > 0.01 ? (
            <div style={{position: 'absolute', left: 0, right: 0, top: 880, display: 'flex', justifyContent: 'center', zIndex: 45}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '30px 50px',
                  borderRadius: 60,
                  background: 'rgba(30,30,33,0.96)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: SANS,
                  fontSize: 46,
                  fontWeight: 700,
                  color: '#fff',
                  transform: `scale(${toast})`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
              >
                Envoyé
                <div style={{width: 56, height: 56, borderRadius: 28, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <IconCheck size={36} stroke={3.4} />
                </div>
              </div>
            </div>
          ) : null}
          <Tap x={sx(0)} y={1920 - SHEET_H + 220} at={PICK} frame={f} />
          <Tap x={640} y={1920 - SHEET_H + 660 + 24 + 64} at={SEND} frame={f} />
        </Phone>
      </Camera>
    </SceneShell>
  );
};
