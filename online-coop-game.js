import {advanceNungesserReplica} from './nungesser-combat.js';
import {navarreSuppressionVisual} from './navarre-frommherz-combat.js';
import * as finalArenaAchievementGate from './achievements.js?v=pandemonium394r2';
import {receiveIntrusionVisual,advanceIntrusionVisual} from './intrusion-network-visual.js';
import {captureNavarreFrommherzVisual} from './navarre-frommherz-view.js';
import {equipmentCruiseMultiplier} from './equipment-flight-balance.js';
import {momentumTier} from './ace-momentum.js';
import {syncPilotUnlocks} from './pilot-unlocks.js';
import {airbrakeMovement} from './flight-equipment.js';
import {advanceUdetReplica,udetFlightModifiers} from './udet-acrobatics.js';
import {CoopGame} from './coop-engine.js?v=pandemonium394r2&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021&adriaticart=20261022&cityart=20261022&harbor=20261021&td4=20261026&momentum=20261027';
import {BossEncounter} from './headon-stageboss-core.js?v=pandemonium394r2&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {stageBossSpeed} from './stageboss-host.js?v=pandemonium394r2&ai=1018&sig=1019&boss=20261020b&phase=1021&adriaticart=20261022&cambrai=20261021&cityart=20261022&harbor=20261021&somme=20261021&momentum=20261027';
import {NET_HZ,MAX_TETHER,seededRandom,cleanInput,pack,unpack,FieldDelta,applyFields,pose,mixAngle} from './online-coop-protocol.js?v=pandemonium394r2';

const LANES=['enemies','drops','allies','patrols','mines','friendlyBombers','friendlyBombs','bombZones','flakBursts','hostileMinefields','gasZones','fireZones','grunkreuzPuffs','gusts','grenades','smokeZones','combatFX','revisionDecoys','enemyAirshipPasses'];
const WORLD=['zeroDistrict','finalArena','groundFacilities','photoReconDirector','intrusionBoss','intrusionDirector','t','distance','kills','priorityKills','score','state','manualPaused','region','wave','stageStartDistance','stageStartTime','battleDirectorPattern','battleDirector','battlefieldEvents','navalRoute','jutlandRoute','gallipoliRoute','bossBuildings','bossCues','londonBattle','parisBattle','verdunBattle','maanWeather','cityDefense','activeUpgrade','pendingLevelUps','upgradeSequence'];
const NOTICE=new Set(['intrusionWarning','intrusionPartDestroyed','intrusionDestroyed','intrusionRetreat','intrusionResolved','tacticalActivation','aceWingmanArrival','wave','skill','downed','revived','end','kill','bossArrival','bossPhase','bossSound','regionTransition','heinecke','heineckeReturn','bombWarning']);
const ownWithoutPose=entity=>{const data=pack(entity);delete data.x;delete data.y;delete data.a;return data;};
// Fortress state is an acyclic plain-data render snapshot. The generic packer
// intentionally omits engine graph keys such as `target`; here these are actual
// mortar/telegraph coordinates and must survive. Never transmit callbacks/assets.
export function packFinalArenaSnapshot(value,seen=new Set(),depth=0){
 if(value==null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number')return Number.isFinite(value)?Math.round(value*1000)/1000:null;
 if(typeof value!=='object'||depth>16||seen.has(value))return undefined;
 const proto=Object.getPrototypeOf(value);if(!Array.isArray(value)&&proto!==Object.prototype&&proto!==null)return undefined;
 seen.add(value);let out;
 if(Array.isArray(value))out=value.slice(0,4096).map(v=>packFinalArenaSnapshot(v,seen,depth+1)??null);
 else {out={};for(const k of Object.keys(value).slice(0,256)){if(['__proto__','prototype','constructor'].includes(k)||k.startsWith('_net'))continue;const cosmetic=['groundMarks','groundParticles','damageEvents'].includes(k);const input=cosmetic?[]:k==='audioEvents'&&Array.isArray(value[k])?value[k].slice(-8):k==='effects'&&Array.isArray(value[k])?value[k].slice(-12):value[k];const v=packFinalArenaSnapshot(input,seen,depth+1);if(v!==undefined)out[k]=v;}}
 seen.delete(value);return out;
}
const newFinalArenaChallenge=()=>globalThis.crypto?.randomUUID?.()||('arena-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const validFinalArenaChallenge=value=>typeof value==='string'&&value.length>=8&&value.length<=128;
const cameraTarget=g=>g.player(g.localPlayerId)?.status==='alive'?g.player(g.localPlayerId):g.living()[0]||g.player(g.localPlayerId);

export class OnlineCoopGame extends CoopGame {
 constructor(session,start){
  super(start.players,{rng:seededRandom(start.seed),runId:start.runId});
  this.online=true;this.session=session;this.host=session.role==='host';this.localPlayerId=this.host?'p1':'p2';this.netSeed=start.seed;
  this._netDelta=new FieldDelta();this._netIds=new WeakMap();this._netSerial=0;this._netBullets=new Map();this._netReplica=new Map();this._netTargets=new Map();this._netEvents=[];this._netSeq=0;this._netInputSeq=0;this._netLastInput=0;this._netRemoteInput={};this._netLastAction=0;this._netLastState=0;this._netDisconnected=false;
  this._netEligibilityRunId=String(start.runId||'');this._netFinalArenaEligibilityChallenge=this.host?newFinalArenaChallenge():null;this._netPeerFinalArenaEligibility=null;this._netEligibilityDisposed=false;this._netFactionFinalReceipts=[];this._netFactionFinalReceiptSeen=new Set();this._netPandemoniumVictory=null;this._netPandemoniumVictorySeen=null;
  this._netInput={};this._netCorrection={x:0,y:0,a:0};this._netEnded=false;this._netFull=true;this._netHaveBase=this.host;this._netResyncAt=0;
  this._netUpgradeSerial=0;this._netUpgradePending=null;this._netUpgradeResults=[];this._netUpgradeReceipts=new Map();
  if(!this.host){this.enemies=[];this.bullets=[];this.state='paused';this.stageBoss=null;}
  session.onGameMessage=message=>this.receive(message);
  this._netTimer=setInterval(()=>this.networkTick(),1000/NET_HZ);
 }
 // Eligibility is local profile evidence, never copied from a world snapshot.
 hasBothFactionFinalClears(){return finalArenaAchievementGate.hasBothFactionFinalClears?.()===true;}
 // Only the host's registered capital-final hook may publish this event.
 publishFactionFinalClear(receipt){
  if(!this.host||!this.validFactionFinalReceipt(receipt))return false;
  if(this._netFactionFinalReceipts.some(r=>r.encounterId===receipt.encounterId))return true;
  if(this._netFactionFinalReceipts.length>=2)return false;
  const {capitalFinalVerified,runId,teamFaction,playerFaction,bossId,capitalId,encounterId,loopIndex}=receipt;
  this._netFactionFinalReceipts.push({capitalFinalVerified,runId,teamFaction,playerFaction,bossId,capitalId,encounterId,loopIndex});return true;
 }
 validFactionFinalReceipt(r){return !!(r?.capitalFinalVerified===true&&r.runId===this._netEligibilityRunId&&['central','entente'].includes(r.teamFaction)&&r.playerFaction===r.teamFaction&&typeof r.bossId==='string'&&r.bossId.length>0&&r.bossId.length<=128&&typeof r.capitalId==='string'&&r.capitalId.length>0&&r.capitalId.length<=128&&typeof r.encounterId==='string'&&r.encounterId.length>0&&r.encounterId.length<=256&&Number.isSafeInteger(r.loopIndex)&&r.loopIndex>=0);}
 recordReplicaFactionFinalClear(receipt){return finalArenaAchievementGate.recordReplicaFactionFinalClear?.(this,receipt)===true;}
 acceptFactionFinalReceipts(receipts){
  if(this.host||!Array.isArray(receipts))return;
  for(const r of receipts.slice(0,2)){if(!this.validFactionFinalReceipt(r)||this._netFactionFinalReceiptSeen.has(r.encounterId))continue;
   try{if(this.recordReplicaFactionFinalClear(r)===true){this._netFactionFinalReceiptSeen.add(r.encounterId);if(this._netFactionFinalReceiptSeen.size>64)this._netFactionFinalReceiptSeen.delete(this._netFactionFinalReceiptSeen.values().next().value);}}catch{/* Retry on next authoritative snapshot if local storage is unavailable. */}
  }
 }
 publishPandemoniumVictory(receipt){
  if(!this.host||!this.validPandemoniumVictory(receipt))return false;
  this._netPandemoniumVictory={runId:receipt.runId,token:receipt.token};return true;
 }
 validPandemoniumVictory(r){return !!(r?.runId===this._netEligibilityRunId&&typeof r.token==='string'&&r.token.length>0&&r.token.length<=256);}
 recordReplicaPandemoniumClear(receipt){return finalArenaAchievementGate.recordReplicaPandemoniumClear?.(this,receipt)===true;}
 acceptPandemoniumVictory(receipt){
  if(this.host||!this.validPandemoniumVictory(receipt)||this._netPandemoniumVictorySeen===receipt.token)return;
  try{if(this.recordReplicaPandemoniumClear(receipt)===true)this._netPandemoniumVictorySeen=receipt.token;}catch{/* Retry authoritative receipt after storage becomes available. */}
 }
 finalArenaLocalQualified(){try{return this.hasBothFactionFinalClears()===true;}catch{return false;}}
 finalArenaPeersQualified(){
  if(!this._netEligibilityRunId||this._netEligibilityDisposed||this.session.closed||this._netDisconnected||!this.finalArenaLocalQualified())return false;
  const proof=this._netPeerFinalArenaEligibility;
  return !!(proof?.qualified===true&&proof.runId===this._netEligibilityRunId&&validFinalArenaChallenge(this._netFinalArenaEligibilityChallenge)&&proof.challenge===this._netFinalArenaEligibilityChallenge&&performance.now()-proof.at>=0&&performance.now()-proof.at<1500);
 }
 finalArenaNetworkReady(){
  const a=this.finalArena;if(!a||!['entry','battle','victory'].includes(a.phase))return true;
  if(!this.finalArenaPeersQualified())return false;
  const local=this.finalArenaAssetsReady===true&&!this.finalArenaAssetsError;
  if(!this.host)return local&&a.waitingForAssets!==true;
  const ack=this._netFinalArenaReady;
  return !!(local&&!this._netDisconnected&&ack?.ready&&ack.token===a.token&&ack.phase===a.phase&&ack.formToken===(a.formToken||null)&&performance.now()-ack.at<1500);
 }
 disposeOnline(){this._netEligibilityDisposed=true;this._netPeerFinalArenaEligibility=null;this._netFinalArenaEligibilityChallenge=null;clearInterval(this._netTimer);this.session.onGameMessage=null;}
 worldRegion(){return this.host?super.worldRegion():this.region;}
 updateCamera(dt){const p=cameraTarget(this);if(!p)return;const k=1-Math.exp(-dt*12);this.camera.x+=(p.x-this.camera.x)*k;this.camera.y+=(p.y-this.camera.y)*k;this.camera.zoom=1;}
 constrainMove(p,x0,y0){
  const partner=this.players.find(q=>q!==p&&q.status==='alive');if(!partner)return;
  const dx=p.x-partner.x,dy=p.y-partner.y,d=Math.hypot(dx,dy);if(d>MAX_TETHER){const amount=Math.min(d-MAX_TETHER,Math.hypot(p.x-x0,p.y-y0)*.7);p.x-=dx/d*amount;p.y-=dy/d*amount;}
 }
 // Both clients use their usual WASD/arrow/touch control for their own aircraft.
 localInput(inputs,joy){const input=cleanInput(Number.isFinite(inputs?.p1?.angle)?inputs.p1:inputs?.p2||{});if(Number.isFinite(joy))input.angle=joy;this._netInput=input;return input;}
 keydown(e,input,hooks={},bindings={evade:'Space',skill:'KeyE',reload:'KeyR'}){
  if(e.isComposing||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable)return;
  if(e.code==='Enter'&&e.target?.tagName==='BUTTON')return;
  e.preventDefault();const repeat=e.repeat||input.held.has(e.code);input.held.add(e.code);if(repeat||input.blocked.has(e.code))return;
  if(this.state==='upgrade'){
   const item=this.activeUpgrade;if(item?.playerId!==this.localPlayerId)return;
   if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code)){input.selection=(input.selection+item.choices.length+(['ArrowLeft','KeyA'].includes(e.code)?-1:1))%item.choices.length;hooks.highlight?.(input.selection);}
   if(e.code===bindings.skill||e.code==='Enter')hooks.choose?.(item.id,item.choices[input.selection||0].id);
   if(/^Digit[1-4]$/.test(e.code)){const choice=item.choices[Number(e.code.slice(-1))-1];if(choice)hooks.choose?.(item.id,choice.id);}return;
  }
  if(['Escape','KeyP'].includes(e.code)){input.clear();hooks.pause?.();return;}
  for(const action of ['skill','evade','reload'])if(e.code===bindings[action])this.action(this.localPlayerId,action);
 }
 action(_id,action){
  if(!this.finalArenaNetworkReady())return false;
  const tactical=typeof action==='string'&&action.startsWith('tactic:');
  if(tactical?this.state!=='paused'||this.activeUpgrade||this.pendingLevelUps.length:this.state!=='playing'||!['skill','evade','reload'].includes(action))return false;
  if(this.host)return super.action('p1',action);
  this.session.send({type:'action',seq:++this._netInputSeq,action});return true;
 }
 skill(){return this.action(this.localPlayerId,'skill');} evade(){return this.action(this.localPlayerId,'evade');} reload(){return this.action(this.localPlayerId,'reload');}
 pause(){
  this._netInput={};this._netRemoteInput={};
  if(this.host){const before=this.state;super.pause();this.pauseEvents(before);return;}
  this.session.send({type:'pause',paused:true});
 }
 resume(){
  if(this._netDisconnected)return false;
  // A remote client cannot resume a hidden authoritative simulation: its rAF
  // loop is suspended, while a visible guest would otherwise keep predicting.
  if(this.host&&typeof document!=='undefined'&&document.hidden){
   const before=this.state;super.pause();this.pauseEvents(before);this._netInput={};this._netRemoteInput={};
   this._netDelta.reset();this._netBullets.clear();this._netFull=true;return false;
  }
  this._netInput={};this._netRemoteInput={};
  if(this.host){const before=this.state,ok=super.resume();this.pauseEvents(before);return ok;}
  this.session.send({type:'pause',paused:false});return false;
 }
 pauseEvents(before){
  if(this.state===before)return;
  this._netInput={};this._netRemoteInput={};
  if(this.state==='paused')this.events.push({type:'onlinePause'});
  if(this.state==='playing')this.events.push({type:'onlineResume'});
 }
 requestUpgrade(op,itemId,id){
  const item=this.activeUpgrade;
  if(this.state!=='upgrade'||item?.playerId!==this.localPlayerId||item.id!==itemId||this._netUpgradePending)return false;
  const requestId=++this._netUpgradeSerial;
  // The existing choose transport keeps the relay's restricted message allowlist.
  if(!this.session.send({type:'choose',op,itemId,id,revision:item.revision||0,requestId}))return false;
  this._netUpgradePending={requestId,itemId,at:performance.now()};return true;
 }
 rerollUpgrade(itemId){
   const item=this.activeUpgrade;if(this.state!=='upgrade'||item?.id!==itemId||item.playerId!==this.localPlayerId||item.kind==='doctrine'||item.kind==='composite')return false;
  if(!this.host)return this.requestUpgrade('reroll',itemId);
  return this.applyReroll(item);
 }
 applyReroll(item){
   if(!item||item.kind==='doctrine'||item.kind==='composite')return false;
  const p=this.player(item.playerId),next=p.rerollChoices(item.choices);
  if(!next)return false;item.choices=next;item.revision=(item.revision||0)+1;this.events.push({type:'upgrade',item});return true;
 }
 receiveUpgrade(m){
  // A client already in flight during a release can still select its old row.
  if(m.requestId===undefined&&m.op===undefined){if(this.activeUpgrade?.playerId==='p2')super.chooseUpgrade(m.itemId,m.id);return;}
  if(!Number.isSafeInteger(m.requestId)||m.requestId<1)return;
  const receiptKey=[m.itemId,m.requestId,m.revision||0,m.op,m.id||''].join(':');
  const prior=this._netUpgradeReceipts.get(receiptKey);
  if(prior){this._netUpgradeResults.push(prior);return;}
  const item=this.activeUpgrade;
  const valid=this.state==='upgrade'&&item?.playerId==='p2'&&item.id===m.itemId&&(item.revision||0)===(m.revision||0);
  const accepted=!!(valid&&(m.op==='reroll'?this.applyReroll(item):m.op==='select'&&super.chooseUpgrade(m.itemId,m.id)));
  if(!accepted){this._netDelta.reset();this._netBullets.clear();this._netFull=true;}
  const result={requestId:m.requestId,itemId:m.itemId,accepted};
  this._netUpgradeReceipts.set(receiptKey,result);this._netUpgradeResults.push(result);
  while(this._netUpgradeReceipts.size>32)this._netUpgradeReceipts.delete(this._netUpgradeReceipts.keys().next().value);
 }
 chooseUpgrade(itemId,id){
  if(this.activeUpgrade?.playerId!==this.localPlayerId)return false;
  if(this.host)return super.chooseUpgrade(itemId,id);
  if(this.state!=='upgrade'||this.activeUpgrade.id!==itemId||!this.activeUpgrade.choices.some(c=>c.id===id))return false;
  return this.requestUpgrade('select',itemId,id);
 }
 captureEvents(events){if(this.host)for(const e of events)if(NOTICE.has(e.type))this._netEvents.push(pack(e));}
 idOf(entity){let id=this._netIds.get(entity);if(!id){id='n'+(++this._netSerial);this._netIds.set(entity,id);}return id;}
 receive(m){
  if(this.host){
   if(m.type==='input'&&Number.isSafeInteger(m.seq)&&m.seq>this._netSeq){this._netSeq=m.seq;this._netLastInput=performance.now();this._netRemoteInput=cleanInput(m.input);const proof=m.finalArenaEligibility;
    this._netPeerFinalArenaEligibility=proof?.runId===this._netEligibilityRunId&&proof.challenge===this._netFinalArenaEligibilityChallenge&&typeof proof.qualified==='boolean'?{runId:proof.runId,challenge:proof.challenge,qualified:proof.qualified,at:performance.now()}:null;
    const a=this.finalArena,r=m.finalArenaReady;
    if(a&&r?.token===a.token&&r.phase===a.phase&&(r.formToken||null)===(a.formToken||null)&&typeof r.ready==='boolean')this._netFinalArenaReady={token:r.token,phase:r.phase,formToken:r.formToken||null,ready:r.ready,at:performance.now()};
   }
   else if(m.type==='action'&&Number.isSafeInteger(m.seq)&&m.seq>this._netLastAction){this._netLastAction=m.seq;if(this.finalArenaNetworkReady())super.action('p2',m.action);}
   else if(m.type==='choose')this.receiveUpgrade(m);
   else if(m.type==='pause'){if(m.paused===true)this.pause();else if(m.paused===false&&!this._netDisconnected)this.resume();}
   else if(m.type==='resync'){this._netDelta.reset();this._netBullets.clear();this._netFull=true;}
   else if(m.type==='peer'){
    this._netPeerFinalArenaEligibility=null;this._netFinalArenaEligibilityChallenge=newFinalArenaChallenge();this._netFinalArenaReady=null;const wasDisconnected=this._netDisconnected;this._netDisconnected=!m.connected;if(!m.connected){if(!wasDisconnected)this._netResumeAfterPeer=this.state==='playing';this.pause();}
    else {const resume=this._netResumeAfterPeer;this._netResumeAfterPeer=false;this._netSeq=0;this._netLastAction=0;this._netLastInput=0;this._netRemoteInput={};this._netDelta.reset();this._netBullets.clear();this._netFull=true;if(resume)this.resume();}
   }
  }else if(m.type==='state')this.acceptState(m);
  else if(m.type==='linkLost'){this._netPeerFinalArenaEligibility=null;this._netFinalArenaEligibilityChallenge=null;const before=this.state;this._netDisconnected=true;this._netHaveBase=false;this._netInput={};this._netUpgradePending=null;this.state='paused';this.pauseEvents(before);}
 }
 networkTick(){
  if(this._netEnded||this.session.closed)return;
  if(!this.host){if(!this._netHaveBase&&performance.now()-this._netResyncAt>500){this._netResyncAt=performance.now();this.session.send({type:'resync'});}const a=this.finalArena;this.session.send({type:'input',seq:++this._netInputSeq,input:this._netInput,finalArenaEligibility:{runId:this._netEligibilityRunId,challenge:this._netFinalArenaEligibilityChallenge,qualified:this.finalArenaLocalQualified()},finalArenaReady:a?{token:a.token,phase:a.phase,formToken:a.formToken||null,ready:this.finalArenaAssetsReady===true&&!this.finalArenaAssetsError}:null});return;}
  // A reliable ordered delta stream: descriptors once, changed fields + compact
  // motion tuples at 15 Hz. Ordinary projectile trajectories only at birth.
  const world={};for(const key of WORLD)if(this[key]!==undefined)world[key]=key==='finalArena'?packFinalArenaSnapshot(this[key]):pack(this[key]);
  const field=this.alpsMountains;
  world.alpsTerrain=field?pack({seed:field.seed,cellSize:field.cellSize,safeAreas:field.safeAreas,damageFraction:field.damageFraction,cooldown:field.cooldown,time:field.time}):null;
  const message={type:'state',pandemoniumVictory:this._netPandemoniumVictory,factionFinalReceipts:this._netFactionFinalReceipts,finalArenaEligibility:{runId:this._netEligibilityRunId,challenge:this._netFinalArenaEligibilityChallenge,qualified:this.finalArenaLocalQualified()},seq:++this._netLastState,full:!!this._netFull,world:this._netDelta.take('world',world),players:[],lanes:{},shots:[],shotUpdates:[],retired:[],events:this._netEvents.splice(0),upgradeResults:this._netUpgradeResults.splice(0)};this._netFull=false;
  for(const p of this.players){const data=ownWithoutPose(p);data.navarreFrommherzVisual=captureNavarreFrommherzVisual(p);message.players.push({id:p.id,pose:pose(p),data:this._netDelta.take(p.id,data)});}
  const aliveIds=new Set(['world','boss','p1','p2']);
  for(const lane of LANES){const rows=[];for(const entity of this[lane]||[]){const id=this.idOf(entity);aliveIds.add(id);const data=ownWithoutPose(entity);if(lane==='enemies'){data.formationLeaderId=entity.formationLeader?.id??null;const slow=navarreSuppressionVisual(this,entity);if(slow.length)data.navarreSuppressionFx=slow;}rows.push({id,pose:pose(entity),data:this._netDelta.take(id,data)});}message.lanes[lane]=rows;}
  const current=new Set();for(const b of this.bullets){if(b.life<=0)continue;const id=this.idOf(b);current.add(id);if(!this._netBullets.has(id)){message.shots.push({id,data:pack(b)});this._netBullets.set(id,b);}else if(b.fonckHoming||b.telescopeGuided||b.fonckSeeker||(b.telescopeAge||0)>0)message.shotUpdates.push({id,pose:pose(b),life:b.life});}
  for(const id of this._netBullets.keys())if(!current.has(id)){message.retired.push(id);this._netBullets.delete(id);}
  const sb=this.stageBoss;let boss=null;
  if(sb){const encounter=sb.stages.encounter,stages=pack(sb.stages);delete stages.encounter;
   const bodies=[],hazards=[];
   for(const b of encounter?.bodies.values()||[]){const id=this.idOf(b);aliveIds.add(id);bodies.push({id,data:this._netDelta.take(id,pack(b))});}
   sb.hazards.pool.visit(h=>{const id=this.idOf(h);aliveIds.add(id);hazards.push({id,data:this._netDelta.take(id,pack(h))});});
   boss={meta:this._netDelta.take('boss',{ended:sb.ended,time:sb.time,stages,encounter:encounter?{id:encounter.id,bossId:encounter.bossId,maxHpBudget:encounter.maxHpBudget,hud:pack(encounter.snapshot())}:null,defeatSequence:pack(sb.defeatSequence),bodyDefeats:pack(sb.bodyDefeats)}),bodies,hazards};
  }
  message.boss=boss;this._netDelta.retain(aliveIds);
  if(!this.session.send(message)){this._netDelta.reset();this._netBullets.clear();this._netFull=true;this._netEvents.unshift(...message.events);this._netEvents.length=Math.min(100,this._netEvents.length);this._netUpgradeResults.unshift(...message.upgradeResults);this._netUpgradeResults.length=Math.min(32,this._netUpgradeResults.length);}
 }
 acceptState(m){
  if(!Number.isSafeInteger(m.seq)||m.seq<=this._netLastState)return;this._netLastState=m.seq;this._netReceivedAt=performance.now();
  if(!this._netHaveBase&&!m.full)return;this._netHaveBase=true;
  const eligibility=m.finalArenaEligibility;
  if(eligibility?.runId===this._netEligibilityRunId&&validFinalArenaChallenge(eligibility.challenge)&&typeof eligibility.qualified==='boolean'){
   this._netFinalArenaEligibilityChallenge=eligibility.challenge;this._netPeerFinalArenaEligibility={runId:eligibility.runId,challenge:eligibility.challenge,qualified:eligibility.qualified,at:performance.now()};this.acceptFactionFinalReceipts(m.factionFinalReceipts);this.acceptPandemoniumVictory(m.pandemoniumVictory);
  }else{this._netPeerFinalArenaEligibility=null;this._netFinalArenaEligibilityChallenge=null;}
  if(m.full){if(!Object.hasOwn(m.world?.set||{},'finalArena'))this.finalArena=null;if(!Object.hasOwn(m.world?.set||{},'zeroDistrict'))this.zeroDistrict=null;this._netReplica.clear();this._netTargets.clear();this._netBullets.clear();this.bullets=[];}
  const priorIntrusion=this.intrusionBoss;
  const before=this.state,oldRegion=this.region,priorChoice=this.activeUpgrade?.id,priorRevision=this.activeUpgrade?.revision||0;applyFields(this,m.world);receiveIntrusionVisual(this,priorIntrusion,m.full);
  this._netDisconnected=false;this.restoreTerrain();
  for(const row of m.players){const p=this.player(row.id),status=p.status;applyFields(p,row.data);const [x,y,a,vx,vy]=row.pose;
   if(row.id===this.localPlayerId){
    if(m.full||status!==p.status||Math.hypot(x-p.x,y-p.y)>180||p.status!=='alive'||this.state!=='playing'){p.x=x;p.y=y;p.a=a;this._netCorrection={x:0,y:0,a:0};}
    else {const lead=.065;this._netCorrection={x:x+vx*lead-p.x,y:y+vy*lead-p.y,a:Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a))};}
   }else this.target(p,row.pose);
  }
  syncPilotUnlocks(this);
  const keep=new Set();for(const [lane,rows] of Object.entries(m.lanes||{})){if(!LANES.includes(lane))continue;const entities=[];
   for(const row of rows){let entity=this._netReplica.get(row.id);if(!entity){entity={};this._netReplica.set(row.id,entity);}applyFields(entity,row.data);this.target(entity,row.pose);keep.add(row.id);entities.push(entity);}this[lane]=entities;
  }
  const enemiesById=new Map(this.enemies.map(e=>[e.id,e]));for(const e of this.enemies)e.formationLeader=enemiesById.get(e.formationLeaderId)||null;
  for(const row of m.shots||[]){const b=unpack(row.data);this._netBullets.set(row.id,b);}
  for(const row of m.shotUpdates||[]){const b=this._netBullets.get(row.id);if(!b||!Array.isArray(row.pose)||row.pose.length!==5||!row.pose.every(Number.isFinite)||!Number.isFinite(row.life))continue;[b.x,b.y,b.a,b.vx,b.vy]=row.pose;b.previousX=b.x;b.previousY=b.y;b.life=row.life;}
  for(const id of m.retired||[])this._netBullets.delete(id);this.bullets=[...this._netBullets.values()].filter(b=>b.life>0);
  if(m.boss){this._netBossData??={};applyFields(this._netBossData,m.boss.meta);const data=this._netBossData;
   const restore=rows=>rows.map(row=>{let entity=this._netReplica.get(row.id);if(!entity){entity={};this._netReplica.set(row.id,entity);}applyFields(entity,row.data);keep.add(row.id);return entity;});
   const bodies=restore(m.boss.bodies),hazards=restore(m.boss.hazards);if(data.encounter)data.encounter.bodies=new Map(bodies.map(b=>[b.id,b]));data.hazards=hazards;this.restoreBoss(data);
  }else {this._netBossData=null;this.stageBoss=null;}
  for(const id of this._netReplica.keys())if(!keep.has(id)){this._netTargets.delete(this._netReplica.get(id));this._netReplica.delete(id);}
  this.events.push(...(m.events||[]).map(unpack));
  let retryUpgrade=false;
  for(const result of m.upgradeResults||[])if(result.requestId===this._netUpgradePending?.requestId){this._netUpgradePending=null;retryUpgrade=true;}
  // A full resync or an overdue request also restores a usable current row.
  if(this._netUpgradePending&&(m.full||performance.now()-this._netUpgradePending.at>3000)){this._netUpgradePending=null;retryUpgrade=true;}
  if(this.state==='upgrade'&&(priorChoice!==this.activeUpgrade?.id||priorRevision!==(this.activeUpgrade?.revision||0)||retryUpgrade))this.events.push({type:'upgrade',item:this.activeUpgrade});
  this.pauseEvents(before);
  if(oldRegion!==this.region&&!this.events.some(e=>e.type==='regionTransition'))this.events.push({type:'regionTransition',region:this.region,text:''});
  if(this.state==='lost'&&before!=='lost'&&!this.events.some(e=>e.type==='end'))this.events.push({type:'end',text:'두 기체 모두 격추'});
 }
 restoreTerrain(){
  const data=this.alpsTerrain;
  if(!data){this.alpsMountains=null;return;}
  const field=this.alpsMountains;
  // The app constructs the display class with no damage adapter. Never replace
  // its prototype with a plain object unpacked from network state.
  if(!field)return;
  if(field.seed!==data.seed||field.cellSize!==data.cellSize){this.alpsMountains=null;return;}
  // Only display parameters cross the wire. The host owns all terrain damage.
  for(const key of ['safeAreas','damageFraction','cooldown','time'])if(data[key]!==undefined)field[key]=data[key];
 }
 restoreBoss(data){
  if(!data){this.stageBoss=null;return;}
  const encounter=data.encounter?Object.assign(Object.create(BossEncounter.prototype),{id:data.encounter.id,bossId:data.encounter.bossId,maxHpBudget:data.encounter.maxHpBudget,bodies:data.encounter.bodies}):null;
  if(encounter){const hud=data.encounter.hud;encounter.snapshot=()=>hud;for(const b of encounter.bodies.values())b.encounter=encounter;}
  this.stageBoss={ended:data.ended,time:data.time,stages:{...data.stages,encounter},defeatSequence:data.defeatSequence,bodyDefeats:data.bodyDefeats||[],hazards:{pool:{visit:fn=>{for(const h of data.hazards||[])fn(h);}}},dispose(){this.ended=true;}};
 }
 target(entity,position){if(!this._netTargets.has(entity)||Math.hypot(entity.x-position[0],entity.y-position[1])>200){entity.x=position[0];entity.y=position[1];entity.a=position[2];}this._netTargets.set(entity,{from:[entity.x,entity.y,entity.a],to:position,age:0});}
 update(dt,inputs={}){
  if(this.host){if(this.finalArena&&['entry','battle','victory'].includes(this.finalArena.phase)){const ready=this.finalArenaNetworkReady();this.finalArena.waitingForAssets=!ready;if(!ready){this.updateCamera(0);return;}}super.update(dt,{p1:this._netInput,p2:performance.now()-this._netLastInput<300?this._netRemoteInput:{}});return;}
  // Guest never calls CoopGame.update, Director, boss update, collision or RNG.
  const step=Math.min(.04,Math.max(0,dt));
  if(this.finalArena&&!this.finalArenaNetworkReady()){this.updateCamera(0);return;}
  if(this.state==='playing'){
   for(const owner of this.players){advanceUdetReplica(owner,step);advanceNungesserReplica(owner,step);}
   const p=this.player(this.localPlayerId);if(p.status==='alive'){
    const acrobat=udetFlightModifiers(p),turn=p.turn;p.turn*=acrobat.turn;try{p.flyAirframe(step,this._netInput);}finally{p.turn=turn;}const velocity=momentumTier(p).speed*acrobat.speed*(p.pilot==='rickenbacker'&&p.skillTime>0&&p.hp>0?2:1)*p.baseSpeed*equipmentCruiseMultiplier(p)*p.healthSpeedFactor()*stageBossSpeed(p)*(p.udetBoost>0?1.7:1)*(airbrakeMovement(p,step,p.chargeTime>0?4.6:p.evadeTime>0?(p.bomberTransfer?1.12:2.35):p.airframeSpeed??1))*(p.pursuitSpeedFactor??1)*(p.vossReverse>0?2.35:1);
    const x=p.x,y=p.y;p.x+=Math.cos(p.a)*velocity*step;p.y+=Math.sin(p.a)*velocity*step;this.constrainMove(p,x,y);
    const k=1-Math.exp(-step*10),c=this._netCorrection;p.x+=c.x*k;p.y+=c.y*k;p.a+=c.a*k;c.x*=1-k;c.y*=1-k;c.a*=1-k;
   }
   let count=0;for(const b of this.bullets){b.previousX=b.x;b.previousY=b.y;b.x+=b.vx*step;b.y+=b.vy*step;b.life-=step;if(b.life>0)this.bullets[count++]=b;}this.bullets.length=count;
   for(const [entity,target] of this._netTargets){target.age+=step;const k=Math.min(1,target.age*NET_HZ);entity.x=target.from[0]+(target.to[0]-target.from[0])*k;entity.y=target.from[1]+(target.to[1]-target.from[1])*k;entity.a=mixAngle(target.from[2],target.to[2],k);}
  }
  if(this.state==='playing')advanceIntrusionVisual(this,step,NET_HZ);
  this.updateCamera(step);
 }
}

