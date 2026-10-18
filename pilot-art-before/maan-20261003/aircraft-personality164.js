// Gameplay 2.0 — aircraft personality registry.
// Current airframe speed/turn/drag/recovery remain authoritative. This module
// translates those airframes into shared player/enemy/ally combat behaviour.

const freeze=value=>Object.freeze(value);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export const AIRCRAFT_ARCHETYPES=freeze({
 TURN_FIGHTER:'TURN_FIGHTER',
 LOW_SPEED_AGILITY:'LOW_SPEED_AGILITY',
 ENERGY_FIGHTER:'ENERGY_FIGHTER',
 BOOM_ZOOM:'BOOM_ZOOM',
 BALANCED_FIGHTER:'BALANCED_FIGHTER',
 HEAVY_BALANCED:'HEAVY_BALANCED',
 HEAVY_ATTACKER:'HEAVY_ATTACKER',
 DEFENSIVE_TWO_SEATER:'DEFENSIVE_TWO_SEATER',
 OFFENSIVE_TWO_SEATER:'OFFENSIVE_TWO_SEATER'
});

const P=(archetype,overrides={})=>freeze({
 archetype,acceleration:1,lowSpeedHandling:1,highSpeedHandling:1,
 pursuitControl:1,overshootDefense:1,extendBias:1,breakBias:1,
 scissorsBias:1,headOnBias:1,reattackBias:1,preferredRange:210,...overrides
});

export const AIRCRAFT_PERSONALITIES=freeze({
 fokker:P('LOW_SPEED_AGILITY',{acceleration:.88,lowSpeedHandling:1.28,highSpeedHandling:.82,pursuitControl:1.25,overshootDefense:1.35,extendBias:.62,breakBias:1.28,scissorsBias:1.3,headOnBias:.82,reattackBias:1.05,preferredRange:145}),
 albatros:P('BALANCED_FIGHTER',{acceleration:.96,lowSpeedHandling:.96,highSpeedHandling:1,pursuitControl:1,overshootDefense:.95,extendBias:1,breakBias:.95,scissorsBias:.85,headOnBias:1.15,reattackBias:1,preferredRange:215}),
 camel:P('TURN_FIGHTER',{acceleration:.92,lowSpeedHandling:1.22,highSpeedHandling:.86,pursuitControl:1.22,overshootDefense:1.12,extendBias:.66,breakBias:1.32,scissorsBias:1.16,headOnBias:.88,reattackBias:1.08,preferredRange:150}),
 sopwith:P('TURN_FIGHTER',{acceleration:1,lowSpeedHandling:1.17,highSpeedHandling:.93,pursuitControl:1.16,overshootDefense:1.12,extendBias:.78,breakBias:1.25,scissorsBias:1.1,headOnBias:.9,reattackBias:1.14,preferredRange:165}),
 nieuport:P('LOW_SPEED_AGILITY',{acceleration:1.03,lowSpeedHandling:1.24,highSpeedHandling:.87,pursuitControl:1.2,overshootDefense:1.25,extendBias:.74,breakBias:1.34,scissorsBias:1.22,headOnBias:.78,reattackBias:1.12,preferredRange:145}),
 spad:P('BOOM_ZOOM',{acceleration:1.3,lowSpeedHandling:.75,highSpeedHandling:1.25,pursuitControl:.74,overshootDefense:.72,extendBias:1.48,breakBias:.62,scissorsBias:.5,headOnBias:1.08,reattackBias:1.32,preferredRange:310}),
 fokkerdv:P('ENERGY_FIGHTER',{acceleration:1.17,lowSpeedHandling:1.02,highSpeedHandling:1.12,pursuitControl:1,overshootDefense:.98,extendBias:1.2,breakBias:1,scissorsBias:.9,headOnBias:1.02,reattackBias:1.28,preferredRange:230}),
 spad12:P('HEAVY_ATTACKER',{acceleration:1.08,lowSpeedHandling:.82,highSpeedHandling:1.08,pursuitControl:.82,overshootDefense:.76,extendBias:1.24,breakBias:.74,scissorsBias:.55,headOnBias:1.32,reattackBias:1.08,preferredRange:275}),
 re7:P('DEFENSIVE_TWO_SEATER',{acceleration:.72,lowSpeedHandling:.78,highSpeedHandling:.72,pursuitControl:.7,overshootDefense:.9,extendBias:1.3,breakBias:.55,scissorsBias:.45,headOnBias:.7,reattackBias:.68,preferredRange:285}),
 fokkerd7:P('ENERGY_FIGHTER',{acceleration:1.2,lowSpeedHandling:1.08,highSpeedHandling:1.15,pursuitControl:1.05,overshootDefense:1.05,extendBias:1.15,breakBias:1.08,scissorsBias:.92,headOnBias:1.06,reattackBias:1.3,preferredRange:220}),
 eindecker:P('BALANCED_FIGHTER',{acceleration:.72,lowSpeedHandling:.86,highSpeedHandling:.7,pursuitControl:.82,overshootDefense:.88,extendBias:.82,breakBias:.82,scissorsBias:.7,headOnBias:1.02,reattackBias:.72,preferredRange:205}),
 se5a:P('ENERGY_FIGHTER',{acceleration:1.28,lowSpeedHandling:.88,highSpeedHandling:1.22,pursuitControl:.88,overshootDefense:.8,extendBias:1.4,breakBias:.76,scissorsBias:.6,headOnBias:1.04,reattackBias:1.34,preferredRange:285}),
 bristol_duo:P('OFFENSIVE_TWO_SEATER',{acceleration:1.02,lowSpeedHandling:.95,highSpeedHandling:1.02,pursuitControl:.88,overshootDefense:.92,extendBias:1.18,breakBias:.82,scissorsBias:.65,headOnBias:1.12,reattackBias:1.08,preferredRange:235}),
 baron_albatros:P('BALANCED_FIGHTER',{acceleration:.98,lowSpeedHandling:.98,highSpeedHandling:1.02,pursuitControl:1.05,overshootDefense:.98,extendBias:1,breakBias:1,scissorsBias:.88,headOnBias:1.12,reattackBias:1.05,preferredRange:205}),
 albatros_d2:P('BALANCED_FIGHTER',{acceleration:.9,lowSpeedHandling:.9,highSpeedHandling:.9,pursuitControl:.92,overshootDefense:.9,extendBias:.94,breakBias:.88,scissorsBias:.76,headOnBias:1.12,reattackBias:.9,preferredRange:220}),
 halberstadt_duo:P('DEFENSIVE_TWO_SEATER',{acceleration:.85,lowSpeedHandling:.9,highSpeedHandling:.84,pursuitControl:.78,overshootDefense:1,extendBias:1.22,breakBias:.7,scissorsBias:.58,headOnBias:.88,reattackBias:.86,preferredRange:245}),
 nieuport_italian:P('LOW_SPEED_AGILITY',{acceleration:1.03,lowSpeedHandling:1.24,highSpeedHandling:.87,pursuitControl:1.2,overshootDefense:1.25,extendBias:.74,breakBias:1.34,scissorsBias:1.22,headOnBias:.92,reattackBias:1.12,preferredRange:145}),
 nieuport24:P('TURN_FIGHTER',{acceleration:1.08,lowSpeedHandling:1.2,highSpeedHandling:.94,pursuitControl:1.25,overshootDefense:1.18,extendBias:.78,breakBias:1.3,scissorsBias:1.15,headOnBias:.84,reattackBias:1.16,preferredRange:155}),
 pfalz_d3a:P('HEAVY_BALANCED',{acceleration:1,lowSpeedHandling:.96,highSpeedHandling:1,pursuitControl:.94,overshootDefense:.9,extendBias:1.08,breakBias:.9,scissorsBias:.72,headOnBias:1.18,reattackBias:1.02,preferredRange:225}),
 airco_dh2:P('LOW_SPEED_AGILITY',{acceleration:.82,lowSpeedHandling:1.26,highSpeedHandling:.72,pursuitControl:1.22,overshootDefense:1.3,extendBias:.58,breakBias:1.34,scissorsBias:1.3,headOnBias:.8,reattackBias:1,preferredRange:135}),
 wolff_albatros:P('ENERGY_FIGHTER',{acceleration:1.12,lowSpeedHandling:1,highSpeedHandling:1.08,pursuitControl:1,overshootDefense:.94,extendBias:1.22,breakBias:.96,scissorsBias:.78,headOnBias:1,reattackBias:1.3,preferredRange:245}),
 loewenhardt_fokkerd7:P('ENERGY_FIGHTER',{acceleration:1.25,lowSpeedHandling:1.02,highSpeedHandling:1.2,pursuitControl:.98,overshootDefense:.92,extendBias:1.28,breakBias:.9,scissorsBias:.7,headOnBias:1.38,reattackBias:1.34,preferredRange:245}),
 mccudden_se5a:P('ENERGY_FIGHTER',{acceleration:1.32,lowSpeedHandling:.9,highSpeedHandling:1.26,pursuitControl:.9,overshootDefense:.82,extendBias:1.42,breakBias:.78,scissorsBias:.62,headOnBias:1.02,reattackBias:1.4,preferredRange:295}),
 nungesser_nieuport24:P('TURN_FIGHTER',{acceleration:1.12,lowSpeedHandling:1.25,highSpeedHandling:1,pursuitControl:1.22,overshootDefense:1.2,extendBias:.86,breakBias:1.34,scissorsBias:1.18,headOnBias:1,reattackBias:1.24,preferredRange:155})
});

export const SPECIAL_AIRCRAFT_PERSONALITIES=freeze({
 staaken:P('HEAVY_ATTACKER',{acceleration:.55,lowSpeedHandling:.5,highSpeedHandling:.6,pursuitControl:.35,overshootDefense:.4,extendBias:1.05,breakBias:.3,scissorsBias:.2,headOnBias:1.15,reattackBias:.55,preferredRange:360}),
 'handley-page':P('HEAVY_ATTACKER',{acceleration:.58,lowSpeedHandling:.52,highSpeedHandling:.62,pursuitControl:.35,overshootDefense:.42,extendBias:1.05,breakBias:.32,scissorsBias:.2,headOnBias:1.12,reattackBias:.58,preferredRange:360})
});

export const AIRCRAFT_PERSONALITY_ALIASES=freeze({
 fokker_red:'fokker',fokker_voss:'fokker',fokker_standard:'fokker','white-fokkerdv55':'fokkerd7',
 collishaw_sopwith:'sopwith',goering_fokkerd7:'fokkerd7',guynemer_spad:'spad12',udet_fokkerdv:'fokkerdv',baracca_nieuport:'nieuport_italian',berthold_pfalz:'pfalz_d3a'
});

export function resolveAircraftPersonalityId(id){return AIRCRAFT_PERSONALITY_ALIASES[id]||id}
export function personalityFor(id){const resolved=resolveAircraftPersonalityId(id);return AIRCRAFT_PERSONALITIES[resolved]||SPECIAL_AIRCRAFT_PERSONALITIES[resolved]||null}

function fighterAirframeId(e){return e?.bossPlane||e?.escortPlane||e?.plane||e?.airframe||null}
export function attachAircraftPersonality(PLANES,unit,id,{retuneCruise=false}={}){
 const resolved=resolveAircraftPersonalityId(id),personality=personalityFor(resolved)||PLANES[resolved]?.personality;
 if(!personality){delete unit.personalityId;delete unit.personality;delete unit.airframeHandling;return null}
 unit.personalityId=resolved;unit.personality=personality;
 const airframe=PLANES[resolved];if(airframe)unit.airframeHandling=airframe.handling||null;
 if(retuneCruise)retuneAircraftPersonalityCruise(PLANES,unit);
 return personality;
}

function retuneAircraftPersonalityCruise(PLANES,unit){
 const raw=Number.isFinite(unit.personalityRawCruise)?unit.personalityRawCruise:unit.speed;
 if(!Number.isFinite(raw))return;
 const reference=PLANES[unit.personalityId]?.handling?.speed||150,factor=clamp(reference/150,.82,1.16);
 unit.personalityRawCruise=raw;
 unit.speed=raw*factor;if(Number.isFinite(unit.cruiseSpeedCap))unit.speed=Math.min(unit.speed,unit.cruiseSpeedCap);
 unit.personalityCruise=unit.speed;
}

export function installAircraftPersonality(Game,PLANES,angleDiff){
 if(Game.prototype.__aircraftPersonality164)return;Game.prototype.__aircraftPersonality164=true;
 for(const [id,plane]of Object.entries(PLANES)){const p=personalityFor(id);if(p)plane.personality=p}
 Game.prototype.aircraftPersonality=function(id=this.plane){const resolved=resolveAircraftPersonalityId(id);return personalityFor(resolved)||PLANES[resolved]?.personality||null};

 // Player craft already use their own speed/turn/drag/recovery in flyAirframe.
 // Keep those numbers authoritative; expose the shared personality dimensions.
 const fly=Game.prototype.flyAirframe;
 Game.prototype.flyAirframe=function(dt,input={}){
  const resolved=resolveAircraftPersonalityId(this.plane);
  this.currentAircraftPersonality=personalityFor(resolved)||PLANES[resolved]?.personality||null;
  return fly.call(this,dt,input);
 };

 const spawn=Game.prototype.spawnEnemy;
 Game.prototype.spawnEnemy=function(type,...args){
  const e=spawn.call(this,type,...args);if(!e)return e;
  const regular=this.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.formationLeader&&!e.missionTarget&&!e.bossPilot;
  const p=attachAircraftPersonality(PLANES,e,fighterAirframeId(e),{retuneCruise:regular});if(!p)return e;
  return e;
 };

 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  const id=resolveAircraftPersonalityId(fighterAirframeId(e));
  const p=e.personalityId===id?e.personality:attachAircraftPersonality(PLANES,e,id);
  const eligible=p&&this.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.formationLeader&&!e.missionTarget&&!e.bossPilot;
  if(!eligible)return steer.call(this,e,contact,dt,baseTurn);
  const now=this.t||0,distance=Math.hypot(contact.x-e.x,contact.y-e.y);
  const bearing=Math.atan2(contact.y-e.y,contact.x-e.x);
  const targetBehind=Math.abs(angleDiff(bearing,e.a+Math.PI))<1.05;
  e.personalityDecisionUntil=Math.max(e.personalityDecisionUntil||0,0);
  if(e.personalityDecisionUntil<=now){
   if(targetBehind&&distance<300){
    const r=this.rng?.()??.5;
    e.personalityTurnSign=Math.sign(angleDiff(bearing,e.a))||(r<.5?-1:1);
    if(p.extendBias>1.25&&r<.58)e.personalityManeuver='EXTEND';
    else if(p.scissorsBias>1.08&&r<.52)e.personalityManeuver='SCISSORS';
    else if(p.overshootDefense>1.12&&r<.72)e.personalityManeuver='SLOW_BREAK';
    else e.personalityManeuver=e.personalityTurnSign<0?'BREAK_LEFT':'BREAK_RIGHT';
    e.personalityDecisionUntil=now+.55+(.45/(p.reattackBias||1));
   }else if(distance>p.preferredRange*1.35&&p.reattackBias>1.15){
    e.personalityManeuver='REATTACK';e.personalityDecisionUntil=now+.7;
   }else e.personalityManeuver=null;
  }
  const base=steer.call(this,e,contact,dt,baseTurn),maneuver=e.personalityManeuver;
  if(maneuver==='EXTEND'){
   const heading=e.personalityExtendHeading??=e.a,uncapped=Math.max(e.personalityCruise||e.speed,e.speed)*1.08;
   const target=Number.isFinite(e.cruiseSpeedCap)?Math.min(uncapped,e.cruiseSpeedCap):uncapped;
   e.speed+=(target-e.speed)*Math.min(1,dt*1.8);
   return{delta:angleDiff(heading,e.a),turn:base.turn*.24};
  }
  e.personalityExtendHeading=null;
  if(maneuver==='SLOW_BREAK'){
   const cruise=e.personalityCruise||e.dogfightCruise||e.speed;
   e.speed+=(cruise*.76-e.speed)*Math.min(1,dt*2.8);
   return{delta:(e.personalityTurnSign||1)*1.2,turn:base.turn*p.breakBias*1.08};
  }
  if(maneuver==='SCISSORS'){
   const phase=Math.sin(now*6.2)>=0?1:-1,cruise=e.personalityCruise||e.dogfightCruise||e.speed;
   e.speed+=(cruise*.84-e.speed)*Math.min(1,dt*2.4);
   return{delta:phase*.9,turn:base.turn*p.scissorsBias};
  }
  if(maneuver==='BREAK_LEFT'||maneuver==='BREAK_RIGHT')
   return{...base,delta:(e.personalityTurnSign||1)*1.15,turn:base.turn*p.breakBias};
  if(maneuver==='REATTACK')return{...base,turn:base.turn*p.reattackBias};

  let turnMult=1;
  if(p.archetype==='TURN_FIGHTER'||p.archetype==='LOW_SPEED_AGILITY')turnMult=1.06;
  else if(p.archetype==='BOOM_ZOOM')turnMult=distance<190?.76:.9;
  else if(p.archetype==='DEFENSIVE_TWO_SEATER')turnMult=.82;
  else if(p.archetype==='HEAVY_ATTACKER')turnMult=.84;
  return{...base,turn:base.turn*turnMult};
 };

 const spawnPatrol=Game.prototype.spawnPatrol;
 Game.prototype.spawnPatrol=function(...args){
  const before=(this.patrols||[]).length,result=spawnPatrol.apply(this,args);
  for(const ptl of (this.patrols||[]).slice(before)){
   const p=attachAircraftPersonality(PLANES,ptl,ptl.plane);if(!p)continue;
   const airframe=PLANES[ptl.personalityId];
   if(airframe){
    ptl.personalityTurn=clamp((airframe.turn||3)*.72,1.7,3.4);
    const reference=airframe.handling?.speed||airframe.speed||150;
    ptl.speed*=clamp(reference/150,.86,1.14);
    ptl.personalityCruise=ptl.speed;
   }
  }
  return result;
 };

 // Formation wingmen remain formation-bound, but still carry their airframe
 // profile so they do not silently fall back to a generic aircraft identity.
 const ensureWingmen=Game.prototype.ensureWingmen;
 Game.prototype.ensureWingmen=function(...args){
  const result=ensureWingmen.apply(this,args);
  for(const a of this.allies||[])attachAircraftPersonality(PLANES,a,a.plane);
  return result;
 };
 const spawnAlly=Game.prototype.spawnAlly;
 Game.prototype.spawnAlly=function(...args){
  const result=spawnAlly.apply(this,args),a=this.allies?.at(-1);
  if(a)attachAircraftPersonality(PLANES,a,a.plane);return result;
 };
}
