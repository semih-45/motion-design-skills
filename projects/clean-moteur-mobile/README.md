# Clean Moteur Mobile — pub motion design 30 s (9:16)

Vidéo publicitaire verticale pour **Clean Moteur Mobile** (décalaminage à l'hydrogène, nettoyage FAP,
petite mécanique, intervention à domicile ou sur le lieu de travail).

- **Format** : 1080 × 1920, 30 fps, 30,0 s, MP4 H.264 + AAC, son à −14 LUFS
- **Diffusion** : Snapchat (priorité), TikTok, Instagram Reels
- **Marges** : aucun texte important à moins de 150 px du haut ni à moins de 250 px du bas
- **Rendus finaux** : `out/clean-moteur-mobile.mp4` (voiture bleue) et `out/clean-moteur-mobile-blanc.mp4` (voiture blanche)

Tout est fabriqué en code (Remotion + Three.js) : aucune banque d'images, aucun modèle 3D importé,
aucune image générée par IA. La voiture, le téléphone et le disque de frein sont modélisés en code.

## Déroulé

| # | Temps | Scène | Raccord vers la suivante |
|---|---|---|---|
| 1 | 0 – 2,5 s | Voyant moteur orange, fumée, mots géants « FUMÉE. / PERTE DE PUISSANCE. / SURCONSOMMATION. » | le voyant devient l'anneau lumineux de la plateforme |
| 2 | 2,5 – 7,5 s | Berline 3D qui se matérialise (scan), capot qui s'ouvre, passage en rayons X / blueprint, 5 annotations rouges tracées au feutre | — |
| 3 | 7,5 – 10,5 s | La goutte H₂ plonge dans le moteur, vague verte jusqu'à l'échappement, annotations réécrites en vert ✓, la voiture redevient brillante, titre « Décalaminage à l'hydrogène » | la goutte devient une bulle de message |
| 4 | 10,5 – 15,5 s | Smartphone 3D, conversation (frappe, « en train d'écrire… », devis « Validé ✓ », « Rendez-vous confirmé ») | la notification devient l'épingle sur la carte |
| 5 | 15,5 – 19,4 s | Carte façon appli de navigation (fond clair, bâtiments 3D, noms de rues, itinéraire bleu, bandeau « En route vers vous ») : l'utilitaire suit la goutte vers « À domicile » puis « Sur votre lieu de travail », puis garage barré | panoramique rapide |
| 6 | 19,4 – 22,5 s | « Et aussi… la petite mécanique » : 4 cartes (Vidange, Freins, Batterie, Diagnostic), l'icône Freins devient un disque 3D | le disque tourne et devient le cercle du QR code |
| 7 | 22,5 – 26,5 s | QR code Snapchat, « Prenez rendez-vous », téléphone, zone d'intervention | le petit logo grandit |
| 8 | 26,5 – 30 s | Logo en couleurs sur plaque blanche, « Redonnez une seconde jeunesse à votre moteur ! », téléphone | fin |

Le petit logo (version blanche) reste en haut de l'écran pendant les scènes 2 à 7.

## Modifier la vidéo

```bash
npm install
npm run studio                                    # aperçu interactif dans le navigateur
npm run render                                    # → out/clean-moteur-mobile.mp4
npx remotion render CleanMoteurAd out/v2.mp4 \
  --props='{"phoneDisplay":"07 45 16 23 57","snapchatHandle":"clean.moteur","withAudio":true,"carColor":"blanc"}'
```

Les réglages modifiables sans toucher au code (props Remotion) :

| Prop | Valeur actuelle | Effet |
|---|---|---|
| `phoneDisplay` | `07 45 16 23 57` | numéro affiché (scènes 7 et 8) |
| `snapchatHandle` | `clean.moteur` | identifiant Snapchat + contenu du QR code (`https://www.snapchat.com/add/<handle>`) |
| `withAudio` | `true` | avec ou sans la bande son |
| `carColor` | `bleu` | couleur de la berline 3D : `bleu` ou `blanc` (rendu « studio ») |

Si le rendu échoue avec « Error creating WebGL context », pointer Remotion vers un Chromium local :
`REMOTION_CHROME=/chemin/vers/chrome-headless-shell npm run render` (le rendu 3D utilise ANGLE/SwiftShader, pas besoin de GPU).

### Timing

Tout le minutage est dans **`src/cues.json`** (en images, 30 fps). La vidéo *et* le son lisent ce même
fichier : après une modification, relancer `python3 audio-src/make_audio.py` pour recaler le son, puis
normaliser (voir plus bas).

## Son

- **Voix off** : voix de synthèse française (Piper TTS, voix `fr_FR-siwis-medium`, licence libre).
  Textes dans `audio-src/vo_lines.txt`, vitesse par phrase dans `audio-src/vo_rates.json`, fichiers dans `audio-src/vo/`.
  Une phrase peut être découpée en morceaux avec ` || ` et un morceau peut avoir sa propre vitesse (`@0.86`) :
  c'est ce qui permet de faire épeler « E G R » clairement. Chaque phrase a été vérifiée par reconnaissance vocale (Whisper).
  Piper a une part d'aléatoire : si vous régénérez, réécoutez (`bash audio-src/make_vo.sh s2` ne refait que la phrase s2).
  Pour une voix humaine : remplacer `audio-src/vo/s1.wav` … `s8.wav` par vos enregistrements (même découpage)
  puis relancer le mixage. Le placement des phrases s'adapte tout seul.
- **Musique + bruitages** : générés par `audio-src/make_audio.py` (120 BPM, chaque changement de scène tombe sur un temps).
  Ducking automatique de la musique sous la voix.

```bash
pip install numpy scipy piper-tts
bash audio-src/make_vo.sh [s1 s2 …]               # (optionnel) régénère la voix off
python3 audio-src/make_audio.py                   # → public/audio/mix_raw.wav
ffmpeg -y -i public/audio/mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 public/audio/mix.wav
```

## Structure

```
src/
  cues.json            minutage partagé vidéo/son
  timeline.ts          couleurs, polices, zones de sécurité
  Ad.tsx               composition : calques + secousses caméra
  three/               3D : voiture procédurale (carModel), rayons X, téléphone + chat, disque de frein, caméras
  scenes/              S1 … S8 (calques 2D), goutte H₂, petit logo
  components/          logo vectoriel, goutte H₂, traits « feutre », fumée, fond, grain
audio-src/             voix off, script de musique et bruitages
tools/stills.mjs       rendu d'images fixes pour vérifier : node tools/stills.mjs 10 150 450
tools/stills-props.mjs idem avec des props : node tools/stills-props.mjs '{"carColor":"blanc"}' blanc 100
```

## À vérifier avant diffusion

- Le **QR code** pointe vers `https://www.snapchat.com/add/clean.moteur` (identifiant lu sur le flyer) : à confirmer.
- Les 4 cartes de **petite mécanique** (Vidange, Freins, Batterie, Diagnostic) sont des exemples : à adapter à vos prestations réelles.
- La voix off est une **voix de synthèse** : correcte pour tester, mais une vraie voix fera mieux en diffusion payante.
