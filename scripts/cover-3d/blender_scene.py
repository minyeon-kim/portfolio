# The Devsign cover, path traced. Same camera and screen as scene.html, so the matrix3d in
# lib/cover-scenes.ts stays valid; materials and light are real instead of painted.
#   Blender -b -P blender_scene.py -- out.png 1440 64
# compose.cjs then lays it over the backdrop and cuts the screen hole.
import bpy, bmesh, math, sys
from mathutils import Matrix, Vector, Quaternion

a = sys.argv[sys.argv.index('--') + 1:]
OUT, W, SAMPLES = a[0], int(a[1]), int(a[2])
H = round(W * 838 / 1440)

# scene.html's numbers
FOV, CAM, LOOK = 12.85, (0, 2.0, 11), (0, 1.0, 0)
YAW, TILT, MON = -0.43, -0.17, (-0.01, 1.258, -0.02)
PL, PC, PY, PX, PYAW, PTILT = (2.42, 3, 2.02), 0.14, 0.16, 0.07, -0.53, -0.036
FOOT, FS, NB, NT, NX = (0.09, 0.05), (0.62, 0.44), 0.52, 0.45, 0.12
SW, SH, BZ, TH = 2.0, 1.385, 0.024, 0.085

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

PURPLE = mat('plinth', '#5a2ee6', 0.55, spec=0.18)
SILVER = mat('silver', '#c9cdd0', 0.26, metal=1)
BLACKM = mat('stand', '#0b0b0d', 0.3, metal=1)
FOOTM = mat('foot', '#101012', 0.2, metal=1)
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
        if len(e.link_faces) == 2 and e.calc_face_angle() > math.radians(32):
            e.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(material)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o

# Plinth: top at height 0, running down 3 units.
solid('plinth', rounded(PL[0], PL[2], PC, 32), -PL[1], 0, T(PX, PY, 0) @ Rx(PTILT) @ Ry(PYAW) @ XZ, PURPLE, bevel=0.012)

# Monitor: an aluminium shell, the black glass front a hair proud of it.
bw, bh = SW + BZ * 2, SH + BZ * 2
solid('shell', rounded(bw + 0.012, bh + 0.012, 0.014), -TH - 0.006, -0.006, MONM, SILVER, bevel=0.004)
solid('bezel', rounded(bw, bh, 0.01), -0.006, 0.006, MONM, GLASS, bevel=0.0015)

# Hinge: a dark barrel with a thin bright crescent.
hm = MONM @ T(NX, -SH * 0.5 + 0.004, -0.05)
solid('barrel', rounded(0.104, 0.104, 0.05), -0.01, 0.01, hm, BLACKM)
cu = bpy.data.curves.new('crescent', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.0035; cu.bevel_resolution = 3
sp = cu.splines.new('POLY'); sp.points.add(32)
w = C @ MONM @ T(NX, -SH * 0.5 + 0.004, -0.037)
for i, p in enumerate(sp.points):
    t = math.pi + math.pi * i / 32
    v = w @ Vector((0.052 * math.cos(t), 0.052 * math.sin(t), 0))
    p.co = (v.x, v.y, v.z, 1)
cu.materials.append(SILVER)
scene.collection.objects.link(bpy.data.objects.new('crescent', cu))

# Foot: a thin plate, edges sharp enough to catch one line of light.
fy = PYAW - YAW
solid('foot', rounded(FS[0], FS[1], 0.012, 8), -0.008, 0.008, RIG @ T(FOOT[0], PY + 0.014, FOOT[1]) @ Ry(fy) @ XZ, FOOTM, bevel=0.0025, bseg=3)

# Neck: between the back of the monitor and the foot.
pa = RIG.inverted() @ MONM @ Vector((NX, -SH * 0.42, -0.13))
pb = Vector((FOOT[0], PY + 0.03, FOOT[1] - 0.1))
d = pa - pb
q = Vector((0, 1, 0)).rotation_difference(d.normalized())
nm = RIG @ T(*((pa + pb) / 2)) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((1, d.length, 1, 1))
solid('neck', [(-NB/2, -0.5), (NB/2, -0.5), (NT/2, 0.5), (-NT/2, 0.5)], -0.035, 0.035, nm, BLACKM, bevel=0.003, bseg=2)

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
    o.location = C @ Vector(loc)
    o.rotation_euler = (C @ Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o

area('top', (3.4, 4.2, -0.9), (0.7, 0.2, 0), 3.4, 3.4, 150)
area('right', (7.5, 0.4, 2.2), (0.6, -0.4, 0), 1.6, 5, 42)
area('edge', (6.2, 1.6, -6.6), (0.6, 1.3, 0), 3.2, 6, 75)
area('back', (-0.5, 3.4, -10), (0, 0.2, 0), 12, 3, 260)
area('left', (-7, 3.5, -3), (0, 1.2, 0), 3, 5, 26)
area('front', (0.5, 2.2, 9), (0, 0.6, 0), 8, 2.4, 5)

w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.009, 0.03, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 1.0

# Render
scene.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'; prefs.get_devices()
for dev in prefs.devices: dev.use = True
scene.cycles.device = 'GPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
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
