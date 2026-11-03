export const HEAVY_AMMUNITION=Object.freeze({
 visualScale:1.5,hitScale:1.3,blastScale:1.3,gasScale:1.4,speedScale:.94,
 gunPierces:2,gunDamageRetention:.7,bossRoundPadding:5.1,
 bombDamageFraction:.7,bombSpeed:520,bombTimeout:.72,bombMinSeparation:95,bombMaxSeparation:210,bombRadiusSpacing:1.5
});

export const ammunitionVisualScale=owner=>owner?.upgrades?.prototypeAmmo?HEAVY_AMMUNITION.visualScale:1;
export const ammunitionBlastRadius=(owner,radius)=>owner?.upgrades?.prototypeAmmo?radius*HEAVY_AMMUNITION.blastScale:radius;
export const ammunitionGasRadius=(owner,radius)=>owner?.upgrades?.prototypeAmmo?radius*HEAVY_AMMUNITION.gasScale:radius;

function gunRound(round){
 return !round.rocket&&!round.hostileRocket&&!round.cow37&&!round.motorCannon&&
  !round.flechette&&!round.fieryGrapnel&&!round.mauserRound&&!round.synthesisChild&&
  !round.fieldShell&&!round.heavyShell&&!round.flak&&!round.grenade&&!round.explosionDamage;
}

export function prepareHeavyRound(owner,round){
 if(!owner||round.enemy||round.patrol||round.ownerId!=null&&round.ownerId!==(owner.id||'p1')||round.actualExplosion||round.blast||round.gas||round.burnTick||!(round.vx||round.vy)||round.heavyRoundPrepared)return;
 if(!owner.upgrades?.prototypeAmmo&&!owner.upgrades?.steelCore)return;
 round.heavyRoundPrepared=true;
 if(owner.upgrades.prototypeAmmo){
  round.ammunitionScale=HEAVY_AMMUNITION.visualScale;
  // Ordinary rounds have no explicit projectile padding. Their swept hit test
  // uses the target's shape, so scale that shape in the narrow phase as well.
  round.ammunitionHitScale=HEAVY_AMMUNITION.hitScale;
  round.collisionRadius=(round.collisionRadius||0)*HEAVY_AMMUNITION.hitScale;
 }
 if(owner.upgrades.steelCore&&gunRound(round)){
  round.steelCoreRemaining=HEAVY_AMMUNITION.gunPierces;
  round.steelCoreDamage=1;
  round.pierce=true;
 }
}

export function ammunitionPartPadding(round){
 return round?.collisionRadius||(round?.ammunitionHitScale?HEAVY_AMMUNITION.bossRoundPadding:0);
}

export function ammunitionTargetKey(round,target){
 return (round.steelCoreRemaining!=null||round.steelCoreBlast)&&target.stageBossBody||target;
}

export function advanceSteelRound(world,round,contact){
 if(round.steelCoreRemaining==null)return;
 const remaining=round.steelCoreRemaining--;
 round.pierce=remaining>0;
 if(!round.pierce)return;
 round.steelCoreDamage*=HEAVY_AMMUNITION.gunDamageRetention;
 const t=Number.isFinite(contact)?contact:1,x0=round.previousX??round.x,y0=round.previousY??round.y;
 const fx=world.combatFX??=[];
 if(fx.length<160)fx.push({
  x:x0+(round.x-x0)*t,y:y0+(round.y-y0)*t,radius:22,
  direction:Math.atan2(round.vy,round.vx),steelPenetration:true,fxOnly:true,life:.19,maxLife:.19
 });
}
