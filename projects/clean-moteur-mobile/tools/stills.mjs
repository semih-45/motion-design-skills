// Render a list of frames as PNG stills (bundle once). Usage: node tools/stills.mjs 10 40 56 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const browserExecutable = process.env.REMOTION_CHROME || null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => c});
const comp = await selectComposition({serveUrl, id: 'CleanMoteurAd', browserExecutable, chromiumOptions: {gl: process.env.GL || 'angle'}});
for (const frame of frames) {
  const t = Date.now();
  await renderStill({composition: comp, serveUrl, output: `out/s-${frame}.png`, frame, browserExecutable, chromiumOptions: {gl: process.env.GL || 'angle'}});
  console.log(`frame ${frame} ${Date.now() - t}ms`);
}
