import {FIRE_DIVE_PILOTS} from './fire-dive-fx.js?v=capital-final-20261030';
import {installEscortCommandFx,ESCORT_PILOTS} from './escort-command-fx.js?v=capital-final-20261030';
import {installCavalryRacerFx,CAVALRY_RACER_PILOTS} from './cavalry-racer-fx.js?v=capital-final-20261030';
import {installOrdnancePilotFx,ORDNANCE_PILOTS} from './ordnance-pilot-fx.js?v=capital-final-20261030';
import {installCommandFlightFx,COMMAND_PILOTS} from './command-flight-fx.js?v=capital-final-20261030';
// Install after the engine's final pilot layer. Existing working attacks stay intact.
import {PILOT_SIGNATURES,signatureState,advancePilotSignature,activatePilotSignature,signatureCue,pilotSignatureReaction,signatureInterval} from './pilot-signature-state.js';
const WRAPPED=Symbol.for('headon.pilot-signatures.v1');
const own=p=>p.id??'p1';
export function installPilotSignatures(Game){
 const proto=Game.prototype;if(proto[WRAPPED])return;Object.defineProperty(proto,WRAPPED,{value:true});
 const begin=proto.beginRevisionFrame;
 proto.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(!PILOT_SIGNATURES[this.pilot]||!(this.hp>0)||this.state!=='playing')return prior;
  const s=signatureState(this),lastHp=s.previous.hp,previousKills=s.lastKills??this.kills;
  if(Number.isFinite(lastHp)&&this.hp<lastHp)pilotSignatureReaction(this,'damage',{damage:lastHp-this.hp});
  advancePilotSignature(this,dt);
  if(this.pilot==='loewenhardt'&&this.aceSkillPhase!==s.lastPhase){
   if(this.aceSkillPhase==='vertical-fire')signatureCue(this,'climbSalvo',{life:.75,signatureStart:true});s.lastPhase=this.aceSkillPhase;
  }
  s.lastCannonTimer=this.passiveCannonTimer;
  if(this.pilot==='boelcke'&&this.skillTime>0&&signatureInterval(this,'wingPaths',.12))for(const w of this.combatWorld().allies||[])if(w.boelckePincer&&w.life>0&&(w.ownerId===this.id||w.ownerId===undefined&&!this.world))signatureCue(this,'wingSlipstream',{x:w.x,y:w.y,a:w.a,life:.55});
  s.lastKills=this.kills;
  return prior;
 };
 const skill=proto.skill;
 proto.skill=function(){const used=skill.call(this);if(used)activatePilotSignature(this);return used};
 const hit=proto.hit;
 proto.hit=function(damage){
  if(this.pilot==='nungesser'&&this.state==='playing'&&this.hp>0&&this.skillTime>0&&this.invuln>0&&damage>0&&signatureInterval(this,'deflect',.12)){
   const source=this.damageSource,dx=source?source.x-this.x:Math.cos(this.a)*22,dy=source?source.y-this.y:Math.sin(this.a)*22,d=Math.hypot(dx,dy)||1;
   signatureCue(this,'smokeTear',{x:this.x+dx/d*24,y:this.y+dy/d*24,a:Math.atan2(dy,dx),life:.38,active:true});
  }
  const before=this.barkerStackTime,accepted=this.pilot==='barker'&&damage>0&&this.invuln<=0&&this.hp>0&&this.state==='playing';const result=hit.call(this,damage);if(accepted&&this.barkerStackTime>=before)signatureCue(this,'battleDamage',{life:.85,count:this.barkerStacks||1});return result;
 };
 const round=proto.applySpecialRound;
 proto.applySpecialRound=function(b,type){
  const result=round.call(this,b,type);
  // Jacobs' real fan/convergence is emitted once by the nine-pilot combat hook.
  if(!FIRE_DIVE_PILOTS.has(this.pilot)&&!ESCORT_PILOTS.has(this.pilot)&&!CAVALRY_RACER_PILOTS.has(this.pilot)&&!ORDNANCE_PILOTS.has(this.pilot)&&!b.enemy&&!b.ally&&!b.formation&&!b.patrol&&!b.actualExplosion&&(b.ownerId===undefined||b.ownerId===own(this)))pilotSignatureReaction(this,'shot',{gun:b.gun||0});
  return result;
 };
 const impact=proto.specialRoundImpact;
 proto.specialRoundImpact=function(b,e){
  const result=impact.call(this,b,e);
  if(b.enemy||b.ally||b.patrol||(b.ownerId!==undefined&&b.ownerId!==own(this)))return result;
  if(!FIRE_DIVE_PILOTS.has(this.pilot)&&!ESCORT_PILOTS.has(this.pilot)&&!CAVALRY_RACER_PILOTS.has(this.pilot)&&!COMMAND_PILOTS.has(this.pilot)&&!ORDNANCE_PILOTS.has(this.pilot))pilotSignatureReaction(this,'hit',{target:e,position:b});
  return result;
 };
 installCommandFlightFx(Game);
 installOrdnancePilotFx(Game);
 installCavalryRacerFx(Game);
 installEscortCommandFx(Game);
}
