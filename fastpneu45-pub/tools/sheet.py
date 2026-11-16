import sys, glob, os
from PIL import Image, ImageDraw
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
fs = sorted(glob.glob(os.path.join(d, 'f*.jpg')))
if len(sys.argv) > 4: fs = [f for f in fs if any(os.path.basename(f) == f"f{int(x):04d}.jpg" for x in sys.argv[4:])]
ims = [Image.open(f) for f in fs]; w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (w * cols, h * rows))
for i, im in enumerate(ims):
    S.paste(im, ((i % cols) * w, (i // cols) * h)); ImageDraw.Draw(S).text(((i % cols) * w + 8, (i // cols) * h + 8), os.path.basename(fs[i]), fill=(255, 255, 0))
S.save(out, quality=88); print(S.size)
