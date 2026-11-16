import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const faces: [string, string, string, string][] = [];
for (const w of ['600', '700', '800', '900']) {
  for (const s of ['normal', 'italic']) {
    faces.push(['Barlow Condensed', w, s, `fonts/barlow-condensed-latin-${w}-${s}.woff2`]);
  }
}
for (const w of ['400', '500', '600', '700']) {
  faces.push(['Inter', w, 'normal', `fonts/inter-latin-${w}-normal.woff2`]);
}
export const fontsReady = Promise.all(
  faces.map(([family, weight, style, url]) => loadFont({family, weight, style, url: staticFile(url)})),
);
