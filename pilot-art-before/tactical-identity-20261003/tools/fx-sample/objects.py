"""Ordnance and object sprites in the aircraft illustration style.

The aircraft art is clean top-down illustration: flat paint, soft cylinder
shading with light from the upper-left, a thin warm-dark outline, and a few
panel / band lines. No grime, no photo texture. Everything here follows that.
All bodies point RIGHT (+x); the game rotates them to the flight direction.
"""
import numpy as np
import cv2

from fxlib import Canvas, SS, hexrgb, smooth, noise, ramp, glow, smoke_balls

INK = '#1d1914'


def _mask_poly(cv, pts):
    m = np.zeros((cv.h, cv.w), np.uint8)
    cv2.fillPoly(m, [np.array([[x * SS, y * SS] for x, y in pts], np.int32)], 255, lineType=cv2.LINE_AA)
    return m.astype(np.float32) / 255


def _outline(cv, mask, width=1.1, color=INK, alpha=0.95):
    k = max(1, int(round(width * SS)))
    dil = cv2.dilate((mask > 0.5).astype(np.uint8), np.ones((2 * k + 1, 2 * k + 1), np.uint8)).astype(np.float32)
    dil = cv2.GaussianBlur(dil, (0, 0), 0.6 * SS)
    ring = np.clip(dil - mask, 0, 1)
    cv.over(np.broadcast_to(hexrgb(color), cv.rgb.shape).copy(), ring * alpha)


def body(cv, x0, x1, cy, halfw, base, bands=(), spec=0.35, outline=True, ribs=(), shade_k=1.0):
    """Cylinder seen from above. halfw(t) gives the half width for t in 0..1 along x0→x1.
    bands: [(t0, t1, '#color')] painted rings; ribs: [t] thin dark seam lines."""
    X, Y = cv.X / SS, cv.Y / SS
    t = (X - x0) / (x1 - x0)
    tt = np.clip(t, 0, 1)
    hw = np.maximum(halfw(tt), 1e-3)
    v = (Y - cy) / hw
    inside = (t >= 0) & (t <= 1)
    mask = smooth(1.0, 0.9, np.abs(v)) * inside * smooth(-0.004, 0.004, t) * smooth(1.004, 0.996, t)
    col = np.broadcast_to(hexrgb(base), cv.rgb.shape).copy()
    for a, b, c in bands:
        sel = ((tt >= a) & (tt <= b))[..., None]
        col = np.where(sel, hexrgb(c), col)
    nz = np.sqrt(np.clip(1 - v * v, 0, 1))
    lam = np.clip(0.62 * nz - 0.42 * v + 0.18, 0, 1.2)
    lam = np.round(lam * 5) / 5 * 0.5 + lam * 0.5  # painterly steps
    col = col * (0.5 + 0.62 * lam[..., None] * shade_k + (1 - shade_k) * 0.3)
    hi = np.exp(-((v + 0.48) / 0.16) ** 2) * spec
    col = col + (1 - col) * hi[..., None]
    for r in ribs:
        d = np.abs(tt - r) * (x1 - x0)
        col = col * (1 - 0.35 * np.exp(-(d / 0.55) ** 2))[..., None]
    if outline:
        _outline(cv, mask)
    cv.over(np.clip(col, 0, 1), mask)
    return mask


def flat(cv, pts, base, outline=True, shade_dir=(-0.5, -0.7)):
    m = _mask_poly(cv, pts)
    b = cv2.GaussianBlur(m, (0, 0), 2.0 * SS)
    gy, gx = np.gradient(b)
    lit = np.clip((gx * shade_dir[0] + gy * shade_dir[1]) * 60, -0.3, 0.3)
    col = hexrgb(base) * (0.9 + lit[..., None])
    if outline:
        _outline(cv, m, 1.0)
    cv.over(np.clip(col, 0, 1), m)
    return m


def cone(t, r0, r1, nose=0.25, tail=0.08):
    """Half-width profile: blunt tail, straight body, ogive nose."""
    w = np.full_like(t, r0)
    tn = np.clip((t - (1 - nose)) / nose, 0, 1)
    w = np.where(t > 1 - nose, r0 * np.sqrt(np.clip(1 - tn ** 1.6, 0, 1)) + r1 * 0, w)
    tl = np.clip(t / max(tail, 1e-3), 0, 1)
    w = np.where(t < tail, r0 * (0.72 + 0.28 * tl), w)
    return w


# ------------------------------------------------------------------ sprites

def rocket_le_prieur():
    """Le Prieur rocket: slim card tube, pointed cone, brass bands, long guide stick behind."""
    cv = Canvas(160, 40)
    cy = 20
    flat(cv, [(4, cy - 1.3), (70, cy - 1.3), (70, cy + 1.3), (4, cy + 1.3)], '#8a6a42')  # stick
    body(cv, 62, 150, cy, lambda t: cone(t, 6.2, 0, nose=0.3, tail=0.05), '#d9ccb0',
         bands=[(0.0, 0.07, '#b08a4a'), (0.34, 0.39, '#b08a4a'), (0.62, 0.66, '#9b3a2a')], ribs=[0.2, 0.5])
    return cv


def rocket_heavy():
    cv = Canvas(164, 56)
    cy = 28
    for s in (-1, 1):
        flat(cv, [(18, cy + s * 7), (40, cy + s * 7), (30, cy + s * 20), (14, cy + s * 20)], '#55604a')
    body(cv, 12, 156, cy, lambda t: cone(t, 10, 0, nose=0.24, tail=0.05), '#6b7657',
         bands=[(0.0, 0.05, '#3e4535'), (0.62, 0.66, '#b08a4a'), (0.76, 1.0, '#c9c5b9')], ribs=[0.3, 0.46])
    return cv


def bomb_body():
    """WWI aerial bomb: teardrop olive body, nose fuse, cruciform tail fins with a ring."""
    cv = Canvas(128, 56)
    cy = 28
    for s in (-1, 1):
        flat(cv, [(8, cy + s * 3), (34, cy + s * 3), (26, cy + s * 18), (6, cy + s * 18)], '#5b6245')
    flat(cv, [(6, cy - 18), (10, cy - 18), (10, cy + 18), (6, cy + 18)], '#4a5038')  # ring seen edge-on
    prof = lambda t: np.where(t < 0.35, 5 + 13 * np.sin(np.clip(t / 0.35, 0, 1) * np.pi / 2), 18 * np.sqrt(np.clip(1 - np.clip((t - 0.35) / 0.65, 0, None) ** 2.2, 0, 1)))
    body(cv, 22, 122, cy, prof, '#6c7350', bands=[(0.55, 0.6, '#b08a4a')], ribs=[0.35, 0.8])
    body(cv, 118, 126, cy, lambda t: 2.8 + 0 * t, '#b08a4a', spec=0.5)
    return cv


def shell_body(kind):
    """Artillery / cannon shell: steel body, copper driving band, brass or painted ogive."""
    spec = {'heavy': (256, 64, 26, '#6f7a80', '#c48a3a', '#b79a58'),
            'auto': (96, 36, 11, '#8e979b', '#b0663a', '#b79a58'),
            'mortar': (128, 60, 22, '#586047', '#b0663a', '#9aa0a2'),
            'incendiary': (128, 44, 15, '#5d6368', '#b0663a', '#c9542e')}[kind]
    W, H, r, base, band, nose = spec
    cv = Canvas(W, H)
    cy = H / 2
    if kind == 'mortar':
        for s in (-1, 1):
            flat(cv, [(6, cy + s * 4), (36, cy + s * 4), (30, cy + s * 26), (4, cy + s * 26)], '#4a5038')
        prof = lambda t: np.where(t < 0.3, r * (0.45 + 0.55 * np.clip(t / 0.3, 0, 1)), r * np.sqrt(np.clip(1 - np.clip((t - 0.3) / 0.7, 0, None) ** 2.4, 0, 1)))
        body(cv, 14, W - 6, cy, prof, base, bands=[(0.46, 0.5, band), (0.84, 1.0, nose)])
        return cv
    body(cv, 6, W - 6, cy, lambda t: cone(t, r, 0, nose=0.3, tail=0.03), base,
         bands=[(0.14, 0.2, band), (0.72, 1.0, nose)], ribs=[0.05])
    return cv


def grenade_body():
    """Top-down Mills-style grenade: ribbed oval with fuse lever."""
    cv = Canvas(64, 64)
    body(cv, 12, 54, 32, lambda t: 15 * np.sqrt(np.clip(1 - (2 * t - 1) ** 2, 0, 1)), '#6a7050', ribs=[0.25, 0.42, 0.58, 0.75])
    X, Y = cv.X / SS, cv.Y / SS
    for y in (26, 32, 38):
        cv.rgb *= (1 - 0.25 * np.exp(-((Y - y) / 0.6) ** 2) * (np.abs(X - 33) < 19))[..., None]
    flat(cv, [(46, 30), (60, 26), (61, 29), (48, 34)], '#8b8f8a')
    return cv


def mine_body():
    """Sea mine from above: round steel shell, five Hertz horns, lifting eye."""
    cv = Canvas(128, 128)
    c = 64
    for i in range(5):
        a = -np.pi / 2 + i * 2 * np.pi / 5 + 0.3
        x0, y0 = c + np.cos(a) * 38, c + np.sin(a) * 38
        pts = [(c + np.cos(a) * 30 - np.sin(a) * 5, c + np.sin(a) * 30 + np.cos(a) * 5),
               (x0 + np.cos(a) * 12 - np.sin(a) * 4, y0 + np.sin(a) * 12 + np.cos(a) * 4),
               (x0 + np.cos(a) * 12 + np.sin(a) * 4, y0 + np.sin(a) * 12 - np.cos(a) * 4),
               (c + np.cos(a) * 30 + np.sin(a) * 5, c + np.sin(a) * 30 - np.cos(a) * 5)]
        flat(cv, pts, '#4c5358')
        glow(cv, x0 + np.cos(a) * 12, y0 + np.sin(a) * 12, 5, '#b08a4a', 1.0, 0.5)
    X, Y = cv.X / SS - c, cv.Y / SS - c
    d = np.sqrt(X * X + Y * Y) / 36
    m = smooth(1.0, 0.96, d)
    nz = np.sqrt(np.clip(1 - d * d, 0, 1))
    lam = np.clip(0.62 * nz - 0.42 * (X * 0.6 + Y * 0.8) / 36 + 0.18, 0, 1.2)
    lam = np.round(lam * 5) / 5 * 0.5 + lam * 0.5
    col = hexrgb('#5a6268') * (0.5 + 0.62 * lam[..., None])
    hi = np.exp(-(((X + 12) ** 2 + (Y + 14) ** 2) / 60)) * 0.35
    col = col + (1 - col) * hi[..., None]
    col *= (1 - 0.3 * np.exp(-((np.sqrt(X * X + Y * Y) - 24) / 0.7) ** 2))[..., None]
    _outline(cv, m)
    cv.over(np.clip(col, 0, 1), m)
    glow(cv, c, c - 2, 4.5, '#8b9297', 1.0, 0.4)
    return cv


def torpedo_body():
    cv = Canvas(256, 48)
    cy = 24
    for s in (-1, 1):
        flat(cv, [(6, cy + s * 2), (22, cy + s * 2), (20, cy + s * 12), (4, cy + s * 12)], '#5a6166')
    body(cv, 10, 250, cy, lambda t: cone(t, 10, 0, nose=0.12, tail=0.1), '#7a8388',
         bands=[(0.86, 1.0, '#b08a4a')], ribs=[0.3, 0.55, 0.8])
    return cv


def searchlight_beam():
    """Searchlight cone from the lamp (left) outward: soft cream beam, brighter core line."""
    cv = Canvas(256, 108)
    X, Y = cv.X / SS, cv.Y / SS - 54
    t = np.clip(X / 256, 0, 1)
    half = 3 + t * 46
    across = np.abs(Y) / half
    n = noise(cv.h, cv.w, 20 * SS, 601, 3)
    a = smooth(1.0, 0.35, across) * (1 - t) ** 0.9 * smooth(0, 10, X) * (0.8 + 0.2 * n)
    col = ramp(np.clip(1 - across * 0.8 - t * 0.3, 0, 1), [(0, '#d9cfb4'), (1, '#fff6de')])
    cv.over(col, a * 0.78)
    core = np.exp(-(Y / (1.5 + t * 6)) ** 2) * (1 - t) ** 1.4 * smooth(0, 8, X)
    cv.over(np.broadcast_to(hexrgb('#fffaf0'), cv.rgb.shape).copy(), core * 0.35)
    glow(cv, 6, 54, 8, '#fff6de', 0.8, 1.5)
    return cv


def sunshaft():
    cv = Canvas(512, 150)
    X, Y = cv.X / SS, cv.Y / SS - 75
    t = np.clip(X / 512, 0, 1)
    half = 10 + t * 60
    n = noise(cv.h, cv.w, 30 * SS, 611, 3)
    a = smooth(1.0, 0.2, np.abs(Y) / half) * (1 - t) ** 1.2 * (0.75 + 0.25 * n)
    cv.over(np.broadcast_to(hexrgb('#f6dfa8'), cv.rgb.shape).copy(), a * 0.45)
    return cv


def wind_streak():
    cv = Canvas(256, 96)
    X, Y = cv.X / SS, cv.Y / SS
    a = np.zeros_like(X)
    rng = np.random.default_rng(621)
    for i in range(6):
        y0, x0, L = rng.uniform(20, 76), rng.uniform(10, 90), rng.uniform(90, 150)
        t = np.clip((X - x0) / L, 0, 1)
        a = np.maximum(a, np.exp(-((Y - y0 - np.sin(t * 3) * 2) / (1.2 + t * 1.5)) ** 2) * np.sin(t * np.pi) * ((X > x0) & (X < x0 + L)))
    cv.over(np.broadcast_to(hexrgb('#f2efe6'), cv.rgb.shape).copy(), a * 0.55)
    return cv


# ------------------------------------------------------------------ clouds
# Same painted-billow language as the smoke, lit warm from the upper-left like the
# key art; shade is a cool blue-grey so clouds sit above the ground, not on it.
CLOUD_LIT, CLOUD_SHADE = '#ece2cc', '#8c9097'


def _ellipse_balls(W, H, seed, n_core, n_edge, rcore, redge, fill=0.8):
    r = np.random.default_rng(seed)
    cx, cy, ax, ay = W / 2, H / 2, W / 2 * fill, H / 2 * fill
    out = []
    for i in range(n_core):
        a, d = r.uniform(0, 2 * np.pi), np.sqrt(r.uniform(0, 1)) * 0.55
        out.append((cx + np.cos(a) * ax * d, cy + np.sin(a) * ay * d, r.uniform(*rcore)))
    for i in range(n_edge):
        a, d = r.uniform(0, 2 * np.pi), r.uniform(0.6, 0.95)
        out.append((cx + np.cos(a) * ax * d, cy + np.sin(a) * ay * d, r.uniform(*redge)))
    return out


def _cloud(W, H, seed, n_core, n_edge, rcore, redge, lit=CLOUD_LIT, shade=CLOUD_SHADE, alpha=0.88, fray=0.3, levels=4):
    cv = Canvas(W, H)
    smoke_balls(cv, _ellipse_balls(W, H, seed, n_core, n_edge, rcore, redge), lit, shade, seed, alpha, fray=fray,
                levels=levels, kids=4, texture=0.05)
    X, Y = cv.X / SS - W / 2, cv.Y / SS - H / 2
    d = np.sqrt((X / (W / 2)) ** 2 + (Y / (H / 2)) ** 2)
    cv.a *= 1 - 0.35 * smooth(0.55, 1.0, d)   # thinner rim: clouds melt into the sky
    return cv


def cloud_cumulus(i):
    return _cloud(448, 260, 700 + i, 14, 26, (48, 78), (20, 36))


def cloud_bank(i):
    return _cloud(640, 168, 710 + i, 16, 30, (34, 56), (16, 30))


def cloud_wispy(i):
    return _cloud(512, 192, 720 + i, 8, 34, (14, 24), (7, 14), alpha=0.6, fray=0.6, levels=3)


def cloud_dark(i):
    return _cloud(512, 292, 730 + i, 16, 28, (54, 86), (22, 40), lit='#b8b0a6', shade='#4c4a4d')


def searchlight_base():
    """Searchlight emplacement from above: ring of sandbags around a dark platform (lamp drawn separately)."""
    cv = Canvas(128, 128)
    c = 64
    X, Y = cv.X / SS - c, cv.Y / SS - c
    d = np.sqrt(X * X + Y * Y)
    m = smooth(34, 32, d)
    cv.over(np.broadcast_to(hexrgb('#3b3a33'), cv.rgb.shape).copy(), m)
    cv.rgb *= (1 - 0.25 * np.exp(-((d - 20) / 1.2) ** 2))[..., None]
    rng = np.random.default_rng(641)
    n = 14
    for i in range(n):
        a = i * 2 * np.pi / n + rng.uniform(-0.05, 0.05)
        cx, cy = c + np.cos(a) * 44, c + np.sin(a) * 44
        body(cv, cx - 11, cx + 11, cy, lambda t: 7.5 * np.sqrt(np.clip(1 - (2 * t - 1) ** 6, 0, 1)), '#b8a47c', spec=0.15)
        # rotate each bag tangentially: cheap trick — redraw is axis aligned, acceptable at game size
    return cv


def searchlight_lamp():
    """Lamp drum from above, pointing RIGHT: dark drum, brass rim, pale lens."""
    cv = Canvas(64, 64)
    cy = 32
    flat(cv, [(12, cy - 4), (24, cy - 4), (24, cy + 4), (12, cy + 4)], '#4d4a44')
    body(cv, 18, 50, cy, lambda t: 13 + 0 * t, '#565a5a', bands=[(0.86, 1.0, '#b08a4a')], ribs=[0.4])
    X, Y = cv.X / SS, cv.Y / SS
    lens = smooth(1.0, 0.8, np.sqrt(((X - 51) / 3) ** 2 + ((Y - cy) / 11.5) ** 2))
    cv.over(np.broadcast_to(hexrgb('#fff4d6'), cv.rgb.shape).copy(), lens)
    return cv
