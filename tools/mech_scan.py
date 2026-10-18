import sys,glob,os,json

sys.path.insert(0,'.')

import numpy as np

from PIL import Image

import fix_roundels as fr

from scipy import ndimage



def mech_boxes(p):

    im=np.array(Image.open(p).convert('RGBA'))

    a=im[...,3]>40

    bands,mw=fr.wing_bands(a);cx=fr.fuselage_cx(a)

    if len(bands)<2: return []

    half=im.shape[1]/2

    rgb=im[...,:3].astype(int); luma=rgb.mean(-1); sat=rgb.max(-1)-rgb.min(-1)

    R,G,B=rgb[...,0],rgb[...,1],rgb[...,2]

    out=[]

    for y0,y1 in bands[1:]:

        if len(bands)>=3 and (y0+y1)/2>0.78*bands[-1][1]: continue

        fl=np.median(luma[y0:y1+1][a[y0:y1+1]])

        cand={

         'navy': (B-R>15)&(B>G+8)&(luma<140),

         'dark': (luma<fl-60)&(sat<45),

         'red':  (R-B>45)&(R-G>35)&(luma<fl+10),

        }

        for name,raw in cand.items():

            m=a&raw

            m=ndimage.binary_closing(m,np.ones((5,5)))

            lab,n=ndimage.label(m)

            for i in range(1,n+1):

                ys,xs=np.where(lab==i)

                w=xs.max()-xs.min()+1;h=ys.max()-ys.min()+1

                cy=(ys.min()+ys.max())/2;cx2=(xs.min()+xs.max())/2

                if len(ys)<120 or len(ys)>20000: continue

                if not (y0-16<=cy<=y1+16): continue

                if w<18 or h<18 or w>150 or h>150 or w/h>1.7 or h/w>1.7: continue

                if abs(cx2-cx)<=0.20*half: continue

                box=(int(xs.min())-6,int(ys.min())-6,int(xs.max())+6,int(ys.max())+6)

                if any(abs(box[0]-b[0])<20 and abs(box[1]-b[1])<20 for b in out): continue

                out.append(box)

    return out





def pair_filter(boxes, W, cx):

    # keep only boxes that form a mirrored L/R pair (real markings come in pairs)

    keep=set()

    for i,b in enumerate(boxes):

        bcx=(b[0]+b[2])/2; bcy=(b[1]+b[3])/2; bw=b[2]-b[0]; bh=b[3]-b[1]

        for j,c in enumerate(boxes):

            if j==i: continue

            ccx=(c[0]+c[2])/2; ccy=(c[1]+c[3])/2; cw=c[2]-c[0]; ch=c[3]-c[1]

            if abs(ccy-bcy)>30: continue

            if abs(bcx+ccx-2*cx)>70: continue

            if max(bw/cw,cw/bw)>2.1 or max(bh/ch,ch/bh)>2.1: continue

            keep.add(i); keep.add(j)

    return [b for i,b in enumerate(boxes) if i in keep]



def merge_boxes(boxes):

    changed=True

    while changed:

        changed=False; res=[]

        used=[False]*len(boxes)

        for i,b in enumerate(boxes):

            if used[i]: continue

            x0,y0,x1,y1=b

            for j in range(i+1,len(boxes)):

                if used[j]: continue

                c=boxes[j]

                ox=min(x1,c[2])-max(x0,c[0]); oy=min(y1,c[3])-max(y0,c[1])

                if ox>-14 and oy>-14:

                    x0=min(x0,c[0]);y0=min(y0,c[1]);x1=max(x1,c[2]);y1=max(y1,c[3])

                    used[j]=True;changed=True

            used[i]=True;res.append((x0,y0,x1,y1))

        boxes=res

    return res


if __name__=='__main__':

    hits={}

    for p in sorted(glob.glob('../mech/*.webp')):

        try:

            b=mech_boxes(p)

        except Exception as e:

            print(p,'ERR',e);b=[]

        if b:

            b=merge_boxes(b)

            im=np.array(Image.open(p).convert('RGBA'))

            # patterned fabric (lozenge camo) produces symmetric noise blobs ?

            # skip those files for a manual pass instead of mis-erasing.

            a=im[...,3]>40; bands,_=fr.wing_bands(a)


            cx=fr.fuselage_cx(a)

            b2=pair_filter(b,im.shape[1],cx)

            

            if b2: hits[p]=b2

    print(len(hits),'files with hits')

    for k,v in hits.items(): print(' ',os.path.basename(k),v)

    json.dump(hits,open('../_draft/mech_hits.json','w'))



