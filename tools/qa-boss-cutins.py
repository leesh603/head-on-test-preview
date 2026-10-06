"""Audit every playable boss cut-in and build desktop/mobile composition sheets.

Run from the repository root. This verifies local images, not browser gameplay.
"""
import json, re, subprocess
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parent.parent
out=root/'qa/boss-cutins';out.mkdir(parents=True,exist_ok=True)
rows=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {BOSS_CATALOG} from './headon-stageboss-patterns.js';import {BOSS_CUTIN_ART,REDRAWN_BOSS_CUTINS} from './boss-cutin-art.js';console.log(JSON.stringify(Object.entries(BOSS_CATALOG).map(([id,b])=>({id,name:b.name,stage:b.stage,file:BOSS_CUTIN_ART[id].split('?')[0],redrawn:!!REDRAWN_BOSS_CUTINS[id]}))))"],cwd=root))
sheet=Image.new('RGB',(1400,1200),'#343b34');draw=ImageDraw.Draw(sheet)
cards=Image.new('RGB',(810,sum(r['redrawn'] for r in rows)*360),'#343b34');cd=ImageDraw.Draw(cards)
j=0
for i,r in enumerate(rows):
    im=Image.open(root/r['file']).convert('RGBA');a=im.getchannel('A')
    edge=a.crop((0,0,im.width,1)).tobytes()+a.crop((0,im.height-1,im.width,im.height)).tobytes()+a.crop((0,0,1,im.height)).tobytes()+a.crop((im.width-1,0,im.width,im.height)).tobytes()
    r.update(size=list(im.size),alphaRange=list(a.getextrema()),opaqueEdgePixels=sum(v>32 for v in edge),bytes=(root/r['file']).stat().st_size)
    if r['redrawn']:
        assert a.getextrema()[0]==0,r['id']
        assert r['opaqueEdgePixels']==0,r['id']
    art=im.copy();art.thumbnail((220,158),Image.Resampling.LANCZOS)
    x=(i%6)*233;y=(i//6)*200
    sheet.paste(art,(x+(230-art.width)//2,y+160-art.height),art)
    draw.text((x+5,y+166),r['id'],fill='white');draw.text((x+5,y+182),'NEW' if r['redrawn'] else 'kept',fill='#aec7ad')
    if r['redrawn']:
        for x,y,w,h,label in [(10,j*360+15,470,286,'desktop'),(535,j*360+130,226,134,'mobile')]:
            art=im.copy();art.thumbnail((w,h),Image.Resampling.LANCZOS)
            cards.paste(art,(x+w-art.width,y+h-art.height),art)
            cd.text((x,y+h+8),r['id']+' / '+label,fill='white')
        j+=1
sheet.save(out/'all-area-bosses.webp',quality=95)
cards.save(out/'desktop-mobile.webp',quality=95)
for page,y in enumerate(range(0,cards.height,1440)):
    cards.crop((0,y,810,min(cards.height,y+1440))).save(out/f'cards-{page}.webp',quality=95)
# The ace arrival path uses this portrait registry; do not replace its coherent style.
portraits=json.loads(subprocess.check_output(['node','--input-type=module','-e',"globalThis.Image=class {set src(v){queueMicrotask(()=>this.onload?.())}};const {portraitSources}=await import('./portraits.js');console.log(JSON.stringify(portraitSources))"],cwd=root))
aces=[{'id':id,'file':file.split('?')[0],'exists':(root/file.split('?')[0]).is_file()} for id,file in portraits.items()]
assert all(r['exists'] for r in aces)
(out/'ace-audit.json').write_text(json.dumps(aces,ensure_ascii=False,indent=2))
aceSheet=Image.new('RGB',(1280,((len(aces)+7)//8)*200),'#343b34');ad=ImageDraw.Draw(aceSheet)
for i,r in enumerate(aces):
    im=Image.open(root/r['file']).convert('RGBA');im.thumbnail((150,170),Image.Resampling.LANCZOS);x=i%8*160;y=i//8*200
    aceSheet.paste(im,(x+(160-im.width)//2,y+170-im.height),im);ad.text((x+3,y+178),r['id'],fill='white')
aceSheet.save(out/'ace-existing.webp',quality=90)
(out/'after.json').write_text(json.dumps({'areaBossCount':len(rows),'redrawnCount':j,'acePortraitCount':len(aces),'images':rows,'verification':'Local file/alpha audit and CSS-sized composition; not browser/device gameplay'},ensure_ascii=False,indent=2))
print(json.dumps({'bosses':len(rows),'redrawn':j,'aces':len(aces),'edgePixels':{r['id']:r['opaqueEdgePixels'] for r in rows if r['redrawn']}}))
