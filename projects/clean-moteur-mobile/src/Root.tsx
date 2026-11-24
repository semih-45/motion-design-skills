import React from 'react';
import {Composition} from 'remotion';
import {Ad, adSchema} from './Ad';
import {FPS, TOTAL_FRAMES, W, H} from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="CleanMoteurAd"
      component={Ad}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      schema={adSchema}
      defaultProps={{
        phoneDisplay: '07 45 16 23 57',
        snapchatHandle: 'clean.moteur',
        withAudio: true,
        carColor: 'bleu',
      }}
    />
  </>
);
