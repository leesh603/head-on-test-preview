"""Volumetric top-down explosion flipbooks for the FX layer.

    python3 tools/fx-sample/boom.py <out_dir> [family ...]

Each family is rendered as N frames (default 24) of a particle fireball:
hundreds of soft, noise-broken puffs expand with drag, cool from white-hot
to deep red, and hand over to lit, billowing smoke. Sparks, debris and a
ground dust ring are layered per family. Output: one RGBA strip per family.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter as blur

S = 256          # cell size
N = 20           # frames per sequence
SS = 2           # supersampling for the field


def fbm(size, seed, octaves=5):
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = 4 * 2 ** o
        g = rng.random((n + 1, n + 1)).astype(np.float32)
        g[-1, :] = g[0, :]; g[:, -1] = g[:, 0]
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
        out += amp * (np.asarray(im, np.float32) / 255)
        tot += amp; amp *= .5
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


RAMP = np.array([  # temperature → emission colour
    [0.00, 40, 14, 8], [0.22, 96, 30, 12], [0.38, 170, 56, 18], [0.52, 232, 104, 32],
    [0.66, 252, 160, 62], [0.80, 255, 212, 128], [0.92, 255, 240, 196], [1.00, 255, 252, 240]], np.float32)


def ramp(t):
    t = np.clip(t, 0, 1)
    r = np.interp(t, RAMP[:, 0], RAMP[:, 1]); g = np.interp(t, RAMP[:, 0], RAMP[:, 2]); b = np.interp(t, RAMP[:, 0], RAMP[:, 3])
    return np.stack([r, g, b], -1) / 255


FAMILIES = {
    # mid-air aircraft kill: tight fireball, black-oil smoke, burning fragments
    'air': dict(puffs=170, reach=.34, core=.35, fire_tau=.28, smoke=(86, 80, 74), smoke_life=.95, sparks=26, debris=9, burning_debris=True, dust=False, flash=1.0, spin=.6),
    # bomb / mortar on the ground: wide, dirty, dust ring and clods
    'ground': dict(puffs=210, reach=.40, core=.30, fire_tau=.22, smoke=(138, 120, 98), smoke_life=1.0, sparks=18, debris=16, burning_debris=False, dust=True, flash=.95, spin=.3),
    # heavy bomber / boss / structure: long, oily, secondary pops
    'heavy': dict(puffs=260, reach=.42, core=.38, fire_tau=.34, smoke=(70, 64, 58), smoke_life=1.0, sparks=34, debris=14, burning_debris=True, dust=False, flash=1.0, spin=.5, secondary=3),
    # cannon / rocket hit: small, sharp, quick
    'hit': dict(puffs=100, reach=.28, core=.42, fire_tau=.20, smoke=(104, 98, 90), smoke_life=.85, sparks=22, debris=5, burning_debris=False, dust=False, flash=1.0, spin=.4),
}


def render(fam, seed=11, n=N):
    P = FAMILIES[fam]
    rng = np.random.default_rng(seed)
    F = S * SS
    noise = [fbm(F, seed * 7 + k) for k in range(3)]
    fine = fbm(F, seed * 7 + 9, octaves=4) * .5 + fbm(F // 2, seed * 7 + 10, octaves=3).repeat(2, 0).repeat(2, 1) * .5  # soot / billow detail
    yy, xx = np.mgrid[0:F, 0:F].astype(np.float32)
    cx = cy = F / 2
    # particle set
    k = P['puffs']
    ang = rng.random(k) * 2 * math.pi
    spd = np.clip(rng.lognormal(0, .45, k), .15, 2.4)
    core = rng.random(k) < P['core']
    spd[core] *= .35
    reach = P['reach'] * F * spd / spd.max() * 1.05
    r0 = F * (.025 + rng.random(k) * .025)
    grow = F * .042 * np.clip(rng.lognormal(0, .42, k), .45, 2.3) * (1 + (~core) * .35)
    temp0 = np.where(core, 1.0, .82 + rng.random(k) * .18)
    tau_t = P['fire_tau'] * (np.where(core, 1.15, .85) + rng.random(k) * .45)
    delay = rng.random(k) * .08
    hbase = rng.random(k) * .5 + np.where(core, .4, 0)
    nid = rng.integers(0, 3, k); off = rng.random((k, 2)) * F
    sec = []
    for s in range(P.get('secondary', 0)):  # secondary pops for heavy blasts
        a = rng.random() * 6.28; d = F * (.12 + rng.random() * .1)
        sec.append((cx + math.cos(a) * d, cy + math.sin(a) * d, .18 + s * .14 + rng.random() * .06))
    sparks = [(rng.random() * 6.28, .5 + rng.random() * .8, rng.random() * .06) for _ in range(P['sparks'])]
    debris = [(rng.random() * 6.28, .45 + rng.random() * .7, rng.random() * 6.28, 3 + rng.random() * 5) for _ in range(P['debris'])]
    frames = []
    L = np.array([-.55, -.62, .56]); L /= np.linalg.norm(L)
    smoke_alb = np.array(P['smoke'], np.float32) / 255
    for fi in range(n):
        t = fi / (n - 1)
        D = np.zeros((F, F), np.float32); E = np.zeros((F, F), np.float32); Hm = np.zeros((F, F), np.float32)
        te = np.clip(t - delay, 0, None)
        travel = 1 - np.exp(-te / .12)
        px = cx + np.cos(ang) * reach * travel
        py = cy + np.sin(ang) * reach * travel
        # smoke drifts and slowly spins about the centre as it rises toward camera
        sw = P['spin'] * te * .6
        px, py = cx + (px - cx) * np.cos(sw) - (py - cy) * np.sin(sw), cy + (px - cx) * np.sin(sw) + (py - cy) * np.cos(sw)
        rad = r0 + grow * np.power(te + 1e-4, .55) * 2.2
        temp = temp0 * np.exp(-te / tau_t)
        fade = np.clip(1 - (t - P['smoke_life'] * .72) / (P['smoke_life'] * .3), 0, 1)
        wgt = np.where(te > 0, 1.0, 0.0) * fade
        te_h = t * .6
        extra = []
        for (sx, sy, st) in sec:
            if t >= st:
                tt = t - st
                for j in range(14):
                    a = j * 2.4 + st * 9
                    extra.append((sx + math.cos(a) * F * .05 * (1 - math.exp(-tt / .06)), sy + math.sin(a) * F * .05 * (1 - math.exp(-tt / .06)),
                                  F * (.03 + .09 * tt ** .55), math.exp(-tt / .12), 1.0))
        items = [(px[i], py[i], rad[i], temp[i], wgt[i], nid[i], off[i], hbase[i]) for i in range(k)] + [(a, b, c, d, e, 0, (0, 0), .8) for a, b, c, d, e in extra]
        for (x0, y0, r, T, w, ni, of, hb) in items:
            if w <= 0 or r <= 1:
                continue
            x1, x2 = int(max(0, x0 - r)), int(min(F, x0 + r + 1)); y1, y2 = int(max(0, y0 - r)), int(min(F, y0 + r + 1))
            if x2 <= x1 or y2 <= y1:
                continue
            dx = (xx[y1:y2, x1:x2] - x0) / r; dy = (yy[y1:y2, x1:x2] - y0) / r
            d2 = dx * dx + dy * dy
            m = np.clip(1 - d2, 0, 1) ** 1.6
            nz = noise[ni][(np.arange(y1, y2)[:, None] + int(of[1])) % F, (np.arange(x1, x2)[None, :] + int(of[0])) % F]
            m = m * np.clip((nz - .32) / .38, 0, 1) ** 1.3 * w
            D[y1:y2, x1:x2] += m
            E[y1:y2, x1:x2] += m * T
            zc = (hb + te_h) * F * .25 + r * np.sqrt(np.clip(1 - d2, 0, 1)) * (.55 + .45 * nz)
            zc = np.where(m > .02, zc, 0)
            Hm[y1:y2, x1:x2] = np.maximum(Hm[y1:y2, x1:x2], zc)
        Tf = E / (D + 1e-4)
        emis_w = np.clip((Tf - .3) / .3, 0, 1)
        Ds = blur(D, 1.6 * SS)
        alpha = 1 - np.exp(-Ds * (1.75 + 1.9 * emis_w))
        alpha *= np.clip(.45 + .55 * (Ds / (Ds + .25)) * (.75 + .5 * fine), 0, 1)  # wispy, noise-eroded edges
        alpha *= np.clip(1.15 - t * .55, 0, 1)
        # lighting from the density gradient: billows read as volume
        gy, gx = np.gradient(blur(Hm, 2.6 * SS))
        nx, ny, nzv = -gx, -gy, np.full_like(gx, 1.0)
        nl = np.sqrt(nx * nx + ny * ny + nzv * nzv)
        shade = np.clip((nx * L[0] + ny * L[1] + nzv * L[2]) / nl, 0, 1)
        det = fine[(yy.astype(int) - fi * 2) % F, (xx.astype(int) + fi) % F]
        shade = shade * (.72 + .56 * det)
        ao = np.clip(blur(D, 6 * SS) / 2.2, 0, 1)
        smoke = smoke_alb[None, None, :] * (.40 + 1.2 * shade[..., None] ** 1.25) * (1 - .32 * ao[..., None])
        tb = noise[2][(yy.astype(int) + fi * 7) % F, (xx.astype(int) + fi * 5) % F]
        thick = np.clip((Ds - .6) / 2.4, 0, 1)
        Tv = Tf * (.40 + .55 * tb + .34 * (det - .5) + .55 * thick)
        soot = np.clip((det - (.62 - .35 * t)) / .16, 0, 1) * np.clip((Tf - .2) / .3, 0, 1) * min(1, .35 + t * 2.2)
        emis = ramp(Tv)
        e = np.clip((Tv - .34) / .3, 0, 1)[..., None]
        # fire light bleeding into the surrounding smoke
        heat = blur(np.clip(D * np.clip(Tf - .3, 0, 1), 0, 3), 8 * SS)
        smoke = smoke + np.array([1.0, .42, .12]) * np.clip(heat, 0, 1)[..., None] * .5
        fire = emis * (.42 + .85 * shade[..., None]) * (1.0 + .35 * e)
        fire = fire * (1 - .72 * soot[..., None]) + np.array([.16, .08, .05]) * .72 * soot[..., None]
        col = smoke * (1 - e) + fire * e
        a = alpha
        # early flash + glow halo
        if P['flash'] and t < .22:
            fl = (1 - t / .22) ** 2 * P['flash']
            rr = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (F * (.10 + t * .9))
            g = np.exp(-rr * rr * 2.2) * fl
            col = col * (1 - g[..., None]) + np.array([1, .96, .86]) * g[..., None]
            a = np.maximum(a, np.clip(g * 1.7, 0, 1))
        glow = blur(np.clip(D * np.clip(Tf - .55, 0, 1), 0, 2), 14 * SS)
        ga = np.clip(glow * 1.2, 0, .5)
        a_out = a + ga * (1 - a)
        edge = np.clip((F * .49 - np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)) / (F * .1), 0, 1) ** 1.5
        a_out = a_out * edge; a = a * edge
        col = (col * a[..., None] + np.array([1, .55, .2]) * ga[..., None] * (1 - a[..., None])) / np.maximum(a_out[..., None], 1e-4)
        rgba = np.dstack([np.clip(col, 0, 1) * 255, np.clip(a_out, 0, 1) * 255]).astype(np.uint8)
        im = Image.fromarray(rgba, 'RGBA')
        dr = ImageDraw.Draw(im, 'RGBA')
        # dust ring for ground blasts
        if False:
            q = (t - .04) / .56; R = F * (.18 + .34 * (1 - (1 - q) ** 2)); wdt = int(F * .03 * (1 - q) + 2)
            dr.ellipse((cx - R, cy - R, cx + R, cy + R), outline=(150, 128, 100, int(120 * (1 - q))), width=wdt)
        # sparks: thin hot streaks
        for (a0, sp, dl) in sparks:
            tt = t - dl
            if tt <= 0 or tt > .45:
                continue
            q = tt / .45; r1 = F * (.08 + .5 * sp * (1 - (1 - q) ** 2)); r2 = r1 - F * .05 * (1 - q)
            c = (255, int(230 - 90 * q), int(170 - 140 * q), int(255 * (1 - q)))
            dr.line((cx + math.cos(a0) * r2, cy + math.sin(a0) * r2, cx + math.cos(a0) * r1, cy + math.sin(a0) * r1), fill=c, width=max(1, int(SS * 1.2)))
        # debris: dark fragments with short trails; burning ones carry an ember
        for (a0, sp, rot, sz) in debris:
            if True:
                continue
            q = t / .8; r1 = F * (.05 + .55 * sp * (1 - (1 - q) ** 1.8)); r0t = F * (.05 + .55 * sp * (1 - (1 - max(0, q - .08)) ** 1.8))
            x, y = cx + math.cos(a0) * r1, cy + math.sin(a0) * r1; x0t, y0t = cx + math.cos(a0) * r0t, cy + math.sin(a0) * r0t
            s_ = max(1.2, sz * .3) * SS
            dr.ellipse((x - s_, y - s_, x + s_, y + s_), fill=(30, 24, 20, int(230 * (1 - q * .7))))
            if P['burning_debris'] and q < .7:
                dr.ellipse((x - s_ * .6, y - s_ * .6, x + s_ * .6, y + s_ * .6), fill=(255, 190, 90, int(230 * (1 - q / .7))))
        im = im.resize((S, S), Image.LANCZOS)
        frames.append(im)
    return frames


def build_atlas(root):
    """fx-sample/fx-boom.webp + fx-boom.json: 4 families x N frames, 10 columns."""
    import json
    fams = list(FAMILIES); cols = 10; rows = (len(fams) * N + cols - 1) // cols
    atlas = Image.new('RGBA', (cols * S, rows * S)); rects = {}
    for fi, fam in enumerate(fams):
        for i, im in enumerate(render(fam)):
            j = fi * N + i; x, y = (j % cols) * S, (j // cols) * S
            atlas.paste(im, (x, y)); rects[f'{fam}{i}'] = [x, y, S, S]
    atlas.save(os.path.join(root, 'fx-sample', 'fx-boom.webp'), quality=84, method=6)
    json.dump({'version': 2, 'image': 'fx-boom.webp', 'frames': N, 'families': fams, 'rects': rects},
              open(os.path.join(root, 'fx-sample', 'fx-boom.json'), 'w'), separators=(',', ':'))
    print('atlas', atlas.size)


def main():
    if sys.argv[1] == 'atlas':
        return build_atlas(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    out = sys.argv[1]; fams = sys.argv[2:] or list(FAMILIES)
    os.makedirs(out, exist_ok=True)
    for fam in fams:
        fr = render(fam)
        strip = Image.new('RGBA', (S * len(fr), S))
        for i, im in enumerate(fr):
            strip.paste(im, (i * S, 0))
        strip.save(os.path.join(out, f'boom-{fam}.png'))
        print(fam, 'ok')


if __name__ == '__main__':
    main()
