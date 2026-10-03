export const DOGFIGHT_PASS_STATES=Object.freeze({
 APPROACH:'APPROACH',ATTACK_PASS:'ATTACK_PASS',COMMIT:'COMMIT',DISENGAGE:'DISENGAGE',REPOSITION:'REPOSITION',REENGAGE:'REENGAGE'
});

export const DOGFIGHT_PASS_BALANCE=Object.freeze({
 attackPassDuration:.34,commitDuration:1.05,disengageDuration:1.05,repositionDuration:1.15,reengageDuration:.55,approachCooldown:.6
});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const TWO_SEAT_ARCHETYPES=new Set(['DEFENSIVE_TWO_SEATER','OFFENSIVE_TWO_SEATER']);

function eligible(game,e){
 return !!(e?.personality&&game.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.bossPilot&&!e.formationLeader&&!e.missionTarget&&!e.heavyBomber&&!e.surface&&!e.stationary&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype));
}

export function directorAircraftEligible(game,e){
 return !!(e?.hp>0&&game.mode!=='campaign'&&game.stageBoss?.stages?.phase!=='boss'&&game.patrolCanEngage(e,game)&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eliteKind&&!e.formationLeader&&!e.bossMinion&&!e.stageBossBody&&!e.battlefieldEventId&&(e.type==='bomber'||((e.type==='scout'||e.type==='hunter')&&e.personality&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype))));
}

function setState(e,state,duration=0){e.combatPassState=state;e.combatPassTimer=duration;}
function clearState(e){
 for(const key of ['combatPassState','combatPassTimer','combatPassHeading','combatPassWaypoint','combatPassSide','combatPassCooldown'])delete e[key];
}

export function installDogfightPass(Game,angleDiff){
 const spawn=Game.prototype.spawnEnemy;
 Game.prototype.spawnEnemy=function(type,...args){
  const e=spawn.call(this,type,...args);if(eligible(this,e)){setState(e,DOGFIGHT_PASS_STATES.APPROACH);e.combatPassCooldown=0}return e;
 };

 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  const directed=e?.directorIntentUntil>(this.t||0)&&!e.defensivePressure&&directorAircraftEligible(this,e);
  if(e?.directorIntentUntil&&!directed){e.directorIntentUntil=0;e.directorEscort=null;e.combatPassTimer=0}
  if(directed&&contact&&baseTurn>0&&(e.type==='bomber'||e.directorLayout==='recovery'))
   return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*(e.directorLayout==='recovery'?.8:.16)};
  if(!eligible(this,e)){if(e?.combatPassState)clearState(e);return steer.call(this,e,contact,dt,baseTurn)}
  if(!contact||baseTurn<=0)return steer.call(this,e,contact,dt,baseTurn);
  const p=e.personality,nowDt=Math.max(0,dt||0);
  e.combatPassState||=DOGFIGHT_PASS_STATES.APPROACH;
  e.combatPassTimer=Math.max(0,(e.combatPassTimer||0)-nowDt);
  e.combatPassCooldown=Math.max(0,(e.combatPassCooldown||0)-nowDt);
  const bearing=Math.atan2(contact.y-e.y,contact.x-e.x),distance=Math.hypot(contact.x-e.x,contact.y-e.y),delta=angleDiff(bearing,e.a);
  const base=()=>{
   e.attackPassTime=0;
   e.reengageCooldown=Math.max(e.reengageCooldown||0,Math.max(.25,nowDt*2));
   return steer.call(this,e,contact,dt,baseTurn);
  };

  if(e.combatPassState===DOGFIGHT_PASS_STATES.APPROACH){
   const result=base(),entryRange=clamp(p.preferredRange*1.15,180,360),entryCone=clamp(.78+(p.headOnBias-1)*.18,.62,.95);
   if(e.combatPassCooldown===0&&distance<=entryRange&&Math.abs(delta)<=entryCone){
    e.combatPassHeading=bearing;e.combatPassSide=Math.sign(delta)||1;
    setState(e,DOGFIGHT_PASS_STATES.ATTACK_PASS,DOGFIGHT_PASS_BALANCE.attackPassDuration);
   }
   return{...result,turn:result.turn*clamp(.9+(p.pursuitControl-1)*.25,.82,1.08)};
  }

  if(e.combatPassTimer===0){
   if(e.combatPassState===DOGFIGHT_PASS_STATES.ATTACK_PASS){
    const commit=clamp(DOGFIGHT_PASS_BALANCE.commitDuration+(p.headOnBias-1)*.2,.78,1.28);
    setState(e,DOGFIGHT_PASS_STATES.COMMIT,directed&&e.directorLayout==='headOn'?Math.max(commit,e.directorIntentUntil-(this.t||0)-DOGFIGHT_PASS_BALANCE.disengageDuration):commit);
   }
   else if(e.combatPassState===DOGFIGHT_PASS_STATES.COMMIT){
    e.combatPassHeading=e.a;
    setState(e,DOGFIGHT_PASS_STATES.DISENGAGE,clamp(DOGFIGHT_PASS_BALANCE.disengageDuration*p.extendBias,.72,1.45));
   }else if(e.combatPassState===DOGFIGHT_PASS_STATES.DISENGAGE){
    const anchor=Number.isFinite(contact.a)?contact.a:bearing+Math.PI,range=clamp(p.preferredRange*1.35,210,440),side=e.combatPassSide||1;
    e.combatPassWaypoint={x:contact.x+Math.cos(anchor+side*1.9)*range,y:contact.y+Math.sin(anchor+side*1.9)*range};
    setState(e,DOGFIGHT_PASS_STATES.REPOSITION,clamp(DOGFIGHT_PASS_BALANCE.repositionDuration/(p.reattackBias||1),.72,1.45));
   }else if(e.combatPassState===DOGFIGHT_PASS_STATES.REPOSITION)
    setState(e,DOGFIGHT_PASS_STATES.REENGAGE,DOGFIGHT_PASS_BALANCE.reengageDuration);
   else if(e.combatPassState===DOGFIGHT_PASS_STATES.REENGAGE){
    e.combatPassHeading=null;e.combatPassWaypoint=null;e.combatPassCooldown=clamp(DOGFIGHT_PASS_BALANCE.approachCooldown/(p.reattackBias||1),.35,.8);
    setState(e,DOGFIGHT_PASS_STATES.APPROACH);
   }
  }

  if(e.combatPassState===DOGFIGHT_PASS_STATES.ATTACK_PASS)
   return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.72};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.COMMIT)
   return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.16};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.DISENGAGE)
   return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.14};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.REPOSITION){
   const waypoint=e.combatPassWaypoint||contact;
   if(directed&&e.directorLayout==='chase'){
    const heading=Number.isFinite(contact.a)?contact.a:bearing,back=clamp(p.preferredRange*.55,90,150);
    waypoint.x=contact.x-Math.cos(heading)*back;waypoint.y=contact.y-Math.sin(heading)*back;
   }else if(directed&&e.directorLayout==='escort'){
    const bomber=e.directorEscort;
    if(!bomber||bomber.hp<=0){e.directorIntentUntil=0;e.directorEscort=null;e.combatPassTimer=0}
    else if(Math.hypot(contact.x-bomber.x,contact.y-bomber.y)<260){waypoint.x=contact.x;waypoint.y=contact.y}
    else{const offset=e.directorEscortOffset||0;waypoint.x=bomber.x+Math.cos(bomber.a)*120-Math.sin(bomber.a)*offset;waypoint.y=bomber.y+Math.sin(bomber.a)*120+Math.cos(bomber.a)*offset}
   }
   return{delta:angleDiff(Math.atan2(waypoint.y-e.y,waypoint.x-e.x),e.a),turn:baseTurn*clamp(.82+(p.highSpeedHandling-1)*.2,.68,1.05)};
  }
  if(e.combatPassState===DOGFIGHT_PASS_STATES.REENGAGE){const result=base();return{...result,turn:result.turn*clamp(p.reattackBias,.82,1.38)}}
  return base();
 };
}
