import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(96);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
// Rendu WebGL logiciel (pas de GPU requis) pour le pneu 3D.
Config.setChromiumOpenGlRenderer('swangle');
Config.setOverwriteOutput(true);
