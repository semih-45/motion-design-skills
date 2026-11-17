import {continueRender, delayRender} from 'remotion';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';

// Block rendering until every face is ready so nothing pops in mid-render.
if (typeof document !== 'undefined') {
  const handle = delayRender('Chargement des polices');
  const faces = [
    '400 20px Inter',
    '500 20px Inter',
    '600 20px Inter',
    '700 20px Inter',
    '800 20px Inter',
    '500 20px "Cormorant Garamond"',
    '600 20px "Cormorant Garamond"',
    'italic 500 20px "Cormorant Garamond"',
  ];
  Promise.all(faces.map((f) => document.fonts.load(f, 'Aàéè?')))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}
