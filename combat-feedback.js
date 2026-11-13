import {pruneCriticalFeedback} from './aircraft-criticals.js';
import {bishopGlovesInterval} from './equipment-flight-balance.js';
import {recordEquipmentHit} from './equipment-hit-feedback.js';
import {weaponImpactKind} from './weapon-impact-profile.js';
import {combatImpactResult,ordinaryMgContact} from './combat-impact-result.js';
import {queueCombatImpact,advanceReplicaImpactFx,pushExplosionFx,combatFxAge} from './explosion-profiles.js?v=fx5';
import {playerAirframeModel} from './player-airframe-handling.js?v=handling5';
import {drawFuelFire} from './explosion-profiles.js?v=fx5';
import {beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash,enemyCanCrash,enemyCrashScale,enemyCrashVisual} from './aircraft-crash.js?v=descent20261022';
import {drawTracerBolt} from './projectiles.js?v=pilotfx20261018&strafe=20261111';
import {tacticalCueSound} from './tactical-combat-view.js?v=combat20261024&td4=20261026';
// Presentation owns its own state and deterministic variation. Never consume the
// simulation RNG or write aircraft positions, headings, damage, or rewards here.
const worlds=new WeakMap(),poses=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
const ordinary=e=>e&&!e.bossPilot&&!e.ace&&!e.rivalAce&&!e.eliteKind&&!e.stageBossBody&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.fieldUnit&&!e.navalVessel&&!e.bugDrone&&!e.groundEscort&&!e.missionGround&&!e.londonInstallation&&!e.cityUnit&&!e.bossAirship&&!e.expired&&['scout','hunter','bomber'].includes(e.type);
// 20261111 air wake. Visual only: reads flight state the simulation already produced.
//  ribbon  - wingtip condensation that stays where the wing was, so a hard turn draws its arc
//  whip    - the air torn by an enemy round that passes within a wingspan of the player
//  rock    - both aircraft rock in each other's wake at a close crossing (existing detector)
//  thread  - the thin smoke a tracer round leaves behind it on the way out
// All three reuse the painted vapour / wind-streak / mist sprites and existing detectors.
export const AIR_WAKE=Object.freeze({
 ribbonLife:.62,ribbonSample:1/30,ribbonGap:.09,playerTurn:1.25,playerSpan:2.5,enemyTurn:1.5,enemySpan:1.2,
 ribbonDraws:120,compactRibbonDraws:28,ribbonAircraft:8,compactRibbonAircraft:3,
 whipLife:.26,whipGap:.07,whips:8,compactWhips:4,
 rock:.14,rockFor:.5,killPunch:1.5,compactKillPunch:1.05,
 threads:20,compactThreads:10,threadReach:125,hostileThreadReach:105,threadMin:26
});
// 20261111 flight character. Every sortie aircraft already has its own handling trait
// (aircraft-combat-roles.js) but nothing on screen said when it was working. These read
// that state and show it; none of them changes how any aircraft flies.
export const FLIGHT_CHARACTER=Object.freeze({biteWake:.8,biteWidth:1.35,holdWake:.5,surgeAlpha:.72,aimReach:1.4});
export const COMBAT_FEEDBACK_LIMITS=Object.freeze({impacts:40,compactImpacts:20,wrecks:10,compactWrecks:5,trail:48,compactTrail:24,plumes:64,compactPlumes:32});
export const COMBAT_CRASH_PROFILES=Object.freeze(['spin','smoke','fire','runaway']);
const _lpShare=[0,0];
function localPoint(e,forward,side){const q=combatVisualPose(e),a=e.a+q.roll;_lpShare[0]=e.x+q.x+Math.cos(a)*forward-Math.sin(a)*side*q.bank;_lpShare[1]=e.y+q.y+Math.sin(a)*forward+Math.cos(a)*side*q.bank;return _lpShare}
export function impactMaterial(e,b){
 if(e.surface||e.fieldUnit||e.navalVessel||e.stageBossBody)return 'metal';
 const dx=b.x-e.x,dy=b.y-e.y,forward=dx*Math.cos(e.a)+dy*Math.sin(e.a),side=-dx*Math.sin(e.a)+dy*Math.cos(e.a);
 return forward>9&&Math.abs(side)<12?'metal':Math.abs(side)>15?'fabric':'wood';
}
const NO_POSE={x:0,y:0,roll:0,bank:1,active:false};
export function combatVisualPose(e){return poses.get(e)||NO_POSE}
// Caller-owned output avoids allocations during continuous multi-gun fire.
export function combatMountPoint(e,forward,side,out){
 const q=combatVisualPose(e),a=e.a+q.roll,c=Math.cos(a),s=Math.sin(a);
 out.x=e.x+q.x+c*forward-s*side*q.bank;
 out.y=e.y+q.y+s*forward+c*side*q.bank;
 return out;
}
function pose(e,time,dt,damageState,flight=false){
 const q=poses.get(e)||{x:0,y:0,roll:0,bank:1,lastA:e.a,lastHp:e.hp,kick:0,turn:0};
 if(flight){const elapsed=time-(q.flightAt??time),prior=q.airspeed;
  q.flightSpeed=elapsed>0&&q.lastX!=null&&e.speed>0?Math.hypot(e.x-q.lastX,e.y-q.lastY)/elapsed/e.speed:(e.airframeSpeed??1);
  q.airspeed=clamp(q.flightSpeed*(e.speed||170),0,(e.speed||170)*1.7);
  const acceleration=elapsed>0&&prior!=null?clamp((q.airspeed-prior)/elapsed,-300,300):0;
  q.acceleration=(q.acceleration||0)+(acceleration-(q.acceleration||0))*(1-Math.exp(-dt*8));q.lastX=e.x;q.lastY=e.y;q.flightAt=time;
 }
 const rate=dt>0?clamp(angle(e.a-q.lastA)/dt,-4,4):0;
 q.turn+=(rate-q.turn)*(1-Math.exp(-dt*12));q.kick=Math.max(e.hp<q.lastHp-.4?1:0,q.kick-dt*6);
 const shot=!(e.reloadTime>0)&&!(e.cannonRecoil129>0)?Math.sin(clamp((e.muzzleFlash||0)/.09)*Math.PI)*1.25:0;
 const weight=e.bomberTransfer?.kind==='airship'?.35:e.bomberTransfer?.6:e.weapon?.bidirectional?.7:1;
 const side=Math.sin(time*67)*q.kick*1.6*weight;
 q.x=-Math.cos(e.a)*shot-Math.sin(e.a)*side;q.y=-Math.sin(e.a)*shot+Math.cos(e.a)*side;
 const hit=damageState?clamp(1-(time-damageState.lastHit)/.18):0;
 const punch=Math.sin(hit*Math.PI)*(damageState?.impulse||0)*(flight?weight:1);
 // A damped visual recoil follows the incoming round, never the simulation body.
 q.x+=Math.cos(damageState?.direction||0)*punch;
 q.y+=Math.sin(damageState?.direction||0)*punch;
 q.roll=(Math.sin(time*61)*q.kick*.018+(damageState?.side||1)*Math.sin(hit*Math.PI)*(.045+(damageState?.impulse||0)*.012))*weight;
 // A close crossing rocks both aircraft in each other's wake (picture only).
 if(q.rockAt!=null){const u=(time-q.rockAt)/AIR_WAKE.rockFor;if(u>=0&&u<1)q.roll+=Math.sin(u*Math.PI*2.5)*(1-u)*AIR_WAKE.rock*(q.rock||1)*(q.rockSide||1)*weight;else if(u>=1)q.rockAt=null;}
 const sway=e.criticalSway;
 if(sway&&!sway.player){const u=clamp(sway.age/sway.duration);q.roll+=Math.sin(u*Math.PI*3)*(1-u)*.22;}
 // A damaged wing drags the nose toward it; a wounded pilot cannot fly a clean line.
 const bd=flight?null:e.battleDamage;
 if(bd?.wing)q.roll+=bd.wing*.09+Math.sin(time*8.3)*.025;
 if(bd?.pilot)q.roll+=Math.sin(time*3.1)*.05;
 // Keep the authored top-down wing shape during ordinary flight.
 // Bank reading for the renderer: -1..1 from the smoothed turn rate (right turn positive).
 {const span=flight?3.6:2.3,x=clamp(Math.abs(q.turn)/span);q.lean=Math.sign(q.turn)*Math.min(1,x*x*(3-2*x)*(e.aircraftStyleKind==='turn'?1.2:1));}
 // Full wing width is kept (the authored top-down shape); the bank is told by light alone.
 q.active=true;q.bank=1;q.lastA=e.a;q.lastHp=e.hp;poses.set(e,q);
}
export function gunShotFeedback(world,ownerId,cow37=false){
 const p=world.players?.find(p=>p.id===(ownerId||world.localPlayerId))||world.players?.[0]||world;
 const baseInterval=Math.max(.025,p.rate||60/(p.weapon?.rpm||600)),rpm=60/baseInterval;
 const boost=(world.players||p.world?.players)&&p.udetBoost>0?2.4:1;
 const precision=!cow37&&p.weaponMods?.GUN==='precision',actualInterval=bishopGlovesInterval(p,Math.max(.02,baseInterval/(boost*(p.pilot==='jacobs'?1+(p.jacobsStacks||0)*.1:1)))),shotInterval=precision?Math.max(.005,actualInterval*.35):baseInterval;
 return {guns:p.weapon?.guns||1,rpm,heavy:cow37||!!p.motorCannon,cow37,precision,shotInterval,intervalMs:cow37?45:precision?Math.max(4,shotInterval*800):Math.max(45,Math.min(120,60000/rpm*.9))};
}
export function blastFeedbackStrength(f){
 if(f.fxHidden)return 0;
 return ({aircraft:1.1,groundShell:1.1,heavyShell:2.6,ammoCookoff:2.4,armorBreak:1.6,engineBreak:1.8,navalBreak:2.3})[f.fxProfile]||({grenade:.9,cooper:1.15,puw:2.0,bomb:1.5,rocket:1.2,cannon:.9,incendiary:.35,mine:1.5,shell:1.3,flak:1.1})[weaponImpactKind(f)]||0;
}
export function attachCombatFeedback(world,{play=()=>{},pulse=()=>{},key=e=>e.escortPlane||e.bossPlane||e.plane,scale=()=>1}={}){
 if(worlds.has(world))return worlds.get(world);
 const state={punch:0,punchX:0,punchY:0,punchAge:1,nextPunch:0,nextReplicaShot:0,heardRounds:new WeakSet(),impacts:[],wrecks:[],trail:[],plumes:[],passes:[],ribbons:new WeakMap(),ribbonOwners:[],whips:[],nextWhip:0,threadBorn:new WeakMap(),damage:new WeakMap(),battleFx:new WeakMap(),serial:0,impactSerial:0,time:world.t||0,nextNear:0,nextPass:0,nextApproach:0,camera:0,duckUntil:0,headOnUntil:0,previous:new WeakMap(),whizzed:new WeakSet(),dead:new WeakSet(),pendingKill:null,heard:new WeakSet(),heardIds:new Set(),heardCriticalIds:new Map()};
 worlds.set(world,state);world.combatPresentation=true;
 const compact=()=>world.viewWidth<=720;
 const cap=(list,small,big)=>{const max=compact()?small:big;if(list.length>max)list.splice(0,list.length-max)};
 // Cosmetic copies reuse ace motion and production FX without simulation RNG.
 let visualSeed=0x41ce;const visualRandom=()=>((visualSeed=(Math.imul(visualSeed,1664525)+1013904223)>>>0)/4294967296);
 const burst=world.burst,smoke=world.smoke;
 const crashEffects={rng:visualRandom,
  smoke(x,y,heavy){let w=0;for(const p of state.trail)if(p.life>0)state.trail[w++]=p;state.trail.length=w;if(state.trail.length>=(compact()?COMBAT_FEEDBACK_LIMITS.compactTrail:COMBAT_FEEDBACK_LIMITS.trail))return;smoke.call({rng:visualRandom,particles:world.particles},x,y,heavy);state.trail.push(world.particles.at(-1))},
  burst(x,y,color){world.combatFX??=[];const fire=this.wreck?.style==='fire';burst.call({rng:visualRandom,particles:world.particles,combatFX:world.combatFX,viewWidth:world.viewWidth},x,y,fire?color:'#ab9471',fire?30:12,'aircraftMedium')},
  event(){play(this.wreck?.style==='fire'?'impact':'airframeBreak')}
 };
 world.burst=function(x,y,color,n,...args){
  // Online guests receive combatFX, not these local wreck copies. Preserve the
  // shared explosion there so killing a minion remains visible on both peers.
  const e=!this.online&&color==='#f2aa52'&&n>=26?(this.enemies||[]).find(e=>ordinary(e)&&e.hp<=0&&!e.crashing&&!e.crashed&&!enemyCanCrash(e)&&Math.hypot(e.x-x,e.y-y)<2):null;
  const particleStart=this.particles?.length||0,oldFx=e?new Set(this.combatFX||[]):null;
  const result=burst.call(this,x,y,color,n,...args);
  if(!e)return result;
  // Preserve the original RNG calls, but replace the generic kill artwork.
  if(state.dead.has(e)){this.combatFX=(this.combatFX||[]).filter(f=>oldFx.has(f)||!f.killExplosion);this.particles?.splice(particleStart);return result}
  state.dead.add(e);const sequence=state.serial++,large=sequence%17===16;
  state.pendingKill=large?'kill':'airframeBreak';
  if(!large){
   this.combatFX=(this.combatFX||[]).filter(f=>oldFx.has(f)||!f.killExplosion);this.particles?.splice(particleStart);
   const wreck={x:e.x,y:e.y,a:e.a,speed:e.speed||100,type:e.type,key:key(e),scale:scale(e)};
   beginAircraftCrash(wreck,visualRandom);
   const damage=state.damage.get(e);wreck.style=damage?.structure>=3?'spin':damage?.engine>=2?(sequence%2?'smoke':'fire'):COMBAT_CRASH_PROFILES[sequence%COMBAT_CRASH_PROFILES.length];wreck.crashStyle=wreck.style==='spin'?'spin':'glide';wreck.side=damage?.side||Math.sign(wreck.crashSpin);wreck.age=0;
   // Keep the proven ace trajectory as the default; vary only dead visual copies.
   if(wreck.style==='smoke'){wreck.crashT=1.65;wreck.crashSpin*=.12}
   if(wreck.style==='fire'){wreck.crashT=1.45;wreck.crashSpin*=.3}
   if(wreck.style==='runaway'){wreck.crashT=1.9;wreck.crashDir=e.a;wreck.crashSpeed=Math.max(160,e.speed||100);wreck.crashSpin*=.055}
   wreck.crashDuration=wreck.crashT;
   state.wrecks.push(wreck);
   cap(state.wrecks,COMBAT_FEEDBACK_LIMITS.compactWrecks,COMBAT_FEEDBACK_LIMITS.wrecks);
  }
  return result;
 };
 const blast=world.combatBlast;
 if(blast)world.combatBlast=function(x,y,...args){const previous=this.combatFX?.at(-1),result=blast.call(this,x,y,...args),effect=this.combatFX?.at(-1);if(effect&&effect!==previous)effect.feedbackId??='blast:'+(this.combatFeedbackSerial=(this.combatFeedbackSerial||0)+1);return result};
 const event=world.event;
 world.event=function(type,...args){const result=event.call(this,type,...args);if(type==='explosion'){const effect=this.combatFX?.at(-1),emitted=this.events?.at(-1);if(effect&&emitted?.type==='explosion'){effect.feedbackId??='blast:'+(this.combatFeedbackSerial=(this.combatFeedbackSerial||0)+1);emitted.combatFeedbackId=effect.feedbackId;}}if(type==='kill'&&state.pendingKill){const emitted=this.events?.at(-1);if(emitted?.type==='kill')emitted.combatSound=state.pendingKill;state.pendingKill=null}if(type==='impact'&&state.pendingImpact){const emitted=this.events?.at(-1);if(emitted?.type==='impact')emitted.combatMaterial=true;state.pendingImpact=false}if(type==='shot')pulse('shot');else if(type==='hit'){state.camera=Math.max(state.camera,.9);pulse('hit')}return result};
 const contactRounds=new WeakSet();
 const recordPlayerHit=(p,hp,source)=>{
  recordEquipmentHit(p,hp,source,world.t||0);
  const round=source?.bullet;
  // Confirmed projectile contact only. Bomb zones already own their explosion.
  if(p.hp<hp&&round?.enemy&&!round.actualExplosion&&!round.blast&&!round.fireZone&&!contactRounds.has(round)&&(round.hostileRocket||round.fieldShell||round.flak)){
   contactRounds.add(round);
   const weapon=round.hostileRocket?'rocket':round.fieldShell?'shell':'flak';
   const list=world.combatFX??=[],contacts=list.filter(f=>f.presentationContact),limit=world.viewWidth<=720?6:10;
   if(contacts.length>=limit)list.splice(list.indexOf(contacts[0]),1);
   pushExplosionFx(world,{presentationContact:true,x:Number.isFinite(source.impactX)?source.impactX:p.x,y:Number.isFinite(source.impactY)?source.impactY:p.y,radius:weapon==='rocket'?40:32,life:.65,maxLife:.65,side:'enemy',kind:weapon,impactWeapon:weapon,direction:Math.atan2(round.vy||0,round.vx||0),feedbackId:'contact:'+(world.combatFeedbackSerial=(world.combatFeedbackSerial||0)+1)});
  }
  if(p.hp<hp&&source&&Number.isFinite(source.x)&&Number.isFinite(source.y)){
   const side=-(source.x-p.x)*Math.sin(p.a)+(source.y-p.y)*Math.cos(p.a);
   const b=source.bullet,vx=Number.isFinite(b?.vx)?b.vx:0,vy=Number.isFinite(b?.vy)?b.vy:0;
   const dx=vx||vy?vx:p.x-source.x,dy=vx||vy?vy:p.y-source.y;
   const impulse=dx||dy?clamp(.8+(hp-p.hp)/Math.max(1,p.maxHp||hp)*12,.8,2.4):0;
   state.damage.set(p,{lastHit:world.t||0,side:Math.sign(side)||1,direction:Math.atan2(dy,dx),impulse});
  }
 };
 const hitPlayer=world.hitPlayer;
 if(hitPlayer)world.hitPlayer=function(p,...args){const hp=p.hp,source=p.damageSource,result=hitPlayer.call(this,p,...args);recordPlayerHit(p,hp,source);return result};
 for(const p of world.players||[world]){
  const hit=p.hit;
  if(hit)p.hit=function(...args){
   const hp=this.hp,source=this.damageSource,result=hit.apply(this,args);
   recordPlayerHit(this,hp,source);
   return result;
  };
  const impact=p.specialRoundImpact;
  if(impact)p.specialRoundImpact=function(b,e){
   const resolved=combatImpactResult(b,e),ordinaryMg=ordinaryMgContact(e,b,resolved),result=impact.call(this,b,e);if(b.patrol)return result;
   const dealt=resolved?.damage>0,heavy=!!(b.rocket||b.cow37||b.motorCannon);
   const splash=b.actualExplosion&&!b.secondaryExplosion&&['bomb','cooper','puw'].includes(b.fxSource);
   if(resolved?.blocked&&!dealt&&!b.actualExplosion&&!b.blast&&!b.fireZone){
    if(queueCombatImpact(world,b,e,{material:'metal',blocked:true}))play('armorClink');
    return result;
   }
   if(!dealt||(b.actualExplosion||b.blast)&&!splash||b.fireZone||b.identityDotTarget||b.flak)return result;
   const critical=resolved.critical;
   const material=resolved.railArmor?'metal':impactMaterial(e,b),index=++state.impactSerial;
   // Large authored parts extend beyond 256px. Follow the confirmed contact,
   // not an artificial inner radius that pulls their hit flash into the hull.
   const dx=b.x-e.x,dy=b.y-e.y,reach=e.stageBossBody?Infinity:30,forward=clamp(dx*Math.cos(e.a)+dy*Math.sin(e.a),-reach,reach),side=clamp(-dx*Math.sin(e.a)+dy*Math.cos(e.a),-reach,reach);
   const d=state.damage.get(e)||{engine:0,structure:0,lastHit:-Infinity,streak:0,nextSmoke:0,side:1,broken:false};
   d.streak=(world.t||0)-d.lastHit<.45?Math.min(6,d.streak+1):1;d.lastHit=world.t||0;d.side=Math.sign(side)||d.side;
   if(critical?.part==='engine')d.engine++;
   if(critical?.part==='body'||critical?.part==='wing')d.structure++;
   state.damage.set(e,d);
   const aircraft=enemyCanCrash(e)||ordinary(e),finisher=aircraft&&e.hp<=0&&!d.finished;
   const breakup=aircraft&&e.hp>0&&e.hp/e.maxHp<.4&&!d.broken;
   d.direction=splash?Math.atan2(-dy,-dx):Math.atan2(b.vy||0,b.vx||0);
   d.impulse=aircraft?Math.min(e.type==='bomber'?2.5:5,(heavy?3.2:ordinaryMg?1.95:1.4)+d.streak*.45+(breakup?1.5:0)):0;
   if(breakup)d.broken=true;
   if(finisher)d.finished=true;
   if(heavy||splash||critical){
    // The dedicated detonation or part cue already owns the sound.
    if(splash&&aircraft){
     const offset=Math.min(12,Math.hypot(dx,dy));
     queueCombatImpact(world,{x:e.x-Math.cos(d.direction)*offset,y:e.y-Math.sin(d.direction)*offset,vx:-dx,vy:-dy},e,{material:'fabric',splash:true});
    }
    state.pendingImpact=true;
    return result;
   }
   const cue=queueCombatImpact(world,b,e,{material,railArmor:resolved.railArmor,partHit:!!resolved.partId,streak:d.streak,impactVariant:index%3,impactMass:b.heavy?1.16:1,incendiary:!!b.burn,piercing:!!b.pierce,breakup,finisher,...(ordinaryMg&&!breakup&&!finisher?{ordinaryMg:true}:{})});
   if(cue&&resolved.railArmor)play('armorClink');
   if(cue&&e.hp>0){
    state.impacts.push({effect:cue,target:e,forward,side,age:0});cap(state.impacts,COMBAT_FEEDBACK_LIMITS.compactImpacts,COMBAT_FEEDBACK_LIMITS.impacts);
    // The opening contact of a burst deserves a tiny directional confirmation.
    // No repeated MG shake, no recoil on distant targets, no simulation pause.
    if(d.streak===1&&state.punchAge>.16){
     const local=world.online?(world.players||[]).filter(p=>p.id===world.localPlayerId):(world.players||[world]);
     const nearby=local.find(p=>p.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<Math.min(480,(world.viewWidth||960)/Math.max(.7,world.camera?.zoom||1)*.55));
     if(nearby){state.punch=compact()?.26:.36;state.punchX=Math.cos(d.direction);state.punchY=Math.sin(d.direction);state.punchAge=0;}
    }
   }
   // Only the decisive local hit gets a short camera/pad accent. Continuous MG
   // fire and distant kills must not shake the screen or drown incoming warnings.
   if(breakup||finisher){
    // A late special-round finisher or first structural breakup stays decisive.
    e.hitFlash=Math.max(e.hitFlash||0,.24);
    const local=world.online?(world.players||[]).filter(p=>p.id===world.localPlayerId):(world.players||[world]);
    const zoom=world.camera?.zoom||1;
    if(local.some(p=>p.hp>0&&Math.abs(e.x-p.x)<(world.viewWidth||960)/zoom*.5&&Math.abs(e.y-p.y)<(world.viewHeight||700)/zoom*.5)){
     state.camera=Math.max(state.camera,finisher?2.2:1.15);state.duckUntil=(world.t||0)+.16;pulse('explosion');
     // The killing round shoves the view along its own line: the kill has a direction, not just a shake.
     if(finisher){state.punch=compact()?AIR_WAKE.compactKillPunch:AIR_WAKE.killPunch;state.punchX=Math.cos(d.direction);state.punchY=Math.sin(d.direction);state.punchAge=0;}
    }
    if(finisher)state.pendingKill='airframeBreak';else play('airframeBreak');
   }
   state.pendingImpact=true;if(cue&&!finisher&&!breakup&&!resolved.railArmor)play('materialImpact',{material,streak:d.streak});return result;
  };
 }
 const update=world.update;
 world.update=function(dt,...args){
  const before=this.t||0,result=update.call(this,dt,...args),replica=this.online&&!this.host,step=Math.min(.04,Math.max(0,replica?(this.state==='playing'?dt:0):(this.t||0)-before));
  state.pendingImpact=false;
  if(!step)return result;
  const players=state.players??=[];players.length=0;
  if(this.players){for(const p of this.players)if(p.hp>0&&(!p.status||p.status==='alive'))players.push(p)}else if(this.hp>0&&(!this.status||this.status==='alive'))players.push(this);
  state.time=replica?state.time+step:this.t;state.camera=Math.max(0,state.camera-step*9);state.punchAge+=step;
  if(replica)advanceReplicaImpactFx(this,step);
  for(const f of this.combatFX||[])if(f.fxProfile==='aircraftCritical'&&f.targetKey!=null&&(f.part==='engine'||f.part==='fuel'||combatFxAge(f)<.075)){
   const target=(this.enemies||[]).find(e=>e.criticalTargetKey===f.targetKey)||(this.players||[this]).find(p=>p.criticalTargetKey===f.targetKey);
   if(target?.hp>0){[f.x,f.y]=localPoint(target,f.anchorForward||0,f.anchorSide||0);f.airframeA=target.a+combatVisualPose(target).roll;}
  }
  // Live journal IDs cannot be displaced by high-rate ordinary impact IDs.
  const feedbackTime=this.t||0;
  for(const [id,expires] of state.heardCriticalIds)if(expires<=feedbackTime)state.heardCriticalIds.delete(id);
  let strongest=null,strongestPower=0,criticalCue=null;
  for(const f of [...pruneCriticalFeedback(this),...(this.combatFX||[])])if(!state.heard.has(f)){
   state.heard.add(f);
   if(f.v1500Cascade||f.riiCascade)continue; // Four authored sound beats; no duplicate automatic boom/shake.
   if(f.audioExpires!=null&&f.audioExpires<=feedbackTime)continue;
   if(f.feedbackId){
    if(f.fxProfile==='aircraftCritical'&&Number.isFinite(f.audioExpires)){
     if(state.heardCriticalIds.has(f.feedbackId))continue;state.heardCriticalIds.set(f.feedbackId,f.audioExpires);
    }else{if(state.heardIds.has(f.feedbackId))continue;state.heardIds.add(f.feedbackId);if(state.heardIds.size>256)state.heardIds.delete(state.heardIds.values().next().value);}
   }
   const weapon=weaponImpactKind(f),local=this.online?players.filter(p=>p.id===this.localPlayerId):players;
   let nearest=null,distance=Infinity;for(const p of local){const d=Math.hypot(f.x-p.x,f.y-p.y);if(d<distance){nearest=p;distance=d;}}
   const audible=distance<Math.max(480,(this.viewWidth||960)/(this.camera?.zoom||1)*.65);
   // Dedicated artillery owns the matching app-level explosion event even
   // when the native blast has no optional FX profile (for example Laon).
   if(f.artillerySound)for(const event of this.events||[])if(f.feedbackId&&event.combatFeedbackId===f.feedbackId)event.combatWeapon=true;
   if(weapon&&audible&&!f.artillerySound){play('weaponImpact',{weapon});for(const event of this.events||[])if(f.feedbackId&&event.combatFeedbackId===f.feedbackId)event.combatWeapon=true;}
   const power=blastFeedbackStrength(f)*clamp(1-distance/480);
   if(nearest&&power>strongestPower){strongest={effect:f,player:nearest};strongestPower=power;}
   if(f.fxProfile==='aircraftCritical'&&audible){
    const rank=f.player?4:f.pilotKill?3:f.ignite?2:1;if(!criticalCue||rank>criticalCue.rank)criticalCue={f,rank};
    if(f.player||f.ignite||f.pilotKill){state.duckUntil=(this.t||0)+.22;if(f.player)pulse('hit');}
   }
   else if(audible&&['groundShell','heavyShell','ammoCookoff'].includes(f.fxProfile)){if(!f.artillerySound)play('detonation',{profile:f.fxProfile});for(const event of this.events||[])if(f.feedbackId&&event.combatFeedbackId===f.feedbackId)event.combatWeapon=true;}
   else if(f.fxProfile==='tactical'){const cue=tacticalCueSound(f.tacticalCue);if(cue)play(cue,{tactical:true});}
   else if(f.fxProfile==='bulletImpact'&&replica&&audible&&!f.splash)play(f.blocked||f.railArmor?'armorClink':f.finisher||f.breakup?'airframeBreak':'materialImpact',{material:f.material,streak:f.streak});
   else if(audible&&['armorBreak','engineBreak','navalBreak'].includes(f.fxProfile)){play(f.fxProfile==='navalBreak'?'shipBreak':f.fxProfile==='engineBreak'?'airframeBreak':'metalBreak');pulse('explosion');}
  }
  if(criticalCue){const {f}=criticalCue;play(f.pilotKill?'criticalPilot':({wing:'criticalWing',body:'criticalBody',engine:'criticalEngine',fuel:'criticalFuel',cockpit:'criticalCockpit'})[f.part],{ignite:!!f.ignite,player:!!f.player});}
  if(strongest&&state.time>=state.nextPunch){
   const {effect:f,player:p}=strongest,d=Math.hypot(p.x-f.x,p.y-f.y)||1;
   state.punch=Math.min(compact()?1.8:2.3,strongestPower);state.punchX=(p.x-f.x)/d;state.punchY=(p.y-f.y)/d;state.punchAge=0;state.nextPunch=state.time+.18;state.duckUntil=(this.t||0)+.12;pulse('explosion');
  }
  if(replica){let shot=false,cow37=false,rocket=false;for(const b of this.bullets||[]){if(state.heardRounds.has(b))continue;state.heardRounds.add(b);if(b.ownerId===this.localPlayerId&&b.upgradeRocket&&!b.enemy)rocket=true;if(b.ownerId===this.localPlayerId&&!b.enemy&&!b.blast&&!b.actualExplosion&&!b.rocket&&!b.flak&&!b.ally&&!b.patrol&&!b.formation&&!b.pilotSupport&&!b.synthesisChild&&Math.hypot(b.vx||0,b.vy||0)>0){shot=true;cow37||=!!b.cow37;}}
   if(rocket)play('rocket');
   if(shot&&state.time>=state.nextReplicaShot){const profile=gunShotFeedback(this,this.localPlayerId,cow37);state.nextReplicaShot=state.time+profile.intervalMs/1000;play('shot',profile);}
  }
  for(const p of players)pose(p,state.time,step,state.damage.get(p),true);
  // Wingtip condensation: sample the tips only while the wing is really loaded.
  const ribbon=(e,turn0,span,half)=>{
   const q=poses.get(e);if(!q)return;let k=clamp((Math.abs(q.turn)-turn0)/span);let r=state.ribbons.get(e);
   // The airframe's own trait shows in its wake: a biting turn sheds thick vapour, a held
   // energy turn draws two steady streamers.
   const kind=e.aircraftStyleKind;if(kind==='turn'&&Math.abs(q.turn)>.8)k=Math.max(k,FLIGHT_CHARACTER.biteWake);else if(kind==='hold'&&Math.abs(q.turn)>.5)k=Math.max(k,FLIGHT_CHARACTER.holdWake);
   if(k<=0){if(r)r.open=false;return}
   if(Math.abs(e.x-this.x)>(this.viewWidth||960)||Math.abs(e.y-this.y)>(this.viewHeight||700))return;
   if(!r){r={pts:[],at:-9,open:false};state.ribbons.set(e,r);state.ribbonOwners.push(e)}
   if(state.time-r.at<AIR_WAKE.ribbonSample)return;
   const fresh=!r.open||state.time-r.at>AIR_WAKE.ribbonGap,[lx,ly]=localPoint(e,-5,-half),l0=lx,l1=ly,[rx,ry]=localPoint(e,-5,half);
   r.pts.push({lx:l0,ly:l1,rx,ry,t:state.time,k,fresh,bite:kind==='turn'});r.at=state.time;r.open=true;
   if(r.pts.length>24)r.pts.shift();
  };
  for(const p of players)if(p.hp>0)ribbon(p,AIR_WAKE.playerTurn,AIR_WAKE.playerSpan,27);
  for(const p of players){const q=poses.get(p);if(!q||!(p.hp>0))continue;const kind=p.aircraftStyleKind;
   // Speed coming back on a straight exit: eased so the streaks swell and fade, never pop.
   q.surge=(q.surge||0)+((kind==='surge'&&(p.airframeSpeed??1)<.985?1:0)-(q.surge||0))*(1-Math.exp(-step*(kind==='surge'?7:4)));
   // The moment a turning trait bites, the wing roots cough a burst of vapour.
   if(kind==='turn'&&q.traitKind!=='turn'&&state.time>=(q.biteAt||0)){q.biteAt=state.time+.9;for(const side of [-1,1]){const [x,y]=localPoint(p,-2,side*13);state.plumes.push({x,y,a:p.a,age:0,life:.34,key:'vaporTrail',streak:true,w:58,h:26,alpha:.62})}}
   q.traitKind=kind;
  }
  for(const e of this.enemies||[])if((enemyCanCrash(e)||ordinary(e))&&e.hp>0){
   const d=state.damage.get(e);pose(e,state.time,step,d);
   // Wingtip vapour is for aeroplanes only: ships, ground units and emplacements also pass through
   // this loop, and their turret/heading changes used to shed (and pay for) ribbons every frame.
   if(!e.crashing&&!e.surface&&!e.navalVessel&&!e.movingShip&&!e.stationary&&!e.fieldUnit&&e.type!=='bomber'&&e.type!=='zeppelin'&&!e.heavyBomber)ribbon(e,AIR_WAKE.enemyTurn,AIR_WAKE.enemySpan,23*scale(e));
   if(d&&e.hp/e.maxHp<.72&&this.t>=d.nextSmoke){
    d.nextSmoke=this.t+(compact()?.14:.09);const engine=d.engine>0,[x,y]=localPoint(e,engine?14:0,engine?0:d.side*20*scale(e));
    state.plumes.push({x,y,a:e.a,age:0,life:.85,heavy:e.hp/e.maxHp<.35,engine});
   }
   // Standing battle damage is legible from its trail: dark oil from a hit engine,
   // a pale fuel streak from a holed tank, thin smoke off a damaged wing.
   const bd=e.battleDamage;
   if(bd&&(bd.engine||bd.leak||bd.wing)&&state.time>=(state.battleFx.get(e)||0)){
    state.battleFx.set(e,state.time+(compact()?.11:.07));const k=scale(e);
    if(bd.engine){const [x,y]=localPoint(e,13*k,0),failing=bd.engine>1;state.plumes.push({x,y,a:e.a,age:0,life:failing?1.7:1.3,key:'smokeOil',size:20*k,grow:(failing?78:54)*k,alpha:failing?.86:.68});
     // A failing engine coughs flame between the oil.
     if(failing&&Math.floor(state.time*11)%3===0)state.plumes.push({x,y,a:e.a+Math.PI/2,age:0,life:.22,key:'fireSmall',size:17*k,grow:9*k,alpha:.9});}
    if(bd.leak){const [x,y]=localPoint(e,-20*k,0);state.plumes.push({x,y,a:e.a,age:0,life:1.05,key:'vaporTrail',streak:true,w:66*k,h:13*k,alpha:.8});}
    if(bd.wing){const [x,y]=localPoint(e,-3*k,bd.wing*19*k);state.plumes.push({x,y,a:e.a,age:0,life:.8,key:'smokeGray',size:13*k,grow:30*k,alpha:.55});}
   }
  }
  for(const e of this.enemies||[])if(e.crashing){const v=enemyCrashVisual(e),q={x:0,y:0,roll:v.roll,bank:v.bank,active:true};poses.set(e,q);}
  {let w=0;for(const f of state.impacts){f.age+=step;if(f.target.hp>0&&f.age<(f.target.stageBossBody?.14:.085)&&f.effect.life>0){[f.effect.x,f.effect.y]=localPoint(f.target,f.forward,f.side);state.impacts[w++]=f}}state.impacts.length=w}
  {let w=0;for(const f of state.plumes){f.age+=step;if(f.age<f.life)state.plumes[w++]=f}state.plumes.length=w}cap(state.plumes,COMBAT_FEEDBACK_LIMITS.compactPlumes,COMBAT_FEEDBACK_LIMITS.plumes);
  {let w=0;for(const f of state.passes){f.life-=step;if(f.life>0)state.passes[w++]=f}state.passes.length=w}
  {let w=0;for(const f of state.whips){f.age+=step;if(f.age<AIR_WAKE.whipLife)state.whips[w++]=f}state.whips.length=w}
  {let w=0;for(const e of state.ribbonOwners){const r=state.ribbons.get(e);if(!r)continue;while(r.pts.length&&state.time-r.pts[0].t>AIR_WAKE.ribbonLife)r.pts.shift();if(r.pts.length||e.hp>0&&!e.expired&&!e.crashing)state.ribbonOwners[w++]=e;else state.ribbons.delete(e)}state.ribbonOwners.length=w}
  for(const w of state.wrecks){w.age+=step;crashEffects.wreck=w;advanceAircraftCrash(crashEffects,w,step)}
  {let kept=0;for(const w of state.wrecks)if(!w.crashed)state.wrecks[kept++]=w;state.wrecks.length=kept}
  {let kept=0;for(const p of state.trail)if(p.life>0)state.trail[kept++]=p;state.trail.length=kept}
  if(this.state==='playing'&&players.length){
   // Reuse the same pass detector for separately stored elite aircraft.
   const contacts=state.contacts??=[];contacts.length=0;
   for(const e of this.enemies||[])contacts.push(e);
   for(const e of this.eliteEnemies?.members||[])if(!(this.enemies||[]).includes(e))contacts.push(e);
   for(const e of contacts){
    if(e.hp<=0||e.alive===false||e.surface||e.stationary||e.fieldUnit)continue;
    let prior=state.previous.get(e);if(!prior){prior=new WeakMap();state.previous.set(e,prior)}
    for(const p of players){
     const d=Math.hypot(e.x-p.x,e.y-p.y),pass=prior.get(p)||{distance:d,armed:false,passed:false},radial=(d-pass.distance)/step;
     const dx=e.x-p.x,dy=e.y-p.y,headOn=d>0&&(Math.cos(p.a)*dx+Math.sin(p.a)*dy)/d>.86&&(-Math.cos(e.a)*dx-Math.sin(e.a)*dy)/d>.8;
     const relative=pass.dx==null?0:Math.hypot(dx-pass.dx,dy-pass.dy)/step;
     const sx=pass.dx==null?0:dx-pass.dx,sy=pass.dy==null?0:dy-pass.dy,length=sx*sx+sy*sy;
     const u=length?clamp(-(pass.dx*sx+pass.dy*sy)/length):0;
     const swept=length?Math.hypot(pass.dx+sx*u,pass.dy+sy*u):d;
     const crossed=u>0&&u<1&&relative>=180&&swept<110;
     pass.closest=Math.min(pass.closest??d,d,swept);pass.relative=Math.max(pass.relative||0,Math.min(700,relative));
     if(headOn&&d<440&&radial< -25)state.headOnUntil=this.t+.3;
     const heavy=e.heavyBomber||e.type==='bomber'||e.type==='zeppelin';
     if(d>1100)pass.announced=false;
     if(!pass.announced&&radial< -25&&d<(heavy?1000:620)&&(heavy||headOn)&&this.t>=state.nextApproach){pass.announced=true;state.nextApproach=this.t+2.5;play(heavy?'formationPass':'headOn')}
     if(d>180){pass.passed=false;pass.armed=false;pass.closest=d;pass.relative=relative}
     if(!pass.passed&&(d<180&&radial< -30||crossed))pass.armed=true;
     if(pass.armed&&pass.closest<110&&(radial>30||crossed)){pass.armed=false;pass.passed=true;if(this.t>=state.nextPass){state.nextPass=this.t+.7;const rush=clamp((pass.relative-180)/320);state.camera=Math.max(state.camera,.45+rush*.65);state.duckUntil=this.t+.22;state.passes.push({player:p,life:.3,rush});{const qp=poses.get(p),qe=poses.get(e),side=Math.sign(Math.sin(Math.atan2(dy,dx)-p.a))||1;if(qp){qp.rockAt=state.time;qp.rock=.55+rush*.6;qp.rockSide=-side}if(qe){qe.rockAt=state.time;qe.rock=.7+rush*.6;qe.rockSide=side}}play('closePass',{speed:pass.relative});pulse('pass')}}
     pass.distance=d;pass.dx=dx;pass.dy=dy;prior.set(p,pass);
    }
   }
   for(const b of this.bullets||[]){
    if(!b.enemy||b.life<=0||state.whizzed.has(b)||b.flak)continue;
    const ax=b.previousX??b.x-b.vx*step,ay=b.previousY??b.y-b.vy*step,dx=b.x-ax,dy=b.y-ay,length=dx*dx+dy*dy;
    for(const p of players){const u=length?clamp(((p.x-ax)*dx+(p.y-ay)*dy)/length):0,d=Math.hypot(ax+dx*u-p.x,ay+dy*u-p.y);if(d>22&&d<68){state.whizzed.add(b);if(state.time>=state.nextWhip){state.nextWhip=state.time+AIR_WAKE.whipGap;state.whips.push({x:ax+dx*u,y:ay+dy*u,a:Math.atan2(b.vy,b.vx),age:0,near:1-(d-22)/46});cap(state.whips,AIR_WAKE.compactWhips,AIR_WAKE.whips)}if(this.t>=state.nextNear){state.nextNear=this.t+.18;play('whizz')}break}}
   }
  }
  return result;
 };
 return state;
}
export function combatCameraOffset(world){const s=worlds.get(world);const q=s?clamp(1-s.punchAge/.2):0,k=s?s.punch*q*q:0;return s?{x:Math.sin(s.time*83)*s.camera+s.punchX*k,y:Math.cos(s.time*71)*s.camera+s.punchY*k}:{x:0,y:0}}
export function combatFlightSound(world,planes){const players=world.players||[world],p=(world.online&&players.find(p=>p.id===world.localPlayerId&&p.hp>0))||players.find(p=>p.hp>0)||world,s=worlds.get(world),q=poses.get(p);return{plane:playerAirframeModel(p.plane,planes)||p.plane,reload:p.reloadTime>0,speed:q?.flightSpeed??p.airframeSpeed??1,airspeed:q?.airspeed??(p.speed||170)*(p.airframeSpeed??1),acceleration:q?.acceleration||0,turn:Math.abs(q?.turn||0),damage:clamp(1-p.hp/p.maxHp),engineFault:clamp(((p.criticalEngineUntil||0)-(world.t||0))/.65),duck:(s?.duckUntil||0)>(world.t||0)}}
// The existing sparse airflow follows displacement, not the ambient clock.
// No simulation writes, extra particles, or persistent per-frame allocations.
export function drawFlightFlow(c,world,W,H,zoom=1){
 if(!world)return;
 const players=world.players||[world],p=world.online?players.find(p=>p.id===world.localPlayerId&&p.hp>0)||players.find(p=>p.hp>0):players.find(p=>p.hp>0);
 if(!p)return;
 const q=poses.get(p),speed=q?.airspeed??(p.speed||0)*(p.airframeSpeed??1),pace=clamp((speed-105)/165);
 if(pace<=0)return;
 const count=Math.floor(4+8*pace),length=(9+20*pace)*zoom,dx=Math.cos(p.a)*length,dy=Math.sin(p.a)*length;
 c.save();c.strokeStyle='#ecf6de';c.globalAlpha*=.025+.055*pace;c.lineWidth=1;
 for(let i=0;i<count;i++){
  const x=((i*137.3-p.x*.35*zoom)%W+W)%W,y=((i*97.7-p.y*.35*zoom)%H+H)%H;
  c.beginPath();c.moveTo(x,y);c.lineTo(x-dx,y-dy);c.stroke();
 }
 c.restore();
}
function drawWreck(c,w,x,y,time,fx,planeSprite){
 if(w.style==='spin')drawAircraftCrash(c,w,x,y,time,fx);
 else fx(c,'smokeTrail',x-Math.cos(w.a)*56,y-Math.sin(w.a)*56,160,58,w.a,.8);
 const v=enemyCrashVisual(w),ws=w.scale*v.scale;
 if(w.type!=='bomber'){c.save();c.translate(x+v.shadowX,y+v.shadowY);c.rotate(w.a+v.roll);c.scale(1,v.bank);planeSprite(c,0,0,0,w.key,ws,true,true);c.restore();}
 c.save();c.translate(x,y);c.rotate(w.a+v.roll);c.scale(1,v.bank);planeSprite(c,0,0,0,w.key,ws,true,false,0,true);c.restore();if(w.style==='fire')fx(c,'fireEngine',x+Math.cos(w.a)*12,y+Math.sin(w.a)*12,58,66,w.a+Math.PI/2,.9);
}
// 20261111 firelight. Things that burn or flash now throw warm light on what is around them:
// explosions, burning aircraft and wrecks, gun muzzles. One baked warm falloff sprite, drawn
// additively and strictly budgeted; it lights the picture, it changes nothing in the fight.
export const FIRELIGHT=Object.freeze({lights:22,compactLights:6,blast:.46,burn:.26,muzzle:.3,enemyMuzzle:.22});
let LIGHT=null;
function lightSprite(){
 if(LIGHT||typeof document==='undefined')return LIGHT;
 const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext?.('2d');if(!g)return null;
 const r=g.createRadialGradient(64,64,0,64,64,64);
 r.addColorStop(0,'rgba(255,216,160,.7)');r.addColorStop(.18,'rgba(255,184,108,.46)');r.addColorStop(.45,'rgba(255,140,66,.2)');r.addColorStop(.75,'rgba(255,112,48,.06)');r.addColorStop(1,'rgba(255,100,40,0)');
 g.fillStyle=r;g.fillRect(0,0,128,128);return LIGHT=cv;
}
function drawFirelight(c,world,s,point,visible){
 const sprite=lightSprite();if(!sprite)return;
 const max=world.viewWidth<=720?FIRELIGHT.compactLights:FIRELIGHT.lights,a0=c.globalAlpha,op=c.globalCompositeOperation;let n=0;
 const lamp=(wx,wy,r,alpha)=>{if(n>=max||!(alpha>.02)||!visible(wx,wy))return;const [x,y]=point(wx,wy);c.globalAlpha=Math.min(1,alpha);c.drawImage(sprite,x-r,y-r,r*2,r*2);n++};
 c.globalCompositeOperation='lighter';
 for(const f of world.combatFX||[]){if(!(f.maxLife>0)||f.side==='smoke')continue;const k=clamp(f.life/f.maxLife);lamp(f.x,f.y,(f.radius||30)*2.2+40,k*k*FIRELIGHT.blast)}
 const flicker=.86+.14*Math.sin(s.time*31);
 for(const e of world.enemies||[])if(e.hp>0&&e.burnTime>0)lamp(e.x,e.y,(e.surface?150:104),FIRELIGHT.burn*flicker);
 for(const w of s.wrecks)if(w.style==='fire'&&!w.crashed)lamp(w.x,w.y,96,FIRELIGHT.burn*flicker);
 // Gun muzzles fire almost every frame: on a phone-sized view they are left unlit.
 if(world.viewWidth>720)for(const p of world.players||[world])if(p.hp>0&&p.muzzleFlash>0){const [x,y]=localPoint(p,30,0);lamp(x,y,70,clamp(p.muzzleFlash/.055)*FIRELIGHT.muzzle)}
 if(world.viewWidth>720)for(const e of world.enemies||[])if(e.hp>0&&e.muzzleFlash>0&&!e.surface){const [x,y]=localPoint(e,24,0);lamp(x,y,54,clamp(e.muzzleFlash/.09)*FIRELIGHT.enemyMuzzle)}
 c.globalAlpha=a0;c.globalCompositeOperation=op;
}
// Read-only counters for tests and capture tooling.
export function airWakeCounts(world){const s=worlds.get(world);if(!s)return null;let points=0;for(const e of s.ribbonOwners)points+=s.ribbons.get(e)?.pts.length||0;return{ribbonAircraft:s.ribbonOwners.length,ribbonPoints:points,whips:s.whips.length}}
export function drawCombatFeedback(c,world,point,{fx,planeSprite,bolt=drawTracerBolt}){
 const s=worlds.get(world);if(!s)return;
 const visible=(x,y)=>Math.abs(x-world.x)<(world.viewWidth||960)+160&&Math.abs(y-world.y)<(world.viewHeight||700)+160;
 for(const f of s.plumes){if(!visible(f.x,f.y))continue;const [x,y]=point(f.x,f.y),k=f.age/f.life,size=16+k*(f.heavy?38:24);if(f.key){if(f.streak)fx(c,f.key,x,y,f.w*(1+k*.7),f.h*(1+k*.5),f.a,(1-k)*f.alpha);else{const r=f.size+k*f.grow;fx(c,f.key,x,y,r,r,f.a,(1-k)*f.alpha)}continue}fx(c,f.heavy?'smokeDark':'engineSmoke',x,y,size,size,f.a,(1-k)*(f.heavy?.55:.35))}
 let fuelCount=0;for(const e of world.enemies||[])if(e.hp>0&&e.burnTime>0&&!e.gontermannBurn&&!e.burnAnchorSpace&&visible(e.x,e.y)&&fuelCount<(world.viewWidth<=720?6:10)){const origin=e.criticalFuelOrigin;const [x,y]=origin?point(...localPoint(e,origin.forward,origin.side)):point(e.x,e.y);drawFuelFire(c,fx,x,y,e.fuelFxAge||0,e.surface?58:38,e.surface?0:e.a+Math.PI/2,e.burnTime);fuelCount++}
 // Wingtip condensation ribbons (was: one fixed sprite glued to the player's wingtips).
 {const small=world.viewWidth<=720,budget=small?AIR_WAKE.compactRibbonDraws:AIR_WAKE.ribbonDraws,limit=small?AIR_WAKE.compactRibbonAircraft:AIR_WAKE.ribbonAircraft;let draws=0,craft=0;
  for(let n=s.ribbonOwners.length-1;n>=0&&draws<budget&&craft<limit;n--){const owner=s.ribbonOwners[n],r=s.ribbons.get(owner);if(!r||r.pts.length<2)continue;craft++;
   let [alx,aly]=point(r.pts[0].lx,r.pts[0].ly),[arx,ary]=point(r.pts[0].rx,r.pts[0].ry);
   for(let i=1;i<r.pts.length;i++){const p=r.pts[i],[blx,bly]=point(p.lx,p.ly),[brx,bry]=point(p.rx,p.ry);
    if(!p.fresh){const age=clamp((s.time-p.t)/AIR_WAKE.ribbonLife),alpha=(.35+p.k*.65)*(1-age)*(1-age)*.8;
     if(alpha>.02){const width=(20+age*26)*(p.bite?FLIGHT_CHARACTER.biteWidth:1);
      fx(c,'vaporTrail',(alx+blx)/2,(aly+bly)/2,Math.hypot(blx-alx,bly-aly)+16,width,Math.atan2(bly-aly,blx-alx),alpha);
      fx(c,'vaporTrail',(arx+brx)/2,(ary+bry)/2,Math.hypot(brx-arx,bry-ary)+16,width,Math.atan2(bry-ary,brx-arx),alpha);draws+=2}}
    alx=blx;aly=bly;arx=brx;ary=bry;}
   // Keep the newest vapour attached to the wing while it is still being shed.
   if(r.open&&owner.hp>0){const last=r.pts[r.pts.length-1],half=Math.hypot(last.rx-last.lx,last.ry-last.ly)/2,alpha=(.35+last.k*.65)*.8;
    for(const side of [-1,1]){const [tx,ty]=point(...localPoint(owner,-5,side*half)),fx0=side<0?alx:arx,fy0=side<0?aly:ary,len=Math.hypot(tx-fx0,ty-fy0);
     if(len>1&&len<60){fx(c,'vaporTrail',(fx0+tx)/2,(fy0+ty)/2,len+16,20,Math.atan2(ty-fy0,tx-fx0),alpha);draws++}}}
  }}
 // Tracer smoke: each of the player's rounds drags a thin thread from where it has flown.
 s.aimSteady=(world.players||[world]).some(p=>p.hp>0&&p.aircraftAimUntil>(world.t||0));
 {const max=world.viewWidth<=720?AIR_WAKE.compactThreads:AIR_WAKE.threads;let n=0;
  // Hostile machine-gun rounds drag the same thread (their own smaller budget), so a burst
  // reads as a line coming at you rather than a few dim dashes.
  const hostileMax=Math.ceil(max*.7);let hostile=0;
  for(const b of world.bullets||[]){if(b.life<=0||b.rocket||b.cow37||b.motorCannon||b.flak||b.bomb||b.actualExplosion||b.cigognesCannon||!visible(b.x,b.y))continue;
   if(b.enemy?hostile>=hostileMax||b.visualType!=='scout'&&b.visualType!=='hunter'&&b.visualType!=='boss':n>=max)continue;
   const speed=Math.hypot(b.vx,b.vy);if(speed<200)continue;let born=s.threadBorn.get(b);if(born==null)s.threadBorn.set(b,born=s.time);
   const steady=!b.enemy&&s.aimSteady;
   const reach=Math.min((b.enemy?AIR_WAKE.hostileThreadReach:AIR_WAKE.threadReach)*(steady?FLIGHT_CHARACTER.aimReach:1),(s.time-born)*speed);if(reach<AIR_WAKE.threadMin)continue;
   const a=Math.atan2(b.vy,b.vx),[x,y]=point(b.x-Math.cos(a)*(reach*.5+8),b.y-Math.sin(a)*(reach*.5+8));
   fx(c,'vaporTrail',x,y,reach,b.enemy?17:15,a+Math.PI,b.enemy?.3:steady?.34:.24);if(b.enemy)hostile++;else n++;if(n>=max&&hostile>=hostileMax)break;}}
 // Air torn by a round that only just missed.
 for(const f of s.whips){if(!visible(f.x,f.y))continue;const k=f.age/AIR_WAKE.whipLife,ca=Math.cos(f.a),sa=Math.sin(f.a),[x,y]=point(f.x-ca*(18+k*30),f.y-sa*(18+k*30));
  fx(c,'vaporTrail',x,y,104+k*46,22+k*20,f.a+Math.PI,(1-k)*(1-k)*(.5+f.near*.4));
  if(k<.45){const [hx,hy]=point(f.x+ca*k*60,f.y+sa*k*60);bolt(c,hx,hy,f.a,'#f6c99a',34,4.5,(1-k/.45)*(.35+f.near*.4));}}
 for(const f of s.passes)for(const side of [-1,1]){const [x,y]=point(...localPoint(f.player,-15,side*56));fx(c,'windStreak',x,y,135,22,f.player.a,f.life/.3*(.22+(f.rush??1)*.28))}
 if(s.headOnUntil>s.time){let count=0;const players=world.players||[world];for(const b of world.bullets||[]){
  if(b.life<=0||b.flak||b.rocket||b.cow37||b.motorCannon||!players.some(p=>p.hp>0&&Math.hypot(b.x-p.x,b.y-p.y)<330))continue;
  const [x,y]=point(b.x,b.y),a=Math.atan2(b.vy,b.vx);bolt(c,x,y,a,b.enemy?'#f0965a':'#f2d9a0',clamp(Math.hypot(b.vx,b.vy)*.035,18,42),6,.85);
  if(++count>=(world.viewWidth<=720?12:20))break;
 }}
 for(const w of s.wrecks){if(!visible(w.x,w.y))continue;const [x,y]=point(w.x,w.y);drawWreck(c,w,x,y,s.time,fx,planeSprite)}
 // Contact anchors move the existing combatFX entries; drawing them again here
 // would double the impact budget and obscure the aircraft.
 // Energy recovery made visible: wind streaks pour back along the fuselage while speed returns.
 for(const p of world.players||[world]){const q=poses.get(p),k=q?.surge||0;if(!(p.hp>0)||k<.05)continue;
  for(const side of [-1,1]){const [x,y]=point(...localPoint(p,-26,side*19));fx(c,'windStreak',x,y,96+k*52,21,p.a,k*FLIGHT_CHARACTER.surgeAlpha)}}

 drawFirelight(c,world,s,point,visible);
}


