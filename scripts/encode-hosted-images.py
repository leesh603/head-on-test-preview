"""High-quality hosted WebP encoding. Keep all source PNG files unchanged."""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import sys,io
root=Path(sys.argv[1]);source=root/'dist';target=source/'client'
retired={'pilots.png','pilot-cutouts.png','legendary-icons83.png'}
paths=[p for p in source.glob('*.png') if p.name not in retired]+list((source/'augmentation-icons').glob('*.png'))
def encode(p):
    out=target/(str(p.relative_to(source))+'.webp');out.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(p) as im:
        # High-quality WebP keeps cockpit/portrait detail while staying small
        # enough for reliable Sites publication and mobile loading.
        buffer=io.BytesIO();im.save(buffer,'WEBP',quality=92,method=6,exact=True)
        payload=buffer.getvalue();assert payload.startswith(b'RIFF') and len(payload)>20
        out.write_bytes(payload)
        with Image.open(out) as check: check.load()
    return p.stat().st_size,out.stat().st_size
with ThreadPoolExecutor(max_workers=4) as pool: sizes=list(pool.map(encode,paths))
print(f'Hosted image payload: {sum(x for x,y in sizes)/1048576:.1f} MiB -> {sum(y for x,y in sizes)/1048576:.1f} MiB ({len(paths)} images)')
