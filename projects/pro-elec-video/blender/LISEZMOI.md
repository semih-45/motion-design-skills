# Fichiers Blender — PRO ELEC

Un fichier `.blend` par scène 3D de la vidéo, ouvrable avec **Blender 4.2 ou plus récent**
(créés avec Blender 5.3). Chaque fichier contient les modèles, une caméra (cadrée sur l'objet,
avec la cible `Cible_camera`), un éclairage studio et un rendu Cycles en 4K (3840×2160).

| Fichier | Contenu |
|---|---|
| 01_logo_3D.blend | Plaque noire brillante avec ton logo + liseré vert |
| 02_clim_murale.blend | Clim murale, volet ouvert, écran « 22° » |
| 03_maison_jour.blend / 04_maison_nuit.blend | Maison moderne avec groupe extérieur, version jour / nuit |
| 05_installation_clim_groupe_exterieur.blend | Unité intérieure + groupe extérieur sur supports + liaisons vertes, sur un mur |
| 06_borne_recharge_voiture.blend | Voiture électrique, borne murale, câble branché, porte de garage |
| 07_carte_orleans_100km.blend | Carte stylisée, pin vert, cercle 100 km |

Les pièces sont nommées (ex. `Clim_volet`, `Clim_facade`, `Groupe_ext_helice`, `Voiture_roue_1`,
`Borne_barre_lumineuse`) pour être faciles à retrouver dans l'Outliner.

À savoir :
- Les particules d'air (bleu / orange) et les textes de la vidéo n'existent que dans le moteur
  de la vidéo : ils ne sont pas dans ces fichiers.
- Changer le format pour une bâche : Propriétés de sortie → Résolution (ex. 9000×3000 pour 3 m × 1 m).
- Les dossiers `glb/` contiennent les mêmes modèles au format glTF (importables aussi dans
  Cinema 4D, 3ds Max, SketchUp…). `build_blend.py` régénère les .blend à partir des .glb.

## Ouvrir correctement

1. **Dézippe d'abord** (clic droit → « Extraire tout… »), puis ouvre le `.blend` depuis le dossier extrait.
2. Le fichier s'ouvre en **vue caméra** avec les matières visibles. Pour l'aperçu final : touche **Z → Rendu**
   (ou **F12** pour faire l'image finale).
3. Se déplacer : molette = zoom, clic molette = tourner, Maj + clic molette = déplacer.
   Pavé numérique **0** = revenir à la vue caméra.

## Message « Failed to load using Vulkan, using OpenGL instead »

Ce n'est pas lié aux fichiers : c'est Blender qui n'arrive pas à utiliser Vulkan avec ta carte graphique
et passe automatiquement en OpenGL (tout fonctionne quand même). Clique **OK**.
Pour ne plus l'avoir : **Édition → Préférences → Système → Backend graphique (Backend) → OpenGL**,
puis redémarre Blender. Ou mets à jour le pilote de ta carte graphique (NVIDIA / AMD / Intel).
