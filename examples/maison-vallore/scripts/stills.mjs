// Render key frames of the main composition as PNG stills (bundle once).
// Usage: node scripts/stills.mjs 30 120 400 ...   (frames)  → out/frames/f-XXX.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const frames = process.argv.slice(2).map(Number);
const id = process.env.COMP ?? 'MaisonVallore';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id, browserExecutable});
fs.mkdirSync('out/frames', {recursive: true});
for (const frame of frames) {
  const output = `out/frames/f-${String(frame).padStart(3, '0')}.png`;
  const t = Date.now();
  await renderStill({composition, serveUrl, output, frame, browserExecutable, scale: Number(process.env.SCALE ?? 0.5)});
  console.log(`${output} (${Date.now() - t} ms)`);
}
