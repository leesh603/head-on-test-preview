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
  if(this.pilot==='loewenhardt'&&this.aceSkillPhase!==s.lastPhase){
   if(this.aceSkillPhase==='vertical-fire')signatureCue(this,'climbSalvo',{life:.75,signatureStart:true});s.lastPhase=this.aceSkillPhase;
  }
  if(this.pilot==='guynemer'&&this.passiveCannonTimer>(s.lastCannonTimer??this.passiveCannonTimer)+.5)signatureCue(this,'cannonShot',{life:.35,signatureStart:true});
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
   signatureCue(this,'phoenixDeflect',{x:this.x+dx/d*24,y:this.y+dy/d*24,life:.3});
  }
  const before=this.barkerStackTime,accepted=this.pilot==='barker'&&damage>0&&this.invuln<=0&&this.hp>0&&this.state==='playing';const result=hit.call(this,damage);if(accepted&&this.barkerStackTime>=before)signatureCue(this,'battleDamage',{life:.85,count:this.barkerStacks||1});return result;
 };
 const round=proto.applySpecialRound;
 proto.applySpecialRound=function(b,type){
  const result=round.call(this,b,type);
  if(this.pilot==='jacobs'&&this.skillTime>0&&Math.abs(signatureState(this).turnRate||0)>.35&&!b.enemy&&!b.ally&&!b.formation&&!b.patrol&&!b.actualExplosion&&!b.rocket&&!b.motorCannon&&!b.cow37&&b.gun!==undefined){const heading=Math.atan2(b.vy,b.vx),speed=Math.hypot(b.vx,b.vy);for(const side of [-1,1]){const a=heading+side*.24;this.bullets.push({...b,ownerId:this.id,enemy:false,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:Math.min(b.life,.55),damage:b.damage*.2,hit:new Set(),jacobsSuppress:true})}b.damage*=.6;}
  if(!b.enemy&&!b.ally&&!b.formation&&!b.patrol&&!b.actualExplosion&&(b.ownerId===undefined||b.ownerId===own(this)))pilotSignatureReaction(this,'shot',{gun:b.gun||0});
  return result;
 };
 const impact=proto.specialRoundImpact;
 proto.specialRoundImpact=function(b,e){
  const result=impact.call(this,b,e);
  if(b.enemy||b.ally||b.patrol||(b.ownerId!==undefined&&b.ownerId!==own(this)))return result;
  if(this.pilot==='luke'&&this.skillTime>0&&e&&signatureInterval(this,'ignition',.12))signatureCue(this,'incendiaryImpact',{x:b.x,y:b.y,life:1.4,target:e});
  else if(this.pilot!=='baracca')pilotSignatureReaction(this,'hit',{target:e,position:b});
  if(this.pilot==='baracca'&&e&&!b.formation&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.actualExplosion&&!b.blast&&!b.mauserRound&&Math.abs(angle(Math.atan2(e.y-this.y,e.x-this.x),this.a))<Math.PI/3&&Math.abs(angle(Math.atan2(this.y-e.y,this.x-e.x),e.a||0))<Math.PI/3&&signatureInterval(this,'cavalryGuard',.12))signatureCue(this,'cavalryGuard',{life:.42,signatureStart:true});
  return result;
 };
}

