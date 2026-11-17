# PRO ELEC — film publicitaire motion design 3D (35 s)

Film publicitaire « premium 3D » pour PRO ELEC (Électricité & Climatisation, Orléans + 100 km),
généré par code : scènes 3D three.js + interface HTML/CSS, rendues image par image en 4K
dans Chromium headless, puis encodées avec ffmpeg. Bande-son 100 % synthétisée (musique,
bruitages) + voix off française locale (Piper TTS, voix `fr_FR-tom-medium`).

| Version | Résolution | Fichier |
|---|---|---|
| Verticale TikTok / Reels / Shorts | 2160×3840, 30 fps | `out/PRO-ELEC_vertical_9x16_4K.mp4` |
| Horizontale YouTube / TV | 3840×2160, 30 fps | `out/PRO-ELEC_horizontal_16x9_4K.mp4` |

## Storyboard réalisé

| Temps | Scène | Texte à l'écran |
|---|---|---|
| 0–3 s | Éclair vert qui dessine le logo, qui se forme en plaque 3D | Électricité & Climatisation |
| 3–8.4 s | Clim murale 3D en orbite, volet qui s'ouvre, flux bleu → orange, logos partenaires | La clim réversible · L'été : fraîcheur · L'hiver : chaleur |
| 8.4–10.4 s | Maison 3D en split jour / nuit | Au chaud, jour et nuit |
| 10.4–12 s | Facture 3D, barres qui descendent en vert | Votre facture fait la différence |
| 12–16 s | Vue éclatée : unité intérieure + groupe extérieur, liaisons vertes, vos photos de chantiers, bandeau partenaires | Installation par un pro · Garantie décennale 10 ans |
| 16–21 s | Voiture électrique, borne (inspirée de la Legrand de vos photos), câble, batterie | Bornes de recharge à domicile |
| 21–28 s | Smartphone 3D, conversation + devis PDF + rappel calendrier | Devis gratuit, réponse rapide |
| 28–32 s | Carte 3D d'Orléans, pin, cercle 100 km, services | On se déplace, 24h/24 |
| 32–35 s | Logo, bouton vert 07 67 23 95 91, email, zone | Devis gratuit |

## Re-générer

```bash
npm install                                  # three, polices, playwright-core
pip install piper-tts scipy soundfile
# voix : fr_FR-tom-medium.onnx (+ .json) depuis huggingface.co/rhasspy/piper-voices
python3 audio/vo.py /chemin/vers/voices fr_FR-tom-medium   # voix off calée sur le montage
python3 audio/mix.py                                       # musique + bruitages + mixage
node render.mjs --fmt v --dpr 2 --workers 3                # images 4K verticales
node render.mjs --fmt h --dpr 2 --workers 3                # images 4K horizontales
./encode.sh v && ./encode.sh h                             # MP4 4K + aperçus 1080p
```

Aperçu d'une image : `node render.mjs --fmt v --dpr 1 --stills 5.5,18,33 --out out/stills`.
Aperçu temps réel dans un navigateur : servir le dossier puis ouvrir `index.html?fmt=v&dpr=1&play`.

## Remplacer les logos partenaires

Les logos actuels sont découpés dans votre bannière. Déposez les fichiers officiels (PNG,
fond blanc ou transparent) sous les mêmes noms dans `assets/partners/`
(`samsung.png`, `mitsubishi.png`, `daikin.png`, `midea.png`, `atlantic.png`) puis relancez
le rendu : aucun code à modifier.

## Fichiers

- `src/scenes.js` — scènes 3D (caméras, animation) · `src/models.js` — modèles 3D procéduraux
- `src/dom.js`, `src/style.css` — textes, téléphone, facture, carte de fin
- `audio/vo.py`, `audio/mix.py` — voix off, musique, sound design, ducking
- `assets/` — logo, vos photos de chantier recadrées (clims, groupe Fujitsu, tableau Legrand), logos partenaires, emojis (Noto, Apache-2.0)
