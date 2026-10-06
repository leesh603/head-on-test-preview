"""Water dressing for sinking ships, matched to the painted aerial sea (terrain-sea359r2).

    python3 tools/fx-sample/sinkwater.py           -> ship-sinkwater.webp + ship-sinkwater.json
    python3 tools/fx-sample/sinkwater.py <dir>     -> <dir>/sinkwater-preview.png (cells over the sea tile)

Cells (all premultiplied-friendly RGBA, soft edges, no hard outlines):
  lace    elongated waterline foam: fine white filaments over a pale aerated band
  boil    upwelling air: lighter turquoise water with a foam-filament net, round
  oil     fuel slick: near-black sheen, faint warm/cool iridescent rim, ragged edge
  ripple  a broken expanding ring of whitened water (the last swirl over the wreck)
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SS = 2


def fbm(w, h, seed, base=4, octaves=6, gain=.55, aspect=1.0):
    """Value-noise fBm. aspect>1 stretches features along x (wind-driven streaks)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
    for o in range(octaves):
        cx = max(1, int(base * 2 ** o / aspect)); cy = max(1, int(base * 2 ** o * h / w))
        g = rng.random((cy + 1, cx + 1)).astype(np.float32)
        yy = np.linspace(0, cy, h, endpoint=False); xx = np.linspace(0, cx, w, endpoint=False)
        y0 = yy.astype(int); x0 = xx.astype(int); fy = (yy - y0)[:, None]; fx = (xx - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        a = g[y0][:, x0]; b = g[y0][:, x0 + 1]; c = g[y0 + 1][:, x0]; d = g[y0 + 1][:, x0 + 1]
        out += amp * ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy)
        tot += amp; amp *= gain
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def grid(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return (x + .5) / w * 2 - 1, (y + .5) / h * 2 - 1


def smooth(e0, e1, v):
    t = np.clip((v - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


from scipy.ndimage import gaussian_filter as blur


def foam(w, h, seed, density=.5, streak=2.6):
    """Aerial sea foam: clustered bright speckles and short wind streaks with a soft aerated halo,
    the same vocabulary as the whitecaps painted into the sea tile."""
    cluster = smooth(.5 - density * .35, .85 - density * .2, fbm(w, h, seed, 3, 5))
    speck = smooth(.68 - density * .06, .8, fbm(w, h, seed + 1, 26, 4, .6, streak))
    fine = smooth(.7 - density * .08, .8, fbm(w, h, seed + 2, 56, 3, .6, streak * 1.5))
    core = np.clip(speck * .85 + fine * .75, 0, 1) * cluster
    halo = blur(core, 3 * SS) * 1.6 + blur(cluster, 10 * SS) * .22
    return np.clip(core, 0, 1), np.clip(halo, 0, 1)


def rgba(col, a):
    a = np.clip(a, 0, 1)
    return np.dstack([np.clip(col, 0, 1), a])


def lace(seed=1):
    W, H = 512 * SS, 192 * SS
    x, y = grid(W, H)
    warp = fbm(W, H, seed + 3, 3, 4) - .5
    r = np.sqrt((x / .97) ** 2 + ((y + warp * .3) / .66) ** 2) + (fbm(W, H, seed + 5, 5, 5) - .5) * .35
    body = 1 - smooth(.5, 1.0, r)
    core, halo = foam(W, H, seed + 11, 1.15)
    a = body * np.clip(core * 1.1 + halo * .7 + .08, 0, 1)
    w_ = core[..., None]
    col = np.array([.62, .82, .84]) * (1 - w_) + np.array([.97, .99, .98]) * w_
    return rgba(col, a)


def boil(seed=2):
    W = H = 384 * SS
    x, y = grid(W, H)
    r = np.sqrt(x * x + y * y) + (fbm(W, H, seed + 1, 3, 4) - .5) * .3
    body = 1 - smooth(.3, .98, r)
    core, halo = foam(W, H, seed + 9, .55)
    up = body * (.5 + .3 * fbm(W, H, seed + 13, 4, 4))          # lighter upwelling water
    a = np.clip(up * .5 + core * body * .9 + halo * body * .35, 0, 1)
    w_ = (core * body)[..., None]
    col = np.array([.30, .62, .64]) * (1 - w_) + np.array([.95, .99, .98]) * w_
    return rgba(col, a)


def oil(seed=3):
    W = H = 384 * SS
    x, y = grid(W, H)
    warp = (fbm(W, H, seed + 2, 3, 5) - .5) * .5
    r = np.sqrt((x + warp) ** 2 + (y - warp * .6) ** 2) + (fbm(W, H, seed + 7, 7, 5) - .5) * .22
    body = 1 - smooth(.55, .92, r)
    sheen = smooth(.55, .9, fbm(W, H, seed + 19, 6, 5, .55, 2.0))       # soft light-catching swirls
    rim = smooth(.48, .7, r) * (1 - smooth(.72, .9, r))
    col = np.dstack([.06 + .10 * sheen + .10 * rim, .08 + .10 * sheen + .06 * rim, .09 + .12 * sheen + .02 * rim])
    a = np.clip(body * (.5 + .12 * sheen), 0, 1)
    return rgba(col, a)


def ripple(seed=4):
    W = H = 512 * SS
    x, y = grid(W, H)
    ang = np.arctan2(y, x)
    r = np.sqrt(x * x + y * y) + (fbm(W, H, seed + 3, 4, 4) - .5) * .06
    band = np.exp(-((r - .8) / .07) ** 2) + .55 * np.exp(-((r - .6) / .05) ** 2)
    core, halo = foam(W, H, seed + 13, .7)
    breakup = smooth(.35, .65, fbm(W, H, seed + 5, 5, 4))
    a = np.clip(band * breakup * (core * .9 + halo * .6 + .12), 0, 1)
    w_ = core[..., None]
    col = np.array([.66, .85, .86]) * (1 - w_) + np.array([.97, .99, .98]) * w_
    return rgba(col, a)


CELLS = [('lace', lace, (512, 192)), ('boil', boil, (384, 384)), ('oil', oil, (384, 384)), ('ripple', ripple, (512, 512))]


def render():
    out = {}
    for name, fn, size in CELLS:
        arr = fn()
        im = Image.fromarray((arr * 255).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)
        out[name] = im
    return out


def main():
    cells = render()
    if len(sys.argv) > 1:
        sea = Image.open(os.path.join(ROOT, 'terrain-sea359r2.webp')).convert('RGBA')
        W = sum(im.width for im in cells.values()) + 20 * 5
        canvas = sea.resize((W * 2, 1100)).crop((0, 0, W, 560))
        xx = 20
        for im in cells.values():
            canvas.alpha_composite(im, (xx, 20)); xx += im.width + 20
        os.makedirs(sys.argv[1], exist_ok=True)
        canvas.save(os.path.join(sys.argv[1], 'sinkwater-preview.png'))
        print('preview'); return
    # pack in one row-atlas
    W = sum(im.width for im in cells.values()) + 4 * len(cells)
    H = max(im.height for im in cells.values())
    atlas = Image.new('RGBA', (W, H)); rects = {}; xx = 0
    for k, im in cells.items():
        atlas.paste(im, (xx, 0)); rects[k] = [xx, 0, im.width, im.height]; xx += im.width + 4
    atlas.save(os.path.join(ROOT, 'ship-sinkwater.webp'), quality=90, method=6)
    json.dump({'image': 'ship-sinkwater.webp', 'rects': rects}, open(os.path.join(ROOT, 'ship-sinkwater.json'), 'w'), separators=(',', ':'))
    print('atlas', atlas.size, rects)


if __name__ == '__main__':
    main()
