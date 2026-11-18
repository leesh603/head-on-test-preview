import {planeSprite} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1&rim=idle&decode=1&depth=20261111&lazy=20261117';
import {outlineSmallAirframe,drawSmallAirframe} from './aircraft-rim.js';
import {fx} from './fx-art.js?v=tame3';
import {drawFlakAirburst} from './flak-airburst-art.js';
import {drawIncendiaryFire} from './incendiary-fire.js';
import {prepareSandVortexArt} from './sand-vortex-art.js?v=regionalair2';
import {KETTERING_DIVE} from './secret-weapon-combat.js';
import {hasSecretWeapon} from './secret-weapons.js';
import {bombSprite} from './bomb-sprites.js?v=bomb20&perf=1029';
const SELECTED_ART=['le-prieur-mount','salamander-mount','siemens-halske-rotor'];

const sprites=Object.create(null);
let bombShadow,bugShadow,badinVortex,ketteringFrames;
function prepareKetteringFrames(image){
 const w=image.naturalWidth,h=image.naturalHeight,l=Math.round(w*.45),r=w-l;
 const top=Math.round(h*.116),bottom=Math.round(h*.68),wingHeight=bottom-top;
 return {
  full:outlineSmallAirframe(image),
  wings:[outlineSmallAirframe(image,[[0,top,l,wingHeight]]),outlineSmallAirframe(image,[[r,top,l,wingHeight]])],
  body:outlineSmallAirframe(image,[[0,0,w,top],[l,top,r-l,wingHeight],[0,bottom,w,h-bottom]])
 };
}
export const secretWeaponArtReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(
 ['sn1650','grunkreuz-stencil','kettering','ranken',...SELECTED_ART].map(key=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   sprites[key]=image;
   if(key==='sn1650'||key==='kettering'){
    const silhouette=document.createElement('canvas');
    silhouette.width=image.naturalWidth;silhouette.height=image.naturalHeight;
    const shadow=silhouette.getContext('2d');
    shadow.drawImage(image,0,0);shadow.globalCompositeOperation='source-in';
    shadow.fillStyle='#161912';shadow.fillRect(0,0,silhouette.width,silhouette.height);
    if(key==='sn1650')bombShadow=silhouette;else{
     bugShadow=silhouette;
     ketteringFrames=prepareKetteringFrames(image);
    }
   }
   resolve(true);
  };
  image.onerror=()=>resolve(false);
  const artwork=key==='sn1650'?'secret-ordnance-sn1650-ink-20261115':`secret-ordnance-${key}`;
  image.src=new URL('./'+artwork+'.webp',import.meta.url).href;
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

// The caller's existing aircraft transform supplies heading and bank.
export function drawSecretAirframeHardware(c,p,scale,time){
 if(!p.secretWeaponState?.slots)return;
 const fit=p.bomberTransfer;
 if(hasSecretWeapon(p,'lePrieurSalvo')){
  const width=fit?.hullWidth?Math.min(1.7,fit.hullWidth/31):1;
  for(const side of [-1,1])paint(c,'le-prieur-mount',5*scale,side*22*width,24*width,30*scale,Math.PI/2);
 }
 if(hasSecretWeapon(p,'salamanderArmor')){
  const wear=p.secretWeaponState.effects.salamanderArmor?.wear||0;
  const length=(fit?.hullLength??27)*.86,width=(fit?.hullWidth??25)*.68;
  paint(c,'salamander-mount',5*scale,0,width,length,Math.PI/2,.88);
  for(let i=0;i<Math.floor(wear*5);i++){
   const side=i%2?1:-1;
   fx(c,'ricochet',i*3.4,side*width*.38,5+i%3,2.7,side*(.3+i*.58),.45);
  }
 }
 if(hasSecretWeapon(p,'siemensHalske')){
  const state=p.secretWeaponState.effects.siemensHalske,load=state?.load||0;
  // The crank is internal. The existing aircraft propeller remains the sole propeller.
  c.save();c.translate(28*scale,0);c.scale(.32,1);
  const spin=time*12+load*.45;
  paint(c,'siemens-halske-rotor',0,0,16*scale,16*scale,spin,.68+load*.3);
  c.restore();
 }
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
  g.filter='grayscale(1) brightness(2)';
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
 const shade=43+shadow*101;
 paint(c,'shadow',x+12*z,y+8*z,shade*z,shade*.28*z,a,.10+shadow*.42);
 if(t<.54)return;
 const offset=250*(1-fall*fall),length=(48+fall*86)*z;
 const bx=x-dx*offset*z,by=y-dy*offset*z;
 // Air compresses along the fins as the large bomb overtakes its shadow.
 for(const side of [-1,1]){
  const back=(26+fall*29)*z,cross=side*length*.10;
  fx(c,'vaporTrail',bx-dx*back-dy*cross,by-dy*back+dx*cross,(36+fall*49)*z,(6+fall*4)*z,a+side*.09,.40+fall*.38);
 }
 paint(c,'sn1650',bx,by,length,length*.28,a,1);
}

function drawKettering(c,b,{sx,sy,z,visible}){
 const image=sprites.kettering;
 if(!image||!ketteringFrames||!visible(b.x,b.y,110))return;
 const a=b.a,x=sx(b.x),y=sy(b.y),dive=clamp(1-b.life/KETTERING_DIVE);
 const width=52*z,height=width*image.naturalHeight/image.naturalWidth;
 paint(c,'bugShadow',x+z*(14-11*dive),y+z*(18-15*dive),width*(.83+.10*dive),height,a+Math.PI/2,.18+.37*dive);
 if(!dive){
  const pulse=(1+Math.sin(b.life*30))*.5,d=(23+pulse*7)*z;
  fx(c,'engineSmoke',x-Math.cos(a)*d,y-Math.sin(a)*d,(43+pulse*12)*z,13*z,a,.58+pulse*.18);
  c.save();c.translate(x,y);c.rotate(a+Math.PI/2);
  drawSmallAirframe(c,ketteringFrames.full,width);c.restore();
  return;
 }
 // Once the engine cuts, the two loose wings spin outward and the body dives between them.
 const slip=(16+32*dive)*z;
 fx(c,'vaporTrail',x-Math.cos(a)*slip,y-Math.sin(a)*slip,(43+59*dive)*z,(9-4*dive)*z,a,.83*Math.sin(dive*Math.PI));
 c.save();c.translate(x,y);c.rotate(a+Math.PI/2);
 // Separate rims keep the exposed edges readable after the wing release.
 for(const side of [-1,1]){
  c.save();c.translate(side*width*dive*1.08,height*dive*.82);c.rotate(side*dive*2.2);c.globalAlpha*=1-dive*.69;
  drawSmallAirframe(c,ketteringFrames.wings[side<0?0:1],width);
  c.restore();
 }
 c.scale(1-.18*dive,1-.58*dive);
 drawSmallAirframe(c,ketteringFrames.body,width);
 c.restore();
}

export function drawSecretWeaponFx(c,world,view,art,{low,factionFor}={}){
 const {sx,sy,z,visible}=view,{sprite,cable}=art,now=world.t||0,players=world.players||[world];
 const faction=id=>factionFor?.(players.find(p=>p.id===id)||players[0]);
 for(const b of world.friendlyBombs||[]){
  if(b.life<=0)continue;
  if(b.secretWeapon==='sn1650'){drawStrategicFall(c,b,view,faction(b.ownerId));continue;}
  if(b.secretWeapon==='ketteringBug'){drawKettering(c,b,view);continue;}
  if(b.secretWeapon==='puw50'){
   if(visible(b.x,b.y,75)){
    const fall=clamp(1-b.life/b.maxLife),a=Math.hypot(b.vx,b.vy)>1?Math.atan2(b.vy,b.vx):b.releaseAngle;
    bombSprite(c,'puw',sx(b.x),sy(b.y),46*z*(1-.27*fall*fall),a,1,1-.34*fall*fall);
   }
   continue;
  }
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
  if(b.secretWeapon==='villarPerosa'){
   fx(c,'bulletBrass',x,y,15*z,4*z,a,.98);
  }
  else if(b.secretWeapon==='rankenExplosiveDarts'){
   const dx=Math.cos(a),dy=Math.sin(a);
   fx(c,'smokeTrail',x-dx*22*z,y-dy*22*z,46*z,8*z,a,.82);
   paint(c,'ranken',x,y,29*z,7.2*z,a);
  }
  else if(b.secretDavisRear)fx(c,'metalShard3',x,y,13*z,5*z,a+b.life*19,.9);
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
  case 'lePrieurIgnition': {
   // The eight rack mouths fire in alternation; each jet comes from its own rail.
   const side=cue.slot%2?-1:1;
   if(age<.18)forward('exhaust',-14-age*105,0,57+age*68,15-age*22,a,1-age/.18);
   forward('smokeHeavy',-17-age*72,side*(2+t*5),32+t*38,12+t*18,a+side*.08,.78*fade);
   if(age<.14)forward('muzzle',3,0,31,13,a,1-age/.14);
   break;
  }
  case 'lePrieurImpact': {
   const r=cue.radius||64,frame=Math.min(3,Math.floor(t*5));
   stamp('airblast'+frame,0,0,r*(1.05+t*.69),r*(.79+t*.48),a,Math.min(1,fade*2.4));
   if(age<.12)forward('fireFlash',3,0,r*.88,r*.50,a,1-age/.12);
   if(age<.34)spray(low?3:5,131,(i,h,dx,dy)=>stamp('fireFlash',dx,dy,13,6,h,1-age/.34));
   if(age>.10)forward('smokeDark',9+t*18,0,r*(.51+t*.53),r*(.39+t*.28),a,.69*fade);
   break;
  }
  case 'davisShot': {
   // Recoilless discharge has two real origins, not a second forward shell.
   if(age<.19)forward('muzzleHeavy',17,0,103,43,a,1-age/.19);
   forward('gunSmoke',17+age*29,0,49+t*40,22+t*21,a,.71*fade);
   const backX=sx(cue.rearX),backY=sy(cue.rearY);
   if(age<.23)fx(c,'muzzleRear',backX-ca*13*z,backY-sa*13*z,77*z,28*z,a+Math.PI,1-age/.23);
   const distance=13+age*73;
   fx(c,'smokeHeavy',backX-ca*distance*z,backY-sa*distance*z,(44+t*58)*z,(22+t*30)*z,a+Math.PI,.78*fade);
   break;
  }
  case 'davisImpact': {
   const heavy=cue.armored;
   if(age<.21)stamp(heavy?'armorSpark':'fireFlash',0,0,heavy?92:76,heavy?45:57,a,1-age/.21);
   stamp('shellBurst'+Math.min(3,Math.floor(t*5)),0,0,68+54*t,50+37*t,a,Math.min(1,fade*1.65));
   for(let i=0;i<(low?3:5);i++){
    const h=a+(i-2)*.42,d=8+age*(111+(i%3)*32);
    stamp(heavy?'metalShard'+i:'debrisShard',Math.cos(h)*d,Math.sin(h)*d,heavy?16:13,8,h+age*7,fade);
   }
   break;
  }
  case 'salamanderImpact': {
   // Spall kicks back toward the incoming side of the actual plate contact.
   const wear=clamp(cue.wear||0);
   if(age<.17)stamp('armorSpark',0,0,45+wear*19,27+wear*8,a,1-age/.17);
   for(let i=0;i<(low?2:4);i++){
    const h=a+Math.PI+(i%2?1:-1)*(.40+Math.floor(i/2)*.49),d=4+age*(71+i*21);
    stamp(i<2?'ricochet':'metalShard1',Math.cos(h)*d,Math.sin(h)*d,i<2?19:10,i<2?7:5,h,fade);
   }
   break;
  }
  case 'puwDrop': {
   const side=cue.slot%2?-1:1;
   forward('vaporTrail',-11-age*38,side*5,28+t*13,8,a,.57*fade);
   forward('metalShard2',-5-t*8,side*(3+t*10),10,5,a+side*t*4,.91*fade);
   break;
  }
  case 'puwImpact': {
   const r=cue.radius||62;
   if(age<.18)stamp('fireFlash',0,0,r*1.65,r*1.05,a,1-age/.18);
   if(age<.77)stamp('bombfx'+Math.min(3,Math.floor(age/.14)),0,0,r*(1.32+t*1.05),r*(1.11+t*.74),a,Math.min(1,(.77-age)*2.9));
   stamp('dirtMix',0,3+r*t*.15,r*(1.07+t),r*(.72+t*.72),a,.91*fade);
   if(age>.18)stamp('smokeDark',0,-r*t*.45,r*(.78+t*.65),r*(.62+t*.54),a,.64*fade);
   spray(low?3:6,r*2.05,(i,h,dx,dy)=>stamp('rockChunk'+i,dx,dy,14,9,h+t*6));
   break;
  }
  case 'siemensReversal': {
   // A short compression puff at the crank gives way to two curved wakes
   // shed at the wingtips exactly when the turn changes direction.
   if(age<.19)forward('engineSmoke',18-age*38,0,29+age*40,15,a,.73*(1-age/.19));
   for(const side of [-1,1]){
    const curl=side*(.13+.58*t);
    forward('vaporTrail',-14-t*36,side*(22+t*13),38+t*25,8+t*5,a+curl,.77*fade);
   }
   break;
  }
  case 'villarShot': {
   // The real alternating barrel emits one flash and one outward brass case.
   const side=Math.sign(cue.slot)||1;
   if(age<.085)forward('muzzlePistol',8,0,37,18,a,1-age/.085);
   forward('bulletBrass',-4-t*8,side*(5+t*16),10,4,a+side*(.5+t*3),fade);
   if(!low)forward('gunSmoke',5+age*44,0,23,10,a,.48*fade);
   break;
  }
  case 'villarHit': {
   if(age<.095)stamp('armorSpark',0,0,26,14,a,1-age/.095);
   for(let i=0;i<(low?2:3);i++){
    const h=a+(i-1)*.57,d=4+age*(69+i*21);
    stamp(i===1?'debrisShard':'ricochet',Math.cos(h)*d,Math.sin(h)*d,13,5,h,fade);
   }
   break;
  }
  case 'bugImpact': {
   const r=cue.radius||96;
   if(age<.17)stamp('fireFlash',0,0,r*1.36,r,a,1-age/.17);
   if(age<.56)stamp(age<.19?'airblast0':age<.36?'airblast1':'airblast2',0,0,r*(1.06+age),r*(.82+age),a,1-age/.56);
   if(cue.water&&age<.72)stamp('splashShell',0,0,r*1.25,r*.96,a,1-age/.72);
   // The craft breaks along its incoming heading; the hot fuselage continues beyond the wings.
   if(age<.53)for(const side of [-1,1]){
    const lateral=side*(8+age*81),angle=a+side*(.5+age*5);
    forward('debrisShard',age*62,lateral,30-age*16,13,angle,1-age/.53);
   }
   if(age<.7)spray(low?4:8,135,(i,h,dx,dy)=>stamp(i%2?'debrisShard':'metalShard'+i%6,dx,dy,13,7,h+age*7,1-age/.7));
   if(age>.16)stamp('smokeDark',t*20,-t*25,r*(.64+.72*t),r*(.56+.54*t),a,.75*fade);
   break;
  }
  case 'rankenLaunch':
   if(age<.20)forward('muzzleHeavy',8,0,57+age*65,33,a,1-age/.20);
   for(let i=-2;i<=2;i++){
    if(low&&i%2)continue;
    const h=a+i*(cue.spread??.085),travel=18+age*206;
    stamp('smokeTrail',Math.cos(h)*travel,Math.sin(h)*travel,47+t*35,8+t*6,h,.88*fade);
   }
   forward('gunSmoke',age*38,0,37+t*26,24+t*9,a,.77*fade);
   break;
  case 'rankenEmbed': {
   const fuse=clamp((t-.17)/.83);
   paint(c,'ranken',x-ca*8*z,y-sa*8*z,26*z,6*z,a);
   if(age<.13)stamp('armorSpark',0,0,28,21,a,1-age/.13);
   if(fuse>0){
    const glow=13+fuse*18;
    forward('fireSmall',-10,0,glow,glow*.8,a,fuse*(.78+.22*Math.sin(age*67)**2));
   }
   break;
  }
  case 'rankenBurst': {
   const r=cue.radius||48;
   if(age<.14)stamp('fireFlash',0,0,r*1.26,r*.94,a,1-age/.14);
   if(age<.39)stamp('shellBurst'+Math.min(2,Math.floor(age/.13)),0,0,r*(1.02+t*1.10),r*(.76+t*.83),a,Math.min(1,(1-age/.39)*1.7));
   if(age<.23)forward('flameJet',-10-age*59,0,39+age*90,16+age*25,a+Math.PI,1-age/.23);
   if(age<.33)spray(low?3:6,116,(i,h,dx,dy)=>stamp(i%2?'fireSmall':'metalShard'+i%6,dx,dy,12,8,h+age*12,1-age/.33));
   forward('fireSmall',-9-t*14,0,31+t*8,23,a,.88*fade);
   if(age>.08)forward('smokeDark',-11-t*27,3,29+t*25,21+t*21,a,.78*fade);
   break;
  }
  case 'rotary': {
   // The rotating muzzle moves across the barrel cluster. Each cue belongs to a fired round.
   const offset=Math.sin(cue.phase+age*85)*5.2;
   if(age<.12){
    const hot=1-age/.12;
    forward('muzzleTwin',39,offset,55,22,a,hot);
    if(!low)forward('muzzleHeavy',37,-offset*.58,37,13,a,.84*hot);
   }
   if(age<.27)forward('gunSmoke',38+age*56,offset*.7,32+age*54,13+age*21,a,.62*(1-age/.27));
   for(const side of [-1,1]){
    const d=3-age*81,off=side*(12+age*93),drop=age*age*96,k=1-.63*t;
    stamp('bulletBrass',ca*d-sa*off,sa*d+ca*off+drop,15*k,6*k,a+side*age*17,Math.min(1,fade*2));
   }
   break;
  }
  case 'rotaryHit':
   stamp('spark',0,0,37+18*t,27,a,Math.max(0,1-t*1.6));
   forward('debrisShard',8+t*27,-5-t*9,23,10,a+t*3,fade);
   if(!low)forward('metalShard3',6+t*19,5+t*13,13,7,a-t*4,fade);
   break;
  case 'pom':
   if(age<.16)forward('muzzleHeavy',13,0,77,37,a,1-age/.16);
   forward('gunSmoke',16+age*38,0,43+age*55,27+age*35,a,.85*fade);
   break;
  case 'pomImpact': {
   const radius=cue.radius||103;
   if(age<.16)stamp(cue.contact?'armorSpark':'fireFlash',0,0,radius*.98,radius*.72,a,1-age/.16);
   drawFlakAirburst(c,x,y,radius*(1.15+t*.66)*z,t,a,.92);
   // Split the black flak cloud around the hot center, leaving the fragments legible.
   for(const side of [-1,1])forward('smokeDark',-5-t*12,side*(7+t*18),51+t*49,33+t*33,a+side*.4,.56*fade);
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
   // After the flash, a low front of lifted earth or spray races across the blast footprint.
   if(age>.10&&age<.85){
    const front=clamp((age-.10)/.75);
    for(const side of [-1,1])stamp(cue.water?'splashShell':'smokeDust',side*r*(.19+.59*front),r*front*.13,
     r*(.47+.38*front),r*(.25+.19*front),side*.29,Math.sin(front*Math.PI)*.88);
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
  case 'steelRain': {
   // The dispenser splits across its 24 real radial firing lanes. The short
   // spoke-shaped muzzle plumes stay at the casing. Live darts draw their own trails.
   if(age<.20){
    const flash=1-age/.20;
    stamp('fireFlash',0,0,84+t*46,66+t*35,a,flash);
    stamp('armorSpark',0,0,112+t*52,89+t*46,a,flash*.93);
   }
   const lanes=low?4:8;
   for(let i=0;i<lanes;i++){
    const lane=i*(24/lanes)+i%3,h=a+lane*Math.PI/12,dx=Math.cos(h),dy=Math.sin(h);
    const d=16+age*60,band=lane%3;
    stamp('gunSmoke',dx*d,dy*d,26+band*4+t*29,9+t*11,h,.70*fade);
   }
   // Torn pieces of casing tumble inside the expanding dart formation.
   for(let i=0;i<(low?2:3);i++){
    const h=a+i*TAU/3+.32,d=6+age*(63+i*13);
    stamp('metalShard'+i,Math.cos(h)*d,Math.sin(h)*d+age*age*38,16,8,h+age*(7+i),fade);
   }
   break;
  }
  case 'dartHit': {
   const target=cue.targetId!=null&&(world.enemies||[]).find(e=>e.id===cue.targetId||e.tailId===cue.targetId);
   const dx=target?target.x+cue.offsetX-cue.x:0,dy=target?target.y+cue.offsetY-cue.y:0;
   if(age<.22){
    const hit=1-age/.22;
    stamp('armorSpark',dx,dy,36,22,a,hit);
    stamp('debris',dx-ca*age*65-sa*age*36,dy-sa*age*65+ca*age*36,24,14,a+t*3,hit);
   }
   // Leave the nose embedded. The shaft shivers once against the struck skin.
   const shiver=Math.sin(age*53)*Math.max(0,1-age/.23)*.16;
   sprite(c,'flechetteDart',x+(dx-ca*7)*z,y+(dy-sa*7)*z,24*z,a+shiver,Math.min(1,fade*3));
   break;
  }
  case 'gasBarrage': {
   const r=cue.radius||122,spread=clamp(age/.94),density=Math.min(1,.25+age*5)*Math.min(1,fade*4);
   const lobes=low?4:6;
   // Roll the gas outward from the burst, then let the outer folds drift
   // within the actual damage radius. Thin the centre so targets stay readable.
   for(let i=0;i<lobes;i++){
    const h=a+i*TAU/lobes+.09*Math.sin(age*1.4+i),d=r*(.09+spread*(.44+.06*Math.sin(i*2+age)));
    const swell=.53+.39*spread+.045*Math.sin(age*2.1+i*1.9);
    stamp(i%3?'gas':'gasSmall',Math.cos(h)*d,Math.sin(h)*d,r*swell,r*swell*.79,h+age*.16,density*(.71+i%2*.07));
   }
   if(age<.64){
    const vent=1-age/.64;
    stamp('smokeWisp',0,-age*r*.18,r*(.32+spread*.33),r*(.28+spread*.28),-.8,vent*.72);
    stamp('gasSmall',0,0,r*(.36+spread*.28),r*(.31+spread*.24),a,vent);
   }
   break;
  }
  case 'gasHit':
   // Gas leaves a brief dirty-green eddy at the contact, with no incendiary flash.
   stamp('gasSmall',-ca*t*12,-sa*t*12,37+t*24,24+t*21,a,.85*fade);
   stamp('smokeWisp',-ca*t*17+sa*t*9,-sa*t*17-ca*t*9,29+t*13,12+t*11,a+.42,.61*fade);
   break;
  case 'firechain': {
   const livePoint=id=>id!=null&&((world.enemies||[]).find(e=>e.id===id||e.tailId===id)||
    world.eliteEnemies?.members?.find(e=>e.id===id||e.tailId===id));
   const start=livePoint(cue.originId)||cue;
   for(const link of cue.links||[]){
    const end=livePoint(link.id)||link,dx=end.x-start.x,dy=end.y-start.y,h=Math.atan2(dy,dx);
    const ox=sx(start.x),oy=sy(start.y),ex=sx(end.x),ey=sy(end.y);
    const sag=(6+Math.min(1,age/.55)*10)*z,opacity=Math.min(1,(life-age)/.23);
    c.save();c.globalAlpha*=opacity;
    // Contact is already confirmed. Light the caught hook immediately, then run
    // flame down the same curved steel tether instead of replaying its flight.
    cable(c,ox,oy,ex,ey,z,sag);
    const heads=low?1:2;
    for(let i=0;i<heads;i++){
     const k=(age-i*.11)/.44;
     if(k<0||k>1)continue;
     const bend=2*k*(1-k)*sag;
     const px=ox+(ex-ox)*k-Math.sin(h)*bend,py=oy+(ey-oy)*k+Math.cos(h)*bend;
     fx(c,'flameJet',px,py,(i?32:50)*z,(i?12:20)*z,h,1);
    }
    if(age<.19)fx(c,'ricochet',ex,ey,47*z,22*z,h,1-age/.19);
    sprite(c,'grapnelFire',ex-Math.cos(h)*13*z,ey-Math.sin(h)*13*z,32*z,h,opacity);
    drawIncendiaryFire(c,ex,ey,h,58*z,age,1,'legacy');
    c.restore();
   }
   break;
  }
  case 'badinWake':
  case 'wake': {
   const strike=cue.kind==='wake';
   // The two wingtip rolls counter-rotate. Keep the continuous wake narrow;
   // only contact peels the turbulent air apart at the struck aircraft.
   const drag=strike?Math.sin(t*Math.PI*.5):t;
   const size=(strike?55:44)+drag*(strike?42:24),opacity=Math.min(1,fade*1.5)*(strike?1:.72);
   if(strike&&age<.24)forward('vaporTrail',-12-age*42,0,74,27,a,1-age/.24);
   for(const side of [-1,1]){
    const tip=side*((strike?12:25)+drag*(strike?31:13)),d=(strike?1:-10)-drag*(strike?33:28);
    if(!low||!strike)forward('vaporTrail',d-20,tip,72+drag*22,12+drag*9,a-side*(strike?.28:.1),opacity*.7);
    drawBadinVortex(c,x+(ca*d-sa*tip)*z,y+(sa*d+ca*tip)*z,a,side,size*z,age*(strike?16:10)+drag*.9,opacity);
   }
   break;
  }
  case 'ram': {
   const approach=cue.approach??a,strength=clamp(cue.strength??.5);
   const ax=Math.cos(approach),ay=Math.sin(approach),weight=.94+strength*.32;
   // The compressed leading edge and the two peeling strips share the
   // actual collision origin. Their bearings follow contact and approach.
   if(age<.29){
    const impact=1-age/.29;
    stamp('armorSpark',0,0,108*weight,69*weight,a,impact);
    stamp('ricochet',0,0,91*weight,39*weight,a+Math.PI/2,impact*.94);
   }
   if(age<.48){
    const opacity=1-age/.48,trail=22+age*65;
    for(const side of [-1,1]){
     stamp('vaporTrail',-ax*trail-ay*side*16,-ay*trail+ax*side*16,78+age*38,14,approach+side*.22,opacity*.85);
    }
   }
   forward('smokeDark',9+age*42,0,36+t*52,22+t*36,a,.66*fade);
   for(let i=0;i<(low?4:8);i++){
    const side=i%2?-1:1,h=a+side*(.62+Math.floor(i/2)*.38),r=(1-Math.pow(fade,2))*(52+i%3*22)*weight;
    const key=i<2?'debrisShard':i%3?'metalShard'+i%6:'spark';
    stamp(key,Math.cos(h)*r,Math.sin(h)*r+age*age*43,i<2?31:18,i<2?14:8,h+side*age*(6+i),fade);
   }
   break;
  }
  case 'armorLaunch': {
   // Hit-facing plate cracks first; the six live plates already have their
   // own travelling art. Keep this ejector flash local to the airframe.
   if(age<.21)forward('armorSpark',12,0,67,43,a,1-age/.21);
   if(age<.33)forward('gunSmoke',9-age*27,0,37+age*50,22+age*24,a,.76*(1-age/.33));
   for(let i=0;i<(low?3:5);i++){
    const h=a+(i-2)*.41,r=8+(1-fade*fade)*(28+i%3*12);
    stamp('metalShard'+i,Math.cos(h)*r,Math.sin(h)*r,15,7,h+age*10,fade);
   }
   break;
  }
  case 'armorImpact': {
   const h=a+((cue.slot??0)%3-1)*.25;
   if(age<.34){
    const frame=Math.min(3,Math.floor(age/.08));
    stamp('shellBurst'+frame,0,0,55+age*91,40+age*67,h,Math.min(1,(.34-age)*10));
   }
   forward('gunSmoke',7+t*24,0,30+t*40,21+t*22,h,.65*fade);
   spray(low?3:5,116,(i,b,dx,dy)=>stamp('metalShard'+i,dx,dy+age*age*32,14-i,7,b+age*9,fade));
   break;
  }
  case 'wingAttack': {
   const recoil=Math.min(1,age/.12);
   if(age<.13)forward(cue.rear?'muzzleRear':'muzzleTwin',27,0,cue.rear?41:47,19,a,1-age/.13);
   forward('gunSmoke',24+recoil*17,0,18+23*recoil,10+8*recoil,a,.72*fade);
   if(!low)forward('bulletBrass',11-7*recoil,7+13*recoil,9,4,a+recoil*2,fade);
   break;
  }
  case 'wingHit':
   if(age<.19)stamp('armorSpark',0,0,43,28,a,1-age/.19);
   forward('debrisShard',7+t*26,5+t*t*14,20,11,a+t*3,fade);
   break;
  case 'wingSkill': {
   // Each is a confirmed pilot skill; the attack renderer owns the real rounds.
   const mode=cue.mode;
   if(mode==='ignite')forward('fireWing',19+t*13,0,56+12*t,22,a,fade);
   else if(mode==='dive'||mode==='charge'){
    for(const side of [-1,1])forward('vaporTrail',-18-t*24,side*(16+t*7),mode==='dive'?71:50,10,a+side*.14,fade*.92);
   }else if(mode==='rockets'){
    for(const side of [-1,1])forward('exhaust',3-t*29,side*13,47+t*18,12,a,fade);
   }else if(mode==='bomb')forward('smokePuff',-12-t*31,0,27+t*25,16+t*8,a,.75*fade);
   else if(mode==='fan'||mode==='salvo'){
    const sides=mode==='fan'?.29:.06;
    for(const side of [-1,1])forward('muzzleTwin',29,side*7,41,15,a+side*sides,Math.max(0,1-age/.23));
   }else if(mode==='rally'){
    forward('muzzleTwin',28,0,47,19,a,Math.max(0,1-age/.22));
    forward('gunSmoke',30+t*21,0,27+t*16,13,a,fade*.7);
   }else if(mode==='guard'){
    forward('ricochet',12+t*8,6,48,19,a+.7,fade);
   }else if(mode==='repair'){
    forward('spark',6,9,25,10,a-t*2,fade);
    forward('smokeWisp',-4-t*18,9,23+t*17,10+t*8,a,.6*fade);
   }else if(mode==='reverse'||mode==='ambush'||mode==='hunt'){
    const turn=mode==='reverse'?1:mode==='ambush'?-.65:.28;
    forward('vaporTrail',-18-14*t,16+turn*15*t,42+23*t,9, a+turn*(.18+t*.8),fade*.92);
   }
   break;
  }
  case 'bomberRelease':
   // A brief curl from both sides of the bomb bay marks each separate release.
   for(const side of [-1,1])forward('smokeWisp',-10-t*27,side*(6+t*9),32+t*17,12+t*8,a+side*.22,.81*fade);
   break;
  case 'bomberImpact': {
   const h=a+((cue.slot??0)%3-1)*.37;
   if(age<.64){
    const frame=Math.min(3,Math.floor(age/.14));
    stamp('bombfx'+frame,0,-age*18,96+age*88,78+age*61,h,Math.min(1,(.64-age)*6));
   }
   // The two bombs retain their separate 66-unit damage footprints.
   if(age>.1){
    const spread=clamp((age-.1)/.52);
    for(const side of [-1,1])forward('dustPuff',8+t*13,side*spread*27,38+spread*40,20+spread*18,h+side*.4,.65*fade);
   }
   if(age>.25){
    stamp('fireGround',0,-4,50+t*20,34+t*9,0,.8*fade);
    stamp('smokeDark',16*t,-17-47*t,48+t*54,48+t*39,h,.76*fade);
   }
   break;
  }
  }
 }
}
