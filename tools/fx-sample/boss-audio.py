"""Boss / ace arrival bank (approved drafts, 2026-10-08).

    python3 tools/fx-sample/boss-audio.py      -> sfx/boss-*.mp3, sfx/ace-bugle.mp3 … (needs ffmpeg)

siren (air raids, bombers, airships) · drums (fortresses, fleets) · klaxon (AA nets, armour) ·
ship horn · airship engines · armour engine and tracks · enemy-ace bugle.
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
# 1) Area boss arrival: timpani hit + low brass stab chord + cymbal-free tail
def boss_sting():
    d=2.6;t=T(d)
    timp=np.sin(sweep(110,82,d,.08))*np.exp(-t/.5)*1.2+np.sin(2*sweep(110,82,d,.08))*np.exp(-t/.25)*.4
    timp+=bp(N(d),120,900)*np.exp(-t/.03)*.8
    env=np.minimum(1,t/.02)*np.exp(-np.maximum(0,t-.15)/.7)
    ch=brass(110,t,env,1.3)*.5+brass(164.8,t,env,1.3)*.38+brass(220,t,env,1.2)*.3+brass(261.6,t,env,1.1)*.18
    # second hit
    k=int(.62*SR);hit2=np.zeros(len(t));sub=timp[:len(t)-k]*.7;hit2[k:]=sub
    return reverb(timp+lp(ch,2600)+hit2,1.4,.3)
# 2) Ship arrival: steamship foghorn — reed-voiced, long blast + distant answer
def ship_horn():
    d=5.2;t=T(d);out=np.zeros(len(t))
    def blast(t0,dur,g,f=146.8):
        tt=t-t0;env=np.where(tt>0,np.minimum(1,tt/.18)*np.where(tt<dur,1,np.maximum(0,1-(tt-dur)/.5)),0)
        ff=f*(1-.04*np.exp(-np.maximum(tt,0)/.12))
        ph=2*np.pi*np.cumsum(ff)/SR
        reed=sum(np.sin(k*ph)/k for k in range(1,18))   # buzzy reed
        reed2=sum(np.sin(k*ph*1.498)/k for k in range(1,12))*.55  # fifth above
        x=bp(reed+reed2,180,1400)
        return x*env*g
    out+=blast(.05,2.4,1.0)+blast(3.25,1.3,.45)
    return reverb(out,1.8,.35)
# 3) Enemy ace: diving engine snarl + twin MG burst + brass "빠밤"
def ace_sting():
    d=1.8;t=T(d)
    f=150+220*np.minimum(1,t/.55);ph=2*np.pi*np.cumsum(f)/SR
    eng=(np.sign(np.sin(ph))*.3+np.sin(2*ph)*.4)*np.exp(-np.maximum(0,t-.5)/.25)*np.minimum(1,t/.05)
    eng=bp(eng,200,2500)*.8
    mgb=np.zeros(len(t))
    for i in range(6):
        k=int((.45+i*.065)*SR);L=int(.05*SR);tt=np.arange(L)/SR
        mgb[k:k+L]+=bp(rng.standard_normal(L),900,6000)*np.exp(-tt/.006)+np.sin(2*np.pi*170*tt)*np.exp(-tt/.015)*.6
    env1=adsr(np.maximum(0,t-.85),.01,.12,.15)*(t>.85);env2=adsr(np.maximum(0,t-1.05),.01,.45,.35)*(t>1.05)
    st=brass(293.7,t,env1,1.5)*.5+brass(349.2,t,env1,1.5)*.35+brass(311.1,t,env2,1.5)*.5+brass(392,t,env2,1.5)*.38+brass(466.2,t,env2,1.4)*.25
    return reverb(eng+mgb*.9+lp(st,4000),1.0,.22)
# 4) Airship / zeppelin: several slow propeller throbs swelling in + deep hull groan
def airship():
    d=4.0;t=T(d);swell=np.minimum(1,t/2.6)**1.4*np.where(t<3.3,1,np.maximum(0,1-(t-3.3)/.7))
    x=np.zeros(len(t))
    for f,r,g in [(92,11.5,1),(97,13.2,.8),(87,9.8,.7)]:
        ph=2*np.pi*f*t;beat=(.5+.5*np.sin(2*np.pi*r*t))**3
        x+=(np.sin(ph)+.5*np.sin(2*ph)+.3*np.sin(3*ph)+.15*np.sin(4*ph))*beat*g
    groan=np.sin(2*np.pi*(62+6*np.sin(2*np.pi*.4*t))*t)*.35+np.sin(2*np.pi*124*t)*.2
    return reverb((x*.5+groan)*swell,1.5,.25)
# 5) Armour / tank boss: diesel growl + track clank rhythm + metal grind
def armour():
    d=3.0;t=T(d);ramp=np.minimum(1,t/1.0)
    ph=2*np.pi*np.cumsum(38+12*ramp)/SR
    eng=bp(np.sign(np.sin(ph))*.5+np.sin(2*ph)*.4,90,1200)*np.minimum(1,t/.3)*np.where(t<2.5,1,np.maximum(0,1-(t-2.5)/.5))
    cl=np.zeros(len(t));step=.16
    for i in range(int(2.6/step)):
        k=int((.15+i*step)*SR);L=int(.05*SR);tt=np.arange(L)/SR
        if k+L<len(t):
            ex=rng.standard_normal(L)*np.exp(-tt/.004)
            cl[k:k+L]+=bp(ex,1200,4200)*(.7 if i%2 else 1)+np.sin(2*np.pi*420*tt)*np.exp(-tt/.02)*.3
    return reverb(eng*.9+cl*.8*ramp,1.0,.18)

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
# ---- AREA BOSS ----
# 1A siren: WWI hand-crank air-raid siren wail + two deep drum hits
def boss_siren():
    d=3.2;t=T(d)
    f=np.where(t<1.3,300+600*(t/1.3)**.7,np.where(t<2.1,900,900-500*np.minimum(1,(t-2.1)/1.0)))
    ph=2*np.pi*np.cumsum(f)/SR
    s=horn_filter(saw(ph,10)+.6*saw(ph*1.5,6))*np.minimum(1,t/.3)*np.where(t<2.6,1,np.maximum(0,1-(t-2.6)/.6))*.55
    return reverb(s+drum(t,.02,1.3,80)+drum(t,.75,1.1,80),1.6,.3)
# 1B war drums: three heavy hits accelerating + brass swell ending in a hard stab
def boss_drums():
    d=3.0;t=T(d)
    x=drum(t,.02,1.3,88)+drum(t,.62,1.2,88)+drum(t,1.02,1.25,88)+drum(t,1.3,1.5,70)
    sw=np.where((t>.4)&(t<1.3),((t-.4)/.9)**2,0)
    ch=sum(trumpet(f,0.4,0.9,t,g)*1 for f,g in [(146.8,.5),(220,.4),(293.7,.3)])*0  # placeholder
    swell=sum(horn_filter(saw(2*np.pi*f*t,14))*a for f,a in [(110,.5),(164.8,.4),(220,.3),(261.6,.2)])*sw*.5
    stab=sum(trumpet(f,1.3,.35,t,a) for f,a in [(220,.6),(261.6,.5),(329.6,.45),(440,.35)])
    return reverb(x+swell+stab*.8+snare_roll(t,.6,.7,22,.35),1.5,.3)
# 1C klaxon alarm "아-우가" twice + boom
def boss_klaxon():
    d=2.6;t=T(d);x=np.zeros(len(t))
    for t0 in (.05,.75):
        tt=t-t0;on=(tt>=0)&(tt<.55)
        f=np.where(tt<.12,260+260*(tt/.12),np.where(tt<.4,520-60*(tt-.12)/.28,460-200*(tt-.4)/.15))
        ph=2*np.pi*np.cumsum(np.where(on,f,0))/SR
        env=np.where(on,np.minimum(1,np.maximum(tt,0)/.02)*np.minimum(1,(.55-tt)/.06),0)
        x+=np.tanh(3*saw(ph,12))*env*.5
    x=horn_filter(x)
    return reverb(x+drum(t,1.45,1.6,70),1.3,.3)
# ---- ENEMY ACE ----
# 3A flyby: doppler engine pass "위이이잉—" + long twin MG burst
def ace_flyby():
    d=2.2;t=T(d)
    tc=.8;f=np.where(t<tc,330+80*(t/tc),260-90*np.minimum(1,(t-tc)/1.0))
    ph=2*np.pi*np.cumsum(f)/SR
    amp=1/(1+((t-tc)/.35)**2)
    eng=bp(np.sign(np.sin(ph))*.4+saw(ph,8)*.6,180,3000)*amp
    mgb=np.zeros(len(t))
    for i in range(12):
        k=int((.35+i*.055)*SR);L=int(.05*SR);tt=np.arange(L)/SR
        mgb[k:k+L]+=bp(rng.standard_normal(L),900,6000)*np.exp(-tt/.005)*(1 if i%2 else .8)+np.sin(2*np.pi*165*tt)*np.exp(-tt/.012)*.5
    return reverb(eng*1.1+mgb*.8,1.0,.2)
# 3B bugle challenge: three rising trumpet calls + snare roll + cymbal-less hit
def ace_bugle():
    d=2.2;t=T(d)
    x=trumpet(392,.05,.12,t,.9)+trumpet(392,.22,.12,t,.9)+trumpet(523.3,.4,.6,t,1.0)+trumpet(659.3,.4,.6,t,.55)
    return reverb(x+snare_roll(t,0,.9,26,.35)+drum(t,.4,.9,110),1.3,.28)
# 3C snarl stinger: dissonant brass stab cluster + engine scream rising + MG tail
def ace_snarl():
    d=1.9;t=T(d)
    f=220+500*np.minimum(1,t/.7)**1.5;ph=2*np.pi*np.cumsum(f)/SR
    eng=bp(np.sign(np.sin(ph))*.4+saw(ph,8)*.5,250,4000)*np.minimum(1,t/.05)*np.exp(-np.maximum(0,t-.7)/.18)
    stab=sum(trumpet(fr,.7,.5,t,a) for fr,a in [(277.2,.55),(293.7,.5),(415.3,.45),(554.4,.3)])
    mgb=np.zeros(len(t))
    for i in range(5):
        k=int((1.3+i*.06)*SR);L=int(.05*SR);tt=np.arange(L)/SR
        if k+L<len(t):mgb[k:k+L]+=bp(rng.standard_normal(L),900,6000)*np.exp(-tt/.005)
    return reverb(eng*.8+stab+mgb*.5+drum(t,.7,1.0,90),1.2,.25)


# Tamed bugle (2026-10-08 feedback): the three calls only, no snare roll or drum, short room.
def ace_bugle_t():
    d=1.3;t=T(d)
    x=trumpet(392,.0,.1,t,.8)+trumpet(392,.15,.1,t,.8)+trumpet(523.3,.3,.42,t,.9)
    return reverb(lp(x,3200),.6,.12)

# Chosen 2026-10-08: enemy ace = a plane passing low overhead (doppler engine), no music.
def ace_flyby_quiet():
    d=1.6;t=T(d);tc=.7;f=np.where(t<tc,150+25*(t/tc),130-45*np.minimum(1,(t-tc)/.8))
    ph=2*np.pi*np.cumsum(f)/SR;amp=1/(1+((t-tc)/.3)**2)
    x=(np.sin(ph)+.6*np.sin(2*ph)+.3*np.sin(3*ph)+.15*np.sin(4*ph))*amp
    x+=lp(N(d),600)*amp*.4
    return lp(x,1800)
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
os.makedirs(os.path.join(ROOT,'sfx'),exist_ok=True)
bank={'boss-siren':boss_siren(),'boss-drums':boss_drums(),'boss-klaxon':boss_klaxon(),'ship-horn':ship_horn(),'airship':airship(),'armour':armour(),'ace-bugle':ace_flyby_quiet()}
tmp=tempfile.mkdtemp()
for name,x in bank.items():
    wav=os.path.join(tmp,name+'.wav');save(wav,x)
    subprocess.run(['ffmpeg','-v','error','-y','-i',wav,'-ac','1','-ar','44100','-b:a','96k',os.path.join(ROOT,'sfx',name+'.mp3')],check=True)
print(len(bank),'files')
