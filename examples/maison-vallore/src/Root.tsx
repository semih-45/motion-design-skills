import React from 'react';
import {Composition, Folder} from 'remotion';
import './fonts';
import {Main, SCENES, SceneSolo, span} from './Main';
import {FPS, H, TOTAL, W} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MaisonVallore" component={Main} width={W} height={H} fps={FPS} durationInFrames={TOTAL} />
    <Folder name="Scenes">
      {SCENES.map((s, i) => (
        <Composition
          key={s.id}
          id={s.id}
          component={SceneSolo}
          defaultProps={{index: i}}
          width={W}
          height={H}
          fps={FPS}
          durationInFrames={span(i).duration}
        />
      ))}
    </Folder>
  </>
);
