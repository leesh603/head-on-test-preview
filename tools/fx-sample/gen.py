"""Generate the HEAD-ON FX sample atlas (direction check, not a full patch).

    python3 tools/fx-sample/gen.py            -> fx-sample/fx-sample-atlas.webp + .json
    python3 tools/fx-sample/gen.py --only pop -> render a subset (debug)

Four families, one palette:
  A  machine gun   muzzle*, tracerCore/tracerGlow, spark, hitPuff
  B  rocket        rocketFlame, rocketTrail, lePrieurImpact0-3
  C  bomb          bombShadow, mortarImpact0-3, debrisShard, smokeHeavy
  D  fire / smoke  pop0-3 (small), airblast0-3 (medium), fireEngine, fireFlash,
                   fireGround, flameJet, smokeTrail, smokePuff, smokeGray, smokeDark
"""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from fxlib import (Canvas, SS, hexrgb, ramp, smooth, noise, brush, radial, glow,
                   streaks, line, shard, petal_flash, bands, smoke_balls, fire_balls, flame_tongue)


def smoke_layer(cv, spheres, lit, shadow, seed=0, alpha=1.0, warp=18, soft=3.0, erode=0.35, levels=4,
                glow=None, **_):
    g = glow or (None, 0, None)
    smoke_balls(cv, spheres, lit, shadow, seed, alpha, fray=0.18 + erode * 0.25, levels=levels,
                glow_col=g[0], glow_r=g[1], glow_c=g[2])


def fire_layer(cv, spheres, seed, heat=1.0, alpha=1.0, stops=None, core_bias=0.0, **_):
    fire_balls(cv, spheres, seed, stops or FIRE, heat * (1 + core_bias), alpha)

R = np.random.default_rng

# ------------------------------------------------------------------ palette
# Smoke is warm grey (sunlit tops, brown-violet shade), never pure black,
# so bullets and aircraft stay readable through it.
SMOKE_LIT, SMOKE_SHADE = '#d9d0bd', '#6d6458'
SOOT_LIT, SOOT_SHADE = '#9d9080', '#463d35'
DUST_LIT, DUST_SHADE = '#cdb48c', '#6e5a40'
FIRE = [(0.0, '#4a1c10'), (0.22, '#9c3218'), (0.42, '#dc5e24'), (0.62, '#f49a3e'),
        (0.8, '#ffd27a'), (1.0, '#fff6dc')]
FIRE_COOL = [(0.0, '#3a1a12'), (0.3, '#7e2a16'), (0.55, '#c64a1e'), (0.8, '#ee8a34'), (1.0, '#ffc868')]


def cluster(cx, cy, spread, n, rmin, rmax, seed, squash=1.0, bias_up=0.0):
    r = R(seed)
    out = []
    for i in range(n):
        a = r.uniform(0, 2 * np.pi)
        d = spread * np.sqrt(r.uniform(0, 1))
        rr = r.uniform(rmin, rmax) * (1 - 0.35 * d / max(spread, 1e-6))
        out.append((cx + np.cos(a) * d, cy + np.sin(a) * d * squash - bias_up * (1 - d / max(spread, 1e-6)), rr))
    return out


def embers(cv, cx, cy, n, r0, r1, seed, size=1.2, alpha=1.0, color='#ffc36a'):
    r = R(seed)
    for i in range(n):
        a = r.uniform(0, 2 * np.pi)
        d = r.uniform(r0, r1)
        x, y = cx + np.cos(a) * d, cy + np.sin(a) * d
        glow(cv, x, y, size * r.uniform(1.4, 2.4), '#ff8a3a', 0.35 * alpha, 1.5)
        glow(cv, x, y, size * r.uniform(0.8, 1.2), color, alpha * r.uniform(0.6, 1.0), 1.2)


# ================================================================ A  MACHINE GUN

def muzzle(kind='single'):
    cv = Canvas(64, 64)
    cx, cy = 22, 32
    seed = {'single': 1, 'twin': 2, 'heavy': 3, 'rear': 4}[kind]
    if kind == 'heavy':
        lobes = ((0, 1.0, 1.0), (0.62, 0.45, 0.55), (-0.62, 0.45, 0.55), (1.35, 0.22, 0.4), (-1.35, 0.22, 0.4))
        L, W = 38, 11
    elif kind == 'rear':
        lobes = ((0, 1.0, 1.0), (0.5, 0.5, 0.6), (-0.5, 0.5, 0.6))
        L, W = 30, 9
    else:
        lobes = ((0, 1.0, 1.0), (0.7, 0.42, 0.5), (-0.7, 0.42, 0.5))
        L, W = 32, 8.5
    offs = [(0, -7), (0, 7)] if kind == 'twin' else [(0, 0)]
    for i, (ox, oy) in enumerate(offs):
        glow(cv, cx + 8 + ox, cy + oy, 18, '#ffb04a', 0.28, 1.6)
    for i, (ox, oy) in enumerate(offs):
        petal_flash(cv, cx + ox, cy + oy, L * (0.86 if kind == 'twin' else 1), W, seed + i * 7, lobes,
                    edge='#e46a22', mid='#ffc452', core='#fffbea')
        glow(cv, cx + 3 + ox, cy + oy, 6.5, '#fffdf2', 0.95, 1.4)
    return cv


def tracer_core():
    cv = Canvas(96, 24)
    # white-hot head on the right, short warm tail
    line(cv, 8, 12, 88, 12, 4.2, '#fffef6', '#fff0c8', 1.0, taper=False)
    X, Y = cv.X / SS, cv.Y / SS
    fade = smooth(6, 60, X)  # tail fades to the left
    head = np.exp(-((X - 86) ** 2) / 30 - ((Y - 12) ** 2) / 8)
    cv.a *= np.clip(fade * 0.85 + head * 0.4, 0, 1)
    return cv


def tracer_glow():
    cv = Canvas(96, 24)
    X, Y = cv.X / SS, cv.Y / SS
    d = np.abs(Y - 12)
    along = smooth(0, 80, X)
    a = np.exp(-(d / (2.4 + 3.2 * along)) ** 2) * along * smooth(96, 84, X)
    col = np.broadcast_to(hexrgb('#ffffff'), cv.rgb.shape).copy()
    cv.over(col, a * 0.9)
    return cv


def spark():
    """Impact spark, tinted per hit colour by the engine: short and compact, never confetti."""
    cv = Canvas(48, 48)
    glow(cv, 24, 24, 10, '#fff4dc', 0.35, 2.0)
    streaks(cv, 24, 24, 4, 1, 12, 1.5, 31, '#ffffff', '#f2e6cc', 0.9)
    glow(cv, 24, 24, 4, '#ffffff', 1.0, 1.2)
    return cv


def hit_puff():
    """Bullet impact on an airframe: tiny flash + chips + a wisp of dust."""
    cv = Canvas(64, 64)
    smoke_layer(cv, cluster(34, 30, 7, 6, 5, 8, 41), SMOKE_LIT, SMOKE_SHADE, 41, 0.55, 6, 2, erode=0.5)
    for i in range(4):
        shard(cv, 32 + np.cos(i * 1.7) * 13, 32 + np.sin(i * 1.7) * 11, 2.2, i * 1.3, 50 + i, '#3a302a', '#b39a78')
    streaks(cv, 32, 32, 6, 2, 15, 1.3, 44, '#fffbe8', '#ffb24a')
    glow(cv, 32, 32, 7, '#fff4d0', 0.95, 1.3)
    return cv


# ================================================================ B  ROCKET

def rocket_flame():
    """Exhaust at the nozzle, pointing LEFT (rocket flies right); nozzle at x=86."""
    cv = Canvas(96, 32)
    petal_flash(cv, 86, 16, 58, 8, 61, ((np.pi, 1.0, 1.0), (np.pi + 0.35, 0.35, 0.5), (np.pi - 0.35, 0.35, 0.5)),
                edge='#d8561e', mid='#ffb648', core='#fffbe8', jag=0.25)
    glow(cv, 84, 16, 9, '#fffdf0', 0.9, 1.4)
    return cv


def rocket_trail():
    """Smoke ribbon: dense and narrow at the head (right), widening and thinning to the left."""
    cv = Canvas(256, 48)
    r = R(71)
    sph = []
    x = 246
    while x > 6:
        t = 1 - x / 256
        rad = 3.2 + t * 12
        sph.append((x + r.uniform(-1, 1), 24 + r.uniform(-1, 1) * t * 6, rad * r.uniform(0.8, 1.1)))
        x -= rad * 0.7
    smoke_layer(cv, sph, '#e4ddcf', '#8b8276', 71, 1.0, warp=10, soft=2.2, erode=0.5, levels=4)
    X = cv.X / SS
    cv.a *= smooth(0, 150, X) ** 1.3 * 0.9
    return cv


def rocket_impact(frame):
    """Le Prieur rocket hit: compact hot burst, white propellant smoke, fragments."""
    S = 192
    cv = Canvas(S, S)
    c = S / 2
    seed = 80 + frame
    if frame == 0:
        glow(cv, c, c, 70, '#ffcf7a', 0.35, 2.2)
        fire_layer(cv, cluster(c, c, 14, 9, 10, 17, seed), seed, 1.08, stops=FIRE, core_bias=0.15)
        streaks(cv, c, c, 12, 10, 60, 2.6, seed, '#fffbe8', '#ffb24a')
        glow(cv, c, c, 20, '#fffdf2', 1.0, 1.3)
    elif frame == 1:
        smoke_layer(cv, cluster(c, c, 30, 14, 12, 20, seed), '#ece5d6', '#958b7c', seed, 0.9, 16)
        fire_layer(cv, cluster(c, c, 22, 12, 12, 21, seed + 1), seed, 1.0, stops=FIRE, core_bias=0.05)
        streaks(cv, c, c, 10, 40, 88, 1.8, seed, '#fff3c8', '#f09a3a', 0.8)
        for i in range(6):
            a = i * 1.047 + 0.3
            shard(cv, c + np.cos(a) * 62, c + np.sin(a) * 62, 3.4, a * 2, seed + i)
    elif frame == 2:
        smoke_layer(cv, cluster(c, c - 4, 40, 18, 14, 24, seed), '#e6ded0', '#877e71', seed, 0.85, 18,
                    glow=('#e67a3c', 28, (c, c)))
        embers(cv, c, c, 10, 30, 70, seed, 1.3, 0.8)
    else:
        smoke_layer(cv, cluster(c, c - 8, 48, 18, 14, 26, seed), '#dcd4c6', '#8a8174', seed, 0.55, 22, erode=0.6)
        embers(cv, c, c - 4, 5, 20, 60, seed, 1.1, 0.5)
    return cv


# ================================================================ C  BOMB

def bomb_shadow():
    cv = Canvas(64, 32)
    X, Y = cv.X / SS, cv.Y / SS
    d = np.sqrt(((X - 32) / 26) ** 2 + ((Y - 16) / 11) ** 2)
    a = smooth(1.0, 0.2, d) * 0.55
    cv.over(np.broadcast_to(hexrgb('#1a1712'), cv.rgb.shape).copy(), a)
    return cv


def bomb_impact(frame):
    """Ground blast seen from above: flash + fireball over a dirt spray, then a dust column."""
    S = 256
    cv = Canvas(S, S)
    c = S / 2
    seed = 100 + frame
    if frame == 0:
        # dirt ring kicked outward + white-hot flash
        smoke_layer(cv, [(c + np.cos(a) * 46, c + np.sin(a) * 46, 18) for a in np.linspace(0, 2 * np.pi, 14, endpoint=False)],
                    DUST_LIT, DUST_SHADE, seed, 0.55, 14, erode=0.55)
        glow(cv, c, c, 100, '#ffd48a', 0.4, 2.4)
        fire_layer(cv, cluster(c, c, 22, 12, 14, 26, seed), seed, 1.1, stops=FIRE, core_bias=0.18)
        streaks(cv, c, c, 16, 20, 92, 3.0, seed, '#fff6d8', '#ffa640', 0.9)
        glow(cv, c, c, 30, '#fffdf2', 1.0, 1.3)
    elif frame == 1:
        # dirt spray (radial clods) under a big fireball
        for i in range(16):
            a = i * 0.3927 + 0.2
            shard(cv, c + np.cos(a) * R(seed + i).uniform(70, 104), c + np.sin(a) * R(seed + i).uniform(70, 104),
                  R(seed + i).uniform(3, 5.5), a, seed + i, '#3a2c1e', '#9a7a52')
        smoke_layer(cv, cluster(c, c, 62, 22, 16, 30, seed), DUST_LIT, DUST_SHADE, seed, 0.95, 20)
        fire_layer(cv, cluster(c, c - 4, 38, 16, 16, 30, seed + 1), seed, 1.0, stops=FIRE, core_bias=0.08)
        embers(cv, c, c, 12, 50, 110, seed, 1.5, 0.9)
    elif frame == 2:
        smoke_layer(cv, cluster(c, c + 6, 74, 26, 18, 34, seed), DUST_LIT, DUST_SHADE, seed, 0.95, 24)
        smoke_layer(cv, cluster(c - 6, c - 10, 34, 8, 20, 32, seed + 3), SOOT_LIT, SOOT_SHADE, seed + 3, 0.8, 18,
                    glow=('#d45a28', 40, (c, c - 4)))
        embers(cv, c, c, 12, 30, 100, seed, 1.4, 0.8)
    else:
        # scorch + lingering dust/soot
        X, Y = cv.X / SS, cv.Y / SS
        n = noise(cv.h, cv.w, 20 * SS, seed, 3)
        d = np.sqrt((X - c) ** 2 + (Y - c) ** 2) / 58 + (n - 0.5) * 0.5
        cv.over(np.broadcast_to(hexrgb('#231d17'), cv.rgb.shape).copy(), smooth(1.0, 0.45, d) * 0.7)
        smoke_layer(cv, cluster(c, c - 8, 86, 24, 18, 34, seed), '#c9bda6', '#6c6152', seed, 0.6, 26, erode=0.6)
        embers(cv, c, c, 7, 10, 50, seed, 1.2, 0.6)
    return cv


def debris_shard():
    cv = Canvas(64, 64)
    shard(cv, 32, 32, 12, 0.4, 90, '#2a241e', '#9c8568')
    return cv


# ================================================================ D  FIRE / SMOKE

def pop(frame):
    """Small explosion (cannon hits, grenades, small aircraft parts)."""
    S = 128
    cv = Canvas(S, S)
    c = S / 2
    seed = 120 + frame
    if frame == 0:
        glow(cv, c, c, 44, '#ffcf7a', 0.35, 2.2)
        fire_layer(cv, cluster(c, c, 8, 7, 7, 12, seed), seed, 1.1, stops=FIRE, core_bias=0.2)
        streaks(cv, c, c, 8, 6, 34, 2.1, seed, '#fffbe8', '#ffb24a')
        glow(cv, c, c, 12, '#fffdf2', 1.0, 1.3)
    elif frame == 1:
        smoke_layer(cv, cluster(c, c, 18, 10, 8, 13, seed), SMOKE_LIT, SMOKE_SHADE, seed, 0.8, 10)
        fire_layer(cv, cluster(c, c, 15, 10, 8, 14, seed + 1), seed, 1.0, stops=FIRE)
    elif frame == 2:
        smoke_layer(cv, cluster(c, c - 2, 24, 12, 9, 16, seed), SMOKE_LIT, SMOKE_SHADE, seed, 0.85, 12,
                    glow=('#e2733a', 20, (c, c)))
        embers(cv, c, c, 6, 16, 44, seed, 1.0, 0.8)
    else:
        smoke_layer(cv, cluster(c, c - 4, 30, 12, 9, 17, seed), SMOKE_LIT, SMOKE_SHADE, seed, 0.5, 14, erode=0.6)
    return cv


def airblast(frame):
    """Medium explosion (aircraft destroyed in the air): fireball, oily smoke, wreck pieces."""
    S = 192
    cv = Canvas(S, S)
    c = S / 2
    seed = 140 + frame
    if frame == 0:
        glow(cv, c, c, 76, '#ffcf7a', 0.38, 2.2)
        fire_layer(cv, cluster(c, c, 16, 11, 11, 20, seed), seed, 1.1, stops=FIRE, core_bias=0.18)
        streaks(cv, c, c, 10, 12, 56, 2.8, seed, '#fffbe8', '#ffb24a', 0.9)
        glow(cv, c, c, 22, '#fffdf2', 1.0, 1.3)
    elif frame == 1:
        smoke_layer(cv, cluster(c, c, 38, 16, 13, 22, seed), SOOT_LIT, SOOT_SHADE, seed, 0.9, 16)
        fire_layer(cv, cluster(c, c, 30, 14, 13, 24, seed + 1), seed, 1.0, stops=FIRE, core_bias=0.04)
        for i in range(5):
            a = i * 1.256 + 0.5
            shard(cv, c + np.cos(a) * 68, c + np.sin(a) * 68, 4.2, a * 2.3, seed + i, '#2c2620', '#a08a6c')
        embers(cv, c, c, 8, 40, 80, seed, 1.4, 0.9)
    elif frame == 2:
        smoke_layer(cv, cluster(c, c - 4, 46, 18, 14, 26, seed), SOOT_LIT, SOOT_SHADE, seed, 0.92, 18,
                    glow=('#d9622c', 34, (c + 2, c)))
        embers(cv, c, c, 10, 30, 84, seed, 1.3, 0.85)
    else:
        smoke_layer(cv, cluster(c, c - 10, 54, 18, 14, 28, seed), '#9a9084', '#453e37', seed, 0.6, 22, erode=0.6)
        embers(cv, c, c - 6, 4, 20, 60, seed, 1.1, 0.5)
    return cv


def fire_engine():
    """Burning engine: flames stream DOWN (sprite up = aircraft nose), soot above the tips."""
    cv = Canvas(128, 128)
    c = 64
    smoke_layer(cv, [(c + np.sin(i * 1.7) * 6, 82 + i * 8, 7 + i * 2.2) for i in range(5)], SOOT_LIT, SOOT_SHADE, 161, 0.7, 14,
                erode=0.55)
    flame_tongue(cv, c, 36, np.pi / 2, 70, 15, 162, FIRE, 1.0, turb=0.5, tongues=3)
    flame_tongue(cv, c - 4, 40, np.pi / 2 + 0.2, 44, 8, 163, FIRE, 0.9, turb=0.6)
    flame_tongue(cv, c + 5, 40, np.pi / 2 - 0.22, 40, 7, 164, FIRE, 0.9, turb=0.6)
    glow(cv, c, 40, 9, '#fff4d0', 0.9, 1.4)
    return cv


def fire_flash():
    cv = Canvas(192, 192)
    c = 96
    glow(cv, c, c, 92, '#ffc76a', 0.45, 2.4)
    fire_layer(cv, cluster(c, c, 14, 10, 12, 22, 171), 171, 1.12, stops=FIRE, core_bias=0.22)
    streaks(cv, c, c, 10, 18, 64, 2.6, 171, '#fffbe8', '#ffb24a', 0.7)
    glow(cv, c, c, 26, '#fffdf2', 1.0, 1.3)
    return cv


def fire_ground():
    """Ground fire patch from above: flame tongues leaning downwind (right-down), soot drifting off."""
    cv = Canvas(192, 192)
    c = 96
    smoke_layer(cv, cluster(c + 26, c + 22, 36, 12, 12, 22, 181), SOOT_LIT, SOOT_SHADE, 181, 0.75, 20, erode=0.55)
    r = R(182)
    for i in range(6):
        a = r.uniform(0, 2 * np.pi)
        d = r.uniform(0, 22)
        flame_tongue(cv, c + np.cos(a) * d - 10, c + np.sin(a) * d - 10, 0.75 + r.uniform(-0.3, 0.3), r.uniform(40, 62),
                     r.uniform(9, 14), 183 + i, FIRE, 0.95, turb=0.5)
    glow(cv, c - 8, c - 8, 16, '#fff0c0', 0.6, 1.5)
    return cv


def flame_jet():
    """Flame projector stream pointing RIGHT, nozzle on the left edge; rolls into soot at the end."""
    cv = Canvas(256, 96)
    smoke_layer(cv, [(170 + i * 16, 44 + np.sin(i) * 5, 14 + i * 2.5) for i in range(5)], SOOT_LIT, SOOT_SHADE, 191, 0.6, 16,
                erode=0.6)
    fire_layer(cv, [(186 + i * 14, 48 + np.sin(i * 1.3) * 6, 16 + i * 1.5) for i in range(4)], 193, 0.85, stops=FIRE_COOL)
    flame_tongue(cv, 10, 48, 0.0, 210, 26, 192, FIRE, 1.0, turb=0.35, tongues=4)
    glow(cv, 16, 48, 12, '#fff4d0', 0.9, 1.4)
    X = cv.X / SS
    cv.a *= smooth(254, 226, X)
    return cv


def smoke_trail():
    """Crash / damage trail, dense end on the RIGHT (the aircraft)."""
    cv = Canvas(256, 88)
    r = R(201)
    sph = []
    x = 246
    while x > 10:
        t = 1 - x / 256
        rad = 7 + t * 22
        sph.append((x, 44 + r.uniform(-1, 1) * (4 + t * 10), rad * r.uniform(0.8, 1.1)))
        x -= rad * 0.55
    smoke_layer(cv, sph, SOOT_LIT, SOOT_SHADE, 201, 1.0, 16, erode=0.5)
    X = cv.X / SS
    cv.a *= smooth(0, 170, X) ** 1.2 * 0.95
    return cv


def puff(seed, lit, shade_, S=96, spread=18, n=9, alpha=0.9):
    cv = Canvas(S, S)
    c = S / 2
    smoke_layer(cv, cluster(c, c, spread * 1.35, n + 6, S * 0.08, S * 0.16, seed), lit, shade_, seed, alpha, S * 0.15, erode=0.45)
    return cv


def smoke_heavy():
    cv = Canvas(192, 192)
    c = 96
    smoke_layer(cv, cluster(c, c, 58, 22, 16, 30, 211), '#8e847a', '#3a342e', 211, 0.92, 22)
    return cv


# ------------------------------------------------------------------ registry
SPRITES = {
    # A
    'muzzle': lambda: muzzle('single'), 'muzzleTwin': lambda: muzzle('twin'),
    'muzzleHeavy': lambda: muzzle('heavy'), 'muzzleRear': lambda: muzzle('rear'),
    'tracerCore': tracer_core, 'tracerGlow': tracer_glow, 'spark': spark, 'hitPuff': hit_puff,
    # B
    'rocketFlame': rocket_flame, 'rocketTrail': rocket_trail,
    **{f'lePrieurImpact{i}': (lambda i=i: rocket_impact(i)) for i in range(4)},
    # C
    'bombShadow': bomb_shadow, **{f'mortarImpact{i}': (lambda i=i: bomb_impact(i)) for i in range(4)},
    'debrisShard': debris_shard, 'smokeHeavy': smoke_heavy,
    # D
    **{f'pop{i}': (lambda i=i: pop(i)) for i in range(4)},
    **{f'airblast{i}': (lambda i=i: airblast(i)) for i in range(4)},
    'fireEngine': fire_engine, 'fireFlash': fire_flash, 'fireGround': fire_ground, 'flameJet': flame_jet,
    'smokeTrail': smoke_trail,
    'smokePuff': lambda: puff(221, SMOKE_LIT, SMOKE_SHADE, 96, 14, 8, 0.85),
    'smokeGray': lambda: puff(222, '#c4bcae', '#5f574d', 128, 22, 10, 0.9),
    'smokeDark': lambda: puff(223, SOOT_LIT, SOOT_SHADE, 128, 22, 10, 0.92),
}

FAMILY = {
    'A': ['muzzle', 'muzzleTwin', 'muzzleHeavy', 'muzzleRear', 'tracerCore', 'tracerGlow', 'spark', 'hitPuff'],
    'B': ['rocketFlame', 'rocketTrail'] + [f'lePrieurImpact{i}' for i in range(4)],
    'C': ['bombShadow'] + [f'mortarImpact{i}' for i in range(4)] + ['debrisShard', 'smokeHeavy'],
    'D': [f'pop{i}' for i in range(4)] + [f'airblast{i}' for i in range(4)] +
         ['fireEngine', 'fireFlash', 'fireGround', 'flameJet', 'smokeTrail', 'smokePuff', 'smokeGray', 'smokeDark'],
}


def pack(images, width=1024, pad=2):
    """Shelf packer, tallest first. Returns atlas + rects."""
    order = sorted(images, key=lambda k: -images[k].shape[0])
    x = y = shelf = 0
    rects = {}
    for k in order:
        h, w = images[k].shape[:2]
        if x + w + pad > width:
            x, y, shelf = 0, y + shelf + pad, 0
        rects[k] = (x, y, w, h)
        x += w + pad
        shelf = max(shelf, h)
    H = y + shelf
    H = int(2 ** np.ceil(np.log2(H))) if H > 0 else 1
    atlas = np.zeros((H, width, 4), np.uint8)
    for k, (x, y, w, h) in rects.items():
        atlas[y:y + h, x:x + w] = images[k]
    return atlas, rects


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    only = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else None
    outdir = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(root, 'fx-sample')
    os.makedirs(outdir, exist_ok=True)
    images = {}
    for k, fn in SPRITES.items():
        if only and not any(k.startswith(o) for o in only):
            continue
        images[k] = fn().image()
        print('rendered', k, images[k].shape[1], 'x', images[k].shape[0], flush=True)
    for k, im in (images.items() if (only or '--cells' in sys.argv) else []):
        cv2.imwrite(os.path.join(outdir, f'_cell-{k}.png'), cv2.cvtColor(im, cv2.COLOR_RGBA2BGRA))
    if only:
        return
    atlas, rects = pack(images)
    cv2.imwrite(os.path.join(outdir, 'fx-sample-atlas.png'), cv2.cvtColor(atlas, cv2.COLOR_RGBA2BGRA))
    ok, buf = cv2.imencode('.webp', cv2.cvtColor(atlas, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 100])
    open(os.path.join(outdir, 'fx-sample-atlas.webp'), 'wb').write(buf.tobytes())
    manifest = {'version': 2, 'image': 'fx-sample-atlas.webp', 'size': [atlas.shape[1], atlas.shape[0]],
                'families': FAMILY, 'rects': {k: list(map(int, v)) for k, v in rects.items()}}
    json.dump(manifest, open(os.path.join(outdir, 'fx-sample.json'), 'w'), indent=1)
    print('atlas', atlas.shape, 'webp', len(buf) // 1024, 'KB')


if __name__ == '__main__':
    main()
