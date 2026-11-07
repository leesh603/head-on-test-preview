// HUD silhouette strips for objective stages that use the boss slot: a low
// night silhouette that is itself the gauge (lights go out, shapes break and
// burn as the objective is damaged).
//  - City air-raid defense: three districts with their landmarks.
//  - Laon, Entente: Paris under the Paris Gun's shells.
//  - Laon, Central: the Paris Gun on its rail mount, breaking part by part.
import {fx} from './fx-art.js?v=09c75d146ae4289d';

const LANDMARKS={entente:{west:'spire',docks:'dome',east:'clock'},central:{west:'twin',docks:'dome',east:'tower'},
 paris:[[.16,'notredame'],[.47,'eiffel'],[.8,'sacre']]};
const WIDTH={dome:.2,twin:.14,spire:.08,clock:.08,tower:.08,eiffel:.07,notredame:.1,sacre:.14};
const HEIGHT={dome:.62,eiffel:1.3,sacre:.7,notredame:.72};
const ROOFS={city:['flat','gable','gable','chimney','flat','mansard'],paris:['mansard','mansard','chimney','mansard','flat','gable']};
const cache=new Map();
// Deterministic building row for one panel; landmarks at fixed positions.
function skyline(key,marks,style='city',spacing=1){
 if(cache.has(key))return cache.get(key);
 let seed=[...key].reduce((n,ch)=>n*31+ch.charCodeAt(0)>>>0,7);const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const out=[],todo=[...marks];let x=0;
 while(x<1){
  const next=todo[0],landmark=next&&x>=next[0]?todo.shift()[1]:null;
  const w=landmark?WIDTH[landmark]:(.045+rnd()*.07)*spacing;
  out.push({x,w,h:landmark?HEIGHT[landmark]??.95:.3+rnd()*.32,roof:landmark||ROOFS[style][Math.floor(rnd()*6)],breakAt:.12+rnd()*.8,win:Array.from({length:6},()=>rnd()),landmark:!!landmark});
  x+=w+(rnd()<.25?.01:0);
 }
 cache.set(key,out);return out;
}
function buildingPath(c,b,x,w,ground,top,broken,jag){
 c.moveTo(x,ground);
 if(broken){const steps=5;for(let k=0;k<=steps;k++)c.lineTo(x+w*k/steps,top+(k%2?jag:-jag*.4)*(1+(b.win[k%6]-.5)));c.lineTo(x+w,ground);return;}
 const hh=ground-top;
 switch(b.roof){
  case'gable':c.lineTo(x,top+hh*.18);c.lineTo(x+w/2,top);c.lineTo(x+w,top+hh*.18);break;
  case'mansard':c.lineTo(x,top+hh*.12);c.lineTo(x+w*.15,top);c.lineTo(x+w*.85,top);c.lineTo(x+w,top+hh*.12);break;
  case'chimney':c.lineTo(x,top);c.lineTo(x+w*.62,top);c.lineTo(x+w*.62,top-hh*.14);c.lineTo(x+w*.74,top-hh*.14);c.lineTo(x+w*.74,top);c.lineTo(x+w,top);break;
  case'dome':{const base=top+hh*.42,r=w*.32;c.lineTo(x,base);c.lineTo(x+w*.12,base);c.lineTo(x+w*.12,base-hh*.08);c.lineTo(x+w/2-r,base-hh*.08);c.arc(x+w/2,base-hh*.08,r,Math.PI,0);c.lineTo(x+w*.88,base-hh*.08);c.lineTo(x+w*.88,base);c.lineTo(x+w,base);c.lineTo(x+w,ground);
   c.moveTo(x+w/2-w*.03,base-hh*.08-r*.9);c.lineTo(x+w/2-w*.03,top);c.lineTo(x+w/2+w*.03,top);c.lineTo(x+w/2+w*.03,base-hh*.08-r*.9);c.moveTo(x+w,ground);break;}
  case'sacre':{const base=top+hh*.5,r=w*.2;c.lineTo(x,base);c.lineTo(x+w*.12,base);c.arc(x+w*.2,base,w*.08,Math.PI,0);c.lineTo(x+w/2-r,base);c.arc(x+w/2,base,r,Math.PI,0);c.lineTo(x+w*.72,base);c.arc(x+w*.8,base,w*.08,Math.PI,0);c.lineTo(x+w,base);c.lineTo(x+w,ground);
   c.moveTo(x+w/2-w*.025,base-r*.95);c.lineTo(x+w/2,top);c.lineTo(x+w/2+w*.025,base-r*.95);c.moveTo(x+w,ground);break;}
  case'eiffel':{// Lattice tower: splayed legs with the first-floor arch, tapering to the mast.
   const m=x+w/2,first=ground-hh*.2,second=ground-hh*.5;c.lineTo(x+w*.08,ground);c.quadraticCurveTo(m-w*.3,first+hh*.02,m-w*.17,first);c.lineTo(m-w*.08,second);c.lineTo(m-w*.025,top+hh*.12);c.lineTo(m,top);c.lineTo(m+w*.025,top+hh*.12);c.lineTo(m+w*.08,second);c.lineTo(m+w*.17,first);c.quadraticCurveTo(m+w*.3,first+hh*.02,x+w*.92,ground);
   c.lineTo(m+w*.12,ground);c.quadraticCurveTo(m,first+hh*.08,m-w*.12,ground);c.lineTo(x+w*.08,ground);c.moveTo(x+w,ground);break;}
  case'notredame':c.lineTo(x,top);c.lineTo(x+w*.32,top);c.lineTo(x+w*.32,top+hh*.3);c.lineTo(x+w*.48,top+hh*.3);c.lineTo(x+w*.52,top+hh*.05);c.lineTo(x+w*.56,top+hh*.3);c.lineTo(x+w*.68,top+hh*.3);c.lineTo(x+w*.68,top);c.lineTo(x+w,top);break;
  case'clock':c.lineTo(x,top+hh*.22);c.lineTo(x+w*.08,top+hh*.22);c.lineTo(x+w/2,top);c.lineTo(x+w*.92,top+hh*.22);c.lineTo(x+w,top+hh*.22);break;
  case'spire':case'tower':c.lineTo(x,top+hh*.4);c.lineTo(x+w*.25,top+hh*.4);c.lineTo(x+w/2,top);c.lineTo(x+w*.75,top+hh*.4);c.lineTo(x+w,top+hh*.4);break;
  case'twin':c.lineTo(x,top+hh*.4);c.lineTo(x+w*.25,top);c.lineTo(x+w*.42,top+hh*.4);c.lineTo(x+w*.58,top+hh*.4);c.lineTo(x+w*.75,top);c.lineTo(x+w,top+hh*.4);break;
  default:c.lineTo(x,top);c.lineTo(x+w,top);
 }
 c.lineTo(x+w,ground);
}
function sky(c,w,h,burnt){
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#14161a');g.addColorStop(1,`rgb(${48+burnt*80|0},${36+burnt*14|0},30)`);c.fillStyle=g;c.fillRect(0,0,w,h);
}
function glow(c,x0,pw,h,amount){
 if(amount<=0)return;const g=c.createRadialGradient(x0+pw/2,h,0,x0+pw/2,h,Math.max(h,pw*.5));g.addColorStop(0,`rgba(255,96,32,${amount.toFixed(3)})`);g.addColorStop(1,'rgba(255,96,32,0)');c.fillStyle=g;c.fillRect(x0,0,pw,h);
}
function burn(c,x,y,h,time,k,size,ruined,damage){
 const flick=Math.sin(time*9+k*2.1);
 fx(c,'smokeDark',x+Math.sin(time*1.3+k)*3,y-size*.8,size*1.1,size*1.2,0,.22+damage*.25);
 fx(c,'fire',x,y-size*.22,size*.7,size*.7*(1.15+flick*.1),0,(ruined?.5:.85)+flick*.08);
}
// One skyline panel: silhouette, lit windows that go dark, fires at the breaks.
function paintSkyline(c,list,x0,pw,h,{damage,ruined,time,index=0,maxFires=4}){
 const ground=h-1,sil=h*.62,fires=[];
 glow(c,x0,pw,h,damage>0?(ruined?.16:.1+damage*.32):0);
 c.beginPath();
 for(const b of list){const bx=x0+b.x*pw,bw=Math.min(b.w,1-b.x)*pw;if(bw<=0)continue;const broken=ruined||damage>b.breakAt,top=ground-sil*b.h*(broken?.34+b.win[0]*.22:1);
  buildingPath(c,b,bx,bw,ground,top,broken,sil*.08);if(broken&&!ruined&&fires.length<maxFires)fires.push([bx+bw/2,top]);else if(ruined&&fires.length<2&&b.win[1]>.6)fires.push([bx+bw/2,top]);}
 c.fillStyle='#0b0a09';c.fill();
 c.fillStyle='#e9a94e';const lit=1-damage;
 for(const b of list){if(ruined||damage>b.breakAt||b.landmark)continue;const bx=x0+b.x*pw,bw=Math.min(b.w,1-b.x)*pw,top=ground-sil*b.h;
  for(let k=0;k<6;k++){if(b.win[k]>lit*.85)continue;const wx=bx+bw*(.2+.6*((k%3)/2)),wy=top+(ground-top)*(.35+.25*Math.floor(k/3));if(wy<ground-2)c.fillRect(Math.round(wx),Math.round(wy),1.4,1.4);}}
 for(const [k,[x,y]] of fires.entries())burn(c,x,y,h,time,k+index*5,h*(ruined?.36:.5+damage*.3),ruined,damage);
}
// Mount the strip canvas in the boss slot and draw into it at device resolution.
// The slot gets 'skyline-hud' (+ 'skyline-ready' once drawn), which hides the bar.
// Its size comes from a ResizeObserver, not a getBoundingClientRect per frame (that
// forced a layout of the whole HUD every frame right after the title text changed).
// The strip's slow animation is redrawn at most every other frame.
let stripCanvas=null,stripSize=null,stripFrame=0;
export function paintSlotStrip(slot,draw){
 if(!slot)return false;let strip=stripCanvas&&stripCanvas.parentNode===slot?stripCanvas:slot.querySelector('#skylineStrip');
 if(!strip){strip=document.createElement('canvas');strip.id='skylineStrip';strip.setAttribute('aria-hidden','true');slot.append(strip)}
 if(strip!==stripCanvas){stripCanvas=strip;stripSize=null;
  if(typeof ResizeObserver==='function')new ResizeObserver(entries=>{const b=entries[0]?.contentRect;if(b)stripSize={width:b.width,height:b.height}}).observe(strip);}
 if(!slot.classList.contains('skyline-hud'))slot.classList.add('skyline-hud');
 if(slot.classList.contains('skyline-ready')&&(++stripFrame&1))return true;
 const r=stripSize||strip.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),W=Math.round(r.width*dpr),H=Math.round(r.height*dpr);
 let ok=false;if(W>0&&H>0){if(strip.width!==W||strip.height!==H){strip.width=W;strip.height=H}const c=strip.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);ok=!!draw(c,r.width,r.height);}
 if(slot.classList.contains('skyline-ready')!==ok)slot.classList.toggle('skyline-ready',ok);return ok;
}
export function clearSlotStrip(slot){if(slot?.classList.contains('skyline-hud'))slot.classList.remove('skyline-hud','skyline-ready','skyline-tall');}
const hits=new WeakMap();
function hitFlash(c,key,value,time,x0,pw,h){
 const last=hits.get(key)||{v:value,at:-9};if(value<last.v)last.at=time;last.v=value;hits.set(key,last);
 const f=Math.max(0,1-(time-last.at)/.5);if(f>0){c.fillStyle=`rgba(255,140,70,${.28*f})`;c.fillRect(x0,0,pw,h);}
}
function label(c,h,x,text,color,align='left',alpha=1){
 const fs=Math.max(9,Math.min(11,Math.round(h*.3)));c.font=`600 ${fs}px system-ui,sans-serif`;c.textBaseline='top';c.textAlign=align;c.shadowColor='#000';c.shadowBlur=2;c.globalAlpha=alpha;
 c.fillStyle=color;c.fillText(text,x,3);const width=c.measureText(text+' ').width;c.globalAlpha=1;c.shadowBlur=0;c.textAlign='left';return width;
}

// City air-raid defense (city-air-raid.js): three districts.
export function drawCityRaidStrip(c,districts,w,h,time,locale='ko',side='entente',inboundBy={}){
 c.clearRect(0,0,w,h);if(!districts?.length)return false;
 const en=locale==='en',pw=w/districts.length;
 sky(c,w,h,1-districts.reduce((n,d)=>n+Math.max(0,d.hp),0)/districts.reduce((n,d)=>n+d.maxHp,0));
 for(const [i,d] of districts.entries()){
  const frac=Math.max(0,d.hp)/d.maxHp,ruined=d.hp<=0,x0=i*pw,mark=LANDMARKS[side]?.[d.id];
  paintSkyline(c,skyline(side+d.id+i,mark?[[.38+((i*37)%24)/100,mark]]:[]),x0,pw,h,{damage:1-frac,ruined,time,index:i});
  hitFlash(c,d,d.hp,time,x0,pw,h);
  const name=en?d.en.split(' ')[0]:d.name.split(' ')[0],nw=label(c,h,x0+5,name,'#bdb3a0');
  label(c,h,x0+5+nw,ruined?(en?'ruined':'붕괴'):Math.ceil(frac*100)+'%',ruined?'#e0806a':frac*3<=1?'#f0a35a':'#e6dcc6');
  const inbound=inboundBy?.[d.id]||0;if(inbound&&!ruined)label(c,h,x0+pw-5,(en?'Bombers ':'폭격기 ')+inbound,'#ff8a66','right',.7+.3*Math.sin(time*6));
  if(i){c.fillStyle='rgba(120,100,70,.35)';c.fillRect(Math.round(x0),3,1,h-6);}
 }
 return true;
}

// The Paris Gun in side profile, as a silhouette: two rail bogies, the
// armoured box carriage and cradle housing, the stepped barrel at elevation
// with its camelback bracing, recoil cylinders, the loader crane and the
// ammunition wagon behind. Lost parts break in place. u = strip height.
function paintGun(c,ox,ground,u,st,{recoil=0,loader=0,alpha=1,elevation=.34}={}){
 const P=(x,y)=>[ox+x*u,ground+y*u],spots={};c.save();c.globalAlpha*=alpha;
 const fill=()=>{c.fillStyle='#0b0a09';c.fill();};
 const wheels=(x0,x1,n)=>{for(let k=0;k<n;k++){const [x,y]=P(x0+(x1-x0)*k/(n-1),-.05);c.moveTo(x+u*.05,y);c.arc(x,y,u*.05,0,Math.PI*2);}};
 // Ammunition wagon.
 c.beginPath();const ammo=st('ammo');
 if(ammo<2){c.rect(...P(-.78,-.34),.58*u,.24*u);c.rect(...P(-.74,-.4),.5*u,.07*u);}
 else{c.moveTo(...P(-.78,-.1));for(let k=0;k<=6;k++)c.lineTo(...P(-.78+.58*k/6,k%2?-.2:-.28+((k*37)%9)/100));c.lineTo(...P(-.2,-.1));}
 c.rect(...P(-.8,-.12),.62*u,.03*u);wheels(-.7,-.28,2);fill();spots.ammo=P(-.49,-.36);
 // Coupling and carriage frame on two bogies.
 c.beginPath();c.rect(...P(-.2,-.11),.26*u,.02*u);c.rect(...P(.02,-.15),1.82*u,.05*u);wheels(.1,.52,4);wheels(1.32,1.74,4);
 // Box carriage: sloped glacis toward the muzzle side.
 c.moveTo(...P(.04,-.15));c.lineTo(...P(.04,-.4));c.lineTo(...P(.22,-.5));c.lineTo(...P(1.5,-.5));c.lineTo(...P(1.8,-.36));c.lineTo(...P(1.84,-.15));fill();
 // Cradle housing and trunnion.
 const cradle=st('recoil'),elev=cradle===2?elevation*.5:elevation,tx=1.0-recoil*.04,ty=-.66;
 c.beginPath();c.moveTo(...P(.72,-.5));c.lineTo(...P(.8,-.7));c.lineTo(...P(1.24,-.7));c.lineTo(...P(1.34,-.5));fill();spots.recoil=P(1.05,-.56);
 const breech=st('breech');if(breech<2){c.beginPath();c.rect(...P(tx-.2,ty-.07),.2*u,.15*u);fill();}spots.breech=P(tx-.08,ty);
 // Stepped barrel with bands; snapped at the second band once destroyed.
 const barrel=st('barrel'),cos=Math.cos(elev),sin=-Math.sin(elev),seg=[[.0,.085],[.42,.07],[.82,.058],[1.18,.048],[1.4,.042]],L=barrel===2?.6:1.4;
 const at=(d,o=0)=>P(tx+cos*d-sin*o,ty+sin*d+cos*o);
 c.beginPath();c.moveTo(...at(0,seg[0][1]));
 for(let k=1;k<seg.length;k++){const d=Math.min(L,seg[k][0]);c.lineTo(...at(d,seg[k-1][1]));if(d>=L)break;c.lineTo(...at(d,seg[k][1]));}
 c.lineTo(...at(L,seg[seg.length-1][1]*(barrel===2?1.4:1)));c.lineTo(...at(L,-seg[seg.length-1][1]*(barrel===2?1.4:1)));
 for(let k=seg.length-1;k>=1;k--){const d=Math.min(L,seg[k][0]);if(d>=L)continue;c.lineTo(...at(d,-seg[k][1]));c.lineTo(...at(d,-seg[k-1][1]));}
 c.lineTo(...at(0,-seg[0][1]));c.closePath();
 for(const d of [.42,.82,1.18])if(d<L-.05){c.moveTo(...at(d-.02,.085));c.lineTo(...at(d+.02,.085));c.lineTo(...at(d+.02,-.085));c.lineTo(...at(d-.02,-.085));}
 if(barrel<2){c.moveTo(...at(1.36,.06));c.lineTo(...at(1.41,.06));c.lineTo(...at(1.41,-.06));c.lineTo(...at(1.36,-.06));}
 else{const [bx,by]=at(L+.05,0);c.moveTo(bx,by);c.lineTo(bx+.55*u,ground-.12*u);c.lineTo(bx+.6*u,ground-.18*u);c.lineTo(bx+.06*u,by-.07*u);}
 // Recoil cylinders under the barrel's root.
 c.moveTo(...at(.05,.11));c.lineTo(...at(.5,.11));c.lineTo(...at(.5,.07));c.lineTo(...at(.05,.07));fill();
 spots.barrel=at(Math.min(L,.9),0);const muzzle=at(L,0);
 // Camelback bracing over the barrel while it stands.
 if(barrel<2){c.strokeStyle='#0b0a09';c.lineWidth=Math.max(1,u*.025);c.beginPath();const peak=at(.45,-.32);c.moveTo(...at(-.05,-.06));c.lineTo(...peak);c.lineTo(...at(1.05,-.05));c.moveTo(...peak);c.lineTo(...at(.45,-.06));c.stroke();}
 // Loader crane at the rear of the carriage.
 const ld=st('loader');c.beginPath();
 if(ld<2){const swing=Math.sin(loader*Math.PI)*.06;c.rect(...P(.3,-.86),.04*u,.36*u);c.moveTo(...P(.3,-.86));c.lineTo(...P(.62,-.8+swing));c.lineTo(...P(.62,-.76+swing));c.lineTo(...P(.34,-.8));c.rect(...P(.6,-.76+swing),.02*u,.12*u);}
 else c.rect(...P(.3,-.6),.04*u,.1*u);
 fill();spots.loader=P(.32,-.62);
 c.restore();return{muzzle:barrel<2?muzzle:null,spots,width:2.2*u};
}
const PARIS_RUIN_SHOTS=6,PARIS_KEY={};

// Laon, Entente: Paris as the Paris Gun's target. Each shell that lands breaks
// more of the city; the distant gun sits on the left horizon.
export function drawParisStrip(c,{shotCount=0,gunHp=1,phase='',time=0,locale='ko'},w,h){
 c.clearRect(0,0,w,h);const en=locale==='en',damage=Math.min(1,shotCount/PARIS_RUIN_SHOTS),left=0;
 sky(c,w,h,damage*.8);
 paintSkyline(c,skyline('paris',LANDMARKS.paris,'paris',.8),left,w-left,h,{damage,ruined:false,time,maxFires:Math.min(6,shotCount*2)});
 hitFlash(c,PARIS_KEY,-shotCount,time,left,w-left,h);
 const nw=label(c,h,left+5,en?'Paris':'파리','#bdb3a0');label(c,h,left+5+nw,shotCount?(en?`hit ${shotCount}`:`피격 ${shotCount}`):(en?'untouched':'무사'),shotCount?'#f0a35a':'#e6dcc6');
 if(phase==='ready')label(c,h,w-5,en?'Shell inbound':'포격 임박','#ff7a5c','right',.65+.35*Math.sin(time*10));
 return true;
}

// Laon, Central: the Paris Gun itself, from its painted art, firing at the far
// Paris skyline. Parts smoke when damaged and burn when lost; a lost barrel is
// snapped off the silhouette. Each shot lights one mark on the shell arc.
const PART_LABEL={barrel:['포신','Barrel'],breech:['약실','Breech'],loader:['장전','Loader'],ammo:['탄약','Ammo'],recoil:['복좌','Recoil']};
export function drawParisGunStrip(c,{gun,parts:ps,stateOf,time=0,locale='ko'},w,h){
 c.clearRect(0,0,w,h);if(!gun)return false;const en=locale==='en',dead=!!gun.dead,st=id=>dead&&(id==='barrel'||id==='breech')?2:stateOf(ps.get(id));
 const hpFrac=Math.max(0,gun.hp||0)/(gun.maxHp||1),damage=1-hpFrac;
 sky(c,w,h,damage*.7);
 // Low elevation so the gun spans the strip: as big as the strip height allows.
 const u=h*.95,gx=w*.42-u*1.15;glow(c,gx-u*.8,u*3,h,damage>0?.08+damage*.3:0);
 c.fillStyle='#0b0a09';c.fillRect(0,h-2,w,2);for(let x=3;x<w;x+=8)c.fillRect(x,h-3,4,1);
 const gunShape=paintGun(c,gx,h-2,u,st,{recoil:Math.min(1,(gun.recoil||0)/32),loader:gun.loaderProgress||0,elevation:.2});
 for(const [k,id] of Object.keys(gunShape.spots).entries()){const s2=st(id),[x,y]=gunShape.spots[id];
  if(s2===1)fx(c,'smokeDark',x,y-h*.3,h*.55,h*.6,0,.45);else if(s2===2)burn(c,x,y,h,time,k,h*.55,dead,damage);}
 if(gun.flash>0&&gunShape.muzzle)fx(c,'fire',gunShape.muzzle[0]+3,gunShape.muzzle[1],h*.7,h*.7,0,Math.min(1,gun.flash*5));
 const gw=gunShape.width;
 hitFlash(c,gun,gun.hp||0,time,gx-u*.9,gw+u,h);
 // One label, top right over the far city: the gun's integrity and its cycle.
 const phases={loading:en?'Loading':'장전',ready:en?'Firing':'발사 직전',recoil:en?'Fired':'발사',return:en?'Returning':'복좌',reload:en?'Reloading':'재장전'};
 const ready=gun.phase==='ready',pct=gun.phase==='loading'||gun.phase==='reload'?' '+Math.round((gun.phaseProgress||0)*100)+'%':'';
 const tail=dead?'':' · '+(phases[gun.phase]||'')+pct,head=(en?'Gun ':'파리포 ')+(dead?(en?'destroyed':'파괴'):Math.ceil(hpFrac*100)+'%');
 const tw=label(c,h,w-5,tail,ready?'#ffd27a':'#e6dcc6','right',ready?.65+.35*Math.sin(time*10):1);
 label(c,h,w-5-(tail?tw-4:0),head,dead?'#e0806a':hpFrac<=.34?'#f0a35a':'#e6dcc6','right');
 return true;
}
