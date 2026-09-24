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
print(f'asset check ok — {len(refs)} references verified')
