// Common head-on damage rule (applied by the engine's round damage multiplier).
// 20261111 common head-on bonus: a gun round that meets an aircraft nose-first (flying
// against its heading) hits harder. Any pilot, solo or co-op; ground targets, ships,
// airships and heavy bombers have no nose-on duel and are excluded.
export const HEAD_ON_BALANCE=Object.freeze({damageMultiplier:1.5,noseCone:.9});
export function headOnRound(b,e){
 if(!b||!e||b.enemy||!Number.isInteger(b.gun)||b.patrol||b.formation||b.ally||b.rocket||b.motorCannon||b.cow37||b.actualExplosion||b.blast||b.pilotRear)return false;
 if(e.surface||e.stationary||e.fieldUnit||e.navalVessel||e.heavyBomber||e.type==='zeppelin'||e.stageBossBody||!Number.isFinite(e.a))return false;
 const speed=Math.hypot(b.vx,b.vy);if(!(speed>1))return false;
 return -(b.vx*Math.cos(e.a)+b.vy*Math.sin(e.a))/speed>=HEAD_ON_BALANCE.noseCone;
}
