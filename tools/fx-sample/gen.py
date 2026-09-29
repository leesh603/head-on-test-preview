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
from fxlib import (Canvas, SS, hexrgb, ramp, smooth, noise, brush, radial, glow,  # noqa
                   streaks, line, shard, petal_flash, bands, smoke_balls, fire_balls, flame_tongue, fire_patch, char_patch)


def smoke_layer(cv, spheres, lit, shadow, seed=0, alpha=1.0, warp=18, soft=3.0, erode=0.35, levels=4,
                glow=None, **_):
    g = glow or (None, 0, None)
    smoke_balls(cv, spheres, lit, shadow, seed, alpha, fray=0.18 + erode * 0.25, levels=levels,
                glow_col=g[0], glow_r=g[1], glow_c=g[2])


def fire_layer(cv, spheres, seed, heat=1.0, alpha=1.0, stops=None, core_bias=0.0, **_):
    fire_balls(cv, spheres, seed, stops or FIRE, heat * 0.93 * (1 + core_bias * 0.6), alpha)

R = np.random.default_rng
R_ = np.random.default_rng

# ------------------------------------------------------------------ palette
# Smoke is warm grey (sunlit tops, brown-violet shade), never pure black,
# so bullets and aircraft stay readable through it.
SMOKE_LIT, SMOKE_SHADE = '#d9d0bd', '#6d6458'
SOOT_LIT, SOOT_SHADE = '#9d9080', '#463d35'
DUST_LIT, DUST_SHADE = '#cdb48c', '#6e5a40'
FIRE = [(0.0, '#4a1c10'), (0.22, '#9c3218'), (0.42, '#dc5e24'), (0.62, '#f49a3e'),
        (0.8, '#f8b862'), (1.0, '#ffd998')]
PATCH = [(0.0, '#b8431c'), (0.3, '#dc6326'), (0.55, '#f09a3e'), (0.78, '#f9c46a'), (1.0, '#ffe2a6')]
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


# ================================================================ EXPLOSION CORE
# One explosion grammar for every blast (round 3 feedback: "just an orange cloud"):
#   0 detonation : jagged white-yellow core + radial flame jets + sparks
#   1 fireball   : mottled billows (some bright, some dull red), soot rolling over
#                  them with fire bursting through, flame licks at the rim, debris
#   2 burn-out   : smoke mass with dull fire pockets glowing through, embers
#   3 residue    : drifting smoke, faint red heart
CORE = [(0.0, '#c24a1c'), (0.35, '#ef8a30'), (0.6, '#f9c05e'), (0.82, '#ffe29a'), (1.0, '#fff2cf')]
EMBER = [(0.0, '#3a1610'), (0.35, '#7a2414'), (0.65, '#b8401a'), (1.0, '#e8782c')]


def explosion(cv, cx, cy, R, seed, stage, smoke=None, soot=None, jets=7, debris=5, sparks=6,
              debris_col=('#2c2620', '#a08a6c'), heat=1.0):
    smoke = smoke or (SOOT_LIT, SOOT_SHADE)
    soot = soot or ('#5a4f46', '#1f1b18')
    r = R_(seed)
    if stage == 0:
        glow(cv, cx, cy, R * 1.2, '#ffb862', 0.2, 2.6)
        n_j = jets * 2
        for i in range(n_j):
            a = i * 2 * np.pi / n_j + r.uniform(-0.25, 0.25)
            L = R * r.uniform(0.22, 0.58) * (1.25 if i % 5 == 0 else 1)
            flame_tongue(cv, cx + np.cos(a) * R * 0.22, cy + np.sin(a) * R * 0.22, a, L, R * r.uniform(0.08, 0.14),
                         seed + 40 + i, FIRE, 0.9, turb=0.7, tongues=2)
        fire_balls(cv, cluster(cx, cy, R * 0.3, 12, R * 0.12, R * 0.22, seed), seed, FIRE, 1.0 * heat, 1.0,
                   mottle=0.2, limb=0.4, grain=0.08, kids=4)
        fire_patch(cv, cx, cy, R * 0.3, seed + 5, CORE, 1.0, wind=(0, 0), flicker=0.9, heat=1.1)
        streaks(cv, cx, cy, sparks, R * 0.3, R * 1.15, max(1.6, R * 0.03), seed, '#fff1d2', '#f49a3a')
    elif stage == 1:
        smoke_layer(cv, [(cx + np.cos(a) * R * 0.5, cy + np.sin(a) * R * 0.5, R * r.uniform(0.2, 0.3))
                         for a in np.linspace(0, 2 * np.pi, 9, endpoint=False) + r.uniform(-.3, .3, 9)],
                    smoke[0], smoke[1], seed + 2, 0.9, 12)
        smoke_balls(cv, cluster(cx, cy, R * 0.2, 6, R * 0.2, R * 0.3, seed + 8), soot[0], soot[1], seed + 8, 0.95, fray=0.2)
        fire_balls(cv, cluster(cx, cy, R * 0.42, 16, R * 0.16, R * 0.3, seed + 1), seed + 1, FIRE, 0.98 * heat, 1.0,
                   mottle=0.3, limb=0.45, grain=0.1, kids=4)
        # soot rolling over the fireball, fire bursting through the gaps
        smoke_balls(cv, cluster(cx + R * 0.08, cy - R * 0.1, R * 0.3, 4, R * 0.16, R * 0.26, seed + 3),
                    soot[0], soot[1], seed + 3, 0.34, fray=0.45, kids=4)
        fire_balls(cv, cluster(cx - R * 0.06, cy + R * 0.04, R * 0.22, 4, R * 0.08, R * 0.14, seed + 4), seed + 4, FIRE,
                   1.08 * heat, 0.95, mottle=0.1, limb=0.3)
        for i in range(jets):
            a = r.uniform(0, 2 * np.pi)
            flame_tongue(cv, cx + np.cos(a) * R * 0.4, cy + np.sin(a) * R * 0.4, a, R * r.uniform(0.18, 0.34),
                         R * 0.08, seed + 60 + i, FIRE, 0.8, turb=0.7, tongues=2)
        for i in range(debris):
            a = i * 2 * np.pi / max(1, debris) + r.uniform(-.3, .3)
            d = R * r.uniform(0.8, 1.05)
            shard(cv, cx + np.cos(a) * d, cy + np.sin(a) * d, R * 0.045, a * 2.3, seed + 70 + i, *debris_col)
        embers(cv, cx, cy, 8, R * 0.5, R * 0.95, seed, max(1.1, R * 0.018), 0.8)
    elif stage == 2:
        smoke_layer(cv, cluster(cx, cy - R * 0.04, R * 0.55, 20, R * 0.15, R * 0.28, seed + 2), smoke[0], smoke[1],
                    seed + 2, 0.93, 16, glow=('#c8522a', R * 0.42, (cx, cy)))
        fire_balls(cv, cluster(cx, cy, R * 0.2, 5, R * 0.1, R * 0.17, seed + 5), seed + 5, FIRE, 0.72, 0.8,
                   mottle=0.25, limb=0.5, grain=0.1, kids=3)
        smoke_balls(cv, cluster(cx + R * 0.05, cy - R * 0.1, R * 0.26, 4, R * 0.13, R * 0.2, seed + 6), smoke[0], smoke[1],
                    seed + 6, 0.55, fray=0.4)
        embers(cv, cx, cy, 10, R * 0.3, R * 0.9, seed, max(1.0, R * 0.016), 0.75)
    else:
        smoke_layer(cv, cluster(cx, cy - R * 0.1, R * 0.62, 20, R * 0.15, R * 0.3, seed + 2), smoke[0], smoke[1],
                    seed + 2, 0.6, 20, erode=0.6)
        smoke_balls(cv, cluster(cx, cy - R * 0.06, R * 0.2, 4, R * 0.12, R * 0.18, seed + 7), smoke[0], smoke[1],
                    seed + 7, 0.35, fray=0.4, glow_col='#b24a26', glow_r=R * 0.22, glow_c=(cx, cy - R * 0.04))
        embers(cv, cx, cy - R * 0.06, 4, R * 0.2, R * 0.6, seed, max(1.0, R * 0.014), 0.45)


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
                    edge='#d9601e', mid='#f7b24a', core='#ffe9c0')
        glow(cv, cx + 3 + ox, cy + oy, 6.5, '#fffdf2', 0.95, 1.4)
    return cv


def tracer_core():
    cv = Canvas(96, 24)
    # white-hot head on the right, short warm tail
    line(cv, 8, 12, 88, 12, 3.8, '#fff3d6', '#f6d9a2', 1.0, taper=False)
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
    cv.over(col, a * 0.6)
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
                edge='#cc521c', mid='#f5a844', core='#ffe6bc', jag=0.25)
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
    """Le Prieur rocket hit: sharp burst, white propellant smoke, fragments."""
    cv = Canvas(192, 192)
    explosion(cv, 96, 96, 64, 80 + frame, frame, smoke=('#ece5d6', '#958b7c'), soot=('#b7ad9e', '#5e564c'),
              jets=7, debris=6, sparks=7)
    return cv


def bomb_shadow():
    cv = Canvas(64, 32)
    X, Y = cv.X / SS, cv.Y / SS
    d = np.sqrt(((X - 32) / 26) ** 2 + ((Y - 16) / 11) ** 2)
    a = smooth(1.0, 0.2, d) * 0.55
    cv.over(np.broadcast_to(hexrgb('#1a1712'), cv.rgb.shape).copy(), a)
    return cv


def bomb_impact(frame):
    """Bomb ground blast from above: dirt spray + fireball, then a dust column and a scorch mark."""
    S = 256
    cv = Canvas(S, S)
    c = S / 2
    seed = 100 + frame
    if frame == 0:
        smoke_layer(cv, [(c + np.cos(a) * 50, c + np.sin(a) * 50, 18) for a in np.linspace(0, 2 * np.pi, 14, endpoint=False)],
                    DUST_LIT, DUST_SHADE, seed, 0.55, 14, erode=0.55)
    if frame == 1:
        for i in range(14):
            a = i * 0.449 + 0.2
            d = R(seed + i).uniform(76, 108)
            shard(cv, c + np.cos(a) * d, c + np.sin(a) * d, R(seed + i).uniform(3, 5.5), a, seed + i, '#3a2c1e', '#9a7a52')
    if frame == 3:
        char_patch(cv, c, c, 60, seed, 0.65, '#231d17')
    explosion(cv, c, c, 96, seed, frame, smoke=(DUST_LIT, DUST_SHADE), soot=(SOOT_LIT, SOOT_SHADE), jets=9, debris=8,
              sparks=7, debris_col=('#3a2c1e', '#9a7a52'))
    return cv


def debris_shard():
    cv = Canvas(64, 64)
    shard(cv, 32, 32, 12, 0.4, 90, '#2a241e', '#9c8568')
    return cv


# ================================================================ D  FIRE / SMOKE

def pop(frame):
    """Small explosion (grenades, cannon pops, small parts)."""
    cv = Canvas(128, 128)
    explosion(cv, 64, 64, 42, 120 + frame, frame, smoke=(SMOKE_LIT, SMOKE_SHADE), jets=6, debris=3, sparks=4)
    return cv


def airblast(frame):
    """Medium explosion (aircraft destroyed in the air): oily soot, wreck pieces."""
    cv = Canvas(192, 192)
    explosion(cv, 96, 96, 68, 140 + frame, frame, jets=8, debris=6, sparks=6)
    return cv


def fire_engine():
    """Burning engine seen from above (sprite up = aircraft nose): a burning patch on the
    cowling, smoke streaming back (down) in the slipstream."""
    cv = Canvas(128, 128)
    c = 64
    smoke_layer(cv, [(c + np.sin(i * 1.7) * (2 + i), 60 + i * 9, 7 + i * 2.4) for i in range(6)], SOOT_LIT, SOOT_SHADE, 161, 0.72,
                14, erode=0.55)
    fire_patch(cv, c, 50, 16, 162, PATCH, 1.0, wind=(0.0, 0.8), flicker=0.5)
    fire_patch(cv, c + 3, 62, 9, 163, PATCH, 0.8, wind=(0.0, 0.9), flicker=0.6, heat=0.8)
    return cv


def fire_flash():
    """Ground-strike flash (first beat of bomb / mortar / shell hits)."""
    cv = Canvas(192, 192)
    explosion(cv, 96, 96, 70, 171, 0, jets=8, sparks=6)
    return cv


def fire_ground():
    """Ground fire from above: scorched patch, a few ragged burning blobs, soot drifting downwind (right-down)."""
    cv = Canvas(192, 192)
    c = 92
    char_patch(cv, c, c, 58, 180, 0.55)
    smoke_layer(cv, cluster(c + 34, c + 28, 30, 10, 11, 20, 181), SOOT_LIT, SOOT_SHADE, 181, 0.6, 20, erode=0.6)
    r = R(182)
    for i in range(5):
        a = r.uniform(0, 2 * np.pi)
        d = r.uniform(0, 26) if i else 0
        fire_patch(cv, c + np.cos(a) * d, c + np.sin(a) * d, r.uniform(16, 24) if i else 30, 183 + i,
                   PATCH, 0.95, heat=1.0 if i < 3 else 0.8)
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


# ================================================================ E  CANNON (COW 37mm / moteur-canon)

def cannon_impact(frame, heavy=True):
    """Cannon shell hit (COW 37mm heavier than moteur-canon)."""
    S = 192 if heavy else 160
    cv = Canvas(S, S)
    explosion(cv, S / 2, S / 2, 58 if heavy else 44, (300 if heavy else 320) + frame, frame, jets=6, debris=5, sparks=5)
    return cv


def boss_blast(frame):
    """Heavy blast (bombers, bosses, hydrogen): big fireball rolling into oily black smoke."""
    cv = Canvas(256, 256)
    explosion(cv, 128, 128, 100, 340 + frame, frame, smoke=('#6d6258', '#26211d'), soot=('#3e3630', '#141110'),
              jets=10, debris=9, sparks=8, debris_col=('#231e19', '#8e7a60'))
    return cv


def structure_blast(frame):
    """Ground structure destroyed: dust + timber/stone debris + fire."""
    S = 256
    cv = Canvas(S, S)
    c = S / 2
    seed = 360 + frame
    if frame == 0:
        smoke_layer(cv, [(c + np.cos(a) * 58, c + np.sin(a) * 58, 20) for a in np.linspace(0, 2 * np.pi, 12, endpoint=False)],
                    DUST_LIT, DUST_SHADE, seed, 0.55, 14, erode=0.55)
    if frame == 3:
        char_patch(cv, c, c, 64, seed, 0.55, '#2a231c')
    explosion(cv, c, c, 92, seed, frame, smoke=(DUST_LIT, DUST_SHADE), soot=(SOOT_LIT, SOOT_SHADE), jets=8, debris=12,
              sparks=6, debris_col=('#3b3026', '#a48a68'))
    return cv


def flak():
    """Anti-aircraft airburst: compact black puff with a dull red heart. Reads as danger, not fireworks."""
    cv = Canvas(128, 128)
    c = 64
    smoke_layer(cv, cluster(c, c, 20, 12, 9, 15, 381), '#5b534c', '#1e1a17', 381, 0.95, 12, glow=('#b8452a', 14, (c, c)))
    embers(cv, c, c, 6, 14, 40, 381, 1.1, 0.6, '#ffae5a')
    return cv


def shock_ring():
    """Faint dust ring pushed out by a heavy blast (drawn large and transparent)."""
    cv = Canvas(192, 192)
    c = 96
    X, Y = cv.X / SS - c, cv.Y / SS - c
    d = np.sqrt(X * X + Y * Y)
    n = noise(cv.h, cv.w, 10 * SS, 391, 3)
    ring = np.exp(-((d - 78 + (n - 0.5) * 10) / 7) ** 2)
    inner = np.exp(-((d - 70) / 14) ** 2) * 0.35
    a = np.clip(ring * 0.75 + inner, 0, 1) * (0.6 + 0.4 * n)
    col = ramp(np.clip(0.5 + (X * -0.5 + Y * -0.6) / 160, 0, 1), [(0, '#8e7b62'), (1, '#e3d4b6')])
    cv.over(col, a)
    return cv


# ================================================================ H  WATER

WATER_LIT, WATER_SHADE = '#f3f6f4', '#8ea4ab'


def naval_splash():
    """Shell / bullet splash seen from above: white crown of spray + droplets."""
    cv = Canvas(160, 160)
    c = 80
    X, Y = cv.X / SS - c, cv.Y / SS - c
    d = np.sqrt(X * X + Y * Y)
    n = noise(cv.h, cv.w, 8 * SS, 401, 3)
    ring = np.exp(-((d - 46 + (n - 0.5) * 14) / 10) ** 2) * 0.55
    cv.over(np.broadcast_to(hexrgb('#dfeae8'), cv.rgb.shape).copy(), ring * (0.5 + 0.5 * n))
    rr_ = R(404)
    crown = []
    for a in np.linspace(0, 2 * np.pi, 9, endpoint=False) + rr_.uniform(-0.25, 0.25, 9):
        d_ = rr_.uniform(22, 34)
        crown.append((c + np.cos(a) * d_, c + np.sin(a) * d_, rr_.uniform(7, 13)))
    smoke_layer(cv, [(c, c, 20)] + crown + cluster(c, c, 16, 6, 8, 13, 402), WATER_LIT, WATER_SHADE, 402, 0.92, 10, erode=0.55)
    r = R(403)
    for i in range(22):
        a = r.uniform(0, 2 * np.pi)
        rr = r.uniform(44, 70)
        glow(cv, c + np.cos(a) * rr, c + np.sin(a) * rr, r.uniform(1.6, 3.0), '#f4f8f6', 0.9, 1.2)
    return cv


def naval_foam():
    """Settling foam ring on the water."""
    cv = Canvas(192, 192)
    c = 96
    X, Y = cv.X / SS - c, cv.Y / SS - c
    d = np.sqrt(X * X + Y * Y)
    n = noise(cv.h, cv.w, 12 * SS, 411, 4)
    f = noise(cv.h, cv.w, 4 * SS, 412, 3)
    ring = np.exp(-((d - 58 + (n - 0.5) * 22) / 16) ** 2)
    a = np.clip(ring * smooth(0.35, 0.7, f * 0.6 + n * 0.4), 0, 1) * 0.85
    col = ramp(np.clip(0.45 + (X * -0.5 + Y * -0.6) / 180, 0, 1), [(0, '#a9bcc0'), (1, '#f4f7f5')])
    cv.over(col, a)
    return cv


# ================================================================ I  MISC GROUND / WING

def dust_puff():
    cv = Canvas(96, 96)
    smoke_layer(cv, cluster(48, 48, 20, 14, 7, 13, 421), DUST_LIT, DUST_SHADE, 421, 0.8, 12, erode=0.5)
    return cv


def dirt_burst():
    """Dirt thrown up by a near miss: low dust fan + clods, no fire."""
    cv = Canvas(160, 160)
    c = 80
    for i in range(12):
        a = i * 0.5236 + 0.2
        rr = R(430 + i).uniform(40, 66)
        shard(cv, c + np.cos(a) * rr, c + np.sin(a) * rr, R(430 + i).uniform(2.5, 4.5), a, 430 + i, '#3b2c1f', '#9a7a52')
    smoke_layer(cv, cluster(c, c, 34, 18, 9, 16, 431), DUST_LIT, DUST_SHADE, 431, 0.9, 14)
    return cv


def fire_wing():
    """Burning wing fabric from above: two small ragged patches along the span, thin smoke trailing back."""
    cv = Canvas(128, 128)
    c = 64
    for dx in (-22, 20):
        smoke_layer(cv, [(c + dx + np.sin(i) * 2, 58 + i * 8, 4 + i * 1.8) for i in range(5)], SOOT_LIT, SOOT_SHADE, 440 + dx, 0.6,
                    10, erode=0.6)
    fire_patch(cv, c - 22, 52, 11, 442, PATCH, 0.95, wind=(0.0, 0.9), flicker=0.6)
    fire_patch(cv, c + 20, 54, 9, 443, PATCH, 0.95, wind=(0.0, 0.9), flicker=0.6)
    return cv


# ================================================================ J  ENEMY FIRE / GAS / WAKES

def tracer_enemy():
    """Enemy round: warm red-orange core, short tail. Distinct from the player's cream tracer."""
    cv = Canvas(96, 24)
    X, Y = cv.X / SS, cv.Y / SS
    along = smooth(0, 80, X)
    a = np.exp(-(np.abs(Y - 12) / (2.2 + 2.4 * along)) ** 2) * along * smooth(96, 84, X)
    cv.over(np.broadcast_to(hexrgb('#e2552c'), cv.rgb.shape).copy(), a * 0.5)
    line(cv, 20, 12, 88, 12, 3.6, '#ffe2b8', '#f07a3a', 1.0, taper=False)
    cv.a *= np.clip(smooth(14, 64, X) * 0.9 + np.exp(-((X - 86) ** 2) / 30) * 0.3, 0, 1)
    return cv


GAS_LIT, GAS_SHADE = '#cfcb86', '#6c6f45'


def gas_cloud(i):
    """Chlorine / phosgene cloud: low, sickly yellow-green, soft and translucent so play stays readable."""
    S = [128, 160, 224, 224][i]
    cv = Canvas(S, S)
    c = S / 2
    n = [10, 14, 22, 16][i]
    smoke_balls(cv, cluster(c, c, S * 0.28, n, S * 0.08, S * 0.16, 500 + i, squash=0.8), GAS_LIT, GAS_SHADE, 500 + i,
                [0.42, 0.42, 0.4, 0.26][i], fray=0.55, levels=3, thin=0.6)
    return cv


def mist_puff():
    cv = Canvas(128, 128)
    smoke_balls(cv, cluster(64, 64, 30, 14, 9, 17, 511), '#e6e8e4', '#9aa2a2', 511, 0.55, fray=0.5, levels=3)
    return cv


def ship_wake():
    """Stern wake from above, pointing DOWN: two foam arms spreading from the stern + churned centre."""
    cv = Canvas(128, 256)
    X, Y = cv.X / SS - 64, cv.Y / SS
    t = np.clip(Y / 256, 0, 1)
    n = noise(cv.h, cv.w, 6 * SS, 521, 4)
    f = noise(cv.h, cv.w, 3 * SS, 522, 3)
    arms = np.zeros_like(X)
    for side in (-1, 1):
        cxl = side * (6 + t * 52)
        arms = np.maximum(arms, np.exp(-((X - cxl) / (3 + t * 9)) ** 2))
    centre = np.exp(-(X / (8 + t * 16)) ** 2) * (1 - t) ** 0.8
    field = (arms * 0.9 + centre) * (1 - t) ** 0.7 * smooth(0, 10, Y)
    a = np.clip(field * smooth(0.3, 0.75, n * 0.6 + f * 0.4) * 1.3, 0, 1) * 0.9
    col = ramp(np.clip(0.5 + (X * -0.4 - Y * 0.1) / 90 + (n - 0.5) * 0.4, 0, 1), [(0, '#a9bcc0'), (1, '#f4f7f5')])
    cv.over(col, a)
    return cv


def bow_wave():
    """Bow spray crescent from above; the hull's bow sits at the lower centre."""
    cv = Canvas(160, 96)
    X, Y = cv.X / SS - 80, cv.Y / SS - 70
    d = np.sqrt((X / 1.4) ** 2 + Y ** 2)
    n = noise(cv.h, cv.w, 5 * SS, 531, 4)
    ring = np.exp(-((d - 34 + (n - 0.5) * 10) / 8) ** 2) * (Y < 8) * smooth(40, 0, np.abs(X) * 0.4 + np.clip(Y, 0, None) * 3)
    a = np.clip(ring * smooth(0.3, 0.7, n) * 1.4, 0, 1) * 0.9
    col = ramp(np.clip(0.55 - Y / 80 + (n - 0.5) * 0.4, 0, 1), [(0, '#b0c3c6'), (1, '#f6f8f6')])
    cv.over(col, a)
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
    # E
    **{f'cowImpact{i}': (lambda i=i: cannon_impact(i, True)) for i in range(4)},
    **{f'moteurImpact{i}': (lambda i=i: cannon_impact(i, False)) for i in range(4)},
    # F
    **{f'bossBlast{i}': (lambda i=i: boss_blast(i)) for i in range(4)},
    **{f'structure{i}': (lambda i=i: structure_blast(i)) for i in range(4)},
    # G
    'flak': flak, 'shockRing': shock_ring,
    # H
    'navalSplash3': naval_splash, 'navalFoam3': naval_foam,
    # I
    'dustPuff': dust_puff, 'dirtBurst': dirt_burst, 'fireWing': fire_wing,
    # J
    'tracerEnemy': tracer_enemy, **{f'gasCloud{i}': (lambda i=i: gas_cloud(i)) for i in range(4)},
    'mistPuff': mist_puff, 'shipWake3': ship_wake, 'shipBow3': bow_wave,
}

FAMILY = {
    'A': ['muzzle', 'muzzleTwin', 'muzzleHeavy', 'muzzleRear', 'tracerCore', 'tracerGlow', 'spark', 'hitPuff'],
    'B': ['rocketFlame', 'rocketTrail'] + [f'lePrieurImpact{i}' for i in range(4)],
    'C': ['bombShadow'] + [f'mortarImpact{i}' for i in range(4)] + ['debrisShard', 'smokeHeavy'],
    'D': [f'pop{i}' for i in range(4)] + [f'airblast{i}' for i in range(4)] +
         ['fireEngine', 'fireFlash', 'fireGround', 'flameJet', 'smokeTrail', 'smokePuff', 'smokeGray', 'smokeDark'],
    'E': [f'cowImpact{i}' for i in range(4)] + [f'moteurImpact{i}' for i in range(4)],
    'F': [f'bossBlast{i}' for i in range(4)] + [f'structure{i}' for i in range(4)],
    'G': ['flak', 'shockRing', 'navalSplash3', 'navalFoam3', 'dustPuff', 'dirtBurst', 'fireWing'],
    'J': ['tracerEnemy'] + [f'gasCloud{i}' for i in range(4)] + ['mistPuff', 'shipWake3', 'shipBow3'],
}


def pack(images, width=2048, pad=2):
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
    manifest = {'version': 7, 'image': 'fx-sample-atlas.webp', 'size': [atlas.shape[1], atlas.shape[0]],
                'families': FAMILY, 'rects': {k: list(map(int, v)) for k, v in rects.items()}}
    json.dump(manifest, open(os.path.join(outdir, 'fx-sample.json'), 'w'), indent=1)
    print('atlas', atlas.shape, 'webp', len(buf) // 1024, 'KB')


if __name__ == '__main__':
    main()
