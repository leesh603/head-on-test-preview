import {PANDEMONIUM_DEPLOYMENT,finalArenaBosses} from './pandemonium-registry.js';
import {createVariant,listVariantParts,damageVariantPart,updateVariant,advanceVariantDefeat} from './final-arena-variant-bridge.js';
import {beginFortressDefeat,advanceFortressDefeat,FORTRESS_DEFEAT_DURATION} from './fortress-defeat.js';
import {awardPriorityKill,achievementPandemoniumClear} from './achievements.js?v=pandemonium394r2';
import {createFortressBattle,updateFortressBattle,damageFortressZone,FORTRESS_ZONES} from './fortress-systems.js';
import {localToWorld,worldToLocal,damageFortress} from './fortress-mechanics.js';
import {disposeIntrusion} from './intrusion-bosses.js';
import {recordCombatImpact} from './combat-impact-result.js';
export const FINAL_ARENA_FORMS=Object.freeze(PANDEMONIUM_DEPLOYMENT.map(p=>p.variant));
export const FINAL_ARENA=Object.freeze({size:2600,scale:.5,playerLimit:1125,bossLimit:300,intro:5,victory:FORTRESS_DEFEAT_DURATION,coreHp:8000,partHp:1000});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const world=g=>g?.world||g;
export const isFinalArena=g=>!!(world(g)?.finalArena&&['entry','battle','victory'].includes(world(g).finalArena.phase));
const pilots=g=>g.players||[g];
const blocked=g=>g.state!=='playing'||!!g.pendingLevelUps?.length;
function clearArenaTraffic(g){
 disposeIntrusion(g,'final-arena-transition');g.intrusionBoss=null;g.intrusionDirector=null;g.photoReconDirector=null;
 g.enemies=[];g.bullets=[];for(const key of ['hostileMinefields','bombZones','flakBursts','bossCues','aaEffects','bossBuildings'])g[key]=[];
 g.stageBoss?.hazards?.pool?.clear();g.pendingAceCount=0;g.bossArrival=null;g.skyChampion=null;g.huntTarget=null;g._aceCombatActive=new Set();
 if(g.aceSortie){g.aceSortie.active=new Map();g.aceSortie.pending=[];}
 if(g.rivalAce){g.rivalAce.active=null;g.rivalAce.returnAt=Infinity;}
 for(const key of ['battlefieldEvents','groundFacilities','photoRecon','transportConvoy','intrusionBosses','londonBattle','parisBattle','verdunBattle','navalRoute','gallipoliRoute','jutlandRoute'])g[key]=null;
}
export function beginFinalArena(g){
 const stages=g.stageBoss?.stages,route=stages?.finalArena;if(stages?.phase!=='final-arena'||!route?.token)return false;
 if(!g.finalArena||g.finalArena.token!==route.token){
  const bosses=PANDEMONIUM_DEPLOYMENT.map(p=>{const formToken=String(route.token)+':boss:'+p.id,scale=p.variant==='factory'?1:.5,fortress=p.variant==='mobile'?createFortressBattle():createVariant(p.variant,{token:String(route.token),entityId:formToken,x:p.x,y:p.y});if(p.variant==='mobile'){fortress.x=p.x/scale;fortress.y=p.y/scale;fortress.systems.player.auto=false;fortress.systems.externalPlayers=[];fortress.systems.damageEvents=[];}return{...p,formToken,scale,fortress,active:false,defeated:false,elapsed:0};});
  const scale=(1+.35*(stages.loopIndex||0))*(g.players?1.6:1);
  g.finalArena={token:route.token,variant:'trio',formToken:String(route.token)+':trio',phase:'entry',elapsed:0,bosses,hpScale:scale,nextAircraft:11,rewarded:false,previousRegion:g.region};g.zeroDistrict=true;
  clearArenaTraffic(g);pilots(g).forEach((p,i)=>{p.x=(i?1:-1)*90;p.y=0;p.a=-Math.PI/2;p.invuln=Math.max(p.invuln||0,1);});
  g.finalArena.entryPositions=pilots(g).map(p=>({id:p.id||'p1',x:p.x,y:p.y}));if(g.camera){g.camera.x=0;g.camera.y=0;}g.region=0;
  g.event?.('wave','제로 구역 · 잿빛 의회 비밀병기공장');
 }
 return true;
}
function targetBoss(a,e){return finalArenaBosses(a).find(b=>b.id===e.finalArenaBossId&&b.formToken===e.finalArenaFormToken);}
export function finalArenaCollision(g,e,x,y,b={}){
 const boss=targetBoss(g.finalArena,e);
 if(!e.finalArenaTarget||!isFinalArena(g)||g.finalArena.phase!=='battle'||e.hp<=0||!boss?.active||boss.defeated)return false;
 const x0=b.previousX??x,y0=b.previousY??y,dx=x-x0,dy=y-y0,q=clamp(((e.x-x0)*dx+(e.y-y0)*dy)/(dx*dx+dy*dy||1),0,1),r=e.hitRadius+(b.collisionRadius||0)+(b.actualExplosion?b.explosionRadius||0:0);
 return Math.hypot(x0+q*dx-e.x,y0+q*dy-e.y)<=r;
}
export function hitFinalArena(g,e,b,damage){
 const a=g.finalArena,boss=targetBoss(a,e);
 if(!a||a.phase!=='battle'||blocked(g)||!(damage>0)||e.hp<=0||!boss?.active||boss.defeated){recordCombatImpact(b,e,{damage:0,blocked:true});return;}
 const s=boss.fortress,factor=e.finalArenaHpFactor,units=Math.min(damage,e.hp)/factor/a.hpScale;
 const nativeBefore=e.hp/factor/a.hpScale;
 if(boss.variant!=='mobile')damageVariantPart(boss.variant,s,e.finalArenaTarget,units);
 else {
  if(e.finalArenaTarget==='core'||e.finalArenaTarget.startsWith('crawler-'))damageFortress(s,e.finalArenaTarget,units);else damageFortressZone(s,e.finalArenaTarget,units);
  if(!s.effects.some(p=>p.kind==='impact'&&p.source===e.finalArenaTarget&&p.age<.08)){const old=s.effects.filter(p=>p.kind==='impact');if(old.length>=12)s.effects.splice(s.effects.indexOf(old[0]),1);s.effects.push({kind:'impact',source:e.finalArenaTarget,x:e.x/boss.scale,y:e.y/boss.scale,age:0,life:.18});}
 }
 const after=e.finalArenaTarget==='core'?s.coreHp:boss.variant==='mobile'?[...s.guns,...s.crawlers,...s.systems.nozzles,...s.systems.zones].find(p=>p.id===e.finalArenaTarget)?.hp:s.parts.find(p=>p.id===e.finalArenaTarget)?.hp;
 const dealt=Math.max(0,nativeBefore-(after??nativeBefore))*factor*a.hpScale;
 recordCombatImpact(b,e,{damage:dealt,blocked:dealt<=0,partId:e.finalArenaTarget});
 if(s.coreHp<=0)enterFinalArenaVictory(g,boss.id);syncFinalArenaTargets(g);if(dealt>0)g.event?.('impact','');
}
export function syncFinalArenaTargets(g){
 const a=g.finalArena;if(!a)return;
 const previous=new Map(g.enemies.filter(e=>e.finalArenaTarget).map(e=>[e.finalArenaBossId+':'+e.finalArenaTarget,e]));
 g.enemies=g.enemies.filter(e=>!e.finalArenaTarget&&e.zeroDistrictAircraft&&e.hp>0&&!e.bossPilot);
 for(const boss of finalArenaBosses(a)){
  if(!boss.active||boss.defeated||boss.fortress.coreHp<=0)continue;
  const s=boss.fortress,k=boss.scale;
  const defs=boss.variant==='mobile'?[...s.guns.filter(p=>!p.heavy).map(p=>({...p,r:40,maxHp:100})),...s.systems.nozzles.map(p=>({...p,r:38,maxHp:100})),...s.systems.zones.map(p=>({...p,r:p.id==='main'?90:65,maxHp:100})),...s.crawlers.map(p=>({...p,r:90,maxHp:100})),{id:'core',x:512,y:768,hp:s.coreHp,maxHp:100,r:95}].map(p=>{const q=localToWorld(s,p.x,p.y);return{...p,x:q.x*k,y:q.y*k,r:p.r*k};}):listVariantParts(boss.variant,s);
  defs.sort((p,q)=>(p.id==='core')-(q.id==='core')||p.r-q.r);
  for(const p of defs){if(p.hp<=0)continue;const key=boss.id+':'+p.id,factor=(p.id==='core'?8000:1000)/(p.maxHp||p.hp),e=previous.get(key)||{id:boss.formToken+':'+p.id,finalArenaBossId:boss.id,finalArenaTarget:p.id,finalArenaFormToken:boss.formToken,type:'final-fortress',stationary:true,surface:true,combatLayer:'surface',missionTarget:true,speed:0,fire:Infinity,a:0};Object.assign(e,{x:p.x,y:p.y,hp:p.hp*factor*a.hpScale,maxHp:(p.maxHp||p.hp)*factor*a.hpScale,hitRadius:p.r,finalArenaHpFactor:factor});g.enemies.push(e);}
 }
}
function contain(g){for(const p of pilots(g)){const lx=g.players?1125:Math.max(100,Math.min(1125,1300-(g.viewWidth||960)/2)),ly=g.players?1125:Math.max(100,Math.min(1125,1300-(g.viewHeight||700)/2));p.x=clamp(p.x,-lx,lx);p.y=clamp(p.y,-ly,ly);}if(g.camera){const z=g.camera.zoom||1,hx=Math.min(1300,(g.viewWidth||960)/z/2),hy=Math.min(1300,(g.viewHeight||700)/z/2);g.camera.x=clamp(g.camera.x,-1300+hx,1300-hx);g.camera.y=clamp(g.camera.y,-1300+hy,1300-hy);}}
function spawnGuardAircraft(g){if(g.enemies.filter(e=>e.zeroDistrictAircraft&&e.hp>0).length>=4)return;g._finalArenaSpawning=true;let e;try{e=g.spawnEnemy('hunter');}finally{g._finalArenaSpawning=false;}if(!e)return;Object.assign(e,{zeroDistrictAircraft:true,escortPlane:'junkers_d1',bossPilot:null,type:'hunter',x:g.rng()>.5?750:-750,y:-650,a:Math.PI/2,speed:165,hp:150,maxHp:150,fire:1.6});}
// Bounded low-speed patrol: the previous distance>230 stop latched forever.
// Cosine legs reverse only through the existing inertial drivetrain; no position animation.
export function steerFinalArenaFortress(s,elapsed,anchor={x:0,y:0}){
 const x=s.x-anchor.x,y=s.y-anchor.y,cycle=Math.cos(elapsed*Math.PI/24),radial=x*Math.sin(s.a)-y*Math.cos(s.a);
 let drive=Math.abs(cycle)<.18?0:cycle*.45;
 if(Math.hypot(x,y)>205&&drive*radial>0)drive=0;
 if(Math.hypot(x,y)>225)drive=-Math.sign(radial||1)*.25;
 s.drive=drive;s.turn=Math.sin(elapsed*Math.PI/24)*.16;
}
function awardFinalArenaVictory(g,a){
 if(!a.rewarded){a.rewarded=true;achievementPandemoniumClear(g,a.token);if(g.online)g.publishPandemoniumVictory?.({runId:g.stageBoss.runId,token:String(a.token)});g.kills=(g.kills||0)+1;awardPriorityKill(g,{stageBossBody:true});const hero=pilots(g)[0]||g;for(const [i,value] of (g.xpGemSplits?.(36)||[36]).entries())g.drops.push({x:hero.x+Math.cos(i)*50,y:hero.y+Math.sin(i)*50,value,bossReward:true});for(const p of pilots(g)){if(p.hp>0&&(!p.status||p.status==='alive'))p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.2);}g.event?.('wave','판데모니움 격파 · 다음 출격 경로 개방');}
}
export function enterFinalArenaVictory(g,bossId){
 const a=g.finalArena;if(!a||a.phase==='victory')return false;let changed=false;
 for(const boss of finalArenaBosses(a)){
  const s=boss.fortress;if(boss.defeated||s.coreHp>0||bossId&&boss.id!==bossId)continue;
  boss.defeated=true;boss.elapsed=0;changed=true;
  if(boss.variant==='mobile')beginFortressDefeat(s,boss.formToken);else {s.defeat??={token:boss.formToken,elapsed:0};s.defeat.token=boss.formToken;s.hazards=[];s.pending=[];s.damageEvents=[];}
  g.event?.('wave',boss.variant==='mobile'?'기동형 동력로 붕괴':boss.variant==='asymmetric'?'항공갑판형 동력로 붕괴':'군수공장 동력로 붕괴');
 }
 if(finalArenaBosses(a).every(b=>b.defeated)){a.phase='victory';a.elapsed=0;g.enemies=[];g.bullets=[];for(const p of pilots(g))p.invuln=Math.max(p.invuln||0,.2);}
 return changed;
}
export function skipFinalArenaDefeat(g){const a=g.finalArena;if(!a||a.phase!=='victory'||blocked(g))return false;a.elapsed=FORTRESS_DEFEAT_DURATION;for(const b of finalArenaBosses(a))if(b.fortress.defeat)b.fortress.defeat.elapsed=FORTRESS_DEFEAT_DURATION;return true;}
function advanceBossDefeat(b,dt){b.fortress.paused=false;if(b.variant==='mobile')advanceFortressDefeat(b.fortress,dt);else advanceVariantDefeat(b.variant,b.fortress,dt);}
function applyArenaDamage(g,hits,scale){for(const hit of hits){const p=pilots(g).find(p=>(p.id||'p1')===hit.playerId);if(!p||p.hp<=0)continue;const old=p.damageSource;p.damageSource={x:hit.x*scale,y:hit.y*scale,kind:hit.kind||'pandemonium',visual:'pandemonium'};try{if(g.players)g.hitPlayer(p,hit.damage);else g.hit(hit.damage);}finally{p.damageSource=old;}}}
export function tickFinalArena(g,dt){
 if(!beginFinalArena(g))return false;const a=g.finalArena;
 if(a.phase==='entry')for(const p of pilots(g)){const q=a.entryPositions?.find(q=>q.id===(p.id||'p1'));if(q){p.x=q.x;p.y=q.y;}}
 contain(g);if(blocked(g)||!(dt>0))return true;
 if((typeof document!=='undefined'&&g.finalArenaAssetsReady!==true)||(typeof g.finalArenaNetworkReady==='function'&&!g.finalArenaNetworkReady())){a.waitingForAssets=true;for(const p of pilots(g))p.invuln=Math.max(p.invuln||0,.2);return true;}
 a.waitingForAssets=false;a.elapsed+=dt;
 if(a.phase==='entry'){for(const b of a.bosses)b.fortress.paused=true;for(const p of pilots(g))p.invuln=Math.max(p.invuln||0,.2);if(a.elapsed>=FINAL_ARENA.intro){if(!g.stageBoss.stages.startFinalArena(a.token)){a.waitingForQualification=true;return true;}a.waitingForQualification=false;a.phase='battle';a.elapsed=0;g.event?.('wave','판데모니움 · 최종 병기 동시 가동');}return true;}
 if(a.phase==='victory'){
  for(const b of a.bosses)advanceBossDefeat(b,dt);for(const p of pilots(g))p.invuln=Math.max(p.invuln||0,.2);
  if(a.elapsed>=FINAL_ARENA.victory){awardFinalArenaVictory(g,a);g.stageBoss.stages.completeFinalArena(a.token);clearArenaTraffic(g);g.zeroDistrict=false;g.finalArena=null;g.stageBoss.reconcile({blocked:false});g.spawn=3;g.nextHeavyAt=g.t+100;g._zeppelinSchedule=g.t+135;g.eventTimer=25;if(g.rivalAce?.returnAt===Infinity)g.rivalAce.returnAt=g.t+30;}return true;
 }
 const players=pilots(g).filter(p=>p.hp>0&&(!p.status||p.status==='alive')).map(p=>({id:p.id||'p1',x:p.x,y:p.y,hp:p.hp,a:p.a,r:16}));
 for(const b of a.bosses){
  const s=b.fortress;if(b.defeated){advanceBossDefeat(b,dt);continue;}
  if(a.elapsed<b.arrivesAt)continue;
  if(!b.active){b.active=true;s.paused=false;if(s.systems)s.systems.enabled=true;g.event?.('wave',b.variant==='mobile'?'기동형 진입':b.variant==='asymmetric'?'항공갑판형 합류':'이동 군수공장 합류');}
  b.elapsed+=dt;s.paused=false;
  if(s.coreHp<=0){enterFinalArenaVictory(g,b.id);continue;}
  if(b.variant!=='mobile')applyArenaDamage(g,updateVariant(b.variant,s,dt,players),1);
  else {
   s.systems.externalPlayers=players.map(p=>({...p,x:p.x/b.scale,y:p.y/b.scale,radius:32}));
   const focus=s.systems.externalPlayers[Math.floor(b.elapsed/8)%Math.max(1,s.systems.externalPlayers.length)];if(focus)Object.assign(s.systems.player,focus,{auto:false,goal:null});
   steerFinalArenaFortress(s,b.elapsed,{x:b.x/b.scale,y:b.y/b.scale});updateFortressBattle(s,dt);applyArenaDamage(g,s.systems.damageEvents||[],b.scale);s.systems.damageEvents=[];
  }
  s.x=clamp(s.x,(b.x-90)/b.scale,(b.x+90)/b.scale);s.y=clamp(s.y,(b.y-90)/b.scale,(b.y+90)/b.scale);
  if(s.coreHp<=0)enterFinalArenaVictory(g,b.id);
 }
 if(a.phase==='battle'){a.nextAircraft-=dt;if(a.nextAircraft<=0){a.nextAircraft=18;spawnGuardAircraft(g);}}
 for(const e of g.enemies)if(e.zeroDistrictAircraft){if(Math.abs(e.x)>950||Math.abs(e.y)>950)e.a=Math.atan2(-e.y,-e.x);e.x=clamp(e.x,-1100,1100);e.y=clamp(e.y,-1100,1100);}
 syncFinalArenaTargets(g);return true;
}
export function installFinalArenaGuards(Type){
 const P=Type.prototype;if(Object.prototype.hasOwnProperty.call(P,'_finalArenaGuardInstalled'))return;Object.defineProperty(P,'_finalArenaGuardInstalled',{value:true});
 for(const name of ['spawnEnemy','_spnWorld','spawnFlak','spawnMinefield','spawnFieldUnit','spawnFleet','runScheduledAces','tickRivalAce','tickBattleDirector','tickBattlefieldEvents','tickRuralFronts','tickPhotoRecon','tickTransportConvoy','updateSchedules']){const old=P[name];if(typeof old!=='function')continue;P[name]=function(...args){const g=world(this);if(isFinalArena(g)&&(!(name==='spawnEnemy'||name==='_spnWorld')||!g._finalArenaSpawning||args[0]==='boss'))return null;return old.apply(this,args);};}
 const region=P.worldRegion;if(region)P.worldRegion=function(...args){return isFinalArena(this)?0:region.apply(this,args)};
 const collision=P.targetCollision;if(collision)P.targetCollision=function(e,x,y,b){return e?.finalArenaTarget?finalArenaCollision(world(this),e,x,y,b):collision.call(this,e,x,y,b)};
 const suppressed=P.mobSpawnsSuppressed;if(suppressed)P.mobSpawnsSuppressed=function(...args){return isFinalArena(this)||suppressed.apply(this,args)};
}

