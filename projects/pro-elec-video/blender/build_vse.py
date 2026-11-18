"""Build an editable Blender Video-Sequencer project: text-free video + one Text strip per title line + soundtrack.
usage: python3 blender/build_vse.py v|h <video.mp4> <soundtrack.wav> <out_dir>
In Blender: Video Editing workspace → click a text strip → edit "Text" in the side panel (N)."""
import bpy, os, sys

fmt, video, sound, out_dir = sys.argv[-4:]
HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30; DUR = 35.0
P = fmt == 'v'
W, H = (2160, 3840) if P else (3840, 2160)
S = 2  # logical px → output px

INK, INK2, GREEN, COLD, WARM = '#0B1A12', '#3F4A44', '#16A34A', '#0EA5E9', '#F97316'

# (start, end, lines[(text, colour)], options)
if P:
    TITLES = [
        (1.45, 3.05, [('Électricité & Climatisation', INK2)], dict(size=54, weight=800, y0=1300)),
        (3.25, 4.55, [('La clim', INK), ('réversible', GREEN)], {}),
        (4.6, 6.55, [("L'été :", INK), ('fraîcheur', COLD)], {}),
        (6.6, 8.45, [("L'hiver :", INK), ('chaleur', WARM)], {}),
        (8.45, 10.45, [('Au chaud,', INK), ('jour et nuit', GREEN)], dict(box=True, y0=315)),
        (10.35, 12.1, [('Votre facture', INK), ('fait la différence', GREEN)], {}),
        (12.1, 16.1, [('Installation', INK), ('par un pro', GREEN)], {}),
        (13.35, 16.1, [('Garantie décennale 10 ans', INK)], dict(size=38, weight=800, y0=522, box=True)),
        (16.3, 21.1, [('Bornes de', INK), ('recharge', INK), ('à domicile', GREEN)], {}),
        (21.25, 28.1, [('Devis gratuit,', GREEN), ('réponse rapide', INK)], {}),
        (28.2, 32.1, [('On se déplace,', INK), ('24h/24', GREEN)], {}),
    ]
    DEF = dict(size=92, weight=900, y0=300, step=102, x=540, align='CENTER')
else:
    TITLES = [
        (1.45, 3.05, [('Électricité & Climatisation', INK2)], dict(size=52, weight=800, y0=880, x=960, align='CENTER')),
        (3.25, 4.55, [('La clim', INK), ('réversible', GREEN)], {}),
        (4.6, 6.55, [("L'été :", INK), ('fraîcheur', COLD)], {}),
        (6.6, 8.45, [("L'hiver :", INK), ('chaleur', WARM)], {}),
        (8.45, 10.45, [('Au chaud,', INK), ('jour et nuit', GREEN)], dict(size=64, box=True, y0=170, step=76, x=230)),
        (10.35, 12.1, [('Votre facture', INK), ('fait la', GREEN), ('différence', GREEN)], {}),
        (12.1, 16.1, [('Installation par un pro', INK)], dict(y0=167, x=960, align='CENTER')),
        (13.35, 16.1, [('Garantie décennale 10 ans', INK)], dict(size=38, weight=800, y0=290, x=960, align='CENTER', box=True)),
        (16.3, 21.1, [('Bornes de', INK), ('recharge', INK), ('à domicile', GREEN)], {}),
        (21.25, 28.1, [('Devis', GREEN), ('gratuit,', GREEN), ('réponse', INK), ('rapide', INK)], {}),
        (28.2, 32.1, [('On se', INK), ('déplace,', INK), ('24h/24', GREEN)], {}),
    ]
    DEF = dict(size=84, weight=900, y0=373, step=93, x=192, align='LEFT')

def rgba(h, a=1.0):
    h = h.lstrip('#'); return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'PRO ELEC – montage'
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = int(DUR * FPS)
sc.view_settings.view_transform = 'Standard'          # keep the video's colours untouched
if hasattr(sc.render.image_settings, 'media_type'): sc.render.image_settings.media_type = 'VIDEO'
try:
    sc.render.image_settings.file_format = 'FFMPEG'
except TypeError:
    pass
sc.render.ffmpeg.format = 'MPEG4'; sc.render.ffmpeg.codec = 'H264'; sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.audio_codec = 'AAC'; sc.render.ffmpeg.audio_bitrate = 320
sc.render.filepath = '//rendu/PRO-ELEC_' + ('vertical' if P else 'horizontal') + '_modifie.mp4'

fonts = {w: bpy.data.fonts.load(os.path.join(HERE, 'fonts', f'Montserrat-{w}.ttf')) for w in (900, 800)}
for f in fonts.values(): f.pack()

se = sc.sequence_editor_create()
mv = se.strips.new_movie(name='Video (sans titres)', filepath=bpy.path.relpath(video) if bpy.data.filepath else video, channel=1, frame_start=1)
snd = se.strips.new_sound(name='Voix off + musique', filepath=sound, channel=2, frame_start=1)

ch = 3
for k, (t0, t1, lines, opt) in enumerate(TITLES):
    o = {**DEF, **opt}
    f0 = int(round(t0 * FPS)) + 1; f1 = int(round(t1 * FPS)) + 1
    for i, (txt, col) in enumerate(lines):
        st = se.strips.new_effect(name=f'Titre {k + 1:02d} – ligne {i + 1}', type='TEXT', channel=(3 if k % 2 == 0 else 8) + i, frame_start=f0, length=f1 - f0)
        st.text = txt
        st.font = fonts[o['weight']]
        st.font_size = o['size'] * S
        st.color = rgba(col)
        st.alignment_x = o['align']
        st.anchor_x = o['align']; st.anchor_y = 'CENTER'
        y = o['y0'] + i * o.get('step', 0)
        st.location = (o['x'] / (W / S), 1 - y / (H / S))
        if o.get('box'):
            st.use_box = True; st.box_color = rgba('#FFFFFF', 0.95); st.box_margin = 0.012; st.box_roundness = 1.0
        # entrance (fade + slide up), exit (fade)
        fi = f0 + 3 * i
        st.blend_alpha = 0.0; st.keyframe_insert('blend_alpha', frame=fi)
        st.transform.offset_y = -40 * S; st.transform.keyframe_insert('offset_y', frame=fi)
        st.blend_alpha = 1.0; st.keyframe_insert('blend_alpha', frame=fi + 12)
        st.transform.offset_y = 0; st.transform.keyframe_insert('offset_y', frame=fi + 14)
        st.keyframe_insert('blend_alpha', frame=f1 - 9)
        st.blend_alpha = 0.0; st.keyframe_insert('blend_alpha', frame=f1)

os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, 'PRO-ELEC_' + ('vertical' if P else 'horizontal') + '_textes_modifiables.blend')
bpy.ops.wm.save_as_mainfile(filepath=path, relative_remap=True, compress=True)
# re-point media relative to the .blend
mv.filepath = '//' + os.path.relpath(video, out_dir); snd.sound.filepath = '//' + os.path.relpath(sound, out_dir)
bpy.ops.wm.save_mainfile(compress=True)
print('saved', path)
