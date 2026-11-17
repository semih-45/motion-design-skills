"""Synthesised soundtrack: modern corporate-electro music + sound design + VO ducking.
Everything is generated here (no third-party samples) → royalty-free.
usage: python3 audio/mix.py  → audio/build/soundtrack.wav
"""
import json, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

HERE = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(HERE, 'build')
SR = 48000; DUR = 35.0; N = int(SR * DUR)
rs = np.random.RandomState(4)
BPM = 120; BEAT = 60 / BPM; BAR = BEAT * 4

def T(n): return np.arange(n) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def place(buf, x, t, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if i < 0 or i >= len(buf): return
    buf[i:j] += x[:j - i] * g
def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def reverb(x, sec=2.2, mix=0.25, seed=1):
    n = int(sec * SR); r = np.random.RandomState(seed)
    ir = r.randn(n, 2) * np.exp(-np.linspace(0, 7, n))[:, None]
    ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
    ir /= np.abs(ir).sum(0) ** 0.5 * 6
    wet = np.stack([fftconvolve(x[:, 0], ir[:, 0])[:len(x)], fftconvolve(x[:, 1], ir[:, 1])[:len(x)]], 1)
    return x * (1 - mix) + wet * mix * 3

# ───────────────────────── MUSIC ─────────────────────────
# Am – F – C – G (one bar each), 120 BPM; arrangement follows the edit.
prog = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
roots = [45, 41, 48, 43]
def chord_at(t): return int(t // BAR) % 4

def saw(f, n, ph=0.0):
    t = T(n); return 2 * ((t * f + ph) % 1) - 1

pad = np.zeros((N, 2)); pluck = np.zeros((N, 2)); bass = np.zeros(N); drums = np.zeros((N, 2)); fx = np.zeros((N, 2))
# pads: supersaw, swelling
for bar in range(int(DUR / BAR) + 1):
    t0 = bar * BAR; n = int(BAR * SR) + int(0.3 * SR)
    ch = prog[bar % 4]; voice = np.zeros((n, 2))
    for m in ch:
        for d in (-0.12, -0.05, 0.0, 0.06, 0.13):
            ph = rs.rand(); s = saw(mtof(m) * 2 ** (d / 12), n, ph)
            voice += stereo(s, np.clip(d * 6, -0.9, 0.9)) * 0.05
    env = np.minimum(1, T(n) / 0.25) * np.minimum(1, (n / SR - T(n)) / 0.3)
    voice *= env[:, None]
    place(pad, voice, t0)
pad[:, 0] = lp(pad[:, 0], 1800); pad[:, 1] = lp(pad[:, 1], 1800)
# plucks: 16th arpeggio
for k in range(int(DUR / (BEAT / 4))):
    t0 = k * BEAT / 4
    if t0 < 0.9 or t0 > 34.2: continue
    ch = prog[chord_at(t0)]; pat = [0, 2, 1, 3, 2, 1, 3, 2]
    m = ch[pat[k % 8]] + 12
    n = int(0.35 * SR); tt = T(n)
    s = (saw(mtof(m), n) * 0.6 + np.sin(2 * np.pi * mtof(m) * tt) * 0.6) * np.exp(-tt * 14) * np.minimum(1, tt / 0.004)
    s = lp(s, 2600 + 2000 * (k % 4 == 0))
    vel = 0.55 if k % 4 else 0.8
    if t0 < 3: vel *= 0.6
    place(pluck, stereo(s, 0.35 * np.sin(k * 0.7)), t0, 0.16 * vel)
# kick + sidechain envelope
side = np.ones(N)
kick_n = int(0.4 * SR); kt = T(kick_n)
kfreq = 45 + 95 * np.exp(-kt * 28)
kick = np.sin(2 * np.pi * np.cumsum(kfreq) / SR) * np.exp(-kt * 7.5); kick *= np.minimum(1, kt / 0.002); kick += lp(rs.randn(kick_n), 3000) * np.exp(-kt * 120) * 0.05
def kick_on(t):
    if t < 3.0 or 34.0 <= t: return False
    if 27.0 <= t < 28.0: return False          # breakdown before the zone reveal
    if 31.0 <= t < 32.0: return t % 1 < 0.01 and False
    return True
for k in range(int(DUR / BEAT)):
    t0 = k * BEAT
    if kick_on(t0):
        place(drums, stereo(kick), t0, 0.9)
        i = int(t0 * SR); n = int(0.32 * SR); e = 1 - 0.65 * np.exp(-T(n) * 9)
        j = min(N, i + n); side[i:j] = np.minimum(side[i:j], e[:j - i])
# claps (beats 2 & 4) from 12 s
cl_n = int(0.3 * SR); ct = T(cl_n)
clap = bp(rs.randn(cl_n), 900, 5000) * (np.exp(-ct * 30) + 0.6 * np.exp(-np.maximum(0, ct - 0.012) * 18) * (ct > 0.012))
for k in range(int(DUR / BEAT)):
    t0 = k * BEAT
    if 12.0 <= t0 < 27.0 or 28.0 <= t0 < 31.0 or 32.0 <= t0 < 34.0:
        if k % 2 == 1: place(drums, stereo(clap, 0.05), t0, 0.32)
# hats
h_n = int(0.06 * SR); hat = hp(rs.randn(h_n), 7000) * np.exp(-T(h_n) * 70)
for k in range(int(DUR / (BEAT / 4))):
    t0 = k * BEAT / 4
    if t0 < 3 or t0 >= 34 or 27.0 <= t0 < 28.0: continue
    off = (k % 4 == 2)
    if off or (t0 >= 16 and k % 2 == 1): place(drums, stereo(hat, 0.3 if k % 2 else -0.3), t0, 0.13 if off else 0.06)
# bass: root 8ths
for k in range(int(DUR / (BEAT / 2))):
    t0 = k * BEAT / 2
    if t0 < 3 or t0 >= 34 or 27.0 <= t0 < 28.0: continue
    r = roots[chord_at(t0)]; n = int(BEAT / 2 * SR); tt = T(n)
    f = mtof(r)
    s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) + 0.25 * lp(saw(f, n), 600)
    s *= np.minimum(1, tt / 0.005) * np.exp(-tt * 3)
    place(bass, s, t0, 0.32 if k % 2 else 0.4)
# risers into the big moments
def riser(t_end, dur, g=0.25):
    n = int(dur * SR); tt = T(n); x = rs.randn(n)
    out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        p = i / n; f = 400 + 9000 * p ** 2
        out[i:i + seg] = bp(x[i:i + seg], f * 0.7, min(f * 1.4, 20000))
    out *= (tt / dur) ** 2
    place(fx, stereo(out), t_end - dur, g)
riser(3.0, 1.6, 0.18); riser(12.0, 1.0, 0.14); riser(28.0, 1.0, 0.2); riser(32.0, 1.0, 0.18)
# impacts
def impact(t, g=0.6):
    n = int(1.8 * SR); tt = T(n)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt * 9)) / SR) * np.exp(-tt * 2.6)
    noise = lp(rs.randn(n), 2500) * np.exp(-tt * 6) * 0.4
    place(fx, stereo(boom + noise), t, g)
impact(0.74, 0.55); impact(3.0, 0.35); impact(28.0, 0.4); impact(32.0, 0.5)

# arrangement gains
tt = T(N)
pad_g = np.interp(tt, [0, 1.0, 3, 12, 27, 28, 32, 34.3, 35], [0.15, 0.45, 0.55, 0.6, 0.75, 0.55, 0.7, 0.6, 0.0])
pad = pad * pad_g[:, None]
music = pad * (0.55 + 0.45 * side)[:, None] + pluck * (0.6 + 0.4 * side)[:, None]
music += stereo(lp(bass, 900) * side)
music += drums + fx
music = reverb(music, 1.8, 0.18)
# master fade-out tail
music *= np.interp(tt, [0, 34.4, 35], [1, 1, 0.0])[:, None]

# ───────────────────────── SOUND DESIGN ─────────────────────────
sfx = np.zeros((N, 2))
def whoosh(t, dur=0.55, g=0.32, pan=0.0, hi=True):
    n = int(dur * SR); x = rs.randn(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        p = i / n; f = 300 + (3500 if hi else 1500) * np.sin(np.pi * p)
        out[i:i + seg] = bp(x[i:i + seg], f * 0.6, f * 1.6)
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    s = out * env; pans = np.linspace(-0.8, 0.8, n) * (1 if pan >= 0 else -1)
    st = np.stack([s * np.cos((pans + 1) * np.pi / 4), s * np.sin((pans + 1) * np.pi / 4)], 1)
    place(sfx, st, t - dur / 2, g)
for c in [3.0, 8.4, 10.3, 12.0, 16.0, 21.05, 28.0, 32.0]: whoosh(c, 0.6, 0.3)
def ding(t, f=1318.5, g=0.22, dur=0.9):
    n = int(dur * SR); tt = T(n)
    s = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * 8) + 0.3 * np.sin(2 * np.pi * f * 3.02 * tt) * np.exp(-tt * 14)) * np.exp(-tt * 5) * np.minimum(1, tt / 0.003)
    place(sfx, stereo(s, 0.1), t, g)
for t in [22.45, 23.45, 25.25, 26.25]: ding(t, 1568 if t in (23.45, 26.25) else 1318.5)
ding(24.05, 1046.5, 0.18); ding(24.12, 1568, 0.14)          # devis sent
ding(26.85, 1174.7, 0.2); ding(26.97, 1760, 0.18)          # calendar notification
# bolt zap + crackle
def zap(t, dur=0.6, g=0.25):
    n = int(dur * SR); tt = T(n); x = hp(rs.randn(n), 2500)
    gate = (rs.rand(n // 240 + 1) > 0.55).repeat(240)[:n]
    s = x * gate * np.exp(-tt * 3) + 0.3 * np.sin(2 * np.pi * 2800 * tt + 3 * np.sin(2 * np.pi * 60 * tt)) * np.exp(-tt * 6)
    place(sfx, stereo(s, 0), t, g)
zap(0.15, 0.6, 0.22); zap(33.9, 0.45, 0.16)
# logo shimmer
for i, f in enumerate([1760, 2217, 2637, 3520]): ding(1.0 + i * 0.06, f, 0.06, 1.4)
for i, f in enumerate([1760, 2217, 2637, 3520]): ding(34.15 + i * 0.05, f, 0.06, 0.8)
# air flow (cold then warm) – filtered noise swell
n = int(4.0 * SR); tt2 = T(n); air = lp(hp(rs.randn(n), 500), 3000)
air *= np.minimum(1, tt2 / 0.5) * np.minimum(1, (4.0 - tt2) / 0.6) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * tt2))
place(sfx, np.stack([air, np.roll(air, 900)], 1), 4.45, 0.09)
# louver motor
n = int(0.6 * SR); tt2 = T(n); mot = np.sin(2 * np.pi * (180 + 40 * tt2) * tt2) * 0.4 + lp(rs.randn(n), 800) * 0.3
mot *= np.sin(np.pi * tt2 / 0.6); place(sfx, stereo(mot), 4.25, 0.08)
# small mechanical taps (assembly)
def tap(t, g=0.18, f=900):
    n = int(0.12 * SR); tt2 = T(n); s = (bp(rs.randn(n), f, f * 3) * 0.7 + np.sin(2 * np.pi * f * 0.5 * tt2)) * np.exp(-tt2 * 45)
    place(sfx, stereo(s, rs.rand() - 0.5), t, g)
for t in [12.35, 12.5, 12.7, 12.85, 12.95, 13.1, 13.2, 13.35]: tap(t + 0.25, 0.14, 700 + rs.rand() * 600)
# plug click + charge hum
tap(17.32, 0.18, 900); tap(18.42, 0.45, 1400); tap(18.46, 0.25, 600)
n = int(2.6 * SR); tt2 = T(n); hum = np.sin(2 * np.pi * (220 + 160 * tt2 / 2.6) * tt2) * 0.5 + np.sin(2 * np.pi * (440 + 320 * tt2 / 2.6) * tt2) * 0.2
hum *= np.minimum(1, tt2 / 0.3) * np.minimum(1, (2.6 - tt2) / 0.3); place(sfx, stereo(hum), 18.55, 0.035)
ding(20.8, 2093, 0.12, 0.6)   # full battery
# borne lights up
ding(16.5, 880, 0.08, 0.6); ding(16.55, 1318.5, 0.07, 0.6)
# pin drop + pops
tap(28.95, 0.35, 300); whoosh(29.4, 0.9, 0.14)
for i in range(3): tap(30.0 + i * 0.28 + 0.15, 0.22, 1100 + i * 200)
for i in range(4): tap(32.45 + i * 0.13 + 0.2, 0.12, 900 + i * 150)

# ───────────────────────── VOICE OVER ─────────────────────────
vo = np.zeros(N)
timing = json.load(open(os.path.join(B, 'vo_timing.json')))
for ln in timing:
    a, sr = sf.read(os.path.join(B, f"vo_{ln['i']}.wav"))
    if a.ndim > 1: a = a.mean(1)
    a = resample_poly(a, SR, sr)
    place(vo, a, ln['start'], 1.0)
# light voice chain: HPF, presence, gentle compression
vo = hp(vo, 90)
vo = vo + 0.25 * bp(vo, 2500, 6000)
env = np.sqrt(np.maximum(lp(vo ** 2, 12), 0)); env = np.maximum(env, 1e-5)
gain = np.minimum(1, (0.08 / env) ** 0.35); vo = vo * gain
vo = vo / (np.abs(vo).max() + 1e-9) * 0.75
vo_st = stereo(vo) * 1.2
vo_st = reverb(vo_st, 0.6, 0.05, seed=9)

# ducking
duck_env = lp(np.abs(vo), 4); duck_env /= duck_env.max() + 1e-9
duck = 1 - 0.55 * np.clip(duck_env * 3, 0, 1)
mix = music * 0.42 * duck[:, None] + sfx * 0.9 + vo_st
peak = np.abs(mix).max(); mix = mix / peak * 0.89
sf.write(os.path.join(B, 'soundtrack.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
sf.write(os.path.join(B, 'music_only.wav'), (music / (np.abs(music).max() + 1e-9) * 0.89).astype(np.float32), SR, subtype='PCM_24')
print('ok', mix.shape)
