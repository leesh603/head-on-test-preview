import {drawSecretFlightWings,drawSecretFlightBomb,drawSecretWingRound,drawSecretFlightCue} from './secret-flight-sequences.js';
import {drawPayloadCue} from './secret-payload-sequences.js';
import {planeSprite} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1&rim=idle&decode=1&depth=20261111&lazy=20261117';
import {outlineSmallAirframe,drawSmallAirframe} from './aircraft-rim.js';
import {fx} from './fx-art.js?v=tame3';
import {secretImpactArtReady,drawSecretImpactSignature,drawSecretWarArt} from './secret-impact-signatures.js';
import {drawOrdnanceMounts,drawOrdnanceRound,drawOrdnanceCue} from './secret-ordnance-sequences.js';
import {drawFlakAirburst} from './flak-airburst-art.js';
import {drawWaterContact} from './water-contact-art.js';
import {KETTERING_DIVE} from './secret-weapon-combat.js';
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
 [secretImpactArtReady,...['sn1650','grunkreuz-stencil','kettering','ranken','crater',...SELECTED_ART].map(key=>new Promise(resolve=>{
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
  const artwork=key==='sn1650'?'secret-ordnance-sn1650-ink-20261115':key==='crater'?'verdun-impact-crater-20261116':`secret-ordnance-${key}`;
  image.src=new URL('./'+artwork+'.webp',import.meta.url).href;
 }))]
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

export function drawSecretGasStencil(c,x,y,width,a,alpha=1){
 paint(c,'grunkreuz-stencil',x,y,width,width,a,alpha);
}

// The caller's existing aircraft transform supplies heading and bank.
export function drawSecretAirframeHardware(c,p,scale,time){
 if(!p.secretWeaponState?.slots)return;
 if(p.secretWeaponState.slots.badinGauge==='badinBreakthrough')prepareBadinWake();
 drawOrdnanceMounts(c,p,scale,time,sprites);
}

export function secretBomberAirframe(faction){
 return faction==='central'?'bomber-transfer-gotha':'bomber-transfer-o400';
}

function prepareBadinWake(){
 if(!badinVortex&&typeof Image!=='undefined'){
  badinVortex=new Image();
  badinVortex.decoding='async';
  badinVortex.src=new URL('./fx-badin-condensation.webp',import.meta.url).href;
 }
 return badinVortex;
}

function drawBadinVortex(c,x,y,a,side,size,progress,opacity){
 const image=prepareBadinWake();
 if(!image?.complete||image.naturalWidth!==1024||image.naturalHeight!==120){
  fx(c,'vaporTrail',x,y,size,size*.24,a,opacity*.67);
  return;
 }
 const frame=progress<.16?0:progress<.43?1:progress<.71?2:3;
 const width=size*1.55,height=width*120/256;
 c.save();c.translate(x,y);c.rotate(a);c.scale(1,side);c.globalAlpha*=opacity;
 // Hold the hooked front at the sampled tip. Successive paintings break up
 // along the slipstream while the opposite wing rolls in the other direction.
 c.drawImage(image,frame*256,0,256,120,-width*.78,-height*.53,width,height);
 c.restore();
}

function drawStrategicFall(c,b,{sx,sy,z,visible},faction,art){
 // The bomber, bomb, and shadow use one release point. The bomb leaves the bay
 // at the instant the aircraft passes it and reaches the actual blast center.
 const t=clamp(1-b.life/b.maxLife),a=b.releaseAngle,dx=Math.cos(a),dy=Math.sin(a);
 const release=.44,runIn=-(Math.hypot(b.x-b.sx,b.y-b.sy)||520)-250,bay=-258;
 const planeDistance=runIn+(bay-runIn)*t/release;
 const planeX=b.x+dx*planeDistance,planeY=b.y+dy*planeDistance;
 const x=sx(b.x),y=sy(b.y);
 if(visible(b.x,b.y,75)&&t<.65){
  // The target was designated by the actual Very signal.
  const smoke=Math.min(1,t*12)*clamp((.65-t)/.19);
  const drift=clamp(t/.48);
  art.sprite(c,'verySmoke',x-dy*drift*43*z,y+dx*drift*43*z,(31+35*drift)*z,a+Math.PI/2,.88*smoke);
  art.sprite(c,'veryFlare',x,y,(25+4*Math.sin(t*32))*z,-Math.PI/2,smoke);
 }
 if(visible(planeX,planeY,190)&&t<.91){
  // In the last moments before release the actual payload is visible in the bay.
  planeSprite(c,sx(planeX),sy(planeY),a,secretBomberAirframe(faction),3.2*z,false,true);
  if(t>=.27&&t<release){
   const opening=clamp((t-.27)/.13);
   paint(c,'shadow',sx(planeX)+22*z,sy(planeY)+51*z,91*z,25*z,a,.48*opening);
   paint(c,'sn1650',sx(planeX),sy(planeY),68*z,(6+opening*13)*z,a,opening);
  }
 }
 if(t<release)return;
 const fall=clamp((t-release)/(1-release)),drift=bay*(1-fall);
 const bx=sx(b.x+dx*drift),by=sy(b.y+dy*drift);
 if(!visible(b.x+dx*drift,b.y+dy*drift,150))return;
 const separation=1-fall*fall,length=(68+38*Math.sin(fall*Math.PI)-15*fall)*z;
 paint(c,'shadow',bx+22*separation*z,by+51*separation*z,
  (45+15*fall)*z,(10+6*fall)*z,a,.18+.48*fall);
 for(const side of [-1,1]){
  const tail=length*.40,off=side*length*.10;
  fx(c,'vaporTrail',bx-dx*tail-dy*off,by-dy*tail+dx*off,
   (22+65*fall*fall)*z,(5+6*fall)*z,a+side*(.31-.24*fall),.29+.61*fall);
 }
 if(fall<.36){
  const slip=fall/.36;
  fx(c,'metalShard2',bx-dx*slip*12*z-dy*slip*16*z,by-dy*slip*12*z+dx*slip*16*z,15*z,7*z,a+slip*2.2,1-slip);
 }
 paint(c,'sn1650',bx,by,length,length*(.28+.07*fall),a,1);
}

function drawReleasedWings(c,cue,view,age,low){
 if(!ketteringFrames)return;
 const {sx,sy,z}=view,a=cue.a||0,ca=Math.cos(a),sa=Math.sin(a);
 // Detached wings retain forward momentum while the lighter fabric stalls and drifts.
 // The dive continues independently; the remnants outlive impact.
 const progress=clamp(age/cue.life),advance=92*(1-Math.exp(-age*3.9)),width=52*z;
 const alpha=clamp((1-progress)/.35);
 for(const side of [-1,1]){
  const off=side*(13+53*(1-Math.exp(-age*2.8))),wx=cue.x+ca*advance-sa*off,wy=cue.y+sa*advance+ca*off+age*age*21;
  if(!view.visible(wx,wy,60))continue;
  const x=sx(wx),y=sy(wy);
  c.save();c.translate(x,y);c.rotate(a+Math.PI/2+side*(1-Math.exp(-age*2.1))*2.65);
  c.scale(1,.45+.55*Math.abs(Math.cos(age*5.2+side*.39)));c.globalAlpha*=alpha;
  drawSmallAirframe(c,ketteringFrames.wings[side<0?0:1],width);c.restore();
  if(age<.39){
   const fade=1-age/.39,travel=(8+age*44)*z;
   fx(c,'vaporTrail',x-ca*travel,y-sa*travel,(27+age*35)*z,8*z,a+side*.28,fade*.88);
   fx(c,'metalShard1',x-ca*travel-sa*side*8*z,y-sa*travel+ca*side*8*z,13*z,6*z,a+side*age*9,fade);
  }
  if(!low||age<.33)drawSecretWarArt(c,'wingRibs',x,y,23*z,a+side*age*4,alpha*.82);
 }
 if(age<.18){
  const x=sx(cue.x),y=sy(cue.y),snap=age/.18;
  fx(c,'armorSpark',x+ca*snap*16*z,y+sa*snap*16*z,45*z,18*z,a+Math.PI/2,1-snap);
 }
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
 fx(c,'engineSmoke',x-Math.cos(a)*(slip+17)*z,y-Math.sin(a)*(slip+17)*z,
  (32+36*dive)*z,(14-7*dive)*z,a,.62*(1-dive));
 c.save();c.translate(x,y);c.rotate(a+Math.PI/2);
 // Separate rims keep the exposed edges readable after the wing release.
 if(!b.bugWingsShed)for(const side of [-1,1]){
  c.save();c.translate(side*width*dive*1.08,height*dive*.82);c.rotate(side*dive*2.2);c.globalAlpha*=1-dive*.69;
  drawSmallAirframe(c,ketteringFrames.wings[side<0?0:1],width);
  c.restore();
 }
 c.scale(1-.18*dive,1-.58*dive);
 drawSmallAirframe(c,ketteringFrames.body,width);
 c.restore();
}

export function drawSecretWeaponFx(c,world,view,art,{low,factionFor}={}){
 const {sx,sy,z,visible}=view,now=world.t||0,players=world.players||[world];
 const flightArt={...art,drawBadinVortex};
 drawSecretFlightWings(c,world,view,flightArt,low);
 const faction=id=>factionFor?.(players.find(p=>p.id===id)||players[0]);
 for(const b of world.friendlyBombs||[]){
  if(b.life<=0)continue;
  if(drawOrdnanceRound(c,b,view,low))continue;
  drawSecretFlightBomb(c,b,view,low);
  if(b.secretWeapon==='sn1650'){drawStrategicFall(c,b,view,faction(b.ownerId),art);continue;}
  if(b.secretWeapon==='ketteringBug'){drawKettering(c,b,view);continue;}
  if(!visible(b.x,b.y,120))continue;
  if(b.secretGasMarked&&!b.cooperBomb){
   const t=clamp(1-b.life/(b.maxLife||b.life)),x=sx(mix(b.sx??b.x,b.x,t)),y=sy(mix(b.sy??b.y,b.y,t));
   paint(c,'grunkreuz-stencil',x,y,14*z,14*z,b.releaseAngle??0);
  }
 }
 for(const b of world.bullets||[]){
  if(b.life<=0||b.actualExplosion||(!b.secretWeapon&&!b.secretWingRound)||!visible(b.x,b.y,110))continue;
  if(b.secretWingRound||b.secretWeapon==='eliteAirWing')drawSecretWingRound(c,b,view);
  if(drawOrdnanceRound(c,b,view,low))continue;
  if(b.secretWeapon==='fokkerLeimberger'){
   // The bright rounds reveal the twelve-barrel sweep. Limit the longest
   // tracer to one in three bullets while the regular shot paints all bodies.
   const slot=b.secretBarrelIndex;
   if(slot%3===0){
    const a=Math.atan2(b.vy,b.vx),d=Math.hypot(b.x-b.secretShotX,b.y-b.secretShotY),length=Math.min(d,low?77:106);
    if(length>4){
     const back=length*.48;
     fx(c,'tracerCore',sx(b.x-Math.cos(a)*back),sy(b.y-Math.sin(a)*back),length*z,5*z,a,.91);
    }
   }
   continue;
  }
  if(b.secretWeapon==='vickersPomPom'){
   // A mechanical time fuse spits backward before the real airburst, following the shell.
   const remaining=b.synthesisFuse;
   if(remaining>=0){
    const a=Math.atan2(b.vy,b.vx),burn=clamp(1-remaining/.40);
    const tail=(12+burn*9)*z,x=sx(b.x)-Math.cos(a)*tail,y=sy(b.y)-Math.sin(a)*tail;
    if(burn>.18)fx(c,'fireSmall',x,y,(11+burn*17)*z,(5+burn*6)*z,a,burn);
    if(burn>.55)fx(c,'spark',x,y,(8+burn*11)*z,8*z,a,.72+.22*Math.sin(remaining*64));
    fx(c,'smokeTrail',x-Math.cos(a)*12*z,y-Math.sin(a)*12*z,(19+burn*20)*z,7*z,a,.50);
   }
   continue;
  }
  if(!b.secretAirRound)continue;
  const a=Math.atan2(b.vy,b.vx),x=sx(b.x),y=sy(b.y);
  if(b.secretWeapon==='rankenExplosiveDarts'){
   const dx=Math.cos(a),dy=Math.sin(a);
   fx(c,'vaporTrail',x-dx*18*z,y-dy*18*z,27*z,6*z,a,.67);
   paint(c,'ranken',x,y,34*z,8.2*z,a);
   if(b.dartSlot%2===0)fx(c,'spark',x-dx*12*z,y-dy*12*z,8*z,4*z,a,.74);
  }
 }
 for(const cue of world.secretWeaponFx||[]){
  const age=now-cue.at,life=cue.life||.45;
  if(age<0||age>=life)continue;
  if(!visible(cue.x,cue.y,330))continue;
  const x=sx(cue.x),y=sy(cue.y),a=cue.a||0,t=age/life,fade=1-t,ca=Math.cos(a),sa=Math.sin(a);
  if(drawSecretFlightCue(c,world,cue,view,flightArt,low))continue;
  if(drawPayloadCue(c,cue,world,view,art,low))continue;
  if(drawSecretImpactSignature(c,cue,x,y,z,age,low))continue;
  if(cue.kind==='bugWingShed'){drawReleasedWings(c,cue,view,age,low);continue;}
  drawOrdnanceCue(c,cue,age,view,low);
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
   if(age<.14){
    const ignition=1-age/.14;
    forward('exhaust',-24-age*94,0,57+age*89,12,a,ignition);
    forward('fireSmall',-3,0,25,9,a,ignition);
   }
   forward('smokeHeavy',-21-age*94,side*(4+t*8),34+t*40,12+t*15,a+side*.24,.81*fade);
   break;
  }
  case 'lePrieurImpact': {
   const r=cue.radius||64,frame=Math.min(3,Math.floor(t*5));
   stamp('airblast'+frame,0,0,r*(.83+t*.57),r*(.55+t*.52),a,Math.min(1,fade*2.4));
   if(age<.19)forward('flameJet',5+age*91,0,r*1.35,r*.46,a,1-age/.19);
   if(age<.34)for(const side of [-1,1])forward('debrisShard',age*108,side*(7+age*65),22,8,a+side*.47,1-age/.34);
   if(age>.08)forward('smokeHeavy',12+t*28,0,r*(.67+t*.49),r*(.30+t*.33),a,.76*fade);
   break;
  }
  case 'davisShot': {
   // Recoilless discharge has two real origins, not a second forward shell.
   if(age<.15)forward('muzzleHeavy',22,0,91,31,a,1-age/.15);
   forward('gunSmoke',22+age*43,0,53+t*38,15+t*12,a,.66*fade);
   const backX=sx(cue.rearX),backY=sy(cue.rearY);
   if(age<.23)fx(c,'muzzleRear',backX-ca*23*z,backY-sa*23*z,88*z,34*z,a+Math.PI,1-age/.23);
   const distance=14+age*91;
   for(const side of [-1,1]){
    const width=side*(5+t*21);
    fx(c,'smokeHeavy',backX-(ca*distance+sa*width)*z,backY-(sa*distance-ca*width)*z,
     (39+t*46)*z,(17+t*19)*z,a+Math.PI+side*.35,.69*fade);
   }
   break;
  }
  case 'davisImpact': {
   const heavy=cue.armored;
   if(age<.21)stamp(heavy?'armorSpark':'fireFlash',0,0,heavy?92:76,heavy?45:57,a,1-age/.21);
   forward('shellBurst'+Math.min(3,Math.floor(t*5)),t*15,0,57+47*t,30+27*t,a,Math.min(1,fade*1.65));
   if(heavy&&age<.35)forward('ricochet',12+t*24,0,57,14,a,1-age/.35);
   for(let i=0;i<(low?3:5);i++){
    const h=a+(i-2)*.42,d=8+age*(111+(i%3)*32);
    stamp(heavy?'metalShard'+i:'debrisShard',Math.cos(h)*d,Math.sin(h)*d,heavy?16:13,8,h+age*7,fade);
   }
   break;
  }
  case 'davisRearImpact': {
   if(age<.13)stamp('armorSpark',0,0,29,18,a,1-age/.13);
   for(const side of [-1,1]){
    const heading=a+side*.39,distance=4+age*83;
    stamp('ricochet',Math.cos(heading)*distance,Math.sin(heading)*distance,12,5,heading,fade);
   }
   break;
  }
  case 'salamanderImpact': {
   // Spall kicks back toward the incoming side of the actual plate contact.
   const wear=clamp(cue.wear||0);
   if(age<.17){
    stamp('armorSpark',0,0,57+wear*17,23+wear*7,a+Math.PI/2,1-age/.17);
    forward('ricochet',-5-age*63,cue.side<0?-5:5,30,9,a+Math.PI,1-age/.17);
   }
   for(let i=0;i<(low?2:4);i++){
    const h=a+Math.PI+(i%2?1:-1)*(.40+Math.floor(i/2)*.49),d=4+age*(71+i*21);
    stamp(i<2?'ricochet':'metalShard1',Math.cos(h)*d,Math.sin(h)*d,i<2?19:10,i<2?7:5,h,fade);
   }
   break;
  }
  case 'salamanderRepair': {
   // The rebound clings to the seam on the airframe. The loose smoke stays
   // here, at the place where the repair actually happened.
   for(const side of [-1,1])forward('smokeTrail',-8-age*29,side*(5+t*11),19+t*12,7+t*4,a+side*.46,.66*fade);
   break;
  }
  case 'puwDrop': {
   const side=cue.slot%2?-1:1;
   forward('vaporTrail',-10-age*48,side*9,30+t*13,8,a+side*.19,.71*fade);
   forward('metalShard2',-6-t*11,side*(7+t*16),12,5,a+side*t*5,.91*fade);
   break;
  }
  case 'puwImpact': {
   const r=cue.radius||62;
   // The cradle renderer owns the four separate water entry points.
   if(cue.water)break;
   if(age<.14)stamp('fireFlash',0,0,r*1.27,r*.97,a,1-age/.14);
   if(age<.62)stamp('bombfx'+Math.min(3,Math.floor(age/.13)),0,0,r*(.95+t*.78),r*(.84+t*.67),a,Math.min(1,(.62-age)*3.4));
   if(age<.40){
    const throwOut=age/.40,flank=cue.slot%2?-1:1;
    forward('dirtBurst',r*(.18+throwOut*.63),flank*r*(.13+throwOut*.32),
     r*(.56+throwOut*.29),r*.38,a+flank*.37,1-throwOut);
   }
   paint(c,'crater',x,y,(.72+.20*t)*r*z,(.62+.23*t)*r*z,a,.72*Math.sin(Math.PI*t));
   if(age>.18)stamp('smokeDark',0,-r*t*.45,r*(.78+t*.65),r*(.62+t*.54),a,.64*fade);
   spray(low?3:6,r*2.05,(i,h,dx,dy)=>stamp('rockChunk'+i,dx,dy,14,9,h+t*6));
   break;
  }
  case 'siemensReversal': {
   const turn=cue.turnSide||1;
   if(age<.25){
    const compression=1-age/.25;
    forward('engineSmoke',22-age*64,turn*(1+age*41),43+age*54,24,a,.91*compression);
    forward('vaporTrail',24-age*93,-turn*(5+age*36),35+age*60,12,a-turn*.49,compression);
   }
   const track=cue.track||[];
   const stride=low?2:1;
   for(let i=1;i<track.length;i+=stride){
    const [x0,y0,a0]=track[i-1],[x1,y1,a1]=track[Math.min(track.length-1,i+stride-1)];
    const amount=1-i/(track.length+1);
    for(const side of [-1,1]){
     const tip=side*(side===turn?17:24),ax=x0-Math.sin(a0)*tip,ay=y0+Math.cos(a0)*tip;
     const bx=x1-Math.sin(a1)*tip,by=y1+Math.cos(a1)*tip;
     fx(c,side===turn?'engineSmoke':'vaporTrail',sx((ax+bx)*.5),sy((ay+by)*.5),
      (10+Math.hypot(bx-ax,by-ay))*z,(side===turn?15:10)*z,Math.atan2(by-ay,bx-ax),fade*(.94-amount*.25));
    }
   }
   break;
  }
  case 'villarShot': {
   // The real alternating barrel emits one flash and one outward brass case.
   const side=Math.sign(cue.slot)||1;
   if(age<.09){
    const flash=1-age/.09;
    forward('muzzlePistol',7,0,53,24,a,flash);
    forward('tracerCore',21,0,33,5,a,.82*flash);
   }
   forward('bulletBrass',-7-t*26,side*(5+t*21),15,6,a+side*(.5+t*5),fade);
   if(age>.032)forward('smokeTrail',15+age*51,side*t*8,45+t*18,11+t*7,a,.84*fade);
   break;
  }
  case 'villarHit': {
   if(age<.12)stamp('spark',0,0,46,21,a,1-age/.12);
   for(const side of [-1,1])forward('ricochet',3+age*94,side*(4+age*71),25,6,a+side*.58,fade);
   if(age>.046)forward('smokeTrail',-4-t*16,0,33+t*10,10,a,.8*fade);
   break;
  }
  case 'bugImpact': {
   const r=cue.radius||96;
   if(cue.water){
    if(!drawWaterContact(c,x,y,r*1.61*z,t,a))stamp(t<.55?'splashShell':'foamRing',0,0,r*(1.14+t*.43),r*(1.14+t*.43),a,fade);
   }else{
    if(age<.17)stamp('fireFlash',0,0,r*1.36,r,a,1-age/.17);
    if(age<.56)forward(age<.19?'airblast0':age<.36?'airblast1':'airblast2',age*r*.37,0,r*(1.26+age),r*(.71+age),a,1-age/.56);
   }
   // The craft breaks along its incoming heading; the hot fuselage continues beyond the wings.
   if(age<.53)for(const side of [-1,1]){
    const lateral=side*(8+age*81),angle=a+side*(.5+age*5);
    forward('debrisShard',age*62,lateral,30-age*16,13,angle,1-age/.53);
   }
   if(age>.09&&age<.67)forward('smokeOil',r*(.16+age*.50),0,r*(.72+age),r*.32,a,.72*(1-age/.67));
   if(age<.7)spray(low?4:8,135,(i,h,dx,dy)=>stamp(i%2?'debrisShard':'metalShard'+i%6,dx,dy,13,7,h+age*7,1-age/.7));
   if(age>.16&&!cue.water)stamp('smokeDark',t*20,-t*25,r*(.64+.72*t),r*(.56+.54*t),a,.75*fade);
   break;
  }
  case 'rankenLaunch':
   if(age<.16)forward('muzzleRear',8,0,49+age*69,26,a,1-age/.16);
   for(let i=-2;i<=2;i++){
    if(low&&i%2)continue;
    const h=a+i*(cue.spread??.085),travel=18+age*206;
    stamp('vaporTrail',Math.cos(h)*travel,Math.sin(h)*travel,32+t*30,7+t*4,h,.78*fade);
   }
   forward('gunSmoke',age*38,0,37+t*26,24+t*9,a,.77*fade);
   break;
  case 'rankenEmbed': {
   const fuse=clamp((t-.17)/.83);
   paint(c,'ranken',x-ca*12*z,y-sa*12*z,34*z,8*z,a);
   if(age<.13)stamp('armorSpark',0,0,28,21,a,1-age/.13);
   if(fuse>0){
    const tail=-26+fuse*23,glow=11+fuse*13;
    forward('fireSmall',tail,0,glow,glow*.76,a,.78+.22*fuse);
    forward('smokeTrail',-21-fuse*6,0,16+fuse*14,5,a,.65*fuse);
    if(fuse>.60)forward('spark',tail,0,15,7,a,(fuse-.60)*2.5);
   }
   break;
  }
  case 'rankenBurst': {
   const r=cue.radius||48;
   if(age<.48){
    const burst=age/.48,width=r*(1.55+.53*burst);
    forward('shellBurst'+Math.min(3,Math.floor(4*burst)),-r*burst*.27,0,width,width*.64,a,clamp((1-burst)*3));
   }
   if(age<.30){
    const jet=age/.30,length=r*(.66+.57*Math.sin(Math.PI*jet));
    forward('muzzleRear',-length*.45,0,length,r*(.49-.12*jet),a+Math.PI,clamp((1-jet)*2.4));
   }
   if(age<.55){
    const flight=age/.55;
    for(let i=0;i<(low?2:3);i++){
     const side=i===0?-1:i===1?1:0,h=a+Math.PI+side*(.42+((cue.slot||0)%3)*.10);
     const travel=r*(.87+.12*i)*(1-(1-flight)**2);
     stamp('metalShard'+i,Math.cos(h)*travel,Math.sin(h)*travel,19-i,8,h+age*(i+5),clamp((1-flight)*2));
    }
   }
   if(age>.08)forward('smokeHeavy',-r*(.26+t*.63),0,r*(.53+t*.62),r*(.34+t*.33),
    a+Math.PI,clamp((age-.08)/.12)*fade*.79);
   break;
  }
  case 'rotary': {
   // The rotating muzzle moves across the barrel cluster. Each cue belongs to a fired round.
   const offset=Math.sin(cue.phase+age*85)*5.2;
   if(age<.12){
    const hot=1-age/.12;
    const mouthX=x+(ca*31-sa*offset)*z,mouthY=y+(sa*31+ca*offset)*z;
    if(!drawSecretWarArt(c,'rotaryCrown',mouthX,mouthY,(52+hot*19)*z,a,hot))forward('muzzleTwin',39,offset,55,22,a,hot);
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
   if(age<.13)forward('muzzleHeavy',14,0,73,38,a,1-age/.13);
   forward('smokeHeavy',12+age*41,0,40+age*62,25+age*27,a,.84*fade);
   break;
  case 'pomImpact': {
   const radius=cue.radius||103;
   if(age<.16)stamp(cue.contact?'armorSpark':'fireFlash',0,0,radius*.98,radius*.72,a,1-age/.16);
   const flower=clamp((age-.065)/.31),pressure=Math.min(1,age/.065,fade*2.7);
   if(pressure>0&&!drawSecretWarArt(c,'flakFlower',x,y,radius*(.51+flower*1.05)*z,a,pressure))
    drawFlakAirburst(c,x,y,radius*(1.15+t*.66)*z,t,a,.92);
   // The shell walls emerge from the hot center, tumble and stall at the true splash limit.
   const split=clamp(age/.41);
   for(let i=0;i<(low?3:5);i++){
    const h=a+(cue.contact?Math.PI+(i-2)*.51:i*TAU/(low?3:5));
    const travel=radius*(1-Math.pow(1-split,2))*(.61+(i%2)*.18);
    stamp('metalShard'+i,Math.cos(h)*travel,Math.sin(h)*travel+age*age*15,
     25-i,11-i*.6,h+age*(5+i),clamp((.66-age)/.19));
    if(age<.27)stamp('ricochet',Math.cos(h)*travel,Math.sin(h)*travel,
     14+6*split,5,h,.86*(1-age/.27));
   }
   if(age>.11)for(const side of [-1,1])forward('smokeDark',-6-t*14,side*(14+t*29),42+t*47,27+t*26,a+side*.73,.68*fade);
   break;
  }
  case 'flakHit':
   stamp('armorSpark',0,0,32+12*t,17,a,fade);
   forward('metalShard3',10+t*23,9*t,23,10,a+t*5,fade);
   break;
  case 'heavyImpact': {
   const r=cue.radius||198;
   if(cue.water){
    const size=r*2.04;
    if(!drawWaterContact(c,x,y,size*z,t,a)){
     const width=size*(.65+t*.35);
     stamp(t<.48?'splashShell':'foamRing',0,0,width,width,a,Math.min(1,fade*1.8));
    }
    // Secondary spray settles around the fixed entry point of this heavy
    // charge. Its source is the water column rather than the bomb casing.
    if(age>.11&&age<1.43){
     const flight=(age-.11)/1.32;
     const opacity=Math.sin(Math.PI*flight)*.64;
     const count=low?3:5;
     for(let i=0;i<count;i++){
      const h=a+i*TAU/count+.18*Math.sin(i),travel=r*(.25+.68*(1-(1-flight)**2));
      const width=r*(.21+flight*.23);
      stamp('mist',Math.cos(h)*travel,Math.sin(h)*travel,width,width*.61,h,opacity);
     }
    }
    break;
   }
   if(age>.12){
    const ground=clamp((age-.12)/.34),ext=(.34+.89*ground)*r*z;
    paint(c,'crater',x,y,ext,ext,a+.24,Math.min(.74,ground)*clamp((life-age)/.52));
   }
   if(age<.14)stamp('fireFlash',0,0,r*1.46,r*1.11,a,.93*(1-age/.14));
   if(age<1.2){
    const rise=clamp(age/.63),flame=clamp((1.2-age)/.52);
    const fire=age<.17?'bombfx0':age<.34?'bombfx1':age<.59?'bombfx2':'bombfx3';
    if(!drawSecretWarArt(c,'earthPlume',x+r*rise*.13*z,y-r*rise*.14*z,r*(.96+rise*.97)*z,a,flame))
     stamp(fire,0,0,r*(1.02+rise*.47),r*(1.02+rise*.47),.37,flame);
    if(age<.54)stamp('fireFlash',0,0,r*(.53+rise*.41),r*(.53+rise*.41),.82,flame*.88);
   }
   const ground=clamp((age-.11)/1.16);
   if(age>.11)for(let i=0;i<(low?3:5);i++){
    const h=a+i*TAU/(low?3:5),radius=ground*r*(.81+.07*(i%3));
    const opacity=Math.min(1,(age-.11)*4)*Math.pow(1-t,1.65);
    const dx=Math.cos(h)*radius,dy=Math.sin(h)*radius;
    stamp(i%2?'dirtBurst':'dirtMix',dx,dy,r*(.40+.55*ground),r*(.27+.28*ground),h,opacity);
   }
   if(age>.07&&age<.65){
    const front=(age-.07)/.58,opacity=Math.sin(Math.PI*front)*.87;
    for(const side of [-1,1]){
     forward('dirtBurst',0,side*r*(.18+.72*front),r*(.42+.54*front),r*.36,a+side*Math.PI/2,opacity);
    }
   }
   if(age<1.4)spray(low?5:10,r*.87,(i,h,dx,dy)=>stamp('rockChunk'+i%6,dx,dy,16+i%3*7,14,h+age*5,1-age/1.4));
   if(age>.27)for(let i=0;i<(low?3:5);i++){
    const rise=clamp((age-i*.10)/1.8),opacity=Math.min(1,(age-.27)*2)*fade*.76;
    stamp('smokeDark',Math.cos(i*2.4)*(18+rise*38)+rise*19,Math.sin(i*2.4)*(14+rise*33)+rise*12,67+i*12+35*t,64+i*9+32*t,i*.85,opacity);
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
    stamp('armorSpark',0,0,91*weight,43*weight,a,impact);
    stamp('ricochet',0,0,96*weight,20*weight,a+Math.PI/2,impact*.94);
    if(age<.16){
     const scatter=(10+age*140)*weight;
     for(const side of [-1,1])forward('ricochet',-8,side*scatter,54*weight,13,a+side*1.08,1-age/.16);
    }
   }
   if(age<.48){
    const opacity=1-age/.48,trail=22+age*65;
    for(const side of [-1,1]){
     stamp('vaporTrail',-ax*trail-ay*side*16,-ay*trail+ax*side*16,78+age*38,14,approach+side*.22,opacity*.85);
    }
   }
   forward('smokeDark',9+age*42,0,36+t*52,17+t*24,a,.59*fade);
   for(let i=0;i<(low?3:6);i++){
    const side=i%2?-1:1,h=a+side*(.62+Math.floor(i/2)*.38),r=(1-Math.pow(fade,2))*(52+i%3*22)*weight;
    if(i<2&&drawSecretWarArt(c,i===0?'wingRibs':'tornPlate',x+Math.cos(h)*r*z,y+(Math.sin(h)*r+age*age*43)*z,
     (i===0?41:28)*z,(cue.targetHeading??h)+side*age*(6+i),fade))continue;
    const key=i<2?'debrisShard':i%3?'metalShard'+i%6:'spark';
    stamp(key,Math.cos(h)*r,Math.sin(h)*r+age*age*43,i<2?31:18,i<2?14:8,h+side*age*(6+i),fade);
   }
   break;
  }
  }
 }
}
