"""Génère fastpneu45-pneu.blend : pneu + jante alliage, éclairage bleu électrique, caméra en orbite.
Usage :  python3 creer_scene.py            (module `bpy`)   ou   blender -b -P creer_scene.py
Tout est procédural : modifiez les constantes ci-dessous puis relancez le script."""
import bpy, bmesh, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
BLEU, NEON = (0.008, 0.2, 1.0, 1), (0.0, 0.38, 1.0, 1)
R_OUT, R_RIM, SEG = 1.0, 0.6, 360          # rayon pneu, rayon jante, segments autour de l'axe
FRAMES, FPS = 120, 30

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

def mat(name, base, metal=0.0, rough=0.5, emit=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = strength
    return m

def obj_from_bm(name, bm, material, smooth=True, parent=None):
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); col.objects.link(o)
    me.materials.append(material)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o

def revolve(profile, offset=None, seg=SEG):
    """Révolution d'un profil [(rayon, y)] autour de l'axe Y. offset(i_profil, angle) -> décalage radial."""
    bm = bmesh.new(); rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg; ring = []
        for i, (r, y) in enumerate(profile):
            rr = r + (offset(i, a, y) if offset else 0)
            ring.append(bm.verts.new((rr * math.cos(a), y, rr * math.sin(a))))
        rings.append(ring)
    for s in range(seg):
        a, b = rings[s], rings[(s + 1) % seg]
        for i in range(len(profile) - 1):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    return bm

# ---------------- PNEU ----------------
side = [(R_RIM, 0.25), (R_RIM + 0.03, 0.285), (0.7, 0.31), (0.8, 0.325), (0.88, 0.315), (0.94, 0.295), (0.975, 0.265), (0.993, 0.235)]
TREAD_N = 60
tread = [(R_OUT, -0.215 + 0.43 * i / (TREAD_N - 1)) for i in range(TREAD_N)]
profile = [(r, -y) for r, y in side] + tread + [(r, y) for r, y in reversed(side)]
T0, T1 = len(side), len(side) + TREAD_N - 1
PITCH = 72
def tread_offset(i, a, y):
    if i < T0 or i > T1: return 0.0
    # 4 rainures longitudinales
    for g in (-0.15, -0.05, 0.05, 0.15):
        if abs(y - g) < 0.014: return -0.045
    # lamelles en V (sculpture directionnelle)
    ph = (a * PITCH / (2 * math.pi) + abs(y) * 5.5) % 1.0
    if ph < 0.2 and abs(y) > 0.02: return -0.03
    return 0.0
wheel = bpy.data.objects.new("ROUE", None); col.objects.link(wheel)
caoutchouc = mat("Caoutchouc", (0.006, 0.006, 0.007, 1), 0.0, 0.7)
pneu = obj_from_bm("Pneu", revolve(profile, tread_offset), caoutchouc, parent=wheel)
for p_ in pneu.data.polygons:  # sculptures à arêtes vives, flancs lisses
    c = p_.center
    if math.hypot(c.x, c.z) > 0.94: p_.use_smooth = False

# ---------------- JANTE ----------------
alu = mat("Alliage", (0.72, 0.75, 0.8, 1), 1.0, 0.22)
sombre = mat("Metal sombre", (0.03, 0.035, 0.045, 1), 0.9, 0.4)
disque_m = mat("Disque", (0.45, 0.47, 0.5, 1), 1.0, 0.33)
bleu_m = mat("Bleu electrique", BLEU, 0.3, 0.3, NEON, 6.0)
barrel = [(R_RIM + 0.012, -0.27), (R_RIM, -0.24), (R_RIM - 0.03, -0.2), (R_RIM - 0.06, 0), (R_RIM - 0.03, 0.2), (R_RIM, 0.24), (R_RIM + 0.012, 0.27), (R_RIM - 0.025, 0.275)]
obj_from_bm("Jante tonneau", revolve(barrel, seg=96), sombre, parent=wheel)

def cyl(name, r, depth, y, material, verts=64, parent=wheel, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r2 if r2 else r, depth=depth)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(math.pi / 2, 3, 'X'))
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, y, 0))
    return obj_from_bm(name, bm, material, smooth=False, parent=parent)

FACE_Y = -0.2      # la face visible de la jante regarde vers -Y (vers la caméra)
# branches : 5 paires en Y
for i in range(5):
    for sgn in (-1, 1):
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
        for v in bm.verts:  # effilé vers le moyeu
            t = v.co.x + 0.5
            v.co = Vector((0.13 + t * (R_RIM - 0.15), v.co.y * (0.07 - 0.02 * t), v.co.z * (0.085 - 0.03 * t)))
        a = 2 * math.pi * i / 5
        M = __import__("mathutils").Matrix
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=M.Rotation(sgn * 0.17, 3, 'Y'))
        bmesh.ops.translate(bm, verts=bm.verts, vec=(0, FACE_Y + 0.02, 0))
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=M.Rotation(a + sgn * 0.13, 3, 'Y'))
        o = obj_from_bm(f"Branche {i}{'ab'[sgn > 0]}", bm, alu, smooth=False, parent=wheel)
        bev = o.modifiers.new("Chanfrein", 'BEVEL'); bev.width = 0.012; bev.segments = 3
# anneau extérieur + moyeu + écrous
ring = [(R_RIM - 0.02, FACE_Y - 0.045), (R_RIM - 0.02, FACE_Y + 0.02), (R_RIM - 0.09, FACE_Y + 0.03), (R_RIM - 0.085, FACE_Y - 0.02), (R_RIM - 0.02, FACE_Y - 0.045)]
obj_from_bm("Jante levre", revolve(ring, seg=96), alu, parent=wheel)
cyl("Moyeu", 0.16, 0.09, FACE_Y + 0.01, alu, r2=0.2)
cyl("Cache moyeu", 0.085, 0.03, FACE_Y - 0.045, sombre)
cyl("Anneau bleu", 0.1, 0.012, FACE_Y - 0.04, bleu_m)
for i in range(5):
    a = 2 * math.pi * i / 5 + 0.3
    n = cyl(f"Ecrou {i}", 0.02, 0.04, FACE_Y - 0.04, sombre, verts=6)
    n.location = (0.135 * math.cos(a), 0, 0.135 * math.sin(a))
cyl("Disque de frein", 0.47, 0.035, -0.04, disque_m)
# étrier (fixe : ne tourne pas avec la roue)
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co = Vector((v.co.x * 0.2, v.co.y * 0.15, v.co.z * 0.34))
etrier = obj_from_bm("Etrier", bm, bleu_m, smooth=False)
etrier.location = (0.33, -0.03, 0.24); etrier.rotation_euler = (0, -0.65, 0)
etrier.modifiers.new("Chanfrein", 'BEVEL').width = 0.02

# ---------------- ANIMATION ----------------
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps = FPS
def key(o, path, frame, value, index=-1):
    setattr(o, path, value) if index < 0 else None
    o.keyframe_insert(path, frame=frame)
wheel.rotation_euler = (0, 0, 0); wheel.keyframe_insert("rotation_euler", frame=1)
wheel.rotation_euler = (0, math.radians(900), 0); wheel.keyframe_insert("rotation_euler", frame=FRAMES)

pivot = bpy.data.objects.new("PIVOT CAMERA", None); col.objects.link(pivot)
cam_d = bpy.data.cameras.new("Camera"); cam_d.lens = 70
cam = bpy.data.objects.new("Camera", cam_d); col.objects.link(cam); cam.parent = pivot
cam.location = (0, -6.2, 0.55)
track = cam.constraints.new('TRACK_TO'); track.target = wheel; track.track_axis = 'TRACK_NEGATIVE_Z'; track.up_axis = 'UP_Y'
scene.camera = cam
pivot.rotation_euler = (0, 0, math.radians(-62)); pivot.keyframe_insert("rotation_euler", frame=1)
pivot.rotation_euler = (0, 0, math.radians(-12)); pivot.keyframe_insert("rotation_euler", frame=FRAMES)

# ---------------- LUMIÈRES / DÉCOR ----------------
def area(name, loc, energy, color, size):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.color = color[:3]; d.size = size
    o = bpy.data.objects.new(name, d); col.objects.link(o); o.location = loc
    c = o.constraints.new('TRACK_TO'); c.target = wheel; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    return o
area("Lumiere principale", (2.5, -4, 3), 380, (1, 1, 1), 2.5)
area("Contre bleu gauche", (-3.5, 1.0, 0.8), 1100, BLEU, 2)
area("Contre neon droite", (3.2, 1.5, -0.6), 800, NEON, 2)
area("Bandeau dessus", (0, -0.5, 3.2), 300, (0.6, 0.8, 1), 4)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30)
sol = obj_from_bm("Sol", bm, mat("Sol brillant", (0.004, 0.006, 0.012, 1), 0.2, 0.12), smooth=False)
sol.location = (0, 0, -R_OUT)
world = bpy.data.worlds.new("Monde"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.003, 0.005, 0.012, 1)

# ---------------- RENDU ----------------
r = scene.render
r.resolution_x, r.resolution_y = 1080, 1920
r.engine = 'CYCLES'
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'Filmic' if 'Filmic' in [i.identifier for i in type(scene.view_settings).bl_rna.properties['view_transform'].enum_items] else scene.view_settings.view_transform
r.filepath = "//rendu/pneu_"
r.image_settings.file_format = 'PNG'

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "fastpneu45-pneu.blend"))
print("OK ->", os.path.join(HERE, "fastpneu45-pneu.blend"))
