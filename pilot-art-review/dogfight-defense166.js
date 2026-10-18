export const PURSUIT_MATCH_BALANCE=Object.freeze({closingThreshold:18,maxReductionMin:.10,maxReductionMax:.20,acquireReduction:.07,closeDistance:125,engageRate:4.8,recoverRate:2.2});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const TWO_SEAT_ARCHETYPES=new Set(['DEFENSIVE_TWO_SEATER','OFFENSIVE_TWO_SEATER']);

function eligibleDefender(game,e){
 return !!(e?.personality&&game.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.bossPilot&&!e.formationLeader&&!e.missionTarget&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype));
}

function tailPursuer(game,e){
 const players=game.players?.length?game.players:[game];
 return players.find(p=>p?.hp>0&&(!p.status||p.status==='alive')&&p.tailLocked&&p.tailTargetId&&p.tailTargetId===e.tailId)||null;
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
   if(!e.defensivePressure)e.personalityDecisionUntil=0;
   e.defensivePressure=true;
   return steer.call(this,e,pursuer,dt,baseTurn);
  }
  if(e)e.defensivePressure=false;
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
