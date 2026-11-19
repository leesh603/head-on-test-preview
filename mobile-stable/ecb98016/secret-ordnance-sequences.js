// Mechanical layers for the six installed secret weapons. Clocks, salvos and
// impact points belong to combat; rendering never creates a shot or a hit.
import {hasSecretWeapon} from './secret-weapons.js';
import {SECRET_ORDNANCE} from './secret-ordnance.js';
import {fx} from './fx-art.js?v=tame3';
import {bombSprite} from './bomb-sprites.js?v=bomb20&perf=1029';
import {drawSecretWarArt} from './secret-impact-signatures.js';
import {drawWaterContact} from './water-contact-art.js';

const clamp=n=>Math.max(0,Math.min(1,n));
const RIGHT_ANGLE=Math.PI/2;

function latestCue(world,p,kind){
 const cues=world.secretWeaponFx,owner=p.id??'p1';
 let latest=null;
 for(let i=0;i<(cues?.length||0);i++){
  const hit=cues[i];
  if(hit.kind===kind&&hit.ownerId===owner&&world.t>=hit.at&&world.t<hit.at+hit.life&&(!latest||hit.at>latest.at))latest=hit;
 }
 return latest;
}

function loadedSlot(state,slot,count,now){
 if(!state||!Number.isFinite(state.readyAt)||now>=state.readyAt)return true;
 if(state.remaining>0)return slot>=count-state.remaining;
 // The next rack loads progressively just before its real release window.
 return state.readyAt-now<.42*(1-slot/count);
}

function lePrieurMounts(c,state,rack,width,now){
 for(let side=-1;side<=1;side+=2){
  if(rack){
   c.save();c.translate(6,side*22*width);c.rotate(RIGHT_ANGLE);
   c.drawImage(rack,-13*width,-20,26*width,40);c.restore();
  }
  for(let i=0;i<4;i++){
   const slot=i*2+(side>0?0:1);
   if(loadedSlot(state,slot,8,now))fx(c,'rocket',11,side*(13+6*i)*width,26,4.8);
  }
 }
}

function salamanderPlates(c,p,im,hit,now){
 if(!im)return;
 const fit=p.bomberTransfer,length=(fit?.hullLength??38)*.85,beam=(fit?.hullWidth??29)*.75;
 const sw=im.naturalWidth/2,sh=im.naturalHeight;
 const age=hit?now-hit.at:0;
 const kick=hit?Math.sin(age*51)*Math.exp(-age*9):0;
 for(let side=-1;side<=1;side+=2){
  const struck=hit&&side===(Math.sign(hit.side)||1),jolt=struck?kick:0;
  c.save();c.translate(5-jolt*1.7,side*(beam*.25+jolt*3));
  c.rotate(RIGHT_ANGLE+side*jolt*.14);
  c.drawImage(im,side<0?0:sw,0,sw,sh,-beam*.25,-length/2,beam*.5,length);c.restore();
 }
 const wear=p.secretWeaponState.effects.salamanderArmor?.wear||0;
 for(let i=0;i<Math.floor(wear*5);i++){
  const side=i%2?1:-1;fx(c,'ricochet',i*3.4,side*beam*.38,5+i%3,2.7,side*(.3+i*.58),.45);
 }
}

function siemensEngine(c,state,im,now){
 if(!im)return;
 const load=state?.load||0,reversal=clamp((state?.reversal||0)/.32),compression=Math.sin(Math.PI*reversal);
 c.save();c.translate(24+compression*2.5,0);c.scale(.49+.08*compression,1);
 // Sh.III's cylinder bank and crank turn in opposite directions. Only the
 // engine is painted here; the existing airframe still owns the propeller.
 c.save();c.rotate(-now*13);c.drawImage(im,-13,-13,26,26);c.restore();
 const hw=im.naturalWidth*.26,hh=im.naturalHeight*.26;
 c.rotate(now*14+load*.5);
 c.drawImage(im,(im.naturalWidth-hw)/2,(im.naturalHeight-hh)/2,hw,hh,-5,-5,10,10);
 c.restore();
}

function puwCradle(c,state,rack,release,now){
 const age=release?now-release.at:1;
 for(let i=0;i<4;i++){
  const side=i%2?1:-1,fore=i<2?7:-12,cross=side*12;
  const open=release?.slot===i?Math.sin(Math.PI*clamp(age/.26)):0;
  if(rack){
   c.save();c.translate(fore,cross+side*open*3);c.rotate(RIGHT_ANGLE+side*open*.94);
   // A single steel strap from the existing tubular rack, with its real rivets.
   c.drawImage(rack,0,90,rack.naturalWidth,24,-6,-1.3,12,2.6);c.restore();
  }
  if(loadedSlot(state,i,4,now))bombSprite(c,'puw',fore,cross,24,0);
 }
}

export function drawOrdnanceMounts(c,p,scale,time,sprites){
 if(!p?.secretWeaponState?.slots)return;
 const world=p.combatWorld?.()||p.world||p,now=world.t??time,e=p.secretWeaponState.effects||{};
 c.save();c.scale(scale,scale);
 if(hasSecretWeapon(p,'lePrieurSalvo'))lePrieurMounts(c,e.lePrieurSalvo,sprites['le-prieur-mount'],Math.min(1.7,(p.bomberTransfer?.hullWidth??31)/31),now);
 if(hasSecretWeapon(p,'salamanderArmor'))salamanderPlates(c,p,sprites['salamander-mount'],latestCue(world,p,'salamanderImpact'),now);
 if(hasSecretWeapon(p,'siemensHalske'))siemensEngine(c,e.siemensHalske,sprites['siemens-halske-rotor'],now);
 if(hasSecretWeapon(p,'puw50'))puwCradle(c,e.puw50,sprites['le-prieur-mount'],latestCue(world,p,'puwDrop'),now);
 c.restore();
}

let bombShadow=null;
function drawPuwShadow(c,x,y,width,a,opacity){
 if(!bombShadow&&typeof document!=='undefined'){
  const cv=document.createElement('canvas');cv.width=100;cv.height=48;
  const g=cv.getContext('2d');
  if(!g||!bombSprite(g,'puw',50,24,126))return;
  g.globalCompositeOperation='source-in';g.fillStyle='#221e18';g.fillRect(0,0,100,48);bombShadow=cv;
 }
 if(!bombShadow)return;
 c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=opacity;
 c.drawImage(bombShadow,-width/2,-width*.24,width,width*.48);c.restore();
}

export function drawOrdnanceRound(c,b,view,low){
 if(!(b?.life>0)||b.actualExplosion)return false;
 const type=b.secretWeapon;
 if(type!=='puw50'&&type!=='villarPerosa'&&!b.secretDavisRear&&type!=='lePrieurSalvo')return false;
 if(!view.visible(b.x,b.y,100))return type!=='lePrieurSalvo';
 const x=view.sx(b.x),y=view.sy(b.y),z=view.z,a=Math.atan2(b.vy,b.vx);
 if(type==='puw50'){
  const fall=clamp(1-b.life/b.maxLife),height=(1-fall*fall)*31*z,heading=b.releaseAngle??a;
  // Ease the bomb off its own rack into the physical flight path. The visual
  // offset is gone before mid-fall and never moves the impact point.
  const detach=(1-clamp(fall/.38))**2,slot=b.puwIndex??0;
  const fore=(slot<2?12:-7)*detach*z,side=(slot%2?12:-12)*detach*z;
  const bx=x+Math.cos(heading)*fore-Math.sin(heading)*side;
  const by=y+Math.sin(heading)*fore+Math.cos(heading)*side;
  drawPuwShadow(c,x+height*.59,y+height*.65,(32+8*fall)*z,heading,.16+.40*fall);
  bombSprite(c,'puw',bx,by,49*z*(1-.28*fall),heading,1,1-.51*fall*fall);
  return true;
 }
 if(type==='lePrieurSalvo'){
  // A live rocket lays down a segmented corkscrew of spent propellant along
  // its actual velocity axis. The ordinary rocket renderer paints its nose.
  const age=Math.max(0,SECRET_ORDNANCE.rocket.life-b.life),limit=Math.min(78,Math.hypot(b.vx,b.vy)*age);
  for(let i=1;i<=(low?2:4);i++){
   const d=i*17;if(d>limit)break;
   const offset=Math.sin(age*22-i*.9)*(1+i*.7);
   fx(c,'smokePuff',x-(Math.cos(a)*d+Math.sin(a)*offset)*z,y-(Math.sin(a)*d-Math.cos(a)*offset)*z,(13+i*4)*z,(7+i*2)*z,a,.59-i*.09);
  }
  return false;
 }
 if(b.secretDavisRear){
  const spread=clamp(1-b.life/SECRET_ORDNANCE.davis.rearLife);
  for(let i=0;i<(low?3:5);i++){
   const side=i%2?1:-1,dx=-i*spread*3,dy=side*(1+i*.8)*spread*2;
   fx(c,'metalShard'+i,x+(dx*Math.cos(a)-dy*Math.sin(a))*z,y+(dx*Math.sin(a)+dy*Math.cos(a))*z,10*z,4*z,a+side*spread*5,.94);
  }
  return true;
 }
 fx(c,'tracerCore',x-Math.cos(a)*11*z,y-Math.sin(a)*11*z,24*z,2.6*z,a,.84);
 fx(c,'bulletBrass',x,y,15*z,4*z,a,.98);
 return true;
}

// Contact choreography is additive to the existing blast/ignition timeline.
export function drawOrdnanceCue(c,cue,age,view,low){
 const {z}=view,x=view.sx(cue.x),y=view.sy(cue.y),a=cue.a||0;
 const t=clamp(age/(cue.life||1)),fade=1-t;
 switch(cue.kind){
 case 'salamanderImpact': {
  // A split-second jacket skips off the armor, then tumbles away from the
  // plate edge. The actual armor segment recoils independently on the plane.
  const h=a+Math.PI+(cue.side<0?-.88:.88),d=5+44*t;
  fx(c,'bulletBrass',x+Math.cos(h)*d*z,y+Math.sin(h)*d*z,13*z,4.5*z,h+t*9,fade);
  break;
 }
 case 'siemensReversal': {
  // Trace the short curved slipstream left as the loaded bank lets go.
  // The sign comes from the simulated change of turn, not the screen axis.
  const side=cue.turnSide||1,count=low?3:5;
  for(let i=0;i<count;i++){
   const q=(i+.5)/count,ph=.16+q*1.16,along=-11-46*q-17*t;
   const across=side*(18+Math.sin(ph)*24-q*q*37+6*t),heading=a-side*(q-.35)*1.2;
   fx(c,'vaporTrail',x+(Math.cos(a)*along-Math.sin(a)*across)*z,y+(Math.sin(a)*along+Math.cos(a)*across)*z,(16+q*5)*z,(6+q*3)*z,heading,fade*(.78-.23*q));
  }
  break;
 }
 case 'davisImpact': {
  if(!cue.armored)break;
  const d=6+t*29;
  drawSecretWarArt(c,'tornPlate',x+Math.cos(a)*d*z,y+Math.sin(a)*d*z,(26+10*t)*z,a+t*1.7,fade);
  break;
 }
 case 'puwImpact': {
  const r=cue.radius||62;
  if(cue.water){
   if(!drawWaterContact(c,x,y,r*1.87*z,t,a)){
    const size=r*(1.25+t*.4)*z;
    fx(c,t<.57?'splashShell':'foamRing',x,y,size,size,a,Math.min(1,fade*1.5));
   }
  }else{
   drawSecretWarArt(c,'earthPlume',x,y,r*(1.06+t*.8)*z,a,Math.min(1,fade*1.8));
  }
  break;
 }
 }
}
