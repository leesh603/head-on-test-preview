"""HEAD-ON FX sample painter — shared helpers.

Everything is rendered procedurally at 2x and reduced, so the sheet can be
regenerated deterministically (fixed seeds) and tuned by hand.

Look: painted, warm sunlight from the upper-left (same as the aircraft
sprites), soft banded shading like the key art, no outlines, no photo noise.
Readability rules: hot cores are compact and bright, smoke is desaturated and
translucent so bullets stay visible through it.
"""
import numpy as np
import cv2

SS = 2  # supersample factor

LIGHT = np.array([-0.55, -0.68, 0.62], np.float32)
LIGHT /= np.linalg.norm(LIGHT)


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def ramp(t, stops):
    """t: HxW in [0,1]; stops: [(pos, '#rrggbb'), ...] -> HxWx3."""
    t = np.clip(t, 0, 1)
    pos = np.array([s[0] for s in stops], np.float32)
    cols = np.stack([hexrgb(s[1]) for s in stops])
    out = np.empty(t.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, pos, cols[:, c])
    return out


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0 + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def noise(h, w, cell, seed, octaves=4, persist=0.5):
    """Smooth fBm in [0,1]. cell = size of the coarsest feature in px."""
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = max(2.0, cell / (2 ** o))
        gh, gw = int(h / c) + 3, int(w / c) + 3
        g = r.random((gh, gw)).astype(np.float32)
        up = cv2.resize(g, (int(gw * c), int(gh * c)), interpolation=cv2.INTER_CUBIC)
        oy, ox = r.integers(0, max(1, up.shape[0] - h)), r.integers(0, max(1, up.shape[1] - w))
        out += amp * up[oy:oy + h, ox:ox + w]
        tot += amp
        amp *= persist
    out /= tot
    out = (out - out.min()) / (out.max() - out.min() + 1e-9)
    return out


def brush(h, w, seed, length=18, angle=None):
    """Directional streaky texture (painted strokes), mean 0, ~±1."""
    r = np.random.default_rng(seed)
    n = r.random((h, w)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 1.2)
    a = r.uniform(0, np.pi) if angle is None else angle
    k = np.zeros((length * 2 + 1, length * 2 + 1), np.float32)
    cx = length
    for i in range(-length, length + 1):
        x, y = int(round(cx + np.cos(a) * i)), int(round(cx + np.sin(a) * i))
        k[y, x] = 1
    k /= k.sum()
    n = cv2.filter2D(n, -1, k)
    n = (n - n.mean()) / (n.std() + 1e-9)
    return n


class Canvas:
    """Straight-alpha RGBA float canvas at supersampled resolution."""

    def __init__(self, w, h):
        self.w, self.h = w * SS, h * SS
        self.rgb = np.zeros((self.h, self.w, 3), np.float32)
        self.a = np.zeros((self.h, self.w), np.float32)
        self.Y, self.X = np.mgrid[0:self.h, 0:self.w].astype(np.float32)

    def over(self, rgb, a):
        """Composite a layer (straight alpha) over the canvas."""
        a = np.clip(a, 0, 1)
        out_a = a + self.a * (1 - a)
        num = rgb * a[..., None] + self.rgb * (self.a * (1 - a))[..., None]
        self.rgb = np.where(out_a[..., None] > 1e-5, num / np.maximum(out_a[..., None], 1e-5), rgb)
        self.a = out_a

    def add_light(self, rgb, a):
        """Emissive layer: brightens colour and raises alpha a little (glow)."""
        a = np.clip(a, 0, 1)
        self.rgb = self.rgb * (1 - a[..., None]) + rgb * a[..., None] if False else \
            np.clip(self.rgb + rgb * a[..., None] * (1 - self.a[..., None] * 0.35), 0, 1)
        self.a = np.clip(self.a + a * 0.9 * (1 - self.a), 0, 1)
        # where there was nothing, the glow colour is the colour
        empty = self.a < 1e-4
        self.rgb[empty] = rgb[empty] if rgb.ndim == 3 else rgb

    def image(self):
        """Downsample (premultiplied) -> 8-bit RGBA at 1x."""
        pm = self.rgb * self.a[..., None]
        w, h = self.w // SS, self.h // SS
        pm = cv2.resize(pm, (w, h), interpolation=cv2.INTER_AREA)
        a = cv2.resize(self.a, (w, h), interpolation=cv2.INTER_AREA)
        rgb = np.where(a[..., None] > 1e-4, pm / np.maximum(a[..., None], 1e-4), 0)
        # bleed colour into transparent pixels so bilinear sampling never shows dark fringes
        mask = (a > 0.02).astype(np.uint8)
        if mask.any():
            bl = cv2.dilate((rgb * 255).astype(np.uint8), np.ones((5, 5), np.uint8), iterations=3)
            rgb = np.where(mask[..., None] > 0, rgb, bl / 255.0)
        out = np.dstack([np.clip(rgb, 0, 1), np.clip(a, 0, 1)])
        return (out * 255 + 0.5).astype(np.uint8)


# ---------------------------------------------------------------- volumes

def billow_height(cv, spheres, warp=0.0, seed=0, k=10.0):
    """Cauliflower height field: soft union of sphere caps.
    spheres: [(cx, cy, r)] in 1x px."""
    X, Y = cv.X, cv.Y
    if warp:
        nx = noise(cv.h, cv.w, 60 * SS, seed + 11, 3) - 0.5
        ny = noise(cv.h, cv.w, 60 * SS, seed + 12, 3) - 0.5
        X = X + nx * warp * SS
        Y = Y + ny * warp * SS
    acc = np.zeros((cv.h, cv.w), np.float32)
    hmax = np.zeros_like(acc)
    rr = np.random.default_rng(seed + 99)
    kids = []
    for cx, cy, r in spheres:
        for j in range(4):
            a = rr.uniform(0, 2 * np.pi)
            kids.append((cx + np.cos(a) * r * 0.62, cy + np.sin(a) * r * 0.62, r * rr.uniform(0.34, 0.5)))
    spheres = list(spheres) + kids
    for cx, cy, r in spheres:
        cx, cy, r = cx * SS, cy * SS, r * SS
        d2 = (X - cx) ** 2 + (Y - cy) ** 2
        cap = np.sqrt(np.maximum(0, r * r - d2)) / SS
        acc += np.exp(k * cap / 30.0) * (cap > 0)
        hmax = np.maximum(hmax, cap)
    H = np.where(acc > 0, np.log(np.maximum(acc, 1e-9)) * 30.0 / k, 0)
    H = np.maximum(H, 0)
    return H


def shade(H, sigma=1.6, wrap=0.45, depth=1.0):
    """Lambert with wrap on a height field -> diffuse in [0,1]."""
    Hs = cv2.GaussianBlur(H, (0, 0), sigma * SS)
    gy, gx = np.gradient(Hs * SS * depth)
    nz = np.ones_like(H) * 1.0
    n = np.stack([-gx, -gy, nz], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9
    d = n @ LIGHT
    d = (d + wrap) / (1 + wrap)
    return np.clip(d, 0, 1)


def bands(d, levels=5, soft=0.35):
    """Painterly banding: pull values toward a few tones, softly."""
    q = np.round(d * (levels - 1)) / (levels - 1)
    return d * soft + q * (1 - soft)


def cavity(H, sigma=6):
    """Darker in creases between billows (0..1, 1 = crease)."""
    b = cv2.GaussianBlur(H, (0, 0), sigma * SS)
    c = np.clip((b - H) / (np.percentile(H[H > 0], 80) + 1e-6) * 3, 0, 1) if (H > 0).any() else H * 0
    return c


def edge_alpha(H, soft=3.0, seed=0, erode=0.35, cell=16):
    """Soft, frayed silhouette. Noise only eats into the volume, never adds haze outside it."""
    n = noise(H.shape[0], H.shape[1], cell * SS, seed + 5, 4)
    f = noise(H.shape[0], H.shape[1], cell * SS * 0.35, seed + 6, 3)
    edge = H - (1 - n) * soft * (1.0 + erode * 2) - (1 - f) * soft * 0.6
    a = smooth(0.0, soft, edge)
    return np.clip(a, 0, 1)


def smoke_layer(cv, spheres, lit, shadow, seed=0, alpha=1.0, warp=18, soft=3.0,
                crease='#000000', crease_amt=0.25, erode=0.35, texture=0.05, levels=5):
    H = billow_height(cv, spheres, warp=warp, seed=seed)
    d = bands(shade(H), levels)
    tex = brush(cv.h, cv.w, seed + 3, 10 * SS // 2) * texture
    d = np.clip(d + tex, 0, 1)
    col = hexrgb(shadow) * (1 - d[..., None]) + hexrgb(lit) * d[..., None]
    cav = cavity(H)
    col = col * (1 - cav[..., None] * crease_amt) + hexrgb(crease) * cav[..., None] * crease_amt
    a = edge_alpha(H, soft, seed, erode) * alpha
    cv.over(col, a)
    return H, a


def radial(cv, cx, cy):
    dx, dy = cv.X - cx * SS, cv.Y - cy * SS
    return np.sqrt(dx * dx + dy * dy) / SS, np.arctan2(dy, dx)


def glow(cv, cx, cy, r, color, strength=1.0, power=2.0):
    d, _ = radial(cv, cx, cy)
    a = np.clip(1 - d / r, 0, 1) ** power * strength
    col = np.broadcast_to(hexrgb(color), cv.rgb.shape).copy()
    cv.over(col, a)


def fire_layer(cv, spheres, seed, heat=1.0, alpha=1.0, stops=None, warp=16, core_bias=0.0,
               cell=22, soft=2.5):
    """Emissive fireball: temperature from height + turbulence -> colour ramp."""
    H = billow_height(cv, spheres, warp=warp, seed=seed, k=6)
    if not (H > 0).any():
        return H
    Hn = H / (H.max() + 1e-6)
    n = noise(cv.h, cv.w, cell * SS, seed + 21, 4)
    f = noise(cv.h, cv.w, cell * SS * 0.4, seed + 22, 3)
    d = shade(H, 1.2, 0.6)
    T = np.clip(Hn * 0.78 + (n - 0.5) * 0.42 + (f - 0.5) * 0.22 + (d - 0.6) * 0.25 + core_bias, 0, 1) * heat
    T = bands(T, 8, 0.6)
    stops = stops or [(0.0, '#5a2414'), (0.25, '#a8361a'), (0.45, '#e2682a'),
                      (0.65, '#f6a646'), (0.82, '#ffd98a'), (1.0, '#fff7e2')]
    col = ramp(T, stops)
    a = edge_alpha(H, soft, seed, 0.25, 12) * alpha
    cv.over(col, a)
    return H


def streaks(cv, cx, cy, n, r0, r1, width, seed, color_core='#fffbe8', color_edge='#ffb24a',
            alpha=1.0, spread=None, angle0=0.0, taper=True):
    """Radial spark streaks (tapered lines)."""
    r = np.random.default_rng(seed)
    for i in range(n):
        a = angle0 + (r.uniform(-spread, spread) if spread is not None else r.uniform(0, 2 * np.pi))
        l0 = r0 * r.uniform(0.6, 1.0)
        l1 = r1 * r.uniform(0.55, 1.0)
        wdt = width * r.uniform(0.6, 1.1)
        line(cv, cx + np.cos(a) * l0, cy + np.sin(a) * l0, cx + np.cos(a) * l1, cy + np.sin(a) * l1,
             wdt, color_core, color_edge, alpha * r.uniform(0.7, 1.0), taper)


def line(cv, x0, y0, x1, y1, w, core, edge, alpha=1.0, taper=True):
    X, Y = cv.X / SS, cv.Y / SS
    dx, dy = x1 - x0, y1 - y0
    L2 = dx * dx + dy * dy + 1e-9
    t = np.clip(((X - x0) * dx + (Y - y0) * dy) / L2, 0, 1)
    px, py = x0 + t * dx, y0 + t * dy
    d = np.sqrt((X - px) ** 2 + (Y - py) ** 2)
    ww = w * ((1 - t) * 0.25 + t) if taper else w  # thick at the outer end? no: thick at head (t=1)
    ww = w * (0.25 + 0.75 * (1 - t)) if taper else w
    a = smooth(ww * 1.0, ww * 0.35, d) * alpha
    a *= smooth(0, 0.08, t)  # soft tail start
    core_a = smooth(ww * 0.55, 0.0, d)
    col = hexrgb(edge) * (1 - core_a[..., None]) + hexrgb(core) * core_a[..., None]
    cv.over(col, a)


def shard(cv, cx, cy, size, angle, seed, dark='#2c2620', lit='#8a7560', alpha=1.0):
    """A tumbling debris shard: irregular polygon, lit on its upper-left edge."""
    r = np.random.default_rng(seed)
    k = r.integers(4, 7)
    ang = np.sort(r.uniform(0, 2 * np.pi, k))
    rad = size * r.uniform(0.45, 1.0, k) * np.where(np.arange(k) % 2 == 0, 1.0, 0.55)
    ca, sa = np.cos(angle), np.sin(angle)
    pts = []
    for a_, r_ in zip(ang, rad):
        x, y = np.cos(a_) * r_ * 1.6, np.sin(a_) * r_ * 0.8
        pts.append([(cx + x * ca - y * sa) * SS, (cy + x * sa + y * ca) * SS])
    m = np.zeros((cv.h, cv.w), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255, lineType=cv2.LINE_AA)
    mf = m.astype(np.float32) / 255
    # light from upper-left: gradient of blurred mask
    b = cv2.GaussianBlur(mf, (0, 0), max(1, size * SS * 0.25))
    gy, gx = np.gradient(b)
    lit_amt = np.clip((-gx * LIGHT[0] - gy * LIGHT[1]) * size * SS * 3, 0, 1)
    col = hexrgb(dark) * (1 - lit_amt[..., None]) + hexrgb(lit) * lit_amt[..., None]
    cv.over(col, mf * alpha)


def petal_flash(cv, cx, cy, length, width, seed, lobes=((0, 1.0, 1.0),), core='#fffdf0',
                mid='#ffd46a', edge='#f07a26', alpha=1.0, jag=0.18):
    """Muzzle-flash petals pointing along the given lobe angles.
    lobes: (angle, length_mult, width_mult)."""
    d, th = radial(cv, cx, cy)
    n = noise(cv.h, cv.w, 6 * SS, seed, 3)
    field = np.zeros((cv.h, cv.w), np.float32)
    for ang, lm, wm in lobes:
        rel = np.angle(np.exp(1j * (th - ang)))
        L = length * lm
        W = width * wm
        along = d * np.cos(rel)
        across = np.abs(d * np.sin(rel))
        prof = W * (1 - np.clip(along / L, 0, 1)) ** 0.8 * np.sqrt(np.clip(along / (L * 0.12), 0, 1))
        f = np.clip(1 - across / (prof + 1e-3), 0, 1) * (along > 0)
        f *= np.clip(1 - along / L, 0, 1) ** 0.35
        field = np.maximum(field, f)
    field = np.clip(field + (n - 0.5) * jag * (field > 0.02), 0, 1)
    col = ramp(field, [(0, edge), (0.45, mid), (0.8, core), (1, core)])
    a = smooth(0.02, 0.28, field) * alpha
    cv.over(col, a)
    return field


# ---------------------------------------------------------------- painted balls
# Painted smoke/fire the way an illustrator does it: many overlapping lit
# spheres, back to front. Each ball is shaded on its own, so the silhouette
# reads as cauliflower billows instead of one smooth lump.

def expand_balls(spheres, seed, kids=3, kid_scale=(0.35, 0.55)):
    rr = np.random.default_rng(seed + 99)
    out = []
    for cx, cy, r in spheres:
        out.append((cx, cy, r, 0))
        for j in range(kids):
            a = rr.uniform(0, 2 * np.pi)
            k = rr.uniform(*kid_scale)
            out.append((cx + np.cos(a) * r * (1 - k * 0.6), cy + np.sin(a) * r * (1 - k * 0.6), r * k, 1))
    return out


def paint_balls(cv, spheres, seed, color_fn, alpha=1.0, fray=0.22, order_center=None, kids=3):
    """color_fn(lambert, nz, ball_index, depth) -> (rgb HxWx3, alpha_mult HxW or scalar)."""
    balls = expand_balls(spheres, seed, kids)
    if order_center is None:
        order_center = (np.mean([b[0] for b in balls]), np.mean([b[1] for b in balls]))
    ocx, ocy = order_center
    # far from centre first; small kids after their parents
    balls.sort(key=lambda b: -np.hypot(b[0] - ocx, b[1] - ocy) + b[3] * 0.5)
    nbig = noise(cv.h, cv.w, 10 * SS, seed + 7, 3)
    for i, (cx, cy, r, kid) in enumerate(balls):
        x0, x1 = int(max(0, (cx - r * 1.4) * SS)), int(min(cv.w, (cx + r * 1.4) * SS))
        y0, y1 = int(max(0, (cy - r * 1.4) * SS)), int(min(cv.h, (cy + r * 1.4) * SS))
        if x1 <= x0 or y1 <= y0:
            continue
        X = cv.X[y0:y1, x0:x1] / SS
        Y = cv.Y[y0:y1, x0:x1] / SS
        nx, ny = (X - cx) / r, (Y - cy) / r
        d = np.sqrt(nx * nx + ny * ny) + (nbig[y0:y1, x0:x1] - 0.5) * fray
        inside = d < 1
        nz = np.sqrt(np.clip(1 - d * d, 0, 1))
        lam = np.clip(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], -1, 1)
        lam = (lam + 0.35) / 1.35
        depth = np.hypot(cx - ocx, cy - ocy)
        rgb, am = color_fn(np.clip(lam, 0, 1), nz, i, depth, (y0, y1, x0, x1))
        a = smooth(1.0, 0.82, d) * alpha * (am if np.ndim(am) else am)
        # composite into the window
        A = cv.a[y0:y1, x0:x1]
        Cc = cv.rgb[y0:y1, x0:x1]
        out_a = a + A * (1 - a)
        num = rgb * a[..., None] + Cc * (A * (1 - a))[..., None]
        cv.rgb[y0:y1, x0:x1] = np.where(out_a[..., None] > 1e-5, num / np.maximum(out_a[..., None], 1e-5), rgb)
        cv.a[y0:y1, x0:x1] = out_a


def smoke_balls(cv, spheres, lit, shade_col, seed, alpha=1.0, fray=0.25, rim='#000000', kids=3,
                levels=4, texture=0.06, thin=0.0, glow_col=None, glow_r=0.0, glow_c=None):
    L, Sh = hexrgb(lit), hexrgb(shade_col)
    G = hexrgb(glow_col) if glow_col else None
    tex = brush(cv.h, cv.w, seed + 3, 8) * texture
    def fn(lam, nz, i, depth, w):
        y0, y1, x0, x1 = w
        t = np.clip(bands(lam, levels, 0.45) + tex[y0:y1, x0:x1], 0, 1)
        rgb = Sh * (1 - t[..., None]) + L * t[..., None]
        if G is not None and glow_r > 0:
            X = cv.X[y0:y1, x0:x1] / SS - glow_c[0]
            Y = cv.Y[y0:y1, x0:x1] / SS - glow_c[1]
            g = np.clip(1 - np.sqrt(X * X + Y * Y) / glow_r, 0, 1) ** 1.5 * (1 - 0.6 * t)
            rgb = rgb * (1 - g[..., None]) + G * g[..., None]
        return rgb, 1.0 - thin * (1 - nz)
    paint_balls(cv, spheres, seed, fn, alpha, fray, kids=kids)


def fire_balls(cv, spheres, seed, stops, heat=1.0, alpha=1.0, fray=0.2, kids=3, cool_edge=0.35):
    n = noise(cv.h, cv.w, 8 * SS, seed + 21, 3)
    maxd = max(1.0, max(np.hypot(s[0] - np.mean([q[0] for q in spheres]), s[1] - np.mean([q[1] for q in spheres])) + s[2]
                        for s in spheres))
    def fn(lam, nz, i, depth, w):
        y0, y1, x0, x1 = w
        Y0 = n[y0:y1, x0:x1]
        t = (0.45 + 0.4 * nz + 0.25 * lam - cool_edge * depth / maxd) * heat
        t = np.clip(t + (Y0 - 0.5) * 0.18, 0, 1)
        return ramp(bands(t, 7, 0.55), stops), 1.0
    paint_balls(cv, spheres, seed, fn, alpha, fray, kids=kids)


def flame_tongue(cv, x0, y0, angle, length, width, seed, stops, alpha=1.0, turb=0.35, tongues=3, spread=1.0,
                 levels=7):
    """Painted flame streaming from (x0, y0) along `angle`: ragged tongues, hot at the root."""
    X, Y = cv.X / SS - x0, cv.Y / SS - y0
    ca, sa = np.cos(angle), np.sin(angle)
    u = X * ca + Y * sa           # along
    v = -X * sa + Y * ca          # across
    n1 = noise(cv.h, cv.w, width * 0.9 * SS, seed, 4)
    n2 = noise(cv.h, cv.w, width * 0.45 * SS, seed + 1, 3)
    t = np.clip(u / length, 0, 1.4)
    # sideways wobble grows along the flame
    v = v + (n1 - 0.5) * width * 1.6 * t * turb * 2
    half = width * (0.35 + 0.65 * np.sqrt(np.clip(t * 3, 0, 1))) * (1 - 0.55 * t) * spread
    body = np.clip(1 - np.abs(v) / np.maximum(half, 1e-3), 0, 1)
    # break the tail into tongues
    fing = 0.5 + 0.5 * np.cos(v / max(width, 1) * np.pi * tongues * 0.5 + n2 * 4)
    tail = np.clip(1 - t, 0, 1)
    field = body * (tail ** 0.6) * (1 - t * 0.6 * (1 - fing)) * smooth(-2, 3, u)
    field = np.clip(field + (n2 - 0.5) * 0.25 * (field > 0.02), 0, 1)
    T = np.clip(field * (1.15 - 0.55 * t) + 0.1, 0, 1) * (field > 0.01)
    col = ramp(bands(T, levels, 0.55), stops)
    a = smooth(0.03, 0.22, field) * alpha
    cv.over(col, a)
    return field
