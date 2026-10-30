/** Host-owned bonus drafts; no alternate equipment catalog or application path. */
const terminal=g=>['lost','won'].includes(g.state);
const authority=g=>!(g.online&&!g.host);
const living=g=>(g.players||[g]).some(p=>p.hp>0&&(!p.status||p.status==='alive'));
const queue=g=>(g.intrusionEquipmentRewards||=[]);

export function enqueueIntrusionEquipmentReward(g,encounterId){
 if(!encounterId||!authority(g)||terminal(g)||!living(g))return false;
 const receipts=g.intrusionEquipmentReceipts||(g.intrusionEquipmentReceipts={});
 if(Object.hasOwn(receipts,encounterId))return false;
 receipts[encounterId]=true;
 // Existing co-op XP/upgrade policy includes a temporarily downed teammate.
 for(const p of g.players||[g])queue(g).push({encounterId,playerId:p.id||null,status:'pending'});
 return true;
}

/** Call only after combat/loss settlement. Full inventories use a two-step replacement. */
export function flushIntrusionEquipmentRewards(g){
 if(!authority(g))return false;
 if(terminal(g)||!living(g)){
  for(const item of queue(g))if(item.status==='pending')item.status='cancelled';
  return false;
 }
 if(g.state!=='playing'||g.activeUpgrade||g.pendingLevelUps?.length||g.pendingTacticalChoice||g.activeIntrusionEquipmentReward)return false;
 let opened=false;
 for(const item of queue(g)){
  if(item.status!=='pending')continue;
  const p=g.players?g.players.find(p=>p.id===item.playerId):g;
  if(!p){item.status='cancelled';continue;}
  const replacement=p.legendaryCount?.()>=4;
  const offers=p.rollSpecialRewardChoices?.({replacement})||[],choices=replacement?[...offers,{id:'intrusion:skip',intrusionAction:true,name:'보상 포기'}]:offers;
  if(!offers.length){item.blockedReason='no-eligible-equipment';continue;}
  delete item.blockedReason;item.status='offered';
  if(g.players){
   g.pendingLevelUps.push({id:++g.upgradeSequence,playerId:p.id,level:p.level,kind:'intrusion-equipment',encounterId:item.encounterId,choices,replacement,offers,phase:'offer'});
  }else{
   g.activeIntrusionEquipmentReward={encounterId:item.encounterId,choices,replacement,offers,phase:'offer'};
   g.state='upgrade';g.event?.('upgrade','난입 보스 격추 · 특수장비 획득');
  }
  opened=true;
  if(!g.players)break;
 }
 if(opened&&g.players)g.openUpgrade();
 return opened;
}

/** Called only after the ordinary upgrade implementation succeeds. */
export function completeIntrusionEquipmentReward(p,id){
 const g=p.world||p;
 const draft=g.players?g.activeUpgrade:p.activeIntrusionEquipmentReward;
 if(!draft||g.players&&draft.kind!=='intrusion-equipment'||g.players&&draft.playerId!==p.id||!draft.choices?.some(c=>c.id===id))return false;
 const item=queue(g).find(q=>q.encounterId===draft.encounterId&&q.playerId===(p.id||null)&&q.status==='offered');
 if(!item)return false;
 item.status='acquired';item.equipmentId=id;
 if(!g.players)delete p.activeIntrusionEquipmentReward;
 return true;
}

/** Return pending/complete/false; the co-op world owns queue advancement. */
export function chooseIntrusionEquipmentReward(p,id){
 const g=p.world||p,draft=g.players?g.activeUpgrade:p.activeIntrusionEquipmentReward;
 if(!authority(g)||terminal(g)||g.state!=='upgrade'||!draft?.replacement||g.players&&draft.playerId!==p.id||!draft.choices.some(c=>c.id===id))return false;
 const receipt=queue(g).find(q=>q.encounterId===draft.encounterId&&q.playerId===(p.id||null)&&q.status==='offered');
 if(!receipt)return false;
 if(id==='intrusion:skip'){
  receipt.status='declined';if(!g.players){delete p.activeIntrusionEquipmentReward;p.state='playing';p.checkLevel();}return 'complete';
 }
 if(draft.phase==='offer'){
  const pick=draft.offers.find(c=>c.id===id);if(!pick)return false;
  draft.selectedId=id;draft.phase='replace';draft.revision=(draft.revision||0)+1;
  const owned=p.specialEquipmentItems();draft.legacyEquipment=owned.some(u=>!p.equipmentRemovable(u.id));
  draft.choices=owned.filter(u=>p.canReplaceEquipment(u.id,id)).map(u=>({...u,id:'intrusion:replace:'+u.id,equipmentId:u.id}));
  draft.choices.push({id:'intrusion:skip',intrusionAction:true,name:'보상 포기'});return 'pending';
 }
 const oldId=id.startsWith('intrusion:replace:')?id.slice('intrusion:replace:'.length):null;
 if(!oldId||!p.canReplaceEquipment(oldId,draft.selectedId))return false;
 // Roll back all owner state and touched world arrays if application ever fails.
 const snapshot={...p,upgrades:{...p.upgrades},upgradeRarities:{...p.upgradeRarities},equipmentLedger:JSON.parse(JSON.stringify(p.equipmentLedger)),weapon:{...p.weapon},ammo:[...p.ammo],bomberTransfer:p.bomberTransfer?JSON.parse(JSON.stringify(p.bomberTransfer)):undefined};
 const worldSnapshot={allies:(g.allies||[]).map(a=>({...a})),friendlyBombs:g.friendlyBombs,events:[...(g.events||[])],intrusionEquipmentRewards:JSON.parse(JSON.stringify(queue(g)))},previousChoices=draft.choices;
 const pick=draft.offers.find(c=>c.id===draft.selectedId);draft.choices=[pick];
 let success=false;try{success=p.removeEquipment(oldId)&&p.upgrade(pick.id,'legendary');}catch{success=false;}
 if(!success){for(const key of Object.keys(p))if(!Object.hasOwn(snapshot,key))delete p[key];Object.assign(p,snapshot);Object.assign(g,worldSnapshot);draft.choices=previousChoices;return false;}
 receipt.replacedId=oldId;return 'complete';
}
