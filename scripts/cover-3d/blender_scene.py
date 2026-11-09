# The Devsign cover, path traced. Same camera and screen as scene.html, so the matrix3d in
# lib/cover-scenes.ts stays valid; materials and light are real instead of painted.
#   Blender -b -P blender_scene.py -- out.png 1440 64
# compose.cjs then lays it over the backdrop and cuts the screen hole.
import bpy, bmesh, math, sys
from mathutils import Matrix, Vector, Quaternion

a = sys.argv[sys.argv.index('--') + 1:]
OUT, W, SAMPLES = a[0], int(a[1]), int(a[2])
H = round(W * 838 / 1440)

# Fitted to a frame of the reference by least squares on its corners (mean error 0.26px).
FOV, CAM, LOOK = 9.2078, (0, 1.7816, 11), (0, 1.0, 0)
YAW, TILT, MON = -0.5903, -0.1270, (-0.0065, 1.1862, -0.02)
BODY_W, BODY_H, TH = 1.6651, 1.07, 0.055
BZ = 0.012
SW, SH = BODY_W - 0.012 - 2 * BZ, BODY_H - 0.012 - 2 * BZ
PYAW, PW, PD, PX, PZ, PY, PC = -0.5884, 1.9816, 1.9506, 0.0763, -0.8232, 0.2444, 0.07
FYAW, FW, FD, FX, FZ, FY = -0.5710, 0.4143, 0.4616, 0.0236, -0.6270, 0.2684
NECK_BASE = [[-0.0739, 0.2684, -0.9427], [0.284, 0.2684, -0.7442]]
NECK_TOP = [[-0.0988, 0.6188, -0.1215], [0.2212, 0.6409, 0.0895]]

C = Matrix.Rotation(math.radians(90), 4, 'X')  # three (y up) to Blender (z up)
def Rx(t): return Matrix.Rotation(t, 4, 'X')
def Ry(t): return Matrix.Rotation(t, 4, 'Y')
def T(*p): return Matrix.Translation(p)
XZ = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # outline in xz, height along y
RIG = Ry(YAW)
MONM = RIG @ T(*MON) @ Rx(TILT)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def srgb(h):
    def f(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(int(h[1:3], 16)), f(int(h[3:5], 16)), f(int(h[5:7], 16)), 1)

def mat(name, color, rough, metal=0.0, coat=0.0, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.08
    return m

PURPLE = mat('plinth', '#4d3a9c', 0.7, spec=0.04)
SILVER = mat('silver', '#c9cdd0', 0.26, metal=1)
BLACKM = mat('stand', '#050506', 0.3, metal=1)
NECKM = mat('neck', '#020203', 0.45, spec=0.0)
STRIP = mat('strip', '#000000', 0.5, spec=0.0)
STRIP.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (0.42, 0.44, 0.46, 1)
STRIP.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.42
CRESCENT = mat('crescent', '#000000', 0.5, spec=0.0)
CRESCENT.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (1, 1, 1, 1)
CRESCENT.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.7
FOOTM = mat('foot', '#60626a', 0.22, metal=1)
GLASS = mat('bezel', '#040405', 0.12, coat=1)

def rounded(w, d, r, seg=24):
    if r <= 0: return [(-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2)]
    pts = []
    for cx, cy, a0 in ((w/2-r, -d/2+r, -90), (w/2-r, d/2-r, 0), (-w/2+r, d/2-r, 90), (-w/2+r, -d/2+r, 180)):
        for i in range(seg + 1):
            t = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts

def solid(name, outline, z0, z1, M, material, bevel=0.0, bseg=4):
    """Extrudes a 2D outline from z0 to z1, bevels its two rims, then places it by M (three space)."""
    bm = bmesh.new()
    lo = [bm.verts.new((x, y, z0)) for x, y in outline]
    hi = [bm.verts.new((x, y, z1)) for x, y in outline]
    bm.faces.new(lo); bm.faces.new(hi)
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.edges.ensure_lookup_table()
    if bevel:
        rim = [e for e in bm.edges if all(abs(v.co.z - z0) < 1e-6 for v in e.verts) or all(abs(v.co.z - z1) < 1e-6 for v in e.verts)]
        bmesh.ops.bevel(bm, geom=rim, offset=bevel, segments=bseg, profile=0.5, affect='EDGES', clamp_overlap=True)
    world = C @ M
    bm.transform(world)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces: f.smooth = True
    for e in bm.edges:
        # Below 30 degrees only: a smooth rim would tilt the normals of the tall side faces upward.
        if len(e.link_faces) != 2: continue
        flat = abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-4  # a horizontal rim edge
        if e.calc_face_angle() > math.radians(26) or (flat and e.calc_face_angle() > math.radians(5)):
            e.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(material)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o

def hexa(name, pts, material):
    """A closed six-sided solid from 8 corners in three space: 0-3 one face, 4-7 the opposite."""
    bm = bmesh.new()
    v = [bm.verts.new(C @ Vector(p)) for p in pts]
    for f in ((0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)):
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.0018, segments=2, profile=0.5, affect='EDGES', clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces: f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle() > math.radians(32): e.smooth = False
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(material)
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); return o

# Plinth: top at height 0, running down 3 units.
solid('plinth', rounded(PW, PD, PC, 32), -3, 0, T(PX, PY, PZ) @ Ry(PYAW) @ XZ, PURPLE, bevel=0.0035, bseg=3)

# Monitor: an aluminium shell, the black glass front a hair proud of it.
bw, bh = SW + BZ * 2, SH + BZ * 2
solid('shell', rounded(bw + 0.012, bh + 0.012, 0.012), -TH - 0.006, -0.006, MONM, SILVER, bevel=0.003)
solid('bezel', rounded(bw, bh, 0.008), -0.006, 0.006, MONM, GLASS, bevel=0.0012)

solid('underside', rounded(bw + 0.016, 0.004, 0), -TH - 0.008, 0.008, MONM @ T(0, -(bh + 0.012) / 2 - 0.0005, 0), NECKM)

# Hinge crescent, on the back of the monitor above the neck.
mid_top = Vector([(a + b) / 2 for a, b in zip(NECK_TOP[0], NECK_TOP[1])])
hx = (MONM.inverted() @ mid_top).x
cu = bpy.data.curves.new('crescent', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.0016; cu.bevel_resolution = 3
sp = cu.splines.new('POLY'); sp.points.add(32)
w = C @ MONM @ T(hx, -SH * 0.5 - 0.004, 0.012)
for i, p in enumerate(sp.points):
    t = math.pi * 1.24 + math.pi * 0.52 * i / 32
    v = w @ Vector((0.031 * math.cos(t), 0.031 * math.sin(t), 0))
    p.co = (v.x, v.y, v.z, 1)
cu.materials.append(CRESCENT)
scene.collection.objects.link(bpy.data.objects.new('crescent', cu))

# Foot: a thin mirror-dark plate lying on the plinth.
solid('foot', rounded(FW, FD, 0.012, 8), PY - 0.002, PY + 0.0165, T(FX, 0, FZ) @ Ry(FYAW) @ XZ, NECKM, bevel=0.0015, bseg=2)
solid('foot_top', rounded(FW - 0.003, FD - 0.003, 0.011, 8), PY + 0.0165, PY + 0.0172, T(FX, 0, FZ) @ Ry(FYAW) @ XZ, FOOTM)

# The foot's right side catches the light: a thin neutral face.
def fp(lx, y, lz):
    q = Ry(FYAW) @ Vector((lx, y, lz))
    return Vector((q.x + FX, q.y, q.z + FZ))
fr = FW / 2 + 0.0004
fq = FD / 2 - 0.01
hexa('foot_side', [fp(fr, PY, fq), fp(fr, PY, -fq), fp(fr, PY + 0.0168, -fq), fp(fr, PY + 0.0168, fq), fp(fr + 0.0012, PY, fq), fp(fr + 0.0012, PY, -fq), fp(fr + 0.0012, PY + 0.0168, -fq), fp(fr + 0.0012, PY + 0.0168, fq)], STRIP)

# Neck: the four corners read from the reference, 0.03 thick behind that face.
n = (MONM.to_3x3() @ Vector((0, 0, -1))).normalized() * 0.018
a, b, c, d = [Vector(q) for q in (NECK_BASE[0], NECK_BASE[1], NECK_TOP[1], NECK_TOP[0])]
a.y = b.y = PY + 0.012  # sunk into the foot, so the two meet with no gap
c, d = c + (c - b) * 0.45, d + (d - a) * 0.45  # runs up behind the monitor, so no gap shows
hexa('neck', [a, b, c, d, a + n, b + n, c + n, d + n], NECKM)
# The neck's base stops just behind the plate's back edge at its left end: fill that sliver.
fw = -n * 1.6
ft, fb = PY + 0.0172, PY + 0.0005
al = a + (b - a) * 0.055 + fw  # kept under the neck, so it never shows past its left edge
qs = [Vector((q.x, ft, q.z)) for q in (a, b, b + fw, al)] + [Vector((q.x, fb, q.z)) for q in (a, b, b + fw, al)]
hexa('neck_seat', qs, FOOTM)
# The neck's right side: the thin lit strip on the reference.
u = (b - a).normalized() * 0.003
hexa('neck_side', [b, c, c + n, b + n, b + u, c + u, c + n + u, b + n + u], STRIP)

# The monitor casts no shadow, or its edge draws a straight line across the plinth.
for name in ('shell', 'bezel', 'underside', 'neck', 'neck_side', 'crescent'):
    bpy.data.objects[name].visible_shadow = False

# Camera
cd = bpy.data.cameras.new('cam'); cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(FOV)
cam = bpy.data.objects.new('cam', cd); scene.collection.objects.link(cam)
pos = C @ Vector(CAM); look = C @ Vector(LOOK)
cam.location = pos
cam.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

# Light: a broad soft top, a long strip behind and to the right that the aluminium edge
# and the plinth's right face pick up, a low kicker from the upper left.
def area(name, loc, target, size, size_y, power, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA'); l.shape = 'RECTANGLE'; l.size = size; l.size_y = size_y
    l.energy = power; l.color = color
    o = bpy.data.objects.new(name, l); scene.collection.objects.link(o)
    o.visible_camera = False
    o.location = C @ Vector(loc)
    o.rotation_euler = (C @ Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o

# This one comes from behind the monitor; its shadow would lay a hard band across the plinth.
area('top', (0.4, 6.0, -2.0), (0.2, 0.2, -0.3), 9, 4.4, 70).data.use_shadow = False
# Straight down: lights the plinth's top evenly from edge to edge and leaves its sides alone.
sun_d = bpy.data.lights.new('sun', 'SUN'); sun_d.energy = 4.8; sun_d.angle = math.radians(0.4)
sun = bpy.data.objects.new('sun', sun_d); scene.collection.objects.link(sun); sun.rotation_euler = (0, 0, 0)
area('right', (7.5, 0.4, 2.2), (0.6, -0.4, 0), 1.6, 5, 120)
area('edge', (9.0, 0.6, -3.7), (0, 0.8, -0.3), 5, 12, 62)
area('back', (-0.5, 3.4, -10), (0, 0.2, 0), 12, 3, 260)
# Low behind the set: what the mirror-dark foot picks up on its left.
area('foot', (-1.6, 1.5, -10.5), (-0.6, 0.27, -0.6), 2.9, 1.6, 120)
area('left', (-7, 3.5, -3), (0, 1.2, 0), 3, 5, 3)
area('front', (0.5, 2.2, 9), (0, 0.6, 0), 8, 2.4, 3)

w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.009, 0.03, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.04

# Render
scene.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'; prefs.get_devices()
for dev in prefs.devices: dev.use = True
scene.cycles.device = 'GPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.filter_width = 0.9  # default 1.5 softens every edge
scene.cycles.max_bounces = 8
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = W, H
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '16'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.filepath = OUT

from bpy_extras.object_utils import world_to_camera_view
bpy.context.view_layer.update()
pts = []
for x, y in ((-1, 1), (1, 1), (1, -1), (-1, -1)):
    c = world_to_camera_view(scene, cam, C @ MONM @ Vector((x * SW / 2, y * SH / 2, 0.007)))
    pts.append([round(c.x * 1440, 1), round((1 - c.y) * 838, 1)])
print('CORNERS', pts)
if SAMPLES == 0: sys.exit(0)
bpy.ops.render.render(write_still=True)
