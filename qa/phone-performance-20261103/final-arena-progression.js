// Plain serializable route bookkeeping. The host adapter owns map entry, combat and rewards.
export function createFinalArenaProgression(enabled=false,runId='sortie') {
  return {enabled:!!enabled,runId:String(runId||'sortie'),phase:'none',token:null,serial:0,loopIndex:null,completedId:null,completedStages:[],lastCompletedToken:null,capitalReceipt:null};
}
export function recordFinalArenaStage(state,{order,stageIndex,loopIndex,completedId}) {
  if(!state?.enabled||state.phase!=='none')return false;
  if(!order.includes(stageIndex))return false;
  if(!state.completedStages.includes(stageIndex))state.completedStages.push(stageIndex);
  // Ordinary route completion is not a secret-boss credential. A separately
  // registered capital FINAL encounter must emit its verified defeat receipt.
  return false;
}
// Called only by the authoritative registered-capital adapter after its defeat
// sequence. Eligibility alone (including historical completion) cannot open a run.
export function requestFinalArenaAfterCapital(state,{runId,playerFaction,capitalId,encounterId,eligible,loopIndex},blocked=false) {
  if(blocked||!state?.enabled||state.phase!=='none'||eligible!==true)return false;
  if(runId!==state.runId||!['central','entente'].includes(playerFaction)||typeof capitalId!=='string'||!capitalId||typeof encounterId!=='string'||!encounterId||!Number.isInteger(loopIndex)||loopIndex<0)return false;
  state.phase='pending';state.loopIndex=loopIndex;state.completedId=encounterId;
  state.capitalReceipt={runId,playerFaction,capitalId,encounterId};
  state.token=`${state.runId}:final-arena:${loopIndex}:${state.serial++}`;
  return true;
}
export function startFinalArenaProgression(state,token,blocked=false) {
  if(blocked||!state?.enabled||state.phase!=='pending'||!token||token!==state.token)return false;
  state.phase='active';return true;
}
export function completeFinalArenaProgression(state,token,blocked=false) {
  if(blocked||!state?.enabled||state.phase!=='active'||!token||token!==state.token)return false;
  state.phase='cleared';return true;
}
export function resetFinalArenaRoute(state,{completed=false}={}) {
  if(!state)return;
  if(completed)state.lastCompletedToken=state.token;
  state.phase='none';state.token=null;state.loopIndex=null;state.completedId=null;state.completedStages=[];state.capitalReceipt=null;
}
export function snapshotFinalArena(state) {
  return state?{...state,completedStages:[...state.completedStages],capitalReceipt:state.capitalReceipt?{...state.capitalReceipt}:null}:null;
}
