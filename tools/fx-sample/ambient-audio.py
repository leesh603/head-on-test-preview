"""Engine loops and region ambience (approved drafts, 2026-10-08).

    python3 tools/fx-sample/ambient-audio.py      -> sfx/engine-*.mp3, sfx/amb-*.mp3 (needs ffmpeg)

engine-rotary: rotary-engined types (Dr.I, Camel, Nieuport, Eindecker…) · engine-inline: inline sixes
and V8s (Albatros, D.VII, SPAD, SE5a…). Both are seamless loops; sfx.js varies their rate with speed.
amb-front: far artillery for land fronts · amb-sea: slow wave washes. No wind beds.
"""
import os, subprocess, tempfile
import numpy as np, wave
from scipy.signal import butter, lfilter
SR=48000
rng=np.random.default_rng(23)
def T(d): return np.arange(int(d*SR))/SR
def bp(x,lo,hi,o=2): b,a=butter(o,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def lp(x,f,o=2): b,a=butter(o,f/(SR/2)); return lfilter(b,a,x)
def hp(x,f,o=2): b,a=butter(o,f/(SR/2),'high'); return lfilter(b,a,x)
def N(d): return rng.standard_normal(int(d*SR))
def sweep(f0,f1,d,tau):
    t=T(d);f=f1+(f0-f1)*np.exp(-t/tau);return 2*np.pi*np.cumsum(f)/SR
def norm(x,peak=.9):
    x=np.tanh(x*1.3);return x/np.max(np.abs(x))*peak
def save(name,x,peak=.9):
    x=norm(x,peak);n=len(x);fade=np.minimum(1,np.minimum(np.arange(n)/(.0015*SR),(n-np.arange(n))/(.01*SR)))
    w=wave.open(name,'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*fade*32767).astype(np.int16).tobytes());w.close()
def place(total,items):
    out=np.zeros(int(total*SR))
    for t0,x,g in items:
        k=int(t0*SR);m=min(len(x),len(out)-k)
        if m>0:out[k:k+m]+=x[:m]*g
    return out

from scipy.signal import fftconvolve
def reverb(x,decay=1.2,mix=.25):
    L=int(decay*SR);ir=rng.standard_normal(L)*np.exp(-np.arange(L)/(decay*SR/5));ir=lp(ir,3500);ir/=np.sqrt((ir**2).sum())
    y=fftconvolve(x,ir)[:len(x)+L];out=np.zeros(len(y));out[:len(x)]=x;return out+y*mix
def adsr(t,a,d_hold,r):
    return np.minimum(1,t/a)*np.where(t<d_hold,1,np.maximum(0,1-(t-d_hold)/r))
def brass(f,t,env,bright=1.0,vib=.004):
    ph=2*np.pi*np.cumsum(f*(1+vib*np.sin(2*np.pi*5.2*t)))/SR
    x=sum(np.sin(k*ph)*(1/k)**(1.1/bright) for k in range(1,12))
    return x*env

def loopable(x,xf=.08):
    # crossfade tail into head so the loop is seamless
    k=int(xf*SR);y=x[:-k].copy();ramp=np.linspace(0,1,k);y[:k]=y[:k]*ramp+x[-k:]*(1-ramp);return y
# Engine A: rotary (Le Rhône / Oberursel) — 9-cylinder buzz, firing ~ 75 Hz, prop beat
def rotary(d=4.0,rpm=1150):
    t=T(d);fire=rpm/60*9/2   # firings per second (4-stroke: half per rev)
    ph=2*np.pi*fire*t
    pulses=np.zeros(len(t));period=SR/fire;i=0.0
    while i<len(t):
        k=int(i);L=int(.006*SR)
        if k+L<len(t):pulses[k:k+L]+=np.exp(-np.arange(L)/(.0018*SR))*(.8+.4*rng.random())
        i+=period*(1+.02*rng.standard_normal())
    body=lp(pulses,900,2)*2.0+lp(bp(pulses,200,1600),1600)*.6
    prop=lp(N(d),400)*(.5+.5*np.sin(2*np.pi*rpm/60*2*t))**2*.35   # two-blade prop beat
    return loopable(lp(body+prop,2200))
# Engine B: inline six (Mercedes D.III) — smoother lower growl
def inline(d=4.0,rpm=1400):
    t=T(d);f=rpm/60*3
    ph=2*np.pi*f*t
    x=np.sin(ph)*.6+np.sin(2*ph)*.35+np.sin(3*ph)*.2+np.sign(np.sin(ph))*.12
    x*=1+.15*np.sin(2*np.pi*rpm/60*.5*t)
    prop=lp(N(d),350)*(.5+.5*np.sin(2*np.pi*rpm/60*2*t))**2*.3
    return loopable(lp(x+prop,1800))
# Ambience: distant front — occasional far artillery thumps, no wind bed
def front(d=8.0):
    t=T(d);x=np.zeros(len(t))
    for t0,g in [(.6,1),(2.1,.6),(2.4,.8),(4.7,1),(6.2,.5),(7.0,.7)]:
        tt=np.maximum(t-t0,0);on=t>=t0
        x+=(np.sin(2*np.pi*(55+20*np.exp(-tt/.05))*tt)*np.exp(-tt/.4)+lp(rng.standard_normal(len(t)),180,3)*np.exp(-tt/.5)*2)*on*g
    return lp(x,400)
# Ambience: open sea — slow soft wave washes (low, rounded)
def sea(d=8.0):
    t=T(d);x=np.zeros(len(t))
    for t0 in [0,2.2,4.1,6.3]:
        tt=t-t0;env=np.where((tt>0)&(tt<2.6),np.sin(np.pi*np.clip(tt/2.6,0,1))**2,0)
        x+=lp(rng.standard_normal(len(t)),500,2)*env
    return lp(x,600)

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
os.makedirs(os.path.join(ROOT,'sfx'),exist_ok=True)
bank={'engine-rotary':(rotary(),.7),'engine-inline':(inline(),.7),'amb-front':(front(),.6),'amb-sea':(sea(),.5)}
tmp=tempfile.mkdtemp()
for name,(x,peak) in bank.items():
    wav=os.path.join(tmp,name+'.wav')
    if name.startswith('engine'):
        # loops: no edge fades (they would dip every cycle)
        y=norm(x,peak);w=wave.open(wav,'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((y*32767).astype(np.int16).tobytes());w.close()
    else:save(wav,x,peak)
    subprocess.run(['ffmpeg','-v','error','-y','-i',wav,'-ac','1','-ar','44100','-b:a','80k',os.path.join(ROOT,'sfx',name+'.mp3')],check=True)
print(len(bank),'files')
