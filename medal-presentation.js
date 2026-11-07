import {medalActiveDescription} from './medal-active-copy.js?v=09c75d146ae4289d';
import {PASSIVE_MEDAL_ID,passiveMedalDescription,passiveMedalFaction,passiveMedalName} from './passive-medal-copy.js?v=09c75d146ae4289d';
// Read-only presentation. Ownership, not a selected pilot or preview, enables this copy.
export function ownedMedalActivePresentation(owner,id,base,locale='ko',faction='central'){
 const owned=!!owner?.upgrades?.ironCross&&!!owner.skillEnhanced;
 const enhanced=owned?medalActiveDescription(id,locale,owner):'';
 if(!enhanced)return {description:base||'',appliedLabel:'',enhanced:false};
 const entente=faction==='entente';
 const appliedLabel=locale==='en'?(entente?'Victoria Cross enhancement applied':'Pour le Mérite enhancement applied'):(entente?'빅토리아 십자 강화 적용됨':'푸르 르 메리트 강화 적용됨');
 return {description:enhanced,appliedLabel,enhanced:true};
}

export function ownedMedalPassivePresentation(owner,base,locale='ko',planes={}){
 if(!owner?.upgrades?.[PASSIVE_MEDAL_ID])return {description:base||'',appliedLabel:'',enhanced:false};
 const medal=passiveMedalName(passiveMedalFaction(owner,planes),locale);
 const appliedLabel=locale==='en'?`${medal} enhancement applied`:`${medal} 강화 적용됨`;
 return {description:passiveMedalDescription(owner,locale),appliedLabel,enhanced:true};
}
