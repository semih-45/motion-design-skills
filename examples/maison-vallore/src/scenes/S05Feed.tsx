import React from 'react';
import {Camera, lerp, SceneShell, useLocal} from '../lib/fx';
import {FeedTopTabs, FeedVideo, NavBar, POSTS} from '../lib/feed';
import {Phone} from '../lib/ui';

/** 5 · Full-screen feed, three videos swipe up: coat → silk dress → tailoring. */
export const S05Feed: React.FC = () => {
  const f = useLocal();
  const s1 = lerp(f, [16, 28], [0, 1]);
  const s2 = lerp(f, [36, 48], [0, 1]);
  const y = -(s1 + s2) * 1920;
  return (
    <SceneShell id="s05" bg="#000" dof={8}>
      <Camera
        frame={f}
        keys={[
          {f: -8, x: 540, y: 960, s: 1.22, rx: 0, ry: 0},
          {f: 12, x: 540, y: 960, s: 0.9, rx: 8, ry: -14, rz: -1},
          {f: 40, x: 540, y: 980, s: 0.9, rx: 6, ry: 10, rz: 1},
          {f: 68, x: 540, y: 1000, s: 1.0, rx: 10, ry: 4},
        ]}
      >
        <Phone>
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${y}px)`}}>
            {POSTS.map((p, i) => (
              <div key={p.kind} style={{position: 'absolute', left: 0, top: i * 1920, width: 1080, height: 1920}}>
                <FeedVideo post={p} frame={f - i * 20} id={`s05-${i}`} />
              </div>
            ))}
          </div>
          <FeedTopTabs />
          <NavBar />
        </Phone>
      </Camera>
    </SceneShell>
  );
};
