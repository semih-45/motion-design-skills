#!/usr/bin/env bash
# Regenerates the French voice-over with Piper TTS (voice fr_FR-siwis-medium).
# Usage: VOICE=/path/fr_FR-siwis-medium.onnx bash audio-src/make_vo.sh
set -euo pipefail
cd "$(dirname "$0")"
VOICE="${VOICE:-/tmp/claude-0/voices/fr_FR-siwis-medium.onnx}"
python3 - "$VOICE" <<'PY'
import json, subprocess, sys
voice = sys.argv[1]
rates = json.load(open('vo_rates.json'))
for line in open('vo_lines.txt'):
    i, t = line.strip().split('|', 1)
    subprocess.run(['python3', '-m', 'piper', '-m', voice, '-f', f'vo/{i}.wav', '--length-scale', str(rates[i]), '--sentence-silence', '0.05'], input=t.encode(), check=True, capture_output=True)
print('voice-over regenerated')
PY
