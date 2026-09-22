// HEAD-ON player machine-gun FX tiers — visual only, never modifies damage.
// Input: the game's authoritative cumulative MG damage bonus percent.
export function getPlayerMgFxTier(damageBonusPct){
 const pct=Number.isFinite(damageBonusPct)?damageBonusPct:0;
 if(pct>100)return'OVERPOWERED';
 if(pct>=61)return'HIGH_POWER';
 if(pct>=31)return'HOT';
 return'NORMAL';
}
export const MG_TIER_COLUMN=Object.freeze({NORMAL:0,HOT:1,HIGH_POWER:2,OVERPOWERED:3});
export const MG_TIER_ROW=Object.freeze({muzzle:0,tracer:1,hit_air:2,hit_armor:3});
export function mgTierColumn(damageBonusPct){return MG_TIER_COLUMN[getPlayerMgFxTier(damageBonusPct)]}
