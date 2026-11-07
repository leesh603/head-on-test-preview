// Read the existing objective owners. This module does not create missions,
// change their rewards, or add another Game.prototype update wrapper.
const unit=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):null;
const cancelled=new Set(['regionChanged','bossArrived','facilityCancelled']);

export function beginFrontStage(game){
 const stages=game.stageBoss?.stages,front=stages?.front;
 if(!front)return null;
 return front.missions={stageIndex:stages.stageIndex,loopIndex:stages.loopIndex,
  lastResultId:game.battlefieldEvents?.result?.id??null,ignoredId:null,
  completed:0,failed:0,lastOutcome:null};
}

export function observeFrontMissions(game){
 const stages=game.stageBoss?.stages,front=stages?.front;
 if(!front||['operation-active','operation-offer','final-arena','front-complete'].includes(stages.phase))return null;
 let ledger=front.missions;
 if(!ledger||ledger.stageIndex!==stages.stageIndex||ledger.loopIndex!==stages.loopIndex)ledger=beginFrontStage(game);
 const events=game.battlefieldEvents,current=events?.current,result=events?.result;
 // Merely surviving an ambient weather event is not a completed objective.
 if(current?.ambient)ledger.ignoredId=current.id;
 if(!result?.id||result.id===ledger.lastResultId)return ledger;
 ledger.lastResultId=result.id;
 if(result.id===ledger.ignoredId||cancelled.has(result.reason))return ledger;
 if(result.outcome==='completed')ledger.completed++;
 else if(result.outcome==='failed')ledger.failed++;
 // Optional cargo/facility misses deliberately carry no failure penalty.
 else return ledger;
 ledger.lastOutcome=result.outcome==='completed'?1:0;
 return ledger;
}

export function frontMissionResult(game){
 const stages=game.stageBoss?.stages,stage=stages?.stageIndex;
 const ledger=observeFrontMissions(game)||stages?.front?.missions;
 const count=(ledger?.completed||0)+(ledger?.failed||0);
 let mission=count?ledger.lastOutcome:null,missionRate=count?ledger.completed/count:null;
 if(stage===19&&game.laonBattle?.resolved){
  mission=Number(game.laonBattle.success);missionRate=mission;
 }else if(stage===17&&game.doverMission?.resolved){
  const m=game.doverMission,central=m.faction==='central';
  mission=Number(m.success);missionRate=unit((central?m.arrived:m.shotDown)/Math.max(1,central?m.config.escortGoal:m.config.interceptGoal));
 }else if(stage===4){
  const battle=game.cityDefenseRaid?.raid?game.cityDefenseRaid:game.londonBattle;
  const districts=battle?.districts||[],capacity=districts.reduce((sum,d)=>sum+(d.maxHp||0),0);
  if(capacity>0){mission=Number(districts.some(d=>d.hp>0));missionRate=unit(districts.reduce((sum,d)=>sum+Math.max(0,d.hp||0),0)/capacity);}
 }else if(stage===7&&game.zeebruggeRaid?.done){
  const operation=game.zeebruggeRaid;
  mission=Number(operation.scuttled>0);missionRate=unit(operation.scuttled/Math.max(1,operation.ships.length));
 }else if(stage===15&&game.parisBattle?.role==='defend'){
  const battle=game.parisBattle;
  mission=Number(battle.cityDamage<battle.damageLimit);missionRate=unit(1-battle.cityDamage/Math.max(1,battle.damageLimit));
 }
 return {mission,missionRate,completed:ledger?.completed||0,failed:ledger?.failed||0};
}

// A front's difficulty follows its completed maps, not minutes spent circling
// or choosing upgrades. Repeated fronts increase gradually and stop scaling.
export function frontBossBalance(stages,elapsed=0){
 const loop=Math.max(0,Math.min(3,Math.floor(Number(stages?.loopIndex)||0)));
 const position=Math.max(0,Math.min(9,Number(stages?.orderPosition)||0));
 const risk=stages?.front?Math.max(1,Math.min(4,Math.round(Number(stages.front.risk)||2))):2;
 const time=stages?.front?75+position*155:Math.max(0,Math.min(1800,Number(elapsed)||0));
 return {time,loop,hp:(1+loop*.18)*[.9,1,1.08,1.15][risk-1],damage:(1+loop*.07)*[.9,1,1.06,1.12][risk-1]};
}

// Stat inputs only: never substitute these for the simulation clock. Coop
// pilot objects use their host world so both seats see the same progression.
export function combatStatTime(game){
 const world=game?.world||game;
 return frontBossBalance(world?.stageBoss?.stages,world?.t).time;
}
export const combatDamageTime=game=>Math.min(600,combatStatTime(game));
export function combatLoopHp(game){
 const world=game?.world||game,loop=Number(world?.stageBoss?.stages?.loopIndex)||0;
 return 1+Math.max(0,Math.min(3,Math.floor(loop)))*.18;
}
