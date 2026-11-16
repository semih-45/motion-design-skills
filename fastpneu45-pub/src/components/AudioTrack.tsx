import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {AUDIO, FPS, VOICE_OVER, f} from '../config';

/** volume de la musique : baisse automatiquement sous la voix off */
const musicVolume = (frame: number) => {
  const t = frame / FPS;
  let duck = 0;
  for (const l of VOICE_OVER) {
    const a = l.start - 0.25, b = l.start + l.duration + 0.3;
    if (t > a && t < b) duck = Math.max(duck, Math.min(1, (t - a) / 0.25, (b - t) / 0.3));
  }
  return AUDIO.music.volume + (AUDIO.music.duckedVolume - AUDIO.music.volume) * duck;
};

export const AudioTrack: React.FC = () => (
  <>
    <Audio src={staticFile(AUDIO.music.file)} volume={musicVolume} />
    {VOICE_OVER.map((l) => (
      <Sequence key={l.file} from={f(l.start)} layout="none">
        <Audio src={staticFile(l.file)} volume={AUDIO.voiceVolume} />
      </Sequence>
    ))}
    {AUDIO.sfx.map((s, i) => (
      <Sequence key={i} from={f(s.at)} layout="none">
        <Audio src={staticFile(s.file)} volume={s.volume} />
      </Sequence>
    ))}
  </>
);
