// Painted textures, actual flight samples and actual gun mounts only.
// These helpers never emit projectiles, change flight values or choose targets.
import {signatureCue} from './pilot-signature-state.js';
export const LOTHAR_FX_PALETTE=Object.freeze({active:'#f28e38',activeEdge:'#ffc963',passive:'#f8d878',ivory:'#fff2c6',smoke:'#d5b489',brass:'#ffd178'});
export const LOTHAR_FX_LIMITS=Object.freeze({wake:10,wakeLife:.38,sampleInterval:.04,shotInterval:.04,brassLife:.36});
const clamp=n=>Math.max(0,Math.min(1,n));
const world=p=>p.combatWorld?.()||p;
const boost=p=>(p.lotharPursuit?.turnUntil||0)>(world(p).t||0);
const state=p=>p.lotharFlightFx??={clock:0,sampleAt:-Infinity,wake:[],muzzles:[],lastX:p.x,lastY:p.y};
export function tickLotharFlightFx(p,dt){
 if(p.pilot!=='lothar'||!(dt>0)||p.hp<=0||p.status==='downed'||p.state!=='playing')return;
 const f=state(p);f.clock+=Math.min(.05,dt);
 let kept=0;for(const point of f.wake)if(f.clock-point.at<LOTHAR_FX_LIMITS.wakeLife)f.wake[kept++]=point;f.wake.length=kept;
 const moved=Math.hypot(p.x-f.lastX,p.y-f.lastY);f.lastX=p.x;f.lastY=p.y;
 if(moved>100){f.wake.length=0;f.sampleAt=-Infinity;}
 if((p.skillTime>0||boost(p))&&moved>.5&&f.clock-f.sampleAt>=LOTHAR_FX_LIMITS.sampleInterval){
  f.sampleAt=f.clock;
  if(f.wake.length===LOTHAR_FX_LIMITS.wake)f.wake.shift();
  f.wake.push({x:p.x,y:p.y,a:p.a,at:f.clock,turn:boost(p),active:p.skillTime>0});
 }
}
export function lotharGunFx(p,b){
 if(p.pilot!=='lothar'||!(p.skillTime>0||boost(p))||p.reloadTime>0||p.cow37)return;
 const f=state(p),previous=f.muzzles[b.gun];
 if(previous&&f.clock-previous.at<LOTHAR_FX_LIMITS.shotInterval)return;
 const a=Math.atan2(b.vy,b.vx),side=b.gun%2?1:-1;
 f.muzzles[b.gun]={at:f.clock,a};
 signatureCue(p,'lotharBrass',{x:b.x-Math.cos(a)*11,y:b.y-Math.sin(a)*11,a,side,life:LOTHAR_FX_LIMITS.brassLife});
}
export function drawLotharWake(c,p,texture){
 const f=p.lotharFlightFx;if(!f)return;
 const wing=p.bomberTransfer?Math.min(45,(p.bomberTransfer.front||30)):24;
 for(let i=0;i<f.wake.length;i++){
  const v=f.wake[i],age=f.clock-v.at,q=clamp(age/LOTHAR_FX_LIMITS.wakeLife),fade=(1-q)*(v.turn?.72:.60),ca=Math.cos(v.a),sa=Math.sin(v.a);
  if(v.turn){const yaw=Math.sin(p.a-v.a),side=yaw<0?1:-1,back=18+age*55;
   // Only the outside wing of the real earned turn leaves a trace.
   texture(c,'vaporTrail',v.x-p.x-ca*back-sa*side*wing,v.y-p.y-sa*back+ca*side*wing,28+q*15,4.5,v.a,fade*.55,LOTHAR_FX_PALETTE.ivory);
  }
  if(v.active&&i%3===0)texture(c,'engineSmoke',v.x-p.x-ca*(29+age*32),v.y-p.y-sa*(29+age*32),24+q*15,9+q*4,v.a+Math.PI,.13*(1-q),LOTHAR_FX_PALETTE.smoke);
 }
}
export function drawLotharGuns(c,p,texture){
 const f=p.lotharFlightFx;if(!f||p.reloadTime>0||p.cow37||!(p.skillTime>0||boost(p)))return;
 const count=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
 for(let gun=0;gun<count;gun++){
  const shot=f.muzzles[gun],age=shot?f.clock-shot.at:Infinity;if(age<0||age>.14)continue;
  const a=p.gunDirection?.(gun)??p.a,offset=p.weapon?.bidirectional?0:(gun-(count-1)/2)*8;
  const mount=p.bomberGunMount?.(gun,a,offset)||{x:p.x+Math.cos(a)*23-Math.sin(a)*offset,y:p.y+Math.sin(a)*23+Math.cos(a)*offset};
  const dx=mount.x-p.x,dy=mount.y-p.y,x=dx*ca+dy*sa,y=-dx*sa+dy*ca,heading=a-p.a,pulse=1-clamp(age/.055);
  texture(c,'metalShard0',x,y,13,2.8,heading,.55*(1-age/.14),LOTHAR_FX_PALETTE.active);
  if(age>.055)continue;
  texture(c,'muzzle',x+Math.cos(heading)*11,y+Math.sin(heading)*11,29+6*pulse,12+3*pulse,heading,.92*pulse,p.skillTime>0?LOTHAR_FX_PALETTE.activeEdge:LOTHAR_FX_PALETTE.ivory);
  texture(c,'gunSmoke',x+Math.cos(heading)*13,y+Math.sin(heading)*13,24,9,heading,.25*pulse,LOTHAR_FX_PALETTE.smoke);
 }
}
export function drawLotharCue(c,p,e,texture,front){
 if(!e.kind.startsWith('lothar'))return false;
 const q=clamp(e.age/e.maxLife),fade=1-q;
 if(e.kind==='lotharBrass'){
  if(!front)return true;
  const a=e.a-p.a,ca=Math.cos(a),sa=Math.sin(a),forward=-e.age*48,side=e.side*(5+e.age*72);
  texture(c,'bulletBrass',ca*forward-sa*side,sa*forward+ca*side,7-q*2,3-q, a+e.side*e.age*13,.82*fade,LOTHAR_FX_PALETTE.brass);return true;
 }
 if(front)return true;
 if(e.kind==='lotharAttack'||e.kind==='lotharTransfer'){
  const transfer=e.kind==='lotharTransfer';
  for(const side of [-1,1])texture(c,'metalShard0',23,side*4,14,2.5,0,.55*fade,transfer?LOTHAR_FX_PALETTE.passive:LOTHAR_FX_PALETTE.activeEdge);
  if(transfer)for(const side of [-1,1])texture(c,'bulletBrass',8-q*15,side*(6+q*3),7,3,side*.1,.8*fade,LOTHAR_FX_PALETTE.brass);
 }else if(e.kind==='lotharKill'){
  texture(c,'gunSmoke',0,0,29+q*20,16+q*8,e.a-p.a,.3*fade,LOTHAR_FX_PALETTE.smoke);
 }else if(e.kind==='lotharLinkHit'){
  const a=e.a-p.a;
  texture(c,'ricochet',0,0,38+q*10,16,a,.82*fade,LOTHAR_FX_PALETTE.passive);
  for(const side of [-1,1]){const b=a+side*.55,d=4+q*16;texture(c,side<0?'metalShard0':'metalShard1',Math.cos(b)*d,Math.sin(b)*d,9,3,b,.8*fade,LOTHAR_FX_PALETTE.ivory);}
  texture(c,'gunSmoke',-4,0,22+q*10,12,a,.24*fade,LOTHAR_FX_PALETTE.smoke);
 }
 return true;
}

