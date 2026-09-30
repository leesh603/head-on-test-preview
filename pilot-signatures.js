// Install after the engine's final pilot layer. Existing working attacks stay intact.
import {PILOT_SIGNATURES,signatureState,advancePilotSignature,activatePilotSignature,signatureCue,pilotSignatureReaction,signatureInterval} from './pilot-signature-state.js';
const WRAPPED=Symbol.for('headon.pilot-signatures.v1');
const own=p=>p.id??'p1';
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function installPilotSignatures(Game){
 const proto=Game.prototype;if(proto[WRAPPED])return;Object.defineProperty(proto,WRAPPED,{value:true});
 const begin=proto.beginRevisionFrame;
 proto.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(!PILOT_SIGNATURES[this.pilot]||!(this.hp>0)||this.state!=='playing')return prior;
  const s=signatureState(this),lastHp=s.previous.hp,previousKills=s.lastKills??this.kills;
  if(Number.isFinite(lastHp)&&this.hp<lastHp)pilotSignatureReaction(this,'damage',{damage:lastHp-this.hp});
  advancePilotSignature(this,dt);
  if(this.pilot==='baracca'&&this.prancingHorseFlash160>0&&signatureInterval(this,'horse',.5))signatureCue(this,'cavalryCharge',{life:.65,signatureStart:true});
  if(this.pilot==='loewenhardt'&&this.aceSkillPhase!==s.lastPhase){
   if(this.aceSkillPhase==='vertical-fire')signatureCue(this,'climbSalvo',{life:.75,signatureStart:true});s.lastPhase=this.aceSkillPhase;
  }
  if(this.pilot==='guynemer'&&this.passiveCannonTimer>(s.lastCannonTimer??this.passiveCannonTimer)+.5)signatureCue(this,'cannonShot',{life:.35,signatureStart:true});
  s.lastCannonTimer=this.passiveCannonTimer;
  if(this.pilot==='luke'&&this.skillTime>0&&this.kills>previousKills)signatureCue(this,'burnKill',{life:.55});
  s.lastKills=this.kills;
  return prior;
 };
 const skill=proto.skill;
 proto.skill=function(){const used=skill.call(this);if(used)activatePilotSignature(this);return used};
 const round=proto.applySpecialRound;
 proto.applySpecialRound=function(b,type){
  const result=round.call(this,b,type);
  if(!b.enemy&&!b.ally&&!b.formation&&!b.patrol&&!b.actualExplosion&&(b.ownerId===undefined||b.ownerId===own(this)))pilotSignatureReaction(this,'shot',{gun:b.gun||0});
  return result;
 };
 const impact=proto.specialRoundImpact;
 proto.specialRoundImpact=function(b,e){
  const result=impact.call(this,b,e);
  if(b.enemy||b.ally||b.patrol||(b.ownerId!==undefined&&b.ownerId!==own(this)))return result;
  pilotSignatureReaction(this,'hit',{target:e,position:b});
  if(this.pilot==='baracca'&&e&&Math.abs(angle(Math.atan2(e.y-this.y,e.x-this.x),this.a))<Math.PI/3&&Math.abs(angle(Math.atan2(this.y-e.y,this.x-e.x),e.a||0))<Math.PI/3&&signatureInterval(this,'horse',.6))signatureCue(this,'cavalryCharge',{life:.65,signatureStart:true});
  return result;
 };
}
