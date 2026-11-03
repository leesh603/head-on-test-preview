// Boelcke and Collishaw: observe real owned wingmen, guns and confirmed damage.
// Render-only air wakes observe real positions; never create a projectile or target.
import {signatureCue,signatureInterval} from './pilot-signature-state.js';
export const COMMAND_PILOTS=new Set(['boelcke','collishaw']);
export const COMMAND_PALETTES=Object.freeze({
 boelcke:Object.freeze({edge:'#80b7af',core:'#e2ddc5',smoke:'#778e8b',impact:'#e8c58c'}),
 collishaw:Object.freeze({edge:'#a56e63',core:'#bfcbd0',smoke:'#494c54',impact:'#ead0a0'})
});
const clamp=n=>Math.max(0,Math.min(1,n));
const owner=p=>p.id??'p1';
const living=p=>p.hp>0&&p.status!=='downed';
const world=p=>p.combatWorld?.()||p;
const mine=(p,b)=>(b.ownerId??'p1')===owner(p);
const blocked=b=>['enemy','patrol','rocket','motorCannon','cow37','blast','actualExplosion','mauserRound','identityDot','identityChain'].some(k=>b[k]);
const INSTALLED=Symbol.for('headon.command-flight-fx.v1');
export function boelckeFlank(p,e){
 if(!e||![e.x,e.y,p.x,p.y].every(Number.isFinite))return false;
 const a=Math.atan2(p.y-e.y,p.x-e.x)-(e.a||0);
 // The revision layer begins the existing flank bonus at 60 degrees; the
 // later identity layer also boosts rear angles. This view covers both.
 return Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))>=Math.PI/3;
}
// Only the existing positive-damage notification calls this observer, including
// lethal hits and boss parts. Geometry matches the current damage multiplier.
export function installCommandFlightFx(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;
 Object.defineProperty(q,INSTALLED,{value:true});const prior=q.identityImpact;
 q.identityImpact=function(b,e,target,position){
  const result=prior.call(this,b,e,target,position);
  if(!COMMAND_PILOTS.has(this.pilot)||!living(this)||this.state!=='playing'||!b||!mine(this,b)||blocked(b))return result;
  const flank=this.pilot==='boelcke'&&!b.ally&&!b.formation&&boelckeFlank(this,e);
  const cross=this.pilot==='collishaw'&&(b.blackFlight||b.ally||b.formation);
  if((flank||cross)&&signatureInterval(this,'commandImpact',.09)){
   const pos=e?.stageBossBody?(position||b):b;
   signatureCue(this,flank?'commandFlank':'commandCrossHit',{x:pos.x,y:pos.y,a:Math.atan2(b.vy,b.vx),life:.32});
  }
  return result;
 };
}
export function commandWings(p){
 if(!COMMAND_PILOTS.has(p.pilot)||!living(p))return [];
 const owned=w=>w.ownerId===owner(p)||(w.ownerId===undefined&&!p.world&&!p.players);
 const all=(world(p).allies||[]).filter(w=>owned(w)&&w.life>0&&(w.hp===undefined||w.hp>0)&&!w.crashing&&!w.crashed&&(w.permanent||w.boelckePincer));
 if(p.pilot==='collishaw')for(const w of p.formationWings||[])if(w.alpha>0&&(w.hp===undefined||w.hp>0)&&!w.crashing&&!w.crashed)all.push(w);
 return all.filter(w=>[w.x,w.y,w.a].every(Number.isFinite)).slice(0,10);
}
// Weak, player-local rendering cache: no serialized state or flight mutations.
// Sample real world-space wingtip positions, never a reconstructed flight path.
const wakes=new WeakMap();
export function clearBoelckeWake(p){wakes.delete(p);}
export function boelckeWakeSegments(p){
 const signature=p.pilotSignatureState,time=signature?.clock;
 if(p.pilot!=='boelcke'||!living(p)||p.state!=='playing'||!(p.skillTime>0)||!Number.isFinite(time)){
  clearBoelckeWake(p);return [];
 }
 let cache=wakes.get(p);
 if(!cache||cache.signature!==signature||cache.owner!==owner(p)||time<cache.time||time-cache.time>.2){
  cache={signature,owner:owner(p),time,wings:new Map()};wakes.set(p,cache);
 }
 cache.time=time;
 const wings=commandWings(p).filter(w=>w.boelckePincer&&w.flightSpeed>40),kept=new Set(wings),segments=[];
 for(const w of cache.wings.keys())if(!kept.has(w))cache.wings.delete(w);
 for(const w of wings){
  let poses=cache.wings.get(w)||[],last=poses.at(-1);
  if(last&&Math.hypot(w.x-last.x,w.y-last.y)>Math.max(32,(time-last.t)*500))poses=[];
  last=poses.at(-1);
  if(!last||time-last.t>=.03){
   const ca=Math.cos(w.a),sa=Math.sin(w.a);
   poses.push({x:w.x,y:w.y,t:time,tips:[-1,1].map(side=>({x:w.x-ca*9-sa*side*21,y:w.y-sa*9+ca*side*21}))});
  }
  poses=poses.filter(v=>time-v.t<=.42).slice(-15);cache.wings.set(w,poses);
  for(let i=1;i<poses.length;i++)for(let side=0;side<2;side++){
   const from=poses[i-1].tips[side],to=poses[i].tips[side],dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
   if(length<.3||length>32)continue;
   const fade=clamp(1-(time-poses[i].t)/.42),alpha=w.alpha===undefined?1:clamp(w.alpha);
   segments.push({x:(from.x+to.x)/2-p.x,y:(from.y+to.y)/2-p.y,a:Math.atan2(dy,dx),length:length+7,width:16,opacity:.72*fade*alpha});
  }
 }
 return segments;
}
function boelckePressure(c,p,tex){
 for(const v of boelckeWakeSegments(p))tex(c,'vaporTrail',v.x,v.y,v.length,v.width,v.a,v.opacity,'#f3eee0');
}
// Black Flight is the aircraft paint and crossing attack, not an oil-fire plume.
function blackFlightSlipstream(at,time,slot,active){
 if(active)at('windStreak',-31,slot%2?-23:23,24,3,0,.13,COMMAND_PALETTES.collishaw.core);
}
function brass(at,flash,side,count){
 const age=Math.max(0,.09-flash);
 for(let i=0;i<count;i++)at('bulletBrass',13-age*(66+i*18)-i*3,side*(12+age*(75+i*20)+i*4),5.5,2.5,side*(.5+age*12+i*.8),.82*(1-age/.12),'#c69a61');
}
export function drawCommandWorld(c,p,tex,front=false){
 if(!living(p)){clearBoelckeWake(p);return;}const palette=COMMAND_PALETTES[p.pilot];if(!palette){clearBoelckeWake(p);return;}
 const active=p.skillTime>0,time=p.pilotSignatureState?.clock||0;
 if(!front&&p.pilot==='boelcke'){
  boelckePressure(c,p,tex);
  let count=0;
  for(const e of world(p).enemies||[]){
   const d=Math.hypot(e.x-p.x,e.y-p.y);
   if(!(e.hp>0)||e.surface||e.fieldUnit||e.stageBossBody||d<30||d>560||!boelckeFlank(p,e))continue;
   const a=Math.atan2(p.y-e.y,p.x-e.x),size=Math.min(23,Math.max(12,(e.hitRadius||24)*.65));
   tex(c,'metalShard0',e.x-p.x+Math.cos(a)*16,e.y-p.y+Math.sin(a)*16,size,7,a,.48,palette.core);
   if(++count===4)break;
  }
 }
 for(const w of commandWings(p)){
  const dx=w.x-p.x,dy=w.y-p.y,a=w.a,ca=Math.cos(a),sa=Math.sin(a),alpha=w.alpha===undefined?1:clamp(w.alpha);
  const at=(key,x,y,width,height,angle,opacity,color)=>tex(c,key,dx+ca*x-sa*y,dy+sa*x+ca*y,width,height,a+angle,opacity*alpha,color);
  const side=(-Math.sin(p.a)*dx+Math.cos(p.a)*dy)<0?-1:1;
  if(front){
   if(!(w.muzzleFlash>0))continue;
   const aim=w.fireHeading??w.muzzleAngle??a,fade=clamp(w.muzzleFlash/.06),collie=p.pilot==='collishaw';
   tex(c,collie?'muzzleTwin':'muzzle',dx+Math.cos(aim)*32,dy+Math.sin(aim)*32,collie?19:25,collie?7:9,aim,.94*fade*alpha,collie?'#e5b777':palette.impact);
   if(collie)brass(at,w.muzzleFlash,side,active?2:1);
   else{
    tex(c,'gunSmoke',dx+Math.cos(aim)*18,dy+Math.sin(aim)*18,40,19,aim,.45*fade*alpha,'#c7c8b8');
    brass(at,w.muzzleFlash,side,active&&w.boelckePincer?2:1);
   }
   continue;
  }
  if(Math.hypot(dx,dy)<28)continue;
  if(p.pilot==='collishaw')blackFlightSlipstream(at,time,w.slot||0,active);
 }
}
export function drawCommandLocal(c,p,tex,front=false){
 if(!living(p))return;const pal=COMMAND_PALETTES[p.pilot];if(!pal)return;
 const active=p.skillTime>0,collie=p.pilot==='collishaw';
 if(!front){
  // The leader stays clean. Actual wing positions and gunfire carry the order.
  return;
 }
 if(!(p.muzzleFlash>0)||p.reloadTime>0||p.cow37)return;
 const count=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
 for(let gun=0;gun<count;gun++){
  const heading=p.gunDirection?.(gun)??p.a,offset=p.weapon?.bidirectional?0:(gun-(count-1)/2)*8;
  const m=p.bomberGunMount?.(gun,heading,offset)||{x:p.x+Math.cos(heading)*26,y:p.y+Math.sin(heading)*26};
  const dx=m.x-p.x,dy=m.y-p.y,a=heading-p.a,x=dx*ca+dy*sa,y=-dx*sa+dy*ca,fade=clamp(p.muzzleFlash/.055);
  tex(c,collie?'muzzleTwin':'muzzle',x+Math.cos(a)*7,y+Math.sin(a)*7,collie?18:24,collie?7:9,a,.90*fade,collie?'#e5b777':pal.impact);
  if(collie)brass((key,bx,by,w,h,angle,opacity,color)=>tex(c,key,x+bx-18,y+by,w,h,angle,opacity,color),p.muzzleFlash,gun%2?1:-1,1);
  else{
   tex(c,'gunSmoke',x-Math.cos(a)*6,y-Math.sin(a)*6,29,11,a,.30*fade,pal.smoke);
   brass((key,bx,by,w,h,angle,opacity,color)=>tex(c,key,x+bx-18,y+by,w,h,angle,opacity,color),p.muzzleFlash,gun%2?1:-1,1);
  }
 }
}
export function drawCommandCue(c,p,e,tex,front){
 if(!COMMAND_PILOTS.has(p.pilot))return false;
 // Replaced by live wing positions and live muzzle timers, without fake shots.
 if(['pincerOrder','blackFlight','wingSlipstream','shotAccent','rearAttack','crossfire'].includes(e.kind))return true;
 if(!['commandFlank','commandCrossHit'].includes(e.kind))return false;
 if(front){const pal=COMMAND_PALETTES[p.pilot],q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
  if(e.kind==='commandFlank'){
   tex(c,'ricochet',0,0,23,7,a,.96*fade,pal.core);
   tex(c,'metalShard0',-q*6,0,10,3,a,.80*fade,pal.impact);
   tex(c,'smokeWisp',-q*7,0,21+q*8,11,a,.24*fade,pal.smoke);
  }else{
   tex(c,'gunSmoke',-Math.cos(a)*q*8,-Math.sin(a)*q*8,31+q*19,23+q*7,a,.48*fade,pal.smoke);
   tex(c,'spark',0,0,23-q*7,16-q*5,a,.88*fade,'#e5b777');
   for(let i=0;i<3;i++)tex(c,'metalShard'+i,-q*(9+i*5),(i-1)*q*19,6,3,a+(i-1)*q*3,.78*fade,pal.edge);
  }
 }
 return true;
}

