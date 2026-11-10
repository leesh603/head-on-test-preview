import {planeSprite} from './aircraft.js?v=b3bf991d11fc7798';
import {fx} from './fx-art.js?v=b3bf991d11fc7798';
import {drawFlakAirburst} from './flak-airburst-art.js?v=b3bf991d11fc7798';
import {drawIncendiaryFire} from './incendiary-fire.js?v=b3bf991d11fc7798';
import {prepareSandVortexArt} from './sand-vortex-art.js?v=b3bf991d11fc7798';
import {KETTERING_DIVE} from './secret-weapon-combat.js?v=b3bf991d11fc7798';

const sprites=Object.create(null);
let bombShadow,bugShadow,badinVortex;
export const secretWeaponArtReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(
 ['sn1650','grunkreuz-stencil','kettering','ranken'].map(key=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   sprites[key]=image;
   if(key==='sn1650'||key==='kettering'){
    const silhouette=document.createElement('canvas');
    silhouette.width=image.naturalWidth;silhouette.height=image.naturalHeight;
    const shadow=silhouette.getContext('2d');
    shadow.drawImage(image,0,0);shadow.globalCompositeOperation='source-in';
    shadow.fillStyle='#161912';shadow.fillRect(0,0,silhouette.width,silhouette.height);
    if(key==='sn1650')bombShadow=silhouette;else bugShadow=silhouette;
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
 const image=key==='shadow'?bombShadow:key==='bugShadow'?bugShadow:sprites[key];
 if(!image||alpha<=0)return;
 c.save();c.translate(x,y);if(a)c.rotate(a);c.globalAlpha*=alpha;
 c.imageSmoothingEnabled=true;c.drawImage(image,-w/2,-h/2,w,h);c.restore();
}

export function secretBomberAirframe(faction){
 return faction==='central'?'bomber-transfer-gotha':'bomber-transfer-o400';
}

function drawBadinVortex(c,x,y,a,side,size,phase,opacity){
 if(!badinVortex){
  const source=prepareSandVortexArt();
  if(!source?.naturalWidth)return;
  badinVortex=document.createElement('canvas');
  badinVortex.width=128;badinVortex.height=128;
  const g=badinVortex.getContext('2d');
  g.filter='grayscale(1) brightness(1.6)';
  g.drawImage(source,0,0,128,128);
 }
 c.save();c.translate(x,y);c.rotate(a);
 c.scale(1.3,side*.85);c.rotate(phase);c.globalAlpha*=opacity;
 c.drawImage(badinVortex,-size/2,-size/2,size,size);c.restore();
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

function drawKettering(c,b,{sx,sy,z,visible}){
 const image=sprites.kettering;
 if(!image||!visible(b.x,b.y,110))return;
 const a=b.a,x=sx(b.x),y=sy(b.y),dive=clamp(1-b.life/KETTERING_DIVE);
 const width=52*z,height=width*image.naturalHeight/image.naturalWidth;
 paint(c,'bugShadow',x+z*(14-11*dive),y+z*(18-15*dive),width*(.83+.10*dive),height,a+Math.PI/2,.18+.37*dive);
 if(!dive){
  const d=14+Math.sin(b.life*30)*2;
  fx(c,'smokeWisp',x-Math.cos(a)*d*z,y-Math.sin(a)*d*z,24*z,8*z,a,.45);
  paint(c,'kettering',x,y,width,height,a+Math.PI/2);
  return;
 }
 const iw=image.naturalWidth,ih=image.naturalHeight,l=Math.round(iw*.45),r=iw-l;
 const top=Math.round(ih*.116),bottom=Math.round(ih*.68),k=width/iw;
 c.save();c.translate(x,y);c.rotate(a+Math.PI/2);
 // The intact sprite supplies both wing panels and the separate falling body.
 for(const side of [-1,1]){
  c.save();c.translate(side*width*dive*.7,height*dive*.7);c.rotate(side*dive*1.6);c.globalAlpha*=1-dive*.85;
  const sx=side<0?0:r;
  c.drawImage(image,sx,top,l,bottom-top,sx*k-width/2,top*k-height/2,l*k,(bottom-top)*k);
  c.restore();
 }
 c.scale(1-.18*dive,1-.58*dive);
 for(const [u,v,w,h] of [[0,0,iw,top],[l,top,r-l,bottom-top],[0,bottom,iw,ih-bottom]]){
  c.drawImage(image,u,v,w,h,u*k-width/2,v*k-height/2,w*k,h*k);
 }
 c.restore();
}

export function drawSecretWeaponFx(c,world,view,art,{low,factionFor}={}){
 const {sx,sy,z,visible}=view,{sprite,cable}=art,now=world.t||0,players=world.players||[world];
 const faction=id=>factionFor?.(players.find(p=>p.id===id)||players[0]);
 for(const b of world.friendlyBombs||[]){
  if(b.life<=0)continue;
  if(b.secretWeapon==='sn1650'){drawStrategicFall(c,b,view,faction(b.ownerId));continue;}
  if(b.secretWeapon==='ketteringBug'){drawKettering(c,b,view);continue;}
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
 for(const b of world.bullets||[]){
  if(!b.secretAirRound||b.actualExplosion||b.life<=0||!visible(b.x,b.y,30))continue;
  const a=Math.atan2(b.vy,b.vx),x=sx(b.x),y=sy(b.y);
  if(b.secretWeapon==='villarPerosa')fx(c,'bulletBrass',x,y,11*z,2.7*z,a,.94);
  else if(b.secretWeapon==='rankenExplosiveDarts')paint(c,'ranken',x,y,22*z,5.4*z,a);
 }
 for(const cue of world.secretWeaponFx||[]){
  const age=now-cue.at,life=cue.life||.45;
  if(age<0||age>=life)continue;
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
  case 'villarShot':
   if(age<.055)forward('muzzle',5,0,23,10,a,1-age/.055);
   forward('gunSmoke',5+age*36,0,19,9,a,.43*fade);
   break;
  case 'villarHit':
   stamp('ricochet',0,0,18,12,a,fade);
   spray(low?2:4,85,(i,h,dx,dy)=>stamp(i%2?'debrisShard':'metalShard2',dx,dy,9,5,h+t*4));
   break;
  case 'bugImpact': {
   const r=cue.radius||96;
   if(age<.17)stamp('fireFlash',0,0,r*1.36,r,a,1-age/.17);
   if(age<.56)stamp(age<.19?'airblast0':age<.36?'airblast1':'airblast2',0,0,r*(1.06+age),r*(.82+age),a,1-age/.56);
   if(cue.water&&age<.72)stamp('splashShell',0,0,r*1.25,r*.96,a,1-age/.72);
   if(age<.7)spray(low?4:8,135,(i,h,dx,dy)=>stamp(i%2?'debrisShard':'metalShard'+i%6,dx,dy,13,7,h+age*7,1-age/.7));
   if(age>.16)stamp('smokeDark',t*20,-t*25,r*(.64+.72*t),r*(.56+.54*t),a,.75*fade);
   break;
  }
  case 'rankenLaunch':
   if(age<.10)stamp('muzzleRear',0,0,25,15,a,1-age/.10);
   forward('gunSmoke',age*40,0,20+age*30,12,a,.65*fade);
   break;
  case 'rankenEmbed':
   paint(c,'ranken',x-ca*6*z,y-sa*6*z,18*z,4*z,a);
   if(age<.10)stamp('armorSpark',0,0,17,14,a,1-age/.10);
   break;
  case 'rankenBurst':
   if(age<.21)stamp(age<.085?'shellBurst0':'shellBurst1',0,0,34+age*50,28+age*44,a,1-age/.21);
   if(age<.29)spray(low?2:4,76,(i,h,dx,dy)=>stamp('metalShard'+i,dx,dy,9,5,h+age*12,1-age/.29));
   stamp('fireSmall',2,-2,22,18,a,.83*fade);
   if(age>.08)stamp('smokeDark',5*t,-10*t,19+t*16,16+t*16,a,.7*fade);
   break;
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
   if(age<.18){
    const flash=1-age/.18;
    stamp('fireFlash',0,0,72+t*46,60+t*35,a,flash);
    stamp('armorSpark',0,0,105+t*52,86+t*46,a,flash*.95);
   }
   stamp('gunSmoke',0,0,38+t*91,30+t*76,a,.78*fade);
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
  case 'badinWake':
  case 'wake': {
   const strike=cue.kind==='wake',power=cue.power||0;
   const size=(strike?42:30)+t*(33+power*20),rear=(strike?8:16)+t*29;
   const opacity=Math.min(1,fade*1.6)*(strike?.90:.72);
   for(const side of [-1,1]){
    const tip=side*(27+t*(11+power*8)),d=-rear+(side===1?5:-5);
    forward('vaporTrail',d-24,tip+side*7,67+power*19,14+7*t,a-side*.20,opacity*.44);
    drawBadinVortex(c,x+(ca*d-sa*tip)*z,y+(sa*d+ca*tip)*z,a,side,size*z,age*10.5,opacity);
   }
   break;
  }
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
