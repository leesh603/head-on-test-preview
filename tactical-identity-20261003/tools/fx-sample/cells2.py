"""Round-5 repaint of the smoke / fire / muzzle / spark cells in fx-sample-atlas.

    python3 tools/fx-sample/cells2.py            -> patches fx-sample/fx-sample-atlas.webp in place, bumps .json version
    python3 tools/fx-sample/cells2.py <dir>      -> writes each repainted cell as <dir>/<key>.png (preview)

Post-pass over gen.py's atlas: every cell keeps its rect, anchor and orientation, only the
pixels change. Same volumetric model as boom.py (noise-broken soft puffs, height-map
lighting, temperature -> emission ramp) so smoke, fire and explosions read as one family.
Mine / grenade / naval art is not touched.
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as blur

sys.path.insert(0, os.path.dirname(__file__))
from boom import fbm, ramp  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SSF = 4  # supersampling
L = np.array([-.55, -.62, .56]); L /= np.linalg.norm(L)


def grid(W, H):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return xx, yy


def noise2(W, H, seed, octaves=5):
    n = fbm(max(W, H), seed, octaves)
    return n[:H, :W]


def volume(W, H, puffs, albedo, seed, dens=2.2, soft=1.2, edge_noise=.35, heat_col=None, shade_k=1.0, lift=.38):
    """puffs: list of (x, y, r, temp[0..1]) in pixels of the (supersampled) cell."""
    xx, yy = grid(W, H)
    nz = [noise2(W, H, seed * 5 + k) for k in range(3)]
    fine = noise2(W, H, seed * 5 + 7, 4)
    D = np.zeros((H, W), np.float32); E = np.zeros((H, W), np.float32); Hm = np.zeros((H, W), np.float32)
    rng = np.random.default_rng(seed)
    for (x0, y0, r, T) in puffs:
        x1, x2 = int(max(0, x0 - r)), int(min(W, x0 + r + 1)); y1, y2 = int(max(0, y0 - r)), int(min(H, y0 + r + 1))
        if x2 <= x1 or y2 <= y1:
            continue
        dx = (xx[y1:y2, x1:x2] - x0) / r; dy = (yy[y1:y2, x1:x2] - y0) / r; d2 = dx * dx + dy * dy
        k = rng.integers(0, 3); n = nz[k][y1:y2, x1:x2]
        m = np.clip(1 - d2, 0, 1) ** 1.4 * np.clip((n - .18) / .45, 0, 1) ** 1.1
        D[y1:y2, x1:x2] += m; E[y1:y2, x1:x2] += m * T
        z = r * np.sqrt(np.clip(1 - d2, 0, 1)) * (.55 + .45 * n) + rng.random() * r * .4
        Hm[y1:y2, x1:x2] = np.maximum(Hm[y1:y2, x1:x2], np.where(m > .02, z, 0))
    Ds = blur(D, soft * SSF)
    Tf = E / (D + 1e-4)
    alpha = 1 - np.exp(-Ds * dens)
    alpha *= np.clip(1 - edge_noise + edge_noise * (Ds / (Ds + .25)) * (.75 + .5 * fine), 0, 1)
    gy, gx = np.gradient(blur(Hm, 2.4 * SSF))
    nl = np.sqrt(gx * gx + gy * gy + 1)
    shade = np.clip((-gx * L[0] - gy * L[1] + L[2]) / nl, 0, 1) * (.74 + .52 * fine)
    ao = np.clip(blur(D, 5 * SSF) / 2.2, 0, 1)
    alb = np.array(albedo, np.float32) / 255
    col = alb * (lift + 1.2 * shade[..., None] ** 1.25 * shade_k) * (1 - .3 * ao[..., None])
    if E.max() > 0:
        thick = np.clip((Ds - .5) / 2.2, 0, 1)
        Tv = Tf * (.45 + .6 * nz[2] + .3 * (fine - .5) + .5 * thick)
        e = np.clip((Tv - .32) / .3, 0, 1)[..., None]
        fire = ramp(Tv) * (.5 + .75 * shade[..., None]) * (1 + .35 * e)
        heat = blur(np.clip(D * np.clip(Tf - .3, 0, 1), 0, 3), 6 * SSF)
        col = col + np.array(heat_col or [1, .42, .12]) * np.clip(heat, 0, 1)[..., None] * .45
        col = col * (1 - e) + fire * e
        alpha = np.maximum(alpha, np.clip(e[..., 0] * 1.2, 0, 1) * np.clip(Ds * 2, 0, 1))
    return col, alpha


def to_img(col, alpha, W, H, margin=.08):
    h, w = alpha.shape
    xx, yy = grid(w, h)
    ex = np.clip(np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)) / (min(w, h) * margin), 0, 1)
    a = alpha * ex ** 1.5
    rgba = np.dstack([np.clip(col, 0, 1) * 255, np.clip(a, 0, 1) * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA').resize((W, H), Image.LANCZOS)


def glow_field(W, H, cx, cy, sx, sy, ang=0.0):
    xx, yy = grid(W, H)
    dx, dy = xx - cx, yy - cy
    ca, sa = math.cos(ang), math.sin(ang)
    u, v = dx * ca + dy * sa, -dx * sa + dy * ca
    return np.exp(-(u / sx) ** 2 - (v / sy) ** 2)


def emissive(I, W, H, gain=1.0, glow_a=.45):
    """Intensity field -> hot colours; alpha follows intensity with a soft orange halo."""
    col = ramp(np.clip(I * gain, 0, 1))
    a = np.clip(I * 1.6, 0, 1)
    halo = blur(I, max(W, H) * .06)
    ha = np.clip(halo * glow_a * 2, 0, glow_a)
    a_out = a + ha * (1 - a)
    col = (col * a[..., None] + np.array([1, .5, .18]) * ha[..., None] * (1 - a[..., None])) / np.maximum(a_out[..., None], 1e-4)
    return col, a_out


def streaks(I, W, H, cx, cy, n, r0, r1, seed, width=1.0, spread=math.pi, dirn=0.0, hot=1.0):
    rng = np.random.default_rng(seed)
    xx, yy = grid(W, H)
    for _ in range(n):
        a = dirn + (rng.random() - .5) * 2 * spread; L1 = r0 + rng.random() * (r1 - r0); w = width * SSF * (.6 + rng.random() * .8)
        ux, uy = math.cos(a), math.sin(a)
        dx, dy = xx - cx, yy - cy
        t = dx * ux + dy * uy; d = np.abs(-dx * uy + dy * ux)
        s = np.clip(t / L1, 0, 1)
        I = np.maximum(I, np.where((t > 0) & (t < L1), np.exp(-(d / w) ** 2) * (1 - s) ** 1.2 * hot * (.7 + .3 * rng.random()), 0))
    return I


# ------------------------------------------------------------------ smoke family

def smoke_cell(W, H, albedo, seed, n=30, spread=.27, rmin=.09, rmax=.19, dens=2.2, heat=0.0, lift=.38, up=0.0):
    w, h = W * SSF, H * SSF
    rng = np.random.default_rng(seed)
    P = []
    for i in range(n):
        a = rng.random() * 6.283; d = (rng.random() ** .7) * spread * min(w, h)
        r = (rmin + rng.random() * (rmax - rmin)) * min(w, h) * (1.15 - .4 * d / (spread * min(w, h) + 1e-6))
        P.append((w / 2 + math.cos(a) * d, h / 2 + math.sin(a) * d - up * h, r, heat * max(0, 1 - d / (spread * min(w, h) * .6))))
    col, a = volume(w, h, P, albedo, seed, dens=dens, lift=lift)
    return to_img(col, a, W, H)


def flak():
    W = H = 128 * SSF
    rng = np.random.default_rng(71)
    P = [(W / 2 + math.cos(a) * W * .12 * rng.random(), H / 2 + math.sin(a) * H * .12 * rng.random(), W * (.13 + rng.random() * .08), .0)
         for a in rng.random(18) * 6.283]
    P += [(W / 2 + (rng.random() - .5) * W * .08, H / 2 + (rng.random() - .5) * H * .08, W * .1, .95) for _ in range(4)]
    col, a = volume(W, H, P, (44, 41, 39), 71, dens=2.4, lift=.3)
    return to_img(col, a, 128, 128)


def dirt_burst():
    W = H = 160 * SSF
    rng = np.random.default_rng(81)
    P = []
    for i in range(26):
        a = rng.random() * 6.283; d = W * (.05 + .3 * rng.random() ** .8)
        P.append((W / 2 + math.cos(a) * d, H / 2 + math.sin(a) * d, W * (.06 + .06 * rng.random()) * (1.2 - d / W), 0))
    col, a = volume(W, H, P, (164, 142, 112), 81, dens=1.7, lift=.42)
    img = to_img(col, a, 160, 160)
    # dark clods thrown outward
    arr = np.asarray(img).astype(np.float32)
    xx, yy = grid(160, 160)
    for i in range(14):
        ang = rng.random() * 6.283; d = 30 + rng.random() * 42; r = 1.3 + rng.random() * 1.8
        m = np.exp(-(((xx - 80 - math.cos(ang) * d) ** 2 + (yy - 80 - math.sin(ang) * d) ** 2) / (r * r)) ** 2)
        arr[..., :3] = arr[..., :3] * (1 - m[..., None]) + np.array([54, 42, 32]) * m[..., None]
        arr[..., 3] = np.maximum(arr[..., 3], m * 235)
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')


# ------------------------------------------------------------------ fire

def flame(I_shape, cx, cy, length, width, seed, ang=math.pi / 2, t_off=0):
    """Turbulent flame tongue: hot at (cx, cy), trailing along `ang` (down = pi/2)."""
    H, W = I_shape
    xx, yy = grid(W, H)
    n1 = noise2(W, H, seed); n2 = noise2(W, H, seed + 1, 3)
    dx, dy = xx - cx, yy - cy
    ca, sa = math.cos(ang), math.sin(ang)
    u, v = dx * ca + dy * sa, -dx * sa + dy * ca
    s = np.clip(u / length, -.3, 1.4)
    wv = width * (1 - .6 * np.clip(s, 0, 1)) + 1
    v2 = v + (n1 - .5) * width * 1.6 * np.clip(s + .2, 0, 1)
    env = np.exp(-(v2 / wv) ** 2) * np.where(u < 0, np.exp(-(u / (width * .7)) ** 2), np.exp(-(np.clip(u, 0, None) / length) ** 1.6))
    turb = .55 + .8 * n2
    return np.clip(env * turb, 0, 1.3)


def fire_engine(W=128, H=128, two=False):
    w, h = W * SSF, H * SSF
    rng = np.random.default_rng(91 + two)
    centers = [(w * .5, h * .3)] if not two else [(w * .3, h * .3), (w * .7, h * .36)]
    P = []
    for (cx, cy) in centers:
        for i in range(10):
            t = i / 9; P.append((cx + (rng.random() - .5) * w * .06 * (1 + t * 2), cy + h * (.12 + t * .5), w * (.08 + t * .09) * (.65 if two else 1), 0)); P.append((cx + (rng.random() - .5) * w * .1, cy + h * (.14 + t * .48), w * (.06 + t * .07) * (.65 if two else 1), 0))
    col, a = volume(w, h, P, (76, 71, 66), 91 + two, dens=1.6, lift=.34)
    I = np.zeros((h, w), np.float32)
    for k, (cx, cy) in enumerate(centers):
        I = np.maximum(I, flame((h, w), cx, cy, h * (.32 if not two else .24), w * (.11 if not two else .075), 95 + k * 3) * 1.1)
    fc, fa = emissive(I, w, h, gain=.95, glow_a=.35)
    col = fc * fa[..., None] + col * a[..., None] * (1 - fa[..., None])
    aa = fa + a * (1 - fa)
    col = col / np.maximum(aa[..., None], 1e-4)
    return to_img(col, aa, W, H)


def fire_ground():
    W = H = 192 * SSF
    rng = np.random.default_rng(101)
    # smoke drifting up-right from the fire bed
    P = [(W * (.52 + .05 * i) + (rng.random() - .5) * W * .08, H * (.46 - .045 * i), W * (.08 + .018 * i), 0) for i in range(9)]
    col, a = volume(W, H, P, (70, 66, 62), 101, dens=1.5, lift=.34)
    I = np.zeros((H, W), np.float32)
    for k in range(7):
        ang = rng.random() * 6.283; d = W * .1 * rng.random()
        I = np.maximum(I, flame((H, W), W * .45 + math.cos(ang) * d, H * .58 + math.sin(ang) * d, H * (.1 + .08 * rng.random()), W * .05, 111 + k, ang=-math.pi / 2 - .5 + rng.random()))
    bed = glow_field(W, H, W * .45, H * .6, W * .16, H * .11) * .55
    I = np.maximum(I, bed * (.6 + .6 * noise2(W, H, 131)))
    fc, fa = emissive(I, W, H, gain=.95, glow_a=.4)
    col = fc * fa[..., None] + col * a[..., None] * (1 - fa[..., None])
    aa = fa + a * (1 - fa)
    return to_img(col / np.maximum(aa[..., None], 1e-4), aa, 192, 192)


def fire_flash():
    W = H = 192 * SSF
    I = glow_field(W, H, W / 2, H / 2, W * .09, H * .09) * 1.1 + glow_field(W, H, W / 2, H / 2, W * .2, H * .2) * .45
    n = noise2(W, H, 141)
    I = I * (.8 + .4 * n)
    I = streaks(I, W, H, W / 2, H / 2, 24, W * .16, W * .46, 142, width=1.5, hot=1.0)
    col, a = emissive(np.clip(I, 0, 1.2), W, H, gain=1.0, glow_a=.5)
    return to_img(col, a, 192, 192, margin=.12)


def flame_jet():
    W, H = 256 * SSF, 96 * SSF
    xx, yy = grid(W, H)
    n1 = noise2(W, H, 151); n2 = noise2(W, H, 152, 3)
    s = np.clip((xx - W * .02) / (W * .92), 0, 1)
    wid = H * (.05 + .3 * s ** .8)
    off = (n1 - .5) * H * .35 * s
    env = np.exp(-((yy - H / 2 - off) / wid) ** 2) * np.clip((xx - W * .02) / (W * .03), 0, 1)
    T = env * (1.05 - .75 * s) * (.6 + .7 * n2)
    col, a = emissive(np.clip(T, 0, 1.1), W, H, gain=1.05, glow_a=.35)
    # soot at the tip
    soot = env * np.clip((s - .62) / .3, 0, 1) * (n2 > .45)
    col = col * (1 - soot[..., None] * .7) + np.array([.2, .16, .14]) * soot[..., None] * .7
    a = np.maximum(a, soot * .8)
    return to_img(col, a, 256, 96, margin=.05)


# ------------------------------------------------------------------ guns

def muzzle(kind='single'):
    W = H = 64 * SSF
    I = np.zeros((H, W), np.float32)
    lobes = {'single': [(0, 1.0)], 'rear': [(0, .9)], 'heavy': [(0, 1.15)], 'twin': [(-.17, .78), (.17, .78)]}[kind]
    n = noise2(W, H, 161 + len(kind))
    xx, yy = grid(W, H)
    for (oy, k) in lobes:
        cy = H * (.5 + oy); x0 = W * .22
        core = glow_field(W, H, x0, cy, W * .055 * k, H * .06 * k)
        # forward cone: widens then pinches to a tip
        s = np.clip((xx - x0) / (W * .7 * k), 0, 1)
        wid = H * .1 * k * (np.clip(np.sin(s * math.pi), 0, 1) ** .7 + .25) * (1 - s * .5)
        cone = np.exp(-((yy - cy) / (wid + 1)) ** 2) * (xx > x0 - W * .02) * (1 - s) ** .8 * (.55 + .7 * n)
        pet = (glow_field(W, H, x0 + W * .03 * k, cy - H * .1 * k, W * .025, H * .1 * k, .25) +
               glow_field(W, H, x0 + W * .03 * k, cy + H * .1 * k, W * .025, H * .1 * k, -.25)) * (.75 if kind != 'twin' else .45)
        I = np.maximum(I, core * 1.25 + cone * .95 + pet)
    if kind == 'heavy':
        I = streaks(I, W, H, x0, H / 2, 7, W * .2, W * .5, 165, width=.9, spread=.45, hot=.7)
    col, a = emissive(np.clip(I, 0, 1.25), W, H, gain=1.0, glow_a=.4)
    return to_img(col, a, 64, 64, margin=.04)


def spark():
    W = H = 48 * SSF
    I = glow_field(W, H, W / 2, H / 2, W * .08, H * .08) * 1.2
    I = streaks(I, W, H, W / 2, H / 2, 9, W * .2, W * .45, 171, width=.8, hot=1.0)
    col, a = emissive(np.clip(I, 0, 1.2), W, H, gain=1.05, glow_a=.35)
    return to_img(col, a, 48, 48, margin=.04)


def hit_puff():
    W = H = 64 * SSF
    rng = np.random.default_rng(181)
    P = [(W / 2 + (rng.random() - .5) * W * .3, H / 2 + (rng.random() - .5) * H * .3, W * (.12 + rng.random() * .07), 0) for _ in range(7)]
    col, a = volume(W, H, P, (150, 140, 126), 181, dens=1.6, lift=.45)
    I = streaks(glow_field(W, H, W / 2, H / 2, W * .06, H * .06), W, H, W / 2, H / 2, 6, W * .15, W * .38, 182, width=.8)
    fc, fa = emissive(np.clip(I, 0, 1.1), W, H, glow_a=.2)
    col = fc * fa[..., None] + col * a[..., None] * (1 - fa[..., None]); aa = fa + a * (1 - fa)
    return to_img(col / np.maximum(aa[..., None], 1e-4), aa, 64, 64)


def rocket_flame():
    W, H = 96 * SSF, 32 * SSF
    n = noise2(W, H, 191)
    # nozzle at the right edge, plume streams to the left
    I = glow_field(W, H, W * .86, H / 2, W * .08, H * .16) * 1.2 + glow_field(W, H, W * .55, H / 2, W * .38, H * .14) * (.5 + .6 * n)
    xx, yy = grid(W, H)
    diamonds = (np.cos((W * .86 - xx) / (W * .07) * math.pi) * .5 + .5) * glow_field(W, H, W * .66, H / 2, W * .22, H * .07) * .35
    col, a = emissive(np.clip(I + diamonds, 0, 1.2), W, H, gain=1.0, glow_a=.35)
    return to_img(col, a, 96, 32, margin=.04)


def debris_shard():
    W = H = 64 * SSF
    rng = np.random.default_rng(201)
    xx, yy = grid(W, H)
    pts = [(W / 2 + math.cos(a) * W * (.14 + .2 * rng.random()), H / 2 + math.sin(a) * H * (.08 + .12 * rng.random())) for a in np.sort(rng.random(7) * 6.283)]
    from PIL import ImageDraw
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    M = blur(np.asarray(m, np.float32) / 255, SSF * .6)
    gy, gx = np.gradient(blur(M, SSF * 2))
    lit = np.clip(-(gx * L[0] + gy * L[1]) * W * .08, 0, 1)
    n = noise2(W, H, 202)
    col = np.array([.2, .16, .13]) * (.7 + .6 * n)[..., None] + np.array([.55, .46, .36]) * lit[..., None]
    return to_img(col, M, 64, 64, margin=.02)


CELLS = {
    'smokeGray': lambda: smoke_cell(128, 128, (150, 146, 140), 11),
    'smokeDark': lambda: smoke_cell(128, 128, (86, 81, 76), 12, dens=2.4, lift=.4),
    'smokeHeavy': lambda: smoke_cell(192, 192, (98, 92, 86), 13, n=44, spread=.3, dens=2.3, lift=.4),
    'smokePuff': lambda: smoke_cell(96, 96, (196, 190, 180), 14, n=20, spread=.22, dens=1.8, lift=.5),
    'mistPuff': lambda: smoke_cell(128, 128, (226, 226, 222), 15, n=26, dens=1.3, lift=.6),
    'dustPuff': lambda: smoke_cell(96, 96, (176, 156, 124), 16, n=20, spread=.24, dens=1.9, lift=.48),
    'dirtBurst': dirt_burst,
    'flak': flak,
    'fireEngine': lambda: fire_engine(128, 128),
    'fireWing': lambda: fire_engine(128, 128, two=True),
    'fireGround': fire_ground,
    'fireFlash': fire_flash,
    'flameJet': flame_jet,
    'muzzle': lambda: muzzle('single'),
    'muzzleTwin': lambda: muzzle('twin'),
    'muzzleHeavy': lambda: muzzle('heavy'),
    'muzzleRear': lambda: muzzle('rear'),
    'spark': spark,
    'hitPuff': hit_puff,
    'rocketFlame': rocket_flame,
    'debrisShard': debris_shard,
}


def main():
    only = [a for a in sys.argv[1:] if not os.path.sep in a and a in CELLS]
    out = next((a for a in sys.argv[1:] if a not in CELLS), None)
    keys = only or list(CELLS)
    if out:
        os.makedirs(out, exist_ok=True)
        for k in keys:
            CELLS[k]().save(os.path.join(out, k + '.png')); print(k)
        return
    jp = os.path.join(ROOT, 'fx-sample', 'fx-sample.json'); m = json.load(open(jp))
    ap = os.path.join(ROOT, 'fx-sample', m['image']); at = Image.open(ap).convert('RGBA')
    for k in keys:
        x, y, w, h = m['rects'][k][:4]; im = CELLS[k]()
        assert im.size == (w, h), (k, im.size, (w, h))
        at.paste(Image.new('RGBA', (w, h)), (x, y)); at.paste(im, (x, y)); print(k)
    at.save(ap, quality=90, method=6)
    import re
    txt = open(jp).read(); m['version'] += 1
    open(jp, 'w').write(re.sub(r'"version": *\d+', '"version": %d' % m['version'], txt, count=1))
    print('atlas v', m['version'])


if __name__ == '__main__':
    main()
