import {planeSprite} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1&rim=idle&decode=1';
import {fx} from './fx-art.js?v=tame3';
import {drawFlakAirburst} from './flak-airburst-art.js';
import {drawIncendiaryFire} from './incendiary-fire.js';
import {hasSecretWeapon} from './secret-weapons.js';
import {steelDartPoint} from './secret-weapon-combat.js';

const sprites=Object.create(null);
let bombShadow;
export const secretWeaponArtReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(
 ['sn1650','badin-gauge','grunkreuz-stencil'].map(key=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   sprites[key]=image;
   if(key==='sn1650'){
    bombShadow=document.createElement('canvas');
    bombShadow.width=image.naturalWidth;bombShadow.height=image.naturalHeight;
    const shadow=bombShadow.getContext('2d');
    shadow.drawImage(image,0,0);shadow.globalCompositeOperation='source-in';
    shadow.fillStyle='#161912';shadow.fillRect(0,0,bombShadow.width,bombShadow.height);
   }
   resolve(true);
  };
  image.onerror=()=>resolve(false);
  image.src=new URL('./secret-ordnance-'+key+'.webp',import.meta.url).href;
 }))
).then(results=>results.every(Boolean));

const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const mix=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function paint(c,key,x,y,w,h,a=0,alpha=1){
 const image=key==='shadow'?bombShadow:sprites[key];
 if(!image||alpha<=0)return;
 c.save();c.translate(x,y);if(a)c.rotate(a);c.globalAlpha*=alpha;
 c.imageSmoothingEnabled=true;c.drawImage(image,-w/2,-h/2,w,h);c.restore();
}

export function secretBomberAirframe(faction){
 return faction==='central'?'bomber-transfer-gotha':'bomber-transfer-o400';
}

function drawStrategicFall(c,b,{sx,sy,z,visible},faction){
 const t=clamp(1-b.life/b.maxLife),a=b.releaseAngle,dx=Math.cos(a),dy=Math.sin(a);
 if(t<.72){
  const distance=t/.72*1250,x=b.sx-265*dx+distance*dx,y=b.sy-265*dy+distance*dy;
  if(visible(x,y,230))planeSprite(c,sx(x),sy(y),a,secretBomberAirframe(faction),3.2*z,false,true);
 }
 if(!visible(b.x,b.y,200))return;
 const x=sx(b.x),y=sy(b.y),fall=clamp((t-.54)/.46),shadow=clamp((t-.20)/.8);
 const shade=46+shadow*90;
 paint(c,'shadow',x+12*z,y+8*z,shade*z,shade*.28*z,a,.10+shadow*.42);
 if(t<.54)return;
 const offset=250*(1-fall*fall),length=(48+fall*86)*z;
 const bx=x-dx*offset*z,by=y-dy*offset*z;
 fx(c,'smokeTrail',bx-dx*24*z,by-dy*24*z,55*z,13*z,a,.37*(1-fall));
 paint(c,'sn1650',bx,by,length,length*.28,a,1);
}

function drawBadin(c,players,now,{sx,sy,z,visible}){
 for(const p of players){
  if(!hasSecretWeapon(p,'badinBreakthrough')||p.hp<=0||p.status==='downed'||!visible(p.x,p.y))continue;
  const state=p.secretWeaponState.effects.badinBreakthrough,straight=p.equipmentStraight||0;
  const q=clamp((state?.visualUntil-now+.26)/.36)||0;
  if(straight<.25&&q<=0)continue;
  const a=p.a||0,ca=Math.cos(a),sa=Math.sin(a),x=sx(p.x),y=sy(p.y);
  const size=45*z,gx=x-37*z,gy=y+44*z,ratio=clamp((state?.visualRatio-1.08)*2.7)||0;
  if(sprites['badin-gauge']){
   const needle=-2.52+3.85*clamp(straight*.45+q*(.3+ratio*.25));
   c.save();c.globalAlpha*=Math.min(1,straight+q);paint(c,'badin-gauge',gx,gy,size,size);
   c.lineCap='round';c.strokeStyle='#522219';c.lineWidth=1.7*z;c.beginPath();
   c.moveTo(gx,gy);c.lineTo(gx+Math.cos(needle)*size*.29,gy+Math.sin(needle)*size*.29);c.stroke();
   c.restore();
  }
  for(const side of [-1,1])fx(c,'mist',x-ca*25*z-sa*side*31*z,y-sa*25*z+ca*side*31*z,(36+ratio*35)*z,8*z,a,q*.38);
 }
}

export function drawSecretWeaponFx(c,world,view,art,{low,factionFor}={}){
 const {sx,sy,z,visible}=view,{sprite,cable}=art,now=world.t||0,players=world.players||[world];
 const faction=id=>factionFor?.(players.find(p=>p.id===id)||players[0]);
 for(const b of world.friendlyBombs||[]){
  if(b.life<=0)continue;
  if(b.secretWeapon==='sn1650'){drawStrategicFall(c,b,view,faction(b.ownerId));continue;}
  if(!visible(b.x,b.y,120))continue;
  if(b.secretWeapon==='explosiveArmor'){
   const t=clamp(1-b.life/b.maxLife),a=b.releaseAngle;
   const x=sx(mix(b.sx,b.x,t)),y=sy(mix(b.sy,b.y,t));
   fx(c,'metalShard'+b.secretArmorSlot,x,y,(12+t*9)*z,9*z,a+t*5,1);
   fx(c,'smokeTrail',x-Math.cos(a)*12*z,y-Math.sin(a)*12*z,29*z,12*z,a,.62*(1-t));
  }
  if(b.secretGasMarked){
   const t=clamp(1-b.life/(b.maxLife||b.life)),x=sx(mix(b.sx??b.x,b.x,t)),y=sy(mix(b.sy??b.y,b.y,t));
   paint(c,'grunkreuz-stencil',x,y,14*z,14*z,b.releaseAngle??0);
  }
 }
 drawBadin(c,players,now,view);
 for(const cue of world.secretWeaponFx||[]){
  const age=now-cue.at,life=cue.life||.45;
  if(age<0||age>=life)continue;
  if(cue.kind==='bomberPass'){
   const elapsed=age-cue.delay;if(elapsed<0)continue;
   const x=cue.x+Math.cos(cue.a)*elapsed*cue.speed,y=cue.y+Math.sin(cue.a)*elapsed*cue.speed;
   if(!visible(x,y,230))continue;
   const key=secretBomberAirframe(faction(cue.ownerId)),scale=1.95*z;
   planeSprite(c,sx(x)+23*z,sy(y)+31*z,cue.a,key,scale,false,true);
   planeSprite(c,sx(x),sy(y),cue.a,key,scale);
   continue;
  }
  if(!visible(cue.x,cue.y,330))continue;
  const x=sx(cue.x),y=sy(cue.y),a=cue.a||0,t=age/life,fade=1-t,ca=Math.cos(a),sa=Math.sin(a);
  const stamp=(key,dx,dy,w,h,angle=a,alpha=fade)=>fx(c,key,x+dx*z,y+dy*z,w*z,h*z,angle,alpha);
  const forward=(key,d,side,w,h,angle=a,alpha=fade)=>stamp(key,ca*d-sa*side,sa*d+ca*side,w,h,angle,alpha);
  const spray=(count,speed,emit)=>{
   for(let i=0;i<count;i++){
    const h=a+i*2.39996,travel=speed*age*(.55+(i%4)*.19);
    emit(i,h,Math.cos(h)*travel,Math.sin(h)*travel);
   }
  };
  switch(cue.kind){
  case 'rotary': {
   if(age<.085){
    const offset=Math.sin(cue.phase+age*85)*4.5;
    forward('muzzleTwin',32,offset,32,14,a,1-age/.092);
    forward('muzzleHeavy',35,-offset*.58,27,10,a,.78*(1-age/.085));
   }
   for(const side of [-1,1]){
    const d=3-age*81,off=side*(12+age*93),drop=age*age*96,k=1-.63*t;
    stamp('bulletBrass',ca*d-sa*off,sa*d+ca*off+drop,11*k,4*k,a+side*age*17,Math.min(1,fade*2));
   }
   break;
  }
  case 'rotaryHit':
   stamp('spark',0,0,24+16*t,18,a,Math.max(0,1-t*1.9));
   stamp('debris',8+t*19,-7*t,24,18,a+t*2);
   break;
  case 'pom':
   if(age<.11)stamp('muzzleHeavy',ca*7,sa*7,59,29,a,1-age/.11);
   forward('gunSmoke',15+age*31,0,34+age*48,23+age*31,a,.82*fade);
   break;
  case 'pomImpact': {
   const radius=cue.radius||103;
   if(age<.12)stamp('armorSpark',0,0,radius*.88,radius*.66,a,1-age/.12);
   drawFlakAirburst(c,x,y,radius*(1.15+t*.66)*z,t,a,.92);
   stamp('smokeDark',-9*t,14*t,62+t*43,45+t*28,a+.4,.42*fade);
   spray(low?6:11,radius*2.3,(i,h,dx,dy)=>stamp('metalShard'+i%6,dx,dy,9+4*(i%3),5,h+i*age,.91*fade));
   break;
  }
  case 'flakHit':
   stamp('armorSpark',0,0,29+12*t,22,a,fade);
   stamp('debris',7+18*t,13*t,29,23,a+t*2);
   break;
  case 'heavyImpact': {
   const r=cue.radius||198;
   if(age<.18)stamp('fireFlash',0,0,r*1.88,r*1.30,0,.93*(1-age/.18));
   if(age<1.2){
    const rise=clamp(age/.63),flame=clamp((1.2-age)/.52);
    if(cue.water)stamp('splashShell',0,0,r*(.65+rise),r*(.65+rise),0,flame);
    else {
     const fire=age<.17?'bombfx0':age<.34?'bombfx1':age<.59?'bombfx2':'bombfx3';
     stamp(fire,0,0,r*(1.02+rise*.47),r*(1.02+rise*.47),.37,flame);
     if(age<.54)stamp('fireFlash',0,0,r*(.53+rise*.41),r*(.53+rise*.41),.82,flame*.88);
    }
   }
   const ground=clamp((age-.11)/1.16);
   if(age>.11)for(let i=0;i<(low?3:5);i++){
    const h=i*TAU/(low?3:5),radius=ground*r*.90;
    const opacity=Math.min(1,(age-.11)*4)*Math.pow(1-t,1.65);
    const dx=Math.cos(h)*radius,dy=Math.sin(h)*radius;
    if(cue.water)stamp('splashShell',dx,dy,r*(.32+.53*ground),r*(.22+.38*ground),h,opacity);
    else stamp(i%2?'dirtBurst':'dirtMix',dx,dy,r*(.40+.55*ground),r*(.27+.28*ground),h,opacity);
   }
   if(age<1.4)spray(low?5:10,r*.87,(i,h,dx,dy)=>stamp('rockChunk'+i%6,dx,dy,16+i%3*7,14,h+age*5,1-age/1.4));
   if(age>.27)for(let i=0;i<(low?3:5);i++){
    const rise=clamp((age-i*.10)/1.8),opacity=Math.min(1,(age-.27)*2)*fade*.76;
    stamp('smokeDark',Math.cos(i*2.4)*(18+rise*38)+rise*19,Math.sin(i*2.4)*(14+rise*33)+rise*12,67+i*12+35*t,64+i*9+32*t,i*.85,opacity);
   }
   break;
  }
  case 'steelRain':
   for(let i=0;i<24;i++){
    if(low&&i%2===1)continue;
    const delay=.22+Math.floor(i/6)*.07,flight=.11+(i%5)*.019,k=clamp(1-(delay-age)/flight);
    if(k<=0||k>=1)continue;
    const p=steelDartPoint(cue,i),height=(1-k*k)*(94+i%5*21),side=(1-k)*(i%3-1)*17;
    const px=sx(p.x-ca*height-sa*side),py=sy(p.y-sa*height+ca*side);
    sprite(c,'flechetteDart',px,py,(18+9*k)*z,a+Math.sin(k*3+i)*.21,Math.min(1,k*4));
    if((i+Math.floor(k*13))%4===0)fx(c,'spark',px,py,9*z,5*z,a,.65);
   }
   break;
  case 'dartHit': {
   const target=cue.targetId!=null&&(world.enemies||[]).find(e=>e.id===cue.targetId||e.tailId===cue.targetId);
   const dx=target?target.x+cue.offsetX-cue.x:0,dy=target?target.y+cue.offsetY-cue.y:0;
   if(age<.19){stamp('spark',dx,dy,21,16,a,1-age/.19);stamp('debris',dx+age*77,dy+age*64,24,19,a+t*2,1-age/.19);}
   sprite(c,'flechetteDart',x+dx*z,y+dy*z,17*z,a,Math.min(.9,fade*2.5));
   break;
  }
  case 'gasBarrage': {
   const r=cue.radius||122,spread=clamp(age/.94),density=clamp(age*6)*Math.min(1,fade*2.9);
   for(let i=0;i<(low?4:7);i++){
    const h=i*2.39996,k=i===0?0:r*(.12+spread*(.27+i%3*.10)),alpha=density*(i===0?.65:.74)*(i===0?1:Math.min(1,fade*5));
    stamp(i%3?'gas':'gasSmall',Math.cos(h)*k+t*14,Math.sin(h)*k-t*9,r*(.46+spread*.51),r*(.40+spread*.47),h+t*.24,alpha);
   }
   break;
  }
  case 'gasHit':
   stamp('gasSmall',t*14,t*-19,34+t*22,24+t*14,a,.78*fade);
   stamp('smokeWisp',6+t*16,-7-t*19,27,18,-1,.65*fade);
   break;
  case 'firechain': {
   const livePoint=id=>id!=null&&(world.enemies||[]).find(e=>e.id===id||e.tailId===id);
   const start=livePoint(cue.originId)||cue;
   for(const link of cue.links||[]){
    const end=livePoint(link.id)||link,dx=end.x-start.x,dy=end.y-start.y,h=Math.atan2(dy,dx);
    const k=clamp(age/.26),flicker=age>.63?clamp((life-age)/.21):1;
    const ox=sx(start.x),oy=sy(start.y),ex=sx(end.x),ey=sy(end.y);
    c.save();c.globalAlpha*=flicker;
    if(age<.66)cable(c,ox,oy,ex,ey,z,9*z);
    const px=ox+(ex-ox)*k-Math.sin(h)*18*z*k*(1-k),py=oy+(ey-oy)*k+Math.cos(h)*18*z*k*(1-k);
    if(k<1)fx(c,'flameJet',px,py,45*z,19*z,h,1);
    drawIncendiaryFire(c,ex,ey,h,49*z,age,flicker,'legacy');
    if(age>.56)fx(c,'metalShard3',ex+(age-.56)*48*z,ey+(age-.56)*81*z,13*z,8*z,h+age*9,fade);
    c.restore();
   }
   break;
  }
  case 'wake':
   for(const side of [-1,1]){
    const h=a+side*(.9+t*1.4),r=10+t*40;
    stamp('mist',Math.cos(h)*r,Math.sin(h)*r,54+15*t,10+t*5,h+side*Math.PI/2,.66*fade);
   }
   break;
  case 'ram':
   if(age<.12)stamp('armorSpark',0,0,63,43,a,1-age/.12);
   for(let i=0;i<(low?4:8);i++){
    const h=a+(i-3.5)*.26,r=age*(78+i%3*46);
    if(i%3)stamp('debris',Math.cos(h)*r,Math.sin(h)*r+age*age*51,20+i%4*5,16+i%3*3,h+age*(5+i),fade);
    else stamp('metalShard'+i%6,Math.cos(h)*r,Math.sin(h)*r,16,9,h+age*6,fade);
   }
   break;
  case 'armorLaunch':
   if(age<.12)stamp('armorSpark',ca*12,sa*12,38,29,a,.95*(1-age/.12));
   for(let i=0;i<(low?3:5);i++){
    const h=a+i*2.39996,r=10+age*(36+i*16);
    stamp('metalShard'+i,Math.cos(h)*r,Math.sin(h)*r,17,9,h+age*12,fade);
   }
   break;
  case 'armorImpact': {
   const h=a+(cue.slot%3-1)*.25;
   if(age<.22)stamp(cue.slot%2?'shellBurst1':'shellBurst0',ca*t*15,sa*t*15,60+t*22,39+t*12,h,1-age/.22);
   forward('gunSmoke',12+t*26,0,32+t*31,20+t*17,h,.68*fade);
   spray(low?3:5,85,(i,h,dx,dy)=>stamp('metalShard'+i,dx,dy,10,6,h+age*8,fade));
   break;
  }
  case 'wingAttack':
   forward('muzzleTwin',23,0,29,14,a,Math.max(0,1-age/.13));
   forward('gunSmoke',23+age*48,0,23,10,a,.52*fade);
   break;
  case 'wingHit':
   stamp('spark',0,0,26,18,a,.9*fade);
   stamp('debris',12*t,16*t,24,18,a+t*2,fade);
   break;
  case 'wingSkill':
   if(cue.mode==='ignite')forward('fireWing',16,0,48,20);
   else if(['dive','charge'].includes(cue.mode))forward('smokeTrail',-25,0,65,14);
   else forward('muzzleTwin',27,0,38,17);
   break;
  case 'bomberRelease':
   forward('gunSmoke',-14-t*22,0,46,24,a,.58*fade);
   break;
  case 'bomberImpact': {
   const h=a+(cue.slot%3-1)*.37;
   if(age<.56)stamp(age<.14?'bombfx0':age<.29?'bombfx1':'bombfx2',0,-age*19,99+age*62,79+age*45,h,1-age/.58);
   if(age>.12)forward('dustPuff',13+t*48,0,92+t*58,44+t*32,h,.68*fade);
   if(age>.25){
    stamp('fireGround',0,-4,50+t*13,34,0,.79*fade);
    stamp('smokeDark',18*t,-22-48*t,63+t*34,52+t*30,h,.72*fade);
   }
   break;
  }
  }
 }
}
