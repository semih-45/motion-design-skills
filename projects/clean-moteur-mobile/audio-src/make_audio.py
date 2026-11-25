"""Procedural soundtrack for the Clean Moteur Mobile ad.

Builds music (120 BPM), sound design (synced to src/cues.json — the same cue file the video uses)
and places the French voice-over (audio-src/vo/s1..s8.wav, Piper TTS "siwis"), then mixes with
voice ducking. Output: public/audio/mix.wav (48 kHz stereo). Run:  python3 audio-src/make_audio.py
"""
import json
import os
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
DUR = 30.0
N = int(SR * DUR)
FPS = 30
rng = np.random.default_rng(1234)

cues = json.load(open(os.path.join(ROOT, 'src', 'cues.json')))
SC = cues['scenes']
EV = cues['events']
sec = lambda frame: frame / FPS  # noqa: E731


# ---------------------------------------------------------------- helpers
def buf():
    return np.zeros((2, N))


def place(dst, sig, t, gain=1.0, pan=0.0):
    """Add mono or stereo signal at time t (s) with constant-power pan (-1..1)."""
    i = int(round(t * SR))
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * np.sqrt(2), sig * r * np.sqrt(2)])
    if i < 0:
        sig = sig[:, -i:]
        i = 0
    n = min(sig.shape[1], N - i)
    if n > 0:
        dst[:, i:i + n] += sig[:, :n] * gain


def tt(d):
    return np.arange(int(d * SR)) / SR


def expdec(d, tau):
    return np.exp(-tt(d) / tau)


def noise(d):
    return rng.standard_normal(int(d * SR))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    sos = signal.butter(order, f, btype='low', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    sos = signal.butter(order, f, btype='high', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def sweep_filter(x, f0, f1, q=4.0, kind='band'):
    """Time-varying band/lowpass via short blocks (cheap but smooth enough)."""
    out = np.zeros_like(x)
    blk = 512
    nb = int(np.ceil(len(x) / blk))
    zi = None
    for b in range(nb):
        a = b / max(1, nb - 1)
        fc = f0 * (f1 / f0) ** a
        if kind == 'band':
            lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 - 100)
            sos = signal.butter(2, [lo, hi], btype='band', fs=SR, output='sos')
        else:
            sos = signal.butter(2, min(fc, SR / 2 - 100), btype='low', fs=SR, output='sos')
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg = x[b * blk:(b + 1) * blk]
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[b * blk:(b + 1) * blk] = y
    return out


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(freq, d, detune=0.0):
    t = tt(d)
    ph = (freq * (1 + detune) * t + rng.random()) % 1.0
    return 2 * ph - 1


def adsr(d, a=0.005, dcy=0.1, s=0.6, r=0.1):
    n = int(d * SR)
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(dcy * SR), int(r * SR)
    na = max(1, min(na, n))
    e[:na] = np.linspace(0, 1, na)
    nd = min(nd, max(0, n - na))
    if nd > 0:
        e[na:na + nd] = np.linspace(1, s, nd)
    if nr > 0 and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def S(*xs):
    """Sum signals of different lengths (zero-padded)."""
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[:len(x)] += x
    return out


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ---------------------------------------------------------------- instruments
def kick(d=0.45, f0=150, f1=46, punch=1.0):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = hp(noise(d), 3000) * np.exp(-t / 0.004) * 0.35 * punch
    return np.tanh(S(body, click) * 1.6) * 0.9


def clap(d=0.25):
    t = tt(d)
    n = bp(noise(d), 900, 4200)
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.011, 0.022]):
        env += (t >= off) * np.exp(-(t - off).clip(0) / (0.008 if k < 2 else 0.09))
    return n * env * 0.8


def hat(d=0.06, open_=False):
    t = tt(d if not open_ else 0.3)
    n = hp(noise(len(t) / SR), 7500)
    return n * np.exp(-t / (0.03 if not open_ else 0.12)) * 0.35


def bell(freq, d=1.2, bright=1.0):
    t = tt(d)
    parts = [(1, 1.0, 0.9), (2.0, 0.45, 0.5), (2.76, 0.25 * bright, 0.35), (5.4, 0.12 * bright, 0.18)]
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (tau)) for r, a, tau in parts)
    return x * np.minimum(1, t / 0.002)


def pluck(freq, d=0.3):
    t = tt(d)
    x = 0.6 * np.sin(2 * np.pi * freq * t) + 0.3 * np.sign(np.sin(2 * np.pi * freq * t)) * 0.4
    return lp(x, 3500) * np.exp(-t / 0.09)


def pad_chord(notes, d, cutoff=1800, attack=0.35):
    x = np.zeros(int(d * SR))
    for m in notes:
        for det in (-0.006, 0.0, 0.0065):
            x += saw(midi(m), d, det)
    x = lp(x, cutoff, 2)
    return x * adsr(d, attack, 0.3, 0.8, min(0.5, d * 0.4)) / (len(notes) * 3)


def boom(d=1.6, f0=70, f1=30):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.15)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t / 0.55)
    crash = lp(noise(d), 2500) * np.exp(-t / 0.35) * 0.35
    trans = hp(noise(d), 1500) * np.exp(-t / 0.012) * 0.5
    return np.tanh(S(sub, crash, trans) * 1.4)


def whoosh(d=0.5, f0=400, f1=4000, up=True):
    x = noise(d)
    x = sweep_filter(x, f0, f1, q=2.0) if up else sweep_filter(x, f1, f0, q=2.0)
    t = tt(d)
    env = np.sin(np.pi * np.minimum(1, t / d)) ** 1.5
    return x * env * 1.4


def riser(d=1.5, f0=200, f1=6000):
    x = sweep_filter(noise(d), f0, f1, q=3.0)
    t = tt(d)
    tone = np.sin(2 * np.pi * np.cumsum(220 * (8 ** (t / d))) / SR) * 0.25
    env = (t / d) ** 2
    return (x * 1.6 + tone) * env


def pop(freq=700, d=0.12):
    t = tt(d)
    f = freq * (1 + 0.8 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)


def bloop(f0=300, f1=900, d=0.25):
    t = tt(d)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.05))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.08) * np.minimum(1, t / 0.004)


def scribble(d=0.38, seed=0):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(int(d * SR)), 1800, 6500)
    t = tt(d)
    strokes = np.zeros_like(t)
    k = 0.0
    while k < d:
        ln = 0.04 + r.random() * 0.07
        strokes += ((t > k) & (t < k + ln)) * np.sin(np.pi * ((t - k) / ln).clip(0, 1)) * (0.6 + 0.4 * r.random())
        k += ln + r.random() * 0.02
    return x * strokes * 0.7


def click(d=0.02, f=3500):
    t = tt(d)
    return bp(noise(d), f * 0.6, f * 1.4) * np.exp(-t / 0.003)


def glitch(d=0.5):
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * (300 + 1200 * t / d) * t))
    gate = (np.floor(t * 40) % 2 == 0).astype(float)
    crushed = np.round(noise(d) * 4) / 4
    return lp(x * 0.3 * gate + crushed * 0.15, 6000) * np.exp(-t / 0.3)


def hum(d=1.0, f=100):
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * 2 * f * t) * 0.3
    return lp(x, 900) * np.minimum(1, t / 0.02) * np.exp(-t / (d * 0.5))


def spinup(d=1.2):
    t = tt(d)
    f = 180 * (6 ** (t / d))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(noise(d), 2000, 7000) * 0.25 * (t / d)
    return x * np.minimum(1, t / 0.1) * (0.4 + 0.6 * t / d)


def shing(d=0.9):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.5 / k)) for k, f in enumerate([2300, 3410, 4780, 6150], 1))
    return (x * 0.25 + hp(noise(d), 5000) * np.exp(-t / 0.05) * 0.5) * np.minimum(1, t / 0.001)


# ---------------------------------------------------------------- music
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
CHORDS = ['Am', 'Am', 'F', 'E', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'C', 'C']
VOICING = {
    'Am': [57, 60, 64], 'F': [57, 60, 65], 'E': [56, 59, 64], 'C': [55, 60, 64], 'G': [55, 59, 62],
}
ROOT_ = {'Am': 33, 'F': 29, 'E': 28, 'C': 36, 'G': 31}

music = buf()
drums = buf()


def section(t):
    if t < sec(SC['problem']):
        return 'hook'
    if t < sec(SC['solution']):
        return 'problem'
    if t < sec(SC['chat']):
        return 'solution'
    if t < sec(SC['end']):
        return 'groove'
    return 'end'


# drone for the hook
d = sec(SC['problem']) + 0.6
t = tt(d)
drone = (np.sin(2 * np.pi * 55 * t) * 0.6 + lp(noise(d), 180) * 0.6) * np.minimum(1, t / 1.2) * np.exp(-np.maximum(0, t - 2.3) / 0.3)
place(music, drone, 0.0, 0.5)

beats = int(DUR / BEAT)
for b in range(beats):
    tb = b * BEAT
    s = section(tb + 0.01)
    bar = int(tb // BAR)
    ch = CHORDS[min(bar, len(CHORDS) - 1)]
    if s == 'hook':
        continue
    # silence one beat when the H2 drop appears, kick returns on the hit
    if sec(EV['dropIn']) - 0.05 <= tb < sec(EV['dropHit']) - 0.1:
        continue
    if s == 'end' and tb > sec(SC['end']) + 0.2:
        continue
    kgain = 0.55 if s == 'problem' else 0.75
    place(drums, kick(), tb, kgain)
    if s == 'groove' and b % 2 == 1:
        place(drums, clap(), tb, 0.35, 0.05)
    # hats
    for k in range(2 if s == 'problem' else 4):
        off = tb + (BEAT / 2 if s == 'problem' else k * BEAT / 4)
        if s == 'problem' or k % 2 == 1 or tb > 19:
            place(drums, hat(), off, 0.35 if k % 2 else 0.22, 0.3 if k % 2 else -0.3)
    if s == 'groove' and tb > 19 and b % 2 == 1:
        place(drums, hat(open_=True), tb + BEAT / 2, 0.22, 0.2)
    # bass: 8th notes with kick sidechain feel
    if s in ('problem', 'solution', 'groove'):
        for e in range(2):
            on = tb + e * BEAT / 2
            m = ROOT_[ch] + (12 if e == 1 else 0)
            dd = BEAT / 2 * 0.95
            x = saw(midi(m), dd) * 0.6 + np.sin(2 * np.pi * midi(m - 12) * tt(dd)) * 0.5
            x = lp(x, 500 if s == 'problem' else 800) * adsr(dd, 0.004, 0.08, 0.6, 0.03)
            place(music, x, on, 0.32 if e == 1 else 0.38)
    # arp plucks (16ths) in brighter sections
    if s in ('solution', 'groove'):
        notes = VOICING[ch] + [VOICING[ch][0] + 12]
        for k in range(4):
            on = tb + k * BEAT / 4
            m = notes[(b * 4 + k) % 4] + 12
            place(music, pluck(midi(m), 0.25), on, 0.07, -0.4 if k % 2 else 0.4)

# pads per bar from the problem section on
for bar in range(len(CHORDS)):
    t0 = bar * BAR
    if t0 + BAR <= sec(SC['problem']):
        continue
    ch = CHORDS[bar]
    st = max(t0, sec(SC['problem']))
    dd = min(BAR, DUR - st) + 0.3
    cut = 900 if st < sec(SC['solution']) else 2200
    place(music, pad_chord(VOICING[ch], dd, cut), st, 0.28, 0.0)
# final resolve chord swell
place(music, pad_chord([48, 55, 60, 64, 67, 72], DUR - sec(EV['logoBig']) + 0.2, 2600, 0.05), sec(EV['logoBig']) + 0.45, 0.4)

# risers into transitions
for tgt, ln in [(sec(SC['problem']), 1.2), (sec(SC['chat']), 0.9), (sec(SC['meca']), 0.8), (sec(SC['cta']), 0.9), (sec(EV['logoBig']) + 0.45, 1.4)]:
    place(music, riser(ln), tgt - ln, 0.22)

# ---------------------------------------------------------------- sound design
sfx = buf()
E = lambda k: sec(EV[k])  # noqa: E731

place(sfx, click(0.03, 2500), E('lightOn'), 0.9)
place(sfx, hum(1.6, 100), E('lightOn'), 0.18)
place(sfx, S(bell(1318.5, 0.6, 0.3), bell(987.8, 0.6, 0.3) * 0.7), E('lightOn') + 0.02, 0.18)
for k, g in [('word1', 0.8), ('word2', 0.85), ('word3', 1.0)]:
    place(sfx, boom(1.2), E(k), g)
    place(sfx, clap(0.2), E(k), 0.5)
place(sfx, whoosh(0.6, 300, 5000), E('ringMorph') - 0.1, 0.5)
place(sfx, bell(1760, 1.2, 0.6), E('ringMorph') + 0.35, 0.12, 0.2)
# car scan + hood + x-ray
t = tt(0.75)
scan = np.sin(2 * np.pi * np.cumsum(400 * (4 ** (t / 0.75))) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t)) * np.sin(np.pi * t / 0.75)
place(sfx, scan, E('carScan'), 0.12)
place(sfx, S(kick(0.3, 90, 40) * 0.6, click(0.03, 5000) * 0.6), E('hoodOpen') + 0.35, 0.6)
place(sfx, hp(noise(0.4), 3000) * expdec(0.4, 0.12), E('hoodOpen'), 0.12)
place(sfx, glitch(0.55), E('xray'), 0.35)
place(sfx, whoosh(0.5, 2000, 9000), E('xray'), 0.25)
for i in range(1, 6):
    place(sfx, scribble(0.4, i), E(f'ann{i}'), 0.55, (-0.4, 0.4)[i % 2])
# H2 drop
place(sfx, bloop(320, 980, 0.3), E('dropIn'), 0.5)
place(sfx, bell(2093, 0.9, 0.4), E('dropIn') + 0.06, 0.12)
place(sfx, whoosh(0.35, 6000, 500, up=True), E('dropHit') - 0.35, 0.35)
place(sfx, S(boom(1.0, 90, 40) * 0.6, lp(noise(0.5), 1200) * expdec(0.5, 0.1) * 0.6), E('dropHit'), 0.7)
place(sfx, bloop(900, 250, 0.3), E('dropHit'), 0.35)
for k, m in enumerate([84, 86, 88, 91, 93]):
    place(sfx, bell(midi(m), 1.0), E(f'fix{k + 1}'), 0.2, (k - 2) * 0.25)
t = tt(1.2)
place(sfx, sweep_filter(noise(1.2), 800, 9000, 3) * np.sin(np.pi * t / 1.2), E('dropHit') + 0.05, 0.18)
place(sfx, shing(0.9), E('unXray') + 0.3, 0.25)
place(sfx, whoosh(0.4, 600, 3000), E('title3') - 0.05, 0.25)
place(sfx, whoosh(0.5, 300, 6000), E('dropOut'), 0.45)
place(sfx, S(boom(0.8, 120, 60) * 0.4, bloop(400, 1200, 0.25)), sec(EV['phoneReveal']) - 0.05, 0.45)
# typing
for k in range(18):
    tk = E('msg1') + k * (0.86 / 18) + rng.random() * 0.02
    place(sfx, click(0.02, 3000 + rng.random() * 1500), tk, 0.22, rng.random() * 0.4 - 0.2)
place(sfx, pop(900, 0.1), E('msg1') + 0.9, 0.3)
place(sfx, S(bloop(600, 900, 0.18), bloop(900, 1200, 0.18) * 0.6), E('msg2'), 0.35)
place(sfx, S(pop(650, 0.12), whoosh(0.2, 2000, 6000) * 0.3), E('quote'), 0.4)
place(sfx, S(bell(midi(88), 0.8), bell(midi(92), 0.8) * 0.8), E('quoteOk'), 0.22)
for k, m in enumerate([72, 76, 79, 84]):
    place(sfx, bell(midi(m), 0.8, 0.5), E('rdv') + k * 0.06, 0.13)
place(sfx, bell(midi(88), 0.6), E('notif'), 0.22)
place(sfx, bell(midi(83), 0.6), E('notif') + 0.12, 0.22)
place(sfx, kick(0.35, 120, 50) * 0.8, sec(EV['pinDrop'] + 8), 0.5)
place(sfx, sweep_filter(noise(0.8), 300, 2500, 2) * np.sin(np.pi * tt(0.8) / 0.8), E('mapDraw'), 0.15)
t = tt(1.6)
van = lp(S(saw(55, 1.6) * 0.5, saw(55.7, 1.6) * 0.5), 300) * np.sin(np.pi * t / 1.6) ** 0.8
place(sfx, van, E('vanStart'), 0.22)
place(sfx, whoosh(0.8, 300, 1500), E('vanStart') + 0.2, 0.15)
place(sfx, S(pop(800), bell(midi(91), 0.5, 0.3) * 0.5), E('home'), 0.35)
place(sfx, S(pop(950), bell(midi(95), 0.5, 0.3) * 0.5), E('office'), 0.35)
place(sfx, pop(500, 0.15), E('garage'), 0.35)
place(sfx, scribble(0.3, 11), E('garageStrike') - 0.25, 0.6)
place(sfx, boom(0.9), E('garageStrike'), 0.55)
place(sfx, whoosh(0.4, 500, 7000), sec(SC['meca']) - 0.3, 0.5)
place(sfx, scribble(0.35, 21), E('mecaTitle'), 0.4)
for k in range(4):
    place(sfx, pop(600 + k * 140, 0.12), E(f'card{k + 1}'), 0.32, (-0.3, 0.3)[k % 2])
place(sfx, S(kick(0.3, 200, 80) * 0.5, shing(0.6) * 0.6), E('disc'), 0.4)
place(sfx, spinup(sec(EV['qr']) - E('disc')), E('disc') + 0.05, 0.22)
place(sfx, S(kick(0.3, 140, 55) * 0.7, clap(0.2) * 0.6), E('priceClaim'), 0.45)  # on-screen claim, no voice
for k in range(10):
    place(sfx, bell(midi(96 + (k * 5) % 12), 0.25, 0.2), E('qr') + k * 0.035, 0.07, (k % 3 - 1) * 0.4)
place(sfx, whoosh(0.35, 800, 5000), E('ctaCall') - 0.1, 0.25)
place(sfx, pop(700, 0.14), E('ctaPhone'), 0.35)
place(sfx, pop(850, 0.12), E('ctaWhere'), 0.25)
place(sfx, whoosh(0.6, 300, 4000), sec(SC['end']) - 0.1, 0.4)
place(sfx, boom(2.2, 80, 32), E('logoBig') + 0.45, 0.8)
place(sfx, shing(1.2), E('logoBig') + 0.5, 0.2)
place(sfx, scribble(0.6, 31), E('slogan'), 0.35)
place(sfx, pop(750, 0.14), E('endPhone'), 0.3)

# ---------------------------------------------------------------- voice-over
VO_START = {'s1': 0.12, 's2': None, 's3': None, 's4': None, 's5': None, 's6': None, 's7': None, 's8': None}
VO_MIN = {'s2': sec(SC['problem']) + 0.6, 's3': sec(EV['dropIn']) + 0.05, 's4': sec(SC['chat']) + 0.4, 's5': sec(SC['travel']) + 0.25,
          's6': sec(SC['meca']) + 0.25, 's7': sec(SC['cta']) + 0.05, 's8': sec(SC['end']) - 0.1}
GAP = 0.1
vo = np.zeros(N)


def load_wav(p):
    w = wave.open(p)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    if w.getnchannels() == 2:
        x = x.reshape(-1, 2).mean(1)
    x = signal.resample_poly(x, SR, sr)
    a = np.where(np.abs(x) > 0.015)[0]
    return x[max(0, a[0] - int(0.02 * SR)): a[-1] + int(0.06 * SR)]


cursor = 0.0
timeline = []
for k in ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']:
    x = load_wav(os.path.join(ROOT, 'audio-src', 'vo', f'{k}.wav'))
    x = hp(x, 90)
    st = VO_START[k] if VO_START[k] is not None else max(cursor + GAP, VO_MIN[k])
    i = int(st * SR)
    n = min(len(x), N - i)
    vo[i:i + n] += x[:n]
    cursor = st + len(x) / SR
    timeline.append((k, round(st, 2), round(cursor, 2)))
print('VO timeline:', timeline)
if cursor > DUR - 0.1:
    print('WARNING: voice-over runs past the end')

# light compression on VO
env = np.sqrt(np.maximum(lp(vo ** 2, 20), 0) + 1e-9)
gain = np.minimum(1, (0.25 / (env + 1e-6)) ** 0.4)
vo = norm(vo * gain, 0.9)

# ---------------------------------------------------------------- mix
vo_env = np.maximum(lp(np.abs(vo), 8), 0)
duck = 1 - 0.55 * np.clip(vo_env / 0.08, 0, 1)
music_mix = (music + drums * 0.9) * duck
music_mix = norm(music_mix, 0.55)
sfx = norm(sfx, 0.7) * (1 - 0.25 * np.clip(vo_env / 0.08, 0, 1))
mix = music_mix * 0.85 + sfx * 0.75 + np.vstack([vo, vo]) * 1.0
# fades
fade_in = np.minimum(1, np.arange(N) / (0.01 * SR))
fade_out = np.clip((DUR - np.arange(N) / SR) / 0.35, 0, 1)
mix *= fade_in * fade_out
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = norm(mix, 0.95)

os.makedirs(os.path.join(ROOT, 'public', 'audio'), exist_ok=True)
out = os.path.join(ROOT, 'public', 'audio', 'mix_raw.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('wrote', out)
