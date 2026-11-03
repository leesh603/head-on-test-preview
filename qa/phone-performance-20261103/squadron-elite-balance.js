/** Bounded elite pressure: durability and counterplay timings stay unit-specific. */
const elapsed=g=>Math.max(0,Number.isFinite(g?.t)?g.t:0);
export const SQUADRON_ELITE_BALANCE=Object.freeze({damageRampSeconds:300,maxDamageBonus:2,cannonRampSeconds:500,maxCannonBonus:1.2,courierMaxBonus:.25});
export const squadronDamage=(g,base)=>Math.max(Math.round(base*(1+Math.min(2,elapsed(g)/300))),Math.round(base*(1+elapsed(g)/240)*1.10));
export const squadronCannonDamage=(g,base)=>Math.round(base*(1+Math.min(1.2,elapsed(g)/500)));
// Rescue pressure has its own low ceiling: never apply fighter damage scaling to an 80HP courier.
export const squadronCourierDamage=(g,base=8)=>Math.round(base*(1+Math.min(.25,elapsed(g)/2400)));
