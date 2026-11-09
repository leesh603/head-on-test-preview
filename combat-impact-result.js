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

const damageOrigin=new WeakMap(),recentPlayerDamage=new WeakMap();
export function withDamageOrigin(player,kind,source,apply){
 const prior=damageOrigin.get(player);
 damageOrigin.set(player,{kind,source});
 try{return apply();}
 finally{if(prior)damageOrigin.set(player,prior);else damageOrigin.delete(player);}
}
export function recordPlayerDamage(player,before,critical,time,gas=false){
 const damage=before-player.hp;
 if(!(damage>0))return;
 const source=player.damageSource,b=source?.bullet,h=source?.hazard,origin=damageOrigin.get(player);
 const kind=origin?.kind||(gas||b?.gas?'gas':b?.hostileRocket||b?.rocket?'rocket':
  h?.visual==='carpet-bomb'?'bomb':h?.visual==='torpedo-charge'?'mine':
  b?.fieldShell||b?.heavyShell||h?.raidHeavy?'shell':b?.flak?'flak':b?'gun':h?'hazard':'unknown');
 const attack={kind,damage,boss:h?.bossKind||null,pilot:b?.sourcePilot||null,aircraft:origin?.source||b?.sourcePlane||null};
 let history=recentPlayerDamage.get(player);
 if(!history||time<history.at||time-history.at>12)history={at:time,parts:{}};
 history.at=time;
 if(critical?.part==='engine'||critical?.part==='wing')history.parts[critical.part]=time;
 if(player.hp<=0){
  const major=history.major&&time-history.major.at<=12?history.major.attack:null;
  player.downedDamage={attack,major:major&&major.damage>damage?major:null,
   parts:Object.keys(history.parts).filter(part=>time-history.parts[part]<=12)};
  recentPlayerDamage.delete(player);
 }else{
  if(damage>=player.maxHp*.12)history.major={at:time,attack};
  recentPlayerDamage.set(player,history);
 }
}
