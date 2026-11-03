// Only real, owner-fired replacement shells enter this bridge. Copies and
// secondary payloads never inherit permission to spend a pilot's preparation.
const rounds=new WeakMap(),volleys=new WeakMap();let serial=0;
const owner=p=>p.id??'p1';
const excluded=b=>['enemy','ally','patrol','formation','transferGun','rocket','motorCannon','mauserRound','actualExplosion','blast','identityDot','identityChain','tacticalRound','passiveMedalSecondary','synthesisChild','synthesisSupport','secondaryExplosion'].some(k=>b[k]);
export function prepareReplacementPrimary(p,b,volley={}){
 if(!b?.cow37||!b.synthesisPrimary||excluded(b)||(b.ownerId??'p1')!==owner(p)||p.state!=='playing'||!(p.hp>0)||p.status==='downed'||p.mission?.unarmed)return b;
 if(rounds.has(b))return b;
 if(!volley||typeof volley!=='object')volley={};
 let group=volleys.get(volley);if(!group){group={owner:p,id:++serial};volleys.set(volley,group);}if(group.owner!==p)return b;
 rounds.set(b,{owner:p,volley});b.pilotPrimary=true;b.pilotPrimaryVolley=group.id;
 return b;
}
export function isReplacementPrimary(p,b){return !!b?.cow37&&!!b.synthesisPrimary&&!excluded(b)&&(b.ownerId??'p1')===owner(p)&&rounds.get(b)?.owner===p;}
export function replacementPrimaryVolley(p,b){return isReplacementPrimary(p,b)?rounds.get(b).volley:null;}
