"""Cut the client's voice-over into phrases (in the silences) and re-time each phrase on the edit.
usage: python3 audio/align_user_vo.py  → audio/build/vo_track.wav (48 kHz mono, 35 s)"""
import json, os, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'user', 'voix_off.mp3')
OUT = os.path.join(HERE, 'build', 'vo_track.wav')
SR = 48000; DUR = 35.0

# approximate cut points (s, in the original recording) — refined to the quietest point nearby
CUTS = [3.35, 4.97, 6.03, 7.13, 8.79, 11.19, 16.05, 20.5, 24.95, 30.37]
# where each phrase should START in the video, and its tempo factor
PLAN = [(0.2, 1.03), (3.4, 1.0), (4.8, 1.0), (6.75, 1.0), (8.55, 1.0), (10.3, 1.0),
        (12.2, 1.04), (16.4, 1.0), (21.4, 1.0), (25.7, 1.05), (30.42, 1.06)]

with tempfile.TemporaryDirectory() as td:
    wav = os.path.join(td, 'src.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-ac', '1', '-ar', str(SR), wav], check=True)
    a, _ = sf.read(wav)
    env = np.sqrt(np.convolve(a ** 2, np.ones(480) / 480, 'same'))
    cuts = []
    for c in CUTS:
        i0, i1 = int((c - 0.25) * SR), int((c + 0.25) * SR)
        cuts.append(i0 + int(np.argmin(env[i0:i1])))
    bounds = [0] + cuts + [len(a)]
    thr = max(env.max() * 0.02, 1e-4)
    track = np.zeros(int(DUR * SR))
    report = []
    prev_end = 0
    for k, (s, e) in enumerate(zip(bounds[:-1], bounds[1:])):
        seg = a[s:e]; ev = env[s:e]
        idx = np.where(ev > thr)[0]
        seg = seg[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.12 * SR)]
        start, tempo = PLAN[k]
        if tempo != 1.0:
            p_in, p_out = os.path.join(td, f'i{k}.wav'), os.path.join(td, f'o{k}.wav')
            sf.write(p_in, seg, SR)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p_in, '-af', f'atempo={tempo}', p_out], check=True)
            seg, _ = sf.read(p_out)
        fade = int(0.01 * SR); seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
        i = int(start * SR)
        if i < prev_end: i = prev_end + int(0.05 * SR)
        j = min(len(track), i + len(seg))
        track[i:j] += seg[:j - i]
        prev_end = j
        report.append((k, round(i / SR, 2), round(j / SR, 2), round(len(seg) / SR, 2)))
    # light cleanup: high-pass, normalise
    track = sosfilt(butter(2, 80, 'high', fs=SR, output='sos'), track)
    track = track / (np.abs(track).max() + 1e-9) * 0.9
    sf.write(OUT, track, SR)
    for r in report: print('phrase %d: %.2f → %.2f s (%.2f s)' % r)
    if report[-1][2] > DUR: print('WARNING: last phrase cut at 35 s')
