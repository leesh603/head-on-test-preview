"""Presentation sheets for the FX sample round.
    python3 sheets.py <stage_dir> <out_dir>
  fx-sample-atlas-sheet.png   every sprite by family, on neutral + on real terrain
  fx-scene-<id>.png           current vs sample, same staged moment, + 2x detail
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
stage, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)
FB = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
FR = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'


def font(size, bold=False):
    return ImageFont.truetype(FB if bold else FR, size, index=1)  # index 1 = KR


BG, INK, SUB, LINE = (16, 16, 15), (240, 236, 226), (160, 156, 146), (46, 45, 42)

# ---------------------------------------------------------------- atlas sheet
man = json.load(open(os.path.join(ROOT, 'fx-sample', 'fx-sample.json')))
atlas = Image.open(os.path.join(ROOT, 'fx-sample', 'fx-sample-atlas.png')).convert('RGBA')
terrain = Image.open(os.path.join(stage, 'old-mg-0.png')).convert('RGB').resize((1280, 720))
TITLES = {'A': ('A  기관총', '총구섬광 · 탄궤적 · 탄착'), 'B': ('B  로켓', '분사 화염 · 비행 트레일 · 피격 폭발 4단'),
          'C': ('C  폭탄', '낙하 그림자 · 지면 폭발 4단 · 파편 · 잔연기'),
          'D': ('D  화염 · 폭발 · 연기', '소형 4단 · 중형 4단 · 엔진 화염 · 섬광 · 지면 화염 · 화염분출 · 연기'),
          'E': ('E  기관포', 'COW 37mm 피격 4단 · 모터 캐논 피격 4단'),
          'F': ('F  대형 폭발', '폭격기·보스 격추 4단 · 지상 구조물 파괴 4단'),
          'G': ('G  대공포 · 수면 · 기타', '대공포 공중폭발 · 충격파 · 물보라 · 포말 · 흙먼지 · 흙 튐 · 날개 화재'),
          'J': ('J  적 탄 · 가스 · 항적', '적 트레이서 · 독가스 4종 · 안개 · 선미 항적 · 선수 물보라')}
W = 2000
blocks = []
for fam, keys in man['families'].items():
    cells = []
    for k in keys:
        x, y, w, h = man['rects'][k]
        im = atlas.crop((x, y, x + w, y + h))
        z = 2 if max(w, h) <= 96 else 1
        im = im.resize((w * z, h * z), Image.LANCZOS)
        cw, ch = max(im.width, 150) + 24, im.height + 24
        card = Image.new('RGB', (cw, ch * 2 + 30), BG)
        a = Image.new('RGBA', (cw, ch), (58, 64, 70, 255)); a.alpha_composite(im, ((cw - im.width) // 2, 12))
        b = terrain.crop((300, 200, 300 + cw, 200 + ch)).convert('RGBA'); b.alpha_composite(im, ((cw - im.width) // 2, 12))
        card.paste(a.convert('RGB'), (0, 30)); card.paste(b.convert('RGB'), (0, 30 + ch))
        ImageDraw.Draw(card).text((4, 4), k + (' ×2' if z == 2 else ''), fill=SUB, font=font(15))
        cells.append(card)
    # flow layout
    x = y = rowh = 0
    pos = []
    for c in cells:
        if x + c.width > W - 40:
            x, y, rowh = 0, y + rowh + 12, 0
        pos.append((x, y)); x += c.width + 12; rowh = max(rowh, c.height)
    bh = y + rowh + 70
    blk = Image.new('RGB', (W, bh), BG)
    d = ImageDraw.Draw(blk)
    d.text((20, 12), TITLES[fam][0], fill=INK, font=font(28, True))
    d.text((20 + d.textlength(TITLES[fam][0], font=font(28, True)) + 18, 20), TITLES[fam][1], fill=SUB, font=font(18))
    for c, (px, py) in zip(cells, pos):
        blk.paste(c, (20 + px, 60 + py))
    blocks.append(blk)
head = Image.new('RGB', (W, 110), BG)
d = ImageDraw.Draw(head)
d.text((20, 18), 'HEAD-ON FX 시안 · 스프라이트 아틀라스', fill=INK, font=font(36, True))
d.text((20, 68), '각 칸 위: 중립 배경 / 아래: 실제 지형 · 작은 스프라이트는 2배 확대 · 원본 fx-sample/fx-sample-atlas.webp (2048×2048) · 3차 (폭발 재작업)',
       fill=SUB, font=font(18))
sheet = Image.new('RGB', (W, head.height + sum(b.height for b in blocks) + 10 * len(blocks)), BG)
sheet.paste(head, (0, 0)); yy = head.height
for b in blocks:
    ImageDraw.Draw(sheet).line((20, yy, W - 20, yy), fill=LINE, width=1)
    sheet.paste(b, (0, yy + 6)); yy += b.height + 10
sheet.save(os.path.join(out, 'fx-sample-atlas-sheet.png'))
print('atlas sheet', sheet.size)

# ---------------------------------------------------------------- scenes
SCENES = [
    ('mg', 1, '기관총 — 비행 중 사격', '총구섬광 · 탄궤적(트레이서) · 탄착 스파크', (1060, 320, 1500, 820)),
    ('rocket', 1, '로켓 — 발사 · 비행 · 피격', '분사 화염 + 연기 트레일 · 피격 폭발 3단계(좌→우)', (800, 60, 1760, 760)),
    ('bomb', 1, '폭탄 — 투하 · 폭발 · 잔연기', '낙하(그림자) · 지면 폭발 4단계를 한 화면에 나란히 배치', (600, 100, 1400, 700)),
    ('fire', 1, '화염 · 폭발 · 연기', '격추 폭발 4단계(좌→우) · 소형 폭발 · 지면 화염', (600, 60, 1560, 540)),
    ('heavy', 1, '기관포 · 대형 폭발', '왼쪽: COW/모터 캐논 피격 · 오른쪽: 폭격기급 격추 · 구조물 파괴', (1400, 40, 2140, 640)),
    ('naval', 1, '수면 — 포탄 · 기관총 착탄', '물보라 3단계 · 기뢰 · 기관총 착탄 물튐 (아드리아해)', (600, 40, 1560, 640)),
]
CW, CH = 1600, 840
for sid, idx, title, sub, zoom in SCENES:
    Wd, Hd = 2560, 1440
    box = (Wd // 2 - CW // 2, Hd // 2 - 660, Wd // 2 + CW // 2, Hd // 2 - 660 + CH)
    old = Image.open(os.path.join(stage, f'old-{sid}-{idx}.png')).convert('RGB').crop(box)
    new = Image.open(os.path.join(stage, f'new-{sid}-{idx}.png')).convert('RGB').crop(box)
    zx0, zy0, zx1, zy1 = zoom
    zb = (zx0 - box[0], zy0 - box[1], zx1 - box[0], zy1 - box[1])
    def zoomed(img):
        z = img.crop(zb)
        k = min(760 / z.width, 700 / z.height, 2.0)
        return z.resize((int(z.width * k), int(z.height * k)), Image.LANCZOS)
    zo, zn = zoomed(old), zoomed(new)
    pad = 24
    Wt = CW + pad * 3 + max(zn.width, 380)
    Ht = 120 + (CH + 56) * 2
    img = Image.new('RGB', (Wt, Ht), BG)
    d = ImageDraw.Draw(img)
    d.text((pad, 18), title, fill=INK, font=font(38, True))
    d.text((pad, 72), sub + '  ·  실제 게임 렌더러로 그린 화면(연출 타이밍만 고정)', fill=SUB, font=font(20))
    for r, (lab, full, zz) in enumerate([('현재', old, zo), ('시안', new, zn)]):
        y = 120 + r * (CH + 56)
        d.text((pad, y + 6), lab, fill=INK if r else SUB, font=font(26, True))
        img.paste(full, (pad, y + 46))
        img.paste(zz, (pad * 2 + CW, y + 46))
        d.rectangle((pad * 2 + CW, y + 46, pad * 2 + CW + zz.width - 1, y + 46 + zz.height - 1), outline=LINE)
        d.text((pad * 2 + CW, y + 12), '확대', fill=SUB, font=font(18))
    img.save(os.path.join(out, f'fx-scene-{sid}.png'))
    print('scene', sid, img.size)
