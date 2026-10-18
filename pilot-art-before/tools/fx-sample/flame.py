"""Looping flame-tongue flipbook for burning ground (hydrogen balloon fire, wreck fires).

    python3 tools/fx-sample/flame.py            -> fx-sample/fx-flame.webp + fx-flame.json
    python3 tools/fx-sample/flame.py <dir>      -> <dir>/flame-strip.png (preview)

Three flame variants x 12 frames. Each frame is an upright tongue of fire: white-yellow
at the root, orange body, deep-red ragged tips, with turbulence that scrolls upward by
exactly one noise period over the loop so frame 11 -> 0 is seamless. The runtime scatters
several of these over a fire zone at different sizes and phases.
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as blur

sys.path.insert(0, os.path.dirname(__file__))
from boom import ramp  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
W, H, N, SS = 64, 96, 12, 4
VARIANTS = 3


def tile_noise(w, h, seed, cells, octaves=4):
    """Periodic value noise (wraps in both axes) so an integer scroll loops cleanly."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
    for o in range(octaves):
        cx, cy = cells[0] * 2 ** o, cells[1] * 2 ** o
        g = rng.random((cy, cx)).astype(np.float32)
        yy = np.arange(h) / h * cy; xx = np.arange(w) / w * cx
        y0 = np.floor(yy).astype(int); x0 = np.floor(xx).astype(int)
        fy = (yy - y0)[:, None]; fx = (xx - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        a = g[y0 % cy][:, x0 % cx]; b = g[y0 % cy][:, (x0 + 1) % cx]
        c = g[(y0 + 1) % cy][:, x0 % cx]; d = g[(y0 + 1) % cy][:, (x0 + 1) % cx]
        out += amp * ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy)
        tot += amp; amp *= .5
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def frames(variant):
    w, h = W * SS, H * SS
    # classic "fire shader": a hot mask at the root minus upward-scrolling noise; what
    # survives the threshold is a set of licking tongues with ragged tips.
    n1 = tile_noise(w, h, 300 + variant, (4, 3))          # broad billows
    n2 = tile_noise(w, h, 310 + variant, (9, 5))          # tongue streaks (tall cells)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    base_y = h * .93; length = h * (.84 - .05 * variant); width = w * (.26 + .03 * variant)
    lean = (variant - 1) * .08
    out = []
    for fi in range(N):
        sh = int(round(fi / N * h))           # one full noise period over the loop
        a = np.roll(n1, -sh, axis=0); b = np.roll(n2, -(sh * 2) % h, axis=0)
        s = (base_y - yy) / length; sp = np.clip(s, 0, 1)
        warp = (a - .5) * width * .9 * sp
        dx = (xx - w / 2 - warp - lean * sp * width * 2) / (width * (1 - .55 * sp) + 1)
        mask = np.clip(1 - sp, 0, 1) ** .7 * np.exp(-dx * dx * 1.6) * np.clip((s + .03) / .14, 0, 1) ** 1.5
        field = mask * 1.7 - (b * 1.0 + a * .45) * (.25 + 1.15 * sp)
        I = np.clip(field * 2.2, 0, 1)
        T = np.clip(field * .62 + .3 * mask + .12, 0, .92) * np.clip(field * 6, 0, 1)
        col = ramp(T)
        alpha = np.clip(I * 1.6, 0, 1) * np.clip((T - .12) / .3, 0, 1)
        halo = np.clip(blur(I, 5 * SS) * .7, 0, .45)
        a_out = alpha + halo * (1 - alpha)
        col = (col * alpha[..., None] + np.array([1, .45, .12]) * halo[..., None] * (1 - alpha[..., None])) / np.maximum(a_out[..., None], 1e-4)
        rgba = np.dstack([np.clip(col, 0, 1) * 255, np.clip(a_out, 0, 1) * 255]).astype(np.uint8)
        out.append(Image.fromarray(rgba, 'RGBA').resize((W, H), Image.LANCZOS))
    return out


def main():
    if len(sys.argv) > 1:
        os.makedirs(sys.argv[1], exist_ok=True)
        strip = Image.new('RGBA', (W * N, H * VARIANTS))
        for v in range(VARIANTS):
            for i, im in enumerate(frames(v)):
                strip.paste(im, (i * W, v * H))
        strip.save(os.path.join(sys.argv[1], 'flame-strip.png')); print('ok')
        return
    atlas = Image.new('RGBA', (W * N, H * VARIANTS)); rects = {}
    for v in range(VARIANTS):
        for i, im in enumerate(frames(v)):
            atlas.paste(im, (i * W, v * H)); rects[f'flame{v}_{i}'] = [i * W, v * H, W, H]
    atlas.save(os.path.join(ROOT, 'fx-sample', 'fx-flame.webp'), quality=88, method=6)
    json.dump({'version': 3, 'image': 'fx-flame.webp', 'frames': N, 'variants': VARIANTS, 'rects': rects},
              open(os.path.join(ROOT, 'fx-sample', 'fx-flame.json'), 'w'), separators=(',', ':'))
    print('atlas', atlas.size)


if __name__ == '__main__':
    main()
