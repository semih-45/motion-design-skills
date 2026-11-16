"""Génère la voix off phrase par phrase (Piper, voix fr_FR-tom-medium) + vo-timings.json."""
import json, wave, subprocess, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "audio")
LINES = [
 "Besoin de changer vos pneus ? Ne vous déplacez plus, Fast Pneu quarante-cinq vient directement à vous !",
 "Montage, équilibrage et réparation : notre atelier mobile est entièrement équipé pour intervenir sur votre véhicule.",
 "Nous desservons Orléans et toutes ses agglomérations.",
 "Besoin d'un rendez-vous ? Contactez-nous sept jours sur sept, vingt-quatre heures sur vingt-quatre !",
 "Votre devis est entièrement gratuit, sur notre site ou par message.",
 "Fast Pneu quarante-cinq, vos pneus… directement chez vous !",
]
res = []
for i, t in enumerate(LINES, 1):
    p = os.path.join(OUT, f"vo-{i}.wav")
    subprocess.run([sys.executable, "-m", "piper", "-m", os.path.join(HERE, "voices", "fr_FR-tom-medium.onnx"),
                    "-f", p, "--sentence-silence", "0.12"], input=t.encode(), check=True)
    # coupe les silences de début/fin puis normalise le niveau
    tmp = p + ".tmp.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
        "volume=4.5dB,alimiter=limit=0.89", tmp], check=True)
    os.replace(tmp, p)
    w = wave.open(p); d = w.getnframes() / w.getframerate(); res.append({"file": f"audio/vo-{i}.wav", "seconds": round(d, 3)})
    print(i, round(d, 2), w.getframerate())
json.dump(res, open(os.path.join(HERE, "vo-timings.json"), "w"), indent=1)
print("total", sum(r["seconds"] for r in res))
