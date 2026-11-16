"""Musique + effets sonores 100 % synthétisés (numpy/scipy) -> aucun droit d'auteur tiers.
Usage : python3 tools/audio.py   (écrit dans public/audio/)"""
import numpy as np, wave, os
from scipy import signal
SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "audio")
rng = np.random.default_rng(45)

def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'lp', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'hp', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return signal.sosfilt(signal.butter(o, [a, b], 'bp', fs=SR, output='sos'), x)
def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4))
def fade(x, i=0.005, o=0.02):
    n = len(x); a = int(i * SR); b = int(o * SR)
    x = x.copy(); x[:a] *= np.linspace(0, 1, a); x[-b:] *= np.linspace(1, 0, b); return x
def swept_bp(noise, f0, f1, q=2.0, block=256):
    out = np.zeros_like(noise); zi = np.zeros((1, 2)); n = len(noise)
    for i in range(0, n, block):
        f = f0 * (f1 / f0) ** (i / n)
        sos = signal.butter(1, [f / (1 + .5 / q), min(f * (1 + .5 / q), SR * .45)], 'bp', fs=SR, output='sos')
        out[i:i + block], zi = signal.sosfilt(sos, noise[i:i + block], zi=zi)
    return out
def reverb(x, d=1.2, mix=.3):
    ir = rng.standard_normal(int(d * SR)) * np.exp(-6 * t_(d) / d); ir = lp(ir, 5000)
    w = signal.fftconvolve(x, ir)[:len(x) + len(ir)]; w /= (np.abs(w).max() + 1e-9)
    y = np.zeros(len(w)); y[:len(x)] = x * (1 - mix); return y + w * mix * np.abs(x).max()
def stereo(x, width=0.0):
    if width <= 0: return np.stack([x, x], 1)
    d = int(width * SR); r = np.concatenate([np.zeros(d), x[:-d]]) if d else x
    return np.stack([x, r], 1)
def save(name, x, peak=0.9):
    if x.ndim == 1: x = stereo(x)
    x = x / (np.abs(x).max() + 1e-9) * peak
    w = wave.open(os.path.join(OUT, name), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close(); print(name, round(len(x) / SR, 2), 's')
def saw(f, n, det=0.0):
    ph = np.cumsum(np.broadcast_to(f, (n,)) * (1 + det)) / SR
    return 2 * (ph % 1) - 1

# ---------- SFX ----------
def engine():
    d = 3.8; t = t_(d); n = len(t)
    # démarreur 0-0.45 s puis montée en régime, coup de gaz, retombée
    rpm = np.interp(t, [0, .45, .7, 1.5, 2.1, 2.5, 3.8], [18, 22, 38, 120, 150, 70, 42])
    ph = np.cumsum(rpm) / SR * 2 * np.pi
    x = sum(np.sin(ph * k + k) * a for k, a in [(1, 1), (2, .8), (3, .55), (4, .5), (6, .3), (8, .22), (.5, .7), (1.5, .35)])
    x *= 0.6 + 0.4 * np.sign(np.sin(ph * 2)) * 0.5 + 0.2
    nz = lp(rng.standard_normal(n), 900) * (0.25 + rpm / 300)
    nz *= 0.6 + 0.4 * np.sin(ph * 2)
    crank = bp(rng.standard_normal(n), 300, 1800) * (t < .5) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 13 * t))) * .8
    y = np.tanh((x * .5 + nz + crank) * (0.6 + rpm / 90)); y = lp(y, 3200) + hp(y, 60) * .2
    y *= np.interp(t, [0, .05, .5, 2.2, 3.8], [0, .5, .7, 1, 0])
    save("sfx-engine.wav", stereo(reverb(y, .8, .15), .004), .95)
def whoosh(name, d, f0, f1, q=1.2):
    n = int(d * SR); x = swept_bp(rng.standard_normal(n), f0, f1, q)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2.2
    l = x * e * np.linspace(1, .4, n); r = x * e * np.linspace(.4, 1, n); save(name, np.stack([l, r], 1), .8)
def impact():
    d = 2.4; t = t_(d); f = 34 + 70 * np.exp(-t * 16)
    sub = np.sin(np.cumsum(f) / SR * 2 * np.pi) * np.exp(-t * 2.3)
    hit = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 26)
    y = np.tanh((sub * 1.5 + hit * .9) * 1.5); save("sfx-impact.wav", stereo(reverb(y, 1.6, .28), .006), .95)
def notif(name, notes, d=.42):
    t = t_(d); y = np.zeros(len(t))
    for i, f in enumerate(notes):
        s = int(i * .085 * SR); tt = t[:len(t) - s]
        y[s:] += (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 13) * np.minimum(1, tt / .004)
    save(name, stereo(reverb(y, .5, .12)), .7)
def wrench():
    d = .85; t = t_(d); n = len(t)
    am = (signal.square(2 * np.pi * 31 * t, .35) + 1) / 2
    y = bp(rng.standard_normal(n), 900, 5200) * am * .8 + np.sin(np.cumsum(np.linspace(380, 900, n)) / SR * 2 * np.pi) * .25
    y += lp(rng.standard_normal(n), 300) * am * .8
    save("sfx-wrench.wav", stereo(fade(y * np.interp(t, [0, .04, .7, .85], [0, 1, 1, 0])), .003), .7)
def air():
    d = .55; t = t_(d); y = hp(rng.standard_normal(len(t)), 2500) * env(len(t), .01, .5, 5)
    save("sfx-air.wav", stereo(y, .002), .5)
def spin():
    d = 3.2; t = t_(d); n = len(t); f = np.interp(t, [0, 2.2, 3.2], [5, 26, 30])
    am = 0.55 + 0.45 * np.sin(np.cumsum(f) / SR * 2 * np.pi)
    y = swept_bp(rng.standard_normal(n), 250, 1500, 1.5) * am + np.sin(np.cumsum(f * 6) / SR * 2 * np.pi) * .12
    save("sfx-spin.wav", stereo(y * np.sin(np.linspace(0, np.pi, n)) ** .7, .005), .6)
def ping():
    d = .7; t = t_(d); y = np.sin(2 * np.pi * 1480 * t) * np.exp(-t * 14) + .4 * np.sin(2 * np.pi * 2220 * t) * np.exp(-t * 20)
    save("sfx-ping.wav", stereo(reverb(y, .9, .3), .01), .6)
def zap():
    d = .5; t = t_(d); n = len(t)
    y = hp(rng.standard_normal(n), 1800) * (rng.random(n) > .55) * np.exp(-t * 9) + np.sin(2 * np.pi * 55 * t) * np.exp(-t * 12) * .8
    save("sfx-zap.wav", stereo(reverb(np.tanh(y * 2), .7, .2), .004), .75)
def shimmer():
    d = 2.2; t = t_(d); n = len(t); y = np.zeros(n)
    for f in [587.3, 880, 1174.7, 1760, 2349.3]:
        y += np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t * 1.6)
    y += swept_bp(rng.standard_normal(n), 3000, 9000, 1) * np.exp(-t * 3) * .5
    save("sfx-shimmer.wav", stereo(reverb(y * np.minimum(1, t / .02), 1.5, .4), .011), .6)

# ---------- MUSIQUE (120 BPM joué en double-temps, ré mineur) ----------
def music(total=34.8):
    n = int(total * SR); t = np.arange(n) / SR; B = 0.5; S16 = B / 4
    L = np.zeros(n); R = np.zeros(n)
    def add(x, at, g=1.0, pan=0.0):
        s = int(at * SR)
        if s >= n or s < 0: return
        x = x[:n - s]; L[s:s + len(x)] += x * g * (1 - max(0, pan)); R[s:s + len(x)] += x * g * (1 + min(0, pan))
    def kick():
        tt = t_(.3); return np.tanh((np.sin(2 * np.pi * np.cumsum(48 + 170 * np.exp(-tt * 42)) / SR) * np.exp(-tt * 10) + hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 180) * .3) * 2.2)
    def hat(d=.04, o=False):
        tt = t_(.22 if o else d); return hp(rng.standard_normal(len(tt)), 8000) * np.exp(-tt * (16 if o else 85))
    def snare():
        tt = t_(.24); return (bp(rng.standard_normal(len(tt)), 1200, 7000) * np.exp(-tt * 22) + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 30) * .7)
    def tom(f):
        tt = t_(.25); return np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-tt * 25))) / SR) * np.exp(-tt * 12)
    K, H, HO, SN = kick(), hat(), hat(o=True), reverb(snare(), .45, .22)
    S_BEAT, S_PHONE, S_MAP, S_DROP, S_END = 4.0, 12.0, 18.5, 23.0, 33.9
    side = np.ones(n)
    def duck(b):
        s = int(b * SR); m = min(n - s, int(.22 * SR))
        if m > 0: side[s:s + m] = np.minimum(side[s:s + m], np.linspace(.15, 1, m) ** 1.6)
    # intro : pulsations sourdes qui s'accélèrent
    for b in [1.0, 2.0, 2.5, 3.0, 3.25, 3.5, 3.625, 3.75, 3.875]:
        add(K, b, .55)
    nb = int(round((S_END - S_BEAT) / B))
    for i in range(nb):
        b = S_BEAT + i * B
        phone = S_PHONE <= b < S_MAP; build = S_MAP <= b < S_DROP; drop = b >= S_DROP
        # grosse caisse sur chaque temps + contretemps syncopé (énergie double-temps)
        add(K, b, 1.0); duck(b)
        if (drop or (not phone and not build)) and i % 4 == 3: add(K, b + 3 * S16, .8); duck(b + 3 * S16)
        if i % 2 == 1: add(SN, b, .5 if not phone else .32)
        if drop and i % 8 == 7: add(SN, b + 2 * S16, .35); add(SN, b + 3 * S16, .42)
        # charleston en doubles croches
        for k in range(4):
            g = [.16, .07, .2, .09][k] * (.6 if phone else 1) * (1.25 if drop else 1)
            add(H, b + k * S16, g, .25 if k % 2 else -.15)
        if not phone: add(HO, b + 2 * S16, .13 if not drop else .18, .1)
        # roulement de toms à chaque fin de section
        for end in (S_PHONE, S_MAP, 26.0, 30.0):
            if abs(b - (end - B)) < 1e-6:
                for k, fq in enumerate([180, 150, 120, 95]): add(tom(fq), b + k * S16, .5, (k - 1.5) * .3)
    # montée (roulement de caisse claire) avant le drop
    for k in range(32):
        bb = S_DROP - 2.0 + 2.0 * (k / 32) ** .75; add(snare(), bb, .1 + .32 * k / 32)
    chords = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]  # Dm Bb F C
    mf = lambda m: 440 * 2 ** ((m - 69) / 12)
    bass = np.zeros(n); pad = np.zeros(n); arp = np.zeros(n); stab = np.zeros(n); lead = np.zeros(n)
    bar = 2.0
    melody = [74, 77, 76, 74, 72, 74, 77, 81, 74, 77, 76, 74, 72, 69, 72, 74]
    for bi in range(int(total / bar) + 1):
        st = bi * bar; root, ch = chords[bi % 4]; s = int(st * SR); m = min(int(bar * SR), n - s)
        if m <= 0: break
        phone = S_PHONE <= st < S_MAP; drop = st >= S_DROP
        p = sum(saw(mf(nn), m, d) for nn in ch for d in (-.005, .004, 0)) / 9
        cut = 420 if st < S_BEAT else (1500 if st < S_PHONE else (900 if st < S_MAP else (1400 if st < S_DROP else 3200)))
        pad[s:s + m] += fade(lp(p, cut), .05, .08)
        if S_BEAT <= st < S_END:
            # basse roulante en doubles croches (octaves)
            for e in range(16):
                o = s + int(e * S16 * SR); mm = min(int(.115 * SR), n - o)
                if mm <= 0: break
                if e % 4 == 0: continue  # laisse la place à la grosse caisse
                note = root - 12 + (12 if e % 4 == 2 and not phone else 0)
                bn = saw(mf(note), mm) * .8 + np.sin(2 * np.pi * mf(root - 12) * np.arange(mm) / SR) * .9
                bass[o:o + mm] += lp(bn, 380 if not drop else 750) * env(mm, .004, .11, 2.5)
            # accords « stab » syncopés
            if not phone:
                for e in ([3, 6, 11, 14] if drop else [6, 14]):
                    o = s + int(e * S16 * SR); mm = min(int(.2 * SR), n - o)
                    if mm <= 0: break
                    c = sum(saw(mf(nn + 12), mm, d) for nn in ch for d in (-.006, .006)) / 6
                    stab[o:o + mm] += lp(c, 4200) * env(mm, .003, .16, 3.5)
        if st >= 8.0 and st < S_END:
            seq = [ch[0], ch[2], ch[1] + 12, ch[2], ch[0] + 12, ch[2], ch[1] + 12, ch[2]] * 2
            for e in range(16):
                o = s + int(e * S16 * SR); mm = min(int(.2 * SR), n - o)
                if mm <= 0: break
                fq = mf(seq[e] + 12); tt = np.arange(mm) / SR
                arp[o:o + mm] += (np.sin(2 * np.pi * fq * tt) + .45 * signal.square(2 * np.pi * fq * tt) * np.exp(-tt * 22)) * np.exp(-tt * 16) * (.45 if phone else (.6 if not drop else .85))
        if drop and st < S_END:
            for e in range(4):
                o = s + int(e * B * SR); mm = min(int(.46 * SR), n - o)
                if mm <= 0: break
                fq = mf(melody[((bi * 4) + e) % 16] + 0); tt = np.arange(mm) / SR
                vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * tt)
                ld = saw(fq * vib, mm, .004) + saw(fq * vib, mm, -.004) + .5 * saw(fq * 2, mm)
                lead[o:o + mm] += lp(ld, 3800) * env(mm, .01, .42, 2.2)
    arp = lp(arp, 6000); d1 = int(.1875 * SR); arpd = np.concatenate([np.zeros(d1), arp[:-d1]])
    leadr = reverb(lead, .9, .3)[:n]
    drone = lp(saw(mf(26), n) + saw(mf(26.07), n), 150) * np.interp(t, [0, 1.5, 4, 4.3, total], [0, 1, 1, .25, .25])
    for (a, b_) in [(1.6, 4.0), (10.5, 12.0), (20.5, 23.0), (24.5, 26.0), (28.5, 30.0)]:
        m = int((b_ - a) * SR); r = swept_bp(rng.standard_normal(m), 400, 8000, .8) * np.linspace(0, 1, m) ** 2.5
        add(r, a, .24, -.2)
    L += drone * .5; R += drone * .5
    L += (pad * .26 + stab * .3 + bass * .55) * side + arp * .15 + arpd * .05 + leadr * .2
    R += (np.roll(pad, 300) * .26 + np.roll(stab, 180) * .3 + bass * .55) * side + arp * .07 + arpd * .13 + np.roll(leadr, 220) * .2
    y = np.stack([L, R], 1)
    g = np.interp(t, [0, .3, S_END, total - .02, total], [0, 1, 1, 0, 0])
    tail = int(S_END * SR)
    y[tail:] *= np.exp(-(t[tail:] - S_END) * 3.2)[:, None]
    y = np.tanh(y * g[:, None] * 1.0); save("music.wav", y, .88)

if __name__ == "__main__":
    engine(); whoosh("sfx-whoosh.wav", .55, 300, 5000); whoosh("sfx-whoosh-low.wav", .9, 2500, 180, 1.0)
    impact(); notif("sfx-notif-in.wav", [880, 1318.5]); notif("sfx-notif-out.wav", [1046.5, 784], .3)
    wrench(); air(); spin(); ping(); zap(); shimmer(); music()
