import {tickBossEntry} from './boss-entry-presentation.js';
import {beginBossArrival,tickBossArrival} from './boss-arrival.js';
import {createFinalArenaProgression,recordFinalArenaStage,requestFinalArenaAfterCapital,startFinalArenaProgression,completeFinalArenaProgression,resetFinalArenaRoute,snapshotFinalArena} from './final-arena-progression.js';
import {bossOrdnanceFamily} from './boss-ordnance-loadouts.js';
import {gothaCrashPose} from './aircraft-crash.js';
import {treffasMgMuzzle,fliegerGunMuzzle} from './cambrai-layout.js?v=pandemonium394r2&cambrai=20261021';
import {basicBarrageMuzzle} from './boss-basic-barrage.js?v=pandemonium394r2&ai=1018&sig=1019&boss=20261020b&somme=20261021&cambrai=20261021&harbor=20261021';
import {recordShipWake} from './naval-water.js?v=pandemonium394r2&perf=1029';
import {predictPilot} from './headon-stageboss-core.js?v=pandemonium394r2&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';
import {BOSS_CATALOG,STAGES,createBossEncounter} from './headon-stageboss-patterns.js?v=pandemonium394r2&rail=42&ai=1018&sig=1019&boss=20261020b&somme=20261021&cambrai=20261021&phase=1021&cityart=20261022&harbor=20261021';
import {verdunFortCollapseSites} from './verdun-fortresses.js?v=pandemonium394r2&rail=42&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {BossHazards} from './headon-stageboss-hazards.js?v=pandemonium394r2&cambrai=20261021&cityart=20261022';


// Every sortie starts in the rural battlefield, then keeps difficulty
// progression while shuffling maps inside early/mid/late bands.
export const STAGE_ROUTE_POOLS=Object.freeze({
  opening:0,
  early:Object.freeze([2,1,4]),
  mid:Object.freeze([9,8,3,10,7,5,6]),
  late:Object.freeze([11,12,13,14,16,15,17])
});
const mix=(values,rng)=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
export function buildStageRoute(rng=Math.random,finalArenaEnabled=false,teamFaction=null){
  const order=[STAGE_ROUTE_POOLS.opening,...mix(STAGE_ROUTE_POOLS.early,rng),...mix(STAGE_ROUTE_POOLS.mid,rng),...mix(STAGE_ROUTE_POOLS.late,rng)];
  if(!finalArenaEnabled)return order;
  // Preserve the existing route ordering. This legacy city stage is NOT a
  // verified capital finale and never grants secret-boss eligibility.
  const capitals=order.filter(index=>['london','berlin'].includes(STAGES[index]));
  const capital=teamFaction==='entente'&&STAGES.includes('berlin')?STAGES.indexOf('berlin'):STAGES.indexOf('london');
  return [...order.filter(index=>!capitals.includes(index)),capital];
}
export class BossStages {
  constructor({teamFaction,stageIndex=null,loopIndex=0,rng=Math.random,finalArenaEnabled=false,runId='sortie',canEnterFinalArena=()=>false}) {
    const explicitStage=stageIndex!==null&&stageIndex!==undefined;
    if(!['central','entente'].includes(teamFaction)||(explicitStage&&(!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>=STAGES.length))||!Number.isInteger(loopIndex)||loopIndex<0)throw new Error('Invalid current stage/faction');
    const order=buildStageRoute(rng,finalArenaEnabled,teamFaction);const initialStage=explicitStage?stageIndex:order[0];
    Object.assign(this,{teamFaction,stageIndex:initialStage,loopIndex,rng,order});this.orderPosition=this.order.indexOf(this.stageIndex);this.phase='explore';this.encounter=null;this.capitalRound=0;this.finalArena=createFinalArenaProgression(finalArenaEnabled,runId);this.canEnterFinalArena=canEnterFinalArena;
  }
  get stage(){return STAGES[this.stageIndex];}
  get capitalBossId(){return this.stage==='berlin'?'final-kaiserkrone':this.stage==='london'?'final-leviathan':null;}
  get capitalEncounter(){return !!(this.finalArena.enabled&&BOSS_CATALOG[this.capitalBossId]?.capitalFinal&&BOSS_CATALOG[this.capitalBossId].faction!==this.teamFaction);}
  get bossId(){if(this.capitalEncounter&&this.capitalRound===1)return this.capitalBossId;return Object.keys(BOSS_CATALOG).find(id=>!BOSS_CATALOG[id].capitalFinal&&BOSS_CATALOG[id].stage===this.stageIndex&&(BOSS_CATALOG[id].faction==='neutral'||BOSS_CATALOG[id].faction!==this.teamFaction));}
  attach(encounter) {
    if(this.phase!=='explore')return false;
    if(encounter.bossId!==this.bossId)throw new Error('Wrong stage/faction boss');
    this.encounter=encounter;this.phase='boss';return true;
  }
  poll() {if(this.phase==='boss'&&this.encounter.completed){this.phase='clear-pending';return true;}return false;}
  startFinalArena(token,blocked=false) {return this.canEnterFinalArena()===true&&this.phase==='final-arena'&&startFinalArenaProgression(this.finalArena,token,blocked);}
  completeFinalArena(token,blocked=false) {return this.phase==='final-arena'&&completeFinalArenaProgression(this.finalArena,token,blocked);}
  advance(blocked=false) {
    if(blocked)return null;
    if(this.phase==='final-arena') {
      if(this.finalArena?.phase!=='cleared')return null;
      const completedId=this.finalArena.completedId,finalArenaToken=this.finalArena.token;
      this.loopIndex++;this.orderPosition=0;this.order=buildStageRoute(this.rng,this.finalArena.enabled,this.teamFaction);this.stageIndex=this.order[0];this.capitalRound=0;
      this.phase='explore';this.encounter=null;resetFinalArenaRoute(this.finalArena,{completed:true});
      return{completedId,stage:this.stage,stageIndex:this.stageIndex,loopIndex:this.loopIndex,finalArenaCompleted:true,finalArenaToken};
    }
    if(this.phase!=='clear-pending'||!this.encounter?.completed)return null;
    if(this.capitalEncounter&&this.capitalRound===0){const completedId=this.encounter.id;this.capitalRound=1;this.phase='explore';this.encounter=null;return {kind:'capital-final',completedId,stage:this.stage,stageIndex:this.stageIndex,loopIndex:this.loopIndex,bossId:this.bossId};}
    recordFinalArenaStage(this.finalArena,{order:this.order,stageIndex:this.stageIndex,loopIndex:this.loopIndex,completedId:this.encounter.id});
    const id=this.encounter.id;const pos=this.order.indexOf(this.stageIndex);this.orderPosition=pos<0?this.order.length:pos+1;
    if(this.orderPosition>=this.order.length){this.loopIndex++;this.orderPosition=0;this.order=buildStageRoute(this.rng,this.finalArena.enabled,this.teamFaction);resetFinalArenaRoute(this.finalArena);}
    this.stageIndex=this.order[this.orderPosition];
    this.phase='explore';this.encounter=null;this.capitalRound=0;
    return{completedId:id,stage:this.stage,stageIndex:this.stageIndex,loopIndex:this.loopIndex};
  }
}
// Wrap the EXISTING normal spawn calculation. No player-count or difficulty multipliers here.
export function normalSpawnInterval(currentInterval,{bossPresent,factor=.55,alreadyReduced=false}) {
  if(!Number.isFinite(currentInterval)||currentInterval<=0||!Number.isFinite(factor)||factor<=0||factor>1)throw new Error('Invalid normal spawn policy');
  return bossPresent&&!alreadyReduced?currentInterval/factor:currentInterval;
}

export class StageBossAddon {
  constructor({runId,teamFaction,stageIndex=null,loopIndex=0,hooks,rng=Math.random,capacity=512,minionCap=12,showFloors=false,finalArenaEnabled=false,presentArrivals=false}) {
    for(const key of ['getTuning','onDamage','onStatus','onBarrierContact','spawnMinion','countMinions','onBuildingImpact','onCue','onEncounterCleared','onStageChange','clearEncounterOwned']) {
      if(typeof hooks?.[key]!=='function')throw new Error('Required host adapter: '+key);
    }
    if(finalArenaEnabled&&typeof hooks.onFinalArenaPending!=='function')throw new Error('Required final arena host adapter: onFinalArenaPending');
    if(!runId||!Number.isInteger(minionCap)||minionCap<0)throw new Error('Run ID and bounded minion budget required');
    Object.assign(this,{runId,hooks,rng,minionCap,showFloors,presentArrivals});this.serial=0;this.time=0;this.frameContext=null;this.defeatSequence=null;this.bodyDefeats=[];
    this.stages=new BossStages({teamFaction,stageIndex,loopIndex,rng,finalArenaEnabled,runId,canEnterFinalArena:()=>hooks.canEnterFinalArena?.()===true});this.capitalDefeatReceipts=new Map();
    // A salvo re-aimed at the pilot's flight path may land at most two rounds on one pilot.
    const onDamage=(pid,damage,h)=>{if(h?.leadAimed){const k=pid+'|'+h.bossId+'|'+h.signatureStarted,m=this.salvoHits??=new Map();const n=m.get(k)||0;if(n>=2)return;m.set(k,n+1);if(m.size>256)m.delete(m.keys().next().value);}return hooks.onDamage(pid,damage,h);};
    this.hazards=new BossHazards({capacity,onDamage,onStatus:hooks.onStatus,onBarrierContact:hooks.onBarrierContact,
      onActivate:h=>{const cb=this.stages.encounter?.bodies.get(h.bossId),cp=cb?.parts.get(h.sourcePartId);cb?.noteAttackActivated?.(h);if(cb?.isCapitalBoss&&cp&&h.kind==='projectile'){cp.recoil=.24;cp.gunFlash=.12;hooks.onCue({type:'muzzle',encounterId:h.encounterId,bossId:h.bossId,partId:cp.id,x:h.x,y:h.y});}if(h.kind==='projectile'&&cp&&((cb.kind==='fliegerzug'&&['car-flak','car-rear'].includes(cp.id))||(cb.kind==='treffas-wagen'&&cp.id.startsWith('mg-')))){const flash=cp.gunFlash||0;cp.gunFlash=.16;cp.recoil=.18;if(Number.isFinite(h.sourceAngle)){cp.shotAngle=h.sourceAngle;cp.aimAngle=h.sourceAngle;}if(!h.basicMuzzle&&!flash)hooks.onCue({type:'muzzle',encounterId:h.encounterId,bossId:h.bossId,partId:cp.id,x:h.x,y:h.y});}if(h.basicMuzzle){const body=this.stages.encounter?.bodies.get(h.bossId),part=body?.parts.get(h.sourcePartId);if(part)part.recoil=Math.max(part.recoil||0,.18);if(body?.kind==='armored-harbor-fortress'){const m=basicBarrageMuzzle(body,h);if(m){h.x=m.x;h.y=m.y;}}hooks.onCue({type:'muzzle',encounterId:h.encounterId,bossId:h.bossId,partId:h.sourcePartId,x:h.x,y:h.y});}hooks.onCue({type:'hazard-activated',encounterId:h.encounterId,bossId:h.bossId,kind:h.kind,visual:h.visual,ordnanceFamily:h.ordnanceFamily,x:h.x,y:h.y,radius:h.radius,raidHeavy:h.raidHeavy,sourcePartId:h.sourcePartId});}});
    this.canBasicFire=()=>this.hazards.pool.count<42;
    this.metrics={minionsDenied:0};this.ended=false;
  }
  // No ordinary map/timeout/guest packet calls this. The host must register the
  // actual capital FINAL encounter and call only after its defeat animation.
  notifyCapitalFinalDefeated(encounter,{blocked=false}={}) {
    const stages=this.stages,state=stages.finalArena;
    if(this.ended||blocked||!state?.enabled||state.phase!=='none'||!encounter||encounter.completed!==true||typeof encounter.id!=='string'||!encounter.id||typeof encounter.bossId!=='string'||!encounter.bossId)return null;
    if(!(encounter.bodies instanceof Map)||!encounter.bodies.size||![...encounter.bodies.values()].every(body=>body.dead===true))return null;
    if(this.hooks.isCapitalFinalEncounter?.(encounter)!==true||typeof this.hooks.onFactionFinalCleared!=='function')return null;
    const key=encounter.id,previous=this.capitalDefeatReceipts.get(key);
    if(previous&&(previous.loopIndex!==stages.loopIndex||previous.capitalId!==encounter.bossId))return null;
    const receipt=previous||{capitalFinalVerified:true,runId:this.runId,teamFaction:stages.teamFaction,playerFaction:stages.teamFaction,bossId:encounter.bossId,capitalId:encounter.bossId,encounterId:key,loopIndex:stages.loopIndex};
    // Store this faction's genuine clear before checking both-faction history:
    // the second faction's FINAL may unlock Zero District in this same sortie.
    if(!previous){if(this.hooks.onFactionFinalCleared(receipt)===false)return null;this.capitalDefeatReceipts.set(key,receipt);if(this.capitalDefeatReceipts.size>64)this.capitalDefeatReceipts.delete(this.capitalDefeatReceipts.keys().next().value);}
    // Peer eligibility may arrive after the genuine clear was persisted. Retrying
    // this same registered encounter rechecks eligibility without granting twice.
    if(!requestFinalArenaAfterCapital(state,{...receipt,eligible:stages.canEnterFinalArena()},false))return null;
    stages.phase='final-arena';stages.encounter=null;
    const transition={kind:'final-arena',completedId:key,stage:stages.stage,stageIndex:stages.stageIndex,loopIndex:stages.loopIndex,finalArena:snapshotFinalArena(state)};
    this.hooks.onFinalArenaPending(transition);return transition;
  }
  startBoss({x,y,presentArrival=this.presentArrivals}) {
    if(this.ended||this.stages.phase!=='explore')return null;
    if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Current world spawn point required');
    const bossId=this.stages.bossId,id=this.runId+':stageboss:'+this.serial++;
    // Host returns CURRENT loop/player-count-scaled stats. This module adds no scaling.
    let tuning=this.hooks.getTuning({bossId,stageIndex:this.stages.stageIndex,loopIndex:this.stages.loopIndex});
    if(bossId==='ca4'||bossId==='gik')tuning={...tuning,geometryScale:1.45,motionMultiplier:0,mobileBoss:false};
    if(bossId==='livens-flame-projector'||bossId==='minenwerfer-battery')tuning={...tuning,geometryScale:1,motionMultiplier:0,mobileBoss:false};
    if(bossId==='treffas-wagen')tuning={...tuning,geometryScale:1,mobileBoss:false};
    if(bossId==='fliegerzug')tuning={...tuning,railCycle:11,warningSeconds:1.7};
    if(bossId==='fort-douaumont'||bossId==='fort-souville')tuning={...tuning,geometryScale:1,motionMultiplier:0,mobileBoss:false};
    if(bossId==='mark4-wedge')tuning={...tuning,sommeApproach:true};
    const entry=BOSS_CATALOG[bossId],faction=entry.faction==='neutral'?(this.stages.teamFaction==='central'?'entente':'central'):entry.faction;
    const encounter=createBossEncounter({id,bossId,tuning,x,y,rng:this.rng,faction,emit:event=>this.accept(event,id,tuning)});
    for(const b of encounter.bodies.values())if(b.support129||b.formationBoss129||b.kind==='fliegerzug'||b.kind==='armored-harbor-fortress'||b.gallipoliBoss||b.jutlandBoss){b.countMinions129=()=>this.hooks.countMinions(id);b.formationStatus129=()=>this.hooks.formationStatus?.(id)||[];}this.defeatSequence=null;this.bodyDefeats=[];this.stages.attach(encounter);beginBossArrival(this,encounter,presentArrival);this.hooks.onCue({type:['jasta11-circus','naval10-black-flight'].includes(bossId)?'formation-approach':['livens-flame-projector','minenwerfer-battery'].includes(bossId)?'trench-approach':bossId==='mark4-wedge'?'somme-approach':'boss-enter',encounterId:id,bossId});return encounter;
  }
  // Boss rounds were laid at the spot a pilot occupied when the warning began.
  // Pilots never stop flying, so every warned round missed a pilot who simply
  // flew on. A warned round aimed at (or near) a pilot's recent track is moved to
  // where that pilot will be when it lands, keeping its offset in the pattern, so
  // flying straight is hit and turning out of the marker is the dodge.
  leadAim(event){
    if(event.kind==='projectile')return this.leadShot(event);
    if(!this.showFloors||event.kind!=='circle'||!(event.damage>0)||event.objective||event.basicFire||event.lockAtWarning||event.airborneBomb||String(event.tag||'').includes('basic'))return event;
    const lead=(event.delay||0)+(event.warning||0);if(lead<.3)return event;
    // Lingering zones (gas, fire, smoke) keep their place: they deny ground, they do not chase.
    if(!event.once&&(event.duration||0)>1.2)return event;
    // One aimed volley per boss every 2.5 s (all hazards of that volley together);
    // the rest of its fire stays as pressure. A dodge every few seconds, not a wall.
    const clock=this.stages.encounter?.clock||0,gate=this.leadGate??=new Map(),g0=gate.get(event.bossId);
    if(g0&&g0.at!==clock&&clock-g0.at<2.5)return event;
    const body=this.stages.encounter?.bodies.get(event.bossId);if(!body||body.ruralRailBoss||body.ownsLeadAim)return event;
    const trail=this.trail,players=this.frameContext?.players||[];if(!trail)return event;
    let best=null;
    for(const p of players){if(p.alive===false)continue;const list=trail.get(p.id);if(!list)continue;
      for(const s of list){const d=Math.hypot(event.x-s.x,event.y-s.y);if(!best||d<best.d)best={d,s,p};}}
    const reach=Math.max(70,(event.radius||40)*1.6);if(!best||best.d>reach)return event;
    // Patterns that already lead the pilot (closer to where it will be than to where it was) are left alone.
    if(Math.hypot(event.x-predictPilot(best.p,lead*.92).x,event.y-predictPilot(best.p,lead*.92).y)<best.d)return event;
    const {p,s}=best,vx=Number.isFinite(p.vx)?p.vx:0,vy=Number.isFinite(p.vy)?p.vy:0,b=this.frameContext.bounds,r=event.radius||40,m=r*.5;
    // Keeping the current course (straight or the current turn) is hit; changing it is the dodge.
    // A pilot who turns hard stays within ~40 px of where the turn began, so the
    // marker must sit at least radius+45 px down the flight path: longer warnings
    // where needed, never shorter. Flying on is hit; turning out is the dodge.
    const speed=Math.hypot(vx,vy),need=speed>40?(r+45)/(speed*.92):0,extra=Math.max(0,need-lead);const t=lead+extra;
    const q=predictPilot(p,t*.92);let x=q.x+(event.x-s.x),y=q.y+(event.y-s.y);
    if(b){x=Math.max(b.left+m,Math.min(b.right-m,x));y=Math.max(b.top+m,Math.min(b.bottom-m,y));}
    gate.set(event.bossId,{at:clock});
    return{...event,x,y,warning:(event.warning||0)+extra,leadAimed:true};
  }
  // Aimed signature rounds (not ordinary covering fire) are fired at the point
  // where the pilot will meet them, in the same 2.5 s rhythm as aimed volleys; a
  // burst keeps leading for 0.8 s once it starts.
  leadShot(event){
    if(event.lockedAim)return event;
    if(this.stages.encounter?.bodies.get(event.bossId)?.isCapitalBoss)return event;
    if(event.visual==='rail-shrapnel')return event;
    if(!this.showFloors||!(event.damage>0)||event.basicFire||event.basicMuzzle||String(event.tag||'').includes('basic'))return event;
    const speed=Math.hypot(event.vx||0,event.vy||0);if(speed<60)return event;
    const players=(this.frameContext?.players||[]).filter(p=>p.alive!==false);if(!players.length)return event;
    const a=Math.atan2(event.vy,event.vx);let best=null;
    for(const p of players){const d=Math.atan2(p.y-event.y,p.x-event.x),diff=Math.abs(Math.atan2(Math.sin(d-a),Math.cos(d-a)));if(diff<.35&&(!best||diff<best.diff))best={p,diff};}
    if(!best)return event;
    const clock=this.stages.encounter?.clock||0,gate=this.shotGate??=new Map(),g0=gate.get(event.bossId);
    if(g0&&clock-g0.at>.8&&clock-g0.at<2.5)return event;if(!g0||clock-g0.at>=2.5)gate.set(event.bossId,{at:clock});
    const delay=(event.delay||0)+(event.warning||0),off=a-Math.atan2(best.p.y-event.y,best.p.x-event.x);
    let t=Math.hypot(best.p.x-event.x,best.p.y-event.y)/speed,q=best.p;
    for(let i=0;i<3;i++){q=predictPilot(best.p,delay+t);t=Math.hypot(q.x-event.x,q.y-event.y)/speed;}
    const na=Math.atan2(q.y-event.y,q.x-event.x)+off;
    return{...event,vx:Math.cos(na)*speed,vy:Math.sin(na)*speed,leadAimed:true};
  }
  recordTrail(frame){
    const now=this.time,trail=this.trail??=new Map();
    for(const p of frame.players||[]){if(!Number.isFinite(p.x))continue;const list=trail.get(p.id)||[];
      // Turn rate from the heading 0.25 s ago, written onto the frame pilot for predictPilot.
      const a=Math.atan2(p.vy||0,p.vx||0),old=list.find(q=>now-q.t<=.3);if(old&&now-old.t>.05){const d=Math.atan2(Math.sin(a-old.a),Math.cos(a-old.a));p.omega=d/(now-old.t);}else p.omega=0;
      list.push({t:now,x:p.x,y:p.y,a});while(list.length&&now-list[0].t>3.2)list.shift();trail.set(p.id,list);}
  }
  accept(event,encounterId,tuning) {
    if(this.ended)return;
    if(this.preparingArrival){(this.arrivalQueue??=[]).push([event,encounterId,tuning]);return;}
    if(event.type==='support-damage'){this.hooks.onDamage(event.playerId,event.damage,event.source);return;}if(event.type==='support-cleanup'){this.hooks.clearEncounterOwned(encounterId);return;}
    if(event.type==='hazard'){
      const enc=this.stages.encounter,start=enc?.clock||0;event=this.leadAim(event);const body=enc?.bodies.get(event.bossId),part=body?.parts.get(event.sourcePartId||event.partId);const h=this.hazards.spawn({...event,weaponFamily:event.weaponFamily??(body?.kind==='mark4-wedge'&&body.tankRole==='female'?'machine-gun':undefined),ordnanceFamily:bossOrdnanceFamily(enc?.bossId||body?.kind,event,part),sprite:event.sprite??(event.visual==='carpet-bomb'?(body?.kind==='ca4'?'hales':body?.faction==='entente'?'cooper':'puw'):undefined),bossKind:body?.kind,sourcePartKind:event.sourcePartKind??part?.kind,sourcePartArt:event.sourcePartArt??part?.art??part?.id,encounterId,signatureStarted:start});if(h)h.leadAimed=!!event.leadAimed;
      if(this.showFloors&&h&&event.signatureAttack&&event.damage>0&&enc)(enc.pendingShown??=[]).push({h,generation:h.generation,start});
    }
    // Native attack holds also use this tag. Only explicit death/cleanup may
    // erase basic rounds that have already left their weapons.
    else if(event.type==='cancel-hazards')this.hazards.clearTagged(encounterId,event.tag,{pendingOnly:event.pendingOnly??String(event.tag||'').endsWith(':basic-fire')});
    else if(event.type==='harbor-load-pose'){
      if([event.x,event.y,event.radius,event.damage].every(Number.isFinite)&&event.radius>0&&event.damage>=0)this.hazards.pool.visit(h=>{if(h.encounterId===encounterId&&h.bossId===event.bossId&&h.tag==='harbor-crane'){h.x=event.x;h.y=event.y;h.radius=event.radius;h.damage=event.damage;}});
    }
    else if(event.type==='apron-pose')this.hazards.pool.visit(h=>{if(h.encounterId===encounterId&&h.tag===event.tag){h.vertices=event.vertices;h.x=event.x;h.y=event.y;}});
    else if(event.type==='regional-beam-pose'){
      const body=this.stages.encounter?.bodies.get(event.bossId);
      if(body?.kind==='london-searchlight'&&[event.x,event.y,event.angle].every(Number.isFinite))this.hazards.pool.visit(h=>{if(h.encounterId===encounterId&&h.bossId===event.bossId&&h.tag==='london-beam'&&h.kind==='searchlight'){h.x=event.x;h.y=event.y;h.angle=event.angle;}});
    }
    else if(event.type==='armor-light-pose'){
      const body=this.stages.encounter?.bodies.get(event.bossId);
      if(body?.kind==='a7v-flak'&&!body.parts.get('searchlight')?.destroyed)this.hazards.pool.visit(h=>{if(h.encounterId===encounterId&&h.bossId===event.bossId&&h.tag==='a7v-lights'){h.x=event.x;h.y=event.y;h.angle=event.angle;}});
    }
    else if(event.type==='status')this.hooks.onStatus(event.playerId,{...event.status,encounterId,sourceId:encounterId+':'+event.status.type});
    else if(event.type==='spawn-minion') {
      if(this.hooks.countMinions(encounterId)>=this.minionCap){this.metrics.minionsDenied++;return;}
      this.hooks.spawnMinion({...event,encounterId,id:this.runId+':boss-minion:'+this.serial++});
      this.hooks.onCue({...event,type:'minion-launched',encounterId});
    }else if(event.type==='body-defeated') {
      const body=this.stages.encounter?.bodies.get(event.bossId),zubianHalf=body?.kind?.startsWith('hms-zubian-');
      if((zubianHalf||['gotha-raider','o400-raider'].includes(body?.kind))&&!this.bodyDefeats.some(d=>d.id===body.id))this.bodyDefeats.push({id:body.id,kind:body.kind,x:body.x,y:body.y,a:body.a,age:0,duration:zubianHalf?3.2:2.65});
      this.hooks.onCue({...event,encounterId,x:body?.x,y:body?.y,kind:body?.kind});
    }else if(event.type==='building-impact') {
      if(!this.frameContext||!this.hooks.onBuildingImpact({...event,encounterId}))return;
      const b=this.frameContext.bounds,x=Math.max(b.left+20,Math.min(b.right-20,event.x));
      for(let i=0;i<6;i++)this.hazards.spawn({kind:'projectile',encounterId,bossId:event.bossId,x:Math.max(b.left+8,Math.min(b.right-8,x+(this.rng()-.5)*140)),
        y:b.top-20-i*25,vx:0,vy:tuning.bulletSpeed*.75,radius:10,damage:tuning.damage,warning:.65,duration:8,visual:'building-debris'});
    }else this.hooks.onCue({...event,encounterId});
  }
  hit({bodyId,partId=null,damage,faction}) {
    if(this.ended)return{damage:0,blocked:true};
    const body=this.stages.encounter?.bodies.get(bodyId);
    if(!body||body.arrivalPending||(faction&&faction===body.faction))return{damage:0,blocked:true};
    // Announced counter windows (reloads, regroups) multiply pilot damage only;
    // internal explosions and scripted damage call body.hit directly.
    const counter=typeof body.counterWindow==='function'?body.counterWindow():1;
    damage*=Number.isFinite(counter)&&counter>0?counter:1;
    // Show-before-fall floor: a boss keeps a slice of health until it has
    // shown what its current phase is for (its own gate, or the encounter's
    // signature strikes). Firepower still shortens every wait; it cannot skip
    // the fight. Internal/scripted damage calls body.hit directly.
    // Scripted weak points (rail cars) may also hold until the boss has fired.
    if(this.showFloors&&partId&&typeof body.partFloor==='function'){const part=body.parts.get(partId),pf=body.partFloor(partId);if(part&&pf>0)damage=Math.min(damage,Math.max(0,part.hp-pf));}
    const floor=this.floorFor(body);
    if(!(floor>0))return body.hit({partId,damage});
    // Approaching a phase gate the boss braces: the last 4 % above the line takes
    // a tenth of the damage, the line itself holds, and the boss is hurried into
    // its next warned attack (see noteGate). Weak points still break at full
    // damage; any hull loss they cause past the line is banked, not lost.
    const before=body.hp,band=this.stages.encounter?.gateBand?.()||body.maxHp*.04,top=floor+band,hull=!partId||body.partsCarryHull;
    // The cap keeps a margin (/1.5) for bosses that scale damage inside their own hit;
    // a boss whose kill pool is not its gauge (Gallipoli's command post) reports it.
    if(hull){const free=Math.max(0,before-top);damage=Math.min(damage<=free?damage:free+(damage-free)*.1,Math.max(0,before-floor)/1.5);
      if(!partId&&typeof body.coreReserve==='function')damage=Math.min(damage,Math.max(0,body.coreReserve()-1));}
    // Several bosses pass weak-point damage into the hull and can die inside the
    // part hit, so a part hit spends at most the hull left above the line.
    else damage=Math.min(damage,Math.max(0,before-floor));
    const result=body.hit({partId,damage});
    if(!body.dead&&body.hp<Math.min(floor,before)){const held=Math.min(floor,before);if(!hull)body.pendingDrop=(body.pendingDrop||0)+held-body.hp;body.hp=held;}
    if(!body.dead&&body.hp<=top+.5){this.noteGate(body,floor);result.armored=true;}
    return result;
  }
  floorFor(body){return !this.showFloors||body.dead?0:typeof body.hpFloor==='function'?body.hpFloor():this.stages.encounter?.guardFloor?.(body)||0;}
  // The pilot has reached a gate: hurry every living body into its next warned
  // attack (at most every 2.5 s) and tell the HUD which line is holding.
  noteGate(body,floor){
    const enc=this.stages.encounter;if(!enc)return;const now=enc.clock||0;
    enc.gateHold={bodyId:body.id,frac:floor/body.maxHp,until:now+.6};
    // One toast per gate; hurry may repeat.
    const key=enc.gate?.at??Math.round(floor);if(enc.gateCueKey!==key){enc.gateCueKey=key;this.hooks.onCue?.({type:'boss-gate-armor',bossId:body.id,encounterId:enc.id});}
    if(now<(enc.gateHurryAt??-Infinity)+1.2)return;enc.gateHurryAt=now;
    for(const b of enc.bodies.values())if(!b.dead)b.hurry?.();
  }
  // While a shared gate is up, keep hurrying (a timer that fired nothing warned is
  // skipped next time) and keep the bar locked; banked weak-point loss lands after.
  settleBanked(){
    const enc=this.stages.encounter;enc?.pendingAttack();
    // Advance the shared gate on the clock too, so a pause in hits never leaves it held.
    if(enc?.gate?.at!=null){const live=[...enc.bodies.values()].find(b=>!b.dead&&typeof b.hpFloor!=='function');if(live)enc.guardFloor(live);}
    if(enc?.gate?.at!=null){const now=enc.clock||0;enc.gateHold={bodyId:enc.gateHold?.bodyId,frac:enc.gateLine,until:now+.3};
      if(now>=(enc.gateHurryAt??-Infinity)+1.2){enc.gateHurryAt=now;for(const b of enc.bodies.values())if(!b.dead)b.hurry?.();}}
    for(const b of this.stages.encounter?.bodies.values()||[]){if(b.dead||!(b.pendingDrop>0))continue;
      const floor=this.floorFor(b),take=Math.min(b.pendingDrop,Math.max(0,b.hp-Math.max(floor,1)));if(take>0){b.hp-=take;b.pendingDrop-=take;}}
  }
  hitAt({x,y,radius=0,damage,faction}) {
    for(const body of this.stages.encounter?.bodies.values()||[]) {
      if(body.dead)continue;const hit=body.locateHit({x,y,radius});
      if(hit)return this.hit({bodyId:body.id,...hit,damage,faction});
    }return{damage:0,miss:true};
  }
  tick(dt,frame) {
    if(this.ended||frame.paused)return false;
    if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid boss step');
    dt=Math.min(.05,dt);if(!dt)return false;
    // Bosses see copies of the pilots carrying their turn rate; the host's frame objects stay untouched.
    frame={...frame,dt,players:(frame.players||[]).map(p=>({...p}))};this.time+=dt;this.frameContext=frame;this.recordTrail(frame);for(const b of this.stages.encounter?.bodies.values()||[])if(b.jutlandBoss&&b.dead)b.deathAge=(b.deathAge||0)+dt;
    for(const d of this.bodyDefeats){d.age+=dt;if(d.kind==='gotha-raider'&&!d.impacted&&d.age>=d.duration*.86){
      d.impacted=true;const pose=gothaCrashPose(d,d.age,d.duration);
      this.hooks.onCue({type:'boss-destruction-pulse',encounterId:this.stages.encounter?.id,bossId:'gotha-squadron',x:pose.x,y:pose.y,radius:58,final:false});
    }}
    this.bodyDefeats=this.bodyDefeats.filter(d=>d.age<d.duration);
    const encounter=this.stages.encounter;
    tickBossEntry(this,encounter,dt);
    if(tickBossArrival(this,encounter,dt,frame))return true;
    // Resolve destruction before any lingering delayed attack can fire.
    this.reconcile({blocked:true});
    if(this.defeatSequence)this.updateDefeat(dt);
    else if(encounter&&!encounter.completed)encounter.update(dt,{...frame,canBasicFire:this.canBasicFire,isIlluminated:p=>this.hazards.isIlluminated(p)});
    if(this.showFloors&&encounter&&!encounter.completed)this.settleBanked();
    for(const b of encounter?.bodies.values()||[]){const ship=b.support129||(b.kind.startsWith('hms-zubian')?b:null);if(ship&&!b.dead){if(b.support129)ship.hullYaw=ship.angle||0;recordShipWake(ship,dt,ship.height||950);}}
    // Queued rounds leave the actual surviving mount, even while the hull
    // moves during the warning. Once fired, their trajectory stays committed.
    this.hazards.pool.visit(h=>{
      if(h.visual==='dover-searchlight'){
        const body=encounter?.bodies.get(h.bossId),lamp=body?.parts.get(h.sourcePartId);
        if(!body||body.dead||!lamp||lamp.destroyed){this.hazards.pool.release(h.index,h.generation);return;}
        h.x=body.x+lamp.x;h.y=body.y+lamp.y;return;
      }
      if(h.activated)return;
      const body=encounter?.bodies.get(h.bossId);
      if(body&&h.kind==='projectile'&&h.tag===body.id+':basic-fire'){
        const part=h.sourcePartId&&body.parts.get(h.sourcePartId);
        if(body.dead||h.sourcePartId&&(!part||part.destroyed)){this.hazards.pool.release(h.index,h.generation);return;}
        const m=basicBarrageMuzzle(body,h);if(m){h.x=m.x;h.y=m.y;}return;
      }
      if(!h.sourcePartId)return;
      const part=body?.parts.get(h.sourcePartId);
      if(!body||body.dead||!part||part.destroyed||body.isCapitalBoss&&part.disabled){this.hazards.pool.release(h.index,h.generation);return;}
      if(h.kind==='projectile'){const m=body.isCapitalBoss?body.hazardMuzzle(part,h):body.kind==='fliegerzug'?fliegerGunMuzzle(body,part,h.sourceAngle??part.shotAngle):body.kind==='treffas-wagen'&&part.id.startsWith('mg-')?treffasMgMuzzle(body,part,h.sourceAngle??part.aimAngle):null;if(m){h.x=m.x;h.y=m.y;}else{h.x=body.x+part.x+h.sourceOffsetX;h.y=body.y+part.y+h.sourceOffsetY;}}
    });
    this.hazards.update(dt,frame);
    return true;
  }
  beginDefeat(encounter) {
    const capital=[...encounter.bodies.values()].find(b=>b.isCapitalBoss);if(capital){capital.destroying=true;capital.defeatAge=0;}
    const bodies=[...encounter.bodies.values()].filter(b=>!['gotha-raider','o400-raider'].includes(b.kind)||this.bodyDefeats.some(d=>d.id===b.id)).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y}));
    const sinking=/^(sms-stuttgart|hms-zubian|armored-harbor-fortress|jutland-grand-fleet)$/.test(encounter.bossId);
    const fortress=[...encounter.bodies.values()].find(b=>b.fortressBoss),collapseSites=fortress?verdunFortCollapseSites(fortress):null;
    this.defeatSequence={encounterId:encounter.id,bossId:encounter.bossId,age:0,duration:capital?7:collapseSites?4.8:sinking?4.4:2.65,pulse:0,bodies,...(collapseSites?{collapseSites}:null)};
    this.hazards.clear(encounter.id);this.hooks.clearEncounterOwned(encounter.id);
    this.hooks.onCue({type:'boss-destruction-start',encounterId:encounter.id,bossId:encounter.bossId,bodies});
  }
  updateDefeat(dt) {
    const d=this.defeatSequence;if(!d)return;d.age=Math.min(d.duration,d.age+dt);
    // Each Gotha owns its moving crash and one impact; keep the clear delay.
    if(d.bossId==='gotha-squadron')return;
    for(const b of this.stages.encounter?.bodies.values()||[])if(b.isCapitalBoss){b.defeatAge=d.age;b.destroying=true;for(const p of b.parts.values())if(d.age>=.4+[...b.parts.keys()].indexOf(p.id)*.11&&p.hp>0&&p.id!==(b.kind==='final-kaiserkrone'?'main-envelope':'flying-boat-hull')){p.hp=0;p.destroyedAt=d.age;}b.syncParts();}
    if(d.collapseSites){
      while(d.pulse<d.collapseSites.length&&d.age>=d.collapseSites[d.pulse].at){
        const q=d.collapseSites[d.pulse++];this.hooks.onCue({type:'boss-destruction-pulse',encounterId:d.encounterId,bossId:d.bossId,partId:q.partId,x:q.x,y:q.y,radius:q.radius,final:!!q.final});
      }
      return;
    }
    const schedule=d.duration===7?[0,.3,.65,1,1.5,2,2.6,3.2,4,4.8,5.6,6.5]:[0,.22,.48,.78,1.12,1.5,1.9,2.28,2.58];
    while(d.pulse<schedule.length&&d.age>=schedule[d.pulse]){
      const i=d.pulse++,body=d.bodies[i%d.bodies.length],airship=/zeppelin|hma23/.test(body.kind);
      const spanX=body.kind.startsWith('final-')?350:airship?170:body.kind.includes('zubian')||body.kind==='sms-stuttgart'?90:72;
      const spanY=body.kind.startsWith('final-')?290:airship?42:body.kind.includes('zubian')||body.kind==='sms-stuttgart'?120:105;
      const final=i===schedule.length-1;
      this.hooks.onCue({type:'boss-destruction-pulse',encounterId:d.encounterId,bossId:d.bossId,
        x:body.x+(this.rng()-.5)*spanX*2,y:body.y+(this.rng()-.5)*spanY*2,radius:final?130:48+(i%3)*14,final});
    }
  }
  reconcile({blocked}={}) {
    if(this.ended)return null;
    if(typeof blocked!=='boolean')throw new Error('Pass current pause/upgrade/game-over block state');
    const encounter=this.stages.encounter;
    if(encounter?.completed&&this.stages.phase==='boss'&&!this.defeatSequence)this.beginDefeat(encounter);
    if(this.defeatSequence&&this.defeatSequence.age<this.defeatSequence.duration)return null;
    if(this.stages.poll()) {
      if(!(this.stages.capitalEncounter&&this.stages.capitalRound===0))this.hooks.onEncounterCleared({id:encounter.id,bossId:encounter.bossId});
      this.defeatSequence=null;
    }
    if(this.stages.phase==='clear-pending'&&this.stages.capitalRound===1){
      const final=this.notifyCapitalFinalDefeated(encounter,{blocked});if(final)return final;
      if(!blocked&&this.capitalDefeatReceipts.has(encounter?.id)&&this.hooks.waitForFinalArenaEligibility?.()){
        if(!this.capitalPeerWait||this.capitalPeerWait.id!==encounter.id)this.capitalPeerWait={id:encounter.id,until:this.time+2};
        if(this.time<this.capitalPeerWait.until)return null;
      }
    }
    const transition=this.stages.advance(blocked);
    if(transition){if(transition.kind==='final-arena')this.hooks.onFinalArenaPending(transition);else if(transition.kind==='capital-final')this.hooks.onCue({...transition,type:'capital-final-pending'});else this.hooks.onStageChange(transition);}return transition;
  }
  // Called on host game-over/restart; it does not restart players or submit scores.
  dispose() {
    if(this.ended)return;this.ended=true;
    const encounter=this.stages.encounter;if(encounter){for(const b of encounter.bodies.values())b.dispose?.();this.hooks.clearEncounterOwned(encounter.id);}
    this.hazards.pool.clear();this.stages.encounter=null;this.frameContext=null;
    this.defeatSequence=null;this.bodyDefeats=[];
  }
}




