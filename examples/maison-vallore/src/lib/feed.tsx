import React from 'react';
import {interpolate} from 'remotion';
import {C, NB, SANS} from '../theme';
import {clamp} from './fx';
import {
  IconBookmark,
  IconComment,
  IconCompass,
  IconHeart,
  IconHome,
  IconInbox,
  IconMusic,
  IconPlus,
  IconShare,
  IconUser,
} from './icons';
import {Photo, PhotoKind} from './photos';
import {Avatar} from './ui';

export type FeedPost = {
  kind: PhotoKind;
  caption: string;
  tags: string;
  likes: string;
  comments: string;
  saves: string;
  shares: string;
};

export const POSTS: FeedPost[] = [
  {
    kind: 'street',
    caption: `Le manteau camel, double face cachemire. Coupé et cousu à Paris.`,
    tags: '#manteaucachemire #paris #slowfashion',
    likes: `48,2${NB}k`,
    comments: '1 248',
    saves: `9 310`,
    shares: `2 104`,
  },
  {
    kind: 'salon',
    caption: `Soie ivoire, coupe en biais. Lumière d'après-midi, avenue Montaigne.`,
    tags: '#robedesoie #hautecouture #paris8',
    likes: `86,4${NB}k`,
    comments: '3 517',
    saves: `21,6${NB}k`,
    shares: `5 882`,
  },
  {
    kind: 'atelier',
    caption: `Quarante heures de main pour un tailleur. Rien n'est laissé au hasard.`,
    tags: '#surmesure #savoirfaire #atelier',
    likes: `22,9${NB}k`,
    comments: '640',
    saves: `4 902`,
    shares: `1 377`,
  },
];

export const NavBar: React.FC = () => {
  const item = (icon: React.ReactNode, label: string, active = false) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: 160,
        color: active ? '#fff' : C.text2,
        fontFamily: SANS,
        fontSize: 26,
        fontWeight: 600,
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 170,
        background: '#000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        paddingTop: 22,
        zIndex: 15,
      }}
    >
      {item(<IconHome size={54} />, 'Accueil', true)}
      {item(<IconCompass size={54} color={C.text2} />, 'Découvrir')}
      <div style={{width: 160, display: 'flex', justifyContent: 'center', paddingTop: 4}}>
        <CreateButton w={112} h={74} />
      </div>
      {item(<IconInbox size={54} color={C.text2} />, 'Boîte de réception')}
      {item(<IconUser size={54} color={C.text2} />, 'Profil')}
    </div>
  );
};

/** The app's “+” create button: black pill with cyan / red offset edges. */
export const CreateButton: React.FC<{w: number; h: number; split?: number; plus?: number}> = ({w, h, split = 1, plus = 1}) => {
  const o = w * 0.07 * split;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: h * 0.3, background: C.cyan, transform: `translateX(${-o}px)`}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: h * 0.3, background: C.red, transform: `translateX(${o}px)`}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: h * 0.3,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{opacity: plus, transform: `scale(${0.6 + plus * 0.4})`}}>
          <IconPlus size={h * 0.62} color="#000" stroke={3.2} />
        </div>
      </div>
    </div>
  );
};

const Action: React.FC<{icon: React.ReactNode; label: string; scale?: number}> = ({icon, label, scale = 1}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
    <div style={{transform: `scale(${scale})`, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.45))'}}>{icon}</div>
    <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.5)'}}>{label}</span>
  </div>
);

/** One full-screen short video with its overlay UI. */
export const FeedVideo: React.FC<{
  post: FeedPost;
  frame: number;
  liked?: boolean;
  likeScale?: number;
  likesLabel?: string;
  chrome?: boolean;
  id?: string;
}> = ({post, frame, liked, likeScale = 1, likesLabel, chrome = true, id}) => {
  const kb = 1.06 + interpolate(frame, [-20, 120], [0, 0.06], clamp);
  const disc = (frame * 4) % 360;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${kb})`}}>
        <Photo kind={post.kind} id={id ?? `fv-${post.kind}`} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.72) 92%)',
        }}
      />
      {chrome ? (
        <>
          {/* right action column */}
          <div
            style={{
              position: 'absolute',
              right: 28,
              top: 900,
              width: 130,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 38,
            }}
          >
            <div style={{position: 'relative', marginBottom: 18}}>
              <div style={{border: '4px solid #fff', borderRadius: '50%'}}>
                <Avatar who="mv" size={104} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 37,
                  bottom: -20,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: C.red,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPlus size={28} stroke={3.4} />
              </div>
            </div>
            <Action
              icon={<IconHeart size={96} color={liked ? C.red : '#fff'} />}
              label={likesLabel ?? post.likes}
              scale={likeScale}
            />
            <Action icon={<IconComment size={92} />} label={post.comments} />
            <Action icon={<IconBookmark size={86} />} label={post.saves} />
            <Action icon={<IconShare size={86} />} label={post.shares} />
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                marginTop: 6,
                background: 'conic-gradient(#333, #111, #333, #111, #333)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${disc}deg)`,
              }}
            >
              <Avatar who="mv" size={52} />
            </div>
          </div>
          {/* caption block */}
          <div
            style={{
              position: 'absolute',
              left: 44,
              bottom: 210,
              width: 790,
              fontFamily: SANS,
              color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{fontWeight: 700, fontSize: 46, marginBottom: 14}}>maison.vallore</div>
            <div style={{fontWeight: 400, fontSize: 38, lineHeight: 1.32}}>{post.caption}</div>
            <div style={{fontWeight: 700, fontSize: 38, lineHeight: 1.32, marginTop: 6}}>{post.tags}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, fontSize: 34, fontWeight: 500}}>
              <IconMusic size={36} />
              <span>son original — Maison Valloré</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export const FeedTopTabs: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 128,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: 56,
      fontFamily: SANS,
      fontSize: 42,
      fontWeight: 700,
      zIndex: 12,
      textShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }}
  >
    <span style={{color: 'rgba(255,255,255,0.6)'}}>Abonnements</span>
    <span style={{color: '#fff', position: 'relative'}}>
      Pour toi
      <span style={{position: 'absolute', left: '28%', right: '28%', bottom: -14, height: 6, borderRadius: 3, background: '#fff'}} />
    </span>
  </div>
);
