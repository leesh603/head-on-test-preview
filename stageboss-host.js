import {resolveSurfaceSpacing} from './naval-spacing.js?v=tame3';

import {tickRegionalConditions} from './region-doctrine1.js?v=tame3';

import {createGallipoliRoute,tickGallipoliRoute,gallipoliPoint,GALLIPOLI_ROUTE} from './gallipoli-route.js?v=tame3&rail=18';
import {handleMaanCue} from './maan-view.js?v=tame3';
import {tickLondonBattle,handleLondonCue,londonRiverCover} from './london-battle.js?v=tame3';
import {tickParisBattle,handleParisCue} from './paris-night-battle.js?v=tame3';
import {tickVerdunBattle,handleVerdunCue} from './verdun-battle.js?v=tame3';
import {StageBossAddon,normalSpawnInterval} from './headon-stageboss-runtime.js?v=tame3&rail=18';
import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=tame3&rail=18';
import {bossSoundFor} from './boss-feedback.js?v=tame3&hints=1&rail=18';
import {waterBarrierDisplacement} from './headon-stageboss-render.js?v=tame3&rail=1';
import {advanceCambraiBug} from './cambrai-bug-flight.js?v=tame3';
import {tickMaanWeather,maanSandCover} from './maan-weather.js?v=tame3';


import {createJutlandRoute,tickJutlandRoute,jutlandPoint,JUTLAND_ROUTE} from './jutland-route.js?v=tame3';
export const STAGE_NAMES=['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항','캉브레 들판','아라스 상공','솜 강전선','런던 대공습','베르됭','마안 전투','갈리폴리 전선','1918 파리 야간공습','유틀란트 해전'];
export const STAGE_BOSS_BALANCE=Object.freeze({distance:12000,deadline:90,spawnFactor:.55});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const players=g=>g.players||[g];
const formationDefenders=g=>[...(g.patrols||[])].filter(a=>a&&a.life>0&&(a.hp===undefined||a.hp>0));
function formationDefenderId(g,a){if(!a.stageBossTargetId){g._stageBossTargetSerial129=(g._stageBossTargetSerial129||0)+1;a.stageBossTargetId=`formation-defender-${g._stageBossTargetSerial129}`;}return a.stageBossTargetId;}
function formationDefenderFrame(g,a){
 if(a.hp===undefined){a.maxHp??=72;a.hp=a.maxHp;a.invuln??=0;a.hitFlash??=0;}
 return{id:formationDefenderId(g,a),alive:a.life>0&&a.hp>0,x:a.x,y:a.y,a:a.a,vx:Math.cos(a.a)*(a.speed||185),vy:Math.sin(a.a)*(a.speed||185),radius:16,formationDefender:true};
}
function formationDefenderTarget(g,e){
 if(!['jasta-formation','black-flight-formation'].includes(e.behavior)){const live=[...(g.patrols||[]),...(g.allies||[])].filter(a=>a&&a.life>0&&(a.hp===undefined||a.hp>0));let p=live.find(a=>formationDefenderId(g,a)===e.formationTargetId);if(!p)p=live.reduce((best,a)=>!best||Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(best.x-e.x,best.y-e.y)?a:best,null);e.formationTargetId=p?formationDefenderId(g,p):null;return p;}
 const leader=g.stageBoss?.stages.encounter?.bodies.get(e.escortLeaderId);if(leader?.entryComplete){e.formationTargetId=null;return null;}
 const bounds=stageBossBounds(g),live=formationDefenders(g).filter(a=>a.x>bounds.left+36&&a.x<bounds.right-36&&a.y>bounds.top+100&&a.y<bounds.bottom-60&&(!leader?.entryRoster||leader.entryRoster.includes(formationDefenderId(g,a))));const candidates=leader?.kind==='naval10-black-flight'?live.filter(a=>formationDefenderId(g,a)!==leader.formationOrder?.finisherId):live;
 if(!candidates.length){e.formationTargetId=null;return null;}
 let target=candidates.find(a=>formationDefenderId(g,a)===e.formationTargetId);
 if(!target){target=candidates.reduce((best,a)=>!best||Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(best.x-e.x,best.y-e.y)?a:best,null);e.formationTargetId=formationDefenderId(g,target);}
 return target;
}
export const ZEEBRUGGE_ROUTE=Object.freeze({outerHarbor:4200,innerHarbor:10000,fortS:12580,fortN:110,seaHalfWidth:1150,halfWidth:920,backLimit:-420,approachLimit:12270,bossLimit:13600});
const smooth=(a,b,s)=>{const t=clamp((s-a)/(b-a),0,1);return t*t*(3-2*t)};
export const harborRouteHalfWidth=s=>ZEEBRUGGE_ROUTE.seaHalfWidth-(ZEEBRUGGE_ROUTE.seaHalfWidth-ZEEBRUGGE_ROUTE.halfWidth)*smooth(ZEEBRUGGE_ROUTE.outerHarbor,ZEEBRUGGE_ROUTE.innerHarbor,s);
export function harborBankOffset(s,side){
 const base=side>0?1350-500*smooth(ZEEBRUGGE_ROUTE.outerHarbor,ZEEBRUGGE_ROUTE.innerHarbor,s)-38*smooth(10000,12200,s):1450-380*smooth(7200,11200,s);
 return base+Math.sin(s*.00074+side*1.9)*13+Math.sin(s*.00183-side*.8)*5;
}
function createHarborRoute(g){return{x:g.x,y:g.y,a:Number.isFinite(g.a)?g.a:-Math.PI/2,maxForward:0,bankAt:harborBankOffset}}
export function constrainHarborRoute(g){
 const route=g.navalRoute;if(g.stageBoss?.stages.stageIndex!==7||!route)return;
 const hx=Math.cos(route.a),hy=Math.sin(route.a),nx=-hy,ny=hx;
 const limit=g.stageBoss.stages.phase==='explore'?ZEEBRUGGE_ROUTE.approachLimit:ZEEBRUGGE_ROUTE.bossLimit;
 for(const p of players(g)){
  const dx=p.x-route.x,dy=p.y-route.y,s=clamp(dx*hx+dy*hy,ZEEBRUGGE_ROUTE.backLimit,limit),halfWidth=harborRouteHalfWidth(s),n=clamp(dx*nx+dy*ny,-halfWidth,halfWidth);
  p.x=route.x+hx*s+nx*n;p.y=route.y+hy*s+ny*n;
 }
}
const alive=p=>p.hp>0&&(!p.status||p.status==='alive');
const blocked=g=>g.state!=='playing'||!!g.pendingLevelUps?.length;
export function stageBossBounds(g){const z=g.camera?.zoom||1,w=(g.viewWidth||960)/z,h=(g.viewHeight||700)/z;return {left:g.x-w/2,right:g.x+w/2,top:g.y-h/2,bottom:g.y+h/2};}
export function stageBossSpeed(p){let factor=1;for(const s of p.bossStatuses?.values()||[])factor=Math.min(factor,s.speedFactor??1);return factor;}
export function stageSpawnInterval(g,interval){return normalSpawnInterval(interval,{bossPresent:g.stageBoss?.stages.phase==='boss',factor:g.stageBoss?.stages.stageIndex===12?.22:STAGE_BOSS_BALANCE.spawnFactor});}

export function enableStageBoss(g,{teamFaction,heavyHp=1}={}){
 if(g.mode==='campaign'||g.stageBoss)return g.stageBoss;
 g.stageStartDistance=g.distance||0;g.stageStartTime=g.t;g.bossBuildings=[];g.bossCues=[];g.navalRouteCues=new Set();g.navalApproachAt=null;g.navalRoute=null;
 const hitPlayer=(id,damage,source)=>{if(blocked(g))return;const defender=formationDefenders(g).find(a=>formationDefenderId(g,a)===id);if(defender){if((g.patrols||[]).includes(defender))g.hitPatrol(defender,damage);else g.hitFormationAlly?.(defender,damage);return;}const p=players(g).find(p=>(p.id||'p1')===id);if(!p||!alive(p))return;const percent=({'rail-shell':.06,'rail-shell-outer':.045,'alps-cannon':.05,'torpedo-charge':.05,'zubian-mortar':.04,'carpet-bomb':.04,'observer-shell':.04,'black-flak':.03})[source?.visual]||0,finalDamage=damage+p.maxHp*percent;if(g.players)g.hitPlayer(p,finalDamage);else g.hit(finalDamage);if(source?.visual==='torpedo-charge'){g.combatBlast(p.x,p.y,54,'enemy','mineBlast');g.shake=Math.max(g.shake,10);}else if(source?.visual==='zubian-shell')g.combatBlast(p.x,p.y,24,'enemy','pop');};
 const hooks={
  getTuning({bossId}){
   // Reuse the current ace HP/time growth and current heavy coop multiplier once.
   const loop=g.stageBoss?.stages.loopIndex||0,stage=g.stageBoss?.stages.stageIndex||0;
   const density=loop===0?({0:.55,1:.7,2:.85}[stage]??1):1;
   const maxHp=Math.round(2100*(1+g.t/150)*(1+1.2*loop+.35*loop*loop))*heavyHp;
   const bossTuning={
    'paris-gun':{warningSeconds:1.15,railCycle:5.4,railMoveSeconds:3.6,shellCount:6,barrageInterval:.26,hpScale:.72},
    lincomparable:{warningSeconds:1.4,railCycle:5.8,railMoveSeconds:3.6,hpScale:.72},
    'sms-stuttgart':{launchInterval:1.8,fireScale:.62,suppressiveInterval:1.9},
    'hms-zubian':{broadsideInterval:.75/density,mortarInterval:1.3,chargeInterval:1.85,suppressiveInterval:1.8/density},
    'zeppelin-l70':{engineInterval:5.6,engineShotCount:3,suppressiveInterval:2.6,suppressiveCount:6,gasInterval:5.4},
    hma23:{launchInterval:4.8,panicInterval:5.8},
    gik:{suppressiveInterval:2.4,suppressiveCount:6,rearFinalInterval:.48},
    'livens-flame-projector':{flameInterval:4.4},
    'minenwerfer-battery':{mortarInterval:1.9}
    ,'armored-harbor-fortress':{coastalInterval:1.8,craneInterval:3.4,harborLaunchInterval:4}
    ,'mark4-wedge':{geometryScale:1,mobileBoss:false,coreRadius:70}
    ,'morser-battery':{geometryScale:1.1,mobileBoss:false,motionMultiplier:0,coreRadius:84}
    ,'london-apron-raid':{geometryScale:1,mobileBoss:false,motionMultiplier:0,coreRadius:64}
    ,'gotha-squadron':{geometryScale:1,mobileBoss:false,motionMultiplier:1,coreRadius:34}
    ,'staaken-rvi':{geometryScale:1,mobileBoss:false,coreRadius:62}
    ,'london-searchlight':{geometryScale:1,mobileBoss:false,motionMultiplier:0,coreRadius:70}
    ,'flak-tower':{geometryScale:1,mobileBoss:false,motionMultiplier:0,coreRadius:150}
    ,'fort-douaumont':{geometryScale:1,mobileBoss:false,motionMultiplier:0}
    ,'fort-souville':{geometryScale:1,mobileBoss:false,motionMultiplier:0}
    ,'wustenpanzer':{geometryScale:1,mobileBoss:false,coreRadius:108}
    ,'jutland-grand-fleet':{geometryScale:1,mobileBoss:false,motionMultiplier:1}
    ,'gallipoli-fortress':{geometryScale:1,mobileBoss:false,motionMultiplier:0,coreRadius:115}
    ,'paris-staaken-rvi':{geometryScale:.56,mobileBoss:false,motionMultiplier:1,coreRadius:45,partHp:maxHp*.065}
    ,'paris-searchlight-fortress':{geometryScale:1,mobileBoss:false,motionMultiplier:1,coreRadius:55,partHp:maxHp*.055}
    ,'sinai-landship':{geometryScale:1,mobileBoss:false,coreRadius:120}
   }[bossId]||{};
   const effHp=Math.round(maxHp*(bossTuning.hpScale||1));
   return {regionalViewWidth:g.viewWidth||960,regionalViewHeight:g.viewHeight||700,regionalPlayerY:g.y,loopIndex:loop,projectileDensity:density,maxHp:effHp,partHp:effHp*.12,damage:Math.round(18*(1+g.t/240)*(1+Math.min(.5,loop*.12))),bulletSpeed:270,coreRadius:150,
    mobileBoss:true,motionMultiplier:Math.min(2.5,1+loop*.25),patternMultiplier:Math.min(3,1.4+loop*.35),geometryScale:2.025,splitProtection:5,fireInterval:4,waterInterval:2.8,launchInterval:2.2,enrageInterval:.85,broadsideInterval:1.4/density,mortarInterval:1.35,chargeInterval:2,suppressiveInterval:2.3/density,suppressiveCount:8,
    parts:{truss:{x:24,y:-80},muzzle:{x:0,y:-92},hangar:{x:0,y:38},crane:{x:42,y:-25},
     front:{x:0,y:-86},rear:{x:0,y:91},left:{x:-57,y:0},right:{x:57,y:0}},...bossTuning};
  },
  onDamage:hitPlayer,
  onStatus(id,status){const p=players(g).find(p=>(p.id||'p1')===id);if(!p||!alive(p)||blocked(g))return;p.bossStatuses??=new Map();p.bossStatuses.set(status.sourceId,{...status,remaining:status.seconds});},
  onBarrierContact(id,h){const p=players(g).find(p=>(p.id||'p1')===id);if(!p||!alive(p)||blocked(g))return;const x=p.x,y=p.y,d=waterBarrierDisplacement({...p,radius:12},h);p.x+=d.x;p.y+=d.y;if(g.players)g.constrainMove(p,x,y);},
  spawnMinion(spec){
   const n=g.enemies.length;let result;g.bossMechanicSpawn=true;g._escortSummon=true;try{result=g.spawnEnemy(spec.minion==='airship'?'zeppelin':spec.minion==='autocannon'?'bomber':'hunter')}finally{g.bossMechanicSpawn=false;g._escortSummon=false}const e=result||g.enemies[g.enemies.length-1];if(g.enemies.length===n||!e)return;
   Object.assign(e,{id:spec.id,encounterId:spec.encounterId,faction:spec.faction,bossMinion:true,behavior:spec.behavior,
    x:spec.x,y:spec.y,escortPlane:spec.plane||(spec.minion==='seaplane'||spec.minion==='seaplane-central'?'hansa_brandenburg_cc':spec.minion==='seaplane-entente'?'macchi_m5':spec.minion==='sopwith-camel'?'camel':spec.minion==='airship'?undefined:spec.faction==='central'?'albatros':'sopwith'),
    surface:spec.minion==='autocannon',stationary:spec.minion==='autocannon',groundEscort:spec.minion==='autocannon',a:spec.minion==='autocannon'?(spec.vx<0?Math.PI:0):(spec.a??e.a),vx:spec.vx||0,life:spec.life??(spec.behavior==='attack-pass'?6.2:spec.minion==='airship'?90:18),fire:spec.fire??1.2,
    passTargetX:spec.passTargetX,passTargetY:spec.passTargetY,formationIndex:spec.formationIndex,formationCount:spec.formationCount,supportInvulnUntil:g.t+(spec.invulnerableSeconds||0),
    escortLeaderId:spec.leaderId,rearGunner:!!spec.rearGunner,maxSpeed:spec.maxSpeed,formationRole:spec.formationRole,formationSide:spec.formationSide,formationRank:spec.formationRank,
    pairId:spec.pairId,callSign:spec.callSign,callSignKo:spec.callSignKo,name:spec.name||spec.callSign||e.name,visualScale:spec.visualScale,missionTarget:!!spec.persistent});
   if(spec.hp){e.hp=e.maxHp=Math.round(spec.hp*heavyHp);e.coopHpApplied=heavyHp;}
   if(spec.minion==='bug'){
    Object.assign(e,{bugDrone:true,hp:Math.max(12,Math.round(e.maxHp*.4)),maxHp:Math.max(12,Math.round(e.maxHp*.4)),speed:spec.speed||178,fire:Infinity,launchAge:0,launchSeconds:spec.launchSeconds||.6,launchHeading:spec.launchHeading??spec.a??-Math.PI/2,launchPortId:spec.launchPortId,contactDamage:spec.contactDamage??18,bugTargetX:spec.passTargetX,bugTargetY:spec.passTargetY,bugAge:0});
    if(Number.isFinite(e.bugTargetX)&&Number.isFinite(e.bugTargetY))g.bossCues.push({type:'bug-flight-target',minionId:e.id,x:e.bugTargetX,y:e.bugTargetY,sourceX:e.x,sourceY:e.y,life:Math.hypot(e.bugTargetX-e.x,e.bugTargetY-e.y)/e.speed+.2});
   }
   if(spec.minion==='gallipoli-interceptor')Object.assign(e,{gallipoliInterceptor:true,launchAge:0,launchSeconds:1.2,launchHeading:spec.a,speed:190});
   if(spec.minion==='airship')Object.assign(e,{summonDone:true,bossAirship:true,hp:Math.round(e.maxHp*.5),maxHp:Math.round(e.maxHp*.5),fire:2.6,speed:Math.max(e.speed||0,95)});
  },
  countMinions(id){return g.enemies.filter(e=>e.encounterId===id&&e.bossMinion&&!e.bossAirship&&e.hp>0).length;},
  formationStatus(id){return g.enemies.filter(e=>e.encounterId===id&&e.bossMinion&&e.hp>0).map(e=>({id:e.id,role:e.formationRole,pairId:e.pairId,x:e.x,y:e.y}));},
  onBuildingImpact(event){const b=g.bossBuildings.find(b=>!b.destroyed&&Math.abs(event.x-b.x)<=b.w/2+8&&Math.abs(event.y-b.y)<=b.h/2);if(!b)return false;b.destroyed=true;g.combatBlast(b.x,b.y,55,'enemy','structure');return true;},
  onCue(event){
   if(event.type==='formation-shot'){g.bullets.push({x:event.x,y:event.y,vx:Math.cos(event.angle)*event.speed,vy:Math.sin(event.angle)*event.speed,life:2,enemy:true,visualType:'boss',damage:event.damage,encounterId:event.encounterId,formationBoss129:true,sourceBossId:event.bossId});g.event('enemyShot','');return;}
   if(event.type==='formation-engaged')g.event('wave','아군 편대 격추 · 정예 편대와 교전');
   if(event.type==='formation-final-order')g.event('wave',event.name+' · 예고선 밖으로 선회!');
   if(event.type==='carrier-sortie-orders')redirectStuttgartSortie(g.enemies,event);
   const body=g.stageBoss?.stages.encounter?.bodies.get(event.bossId);
   if(handleVerdunCue(g,event))return;
   if(handleMaanCue(g,event,body))return;
   handleLondonCue(g,event);
   handleParisCue(g,event);
   const x=event.x??body?.x??g.x,y=event.y??body?.y??g.y;
   if(event.type==='treffas-breakthrough'){g.event('wave','거륜 돌파 · 진격로 측면으로 회피');g.shake=Math.max(g.shake,1.5);}
   if(event.type==='flieger-final-raid')g.event('wave','최후의 폭탄기 공습 · 발진차를 파괴해 출격 저지');
   if(event.type==='livens-pressure-rise'){g.shake=Math.max(g.shake,2);g.event('wave','지면 진동 · 매설 노즐의 압력 상승');}
   if(event.type==='livens-soil-burst'){g.shake=Math.max(g.shake,3);}
   if(event.type==='minenwerfer-final-order'){g.event('wave','최후의 포격 명령 · 번호 순서대로 착탄');g.shake=Math.max(g.shake,2);}
   if(event.type==='trench-discovered'){g.event('wave','지역 보스 발견 · '+BOSS_CATALOG[body?.kind]?.name);}
   const sound=bossSoundFor(event,body?.kind||event.bossId);if(sound)g.event('bossSound',sound);
   if(event.type==='city-mine-lane'&&body?.kind==='drachen-net')for(const f of g.hostileMinefields||[])if(f.encounterId===event.encounterId)for(const m of f.mines)if(Math.abs((m.targetX??m.x)-event.x)<event.width/2){m.dead=true;m.chainHandled=true;}
   if(event.type==='spawn-minefield'){
    g.hostileMinefields??=[];
    const owned=g.hostileMinefields.filter(f=>f.encounterId===g.stageBoss?.stages.encounter?.id);
    let existing=owned.reduce((n,f)=>n+f.mines.filter(m=>!m.dead).length,0);
     for(const f of owned)for(const m of f.mines){if(existing+event.points.length<=event.maxMines)break;if(!m.dead){m.dead=true;m.chainHandled=true;existing--;}}
    const deploying=Number.isFinite(event.sourceX)&&Number.isFinite(event.sourceY);
    const mines=event.points.map(p=>({x:deploying?event.sourceX:p.x,y:deploying?event.sourceY:p.y,targetX:p.x,targetY:p.y,hp:18,dead:false,bossMine:true,deploying,chainHandled:false,...(event.dropMode==='harbor-vertical'?{triggerRadius:36}:null)}));
    if(mines.length){const mx=mines.reduce((n,m)=>n+m.x,0)/mines.length,my=mines.reduce((n,m)=>n+m.y,0)/mines.length;
      g.hostileMinefields.push({x:mx,y:my,radius:Math.max(60,...mines.map(m=>Math.hypot(m.x-mx,m.y-my)+20)),
        warning:event.warning,life:event.life,region:g.worldRegion(),mines,fuse:event.fuse??null,fuseAge:0,fuseTag:null,deploySeconds:deploying?(event.deploySeconds||event.warning):0,deployAge:0,dropMode:event.dropMode,sourcePartId:event.sourcePartId,sourceBossId:event.bossId,sourceX:event.sourceX,sourceY:event.sourceY,encounterId:g.stageBoss.stages.encounter.id});}
   }
    if(event.type==='boss-enter'){g.event('wave','지역 보스 출현! · '+BOSS_CATALOG[event.bossId].name);g.event('heavyShot','');}
    else if(event.type==='aa-effect'){(g.aaEffects??=[]).push({x:event.x,y:event.y,age:0,life:event.life||.5,size:event.size||115,kind:event.kind});}
    else if(event.type==='hazard-activated'&&event.kind==='circle'&&(['morser-shell','mark4-shell','treffas-shell'].includes(event.visual)||event.visual==='carpet-bomb'&&['staaken-rvi','gik','ca4'].includes(body?.kind))){g.shake=Math.max(g.shake,3);}
    else if(event.type==='hazard-activated'&&event.visual==='harbor-swing'){
      // The attached payload remains intact throughout the physical sweep.
    }
    else if(event.type==='hazard-activated'&&event.kind==='circle'&&(event.visual?.startsWith('aa-')||event.visual==='city-flak-shell'||event.visual==='drachen-fuse'||event.visual?.startsWith('somme-')||event.visual?.startsWith('rural-rail-')||event.visual==='black-flak'&&['fliegerzug','treffas-wagen'].includes(body?.kind))){
      // Authored AA atlas draws these effects; do not stack a generic blast.
    }
    else if(event.type==='hazard-activated'&&event.visual==='gallipoli-shell'){g.shake=Math.max(g.shake,3);}
    else if(event.type==='hazard-activated'&&event.kind==='circle'){
    const SHELL_VISUALS=new Set(['rail-shell','rail-shell-outer','observer-shell','zubian-mortar','naval-gun','alps-cannon','black-flak','zubian-shell','coastal-shell','building-debris']),sea=[1,7].includes(g.worldRegion?.()??-1);
    g.combatBlast(event.x,event.y,event.radius,'enemy',event.visual==='carpet-bomb'?'bomb':event.visual==='torpedo-charge'?'mineBlast':SHELL_VISUALS.has(event.visual)?(sea?'mineBlast':'shell'):'blast');
    if(sea&&SHELL_VISUALS.has(event.visual)){const effect=g.combatFX?.at(-1);if(effect)effect.fxSource='navalShell'}
    // The shared hazard renderer already animates this ground impact. Avoid a
    // second aerial fireball on top, while preserving all original events.
    if(['minenwerfer-heavy','minenwerfer-shell'].includes(event.visual)){const effect=g.combatFX?.at(-1);if(effect)effect.mortarOverlay=true}}
   else if(event.type==='internal-explosion'&&['morser-battery','london-searchlight','flak-tower-cell','ca4'].includes(body?.kind)){g.combatBlast(x,y,80,'enemy','structure');g.shake=Math.max(g.shake,8);}
   else if(event.type==='part-destroyed'){const part=body?.parts.get(event.partId),minen=body?.kind==='minenwerfer-battery',apron=body?.kind==='london-apron';g.combatBlast(x+(part?.x||0),y+(part?.y||0),apron?22*body.apronScale:minen?34:46,'enemy','structure');g.shake=Math.max(g.shake,apron?3:minen?5:7);
     if(['a7v-flak','mark-v-cruiser','drachen-net'].includes(body?.kind))(g.aaEffects??=[]).push({x:x+(part?.x||0),y:y+(part?.y||0),age:0,life:.9,size:90,kind:'aaWreckSmoke'});}
   else if(event.type==='ammo-cookoff'){g.combatBlast(event.x,event.y,82,'enemy','structure');if(g.burst)g.burst(event.x,event.y,'#ffbb62',10);if(g.smoke){g.smoke(event.x-18,event.y+8,true);g.smoke(event.x+22,event.y-5,true)}g.shake=Math.max(g.shake,9);}
   else if(event.type==='harbor-crane-disabled'){for(const f of g.hostileMinefields||[])if(f.sourceBossId===event.bossId&&f.sourcePartId==='crane-arm')for(const m of f.mines)if(m.deploying){m.dead=true;m.chainHandled=true;}}
   else if(event.type==='ammo-detonation'){g.combatBlast(event.x,event.y,105,'enemy','structure');g.shake=Math.max(g.shake,12);g.event('wave','항구요새 탄약고 유폭 · 기뢰 보급 중단·포격 약화');}
   else if(event.type==='rail-car-detached'){g.combatBlast(event.x,event.y,58,'enemy','structure');g.shake=Math.max(g.shake,8);
    for(let i=0;i<4;i++){const ox=(g.rng?g.rng()-.5:Math.random()-.5)*120,oy=(i-1.5)*55+(g.rng?g.rng()-.5:Math.random()-.5)*30,r=24+((i*37)%3)*14;g.combatBlast(event.x+ox,event.y+oy,r,'enemy','structure');if(g.burst)g.burst(event.x+ox,event.y+oy,'#ffd06a',6);if(g.smoke)g.smoke(event.x+ox,event.y+oy,true)}
    g.event('wave','열차 객차 파괴 · 기관차 방호 약화');}
   else if(event.type==='rail-runaway'){g.event('wave','기관차 폭주! · 선로에서 이탈하기 전에 추격하세요');g.shake=Math.max(g.shake,6);}
   else if(event.type==='bruno-iron-rain'){g.event('wave','철의 폭우 · 착탄 순서를 벗어나 급선회!');g.shake=Math.max(g.shake,6);}
   else if(event.type==='heavy-gun-fired'&&event.railArtillery&&body?.kind==='lincomparable'){g.shake=Math.max(g.shake,5);}
   else if(event.type==='lincomparable-last-520'){g.event('wave','520mm 최후 포격 · 중심 이탈 후 충격파 안쪽으로!');g.shake=Math.max(g.shake,6);}
   else if(event.type==='rail-derail'){g.combatBlast(x,y,96,'enemy','structure');g.shake=Math.max(g.shake,12);g.event('wave','기관차 탈선 · 최종 코어 노출');}
   else if(event.type==='body-defeated'&&event.kind?.startsWith('hms-zubian-')){g.combatBlast(x,y,82,'enemy','bossFinal');g.shake=Math.max(g.shake,10);}
    else if(event.type==='mine-chain'){(g.aaEffects??=[]).push({x:event.x,y:event.y,age:0,life:.52,kind:event.chainIndex?'aaChainBurst':'aaMineBurst'});
     g.shake=Math.max(g.shake,6);for(const e of g.enemies)if(e.hp>0&&!e.stageBossBody&&Math.hypot(e.x-event.x,e.y-event.y)<(event.radius||72))e.hp-=65;
     g.stageBoss?.hitAt({x:event.x,y:event.y,radius:event.radius||72,damage:65,faction:g.teamFaction});}
   else if(['split','misfire'].includes(event.type)){g.combatBlast(x,y,event.type==='split'?78:92,'enemy','structure');g.shake=Math.max(g.shake,8);}
   else if(event.type==='boss-destruction-start'){g.event('wave',BOSS_CATALOG[event.bossId].name+' 붕괴 중!');g.shake=Math.max(g.shake,8);if(['zeppelin-l70','hma23'].includes(event.bossId))for(const b of event.bodies||[])g.wreckGust(b);}
   else if(event.type==='boss-destruction-pulse'){g.combatBlast(event.x,event.y,event.radius,'enemy',event.final?'bossFinal':'structure');g.shake=Math.max(g.shake,event.final?13:8);}
   else if(event.type==='heavy-gun-fired'){g.shake=Math.max(g.shake,event.railArtillery?(event.heavy?6:2.8):7);}
    else if(event.type==='muzzle'&&['london-apron','drachen-net'].includes(body?.kind)){(g.aaEffects??=[]).push({x:event.x,y:event.y,age:0,life:.12,size:23*body.cityArtScale,kind:'aaMuzzle'});}
    else if(event.type==='muzzle'&&(body?.gallipoliBoss||event.bossId==='gallipoli-approach')){g.shake=Math.max(g.shake,event.partId?.startsWith('aa-')?1:3);}
    else if(event.type==='muzzle'&&body?.sommeBoss){g.shake=Math.max(g.shake,2);}
    else if(event.type==='muzzle'){if(['a7v-flak','mark-v-cruiser','fliegerzug','treffas-wagen','mark4-wedge','morser-battery','staaken-rvi','london-searchlight'].includes(body?.kind))(g.aaEffects??=[]).push({x:event.x,y:event.y,age:0,life:.23,size:44,kind:'aaMuzzle'});
     else g.burst(event.x,event.y,'#ffe0a2',12);g.shake=Math.max(g.shake,3);}
   else if(event.type==='camera-shake')g.shake=Math.max(g.shake,event.strength||5);
   else if(['safe-corridor','bug-launch-warning','bug-launch','searchlight-lock'].includes(event.type))g.bossCues.push({...event,life:event.seconds});
   else if(event.type==='charge-warning'||event.type==='reentry-warning')g.bossCues.push({...event,life:event.seconds});
   else if(event.type==='rail-aim')g.bossCues.push({...event,targetX:event.target.x,targetY:event.target.y,life:event.seconds});
   else if(event.type==='cannon-aim')g.bossCues.push({...event,targetX:event.x+Math.cos(event.angle)*event.length,targetY:event.y+Math.sin(event.angle)*event.length,life:1.7});
   else if(event.type==='gas-zone'){(g.gasZones??=[]).push({x:event.x,y:event.y,r:event.radius||130,warning:1.6,life:event.life||9});}
   else if(event.type==='phase-change')g.event('bossPhase',event.phase);
  },
  onEncounterCleared({id,bossId}){
   const fortresses=[...g.stageBoss?.stages.encounter?.bodies.values()||[]].filter(b=>b.fortressBoss);
   if(fortresses.length)g.verdunWrecks=[...(g.verdunWrecks||[]),...fortresses];
   if(g.londonBattle){g.londonBattle.cleared=true;if(g.londonBattle.role==='defend')for(const d of g.londonBattle.districts.filter(d=>d.hp>0))(g.drops||=[]).push({x:d.x,y:d.y,value:24,bossReward:true});}
   if(g.parisBattle)g.parisBattle.cleared=true;
   g.kills++;g.priorityKills=(g.priorityKills||0)+1;const owner=players(g).find(p=>(p.id||'p1')===g.stageBossLastOwner);if(g.players&&owner)owner.kills++;
   g.event('kill','');g.event('wave',BOSS_CATALOG[bossId].name+' 격파 · 다음 지역 진입');
   const hero=players(g)[0]||g;for(let i=0;i<9;i++){const a=i*.7;(g.drops||=[]).push({x:hero.x+Math.cos(a)*70,y:hero.y+Math.sin(a)*70,value:16,heal:i===0,bossReward:true})}
  },
  onStageChange({stageIndex,loopIndex}){if(g.gallipoliRoute)g.stageBoss.hazards.clear(g.gallipoliRoute.encounterId);g.maanStartX=g.x;g.jutlandRoute=stageIndex===16?createJutlandRoute(g):null;g.gallipoliRoute=stageIndex===14?createGallipoliRoute(g):null;g.verdunWrecks=[];g.verdunBattle=null;g.londonBattle=null;g.enemies=g.enemies.filter(e=>!e.londonOwned);const previousRegion=g.region;g.region=stageIndex;g.stageStartDistance=g.distance||0;g.stageStartTime=g.t;g.clearRegionalHazards();g.bossBuildings=[];g.bossCues=[];g.navalRouteCues=new Set();g.navalApproachAt=null;g.navalRoute=stageIndex===7?createHarborRoute(g):null;
   // A fresh map starts clean: leftover stragglers must not be sitting on top
   // of the player at the transition moment.
   g.enemies=g.enemies.filter(e=>e.missionTarget||e.stageBossBody||e.navalVessel||e.heavyBomber);
   if(stageIndex===9){const reserved=new Set(['baron','collishaw']);g.enemies=g.enemies.filter(e=>!reserved.has(e.bossPilot));g.bossDeck=(g.bossDeck||[]).filter(id=>!reserved.has(id));if(reserved.has(g.rivalAce?.pilot)){g.rivalAce.active=null;g.rivalAce.returnAt=Infinity;g.rivalAceNotice=null;}}
   g.bullets=g.bullets.filter(b=>!b.enemy);
   if(previousRegion!==undefined&&previousRegion!==stageIndex)g.events.push({type:'regionTransition',region:stageIndex,previousRegion,text:STAGE_NAMES[stageIndex]});g.event('wave',STAGE_NAMES[stageIndex]+' · '+(loopIndex+1)+'회차');},
   clearEncounterOwned(id){g.enemies=g.enemies.filter(e=>e.encounterId!==id);g.bullets=g.bullets.filter(b=>b.encounterId!==id);g.hostileMinefields=(g.hostileMinefields||[]).filter(f=>f.encounterId!==id);g.aaEffects=[];for(const p of players(g))for(const [key,s] of p.bossStatuses||[])if(s.encounterId===id)p.bossStatuses.delete(key);g.bossCues=[];}
 };
 g.stageBoss=new StageBossAddon({runId:g.runId||globalThis.crypto?.randomUUID?.()||'solo-'+Date.now(),teamFaction,hooks,rng:g.rng});
 return g.stageBoss;
}

// Thin combat targets share body state. They never run the old enemy AI or rewards.
export function syncStageBossTargets(g){
 const encounter=g.stageBoss?.stages.encounter,bodies=encounter?.bodies;
 g.enemies=g.enemies.filter(e=>!e.stageBossBody||bodies?.get(e.stageBossBody.id)===e.stageBossBody&&!e.stageBossBody.dead);
 const incoming=[...bodies?.values()||[]].filter(body=>!body.dead&&!g.enemies.some(e=>e.stageBossBody===body));
 if(incoming.length)g.reserveEnemySlots(incoming.length);
 for(const body of bodies?.values()||[]){if(body.dead||g.enemies.some(e=>e.stageBossBody===body))continue;
  const e={stageBossBody:body,encounterId:encounter.id,id:body.id,type:'stageBoss',faction:body.faction,stationary:true,surface:!body.jutlandAirship,missionTarget:true,a:-Math.PI/2,speed:0,fire:Infinity};
  const synced=['x','y','hp','maxHp'];if(Number.isFinite(body.a))synced.push('a');
  for(const key of synced)Object.defineProperty(e,key,{enumerable:true,get:()=>body[key]});g.enemies.push(e);
 }
}
export function stageBossCollision(g,e,x,y,b){const body=e.stageBossBody;if(!body)return null;if(blocked(g)||body.dead||g.stageBoss?.stages.encounter?.bodies.get(body.id)!==body)return false;return !!body.locateHit({x,y,previousX:b?.previousX??x,previousY:b?.previousY??y,radius:b?.collisionRadius||0});}
export function damageStageBoss(g,e,b,damage){
 const notify=(target,pos)=>{for(const p of g.players||[g])p.identityImpact?.(b,e,target,pos)};
 if(b.identityDotTarget&&b.identityDotTarget!==e&&!e.stageBossBody)return;
 if(!e.stageBossBody){if(e.bossPilot==='berthold'){if(e.hp<=e.maxHp*.5)damage*=.75;if(e.ironWillUntil>g.t)damage*=.35;}e.hp-=damage;notify(e,e);return;}
 if(blocked(g)||b.patrol)return;const body=e.stageBossBody;
 const hit=body.locateHit({x:b.x,y:b.y,previousX:b.previousX,previousY:b.previousY,radius:b.collisionRadius||0});if(!hit)return;
 const part=hit.partId?body.parts.get(hit.partId):null,target=part||body;if(b.identityDotTarget&&b.identityDotTarget!==target)return;
 const result=g.stageBoss.hit({bodyId:body.id,...hit,damage,faction:g.teamFaction});
 if(result.damage>0){const raw=part&&body.support129?.parts.get(part.id),pos=raw?body.support129.world(raw.nx,raw.ny):{x:body.x+(part?.x||0),y:body.y+(part?.y||0)};notify(target,pos);}
 if(result.damage>0){g.stageBossLastOwner=b.ownerId||'p1';
  if(body.fortressBoss){if(g.t>=(body.impactSmokeAt??-Infinity)){body.impactSmokeAt=g.t+.12;g.smoke?.(b.x,b.y,false);}g.event('impact','');}
 }
}
function steerFormationMinion(e,tx,ty,dt,turnRate,speed){
 const a=Math.atan2(ty-e.y,tx-e.x),delta=Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a));e.a+=clamp(delta,-turnRate*dt,turnRate*dt);
 const distance=Math.hypot(tx-e.x,ty-e.y),pace=Math.min(e.maxSpeed||speed,Math.max(speed*.72,distance*1.35));e.x+=Math.cos(e.a)*pace*dt;e.y+=Math.sin(e.a)*pace*dt;
}
const nxOr=o=>-Math.sin(o.playerHeading),nyOr=o=>Math.cos(o.playerHeading);
function updateFormationMinion(g,e,p,leader,dt){
 const order=leader?.formationOrder;if(!order)return false;
 if(order.phase==='formation-arrival'){
  const i=e.formationIndex||0,black=e.behavior==='black-flight-formation',last=order.leaderFinisher;
  const lead=Math.min(.65,Math.hypot(p.x-e.x,p.y-e.y)/430),off=black&&order.age<2.4?(e.formationSide||1)*(e.formationRank?90:55):order.age<1.15?(i-1.5)*34:0;
  const tx=p.x+Math.cos(p.a)*(last?-150:lead*(p.speed||185))-Math.sin(p.a)*off,ty=p.y+Math.sin(p.a)*(last?-150:lead*(p.speed||185))+Math.cos(p.a)*off;
  const bounds=stageBossBounds(g),outside=e.x<bounds.left+35||e.x>bounds.right-35||e.y<bounds.top+100||e.y>bounds.bottom-75;
  steerFormationMinion(e,outside?clamp(p.x,bounds.left+50,bounds.right-50):tx,outside?clamp(p.y,bounds.top+120,bounds.bottom-100):ty,dt,outside?3.2:black?2.6:2.2,last?160:230);e.arrivalHold=last||!p.stageBossTargetId;return true;
 }
 if(order.phase==='formation-recovery'){steerFormationMinion(e,leader.x-Math.cos(leader.a)*(100+e.formationIndex*35)-Math.sin(leader.a)*(e.formationSide||1)*85,leader.y-Math.sin(leader.a)*(100+e.formationIndex*35)+Math.cos(leader.a)*(e.formationSide||1)*85,dt,1.6,160);e.raidFire=false;return true;}
 if(order.finalRoles){
  const pairLive=e.behavior!=='black-flight-formation'||(leader.formationStatus129?.()||[]).filter(w=>w.pairId===e.pairId).length===2;
  const index=pairLive?order.finalRoles.indexOf(e.formationRole):-1,start=4.5+index*1.8,age=order.age;
  e.raidFire=false;
  if(index<0||age<start||age>start+1.8){const bounds=stageBossBounds(g),span=Math.min(150,(bounds.right-bounds.left)*.28),side=e.formationSide||1;steerFormationMinion(e,p.x+nxOr(order)*side*span+Math.cos(order.playerHeading)*(130+e.formationRank*60),p.y+nyOr(order)*side*span+Math.sin(order.playerHeading)*(130+e.formationRank*60),dt,2.8,230);return true;}
  if(!e.raidLock){e.raidLock={x:p.x+(Math.cos(p.a)*(p.speed||0))*1.55,y:p.y+(Math.sin(p.a)*(p.speed||0))*1.55};g.bossCues.push({type:'reentry-warning',x:e.x,y:e.y,targetX:e.raidLock.x,targetY:e.raidLock.y,life:1.2,seconds:1.2,formationAim:true,minionId:e.id});}
  if(age<start+1.2)steerFormationMinion(e,e.raidLock.x,e.raidLock.y,dt,3,150);
  else{e.raidHeading??=e.a;e.a=e.raidHeading;e.x+=Math.cos(e.a)*235*dt;e.y+=Math.sin(e.a)*235*dt;e.raidFire=true;}
  return true;
 }const h=order.playerHeading??p.a??-Math.PI/2,hx=Math.cos(h),hy=Math.sin(h),nx=-hy,ny=hx,side=e.formationSide||1,rank=e.formationRank||0;
 let tx,ty,turn=2.45,speed=e.behavior==='black-flight-formation'?210:205;
 if(e.behavior==='jasta-formation'){
  if(order.phase==='encirclement'){const lateral=210+rank*92,forward=rank?125:45;tx=p.x+hx*forward+nx*side*lateral;ty=p.y+hy*forward+ny*side*lateral;turn=2.25;}
  else if(order.phase==='echelon-assault'){const back=110+Math.max(0,leader.liveWingmen().findIndex(w=>w.role===e.formationRole))*72;tx=p.x-hx*back+nx*side*34;ty=p.y-hy*back+ny*side*34;turn=2.75;speed=222;}
  else if(order.phase==='concentrated-assault'){const commit=order.age>2.1+(e.formationIndex||0)*.22,back=commit?-95:205-rank*35;tx=p.x-hx*back+nx*side*(135-rank*24);ty=p.y-hy*back+ny*side*(135-rank*24);turn=commit?3.2:2.45;speed=commit?232:210;}
  else{tx=leader.x-Math.cos(leader.a)*(115+rank*45)-Math.sin(leader.a)*side*(78+rank*45);ty=leader.y-Math.sin(leader.a)*(115+rank*45)+Math.cos(leader.a)*side*(78+rank*45);turn=2.65;speed=218;}
  e.pairComplete=true;
 }else if(e.behavior==='black-flight-formation'){
  const status=leader.formationStatus129?.()||[],pairComplete=status.filter(w=>w.pairId===e.pairId).length===2,pairSide=e.pairId==='a'?-1:1;e.pairComplete=pairComplete;
  if(!pairComplete){tx=leader.x-Math.cos(leader.a)*(150+rank*55)-Math.sin(leader.a)*pairSide*105;ty=leader.y-Math.sin(leader.a)*(150+rank*55)+Math.cos(leader.a)*pairSide*105;turn=1.75;speed=188;e.regrouping=true;}
  else if(order.phase==='pair-split'){tx=p.x+nx*pairSide*255+hx*(rank?105:-55);ty=p.y+ny*pairSide*255+hy*(rank?105:-55);turn=2.15;speed=205;e.regrouping=false;}
  else if(order.phase==='bait-hunter'){const hunter=e.formationRole?.endsWith('hunter'),forward=hunter?(order.age<2.6?-180:100):(order.age<1.1?140:-100),lateral=pairSide*(hunter?110:70);tx=p.x+hx*forward+nx*lateral;ty=p.y+hy*forward+ny*lateral;turn=hunter?3.15:2.45;speed=hunter?235:212;e.regrouping=false;}
  else if(order.phase==='cross-attack'){const delay=e.pairId==='b'?1.05:0,through=order.age>delay+1.5?1:-1,lateral=pairSide*through*300,stagger=rank?75:-45;tx=p.x+nx*lateral+hx*stagger;ty=p.y+ny*lateral+hy*stagger;turn=3;speed=232;e.regrouping=false;}
  else{tx=p.x+nx*pairSide*(235+rank*45)-hx*(80+rank*65);ty=p.y+ny*pairSide*(235+rank*45)-hy*(80+rank*65);turn=2.35;speed=210;e.regrouping=false;}
 }
 const bounds=stageBossBounds(g);tx=clamp(tx,bounds.left+42,bounds.right-42);ty=clamp(ty,bounds.top+110,bounds.bottom-75);
 steerFormationMinion(e,tx,ty,dt,turn,speed);return true;
}
// Reuse the existing attack-pass aircraft instead of exceeding the six-plane cap.
export function redirectStuttgartSortie(enemies,event){
 const flight=enemies.filter(e=>e.bossMinion&&e.encounterId===event.encounterId&&e.hp>0&&e.behavior==='attack-pass'&&e.escortPlane==='hansa_brandenburg_cc');
 const start=(event.wave*2)%Math.max(1,flight.length);
 for(let i=0;i<Math.min(2,flight.length);i++){const e=flight[(start+i)%flight.length];Object.assign(e,{passLocked:false,passAge:0,passTargetX:event.targetX,passTargetY:event.targetY,fire:.9+i*.18,life:Math.max(e.life||0,3.5)});}
 return Math.min(2,flight.length);
}
function updateMinions(g,dt){
 for(const e of g.enemies){if(!e.bossMinion||e.hp<=0)continue;e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);const formation=e.behavior==='jasta-formation'||e.behavior==='black-flight-formation',p=formationDefenderTarget(g,e)||g.enemyCombatTarget(e);if(!p||p.hp<=0)continue;
  e.life=(e.life??18)-dt;if(e.life<=0){e.hp=0;continue}
   if(e.behavior==='bug-strike'){
    if(advanceCambraiBug(e,dt)){
      for(const target of players(g))if(alive(target)&&Math.hypot(e.x-target.x,e.y-target.y)<39){
        if(g.players)g.hitPlayer(target,e.contactDamage);else g.hit(e.contactDamage);}
      e.hp=0;g.combatBlast(e.x,e.y,42,'enemy','mineBlast');
    }
    continue;
   }
  if(e.gallipoliInterceptor&&e.launchAge<e.launchSeconds){e.launchAge=Math.min(e.launchSeconds,e.launchAge+dt);e.a=e.launchHeading;e.x+=Math.cos(e.a)*120*dt;e.y+=Math.sin(e.a)*120*dt;continue;}
  if(e.surface){e.x+=e.vx*dt;e.a=e.vx<0?Math.PI:0;const viewH=g.viewHeight||640,floorY=g.y+viewH*.34;e.y=Math.max(e.y,floorY);}else if(e.behavior==='attack-pass'){
   e.passAge=(e.passAge||0)+dt;if(!e.passLocked){const a=Math.atan2((e.passTargetY??p.y)-e.y,(e.passTargetX??p.x)-e.x);e.a=a;e.passLocked=true;e.speed=Math.max(205,e.speed||0);}
   const lane=((e.formationIndex||0)-((e.formationCount||1)-1)/2)*9;e.x+=Math.cos(e.a)*e.speed*dt-Math.sin(e.a)*Math.sin(e.passAge*2.2)*lane*dt;e.y+=Math.sin(e.a)*e.speed*dt+Math.cos(e.a)*Math.sin(e.passAge*2.2)*lane*dt;
  }else if(e.behavior==='jasta-formation'||e.behavior==='black-flight-formation'){
   const leader=g.stageBoss?.stages.encounter?.bodies.get(e.escortLeaderId);
   if(!leader||leader.dead)e.behavior='chase';else updateFormationMinion(g,e,p,leader,dt);
  }else if(e.behavior==='circus-escort'||e.behavior==='pusher-escort'){
   const pusher=e.behavior==='pusher-escort';
   const leader=g.stageBoss?.stages.encounter?.bodies.get(e.escortLeaderId);
   if(leader&&!leader.dead){
    // Slot astern of the leader, spread laterally: a living formation, not a
    // conga line. Pusher rings are wider and slower.
    const k=(e.formationIndex||0)-((e.formationCount||2)-1)/2,back=pusher?150:95,side=k*(pusher?125:92),la=leader.a??-Math.PI/2;
    const tx=leader.x-Math.cos(la)*back-Math.sin(la)*side,ty=leader.y-Math.sin(la)*back+Math.cos(la)*side;
    const a=Math.atan2(ty-e.y,tx-e.x),delta=Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a));
    e.a+=clamp(delta,-(pusher?1.4:2.6)*dt,(pusher?1.4:2.6)*dt);
    const want=Math.hypot(tx-e.x,ty-e.y),spd=Math.min(e.maxSpeed||e.speed||(pusher?150:210),Math.max(pusher?90:170,want*1.1));
    e.x+=Math.cos(e.a)*spd*dt;e.y+=Math.sin(e.a)*spd*dt;
   }else{e.behavior='chase'}
  }else{const a=Math.atan2(p.y-e.y,p.x-e.x),delta=Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a));e.a+=clamp(delta,-2*dt,2*dt);e.x+=Math.cos(e.a)*e.speed*dt;e.y+=Math.sin(e.a)*e.speed*dt;}
  const aim=Math.atan2(p.y-e.y,p.x-e.x),rel=Math.atan2(Math.sin(aim-(e.a||0)),Math.cos(aim-(e.a||0))),pd=Math.hypot(p.x-e.x,p.y-e.y);
  const leader=g.stageBoss?.stages.encounter?.bodies.get(e.escortLeaderId),order=leader?.formationOrder;
  const paired=e.behavior!=='black-flight-formation'||e.pairComplete;
  const hunter=e.formationRole?.endsWith('hunter'),phaseReady=order?.phase==='cross-attack'?order.age>(e.pairId==='b'?3:0)&&order.age<(e.pairId==='b'?6:2.5):order?.phase==='bait-hunter'?(hunter?order.age>2.6&&order.age<4.6:order.age>1.1&&order.age<2.3):true;
  if(formation&&e.behavior==='black-flight-formation'&&paired&&phaseReady&&order?.phase==='bait-hunter'&&hunter&&e.hunterWarnCycle!==Math.round((leader.aceCycle-order.age)*10)){e.hunterWarnCycle=Math.round((leader.aceCycle-order.age)*10);g.bossCues.push({type:'reentry-warning',x:e.x,y:e.y,targetX:p.x,targetY:p.y,life:.8,seconds:.8});e.fire=Math.max(e.fire,.8);}
  if(formation)e.muzzleFlash=Math.max(0,(e.muzzleFlash||0)-dt);
  const arrival=formation&&order?.phase==='formation-arrival',finale=formation&&!!order?.finalRoles;
  const gated=e.behavior==='attack-pass'?e.passAge>.65&&e.passAge<3.4:e.behavior==='circus-escort'?Math.abs(rel)<.62&&pd<580:e.behavior==='pusher-escort'?pd<600:formation?(arrival?!e.arrivalHold&&order.age>1.15&&Math.abs(rel)<.22&&pd<470:finale?e.raidFire:order?.phase!=='formation-recovery'&&!e.regrouping&&paired&&phaseReady&&Math.abs(rel)<.2&&pd<620):true;
  e.fire-=dt;if(e.fire<=0&&gated){if(formation)e.muzzleFlash=.08;e.fire=arrival?.18:finale?.3:e.surface ? 1.5 : e.type==='zeppelin' ? 3.4 : e.behavior==='attack-pass' ? .48 : e.behavior==='jasta-formation' ? (order?.phase==='echelon-assault'?.78:.98) : e.behavior==='black-flight-formation' ? (order?.phase==='cross-attack'?.76:1.02) : e.behavior==='circus-escort' ? 1.05 : e.behavior==='pusher-escort' ? 1.45 : 2.5;const a=formation||e.behavior==='attack-pass'?e.a:aim;const zep=e.type==='zeppelin',rear=e.rearGunner&&Math.abs(rel)>1.9;const shots=zep?3:rear?2:1;for(let j=0;j<shots;j++){const aa=a+(formation?0:(j-1)*(zep?.14:.08)),mx=e.x+(formation?Math.cos(e.a)*28:0)+(zep?Math.cos(e.a)*(j-1)*60:rear?-Math.cos(e.a)*24:0),my=e.y+(formation?Math.sin(e.a)*28:0)+(zep?Math.sin(e.a)*(j-1)*60:rear?-Math.sin(e.a)*24:0);g.bullets.push({x:mx,y:my,vx:Math.cos(aa)*(formation?430:zep?185:210),vy:Math.sin(aa)*(formation?430:zep?185:210),life:zep?5:4,enemy:true,visualType:zep?'zeppelin':e.surface?'flak':'fighter',damage:Math.round((zep?14:9)*(1+g.t/240)),encounterId:e.encounterId,formationBoss129:formation||undefined,sourceMinionId:formation?e.id:undefined});}}
 }
}
export function beginStageBossFrame(g,dt){
 const addon=g.stageBoss;if(!addon||blocked(g)||dt<=0)return;
 addon.reconcile({blocked:false});
 for(const p of players(g))for(const [id,s]of p.bossStatuses||[]){s.remaining-=dt;if(s.remaining<=0||!alive(p))p.bossStatuses.delete(id);}
 g.bossCues=g.bossCues.filter(c=>(c.life-=dt)>0&&(c.type!=='bug-flight-target'||g.enemies.some(e=>e.id===c.minionId&&e.hp>0)));
 tickLondonBattle(g,dt);tickParisBattle(g,dt);tickVerdunBattle(g,dt);tickMaanWeather(g,dt);tickRegionalConditions(g,dt);if(blocked(g))return;
 // Warning-phase mines physically travel from the winch to their final slots;
 // collision stays disabled until they settle, and pause freezes both clocks.
 for(const field of g.hostileMinefields||[])if(field.encounterId&&field.deploySeconds>0){
  const vertical=field.dropMode==='harbor-vertical';if(vertical)field.deployAge=(field.deployAge||0)+dt;
  const q=clamp(vertical?field.deployAge/field.deploySeconds:1-field.warning/field.deploySeconds,0,1),ease=vertical?q*q:q*q*(3-2*q);
  for(const m of field.mines)if(!m.dead){m.x=field.sourceX+(m.targetX-field.sourceX)*ease;m.y=field.sourceY+(m.targetY-field.sourceY)*ease-(vertical?0:Math.sin(q*Math.PI)*32);m.deploying=q<1;}
  if(q>=1)field.deploySeconds=0;
 }
 tickGallipoliRoute(g,dt);tickJutlandRoute(g);
 const stage=addon.stages.stageIndex,naval=stage===1||stage===7||stage===16;
 let route=stage===7?g.navalRoute:null;
 if(stage===7&&!route)route=g.navalRoute=createHarborRoute(g);
 if(route){const hx=Math.cos(route.a),hy=Math.sin(route.a),forward=(g.x-route.x)*hx+(g.y-route.y)*hy;route.maxForward=Math.max(route.maxForward||0,forward);}
 const travel=stage===16?g.jutlandRoute.maxForward:stage===14?g.gallipoliRoute.maxForward:stage===7?Math.max(0,route.maxForward||0):(g.distance||0)-g.stageStartDistance,stageDistance=stage===14?GALLIPOLI_ROUTE.fort:STAGE_BOSS_BALANCE.distance,progress=Math.max(0,Math.min(1,travel/stageDistance));
 if(naval&&stage!==16&&(addon.stages.phase==='explore'||stage===7&&addon.stages.phase==='boss')){
  const messages=stage===7?[[.35,'군항 외곽 진입 · 방파제 수로를 따라 전진'],[.72,'내항 접근 · 우현 부두를 따라 전진'],[.91,'항만 중심부 진입 · 우현 요새 포대 확인']]:[[.12,'연안 이탈 · 함대 수색 개시'],[.46,'외해 진입 · 적 수상기 활동 포착'],[.76,'수평선에 적 군함 실루엣 확인']];
  g.navalRouteCues??=new Set();for(const [mark,message]of messages)if(progress>=mark&&!g.navalRouteCues.has(mark)){g.navalRouteCues.add(mark);g.event('wave',message);}
 }
 const ready=travel>=stageDistance*(stage===7?.78:1)||(stage!==7&&stage!==14&&stage!==16&&g.t-g.stageStartTime>=STAGE_BOSS_BALANCE.deadline);
 if(addon.stages.phase==='explore'&&ready){
  // Aces fight before the regional boss: pull the scheduled ace wave forward
  // the moment the boss gate opens, then hold the boss entry until the ace's
  // arrival cut-in has played out so the two cut-ins never collide.
  const liveAce=(g.enemies||[]).find(e=>e.hp>0&&e.bossPilot&&!e.expired);
  if(!liveAce&&Number.isFinite(g.nextBossAt)&&g.nextBossAt>g.t){g.nextBossAt=g.t;g._aceGateAt=g.t;}
  const aceAt=liveAce?(liveAce.aceSpawnT??g.t):g._aceGateAt;
  if(aceAt==null||g.t-aceAt>=6.5){
  if(naval&&!g.navalApproachAt){g.navalApproachAt=g.t;g.event('wave',stage===16?'경고 · 북해 전투전대 접근 / 함대 선회에 주의':stage===7?'경고 · 장갑 항구요새 전면 도달':'경고 · 적 주력함이 전방에서 접근 중');g.event('heavyShot','');}
  // Harbor is an installed structure: reveal it along the existing approach,
  // at the same authored quay coordinates, instead of materializing after it.
  if(stage===7||!naval||g.t-g.navalApproachAt>=5.2){
   const bounds=stageBossBounds(g),alpine=stage===6,rail=['paris-gun','lincomparable','fliegerzug'].includes(addon.stages.bossId);
   let x,y;
   if(stage===7&&route){
    // The illustrated central quay sits inside the right shoreline at this
    // point. Anchor the fortress on its concrete pier, clear of open water.
    const hx=Math.cos(route.a),hy=Math.sin(route.a),nx=-hy,ny=hx,along=ZEEBRUGGE_ROUTE.fortS;
    x=route.x+hx*along+nx*ZEEBRUGGE_ROUTE.fortN;y=route.y+hy*along+ny*ZEEBRUGGE_ROUTE.fortN;
   }else if(stage===1){const heading=Number.isFinite(g.a)?g.a:-Math.PI/2,forward=Math.min(200,(bounds.bottom-bounds.top)*.26);x=g.x+Math.cos(heading)*forward;y=g.y+Math.sin(heading)*forward;
   }else if(stage===16){const p=jutlandPoint(g.jutlandRoute,JUTLAND_ROUTE.fleet);x=p.x;y=p.y;
   }else if(stage===14){const p=gallipoliPoint(g.gallipoliRoute,GALLIPOLI_ROUTE.fort);x=p.x;y=p.y;
   }else if(stage===13){x=g.x;y=g.y-Math.min(340,(bounds.bottom-bounds.top)*.42);
   }else if(stage===8&&addon.stages.bossId==='treffas-wagen'){
    x=g.x;y=bounds.top-210;g.event('bossSound','armorEntry');g.event('wave','거대한 바퀴의 진동 · 들판 전방에 육상전함 접근');
   }else if(stage===8&&addon.stages.bossId==='fliegerzug'){
    // The consist backs in on its existing vertical rail: even the rear car
    // starts beyond the viewport, then the launch wagons physically cross it.
    x=g.x;y=bounds.top-1260;g.event('bossSound','trainApproach');g.event('wave','철로 위 무장열차 접근 · 발진 객차를 확인하세요.');
   }else{
    const structure=stage===3||stage===12;
    const distantMortar=stage===3&&addon.stages.bossId==='minenwerfer-battery';
    const forward=distantMortar?Math.max(680,(bounds.bottom-bounds.top)*.95+180):naval?Math.max(520,Math.min(760,(bounds.bottom-bounds.top)*1.05)):structure?Math.max(520,Math.min(700,(bounds.bottom-bounds.top)*.95)):rail?Math.max(460,Math.min(650,(bounds.bottom-bounds.top)*.82)):0;
    const heading=Number.isFinite(g.a)?g.a:-Math.PI/2;
    x=g.x+(alpine?105:(naval||rail||structure)?Math.cos(heading)*forward:0);
    y=g.y+(alpine?-Math.max(165,Math.min(180,(bounds.bottom-bounds.top)*.24)):(naval||rail||structure)?Math.sin(heading)*forward:stage===4?0:stage===10?-Math.min(90,(bounds.bottom-bounds.top)*.12):-Math.min(180,(bounds.bottom-bounds.top)*.22));
   }
   const entered=addon.startBoss({x,y});if(stage===14&&g.gallipoliRoute.preview){const b=[...entered.bodies.values()][0];for(const p of b.parts.values())p.angle=g.gallipoliRoute.preview.parts.get(p.id).angle;addon.hazards.clear(g.gallipoliRoute.encounterId);}g.navalApproachAt=null;g._aceGateAt=null;
  }
  }
 }
 // Heavy ambient hazards pause in the introductory boss encounter; aircraft and
 // ace schedules continue, with bounded admission and reduced reinforcement rate.
 if(addon.stages.phase==='boss'&&addon.stages.loopIndex===0){
  for(const key of ['fieldUnitTimer','regionThreat','flakTimer'])if(g[key]!==Infinity)g[key]=Math.max(g[key]||0,dt+.1)+dt;
  for(const key of ['nextHeavyAt','_zeppelinSchedule'])if(g[key]!==Infinity)g[key]=Math.max(g[key]||0,g.t+dt+.1)+dt;
 }
 if(addon.stages.stageIndex===9&&addon.stages.phase==='boss'){const b=[...addon.stages.encounter.bodies.values()][0];if(!b.entryComplete&&!b.entryRoster&&formationDefenders(g).length<2&&!b.patrolRequested){b.patrolRequested=true;g.spawnPatrol();}}
 syncStageBossTargets(g);separateLargeBossBodies(g);updateMinions(g,dt);
 const arrival=[...addon.stages.encounter?.bodies.values()||[]].find(b=>b.formationBoss129&&!b.entryComplete);if(arrival?.entryRoster)g.patrolTimer=Math.max(g.patrolTimer||0,dt+.1)+dt;
}
export function separateLargeBossBodies(g){
 // Aircraft remain passable. Only surface traffic yields to ship hulls.
 if(!blocked(g))resolveSurfaceSpacing(g);
}
export function endStageBossFrame(g,dt){
 separateAces(g,dt);
 const addon=g.stageBoss;if(!addon)return;
 constrainHarborRoute(g);
 if(addon.stages.phase==='sky-ace'&&g.skyChampion?.hp<=0){
  addon.stages.encounter={id:'sky-ace-'+addon.serial++,completed:true};addon.stages.phase='clear-pending';
  const next=addon.stages.advance(blocked(g));if(next){g.skyChampion=null;addon.hooks.onStageChange(next);}return;
 }
 if(g.state==='lost'||g.state==='won'){addon.dispose();return;}
 const activeEncounter=addon.stages.encounter;
  for(const effect of g.aaEffects||[])effect.age+=dt;
  g.aaEffects=(g.aaEffects||[]).filter(e=>e.age<e.life);
  const owned=activeEncounter?(g.hostileMinefields||[]).filter(f=>f.encounterId===activeEncounter.id):[];
  for(const field of owned)if(field.fuse!=null&&!blocked(g)){
   field.fuseAge+=dt;
   if(!field.fuseTag&&field.fuseAge>=field.fuse-.95){
    const mine=field.mines.find(m=>!m.dead);if(mine){field.fuseTag=activeEncounter.id+':fuse:'+addon.hazards.serial;
     addon.hazards.spawn({kind:'circle',encounterId:activeEncounter.id,bossId:field.sourceBossId,x:mine.targetX??mine.x,y:mine.targetY??mine.y,radius:58,warning:.95,duration:.25,once:true,damage:24,visual:'drachen-fuse',tag:field.fuseTag});}
   }
   if(field.fuseTag&&field.mines.every(m=>m.dead)&&!field.fuseDetonated)addon.hazards.clearTagged(activeEncounter.id,field.fuseTag);
   if(field.fuseAge>=field.fuse){field.fuseDetonated=true;for(const mine of field.mines)if(!mine.dead){mine.dead=true;mine.chainHandled=false;}}
  }
  const mines=owned.flatMap(f=>f.mines);
  const queue=mines.filter(m=>m.dead&&!m.chainHandled);
  for(let i=0;i<queue.length&&i<32;i++){
   const mine=queue[i];if(mine.chainHandled)continue;mine.chainHandled=true;
   for(const next of mines)if(!next.dead&&!next.deploying&&Math.hypot(next.x-mine.x,next.y-mine.y)<=86){next.dead=true;queue.push(next);}
   addon.hooks.onCue({type:'mine-chain',chainIndex:i,bossId:activeEncounter.bodies.values().next().value?.id,x:mine.x,y:mine.y,radius:72});
  }
 // The host has already resolved its entire upgrade queue/loss state this frame.
 const bounds=stageBossBounds(g),playerFrames=players(g).map(p=>({id:p.id||'p1',alive:alive(p),x:p.x,y:p.y,a:p.a,vx:Number.isFinite(p.previousX)?(p.x-p.previousX)/Math.max(dt,1/120):addon.stages.stageIndex===9?Math.cos(p.a)*(p.speed||0)*(p.airframeSpeed??1):0,vy:Number.isFinite(p.previousY)?(p.y-p.previousY)/Math.max(dt,1/120):addon.stages.stageIndex===9?Math.sin(p.a)*(p.speed||0)*(p.airframeSpeed??1):0,radius:12,londonRiver:addon.stages.stageIndex===11&&londonRiverCover(p.x,p.y)}));
 const defenderFrames=addon.stages.stageIndex===9?(g.patrols||[]).map(a=>formationDefenderFrame(g,a)):[];
 if(addon.stages.stageIndex===13)for(const p of playerFrames)p.sandCover=maanSandCover(g.maanWeather,p.x,p.y);
 const frame={paused:blocked(g),players:playerFrames,defenders:defenderFrames,defenderLosses:g.patrolLosses||0,bounds,peaks:g.alpsMountains?.query(bounds)||[],buildings:g.bossBuildings,londonTargets:g.londonBattle?.districts||[],parisTargets:g.parisBattle?.districts||[]};
 addon.tick(dt,frame);addon.reconcile({blocked:blocked(g)});separateLargeBossBodies(g);syncStageBossTargets(g);
  // No invisible composite-sized apron collision. Wire hazards and mines are
  // the actual dangerous geometry, and destroyed sections leave open air.
 if(g.state==='lost')addon.dispose();
}
// Shared by solo and co-op; bounded lateral clearance without changing aim/HP.
export function separateAces(g,dt){
 if(blocked(g)||dt<=0)return;
 const aces=g.enemies.filter(e=>e.hp>0&&!e.stationary&&((e.bossPilot&&!e.stageBossBody)||(e.bossMinion&&['jasta-formation','black-flight-formation'].includes(e.behavior))));
 for(const b of g.stageBoss?.stages.encounter?.bodies.values()||[])if(b.formationBoss129&&!b.dead)aces.push(b);
 const limit=100*Math.min(dt,.04);
 for(let i=0;i<aces.length;i++)for(let j=i+1;j<aces.length;j++){
  const a=aces[i],b=aces[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  const formation=a.formationBoss129||b.formationBoss129||a.bossMinion||b.bossMinion;const gap=formation?64:Math.max(82,(a.hitRadius||34)+(b.hitRadius||34)+14);if(d>=gap)continue;
  if(d<.001){dx=Math.cos(a.a+Math.PI/2);dy=Math.sin(a.a+Math.PI/2);d=1;}
  const move=Math.min(limit,(gap-d)/2),ux=dx/d,uy=dy/d;
  a.x-=ux*move;a.y-=uy*move;b.x+=ux*move;b.y+=uy*move;
 }
}
