import {pilotIdentityCopy} from './pilot-identity-copy.js?v=capital-final-20261030';

// Register the two approved identities before loadout and ace lifecycle setup.
// Portraits and aircraft are independently authored assets, not atlas stand-ins.
export const NEW_PILOT_IDENTITIES=Object.freeze({
 navarre:Object.freeze({name:'장 나바르',alias:'THE SENTINEL OF VERDUN',faction:'entente',portrait:32,cooldown:22,enemyAce:false}),
 frommherz:Object.freeze({name:'헤르만 프롬헤르츠',alias:'THE BLUE MOUSE',faction:'central',portrait:33,cooldown:20,enemyAce:false})
});
export function registerNavarreFrommherz(pilots){
 for(const [id,identity] of Object.entries(NEW_PILOT_IDENTITIES)){
  const copy=pilotIdentityCopy(id,'ko');
  if(!copy)throw new Error('Missing new pilot identity copy: '+id);
  pilots[id]={...identity,skill:copy.skill,passive:copy.passive,desc:copy.activeDetail,passiveDesc:copy.passiveDetail};
 }
}
