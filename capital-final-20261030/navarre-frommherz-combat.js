import {pilotUnlockDirectHit} from './pilot-unlocks.js?v=capital-final-20261030';
// Host-authoritative direct-hit mechanics. No new damage or reward pipeline.
import {combatImpactResult} from './combat-impact-result.js';

export const NAVARRE_FROMMHERZ_BALANCE=Object.freeze({zoneSeconds:6,zoneRadius:250,slowSeconds:2.2,slowMultiplier:.65,aceSlowMultiplier:.85,outnumberRadius:420,suppressionSeconds:5,suppressionRate:1.4,landingHpFraction:.2,instructorRadius:400,instructorTargetSeconds:2,instructorLeadSeconds:.4,instructorFocus:.65});
const states=new WeakMap(),rounds=new WeakMap(),slows=new WeakMap();
const live=p=>p?.state==='playing'&&p.hp>0&&p.status!=='downed';
const world=p=>p.combatWorld?.()||p.world||p;
const now=p=>Number.isFinite(world(p).t)?world(p).t:0;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const selected=p=>p.pilot==='navarre'||p.pilot==='frommherz';
const aircraft=e=>e&&!['stageBossBody','surface','stationary','fieldUnit','navalVessel','missionGround','bugDrone','groundEscort','londonInstallation','cityUnit','expired'].some(k=>e[k])&&['scout','hunter','bomber','boss','zeppelin'].includes(e.type);
const ordinary=e=>aircraft(e)&&!['bossPilot','bossPlane','ace','elite','heavyBomber','bossMinion','missionTarget'].some(k=>e[k])&&['scout','hunter','bomber'].includes(e.type);
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===(p.id??'p1')||(b.ownerId===undefined&&!world(p).players))&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','identityDot','identityChain','transferGun','tacticalRound','nungesserCounter'].some(k=>b[k]);
function state(p){let s=states.get(p);const t=now(p);if(!s||s.pilot!==p.pilot||t<s.time){s={pilot:p.pilot,time:t,zone:null,suppressUntil:0,target:null,targetUntil:0};states.set(p,s);}s.time=t;return s;}
function active(p,s){return live(p)&&states.get(p)===s&&s.pilot===p.pilot;}
export function navarreFrommherzState(p){if(!selected(p)||!live(p))return null;const s=state(p),t=now(p);return {zone:s.zone&&s.zone.until>t?{...s.zone}:null,suppressing:s.suppressUntil>t,focusedTarget:s.targetUntil>t&&s.target?.hp>0?s.target:null};}
export function navarreEnemySpeedMultiplier(w,e){const entries=slows.get(e);if(!entries||!(e.hp>0))return 1;let factor=1;for(const [p,hit] of entries){if(world(p)!==w)continue;if(p.hp<=0||p.status==='downed'||p.pilot!==hit.state.pilot||states.get(p)!==hit.state||now(p)<hit.state.time||now(p)>=hit.until){entries.delete(p);continue;}factor=Math.min(factor,hit.factor);}return factor;}
export function navarreOutnumbered(p){if(p.pilot!=='navarre'||!live(p))return false;const w=world(p),r=NAVARRE_FROMMHERZ_BALANCE.outnumberRadius;const nearby=x=>distance(p,x)<=r;let friendly=(w.players||[p]).filter(x=>live(x)&&nearby(x)).length;friendly+=(w.allies||[]).filter(x=>x.life>0&&(x.hp==null||x.hp>0)&&nearby(x)).length;friendly+=(w.patrols||[]).filter(x=>x.hp>0&&nearby(x)).length;friendly+=(w.friendlyBombers||[]).filter(x=>x.hp>0&&nearby(x)).length;return (w.enemies||[]).filter(x=>x.hp>0&&aircraft(x)&&nearby(x)).length>friendly;}

export function installNavarreFrommherzCombat(Game,PILOTS){
 const q=Game.prototype,B=NAVARRE_FROMMHERZ_BALANCE;
 const duration=q.skillDuration;q.skillDuration=function(){return selected(this)?(this.pilot==='navarre'?B.zoneSeconds:B.suppressionSeconds)*(this.skillEnhanced?1.25:1):duration.call(this);};
 const skill=q.skill;q.skill=function(){
  if(!selected(this))return skill.call(this);
  if(!live(this)||this.cooldown>0||this.mission?.unarmed||this.heineckeEscape>0)return false;
  this.ensureRevisionPilot?.();const s=state(this),seconds=this.skillDuration();
  if(this.pilot==='navarre')s.zone={x:this.x,y:this.y,until:now(this)+seconds,radius:B.zoneRadius};else s.suppressUntil=now(this)+seconds;
  this.skillTime=seconds;this.cooldown=this.skillCooldown();this.event?.('skill',PILOTS[this.pilot].skill);return true;
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(selected(this)){if(!live(this)){if(this.hp<=0||this.status==='downed')states.delete(this);return prior;}const s=state(this);if(this.pilot==='frommherz'&&s.suppressUntil>now(this))this.rate/=B.suppressionRate;}
  return prior;
 };
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,type){
  const result=apply.call(this,b,type),round=result||b;
  if(!selected(this)||!live(this)||!personal(this,round))return result;
  const s=state(this),boost=this.pilot==='navarre'&&navarreOutnumbered(this)&&!round.pierce;
  rounds.set(round,{owner:this,state:s,extra:boost?1:0,contacts:new WeakSet(),suppression:this.pilot==='frommherz'&&s.suppressUntil>now(this)});
  if(boost)round.pierce=true;
  return result;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,...args){
  const result=impact?.call(this,b,e,...args);pilotUnlockDirectHit(this,b,e);
  if(!selected(this)||!live(this)||!personal(this,b)||!(combatImpactResult(b,e)?.damage>0)||!aircraft(e))return result;
  const s=state(this);if(this.pilot==='frommherz'){s.target=e;s.targetUntil=now(this)+B.instructorTargetSeconds;}
  if(this.pilot==='navarre'&&s.zone?.until>now(this)&&distance(s.zone,e)<=s.zone.radius){
   let entries=slows.get(e);if(!entries){entries=new Map();slows.set(e,entries);}entries.set(this,{state:s,until:now(this)+B.slowSeconds,factor:e.bossPilot||e.type==='boss'||e.heavyBomber||e.type==='zeppelin'?B.aceSlowMultiplier:B.slowMultiplier});
   this.identityFx?.('armorSpark',e.x,e.y,e.a||0,15,.18);
  }return result;
 };
 const special=q.specialRoundImpact;q.specialRoundImpact=function(b,e){
  const result=special?.call(this,b,e),shot=rounds.get(b);
  if(!shot||shot.owner!==this||!personal(this,b)||shot.contacts.has(e))return result;
  shot.contacts.add(e);
  // The host has already added this target to b.hit. One continuation only;
  // rounds that were already piercing are never downgraded by this passive.
  if(shot.extra>0){shot.extra--;shot.pendingStop=true;}else if(shot.pendingStop){b.pierce=false;shot.pendingStop=false;}
  if(active(this,shot.state)&&shot.suppression&&shot.state.suppressUntil>now(this)&&ordinary(e)&&e.hp>0&&Number.isFinite(e.maxHp)&&e.maxHp>0&&e.hp<=e.maxHp*B.landingHpFraction&&combatImpactResult(b,e)?.damage>0){
   e.hp=0;e.crashStyle='glide';e.fire=Infinity;e.burstLeft=0;e.frommherzForcedLanding=true;
   // The immediately following solo death block / co-op handleDeath owns all
   // score, loot, achievements and crash animation. Never issue rewards here.
  }return result;
 };
 const aim=q.tacticalWingAim;q.tacticalWingAim=function(wing,target){
  const base=aim?.call(this,wing,target)||target;
  if(this.pilot!=='frommherz'||!live(this)||!target||!(target.hp>0)||wing.life<=0)return base;
  const w=world(this),s=state(this),owned=(w.allies||[]).includes(wing)&&(w.players?wing.ownerId===this.id:wing.ownerId===undefined||wing.ownerId===this.id);
  if(!owned||s.target!==target||s.targetUntil<=now(this)||distance(this,wing)>B.instructorRadius||distance(wing,target)>650||wing.weaponModFormation)return base;
  const lead=Math.min(B.instructorLeadSeconds,distance(wing,target)/470),speed=(target.speed||0)*(target.energySpeed??1)*navarreEnemySpeedMultiplier(w,target),vx=Number.isFinite(target.vx)?target.vx:Math.cos(target.a||0)*speed,vy=Number.isFinite(target.vy)?target.vy:Math.sin(target.a||0)*speed;
  return {...base,x:base.x+vx*lead*B.instructorFocus,y:base.y+vy*lead*B.instructorFocus};
 };
 q.resetNavarreFrommherzCombat=function(){states.delete(this);};
}
