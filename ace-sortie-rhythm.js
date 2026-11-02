import {arrivalViewport} from './enemy-arrivals.js';
import {ordinaryAdmissionStage,admissionState,encounterAllowed,admitEncounter,admissionTrace} from './director-admission.js';
import {intrusionActive} from './intrusion-bosses.js';
import {activeFronts} from './rural-fronts.js';
import {pilotAircraftChoices,SORTIE_FITS} from './pilot-aircraft.js?v=pilotair1&art=pilot-recovery2';
import {resolveAircraftPersonalityId} from './aircraft-personality164.js?v=gal1';

export const ACE_SORTIE_BALANCE=Object.freeze({maxAces:3,recovery:8,ruralOpening:40,ruralReinforce:65});
// These are actual model identities, independent of personal paint or sprite ID.
const MODEL_ALIASES=Object.freeze({
 baron_albatros:'albatros',boelcke_albatros:'albatros_d2',wolff_albatros:'albatros',
 brumowski_albatros:'albatros',schleich_albatros:'albatros_dva',fokker_jacobs:'fokker',
 lothar_dr1:'fokker',gontermann_fokker:'fokker',loewenhardt_fokkerd7:'fokkerd7',
 rickenbacker_spad:'spad',ball_se5a:'se5a',barker_snipe:'snipe',luke_nieuport28:'nieuport28',
 mccudden_se5a:'se5a',proctor_se5a:'se5a',lufbery_nieuport17:'nieuport',
 nungesser_nieuport24:'nieuport24',nieuport_italian:'nieuport',spad13:'spad',nieuport17:'nieuport',
 morane_l:'morane_l',bristol_scout_c:'bristol_scout_c',hansa_brandenburg_di:'hansa_brandenburg_di',voisin_iii:'voisin_iii'
});
const ordinary=e=>!!(e?.bossPilot&&!e.stageBossBody&&!e.bossMinion&&!e.encounterId&&!e.escortLeaderId);
const living=e=>!!(e?.hp>0&&!e.expired&&!e.rivalEscaped&&!e.deathHandled&&!e.crashing&&!e.crashed);
const loopOf=game=>Math.max(0,game.stageBoss?.stages?.loopIndex||0);
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;

function aceCoverLeader(g,e){return (g.enemies||[]).find(a=>living(a)&&a.aceSortieManaged&&a.bossPilot===e.aceCoverPilot&&a.aceGroupStartedAt===e.aceCoverStartedAt);}
function aceCoverAttack(g,e,leader=aceCoverLeader(g,e)){
 if(!leader)return false;
 const exiting=leader.rivalEscaping||leader.aceRetreat||leader.disengageUntil>(g.t||0)||['DISENGAGE','EXTEND','RECOVER'].includes(leader.aceTacticalState||leader.combatPassState);
 return !!exiting&&((Math.floor((g.t||0)/1.4)+e.aceCoverSlot)%2===0);
}
export function aceCoverShotReady(g,e){return !e?.aceCoverPilot||e.aceCoverAuthored||aceCoverAttack(g,e);}
function addAceCover(g,ace){
 if(!ordinaryAdmissionStage(g)||ace.aceCoverSpawned||ace.aceAttackSlot!==0)return;
 const time=g.t||0;ace.aceCoverDeadline??=time+8;
 if(!living(ace)||g.stageBoss?.stages?.phase!=='explore'||time>=ace.aceCoverDeadline){ace.aceCoverSpawned=true;admissionTrace(g,'supportCancelled',{kind:'ace-cover',reason:'arrival-window-expired',pilot:ace.bossPilot});return;}
 if(time<(ace.aceCoverRetryAt||0))return;ace.aceCoverRetryAt=time+.3;
 ace.aceCoverSlots??=(g.enemies||[]).filter(e=>e.aceCoverPilot===ace.bossPilot&&e.aceCoverStartedAt===ace.aceGroupStartedAt).reduce((bits,e)=>bits|(1<<e.aceCoverSlot),0);
 const a=ace.a||0;let added=0;
 // Formation specialists already own authored escort airframes and handling.
 // Link their first pair without creating extra generic hunters or retuning
 // their paint, speed, weapon, station or native firing choreography.
 const authored=(g.enemies||[]).filter(e=>living(e)&&e.formationLeader===ace);
 if(['goering','mannock','collishaw'].includes(ace.bossPilot)&&!authored.length)return;
 for(let slot=0;slot<2;slot++){
  if(ace.aceCoverSlots&(1<<slot))continue;
  const existing=authored.find(e=>!e.aceCoverPilot);
  if(existing){Object.assign(existing,{aceCoverPilot:ace.bossPilot,aceCoverStartedAt:ace.aceGroupStartedAt,aceCoverSlot:slot,aceCoverAuthored:true});ace.aceCoverSlots|=1<<slot;added++;continue;}
  if(authored.length)break;
  const es=(g.enemies||[]).filter(living),regular=es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length;
  if(regular>=(g.regularEnemyLimit?.()??12)||es.length>=(g.enemyCapacity?.()??65)-1)break;
  const previous=g.directorSpawning;g.directorSpawning=true;let wing;try{wing=g.spawnEnemy?.('hunter')}finally{g.directorSpawning=previous}if(!wing)break;
  const side=slot?1:-1;
  Object.assign(wing,{aceCoverPilot:ace.bossPilot,aceCoverStartedAt:ace.aceGroupStartedAt,aceCoverSlot:slot,x:ace.x-Math.cos(a)*100-Math.sin(a)*side*105,y:ace.y-Math.sin(a)*100+Math.cos(a)*side*105,a,fire:1.5+slot*.5});
  ace.aceCoverSlots|=1<<slot;added++;
 }
 ace.aceCoverSpawned=ace.aceCoverSlots===3;
 const count=(g.enemies||[]).filter(e=>living(e)&&e.aceCoverPilot===ace.bossPilot&&e.aceCoverStartedAt===ace.aceGroupStartedAt).length;
 ace.aceCoverCount=Math.max(ace.aceCoverCount||0,count);
 if(added)admissionTrace(g,'supportLinked',{kind:'ace-cover',pilot:ace.bossPilot,count});
}
function syncAceCover(g,ace){
 if(!ace.aceCoverSpawned)addAceCover(g,ace);
 if(!(ace.aceCoverCount>0)&&!ace.aceCoverLost)return;
 const count=(g.enemies||[]).filter(e=>living(e)&&e.aceCoverPilot===ace.bossPilot&&e.aceCoverStartedAt===ace.aceGroupStartedAt).length;
 if(ace.aceCoverCount>0&&!count){ace.aceCoverLost=true;admissionTrace(g,'supportLinkBroken',{kind:'ace-cover',pilot:ace.bossPilot,effect:'exposed-direct-reentry'});}
 ace.aceCoverCount=count;
 if(ace.aceCoverLost){
  const s=ace.aceTactics,p=playerFor(g),time=g.t||0;
  // Without a covering pair the ace cannot hold the long safe outer recovery.
  // Use its existing physical exit heading/timer, exposing a predictable return
  // instead of granting another protected loop or changing any combat stats.
  if(s&&['DISENGAGE','RECOVER'].includes(s.state)){s.heading=Math.atan2(p.y-ace.y,p.x-ace.x);s.until=Math.min(s.until,time+.8);}
  if(ace.disengageUntil>time)ace.disengageUntil=Math.min(ace.disengageUntil,time+.8);
 }
}

export function aceAircraftId(id,planes={}){
 const seen=new Set();
 while(id&&!seen.has(id)){
  seen.add(id);
  const fit=SORTIE_FITS[id],plane=planes[id],bank=/^bank_livery_(.+)__/.exec(id);
  const next=plane?.aircraftId||MODEL_ALIASES[id]||plane?.sortieBase||fit?.tier||fit?.base||
   (resolveAircraftPersonalityId(id)!==id?resolveAircraftPersonalityId(id):null)||bank?.[1];
  if(!next||next===id)break;id=next;
 }
 return id;
}

function stateFor(game){
 const loopIndex=loopOf(game);
 const state=game.aceSortie??={loopIndex,downed:new Set(),active:new Map(),serial:0,endedAt:null};
 if(state.loopIndex!==loopIndex){state.loopIndex=loopIndex;state.downed.clear()}
 return state;
}

export function recordAceDefeat(game,e){
 if(!ordinary(e)||e.hp>0||e.expired||e.rivalEscaped)return false;
 const state=stateFor(game),aircraftId=e.aircraftId||aceAircraftId(e.bossPlane);
 if(!aircraftId)return false;
 state.downed.add(`${e.pilotId||e.bossPilot}:${aircraftId}`);return true;
}

export function syncAceSortie(game){
 const state=stateFor(game),hadActive=state.active.size>0;
 // At most three current aircraft references; defeated-history size never affects a frame.
 for(const [id,e] of state.active){
  if(!living(e)||!(game.enemies||[]).includes(e)){recordAceDefeat(game,e);state.active.delete(id)}
 }
 if(hadActive&&!state.active.size)state.endedAt=game.t||0;
 return state;
}

function reservedRival(game,id){
 const rival=game.rivalAce;
 return rival?.pilot===id&&rival.phase==='ESCAPED'&&!(rival.active&&living(rival.active));
}

export function installAceSortieRhythm(Game,{PILOTS,PLANES,PILOT_PLANES,stageAceEligible,angleDiff}){
 const proto=Game.prototype;if(proto.__aceSortieRhythm)return;proto.__aceSortieRhythm=true;
 proto.syncAceSortie=function(){return syncAceSortie(this)};
 proto.recordAceDefeat=function(e){return recordAceDefeat(this,e)};
 proto.availableAceAircraft=function(id,{rivalReturn=!!this._rivalReturnPilot}={}){
  const state=syncAceSortie(this);
  if(state.active.has(id)||(this.enemies||[]).some(e=>e.bossPilot===id&&living(e)))return[];
  if(reservedRival(this,id)&&!(rivalReturn&&this._rivalReturnPilot===id))return[];
  const forced=rivalReturn&&this._rivalReturnPilot===id?this._rivalReturnAircraft:null;
  const fits=forced?[forced]:pilotAircraftChoices(id).length?pilotAircraftChoices(id):[PILOT_PLANES[id]];
  const models=new Set();
  return fits.filter(fit=>{
   const model=aceAircraftId(fit,PLANES);
   if(!PLANES[fit]||!model||models.has(model)||state.downed.has(`${id}:${model}`))return false;
   models.add(model);return true;
  });
 };
 proto.availableAcePilots=function(){
  if(intrusionActive(this))return [];
  syncAceSortie(this);const forced=this._rivalReturnPilot;
  return Object.keys(PILOTS).filter(id=>PILOTS[id].enemyAce!==false&&(!forced||id===forced)&&PILOTS[id].faction!==PLANES[this.plane]?.faction&&stageAceEligible(this,id)&&this.availableAceAircraft(id).length);
 };
 proto.registerSortieAce=function(e){
  const state=syncAceSortie(this);
  if(!state.active.size)state.serial++;
  const used=new Set([...state.active.values()].map(ace=>ace.aceAttackSlot));let slot=0;while(used.has(slot))slot++;
  Object.assign(e,{pilotId:e.bossPilot,aircraftId:aceAircraftId(e.bossPlane,PLANES),loopIndex:state.loopIndex,
   aceSortieManaged:true,aceAttackSlot:slot,aceEntrySide:state.serial%2?1:-1,
   aceGroupStartedAt:state.active.values().next().value?.aceGroupStartedAt??(this.t||0)});
  state.active.set(e.bossPilot,e);
 };
 proto.arrangeAceEntry=function(e){
  if(!e?.aceSortieManaged)return;
  const p=playerFor(this),slot=e.aceAttackSlot,side=e.aceEntrySide,a=(p.a||0)+(slot===0?0:slot===1?side*1.35:Math.PI-side*.45);
  const view=arrivalViewport(this),dx=Math.cos(a),dy=Math.sin(a),w=view.w+85,h=view.h+85;
  const d=Math.min(w/(Math.abs(dx)||1e-6),h/(Math.abs(dy)||1e-6));
  e.x=p.x+dx*d;e.y=p.y+dy*d;
  if(Math.abs(e.x-view.x)<=view.w+65&&Math.abs(e.y-view.y)<=view.h+65){const edge=Math.min((view.w+110)/(Math.abs(dx)||1e-6),(view.h+110)/(Math.abs(dy)||1e-6));e.x=view.x+dx*edge;e.y=view.y+dy*edge;}
  const ahead=slot===2?160:-80,lateral=slot===1?-side*120:0;
  const tx=p.x+Math.cos(p.a||0)*ahead-Math.sin(p.a||0)*lateral,ty=p.y+Math.sin(p.a||0)*ahead+Math.cos(p.a||0)*lateral;
  e.a=Math.atan2(ty-e.y,tx-e.x);e.combatPassHeading=e.a;e.aceEntryUntil=(this.t||0)+.75+slot*.65;
  e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,e.aceEntryUntil);e.fire=Math.max(e.fire||0,.8+slot*.65);
 };
 proto.aceCoopFireReady=function(e){
  if(!e?.aceSortieManaged||!ordinary(e)||e.rivalEscaping||e.aceRetreat)return !e?.rivalEscaping&&!e?.aceRetreat;
  syncAceCover(this,e);
  const now=this.t||0;if(e.aceEntryUntil>now)return false;
  if(e.aceSignatureUntil>now)return true;
  const active=[...(this.aceSortie?.active?.values()||[])].filter(living).sort((a,b)=>a.aceAttackSlot-b.aceAttackSlot);
  if(active.length<2)return true;
  const index=active.indexOf(e);if(index<0)return true;
  const beat=2.35,phase=((now-e.aceGroupStartedAt)%(beat*active.length)+beat*active.length)%(beat*active.length);
  return Math.floor(phase/beat)===index&&phase%beat<1.85;
 };
 const spawn=proto.spawnEnemy;
 proto.spawnEnemy=function(type,...args){const e=spawn.call(this,type,...args);if(e?.aceSortieManaged)this.arrangeAceEntry(e);return e};
 const steer=proto.dogfightSteering;
 proto.dogfightSteering=function(e,contact,dt,baseTurn){
  // CoopGame's outer spawn wrapper assigns/scales the returned last aircraft.
  // Attach support only after that wrapper has finished, never recursively
  // append hunters while it is still selecting the newly spawned ace.
  if(e?.aceSortieManaged)addAceCover(this,e);
  if(e?.aceCoverPilot&&baseTurn>0){
   const leader=aceCoverLeader(this,e);
   if(!leader){admissionTrace(this,'supportLinkBroken',{kind:'ace-cover',pilot:e.aceCoverPilot});delete e.aceCoverPilot;e.directorFireHoldUntil=(this.t||0)+.8;}
   else if(!aceCoverAttack(this,e,leader)){
    const a=leader.a||0,side=e.aceCoverSlot?1:-1,tx=leader.x-Math.cos(a)*130-Math.sin(a)*side*110,ty=leader.y-Math.sin(a)*130+Math.cos(a)*side*110;
    return {delta:angleDiff(Math.atan2(ty-e.y,tx-e.x),e.a),turn:baseTurn*.8};
   }
  }
  if(e?.aceSortieManaged&&baseTurn>0&&!e.rivalEscaping&&!e.aceRetreat&&!e.defensivePressure){
   if(e.aceEntryUntil>this.t)return{delta:angleDiff(e.combatPassHeading,e.a),turn:baseTurn*.65};
   if(contact&&!this.aceCoopFireReady(e)&&!(e.bossDash>0)){
    e.disengageUntil=this.t+.25;e.exitHeading=Math.atan2(e.y-contact.y,e.x-contact.x)+e.aceEntrySide*.3;
   }
  }
  return steer.call(this,e,contact,dt,baseTurn);
 };
 for(const name of ['fireEnemy','enemyVolley','aceAttack']){
  const attack=proto[name];proto[name]=function(e,...args){
   if(!aceCoverShotReady(this,e)){if(name==='fireEnemy')e.fire=.18;return;}
   if(e?.aceSortieManaged&&!this.aceCoopFireReady(e)){
    if(name==='aceAttack')e.abilityTimer=.2;else if(name==='fireEnemy')e.fire=.15;
    return;
   }
   const before=this.bullets?.length||0,result=attack.call(this,e,...args);
   if((this.bullets?.length||0)>before&&(e?.aceCoverPilot||e?.aceSortieManaged)){
    if(e.directorLastShotAt!==(this.t||0))admissionTrace(this,'shotCreated',{kind:e.aceCoverPilot?'ace-cover':'ace',count:this.bullets.length-before});
    e.directorLastShotAt=this.t||0;
   }
   if(name==='aceAttack'&&e?.aceSortieManaged)e.aceSignatureUntil=(this.t||0)+Math.max(.8,e.bossDash||0);
   return result;
  };
 }
 const scheduled=proto.runScheduledAces;
 proto.runScheduledAces=function(){
  const state=syncAceSortie(this);
  for(const ace of state.active.values())addAceCover(this,ace);
  // Global 80/185s reservations can fall entirely inside boss approach/battle.
  // Give each new stage an opening slot before its existing approach cutoff.
  if(this.mode!=='campaign'&&this.stageBoss?.stages?.phase==='explore'&&Number.isFinite(this.stageStartTime)&&state.scheduleStart!==this.stageStartTime&&this.nextBossAt<=this.nextAceWaveAt(this.t)){
   state.scheduleStart=this.stageStartTime;
   // The cached window may still belong to the defeated boss (remaining=0).
   // Reserve the same opening interval instead of shortening it from stale data.
   const opening=ordinaryAdmissionStage(this)?20:16;
   // A reservation overdue from the boss fight belongs to this opening slot,
   // not the first frame of the new region (which starved its mission).
   state.openingAt=this.nextBossAt=ordinaryAdmissionStage(this)?this.stageStartTime+opening:this.t+opening;
  }
  if(!state.active.size&&!encounterAllowed(this,'ace',{minRemaining:27}))return;
  if(activeFronts(this).length)return; // Bounded front operation keeps the ace reservation, not a new wave.
  if(this.t<(state.openingAt||0)||this.t<this.nextBossAt&&!this.pendingAceCount)return;
  const endedAt=Math.max(state.endedAt??-Infinity,this._aceCombatEndedAt??-Infinity);
  if(state.active.size||this.t<(this.battleRecoveryUntil||0)||this.t-endedAt<ACE_SORTIE_BALANCE.recovery||this.stageCombatWindow?.ready||this.stageBoss?.stages?.phase==='boss'||(this.battlefieldEvents?.current?.status==='active'&&['ACE_CHALLENGE','MOUNTAIN_PURSUIT'].includes(this.battlefieldEvents.current.type)))return;
  this.pendingAceCount=Math.min(ACE_SORTIE_BALANCE.maxAces,this.pendingAceCount||0);
  const result=scheduled.call(this);
  for(const ace of state.active.values())addAceCover(this,ace);
  if(state.active.size&&this.directorAdmission?.active!=='ace')admitEncounter(this,'ace',{count:state.active.size});
  // A bounded encounter is one wave, never a backlog dripped into the next duel.
  if(state.active.size||!this.availableAcePilots().length)this.pendingAceCount=0;
  return result;
 };
}



