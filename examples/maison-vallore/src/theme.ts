import {Easing} from 'remotion';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  paper: '#F2F2F0',
  ink: '#0A0A0B',
  cyan: '#25F4EE',
  red: '#FE2C55',
  ui: '#121214',
  ui2: '#1E1E21',
  ui3: '#2A2A2E',
  line: 'rgba(255,255,255,0.10)',
  text: '#FFFFFF',
  text2: 'rgba(255,255,255,0.62)',
  text3: 'rgba(255,255,255,0.40)',
  camel: '#B98A5A',
  ivory: '#EFE6D6',
};

export const SANS = "'Inter', 'Helvetica Neue', Arial, sans-serif";
export const SERIF = "'Cormorant Garamond', 'Times New Roman', serif";

/** Narrow no-break space — French typography before ? ! : ; */
export const NB = ' ';

/** Smooth, heavily damped camera ease (feels like a critically damped spring). */
export const EASE = Easing.bezier(0.45, 0, 0.15, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/**
 * Scene boundaries in frames (30 fps). 11 scenes, 25.5 s total.
 */
export const BOUNDS = [0, 45, 105, 195, 240, 300, 405, 450, 525, 600, 660, 765];
export const TOTAL = BOUNDS[BOUNDS.length - 1];
/** Frames of overlap on each side of a cut (transition = 2 * LEAD frames). */
export const LEAD = 8;
