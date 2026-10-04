"""Reload HUD belt tiles: one 7.92 mm round seated in a canvas belt pocket, and an empty pocket.

    python3 tools/fx-sample/belt.py           -> hud-belt-round.png + hud-belt-empty.png
    python3 tools/fx-sample/belt.py <dir>     -> <dir>/belt-preview.png (enlarged strip)

Each tile is one belt pitch wide. The runtime repeats it horizontally at the pill height, so the
tile must wrap seamlessly left/right (pocket seams sit exactly on the tile edges).
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TW, TH, SS = 18, 104, 6          # output tile px (rendered at 4x of ~26px pill) and supersample
W, H = TW * SS, TH * SS


def grid():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    return (x + .5) / W, (y + .5) / H          # normalized 0..1 (x = one pitch, y = pill height)


def noise(seed, sx, sy):
    rng = np.random.default_rng(seed)
    g = rng.random((sy, sx)).astype(np.float32)
    ys = (np.arange(H) / H * sy).astype(int) % sy
    xs = (np.arange(W) / W * sx).astype(int) % sx
    return g[ys][:, xs]


def over(dst, rgb, a):
    a = np.clip(a, 0, 1)[..., None]
    dst[..., :3] = dst[..., :3] * (1 - a) + np.asarray(rgb, np.float32) * a
    dst[..., 3:] = dst[..., 3:] * (1 - a) + a
    return dst


def cyl(x, x0, x1):
    """Cylinder shading across [x0,x1]: returns (inside mask, normal-x -1..1)."""
    c, r = (x0 + x1) / 2, (x1 - x0) / 2
    n = (x - c) / r
    return np.abs(n) <= 1, np.clip(n, -1, 1)


def metal(n, base, spec=1.0, rim=.35):
    """Brushed-cylinder metal: key light from upper-left, specular streak, dark rim."""
    lam = np.sqrt(np.clip(1 - n * n, 0, 1))
    key = np.clip(.62 * lam + .38 * np.clip(-n * .9 + .2, 0, 1), 0, 1)
    sp = np.exp(-((n + .38) / .13) ** 2) * spec + np.exp(-((n - .55) / .18) ** 2) * .18 * spec
    edge = np.clip(np.abs(n) - .78, 0, 1) / .22
    col = np.asarray(base, np.float32)[None, None, :] * (.38 + .82 * key[..., None])
    col = col + sp[..., None] * np.array([1.0, .96, .86])[None, None, :] * .55
    col = col * (1 - rim * edge[..., None])
    return np.clip(col, 0, 1)


BELT_Y0, BELT_Y1 = .60, .86


def belt(img, x, y, loaded):
    band = (y >= BELT_Y0) & (y <= BELT_Y1)
    t = (y - BELT_Y0) / (BELT_Y1 - BELT_Y0)
    # canvas webbing: olive drab with fine twill weave and slight mottling
    weave = .5 + .5 * np.sin((x * W * .9 + y * H * .9) * .9) * np.sin((x * W - y * H * .6) * .7)
    mott = noise(7, 6, 10) * .5 + noise(11, 13, 23) * .5
    base = np.array([.54, .50, .33])
    shade = .78 + .16 * np.sin(np.pi * t) + .06 * (weave - .5) + .1 * (mott - .5)
    if loaded:   # webbing stretched over the round: lighter crown, falls off to the seams
        bulge = np.exp(-((x - .5) / .34) ** 2)
        pinch = np.clip(np.minimum(x, 1 - x) / .14, 0, 1) ** .6     # webbing cinched between rounds
        shade = shade * (.62 + .44 * bulge) * (.7 + .3 * pinch)
    else:        # empty loop puckers: crease down the middle, slack folds
        crease = np.exp(-((x - .5) / .07) ** 2)
        shade = shade * (.86 - .32 * crease + .1 * np.exp(-((x - .3) / .1) ** 2))
    col = base[None, None, :] * shade[..., None]
    img = over(img, col, band.astype(np.float32))
    # stitch rows along both belt edges, and pocket seams on the tile edges
    for yy in (BELT_Y0 + .035, BELT_Y1 - .035):
        dash = (np.sin(x * np.pi * 2 * 3) > -.2)
        img = over(img, [.20, .19, .12], ((np.abs(y - yy) < .006) & dash).astype(np.float32) * .85)
    seam = (np.minimum(x, 1 - x) < .04) & band
    img = over(img, [.16, .15, .10], seam.astype(np.float32) * .9)
    # rolled edges: highlight top lip, dark lower lip
    img = over(img, [.70, .66, .48], (np.abs(y - BELT_Y0) < .008).astype(np.float32) * .7)
    img = over(img, [.08, .07, .05], (np.abs(y - BELT_Y1) < .01).astype(np.float32) * .9)
    return img


def round_(img, x, y):
    brass = [.86, .66, .30]
    cupro = [.74, .72, .68]           # cupronickel jacket of the S-Patrone
    # casing body (tapers slightly), shoulder, neck
    body_top, body_bot = .44, .965
    w_body = .40 - .025 * (y - body_top) / (body_bot - body_top)
    m, n = cyl(x, .5 - w_body, .5 + w_body)
    sel = m & (y >= body_top) & (y <= body_bot)
    img = over(img, metal(n, brass), sel.astype(np.float32))
    # shoulder (bottleneck) .38 -> .44
    s = np.clip((y - .385) / .055, 0, 1)
    w_sh = .25 + (.40 - .25) * s
    m, n = cyl(x, .5 - w_sh, .5 + w_sh)
    sel = m & (y >= .385) & (y < body_top)
    img = over(img, metal(n, [.84, .63, .28]) * (.9 + .1 * s[..., None]), sel.astype(np.float32))
    # neck
    m, n = cyl(x, .25, .75)
    sel = m & (y >= .33) & (y < .385)
    img = over(img, metal(n, [.82, .61, .27]), sel.astype(np.float32))
    # bullet ogive: radius follows a tangent ogive to a sharp spitzer point
    tip, base_y = .06, .335
    u = np.clip((y - tip) / (base_y - tip), 0, 1)
    w_b = .245 * np.sqrt(np.clip(1 - (1 - u) ** 2, 0, 1)) ** .9
    m, n = cyl(x, .5 - np.maximum(w_b, 1e-4), .5 + np.maximum(w_b, 1e-4))
    sel = m & (y >= tip) & (y <= base_y + .002)
    img = over(img, metal(n, cupro, spec=1.25), sel.astype(np.float32))
    # crimp line at the case mouth
    img = over(img, [.32, .22, .09], ((np.abs(y - .337) < .005) & (np.abs(x - .5) < .245)).astype(np.float32) * .8)
    # extractor groove and rim at the base
    img = over(img, [.30, .21, .08], ((np.abs(y - .925) < .008) & (np.abs(x - .5) < .38)).astype(np.float32) * .85)
    # soft contact shadow of the round on the belt behind it
    return img


def tile(loaded):
    x, y = grid()
    img = np.zeros((H, W, 4), np.float32)
    if loaded:
        img = round_(img, x, y)
    img = belt(img, x, y, loaded)
    if loaded:   # the round shows through the webbing pocket a touch at the lips (depth cue)
        lip = (np.abs(y - BELT_Y0) < .02) & (np.abs(x - .5) < .36)
        img = over(img, [.05, .04, .02], lip.astype(np.float32) * .35)
    out = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA')
    return out.resize((TW, TH), Image.LANCZOS)


def main():
    a, b = tile(True), tile(False)
    if len(sys.argv) > 1:
        os.makedirs(sys.argv[1], exist_ok=True)
        strip = Image.new('RGBA', (TW * 24, TH), (20, 19, 17, 255))
        for i in range(24):
            t = a if i < 14 else b
            strip.alpha_composite(t, (i * TW, 0))
        strip.resize((strip.width * 3, strip.height * 3), Image.NEAREST).save(os.path.join(sys.argv[1], 'belt-preview.png'))
        print('preview')
        return
    a.save(os.path.join(ROOT, 'hud-belt-round.png'), optimize=True)
    b.save(os.path.join(ROOT, 'hud-belt-empty.png'), optimize=True)
    print('hud-belt-round.png / hud-belt-empty.png', a.size)


if __name__ == '__main__':
    main()
