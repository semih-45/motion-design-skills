# FASTPNEU45 — publicité verticale (Remotion + Three.js)

Vidéo 9:16 de 34,8 s, 1080×1920, 30 i/s, MP4 H.264 + AAC.

## Commandes

```bash
npm install
npm run studio      # aperçu interactif (scènes séparées : Scene1-Intro … Scene5-Final)
npm run render      # out/fastpneu45-pub-1080x1920.mp4
npm run render:4k   # out/fastpneu45-pub-4k-2160x3840.mp4 (même projet, échelle ×2)
```

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Textes, téléphone, site, Snapchat, couleurs, durées des scènes | `src/config.ts` |
| Photos et leur animation (cadrage, zoom, effet d'apparition, repères) | `src/config.ts` → `PHOTOS`, `SHOTS_MATERIEL` |
| Conversation du téléphone | `src/config.ts` → `CHAT` |
| Communes de la carte | `src/config.ts` → `MAP` |
| Voix off, sous-titres, musique, bruitages | `src/config.ts` → `VOICE_OVER`, `AUDIO` |
| Scènes | `src/scenes/*.tsx` |
| Briques réutilisables | `src/components/` (`AnimatedPhoto`, `ThreeDTire`, `Phone3D`, `fx`…) |

### Ajouter une photo

1. Déposer le fichier dans `public/assets/`.
2. La déclarer dans `PHOTOS` (avec sa largeur/hauteur réelles : l'image est recadrée, jamais déformée).
3. Ajouter ou modifier un plan dans `SHOTS_MATERIEL` (point visé `x`/`y`, `scale`, inclinaisons, type d'apparition).

### Remplacer la voix off

Les fichiers `public/audio/vo-1.wav` … `vo-6.wav` sont découpés depuis `public/audio/voix-off-source.mp3` (voix fournie, générée sur fish.audio).
La première voix de synthèse (Piper, `tools/vo.py`) est conservée dans `public/audio/voix-synthese-v1/`.
Pour une voix de comédien : enregistrer les six phrases, garder les mêmes noms de fichiers,
puis ajuster `start` / `duration` / `subs` dans `VOICE_OVER` si les durées changent.

### Audio

La musique et les bruitages sont entièrement synthétisés par `tools/audio.py` (aucun échantillon tiers).

## Photos

`public/assets/non-utilisees/` contient les photos fournies mais non montées.
`public/assets/originaux/` garde l'original des photos retouchées (plaque d'un véhicule client floutée).

## Licence Remotion

Remotion est gratuit pour les particuliers et les entreprises jusqu'à 3 personnes ; au-delà une licence est requise (remotion.dev/license).

## Blender

`blender/fastpneu45-pneu.blend` : scène Blender (pneu sculpté, jante alliage, étrier bleu, éclairage, caméra en orbite, 120 images en 1080×1920, moteur Cycles).
Elle est générée par `blender/creer_scene.py` (`python3 creer_scene.py` avec le module `bpy`, ou `blender -b -P creer_scene.py`).
La publicité n'utilise pas encore ces rendus : le pneu de la vidéo est celui de `src/components/ThreeDTire.tsx`.
