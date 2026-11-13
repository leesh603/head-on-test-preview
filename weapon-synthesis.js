// Equipment is interpreted from the current fit, never from acquisition order.
// Delayed launches contain data only; ammunition is charged at actual emission.
import {ammunitionGasRadius} from './heavy-ammunition.js';
import {EQUIPMENT_CHOICE_COPY} from './equipment-copy.js';
import {bishopGlovesInterval} from './equipment-flight-balance.js';
import {combatImpactResult} from './combat-impact-result.js';
import {hasSecretWeapon} from './secret-weapons.js';
import {POM_AIRBURST,secretWeaponContact,secretSteelRainImpact,secretCannonInterval,secretCannonShot,secretCannonImpact,secretRotaryRound,tickSecretRotary,secretGasProfile,secretArmorHit,secretWingGun,secretCooperRelease} from './secret-weapon-combat.js';
import {WWI_BALANCE,igniteSharedBurn,equipmentTargets,wwiWingTarget,wwiBossAimPoint,prepareWWIPrimaryRound} from './wwi-equipment.js';
const world=p=>p.combatWorld?.()||p.world||p;
const alive=p=>p.hp>0&&p.status!=='downed';
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const SYNTHESIS_BALANCE=Object.freeze({gunDelay:.08,cannonDelay:.38,bombDelay:.8,darts:12,dartDamage:24,dartSpeed:800,dartLife:.76,dartExplosions:3,dartExplosionFraction:.35,dartExplosionRadius:20,attachmentFuse:1.1,gasRecharge:7,smokeRecharge:12,shrapnelRecharge:3.2,maxPayloadZones:24});
export function primaryCount(p){return Math.max(1,p.shots||1)+(p.upgrades?.quadLewis?3:0);}
export function weaponComposition(p,add){
 const u={...p.upgrades,...(add?{[add]:1}:{})},heavy=!!u.cow37;
 return {weapon:heavy?'cow':'gun',body:heavy?(u.flechettes?'dart-shell':'shell'):'bullet',count:Math.max(1,p.shots||1)+(u.quadLewis?3:0),incendiary:!!u.buckinghamBelt,explosive:!!u.amatolCharge,rotating:!!u.rearGunner,stagger:!!u.combinedProjectiles,doctrine:p.weaponMods?.GUN||null};
}
const signature=p=>JSON.stringify([weaponComposition(p),p.weapon?.belt,p.pilot,p.plane]);
function push(p,b){b.ownerId??=p.id||'p1';b.enemy=false;b.hit??=new Set();if(b.synthesisSupport)b.ally=true;(world(p).bullets??=[]).push(b);return b;}
function fireGunRound(p,b){
 const rotary=hasSecretWeapon(p,'fokkerLeimberger')?secretRotaryRound(p,b):null;
 push(p,p.applySpecialRound(b,null));
 if(rotary)push(p,p.applySpecialRound(rotary,null));
}
export function emitSynthesisGunRound(p,b,index,total){
 const ga=p.gunDirection(b.gun),dx=b.x-p.x,dy=b.y-p.y;
 if(p.upgrades?.combinedProjectiles&&index>=Math.ceil(total/2)){
  (p.synthesisGunPending??=[]).push({key:signature(p),delay:.08,gun:b.gun,forward:dx*Math.cos(ga)+dy*Math.sin(ga),side:-dx*Math.sin(ga)+dy*Math.cos(ga),offset:angle(Math.atan2(b.vy,b.vx),ga),round:{...b,hit:undefined}});return 0;
 }
 fireGunRound(p,b);return 1;
}
export function emitSynthesisActiveRocket(p,b,index){
 if(!p.upgrades?.combinedProjectiles||index<3){push(p,prepareSynthesisRound(p,b));return;}
 const dx=b.x-p.x,dy=b.y-p.y;
 (p.synthesisActivePending??=[]).push({key:signature(p),delay:.16,forward:dx*Math.cos(p.a)+dy*Math.sin(p.a),side:-dx*Math.sin(p.a)+dy*Math.cos(p.a),offset:angle(Math.atan2(b.vy,b.vx),p.a),round:{...b,hit:undefined}});
}
export function prepareSynthesisRound(p,b,{support=false}={}){
 if(!b||b.synthesisPrepared||b.synthesisChild||b.enemy||b.actualExplosion||b.ally||b.patrol||b.formation)return b;
 const primary=b.cow37||Number.isInteger(b.gun)&&!b.rocket&&!b.ally&&!b.patrol&&!b.formation;
 if(!primary&&!b.rocket&&!b.upgradeRocket&&!b.fieryGrapnel)return b;
 const c=weaponComposition(p);b.synthesisPrepared=true;b.synthesisSupport=support;
 const payloadScale=b.cow37?(Number.isFinite(b.damage)?Math.max(0,b.damage/280):1+Math.max(0,p.gunUpgradeBonus||0)+Math.max(0,p.explosiveBonus||0)):b.rocket?(p.payloadPower?.(1)??1):1+Math.max(0,p.gunUpgradeBonus||0);
 b.synthesisPayload={incendiary:c.incendiary&&(c.body!=='bullet'||b.rocket||b.fieryGrapnel),explosive:c.explosive,darts:primary&&!b.secretIndependentGun&&c.body==='dart-shell',dartDamage:SYNTHESIS_BALANCE.dartDamage*payloadScale,burnScale:payloadScale};
 if(b.cow37&&c.body==='dart-shell')b.synthesisFuse=.7;
 if(b.secretWeapon==='vickersPomPom')b.synthesisFuse=Math.min(b.synthesisFuse??Infinity,POM_AIRBURST.fuse);
 if(b.cow37){b.tacticalPayloadApplied=true;b.synthesisPrimary=true;prepareWWIPrimaryRound(p,b);}
 return b;
}
export function releaseDarts(p,parent){
 if(parent.synthesisOpened)return;parent.synthesisOpened=true;
 const a=Math.atan2(parent.vy||0,parent.vx||1),group={attempts:new Set(),explosions:SYNTHESIS_BALANCE.dartExplosions,explodedTargets:new Set()},payload=parent.synthesisPayload||{};
 const damage=Number.isFinite(payload.dartDamage)?payload.dartDamage:SYNTHESIS_BALANCE.dartDamage*(1+Math.max(0,p.gunUpgradeBonus||0));
 for(let i=0;i<SYNTHESIS_BALANCE.darts;i++){
  const heading=a+(i-5.5)*.055;
  push(p,{x:parent.x,y:parent.y,previousX:parent.x,previousY:parent.y,vx:Math.cos(heading)*800,vy:Math.sin(heading)*800,life:.76,damage,pierce:true,flechette:true,sweptProjectile:true,collisionRadius:2,synthesisChild:true,synthesisDart:true,synthesisSupport:!!parent.synthesisSupport,pilotSupport:!!parent.pilotSupport,tacticalRound:!!parent.tacticalRound||!!parent.tacticalBomb,projectileCombo:parent.projectileCombo,synthesisGroup:group,synthesisPayload:{incendiary:!!payload.incendiary,explosive:!!payload.explosive,burnScale:payload.burnScale??damage/SYNTHESIS_BALANCE.dartDamage},specialColor:'#d9d7c8'});
 }
}
function primaryVolleyToken(p,source='primary',kind='cow37'){return{id:`${source}:${p.synthesisVolleySequence=(p.synthesisVolleySequence||0)+1}`,source,kind,weapon:'cow37',at:p.t||0};}
function cannonGroup(p,indices,total,{heading,power=1,volleyToken=primaryVolleyToken(p)}={}){
 if(!alive(p)||p.reloadTime>0||!p.cow37)return 0;
 const c=weaponComposition(p);let base=Number.isFinite(heading)?heading:p.gunDirection?.(0)??p.a;
 if(p.telescope||c.doctrine==='precision'||p.weaponMods?.EXPLOSIVE==='focus'){
  const target=equipmentTargets(world(p)).filter(e=>p.canHitTarget?.(e)!==false).map(e=>e.stageBossBody?wwiBossAimPoint(p,e):e).find(e=>e&&e.hp!==0&&Math.hypot(e.x-p.x,e.y-p.y)<620&&Math.abs(angle(Math.atan2(e.y-p.y,e.x-p.x),base))<.36);
  if(target){base+=Math.max(-.12,Math.min(.12,angle(Math.atan2(target.y-p.y,target.x-p.x),base)));p.telescopeFocus156=.12;p.telescopeTarget156=target;}
 }
 const fan=c.doctrine==='suppression'?.24:c.doctrine==='precision'?.028:p.weaponMods?.EXPLOSIVE==='area'?.18:.095;
 let fired=0;
 for(const i of indices){
  if(!(p.ammo[0]>0))break;
  const b=p.createCow37Round(),a=base+(i-(total-1)/2)*fan,speed=Math.hypot(b.vx,b.vy),front=p.bomberTransfer?.front??38;
  Object.assign(b,{x:p.x+Math.cos(base)*front,y:p.y+Math.sin(base)*front,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:b.damage*power,synthesisPrimary:true});
  if(secretCannonInterval(p)<1)b.secretWeapon='vickersPomPom';
  prepareSynthesisRound(p,b);p.tacticalGunRound?.(b);b.pierce=false;if(p.weaponMods?.EXPLOSIVE){b.projectileDoctrine=p.weaponMods.EXPLOSIVE;b.tacticalAreaShell=p.weaponMods.EXPLOSIVE==='area';}
  if(p.upgrades?.rankinShell&&!(p.synthesisReady_shrapnel>0)&&(!p.upgrades.fieryGrapnel||p.wwiGrapnelCooldown>0&&!(world(p).bullets||[]).some(r=>r.fieryGrapnel&&r.life>0&&r.ownerId===(p.id||'p1')))){b.synthesisPayload.shrapnel=true;p.synthesisReady_shrapnel=3.2;}
  push(p,b);p.ammo[0]--;p.roundsFired++;fired++;p.preparePilotPrimaryRound?.(b,volleyToken);b.pierce=false;
 }
 if(fired){
  // Keep one bounded kick; the muzzle flash lasts slightly longer for a real multi-shell volley.
  p.cannonRecoil129=.14;p.cannonKick129=3.5;p.cannonKind129='cow';
  p.muzzleFlash=.11+Math.min(.02,(fired-1)*.006);p.synthesisMuzzleAngle=base;
  const w=world(p);w.shake=Math.max(w.shake||0,1.25);
  if(!secretCannonShot(p,base)){p.cannonMuzzleSmoke?.('cow');p.event?.('shot','cow37');}
 }
 if(p.ammo[0]<=0){p.synthesisPending=[];p.synthesisBurst=0;p.reload();}
 return fired;
}
export function tickCannon(p,dt,input={}){
 tickSecretRotary(p,dt,input,b=>push(p,p.applySpecialRound(b,null)));
 const c=weaponComposition(p),key=signature(p);
 if(p.synthesisSignature!==key){p.synthesisPending=[];p.synthesisBurst=0;p.synthesisSignature=key;}
 if(!alive(p)||p.reloadTime>0||p.bishopTime>0||p.isBomberEntering?.()||p.pilotPrimaryAutomaticBlocked?.()||input.inputMode==='gamepad'&&!input.fireHeld){p.synthesisPending=[];p.synthesisBurst=0;return;}
 for(const q of p.synthesisPending||[])q.delay-=dt;
 const due=(p.synthesisPending||[]).filter(q=>q.delay<=0);p.synthesisPending=(p.synthesisPending||[]).filter(q=>q.delay>0);
 for(const q of due)cannonGroup(p,q.indices,q.total,{volleyToken:q.volleyToken});
 if(p.reloadTime>0)return;
 p.cow37Timer=(p.cow37Timer??.15)-dt;
 if(p.cow37Timer>0||(p.synthesisPending||[]).length)return;
 if(!(p.ammo[0]>0)){p.reload();return;}
 const total=primaryCount(p),indices=Array.from({length:total},(_,i)=>i),cut=c.stagger?Math.ceil(total/2):total,volleyToken=primaryVolleyToken(p);
 cannonGroup(p,indices.slice(0,cut),total,{volleyToken});
 if(cut<total&&p.reloadTime<=0)p.synthesisPending=[{delay:SYNTHESIS_BALANCE.cannonDelay,indices:indices.slice(cut),total,volleyToken}];
 const rate=Math.max(.1,Math.min(1,(p.rate||.15)/(p.buildBaseline?.rate||p.equipmentLedger?.baseline?.rate||.15))),base=bishopGlovesInterval(p,rate)*secretCannonInterval(p);
 p.synthesisBurst=c.doctrine==='precision'?((p.synthesisBurst||0)+1)%3:0;
 p.cow37Timer+=c.doctrine==='precision'?(p.synthesisBurst?Math.max(c.stagger?.55:.22,base*.25):base*2.5):Math.max(c.stagger?.55:0,base);
}

// One ready charge has one destination. Successful attachments take precedence;
// a missed hook spends only the hook, leaving bombs and field charges available.
export function reservePayload(p,{wing=false,gasCarrier=false}={}){
 const u=p.upgrades||{},scale=wing?(p.supportPower?.(1)??1):(p.payloadPower?.(1)??1),payload={incendiary:!!u.buckinghamBelt,explosive:!!u.amatolCharge,darts:!!u.flechettes,dartDamage:SYNTHESIS_BALANCE.dartDamage*scale,burnScale:scale};
 // A real bombing run carries its own gas load. It cannot consume or refill
 // the separate ready charge shared by Cooper and attached grapnel payloads.
 if(gasCarrier&&u.grunkreuz)payload.gas=true;
 if(wing)return payload;
 for(const [id,key,cooldown] of [['grunkreuz','gas',7],['kaiserFog','smoke',12],['rankinShell','shrapnel',3.2]]){
  if(key==='gas'&&gasCarrier)continue;
  if(u[id]&&!(p['synthesisReady_'+key]>0)){payload[key]=true;p['synthesisReady_'+key]=cooldown;}
 }
 return payload;
}
export function prepareSynthesisBomb(p,b,options={}){
 if(!b||b.enemy||b.actualExplosion||b.synthesisChild||b.secondaryExplosion||b.burnTick||b.gas||b.ownerId!=null&&b.ownerId!==(p.id||'p1')||b.synthesisBombPrepared)return b;
 const gasCarrier=!!(options.tactical||options.wing||b.pilotSupport||b.synthesisSupport||b.bishopBomb||b.tacticalBomb||b.bomberTransfer);
 if(!b.synthesisPayload)b.synthesisPayload=reservePayload(p,{...options,gasCarrier});
 else if(gasCarrier&&p.upgrades?.grunkreuz)b.synthesisPayload.gas=true;
 b.ownerId??=p.id||'p1';b.synthesisBombPrepared=true;
 if(b.synthesisPayload?.gas&&hasSecretWeapon(p,'grunkreuzBarrage'))b.secretGasMarked=true;
 if(options.tactical)b.synthesisPrepared=true;
 b.releaseAngle??=p.a;return b;
}
// Only the first real blast carries ignition. Fields/darts are discharged from
// the parent once; copying those flags to the blast would recursively split it.
export function inheritSynthesisBlast(p,carrier,blast){
 if(!carrier||carrier.enemy||!blast?.actualExplosion||blast.enemy||blast.ownerId!==(p.id||'p1')||carrier.ownerId!=null&&carrier.ownerId!==(p.id||'p1')||carrier.actualExplosion||carrier.synthesisChild||carrier.secondaryExplosion||carrier.burnTick||carrier.gas)return blast;
 if(carrier.synthesisPayload?.incendiary)blast.synthesisPayload={incendiary:true,burnScale:carrier.synthesisPayload.burnScale??1};
 if(carrier.pilotSupport||carrier.synthesisSupport)blast.pilotSupport=true;
 if(carrier.synthesisSupport){blast.synthesisSupport=true;blast.ally=true;}
 if(carrier.tacticalBomb||carrier.tacticalRound){blast.tacticalRound=true;blast.projectileCombo=carrier.projectileCombo;}
 return blast;
}
function shrapnel(p,x,y,a,support=false,pilotSupport=false){
 const w=world(p),clears=[];
 for(const b of w.bullets||[]){if(!b.enemy||b.life<=0||b.heavyShell||b.heavy||b.raidHeavy||b.signatureAttack)continue;if(Math.hypot(b.x-x,b.y-y)<180&&Math.abs(angle(Math.atan2(b.y-y,b.x-x),a))<1.9){b.life=0;if(clears.length<12)clears.push({x:b.x,y:b.y});}}
 p.equipmentRankinFx={x,y,a:a-Math.PI,clears};p.rankinFlash=.5;
 for(let i=0;i<11;i++){const h=a+(i-5)*.26;push(p,{x,y,vx:Math.cos(h)*620,vy:Math.sin(h)*620,life:.32,damage:support?32:p.payloadPower?.(32)||32,pierce:true,synthesisChild:true,synthesisSupport:support,pilotSupport,specialColor:'#ddd8c1'});}
}
export function detonateSynthesisPayload(p,b){
 const payload=b?.synthesisPayload;if(!payload||b.synthesisDetonated||b.enemy||b.actualExplosion||b.synthesisChild||b.secondaryExplosion||b.burnTick||b.gas||b.ownerId!=null&&b.ownerId!==(p.id||'p1'))return;
 b.synthesisDetonated=true;const w=world(p),a=b.releaseAngle??Math.atan2(b.vy||0,b.vx||1);
 const steelRain=secretSteelRainImpact(p,b,WWI_BALANCE.flechettes);
 if(payload.darts&&!b.synthesisOpened&&!steelRain){releaseDarts(p,{...b,vx:Math.cos(a),vy:Math.sin(a)});b.synthesisOpened=true;}
 if(payload.shrapnel&&!b.synthesisShrapnel){b.synthesisShrapnel=true;shrapnel(p,b.x,b.y,a,!!b.synthesisSupport,!!b.pilotSupport);}
 if(payload.incendiary||payload.gas||payload.smoke){
  const zones=p.synthesisZones??=[],gas=secretGasProfile(p,b,ammunitionGasRadius(p,100),3),gasRadius=gas.radius;
  zones.push({x:b.x,y:b.y,gasRadius,life:gas.life,secretSmoke:gas.enhanced,tick:0,synthesisSupport:!!b.synthesisSupport,pilotSupport:!!b.pilotSupport,tacticalRound:!!b.tacticalRound||!!b.tacticalBomb,projectileCombo:b.projectileCombo,payload:{incendiary:payload.incendiary,gas:payload.gas,smoke:payload.smoke||gas.enhanced,burnScale:payload.burnScale??1}});
  if(zones.length>SYNTHESIS_BALANCE.maxPayloadZones)zones.splice(0,zones.length-SYNTHESIS_BALANCE.maxPayloadZones);
  if(payload.gas&&!gas.enhanced){const puffs=w.grunkreuzPuffs??=[],id=p.id||'p1';if(puffs.filter(f=>f.synthesisVisual&&f.ownerId===id).length>=SYNTHESIS_BALANCE.maxPayloadZones){const old=puffs.findIndex(f=>f.synthesisVisual&&f.ownerId===id);if(old>=0)puffs.splice(old,1);}puffs.push({x:b.x,y:b.y,r:gasRadius,life:gas.life,maxLife:gas.life,dmg:0,synthesisVisual:true,ownerId:id,seed:w.t||0});}
 }
}
function tickZones(p,dt){
 const w=world(p);
 for(const z of p.synthesisZones||[]){z.life-=dt;z.tick-=dt;if(z.tick>0)continue;z.tick+=.6;
  for(const e of equipmentTargets(w)){const point=e.stageBossBody?wwiBossAimPoint(p,e):e;if(!point||!(e.hp>0)||p.canHitTarget?.(e)===false)continue;
   const distance=Math.hypot(point.x-z.x,point.y-z.y),gas=!!z.payload.gas&&distance<=(z.gasRadius??100),incendiary=!!z.payload.incendiary&&distance<=100;
   if(distance<=(z.secretSmoke?z.gasRadius:100)&&z.payload.smoke&&!e.stageBossBody&&!e.bossPilot&&!e.ace){e.fire=Math.max(e.fire||0,.65);e.patrolTarget=null;}
   if(!gas&&!incendiary)continue;
   e.synthesisZoneAt??={};const id=p.id||'p1';if((e.synthesisZoneAt[id]??-Infinity)>(w.t||0))continue;e.synthesisZoneAt[id]=(w.t||0)+.59;
   const boss=e.stageBossBody||e.bossPilot||e.ace||e.type==='boss',gasDamage=gas?(boss?6:Math.min(90,(e.maxHp||e.hp)*.09)):0,burnDamage=incendiary?6*(z.payload.burnScale??1):0,damage=Math.max(gasDamage,burnDamage);
   const hit=e.stageBossBody?.locateHit?.({...point,radius:0}),body=e.stageBossBody,part=hit?.partId?body.parts.get(hit.partId):body;
   push(p,{x:point.x,y:point.y,vx:0,vy:0,life:.12,damage,hit:new Set(),pierce:true,blast:true,gas,burnTick:incendiary,synthesisChild:true,secretWeapon:gas&&z.secretSmoke?'grunkreuzBarrage':undefined,synthesisSupport:!!z.synthesisSupport,pilotSupport:!!z.pilotSupport,tacticalRound:!!z.tacticalRound,projectileCombo:z.projectileCombo,identityDotTarget:part||e});
  }
 }
 p.synthesisZones=(p.synthesisZones||[]).filter(z=>z.life>0);
}
function attach(p,b,e){
 const u=p.upgrades||{},hasBomb=u.cooperRack&&!(p.wwiCooperCooldown>0)&&!p.wwiCooperSecondIn;
 if(!hasBomb&&!u.grunkreuz&&!u.rankinShell)return;
 const payload=reservePayload(p);
 if(!hasBomb&&!payload.gas&&!payload.shrapnel)return;
 if(hasBomb){p.wwiCooperCooldown=4;p.wwiCooperSecondIn=.8;p.wwiCooperSecondDamage=p.payloadPower?.(70)||70;}
 const a=e.a||0,dx=b.x-e.x,dy=b.y-e.y;
 const pendingShrapnel=!!payload.shrapnel;payload.shrapnel=false;
 const attachment={target:e,life:1.1,pendingShrapnel,shrapnelLife:4,releaseAngle:Math.atan2(b.vy,b.vx),localX:dx*Math.cos(a)+dy*Math.sin(a),localY:-dx*Math.sin(a)+dy*Math.cos(a),x:b.x,y:b.y,damage:hasBomb?(p.payloadPower?.(70)||70):0,radius:66,synthesisPayload:payload,gasLeft:payload.gas?3:0};
 if(hasBomb)secretCooperRelease(p,attachment);
 (p.synthesisAttachments??=[]).push(attachment);
}
function tickAttachments(p,dt){
 for(const b of p.synthesisAttachments||[]){const e=b.target,lost=!e||e.hp<=0||e.dead||e.crashing;
  if(e&&Number.isFinite(e.x)&&Number.isFinite(e.y)){const a=e.a||0;b.x=e.x+b.localX*Math.cos(a)-b.localY*Math.sin(a);b.y=e.y+b.localX*Math.sin(a)+b.localY*Math.cos(a);}
  // The carrier was already paid for on attachment. Losing its target settles
  // that one payload at the last pose; it never grants another bomb opportunity.
  b.life=lost?0:b.life-dt;if(lost){b.target=null;b.gasLeft=0;}
  if(b.pendingShrapnel){b.shrapnelLife-=dt;if(Math.hypot(p.x-b.x,p.y-b.y)>=140){shrapnel(p,b.x,b.y,Math.atan2(b.y-p.y,b.x-p.x));b.pendingShrapnel=false;}else if(b.shrapnelLife<=0)b.pendingShrapnel=false;}
  if(b.life<=0&&!b.synthesisDetonated){
   if(b.damage&&p.upgrades?.steelCore){
    (world(p).friendlyBombs??=[]).push({x:b.x,y:b.y,radius:b.radius,damage:b.damage,life:0,ownerId:p.id,releaseAngle:b.releaseAngle,synthesisPayload:b.synthesisPayload,secretSteelRain:b.secretSteelRain,contactTarget:e});
    b.gasLeft=0;b.synthesisDetonated=true;continue;
   }
   if(b.damage)p.queueExplosionDamage(b.x,b.y,b.radius,b.damage,{fxSource:'bomb'});detonateSynthesisPayload(p,b);
  }
  if(b.synthesisDetonated&&b.gasLeft>0){b.gasLeft-=dt;b.gasTick=(b.gasTick||0)-dt;if(b.gasTick<=0){b.gasTick=.6;detonateSynthesisPayload(p,{x:b.x,y:b.y,synthesisPayload:{gas:true}});}}
 }
 p.synthesisAttachments=(p.synthesisAttachments||[]).filter(b=>b.life>0||b.gasLeft>0||b.pendingShrapnel);
}
export function tickSynthesis(p,dt){
 for(const key of ['gas','smoke','shrapnel'])p['synthesisReady_'+key]=Math.max(0,(p['synthesisReady_'+key]||0)-dt);
 if(!alive(p)){p.synthesisPending=[];p.synthesisGunPending=[];p.synthesisActivePending=[];p.synthesisAttachments=[];p.synthesisZones=[];return;}
 const key=signature(p),pending=p.synthesisGunPending||[];p.synthesisGunPending=[];
 const rockets=p.synthesisActivePending||[];p.synthesisActivePending=[];
 for(const q of rockets){if(q.key!==key)continue;q.delay-=dt;if(q.delay>0){p.synthesisActivePending.push(q);continue;}const h=p.a+q.offset,speed=Math.hypot(q.round.vx,q.round.vy);push(p,prepareSynthesisRound(p,{...q.round,x:p.x+Math.cos(p.a)*q.forward-Math.sin(p.a)*q.side,y:p.y+Math.sin(p.a)*q.forward+Math.cos(p.a)*q.side,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed}));}
 for(const q of pending){if(q.key!==key||p.reloadTime>0||p.bishopTime>0||p.isBomberEntering?.()||p.pilotPrimaryAutomaticBlocked?.())continue;q.delay-=dt;if(q.delay>0){p.synthesisGunPending.push(q);continue;}if(!(p.ammo[q.gun]>0))continue;
  const ga=p.gunDirection(q.gun),h=ga+q.offset,speed=Math.hypot(q.round.vx,q.round.vy),b={...q.round,x:p.x+Math.cos(ga)*q.forward-Math.sin(ga)*q.side,y:p.y+Math.sin(ga)*q.forward+Math.cos(ga)*q.side,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed};
  fireGunRound(p,b);if(!p.unlimitedAmmo)p.ammo[q.gun]--;p.roundsFired++;p.muzzleFlash=.055;p.event?.('shot','');
 }
 if(pending.length&&p.ammo.every(n=>n<=0)&&p.reloadTime<=0)p.reload();
 tickAttachments(p,dt);tickZones(p,dt);
}
export function synthesisWing(p,a){
 if(!p.upgrades?.fighterSupply||!a.permanent||a.aceWingman||a.ownerId!==(p.id||'p1'))return false;
 if(!p.upgrades.cow37&&!p.upgrades.flechettes&&!p.upgrades.cooperRack)return false;
 const wings=(world(p).allies||[]).filter(w=>w.permanent&&!w.aceWingman&&w.ownerId===a.ownerId&&w.life>0).sort((a,b)=>(a.slot||0)-(b.slot||0));
 const index=wings.indexOf(a);return index>=0&&a.hp!==0&&index<Math.min(3,1+Math.floor((p.weaponModSelections?.FORMATION||0)/5));
}
export function tickSynthesisWing(p,a,dt){
 if(!synthesisWing(p,a))return false;
 const w=world(p),key=signature(p);if(a.synthesisSignature!==key){a.synthesisSignature=key;a.synthesisAmmo=p.cow37?24:48;a.synthesisReload=0;a.synthesisFire=.3;a.synthesisBombPending=null;}
 a.synthesisReload=Math.max(0,(a.synthesisReload||0)-dt);a.synthesisFire=(a.synthesisFire||0)-dt;
 const handoff=p.reloadTime>0&&!a.synthesisOwnerReloading;a.synthesisOwnerReloading=p.reloadTime>0;
 if(a.synthesisReload>0||a.carrierHidden||a.regrouping||Math.hypot(a.x-p.x,a.y-p.y)>700)return true;
 if(a.synthesisAmmo<=0)a.synthesisAmmo=p.cow37?24:48;
 if(a.synthesisBombPending){a.synthesisBombPending.delay-=dt;if(a.synthesisBombPending.delay<=0){wingBomb(p,a);a.synthesisBombPending=null;}}
 const signaled=wwiWingTarget(p,a);
 // A marked target lets a ready specialist cover one real owner reload. The
 // specialist still spends its own ammunition and keeps its own reload gate.
 if(handoff&&signaled&&a.synthesisAmmo>0)a.synthesisFire=Math.min(a.synthesisFire,.08*((a.slot||0)%3));
 if(a.synthesisFire>0)return true;
 const target=signaled||equipmentTargets(w).filter(e=>p.canHitTarget?.(e)!==false).map(e=>e.stageBossBody?wwiBossAimPoint(p,e,a):e).filter(e=>e&&Math.hypot(e.x-a.x,e.y-a.y)<550&&Math.abs(angle(Math.atan2(e.y-a.y,e.x-a.x),a.a))<.4).sort((e,f)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(f.x-a.x,f.y-a.y))[0];
 if(!target||Math.abs(angle(Math.atan2(target.y-a.y,target.x-a.x),a.a))>.4)return true;
 const profile=secretWingGun(p,a,target,a.a,p.supportPower(5)*p.fighterSupplyDamage(a),prepareSynthesisBomb);
 if((a.secretBomber||a.secretAce)&&p.upgrades.cooperRack&&!p.cow37){
  push(p,{x:a.x+Math.cos(a.a)*23,y:a.y+Math.sin(a.a)*23,vx:Math.cos(a.a)*470,vy:Math.sin(a.a)*470,life:1.4,damage:p.supportPower(5)*p.fighterSupplyDamage(a)*(profile?.damage||1),ally:true,secretWingRound:!!profile,synthesisSupport:true,pierce:profile?.pierce,synthesisPayload:profile?.ignite?{incendiary:true}:undefined});
 }
 if(p.upgrades.cooperRack&&!p.cow37){wingBomb(p,a);a.synthesisBombPending={delay:p.upgrades.combinedProjectiles?.8:.18};a.synthesisFire=4;return true;}
 const c=weaponComposition(p),count=Math.min(c.count,a.synthesisAmmo),heading=a.a,dartGroup={attempts:new Set(),explosions:SYNTHESIS_BALANCE.dartExplosions,explodedTargets:new Set()};
 for(let i=0;i<count;i++){const h=heading+(i-(c.count-1)/2)*.095,speed=p.cow37?660:800;
  const scale=p.supportPower(1)*p.fighterSupplyDamage(a),b={x:a.x+Math.cos(h)*23,y:a.y+Math.sin(h)*23,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed,life:p.cow37?2.5:.76,damage:(p.cow37?140:12)*scale,ally:true,secretWingRound:!!profile,cow37:!!p.cow37,gun:p.cow37?undefined:0,pierce:!p.cow37,flechette:!p.cow37,sweptProjectile:!p.cow37,collisionRadius:p.cow37?13:2,synthesisSupport:true,synthesisPrepared:true,tacticalPayloadApplied:true,synthesisDart:!p.cow37,synthesisGroup:!p.cow37?dartGroup:undefined,synthesisPayload:{incendiary:c.incendiary,explosive:c.explosive,darts:p.cow37&&c.body==='dart-shell',dartDamage:SYNTHESIS_BALANCE.dartDamage*scale,burnScale:scale}};
  if(p.cow37&&c.body==='dart-shell')b.synthesisFuse=.7;push(p,b);
 }
 a.synthesisAmmo-=count;a.muzzleFlash=.15;a.muzzleAngle=heading;a.synthesisFire=(p.cow37?1:.3)*p.fighterSupplyInterval(a)/(1+(p.commandRateBonus||0));
 if(a.synthesisAmmo<=0)a.synthesisReload=p.cow37?4.6:2.5;
 return true;
}
function wingBomb(p,a){if(a.synthesisAmmo<=0||a.synthesisReload>0)return;const heading=a.a,supply=p.fighterSupplyDamage(a),payload=reservePayload(p,{wing:true,gasCarrier:true});payload.dartDamage*=supply;payload.burnScale*=supply;const b={x:a.x,y:a.y,sx:a.x,sy:a.y,vx:Math.cos(heading)*180,vy:Math.sin(heading)*180,age:0,life:.65,maxLife:.65,radius:66,damage:p.supportPower(70)*supply,ownerId:p.id,cooperBomb:true,sprite:'cooper',synthesisSupport:true,pilotSupport:true,synthesisPayload:payload,releaseAngle:heading};prepareSynthesisBomb(p,b,{wing:true});(world(p).friendlyBombs??=[]).push(b);a.synthesisAmmo--;if(!a.synthesisAmmo)a.synthesisReload=4;a.muzzleFlash=.1;}
// Describe what the chosen equipment changes before any ammunition bookkeeping.
// Shared by selection cards, held equipment, the codex and co-op HUD.
export function synthesisDescription(p,id,locale='ko',compact=false){
 if(!p)return null;
 const c=weaponComposition(p,id),en=locale==='en',dartEffect=c.explosive?(en?' Amatol adds up to 3 small impact explosions per 12-dart group, once per target.':' 아마톨은 화살 12발 묶음마다 최대 3회 소폭발을 일으키며, 같은 표적에는 한 번만 발동합니다.'):'';
 if(compact&&['cow37','quadLewis','flechettes','rearGunner','combinedProjectiles'].includes(id)){
  if(id==='quadLewis'&&c.weapon==='cow')return en?'COW salvo: '+c.count+' firing lanes.':'COW 포탄 '+c.count+'갈래를 발사합니다.';
  if(id==='flechettes'&&c.body==='dart-shell')return c.explosive?(en?'COW and Cooper release 12 darts; up to 3 small impact explosions per group.':'COW·쿠퍼에서 화살 12발이 퍼지며, 한 묶음에 최대 3회 소폭발합니다.'):(en?'COW shells and equipped Cooper bombs release 12 piercing darts each.':'COW 포탄과 보유한 쿠퍼 폭탄이 관통 화살 12발을 퍼뜨립니다.');
  if(id==='cow37'&&c.body==='dart-shell')return en?'Replaces guns with an ammo-consuming cannon that releases 12 darts.':'기관총을 탄약을 소모하며 화살 12발을 퍼뜨리는 37 mm 포로 바꿉니다.';
  return EQUIPMENT_CHOICE_COPY[id][en?1:0];
 }
 switch(id){
 case 'cow37':return c.body==='dart-shell'
  ?(en?'Replaces the machine guns with a 37 mm cannon. Each shell consumes ammunition and releases 12 piercing darts.':'기관총을 37 mm 포로 교체합니다. 포탄마다 탄약을 소모하며 관통 화살 12발을 퍼뜨립니다.')+dartEffect
  :(en?'Replaces the machine guns with a non-piercing 37 mm cannon. Shells explode on impact and consume ammunition when fired.':'기관총을 비관통 37 mm 포로 교체합니다. 포탄은 명중하면 폭발하며 발사할 때마다 탄약을 소모합니다.');
 case 'quadLewis':return c.weapon==='cow'
  ?(en?'COW salvo: '+c.count+' firing lanes. Each shell consumes ammunition.':'COW 포탄 '+c.count+'갈래를 발사합니다. 포탄마다 탄약을 소모합니다.')
  :(en?'Adds three firing lanes to the primary weapon. Each fired round consumes ammunition.':'주무장 발사 갈래가 3개 늘어납니다. 발사한 탄환마다 탄약을 소모합니다.');
 case 'flechettes':return c.body==='dart-shell'
  ?(en?'COW shells release 12 piercing darts each, inheriting cannon growth. Equipped Cooper bombs also release darts with explosive growth.':'COW 포탄마다 포의 성장을 반영한 관통 화살 12발을 퍼뜨립니다. 쿠퍼 폭탄의 화살에는 폭발물 성장이 적용됩니다.')+dartEffect
  :(en?'Keeps machine guns and fires 12 piercing darts every 3 seconds without gun ammunition. Independent darts inherit gun growth; Cooper-carried darts inherit explosive growth.':'기관총을 유지하며 탄약 소모 없이 3초마다 관통 화살 12발을 별도로 발사합니다. 독립 화살은 기관총, 쿠퍼 폭탄의 화살은 폭발물 성장을 반영합니다.')+dartEffect;
 case 'rearGunner':return en?'Rotates the primary turret at about 66° per second. Also applies to COW and Quad Lewis.':'주무장 총좌가 초당 약 66°씩 회전합니다. COW 포와 쿼드 루이스에도 적용됩니다.';
 case 'combinedProjectiles':return en?'Fires primary volleys and Cooper bombs in staggered bursts. Each shot uses your position and aim when it fires.':'주무장과 쿠퍼 폭탄을 한꺼번에 쏘지 않고 시간차로 발사합니다. 각 탄환은 발사 순간의 기체 위치와 조준 방향을 따릅니다.';
 default:return null;
 }
}
export function installWeaponSynthesis(Game){
 Game.prototype.emitPilotPrimarySalvo=function({power=1,heading=this.a,kind='active',volleyToken}={}){if(!this.cow37||!alive(this)||this.reloadTime>0||!(this.ammo?.[0]>0))return 0;const total=primaryCount(this),token=volleyToken||primaryVolleyToken(this,'active',kind);token.source='active';token.kind=kind;return cannonGroup(this,Array.from({length:total},(_,i)=>i),total,{heading,power:Math.max(0,Math.min(1.5,Number.isFinite(power)?power:1)),volleyToken:token});};
 const flight=Game.prototype.flyAirframe;Game.prototype.flyAirframe=function(dt,input,...args){if(input?.inputMode==='gamepad'&&!input.fireHeld)this.synthesisGunPending=[];return flight.call(this,dt,input,...args);};
 const identity=Game.prototype.identityImpact;Game.prototype.identityImpact=function(b,...args){if(b?.synthesisSupport)return;return identity?.call(this,b,...args);};
 const incoming=Game.prototype.buildReceivedDamage;Game.prototype.buildReceivedDamage=function(before,...args){
  const result=incoming.call(this,before,...args),source=this.damageSource;
  secretArmorHit(this,before,prepareSynthesisBomb);
  if(before>this.hp&&alive(this)&&this.upgrades?.rankinShell&&(this.armorUpgradeHp>0||this.jArmorCapsule)&&!this.cow37&&!this.upgrades.cooperRack&&!this.upgrades.fieryGrapnel&&!(this.synthesisReady_shrapnel>0)){
   this.synthesisReady_shrapnel=3.2;shrapnel(this,this.x,this.y,Number.isFinite(source?.x)?Math.atan2(source.y-this.y,source.x-this.x):this.a+Math.PI);
  }
  return result;
 };
 const formation=Game.prototype.wingFormationTarget;Game.prototype.wingFormationTarget=function(a,...args){
  if(this.upgrades?.lufberyCircle&&synthesisWing(this,a)){const focus=wwiWingTarget(this,a)||equipmentTargets(world(this)).find(e=>Math.hypot(e.x-this.x,e.y-this.y)<550);if(focus){const t=(world(this).t||0)*.65+(a.slot||0)*Math.PI;return{x:focus.x+Math.cos(t)*170,y:focus.y+Math.sin(t)*170};}}
  return formation.call(this,a,...args);
 };
 const damage=Game.prototype.roundDamageMultiplier;Game.prototype.roundDamageMultiplier=function(b,e){return b.synthesisSupport?1:damage.call(this,b,e);};
 Game.prototype.tickSynthesizedCannon=function(dt,input){return tickCannon(this,dt,input);};
 const apply=Game.prototype.applySpecialRound;Game.prototype.applySpecialRound=function(b,...args){return prepareSynthesisRound(this,apply.call(this,b,...args)||b);};
 const impact=Game.prototype.specialRoundImpact;Game.prototype.specialRoundImpact=function(b,e){
  const result=b.synthesisSupport?undefined:impact.call(this,b,e);
  if(b.ownerId!=null&&b.ownerId!==(this.id||'p1'))return result;
  if(b.cannonDetonated&&b.synthesisPayload?.darts)releaseDarts(this,b);
  if(!(combatImpactResult(b,e)?.damage>0))return result;
  secretWeaponContact(this,b,e);
  if(b.synthesisSupport&&b.cow37&&!b.cannonDetonated&&!secretCannonImpact(this,b,e)){b.cannonDetonated=true;b.pierce=false;b.life=0;this.queueExplosionDamage(b.x,b.y,76,b.damage*.5,{exclude:e,fxSource:'cow',pilotSupport:true});const blast=world(this).bullets.at(-1);blast.synthesisSupport=true;blast.ally=true;}
  if(b.synthesisPayload?.darts)releaseDarts(this,b);
  if(b.synthesisPayload?.shrapnel&&!b.synthesisShrapnel){b.synthesisShrapnel=true;shrapnel(this,b.x,b.y,Math.atan2(b.vy,b.vx),!!b.synthesisSupport);}
  if(b.synthesisPayload?.explosive&&!b.cow37&&!b.rocket&&!b.synthesisExploded){
   b.synthesisExploded=true;const group=b.synthesisGroup,dart=!!(b.synthesisDart||b.synthesisPayloadDart);
   if(!dart||group?.explosions>0&&!group.explodedTargets?.has(e)){
    if(dart){group.explosions--;group.explodedTargets??=new Set();group.explodedTargets.add(e);}
    this.queueExplosionDamage(b.x,b.y,b.fieryGrapnel?45:SYNTHESIS_BALANCE.dartExplosionRadius,b.damage*SYNTHESIS_BALANCE.dartExplosionFraction,{exclude:e,fxSource:'cow',pilotSupport:!!(b.synthesisSupport||b.pilotSupport),secondaryExplosion:dart});
    const blast=world(this).bullets.at(-1);if(dart){blast.synthesisChild=true;blast.synthesisDartExplosion=true;}if(b.synthesisSupport){blast.synthesisSupport=true;blast.ally=true;}
   }
  }
  if(b.synthesisPayload?.incendiary)igniteSharedBurn(this,e,b,combatImpactResult(b,e));
  if(b.fieryGrapnel&&!b.secretWeapon&&!b.synthesisAttached){b.synthesisAttached=true;attach(this,b,e);}
  return result;
 };
 const prepare=Game.prototype.prepareProjectileCandidates;Game.prototype.prepareProjectileCandidates=function(...args){
  const w=world(this),owners=this.players||[this];
  const initial=(w.bullets||[]).length;
  for(let i=0;i<initial;i++){const b=w.bullets[i];if(b.enemy||b.life<=0)continue;const p=owners.find(p=>(p.id||'p1')===(b.ownerId||'p1'));if(!p)continue;prepareSynthesisRound(p,b);if(b.synthesisFuse>0){b.synthesisFuse-=Math.max(0,args[0]||0);if(b.synthesisFuse<=0){if(b.synthesisPayload?.darts)releaseDarts(p,b);if(b.synthesisPayload?.shrapnel&&!b.synthesisShrapnel){b.synthesisShrapnel=true;shrapnel(p,b.x,b.y,Math.atan2(b.vy,b.vx),!!b.synthesisSupport);}b.life=0;if(!b.cannonDetonated&&!secretCannonImpact(p,b)){b.cannonDetonated=true;p.queueExplosionDamage(b.x,b.y,76,b.damage*.5,{fxSource:'cow',pilotSupport:!!b.synthesisSupport});if(b.synthesisSupport){const blast=w.bullets.at(-1);blast.synthesisSupport=true;blast.ally=true;}}}}}
  for(const b of w.friendlyBombs||[]){const p=owners.find(p=>(p.id||'p1')===(b.ownerId||'p1'));if(p)prepareSynthesisBomb(p,b);}
  return prepare.apply(this,args);
 };
}
