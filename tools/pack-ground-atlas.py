"""Package generated RGBA sources losslessly and measure atlas frames; never draw artwork.
Usage: python tools/pack-ground-atlas.py entente-vehicles.png entente-defenses.png central-vehicles.png central-defenses.png
"""
import sys,json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
sheets={};frames={'entente':{},'central':{}}
for i,src in enumerate(sys.argv[1:]):
 faction=['entente','central'][i//2];family=['vehicles','defenses'][i%2];key=f'{faction}-{family}'
 im=Image.open(src).convert('RGBA');alpha=np.array(im.getchannel('A'));occupied=alpha>32
 ix=np.where(occupied.sum(1)>10)[0];runs=[g for g in np.split(ix,np.where(np.diff(ix)>1)[0]+1) if len(g)]
 kinds=['aa','aatank','tank','railgun'] if family=='vehicles' else ['light','mg','gun']
 assert len(runs)==len(kinds),(src,len(runs))
 cuts=[0]+[(int(a[-1])+int(b[0]))//2 for a,b in zip(runs,runs[1:])]+[im.height]
 cols=[0,362,724,1086] if im.width==1086 else ([0,349,687,1024] if faction=='entente' else [0,349,680,1024])
 assert cols[-1]==im.width
 for ri,kind in enumerate(kinds):
  frames[faction][kind]=[]
  for st in range(3):
   x0,x1=cols[st:st+2];y0,y1=cuts[ri:ri+2];ys,xs=np.where(occupied[y0:y1,x0:x1]);assert len(xs)>100
   l=max(x0,x0+int(xs.min())-2);r=min(x1,x0+int(xs.max())+3);t=max(y0,y0+int(ys.min())-2);b=min(y1,y0+int(ys.max())+3)
   frames[faction][kind].append({'key':key,'rect':[l,t,r-l,b-t]})
 name=f'ground-{key}.webp';im.save(root/name,'WEBP',lossless=True,exact=True);sheets[key]=name
(root/'ground-enemy-atlas.js').write_text('// Measured alpha bounds of generated sprites; no runtime pixel scanning.\nexport const GROUND_SHEETS='+json.dumps(sheets,separators=(',',':'))+';\nexport const GROUND_FRAMES='+json.dumps(frames,separators=(',',':'))+';\n')
print('Packed',len(sheets),'lossless atlases and',sum(len(v) for f in frames.values() for v in f.values()),'frames')
