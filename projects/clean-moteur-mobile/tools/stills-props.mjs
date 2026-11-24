// Like stills.mjs but with input props: node tools/stills-props.mjs '{"carColor":"blanc"}' prefix 100 296
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [propsJson, prefix, ...frames] = process.argv.slice(2);
const inputProps = JSON.parse(propsJson);
const browserExecutable = process.env.REMOTION_CHROME || null;
const chromiumOptions = {gl: process.env.GL || 'angle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'CleanMoteurAd', browserExecutable, chromiumOptions, inputProps});
for (const f of frames.map(Number)) {
  await renderStill({composition: comp, serveUrl, output: `out/${prefix}-${f}.png`, frame: f, browserExecutable, chromiumOptions, inputProps});
  console.log(`frame ${f}`);
}
