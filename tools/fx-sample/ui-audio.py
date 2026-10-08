"""Skill and interface sound bank (approved drafts, 2026-10-08; pitched down for comfort).

    python3 tools/fx-sample/ui-audio.py      -> sfx/ui-*.mp3 (needs ffmpeg)
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

def horn_filter(x): return bp(x,350,2600)
def saw(ph,n=16): return sum(np.sin(k*ph)/k for k in range(1,n))
def trumpet(f,t0,dur,t,g=1.0):
    tt=t-t0;on=(tt>=0)
    env=np.where(on,np.minimum(1,np.maximum(tt,0)/.025)*np.where(tt<dur,1,np.maximum(0,1-(tt-dur)/.12)),0)
    bend=1-.06*np.exp(-np.maximum(tt,0)/.03)
    ph=2*np.pi*np.cumsum(f*bend*(1+.003*np.sin(2*np.pi*6*t)))/SR
    x=saw(ph,20)
    x=bp(x,400,4500)+bp(x,900,1700)*.8          # bright bell formant
    br=bp(rng.standard_normal(len(t)),1500,5000)*np.exp(-np.maximum(tt,0)/.02)*on*.25
    return (x+br)*env*g
def snare_roll(t,t0,dur,rate=24,g=.5):
    x=np.zeros(len(t))
    for i in range(int(dur*rate)):
        k=int((t0+i/rate)*SR);L=int(.05*SR)
        if k+L<len(t):tt=np.arange(L)/SR;x[k:k+L]+=(bp(rng.standard_normal(L),1500,7000)*np.exp(-tt/.012)+np.sin(2*np.pi*190*tt)*np.exp(-tt/.01)*.5)*(.5+.5*i/(dur*rate))
    return x*g
def drum(t,t0,g=1.0,f0=95):
    tt=np.maximum(t-t0,0);on=t>=t0
    ph=2*np.pi*np.cumsum(np.where(on,(f0*.75+f0*.25*np.exp(-tt/.05)),0))/SR
    return (np.sin(ph)+.45*np.sin(2*ph)+.2*np.sin(3.1*ph))*np.exp(-tt/.32)*on*g+bp(rng.standard_normal(len(t)),150,2500)*np.exp(-tt/.02)*on*.6*g

_tr=trumpet
def trumpet(f,t0,dur,t,g=1.0): return lp(_tr(f*.667,t0,dur,t,g),3200)
_sn=snare_roll
def snare_roll(t,t0,dur,rate=24,g=.5): return lp(_sn(t,t0,dur,rate,g),3000)
def bell(f,t0,t,dur=1.2,g=1.0):
    f=f*.5
    tt=np.maximum(t-t0,0);on=t>=t0
    parts=[(1,1,1.0),(2.76,.5,.6),(5.4,.25,.35),(8.93,.12,.25)]
    return sum(np.sin(2*np.pi*f*r*tt)*a*np.exp(-tt/(dur*d)) for r,a,d in parts)*on*g*np.minimum(1,tt/.002)
def click(t,t0,lo=1500,hi=6000,g=1.0,tau=.003):
    lo,hi=lo*.6,min(hi*.55,3600)
    tt=np.maximum(t-t0,0);on=(t>=t0)&(tt<.05)
    return bp(rng.standard_normal(len(t))*on,lo,hi)*np.exp(-tt/tau)*g
def thunk(t,t0,f=140,g=1.0):
    tt=np.maximum(t-t0,0);on=t>=t0
    return np.sin(2*np.pi*f*tt*(1-.3*np.minimum(1,tt/.05)))*np.exp(-tt/.03)*on*g
# 1 skill: martial fanfare triplet + snare + drum
def skill():
    d=1.6;t=T(d)
    x=trumpet(392,.0,.08,t,.8)+trumpet(392,.11,.08,t,.8)+trumpet(587.3,.22,.5,t,1)+trumpet(784,.22,.5,t,.5)
    return reverb(x+snare_roll(t,0,.22,30,.35)+drum(t,.22,.9,100),1.2,.25)
# 2 level up: rising brass + glockenspiel arpeggio
def levelup():
    d=1.8;t=T(d)
    arp=sum(bell(f,i*.08,t,1.0,.5) for i,f in enumerate([523.3,659.3,784,1046.5]))
    br=trumpet(261.6,.0,.5,t,.5)+trumpet(392,.0,.5,t,.4)+trumpet(523.3,.32,.6,t,.55)
    return reverb(arp+br*.7,1.4,.3)
# 3 upgrade chosen: rubber stamp on the order sheet — paper slap + desk thunk + small bell
def choose():
    d=.9;t=T(d)
    x=click(t,0,600,4000,1.2,.012)+thunk(t,0,120,1.2)+click(t,.004,2500,8000,.5,.002)
    x+=bell(1318.5,.09,t,.5,.35)
    return reverb(x,.8,.18)
# 4 supply pickup: ammo box latch clink + coins of brass + tiny bell
def pickup():
    d=.8;t=T(d)
    x=click(t,0,2000,7000,.8,.002)+thunk(t,0,260,.5)
    for i,tt in enumerate([.05,.09,.12]):x+=bell(2100+300*i,tt,t,.18,.25)
    x+=bell(1760,.16,t,.6,.4)
    return reverb(x,.7,.15)
# 5 repair: two wrench ratchet clicks run + warm chime
def heal():
    d=1.2;t=T(d);x=np.zeros(len(t))
    for i in range(7):x+=click(t,i*.035,2500,7500,.55,.0015)+thunk(t,i*.035,600,.12)
    x+=bell(784,.3,t,.9,.45)+bell(1174.7,.38,t,.9,.35)
    return reverb(x,.9,.2)
# 6 reload start: bolt pulled back "철-"
def reload():
    d=.35;t=T(d)
    return click(t,0,1200,5000,1.0,.006)+thunk(t,0,220,.5)+bp(rng.standard_normal(len(t)),800,3000)*np.exp(-np.maximum(t-.02,0)/.02)*(t>.02)*(t<.12)*.4
# 7 reloaded: belt seated + bolt home "-컥" + latch
def loaded():
    d=.4;t=T(d)
    return click(t,0,900,4500,1.1,.004)+thunk(t,0,170,.9)+click(t,.07,2500,8000,.8,.0015)+thunk(t,.07,320,.3)


# Tamed (2026-10-08 feedback "too much"): short, dry, no fanfare tails.
def skill_t():
    d=.7;t=T(d)
    return trumpet(392,.0,.16,t,.8)+trumpet(587.3,.0,.16,t,.45)+drum(t,0,.6,100)
def choose_t():
    d=.3;t=T(d)
    return click(t,0,600,4000,1.0,.01)+thunk(t,0,120,1.0)
def pickup_t():
    d=.3;t=T(d)
    # no chime: a soft brass-tag tick (it plays on every kill's experience pickup)
    return click(t,0,1200,3500,.5,.002)+thunk(t,0,330,.35)
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
os.makedirs(os.path.join(ROOT,'sfx'),exist_ok=True)
bank={'ui-skill':skill_t(),'ui-levelup':levelup(),'ui-upgrade':choose_t(),'ui-pickup':pickup_t(),'ui-repair':heal(),'ui-reload':reload(),'ui-loaded':loaded()}
tmp=tempfile.mkdtemp()
for name,x in bank.items():
    wav=os.path.join(tmp,name+'.wav');save(wav,lp(x,4500))
    subprocess.run(['ffmpeg','-v','error','-y','-i',wav,'-ac','1','-ar','44100','-b:a','96k',os.path.join(ROOT,'sfx',name+'.mp3')],check=True)
print(len(bank),'files')
