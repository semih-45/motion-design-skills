import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, EASE_IN, SANS} from '../theme';
import {lerp, pop, SceneShell, useLocal} from '../lib/fx';
import {AppMark} from '../lib/ui';

/** 1 · Off-white field: a dot swells into the app mark, then rushes the lens. */
export const S01Logo: React.FC = () => {
  const f = useLocal();
  const grow = pop(f, 0, 14); // dot appears
  const morph = lerp(f, [8, 24], [0, 1]); // dot → icon
  const size = 34 * grow + morph * (300 - 34);
  const radius = lerp(morph, [0, 1], [50, 27]);
  const markO = lerp(f, [14, 22], [0, 1]);
  const split = lerp(f, [16, 28], [3, 1]);
  // rush toward camera
  const rush = lerp(f, [27, 45], [1, 22], EASE_IN);
  const tilt = lerp(f, [27, 45], [0, -14], EASE_IN);
  const word = lerp(f, [18, 26], [0, 1]) * lerp(f, [27, 32], [1, 0]);
  return (
    <SceneShell id="s01" bg={C.paper} lens="light" dof={0}>
      <AbsoluteFill style={{perspective: 1800, alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: `${radius}%`,
            background: C.ink,
            position: 'relative',
            transform: `rotateX(${tilt}deg) scale(${rush})`,
            boxShadow: `0 ${30 * morph}px ${80 * morph}px rgba(30,20,10,${0.28 * morph})`,
            overflow: 'hidden',
          }}
        >
          <div style={{position: 'absolute', inset: 0, opacity: markO}}>
            <AppMark size={size} split={split} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 960 + 200,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: -1,
            color: C.ink,
            opacity: word,
            transform: `translateY(${(1 - word) * 20}px)`,
          }}
        >
          défilé
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
