"""French voice-over with Piper (local, offline TTS). Each line is fitted into its time window.
usage: python3 audio/vo.py <voices_dir> [voice_name]
"""
import json, subprocess, sys, os
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = sys.argv[1]
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'fr_FR-tom-medium'
SPK = sys.argv[3] if len(sys.argv) > 3 else None
OUT = os.path.join(HERE, 'build'); os.makedirs(OUT, exist_ok=True)

# (start, hard end, text written phonetically-friendly for the TTS)
LINES = [
    (0.30, 3.05, "Pro Élec ! Votre expert électricité et climatisation."),
    (3.35, 4.65, "La climme réversible :"),
    (4.75, 6.6, "fraîche en été,"),
    (6.7, 8.45, "chaude en hiver,"),
    (8.55, 10.3, "de jour comme de nuit..."),
    (10.4, 11.95, "et sur vos factures, ça se voit."),
    (12.15, 15.95, "Installation pro, avec nos partenaires Samsoung, Mitsoubichi Électrik et Daille-kine."),
    (16.2, 20.9, "Votre voiture électrique ? On installe aussi votre borne de recharge."),
    (21.35, 27.5, "Un message, un devis gratuit, et on fixe le rendez-vous. Simple."),
    (27.55, 31.0, "À Orléans et jusqu'à cent kilomètres, on se déplace vingt-quatre heures sur vingt-quatre."),
    (31.1, 34.97, "Appelez le zéro sept, soixante-sept, vingt-trois, quatre-vingt-quinze, quatre-vingt-onze."),
]

def synth(text, ls, path):
    cmd = [sys.executable, '-m', 'piper', '-m', os.path.join(VOICES, VOICE + '.onnx'), '-f', path, '--length-scale', str(ls), '--sentence-silence', '0.12']
    if SPK is not None: cmd += ['-s', SPK]
    subprocess.run(cmd, input=text.encode(), check=True, capture_output=True)
    a, sr = sf.read(path)
    # trim leading/trailing silence
    env = np.abs(a) > 0.01
    idx = np.where(env)[0]
    a = a[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.08 * sr)]
    return a, sr

timing = []
for i, (t0, t1, text) in enumerate(LINES):
    path = os.path.join(OUT, f'vo_{i}.wav')
    ls = 0.88
    a, sr = synth(text, ls, path)
    win = t1 - t0
    for _ in range(3):
        d = len(a) / sr
        if d <= win: break
        ls = max(0.62, ls * win / d * 0.99)
        a, sr = synth(text, ls, path)
    sf.write(path, a, sr)
    d = len(a) / sr
    timing.append({'i': i, 'start': t0, 'dur': round(d, 3), 'end': round(t0 + d, 3), 'window_end': t1, 'length_scale': round(ls, 3), 'text': text})
    print(f'line {i}: {d:.2f}s (window {win:.2f}s) ls={ls:.2f}')
json.dump(timing, open(os.path.join(OUT, 'vo_timing.json'), 'w'), indent=1, ensure_ascii=False)
