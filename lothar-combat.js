import {activatePilotSignature,signatureCue} from './pilot-signature-state.js';
import {tickLotharFlightFx,lotharGunFx} from './lothar-pursuit-fx.js';
// Lothar's immediate transfer from a falling opponent to the next aircraft
// inspires this arcade pursuit loop; ammunition recovery is a game abstraction.
export const LOTHAR_BALANCE=Object.freeze({duration:5,enhancedDuration:6.5,switchWindow:2.5,ammoFraction:.1,turnDuration:1.5,turnMultiplier:1.4,fireRate:1.5,speedMultiplier:1.15,extension:1,extensionCap:3});
const world=p=>p.combatWorld?.()||p;
const clock=p=>world(p).t||0;
const playing=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const aerial=e=>e&&!e.surface&&!e.navalVessel&&!e.fieldUnit&&!e.stationary&&!e.stageBossBody&&!e.crashed&&!e.dying&&!e.expired&&!e.rivalEscaped&&e.type!=='zeppelin';
const personalGun=(p,b,emitting=false)=>b&&Number.isInteger(b.gun)&&(b.ownerId??(emitting?(p.id||'p1'):'p1'))===(p.id||'p1')&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','fonckSeeker','identityDot','identityChain','burn'].some(k=>b[k]);
const state=p=>p.lotharPursuit??={source:null,switchUntil:0,turnUntil:0,extended:0,killed:new WeakSet()};

export function installLothar(Game){
 const q=Game.prototype;
 q.resetLotharPursuit=function(){if(this.pilot==='lothar'){this.lotharPursuit=null;this.aceSkillPhase=null;delete this.lotharFlightFx;delete this.pilotSignatureState;}};
 const duration=q.skillDuration;
 q.skillDuration=function(){return this.pilot==='lothar'?(this.skillEnhanced?LOTHAR_BALANCE.enhancedDuration:LOTHAR_BALANCE.duration):duration.call(this)};
 const skill=q.skill;
 q.skill=function(){
  if(this.pilot!=='lothar')return skill.call(this);
  this.ensureRevisionPilot();
  if(!playing(this)||this.cooldown>0||this.skillTime>0||this.reloadTime>0||!this.ammo.some(n=>n>0))return false;
  state(this).extended=0;this.skillTime=this.skillDuration();this.cooldown=this.skillCooldown();
  activatePilotSignature(this);this.event('skill','한 놈 더');return true;
 };
 const impact=q.identityImpact;
 q.identityImpact=function(b,e,target=e,position=e){
  const result=impact.call(this,b,e,target,position);
  if(this.pilot!=='lothar'||!playing(this)||!personalGun(this,b)||!aerial(e)||target!==e)return result;
  const s=state(this),now=clock(this);
  // Spend an earned transfer once, before arming a new one if this hit kills.
  if(s.source&&s.source!==e&&now<s.switchUntil&&!s.killed.has(e)){
   s.source=null;s.switchUntil=0;s.turnUntil=now+LOTHAR_BALANCE.turnDuration;
   // Never bypass an underway reload or overfill an upgraded belt.
   if(!(this.reloadTime>0))for(let i=0;i<this.ammo.length;i++)this.ammo[i]=Math.min(this.weapon.belt,this.ammo[i]+Math.ceil(this.weapon.belt*LOTHAR_BALANCE.ammoFraction));
   if(this.skillTime>0&&s.extended<LOTHAR_BALANCE.extensionCap){const extra=Math.min(LOTHAR_BALANCE.extension,LOTHAR_BALANCE.extensionCap-s.extended);this.skillTime+=extra;s.extended+=extra;}
   signatureCue(this,'lotharTransfer',{life:.55,signatureStart:true});
   signatureCue(this,'lotharLinkHit',{x:position.x,y:position.y,a:Math.atan2(b.vy||0,b.vx||0),life:.28});
   this.event('wave','재교전');
  }
  if(e.hp<=0&&!s.killed.has(e)){s.killed.add(e);s.source=e;s.switchUntil=now+LOTHAR_BALANCE.switchWindow;signatureCue(this,'lotharKill',{x:position.x,y:position.y,a:e.a||0,life:.38});}
  return result;
 };
 const round=q.applySpecialRound;
 q.applySpecialRound=function(b,type){const result=round.call(this,b,type);if(this.pilot==='lothar'&&playing(this)&&personalGun(this,b,true))lotharGunFx(this,b);return result;};
 const begin=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(this.pilot!=='lothar')return prior;
  if(!playing(this)){this.resetLotharPursuit();return prior;}
  const s=state(this),now=clock(this);
  if(now>=s.switchUntil){s.source=null;s.switchUntil=0;}
  if(now<s.turnUntil)this.turn*=LOTHAR_BALANCE.turnMultiplier;
  if(this.skillTime>0){this.rate/=LOTHAR_BALANCE.fireRate;this.baseSpeed*=LOTHAR_BALANCE.speedMultiplier;this.speed*=LOTHAR_BALANCE.speedMultiplier;this.aceSkillPhase='pursuit';}
  else this.aceSkillPhase=null;
  tickLotharFlightFx(this,dt);
  return prior;
 };
}
