// Jacobs' passive observes real direct hits and world-space firing approaches.
// The existing active fan, its ammunition, spread and suppression remain untouched.
import {signatureState,signatureCue} from './pilot-signature-state.js';
import {combatImpactResult} from './combat-impact-result.js';
import {finalArenaBosses} from './pandemonium-registry.js';
export const JACOBS_ANGLE_BALANCE=Object.freeze({angle:Math.PI/3,travel:100,memory:7,cooldown:3,boostSeconds:1.2,damage:.35,maxTargets:16,maxStep:100});
const B=JACOBS_ANGLE_BALANCE,INSTALLED=Symbol.for('headon.jacobs-angle.v1'),states=new WeakMap();let generation=0;
const owner=p=>p.id??'p1',world=p=>p.combatWorld?.()||p.world||p;
const live=p=>p?.pilot==='jacobs'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const personal=(p,b,preEmit=false)=>b&&Number.isInteger(b.gun)&&((preEmit&&b.ownerId===undefined)||(b.ownerId??'p1')===owner(p))&&!['enemy','ally','formation','patrol','transferGun','rocket','cow37','motorCannon','mauserRound','blast','actualExplosion','identityDot','identityChain','tacticalRound'].some(k=>b[k]);
const angle=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
export function jacobsAngleBody(p,e){return e?.finalArenaTarget?finalArenaBosses(world(p).finalArena).find(v=>v.id===e.finalArenaBossId&&v.formToken===e.finalArenaFormToken)||e:e?.stageBossBody||e;}
const dead=e=>!e||e.hp<=0||e.dead||e.defeated||e.destroyed||e.crashed||e.expired||e.rivalEscaped||e.fortress?.coreHp<=0;
function state(p){const sig=signatureState(p);let r=states.get(p);if(!r||r.sig!==sig||sig.clock<r.clock){r={sig,clock:sig.clock,generation:++generation,sequence:0,travel:0,x:p.x,y:p.y,contacts:new Map(),ids:new WeakMap(),nextId:0,boostId:0,boostUntil:0};states.set(p,r);}r.clock=sig.clock;return r;}
function id(r,e){if(!r.ids.has(e))r.ids.set(e,++r.nextId);return r.ids.get(e);}
function move(p,r){const d=Math.hypot(p.x-r.x,p.y-r.y);r.x=p.x;r.y=p.y;if(!Number.isFinite(d)||d>B.maxStep){r.contacts.clear();r.boostUntil=0;r.generation=++generation;return;}r.travel+=d;}
export function resetJacobsAngle(p){states.delete(p);if(p.pilotSignatureState)delete p.pilotSignatureState.jacobsAngle;}
export function installJacobsAngleCombat(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){const prior=begin.call(this,dt,input);if(this.pilot!=='jacobs')return prior;if(!live(this)){resetJacobsAngle(this);return prior;}const r=state(this);move(this,r);for(const [body,v]of r.contacts)if(dead(body)||r.clock-v.at>B.memory)r.contacts.delete(body);return prior;};
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){
  if(live(this)&&personal(this,b,true)){const r=state(this);move(this,r);b.jacobsApproach={x:this.x,y:this.y,a:Math.atan2(b.vy,b.vx),travel:r.travel,at:r.clock,generation:r.generation,sequence:++r.sequence,boostId:r.boostUntil>r.clock?r.boostId:0};}
  return apply.call(this,b,...args);
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){const base=damage.call(this,b,e);if(!live(this)||!personal(this,b)||!b.jacobsApproach)return base;const r=state(this),m=b.jacobsApproach,body=jacobsAngleBody(this,e);return base*(m.generation===r.generation&&m.boostId&&m.boostId===id(r,body)?1+B.damage:1);};
 const impact=q.specialRoundImpact;q.specialRoundImpact=function(b,e,...args){const result=impact.call(this,b,e,...args);if(!live(this)||!personal(this,b)||!b.jacobsApproach)return result;const hit=combatImpactResult(b,e);if(!(hit?.damage>0)||hit.blocked)return result;
  const r=state(this),m=b.jacobsApproach,body=jacobsAngleBody(this,e);if(dead(body)||m.generation!==r.generation||r.clock-m.at>B.memory||![m.x,m.y,m.a,m.travel].every(Number.isFinite))return result;
  const center=e.finalArenaTarget?(world(this).enemies||[]).find(v=>v.finalArenaTarget==='core'&&v.finalArenaBossId===e.finalArenaBossId&&v.finalArenaFormToken===e.finalArenaFormToken):body;if(!center)return result;
  const x=Number.isFinite(center.x)?center.x:e.x,y=Number.isFinite(center.y)?center.y:e.y;if(!Number.isFinite(x)||!Number.isFinite(y))return result;
  const bearing=Math.atan2(m.y-y,m.x-x),prev=r.contacts.get(body);
  if(prev&&prev.sequence===m.sequence)return result; // Shared by all pellets in the existing fan.
  if(prev&&r.clock-prev.at<=B.memory){
   if(m.at<prev.shotAt)return result; // A late old projectile cannot roll the anchor backwards.
   const changed=angle(bearing,prev.bearing)>=B.angle&&angle(m.a,prev.a)>=B.angle;
   if(changed&&m.travel-prev.travel>=B.travel&&Math.hypot(m.x-prev.x,m.y-prev.y)>=B.travel&&r.clock>=(prev.rearm||0)){
    r.boostId=id(r,body);r.boostUntil=r.clock+B.boostSeconds;
    signatureCue(this,'jacobsAngle',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),life:.48});
    const visual=r.sig.jacobsAngle??={count:0};Object.assign(visual,{count:visual.count+1,boostUntil:r.boostUntil,x:b.x,y:b.y});
    r.contacts.set(body,{...m,bearing,at:r.clock,shotAt:m.at,rearm:r.clock+B.cooldown});return result;
   }
   // Preserve the first accepted approach, but remember this pellet family.
   prev.sequence=m.sequence;return result;
  }
  if(r.contacts.size>=B.maxTargets)r.contacts.delete(r.contacts.keys().next().value);
  r.contacts.set(body,{...m,bearing,at:r.clock,shotAt:m.at,rearm:prev?.rearm||0});return result;
 };
 q.resetJacobsAngle=function(){if(this.pilot==='jacobs')resetJacobsAngle(this);};
 const received=q.buildReceivedDamage;q.buildReceivedDamage=function(...args){const result=received.apply(this,args);if(this.pilot==='jacobs'&&(!live(this)))resetJacobsAngle(this);return result;};
}
