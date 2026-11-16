// Rend des images de contrôle : node tools/stills.mjs <dossier> <scale> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
const [out, scale, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'swangle'};
const browser = await openBrowser('chrome', {chromiumOptions});
const composition = await selectComposition({serveUrl, id: 'FastPneu45', puppeteerInstance: browser, chromiumOptions});
for (const fr of frames) {
  const t = Date.now();
  await renderStill({serveUrl, composition, frame: Number(fr), output: path.join(out, `f${String(fr).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, scale: Number(scale), puppeteerInstance: browser, chromiumOptions});
  console.log(fr, Date.now() - t, 'ms');
}
await browser.close({silent: true});
