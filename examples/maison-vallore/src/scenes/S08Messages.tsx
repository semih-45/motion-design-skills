import React from 'react';
import {C, NB, SANS} from '../theme';
import {Camera, lerp, pop, SceneShell, useLocal} from '../lib/fx';
import {IconBack, IconCamera, IconEmoji, IconMore} from '../lib/icons';
import {Avatar, Phone} from '../lib/ui';

const MSGS: {mine: boolean; text: string; at: number}[] = [
  {mine: false, text: `Bonjour${NB}! Il existe en 36${NB}?`, at: 8},
  {mine: true, text: `Oui${NB}! Essayage samedi 15${NB}h${NB}?`, at: 28},
  {mine: false, text: `Parfait, à samedi${NB}!`, at: 48},
];

const Typing: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', gap: 10, padding: '30px 34px', borderRadius: 44, background: C.ui3, width: 'fit-content'}}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: '#fff', opacity: 0.35 + 0.65 * Math.max(0, Math.sin((f - i * 3) / 2.2))}} />
    ))}
  </div>
);

/** 8 · DM thread with Inès Morel, bubbles land one by one, camera creeps in. */
export const S08Messages: React.FC = () => {
  const f = useLocal();
  return (
    <SceneShell id="s08" bg="#000" dof={10}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 880, s: 1.0, rx: 16, ry: 18, rz: 2},
          {f: 40, x: 540, y: 700, s: 1.12, rx: 10, ry: 10, rz: 1},
          {f: 83, x: 540, y: 640, s: 1.24, rx: 6, ry: 5},
        ]}
      >
        <Phone>
          <div style={{position: 'absolute', inset: 0, background: '#000', fontFamily: SANS, color: '#fff'}}>
            {/* header */}
            <div style={{position: 'absolute', top: 130, left: 36, right: 40, height: 130, display: 'flex', alignItems: 'center', gap: 24}}>
              <IconBack size={56} />
              <Avatar who="ines" size={96} label="IM" />
              <div style={{flex: 1}}>
                <div style={{fontSize: 44, fontWeight: 700}}>Inès Morel</div>
                <div style={{fontSize: 30, color: C.text2, display: 'flex', alignItems: 'center', gap: 10}}>
                  <span style={{width: 14, height: 14, borderRadius: 7, background: '#31d158'}} /> Active maintenant
                </div>
              </div>
              <IconMore size={52} />
            </div>
            <div style={{position: 'absolute', top: 280, left: 0, right: 0, height: 1, background: C.line}} />
            <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontSize: 28, color: C.text3}}>
              Aujourd’hui 10:24
            </div>
            {/* thread */}
            <div style={{position: 'absolute', top: 410, left: 96, right: 96, display: 'flex', flexDirection: 'column', gap: 26}}>
              {MSGS.map((m, i) => {
                const typingOn = !m.mine && f >= m.at - 10 && f < m.at;
                const r = pop(f, m.at, 13);
                if (typingOn)
                  return (
                    <div key={i} style={{display: 'flex', gap: 18, alignItems: 'flex-end'}}>
                      <Avatar who="ines" size={70} label="IM" />
                      <Typing f={f} />
                    </div>
                  );
                if (f < m.at) return null;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 18,
                      alignItems: 'flex-end',
                      justifyContent: m.mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!m.mine ? <Avatar who="ines" size={70} label="IM" /> : null}
                    <div
                      style={{
                        maxWidth: 640,
                        padding: '30px 40px',
                        borderRadius: 46,
                        borderBottomLeftRadius: m.mine ? 46 : 12,
                        borderBottomRightRadius: m.mine ? 12 : 46,
                        background: m.mine ? C.red : C.ui3,
                        fontSize: 46,
                        lineHeight: 1.25,
                        fontWeight: 500,
                        transformOrigin: m.mine ? '100% 100%' : '0% 100%',
                        transform: `scale(${0.4 + 0.6 * r}) translateY(${(1 - Math.min(r, 1)) * 30}px)`,
                        opacity: Math.min(1, r * 1.5),
                        boxShadow: m.mine ? '0 14px 40px rgba(254,44,85,0.35)' : 'none',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {f >= 40 ? (
                <div style={{alignSelf: 'flex-end', fontSize: 26, color: C.text3, marginTop: -14, opacity: lerp(f, [40, 46], [0, 1])}}>Vu</div>
              ) : null}
            </div>
            {/* composer */}
            <div style={{position: 'absolute', left: 36, right: 36, bottom: 70, height: 110, borderRadius: 55, background: C.ui2, display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px'}}>
              <IconCamera size={50} color={C.text2} />
              <span style={{flex: 1, fontSize: 38, color: C.text3}}>Envoyer un message…</span>
              <IconEmoji size={50} color={C.text2} />
            </div>
          </div>
        </Phone>
      </Camera>
    </SceneShell>
  );
};
