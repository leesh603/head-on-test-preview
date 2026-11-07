// Map operations: connect what the pilots did in a stage's ordinary fighting to
// the next mission and to that stage's boss. Every lever is an existing one:
// Battlefield Event outcomes and pending effects, the trench barrage timer, the
// harbor reload disruption, the capital defense flag, reconnaissance intel and
// the encounter's own breath window. Nothing here spawns, scores or saves.
import {mapCombatProfile,MAP_COMBAT_TYPES as T} from './map-combat-roles.js?v=09c75d146ae4289d';

export const MAP_OPERATION_BALANCE=Object.freeze({
 followUpDelay:8,spotterEscorts:2,openingAt:2.5,breathShort:4,breathLong:6,intelBonus:1.35,
 trenchBarrageDelay:18,trenchBarrageSoon:4,doverLeadBreak:2.4
});
const B=MAP_OPERATION_BALANCE;
const host=g=>!g.online||g.host;
const regionOf=g=>g.worldRegion?.()??g.region;
const stageKey=g=>`${g.stageCombatWindow?.loopIndex??g.stageBoss?.stages?.loopIndex??0}:${g.stageCombatWindow?.stageIndex??g.stageBoss?.stages?.stageIndex??regionOf(g)}:${regionOf(g)}`;
const ownFaction=g=>g.stageBoss?.stages?.teamFaction||g.teamFaction||g.faction||g.players?.[0]?.faction||'entente';
const firstLoop=g=>(g.stageBoss?.stages?.loopIndex??g.stageCombatWindow?.loopIndex??0)===0;

// sig: the stage's first optional objective. next: follow-up chosen from the
// first result. prep: what reaches the boss. Messages stay one short line.
const op=(sig,next,prep)=>Object.freeze({sig,next:Object.freeze(next||{}),prep});
const M={
 HVT:'HIGH_VALUE_TARGET',RESCUE:'RESCUE',BOMBER:'BOMBER_INTERCEPT',PHOTO:'PHOTO_RECON',ESCORT:'RECON_ESCORT',SUPPLY:'SUPPLY_RECOVERY',CONVOY:'TRANSPORT_CONVOY'
};
// Prep rules read the stage ledger and return [{breath|intel|harbor|capital, text}].
const rule=(test,effect,text,en)=>({test,effect,text,en});
const won=type=>s=>s.missions.some(m=>m.type===type&&m.outcome==='completed');
const lost=type=>s=>s.missions.some(m=>m.type===type&&m.outcome!=='completed');
const killed=(kind,n=1)=>s=>(s.kills[kind]||0)>=n;
const any=(...tests)=>s=>tests.some(t=>t(s));

export const MAP_OPERATIONS=Object.freeze({
 // 0 Rural · interdict: the observation post directs Bruno's rail gun, the
 // convoy feeds it. Cut either and the boss opens without that support.
 0:op('FORWARD_OBSERVER',{completed:M.CONVOY,failed:M.HVT},[
  rule(any(won('FORWARD_OBSERVER'),killed('spotter',2)),{breath:B.breathLong},'관측망 차단 · 열차포 첫 포격 지연','Observation cut · rail gun opens late'),
  rule(won(M.CONVOY),{intel:true},'보급 차단 · 열차포 약점 노출','Supplies cut · rail gun weak point exposed')]),
 1:op(M.BOMBER,{completed:M.ESCORT,failed:M.HVT},[
  rule(any(won(M.BOMBER),killed('bomber',4)),{breath:B.breathShort},'해상 폭격 저지 · 함대 첫 일제사격 지연','Raid stopped · fleet opens late'),
  rule(killed('recon'),{intel:true},'수상 정찰기 격추 · 함대 약점 노출','Seaplane down · fleet weak point exposed')]),
 // 2 Trench · breakthrough: spotters walk the barrage onto the pilot.
 2:op('ARTILLERY_SPOTTER',{completed:M.HVT,failed:M.BOMBER},[
  rule(any(won('ARTILLERY_SPOTTER'),killed('spotter',2)),{breath:B.breathLong},'포병 관측 차단 · 전차 지원포격 지연','Spotters down · armour support delayed'),
  rule(any(won(M.HVT),killed('commander')),{intel:true},'지휘 편대 격파 · 전차 약점 노출','Command flight broken · armour weak point exposed')]),
 3:op(M.HVT,{completed:M.PHOTO,failed:M.BOMBER},[
  rule(any(won(M.HVT),killed('commander')),{breath:B.breathShort},'지휘 편대 격파 · 적 첫 포격 지연','Command flight broken · first salvo delayed')]),
 // 4 City · defense (Entente) / escort (Central).
 4:op(M.BOMBER,{completed:M.RESCUE,failed:M.HVT},[
  rule(any(won(M.BOMBER),killed('bomber',4)),{intel:true},'폭격 편대 요격 · 고타 약점 노출','Raid intercepted · Gotha weak point exposed'),
  rule(won(M.BOMBER),{breath:B.breathShort},'선도 폭격 차단 · 첫 투하 지연','Pathfinders down · first drop delayed')]),
 5:op('BOMBER_STREAM',{completed:M.ESCORT,failed:M.HVT},[
  rule(any(won('BOMBER_STREAM'),killed('bomber',3)),{intel:true},'폭격기 대열 요격 · 보스 약점 노출','Bomber stream broken · boss weak point exposed')]),
 6:op(M.PHOTO,{completed:'MOUNTAIN_PURSUIT',failed:M.HVT},[
  rule(won('MOUNTAIN_PURSUIT'),{breath:B.breathShort},'산악 에이스 격추 · 적 첫 공격 지연','Mountain ace down · first attack delayed')]),
 // 7 Zeebrugge · sabotage: seaplanes radio the fleet, the fleet screens the port.
 7:op(M.PHOTO,{completed:M.HVT,failed:M.ESCORT},[
  rule(any(killed('recon'),killed('ship',2)),{harbor:true,breath:B.breathShort},'함대 연락 차단 · 군항 요새 재장전 지연','Fleet link cut · fortress reloads slowed')]),
 8:op(M.HVT,{completed:M.PHOTO,failed:M.BOMBER},[
  rule(any(won(M.HVT),killed('commander')),{breath:B.breathShort},'지휘기 격추 · 적 첫 공격 지연','Command aircraft down · first attack delayed')]),
 9:op(M.ESCORT,{completed:M.PHOTO,failed:M.HVT},[
  rule(won(M.ESCORT),{breath:B.breathShort},'정찰기 생환 · 비행단 첫 공격 지연','Recon home · wing attacks late')]),
 10:op(M.HVT,{completed:M.CONVOY,failed:M.PHOTO},[
  rule(killed('spotter'),{breath:B.breathLong},'관측기구 격추 · 지상 포격 지연','Balloon down · ground fire delayed'),
  rule(won(M.CONVOY),{intel:true},'보급 차단 · 보스 약점 노출','Supplies cut · boss weak point exposed')]),
 12:op(M.PHOTO,{completed:M.HVT,failed:M.HVT},[
  rule(any(won(M.HVT),killed('commander')),{breath:B.breathShort},'지휘기 격추 · 요새 첫 포격 지연','Command aircraft down · fort fires late')]),
 13:op(M.CONVOY,{completed:M.HVT,failed:M.PHOTO},[
  rule(won(M.CONVOY),{intel:true},'수송 차단 · 보스 약점 노출','Convoy cut · boss weak point exposed'),
  rule(any(won(M.HVT),killed('commander')),{breath:B.breathShort},'지휘기 격추 · 적 첫 공격 지연','Command aircraft down · first attack delayed')]),
 14:op(M.HVT,{completed:M.BOMBER,failed:M.PHOTO},[
  rule(any(won(M.HVT),killed('commander')),{breath:B.breathShort},'해안 지휘기 격추 · 요새 첫 포격 지연','Coastal command down · fort fires late'),
  rule(won(M.BOMBER),{intel:true},'폭격기 요격 · 요새 약점 노출','Bombers stopped · fort weak point exposed')]),
 16:op(M.PHOTO,{completed:M.HVT,failed:M.BOMBER},[
  rule(killed('ship',2),{breath:B.breathShort},'호위함 격침 · 함대 첫 일제사격 지연','Escorts sunk · fleet opens late')])
});
const CENTRAL_OPERATIONS=Object.freeze({
 // Central city: escort the raid instead of defending the city.
 4:op(M.ESCORT,{completed:M.HVT,failed:M.RESCUE},[
  rule(won(M.ESCORT),{breath:B.breathShort},'정찰기 생환 · 적 방공 첫 사격 지연','Recon home · defenses open late'),
  rule(any(won(M.HVT),killed('commander')),{intel:true},'요격 편대장 격추 · 보스 약점 노출','Intercept leader down · boss weak point exposed')])
});
export function mapOperation(game){
 const region=regionOf(game),profile=mapCombatProfile(game);
 if(!profile||profile.exclusiveObjective)return null;
 return ownFaction(game)==='central'&&CENTRAL_OPERATIONS[region]||MAP_OPERATIONS[region]||null;
}

function state(g){
 const key=stageKey(g);
 if(g.mapOperation?.key!==key)g.mapOperation={key,region:regionOf(g),enteredAt:g.t||0,missions:[],kills:{},seenResult:g.battlefieldEvents?.result?.id??null,wanted:null,followUp:null,applied:[],announced:{}};
 return g.mapOperation;
}

// The rural opening (first loop) keeps its seeded mission flow untouched.
function exploreSteering(g,s){
 const o=mapOperation(g);if(!o||regionOf(g)===0&&firstLoop(g))return null;
 if(!s.missions.length)return o.sig;
 return s.followUp&&!s.followUp.offered?s.followUp.type:null;
}

function classify(g,e){
 if(e.doverBomber||e.stageBossBody||e.bossMinion||e.bossPilot)return null;
 if(e.spotter||e.fieldUnit==='balloon'||['FORWARD_OBSERVER','ARTILLERY_SPOTTER'].includes(e.battlefieldEventType))return 'spotter';
 if(e.recon)return 'recon';
 if(e.eventCommander)return 'commander';
 if(e.transportCarrier)return 'transport';
 if(e.movingShip&&e.faction!==ownFaction(g))return 'ship';
 if(e.cityUnit)return 'cityDefense';
 if(e.type==='bomber'||e.heavyBomber)return 'bomber';
 return null;
}

function record(g,s){
 for(const e of g.enemies||[]){
  if(e.hp>0||e._mapOpSeen)continue;e._mapOpSeen=true;
  if(e.expired&&!e.crashing&&!e.movingShip)continue;
  const kind=classify(g,e);if(kind)s.kills[kind]=(s.kills[kind]||0)+1;
 }
 const result=g.battlefieldEvents?.result;
 if(result&&result.id!==s.seenResult){
  s.seenResult=result.id;
  if((g.battlefieldEvents.history?.at(-1)?.time??0)>=s.enteredAt&&['completed','failed','missed'].includes(result.outcome)){
   s.missions.push({type:result.type,outcome:result.outcome});
   onMissionResult(g,s,result);
  }
 }
}

// Ordinary fighters near a newly reported spotter close up on it, so the
// spotter is something to cut out of a formation rather than a lone target.
function escortSpotters(g,s){
 const event=g.battlefieldEvents?.current;if(!event||event.id===s.escortedEvent)return;s.escortedEvent=event.id;
 if(!['ARTILLERY_SPOTTER','FORWARD_OBSERVER'].includes(event.type)||regionOf(g)===0&&firstLoop(g))return;
 const leaders=(event.targets||[]).filter(t=>t.hp>0&&!t.stationary&&!t.fieldUnit);if(!leaders.length)return;
 const free=(g.enemies||[]).filter(e=>e.hp>0&&!e.expired&&!e.crashing&&e.type==='hunter'&&!e.missionTarget&&!e.battlefieldEventId&&!e.formationLeader&&!e.bossPilot&&!e.eliteKind&&!e.stageBossBody&&!e.bossMinion);
 free.sort((a,b)=>Math.hypot(a.x-leaders[0].x,a.y-leaders[0].y)-Math.hypot(b.x-leaders[0].x,b.y-leaders[0].y));
 for(let i=0;i<Math.min(B.spotterEscorts,free.length);i++){const e=free[i],side=i%2?1:-1;Object.assign(e,{formationLeader:leaders[i%leaders.length],formationBack:70,formationOffset:side*95,mapOpEscort:event.id});}
}
function releaseEscorts(g,s,result){
 for(const e of g.enemies||[])if(e.hp>0&&e.mapOpEscort===result.id){
  e.formationLeader=null;e.mapOpEscort=null;
  if(result.outcome==='completed'){g.breakEnemyFormation?.(e,2.5);e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,(g.t||0)+2.5);}
 }
}
function onMissionResult(g,s,result){
 releaseEscorts(g,s,result);
 const o=mapOperation(g),now=g.t||0;
 if(s.followUp?.offered===false&&s.followUp.type===result.type)s.followUp.offered=true;
 if(!o||s.followUp||regionOf(g)===0&&firstLoop(g))return;
 // The scheduler never repeats the mission that just ended; fall back to the
 // other branch so a fallback first mission still gets a real follow-up.
 const win=result.outcome==='completed';let type=o.next[win?'completed':'failed'];
 if(type===result.type)type=o.next[win?'failed':'completed'];
 if(!type||type===result.type)return;
 s.followUp={type,offered:false,at:now};
 const be=g.battlefieldEvents;if(be&&!be.current)be.nextOfferAt=Math.min(be.nextOfferAt??Infinity,now+B.followUpDelay);
 // Trench: the spotters decide where the next creeping barrage lands.
 if(regionOf(g)===2&&result.type==='ARTILLERY_SPOTTER'){
  const r=g.regionalCondition;
  if(result.outcome==='completed'){g._barrageT=(g._barrageT||0)+B.trenchBarrageDelay;if(r)r.next=Math.max(r.next||0,now+B.trenchBarrageDelay);say(g,'관측기 격추 · 이동 포격 18초 지연');}
  else{g._barrageT=Math.min(g._barrageT??B.trenchBarrageSoon,B.trenchBarrageSoon);if(r)r.next=Math.min(r.next??now,now+B.trenchBarrageSoon);say(g,'관측기 생존 · 포격선이 앞당겨집니다');}
 }
}
const say=(g,text)=>g.event?.('wave',text);

function applyBreath(encounter,seconds){
 const clock=encounter.clock||0,b=encounter.breath;
 if(b&&clock<b.until)return false;
 encounter.breath={blockFrom:clock,from:clock,until:clock+seconds,announced:true,mapOperation:true};
 return true;
}
function applyIntel(g){
 const be=g.battlefieldEvents;if(!be)return false;
 if(be.bossIntel)return false;
 be.bossIntel={region:regionOf(g),applied:false,bonus:B.intelBonus};return true;
}
function applyPrep(g,s,encounter){
 const o=mapOperation(g);if(!o)return;
 const done=[];
 for(const r of o.prep){
  if(!r.test(s))continue;let ok=false;
  if(r.effect.breath)ok=applyBreath(encounter,r.effect.breath)||ok;
  if(r.effect.intel)ok=applyIntel(g)||ok;
  if(r.effect.harbor){const be=g.battlefieldEvents;if(be&&!be.facilityEffect){(be.pending??={}).facility={eventId:'map-operation',region:7,bossKind:'armored-harbor-fortress',expiresAt:(g.t||0)+120};ok=true}}
  if(ok)done.push(r.text);
 }
 s.applied.push(encounter.id);
 if(done.length)say(g,'작전 성과 · '+done.join(' / '));
}

// Dover keeps its own counts and goals; this only makes the formation lead and
// the interception goal matter during the concurrent boss fight.
function tickDover(g,s){
 const m=g.doverMission;if(!m||m.faction!=='entente')return;
 for(const b of m.bombers){
  if(b.doverResult!=='shotDown'||b._mapOpLead)continue;b._mapOpLead=true;
  const lead=m.bombers.find(x=>x.wave===b.wave);if(lead!==b)continue;
  let broken=0;for(const e of g.enemies||[])if(e.hp>0&&e.doverEscort&&e.formationLeader&&e.formationLeader.wave===b.wave){g.breakEnemyFormation?.(e,B.doverLeadBreak);e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,(g.t||0)+B.doverLeadBreak);broken++}
  for(const x of m.bombers)if(x.wave===b.wave&&!x.doverResult)x.lastHitAt=g.t||0;
  if(!s.announced['lead'+b.wave]){s.announced['lead'+b.wave]=true;say(g,broken?'선두기 격추 · 호위 대형 붕괴':'선두기 격추 · 편대 회피 기동');}
 }
 const encounter=g.stageBoss?.stages?.phase==='boss'?g.stageBoss.stages.encounter:null;
 if(encounter&&!s.announced.goal&&m.shotDown>=m.config.interceptGoal){
  s.announced.goal=true;const breath=applyBreath(encounter,B.breathLong),intel=applyIntel(g);
  say(g,'요격 목표 달성 · '+(breath?'적 지휘기 엄호 사격 중단':'적 편대 지원 붕괴')+(intel?' · 약점 노출':''));
 }
}

// The capitals already slow their final boss once two defense posts are down
// (capitalDefenseSuppressed). Make that progress readable and carry it into
// both capital encounters (the mid-boss and the final).
const CAPITAL={18:{state:g=>g.berlinDefense,boss:'카이저크로네'},11:{state:g=>g.londonBattle,boss:'리바이어던'}};
function tickCapital(g,s,c){
 const d=c.state(g);if(!d)return;
 const n=d.suppressed||0;
 // Posts respawn while the city is held, so only the two thresholds speak.
 for(const [at,text] of [[2,`방공망 2곳 제압 · ${c.boss} 포격 지연 확보`],[4,'방공망 4곳 제압 · 수도 결전 약점 노출 확보']])if(n>=at&&!s.announced['capital'+at]){s.announced['capital'+at]=true;say(g,text);}
 const encounter=g.stageBoss?.stages?.phase==='boss'?g.stageBoss.stages.encounter:null;
 if(encounter&&n>=2&&!s.applied.includes(encounter.id)&&(encounter.clock||0)>=B.openingAt){
  s.applied.push(encounter.id);const breath=applyBreath(encounter,B.breathShort),intel=n>=4&&applyIntel(g);
  if(breath||intel)say(g,'작전 성과 · 수도 방공망 제압'+(breath?' · 첫 포격 지연':'')+(intel?' · 약점 노출':''));
 }
}

export function tickMapOperation(g){
 if(!g||!host(g)||g.mode==='campaign'||!g.stageBoss?.stages)return;
 const s=state(g);
 if(g.state==='playing'){
  record(g,s);escortSpotters(g,s);
  const region=regionOf(g);
  if(region===17)tickDover(g,s);
  else if(CAPITAL[region])tickCapital(g,s,CAPITAL[region]);
  const stages=g.stageBoss.stages,encounter=stages.phase==='boss'?stages.encounter:null;
  if(encounter&&!s.applied.includes(encounter.id)&&(encounter.clock||0)>=B.openingAt&&!CAPITAL[region])applyPrep(g,s,encounter);
 }
 s.wanted=g.stageBoss.stages.phase==='explore'?exploreSteering(g,s):null;
}


export function installMapOperationFlow(Game){
 const P=Game.prototype;if(P.__mapOperationFlow)return;P.__mapOperationFlow=true;
 const tick=P.tickBattlefieldEvents;
 P.tickBattlefieldEvents=function(){tickMapOperation(this);return tick?.call(this);};
}
export {T as MAP_OPERATION_TYPES};
// Korean→English pieces for event-text-en (the toasts above are composed).
export const MAP_OPERATION_PHRASES=Object.freeze([
 ...new Map([...Object.values(MAP_OPERATIONS),...Object.values(CENTRAL_OPERATIONS)].flatMap(o=>o.prep.map(r=>[r.text,r.en]))),
 ['작전 성과 · ','Operation result · '],['관측기 격추 · 이동 포격 18초 지연','Spotters down · creeping barrage delayed 18s'],['관측기 생존 · 포격선이 앞당겨집니다','Spotters alive · the barrage moves up'],
 ['선두기 격추 · 호위 대형 붕괴','Wave lead down · escorts break formation'],['선두기 격추 · 편대 회피 기동','Wave lead down · formation breaks to evade'],
 ['요격 목표 달성 · ','Interception goal met · '],['적 지휘기 엄호 사격 중단','command aircraft holds fire'],['적 편대 지원 붕괴','formation support collapses'],[' · 약점 노출',' · weak point exposed'],
 ['방공망 2곳 제압 · 카이저크로네 포격 지연 확보','Two defense posts down · Kaiserkrone fires slower'],['방공망 2곳 제압 · 리바이어던 포격 지연 확보','Two defense posts down · Leviathan fires slower'],
 ['방공망 4곳 제압 · 수도 결전 약점 노출 확보','Four defense posts down · capital boss weak point secured'],['수도 방공망 제압','capital defenses suppressed'],[' · 첫 포격 지연',' · first salvo delayed']
]);
