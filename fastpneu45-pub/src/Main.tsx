import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {COLORS, FINAL, SCENES, f} from './config';
import {AudioTrack} from './components/AudioTrack';
import {Subtitles} from './components/Subtitles';
import {CutTransition} from './components/fx';
import {Intro} from './scenes/Intro';
import {Materiel} from './scenes/Materiel';
import {Telephone} from './scenes/Telephone';
import {ZoneIntervention} from './scenes/ZoneIntervention';
import {Final} from './scenes/Final';

const seq = (s: {start: number; end: number}) => ({from: f(s.start), durationInFrames: f(s.end) - f(s.start)});

export const Main: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.noir}}>
    <Sequence {...seq(SCENES.intro)} name="1 · Intro"><Intro /></Sequence>
    <Sequence {...seq(SCENES.materiel)} name="2 · Matériel"><Materiel /></Sequence>
    <Sequence {...seq(SCENES.telephone)} name="3 · Téléphone"><Telephone /></Sequence>
    <Sequence {...seq(SCENES.zone)} name="4 · Zone"><ZoneIntervention /></Sequence>
    <Sequence {...seq(SCENES.final)} name="5 · Final"><Final durationInFrames={seq(SCENES.final).durationInFrames} /></Sequence>
    {/* transitions mécaniques entre les scènes */}
    <CutTransition at={f(SCENES.materiel.start)} variant={0} />
    <CutTransition at={f(SCENES.telephone.start)} variant={1} />
    <CutTransition at={f(SCENES.zone.start)} variant={0} />
    <CutTransition at={f(SCENES.final.start)} variant={1} />
    <CutTransition at={f(SCENES.final.start + FINAL.nuitEnd)} variant={0} />
    <Subtitles />
    <AudioTrack />
  </AbsoluteFill>
);
