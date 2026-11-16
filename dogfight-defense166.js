import {ordinaryFighter} from './dogfight-pass165.js?v=d7a0cfcfc455802b';
import {requestFormationCover,battleDamageWithdrawing} from './battle-damage.js?v=d7a0cfcfc455802b';
export const PURSUIT_MATCH_BALANCE=Object.freeze({closingThreshold:18,maxReductionMin:.10,maxReductionMax:.20,acquireReduction:.07,closeDistance:125,engageRate:4.8,recoverRate:2.2});
export const DEFENSE_OBSERVATION=Object.freeze({hunterInterval:.24,scoutInterval:.65,range:340,rearCone:.95,aimCone:.6,releaseCone:1.2,coverDelay:.7});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const TWO_SEAT_ARCHETYPES=new Set(['DEFENSIVE_TWO_SEATER','OFFENSIVE_TWO_SEATER']);

function eligibleDefender(game,e){
 const now=game.t||0;
 return !!((!game.online||game.host)&&ordinaryFighter(e)&&e.personality&&game.patrolCanEngage(e)&&(!e.formationLeader||e.directorFormation)&&!e.expired&&!battleDamageWithdrawing(e)&&!(e.directorLayout==='recovery'&&e.directorIntentUntil>now)&&!(e.directorBreakUntil>now)&&!(e.formationCollapseUntil>now)&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype));
}

const visible=p=>p?.hp>0&&(!p.status||p.status==='alive')&&!p.fogHidden&&!(p.kaiserFogTime>0)&&!(p.ballCloak>0)&&!(p.cloudConceal>0)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.a);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function tailPursuer(game,e){
 const now=game.t||0,B=DEFENSE_OBSERVATION,players=game.players?.length?game.players:null;
 // Death/concealment invalidates memory immediately; geometry is sampled, not read from player lock/input.
 if(e.defenseContact&&(!(players?players.includes(e.defenseContact):e.defenseContact===game)||!visible(e.defenseContact)||!game.patrolCanEngage(e,e.defenseContact)))e.defenseContact=null;
 if(now<(e.defenseObserveAt??-Infinity))return e.defenseContact||null;
 e.defenseObserveAt=now+(e.type==='hunter'?B.hunterInterval:B.scoutInterval);
 let chosen=null,best=Infinity;
 for(let i=0;i<(players?players.length:1);i++){
  const p=players?players[i]:game;
  if(!visible(p)||!game.patrolCanEngage(e,p))continue;
  const dx=p.x-e.x,dy=p.y-e.y,range=Math.hypot(dx,dy),bearing=Math.atan2(dy,dx),held=p===e.defenseContact;
  if(range<45||range>B.range||Math.abs(wrap(bearing-e.a-Math.PI))>(held?B.releaseCone:B.rearCone)||Math.abs(wrap(bearing+Math.PI-p.a))>B.aimCone)continue;
  const score=range*(held?.7:1);if(score<best){chosen=p;best=score;}
 }
 e.defenseContact=chosen;return chosen;
}

export function installDogfightDefense(Game,TAILING_BALANCE,AUGMENTATION_OVERHAUL_BALANCE,DOGFIGHT_PASS_STATES,angleDiff){
 if(Game.prototype.__dogfightDefense166)return;Game.prototype.__dogfightDefense166=true;
 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  const pursuer=eligibleDefender(this,e)?tailPursuer(this,e):null;
  if(pursuer){
   if(e.combatPassState&&e.combatPassState!==DOGFIGHT_PASS_STATES.APPROACH){
    e.combatPassState=DOGFIGHT_PASS_STATES.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=.4;
   }
   if(!e.defensivePressure){e.personalityDecisionUntil=0;e.defenseStartedAt=this.t||0;}
   e.defensivePressure=true;
   if((this.t||0)-e.defenseStartedAt>=DEFENSE_OBSERVATION.coverDelay)requestFormationCover(this,e,pursuer,this.t||0);
   return steer.call(this,e,pursuer,dt,baseTurn);
  }
  if(e){e.defensivePressure=false;e.defenseContact=null;}
  return steer.call(this,e,contact,dt,baseTurn);
 };

 const updateTailLock=Game.prototype.updateTailLock;
 Game.prototype.updateTailLock=function(dt){
  const result=updateTailLock.call(this,dt),step=Math.max(0,dt||0),current=this.pursuitSpeedFactor??1;
  let desired=1,closing=0;
  const world=this.combatWorld(),target=this.tailTargetId&&(this.tailLocked||this.tailProgress>0)?(world.enemies||[]).find(e=>e.hp>0&&e.tailId===this.tailTargetId):null;
  const scripted=this.chargeTime>0||this.evadeTime>0||this.aceRetreat129||(this.pilot==='baron'&&this.skillTime>0);
  if(target&&!scripted){
   const dx=target.x-this.x,dy=target.y-this.y,distance=Math.hypot(dx,dy),range=this.redScarf?AUGMENTATION_OVERHAUL_BALANCE.redScarfRange:1;
   const behind=Math.abs(angleDiff(Math.atan2(this.y-target.y,this.x-target.x),target.a+Math.PI));
   const aim=Math.abs(angleDiff(Math.atan2(dy,dx),this.a));
   if(distance>=(this.tailLocked?TAILING_BALANCE.maintainMinDistance:TAILING_BALANCE.minDistance)&&distance<=(this.tailLocked?TAILING_BALANCE.maintainMaxDistance:TAILING_BALANCE.maxDistance)*range&&behind<=(this.tailLocked?TAILING_BALANCE.maintainRearCone:TAILING_BALANCE.rearCone)&&aim<=(this.tailLocked?TAILING_BALANCE.maintainAimCone:TAILING_BALANCE.aimCone)){
    const rawSpeed=(this.baseSpeed??this.speed??0)*(this.healthSpeedFactor?.()??1)*(this.airframeSpeed??1),ux=dx/(distance||1),uy=dy/(distance||1);
    closing=(Math.cos(this.a)*rawSpeed-Math.cos(target.a)*(target.speed||0))*ux+(Math.sin(this.a)*rawSpeed-Math.sin(target.a)*(target.speed||0))*uy;
    if(closing>PURSUIT_MATCH_BALANCE.closingThreshold){
     const personality=this.currentAircraftPersonality||this.aircraftPersonality?.(),control=personality?.pursuitControl??1;
     const tierControl=this.aircraftTailPursuit?.().tailMatchStrength??1;
     const lockedReduction=clamp((.10+(control-.7)*.1)*tierControl,PURSUIT_MATCH_BALANCE.maxReductionMin,PURSUIT_MATCH_BALANCE.maxReductionMax);
     const closePressure=clamp((PURSUIT_MATCH_BALANCE.closeDistance-distance)/70,0,1);
     const maxReduction=this.tailLocked?Math.min(PURSUIT_MATCH_BALANCE.maxReductionMax,lockedReduction+closePressure*.05):Math.min(.085,PURSUIT_MATCH_BALANCE.acquireReduction*tierControl);
     desired=1-Math.min(maxReduction,(closing-PURSUIT_MATCH_BALANCE.closingThreshold)/180);
    }
   }
  }
  const rate=desired<current?PURSUIT_MATCH_BALANCE.engageRate:PURSUIT_MATCH_BALANCE.recoverRate;
  this.pursuitSpeedFactor=current+(desired-current)*(1-Math.exp(-rate*step));
  this.pursuitClosingSpeed=closing;
  return result;
 };
}
