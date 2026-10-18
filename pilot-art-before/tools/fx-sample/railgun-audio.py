"""Rail-gun boss audio (approved drafts, 2026-10-08): fire, incoming shell whistle, impact.

    python3 tools/fx-sample/railgun-audio.py      -> rail-*.mp3 in the repo root (needs ffmpeg)

A = L'Incomparable 520 mm (heavy, long, double echo); B = Bruno (sharper, shorter).
Same synthesis and seed as the drafts, so the files are exactly what was approved.
"""
import os, subprocess, tempfile
import numpy as np, wave
from scipy.signal import butter, lfilter
SR=48000
rng=np.random.default_rng(7)
def t_(d): return np.arange(int(d*SR))/SR
def bp(x,lo,hi,o=2): b,a=butter(o,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def lp(x,f,o=2): b,a=butter(o,f/(SR/2)); return lfilter(b,a,x)
def save(name,x):
    x=np.tanh(x*1.4); x=x/np.max(np.abs(x))*.92
    fade=np.minimum(1,np.minimum(np.arange(len(x))/(.003*SR),(len(x)-np.arange(len(x)))/(.08*SR)))
    x=(x*fade*32767).astype(np.int16)
    w=wave.open(name,'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(x.tobytes());w.close()
def sweep(f0,f1,d,tau):
    t=t_(d);f=f1+(f0-f1)*np.exp(-t/tau);ph=2*np.pi*np.cumsum(f)/SR;return ph,t
def boom(d=1.6,f0=95,f1=38,crack=1.0,body=1.0,tail=1.0,mid=420):
    n=int(d*SR);t=t_(d);out=np.zeros(n)
    # muzzle crack: very short broadband transient
    c=rng.standard_normal(n)*np.exp(-t/.006);out+=bp(c,600,7000)*1.6*crack
    # chest body: pitch-falling sine + octave so phones hear it
    ph,_=sweep(f0,f1,d,.12);env=np.exp(-t/.35)*np.minimum(1,t/.003)
    out+=(np.sin(ph)*1.0+np.sin(2*ph)*.55+np.sin(3*ph)*.2)*env*1.3*body
    # mid punch (the "쾅")
    ph2,_=sweep(mid,mid*.45,d,.06);out+=np.sin(ph2)*np.exp(-t/.07)*.6
    # rolling tail: short decaying low rumble (not a bed)
    r=lp(rng.standard_normal(n),260,3)*np.exp(-t/.45)*np.minimum(1,t/.02)
    out+=r*2.2*tail
    return out
def echo(x,delays=((.19,.35),(.43,.18))):
    y=x.copy()
    for d,g in delays:
        k=int(d*SR);y[k:]+=lp(x[:-k],1200)*g
    return y
def incoming(d=1.3,f0=1500,f1=420):
    t=t_(d);f=f0+(f1-f0)*(t/d)**1.4;ph=2*np.pi*np.cumsum(f*(1+.004*np.sin(2*np.pi*7*t)))/SR
    env=np.minimum(1,t/.25)**1.5*(.35+.65*t/d)
    return (np.sin(ph)+.25*np.sin(2*ph))*env*.5
def impact(d=1.5,heavy=1.0):
    n=int(d*SR);t=t_(d);x=boom(d,f0=80,f1=32,crack=.8,body=1.1*heavy,tail=1.2*heavy,mid=300)
    # dirt and debris falling back: sparse little clods
    deb=np.zeros(n)
    for _ in range(int(26*heavy)):
        s=int(rng.uniform(.12,.9)*SR);L=int(.012*SR)
        if s+L<n: deb[s:s+L]+=rng.standard_normal(L)*np.exp(-np.arange(L)/(.003*SR))*rng.uniform(.2,.6)
    x+=bp(deb,500,3500)*.9*np.exp(-t/.7)
    return x
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
# A: L'Incomparable 520mm — huge, slow, double echo
fireA=echo(boom(2.0,f0=85,f1=32,crack=1.1,body=1.25,tail=1.3,mid=360))
# B: Bruno — sharper, shorter
fireB=echo(boom(1.4,f0=120,f1=45,crack=1.3,body=.95,tail=.8,mid=520),((.16,.28),))
out={'rail-fire-520':fireA,'rail-fire-bruno':fireB}
for key,w,h in [('520',(1.5,1300,360),1.2),('bruno',(1.0,1700,520),.85)]:
    out['rail-incoming-'+key]=incoming(*w)
    out['rail-impact-'+key]=impact(1.6,h)
tmp=tempfile.mkdtemp()
for name,x in out.items():
    wav=os.path.join(tmp,name+'.wav');save(wav,x)
    subprocess.run(['ffmpeg','-v','error','-y','-i',wav,'-ac','1','-ar','44100','-b:a','96k',os.path.join(ROOT,name+'.mp3')],check=True)
    print(name)
