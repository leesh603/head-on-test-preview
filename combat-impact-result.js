// Presentation metadata only. Weak keys never enter the co-op snapshot or RNG.
const results=new WeakMap();
export function recordCombatImpact(round,target,result){
 if(round&&typeof round==='object')results.set(round,{target,...result});
 return result;
}
export function combatImpactResult(round,target){
 const result=results.get(round);return result?.target===target?result:null;
}

// Share a positive ordinary-MG classification between tint and painted contact cues.
// Unknown weapons, exceptional hits and protected targets retain their presentation.
const special=['patrol','ally','pilotSupport','formation','burn','wwiIncendiary','pierce','cow37','motorCannon','rocket','grenade','flak','fieldShell','heavyShell','mauser','mauserRound','tacticalRound','flechette','fieryGrapnel','actualExplosion','blast','fireZone','identityDotTarget','synthesisPayloadDart','capitalIgnite','heavy'];
const protectedTarget=['bossPilot','ace','rivalAce','eliteKind','stageBossBody','heavyBomber','surface','stationary','fieldUnit','navalVessel','bugDrone','groundEscort','missionGround','londonInstallation','cityUnit','bossAirship','expired','bossMinion','finalArenaTarget','intrusionBody','doverBomber','player'];
export function ordinaryMgContact(target,round,result){
 const payload=round?.synthesisPayload;
 return !!(target&&round&&result&&Number.isFinite(result.damage)&&result.damage>0&&
  round.enemy===false&&round.wwiMachineGun===true&&Number.isInteger(round.gun)&&round.gun>=0&&
  !special.some(key=>round[key])&&round.steelCoreRemaining==null&&
  !payload?.incendiary&&!payload?.explosive&&!payload?.darts&&!payload?.gas&&
  !result.blocked&&result.critical===null&&!result.railArmor&&!result.partId&&
  target.hp>0&&['scout','hunter','bomber'].includes(target.type)&&!protectedTarget.some(key=>target[key]));
}
// Tint still uses the existing snapshot scalar and preserves a stronger active flash.
export function projectileHitFlash(target,round,result){
 return ordinaryMgContact(target,round,result)?Math.max(Number.isFinite(target.hitFlash)?target.hitFlash:0,.04):.24;
}
