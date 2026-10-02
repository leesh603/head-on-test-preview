"""Pre-deploy asset integrity check: every static file referenced by js/html/css must exist.
Run: python asset-check.py — exits 1 and prints missing refs if any are broken."""
import re, os, glob, sys

refs = {}
for f in glob.glob('*.js') + glob.glob('*.html') + glob.glob('*.css'):
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r"""["'\(]\.?/?([A-Za-z0-9_\-/]+\.(?:webp|png|jpg|jpeg|mp3|ogg|wav))""", s):
        refs.setdefault(m.group(1), f)

SKIP_DIRS = ('augmentation-icons/', 'sounds/', 'audio/', 'mech/')
missing = []
for r, src in sorted(refs.items()):
    p = r.split('?')[0]
    if p in ('this.wav',):  # regex artifact from identifiers like this.waveQueue
        continue
    if os.path.exists(p):
        continue
    if any(os.path.exists(d + p) for d in SKIP_DIRS):
        continue
    missing.append((r, src))

if missing:
    print('MISSING ASSET REFS:')
    for r, src in missing:
        print(f'  {r}  (referenced in {src})')
    sys.exit(1)

# Dynamic sprite pools: keys quoted inside HEAVY_BOMBERS*/HEAVY_BOMBERS_SEA lists
# resolve to ./<key>.webp at draw time (drawFieldArt). Verify each exists.
pool_missing = []
eng = open('engine.js', encoding='utf-8', errors='ignore').read() if os.path.exists('engine.js') else ''
for m in re.finditer(r"HEAVY_BOMBERS(?:_SEA)?\s*=\s*\{(.*?)\}", eng, re.S):
    for key in re.findall(r"'([a-z0-9_\-]+)'", m.group(1)):
        if not os.path.exists(key + '.webp'):
            pool_missing.append(key)
pool_missing = sorted(set(pool_missing))
if pool_missing:
    print('MISSING POOL SPRITES (HEAVY_BOMBERS keys → .webp):')
    for k in pool_missing:
        print(f'  {k}.webp')
    sys.exit(1)

print(f'asset check ok — {len(refs)} references verified, pool keys ok')
