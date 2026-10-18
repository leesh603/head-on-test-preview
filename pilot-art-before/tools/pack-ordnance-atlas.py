"""Lossless packaging and alpha measurement of the approved generated atlas, no artwork editing."""
from pathlib import Path
import sys,json
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
im=Image.open(sys.argv[1]).convert('RGBA');a=np.array(im.getchannel('A'))>32
assert im.size==(1536,1024)
frames={}
for i,kind in enumerate(['moteur','cow','shell','bomb','grenade']):
 y0,y1=[0,190,390,595,805,1024][i:i+2]
 def bounds(x0,x1):
  yy,xx=np.where(a[y0:y1,x0:x1]);l=x0+int(xx.min())-2;t=y0+int(yy.min())-2;r=x0+int(xx.max())+3;b=y0+int(yy.max())+3
  return [max(x0,l),max(y0,t),min(x1,r)-max(x0,l),min(y1,b)-max(y0,t)]
 body=bounds(250,[620,640,685,650,600][i]);flight=bounds([630,650,700,655,700][i],1280)
 core=bounds([962,940,880,889,995][i],1280)
 frames[kind]={'body':body,'flight':flight,'anchor':[core[0]+core[2]/2-flight[0],core[1]+core[3]/2-flight[1]]}
 print(kind,frames[kind])
im.save(root/'fx-ordnance-body-flight.webp','WEBP',lossless=True,exact=True)
(root/'ordnance-atlas.js').write_text('// Offline measured alpha frames and body-centered anchors.\nexport const ORDNANCE_FRAMES='+json.dumps(frames,separators=(',',':'))+';\n')
