/** Bounded elite pressure: durability and counterplay timings stay unit-specific. */
import {combatStatTime,combatDamageTime} from './front-performance.js?v=09c75d146ae4289d';
const elapsed=combatStatTime;
export const SQUADRON_ELITE_BALANCE=Object.freeze({hpMultiplier:2.8,rescueHpMultiplier:2.25,damageMultiplier:1.35,cannonMultiplier:1.25,damageRampSeconds:300,maxDamageBonus:2,cannonRampSeconds:500,maxCannonBonus:1.2,courierMaxBonus:.25});
const boundedSquadronDamage=(g,base)=>Math.min(Math.round(base*(1+SQUADRON_ELITE_BALANCE.maxDamageBonus)),Math.max(Math.round(base*(1+Math.min(SQUADRON_ELITE_BALANCE.maxDamageBonus,combatDamageTime(g)/SQUADRON_ELITE_BALANCE.damageRampSeconds))),Math.round(base*(1+combatDamageTime(g)/240)*1.10)));
const boundedSquadronCannonDamage=(g,base)=>Math.round(base*(1+Math.min(SQUADRON_ELITE_BALANCE.maxCannonBonus,combatDamageTime(g)/SQUADRON_ELITE_BALANCE.cannonRampSeconds)));
// Rescue pressure has its own low ceiling: never apply fighter damage scaling to an 80HP courier.
export const squadronCourierDamage=(g,base=8)=>Math.round(base*(1+Math.min(.25,elapsed(g)/2400)));

// Keep the existing late-run cap while making early patrols harder to erase.
export const squadronDurability=g=>SQUADRON_ELITE_BALANCE.hpMultiplier*Math.min(2,1+elapsed(g)/500)*(g.players?1.25:1);

export const squadronHp=(g,base,rescue=false)=>Math.round(base*(rescue?SQUADRON_ELITE_BALANCE.rescueHpMultiplier*(g.players?1.25:1):squadronDurability(g)));
export const squadronDamage=(g,base)=>Math.round(SQUADRON_ELITE_BALANCE.damageMultiplier*boundedSquadronDamage(g,base));
export const squadronCannonDamage=(g,base)=>Math.round(SQUADRON_ELITE_BALANCE.cannonMultiplier*boundedSquadronCannonDamage(g,base));
