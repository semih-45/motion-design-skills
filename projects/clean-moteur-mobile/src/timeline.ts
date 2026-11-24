// Single source of truth for timing. 30 fps, 900 frames = 30.0 s.
// Music is 120 BPM -> one beat every 15 frames; every scene boundary sits on a beat.
import cues from './cues.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const TOTAL_FRAMES = 900;

export const SAFE_TOP = 150; // nothing important above this (Snapchat UI)
export const SAFE_BOTTOM = H - 250; // nothing important below this

export const S = cues.scenes as {
  hook: number;
  problem: number;
  solution: number;
  chat: number;
  travel: number;
  meca: number;
  cta: number;
  end: number;
};

export const C = cues.events as Record<string, number>;

export const COLORS = {
  navy: '#0B1E3F',
  night: '#050B18',
  blue: '#1E6BFF',
  blueGlow: '#4F8DFF',
  red: '#E3262E',
  green: '#2BD17E',
  greenDeep: '#14A862',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  ink: '#0B1E3F',
};

export const FONT = {
  sans: "'Montserrat', sans-serif",
  hand: "'Caveat', cursive",
};
