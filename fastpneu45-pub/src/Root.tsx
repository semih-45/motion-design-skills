import React, {useEffect, useState} from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {FPS, HEIGHT, SCENES, TOTAL_SECONDS, WIDTH, f} from './config';
import {fontsReady} from './fonts';
import {Main} from './Main';
import {Intro} from './scenes/Intro';
import {Materiel} from './scenes/Materiel';
import {Telephone} from './scenes/Telephone';
import {ZoneIntervention} from './scenes/ZoneIntervention';
import {Final} from './scenes/Final';

const d = (s: {start: number; end: number}) => f(s.end) - f(s.start);
const common = {fps: FPS, width: WIDTH, height: HEIGHT};

export const Root: React.FC = () => {
  const [handle] = useState(() => delayRender('Chargement des polices'));
  useEffect(() => { fontsReady.then(() => continueRender(handle)); }, [handle]);
  return (
    <>
      {/* PUBLICITÉ COMPLÈTE */}
      <Composition id="FastPneu45" component={Main} durationInFrames={f(TOTAL_SECONDS)} {...common} />
      {/* SCÈNES INDÉPENDANTES (aperçu / rendu séparé) */}
      <Composition id="Scene1-Intro" component={Intro} durationInFrames={d(SCENES.intro)} {...common} />
      <Composition id="Scene2-Materiel" component={Materiel} durationInFrames={d(SCENES.materiel)} {...common} />
      <Composition id="Scene3-Telephone" component={Telephone} durationInFrames={d(SCENES.telephone)} {...common} />
      <Composition id="Scene4-Zone" component={ZoneIntervention} durationInFrames={d(SCENES.zone)} {...common} />
      <Composition id="Scene5-Final" component={Final} durationInFrames={d(SCENES.final)} defaultProps={{durationInFrames: d(SCENES.final)}} {...common} />
    </>
  );
};
