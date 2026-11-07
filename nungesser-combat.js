// Black Heart: accepted close contacts earn pressure. Paired shots use real ammo and collision.
import {signatureState,signatureCue,signatureInterval,activatePilotSignature,nungesserState} from './pilot-signature-state.js?v=09c75d146ae4289d';
import {finalArenaBosses} from './pandemonium-registry.js?v=09c75d146ae4289d';
import {combatImpactResult} from './combat-impact-result.js?v=09c75d146ae4289d';
import {isReplacementPrimary} from './pilot-primary.js?v=09c75d146ae4289d';
import {modGunDamage} from './weapon-modifications.js?v=09c75d146ae4289d';
import {bishopGlovesLifetime} from './equipment-flight-balance.js?v=09c75d146ae4289d';
export const NUNGESSER_BALANCE=Object.freeze({activeSeconds:5,rate:1.35,speed:1.25,turn:1.15,reload:1.35,followupDelay:.065,followupDamage:.75,passiveDamage:.3,engagementHits:3,contactStep:.08,gapSeconds:1.2,closeRange:260,boostSeconds:3,rearmSeconds:4,memorySeconds:8,contactCap:64,pendingCap:8,aimRange:780,aimPad:18});
const B=NUNGESSER_BALANCE,INSTALLED=Symbol.for('headon.nungesser-combat.v3'),runtime=new WeakMap();
const owner=p=>p.id??'p1',world=p=>p.combatWorld?.()||p.world||p;
const live=p=>p?.pilot==='nungesser'&&p.hp>0&&p.status!=='downed'&&p.state==='playing';
const canonical=(p,e)=>e?.finalArenaTarget?finalArenaBosses(world(p).finalArena).find(v=>v.id===e.finalArenaBossId&&v.formToken===e.finalArenaFormToken)||e:e?.stageBossBody||e;
const dead=e=>!e||e.dead||e.destroyed||e.defeated||e.hp<=0;
const available=(p,e)=>e&&!dead(canonical(p,e))&&e.hp>0&&!e.expired&&!e.rivalEscaped&&!e.crashed;
const personal=(p,b)=>isReplacementPrimary(p,b)||b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===owner(p))&&!['enemy','ally','formation','patrol','transferGun','rocket','cow37','motorCannon','mauserRound','blast','actualExplosion','identityDot','identityChain','nungesserCounter','tacticalRound','synthesisChild','synthesisSupport'].some(k=>b[k]);
export function nungesserTargetKey(p,e){const body=canonical(p,e);return body?(e.finalArenaTarget?'arena:'+e.finalArenaBossId+':'+e.finalArenaFormToken:e.stageBossBody?'body:'+(e.encounterId||'')+':'+body.id:'enemy:'+p.tailIdFor(body)):null;}
function state(p){const sig=signatureState(p),n=nungesserState(p);let r=runtime.get(p);if(!r||r.sig!==sig||r.n!==n||sig.clock<r.clock){r={sig,n,clock:sig.clock,contacts:new Map(),pending:[],queued:new Map(),boostTarget:null};runtime.set(p,r);}r.clock=sig.clock;return {n,r,clock:sig.clock};}
function reset(p){const {n,r}=state(p);r.contacts.clear();r.pending.length=0;r.queued.clear();r.boostTarget=null;Object.assign(n,{markKey:null,markRemaining:0,boostKey:null,boostUntil:0,pressureHits:0,pressureUntil:0,burstRemaining:0,wake:[]});}
function radius(e){return Math.max(12,e.hitRadius||e.radius||e.hullWidth||30);}
function points(p,e){
 const body=e.stageBossBody;if(!body)return [{x:e.x,y:e.y,r:radius(e)}];
 const out=[];for(const part of body.parts?.values?.()||[]){if(part.destroyed)continue;const raw=body.support129?.parts.get(part.id),pos=raw?body.support129.world(raw.nx,raw.ny):{x:body.x+(part.x||0),y:body.y+(part.y||0)};out.push({...pos,r:Math.max(8,part.radius||30)});}
 out.push({x:body.x,y:body.y,r:body.coreRadius||body.radius||30});return out;
}
// Compatibility helper for external reviews. The active no longer requires a mark.
export function nungesserAimedTarget(p){let best=null,score=Infinity;const ca=Math.cos(p.a),sa=Math.sin(p.a);for(const e of world(p).enemies||[]){if(!available(p,e))continue;for(const v of points(p,e)){const dx=v.x-p.x,dy=v.y-p.y,along=dx*ca+dy*sa,across=Math.abs(-dx*sa+dy*ca),r=v.r+B.aimPad;if(along<=0||along>B.aimRange||across>r)continue;const rank=Math.max(0,along-Math.sqrt(r*r-across*across));if(rank<score){score=rank;best=e;}}}return best;}
export function nungesserCombatStatus(p){const n=p?.pilotSignatureState?.nungesser,t=p?.pilotSignatureState?.clock||0,present=p?.pilot==='nungesser'&&p.hp>0&&p.status!=='downed'&&['playing','paused','upgrade'].includes(p.state),ready=present&&n?.boostUntil>t;return {ready,readyFraction:ready?Math.min(1,(n.boostUntil-t)/B.boostSeconds):0,active:present&&p.skillTime>0,entry:false,pressure:present&&n?.pressureUntil>t?Math.min(1,(n.pressureHits||0)/B.engagementHits):0};}
function muzzle(p,gun){const a=p.gunDirection(gun),offset=p.weapon.bidirectional?0:(gun-(p.weapon.guns-1)/2)*8;
 const pos=p.bomberTransfer?p.bomberGunMount(gun,a,offset):Number.isFinite(p.weapon.sortieMuzzleSide)?{x:p.x+Math.cos(p.a)*23-Math.sin(p.a)*p.weapon.sortieMuzzleSide,y:p.y+Math.sin(p.a)*23+Math.cos(p.a)*p.weapon.sortieMuzzleSide}:{x:p.x+Math.cos(a)*23-Math.sin(a)*offset,y:p.y+Math.sin(a)*23+Math.cos(a)*offset};return {...pos,a};}
function drain(p,r,clock,input){
 if(!(p.skillTime>0)||p.reloadTime>0||p.cow37||p.mission?.unarmed||p.heineckeEscape>0||p.isBomberEntering?.()||input.inputMode==='gamepad'&&!input.fireHeld){r.pending.length=0;return;}
 let kept=0;for(const v of r.pending){if(v.at>clock){r.pending[kept++]=v;continue;}const gun=v.gun;if(gun>=p.weapon.guns||!(p.ammo[gun]>0)&&!p.unlimitedAmmo)continue;
  const m=muzzle(p,gun),raw={x:m.x,y:m.y,vx:Math.cos(m.a)*520,vy:Math.sin(m.a)*520,life:bishopGlovesLifetime(p,p.longRange?p.shotLifetime(520):1.35),rangeExtended:!!p.upgrades?.flightGloves,enemy:false,ownerId:owner(p),gun,damage:p.damage*p.normalGunMultiplier()/Math.sqrt(Math.max(1,p.shots))*modGunDamage(p,1,1)*(p.skillEnhanced?.9:B.followupDamage),pierce:true,hit:new Set(),nungesserFollowup:true};
  const shot=p.applySpecialRound(raw,null)??raw;(world(p).bullets??=[]).push(shot);if(!p.unlimitedAmmo)p.ammo[gun]--;p.roundsFired++;p.muzzleFlash=.055;p.event?.('shot','');
 }r.pending.length=kept;if(p.ammo.every(v=>v<=0)&&!p.unlimitedAmmo)p.reload();
}
function wake(p,n,clock){n.wake??=[];n.wake=n.wake.filter(v=>clock-v.at<.48);if(p.skillTime>0&&signatureInterval(p,'nungesserWake',.045)){n.wake.push({x:p.x,y:p.y,a:p.a,at:clock});if(n.wake.length>12)n.wake.shift();}}
export function installNungesserCombat(Game){
 const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const duration=q.skillDuration;q.skillDuration=function(){return this.pilot==='nungesser'?(this.skillEnhanced?6:B.activeSeconds):duration.call(this);};
 const skill=q.skill;q.skill=function(){if(this.pilot!=='nungesser')return skill.call(this);if(!live(this)||this.cooldown>0||this.mission?.unarmed||this.heineckeEscape>0)return false;this.ensureRevisionPilot?.();this.skillTime=this.skillDuration();this.cooldown=this.skillCooldown();const {n,r}=state(this);n.markKey=null;n.markRemaining=0;n.burstRemaining=this.skillTime;r.pending.length=0;r.queued.clear();this.fire=Math.min(this.fire,0);activatePilotSignature(this);this.event?.('skill','죽음의 기사');return true;};
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){const prior=begin.call(this,dt,input);if(this.pilot!=='nungesser')return prior;if(!live(this)){reset(this);return prior;}const {n,r,clock}=state(this);
  for(const [key,v]of r.contacts)if(clock-v.last>B.memorySeconds)r.contacts.delete(key);
  if(n.boostKey&&(n.boostUntil<=clock||!(world(this).enemies||[]).some(e=>available(this,e)&&nungesserTargetKey(this,e)===n.boostKey))){n.boostKey=null;n.boostUntil=0;r.boostTarget=null;}
  n.burstRemaining=Math.max(0,this.skillTime);n.replicaAge=0;wake(this,n,clock);drain(this,r,clock,input);
  if(this.skillTime>0){this.rate/=B.rate;this.speed*=B.speed;this.baseSpeed*=B.speed;this.turn*=B.turn;if(this.reloadTime>0)this.reloadTime=Math.max(.000001,this.reloadTime-Math.min(.04,Math.max(0,dt))*(B.reload-1));}
  const status=nungesserCombatStatus(this);this.passiveStrength=Math.max(status.readyFraction,status.pressure);return prior;
 };
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){const result=apply.call(this,b,...args),shot=result??b;if(!live(this)||!personal(this,shot)||this.mission?.unarmed)return result;const {n,r,clock}=state(this);shot.ownerId=owner(this);
  if(this.skillTime>0&&!isReplacementPrimary(this,shot)){shot.pierce=true;shot.nungesserBreakthrough=true;if(!shot.nungesserFollowup&&!this.cow37&&this.reloadTime<=0&&r.queued.get(shot.gun)!==clock){r.queued.set(shot.gun,clock);if(r.pending.length<B.pendingCap)r.pending.push({gun:shot.gun,at:clock+B.followupDelay});}}
  if(n.boostUntil>clock){shot.nungesserReattackKey=n.boostKey;shot.nungesserReattackBonus=B.passiveDamage;}
  return result;
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){const base=damage.call(this,b,e);if(!live(this)||!personal(this,b))return base;return base*(1+(b.nungesserReattackKey===nungesserTargetKey(this,e)?b.nungesserReattackBonus||0:0));};
 const primary=q.preparePilotPrimaryRound;
 if(primary)q.preparePilotPrimaryRound=function(b,volley){
  const shot=primary.call(this,b,volley);
  if(live(this)&&!this.mission?.unarmed&&isReplacementPrimary(this,shot)){
   const {n,clock}=state(this);
   if(n.boostUntil>clock){shot.nungesserReattackKey=n.boostKey;shot.nungesserReattackBonus=B.passiveDamage;}
  }
  return shot;
 };
 const impact=q.specialRoundImpact;q.specialRoundImpact=function(b,e,...args){const result=impact.call(this,b,e,...args),hit=combatImpactResult(b,e);if(!live(this)||this.mission?.unarmed||!personal(this,b)||!(hit?.damage>0)||hit.blocked)return result;const {n,r,clock}=state(this),key=nungesserTargetKey(this,e);
  const pos=e.stageBossBody&&Number.isFinite(b.x)&&Number.isFinite(b.y)?b:e,close=Math.hypot(this.x-pos.x,this.y-pos.y)<=B.closeRange;
  if((this.skillTime>0||n.boostUntil>clock&&n.boostKey===key)&&signatureInterval(this,'nungesserImpact',.09))signatureCue(this,'nungesserImpact',{x:pos.x,y:pos.y,a:Math.atan2(b.vy,b.vx),life:.32,followup:!!b.nungesserFollowup});
  if(!close||!available(this,e))return result;
  let v=r.contacts.get(key);if(!v||clock-v.last>B.gapSeconds){v={last:clock,counted:-Infinity,hits:0,rearmAt:v?.rearmAt||0};r.contacts.set(key,v);}
  if(b.pilotPrimaryVolley&&v.volley===b.pilotPrimaryVolley)return result;
  v.volley=b.pilotPrimaryVolley;
  v.last=clock;if(clock-v.counted<B.contactStep-1e-6)return result;v.counted=clock;v.hits=Math.min(B.engagementHits,v.hits+1);n.pressureHits=v.hits;n.pressureUntil=clock+B.gapSeconds;
  if(v.hits>=B.engagementHits&&clock>=v.rearmAt){v.hits=0;v.rearmAt=clock+B.rearmSeconds;n.boostKey=key;n.boostUntil=clock+B.boostSeconds;n.procSerial=(n.procSerial||0)+1;r.boostTarget=canonical(this,e);signatureCue(this,'nungesserPressure',{x:pos.x,y:pos.y,a:this.a,life:.45});}
  while(r.contacts.size>B.contactCap)r.contacts.delete(r.contacts.keys().next().value);
  return result;
 };
 q.resetNungesserCombat=function(){runtime.delete(this);if(this.pilotSignatureState?.nungesser)delete this.pilotSignatureState.nungesser;};
}
// Presentation only. Host queues, damage, target choice and ammunition never run here.
export function advanceNungesserReplica(p,dt){
 if(p?.pilot!=='nungesser')return;const n=p.pilotSignatureState?.nungesser;if(!n)return;if(p.hp<=0||p.status==='downed'){n.markKey=null;n.burstRemaining=0;n.wake=[];return;}
 const step=Math.min(.04,Math.max(0,dt));n.replicaAge=(n.replicaAge||0)+step;n.burstRemaining=Math.max(0,(n.burstRemaining||0)-step);n.markKey=null;n.markRemaining=0;
}
