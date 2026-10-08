"""Combat sound bank (approved drafts, 2026-10-08): player MG, enemy MG, hits, damage, kill, flak.

    python3 tools/fx-sample/combat-audio.py      -> sfx/*.mp3 (needs ffmpeg)

Same synthesis as the approved drafts. Several variants per cue so rapid repeats differ.
"""
import os, subprocess, tempfile
import numpy as np, wave
from scipy.signal import butter, lfilter
SR=48000
rng=np.random.default_rng(11)
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
# 1) player machine gun: crack + action clack + chest thump (~75 ms)
def mg(v=0):
    d=.09;t=T(d)
    crack=bp(N(d),1800,9000)*np.exp(-t/.0045)*1.5
    bark=bp(N(d),400,2400)*np.exp(-t/.016)*1.1
    ph=sweep(150*(1+.05*v),70,d,.02);thump=np.sin(ph)*np.exp(-t/.02)*.9
    clk=np.zeros(len(t));k=int((.034+.004*v)*SR);L=int(.003*SR);clk[k:k+L]=rng.standard_normal(L)*np.exp(-np.arange(L)/(.0008*SR))
    clk=bp(clk,2500,6000)*.8
    return crack+bark+thump+clk
# 2) enemy gun: same family, distant — duller, thinner, shorter
def enemy(v=0):
    d=.08;t=T(d);x=bp(N(d),500,2600)*np.exp(-t/.011)*1.2+np.sin(sweep(260*(1+.06*v),120,d,.015))*np.exp(-t/.012)*.4
    return lp(x,2400)
# 3) our rounds hitting an airframe: wood/canvas tick + metal ping variant
def hitmark(v=0):
    d=.11;t=T(d);x=bp(N(d),900,4200)*np.exp(-t/.006)*1.0
    if v%3==0:x+=np.sin(2*np.pi*(1900+130*v)*t)*np.exp(-t/.03)*.35   # metal fitting ping
    x+=np.sin(sweep(320,140,d,.01))*np.exp(-t/.012)*.5
    return x
# 4) player taking damage: thud + tearing crunch + loose rattle (~0.3 s)
def damage():
    d=.34;t=T(d)
    x=np.sin(sweep(170,60,d,.03))*np.exp(-t/.06)*1.2
    x+=bp(N(d),700,3500)*np.exp(-t/.035)*1.1
    x+=np.sin(2*np.pi*720*t+np.sin(2*np.pi*95*t)*3)*np.exp(-t/.05)*.25
    for i in range(5):
        k=int(rng.uniform(.05,.25)*SR);L=int(.01*SR)
        if k+L<len(x):x[k:k+L]+=bp(rng.standard_normal(L),2000,6000)*np.exp(-np.arange(L)/(.002*SR))*.5
    return x
# 5) plane destroyed: boom + fuel whoomph + fiery crackle + debris
def kill():
    d=1.3;t=T(d)
    x=np.sin(sweep(110,38,d,.09))*np.exp(-t/.28)*1.3+np.sin(2*sweep(110,38,d,.09))*np.exp(-t/.2)*.45
    x+=bp(N(d),300,2500)*np.exp(-t/.05)*1.4
    x+=lp(N(d),500,3)*np.exp(-t/.35)*np.minimum(1,t/.03)*1.6
    cr=np.zeros(len(t))
    for i in range(40):
        k=int(rng.uniform(.05,.9)*SR);L=int(.004*SR)
        if k+L<len(t):cr[k:k+L]+=rng.standard_normal(L)*np.exp(-np.arange(L)/(.0008*SR))*rng.uniform(.2,.8)
    x+=bp(cr,1500,7000)*np.exp(-t/.4)*.9
    return x
# 6) flak airburst: sharp crack-pop + short rolling tail
def flak(v=0):
    d=.8;t=T(d)
    x=bp(N(d),800,6000)*np.exp(-t/.008)*1.6
    x+=np.sin(sweep(190*(1+.05*v),70,d,.03))*np.exp(-t/.08)*1.0
    x+=lp(N(d),900,2)*np.exp(-t/.18)*1.0
    # far echo
    k=int(.14*SR);x[k:]+=lp(x[:-k],1500)*.25
    return x
from scipy.signal import lfilter
def reson(x,f,q):
    import numpy as np
    w=2*np.pi*f/SR;r=np.exp(-w/(2*q));return lfilter([1-r],[1,-2*r*np.cos(w),r*r],x)
# A: 퍽 — dull fabric/wood thud
def hitA(v=0):
    d=.07;t=T(d);x=lp(bp(N(d),180,1400),1500)*np.exp(-t/.009)*1.4
    x+=np.sin(sweep(150*(1+.07*v),80,d,.012))*np.exp(-t/.014)*.9
    return x
# B: 깡 — small metallic clank (rivet/engine cowling)
def hitB(v=0):
    d=.12;t=T(d);ex=np.zeros(len(t));L=int(.0015*SR);ex[:L]=rng.standard_normal(L)
    f=[2350,3720,5100];x=sum(reson(ex,fi*(1+.03*v),40)*a for fi,a in zip(f,[1,.6,.35]))*3
    x+=bp(N(d),1500,5000)*np.exp(-t/.003)*.6
    return x
# C: 타닥 — crisp splinter snap
def hitC(v=0):
    d=.06;t=T(d);x=hp(N(d),2200)*np.exp(-t/.0025)*1.6
    k=int((.012+.004*v)*SR);L=int(.004*SR);x[k:k+L]+=hp(rng.standard_normal(L),3000)*np.exp(-np.arange(L)/(.0012*SR))*.7
    x+=np.sin(sweep(420,200,d,.006))*np.exp(-t/.006)*.4
    return x

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
os.makedirs(os.path.join(ROOT,'sfx'),exist_ok=True)
bank={}
for v in range(3):bank[f'mg-{v}']=(mg(v),.9)
for v in range(3):bank[f'enemy-{v}']=(enemy(v),.9)
for v in range(4):bank[f'hit-{v}']=(hitA(v),.9)
for v in range(2):bank[f'hitmetal-{v}']=(hitB(v),.9)
bank['damage']=(damage(),.9)
bank['kill']=(kill(),.9)
for v in range(3):bank[f'flak-{v}']=(flak(v),.9)
tmp=tempfile.mkdtemp()
for name,(x,peak) in bank.items():
    wav=os.path.join(tmp,name+'.wav');save(wav,x,peak)
    subprocess.run(['ffmpeg','-v','error','-y','-i',wav,'-ac','1','-ar','44100','-b:a','112k',os.path.join(ROOT,'sfx',name+'.mp3')],check=True)
print(len(bank),'files')
