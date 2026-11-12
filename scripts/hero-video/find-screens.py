# Finds the two switched-off (pure black) screens in the Flow clip and writes their corners to quads.json.
# The camera is locked, so one fit on the median of a few frames serves every frame.
# usage: python -I find-screens.py <flow.mp4> <quads.json>
import sys, subprocess, json, numpy as np
src, out = sys.argv[1:3]; W, H = 1920, 1080
idx = list(range(0, 192, 12)); sel = '+'.join(f'eq(n\\,{i})' for i in idx)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{sel}',scale={W}:{H}:flags=lanczos", '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
L = (np.median(F, axis=0) @ np.array([0.299, 0.587, 0.114])).astype(int)
def rfit(u, v):
    u = np.asarray(u, float); v = np.asarray(v, float); keep = np.ones(len(u), bool)
    for _ in range(8):
        A = np.vstack([u[keep], np.ones(keep.sum())]).T; c = np.linalg.lstsq(A, v[keep], rcond=None)[0]
        r = np.abs(c[0] * u + c[1] - v); keep = r <= max(np.median(r[keep]) * 2.5, 0.5)
    return c
def run(x, y, dx, dy, thr=8):
    while 0 <= x + dx < W and 0 <= y + dy < H and L[y + dy, x + dx] <= thr: x += dx; y += dy
    return x, y
def quad(cx, cy, x0, x1, y0, y1):
    # walk out from inside the screen to its black edge, along columns and rows, and fit the four edges
    cols = np.arange(x0, x1, 3); rows = np.arange(y0, y1, 3)
    top = rfit(cols, [run(c, cy, 0, -1)[1] for c in cols]); bot = rfit(cols, [run(c, cy, 0, 1)[1] + 1 for c in cols])
    left = rfit(rows, [run(cx, r, -1, 0)[0] for r in rows]); right = rfit(rows, [run(cx, r, 1, 0)[0] + 1 for r in rows])
    def meet(h, v):
        a, b = h; c, d = v; y = (a * d + b) / (1 - a * c); return [float(c * y + d), float(y)]
    return [meet(top, left), meet(top, right), meet(bot, right), meet(bot, left)]
# seeds and sampling ranges are for this scene (main monitor in the middle, the turned one at the left)
q = dict(main=quad(1000, 400, 680, 1380, 220, 560), second=quad(320, 420, 120, 540, 240, 600))
json.dump(q, open(out, 'w')); print({k: [(round(x, 1), round(y, 1)) for x, y in v] for k, v in q.items()})
