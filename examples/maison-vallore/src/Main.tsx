import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {BOUNDS, LEAD} from './theme';
import {SceneCtx} from './lib/fx';
import {S01Logo} from './scenes/S01Logo';
import {S02Hands} from './scenes/S02Hands';
import {S03Search} from './scenes/S03Search';
import {S04Results} from './scenes/S04Results';
import {S05Feed} from './scenes/S05Feed';
import {S06Profile} from './scenes/S06Profile';
import {S07Comments} from './scenes/S07Comments';
import {S08Messages} from './scenes/S08Messages';
import {S09DoubleTap} from './scenes/S09DoubleTap';
import {S10Share} from './scenes/S10Share';
import {S11Outro} from './scenes/S11Outro';

export const SCENES: {id: string; name: string; C: React.FC}[] = [
  {id: 'S01-Logo', name: '1 · Logo', C: S01Logo},
  {id: 'S02-Mains', name: '2 · Mains + téléphone', C: S02Hands},
  {id: 'S03-Recherche', name: '3 · Recherche', C: S03Search},
  {id: 'S04-Resultats', name: '4 · Résultats', C: S04Results},
  {id: 'S05-Fil', name: '5 · Fil', C: S05Feed},
  {id: 'S06-Profil', name: '6 · Profil', C: S06Profile},
  {id: 'S07-Commentaires', name: '7 · Commentaires', C: S07Comments},
  {id: 'S08-Messages', name: '8 · Messagerie', C: S08Messages},
  {id: 'S09-DoubleTap', name: '9 · Double-tap', C: S09DoubleTap},
  {id: 'S10-Envoyer', name: '10 · Envoyer à', C: S10Share},
  {id: 'S11-Outro', name: '11 · Outro', C: S11Outro},
];

const last = SCENES.length - 1;

/** Sequence span of scene i: nominal [BOUNDS[i], BOUNDS[i+1]) plus LEAD frames of overlap each side. */
export const span = (i: number) => {
  const lead = i > 0 ? LEAD : 0;
  const tail = i < last ? LEAD : 0;
  return {from: BOUNDS[i] - lead, duration: BOUNDS[i + 1] - BOUNDS[i] + lead + tail, lead};
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    {SCENES.map((s, i) => {
      const {from, duration, lead} = span(i);
      return (
        <Sequence key={s.id} from={from} durationInFrames={duration} name={s.name}>
          <SceneCtx.Provider value={{lead, length: BOUNDS[i + 1] - BOUNDS[i], hasIn: i > 0, hasOut: i < last}}>
            <s.C />
          </SceneCtx.Provider>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

/** Stand-alone wrapper used by the per-scene compositions (no cross-fades). */
export const SceneSolo: React.FC<{index: number}> = ({index}) => {
  const s = SCENES[index];
  const {lead} = span(index);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <SceneCtx.Provider value={{lead, length: BOUNDS[index + 1] - BOUNDS[index], hasIn: false, hasOut: false}}>
        <s.C />
      </SceneCtx.Provider>
    </AbsoluteFill>
  );
};
