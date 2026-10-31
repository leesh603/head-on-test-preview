// Death Mark: owner-local direct MG combat. No hostile-round deletion or steering.
import {signatureState,activatePilotSignature,nungesserState} from './pilot-signature-state.js';
import {finalArenaBosses} from './pandemonium-registry.js';
import {combatImpactResult} from './combat-impact-result.js';
export const NUNGESSER_BALANCE=Object.freeze({activeSeconds:5,rate:1.6,markDamage:.5,passiveDamage:.25,engagementHits:3,engagementSpan:.3,gapSeconds:1.5,memorySeconds:8,boostSeconds:2,rearmSeconds:4,aimRange:780,aimPad:18});
const B=NUNGESSER_BALANCE,INSTALLED=Symbol.for('headon.nungesser-combat.v2'),runtime=new WeakMap();
const owner=p=>p.id??'p1',world=p=>p.combatWorld?.()||p.world||p;
const live=p=>p?.pilot==='nungesser'&&p.hp>0&&p.status!=='downed'&&p.state==='playing';
const canonical=(p,e)=>e?.finalArenaTarget?finalArenaBosses(world(p).finalArena).find(v=>v.id===e.finalArenaBossId&&v.formToken===e.finalArenaFormToken)||e:e?.stageBossBody||e;
const dead=e=>!e||e.dead||e.destroyed||e.defeated||e.hp<=0;
const available=(p,e)=>e&&!dead(canonical(p,e))&&e.hp>0&&!e.expired&&!e.rivalEscaped&&!e.crashed;
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===owner(p))&&!['enemy','ally','formation','patrol','transferGun','rocket','cow37','motorCannon','mauserRound','blast','actualExplosion','identityDot','identityChain','nungesserCounter','tacticalRound'].some(k=>b[k]);
export function nungesserTargetKey(p,e){const body=canonical(p,e);return body?(e.finalArenaTarget?'arena:'+e.finalArenaBossId+':'+e.finalArenaFormToken:e.stageBossBody?'body:'+(e.encounterId||'')+':'+body.id:'enemy:'+p.tailIdFor(body)):null;}
function state(p){const sig=signatureState(p),n=nungesserState(p);let r=runtime.get(p);if(!r||r.sig!==sig||r.n!==n||sig.clock<r.clock){r={sig,n,clock:sig.clock,contacts:new Map(),marked:null,awaiting:false};runtime.set(p,r);}r.clock=sig.clock;return {n,r,clock:sig.clock};}
function clearMark(n){n.markKey=null;n.markX=n.markY=n.markTop=0;n.markRemaining=0;}
function reset(p){const {n,r}=state(p);r.marked=null;r.awaiting=false;r.contacts.clear();clearMark(n);n.boostKey=null;n.boostUntil=0;}
function radius(e){return Math.max(12,e.hitRadius||e.radius||e.hullWidth||30);}
function points(p,e){
 const body=e.stageBossBody;if(!body)return [{x:e.x,y:e.y,r:radius(e)}];
 const out=[];for(const part of body.parts?.values?.()||[]){if(part.destroyed)continue;const raw=body.support129?.parts.get(part.id),pos=raw?body.support129.world(raw.nx,raw.ny):{x:body.x+(part.x||0),y:body.y+(part.y||0)};out.push({...pos,r:Math.max(8,part.radius||30)});}
 out.push({x:body.x,y:body.y,r:body.coreRadius||body.radius||30});return out;
}
// Ordinary forward aiming ray only: no enemy-facing or flank-angle bonus.
export function nungesserAimedTarget(p){let best=null,score=Infinity;const ca=Math.cos(p.a),sa=Math.sin(p.a);for(const e of world(p).enemies||[]){if(!available(p,e))continue;for(const v of points(p,e)){const dx=v.x-p.x,dy=v.y-p.y,along=dx*ca+dy*sa,across=Math.abs(-dx*sa+dy*ca),r=v.r+B.aimPad;if(along<=0||along>B.aimRange||across>r)continue;const rank=Math.max(0,along-Math.sqrt(r*r-across*across));if(rank<score){score=rank;best=e;}}}return best;}
function setMark(p,e){const {n,r}=state(p);r.marked=canonical(p,e);r.awaiting=false;n.markKey=nungesserTargetKey(p,e);syncMark(p,e);}
function syncMark(p,e){const n=nungesserState(p),body=canonical(p,e),entries=(world(p).enemies||[]).filter(x=>canonical(p,x)===body&&available(p,x)),all=entries.flatMap(x=>points(p,x));if(!all.length)return;
 const left=Math.min(...all.map(v=>v.x-v.r)),right=Math.max(...all.map(v=>v.x+v.r)),top=Math.min(...all.map(v=>v.y-v.r));n.markX=(left+right)/2;n.markY=top;n.markTop=17;n.markRemaining=Math.max(0,p.skillTime);n.markAt=signatureState(p).clock;}
export function nungesserCombatStatus(p){const n=p?.pilotSignatureState?.nungesser,t=p?.pilotSignatureState?.clock||0;return {ready:live(p)&&n?.boostUntil>t,readyFraction:live(p)&&n?.boostUntil>t?Math.min(1,(n.boostUntil-t)/B.boostSeconds):0,active:live(p)&&p.skillTime>0&&!!n?.markKey,entry:false};}
export function installNungesserCombat(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const duration=q.skillDuration;q.skillDuration=function(){return this.pilot==='nungesser'?B.activeSeconds:duration.call(this);};
 const skill=q.skill;q.skill=function(){if(this.pilot!=='nungesser')return skill.call(this);if(!live(this)||this.cooldown>0||this.mission?.unarmed||this.heineckeEscape>0)return false;const e=nungesserAimedTarget(this);if(!e)return false;this.ensureRevisionPilot?.();this.skillTime=B.activeSeconds;this.cooldown=this.skillCooldown();setMark(this,e);activatePilotSignature(this);this.event?.('skill','죽음의 표식');return true;};
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){const prior=begin.call(this,dt,input);if(this.pilot!=='nungesser')return prior;if(!live(this)){reset(this);return prior;}const {n,r,clock}=state(this);
  for(const [key,v]of r.contacts)if(clock-v.last>B.memorySeconds)r.contacts.delete(key);
  if(!(this.skillTime>0)){clearMark(n);r.marked=null;r.awaiting=false;}else{
   if(r.marked){const entries=(world(this).enemies||[]).filter(e=>canonical(this,e)===r.marked),e=entries.find(e=>available(this,e));
    if(dead(r.marked)){r.marked=null;r.awaiting=false;clearMark(n);this.skillTime=0;}else if(!e){r.marked=null;r.awaiting=false;clearMark(n);this.skillTime=0;}else syncMark(this,e);
   }
   if(r.awaiting){const next=nungesserAimedTarget(this);if(next)setMark(this,next);}
   if(n.markKey)this.rate/=B.rate;
  }
  this.passiveStrength=nungesserCombatStatus(this).readyFraction;return prior;
 };
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){const result=apply.call(this,b,...args),shot=result??b;if(!live(this)||!personal(this,shot))return result;const {n,clock}=state(this);shot.ownerId=owner(this);
  if(this.skillTime>0&&n.markKey){shot.pierce=true;shot.nungesserBreakthrough=true;shot.nungesserMarkKey=n.markKey;shot.nungesserMarkBonus=B.markDamage;}
  if(n.boostUntil>clock){shot.nungesserReattackKey=n.boostKey;shot.nungesserReattackBonus=B.passiveDamage;}
  return result;
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){const base=damage.call(this,b,e);if(!live(this)||!personal(this,b))return base;const key=nungesserTargetKey(this,e);return base*(1+(b.nungesserMarkKey===key?b.nungesserMarkBonus||0:0)+(b.nungesserReattackKey===key?b.nungesserReattackBonus||0:0));};
 const impact=q.specialRoundImpact;q.specialRoundImpact=function(b,e,...args){const result=impact.call(this,b,e,...args);if(!live(this)||!personal(this,b)||!(combatImpactResult(b,e)?.damage>0))return result;const {n,r,clock}=state(this),key=nungesserTargetKey(this,e),prev=r.contacts.get(key);
  if(!dead(canonical(this,e))){const gap=prev?clock-prev.last:Infinity;if(prev&&prev.hits>=B.engagementHits&&prev.last-prev.first>=B.engagementSpan&&gap>=B.gapSeconds&&gap<=B.memorySeconds&&clock>=(prev.rearmAt||0)){n.boostKey=key;n.boostUntil=clock+B.boostSeconds;r.contacts.set(key,{first:clock,last:clock,hits:1,rearmAt:clock+B.rearmSeconds});}
   else if(prev&&gap<B.gapSeconds){prev.last=clock;prev.hits++;}else r.contacts.set(key,{first:clock,last:clock,hits:1,rearmAt:prev?.rearmAt||0});
  }
  if(r.marked===canonical(this,e)&&dead(r.marked)){r.marked=null;r.awaiting=true;clearMark(n);}
  return result;
 };
 q.resetNungesserCombat=function(){runtime.delete(this);if(this.pilotSignatureState?.nungesser)delete this.pilotSignatureState.nungesser;};
}

// Guest presentation only: never select targets, emit rounds or apply damage.
export function advanceNungesserReplica(p,dt){
 if(p?.pilot!=='nungesser')return;const n=p.pilotSignatureState?.nungesser;if(!n)return;
 if(p.hp<=0||p.status==='downed'){clearMark(n);return;}
 n.markRemaining=Math.max(0,(n.markRemaining||0)-Math.min(.04,Math.max(0,dt)));
 if(!n.markRemaining){clearMark(n);return;}
 const e=(world(p).enemies||[]).find(e=>e.hp>0&&(e.finalArenaTarget?'arena:'+e.finalArenaBossId+':'+e.finalArenaFormToken:e.stageBossBody?'body:'+(e.encounterId||'')+':'+e.stageBossBody.id:'enemy:'+e.tailId)===n.markKey);
 if(e&&!e.stageBossBody&&!e.finalArenaTarget){n.markX=e.x;n.markY=e.y-radius(e);}
}
