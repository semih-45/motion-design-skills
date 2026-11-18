"""Turn the exported GLB scenes into ready-to-edit .blend files (camera, studio lights, render settings).
usage: python3 blender/build_blend.py [--preview]"""
import bpy, os, sys, math, glob
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
PREVIEW = '--preview' in sys.argv
GREEN = (0.016, 0.6, 0.12)

def setup(name, night=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 128; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 3840, 2160
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    w = bpy.data.worlds.new('Monde'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.012, 0.02, 0.06, 1) if night else (0.95, 0.97, 0.96, 1)
    bg.inputs[1].default_value = 0.25 if night else 0.4
    # bounding box of everything imported
    objs = [o for o in sc.objects if o.type == 'MESH']
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, p)); mx = Vector(map(max, mx, p))
    # ignore huge backdrop planes when framing
    small = [o for o in objs if max(o.dimensions) < 12]
    if small:
        mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
        for o in small:
            for c in o.bound_box:
                p = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, p)); mx = Vector(map(max, mx, p))
    ctr = (mn + mx) / 2; size = (mx - mn).length
    tgt = bpy.data.objects.new('Cible_camera', None); sc.collection.objects.link(tgt); tgt.location = ctr
    cd = bpy.data.cameras.new('Camera'); cd.lens = 50
    cam = bpy.data.objects.new('Camera', cd); sc.collection.objects.link(cam); sc.camera = cam
    az = math.radians(25); d = size * 1.7
    cam.location = ctr + Vector((d * math.sin(az), -d * math.cos(az), size * 0.28))
    tc = cam.constraints.new('TRACK_TO'); tc.target = tgt
    def area(nm, loc, energy, color=(1, 1, 1), s=4):
        ld = bpy.data.lights.new(nm, 'AREA'); ld.energy = energy; ld.color = color; ld.size = s
        o = bpy.data.objects.new(nm, ld); sc.collection.objects.link(o); o.location = ctr + Vector(loc) * size
        t = o.constraints.new('TRACK_TO'); t.target = tgt
    k = size * size
    if night:
        area('Lune', (-0.6, -0.4, 0.9), 60 * k, (0.6, 0.7, 1.0))
    else:
        area('Lumiere_principale', (0.6, -0.8, 0.9), 55 * k)
        area('Lumiere_douce', (-0.9, -0.5, 0.4), 22 * k, (0.92, 1.0, 0.95))
        area('Contre_jour_vert', (0, 0.9, 0.6), 18 * k, (0.75, 1.0, 0.8))
    # glTF importer keeps emissive strength 1 → push light-like materials
    for m in bpy.data.materials:
        if not m.use_nodes: continue
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED' and n.inputs['Emission Strength'].default_value > 0 and sum(n.inputs['Emission Color'].default_value[:3]) > 0.05:
                n.inputs['Emission Strength'].default_value = 6 if night else 2

for glb in sorted(glob.glob(os.path.join(HERE, 'glb', '*.glb'))):
    name = os.path.splitext(os.path.basename(glb))[0]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    night = 'nuit' in name
    setup(name, night)
    # open looking through the camera, with materials visible (no Cycles load on the viewport)
    for ws in bpy.data.workspaces:
        for scr in ws.screens:
            for a in scr.areas:
                if a.type == 'VIEW_3D':
                    sp = a.spaces.active
                    sp.shading.type = 'MATERIAL'
                    sp.overlay.show_extras = False          # hide the big light / camera wireframes
                    if sp.region_3d: sp.region_3d.view_perspective = 'CAMERA'
    out = os.path.join(HERE, name + '.blend')
    bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
    print('saved', out)
    if PREVIEW:
        sc = bpy.context.scene; sc.render.resolution_percentage = 20; sc.cycles.samples = 24
        sc.render.filepath = os.path.join(HERE, 'previews', name + '.png'); bpy.ops.render.render(write_still=True)
