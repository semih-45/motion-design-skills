#!/usr/bin/env bash
# encode.sh v|h  → out/PRO-ELEC_<format>_4K.mp4 (+ 1080p preview)
set -euo pipefail
cd "$(dirname "$0")"
fmt="${1:-v}"
if [ "$fmt" = v ]; then name=PRO-ELEC_vertical_9x16_4K; small=1080:1920; else name=PRO-ELEC_horizontal_16x9_4K; small=1920:1080; fi
# loudness-normalised master audio (-14 LUFS, social platforms)
[ -f out/soundtrack_norm.wav ] || ffmpeg -y -loglevel error -i audio/build/soundtrack.wav -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 out/soundtrack_norm.wav
ffmpeg -y -loglevel error -framerate 30 -i "out/frames_${fmt}/f_%05d.jpg" -i out/soundtrack_norm.wav \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 5.1 -pix_fmt yuv420p -tune film \
  -c:a aac -b:a 320k -shortest -movflags +faststart "out/${name}.mp4"
ffmpeg -y -loglevel error -i "out/${name}.mp4" -vf "scale=${small}:flags=lanczos" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a copy -movflags +faststart "out/${name/4K/1080p}.mp4"
ls -la out/*.mp4
