import {cleanPilotUnlocks,setPilotUnlockBook,pilotUnlockRun,syncPilotUnlocks} from './pilot-unlocks.js?v=capital-final-20261030';
// Service record also retains per-pilot aircraft unlock progress.
import {PILOT_AIRCRAFT,PILOT_AIRCRAFT_KILLS,pilotKillMetric,setPilotKillProvider} from './pilot-aircraft.js?v=capital-final-20261030&art=pilot-recovery2';
const medal=(id,group,icon,name,en,description,descriptionEn,metric,goals=[1],hidden=false)=>Object.freeze({id,group,icon,name,en,description,descriptionEn,metric,goals:Object.freeze(goals),hidden});
const pilotLabels={baron:'리히트호펜',voss:'포스',boelcke:'뵐케',udet:'우데트',goering:'괴링',berthold:'베르톨트',wolff:'볼프',loewenhardt:'뢰벤하르트',jacobs:'야콥스',brumowski:'브루모프스키',lothar:'로타르',sachsenberg:'작센베르크',fonck:'폰크',collishaw:'콜리쇼',baracca:'바라카',guynemer:'기네미르',bishop:'비숍',mannock:'매녹',hawker:'호커',mccudden:'맥커든',nungesser:'넝제세르',rickenbacker:'리켄바커',ball:'볼',barker:'바커'};
export const PILOT_AIRCRAFT_MEDALS=Object.freeze(Object.entries(PILOT_AIRCRAFT).filter(([,r])=>r.unlockAircraft).map(([id])=>medal('aircraft_'+id,'aircraft',0,pilotLabels[id]+' · 기체 전환 허가',id[0].toUpperCase()+id.slice(1)+' · Aircraft Clearance',`${pilotLabels[id]}로 누적 ${PILOT_AIRCRAFT_KILLS}기 격추 · 추가 기체 해금`,`Record ${PILOT_AIRCRAFT_KILLS} kills with ${id} to unlock the additional aircraft.`,pilotKillMetric(id),[PILOT_AIRCRAFT_KILLS])));
export const MEDALS=Object.freeze([
 medal('first','entry',0,'첫 전과','First Victory','정예 표적 최초 격추','Record your first priority kill.','priority'),
 medal('ace','entry',0,'에이스의 탄생','An Ace Is Born','한 출격 정예 표적 5기 격추','Record 5 priority kills in one sortie.','sortiePriority',[5]),
 medal('breakthrough','entry',0,'전선 돌파','Breakthrough','지역 보스 최초 격파','Defeat a regional boss.','bosses'),
 medal('survivor','entry',0,'살아서 돌아오다','Still Flying','한 출격에서 10분 생존','Survive 10 minutes in one sortie.','seconds',[600]),
 medal('resolute','entry',0,'불굴의 비행사','Resolute Aviator','한 출격 지역 보스 3회 격파','Defeat 3 regional bosses in one sortie.','sortieBosses',[3]),
 medal('far_sky','entry',0,'먼 하늘까지','Distant Skies','한 출격 지역 보스 5회 격파','Defeat 5 regional bosses in one sortie.','sortieBosses',[5]),
 medal('circuit','entry',4,'전선 일주','Full Circuit','한 출격에서 한 순환의 모든 전장 보스 격파','Clear every battlefield boss in one full route, in a single sortie.','circuits'),
 medal('veteran','combat',1,'전선의 베테랑','Frontline Veteran','정예 표적 누적 100 / 500 / 1,500기 격추','Record 100 / 500 / 1,500 priority kills.','priority',[100,500,1500]),
 medal('interceptor','combat',1,'폭격 저지선','Bomber Interceptor','정예 격추로 인정된 폭격기 누적 10 / 50 / 150기','Record 10 / 50 / 150 credited bomber kills.','bombers',[10,50,150]),
 medal('airship','combat',1,'거함 사냥꾼','Airship Hunter','정예 격추로 인정된 일반 비행선 누적 3 / 15 / 50척','Record 3 / 15 / 50 credited ordinary airship kills.','airships',[3,15,50]),
 medal('ace_hunter','combat',1,'에이스 사냥꾼','Ace Hunter','적 에이스 누적 3 / 15 / 50명 격추','Record 3 / 15 / 50 credited ace kills.','aces',[3,15,50]),
 medal('pursuit','combat',1,'꼬리를 물어라','On Your Tail','같은 정예 표적을 3초 연속 후방 고정한 뒤 직접 격추','Hold a priority target in tail lock for 3 continuous seconds, then score its kill.','pursuit'),
 medal('formation','combat',1,'편대 붕괴','Formation Breaker','편대장을 먼저 격추하고 10초 안에 나머지 편대 전멸','Destroy a formation leader first, then its remaining members within 10 seconds.','formations'),
 medal('escort','mission',2,'길잡이의 수호자','Guardian of the Scout','정찰기 호위 임무 성공','Complete a reconnaissance escort.','escort'),
 medal('rescue','mission',2,'전우를 위하여','For Your Comrades','아군 구출 임무 성공','Complete an allied rescue.','rescue'),
 medal('recon','mission',2,'전장의 눈','Eyes of the Battlefield','사진 정찰 임무 성공','Complete photo reconnaissance.','recon'),
 medal('supply','mission',2,'보급선 확보','Supply Secured','긴급 보급 회수 임무 성공','Complete emergency supply recovery.','supply'),
 medal('intel','mission',2,'정보는 무기다','Knowledge Is a Weapon','사진 정찰로 드러난 부위를 파괴하고 해당 보스 격파','Destroy the photo-recon weak point, then defeat that boss.','intel'),
 medal('problem_solver','mission',2,'전선의 해결사','Frontline Problem Solver','한 출격 서로 다른 임무 3종 성공','Complete 3 different mission types in one sortie.','missionTypes',[3]),
 medal('silence','boss',3,'침묵한 포대','Guns Fall Silent','보스 포대를 파괴하고 해당 보스 격파','Destroy a boss gun, then defeat that boss.','silence'),
 medal('heart','boss',3,'심장을 노려라','Strike the Heart','보스 기관부를 파괴하고 해당 보스 격파','Destroy a boss engine, then defeat that boss.','heart'),
 medal('defences','boss',3,'무너진 방어선','Defences Shattered','보스 한 전투에서 서로 다른 부위 3개 파괴 후 격파','Destroy 3 distinct parts in one boss encounter, then clear it.','defences'),
 medal('high_altitude','boss',3,'고공의 지배자','Master of High Altitude','체펠린 L70과 HMA23 각각 격파','Defeat both Zeppelin L70 and HMA23.','airshipBosses',[2]),
 medal('iron','boss',3,'철의 돌파자','Iron Breaker','A7V·마크 V·트레파스 바겐 각각 격파','Defeat A7V, Mark V and Treffas-Wagen.','ironBosses',[3]),
 medal('chronicler','boss',3,'전선의 기록자','Frontline Chronicler','서로 다른 지역 보스 10종 격파','Defeat 10 distinct regional boss types.','bossKinds',[10]),
 medal('perfect','special',4,'완벽한 공략','Flawless Assault','보스 교전 시작부터 격파까지 피격·부활 없이 승리','Clear a boss encounter without being hit or reviving.','perfect'),
 medal('legend','special',4,'전설이 된 출격','Legendary Sortie','한 출격 특수장비 4개 동시 보유','Hold 4 special equipment items at once.','equipment',[4]),
 medal('pandemonium','special',4,'판데모니움','Pandemonium','숨겨진 최종 병기를 격파했습니다.','Defeat the hidden final war machine.','pandemoniumVictories',[1],true),
 medal('miracle','special',4,'기적의 생환','Miraculous Return','내구도 10% 이하 → 긴급 보급으로 완전 수리 → 부활 없이 다음 보스 격파','Recover from 10% hull with emergency supplies, then defeat the next boss without reviving.','miracle',[1],true),
 medal('two_wings','coop',5,'두 개의 날개','Two Wings','로컬 협동에서 두 플레이어가 생존한 채 지역 보스 격파','Clear a regional boss with both local co-op pilots alive.','twoWings'),
 ...PILOT_AIRCRAFT_MEDALS
]);
export const MEDAL_SAVE_KEY='headon-service-medals-1';
const ids=new Set(MEDALS.map(d=>d.id)),finite=n=>Number.isFinite(n)&&n>0?Math.min(1e9,Math.floor(n)):0;
const tierFor=(d,metrics)=>d.goals.filter(n=>(metrics[d.metric]||0)>=n).length;
const empty=()=>({version:1,metrics:{},collections:{},awards:{},featured:[]});
export class AchievementBook {
 constructor(storage=null,{clock=()=>new Date().toISOString()}={}){this.storage=storage;this.clock=clock;this.listeners=new Set();this.saved=true;this.data=empty();try{this.load(JSON.parse(storage?.getItem(MEDAL_SAVE_KEY)||'null'))}catch{this.saved=false}}
 load(raw){
  if(!raw||raw.version!==1)return;
  const data=empty();for(const [k,v]of Object.entries(raw.metrics||{}))if(/^[a-zA-Z]+$/.test(k))data.metrics[k]=finite(v);
  for(const [k,v]of Object.entries(raw.collections||{}))if(/^[a-zA-Z]+$/.test(k)&&Array.isArray(v))data.collections[k]=[...new Set(v.filter(s=>typeof s==='string'&&/^[a-z0-9-]{1,80}$/.test(s)))].slice(0,100);
  for(const d of MEDALS){const a=raw.awards?.[d.id],tier=Math.min(d.goals.length,finite(a?.tier));if(tier)data.awards[d.id]={tier,firstAt:typeof a.firstAt==='string'?a.firstAt.slice(0,32):'',at:typeof a.at==='string'?a.at.slice(0,32):''}}
  data.featured=[...new Set((Array.isArray(raw.featured)?raw.featured:[]).filter(id=>ids.has(id)&&data.awards[id]))].slice(0,3);if(raw.pilotUnlocks)data.pilotUnlocks=cleanPilotUnlocks(raw.pilotUnlocks);this.data=data;
 }
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 persist(newAwards=[],newPilots=[]){try{this.storage?.setItem(MEDAL_SAVE_KEY,JSON.stringify(this.data));this.saved=!!this.storage}catch{this.saved=false}for(const fn of this.listeners)try{fn({newAwards,newPilots,saved:this.saved})}catch{/* Cosmetic UI may never interrupt combat. */}}
 record({add={},max={},unique={}}={}){
  let changed=false;const m=this.data.metrics;
  for(const [k,n]of Object.entries(add))if(finite(n)){m[k]=finite((m[k]||0)+finite(n));changed=true}
  for(const [k,n]of Object.entries(max))if(finite(n)>(m[k]||0)){m[k]=finite(n);changed=true}
  for(const [k,v]of Object.entries(unique)){const set=new Set(this.data.collections[k]||[]);for(const id of v)if(typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id))set.add(id);const list=[...set].slice(0,100);if(list.length!==(this.data.collections[k]||[]).length){this.data.collections[k]=list;m[k]=list.length;changed=true}}
  if(!changed)return [];
  const earned=[];for(const d of MEDALS){const tier=tierFor(d,m),old=this.data.awards[d.id];if(tier>(old?.tier||0)){const at=this.clock();this.data.awards[d.id]={tier,firstAt:old?.firstAt||at,at};earned.push(d.id)}}
  this.persist(earned);return earned;
 }
 feature(id){if(!this.data.awards[id])return false;const a=this.data.featured,i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<3)a.push(id);else return false;this.persist();return true}
 progress(d){const tier=this.data.awards[d.id]?.tier||0,circuit=d.id==='circuit'&&!tier&&this.data.metrics.routeGoal,value=this.data.metrics[circuit?'routeCoverage':d.metric]||0,goal=circuit||d.goals[Math.min(tier,d.goals.length-1)];return{tier,value,goal,complete:tier===d.goals.length}}
}

let book=null;const runs=new WeakMap(),pilotKillRuns=new WeakMap();
export const setAchievementBook=value=>{book=value;setPilotUnlockBook(value);setPilotKillProvider(value?id=>value.data.metrics[pilotKillMetric(id)]||0:null)};
// Existing personal kill counters include ordinary aircraft and owned support kills.
// Online replicas carry these counters: each device records only its own pilot.
export function syncPilotKills(g){
 g=g?.world||g;if(!book||!g||g.testMode||g.mode==='campaign')return;
 let seen=pilotKillRuns.get(g);if(!seen){seen=new Map();pilotKillRuns.set(g,seen)}
 const add={};for(const p of g.players||[g]){
  if(g.online&&p.id!==g.localPlayerId||!PILOT_AIRCRAFT[p.pilot])continue;
  const key=p.id||'p1',count=finite(p.kills),previous=seen.get(key)||0;if(count<=previous)continue;
  seen.set(key,count);const metric=pilotKillMetric(p.pilot);add[metric]=(add[metric]||0)+count-previous;
 }
 if(Object.keys(add).length){const earned=book.record({add});const r=runs.get(g);if(r)for(const id of earned)r.sessionAwards.add(id)}
}
// Persistent service-record collection is merged by the existing cloud profile UNION policy.
// No migration from generic circuits, London/Gotha, or boss totals: these are not capital-final proof.
export function hasBothFactionFinalClears(){const done=new Set(book?.data.collections.factionFinalClears||[]);return book?.saved===true&&done.has('central')&&done.has('entente');}
export function factionFinalClearProgress(){return ['central','entente'].filter(f=>(book?.data.collections.factionFinalClears||[]).includes(f));}
const factionFinalReceipts=new WeakMap();
// Called only by the host's registered capital-final encounter adapter after completed/dead validation.
export function recordFactionFinalClear(g,receipt){return recordTrustedFactionFinalClear(g,receipt,false);}
// Only accepted, sequenced host capital receipts may call this transport adapter.
export function recordReplicaFactionFinalClear(g,receipt){if(!(g?.world||g)?.online)return false;return recordTrustedFactionFinalClear(g,receipt,true);}
function recordTrustedFactionFinalClear(g,receipt,replica){
 g=g?.world||g;
 if(!book||!g||g.testMode||g.mode==='campaign'||receipt?.capitalFinalVerified!==true||!['central','entente'].includes(receipt.teamFaction)||typeof receipt.runId!=='string'||!receipt.runId||typeof receipt.encounterId!=='string'||!receipt.encounterId||typeof receipt.bossId!=='string'||!receipt.bossId)return false;
 if(g.teamFaction&&g.teamFaction!==receipt.teamFaction)return false;
 if(g.online&&g.host!==true&&!replica)return false;
 const currentRun=g._netEligibilityRunId||g.stageBoss?.runId||g.runId;if(currentRun&&currentRun!==receipt.runId)return false;
 let seen=factionFinalReceipts.get(g);if(!seen){seen=new Set();factionFinalReceipts.set(g,seen)}
 const key=receipt.runId+':'+receipt.encounterId;if(seen.has(key))return false;
 book.record({unique:{factionFinalClears:[receipt.teamFaction]}});if(!book.saved)book.persist();if(!book.saved)return false;seen.add(key);return true;
}
const secretVictoryReceipts=new WeakMap();
export function achievementPandemoniumClear(g,token){
 g=g?.world||g;if(g?.online&&g.host!==true)return false;return recordSecretVictory(g,token);
}
// Only the accepted host-state transport may supply a replica victory receipt.
export function recordReplicaPandemoniumClear(g,receipt){
 g=g?.world||g;if(!g?.online||!receipt||receipt.runId!==(g._netEligibilityRunId||g.runId)||typeof receipt.token!=='string'||!receipt.token)return false;const observed=g.finalArena?.token||g.stageBoss?.stages?.finalArena?.lastCompletedToken;if(observed!==receipt.token)return false;return recordSecretVictory(g,receipt.token);
}
function recordSecretVictory(g,token){
 if(!book||!g||g.testMode||g.mode==='campaign'||!hasBothFactionFinalClears()||token==null)return false;
 let seen=secretVictoryReceipts.get(g);if(!seen){seen=new Set();secretVictoryReceipts.set(g,seen)}if(seen.has(String(token)))return false;
 book.record({max:{pandemoniumVictories:1}});if(!book.saved)book.persist();if(!book.saved)return false;seen.add(String(token));return true;
}
export function secretMedalDisclosure(d,record){const hidden=d.id==='pandemonium'&&!record?.data.awards?.[d.id]?.tier;return hidden?{hidden:true,name:'????',en:'????',description:'????',descriptionEn:'????',icon:null}:{hidden:false,name:d.name,en:d.en,description:d.description,descriptionEn:d.descriptionEn,icon:d.icon};}

export const eligibleForMedals=g=>{g=g?.world||g;return !!g&&!g.testMode&&!g.online&&g.mode!=='campaign'};
const pilots=g=>g.players||[g],living=p=>p.hp>0&&(!p.status||p.status==='alive');
export function achievementRun(g){g=g?.world||g;if(!book||!eligibleForMedals(g))return null;let r=runs.get(g);if(!r){r=new SortieAchievements(g,book);runs.set(g,r)}return r}
export function awardPriorityKill(g,e,ownerId){const before=g.mode==='coop2'?(g.priorityKills||0):typeof g.recordedKills==='function'?g.recordedKills():(g.priorityKills||0);g.priorityKills=(g.priorityKills||0)+1;achievementRun(g)?.kill(e,ownerId);pilotUnlockRun(g)?.rankedKills(ownerId||'p1',before)}
export function achievementEnemyDefeated(g,e,source){achievementRun(g)?.enemyDefeated(e);pilotUnlockRun(g)?.noteDeath(e,source)}
export function achievementBossCue(g,event,body){achievementRun(g)?.bossCue(event,body)}
export function achievementBossClear(g,info){achievementRun(g)?.bossClear(info);pilotUnlockRun(g)?.bossClear(info)}
export function achievementMission(g,event,outcome){if(outcome==='completed'){achievementRun(g)?.mission(event);pilotUnlockRun(g)?.mission(event)}}

export class SortieAchievements {
 constructor(world,record){this.g=world;this.book=record;this.priority=0;this.rankedPriority=0;this.bosses=0;this.seenKills=new WeakSet();this.enemyDeaths=new WeakMap();this.deathSequence=0;this.clears=new Set();this.missions=new Set();this.tail=new Map();this.tailQualified=new WeakMap();this.formations=new Map();this.low=new Map();this.recoveries=new Map();this.boss=null;this.routeLoop=null;this.routeClears=new Set();this.routeAwarded=false;this.routeOrder=[];this.lastSecond=-1;this.sessionAwards=new Set()}
 active(){return eligibleForMedals(this.g)}
 record(update){if(!this.active())return [];const earned=this.book.record(update);for(const id of earned)this.sessionAwards.add(id);return earned}
 beginFrame(){this.frameHp=new Map(pilots(this.g).map(p=>[p.id||'p1',p.hp]));this.frameEventStart=(this.g.events||[]).length}
 damage(p){if(!this.active())return;if(this.boss)this.boss.damaged=true;this.notePilot(p)}
 notePilot(p){const id=p.id||'p1';if(p.heineckeEscape>0||p.status==='downed'||p.hp<=0){this.low.delete(id);this.recoveries.delete(id);if(this.boss)this.boss.damaged=true;return}if(p.hp>0&&p.hp<=p.maxHp*.1)this.low.set(id,{uses:p.heineckeUses||0});}
 enemyDefeated(e){if(this.active()&&e&&!this.enemyDeaths.has(e))this.enemyDeaths.set(e,{at:this.g.t||0,order:++this.deathSequence})}
 kill(e,ownerId='p1'){
  if(!this.active()||!e||this.seenKills.has(e))return;this.seenKills.add(e);this.enemyDefeated(e);this.priority++;
  const ace=!!(e.bossPilot||e.type==='boss')&&!e.stageBossBody,add={};
  if(ace)add.aces=1;else if(e.type==='zeppelin')add.airships=1;else if(e.type==='bomber'||e.heavyBomber)add.bombers=1;
  if(this.tailQualified.get(e)?.has(ownerId))add.pursuit=1;
  this.record({add});this.syncPriority();
 }
 syncPriority(){
  const score=finite(typeof this.g.recordedKills==='function'?this.g.recordedKills():this.priority),delta=Math.max(0,score-this.rankedPriority);
  if(!delta)return;this.rankedPriority=score;this.record({add:{priority:delta},max:{sortiePriority:score}});
 }
 mission(event){
  if(!this.active())return;const id=event.id;if(!id||this.missions.has(id))return;this.missions.add(id);
  this.missionTypes??=new Set();this.missionTypes.add(event.type);
  const key={RECON_ESCORT:'escort',RESCUE:'rescue',PHOTO_RECON:'recon',SUPPLY_RECOVERY:'supply'}[event.type];
  if(event.type==='SUPPLY_RECOVERY')for(const p of pilots(this.g)){const low=this.low.get(p.id||'p1');if(low&&living(p)&&p.hp>=p.maxHp-1e-6&&(p.heineckeUses||0)===low.uses)this.recoveries.set(p.id||'p1',{uses:low.uses});this.low.delete(p.id||'p1')}
  this.record({add:key?{[key]:1}:{},max:{missionTypes:this.missionTypes.size}});
 }
 bossCue(event,body){
  if(!this.active())return;const encounter=this.g.stageBoss?.stages?.encounter;
  if(!encounter)return;
  if(this.boss?.id!==encounter.id)this.boss={id:encounter.id,parts:new Set(),gun:false,engine:false,intel:false,damaged:false};
  if(event.type!=='part-destroyed'||!body)return;
  const part=body.parts.get(event.partId);if(!part?.destroyed)return;
  this.boss.parts.add(body.id+':'+event.partId);
  const kind=part.kind||'';if(/gun|turret|cannon|barrel|launcher|mount|battery/.test(kind)||/gun|turret|cannon|barrel|launcher/.test(event.partId))this.boss.gun=true;
  if(/engine|motor|engine-deck/.test(kind)||/engine|motor/.test(event.partId))this.boss.engine=true;
  const intel=this.g.battlefieldEvents?.bossIntel;
  if(intel?.applied&&intel.encounterId===encounter.id&&intel.bodyId===body.id&&intel.partId===event.partId)this.boss.intel=true;
 }
 bossClear({id,bossId}){
  if(!this.active()||this.clears.has(id))return;this.clears.add(id);this.bosses++;
  const b=this.boss?.id===id?this.boss:null,ps=pilots(this.g),add={bosses:1};
  if(b?.gun)add.silence=1;if(b?.engine)add.heart=1;if(b?.parts.size>=3)add.defences=1;if(b?.intel)add.intel=1;
  const frameHit=ps.some(p=>p.hp<(this.frameHp?.get(p.id||'p1')??p.hp))||(this.g.events||[]).slice(this.frameEventStart??0).some(e=>e.type==='hit'||e.type==='downed'||e.type==='heinecke');
  if(b&&!b.damaged&&!frameHit&&ps.every(living)&&!ps.some(p=>p.heineckeEscape>0))add.perfect=1;
  if(this.g.mode==='coop2'&&ps.length===2&&ps.every(living))add.twoWings=1;
  for(const p of ps){const recovery=this.recoveries.get(p.id||'p1');if(recovery&&living(p)&&(p.heineckeUses||0)===recovery.uses)add.miracle=1}this.recoveries.clear();
  const s=this.g.stageBoss?.stages;
  if(s){if(this.routeLoop!==s.loopIndex){this.routeLoop=s.loopIndex;this.routeClears.clear();this.routeAwarded=false;this.routeOrder=[...(s.order||[])]}
   if(this.routeOrder.includes(s.stageIndex))this.routeClears.add(s.stageIndex);
   if(!this.routeAwarded&&this.routeOrder.length>0&&this.routeClears.size===new Set(this.routeOrder).size){this.routeAwarded=true;add.circuits=1}}
  const unique={bossKinds:[bossId]};if(['zeppelin-l70','hma23'].includes(bossId))unique.airshipBosses=[bossId];if(['a7v-flak','mark-v-cruiser','treffas-wagen'].includes(bossId))unique.ironBosses=[bossId];
  this.record({add,max:{sortieBosses:this.bosses,routeCoverage:this.routeClears.size},unique});this.boss=null;
 }
 tick(dt){
  if(!this.active())return;this.syncPriority();const g=this.g,ps=pilots(g),now=g.t||0;
  for(const p of ps){this.notePilot(p);const id=p.id||'p1',target=(g.enemies||[]).find(e=>e.hp>0&&e.tailId===p.tailTargetId);
   const prev=this.tail.get(id);if(living(p)&&p.tailLocked&&target){const seconds=prev?.target===target?prev.seconds+dt:dt;this.tail.set(id,{target,seconds});if(seconds>=3){const set=this.tailQualified.get(target)||new Set();set.add(id);this.tailQualified.set(target,set)}}else this.tail.delete(id)}
  const sec=Math.floor(now/5)*5;if(sec!==this.lastSecond){this.lastSecond=sec;this.record({max:{seconds:ps.some(living)?sec:0,routeGoal:g.stageBoss?.stages?.order?.length||0}})}
  const equipment=Math.max(0,...ps.map(p=>p.legendaryCount?.()||0));this.record({max:{equipment}});
  for(const e of g.enemies||[]){const squad=e.directorSquad;if(!squad)continue;const old=this.formations.get(squad);if(old){if(old.at===null)old.members=[...new Set([...old.members,...squad.members])];continue}if(squad.members.length<2||!squad.leader||squad.leader.hp<=0)continue;this.formations.set(squad,{leader:squad.leader,members:[...squad.members],at:null})}
  for(const [s,f]of this.formations){const dead=e=>e.hp<=0&&!e.rivalEscaped&&this.enemyDeaths.has(e);
   if(f.at===null&&dead(f.leader)){const leader=this.enemyDeaths.get(f.leader);if(f.members.some(e=>e!==f.leader&&dead(e)&&this.enemyDeaths.get(e).order<leader.order)){this.formations.delete(s);continue}f.at=leader.at}
   if(f.at!==null&&now-f.at<=10&&f.members.every(dead)){this.record({add:{formations:1}});this.formations.delete(s)}else if(f.at!==null&&now-f.at>10||f.members.every(e=>!(g.enemies||[]).includes(e)))this.formations.delete(s)}
 }
 dispose(){this.formations.clear();this.tail.clear()}
}

export function installAchievementTracking(Type,{coop=false}={}){
 const update=Type.prototype.update;Type.prototype.update=function(dt,...args){const r=achievementRun(this),unlock=pilotUnlockRun(this),before=this.t||0;const unlockHp=new Map((this.players||[this]).map(p=>[p.id||'p1',{hp:p.hp,uses:p.heineckeUses||0}]));if(this.state==='playing')unlock?.tick(0);if(r&&this.state==='playing'){r.beginFrame();r.tick(0)}const result=update.call(this,dt,...args);syncPilotKills(this);syncPilotUnlocks(this);const elapsed=Math.max(0,(this.t||0)-before);if(r&&elapsed>0){for(const p of pilots(this))if(p.hp<(r.frameHp?.get(p.id||'p1')??p.hp))r.damage(p);r.tick(elapsed)}if(unlock&&elapsed>0){for(const p of this.players||[this]){const old=unlockHp.get(p.id||'p1');if(old&&(p.hp<old.hp||(p.heineckeUses||0)>old.uses))unlock.damage(p)}unlock.tick(elapsed)}return result};
 const key=coop?'hitPlayer':'hit',hit=Type.prototype[key];
 Type.prototype[key]=function(...args){const p=coop?args[0]:this,before=p?.hp,uses=p?.heineckeUses||0,result=hit.apply(this,args);if(p&&(p.hp<before||(p.heineckeUses||0)>uses))achievementRun(this)?.damage(p);if(p&&(p.hp<before||(p.heineckeUses||0)>uses))pilotUnlockRun(this)?.damage(p);return result};
}
