"""Contact sheet for FX cells: each sprite on real terrain (2x) and on flat grey.
    python3 review.py <cell_dir> <terrain.png> <out.png> [prefix,...]
"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

cells_dir, terrain_path, out_path = sys.argv[1:4]
prefixes = sys.argv[4].split(',') if len(sys.argv) > 4 else None
terrain = Image.open(terrain_path).convert('RGB')
files = sorted(glob.glob(os.path.join(cells_dir, '_cell-*.png')))
names = [os.path.basename(f)[6:-4] for f in files]
if prefixes:
    keep = [(f, n) for f, n in zip(files, names) if any(n.startswith(p) for p in prefixes)]
    files, names = [k[0] for k in keep], [k[1] for k in keep]
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception:
    font = ImageFont.load_default()
tiles = []
for f, n in zip(files, names):
    im = Image.open(f).convert('RGBA')
    z = 2 if max(im.size) <= 128 else 1
    im2 = im.resize((im.width * z, im.height * z), Image.LANCZOS)
    w, h = max(im2.width, 200) + 20, im2.height + 20
    bg = terrain.crop((200, 150, 200 + w, 150 + h)).convert('RGBA')
    bg.alpha_composite(im2, ((w - im2.width) // 2, 10))
    grey = Image.new('RGBA', (w, h), (64, 72, 80, 255))
    grey.alpha_composite(im2, ((w - im2.width) // 2, 10))
    t = Image.new('RGB', (w, h * 2 + 22), (18, 18, 17))
    t.paste(bg.convert('RGB'), (0, 22))
    t.paste(grey.convert('RGB'), (0, 22 + h))
    ImageDraw.Draw(t).text((6, 3), f'{n}  {im.width}x{im.height}', fill=(230, 225, 210), font=font)
    tiles.append(t)
W = 1600
x = y = rowh = 0
pos = []
for t in tiles:
    if x + t.width > W:
        x, y, rowh = 0, y + rowh + 8, 0
    pos.append((x, y))
    x += t.width + 8
    rowh = max(rowh, t.height)
sheet = Image.new('RGB', (W, y + rowh), (10, 10, 10))
for t, p in zip(tiles, pos):
    sheet.paste(t, p)
sheet.save(out_path)
print(out_path, sheet.size)
