import {majorEncounterBlocked} from './encounter-admission.js?v=09c75d146ae4289d';
import {newSquadronOpportunity,SQUADRON_OPPORTUNITY} from './squadron-opportunities.js?v=09c75d146ae4289d';
/** Shared admission/presentation contract for optional historical-squadron encounters. */
export const SQUADRON_PROFILES=Object.freeze({
 cigognes:Object.freeze({name:'시고뉴 기관포 편대',faction:'entente'}),
 'hat-ring':Object.freeze({name:'제94항공대 · Hat in the Ring',faction:'entente'}),
 jasta18:Object.freeze({name:'야스타 18 · 라벤의 까마귀',faction:'central'}),
 lafayette:Object.freeze({name:'라파예트 에스카드리유',faction:'entente'}),
 jasta5:Object.freeze({name:'야스타 5 · 녹색 꼬리',faction:'central'}),
 spa65:Object.freeze({name:'SPA 65 · 키메라',faction:'entente'}),
 sqn56:Object.freeze({name:'제56비행대 · S.E.5a',faction:'entente'}),
 jasta2:Object.freeze({name:'야스타 2 · 뵐케',faction:'central'}),
 le_prieur_squadron:Object.freeze({name:'르 프리외르 로켓 편대',faction:'entente'}),
 schlachtstaffel:Object.freeze({name:'슐라흐트슈타펠 · 장갑 공격편대',faction:'central'}),
 junkers_squadron:Object.freeze({name:'융커스 J.I 장갑편대',faction:'central'}),
 salamander_squadron:Object.freeze({name:'샐러맨더 시험운용 편대',faction:'entente'})
});
let presentation,runSerial=0;
export function configureSquadronPresentation(hooks){presentation=hooks;}
export function squadronPresentationReady(id){if(typeof Image==='undefined')return true;if(presentation?.ready?.(id))return true;presentation?.load?.(id)?.catch?.(()=>{});return false;}
export const squadronHost=g=>!g.online||g.host;
export function squadronDirectorState(g){return g.squadronDirector??={runId:++runSerial,serial:0,...newSquadronOpportunity(g.t||0),owner:null,nextIndex:0,lastTime:g.t||0,announced:[]};}
export function squadronAircraftPending(g,id){return !!(g.eliteEnemies?.pendingEncounter&&(!id||g.eliteEnemies.pendingEncounter.kind===id))||(g.eliteEnemies?.members||[]).some(m=>m.alive&&m.hp>0&&(!id||m.eliteKind===id))||(g.enemies||[]).some(e=>e.hp>0&&!e.expired&&(id==='cigognes'?!!e.cigognesRole:id==='hat-ring'?e.hatRingGroup!=null:id?(e.famousWingUnit===id||e.expansionWingUnit===id||e.legendWingUnit===id):!!e.cigognesRole||e.hatRingGroup!=null||e.famousWingGroup!=null||e.expansionWingGroup!=null||e.legendWingGroup!=null))||(g.patrols||[]).some(p=>p.spa65Courier&&p.hp>0&&p.life>0&&(!id||id==='spa65'));}
export function squadronShotsPending(g,id){return (g.eliteEnemies?.projectiles||[]).some(p=>p.life>0&&(!id||p.eliteKind===id))||(g.bullets||[]).some(b=>b.life>0&&(id==='cigognes'?b.cigognesGroup!=null:id==='hat-ring'?b.hatRingGroup!=null:id?(b.famousWingUnit===id||b.expansionWingUnit===id||b.legendWingUnit===id):b.cigognesGroup!=null||b.hatRingGroup!=null||b.famousWingGroup!=null||b.expansionWingGroup!=null||b.legendWingGroup!=null));}
export const squadronPending=(g,id)=>squadronAircraftPending(g,id)||squadronShotsPending(g,id);
export function canAdmitSquadron(g,id){return !majorEncounterBlocked(g,'squadron')&&squadronHost(g)&&!!SQUADRON_PROFILES[id]&&(!g.squadronDirector?.owner||g.squadronDirector.owner.unitId===id)&&!squadronPending(g)&&squadronPresentationReady(id);}
export function announceSquadron(g,id,groupId){
 if(!squadronHost(g)||!SQUADRON_PROFILES[id])return null;
 const s=squadronDirectorState(g),key=`${id}:${groupId}`;if(s.announced.includes(key))return s.owner?.token||null;
 // Render-only unit paint: preserve weapon/handling keys and courier identity.
 for(const e of g.enemies||[]){
  const owns=id==='cigognes'?e.cigognesGroup===groupId&&!!e.cigognesRole:id==='hat-ring'?e.hatRingGroup===groupId:e.famousWingUnit===id&&e.famousWingGroup===groupId||e.expansionWingUnit===id&&e.expansionWingGroup===groupId||e.legendWingUnit===id&&e.legendWingGroup===groupId;
  if(owns)e.formationLivery=id==='cigognes'?(e.cigognesRole==='cannon'?'cigognes_cannon_paint':'cigognes_escort_paint'):{'hat-ring':'hat_ring_paint',jasta18:'jasta18_paint',lafayette:'lafayette_paint',jasta5:'jasta5_patrol',spa65:'spa65_paint',sqn56:'sqn56_paint',jasta2:'jasta2_paint'}[id];
 }
 s.announced.push(key);if(s.announced.length>32)s.announced.shift();
 const token=`squadron:${s.runId}:${++s.serial}:${id}:${groupId}`;s.owner={unitId:id,groupId,token};s.nextIn=SQUADRON_OPPORTUNITY.cooldown;s.waitingForClear=true;s.introPending=false;
 const notice={token,unitId:id,groupId,startedAt:g.t||0,until:(g.t||0)+1.8};g.squadronArrival=notice;(g.events??=[]).push({type:'squadronArrival',text:SQUADRON_PROFILES[id].name,...notice});return token;
}
export function resetSquadronRun(g){g.squadronArrival=null;g.squadronDirector={runId:++runSerial,serial:0,...newSquadronOpportunity(g.t||0),owner:null,nextIndex:0,lastTime:g.t||0,announced:[]};return g.squadronDirector;}
