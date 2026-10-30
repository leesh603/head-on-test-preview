import {combatImpactResult} from './combat-impact-result.js';
import {getAircraftMeta} from './aircraft-master.js?v=tame3';
// Challenge records start at this update. Service medals and aircraft kill totals
// are deliberately never used as retroactive pilot clearance.
export const DEFAULT_PILOTS=Object.freeze(['immelmann','udet','brumowski','hawker','baracca','lufbery']);
const goal=(key,label,value)=>Object.freeze({key,label,goal:value});
const challenge=(id,title,description,goals,sortie=false)=>Object.freeze({id,title,description,history:challengeHistory[id],goals:Object.freeze(goals),sortie});
const challengeHistory={'navarre':'베르됭의 보초라는 별명과 공식 12승에서 착안한 방어 도전입니다. 실제 전과를 그대로 재현하는 조건은 아닙니다.','frommherz':'비행 교관 경력을 직접 표적을 잡고 편대기의 마무리를 이끄는 협동 사격으로 각색했습니다.','baron': '제1차 세계대전 공식 격추수 80기를 한 출격의 독일군 랭킹 기록으로 재현합니다.', 'voss': '다수의 적과 맞선 최후의 결투에서 착안했습니다.', 'boelcke': '딕타 뵐케의 전술적 우선순위를 편대 공략으로 재현합니다.', 'goering': '지휘관의 자격을 같은 에이스 동료와 세 전장을 살아남는 도전으로 표현합니다.', 'huffzky': '복좌기의 조종사와 사수가 협력하는 지상 공격을 주제로 합니다.', 'berthold': '불굴의 귀환을 구명낙하산 생환 후의 에이스 사냥으로 각색했습니다.', 'wolff': '가냘픈 꽃의 별명과 신중한 생존 비행을 연결한 도전입니다.', 'loewenhardt': '노란 매의 맹습을 짧은 시간의 연속 격추로 재현합니다.', 'jacobs': '검은 삼엽기의 사냥을 후방 추격과 마무리로 표현합니다.', 'gontermann': '관측기구 사냥을 주제로 한 장기 격추 도전입니다.', 'lothar': '공격적인 정면 승부를 직접 헤드온 승리로 재현합니다.', 'sachsenberg': '해상 항공전을 서로 다른 바다 전장 공략으로 재현합니다.', 'schleich': '검은 기사의 별명을 연막과 항법 장비의 조합으로 각색했습니다.', 'fonck': '협상국 최다 공식 격추수 75기를 한 출격의 협상국 랭킹 기록으로 재현합니다.', 'collishaw': '블랙 플라이트를 적 편대 전체에 맞서는 도전으로 표현합니다.', 'guynemer': '황새의 대포를 보스 무장과 기관부 정밀 파괴로 재현합니다.', 'bishop': '단독 기습을 지원기의 전과 없이 거두는 직접 격추로 표현합니다.', 'mannock': '전우의 귀환을 구출과 정찰기 호위로 재현합니다.', 'mckeever': '조종사와 사수가 지키는 두 사람의 요새를 호위전으로 표현합니다.', 'mccudden': '정비사 출신 에이스에게 어울리는 비상수선키트를 찾아 편대에 초대합니다.', 'nungesser': '죽음의 기사를 피격 직후의 빠른 반격으로 각색했습니다.', 'rickenbacker': '레이서 출신 에이스를 속도 장비를 활용한 고속 교전으로 표현합니다.', 'ball': '구름 속의 사냥꾼을 실제 은폐와 탈출 후 기습으로 표현합니다.', 'barker': '최후의 항전을 치명적인 내구도에서의 생존전으로 재현합니다.', 'luke': '애리조나 벌룬 버스터를 관측기구 사냥으로 재현합니다.', 'proctor': '기구 소탕 작전을 관측기구와 방어 전투기의 동시 공략으로 재현합니다.'};
export const PILOT_CHALLENGES=Object.freeze([
 challenge('navarre','베르됭의 보초','협상국 기체로 베르됭 지역 보스 3회 격파 및 해당 지역 랭킹 격추 12기',[goal('verdunBossClears','협상국 · 베르됭 보스 격파',3),goal('verdunRanked','협상국 · 베르됭 랭킹 격추',12)]),
 challenge('frommherz','교관의 표적 지시','동맹국 기체로 직접 기관총을 명중시킨 적을 3초 안에 내 일반 편대기가 마무리 60회 (편대기 필요)',[goal('instructorAssists','동맹국: 직접 명중 3초 내 내 일반 편대기 마무리',60)]),
 challenge('baron','붉은 남작의 자격','한 출격: 독일군 기체로 랭킹 격추수 80기',[goal('sortieGermanRanked','독일군 랭킹 격추 (한 출격 최고)',80)],true),
 challenge('voss','최후의 결투','한 출격: 적기 4기 이상에게 포위되어 45초 생존 후 해당 적기 3기 직접 격추',[goal('surrounded','포위 생존 (한 출격 최고)',45),goal('surroundedKills','해당 교전 직접 격추',3)],true),
 challenge('boelcke','딕타 뵐케','편대장 먼저 격추 후 10초 이내 편대 전멸 30회',[goal('formationTactics','편대장 선제 공략',30)]),
 challenge('goering','에이스 편대의 지휘관','한 출격: 같은 에이스 윙맨을 생존시킨 채 서로 다른 지역 보스 3종 격파',[goal('aceEscortBossKinds','한 출격: 같은 에이스 윙맨과 서로 다른 보스',3)],true),
 challenge('huffzky','슐라흐트슈타펠','적 지상 포대·열차포 60개 직접 파괴',[goal('groundKills','포대·열차포 직접 파괴',60)]),
 challenge('berthold','불굴의 생환','한 출격: 하이네케 구명낙하산으로 생환한 뒤 적 에이스 3명 직접 격추',[goal('returnAces','한 출격: 하이네케 생환 후 에이스 직접 격추',3)],true),
 challenge('wolff','가냘픈 꽃','한 출격: 10분 연속 무피격 비행 및 정예 표적 25기 직접 격추',[goal('cleanSeconds','연속 무피격 (한 출격 최고)',600),goal('sortieElite','정예 직접 격추 (한 출격 최고)',25)],true),
 challenge('loewenhardt','노란 매의 맹습','12초 안에 적기 4기 연속 직접 격추 25회',[goal('rapidFour','12초 내 4격추',25)]),
 challenge('jacobs','검은 삼엽기의 사냥','적 후방을 연속 3초 유지한 뒤 직접 격추 100회',[goal('tailKills','후방 추격 후 직접 격추',100)]),
 challenge('gontermann','기구 사냥꾼','적 관측기구 60개 직접 격추',[goal('balloons','관측기구 격추',60)]),
 challenge('lothar','정면 승부','서로 마주 보는 정면 교전에서 120회 직접 격추',[goal('headOn','헤드온 승리',120)]),
 challenge('sachsenberg','바다의 독수리','서로 다른 해상 전장 4곳의 지역 보스 격파',[goal('seaRegions','해상 전장 보스',4)]),
 challenge('schleich','안개 속의 검은 기사','한 출격: 브록식 연막장치와 C-O 5/17 에어로 컴퍼스를 동시에 보유',[goal('fogLoadout','한 출격: 연막장치 + 에어로 컴퍼스 동시 보유',1)],true),
 challenge('fonck','협상국 최고의 에이스','한 출격: 협상국 기체로 랭킹 격추수 75기',[goal('sortieEntenteRanked','협상국 랭킹 격추 (한 출격 최고)',75)],true),
 challenge('collishaw','블랙 플라이트','한 출격: 적 편대 20개 완전 전멸',[goal('sortieFormations','편대 전멸 (한 출격 최고)',20)],true),
 challenge('guynemer','황새의 대포','서로 다른 보스 8종 이상에서 무장·기관부 60개 직접 파괴',[goal('bossParts','무장·기관부 직접 파괴',60),goal('partBossKinds','부위 파괴 보스 종류',8)]),
 challenge('bishop','단독 기습','한 출격: 윙맨 전과 제외 적기 120기 직접 격추',[goal('sortieDirect','직접 격추 (한 출격 최고)',120)],true),
 challenge('mannock','전우의 귀환','아군 구출 15회 및 정찰기 호위 9회 성공',[goal('rescues','아군 구출 성공',15),goal('escorts','정찰기 호위 성공',9)]),
 challenge('mckeever','두 사람의 요새','정찰기 호위 12회 성공 및 호위 대상을 공격하는 적기 60기 직접 격추',[goal('escorts','정찰기 호위 성공',12),goal('escortAttackers','호위 공격기 직접 격추',60)]),
 challenge('mccudden','정비사의 공구함','맥커든의 비상수선키트 획득',[goal('repairKit','맥커든의 비상수선키트 획득',1)],true),
 challenge('nungesser','죽음의 기사','피격 후 15초 이내 반격 직접 격추 75회',[goal('counterKills','피격 후 반격 격추',75)]),
 challenge('rickenbacker','하늘의 레이서','한 출격: 붉은남작의 머플러 또는 바라카의 검은 말 문장 보유 중 최고속력 90% 이상으로 랭킹 격추 20기',[goal('speedEquipmentRanked','한 출격: 머플러 또는 검은 말 문장 + 고속(90%) 랭킹 격추',20)],true),
 challenge('ball','구름 속의 사냥꾼','짙은 구름 실제 은폐 1200초 및 구름 탈출 후 5초 내 기습 직접 격추 40회',[goal('cloudSeconds','구름 은폐 (초)',1200),goal('cloudKills','구름 기습 격추',40)]),
 challenge('barker','최후의 항전','한 출격: 내구도 15% 이하에서 에이스 4기 격추 후 90초 생존',[goal('lowAces','저내구도 에이스 (한 출격 최고)',4),goal('afterLowSeconds','이후 생존 (한 출격 최고)',90)],true),
 challenge('luke','애리조나 벌룬 버스터','적 관측기구 45개 직접 격추',[goal('balloons','관측기구 격추',45)]),
 challenge('proctor','기구 소탕 작전','한 출격: 적 관측기구 10개 및 적 전투기 30기 직접 격추',[goal('sortieBalloons','관측기구 (한 출격 최고)',10),goal('sortieFighters','전투기 (한 출격 최고)',30)],true)
]);
const definitions=new Map(PILOT_CHALLENGES.map(d=>[d.id,d]));
// Retain legacy metric keys so existing records and older cloud saves remain readable.
const keys=new Set([...PILOT_CHALLENGES.flatMap(d=>d.goals.map(g=>g.key)),'aceKills','aceKinds','cleanElite','wingBossKinds','recoveryAces','nightAces','nightBosses','speedSorties','fastKills']);
const threshold=(id,key)=>definitions.get(id).goals.find(g=>g.key===key).goal;
const setKeys=new Set(['aceKinds','wingBossKinds','seaRegions','partBossKinds']);
const validId=s=>typeof s==='string'&&/^[a-z0-9-]{1,100}$/.test(s);
const number=n=>Number.isFinite(n)&&n>=0?Math.min(1e9,Math.floor(n)):0;
export const emptyPilotUnlocks=()=>({version:1,metrics:{},collections:{},unlocked:{},receipts:{},best:{}});
export function cleanPilotUnlocks(raw){
 const out=emptyPilotUnlocks();if(!raw||raw.version!==1)return out;
 for(const [k,v]of Object.entries(raw.metrics||{}))if(keys.has(k))out.metrics[k]=number(v);
 for(const [k,v]of Object.entries(raw.collections||{}))if(setKeys.has(k)&&Array.isArray(v))out.collections[k]=[...new Set(v.filter(validId))].slice(0,100);
 for(const [id,at]of Object.entries(raw.unlocked||{}))if(definitions.has(id)&&typeof at==='string'&&at.length<=32)out.unlocked[id]=at;
 for(const [id,entry]of Object.entries(raw.receipts||{}).slice(-8))if(validId(id)&&entry&&typeof entry==='object'){
  const r={};for(const [k,v]of Object.entries(entry))if(keys.has(k))r[k]=number(v);out.receipts[id]=r;
 }
 for(const [id,row]of Object.entries(raw.best||{}))if(definitions.has(id)&&row&&typeof row==='object'){const values={};for(const [k,v]of Object.entries(row))if(keys.has(k))values[k]=number(v);out.best[id]=values}
 return out;
}
const progressScore=(id,row)=>{const goals=definitions.get(id)?.goals||[];const ratios=goals.map(g=>Math.min(1,(row?.[g.key]||0)/g.goal));return ratios.length?Math.min(...ratios)*10+ratios.reduce((a,b)=>a+b,0):0};
export function mergePilotUnlocks(a,b){
 a=cleanPilotUnlocks(a);b=cleanPilotUnlocks(b);const out=cleanPilotUnlocks(a);
 for(const [k,v]of Object.entries(b.metrics))out.metrics[k]=Math.max(v,out.metrics[k]||0);
 for(const k of setKeys){const list=[...new Set([...(a.collections[k]||[]),...(b.collections[k]||[])])].slice(0,100);if(list.length){out.collections[k]=list;out.metrics[k]=list.length}}
 Object.assign(out.unlocked,b.unlocked);
 for(const [id,r]of Object.entries(b.receipts)){out.receipts[id]??={};for(const [k,v]of Object.entries(r))out.receipts[id][k]=Math.max(v,out.receipts[id][k]||0)}
 for(const [id,row]of Object.entries(b.best))if(progressScore(id,row)>progressScore(id,out.best[id]))out.best[id]=row;
 out.receipts=Object.fromEntries(Object.entries(out.receipts).slice(-8));return out;
}
let book=null;
export function setPilotUnlockBook(value){book=value;if(book)book.data.pilotUnlocks=cleanPilotUnlocks(book.data.pilotUnlocks)}
export const pilotUnlocked=id=>DEFAULT_PILOTS.includes(id)||!!book?.data.pilotUnlocks?.unlocked?.[id];
export const pilotUnlockProgress=id=>(definitions.get(id)?.goals||[]).map(g=>({...g,value:Math.min(g.goal,(definitions.get(id)?.sortie?book?.data.pilotUnlocks?.best?.[id]?.[g.key]:book?.data.pilotUnlocks?.metrics?.[g.key])||0)}));
const central=new Set(['frommherz','baron','voss','boelcke','goering','huffzky','berthold','wolff','loewenhardt','jacobs','gontermann','lothar','sachsenberg','schleich',...DEFAULT_PILOTS.slice(0,3)]);
export function pilotUnlockFallback(id,faction){if(pilotUnlocked(id))return id;return (faction|| (central.has(id)?'central':'entente'))==='central'?'immelmann':'hawker'}
export const eligibleForPilotUnlocks=g=>!!g&&!g.testMode&&!g.developmentMode&&!g.debugMode&&g.mode!=='campaign'&&!(typeof location!=='undefined'&&/[?&](?:\w*qa|test|debug)(?:[=&]|$)/i.test(location.search));
export const directPilotSource=b=>!!b&&!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.ghost&&!b.environmental&&!b.pilotSupport;
const live=p=>p.hp>0&&(!p.status||p.status==='alive')&&!(p.heineckeEscape>0);
const aircraft=e=>!!e&&!e.surface&&!e.navalVessel&&!e.stationary&&!e.fieldUnit&&!e.stageBossBody&&!e.decoration&&!e.rivalEscaped;
const combat=e=>aircraft(e)&&e.hp>0&&!e.crashing&&e.alive!==false;
const ace=e=>aircraft(e)&&!!(e.bossPilot||e.type==='boss');
const elite=e=>aircraft(e)&&!!(ace(e)||e.type==='bomber'||e.type==='zeppelin'||e.heavyBomber||e.elite||e.eliteKind||e.veteran||e.formationLeader||e.eventCommander||e.danger);
const fighter=e=>aircraft(e)&&!e.heavyBomber&&!['bomber','zeppelin'].includes(e.type);
const angle=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const players=g=>g.players||[g],pid=p=>p.id||'p1';
const night=g=>[11,15,17].includes(g.worldRegion?.()??g.region);
const regions={1:'sea',7:'zeebrugge',16:'jutland',17:'dover-night'};
const combatPool=g=>g.eliteEnemies?.members?.length?[...(g.enemies||[]),...g.eliteEnemies.members]:(g.enemies||[]);
const squadFor=(g,e)=>e.directorSquad||(e.squadronId?g.eliteEnemies?.squadrons?.find(s=>s.id===e.squadronId):null);
const runtimes=new WeakMap();
export function pilotUnlockRun(world){const g=world?.world||world;if(!book||!eligibleForPilotUnlocks(g)||g.online&&!g.host)return null;let r=runtimes.get(g);if(!r){r=new PilotUnlockRun(g);runtimes.set(g,r)}return r}
function applyPacket(g,p,packet){
 if(!book||!eligibleForPilotUnlocks(g)||g.online&&pid(p)!==g.localPlayerId||!packet||!validId(packet.id))return;
 const d=book.data.pilotUnlocks??=emptyPilotUnlocks(),old=d.receipts[packet.id]||{},next={...old};let changed=false;
 for(const [k,v]of Object.entries(packet.add||{}))if(keys.has(k)){const n=number(v),delta=Math.max(0,n-(old[k]||0));if(delta){d.metrics[k]=number((d.metrics[k]||0)+delta);changed=true}next[k]=Math.max(n,old[k]||0)}
 for(const [k,v]of Object.entries(packet.max||{}))if(keys.has(k)&&number(v)>(d.metrics[k]||0)){d.metrics[k]=number(v);changed=true}
 for(const [k,list]of Object.entries(packet.unique||{}))if(setKeys.has(k)&&Array.isArray(list)){const a=[...new Set([...(d.collections[k]||[]),...list.filter(validId)])].slice(0,100);if(a.length!==(d.collections[k]||[]).length){d.collections[k]=a;d.metrics[k]=a.length;changed=true}}
 for(const [id,row]of Object.entries(packet.progress||{}))if(definitions.get(id)?.sortie&&progressScore(id,row)>progressScore(id,d.best[id])){d.best[id]=Object.fromEntries(definitions.get(id).goals.map(g=>[g.key,number(row[g.key])]));changed=true}
 const earned=[];for(const def of PILOT_CHALLENGES){if(d.unlocked[def.id])continue;const passed=def.sortie?(packet.qualified||[]).includes(def.id)&&def.goals.every(g=>number(packet.progress?.[def.id]?.[g.key])>=g.goal):def.goals.every(g=>(d.metrics[g.key]||0)>=g.goal);if(passed){d.unlocked[def.id]=book.clock();earned.push(def.id);changed=true}}
 if(changed){d.receipts[packet.id]=next;d.receipts=Object.fromEntries(Object.entries(d.receipts).slice(-8));g.pilotUnlockSession??={};const list=g.pilotUnlockSession[pid(p)]??=[];for(const id of earned)if(!list.includes(id))list.push(id);book.persist([],earned)}
}
export function pilotUnlockEliteDeath(g,detail){const member=g.eliteEnemies?.squadrons?.flatMap(s=>s.members||[]).find(e=>e.id===detail.memberId)||g.eliteEnemies?.members?.find(e=>e.id===detail.memberId);if(member)pilotUnlockRun(g)?.noteDeath(member,detail.source?.projectile||{...detail.source,pilotSupport:!!member.burnSupport})}
export function syncPilotUnlocks(g){g=g?.world||g;if(!g||!eligibleForPilotUnlocks(g))return;for(const p of players(g))if(p.pilotChallengeRecord)applyPacket(g,p,p.pilotChallengeRecord)}

export class PilotUnlockRun {
 constructor(g){this.g=g;this.instructorTags=new WeakMap();this.states=new Map();this.deaths=new WeakMap();this.seen=new WeakSet();this.parts=new WeakSet();this.missions=new Set();this.clears=new Set();this.squads=new Map();this.serial=0;this.runId=String(g.runId||globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,80);for(const p of players(g))this.state(p)}
 state(p){const id=pid(p);let s=this.states.get(id);if(!s){s={p,packet:{id:this.runId+'-'+id,add:{},max:{},unique:{},qualified:[],progress:{}},direct:0,fighters:0,balloons:0,elite:0,cleanElite:0,clean:0,bestClean:0,invalid:false,sortieDamaged:false,lastDamage:-Infinity,tail:new Map(),tailQualified:new WeakSet(),rapid:[],cloud:0,inCloud:false,cloudExit:-Infinity,low:false,recovered:false,lowAces:0,lowAt:null,surround:0,surroundKills:0,surroundTargets:new Set(),surroundReady:false,formations:0,uses:p.heineckeUses||0};this.states.set(id,s);p.pilotChallengeRecord=s.packet}return s}
 publish(s,{add={},max={},unique={},qualified=[]}={}){for(const[k,n]of Object.entries(add))s.packet.add[k]=(s.packet.add[k]||0)+n;for(const[k,n]of Object.entries(max))s.packet.max[k]=Math.max(s.packet.max[k]||0,Math.floor(n));for(const[k,ids]of Object.entries(unique))s.packet.unique[k]=[...new Set([...(s.packet.unique[k]||[]),...ids])];for(const id of qualified)if(!s.packet.qualified.includes(id))s.packet.qualified.push(id);s.packet.progress={voss:{surrounded:s.surround,surroundedKills:s.surroundKills},wolff:{cleanSeconds:s.invalid?0:s.bestClean,sortieElite:s.invalid?0:s.elite},baron:{sortieGermanRanked:s.germanRanked||0},fonck:{sortieEntenteRanked:s.ententeRanked||0},collishaw:{sortieFormations:s.formations},bishop:{sortieDirect:s.direct},barker:{lowAces:s.invalid?0:s.lowAces,afterLowSeconds:s.invalid||s.lowAt===null?0:Math.max(0,(this.g.t||0)-s.lowAt)},proctor:{sortieBalloons:s.balloons,sortieFighters:s.fighters},goering:{aceEscortBossKinds:s.escortKinds?.size||0},berthold:{returnAces:s.returnAces||0},rickenbacker:{speedEquipmentRanked:s.speedRanked||0},mccudden:{repairKit:s.repairKit||0},schleich:{fogLoadout:s.fogLoadout||0}};for(const row of Object.values(s.packet.progress))for(const key of Object.keys(row))row[key]=number(row[key]);applyPacket(this.g,s.p,s.packet)}
 // Use exactly the submitted ranking tally, including the solo Leica bonus.
 rankedKills(ownerId=null,before=null){
  const g=this.g,score=number(g.mode==='coop2'?g.priorityKills:typeof g.recordedKills==='function'?g.recordedKills():g.priorityKills);
  for(const p of players(g)){
   if(!live(p))continue;
   const meta=getAircraftMeta(p.plane,p.pilot),s=this.state(p);
   const german=meta?.faction==='central'&&p.pilot!=='brumowski'&&!['brumowski_albatros','hansa_brandenburg_di','oeffag','aviatik_d1','phonix_d1'].includes(p.plane);
   if(german)s.germanRanked=Math.max(s.germanRanked||0,score);
   if(meta?.faction==='entente')s.ententeRanked=Math.max(s.ententeRanked||0,score);
   const qualified=[];
   if(ownerId===pid(p)&&before!==null&&(p.upgrades?.redScarf||p.upgrades?.prancingHorse)&&(p.pilotFlightFraction??((p.airframeSpeed??0)*(p.speed||0)/Math.max(1,p.baseSpeed||p.speed||1)*(p.pursuitSpeedFactor??1)))>=.9){s.speedRanked=(s.speedRanked||0)+Math.max(0,score-number(before));if(s.speedRanked>=threshold('rickenbacker','speedEquipmentRanked'))qualified.push('rickenbacker')}
   if((s.germanRanked||0)>=threshold('baron','sortieGermanRanked'))qualified.push('baron');
   if((s.ententeRanked||0)>=threshold('fonck','sortieEntenteRanked'))qualified.push('fonck');
   const verdun=(g.worldRegion?.()??g.region)===12,ownDelta=ownerId===pid(p)&&before!==null?Math.max(0,score-number(before)):0;
   this.publish(s,{qualified,add:verdun&&meta?.faction==='entente'&&ownDelta?{verdunRanked:ownDelta}:{}});
  }
 }
 equipment(p){
  const s=this.state(p),u=p.upgrades||{},uses=p.heineckeUses||0,qualified=[];
  if(!live(p))return;
  if(uses>(s.escapeUses||0)){s.escapeUses=uses;s.returnAces=0;s.returned=false;s.awaitingReturn=!!u.heineckeRettungsfallschirm}
  if(s.awaitingReturn&&!(p.heineckeEscape>0)){s.returned=true;s.awaitingReturn=false}
  s.repairKit=u.sparkPlug?1:0;s.fogLoadout=u.kaiserFog&&u.fogCompass?1:0;
  if(s.repairKit)qualified.push('mccudden');if(s.fogLoadout)qualified.push('schleich');
  this.publish(s,{qualified});
 }
 damage(p){const s=this.state(p);s.clean=0;s.cleanElite=0;s.sortieDamaged=true;s.lastDamage=this.g.t||0;if(!live(p)||(p.heineckeUses||0)!==s.uses){s.invalid=true;s.lowAces=0;s.lowAt=null;s.low=false;s.recovered=false}s.uses=p.heineckeUses||0}
 noteHit(p,e,b){if(!live(p)||!combat(e)||!directPilotSource(b)||!Number.isInteger(b.gun)||['rocket','motorCannon','cow37','actualExplosion','blast','mauserRound','identityDot','identityChain','transferGun','tacticalRound','nungesserCounter'].some(k=>b[k])||!(combatImpactResult(b,e)?.damage>0)||(b.ownerId||'p1')!==pid(p))return;let tags=this.instructorTags.get(e);if(!tags){tags=new Map();this.instructorTags.set(e,tags)}tags.set(pid(p),this.g.t||0)}
 noteDeath(e,source){if(!e||e.hp>0||this.seen.has(e))return;const sq=squadFor(this.g,e);if(sq&&!this.squads.has(sq)&&sq.members?.length>=2)this.squads.set(sq,{leader:sq.leader,members:[...sq.members],done:false});this.seen.add(e);const direct=directPilotSource(source),owner=source?.ownerId||'p1';this.deaths.set(e,{at:this.g.t||0,order:++this.serial,owner,direct});if(!direct){const p=players(this.g).find(p=>pid(p)===owner),at=this.instructorTags.get(e)?.get(owner);if(p&&live(p)&&aircraft(e)&&source?.pilotChallengeWing===true&&source.ally&&!source.enemy&&Number.isFinite(at)&&(this.g.t||0)>=at&&(this.g.t||0)-at<=3&&getAircraftMeta(p.plane,p.pilot)?.faction==='central')this.publish(this.state(p),{add:{instructorAssists:1}});return;}const p=players(this.g).find(p=>pid(p)===owner);if(!p||!live(p))return;this.equipment(p);const s=this.state(p),now=this.g.t||0,add={},unique={},qualified=[];
  if(aircraft(e)){
   s.direct++;if(fighter(e))s.fighters++;if(elite(e)){s.elite++;s.cleanElite++}
   s.rapid=s.rapid.filter(t=>now-t<=12);s.rapid.push(now);if(s.rapid.length>=4){add.rapidFour=1;s.rapid=[]}
   if(s.tailQualified.has(e)||(s.tail.get(e)||0)>=3)add.tailKills=1;
   const bearing=Math.atan2(e.y-p.y,e.x-p.x);if(Math.hypot(e.x-p.x,e.y-p.y)<=500&&angle(p.a,bearing)<=.55&&angle(e.a,bearing+Math.PI)<=.55)add.headOn=1;
   if(now-s.lastDamage<=15)add.counterKills=1;
   if((p.pilotFlightFraction??((p.airframeSpeed??0)*(p.speed||0)/Math.max(1,p.baseSpeed||p.speed||1)*(p.pursuitSpeedFactor??1)))>=.9)add.fastKills=1;
   if(now-s.cloudExit<=5)add.cloudKills=1;
   if(s.surroundReady&&s.surroundTargets.has(e)){s.surroundKills++;if(s.surroundKills>=threshold('voss','surroundedKills'))qualified.push('voss')}
   if(e.eventRescueThreat&&e.battlefieldEventType==='RECON_ESCORT'&&this.g.battlefieldEvents?.current?.id===e.battlefieldEventId)add.escortAttackers=1;
  }
  if(ace(e)){if(s.returned){s.returnAces=(s.returnAces||0)+1;if(s.returnAces>=threshold('berthold','returnAces'))qualified.push('berthold')}add.aceKills=1;if(e.bossPilot)unique.aceKinds=[e.bossPilot];if(night(this.g))add.nightAces=1;if(s.recovered){add.recoveryAces=1;s.low=false;s.recovered=false}if(!s.invalid&&p.hp<=p.maxHp*.15){s.lowAces++;if(s.lowAces===threshold('barker','lowAces'))s.lowAt=now}}
  if(e.fieldUnit==='balloon'&&!e.decorative){s.balloons++;add.balloons=1}
  if(e.fieldUnit==='aa'||e.fieldUnit==='railgun'||e.type==='ground')add.groundKills=1;
  if(s.direct>=threshold('bishop','sortieDirect'))qualified.push('bishop');if(s.balloons>=threshold('proctor','sortieBalloons')&&s.fighters>=threshold('proctor','sortieFighters'))qualified.push('proctor');if(!s.invalid&&s.bestClean>=threshold('wolff','cleanSeconds')&&s.elite>=threshold('wolff','sortieElite'))qualified.push('wolff');
  this.publish(s,{add,unique,qualified,max:{sortieDirect:s.direct,sortieFighters:s.fighters,sortieBalloons:s.balloons,sortieElite:s.elite,cleanElite:s.cleanElite,lowAces:s.lowAces,surroundedKills:s.surroundKills}});
 }
 part(body,part,source){if(!part?.destroyed||this.parts.has(part))return;this.parts.add(part);if(!directPilotSource(source))return;const p=players(this.g).find(p=>pid(p)===(source.ownerId||'p1'));if(!p)return;const s=this.state(p),kind=part.kind||part.id||'';if(/gun|turret|cannon|barrel|launcher|mount|battery|engine|motor/.test(kind+' '+(part.id||'')))this.publish(s,{add:{bossParts:1},unique:{partBossKinds:[this.g.stageBoss?.stages?.encounter?.bossId||body.kind]}})}
 mission(event){if(!event?.id||this.missions.has(event.id))return;this.missions.add(event.id);const key={RESCUE:'rescues',RECON_ESCORT:'escorts'}[event.type];if(key)for(const p of players(this.g))if(live(p))this.publish(this.state(p),{add:{[key]:1}})}
 bossClear({id,bossId}){if(!id||this.clears.has(id))return;this.clears.add(id);for(const p of players(this.g)){if(!live(p))continue;const add={},unique={},s=this.state(p),region=this.g.worldRegion?.()??this.g.region;const escort=p.upgrades?.aceWingman&&(this.g.allies||[]).find(a=>a.aceWingman&&(a.ownerId||'p1')===pid(p)&&a.life>0&&a.hp>0);const qualified=[];if(escort){if(s.escortWing!==escort){s.escortWing=escort;s.escortKinds=new Set()}s.escortKinds.add(bossId);if(s.escortKinds.size>=threshold('goering','aceEscortBossKinds'))qualified.push('goering')}else{s.escortWing=null;s.escortKinds=new Set()}const wings=(this.g.allies||[]).filter(a=>(a.ownerId||'p1')===pid(p)&&!a.eventRescue&&!a.missionTarget&&a.life>0&&(a.hp===undefined||a.hp>0));if(wings.length>=3)unique.wingBossKinds=[bossId];if(regions[region])unique.seaRegions=[regions[region]];if(region===12&&getAircraftMeta(p.plane,p.pilot)?.faction==='entente')add.verdunBossClears=1;if(night(this.g))add.nightBosses=1;this.publish(s,{add,unique,qualified})}}
 tick(dt){this.rankedKills();const g=this.g,now=g.t||0;for(const p of players(g)){this.equipment(p);const s=this.state(p);if(!live(p)||(p.heineckeUses||0)!==s.uses){s.invalid=true;s.low=false;s.recovered=false;s.lowAt=null;s.lowAces=0;s.uses=p.heineckeUses||0;continue}const ratio=p.hp/p.maxHp;if(ratio<=.25)s.low=true;if(s.low&&ratio>=.8)s.recovered=true;
   s.clean+=dt;s.bestClean=Math.max(s.bestClean,s.clean);const concealed=p.cloudDepth>=1&&(p.cloudConceal||0)>=1.2;if(concealed)s.cloud+=dt;if(s.inCloud&&!concealed&&p.cloudDepth<1)s.cloudExit=now;s.inCloud=concealed;
   const nearby=combatPool(g).filter(e=>combat(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=360);if(nearby.length>=4){s.surround+=dt;if(s.surround>=threshold('voss','surrounded')&&!s.surroundReady){s.surroundReady=true;s.surroundTargets=new Set(nearby)}}else if(!s.surroundReady)s.surround=0;
   if(s.surroundReady&&![...s.surroundTargets].some(e=>combat(e)&&combatPool(g).includes(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=900)){s.surroundReady=false;s.surround=0;s.surroundKills=0;s.surroundTargets.clear()}
   for(const e of combatPool(g))if(combat(e)){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy),behind=dx*Math.cos(e.a)+dy*Math.sin(e.a);if(d<=500&&d>=20&&behind< -d*Math.cos(.6)&&angle(p.a,e.a)<.6){const time=(s.tail.get(e)||0)+dt;s.tail.set(e,time);if(time>=3)s.tailQualified.add(e)}else s.tail.delete(e)}
   for(const e of s.tail.keys())if(!combatPool(g).includes(e))s.tail.delete(e);
   const qualified=[];if(!s.invalid&&s.bestClean>=threshold('wolff','cleanSeconds')&&s.elite>=threshold('wolff','sortieElite'))qualified.push('wolff');const after=s.lowAt===null?0:Math.max(0,now-s.lowAt);if(!s.invalid&&s.lowAces>=threshold('barker','lowAces')&&after>=threshold('barker','afterLowSeconds'))qualified.push('barker');
   const speed=p.weaponModSelections?.SPEED||0;if(speed>=5&&!s.speedDone){s.speedDone=true;this.publish(s,{add:{speedSorties:1}})}
   this.publish(s,{add:{cloudSeconds:Math.max(0,Math.floor(s.cloud)-(s.packet.add.cloudSeconds||0))},max:{cleanSeconds:s.bestClean,surrounded:s.surround,afterLowSeconds:after},qualified});
  }
  for(const e of combatPool(g)){const sq=squadFor(this.g,e);if(sq&&!this.squads.has(sq)&&sq.members?.length>=2)this.squads.set(sq,{leader:sq.leader,members:[...sq.members],done:false})}
  for(const [sq,f]of this.squads){if(f.done)continue;f.members=[...new Set([...f.members,...sq.members])];const dead=e=>e.hp<=0&&!e.rivalEscaped&&this.deaths.has(e);if(f.members.every(dead)){f.done=true;for(const p of players(g)){const s=this.state(p);if(!f.members.some(e=>this.deaths.get(e).owner===pid(p)&&this.deaths.get(e).direct))continue;s.formations++;const lead=this.deaths.get(f.leader),last=Math.max(...f.members.map(e=>this.deaths.get(e).at)),first=Math.min(...f.members.map(e=>this.deaths.get(e).order));this.publish(s,{add:lead?.direct&&lead.owner===pid(p)&&lead.order===first&&last-lead.at<=10?{formationTactics:1}:{},max:{sortieFormations:s.formations},qualified:s.formations>=threshold('collishaw','sortieFormations')?['collishaw']:[]})}}if(f.members.every(e=>!combatPool(g).includes(e)))this.squads.delete(sq)}
 }
}

export function pilotUnlockDirectHit(p,b,e){const g=p?.combatWorld?.()||p?.world||p;pilotUnlockRun(g)?.noteHit(p,e,b)}
