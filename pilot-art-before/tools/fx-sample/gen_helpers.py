import numpy as np

R = np.random.default_rng


def cluster(cx, cy, spread, n, rmin, rmax, seed, squash=1.0, bias_up=0.0):
    r = R(seed)
    out = []
    for i in range(n):
        a = r.uniform(0, 2 * np.pi)
        d = spread * np.sqrt(r.uniform(0, 1))
        rr = r.uniform(rmin, rmax) * (1 - 0.35 * d / max(spread, 1e-6))
        out.append((cx + np.cos(a) * d, cy + np.sin(a) * d * squash - bias_up * (1 - d / max(spread, 1e-6)), rr))
    return out
