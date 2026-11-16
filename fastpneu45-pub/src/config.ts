/**
 * FASTPNEU45 — CONFIGURATION CENTRALE
 * Tout ce qui se modifie couramment est ici : textes, photos, couleurs,
 * durées, coordonnées, voix off, musique, bruitages.
 * Les temps sont en SECONDES (convertis en images via `f()`).
 */
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const f = (seconds: number) => Math.round(seconds * FPS);

export const COLORS = {
  noir: '#05070B',
  bleu: '#087BFF',
  neon: '#00A8FF',
  blanc: '#FFFFFF',
  metal: '#AEB8C6',
  metalSombre: '#5B6675',
};

export const BRAND = {
  nom: 'FASTPNEU45',
  slogan: ['L’ATELIER MOBILE', 'QUI VIENT À VOUS.'],
  telephone: '06 50 12 44 08',
  site: 'fastpneu45.com',
  siteUrl: 'https://fastpneu45.com',
  snapchat: '@fastpneu45',
  zone: 'ORLÉANS ET SES AGGLOMÉRATIONS',
  dispo: 'DISPONIBLE 7J/7 — 24H/24',
  devis: 'DEVIS GRATUIT',
};

export const FONT_TITRE = 'Barlow Condensed';
export const FONT_TEXTE = 'Inter';

/* ------------------------------------------------------------------ */
/* DÉCOUPAGE — début de chaque scène (secondes). Calé sur la musique   */
/* (120 BPM : une pulsation toutes les 0,5 s).                         */
/* ------------------------------------------------------------------ */
export const TOTAL_SECONDS = 34.8;
export const SCENES = {
  intro: {start: 0, end: 4},
  materiel: {start: 4, end: 12},
  telephone: {start: 12, end: 18.5},
  zone: {start: 18.5, end: 23},
  final: {start: 23, end: TOTAL_SECONDS},
};

/* ------------------------------------------------------------------ */
/* PHOTOS — déposer les fichiers dans /public/assets/ puis les         */
/* déclarer ici (largeur/hauteur réelles pour ne jamais déformer).     */
/* ------------------------------------------------------------------ */
export type PhotoDef = {src: string; w: number; h: number};
export const PHOTOS = {
  logo: {src: 'assets/logo.png', w: 1536, h: 1024},
  camionProfil: {src: 'assets/camion-profil.jpg', w: 1242, h: 2208},
  demontePneu: {src: 'assets/demonte-pneu.jpg', w: 1170, h: 1560},
  atelierInterieur: {src: 'assets/atelier-interieur.jpg', w: 1242, h: 2208},
  interventionVolvo: {src: 'assets/intervention-volvo.jpg', w: 1242, h: 2208},
  camionLogo: {src: 'assets/camion-logo.jpg', w: 1242, h: 2208},
  crepuscule: {src: 'assets/intervention-crepuscule.jpg', w: 1170, h: 1560},
  clio3: {src: 'assets/intervention-clio3.jpg', w: 1170, h: 1560},
  nuit: {src: 'assets/intervention-nuit.jpg', w: 1170, h: 1560},
  jantes: {src: 'assets/jantes-camion.jpg', w: 1242, h: 2208},
} satisfies Record<string, PhotoDef>;

/* Position caméra sur une photo : x/y = point visé (0→1 dans l'image),
   scale = zoom (1 = l'image remplit tout l'écran), rot* en degrés. */
export type Cam = {x: number; y: number; scale: number; rotX?: number; rotY?: number; rotZ?: number};
export type Reveal = 'dark' | 'slices' | 'wipe' | 'iris' | 'push' | 'flash';
export type Callout = {
  shape: 'box' | 'ring';
  // zone dans l'image (0→1)
  x: number; y: number; w: number; h: number;
  label: string;
  labelSide?: 'top' | 'bottom';
};
export type Shot = {
  photo: PhotoDef;
  start: number; // secondes (absolu)
  end: number;
  from: Cam;
  to: Cam;
  reveal: Reveal;
  /** sujet mis en avant par le faux relief 2.5D (ellipse dans l'image, 0→1) */
  subject?: {x: number; y: number; rx: number; ry: number};
  sweep?: boolean; // balayage lumineux bleu
  rackFocus?: boolean; // mise au point progressive
  speedLines?: boolean;
  callout?: Callout;
  kicker?: string; // petit libellé au-dessus du titre
  title?: string[];
};

/* SCÈNE 2 — MATÉRIEL : un plan = une photo réelle + son animation dédiée */
export const SHOTS_MATERIEL: Shot[] = [
  {
    photo: PHOTOS.camionProfil, start: 4, end: 6.5, reveal: 'dark',
    from: {x: 0.22, y: 0.5, scale: 2.05, rotY: -7}, to: {x: 0.43, y: 0.5, scale: 1.72, rotY: 3},
    subject: {x: 0.42, y: 0.5, rx: 0.3, ry: 0.12}, sweep: true,
    kicker: 'FASTPNEU45', title: ['VIENT DIRECTEMENT', 'À VOUS'],
  },
  {
    photo: PHOTOS.demontePneu, start: 6.5, end: 7.5, reveal: 'slices',
    from: {x: 0.4, y: 0.4, scale: 1.02, rotY: -12, rotX: 4}, to: {x: 0.38, y: 0.43, scale: 1.28, rotY: 7, rotX: -2},
    subject: {x: 0.37, y: 0.42, rx: 0.34, ry: 0.24},
    callout: {shape: 'ring', x: 0.06, y: 0.2, w: 0.63, h: 0.47, label: 'DÉMONTE-PNEU', labelSide: 'top'},
    kicker: '01', title: ['MONTAGE', 'DE PNEUS'],
  },
  {
    photo: PHOTOS.atelierInterieur, start: 7.5, end: 8.5, reveal: 'wipe',
    from: {x: 0.3, y: 0.42, scale: 1.75, rotY: 9}, to: {x: 0.42, y: 0.44, scale: 1.3, rotY: -4},
    subject: {x: 0.16, y: 0.4, rx: 0.2, ry: 0.2}, sweep: true,
    callout: {shape: 'box', x: 0.035, y: 0.245, w: 0.25, h: 0.31, label: 'ÉQUILIBREUSE', labelSide: 'top'},
    kicker: '02', title: ['ÉQUILIBRAGE', 'PROFESSIONNEL'],
  },
  {
    photo: PHOTOS.interventionVolvo, start: 8.5, end: 9.5, reveal: 'iris',
    from: {x: 0.3, y: 0.66, scale: 1.9, rotZ: -2.5}, to: {x: 0.46, y: 0.55, scale: 1.2, rotZ: 0.5},
    subject: {x: 0.4, y: 0.52, rx: 0.42, ry: 0.2}, rackFocus: true,
    kicker: '03', title: ['RÉPARATION', 'DE CREVAISONS'],
  },
  {
    photo: PHOTOS.camionLogo, start: 9.5, end: 10.75, reveal: 'push',
    from: {x: 0.2, y: 0.38, scale: 1.75, rotY: -8}, to: {x: 0.36, y: 0.4, scale: 1.5, rotY: 2},
    subject: {x: 0.3, y: 0.36, rx: 0.34, ry: 0.13}, speedLines: true, sweep: true,
    kicker: 'NOTRE ATELIER MOBILE', title: ['ENTIÈREMENT', 'ÉQUIPÉ'],
  },
  {
    photo: PHOTOS.crepuscule, start: 10.75, end: 12, reveal: 'flash',
    from: {x: 0.56, y: 0.62, scale: 1.0, rotX: 3}, to: {x: 0.58, y: 0.56, scale: 1.22, rotX: -1},
    subject: {x: 0.55, y: 0.45, rx: 0.42, ry: 0.13}, rackFocus: true,
    kicker: 'INTERVENTION', title: ['SUR VOTRE', 'VÉHICULE'],
  },
];

/* SCÈNE 3 — CONVERSATION (simulation publicitaire) */
export const CHAT = {
  // mention affichée sous le téléphone ('' = aucune mention)
  disclaimer: '',
  // `at` = apparition, en secondes depuis le début de la scène
  messages: [
    {from: 'client', at: 0.45, text: 'Bonjour, j’aimerais changer mes pneus sur ma Clio 3. Vous faites ce modèle ?'},
    {from: 'fastpneu', at: 1.5, text: 'Bonjour ! Oui, bien sûr. Nous pouvons intervenir sur votre Clio 3. Vous avez quelle dimension de pneus ?'},
    {from: 'client', at: 2.5, text: 'C’est du 185/60 R15. Je suis sur Saran, vous pouvez venir ?'},
    {from: 'fastpneu', at: 3.5, text: 'Oui, Saran fait partie de notre secteur ! Nous pouvons vérifier la disponibilité et vous proposer un rendez-vous.'},
    {from: 'client', at: 4.4, text: 'Super ! Et je peux avoir un devis ?'},
    {from: 'fastpneu', at: 5.15, text: 'Bien sûr ! Le devis est entièrement gratuit. Contactez-nous directement sur notre site ou par message !'},
  ] as {from: 'client' | 'fastpneu'; at: number; text: string}[],
};

/* SCÈNE 4 — CARTE (coordonnées GPS réelles, rendu stylisé) */
export const MAP = {
  titre: ['NOUS VENONS', 'DIRECTEMENT', 'CHEZ VOUS !'],
  centre: {lat: 47.9029, lon: 1.9093},
  // side = côté de l'étiquette par rapport au point
  villes: [
    {nom: 'Orléans', lat: 47.9029, lon: 1.9093, side: 'top', principal: true},
    {nom: 'Saran', lat: 47.95, lon: 1.876, side: 'top'},
    {nom: 'Fleury-les-Aubrais', lat: 47.933, lon: 1.908, side: 'right'},
    {nom: 'Saint-Jean-de-Braye', lat: 47.913, lon: 1.971, side: 'top'},
    {nom: 'Chécy', lat: 47.894, lon: 2.027, side: 'bottom'},
    {nom: 'Saint-Jean-le-Blanc', lat: 47.893, lon: 1.917, side: 'right'},
    {nom: 'Olivet', lat: 47.863, lon: 1.9, side: 'bottom'},
    {nom: 'Saint-Pryvé-Saint-Mesmin', lat: 47.881, lon: 1.869, side: 'bottom'},
    {nom: 'La Chapelle-Saint-Mesmin', lat: 47.889, lon: 1.837, side: 'right'},
    {nom: 'Saint-Jean-de-la-Ruelle', lat: 47.912, lon: 1.864, side: 'bottom'},
    {nom: 'Ingré', lat: 47.92, lon: 1.824, side: 'top'},
    {nom: 'Ormes', lat: 47.942, lon: 1.817, side: 'top'},
  ] as {nom: string; lat: number; lon: number; side: 'top' | 'bottom' | 'left' | 'right'; principal?: boolean}[],
};

/* SCÈNE 5 — FINAL */
export const FINAL = {
  // 1er temps : photos de nuit (secondes depuis le début de la scène)
  nuitEnd: 3,
  stamps: [
    {text: '7J/7', at: 0.1},
    {text: '24H/24', at: 0.9},
  ],
};

/* ------------------------------------------------------------------ */
/* VOIX OFF — pour changer de voix : remplacer public/audio/vo-N.wav   */
/* (mêmes noms) et ajuster `start` si la durée change.                 */
/* `subs` : [texte affiché, part de durée] — sous-titres synchronisés. */
/* ------------------------------------------------------------------ */
export type VoLine = {file: string; start: number; duration: number; subs: [string, number, number][]};
// subs = [texte, début, fin] en secondes DEPUIS le début de la phrase
export const VOICE_OVER: VoLine[] = [
  {file: 'audio/vo-1.wav', start: 0.5, duration: 6.12, subs: [
    ['Besoin de changer vos pneus ?', 0, 1.75],
    ['Ne vous déplacez plus,', 2.0, 3.2],
    ['FASTPNEU45 vient', 3.45, 4.95],
    ['directement à vous !', 4.95, 6.12],
  ]},
  {file: 'audio/vo-2.wav', start: 6.85, duration: 7.13, subs: [
    ['Montage, équilibrage', 0, 1.55],
    ['et réparation :', 1.55, 2.5],
    ['notre atelier mobile', 2.6, 3.75],
    ['est entièrement équipé', 3.75, 5.1],
    ['pour intervenir sur votre véhicule.', 5.1, 7.05],
  ]},
  {file: 'audio/vo-3.wav', start: 17.0, duration: 2.87, subs: [
    ['Nous desservons Orléans', 0, 1.4],
    ['et toutes ses agglomérations.', 1.4, 2.87],
  ]},
  {file: 'audio/vo-4.wav', start: 20.1, duration: 5.73, subs: [
    ['Besoin d’un rendez-vous ?', 0, 1.3],
    ['Contactez-nous 7 jours sur 7,', 1.55, 3.45],
    ['24 heures sur 24 !', 3.75, 5.6],
  ]},
  {file: 'audio/vo-5.wav', start: 26.1, duration: 4.17, subs: [
    ['Votre devis est entièrement gratuit,', 0, 2.15],
    ['sur notre site ou par message.', 2.37, 4.17],
  ]},
  {file: 'audio/vo-6.wav', start: 30.6, duration: 3.35, subs: [
    ['FASTPNEU45,', 0, 1.6],
    ['vos pneus… directement chez vous !', 1.79, 3.35],
  ]},
];

/* MUSIQUE + BRUITAGES (synthétisés par tools/audio.py — libres de droits) */
export const AUDIO = {
  voiceVolume: 1, // les fichiers vo-*.wav sont déjà normalisés (~ -14 LUFS)
  music: {file: 'audio/music.wav', volume: 0.42, duckedVolume: 0.13},
  sfx: [
    {file: 'audio/sfx-engine.wav', at: 0, volume: 0.24},
    {file: 'audio/sfx-spin.wav', at: 0.5, volume: 0.3},
    {file: 'audio/sfx-zap.wav', at: 1.27, volume: 0.5},
    {file: 'audio/sfx-zap.wav', at: 2.05, volume: 0.6},
    {file: 'audio/sfx-impact.wav', at: 2.2, volume: 0.8},
    {file: 'audio/sfx-whoosh.wav', at: 3.8, volume: 0.6},
    {file: 'audio/sfx-impact.wav', at: 4.0, volume: 0.45},
    {file: 'audio/sfx-whoosh.wav', at: 6.35, volume: 0.5},
    {file: 'audio/sfx-wrench.wav', at: 6.55, volume: 0.3},
    {file: 'audio/sfx-whoosh-low.wav', at: 7.3, volume: 0.45},
    {file: 'audio/sfx-air.wav', at: 7.55, volume: 0.3},
    {file: 'audio/sfx-whoosh.wav', at: 8.35, volume: 0.5},
    {file: 'audio/sfx-wrench.wav', at: 8.6, volume: 0.22},
    {file: 'audio/sfx-whoosh-low.wav', at: 9.3, volume: 0.5},
    {file: 'audio/sfx-whoosh.wav', at: 10.6, volume: 0.45},
    {file: 'audio/sfx-zap.wav', at: 10.75, volume: 0.3},
    {file: 'audio/sfx-whoosh-low.wav', at: 11.75, volume: 0.6},
    {file: 'audio/sfx-notif-out.wav', at: 12.45, volume: 0.4},
    {file: 'audio/sfx-notif-in.wav', at: 13.5, volume: 0.45},
    {file: 'audio/sfx-notif-out.wav', at: 14.5, volume: 0.45},
    {file: 'audio/sfx-notif-in.wav', at: 15.5, volume: 0.55},
    {file: 'audio/sfx-notif-out.wav', at: 16.4, volume: 0.5},
    {file: 'audio/sfx-notif-in.wav', at: 17.15, volume: 0.35},
    {file: 'audio/sfx-whoosh.wav', at: 18.3, volume: 0.6},
    {file: 'audio/sfx-ping.wav', at: 18.75, volume: 0.4},
    {file: 'audio/sfx-ping.wav', at: 19.5, volume: 0.25},
    {file: 'audio/sfx-ping.wav', at: 20.0, volume: 0.25},
    {file: 'audio/sfx-whoosh-low.wav', at: 22.75, volume: 0.6},
    {file: 'audio/sfx-impact.wav', at: 23.03, volume: 0.6},
    {file: 'audio/sfx-impact.wav', at: 24.03, volume: 0.5},
    {file: 'audio/sfx-whoosh.wav', at: 25.8, volume: 0.6},
    {file: 'audio/sfx-impact.wav', at: 26.0, volume: 0.6},
    {file: 'audio/sfx-shimmer.wav', at: 33.2, volume: 0.5},
    {file: 'audio/sfx-impact.wav', at: 33.9, volume: 0.85},
  ],
};
