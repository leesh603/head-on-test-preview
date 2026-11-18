import {hasSecretWeapon,secretWeaponEffect} from './secret-weapons.js';
import {hasAceWingProfile,tickAceWingPilot,aceWingDefensiveSkill,aceWingFireProfile,aceWingRearShot} from './ace-wingman-pilots.js';
import {isWWIFlyingTarget} from './wwi-equipment.js';
import {fighterAim} from './dogfight-pass165.js?v=gal1&airbattle=20261108&strafe=20261111';
import {equipmentTargets,wimperisTarget} from './flight-equipment.js';

import {tickSecretOrdnance,fireSecretDavis,secretOrdnanceContact,secretOrdnanceAllowsTarget,secretPuwImpact,clearSecretOrdnanceTransient} from './secret-ordnance.js';
import {salamanderArmorContact,tickSiemensFeedback,clearSecretFlightTransient} from './secret-flight-fits.js';

const ownerId=p=>p.id||'p1';
const worldOf=p=>p.combatWorld?.()||p.world||p;
const live=e=>e&&e.hp>0&&!e.crashing&&!e.expired&&!e.dead;
const ownerLive=p=>live(p)&&p.status!=='downed'&&p.state!=='lost';
const time=p=>worldOf(p).t||0;
const activeWing=w=>w.permanent&&!w.aceWingman&&w.life>0&&!w.carrierHidden;
const ELITE_WING_DAMAGE=1.5,ELITE_WING_CADENCE=1.25;
const hitTimers=new WeakMap();
const wakes=new WeakMap();
const dartCharges=new WeakMap();
const dartSalvos=new WeakMap();
const dartBursts=new WeakMap();
const clip=(n,a,b)=>Math.min(b,Math.max(a,n));
export const POM_AIRBURST=Object.freeze({fuse:.82,radius:103,splash:.38});
export const SECRET_COMBAT=Object.freeze({cooperDamage:70,cooperRadius:66,signalDelay:2.65,chainInterval:3.2,wakeDelay:.40,wakeLife:.85,ramDelay:.8,armorDelay:15,bomberInterval:10});

function cue(p,kind,origin=p,extra={}){
 const g=worldOf(p),items=g.secretWeaponFx??=[];
 const now=g.t||0;
 const index=items.findIndex(item=>now-item.at>=(item.life||.45));
 const entry={kind,x:origin.x,y:origin.y,a:origin.a??p.a,ownerId:ownerId(p),at:now,...extra};
 if(index>=0)items[index]=entry;
 else if(items.length<72)items.push(entry);
 else if(entry.life>=.7){
  const replace=items.findIndex(item=>(item.life||.45)<.7);
  if(replace>=0)items[replace]=entry;
 }
 return entry;
}
function sound(p,kind){p.event?.('bossSound',kind);}
function emit(p,round){
 const b={...round,enemy:false,ownerId:ownerId(p),hit:new Set()};
 (worldOf(p).bullets??=[]).push(b);return b;
}
const ordnanceEffects={cue,sound,emit};
export function tryFireSecretDavis(p,damage){return fireSecretDavis(p,damage,ordnanceEffects);}
const mgDamage=p=>(p.damage||1)*(p.normalGunMultiplier?.()||1)/Math.sqrt(Math.max(1,p.shots||1));
const airTarget=e=>e.combatLayer?e.combatLayer==='air':!(e.surface||e.navalVessel||e.missionGround||e.fieldUnit||e.stationary);
const aceTarget=e=>e.ace||e.bossPilot||e.type==='boss';
const newAirRound=(id,x,y,a,speed,life,damage,radius)=>({
 x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life,damage,collisionRadius:radius,
 secretWeapon:id,secretAirRound:true,rangeExtended:true,sweptProjectile:true,heavyRoundPrepared:true,synthesisChild:true
});
export function secretRoundAllowsTarget(b,e){
 if(!secretOrdnanceAllowsTarget(b,e))return false;
 if(!b?.secretAirRound)return true;
 const charge=dartBursts.get(b);
 const body=e.stageBossBody||e;
 return airTarget(e)&&(!charge||charge.body===body||!charge.salvo.splashed.has(body));
}
export const secretRankenHullContact=(b,e)=>!e.stageBossBody&&dartBursts.get(b)?.target===e;
export function secretRankenDamageScale(b,e){
 const charge=dartBursts.get(b);
 return charge&&charge.body!==(e.stageBossBody||e) ? .28 : 1;
}

export const VILLAR_RANGE=138;
function tickVillar(p,dt){
 const s=secretWeaponEffect(p,'villarPerosa');
 s.delay=Math.max(0,(s.delay||0)-dt);
 if(s.delay>0)return;
 const g=worldOf(p);
 let target=null,best=Infinity;
 for(const e of equipmentTargets(g)){
  if(!airTarget(e)||e.stageBossBody||p.canHitTarget?.(e)===false)continue;
  const d=Math.hypot(e.x-p.x,e.y-p.y);
  if(d>VILLAR_RANGE)continue;
  const score=d-(aceTarget(e)?400:e.eliteKind?200:0);
  if(score<best){best=score;target=e;}
 }
 const point=target||wimperisTarget(p,{range:VILLAR_RANGE,cone:Math.PI,filter:e=>airTarget(e)&&!!e.stageBossBody});
 if(!point){s.remaining=0;return;}
 const gloves=p.upgrades.flightGloves&&p.bishopGlovesTime>0&&!(p.invuln>0);
 if(!s.remaining){
  s.remaining=6;
  sound(p,'secretVillar');
 }
 const a=Math.atan2(point.y-p.y,point.x-p.x),side=s.remaining%2?6:-6;
 const x=p.x+Math.cos(a)*18-Math.sin(a)*side,y=p.y+Math.sin(a)*18+Math.cos(a)*side;
 const speed=650,heading=Math.atan2(point.y-y,point.x-x);
 const damage=mgDamage(p)*.72*(aceTarget(target||point.entity)?1.4:1);
 emit(p,newAirRound('villarPerosa',x,y,heading,speed,(VILLAR_RANGE+10)/speed,damage,2));
 cue(p,'villarShot',{x,y,a:heading},{life:.13,slot:side});
 s.remaining--;
 s.delay=s.remaining?(gloves?.043:.062):(gloves?.47:.73);
}

export const KETTERING_DIVE=.54;
const KETTERING_RADIUS=96;
export function secretKetteringLaunch(p){
 if(!hasSecretWeapon(p,'ketteringBug')||!ownerLive(p))return;
 const now=time(p),s=secretWeaponEffect(p,'ketteringBug');
 if(s.readyAt>now)return;
 const aim={range:620,cone:Math.PI,time:.65};
 const point=wimperisTarget(p,{...aim,filter:e=>!airTarget(e)})||wimperisTarget(p,aim);
 if(!point)return;
 // Give the pilotless craft its own approach lane beside the manned formation.
 const g=worldOf(p),a=Math.atan2(point.y-p.y,point.x-p.x)+Math.PI*.29,dx=Math.cos(a),dy=Math.sin(a);
 const camera=(g.players&&g.camera)||p,zoom=g.camera?.zoom||1;
 const reach=Math.hypot(g.viewWidth||1000,g.viewHeight||760)/(2*zoom)+Math.hypot(point.x-camera.x,point.y-camera.y)+70;
 const duration=reach/620+KETTERING_DIVE;
 const b={
  x:point.x-dx*reach,y:point.y-dy*reach,sx:point.x-dx*reach,sy:point.y-dy*reach,
  bugTargetX:point.x,bugTargetY:point.y,a,releaseAngle:a,life:duration,maxLife:duration,
  damage:p.payloadPower(480),ownerId:ownerId(p),secretWeapon:'ketteringBug',synthesisBombPrepared:true,
  bugAirApproach:airTarget(point.entity),bugEngineAt:now
 };
 (g.friendlyBombs??=[]).push(b);
 s.readyAt=now+15;s.activeUntil=now+duration;
}
export function tickSecretKettering(world,p,b,dt){
 if(b.life<=0)return;
 const previous=b.life;
 b.life=Math.max(0,b.life-dt);
 const dive=clip(1-b.life/KETTERING_DIVE,0,1),travel=b.life>KETTERING_DIVE
  ? .87*(b.maxLife-b.life)/(b.maxLife-KETTERING_DIVE):.87+.13*dive*dive;
 b.x=b.sx+(b.bugTargetX-b.sx)*travel;b.y=b.sy+(b.bugTargetY-b.sy)*travel;
 if(previous>KETTERING_DIVE&&b.life<=KETTERING_DIVE&&p){
  // Snapshot the release point at the exact flight phase, even on a long frame.
  const x=b.sx+(b.bugTargetX-b.sx)*.87,y=b.sy+(b.bugTargetY-b.sy)*.87;
  cue(p,'bugWingShed',{x,y,a:b.a},{life:1.52});
  b.bugWingsShed=true;sound(p,'secretBugCut');
 }
 if(!p){b.life=0;return;}
 if(b.life>KETTERING_DIVE+.32&&time(p)>=b.bugEngineAt&&Math.hypot(b.x-p.x,b.y-p.y)<580){
  b.bugEngineAt=time(p)+.36;
  sound(p,'secretBugEngine');
 }
 // Only the descending body can collide with aircraft. The course was set
 // before takeoff and the target may have left the blast radius by impact.
 let contact=false;
 if(b.bugAirApproach&&dive>.76){
  const fromDive=clip(1-previous/KETTERING_DIVE,.76,1),from=.87+.13*fromDive*fromDive;
  const probe={x:b.x,y:b.y,previousX:b.sx+(b.bugTargetX-b.sx)*from,
   previousY:b.sy+(b.bugTargetY-b.sy)*from,collisionRadius:5,sweptProjectile:true};
  contact=equipmentTargets(world).some(e=>airTarget(e)&&p.canHitTarget?.(e,probe)!==false&&world.targetCollision?.(e,b.x,b.y,probe));
 }
 if(b.life>0&&!contact)return;
 b.life=0;
 const radius=p.queueExplosionDamage(b.x,b.y,KETTERING_RADIUS,b.damage,{
  secondaryExplosion:true,presentation:false,bomberSalvo:{bossDamage:new Map(),bossCap:b.damage},pilotSupport:true
 });
 cue(p,'bugImpact',b,{radius,life:1.65,water:[1,7,16,17].includes(world.worldRegion?.())&&!b.bugAirApproach});
 sound(p,'secretBugImpact');
}

const RANKEN_ID='rankenExplosiveDarts';
const RANKEN_SPEED=640,RANKEN_LIFE=.46,RANKEN_SPREAD=.085,RANKEN_BLAST_RADIUS=48;
export function secretRankenPulse(p){
 if(!hasSecretWeapon(p,RANKEN_ID)||!ownerLive(p))return;
 const rear=p.a+Math.PI;
 const x=p.x+Math.cos(rear)*16,y=p.y+Math.sin(rear)*16;
 const target=wimperisTarget(p,{x,y,heading:rear,range:240,cone:1.05,speed:RANKEN_SPEED,filter:airTarget});
 if(!target||target.time>RANKEN_LIFE)return;
 const center=Math.atan2(target.y-y,target.x-x),damage=mgDamage(p);
 const burnScale=p.upgrades.buckinghamBelt?1+Math.max(0,p.gunUpgradeBonus||0):0;
 const salvo={bossDamage:new Map(),bossCap:damage*7,splashed:new Set(),burnScale};
 for(let i=0;i<5;i++){
  const b=newAirRound(RANKEN_ID,x,y,center+(i-2)*RANKEN_SPREAD,RANKEN_SPEED,RANKEN_LIFE,damage*.48,4.5);
  b.dartSlot=i;dartSalvos.set(emit(p,b),salvo);
 }
 cue(p,'rankenLaunch',{x,y,a:center},{life:.48,spread:RANKEN_SPREAD});
 sound(p,'secretRankenLaunch');
}
function attachRanken(p,b,target){
 const world=worldOf(p),body=target.stageBossBody||target,heading=body.hullYaw??body.angle??body.a??0;
 const angle=Math.atan2(b.vy,b.vx),x=b.x,y=b.y,dx=x-body.x,dy=y-body.y;
 const at=time(p)+.22+.08*b.dartSlot,charges=dartCharges.get(p)||[];
 const salvo=dartSalvos.get(b);
 if(!ownerLive(p)||!salvo||charges.length>=10)return;
 const fx=cue(p,'rankenEmbed',{x,y,a:angle},{life:at-time(p),slot:b.dartSlot});
 charges.push({target,body,at,fx,a:angle-heading,u:dx*Math.cos(heading)+dy*Math.sin(heading),
  v:-dx*Math.sin(heading)+dy*Math.cos(heading),damage:b.damage*4.1,salvo});
 dartCharges.set(p,charges);
 const state=secretWeaponEffect(p,RANKEN_ID);
 if(!(state.pingAt>world.t)){
  state.pingAt=world.t+.09;
  sound(p,'secretRankenCatch');
 }
}
function tickRankenCharges(p){
 const charges=dartCharges.get(p);
 if(!charges?.length)return;
 const g=worldOf(p),now=time(p);
 for(let i=charges.length-1;i>=0;i--){
  const q=charges[i],{body,fx}=q;
  if(!q.target.expired&&Number.isFinite(body.x)&&Number.isFinite(body.y)){
   const a=body.hullYaw??body.angle??body.a??0;
   fx.x=body.x+Math.cos(a)*q.u-Math.sin(a)*q.v;fx.y=body.y+Math.sin(a)*q.u+Math.cos(a)*q.v;fx.a=a+q.a;
  }
  if(now<q.at)continue;
  charges.splice(i,1);
  const radius=p.queueExplosionDamage(fx.x,fx.y,RANKEN_BLAST_RADIUS,q.damage,{secondaryExplosion:true,presentation:false,bomberSalvo:q.salvo});
  const blast=g.bullets.at(-1);
  blast.secretAirRound=true;
  blast.secretWeapon='rankenBurst';
  dartBursts.set(blast,q);
  if(q.salvo.burnScale)blast.synthesisPayload={incendiary:true,burnScale:q.salvo.burnScale};
  cue(p,'rankenBurst',fx,{life:.88,radius,slot:fx.slot});sound(p,'secretRankenBurst');
 }
}
function sameTargetReady(p,e,key,delay){
 let map=hitTimers.get(p);if(!map){map=new WeakMap();hitTimers.set(p,map);}
 let state=map.get(e);if(!state){state={};map.set(e,state);}
 const now=time(p);if((state[key]??-Infinity)>now)return false;
 state[key]=now+delay;return true;
}
function direct(p,e,damage,id,point=e){
 emit(p,{x:point.x,y:point.y,vx:0,vy:0,life:.12,blast:true,pierce:true,damage,secretWeapon:id,identityDotTarget:e.stageBossBody?undefined:e});
}

export function secretCannonInterval(p){return hasSecretWeapon(p,'vickersPomPom') ? .35 : 1;}
export function secretCannonShot(p,heading){
 if(!hasSecretWeapon(p,'vickersPomPom'))return false;
 const front=p.bomberTransfer?.front??38;
 cue(p,'pom',{x:p.x+Math.cos(heading)*front,y:p.y+Math.sin(heading)*front,a:heading});
 p.cannonRecoil129=.16;p.cannonKick129=5.2;
 sound(p,'secretPom');return true;
}
export function secretCannonImpact(p,b,target){
 if(b.secretWeapon!=='vickersPomPom'||b.cannonDetonated)return false;
 b.cannonDetonated=true;b.pierce=false;b.life=0;
 const damage=b.damage*POM_AIRBURST.splash;
 const bomberSalvo={bossDamage:new Map(),bossCap:damage};
 const radius=p.queueExplosionDamage(b.x,b.y,POM_AIRBURST.radius,damage,{exclude:target,bomberSalvo,fxSource:'secretPomAirburst',pilotSupport:!!(b.synthesisSupport||b.pilotSupport),presentation:false});
 const blast=worldOf(p).bullets.at(-1);
 if(b.synthesisPayload?.incendiary)blast.synthesisPayload={incendiary:true,burnScale:b.synthesisPayload.burnScale??1};
 if(b.synthesisSupport){blast.synthesisSupport=true;blast.ally=true;}
 blast.secretWeapon='vickersPomFragment';
 cue(p,'pomImpact',b,{a:Math.atan2(b.vy,b.vx),radius,life:.88,contact:!!target});
 sound(p,'secretPomBurst');return true;
}
export const secretRotaryMountSide=p=>p.cow37?-8:0;
export function secretRotaryRound(p,round){
 const state=secretWeaponEffect(p,'fokkerLeimberger'),now=time(p),a=p.gunDirection?.(round.gun??0)??p.a;
 const slot=(state.rounds=(state.rounds||0)+1)%12,phase=slot*Math.PI/6,dx=Math.cos(a),dy=Math.sin(a),speed=Math.hypot(round.vx,round.vy),h=a+Math.sin(phase)*.046;
 const side=secretRotaryMountSide(p),lane=side+Math.sin(phase)*4;
 if(!state.spinning){state.spinning=true;state.soundAt=now;state.caseAt=now;sound(p,'secretRotaryStart');}
 state.lastShotAt=now;state.shotHeading=a;
 if((state.soundAt??-Infinity)<=now){state.soundAt=now+.14;sound(p,'secretRotary');}
 if((state.caseAt??-Infinity)<=now){
  state.caseAt=now+1/12;
  cue(p,'rotary',{x:p.x-dy*side,y:p.y+dx*side,a},{phase,life:.46,barrel:slot});
 }
 return {...round,x:p.x+dx*29-dy*lane,y:p.y+dy*29+dx*lane,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed,hit:new Set(),secretWeapon:'fokkerLeimberger',secretBarrelIndex:slot,secretShotX:p.x+dx*29-dy*lane,secretShotY:p.y+dy*29+dx*lane};
}
export function tickSecretRotary(p,dt,input,fire){
 if(!p.cow37||!hasSecretWeapon(p,'fokkerLeimberger')||!ownerLive(p))return;
 const s=secretWeaponEffect(p,'fokkerLeimberger'),base=p.equipmentLedger?.baseline?.weapon||{belt:24,reload:2.4},belt=Math.round(base.belt*(p.upgrades.maximBelt?1.75:1));
 const reload=Math.max(.45,base.reload*(p.equipmentReloadMultiplier?.()||1));
 s.belt=belt;s.reload=reload;s.ammo=Math.min(s.ammo??belt,belt);
 if(s.reloading>0){s.reloading=Math.max(0,s.reloading-dt);if(!s.reloading)s.ammo=belt;return;}
 if(input?.inputMode==='gamepad'&&!input.fireHeld||p.bishopTime>0||p.isBomberEntering?.()||p.pilotPrimaryAutomaticBlocked?.())return;
 s.fire=(s.fire??0)-dt;
 if(s.fire>0)return;
 s.fire+=Math.max(.045,p.rate||.15);
 for(let i=0;i<Math.min(4,s.ammo);i++){
  const heading=p.a+(i-1.5)*.028,round={gun:0,vx:Math.cos(heading)*520,vy:Math.sin(heading)*520,life:p.shotLifetime?.(520)||1.35,damage:mgDamage(p),secretIndependentGun:true};
  fire(secretRotaryRound(p,round));
 }
 const spent=Math.min(4,s.ammo);s.ammo-=spent;p.roundsFired+=spent;
 if(s.ammo<=0)s.reloading=reload;
}

export function secretVerySignal(p,point,prepare){
 if(!point||!hasSecretWeapon(p,'sn1650'))return;
 const state=secretWeaponEffect(p,'sn1650');
 state.count=(state.count||0)+1;
 if(state.count<3)return;
 state.count=0;
 const {x,y}=point,g=worldOf(p),duration=SECRET_COMBAT.signalDelay,dx=Math.cos(p.a),dy=Math.sin(p.a);
 const b=prepare(p,{x,y,sx:x-dx*520,sy:y-dy*520,life:duration,maxLife:duration,radius:SECRET_COMBAT.cooperRadius*3,damage:(p.payloadPower?.(SECRET_COMBAT.cooperDamage)??SECRET_COMBAT.cooperDamage)*20,sprite:'sn1650',secretWeapon:'sn1650',releaseAngle:p.a,pilotSupport:true});
 (g.friendlyBombs??=[]).push(b);state.activeUntil=time(p)+duration;
 sound(p,'secretHeavyApproach');
}
export function secretBombImpact(p,b){
 if(b.secretWeapon==='sn1650'){
  const water=[1,7,16,17].includes(worldOf(p).worldRegion?.());
  cue(p,'heavyImpact',b,{radius:p.explosionRadius?.(b.radius)??b.radius,life:3.6,water});sound(p,'secretHeavyImpact');
  const g=worldOf(p);g.shake=Math.max(g.shake||0,6);
 }else if(b.secretWeapon==='explosiveArmor'){
  cue(p,'armorImpact',b,{a:b.releaseAngle,slot:b.secretArmorSlot,life:.7});sound(p,'secretArmorImpact');
 }else if(b.secretWeapon==='puw50'){
  secretPuwImpact(p,b,ordnanceEffects);
 }else if(b.secretWeapon==='longRangeBombers'){
  cue(p,'bomberImpact',b,{a:b.releaseAngle,slot:b.secretBomberSlot,life:2.3,impactLayer:b.secretImpactLayer});sound(p,'secretBomberImpact');
 }
}
export function secretCooperRelease(p,b){
 if(!hasSecretWeapon(p,'fliegerpfeil'))return;
 const state=secretWeaponEffect(p,'fliegerpfeil');
 state.count=(state.count||0)+1;
 if(state.count<3)return;
 state.count=0;b.secretSteelRain=true;
}
export function secretSteelRainImpact(p,b,f){
 if(!b.secretSteelRain)return false;
 delete b.secretSteelRain;
 if(!hasSecretWeapon(p,'fliegerpfeil'))return false;
 const state=secretWeaponEffect(p,'fliegerpfeil'),now=time(p),heading=b.releaseAngle??p.a??0;
 const group={attempts:new Set(),explosions:3,explodedTargets:new Set()};
 const gun=1+Math.max(0,p.gunUpgradeBonus||0),u=p.upgrades;
 for(let i=0;i<24;i++){
  const band=i%3,angle=heading+i*Math.PI/12,speed=360+band*80,dx=Math.cos(angle),dy=Math.sin(angle);
  const x=b.x+dx*(14+band*6),y=b.y+dy*(14+band*6);
  emit(p,{x,y,previousX:x,previousY:y,vx:dx*speed,vy:dy*speed,life:.36,damage:(f.minDamage+(f.maxDamage-f.minDamage)*band/2)*gun,pierce:true,flechette:true,sweptProjectile:true,collisionRadius:f.collisionRadius,heavyTargetMultiplier:f.heavyMultiplier,synthesisPayloadDart:true,synthesisGroup:group,synthesisPayload:{incendiary:!!u.buckinghamBelt,explosive:!!u.amatolCharge,burnScale:gun},secretWeapon:'fliegerpfeil'});
 }
 state.activeUntil=now+.48;
 cue(p,'steelRain',b,{a:heading,life:.48});sound(p,'secretSteelRain');
 return true;
}
export function secretGasProfile(p,b,radius,life){
 if(!b.synthesisPayload?.gas||!hasSecretWeapon(p,'grunkreuzBarrage'))return {radius,life,enhanced:false};
 const size=radius*Math.sqrt(1.5),duration=Math.max(5,life),state=secretWeaponEffect(p,'grunkreuzBarrage');
 state.activeUntil=time(p)+duration;state.duration=duration;
 cue(p,'gasBarrage',b,{a:b.releaseAngle??p.a,radius:size,life:duration});sound(p,'secretGas');
 return {radius:size,life:duration,enhanced:true};
}
export function secretGrapnelContact(p,target,round,targets,point){
 if(round.secretWeapon||!hasSecretWeapon(p,'farnboroughFirechain'))return;
 const state=secretWeaponEffect(p,'farnboroughFirechain'),now=time(p);if(state.readyAt>now)return;
 const nearby=targets.filter(e=>e!==target&&live(e)&&p.canHitTarget?.(e)!==false&&Math.hypot(e.x-point.x,e.y-point.y)<=240).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,2);
 if(!nearby.length)return;
 state.readyAt=now+SECRET_COMBAT.chainInterval;state.activeUntil=now+1.4;
 for(const e of nearby){
  const speed=980,lead=Math.hypot(e.x-point.x,e.y-point.y)/speed;
  const x=e.x+Math.cos(e.a||0)*(e.speed||0)*lead,y=e.y+Math.sin(e.a||0)*(e.speed||0)*lead;
  const a=Math.atan2(y-point.y,x-point.x),wwiTargetId=e.tailId??p.tailIdFor?.(e);
  emit(p,{x:point.x,y:point.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.22,damage:round.damage*3,collisionRadius:8,sweptProjectile:true,fieryGrapnel:true,wwiTargetId,secretWeapon:'farnboroughFirechain',secretChainOrigin:{x:point.x,y:point.y,id:target.id??target.tailId,offsetX:point.x-target.x,offsetY:point.y-target.y,bodyAngle:target.a||0}});
 }
 sound(p,'secretChain');
}
export function secretWeaponContact(p,b,target){
 if(secretOrdnanceContact(p,b,target,ordnanceEffects))return;
 const id=b.secretWingRound?'eliteAirWing':b.secretWeapon;
 if(id==='villarPerosa'){
  if(sameTargetReady(p,target,id,.055)){
   cue(p,'villarHit',b,{a:Math.atan2(b.vy,b.vx),life:.23});
   const s=p.secretWeaponState?.effects[id],now=time(p);
   if(s&&!(s.hitSoundAt>now)){s.hitSoundAt=now+.13;sound(p,'secretVillarHit');}
  }
  return;
 }
 if(id===RANKEN_ID){
  if(!b.rankenAttached){b.rankenAttached=true;attachRanken(p,b,target);}
  return;
 }
 if(id==='rankenBurst'){
  const charge=dartBursts.get(b);
  const body=target.stageBossBody||target;
  if(charge&&charge.body!==body)charge.salvo.splashed.add(body);
  return;
 }
 if(id==='nesterovRam'&&!target.stageBossBody&&!target.surface&&!target.stationary){
  if(target.hp<=0){target.lethalCritical='wing';target.lethalCriticalSide=Math.sin((target.a||0)-p.a)<0?-1:1;}
  return;
 }
 if(!['fokkerLeimberger','vickersPomFragment','fliegerpfeil','farnboroughFirechain','grunkreuzBarrage','eliteAirWing'].includes(id))return;
 if(!sameTargetReady(p,target,id,id==='fokkerLeimberger'?.07:.14))return;
 const point={x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx)},targetId=target.id??target.tailId;
 if(id==='farnboroughFirechain'){
  const origin=b.secretChainOrigin||point;
  const link={x:point.x,y:point.y,id:targetId,offsetX:point.x-target.x,offsetY:point.y-target.y,bodyAngle:target.a||0};
  cue(p,'firechain',origin,{links:[link],originId:origin.id,offsetX:origin.offsetX,offsetY:origin.offsetY,bodyAngle:origin.bodyAngle,life:.84});
  sound(p,'secretChainCatch');return;
 }
 const kind={fokkerLeimberger:'rotaryHit',vickersPomFragment:'flakHit',fliegerpfeil:'dartHit',grunkreuzBarrage:'gasHit',eliteAirWing:'wingHit'}[id];
 const contact={targetId,offsetX:b.x-target.x,offsetY:b.y-target.y,life:id==='fliegerpfeil'?.92:.31};
 if(kind==='dartHit'||kind==='gasHit')contact.bodyAngle=target.a||0;
 cue(p,kind,point,contact);
 if(id==='fliegerpfeil')sound(p,'secretDartHit');
}
function tickWake(p,dt,previous){
 const state=secretWeaponEffect(p,'badinBreakthrough'),now=time(p);
 const x=previous?.x??p.x,y=previous?.y??p.y,dx=p.x-x,dy=p.y-y;
 const distance=Math.hypot(dx,dy),base=p.badinCruiseReference||p.baseSpeed||p.speed||1;
 const cruise=(p.equipmentCruiseSpeed||p.baseSpeed||p.speed||0)*(p.airframeSpeed??1);
 const speed=Math.min(cruise,distance/dt),charge=p.equipmentStraight||0;
 const active=charge>=(state.breakthrough ? .25 : .55)&&speed>=base*(state.breakthrough ? .99 : 1.04)
  &&distance<=cruise*dt*2&&!p.evadeTime&&!p.chargeTime&&!p.aceRetreat129;
 if(active!==!!state.breakthrough){
  if(active)state.breakthrough=true;else delete state.breakthrough;
  sound(p,active?'secretWakeStart':'secretWakeEnd');
 }
 let trail=wakes.get(p);
 if(active){
  if(!trail){trail=[];wakes.set(p,trail);}
  const a=Math.atan2(dy,dx),last=trail.at(-1);
  if(last&&last.nx===x&&last.ny===y&&now-last.at<.045){
   last.nx=p.x;last.ny=p.y;
  }else trail.push({x,y,nx:p.x,ny:p.y,at:now});
  if(!(state.wakeAt>now)){
   // Carry the same segments used for wake contact into the brief visual cue.
   // A gap in the trail starts a fresh strip rather than bridging an evade.
   const path=[];
   for(let i=trail.length-1;i>=0&&path.length<5;i--){
    const segment=trail[i],next=trail[i+1];
    if(segment.at<now-.12||next&&(segment.nx!==next.x||segment.ny!==next.y))break;
    path.unshift([segment.x,segment.y,segment.nx,segment.ny]);
   }
   state.wakeAt=now+.10;
   cue(p,'badinWake',{x,y,a},{life:SECRET_COMBAT.wakeLife,path});
  }
  if(!(state.soundAt>now)){state.soundAt=now+.46;sound(p,'secretWake');}
 }
 if(!trail)return;
 while(trail.length&&(now-trail[0].at>SECRET_COMBAT.wakeLife||trail.length>32))trail.shift();
 if(!trail.length){wakes.delete(p);return;}
 const g=worldOf(p),halfWidth=58,reach=Math.max(base,cruise)*SECRET_COMBAT.wakeLife+halfWidth;
 for(const e of g.enemies||[]){
  if(!live(e)||!airTarget(e)||e.stageBossBody||p.canHitTarget?.(e)===false||Math.hypot(e.x-p.x,e.y-p.y)>reach)continue;
  if(!trail.some(s=>{
   const sx=s.nx-s.x,sy=s.ny-s.y,k=clip(((e.x-s.x)*sx+(e.y-s.y)*sy)/(sx*sx+sy*sy||1),0,1);
   return (e.x-s.x-k*sx)**2+(e.y-s.y-k*sy)**2<=halfWidth**2;
  })||!sameTargetReady(p,e,'wake',SECRET_COMBAT.wakeDelay))continue;
  direct(p,e,mgDamage(p)*6,'badinBreakthrough');
  if(e.formationLeader)g.breakEnemyFormation?.(e,1.2);
  else if(!aceTarget(e)&&!e.bossMinion)e.a=(e.a||0)+.25*Math.sign(Math.sin((e.a||0)-p.a)||1);
  cue(p,'wake',e,{a:p.a,life:.62,targetId:e.id??e.tailId});
 }
}
export function secretRam(p,target,damage){
 if(!hasSecretWeapon(p,'nesterovRam')||!live(target)||target.surface||target.stationary||!airTarget(target))return damage;
 const speed=secretRamSpeed(p);
 if(speed<0||!sameTargetReady(p,target,'ram',SECRET_COMBAT.ramDelay))return damage;
 direct(p,target,mgDamage(p)*(12+14*speed),'nesterovRam');
 const dx=target.x-p.x,dy=target.y-p.y,distance=Math.hypot(dx,dy),a=distance>0?Math.atan2(dy,dx):p.a;
 const radius=Math.min(distance,(p.playerCollisionRadius??20)*.72);
 cue(p,'ram',{x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius,a},{life:.86,approach:p.a,strength:speed,ownerX:p.x,ownerY:p.y,targetHeading:target.a??a});sound(p,'secretRam');
 return damage*.3;
}
export function secretRamSpeed(p){
 const max=p.equipmentCruiseSpeed||p.baseSpeed||p.speed||1,speed=max*(p.airframeSpeed??1),min=(p.baseSpeed||p.speed||1)*.86;
 if(speed<min||p.invuln>0||p.isBomberEntering?.())return -1;
 return clip((speed-min)/Math.max(1,max-min),0,1);
}
export function secretArmorHit(p,before,prepare){
 salamanderArmorContact(p,before,cue,sound);
 if(!(before>p.hp)||!ownerLive(p)||!hasSecretWeapon(p,'explosiveArmor'))return;
 const s=secretWeaponEffect(p,'explosiveArmor'),now=time(p);if(s.readyAt>now)return;
 s.readyAt=now+SECRET_COMBAT.armorDelay;
 const g=worldOf(p),damage=(p.payloadPower?.(SECRET_COMBAT.cooperDamage)??SECRET_COMBAT.cooperDamage)*.5;
 for(let i=0;i<6;i++){
  const a=p.a+i*Math.PI/3,duration=.40+i*.07,x=p.x+Math.cos(a)*76,y=p.y+Math.sin(a)*76;
  (g.friendlyBombs??=[]).push(prepare(p,{x,y,sx:p.x,sy:p.y,life:duration,maxLife:duration,radius:SECRET_COMBAT.cooperRadius*.6,damage,secretWeapon:'explosiveArmor',secretArmorSlot:i,sprite:'cooper',releaseAngle:a}));
 }
 const source=p.damageSource,a=source&&Number.isFinite(source.x)?Math.atan2(source.y-p.y,source.x-p.x):p.a;
 cue(p,'armorLaunch',p,{a,life:.53});sound(p,'secretArmor');
}
export function tickSecretWeapons(p,dt,previous){
 if(!p.secretWeaponState)return;
 if(!ownerLive(p)){dartCharges.delete(p);clearSecretWeaponTransient(p);return;}
 const now=time(p),rotary=p.secretWeaponState.effects.fokkerLeimberger;
 if(rotary?.spinning&&(!hasSecretWeapon(p,'fokkerLeimberger')||now-rotary.lastShotAt>.20)){
  delete rotary.spinning;sound(p,'secretRotaryStop');
 }
 if(hasSecretWeapon(p,'badinBreakthrough'))tickWake(p,dt,previous);
 if(hasSecretWeapon(p,'villarPerosa'))tickVillar(p,dt);
 tickRankenCharges(p);
 tickSecretOrdnance(p,dt,previous,ordnanceEffects);
 tickSiemensFeedback(p,dt,cue,sound);
}
export function clearSecretWeaponTransient(p,stage=false){
 const state=p.secretWeaponState;
 if(!state)return;
 clearSecretOrdnanceTransient(p);
 clearSecretFlightTransient(p,stage);
 const rain=state.effects.fliegerpfeil;
 if(rain)delete rain.activeUntil;
 wakes.delete(p);
 const rotary=state.effects.fokkerLeimberger,badin=state.effects.badinBreakthrough;
 if(rotary)delete rotary.spinning;
 if(badin){delete badin.breakthrough;delete badin.wakeAt;}
 const villar=state.effects.villarPerosa;
 if(villar)villar.remaining=0;
 if(stage){
  dartCharges.delete(p);
  const bug=state.effects.ketteringBug;
  if(bug)delete bug.activeUntil;
  const heavy=state.effects.sn1650,gas=state.effects.grunkreuzBarrage;
  if(heavy)delete heavy.activeUntil;
  if(gas)delete gas.activeUntil;
  for(const wing of worldOf(p).allies||[])if(wing.ownerId===ownerId(p))delete wing.secretBombSecond;
 }
}

export function secretWingState(p,wing,dt,acePool){
 if(!activeWing(wing))return;
 if(!hasSecretWeapon(p,'eliteAirWing')){if(wing.secretAce){delete wing.acePilot;delete wing.secretAce;delete wing._netAcePilotState;}return;}
 if(!wing.secretAce){
  const world=worldOf(p),own=(world.allies||[]).filter(a=>a.ownerId===ownerId(p)&&a!==wing&&a.life>0);
  const used=new Set([...(world.players||[p]).map(q=>q.pilot),p.aceWingmanPilotId,...own.map(a=>a.acePilot)]);
  const pilot=acePool().find(id=>hasAceWingProfile(id)&&!used.has(id));if(!pilot)return;
  wing.acePilot=pilot;wing.secretAce=true;
 }
 tickAceWingPilot(wing,dt,Math.max(8,Math.min(14,(wing.secretAceCooldown||15)*.65)));
 const state=wing._netAcePilotState;
 if(state.clock===dt){
  state.readyAt=Number.isFinite(wing.secretAceReady)?wing.secretAceReady:state.readyAt+Math.max(0,wing.slot||0)*.9;
 }
 const before=state.readyAt;
 const world=worldOf(p);
 aceWingDefensiveSkill(wing,wing.engagementTarget);
 const rear=wing.secretBomber?null:aceWingRearShot(wing,world.enemies||[],e=>isWWIFlyingTarget(e)&&p.canHitTarget?.(e)!==false);
 if(rear){
  const a=fighterAim(world,wing,rear.target,490,.9);
  emit(p,{x:wing.x+Math.cos(a)*23,y:wing.y+Math.sin(a)*23,vx:Math.cos(a)*490,vy:Math.sin(a)*490,life:1.45,
   damage:(p.supportPower?.(rear.damage)??rear.damage)*ELITE_WING_DAMAGE,ally:true,secretWeapon:'eliteAirWing'});
  cue(p,'wingAttack',wing,{a,life:.18,rear:true});sound(p,'secretWingVolley');
 }
 if(state.readyAt!==before&&state.mode!=='rear'){cue(p,'wingSkill',wing,{mode:state.mode,wingSlot:wing.slot,acePilot:wing.acePilot});sound(p,'secretWingSkill');}
 wing.secretAceReady=Math.max(0,state.readyAt-state.clock);
}
export function updateSecretWing(p,wing,dt,pilots,planes,prepare){
 if(!activeWing(wing))return;
 const faction=planes[p.plane]?.faction;
 secretWingState(p,wing,dt,()=>Object.keys(pilots).filter(id=>pilots[id].faction===faction));
 secretBomberWing(p,wing,()=>{
  let best=null,distance=430;
  for(const target of worldOf(p).enemies||[]){
   if(!live(target)||p.canHitTarget?.(target)===false)continue;
   const d=Math.hypot(target.x-wing.x,target.y-wing.y);if(d<distance){distance=d;best=target;}
  }
  return best;
 },prepare);
}
export function secretWingGun(p,wing,target,heading,damage,prepare){
 if(!wing.secretAce||!wing._netAcePilotState)return null;
 const state=wing._netAcePilotState,previous=state.readyAt;
 const profile=aceWingFireProfile(worldOf(p),p,wing,target,Math.hypot(target.x-wing.x,target.y-wing.y));
 if(state.readyAt!==previous){cue(p,'wingSkill',wing,{mode:state.mode,wingSlot:wing.slot,acePilot:wing.acePilot});sound(p,'secretWingSkill');}
 const emitWing=(offset,power,rocket=false)=>{
  const a=heading+offset,speed=rocket?470:535;
  emit(p,{x:wing.x+Math.cos(a)*23,y:wing.y+Math.sin(a)*23,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1.45,
   damage:damage*power*ELITE_WING_DAMAGE,ally:true,pierce:!rocket&&!!profile.pierce,
   ...(rocket?{rocket:true,upgradeRocket:true,explosionBaseRadius:60,collisionRadius:10}:{specialColor:'#fff0bb'}),
   synthesisPayload:profile.ignite?{incendiary:true}:undefined,secretWeapon:'eliteAirWing'});
 };
 if((wing.secretVolleyAt??-Infinity)<=time(p)){
  wing.secretVolleyAt=time(p)+.23;
  cue(p,'wingAttack',wing,{a:heading,life:.18});sound(p,'secretWingVolley');
 }
 for(const offset of profile.volley)emitWing(offset,profile.airburst?1.7:.58,profile.airburst);
 if(profile.cannon)emitWing(0,1.75);
 if(profile.bomb&&prepare)dropWingBomb(p,wing,target.x,target.y,prepare,'eliteAirWing');
 return {...profile,damage:profile.damage*ELITE_WING_DAMAGE,cadence:profile.cadence*ELITE_WING_CADENCE};
}
export function secretBomberWing(p,wing,targetFor,prepare){
 if(!activeWing(wing))return;
 if(!hasSecretWeapon(p,'longRangeBombers')){
  delete wing.secretBomber;delete wing.secretBombReadyAt;delete wing.secretBombSecond;return;
 }
 wing.secretBomber=true;
 const now=time(p),slot=wing.slot||0;
 if(wing.secretBombSecond&&wing.secretBombSecond.at<=now){
  const {x,y,impactLayer}=wing.secretBombSecond;
  delete wing.secretBombSecond;
  const second=dropWingBomb(p,wing,x,y,prepare,'longRangeBombers',slot);second.secretReleaseIndex=1;second.secretImpactLayer=impactLayer;
  cue(p,'bomberRelease',wing,{life:.44});sound(p,'secretBomberRelease');
 }
 wing.secretBombReadyAt??=now+1.5+Math.max(0,slot)*.9;
 if(wing.secretBombReadyAt>now)return;
 const target=targetFor();
 if(!live(target)||Math.hypot(target.x-wing.x,target.y-wing.y)>430)return;
 const impactLayer=target.navalVessel?'water':airTarget(target)?'air':'ground';
 const bomb=dropWingBomb(p,wing,target.x,target.y,prepare,'longRangeBombers',slot);bomb.secretImpactLayer=impactLayer;
 secretCooperRelease(p,bomb);
 wing.secretBombSecond={x:target.x-Math.sin(wing.a)*22,y:target.y+Math.cos(wing.a)*22,at:now+.30,impactLayer};
 wing.secretBombReadyAt=now+SECRET_COMBAT.bomberInterval;
 cue(p,'bomberRelease',wing,{life:.44});sound(p,'secretBomberRelease');
}
function dropWingBomb(p,wing,x,y,prepare,id='longRangeBombers',slot){
 const g=worldOf(p),duration=.7,baseDamage=SECRET_COMBAT.cooperDamage*(id==='eliteAirWing'?ELITE_WING_DAMAGE:1);
 const damage=p.payloadPower?.(baseDamage)??baseDamage;
 const bomb=prepare(p,{x,y,sx:wing.x,sy:wing.y,life:duration,maxLife:duration,radius:SECRET_COMBAT.cooperRadius,damage,secretWeapon:id,secretBomberSlot:slot,sprite:'cooper',pilotSupport:true,releaseAngle:wing.a});
 (g.friendlyBombs??=[]).push(bomb);
 return bomb;
}
