# Batch lower-wing roundel removal for asset-bank sprites.
# Detects national markings (roundels/crosses/stars) painted on the wrong wing:
# keeps markings on the TOP wing pair only, erases markings on any lower wing.
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def wing_bands(a):
    w_ = a.sum(1); mw = w_.max()
    rows = w_ > 0.5*mw
    bands=[]; s=None
    for y,v in enumerate(rows):
        if v and s is None: s=y
        if not v and s is not None: bands.append((s,y-1)); s=None
    if s is not None: bands.append((s,len(rows)-1))
    return [b for b in bands if b[1]-b[0] > 20], mw

def fuselage_cx(a):
    colsum = a.sum(0)
    cx = int(np.argmax(colsum))
    return cx

def marking_mask(im, band=None):
    rgb = im[...,:3].astype(int); a = im[...,3]>40
    if band is not None:
        y0,y1 = band
        zone = rgb[y0:y1+1][a[y0:y1+1]]
    else:
        zone = rgb[a]
    if len(zone)<100: return np.zeros(im.shape[:2],bool),0,0
    med = np.median(zone,axis=0)
    diff = np.abs(rgb-med).sum(-1)
    luma = rgb.mean(-1); fl = np.median(luma[a])
    m = (diff>90)|((luma-fl)>60)|((fl-luma)>70)
    return m & a, med, fl

def blobs(m, min_area=350, max_area=60000):
    lab,n = ndimage.label(m)
    out=[]
    for i in range(1,n+1):
        ys,xs = np.where(lab==i)
        if len(ys)<min_area or len(ys)>max_area: continue
        w = xs.max()-xs.min()+1; h = ys.max()-ys.min()+1
        if w<18 or h<18 or w>240 or h>240: continue
        if w/h>2.8 or h/w>2.8: continue
        out.append({'x0':xs.min(),'x1':xs.max(),'y0':ys.min(),'y1':ys.max(),
                    'cx':(xs.min()+xs.max())/2,'cy':(ys.min()+ys.max())/2,'area':len(ys)})
    return out

def paired_clusters(bl, cx, img_w):
    # group blobs that have a mirror twin (roundel pairs are symmetric)
    used=set(); clusters=[]
    bl2 = sorted(bl, key=lambda b:b['cy'])
    for i,b in enumerate(bl2):
        if i in used: continue
        grp=[b]; used.add(i)
        for j,c in enumerate(bl2):
            if j in used or j==i: continue
            if abs(c['cy']-b['cy'])<35 and abs((c['cx']+b['cx'])-2*cx)<90:
                grp.append(c); used.add(j)
        clusters.append(grp)
    return clusters

def band_markings(im, band, cx, half):
    # find roundel-like blobs inside ONE wing band.
    # roundels/crosses = compact saturated OR extreme-luma discs; thin struts
    # get disconnected by a light opening op before labeling.
    a = im[...,3]>40
    y0,y1 = band
    rgb = im[...,:3].astype(int)
    zone = rgb[y0:y1+1][a[y0:y1+1]]
    if len(zone)<300: return []
    sat = rgb.max(-1)-rgb.min(-1)
    luma = rgb.mean(-1); fl = np.median(luma[y0:y1+1][a[y0:y1+1]])
    scale = im.shape[1]/1393.0  # thresholds tuned on ~1393px sprites
    m = ((sat>90)|((fl-luma)>70)|((luma-fl)>65)) & a
    if fl<70:
        # dark fabric (night liveries): roundels are low-contrast grey — catch
        # them with a looser luma band; thin rib/strut lines still die in the
        # aspect and fill filters below.
        m = m | ((np.abs(luma-fl)>28) & a)
    if m.sum() < 0.004*max(1,a.sum()):
        # small/muted sprites (e.g. mech/*): markings are desaturated — retry
        # with looser color thresholds before concluding the band is clean.
        m = ((sat>48)|((fl-luma)>42)|((luma-fl)>38)) & a
    m = ndimage.binary_closing(m, structure=np.ones((5,5)))
    lab,n = ndimage.label(m)
    out=[]
    for i in range(1,n+1):
        ys,xs=np.where(lab==i)
        if len(ys)<250*scale*scale or len(ys)>40000*scale*scale: continue
        cy=(ys.min()+ys.max())/2
        # blob center must fall in THIS band (bbox may extend past it for clipped marks)
        if not (y0-12 <= cy <= y1+12): continue
        w=xs.max()-xs.min()+1; h=ys.max()-ys.min()+1
        if w<22*scale or h<22*scale or w>190*scale or h>190*scale: continue
        if w/h>2.0 or h/w>2.0: continue
        fill=len(ys)/(w*h)
        if abs((xs.min()+xs.max())/2-cx) <= 0.18*half: continue
        pat = _surround_patterned(im, xs.min(),ys.min(),xs.max(),ys.max(), a)
        if pat:
            # lozenge/camo false positives: on patterned wings a real marking is
            # painted on top = flat-colored interior over multi-colored fabric.
            if w<60*scale or fill<0.38 or not _painted_blob(im, ys, xs, xs.min(),ys.min(),xs.max(),ys.max(), a):
                continue
        elif fill<0.25:
            # plain wing: crosses/stars have thin arms — lower fill is fine
            continue
        out.append({'x0':xs.min(),'x1':xs.max(),'y0':ys.min(),'y1':ys.max(),
                    'cx':(xs.min()+xs.max())/2,'cy':cy,'area':len(ys)})
    return out

def _surround_patterned(im, x0,y0,x1,y1, a):
    # high edge density around the blob = the wing is patterned fabric
    H,W=im.shape[:2]; pad=16
    lx=max(0,x0-pad); rx=min(W,x1+pad); ty=max(0,y0-pad); by=min(H,y1+pad)
    m=a[ty:by,lx:rx].copy()
    y0c,y1c=y0-ty,y1-ty+1; x0c,x1c=x0-lx,x1-lx+1
    m[max(0,y0c-4):y1c+4, max(0,x0c-4):x1c+4]=False
    rgb=im[ty:by,lx:rx,:3].astype(float)
    g=np.zeros(m.shape); g[:,1:]+=np.abs(np.diff(rgb,axis=1)).sum(-1); g[1:,:]+=np.abs(np.diff(rgb,axis=0)).sum(-1)
    cnt=m.sum()
    if cnt<200: return False
    return (g>60)[m].mean()>0.08

def _painted_blob(im, ys,xs, x0,y0,x1,y1, a):
    # blob interior dominated by one flat color, surround is not
    pin=im[ys,xs,:3].astype(float)
    med=np.median(pin,axis=0)
    frac_in=(np.abs(pin-med).sum(1)<120).mean()
    H,W=im.shape[:2]; pad=16
    lx=max(0,x0-pad); rx=min(W,x1+pad); ty=max(0,y0-pad); by=min(H,y1+pad)
    m=a[ty:by,lx:rx].copy()
    y0c,y1c=y0-ty,y1-ty+1; x0c,x1c=x0-lx,x1-lx+1
    m[max(0,y0c-4):y1c+4, max(0,x0c-4):x1c+4]=False
    pout=im[ty:by,lx:rx,:3][m].astype(float)
    if len(pout)<100: return True
    frac_out=(np.abs(pout-med).sum(1)<120).mean()
    return frac_in>0.68 and frac_out<0.5

def _grow_box(im, box, m, a, max_grow=42):
    # expand box while its rim still sits on marking-colored pixels so the
    # pale outer ring of a roundel gets fully enclosed.
    H,W=im.shape[:2]
    x0,y0,x1,y1=map(int,box)
    def rim_dirty(x0,y0,x1,y1):
        xs=[(x0,y0,x0,y1),(x1,y0,x1,y1),(x0,y0,x1,y0),(x0,y1,x1,y1)]
        dirty=0;tot=0
        for a0,b0,a1,b1 in xs:
            seg=m[b0:b1+1, a0:a1+1] if a0==a1 else m[b0:b1+1, a0:a1+1]
            dirty+=seg.sum(); tot+=seg.size
        return tot and dirty/tot>0.18
    for _ in range(max_grow//4):
        nx0,ny0,nx1,ny1=max(0,x0-4),max(0,y0-4),min(W-1,x1+4),min(H-1,y1+4)
        if rim_dirty(nx0,y0,x0,y1) or rim_dirty(x1,y0,nx1,y1) or rim_dirty(x0,ny0,x1,y0) or rim_dirty(x0,y1,x1,ny1):
            x0,y0,x1,y1=nx0,ny0,nx1,ny1
        else:
            break
    # margin so a roundel's pale outer rim — often too faint to flag as dirty
    # — is inside the paste zone; capped by distance to the wing edge so the
    # patch never pulls in off-wing background.
    cxm,cym = (x0+x1)//2, (y0+y1)//2
    dist = int(ndimage.distance_transform_edt(a)[cym, cxm]) if a[cym,cxm] else 4
    mg = max(8, min(40, dist-4))
    return max(0,x0-mg),max(0,y0-mg),min(W-1,x1+mg),min(H-1,y1+mg)

def detect_erase(im):
    a = im[...,3]>40
    bands,mw = wing_bands(a)
    cx = fuselage_cx(a)
    half = mw/2
    if len(bands)<2: return [],[],cx,bands
    # exclude tailplane bands: a band whose rows sit below ~78% of the alpha
    # extent is the tail, not a lower wing — tail markings are legit, keep them.
    ys=np.where(a.any(1))[0]; alpha_h=ys.max() if len(ys) else im.shape[0]
    lower_bl=[]
    for band in bands[1:]:
        if (band[0]+band[1])/2 > 0.78*alpha_h: continue
        lower_bl += band_markings(im, band, cx, half)
    clusters = paired_clusters(lower_bl, cx, im.shape[1])
    rgb=im[...,:3].astype(int)
    sat=rgb.max(-1)-rgb.min(-1); luma=rgb.mean(-1); fl=np.median(luma[a])
    m=((sat>90)|((fl-luma)>70)|((luma-fl)>55)) & a
    erase_boxes=[]
    for g in clusters:
        if len(g)<2: continue
        for b in g:
            pad=10
            box=[b['x0']-pad,b['y0']-pad,b['x1']+pad,b['y1']+pad]
            erase_boxes.append(tuple(_grow_box(im,box,m,a)))
    return erase_boxes, clusters, cx, bands

def rib_pitch(im, y0,y1, x0,x1):
    h,w,_=im.shape
    y0=max(0,y0);y1=min(h,y1);x0=max(0,x0);x1=min(w,x1)
    if x1-x0<40 or y1-y0<10: return None
    a=(im[y0:y1,x0:x1,3]>40)*1.0
    if a.sum()<500: return None
    dark=np.clip(160-im[y0:y1,x0:x1,:3].astype(int).mean(-1),0,None)
    prof=(dark*a).sum(0)/np.maximum(a.sum(0),1)
    prof=prof-np.nanmean(prof); prof=np.nan_to_num(prof)
    if len(prof)<8: return None
    ac=np.correlate(prof,prof,'full')[len(prof)-1:]
    best=None;bv=0
    for p in range(4,min(80,len(ac)-1)):
        if ac[p]>ac[p-1] and ac[p]>=ac[p+1] and ac[p]>bv:
            bv=ac[p];best=p
    return best

def _overlap(sx0,y0,pw,ph, marks):
    for mx0,my0,mx1,my1 in marks:
        if sx0 < mx1+6 and sx0+pw > mx0-6 and y0 < my1+6 and y0+ph > my0-6:
            return True
    return False

def _border_score(im, sx0,y0,pw,ph, x0e,y0e):
    # mean RGB distance between the source patch's outer rim and the
    # destination surround — low = pattern/color continues cleanly.
    h,w,_=im.shape
    if sx0<0 or sx0+pw>w: return 1e9
    s = im[y0:y0+ph, sx0:sx0+pw,:3].astype(float)
    if (im[y0:y0+ph, sx0:sx0+pw,3]<40).sum() > ph*pw*0.05: return 1e9
    srt = s[:10].reshape(-1,3); srb = s[-10:].reshape(-1,3)
    srl = s[:,:10].reshape(-1,3); srr = s[:,-10:].reshape(-1,3)
    dt = db = dl = dr = 0
    if y0e-10>=0: dt = np.abs(srt - im[y0e-10:y0e, x0e:x0e+pw,:3].astype(float).reshape(-1,3)).mean()
    if y0e+ph+10<h: db = np.abs(srb - im[y0e+ph:y0e+ph+10, x0e:x0e+pw,:3].astype(float).reshape(-1,3)).mean()
    if x0e-10>=0: dl = np.abs(srl - im[y0e:y0e+ph, x0e-10:x0e,:3].astype(float).reshape(-1,3)).mean()
    if x0e+pw+10<w: dr = np.abs(srr - im[y0e:y0e+ph, x0e+pw:x0e+pw+10,:3].astype(float).reshape(-1,3)).mean()
    return dt+db+dl+dr

def _src_mark_frac(im, sx0,y0,pw,ph, m):
    h,w,_=im.shape
    if sx0<0 or sx0+pw>w or y0<0 or y0+ph>h: return 1.0
    reg=m[y0:y0+ph, sx0:sx0+pw]
    a=im[y0:y0+ph, sx0:sx0+pw,3]>40
    return (reg&a).sum()/max(a.sum(),1)

def erase_region(im, box, cx, marks=(), m=None):
    x0,y0,x1,y1 = box
    pw,ph = x1-x0, y1-y0
    side = 'L' if (x0+x1)/2 < cx else 'R'
    # rib pitch AND pattern pitch (lozenge/camo cell width): try both.
    strip_x0 = x0-170 if side=='L' else x1+10
    strip_x1 = x0-10  if side=='L' else x1+170
    P1 = rib_pitch(im, y0, y1, strip_x0, strip_x1) or 46
    P2 = pattern_pitch(im, y0, y1, strip_x0, strip_x1)
    pitches = [P1]+([P2] if P2 and P2!=P1 else [])
    pw_pad = pw+24; ph_pad = ph+24
    x0e,y0e = x0-12, y0-12
    # inward = toward the fuselage (+x on the left wing, -x on the right)
    s = 1 if side=='L' else -1
    cands=[]
    for P in pitches:
        k = max(1,int(np.ceil(pw_pad/P)))
        for kk in range(1,k+3):
            cands.append((x0e+s*kk*P, abs(kk-k)))     # inward
            cands.append((x0e-s*kk*P, abs(kk-k)+0.5)) # outward
    # mirror on the other wing edge
    cands.append((im.shape[1]-(x0e+pw_pad), 9))
    best=None;bs=1e9
    for sx0,pen in cands:
        if _overlap(sx0,y0e,pw_pad,ph_pad,marks): continue
        # never copy from the fuselage zone (fuselage roundels live there)
        if abs(sx0+pw_pad/2-cx) < 0.24*(im.shape[1]/2): continue
        # never copy painted/marking pixels themselves
        if m is not None and _src_mark_frac(im,sx0,y0e,pw_pad,ph_pad,m)>0.15: continue
        sc=_border_score(im,sx0,y0e,pw_pad,ph_pad,x0e,y0e)+pen*8
        if sc<bs: bs=sc;best=sx0
    sx0 = best if (best is not None and bs<220) else None
    if sx0 is None:
        # fallback: row-wise interpolation between marking-free edge pixels
        for y in range(y0e, y0e+ph_pad):
            if y<0 or y>=im.shape[0]: continue
            lx,rx = x0e-2, x0e+pw_pad+1
            for _ in range(80):
                if lx<=0: break
                if (m is not None and m[y,lx]) or im[y,lx,3]<=40: lx-=1
                else: break
            for _ in range(80):
                if rx>=im.shape[1]-1: break
                if (m is not None and m[y,rx]) or im[y,rx,3]<=40: rx+=1
                else: break
            if lx<0: continue
            n=pw_pad
            opaque = im[y,x0e:x0e+n,3]>40
            if not opaque.any(): continue
            if rx>=im.shape[1]-1:
                # reached the wing edge: no right-hand clean pixel — flat fill
                im[y,x0e:x0e+n,:3][opaque] = im[y,lx,:3]
            else:
                for c in range(3):
                    im[y,x0e:x0e+n,c][opaque]=np.linspace(im[y,lx,c],im[y,rx,c],n)[opaque]
        return
    src = im[y0e:y0e+ph_pad, sx0:sx0+pw_pad].copy()
    yy,xx=np.mgrid[0:ph_pad,0:pw_pad]
    ex=pw/2+8; ey=ph/2+8
    dx=np.maximum(np.abs(xx-pw_pad/2)-ex+12,0); dy=np.maximum(np.abs(yy-ph_pad/2)-ey+12,0)
    d=np.sqrt(dx*dx+dy*dy)/12.0
    mask=np.clip(1-d,0,1)[...,None]
    dst=im[y0e:y0e+ph_pad,x0e:x0e+pw_pad]
    # blend RGB only — destination alpha is preserved exactly so the patch
    # can never paint fabric onto sky between wing rows or past the tip.
    dst[...,:3]= (src[...,:3]*mask + dst[...,:3]*(1-mask)).astype(np.uint8)
    # halo cleanup: a roundel's pale outer rim can sit just outside the box.
    # Recolor only pixels that belong to the SAME marking component in the
    # pre-erase mask and lie within 40px of the box edge — struts and other
    # markings are separate components and are never touched.
    if m is not None:
        H,W = im.shape[:2]
        hx0,hy0 = max(0,x0e-60), max(0,y0e-60)
        hx1,hy1 = min(W,x0e+pw_pad+60), min(H,y0e+ph_pad+60)
        zone_a = im[hy0:hy1,hx0:hx1,3]>40
        box_mask = np.zeros(zone_a.shape,bool)
        bx0,by0 = x0e-hx0, y0e-hy0
        box_mask[by0:by0+ph_pad, bx0:bx0+pw_pad] = True
        lab,_ = ndimage.label(m[hy0:hy1,hx0:hx1])
        cid = lab[by0+ph_pad//2, bx0+pw_pad//2]
        if cid != 0:
            near_box = ndimage.binary_dilation(box_mask, iterations=40)
            leftover = (lab==cid) & ~box_mask & zone_a & near_box
            clean = zone_a & ~m[hy0:hy1,hx0:hx1]
            if leftover.any() and clean.sum()>200:
                med = np.median(im[hy0:hy1,hx0:hx1,:3][clean],axis=0)
                im[hy0:hy1,hx0:hx1,:3][leftover] = med.astype(np.uint8)

def pattern_pitch(im, y0,y1, x0,x1):
    # dominant low-frequency horizontal period (lozenge/camo cells) in 30..200px
    h,w,_=im.shape
    y0=max(0,y0);y1=min(h,y1);x0=max(0,x0);x1=min(w,x1)
    if x1-x0<80 or y1-y0<10: return None
    a=(im[y0:y1,x0:x1,3]>40)*1.0
    if a.sum()<2000: return None
    sig=(im[y0:y1,x0:x1,:3].astype(float)*a[...,None]).sum(0)/np.maximum(a.sum(0),1)[...,None]
    sig=sig.mean(-1); sig=sig-sig.mean()
    ac=np.correlate(sig,sig,'full')[len(sig)-1:]
    ac/=max(ac[0],1)
    lo,hi=30,min(200,len(ac)-1)
    if hi<=lo+3: return None
    pk=lo+int(np.argmax(ac[lo:hi]))
    if ac[pk]<0.45: return None
    return int(pk)

def process(path, out=None, preview=False):
    im = np.array(Image.open(path).convert('RGBA'))
    boxes,clusters,cx,bands = detect_erase(im)
    if preview:
        return im,boxes
    for b in boxes:
        erase_region(im, b, cx)
    if out: Image.fromarray(im).save(out)
    return len(boxes)

def detect_quick(path):
    # half-res detection for speed; returns full-res erase boxes
    pim = Image.open(path).convert('RGBA')
    W,H = pim.size
    im = np.array(pim.resize((W//2,H//2), Image.LANCZOS))
    boxes,clusters,cx,bands = detect_erase(im)
    return [(int(x0)*2,int(y0)*2,int(x1)*2,int(y1)*2) for x0,y0,x1,y1 in boxes]

if __name__=='__main__':
    mode = sys.argv[1] if len(sys.argv)>1 else 'audit'
    if mode=='audit':
        files=[]
        for d in ['planes','liveries','aces','seaplanes']:
            for root,_,fs in os.walk(d):
                for f in fs:
                    if f.endswith('.webp'): files.append(os.path.join(root,f))
        hits=[]
        for i,f in enumerate(sorted(files)):
            try:
                boxes = detect_quick(f)
            except Exception as e:
                continue
            if boxes: hits.append((f,boxes))
            if i%50==0: print(i,'/',len(files), flush=True)
        json.dump(hits, open('../_draft/roundel_hits.json','w'))
        print(len(hits),'files with lower-wing markings')
        for f,b in hits: print(' ',f,b)
    elif mode=='apply':
        hits=json.load(open('../_draft/roundel_hits.json'))
        os.makedirs('../_draft/fixed',exist_ok=True)
        only=set(sys.argv[2:]) if len(sys.argv)>2 else None
        done=0
        for f,_ in hits:
            if only and f not in only and f.replace('\\','/') not in only: continue
            im=np.array(Image.open(f).convert('RGBA'))
            boxes,_,cx,_=detect_erase(im)
            a=im[...,3]>40; rgb=im[...,:3].astype(int)
            sat=rgb.max(-1)-rgb.min(-1); luma=rgb.mean(-1); fl=np.median(luma[a])
            mm=((sat>90)|((fl-luma)>70)|((luma-fl)>55)) & a
            for b in boxes: erase_region(im,b,cx,marks=boxes,m=mm)
            out='../_draft/fixed/'+f.replace('/','__').replace('\\','__')
            Image.fromarray(im).save(out)
            done+=1
            print(done,'/',len(hits),f,flush=True)
        print('applied to',done,'files -> _draft/fixed/')
    elif mode=='clipped':
        # find top-wing roundels clipped by the wing edge (blob bbox contains transparent px)
        files=[]
        for d in ['planes','liveries','aces','seaplanes']:
            for root,_,fs in os.walk(d):
                for f in fs:
                    if f.endswith('.webp'): files.append(os.path.join(root,f))
        hits=[]
        for i,f in enumerate(sorted(files)):
            try:
                pim=Image.open(f).convert('RGBA'); W,H=pim.size
                im=np.array(pim.resize((W//2,H//2),Image.LANCZOS))
                boxes,clusters,cx,bands=detect_erase(im)
                a=im[...,3]>40
                # kept clusters = first (top) cluster only
                info=sorted([(np.mean([b['cy'] for b in g]),g) for g in clusters],key=lambda t:t[0])
                keep = info[0][1] if info else []
                clip=[]
                for b in keep:
                    reg=~a[b['y0']:b['y1']+1, b['x0']:b['x1']+1]
                    # count transparent px INSIDE bbox near edges of wing (roundel disc should be opaque)
                    if reg.sum()>8:
                        clip.append((b['x0']*2,b['y0']*2,b['x1']*2,b['y1']*2))
                if clip: hits.append((f,clip))
            except Exception:
                continue
            if i%100==0: print(i,flush=True)
        json.dump(hits,open('../_draft/clipped_hits.json','w'))
        print(len(hits),'files with clipped top-wing markings')
        for f,c in hits: print(' ',f,c)
