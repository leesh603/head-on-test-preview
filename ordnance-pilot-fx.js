// Guynemer's actual ordnance and Bishop's existing altitude/bombing run.
// All observations use the existing bounded signature queue; no new projectiles.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
import {drawBishopPassive} from './pilot-passive-art.js';
import {bombFallPose} from './bomb-sprites.js?v=bomb20&perf=1029';
import {combatVisualPose} from './combat-feedback.js?v=descent20261022&motion=20261022';
export const ORDNANCE_PILOTS=new Set(['guynemer','bishop']);
const INSTALLED=Symbol.for('headon.ordnance-pilot-fx.v1');
const clamp=n=>Math.max(0,Math.min(1,n));
const alive=p=>p.hp>0&&p.status!=='downed';
const own=p=>p.id??'p1';
const world=p=>p.combatWorld?.()||p;
const personal=b=>Number.isInteger(b.gun)&&!['enemy','ally','formation','patrol','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','identityDot','identityChain'].some(k=>b[k]);
let linen;
export const ordnanceMaterialReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 linen=new Image();linen.onload=()=>resolve(true);linen.onerror=()=>resolve(false);
 linen.src=new URL('./pilot-material-art/berthold-torn-skin.webp',import.meta.url).href;
});
export function bishopClosePower(p,b,e){
 if(!e)return 0;const origin=b.identityOrigin||p,d=Math.hypot(origin.x-e.x,origin.y-e.y),near=Math.hypot(p.x-e.x,p.y-e.y)<=300;
 return Math.max(clamp(1-d/360),near?.35:0);
}
export function installOrdnancePilotFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){const r=round.call(this,b,type);
  if(ORDNANCE_PILOTS.has(this.pilot)&&alive(this)&&this.state==='playing'&&personal(b)&&(b.ownerId===undefined||b.ownerId===own(this))&&this.reloadTime<=0&&!(this.bishopTime>0)&&signatureInterval(this,'ordnanceGun'+b.gun,.025))
   signatureCue(this,'ordnanceGun',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),life:.08});
  return r;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,target,pos){const r=impact.call(this,b,e,target,pos);
  if(!ORDNANCE_PILOTS.has(this.pilot)||!alive(this)||this.state!=='playing'||b.enemy||(b.ownerId??'p1')!==own(this)||b.ally||b.formation||b.patrol||b.actualExplosion||b.blast||b.identityDot||b.identityChain)return r;
  const close=this.pilot==='bishop'&&personal(b)?bishopClosePower(this,b,e):0,cannon=this.pilot==='guynemer'&&b.motorCannon;
  if((close>0||cannon)&&signatureInterval(this,'ordnanceImpact',.075)){
   const point=e?.stageBossBody?(pos||b):b;signatureCue(this,cannon?'ordnanceCannonHit':'ordnanceCloseHit',{x:point.x,y:point.y,a:Math.atan2(b.vy,b.vx),power:close,life:.3});
  }return r;
 };
 const hit=q.hit;q.hit=function(...args){const r=hit.apply(this,args);if(ORDNANCE_PILOTS.has(this.pilot)&&!(this.hp>0))delete this.pilotSignatureState;return r;};
}
// The signature origin follows the visible aircraft. World ordnance must stay
// on the existing combat/bomb path even while Bishop is above the screen.
export function ordnanceGroundShift(p){
 const recoil=clamp((p.cannonRecoil129||0)/.24),kick=(p.cannonKick129||0)*Math.sin(recoil*Math.PI/2);
 const visual=combatVisualPose(p);return {x:Math.cos(p.a)*kick-visual.x,y:Math.sin(p.a)*kick+(p.bishopFlightHeight?.()||0)-visual.y};
}
export function guynemerRockets(p){
 const list=world(p).bullets||[],out=[];
 for(let i=list.length-1;i>=0&&out.length<12;i--){const b=list[i];
  if(b.rocket&&b.special&&!b.enemy&&!b.ally&&!b.formation&&(b.ownerId??'p1')===own(p)&&b.life>0&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite)&&Math.hypot(b.x-p.x,b.y-p.y)<850)out.push(b);
 }return out;
}
export function drawOrdnanceWorld(c,p,tex){
 if(!alive(p))return;const shift=ordnanceGroundShift(p);
 if(p.pilot==='guynemer')for(const b of guynemerRockets(p)){
  const a=Math.atan2(b.vy,b.vx),ca=Math.cos(a),sa=Math.sin(a),x=b.x-p.x+shift.x,y=b.y-p.y+shift.y;
  tex(c,'incendiary',x-ca*19,y-sa*19,25,8,a,.9,'#e8a15c');
  for(let i=0;i<2;i++)tex(c,'smokeWisp',x-ca*(34+i*16),y-sa*(34+i*16),26+i*7,14+i*4,a,.52-i*.17,'#d2c2a2');
 }
 if(p.pilot==='bishop'){
  drawBishopDeparture(c,p,tex,shift);
  let count=0;for(const b of world(p).friendlyBombs||[]){
   if(!b.bishopBomb||(b.ownerId??'p1')!==own(p)||!(b.life>0)||!(b.maxLife>0)||![b.sx,b.sy,b.x,b.y].every(Number.isFinite))continue;
   const pose=bombFallPose(b.sx,b.sy,b.x,b.y,1-b.life/b.maxLife,b.releaseAngle);
   const x=pose.x-p.x+shift.x-Math.cos(pose.angle)*7*pose.scale-Math.sin(pose.angle)*5*pose.scale,y=pose.y-p.y+shift.y-Math.sin(pose.angle)*7*pose.scale+Math.cos(pose.angle)*5*pose.scale;
   // A glancing steel fin, not a fuse or a second bomb. Body/fall/shadow stay
   // with the ordinary bomb renderer and the original world coordinates.
   tex(c,'metalShard0',x,y,10*pose.scale,3.5*pose.scale,pose.angle,.62,'#aebfc8');
   if(++count===12)break;
  }
 }
}
export function drawOrdnanceLocal(c,p,tex,front=false){
 if(!alive(p))return;
 if(p.pilot==='guynemer'){
  if(!front){const sides=new Set();for(const b of guynemerRockets(p))if(Math.hypot(b.x-p.x,b.y-p.y)<38){const dy=-(b.x-p.x)*Math.sin(p.a)+(b.y-p.y)*Math.cos(p.a);sides.add(dy<0?-1:1);}
   for(const side of sides)tex(c,'gunSmoke',7,side*24,43,23,-side*.35,.65,'#a7aaa0');return;}
  const recoil=p.cannonRecoil129||0;if(recoil<=0)return;const age=.24-recoil;
  if(age>=0&&age<.075)tex(c,'muzzleHeavy',34,0,49,22,0,.94*(1-age/.075),'#f0d0a0');
  tex(c,'gunSmoke',43,0,43+(1-recoil/.24)*15,27,0,.55*clamp(recoil/.24),'#969d99');return;
 }
 if(p.pilot==='bishop'&&!front&&p.bishopTime>0){
  const age=(p.skillDuration?.()||2.4)-p.bishopTime,entry=age<.5,returning=age>.5&&age<1.06;
  if(entry||returning){const strength=entry?Math.sin(clamp(age/.5)*Math.PI):Math.sin(clamp((age-.5)/.56)*Math.PI);
   for(const side of [-1,1]){
    const q=entry?clamp(age/.5):clamp((age-.5)/.56);
    tex(c,'mist',-12-q*18,side*(26+q*9),90+q*28,40+q*9,side*.18,.70*strength,'#c5cfcc');
    tex(c,'vaporTrail',-42-q*20,side*25,entry?62:100,entry?7:10,0,(entry?.45:.70)*strength,'#dddccd');
   }
  }
 }
}
// Cloud fragments stay where the real climb began, while the aircraft rises.
// This world pass compensates for the existing visual altitude/recoil offset.
export function drawBishopDeparture(c,p,tex,shift=ordnanceGroundShift(p)){
 if(p.pilot!=='bishop'||!alive(p)||p.state!=='playing'||!(p.bishopTime>0))return;
 const s=p.pilotSignatureState,point=s?.activationPoint,age=s?.activeAge;
 if(!point||!Number.isFinite(age)||age<=0||age>=.65||![point.x,point.y].every(Number.isFinite))return;
 const a=s.activationHeading??p.a,ca=Math.cos(a),sa=Math.sin(a),q=age/.65,fade=Math.sin(q*Math.PI);
 const x=point.x-p.x+shift.x,y=point.y-p.y+shift.y;
 for(const side of [-1,1])tex(c,'mist',x-ca*q*21-sa*side*(24+q*17),y-sa*q*21+ca*side*(24+q*17),150+q*45,75+q*25,a+side*.18,.82*fade,'#b9c8c9');
 tex(c,'gustFront',x+ca*9,y+sa*9,120+q*35,70+q*20,a+Math.PI,.65*fade,'#e3dfca');
}
export function drawOrdnanceCue(c,p,e,tex,front){
 if(!ORDNANCE_PILOTS.has(p.pilot))return false;
 if(['rocketSalvo','cannonShot','closeAttack','closeHit','shotAccent'].includes(e.kind))return true;
 if(!['ordnanceGun','ordnanceCloseHit','ordnanceCannonHit'].includes(e.kind))return false;
 if(front){const fade=1-clamp(e.age/e.maxLife),a=e.a-p.a;
  if(e.kind==='ordnanceGun')tex(c,'muzzleTwin',Math.cos(a)*6,Math.sin(a)*6,23,10,a,.9*fade,p.pilot==='bishop'?'#d4b385':'#e8d3ab');
  else if(e.kind==='ordnanceCloseHit'){
   drawBishopPassive(c,p,e);
  }else{tex(c,'armorSpark',0,0,40,24,a,.9*fade,'#e8d1a6');tex(c,'gunSmoke',-e.age*18,0,35,23,a,.38*fade,'#989b94');}
 }return true;
}

