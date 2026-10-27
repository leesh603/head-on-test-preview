// Presentation metadata only. Weak keys never enter the co-op snapshot or RNG.
const results=new WeakMap();
export function recordCombatImpact(round,target,result){
 if(round&&typeof round==='object')results.set(round,{target,...result});
 return result;
}
export function combatImpactResult(round,target){
 const result=results.get(round);return result?.target===target?result:null;
}
