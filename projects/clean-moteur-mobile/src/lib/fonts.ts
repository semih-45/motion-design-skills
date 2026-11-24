// Font loading (Montserrat + Caveat via @fontsource), blocking the render until ready.
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/montserrat/900-italic.css';
import '@fontsource/montserrat/800-italic.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';
import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

let promise: Promise<void> | null = null;
const loadAll = () => {
  if (!promise) {
    const specs = [
      "400 20px 'Montserrat'",
      "500 20px 'Montserrat'",
      "600 20px 'Montserrat'",
      "700 20px 'Montserrat'",
      "800 20px 'Montserrat'",
      "900 20px 'Montserrat'",
      "italic 900 20px 'Montserrat'",
      "italic 800 20px 'Montserrat'",
      "600 20px 'Caveat'",
      "700 20px 'Caveat'",
    ];
    promise = Promise.all(specs.map((s) => document.fonts.load(s, 'AÉéà€0123456789…'))).then(() => undefined);
  }
  return promise;
};

export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    loadAll().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};
