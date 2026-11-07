import {pilotIdentityCopy} from './pilot-identity-copy.js?v=09c75d146ae4289d';

// Capital-clear rewards are player identities, not additions to the random ace pool.
// Their airframes are installed by the common pilot-aircraft registry immediately after this.
export const CAPITAL_PILOT_IDENTITIES=Object.freeze({
 friedrich_karl:Object.freeze({name:'프리드리히 카를',alias:'PRINCE OF PRUSSIA',faction:'central',portrait:34,cooldown:23,enemyAce:false}),
 robinson:Object.freeze({name:'윌리엄 리프 로빈슨',alias:'THE DEFENDER OF LONDON',faction:'entente',portrait:35,cooldown:24,enemyAce:false})
});

export function installCapitalPilotRoster(planes,weapons,pilots,mapping,profiles,configure){
 for(const base of ['prinz_friedrich_albatros_d1','re7'])if(!planes[base]||!weapons[base])throw new Error('Missing capital pilot airframe: '+base);
 for(const [id,identity] of Object.entries(CAPITAL_PILOT_IDENTITIES)){
  const copy=pilotIdentityCopy(id,'ko');
  if(!copy)throw new Error('Missing capital pilot copy: '+id);
  pilots[id]={...identity,skill:copy.skill,passive:copy.passive,desc:copy.activeDetail,passiveDesc:copy.passiveDetail};
 }
}
