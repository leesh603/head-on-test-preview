// Battle damage — confirmed critical hits leave a lasting mark on ordinary fighters.
// The existing critical system decides WHERE a round struck; this module makes that
// answer matter for the rest of the fight: flight, gunnery, the pilot's decisions,
// the flight's reaction and the way the aircraft finally goes down.
//
// Scope (pilot): ordinary scout/hunter fighters only. Aces, elites, bosses, bombers,
// two-seaters and mission targets keep their authored behaviour untouched.
// Nothing here raises enemy health, damage or accuracy.
import {ordinaryFighter} from './dogfight-pass165.js?v=gal1&airbattle=20261108&strafe=20261111';

export const BATTLE_DAMAGE_BALANCE=Object.freeze({
 // Cruise fraction by engine damage level (0 intact, 1 rough, 2 failing).
 engineSpeed:Object.freeze([1,.8,.6]),engineEase:1.6,
 // A rough engine breaks off once the airframe is also hurt; a failing one always does.
 engineWithdrawHp:.6,
 // The damaged wing still lets the aircraft fall toward it but resists turning away.
 wingWeakTurn:.45,wingDrift:.22,
 // A wounded pilot cannot hold the sight steady.
 woundedWander:.21,woundedTurn:.88,
 // A leaking tank can be lit by any later round from an attacker.
 leakIgnite:.22,leakBurn:3,
 withdrawWeave:.34,
 // Heavy rounds physically shove an ordinary fighter: displacement along the blow (px),
 // a yaw kick (rad) and a moment before the pilot can shoot again. Machine guns never do.
 heavy:Object.freeze({cannon:Object.freeze({shove:13,yaw:.2}),rocket:Object.freeze({shove:17,yaw:.26}),blast:Object.freeze({shove:22,yaw:.32})}),
 heavyDuration:.3,heavyCooldown:.22,heavyGunDelay:.6,
 // A healthy wingman turns in on whoever is finishing his comrade.
 coverRange:520,coverPursuitRange:340,coverPursuitCone:.75,coverFor:4,coverCooldown:6
});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Independent, reproducible stream: must not advance the Director/spawn RNG.
function damageRandom(world){
 world.battleDamageRandomState=(Math.imul(world.battleDamageRandomState??0x42444d47,1664525)+1013904223)>>>0;
 return world.battleDamageRandomState/4294967296;
}
const fresh=time=>({engine:0,wing:0,wingHits:0,pilot:false,leak:false,since:time,coverAt:0});

export function battleDamage(e){return e?.battleDamage||null}
// True while the aircraft has given up the fight and is trying to get away.
export function battleDamageWithdrawing(e){
 const d=e?.battleDamage;if(!d||!(e.hp>0))return false;
 return e.burnTime>0||d.engine>=2||d.engine===1&&e.hp/(e.maxHp||e.hp)<BATTLE_DAMAGE_BALANCE.engineWithdrawHp;
}

// Called once per confirmed aircraft hit, after the critical (if any) was applied.
export function noteBattleDamage(world,e,b,critical,damage){
 if(!e||world?.online&&!world.host)return null;
 // Any pilot knows when the player's rounds are landing on him (read by flight/escort AI).
 if(b&&!b.enemy&&damage>0)e.struckAt=world?.t||0;
 const d=e.battleDamage,time=world?.t||0;
 if(!(e.hp>0)){
  // The standing damage decides how an aircraft without a lethal critical goes down.
  if(d&&!e.lethalCritical){
   e.lethalCritical=e.burnTime>0?'fire':d.wing?'wing':d.engine?'engine':d.pilot?'pilot':undefined;
   if(e.lethalCritical==='wing')e.lethalCriticalSide=d.wing;
   if(!e.lethalCritical)delete e.lethalCritical;
  }
  return d||null;
 }
 if(!ordinaryFighter(e))return d||null;
 heavyImpact(world,e,b,damage,time);
 if(critical&&!critical.player&&!critical.pilotKill){
  const s=d||(e.battleDamage=fresh(time));
  if(critical.part==='engine')s.engine=Math.min(2,s.engine+1);
  else if(critical.part==='wing'){if(!s.wing)s.wing=critical.side<0?-1:1;s.wingHits++;}
  else if(critical.part==='cockpit')s.pilot=true;
  else if(critical.part==='fuel'&&!critical.ignite)s.leak=true;
  else return s;
  // Let the pilot re-decide at once instead of finishing a stale manoeuvre.
  e.personalityDecisionUntil=0;
  return s;
 }
 if(d?.leak&&!(e.burnTime>0)&&b&&!b.enemy&&damage>0&&damageRandom(world)<BATTLE_DAMAGE_BALANCE.leakIgnite){
  e.fuelFxAge=0;e.burnTime=BATTLE_DAMAGE_BALANCE.leakBurn;
  e.burnDps=Math.max(e.burnDps||0,Math.min(Math.max(1,damage*.2),(e.maxHp||e.hp)*.025));
  e.burnOwnerId=b.ownerId??world.id;e.burnSupport=!!(b.ally||b.patrol||b.formation||b.ghost);
  e.criticalFuelOrigin??={forward:0,side:0};
  d.leak=false;d.ignitedAt=time;e.personalityDecisionUntil=0;
 }
 return d||null;
}

// Weight of the weapon, felt by the target: not a visual wobble but a real displacement that
// spoils its line and its aim. Uses the existing critical sway integrator (finite impulse).
function heavyImpact(world,e,b,damage,time){
 if(!b||b.enemy||!(damage>0)||time<(e.heavyImpactAt??-Infinity))return;
 const B=BATTLE_DAMAGE_BALANCE,blast=!!(b.actualExplosion||b.blast||b.explosionRadius>0),kind=b.rocket?'rocket':blast?'blast':b.cow37||b.motorCannon?'cannon':null;
 if(!kind)return;
 const moving=Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&Math.hypot(b.vx,b.vy)>1&&!blast;
 const a=moving?Math.atan2(b.vy,b.vx):Math.atan2(e.y-b.y,e.x-b.x),w=B.heavy[kind];
 if(!Number.isFinite(a))return;
 e.heavyImpactAt=time+B.heavyCooldown;
 e.criticalSway={age:0,duration:B.heavyDuration,a,amplitude:w.shove,player:false};
 // The blow turns the nose away from the side it landed on.
 const side=Math.sign(Math.sin(a-(e.a||0)))||1;e.a+=side*w.yaw;
 e.fire=Math.max(e.fire||0,B.heavyGunDelay);e.burstLeft=0;
}
function pursuing(contact,e){
 if(!contact||!Number.isFinite(contact.a))return false;
 const dx=e.x-contact.x,dy=e.y-contact.y,B=BATTLE_DAMAGE_BALANCE;
 return Math.hypot(dx,dy)<B.coverPursuitRange&&Math.abs(wrap(Math.atan2(dy,dx)-contact.a))<B.coverPursuitCone;
}
// One healthy wingman abandons his own pattern and turns in on the pursuer.
function callCover(game,e,contact,now){
 const d=e.battleDamage,B=BATTLE_DAMAGE_BALANCE;
 if(d.coverAt>now||!pursuing(contact,e))return null;
 const world=game.combatWorld?.()||game;let best=null,score=Infinity;
 for(const o of world.enemies||[]){
  if(o===e||!ordinaryFighter(o)||o.faction!==e.faction||battleDamageWithdrawing(o)||o.battleCoverUntil>now)continue;
  const gap=Math.hypot(o.x-e.x,o.y-e.y);if(gap>B.coverRange)continue;
  const s=gap-(o.directorSquad&&o.directorSquad===e.directorSquad?160:0);
  if(s<score){best=o;score=s;}
 }
 d.coverAt=now+B.coverCooldown;
 if(!best)return null;
 best.battleCoverUntil=now+B.coverFor;
 best.combatPassState='APPROACH';best.combatPassTimer=0;best.combatPassCooldown=0;
 best.personalityManeuver=null;best.personalityDecisionUntil=now+1.2;
 best.directorFireHoldUntil=Math.min(best.directorFireHoldUntil||0,now);
 // Pulled out of any flight choreography for the intercept, and aimed at the pursuer himself
 // (in co-op: the pilot doing the chasing, not whoever happens to be nearest).
 best.directorIntentUntil=Math.min(best.directorIntentUntil||0,now);best.directorChoreographyDone=true;
 best.battleCoverTargetId=contact.id??null;
 return best;
}

export function installBattleDamage(Game,angleDiff){
 if(Game.prototype.__battleDamage)return;Game.prototype.__battleDamage=true;
 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  const d=e?.battleDamage;
  if(!d||!ordinaryFighter(e))return steer.call(this,e,contact,dt,baseTurn);
  const B=BATTLE_DAMAGE_BALANCE,now=this.t||0,step=Math.max(0,dt||0);
  // A choreographed flight pass is flown to its end; the damage takes over once the
  // Director releases the aircraft to free combat.
  if(e.directorIntentUntil>now)return steer.call(this,e,contact,dt,baseTurn);
  if(d.engine){
   // Other manoeuvres keep writing e.speed; the damaged engine only caps what they reach.
   d.cruise??=e.personalityCruise||e.dogfightCruise||e.speed;
   const cap=d.cruise*B.engineSpeed[d.engine];
   if(e.speed>cap)e.speed+=(cap-e.speed)*Math.min(1,step*B.engineEase);
  }
  let out;
  if(contact&&baseTurn>0&&battleDamageWithdrawing(e)){
   callCover(this,e,contact,now);
   const away=Math.atan2(e.y-contact.y,e.x-contact.x),weave=Math.sin(now*2.6+(e.wobble||0))*B.withdrawWeave;
   out={delta:angleDiff(away+weave,e.a),turn:baseTurn};
  }else out=steer.call(this,e,contact,dt,baseTurn);
  if(d.wing&&baseTurn>0){
   const side=d.wing,maneuver=e.personalityManeuver;
   // Breaks go the way the aircraft can still turn: readable, and exploitable.
   if(maneuver==='BREAK_LEFT'||maneuver==='BREAK_RIGHT'||maneuver==='SLOW_BREAK'){
    e.personalityTurnSign=side;out={...out,delta:side*Math.abs(out.delta)};
   }else if(out.delta*side<0)out={...out,turn:out.turn*B.wingWeakTurn};
   e.a+=side*B.wingDrift*step;
  }
  if(d.pilot&&baseTurn>0)out={...out,delta:out.delta+Math.sin(now*1.9+(e.wobble||0)*3)*B.woundedWander,turn:out.turn*B.woundedTurn};
  return out;
 };
}
