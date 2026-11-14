/** Admission and lifetime adapter only: native legacy weapons, armor and rewards remain authoritative. */
import {attachEliteSystem,routeFriendlyProjectileHits} from './elite-patch/module/headon-bridge.js?v=earned-rewards-7ccfad1b-20261114';
import {ELITE_KINDS,squadSize} from './elite-patch/module/elite-config.js?v=quality-audit-596-c6ea4cf8-20261109';
import {canAdmitSquadron,announceSquadron,squadronHost,squadronDirectorState} from './squadron-combat-state.js?v=quality-audit-596-c6ea4cf8-20261109';
export const LEGACY_SQUADRONS=Object.freeze(Object.values(ELITE_KINDS));
let integration={};
export function configureLegacySquadrons(options={}){integration=options;}
const alive=p=>p&&p.hp>0&&p.status!=='downed',pilot=g=>g.players?.find(alive)||g;
const stage=g=>`${g.stageBoss?.stages?.loopIndex||0}:${g.stageBoss?.stages?.stageIndex??-1}`;
function priority(g){return g.state!=='playing'||!alive(pilot(g))||g.mode==='campaign'||g.historicalMode||g.stage?.historicalAnchorDate||g.stageBoss?.stages?.phase!=='explore'||g.stageCombatWindow?.ready||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||g.battlefieldEvents?.current?.status==='active'||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||g.londonBattle||g.parisBattle||g.verdunBattle||(g.battleRecoveryUntil||0)>(g.t||0)||(g.bossPresentationAfter||0)>(g.t||0);}
function room(g,system,id){const progress=system.host.getProgressStage(),count=Math.min(system.config.maxActiveMembers,squadSize(id,progress,true)),existing=(g.enemies||[]).filter(e=>e.hp>0&&!e.expired&&!e.crashing);return existing.length+count<=(g.enemyCapacity?.()??65)-1&&existing.filter(e=>['scout','hunter','bomber'].includes(e.type)&&!e.bossPilot&&!e.heavyBomber).length+count<=(g.regularEnemyLimit?.()??12);}
function attach(g){
 const base=integration.bindings||g.__eliteBindings||{},bindings={...base,getPlayer:w=>pilot(w),getPlayerFaction:w=>w.stageBoss?.stages?.teamFaction||w.teamFaction||base.getPlayerFaction?.(w)||w.playerFaction,getProgressStage:w=>base.getProgressStage?.(w)??Math.floor(Math.max(0,w.distance||0)/12000)+1};
 if(g.players){bindings.damagePlayer=(w,damage,meta)=>{const p=w.players.find(p=>p.id===meta?.playerId)||pilot(w);p.damageSource={bullet:meta?.projectile};p.hit?.(damage);};bindings.onEliteKilled=undefined;}
 const system=attachEliteSystem(g,bindings);
 system.host.isManaged=()=>g.squadronManaged===true;
 // Only an uncommitted ordinary ace time slot can yield to the shared owner.
 // Actual ace entities and queued/telegraphed encounters remain authoritative.
 if(!system.host._squadronAceClock)system.host._squadronAceClock=system.host.secondsUntilAce;
 system.host.secondsUntilAce=()=>{
  const seconds=system.host._squadronAceClock?.()??Infinity;
  const reserved=g._squadronAceArbiter&&g.squadronManaged&&!g.pendingAceCount&&!system.host.isAceActive?.()&&g.stageBoss?.stages?.phase==='explore'&&!['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase);
  return reserved&&(seconds>0||LEGACY_SQUADRONS.includes(g.squadronDirector?.owner?.unitId))?Infinity:seconds;
 };
 // Managed native entry points cannot bypass the common opportunity clock and RNG.
 // The central scheduler calls requestLegacySquadron, then _admittedSpawn creates the native group.
 g._requestLegacyEncounter=()=>null;
 system.host.requestEncounter=g._requestLegacyEncounter;
 system.host.getPlayers=()=>g.players?.filter(alive)||[g];
 return {system,bindings};
}
function legacyAdmission(g,id,selectKind=false){
 if(!squadronHost(g)||g.state!=='playing'||priority(g)||integration.ready&& !integration.ready())return false;
 const {system}=attach(g);if(selectKind)id??=system.chooseKind();
 if(!LEGACY_SQUADRONS.includes(id)||!canAdmitSquadron(g,id)||!system.canSchedule(g.t||0)||(system.host.secondsUntilAce?.()??Infinity)<system.config.aceBeforeLockout+system.config.warningLead+.04)return false;
 const own=system.host.getPlayerFaction(),entente=id===ELITE_KINDS.LE_PRIEUR||id===ELITE_KINDS.SALAMANDER;
 if((own==='central')!==entente||!['central','entente'].includes(own))return false;
 const progress=system.host.getProgressStage();if([ELITE_KINDS.JUNKERS,ELITE_KINDS.SALAMANDER].includes(id)&&progress<system.config.tier2Stage)return false;
 if(!room(g,system,id)||(g.stageCombatWindow?.remaining??Infinity)<32)return false;
 return {system,id};
}
/** Explicit-ID preflight: same native gates, no warning reservation and no random kind selection. */
export function canRequestLegacySquadron(g,id){return !!legacyAdmission(g,id);}
/** Read the native progression/armored weighting rather than duplicating its constants. */
export function legacySquadronSelection(g){const {system}=attach(g);return {progress:system.host.getProgressStage(),unlockStage:system.config.unlockStage,tier2Stage:system.config.tier2Stage,tier2Chance:system.config.tier2Chance};}
export function requestLegacySquadron(g,id){
 const admission=legacyAdmission(g,id,true);if(!admission)return false;
 const {system}=admission;id=admission.id;
 g.squadronManaged=true;g.legacySquadron={unitId:id,phase:'warning',started:g.t||0,stageKey:stage(g)};
 squadronDirectorState(g);
 g.squadronDirector.owner={unitId:id,pending:true};
 system.pendingEncounter={kind:id,spawnAt:(g.t||0)+system.config.warningLead};
 system.host.emitWarning?.('정예 편대 접근',{kind:id});return system.pendingEncounter;
}
export function withdrawLegacySquadrons(g,reason='priority'){
 if(!squadronHost(g)||!g.eliteEnemies)return;
 const system=g.eliteEnemies;system.pendingEncounter=null;
 if(g.legacySquadron){g.legacySquadron.phase='exit';g.legacySquadron.outcome=reason;}
 for(const s of system.squadrons||[]){if(s.phase==='departing')continue;s.phase='departing';for(const m of s.members)if(m.alive){m.departureHeading=m.a+(Math.sign(m.slot)||1)*.45;m.telegraph=0;}}
}
export function tickLegacySquadrons(g,dt){
 if(!squadronHost(g)||!(dt>0))return;
 if(g.state!=='playing'){if(['lost','won','dead'].includes(g.state))withdrawLegacySquadrons(g,'run-ended');return;}
 const state=g.legacySquadron;
 const {system,bindings}=attach(g);
 if(state&&(priority(g)||state.stageKey!==stage(g)||system.host.isAceActive?.()||(g.t||0)-state.started>26))withdrawLegacySquadrons(g,'priority-or-timeout');
 if(system.pendingEncounter&&(g.t||0)>=system.pendingEncounter.spawnAt){
  const id=system.pendingEncounter.kind;if(!room(g,system,id)||!system.canSchedule(g.t||0)){system.pendingEncounter=null;g.legacySquadron.phase='idle';return;}system._admittedSpawn=true;let squad;try{squad=system.spawnEncounter(id);}finally{system._admittedSpawn=false;}
  if(squad){g.legacySquadron.phase='active';g.legacySquadron.groupId=squad.id;announceSquadron(g,id,squad.id);}else system.pendingEncounter=null;
 }
 system.update(dt);routeFriendlyProjectileHits(g,system,bindings);
 if(state&&!system.active&&!system.projectiles.length)state.phase='idle';
}
export function legacySquadronSnapshot(g,includeProjectiles=true){
 const s=g.eliteEnemies;if(!s)return null;
 const clean=m=>Object.fromEntries(Object.entries(m).filter(([k,v])=>!['formationLeader','formationResumeLeader'].includes(k)&&['number','string','boolean'].includes(typeof v)));
 return {members:s.members.map(clean),...(includeProjectiles?{projectiles:s.projectiles.map(clean)}:{}),pendingEncounter:s.pendingEncounter?{...s.pendingEncounter}:null};
}
export function renderLegacySquadrons(ctx,g,point){const s=g.online&&!g.host?g.legacySquadronVisual:g.eliteEnemies;if(s)integration.render?.(ctx,s,point,g.t||0);}

/** Pending native warning reserves only its future member slots. */
export function legacyReservedSlots(g){const e=g.eliteEnemies,id=e?.pendingEncounter?.kind;return g.squadronManaged&&id?Math.min(e.config.maxActiveMembers,squadSize(id,e.host.getProgressStage(),true)):0;}
