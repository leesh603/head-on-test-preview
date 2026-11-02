import {majorEncounterBlocked} from './encounter-admission.js';
import {SQUADRON_OPPORTUNITY,advanceSquadronOpportunity,rollSquadronOpportunity,chooseSquadronFamily,commitSquadronOpportunity,finishSquadronOpportunity} from './squadron-opportunities.js';
import {LEGACY_SQUADRONS,legacyReservedSlots,canRequestLegacySquadron,legacySquadronSelection,requestLegacySquadron,tickLegacySquadrons,withdrawLegacySquadrons} from './legacy-squadron-adapter.js';
import {spawnLegendWing,canSpawnLegendWing,tickLegendWing,withdrawLegendWing,installLegendCombat} from './legend-squadron-combat.js';
import {warmLegendArt} from './legend-squadron-combat.js';
import {spawnExpansionWing,canSpawnExpansionWing,tickExpansionWing,withdrawExpansionWing,installExpansionCombat} from './famous-squadron-expansion.js';
import {warmExpansionArt} from './famous-squadron-expansion.js';
import {spawnCigognesPatrol,canSpawnCigognesPatrol,tickCigognesPatrol,installCigognesPatrol,withdrawCigognesPatrol} from './cigognes-cannon-patrol.js';
import {warmCigognesArt} from './cigognes-cannon-patrol.js';
import {spawnHatRingBlockade,canSpawnHatRingBlockade,tickHatRingBlockade,installHatRingBlockade,withdrawHatRingBlockade} from './hat-ring-blockade.js';
import {warmHatRingArt} from './hat-ring-blockade.js';
import {spawnFamousWing,canSpawnFamousWing,tickFamousWing,installFamousWingCombat,withdrawFamousWing} from './famous-wing-combat.js';
import {warmFamousWingArt} from './famous-wing-combat.js';
import {squadronHost,squadronDirectorState,squadronPending,resetSquadronRun,squadronPresentationReady,SQUADRON_PROFILES} from './squadron-combat-state.js';
export {configureSquadronPresentation} from './squadron-combat-state.js';
const ORDER=Object.freeze({central:['cigognes','hat-ring','lafayette','spa65','sqn56','le_prieur_squadron','salamander_squadron'],entente:['jasta18','jasta5','jasta2','schlachtstaffel','junkers_squadron']});
const live=e=>e&&e.hp>0&&!e.crashing&&!e.expired;
export function squadronOpportunityOpen(g){
 const p=g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
 return !majorEncounterBlocked(g,'squadron')&&squadronHost(g)&&Number.isFinite(g.stageCombatWindow?.remaining)&&g.stageCombatWindow.stageIndex===g.stageBoss?.stages?.stageIndex&&(g.stageCombatWindow.loopIndex??0)===(g.stageBoss?.stages?.loopIndex||0)&&g.state==='playing'&&p.hp>0&&g.mode!=='campaign'&&!g.historicalMode&&!g.stage?.historicalAnchorDate&&g.stageBoss?.stages?.phase==='explore'&&!g.stageCombatWindow?.ready&&!['active','pending','dispatching'].includes(g.photoReconDirector?.phase)&&g.battlefieldEvents?.current?.status!=='active'&&!['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)&&!g.londonBattle&&!g.parisBattle&&!g.verdunBattle&&(g.battleRecoveryUntil||0)<=(g.t||0)&&(g.bossPresentationAfter||0)<=(g.t||0)&&!(g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));
}
export function eligibleSquadrons(g){
 if(!squadronOpportunityOpen(g))return [];
 const own=g.stageBoss?.stages?.teamFaction||g.teamFaction,order=ORDER[own]||[];
 return order.filter(id=>LEGACY_SQUADRONS.includes(id)?canRequestLegacySquadron(g,id):id==='cigognes'?canSpawnCigognesPatrol(g):id==='hat-ring'?canSpawnHatRingBlockade(g):['jasta5','spa65'].includes(id)?canSpawnExpansionWing(g,id):['sqn56','jasta2'].includes(id)?canSpawnLegendWing(g,id):canSpawnFamousWing(g,id));
}
/** Preserve35percent odds but fit retry timing into the actually available combat window. */
export function squadronRetryDelay(g){const now=g.t||0,ace=Number.isFinite(g.nextBossAt)&&g.nextBossAt>now&&!g.pendingAceCount?g.nextBossAt-now:Infinity,window=Number.isFinite(g.stageCombatWindow?.remaining)?Math.max(0,g.stageCombatWindow.remaining-24):Infinity;return Math.max(4,Math.min(SQUADRON_OPPORTUNITY.retry,Math.min(ace,window)/2));}
export function requestSquadron(g,id){
 if(!squadronHost(g)||g.state!=='playing'||squadronPending(g))return false;
 const s=squadronDirectorState(g);if(s.owner)return false;s.owner={unitId:id,pending:true};
 let result;try{result=LEGACY_SQUADRONS.includes(id)?requestLegacySquadron(g,id):id==='cigognes'?spawnCigognesPatrol(g):id==='hat-ring'?spawnHatRingBlockade(g):['jasta5','spa65'].includes(id)?spawnExpansionWing(g,id):['sqn56','jasta2'].includes(id)?spawnLegendWing(g,id):spawnFamousWing(g,id);if(result){s.waitingForClear=true;s.introPending=false;}return result;}finally{if(!result)s.owner=null;}
}
// Same-rank optional missions may yield one bounded slot per stage; existing
// missions, recon, bosses and ordinary enemy spawning are never interrupted.
export function reserveSquadronOpportunity(g){
 if(!squadronOpportunityOpen(g)||squadronPending(g))return false;
 const s=squadronDirectorState(g),now=g.t||0;
 if(s.owner||s.waitingForClear)return false;
 const w=g.stageCombatWindow,stage=`${w.loopIndex||0}:${w.stageIndex}:${g.stageBoss.stages.orderPosition||0}`;
 if(s.introPending)s.firstAt=Math.max(30,Math.min(s.firstAt??SQUADRON_OPPORTUNITY.firstAt,now+w.remaining-36));
 const due=s.introPending?Math.max(0,(s.firstAt??45)-now):s.nextIn;
 if(due>18||!eligibleSquadrons(g).length)return false;
 let r=s.optionalReservation;
 if(!r||r.stage!==stage)r=s.optionalReservation={stage,until:now+18,opportunities:s.opportunities};
 return now<r.until&&r.opportunities===s.opportunities;
}
export function tickSquadronPatrols(g,dt){
 if(!squadronHost(g)||!(dt>0))return;if(g.state!=='playing'){if(['lost','won','dead'].includes(g.state)){withdrawCigognesPatrol(g,'run-ended');withdrawHatRingBlockade(g,'run-ended');withdrawFamousWing(g,'run-ended');withdrawExpansionWing(g,'run-ended');withdrawLegendWing(g,'run-ended');withdrawLegacySquadrons(g,'run-ended');if(g.squadronArrival)g.squadronArrival=null;}return;}g.squadronManaged=true;let s=squadronDirectorState(g);
 if((g.t||0)<s.lastTime){withdrawCigognesPatrol(g,'restart');withdrawHatRingBlockade(g,'restart');withdrawFamousWing(g,'restart');withdrawExpansionWing(g,'restart');withdrawLegendWing(g,'restart');withdrawLegacySquadrons(g,'restart');s=resetSquadronRun(g);}s.lastTime=g.t||0;
 tickCigognesPatrol(g,dt);tickHatRingBlockade(g,dt);tickFamousWing(g,dt);tickExpansionWing(g,dt);tickLegendWing(g,dt);tickLegacySquadrons(g,dt);
 if(g.state!=='playing'){g.squadronArrival=null;return;}
 if(s.owner&&!squadronPending(g))s.owner=null;
 if(g.squadronArrival&&(g.t||0)>=g.squadronArrival.until)g.squadronArrival=null;
 if(s.pendingPolicy){const p=s.pendingPolicy;if(s.serial>(p.serial??s.serial)||s.owner&&!s.owner.pending){commitSquadronOpportunity(s,p.id,p.family,g.t||0);s.pendingPolicy=null;}else if(!s.owner&&!squadronPending(g)){s.pendingPolicy=null;s.waitingForClear=false;s.approvedOpportunity=true;s.nextIn=1;}}
 if(s.owner||squadronPending(g))return;
 if(s.waitingForClear){finishSquadronOpportunity(s,g.t||0);return;}
 if(s.introPending&&Number.isFinite(g.stageCombatWindow?.remaining))s.firstAt=Math.max(30,Math.min(s.firstAt??SQUADRON_OPPORTUNITY.firstAt,(g.t||0)+g.stageCombatWindow.remaining-36));
 // Warm eligible faction art before the narrow first-stage opportunity; never spawn or roll here.
 if(s.introPending&&(g.t||0)>=SQUADRON_OPPORTUNITY.firstAt-20&&(g.t||0)>=(s.nextWarmAt||0)){s.nextWarmAt=(g.t||0)+1;const own=g.stageBoss?.stages?.teamFaction||g.teamFaction;for(const id of ORDER[own]||[]){squadronPresentationReady(id);if(id==='cigognes')warmCigognesArt();else if(id==='hat-ring')warmHatRingArt();else if(['jasta18','lafayette'].includes(id))warmFamousWingArt(id);else if(['jasta5','spa65'].includes(id))warmExpansionArt(id);else if(['sqn56','jasta2'].includes(id))warmLegendArt(id);}}
 if(!advanceSquadronOpportunity(s,g.t||0,dt,squadronOpportunityOpen(g)))return;
 const pool=eligibleSquadrons(g);if(!pool.length)return;
 const rng=()=>Math.max(0,Math.min(.999999999999,Number(g.rng?.()??Math.random())||0));
 if(!rollSquadronOpportunity(s,rng,g.t||0)){s.nextIn=squadronRetryDelay(g);return;}
 const families=[...new Set(pool.map(id=>LEGACY_SQUADRONS.includes(id)?'legacy':id))],family=chooseSquadronFamily(s,families,rng);let id=family;
 if(family==='legacy'){const legacy=pool.filter(id=>LEGACY_SQUADRONS.includes(id)&&id!==s.lastUnitId),own=g.stageBoss?.stages?.teamFaction||g.teamFaction,base=own==='central'?'le_prieur_squadron':'schlachtstaffel',armored=own==='central'?'salamander_squadron':'junkers_squadron',meta=legacySquadronSelection(g);id=legacy.includes(armored)&&meta.progress>=meta.tier2Stage&&rng()<meta.tier2Chance?armored:base;if(!legacy.includes(id))id=legacy[0];}
 if(id&&id!==s.lastUnitId&&requestSquadron(g,id)){if(LEGACY_SQUADRONS.includes(id)){s.pendingPolicy={id,family,serial:s.serial};s.waitingForClear=false;}else commitSquadronOpportunity(s,id,family,g.t||0);}
 else s.nextIn=1; // Keep the already-approved opportunity; a failed native admission never rerolls every frame.

}
export function installSquadronPatrols(Game){const p=Game.prototype; p.reserveSquadronOpportunity=function(){return reserveSquadronOpportunity(this);};if(Object.hasOwn(p,'__squadronPatrols'))return;p.__squadronPatrols=true;
 installCigognesPatrol(Game);installHatRingBlockade(Game);installFamousWingCombat(Game);installExpansionCombat(Game);installLegendCombat(Game);
 const update=p.update;p.update=function(dt,...args){if(this.state==='playing'){this.squadronManaged=true;if(this.eliteEnemies&&squadronHost(this))for(const b of this.bullets||[]){b.previousX=b.x;b.previousY=b.y;}}const result=update.call(this,dt,...args);tickSquadronPatrols(this,dt);return result;};
 const aces=p.runScheduledAces;if(aces){p._squadronAceArbiter=true;p.runScheduledAces=function(...args){const id=this.squadronDirector?.owner?.unitId;if(Object.hasOwn(SQUADRON_PROFILES,id||'')&&squadronPending(this)&&!this.pendingAceCount&&(this.t||0)-(LEGACY_SQUADRONS.includes(id)?this.legacySquadron?.started:this.squadronArrival?.startedAt??this.squadronDirector?.lastAdmissionAt??-Infinity)<36&&!(this.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody))&&!['warning','entering','active','retreating'].includes(this.intrusionBoss?.phase))return;return aces.apply(this,args);};}
 const spawn=p.spawnEnemy;if(spawn)p.spawnEnemy=function(type,...args){const n=legacyReservedSlots(this);if(n&&['scout','hunter','bomber'].includes(type)&&!this.bossMechanicSpawn&&!this.battlefieldEventSpawning&&!(this.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody))){const es=(this.enemies||[]).filter(live),regular=es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length;if(regular+1+n>(this.regularEnemyLimit?.()??12)||es.length+1+n>(this.enemyCapacity?.()??65)-1)return null;}return spawn.call(this,type,...args);};
 const offer=p.offerBattlefieldEvent;if(offer)p.offerBattlefieldEvent=function(...args){if(this.squadronDirector?.owner&&squadronPending(this)||reserveSquadronOpportunity(this))return null;return offer.apply(this,args);};
}
