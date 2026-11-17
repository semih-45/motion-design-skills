import React from 'react';
import {interpolate, random} from 'remotion';
import {C, EASE_OUT, NB, SANS} from '../theme';
import {Camera, clamp, lerp, pop, SceneShell, Tap, useLocal} from '../lib/fx';
import {FeedTopTabs, FeedVideo, NavBar, POSTS} from '../lib/feed';
import {IconHeart} from '../lib/icons';
import {Avatar, Phone} from '../lib/ui';

const TAP_X = 470;
const TAP_Y = 900;
const T1 = 8;
const T2 = 14;

const FOLLOWERS = [
  {who: 'lucie', user: 'lucie.bnt'},
  {who: 'noe', user: 'noe.vrd'},
  {who: 'ana', user: 'ana.lisboa'},
  {who: 'sofia', user: 'sofia.mrc'},
];

const BigHeart: React.FC<{f: number}> = ({f}) => {
  const p = pop(f, T2, 12);
  const burst = lerp(f, [26, 40], [0, 1], EASE_OUT);
  const o = interpolate(f, [T2, T2 + 2, 26, 32], [0, 1, 1, 0], clamp);
  if (f < T2) return null;
  return (
    <div style={{position: 'absolute', left: TAP_X, top: TAP_Y, width: 0, height: 0, zIndex: 25}}>
      <div
        style={{
          position: 'absolute',
          left: -170,
          top: -170,
          opacity: o,
          transform: `rotate(-12deg) scale(${p * (1 + burst * 0.5)})`,
          filter: 'drop-shadow(0 12px 40px rgba(254,44,85,0.6))',
        }}
      >
        <IconHeart size={340} color={C.red} />
      </div>
      {/* particle burst */}
      {Array.from({length: 26}).map((_, i) => {
        const a = (i / 26) * Math.PI * 2 + random(`pa${i}`) * 0.4;
        const d = (180 + random(`pd${i}`) * 260) * burst;
        const sz = 22 + random(`ps${i}`) * 40;
        const po = interpolate(f, [25, 28, 44], [0, 1, 0], clamp);
        const isHeart = i % 3 !== 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: Math.cos(a) * d - sz / 2,
              top: Math.sin(a) * d - sz / 2 - burst * 40,
              opacity: po,
              transform: `rotate(${a * 30}deg) scale(${1 - burst * 0.4})`,
            }}
          >
            {isHeart ? (
              <IconHeart size={sz} color={i % 2 ? C.red : '#ff6f8b'} />
            ) : (
              <div style={{width: sz * 0.5, height: sz * 0.5, borderRadius: '50%', background: i % 2 ? C.red : '#fff'}} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Notification: React.FC<{who: string; user: string; depth: number; enter: number}> = ({who, user, depth, enter}) => (
  <div
    style={{
      position: 'absolute',
      left: 40,
      right: 40,
      top: 130,
      height: 156,
      borderRadius: 40,
      background: 'rgba(28,28,31,0.94)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      padding: '0 34px',
      fontFamily: SANS,
      color: '#fff',
      transformOrigin: '50% 0%',
      transform: `translateY(${(1 - enter) * -260 + depth * 34}px) scale(${1 - depth * 0.05})`,
      opacity: Math.min(1, enter * 1.4) * (1 - depth * 0.22),
      zIndex: 40 - depth,
    }}
  >
    <Avatar who={who} size={92} />
    <div style={{flex: 1}}>
      <div style={{fontSize: 36, fontWeight: 700}}>Nouvel abonné</div>
      <div style={{fontSize: 32, color: C.text2, marginTop: 4}}>{user} a commencé à vous suivre.</div>
    </div>
    <span style={{fontSize: 28, color: C.text3, alignSelf: 'flex-start', marginTop: 32}}>maintenant</span>
  </div>
);

/** 9 · Double-tap on the silk-dress video: heart bursts, likes climb, follower toasts stack. */
export const S09DoubleTap: React.FC = () => {
  const f = useLocal();
  const liked = f >= T2;
  const likePop = liked ? 1 + 0.35 * Math.max(0, 1 - Math.abs(pop(f, T2, 10) - 1) * 3) * lerp(f, [T2, T2 + 10], [1, 0]) : 1;
  const likes = interpolate(f, [T2, 72], [86412, 91873], {...clamp, easing: EASE_OUT});
  const likesLabel = `${(likes / 1000).toFixed(1).replace('.', ',')}${NB}k`;
  const enters = FOLLOWERS.map((_, i) => lerp(f, [30 + i * 9, 40 + i * 9], [0, 1]));
  return (
    <SceneShell id="s09" bg="#000" dof={8}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 960, s: 1.12, rx: 10, ry: -14, rz: -1},
          {f: 24, x: 520, y: 900, s: 1.08, rx: 6, ry: -8},
          {f: 83, x: 560, y: 820, s: 1.16, rx: 10, ry: 8, rz: 1},
        ]}
      >
        <Phone>
          <FeedVideo post={POSTS[1]} frame={f + 40} liked={liked} likeScale={likePop} likesLabel={likesLabel} id="s09v" />
          <FeedTopTabs />
          <NavBar />
          <BigHeart f={f} />
          {FOLLOWERS.map((n, i) => {
            if (enters[i] <= 0) return null;
            const depth = enters.slice(i + 1).reduce((a, e) => a + e, 0);
            return <Notification key={n.user} who={n.who} user={n.user} depth={depth} enter={enters[i]} />;
          })}
          <Tap x={TAP_X} y={TAP_Y} at={T1} double={T2 - T1} frame={f} />
        </Phone>
      </Camera>
    </SceneShell>
  );
};
