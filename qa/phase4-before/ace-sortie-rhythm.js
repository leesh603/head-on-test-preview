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
  syncAceSortie(this);const forced=this._rivalReturnPilot;
  return Object.keys(PILOTS).filter(id=>(!forced||id===forced)&&PILOTS[id].faction!==PLANES[this.plane]?.faction&&stageAceEligible(this,id)&&this.availableAceAircraft(id).length);
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
  const zoom=this.camera?.zoom||1,dx=Math.cos(a),dy=Math.sin(a),w=(this.viewWidth||960)/2/zoom+85,h=(this.viewHeight||700)/2/zoom+85;
  const d=Math.min(w/(Math.abs(dx)||1e-6),h/(Math.abs(dy)||1e-6));
  e.x=p.x+dx*d;e.y=p.y+dy*d;
  const ahead=slot===2?160:-80,lateral=slot===1?-side*120:0;
  const tx=p.x+Math.cos(p.a||0)*ahead-Math.sin(p.a||0)*lateral,ty=p.y+Math.sin(p.a||0)*ahead+Math.cos(p.a||0)*lateral;
  e.a=Math.atan2(ty-e.y,tx-e.x);e.combatPassHeading=e.a;e.aceEntryUntil=(this.t||0)+.75+slot*.65;
  e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,e.aceEntryUntil);e.fire=Math.max(e.fire||0,.8+slot*.65);
 };
 proto.aceCoopFireReady=function(e){
  if(!e?.aceSortieManaged||!ordinary(e)||e.rivalEscaping||e.aceRetreat)return !e?.rivalEscaping&&!e?.aceRetreat;
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
   if(e?.aceSortieManaged&&!this.aceCoopFireReady(e)){
    if(name==='aceAttack')e.abilityTimer=.2;else if(name==='fireEnemy')e.fire=.15;
    return;
   }
   const result=attack.call(this,e,...args);
   if(name==='aceAttack'&&e?.aceSortieManaged)e.aceSignatureUntil=(this.t||0)+Math.max(.8,e.bossDash||0);
   return result;
  };
 }
 const scheduled=proto.runScheduledAces;
 proto.runScheduledAces=function(){
  const state=syncAceSortie(this);
  // Global 80/185s reservations can fall entirely inside boss approach/battle.
  // Give each new stage an opening slot before its existing approach cutoff.
  if(this.mode!=='campaign'&&this.stageBoss?.stages?.phase==='explore'&&Number.isFinite(this.stageStartTime)&&state.scheduleStart!==this.stageStartTime&&this.nextBossAt<=this.nextAceWaveAt(this.t)){
   state.scheduleStart=this.stageStartTime;
   const remaining=this.stageCombatWindow?.remaining;
   const opening=Number.isFinite(remaining)?Math.min(16,Math.max(6,(remaining-18)/2)):16;
   this.nextBossAt=Math.min(this.nextBossAt,this.t+opening);
  }
  if(this.t<this.nextBossAt&&!this.pendingAceCount)return;
  const endedAt=Math.max(state.endedAt??-Infinity,this._aceCombatEndedAt??-Infinity);
  if(state.active.size||this.t<(this.battleRecoveryUntil||0)||this.t-endedAt<ACE_SORTIE_BALANCE.recovery||this.stageCombatWindow?.approaching||this.stageBoss?.stages?.phase==='boss'||this.battlefieldEvents?.current?.status==='active')return;
  this.pendingAceCount=Math.min(ACE_SORTIE_BALANCE.maxAces,this.pendingAceCount||0);
  const result=scheduled.call(this);
  // A bounded encounter is one wave, never a backlog dripped into the next duel.
  if(state.active.size||!this.availableAcePilots().length)this.pendingAceCount=0;
  return result;
 };
}
