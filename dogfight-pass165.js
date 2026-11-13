export const DOGFIGHT_PASS_STATES=Object.freeze({
 APPROACH:'APPROACH',ATTACK_PASS:'ATTACK_PASS',COMMIT:'COMMIT',DISENGAGE:'DISENGAGE',REPOSITION:'REPOSITION',REENGAGE:'REENGAGE'
});

export const DOGFIGHT_PASS_BALANCE=Object.freeze({
 attackPassDuration:.34,commitDuration:1.05,disengageDuration:1.05,repositionDuration:1.15,reengageDuration:.55,approachCooldown:.6,
 breakRange:210,breakMiss:44,breakAngle:1.1,breakTurn:1
});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
// 20261110 aggression pass: tempo and geometry only — no health, damage or gun-accuracy change.
// Ordinary fighters used to aim for ~1 s of a ~4.7 s cycle and all came down the same line.
// Now a flight splits (one pins from the front, the rest work round to the beam), skilled
// pilots (hunters) keep the nose tracking through the pass and come back onto the tail
// instead of extending away, while novices (scouts) keep the simple straight pass.
export const FIGHTER_AGGRESSION=Object.freeze({
 flankAngle:1.75,flankRange:230,flankDoneAngle:1.3,flankDoneRange:300,flankReach:80,flankTimeout:3.2,roleRange:700,
 commitTrackTurn:.4,commitTrackCone:.6,commitTrackMinRange:120,
 peelRange:340,skilledCone:.1,strafeRounds:8,strafeRoundsShort:6,strafeInterval:.12,tailCone:-.5,tailCadence:.55,tailBurst:5,
 tailDisengage:.6,tailBack:115,tailSide:70,tailReposition:1.25
});
const skilled=e=>e.type==='hunter';
function assignAttackRole(game,e,contact){
 let direct=0,left=0,right=0;
 for(const o of (game.combatWorld?.()||game).enemies||[]){
  if(o===e||!o.attackRole||!(o.hp>0)||Math.hypot(o.x-contact.x,o.y-contact.y)>FIGHTER_AGGRESSION.roleRange)continue;
  if(o.attackRole==='direct')direct++;else if(o.attackSide<0)left++;else right++;
 }
 // Someone always pins from the front; novices pile in sooner than veterans do.
 if(direct<(skilled(e)?1:2)){e.attackRole='direct';e.attackSide=0;return;}
 e.attackRole='flank';e.attackSide=left<=right?-1:1;e.attackFlankDone=false;e.attackFlankAt=game.t||0;
}
// Heading for a flanker still working round to the beam, or null once it should turn in.
function flankApproach(game,e,contact,distance){
 if(!Number.isFinite(contact.a)||!(contact===game||game.players?.includes?.(contact)))return null;
 // Covering a crippled comrade: no working round to the beam, straight at the pursuer.
 if(e.battleCoverUntil>(game.t||0)){e.attackRole='direct';e.attackSide=0;return null;}
 if(!e.attackRole)assignAttackRole(game,e,contact);
 if(e.attackRole!=='flank'||e.attackFlankDone)return null;
 const A=FIGHTER_AGGRESSION,off=Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-contact.y,e.x-contact.x)-contact.a),Math.cos(Math.atan2(e.y-contact.y,e.x-contact.x)-contact.a)));
 const a=contact.a+e.attackSide*A.flankAngle,x=contact.x+Math.cos(a)*A.flankRange,y=contact.y+Math.sin(a)*A.flankRange;
 if(off>A.flankDoneAngle&&distance<A.flankDoneRange||Math.hypot(x-e.x,y-e.y)<A.flankReach||(game.t||0)-e.attackFlankAt>A.flankTimeout){e.attackFlankDone=true;return null;}
 return Math.atan2(y-e.y,x-e.x);
}
const TWO_SEAT_ARCHETYPES=new Set(['DEFENSIVE_TWO_SEATER','OFFENSIVE_TWO_SEATER']);

function eligible(game,e){
 return !!(e?.personality&&game.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.bossPilot&&(!e.formationLeader||e.directorFormation)&&!e.missionTarget&&!e.heavyBomber&&!e.surface&&!e.stationary&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype));
}

export function directorAircraftEligible(game,e){
 return !!(e?.hp>0&&game.mode!=='campaign'&&game.stageBoss?.stages?.phase!=='boss'&&game.patrolCanEngage(e,game)&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eliteKind&&!e.missionTarget&&!e.heavyBomber&&(!e.formationLeader||e.directorFormation)&&!e.bossMinion&&!e.stageBossBody&&!e.battlefieldEventId&&(e.type==='bomber'||((e.type==='scout'||e.type==='hunter')&&e.personality&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype))));
}

// Ordinary fighters share this solution in solo, co-op and Director steering.
// The nose must fly onto the solution; rounds never rotate toward the contact.
function ordinaryFighterBody(e){
 return !!(e?.hp>0&&['scout','hunter'].includes(e.type)&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eventAce&&!e.eliteKind&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.bossMinion&&!e.stageBossBody&&!e.missionTarget&&!e.battlefieldEventId&&!e.crashing&&!TWO_SEAT_ARCHETYPES.has(e.personality?.archetype));
}
export function ordinaryFighter(e){return ordinaryFighterBody(e)&&(!e.formationLeader||e.directorFormation||ordinaryFighterBody(e.formationLeader));}
const fighterPressure=game=>clamp(((game.t||0)-90)/270,0,1);
export const fighterRoundSpeed=game=>370+30*fighterPressure(game);
// Fly toward a moving station with bounded longitudinal speed correction.
// No position interpolation: velocity continues to follow the aircraft nose.
export function formationStationSteering(e,leader,slot,dt,baseTurn,angleDiff){
 const ca=Math.cos(leader.a),sa=Math.sin(leader.a),lead=(leader.speed||e.speed)*.3;
 const x=leader.x+ca*(lead-slot.back)-sa*slot.lateral,y=leader.y+sa*(lead-slot.back)+ca*slot.lateral;
 const dx=x-e.x,dy=y-e.y,gap=Math.hypot(dx,dy),cruise=e.personalityCruise||e.dogfightCruise||e.speed;
 const along=dx*ca+dy*sa-lead,target=clamp((leader.speed||cruise)+along*.6,cruise*.78,Math.min(cruise*1.24,e.cruiseSpeedCap||Infinity));
 e.speed+=(target-e.speed)*Math.min(1,Math.max(0,dt)*2.4);
 return{delta:angleDiff(gap>60?Math.atan2(dy,dx):leader.a,e.a),turn:baseTurn};
}
export function fighterAim(game,e,contact,speed=fighterRoundSpeed(game),maxLead=.7+.2*fighterPressure(game)){
 const dx=contact.x-e.x,dy=contact.y-e.y;
 const travel=clamp((contact.flightSpeed??contact.speed??contact.baseSpeed??0)*(contact.airframeSpeed??1)*(contact.pursuitSpeedFactor??1),0,360);
 const vx=Math.cos(contact.a||0)*travel,vy=Math.sin(contact.a||0)*travel;
 const aa=vx*vx+vy*vy-speed*speed,bb=2*(dx*vx+dy*vy),cc=dx*dx+dy*dy,disc=bb*bb-4*aa*cc;
 let lead=0;if(disc>=0&&aa<-.001)lead=(-bb-Math.sqrt(disc))/(2*aa);
 lead=clamp(lead,0,maxLead);
 return Math.atan2(dy+vy*lead,dx+vx*lead);
}
export function fighterShotReady(game,e,contact){
 if(!contact||contact.fogHidden||contact.kaiserFogTime>0||contact.ballCloak>0||game.sunStrikeContains?.(e))return false;
 const now=game.t||0;
 if(e.directorFireHoldUntil>now||e.formationCollapseUntil>now||e.directorBreakUntil>now||e.combatPassState===DOGFIGHT_PASS_STATES.DISENGAGE)return false;
 const zoom=game.camera?.zoom||1,cx=game.camera?.x??game.x,cy=game.camera?.y??game.y;
 const escortCombat=e.arrasInterceptor&&game.mapMission?.region===9&&game.mapMission.status==='active'&&e.mapMissionId===game.mapMission.id&&contact===e.operationEscortTarget&&contact.hp>0&&(game.patrols||[]).includes(contact);
 if(!escortCombat&&!(e.doverInterceptor&&contact.doverBomber)&&(Math.abs(e.x-cx)>(game.viewWidth||960)/(2*zoom)+12||Math.abs(e.y-cy)>(game.viewHeight||720)/(2*zoom)+12))return false;
 const distance=Math.hypot(contact.x-e.x,contact.y-e.y),range=clamp((e.personality?.preferredRange||210)*1.35+100,310,470);
 if(distance<55||distance>range)return false;
 const error=fighterAim(game,e,contact)-e.a;
 // Fire discipline by skill: a hunter waits for a true solution, a novice sprays early.
 return Math.abs(Math.atan2(Math.sin(error),Math.cos(error)))<(skilled(e)&&ordinaryFighterBody(e)&&!(e.directorIntentUntil>now)?FIGHTER_AGGRESSION.skilledCone:.18-.04*fighterPressure(game));
}
export function fireFighterBurst(game,e){
 if(!ordinaryFighter(e))return false;
 const contact=game.enemyCombatTarget(e),pressure=fighterPressure(game),now=game.t||0;
 // Separate independent NPC fights from the player's shared threat budget.
 const npc=(game.patrols||[]).includes(contact)||!!(e.doverInterceptor&&contact.doverBomber),budget=npc?'_npcFighterBurstAt':'_fighterBurstAt';
 if(!fighterShotReady(game,e,contact)||(game[budget]??-Infinity)>now){e.fire=.06;return true;}
 game[budget]=now+.18-.06*pressure;
 e.fire=npc?1.25-.2*pressure:1.8-.35*pressure;
 // 20261111 flight strafe (crossing, pincer, head-on, chase): on a Director pass the line is
 // frozen once the first round leaves, so the pilot holds the trigger down it — a visible
 // stream the player has to get out of, instead of three single rounds. Stepping off the
 // line defeats it. Free combat keeps the short burst.
 const strafe=!npc&&e.directorBeat==='attack'&&e.directorIntentUntil>now;
 if(strafe)e.burstInterval=FIGHTER_AGGRESSION.strafeInterval;else delete e.burstInterval;
 game.enemyVolley(e);
 e.burstLeft=e.type==='scout'||e.personality?.archetype==='LOW_SPEED_AGILITY'?2:3;
 e.burstDelay=e.personality?.extendBias>1.25?.16:.2;
 if(strafe){e.burstLeft=(e.directorLayout==='cross'?FIGHTER_AGGRESSION.strafeRounds:FIGHTER_AGGRESSION.strafeRoundsShort)-1;e.burstDelay=e.burstInterval;}
 // 20261110 (cap lifted on request): a skilled pilot who has earned the tail keeps working
 // the guns — a longer burst and a shorter pause while he sits behind the pilot. Anywhere
 // else, and for novices, the old budget (pause > 1.5 s, burst <= 3) still holds. Turning
 // out of his sight ends it through the same aim gate as before.
 if(!npc&&skilled(e)&&Number.isFinite(contact.a)&&Math.cos(Math.atan2(e.y-contact.y,e.x-contact.x)-contact.a)<FIGHTER_AGGRESSION.tailCone){
  e.fire*=FIGHTER_AGGRESSION.tailCadence;e.burstLeft=FIGHTER_AGGRESSION.tailBurst-1; // burstLeft counts follow-up rounds
 }
 return true;
}

const BREAK_STATES=new Set([DOGFIGHT_PASS_STATES.ATTACK_PASS,DOGFIGHT_PASS_STATES.COMMIT,DOGFIGHT_PASS_STATES.DISENGAGE]);
// Predicted closest approach of a straight attack line to the pilot it is fighting.
function passCollision(game,e,contact,distance){
 if(e.combatPassBreak||!BREAK_STATES.has(e.combatPassState))return false;
 if(!(contact===game||game.players?.includes?.(contact))||distance>DOGFIGHT_PASS_BALANCE.breakRange)return false;
 const pv=contact.speed||0,pa=contact.a??0,ev=e.speed||0,rx=e.x-contact.x,ry=e.y-contact.y;
 const vx=Math.cos(e.a)*ev-Math.cos(pa)*pv,vy=Math.sin(e.a)*ev-Math.sin(pa)*pv,vv=vx*vx+vy*vy;
 const t=vv>1?-(rx*vx+ry*vy)/vv:0;if(t<=0)return false;
 return Math.hypot(rx+vx*t,ry+vy*t)<DOGFIGHT_PASS_BALANCE.breakMiss;
}

function setState(e,state,duration=0){if(!BREAK_STATES.has(state))e.combatPassBreak=false;e.combatPassState=state;e.combatPassTimer=duration;}
function clearState(e){
 for(const key of ['combatPassState','combatPassTimer','combatPassHeading','combatPassWaypoint','combatPassSide','combatPassCooldown','combatPassTail','attackRole','attackSide','attackFlankDone','attackFlankAt'])delete e[key];
}
function releaseDirectorCruise(e){
 if(!e.directorCruise)return;
 const prior=e.directorCruise;e.speed=prior.speed;e.dogfightCruise=prior.dogfight;e.personalityCruise=prior.personality;e.cruiseSpeedCap=prior.cap;delete e.directorCruise;
}

export function installDogfightPass(Game,angleDiff){
 const spawn=Game.prototype.spawnEnemy;
 Game.prototype.spawnEnemy=function(type,...args){
  const e=spawn.call(this,type,...args);if(eligible(this,e)){setState(e,DOGFIGHT_PASS_STATES.APPROACH);e.combatPassCooldown=0}return e;
 };

 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  if(e?.directorCruise&&this.t>=e.directorIntentUntil)releaseDirectorCruise(e);
  if(e?.directorFormation&&!e.isFormationCommander){
   const leader=e.formationLeader,now=this.t||0;
   if(e.directorIntentUntil&&now>=e.directorIntentUntil){e.directorIntentUntil=0;e.directorEscort=null}
   if(!leader||leader.hp<=0||!this.enemies.includes(leader)){
    e.directorFormation=false;e.formationLeader=null;e.directorFireHoldUntil=now+2.4;
    e.directorIntentUntil=0;e.directorEscort=null;
    setState(e,DOGFIGHT_PASS_STATES.DISENGAGE,2.4);
    e.combatPassHeading=e.a+(e.combatPassSide||1)*.7;
   }else if(!(this.patrols||[]).includes(contact)&&!e.defensivePressure&&!(e.directorBreakUntil>now)&&e.directorLayout!=='recovery'&&!e.directorRole&&!e.directorSquad?.passActive&&this.battleDirector?.sceneId===e.directorSceneId&&['approach','formation','melee'].includes(this.battleDirector.phase)
    // In gun range a skilled wingman stops flying station and fights; novices stay on their leader.
    &&!(e.battleCoverUntil>(this.t||0))
    &&!(skilled(e)&&ordinaryFighter(e)&&contact&&(contact===this||this.players?.includes?.(contact))&&Math.hypot(contact.x-e.x,contact.y-e.y)<FIGHTER_AGGRESSION.peelRange)){
    return formationStationSteering(e,leader,{back:e.formationBack,lateral:e.formationOffset},dt,baseTurn,angleDiff);
   }
  }
  if(e?.directorFireHoldUntil>this.t)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.5};
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

  // A brief shared entry heading makes the formation readable before individual
  // pursuit begins. Defensive reactions always retain their existing priority.
  if(directed&&!(this.patrols||[]).includes(contact)&&e.directorRallyUntil>(this.t||0)&&distance>clamp(p.preferredRange*1.15,180,360))
   return{delta:angleDiff(e.directorRallyHeading,e.a),turn:baseTurn*.55};

  if(e.combatPassState===DOGFIGHT_PASS_STATES.APPROACH){
   const result=base();if(ordinaryFighter(e)&&!e.defensivePressure&&!e.personalityManeuver){const flank=directed||(this.patrols||[]).includes(contact)?null:flankApproach(this,e,contact,distance);result.delta=angleDiff(flank??fighterAim(this,e,contact),e.a)}const entryRange=directed&&['chase','pincer','cross'].includes(e.directorLayout)?420:clamp(p.preferredRange*1.15,180,360),entryCone=ordinaryFighter(e)?(directed&&['cross','pincer'].includes(e.directorLayout)?.22:.35):clamp(.78+(p.headOnBias-1)*.18,.62,.95),entryDelta=ordinaryFighter(e)?angleDiff(fighterAim(this,e,contact),e.a):delta;
   if(e.combatPassCooldown===0&&distance<=entryRange&&Math.abs(entryDelta)<=entryCone){
    e.combatPassHeading=ordinaryFighter(e)?fighterAim(this,e,contact):bearing;e.combatPassSide=Math.sign(delta)||1;
    setState(e,DOGFIGHT_PASS_STATES.ATTACK_PASS,DOGFIGHT_PASS_BALANCE.attackPassDuration);
   }
   return{...result,turn:result.turn*clamp(.9+(p.pursuitControl-1)*.25,.82,1.08)};
  }

  // Once a directed nose-to-nose pass has crossed, enter the existing Break
  // sequence immediately instead of spending the remaining intent flying away.
  if(directed&&e.directorLayout==='headOn'&&e.combatPassState===DOGFIGHT_PASS_STATES.COMMIT&&distance<160&&Math.cos(delta)<-.15){
   e.combatPassHeading=e.a;setState(e,DOGFIGHT_PASS_STATES.DISENGAGE,DOGFIGHT_PASS_BALANCE.disengageDuration);
  }

  if(e.combatPassTimer===0){
   if(e.combatPassState===DOGFIGHT_PASS_STATES.ATTACK_PASS){
    const pursuit=directed&&e.directorLayout==='chase'&&p.extendBias<=1.25;
    const commit=pursuit?(e.type==='scout'?1.7:2.4):clamp(DOGFIGHT_PASS_BALANCE.commitDuration+(p.headOnBias-1)*.2,.78,1.28);
    setState(e,DOGFIGHT_PASS_STATES.COMMIT,directed&&e.directorLayout==='headOn'?Math.min(1.45,Math.max(commit,e.directorIntentUntil-(this.t||0)-DOGFIGHT_PASS_BALANCE.disengageDuration)):commit);
   }
   else if(e.combatPassState===DOGFIGHT_PASS_STATES.COMMIT){
    e.combatPassHeading=e.a;
    setState(e,DOGFIGHT_PASS_STATES.DISENGAGE,clamp(DOGFIGHT_PASS_BALANCE.disengageDuration*p.extendBias,.72,1.45)*(!directed&&ordinaryFighter(e)&&skilled(e)?FIGHTER_AGGRESSION.tailDisengage:1));
   }else if(e.combatPassState===DOGFIGHT_PASS_STATES.DISENGAGE){
    const anchor=Number.isFinite(contact.a)?contact.a:bearing+Math.PI,range=clamp(p.preferredRange*1.35,210,440),side=e.combatPassSide||1;
    const flank=e.directorChoreographyDone&&['headOn','cross','pincer'].includes(e.directorLayout)?1.1:1.9;
    e.combatPassWaypoint={x:contact.x+Math.cos(anchor+side*flank)*range,y:contact.y+Math.sin(anchor+side*flank)*range};
    // A skilled pilot does not extend away: he rolls back in behind the pilot he just passed.
    e.combatPassTail=!directed&&ordinaryFighter(e)&&skilled(e)&&Number.isFinite(contact.a)&&!(this.patrols||[]).includes(contact);
    setState(e,DOGFIGHT_PASS_STATES.REPOSITION,e.combatPassTail?FIGHTER_AGGRESSION.tailReposition:clamp(DOGFIGHT_PASS_BALANCE.repositionDuration/(p.reattackBias||1),.72,1.45));
   }else if(e.combatPassState===DOGFIGHT_PASS_STATES.REPOSITION)
    setState(e,DOGFIGHT_PASS_STATES.REENGAGE,DOGFIGHT_PASS_BALANCE.reengageDuration);
   else if(e.combatPassState===DOGFIGHT_PASS_STATES.REENGAGE){
    // Coming off the tail he attacks at once; everyone else takes a fresh role in the flight.
    e.attackRole=e.combatPassTail?'direct':null;e.attackSide=0;e.attackFlankDone=false;e.combatPassTail=false;
    e.combatPassHeading=null;e.combatPassWaypoint=null;e.combatPassCooldown=clamp(DOGFIGHT_PASS_BALANCE.approachCooldown/(p.reattackBias||1),.35,.8);
    setState(e,DOGFIGHT_PASS_STATES.APPROACH);
   }
  }

  // 20261108: the attack line was frozen straight through the pilot, so most
  // passes ended in a head-on ram. Once the guns are inside breakRange and the
  // line would pass within breakMiss, the fighter breaks to its pass side.
  if(passCollision(this,e,contact,distance)){e.combatPassHeading=e.a+(e.combatPassSide||1)*DOGFIGHT_PASS_BALANCE.breakAngle;e.combatPassBreak=true;}
  if(e.combatPassBreak&&BREAK_STATES.has(e.combatPassState))
   return{delta:angleDiff(e.combatPassHeading,e.a),turn:baseTurn*DOGFIGHT_PASS_BALANCE.breakTurn};
  if((this.patrols||[]).includes(contact)&&[DOGFIGHT_PASS_STATES.ATTACK_PASS,DOGFIGHT_PASS_STATES.COMMIT].includes(e.combatPassState))
   return{delta:angleDiff(fighterAim(this,e,contact),e.a),turn:baseTurn*.85};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.ATTACK_PASS)
   return{delta:angleDiff(directed&&['cross','pincer'].includes(e.directorLayout)&&ordinaryFighter(e)?fighterAim(this,e,contact):e.combatPassHeading??e.a,e.a),turn:baseTurn*.72};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.COMMIT&&directed&&e.directorLayout==='chase'&&p.extendBias<=1.25)
   return{delta:angleDiff(fighterAim(this,e,contact),e.a),turn:baseTurn*.72};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.COMMIT){
   // Skilled pilots keep the sight on through the pass (deflection shooting) while the
   // target stays ahead; once it slips outside the cone the line freezes as before.
   if(!directed&&ordinaryFighter(e)&&skilled(e)&&distance>FIGHTER_AGGRESSION.commitTrackMinRange){
    const aim=angleDiff(fighterAim(this,e,contact),e.a);
    if(Math.abs(aim)<FIGHTER_AGGRESSION.commitTrackCone){e.combatPassHeading=e.a;return{delta:aim,turn:baseTurn*FIGHTER_AGGRESSION.commitTrackTurn};}
   }
   return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.16};
  }
  if(e.combatPassState===DOGFIGHT_PASS_STATES.DISENGAGE)
   return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*(e.directorBreakUntil>(this.t||0)?.55:.14)};
  if(e.combatPassState===DOGFIGHT_PASS_STATES.REPOSITION){
   const waypoint=e.combatPassWaypoint||contact;
   if(directed&&e.directorLayout==='chase'){
    const heading=Number.isFinite(contact.a)?contact.a:bearing,back=clamp(p.preferredRange*.55,90,150);
    waypoint.x=contact.x-Math.cos(heading)*back;waypoint.y=contact.y-Math.sin(heading)*back;
   }else if(e.combatPassTail&&Number.isFinite(contact.a)){
    const A=FIGHTER_AGGRESSION,side=e.combatPassSide||1;
    waypoint.x=contact.x-Math.cos(contact.a)*A.tailBack-Math.sin(contact.a)*side*A.tailSide;waypoint.y=contact.y-Math.sin(contact.a)*A.tailBack+Math.cos(contact.a)*side*A.tailSide;
   }else if(directed&&e.directorLayout==='escort'){
    const bomber=e.directorEscort;
    if(!bomber||bomber.hp<=0){e.directorIntentUntil=0;e.directorEscort=null;e.combatPassTimer=0}
    else if(Math.hypot(contact.x-bomber.x,contact.y-bomber.y)<260){waypoint.x=contact.x;waypoint.y=contact.y}
    else{const offset=e.directorEscortOffset||0;waypoint.x=bomber.x+Math.cos(bomber.a)*120-Math.sin(bomber.a)*offset;waypoint.y=bomber.y+Math.sin(bomber.a)*120+Math.cos(bomber.a)*offset}
   }
   // Briefly hold the outside flank before converging on the original fixed
   // waypoint. Player movement must not turn a pincer into homing pursuit.
   const spread=directed&&e.directorLayout==='pincer'&&(this.t||0)-(e.directorIntentStartedAt||0)<1.2?130*(e.combatPassSide||1):0,heading=e.directorAnchorHeading||0;
   const targetX=waypoint.x-Math.sin(heading)*spread,targetY=waypoint.y+Math.cos(heading)*spread;
   return{delta:angleDiff(Math.atan2(targetY-e.y,targetX-e.x),e.a),turn:baseTurn*clamp(.82+(p.highSpeedHandling-1)*.2,.68,1.05)};
  }
  if(e.combatPassState===DOGFIGHT_PASS_STATES.REENGAGE){const result=base();return{...result,turn:result.turn*clamp(p.reattackBias,.82,1.38)}}
  return base();
 };
}
