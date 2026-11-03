import {TACTICAL_DOCTRINES,COMPOSITE_TACTICS,SPECIAL_DOCTRINES,availableTacticalEntries} from './tactical-doctrines.js?v=tactics20261023&td4=20261026';

const entries=[...TACTICAL_DOCTRINES,...COMPOSITE_TACTICS,...SPECIAL_DOCTRINES];
const selected=(p,d)=>d.specialDoctrine?!!p.upgrades?.[d.id]:d.family?p.weaponMods?.[d.family]===d.value:p.compositeTactic===d.id;

// Presentation-only snapshots: no combat state, RNG or network commands change.
// The first snapshot is deliberately quiet (load/reconnect is not an unlock).
export function createTacticalNoticeTracker(){
 let run=null,runId=null;const owners=new Map();
 return game=>{
  if(run!==game||runId!==game?.runId){run=game;runId=game?.runId;owners.clear();}
  const notices=[];
  // A guest's constructor is only an empty placeholder. Prime from its first
  // authoritative snapshot (also after reconnect), not from that placeholder.
  if(game?.online&&!game.host&&game._netHaveBase===false){owners.clear();return notices;}
  for(const p of game?.players||[game]){
   if(!p||game.online&&p.id!==game.localPlayerId)continue;
   const ownerId=p.id||'solo',available=availableTacticalEntries(p),adopted=entries.filter(d=>selected(p,d));
   let seen=owners.get(ownerId);
   if(!seen){owners.set(ownerId,{available:new Set(available.map(d=>d.id)),adopted:new Set(adopted.map(d=>d.id))});continue;}
   for(const entry of adopted)if(!seen.adopted.has(entry.id)){
    seen.adopted.add(entry.id);notices.push({kind:'adopted',entry,ownerId:p.id});
   }
   const groups=new Map();
   for(const entry of available)if(!seen.available.has(entry.id)){
    seen.available.add(entry.id);
    const key=entry.family||'composite';if(!groups.has(key))groups.set(key,{kind:'unlocked',entry,family:entry.family,ownerId:p.id,ids:[]});
    groups.get(key).ids.push(entry.id);
   }
   notices.push(...groups.values());
  }
  return notices;
 };
}
