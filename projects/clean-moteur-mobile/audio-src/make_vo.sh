#!/usr/bin/env bash
# Regenerates the French voice-over with Piper TTS (voice fr_FR-siwis-medium).
# vo_lines.txt: "id|text". A line may be split into pieces with " || "; a piece may end with
# "@<length-scale>" to override its speed (used to spell out "E G R" clearly).
# Usage: VOICE=/path/fr_FR-siwis-medium.onnx bash audio-src/make_vo.sh [s2 s7 ...]
set -euo pipefail
cd "$(dirname "$0")"
VOICE="${VOICE:-/tmp/claude-0/voices/fr_FR-siwis-medium.onnx}"
python3 - "$VOICE" "$@" <<'PY'
import json, subprocess, sys, wave, io
import numpy as np
voice, only = sys.argv[1], set(sys.argv[2:])
rates = json.load(open('vo_rates.json'))

def synth(text, rate):
    r = subprocess.run(['python3', '-m', 'piper', '-m', voice, '-f', '/dev/stdout', '--length-scale', str(rate), '--sentence-silence', '0.05'],
                       input=text.encode(), check=True, capture_output=True)
    w = wave.open(io.BytesIO(r.stdout))
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    a = np.where(np.abs(x) > 500)[0]
    return x[max(0, a[0] - 200): a[-1] + 400], w.getframerate()

for line in open('vo_lines.txt'):
    i, t = line.strip().split('|', 1)
    if only and i not in only:
        continue
    parts, sr = [], 22050
    for piece in t.split(' || '):
        rate = rates[i]
        if '@' in piece:
            piece, r = piece.rsplit('@', 1)
            rate = float(r)
        x, sr = synth(piece, rate)
        parts += [x, np.zeros(int(0.03 * sr), dtype=np.int16)]
    out = np.concatenate(parts[:-1])
    with wave.open(f'vo/{i}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(out.tobytes())
    print('wrote', i, round(len(out) / sr, 2), 's')
PY
