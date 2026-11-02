// Solo checkpoints contain entry-time pilot/build data, never a live battlefield.
import {achievementRun,syncPilotKills,primePilotKills} from './achievements.js?v=pandemonium394r2';
import {pilotUnlockRun} from './pilot-unlocks.js?v=pilot-unlocks-shared1';
export const STAGE_CHECKPOINT_KEY='headon.stage-checkpoint.v1';
const VERSION=1,MAX_BYTES=512*1024,cache=new WeakMap();
const unsafe=new Set(['__proto__','prototype','constructor','g','p','world','book','target','leader','members','_netCarrierFocus','_netCarrierGuard']);
const objects=new Set(['weapon','ammo','upgrades','upgradeRarities','weaponMods','weaponModSelections','weaponModCounts','buildIdentities','equipmentLedger','bomberTransfer','pilotIdentity','pilotSignatureState','specialAmmoQueue','allies','formationWings','bossDeck','aceSortie','rivalAce','pilotChallengeRecord']);
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
  if(!stage||!['explore','final-arena'].includes(stage.phase)||!Number.isInteger(stage.stageIndex)||stage.stageIndex<0||stage.stageIndex>18||!Number.isInteger(stage.loopIndex)||stage.loopIndex<0||![0,1].includes(stage.capitalRound)||!Array.isArray(stage.order)||!stage.order.length||stage.order.some(n=>!Number.isInteger(n)||n<0||n>18)||new Set(stage.order).size!==stage.order.length||!stage.order.includes(stage.stageIndex))return null;
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
 if(!solo(g)||!(g.hp>0)||!stages||!['explore','final-arena'].includes(stages.phase))return false;
 try{
  syncPilotKills(g);
  const r=achievementRun(g),u=pilotUnlockRun(g),us=u?.state(g);
  const stage={stageIndex:stages.stageIndex,loopIndex:stages.loopIndex,order:[...stages.order],orderPosition:stages.orderPosition,capitalRound:stages.capitalRound,phase:stages.phase,finalArena:pack(stages.finalArena)};
  if(stage.phase==='final-arena')stage.finalArena.phase='pending';
  const snapshot={version:VERSION,savedAt:Date.now(),pilot:g.pilot,plane:g.plane,runId:g.stageBoss.runId,player:captureFields(g,objects),stage,addon:{time:g.stageBoss.time,serial:g.stageBoss.serial},achievements:r?captureFields(r,recordObjects):null,unlocks:us?captureFields(us,recordObjects):null,unlockRunId:u?.runId};
  const raw=JSON.stringify(snapshot);if(raw.length>MAX_BYTES)return false;cache.set(g,raw);return persistStageCheckpoint(g,storage);
 }catch(error){console.error('[HEAD-ON] Stage checkpoint failed',error);return false;}
}
export function restoreStageCheckpoint(g,s){
 if(!solo(g)||!g.stageBoss||s?.version!==VERSION||g.pilot!==s.pilot||g.plane!==s.plane)return false;
 try{
  // A fresh constructor may roll a different starting doctrine. Remove its
  // optional pilot/build fields before restoring the saved computed values.
  for(const[k,v]of Object.entries(g))if(!unsafe.has(k)&&!excluded.has(k)&&!k.startsWith('_')&&(scalar(v)||objects.has(k))&&!Object.hasOwn(s.player,k))delete g[k];
  restoreFields(g,s.player,objects);
  if(g.aceSortie){g.aceSortie.active=new Map();g.aceSortie.pending=[];}
  if(g.rivalAce){g.rivalAce.active=null;if(g.rivalAce.phase!=='DEFEATED'){g.rivalAce.phase='ESCAPED';g.rivalAce.returnAt=g.t+5;}}
  const addon=g.stageBoss,stages=addon.stages;addon.runId=s.runId;addon.time=s.addon.time;addon.serial=s.addon.serial;
  Object.assign(stages,s.stage,{order:[...s.stage.order],encounter:null,finalArena:unpack(s.stage.finalArena)});
  // Rebuild routes, hazards and map owners through the existing stage adapter.
  addon.hooks.onStageChange({stageIndex:stages.stageIndex,loopIndex:stages.loopIndex});
  if(stages.phase==='final-arena')addon.hooks.onFinalArenaPending();
  g.events=[];g.state='playing';g.invuln=Math.max(g.invuln||0,1.5);
  const r=achievementRun(g);if(r&&s.achievements)restoreFields(r,s.achievements,recordObjects);
  const u=pilotUnlockRun(g);if(u&&s.unlocks){u.runId=s.unlockRunId||u.runId;const us=u.state(g);restoreFields(us,s.unlocks,recordObjects);g.pilotChallengeRecord=us.packet;}
  primePilotKills(g);cache.set(g,JSON.stringify(s));return true;
 }catch(error){console.error('[HEAD-ON] Could not restore stage checkpoint',error);return false;}
}
export function clearStageCheckpoint(g,storage=checkpointStorage()){
 if(g&&!solo(g))return false;
 try{storage?.removeItem(STAGE_CHECKPOINT_KEY);if(g)cache.delete(g);return true;}catch{return false;}
}
