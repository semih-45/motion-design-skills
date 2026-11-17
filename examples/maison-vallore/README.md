# Maison Valloré × défilé — pub d'application verticale (Remotion)

1080×1920 · 30 fps · 25,5 s (765 images). Interface entièrement recréée en composants, en français.

```bash
npm install
npx remotion studio                       # aperçu (composition MaisonVallore + dossier Scenes/)
npx remotion render MaisonVallore out/maison-vallore.mp4
node scripts/stills.mjs 150 345 580       # images clés → out/frames/
```

Dans un conteneur avec Chromium préinstallé : `REMOTION_BROWSER=/chemin/vers/chrome-headless-shell`.

- `src/Main.tsx` — séquence principale : 11 scènes, chevauchement de 2×8 images à chaque raccord.
- `src/scenes/S01…S11` — une composition par scène (aussi rendables seules : `S03-Recherche`, etc.).
- `src/lib/fx.tsx` — caméra 3D (point de focus + rotations X/Y/Z), transition zoom + flou de mouvement
  + aberration chromatique cyan/rouge, profondeur de champ, vignettage, grain, curseur tactile.
- `src/lib/photos.tsx` — visuels « éditoriaux » illustrés en SVG (manteau camel / robe de soie / atelier).
