import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {World3D} from './three/World';
import {Background, Grain} from './components/Atmos';
import {useFontsReady} from './lib/fonts';
import {shake} from './lib/anim';
import {C} from './timeline';
import {S1Hook} from './scenes/S1Hook';
import {S2S3Car} from './scenes/S2S3Car';
import {S4Chat} from './scenes/S4Chat';
import {S5Travel} from './scenes/S5Travel';
import {S6Meca} from './scenes/S6Meca';
import {S7Cta} from './scenes/S7Cta';
import {S8End} from './scenes/S8End';
import {TopLogo} from './scenes/TopLogo';
import {DropGuide} from './scenes/DropGuide';
import {PriceClaim} from './scenes/PriceClaim';

export const adSchema = z.object({
  phoneDisplay: z.string(),
  snapchatHandle: z.string(),
  withAudio: z.boolean(),
  carColor: z.enum(['bleu', 'blanc']),
});

export type AdProps = z.infer<typeof adSchema>;

const IMPACTS = [
  {f: C.lightOn, amp: 10},
  {f: C.word1, amp: 22},
  {f: C.word2, amp: 22},
  {f: C.word3, amp: 26},
  {f: C.dropHit, amp: 14},
  {f: C.pinDrop + 8, amp: 10},
  {f: C.garageStrike, amp: 18},
  {f: C.disc + 2, amp: 8},
  {f: C.priceClaim, amp: 12},
  {f: C.logoBig + 14, amp: 8},
];

export const Ad: React.FC<AdProps> = (props) => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  const sh = shake(f, IMPACTS);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {ready && (
        <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(1.02)`}}>
          <Background />
          <World3D carColor={props.carColor} />
          <S1Hook />
          <S2S3Car />
          <S4Chat />
          <S5Travel />
          <S6Meca />
          <S7Cta {...props} />
          <PriceClaim />
          <S8End {...props} />
          <DropGuide />
          <TopLogo />
        </AbsoluteFill>
      )}
      <Grain />
      {props.withAudio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
