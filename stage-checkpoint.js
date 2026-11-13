import {createFront,frontLength} from './dynamic-front.js';
// Solo checkpoints contain entry-time pilot/build data, never a live battlefield.
import {achievementRun,syncPilotKills,primePilotKills} from './achievements.js?v=pandemonium394r2';
import {pilotUnlockRun} from './pilot-unlocks.js?v=pilot-unlocks-shared1';
import {STAGES} from './headon-stageboss-patterns.js?v=bomb19&rail=42&ai=1018&sig=1019&boss=20261020b&somme=20261021&cambrai=20261021&phase=1021&cityart=20261022&harbor=20261021&zb=20261103&ho=20261111';
import {SPECIAL_OPERATIONS,SPECIAL_OPERATION_AFTER} from './special-operations.js?v=tension20261107';
import {reconcileSecretWeapons} from './secret-weapons.js';
export const STAGE_CHECKPOINT_KEY='headon.stage-checkpoint.v1';
const STAGE_PHASES=['explore','final-arena','front-complete','operation-offer','operation-active'];
const VERSION=1,MAX_BYTES=512*1024,cache=new WeakMap();
const unsafe=new Set(['__proto__','prototype','constructor','g','p','world','book','target','leader','members','_netCarrierFocus','_netCarrierGuard']);
const objects=new Set(['weapon','ammo','upgrades','upgradeRarities','weaponMods','weaponModSelections','weaponModCounts','buildIdentities','equipmentLedger','secretWeaponState','bomberTransfer','pilotIdentity','pilotSignatureState','specialAmmoQueue','allies','formationWings','bossDeck','aceSortie','rivalAce','pilotChallengeRecord']);
const recordObjects=new Set(['clears','missions','missionTypes','routeClears','routeOrder','sessionAwards','low','recoveries','packet','rapid','escortKinds']);
const excluded=new Set(['state','mode','online','testMode','region','stageStartTime','stageStartDistance','zeroDistrict','finalArenaVisible','checkpointSaved']);
const scalar=v=>v===null||['string','number','boolean'].includes(typeof v);
function pack(v,depth=0){
 if(depth>12)return undefined;
 if(typeof v==='number'&&!Number.isFinite(v))return {$number:String(v)};
 if(scalar(v))return v;
 if(v instanceof Set)return {$set:[...v].filter(scalar).map(x=>pack(x,depth+1))};
 if(v instanceof Map)return {$map:[...v].filter(([k])=>scalar(k)).map(([k,x])=>[pack(k,depth+1),pack(x,depth+1)]).filter(([,x])=>x!==undefined)};
 if(Array.isArray(v))return v.map(x=>pack(x,depth+1)).filter(x=>x!==undefined);
 if(!v||Object.getPrototypeOf(v)!==Object.prototype)return undefined;
 const result={};for(const[k,x]of Object.entries(v)){if(unsafe.has(k)||k.startsWith('_net')||k==='active'&&x&&typeof x==='object')continue;const p=pack(x,depth+1);if(p!==undefined)result[k]=p;}return result;
}
function unpack(v,depth=0){
 if(depth>14)throw Error('Checkpoint too deep');
 if(scalar(v))return v;
 if(Array.isArray(v))return v.map(x=>unpack(x,depth+1));
 if(!v||typeof v!=='object')throw Error('Invalid checkpoint data');
 if(Object.hasOwn(v,'$number')){if(!['Infinity','-Infinity','NaN'].includes(v.$number))throw Error('Invalid checkpoint number');return Number(v.$number);}
 if(Object.hasOwn(v,'$set'))return new Set(unpack(v.$set,depth+1));
 if(Object.hasOwn(v,'$map'))return new Map(unpack(v.$map,depth+1));
 const result={};for(const[k,x]of Object.entries(v)){if(unsafe.has(k))continue;result[k]=unpack(x,depth+1);}return result;
}
function captureFields(p,allowed){
 const result={};for(const[k,v]of Object.entries(p)){if(unsafe.has(k)||excluded.has(k)||k.startsWith('_'))continue;if(scalar(v)||allowed.has(k)){const value=pack(v);if(value!==undefined)result[k]=value;}}return result;
}
function restoreFields(p,data,allowed){
 for(const[k,v]of Object.entries(unpack(data))){if(unsafe.has(k)||excluded.has(k)||k.startsWith('_')||typeof p[k]==='function')continue;if(scalar(v)||allowed.has(k))p[k]=v;}
}
const solo=g=>!!g&&!g.testMode&&!g.online&&!['coop2','campaign'].includes(g.mode);
export function checkpointStorage(){try{return globalThis.localStorage||null;}catch{return null;}}
export function readStageCheckpoint(storage=checkpointStorage()){
 try{
  const raw=storage?.getItem(STAGE_CHECKPOINT_KEY);if(!raw||raw.length>MAX_BYTES)return null;
  const s=JSON.parse(raw),stage=s.stage,p=s.player;
  if(s.version!==VERSION||typeof s.pilot!=='string'||typeof s.plane!=='string'||!p||p.pilot!==s.pilot||p.plane!==s.plane||!(p.hp>0)||!(p.maxHp>=p.hp)||!Number.isFinite(p.t)||p.t<0)return null;
  if(!stage||!STAGE_PHASES.includes(stage.phase)||!Number.isInteger(stage.stageIndex)||stage.stageIndex<0||stage.stageIndex>=STAGES.length||!Number.isInteger(stage.loopIndex)||stage.loopIndex<0||![0,1].includes(stage.capitalRound)||!Array.isArray(stage.order)||!stage.order.length||stage.order.some(n=>!Number.isInteger(n)||n<0||n>=STAGES.length)||new Set(stage.order).size!==stage.order.length||(!stage.order.includes(stage.stageIndex)&&stage.phase!=='operation-active'))return null;
  if(!Number.isInteger(stage.orderPosition)||stage.orderPosition<0||stage.orderPosition>=stage.order.length)return null;
  if(stage.front&&(![10,12].includes(stage.front.length??12)||![11,18].includes(stage.front.capital)||!Number.isInteger(stage.front.seed)))return null;
  if(stage.phase.startsWith('operation-')){
   const op=stage.operation;
   const validOrder=stage.front?[SPECIAL_OPERATION_AFTER+1,frontLength(stage.front)].includes(stage.order.length):stage.order.length===10;
   if(!op||stage.orderPosition!==SPECIAL_OPERATION_AFTER||!validOrder||!Array.isArray(op.choices)||op.choices.length<1||op.choices.length>2)return null;
   if(new Set(op.choices.map(c=>c.id)).size!==op.choices.length||op.choices.some(c=>!Object.hasOwn(SPECIAL_OPERATIONS,c.id)||!Number.isInteger(c.stageIndex)||!SPECIAL_OPERATIONS[c.id].maps.includes(STAGES[c.stageIndex])||c.id!=='cargo'&&stage.order.includes(c.stageIndex)))return null;
   if(stage.phase==='operation-active'&&(op.phase!=='active'||!op.choices.some(c=>c.id===op.id&&c.stageIndex===stage.stageIndex)))return null;
   if(stage.phase==='operation-offer'&&op.phase!=='offer')return null;
  }
  // Existing entry checkpoints retain their current stage. An older route gains
  // Laon before Paris without replaying any region already behind the pilot.
  const laon=STAGES.indexOf('laon'),paris=stage.order.indexOf(STAGES.indexOf('paris-night'));
  if(laon>=0&&paris>=0&&!stage.order.includes(laon)){stage.order.splice(paris,0,laon);stage.orderPosition=stage.order.indexOf(stage.stageIndex);}
  if(typeof s.runId!=='string'||!s.runId||!s.addon||!Number.isFinite(s.addon.time)||!Number.isInteger(s.addon.serial)||s.addon.serial<0)return null;
  if(stage.phase==='final-arena'&&(!stage.finalArena?.token||stage.finalArena.phase!=='pending'))return null;
  unpack(s.player);return s;
 }catch{return null;}
}
export function persistStageCheckpoint(g,storage=checkpointStorage()){
 try{const raw=cache.get(g);if(!raw||!storage)return false;storage.setItem(STAGE_CHECKPOINT_KEY,raw);return storage.getItem(STAGE_CHECKPOINT_KEY)===raw;}catch{return false;}
}
export function saveStageCheckpoint(g,storage=checkpointStorage()){
 const stages=g?.stageBoss?.stages;
 if(!solo(g)||!(g.hp>0)||!stages||!STAGE_PHASES.includes(stages.phase))return false;
 try{
  syncPilotKills(g);
  const r=achievementRun(g),u=pilotUnlockRun(g),us=u?.state(g);
  const stage={stageIndex:stages.stageIndex,loopIndex:stages.loopIndex,order:[...stages.order],orderPosition:stages.orderPosition,capitalRound:stages.capitalRound,phase:stages.phase,operationsEnabled:!!stages.operationsEnabled,operation:pack(stages.operation),front:pack(stages.front),finalArena:pack(stages.finalArena)};
  if(stage.phase==='final-arena')stage.finalArena.phase='pending';
  const snapshot={version:VERSION,savedAt:Date.now(),pilot:g.pilot,plane:g.plane,runId:g.stageBoss.runId,player:captureFields(g,objects),stage,addon:{time:g.stageBoss.time,serial:g.stageBoss.serial},achievements:r?captureFields(r,recordObjects):null,unlocks:us?captureFields(us,recordObjects):null,unlockRunId:u?.runId};
  const raw=JSON.stringify(snapshot);if(raw.length>MAX_BYTES)return false;cache.set(g,raw);return persistStageCheckpoint(g,storage);
 }catch(error){console.error('[HEAD-ON] Stage checkpoint failed',error);return false;}
}
export function restoreStageCheckpoint(g,s){
 if(!solo(g)||!g.stageBoss||s?.version!==VERSION||g.pilot!==s.pilot||g.plane!==s.plane)return false;
 try{
  // Keep old ten-map checkpoints and their chosen route, while allowing the
  // normal updated mode to stop at its capital and use the new next loop.
  const requestedOperations=!!g.specialOperations,legacyFront=!!s.stage.front&&s.stage.front.length==null;
  const upgradeFront=!!g.dynamicFront&&!s.stage.front&&s.stage.operationsEnabled&&s.stage.order.length===10;
  // A fresh constructor may roll a different starting doctrine. Remove its
  // optional pilot/build fields before restoring the saved computed values.
  for(const[k,v]of Object.entries(g))if(!unsafe.has(k)&&!excluded.has(k)&&!k.startsWith('_')&&(scalar(v)||objects.has(k))&&!Object.hasOwn(s.player,k))delete g[k];
  restoreFields(g,s.player,objects);
  reconcileSecretWeapons(g,{announce:false});
  g.synthesisPending=[];g.synthesisGunPending=[];g.synthesisActivePending=[];g.synthesisAttachments=[];g.synthesisZones=[];g.synthesisBurst=0;g.synthesisSignature=null;
  if(g.aceSortie){g.aceSortie.active=new Map();g.aceSortie.pending=[];}
  if(g.rivalAce){g.rivalAce.active=null;if(g.rivalAce.phase!=='DEFEATED'){g.rivalAce.phase='ESCAPED';g.rivalAce.returnAt=g.t+5;}}
  const addon=g.stageBoss,stages=addon.stages;addon.runId=s.runId;addon.time=s.addon.time;addon.serial=s.addon.serial;
  Object.assign(stages,s.stage,{order:[...s.stage.order],encounter:null,operationsEnabled:!!s.stage.operationsEnabled,operation:s.stage.operation?unpack(s.stage.operation):null,front:s.stage.front?unpack(s.stage.front):null,finalArena:unpack(s.stage.finalArena)});
  if(upgradeFront){stages.front=createFront(stages.teamFaction,((s.addon.serial+1)*2654435761)>>>0);stages.front.operationStage=stages.operation?.stageIndex??null;g.dynamicFront=true;}
  // This flag governs future offers. An already selected operation can finish
  // even when the current launch explicitly opts out of further operations.
  if(upgradeFront||legacyFront){stages.operationsEnabled=requestedOperations;g.specialOperations=requestedOperations;}
  if(stages.front&&stages.operation?.stageIndex!=null)stages.front.operationStage=stages.operation.stageIndex;
  // Rebuild routes, hazards and map owners through the existing stage adapter.
  addon.hooks.onStageChange({stageIndex:stages.stageIndex,loopIndex:stages.loopIndex});
  if(stages.phase==='final-arena')addon.hooks.onFinalArenaPending();
  g.events=[];g.state=['front-complete','operation-offer'].includes(stages.phase)?stages.phase:'playing';
  if(g.state==='front-complete')g.frontCompletion={loopIndex:stages.loopIndex,score:g.frontScore||0,stageCount:frontLength(stages.front),specialOperations:!!stages.operation};g.invuln=Math.max(g.invuln||0,1.5);
  const r=achievementRun(g);if(r&&s.achievements)restoreFields(r,s.achievements,recordObjects);
  const u=pilotUnlockRun(g);if(u&&s.unlocks){u.runId=s.unlockRunId||u.runId;const us=u.state(g);restoreFields(us,s.unlocks,recordObjects);g.pilotChallengeRecord=us.packet;}
  primePilotKills(g);cache.set(g,JSON.stringify(s));return true;
 }catch(error){console.error('[HEAD-ON] Could not restore stage checkpoint',error);return false;}
}
export function clearStageCheckpoint(g,storage=checkpointStorage()){
 if(g&&!solo(g))return false;
 try{storage?.removeItem(STAGE_CHECKPOINT_KEY);if(g)cache.delete(g);return true;}catch{return false;}
}
