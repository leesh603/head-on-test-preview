import {activeFronts,tickRuralFronts} from './rural-fronts.js';
import {achievementMission} from './achievements.js?v=medals2';
import {doverFlightBounds} from './dover-patrol-chart.js?v=dover3';
import {GALLIPOLI_ROUTE} from './gallipoli-route.js?v=gal1&rail=42&ai=1018&sig=1019&boss=20261020b&phase=1021';
import {JUTLAND_ROUTE} from './jutland-route.js?v=gal1';
import {ZEEBRUGGE_ROUTE,harborRouteHalfWidth} from './stageboss-host.js?v=merge20261017&ai=1018&sig=1019&boss=20261020b&phase=1021&adriaticart=20261022&cambrai=20261021&cityart=20261022&harbor=20261021&somme=20261021';

export const BATTLEFIELD_EVENT_TYPES=Object.freeze({
 HIGH_VALUE_TARGET:'HIGH_VALUE_TARGET',RESCUE:'RESCUE',BOMBER_INTERCEPT:'BOMBER_INTERCEPT',ACE_CHALLENGE:'ACE_CHALLENGE',PHOTO_RECON:'PHOTO_RECON',RECON_ESCORT:'RECON_ESCORT',SUPPLY_RECOVERY:'SUPPLY_RECOVERY'
});

export const BATTLEFIELD_EVENT_BALANCE=Object.freeze({
 firstOfferAt:8,regionOfferSpread:4,cooldownMin:120,cooldownMax:165,retryDelay:8,rescueDuration:18,objectiveTimeout:70,bossReserve:3,bomberExitDistance:980,rescueThreatRange:260,rescueThreatDamage:9,compactWidth:720,compactDangerCap:7,dangerCap:10,reconCount:5,reconCountCompact:4,reconRadius:130,reconMinGap:280,reconHold:1,reconTimeout:90
});

const TYPES=Object.values(BATTLEFIELD_EVENT_TYPES);
const P=BATTLEFIELD_EVENT_TYPES;
const liveAce=game=>(game.enemies||[]).some(e=>e.hp>0&&!e.expired&&!e.rivalEscaped&&(e.bossPilot||e.type==='boss'));
const scriptedBoss=game=>game.stageBoss?.stages?.phase==='boss';
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;
const crossRegionSupport=key=>key==='rescue'||key==='airSupport';
const regionKey=game=>`${game.stageCombatWindow?.loopIndex??0}:${game.stageCombatWindow?.stageIndex??game.worldRegion?.()}:${game.worldRegion?.()}`;
const missionWindow=type=>type===P.PHOTO_RECON?28:[P.ACE_CHALLENGE,P.BOMBER_INTERCEPT].includes(type)?24:20;

function reconPoint(game,p,x,y){
 const region=game.worldRegion?.(),margin=BATTLEFIELD_EVENT_BALANCE.reconRadius,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 if(region===17){
  const b=doverFlightBounds(game),clearance=margin+Math.max(360,Math.min(800,(p.speed||200)*2.1));
  const ix=Math.min(clearance,(b.right-b.left)/2),iy=Math.min(clearance,(b.bottom-b.top)/2);
  return{x:clamp(x,b.left+ix,b.right-ix),y:clamp(y,b.top+iy,b.bottom-iy)};
 }
 const route=region===7?game.navalRoute:region===14?game.gallipoliRoute:region===16?game.jutlandRoute:null;
 if(!route)return{x,y};
 const limits=region===7?ZEEBRUGGE_ROUTE:region===14?GALLIPOLI_ROUTE:JUTLAND_ROUTE,hx=Math.cos(route.a),hy=Math.sin(route.a),dx=x-route.x,dy=y-route.y;
 const end=region===7&&game.stageBoss?.stages.phase==='explore'?limits.approachLimit:limits.bossLimit;
 const s=clamp(dx*hx+dy*hy,limits.backLimit+margin,end-margin),halfWidth=region===7?harborRouteHalfWidth(s):limits.halfWidth,n=clamp(-dx*hy+dy*hx,-halfWidth+margin,halfWidth-margin);
 return{x:route.x+hx*s-hy*n,y:route.y+hy*s+hx*n};
}

function eventState(game){
 const state=game.battlefieldEvents??=(game.battlefieldEvents={serial:0,current:null,lastType:null,history:[],result:null}),key=regionKey(game);
 if(state.regionKey!==key){
  const initial=state.regionKey==null;
  state.regionKey=key;state.regionEnteredAt=game.stageStartTime??(initial?0:game.t||0);
  state.nextOfferAt=state.regionEnteredAt+BATTLEFIELD_EVENT_BALANCE.firstOfferAt+(initial?0:(game.rng?.()??Math.random())*BATTLEFIELD_EVENT_BALANCE.regionOfferSpread);
 }
 return state;
}

function dangerCount(game){
 const p=playerFor(game),w=(game.viewWidth||960)*.72,h=(game.viewHeight||700)*.72;
 return(game.enemies||[]).filter(e=>e.hp>0&&Math.abs(e.x-p.x)<w&&Math.abs(e.y-p.y)<h).length;
}

function canOffer(game){
 const state=eventState(game);
 if(activeFronts(game).length)return false;
 if(game.mode==='campaign'||game.state!=='playing'||(game.t||0)<state.nextOfferAt||(game.t||0)<(game.battleRecoveryUntil||0)||state.current)return false;
 if(scriptedBoss(game)||liveAce(game)||game.eliteEnemies?.active)return false;
 if(game.stageCombatWindow?.approaching||game.stageCombatWindow?.ready||!availableTypes(game).length)return false;
 // Ordinary formations must not starve objectives as combat density rises.
 return true;
}

function availableTypes(game){
 const remaining=game.stageCombatWindow?.remaining;
 return TYPES.filter(type=>(!Number.isFinite(remaining)||remaining>=missionWindow(type)+BATTLEFIELD_EVENT_BALANCE.bossReserve)&&(type!==P.ACE_CHALLENGE||!game.availableAcePilots||game.availableAcePilots().length>0));
}

function chooseType(game,state,preferred){
 const eligible=availableTypes(game);
 if(TYPES.includes(preferred))return eligible.includes(preferred)?preferred:null;
 const available=eligible.filter(type=>type!==state.lastType),pool=available.length?available:eligible;
 if(!pool.length)return null;
 return pool[Math.floor((game.rng?.()??Math.random())*pool.length)%pool.length];
}

function markTarget(target,event){
 if(!target)return null;target.missionTarget=true;target.battlefieldEventId=event.id;target.battlefieldEventType=event.type;return target;
}

function rescueThreatHits(threat,rescue,event,now){
 if(threat.hp<=0||!threat.eventRescueThreat||threat.battlefieldEventId!==event.id||now<(threat.eventThreatReadyAt||0))return false;
 const dx=rescue.x-threat.x,dy=rescue.y-threat.y,distance=Math.hypot(dx,dy);
 return distance<BATTLEFIELD_EVENT_BALANCE.rescueThreatRange&&(distance<24||dx*Math.cos(threat.a)+dy*Math.sin(threat.a)>distance*Math.cos(.6));
}

function spawnTargets(game,event){
 const targets=[];
 if(event.type===P.HIGH_VALUE_TARGET){
  const e=markTarget(game.spawnEnemy?.('hunter'),event);if(e){Object.assign(e,{eventCommander:true,hp:Math.round((e.maxHp||e.hp||30)*2.15),xpValue:(e.xpValue||1)+8});e.maxHp=e.hp;targets.push(e);const count=(game.viewWidth||960)<=BATTLEFIELD_EVENT_BALANCE.compactWidth?2:3;for(let i=0;i<count;i++){const wing=game.spawnEnemy?.('hunter');if(!wing)continue;Object.assign(wing,{eventEscort:true,battlefieldEventId:event.id,battlefieldEventType:event.type,x:e.x+(i-(count-1)/2)*72,y:e.y+70,a:e.a,formationLeader:e,formationBack:70,formationOffset:(i-(count-1)/2)*72,fire:.7})}}
 }else if(event.type===P.BOMBER_INTERCEPT){
  const p=playerFor(game),rng=game.rng?.()??Math.random(),count=(game.viewWidth||960)<=BATTLEFIELD_EVENT_BALANCE.compactWidth?3:3+Math.floor(rng*3);
  const heading=p.a+(rng<.5?1:-1)*Math.PI/2,dx=Math.cos(heading),dy=Math.sin(heading),span=Math.max(420,(game.viewWidth||960)*.65);
  const cx=p.x+Math.cos(p.a)*180,cy=p.y+Math.sin(p.a)*180,previous=game.bossMechanicSpawn;
  // One bounded event group may exceed the ordinary two-bomber ambient cap.
  try{game.bossMechanicSpawn=true;for(let i=0;i<count;i++){
   const e=markTarget(game.spawnEnemy?.('bomber'),event);if(!e)continue;
   const side=(i%2?1:-1)*Math.ceil(i/2)*68,back=Math.ceil(i/2)*78;
   const x=cx-dx*(span+back)-dy*side,y=cy-dy*(span+back)+dx*side;
   Object.assign(e,{x,y,a:heading,eventExitHeading:heading,eventExitOrigin:{x,y},eventExitDistance:span*2+220,eventExit:true,fire:1.1+i*.25});
   if(targets.length)e.speed=targets[0].speed;targets.push(e);
  }}finally{game.bossMechanicSpawn=previous}
  // Ordinary escorts share each bomber's existing formation tether. Killing a
  // protected bomber therefore breaks its escorts instead of creating another wave.
  for(let i=0;i<3&&targets.length;i++){
   const wing=game.spawnEnemy?.('hunter');if(!wing)break;
   const leader=targets[i%targets.length],side=i%2?1:-1,back=85+Math.floor(i/2)*35,offset=side*110;
   Object.assign(wing,{eventEscort:true,battlefieldEventId:event.id,battlefieldEventType:event.type,formationLeader:leader,formationBack:back,formationOffset:offset,x:leader.x-dx*back-dy*offset,y:leader.y-dy*back+dx*offset,a:heading,fire:1.15+i*.3});
  }
 }else if(event.type===P.ACE_CHALLENGE){
  // This intentionally uses the normal ace path so an event ace retains the
  // established Rival escape contract; offers are already blocked while one lives.
  const e=markTarget(game.spawnEnemy?.('boss'),event);if(e){Object.assign(e,{eventAce:true,battlefieldEventAce:true,fire:.45});targets.push(e)}
 }else if(event.type===P.PHOTO_RECON){
  const p=playerFor(game),rng=game.rng??Math.random,compact=(game.viewWidth||960)<=BATTLEFIELD_EVENT_BALANCE.compactWidth;
  const count=compact?BATTLEFIELD_EVENT_BALANCE.reconCountCompact:BATTLEFIELD_EVENT_BALANCE.reconCount;
  const reach=Math.max(680,(game.viewWidth||960)*1.05),waypoints=[];
  for(let i=0;i<count;i++){
   let wp=null;
   for(let tries=0;tries<24&&!wp;tries++){const ang=rng()*Math.PI*2,d=240+rng()*(reach-240),x=p.x+Math.cos(ang)*d,y=p.y+Math.sin(ang)*d,q=reconPoint(game,p,x,y);if(Math.hypot(q.x-x,q.y-y)<.01&&waypoints.every(w=>Math.hypot(w.x-x,w.y-y)>=BATTLEFIELD_EVENT_BALANCE.reconMinGap))wp={x,y,index:i,progress:0,done:false}}
   // Bounded deterministic alternatives still work when RNG repeatedly points outside a route.
   if(!wp){const fallbackReach=Math.max(reach*.72,count*BATTLEFIELD_EVENT_BALANCE.reconMinGap/2);let best=null,bestGap=-1;for(let j=0;j<48;j++){const a=j*Math.PI*2/48,q=reconPoint(game,p,p.x+Math.cos(a)*fallbackReach,p.y+Math.sin(a)*fallbackReach),gap=waypoints.length?Math.min(...waypoints.map(w=>Math.hypot(w.x-q.x,w.y-q.y))):Infinity;if(gap>bestGap){best=q;bestGap=gap}}wp={...best,index:i,progress:0,done:false}}
   waypoints.push(wp);
  }
  event.waypoints=waypoints;
 }else if(event.type===P.SUPPLY_RECOVERY){
  const p=playerFor(game),a=p.a||0,side=(game.rng?.()??Math.random())<.5?-1:1,q=reconPoint(game,p,p.x+Math.cos(a)*460-Math.sin(a)*side*140,p.y+Math.sin(a)*460+Math.cos(a)*side*140),drop={...q,value:0,heal:true,healFraction:1,supply:true,vx:0,vy:0,life:80,battlefieldEvent:true,eventMissionSupply:true};
  (game.drops||=[]).push(drop);event.supplyDrop=drop;
  for(let i=0;i<2;i++){
   const threat=game.spawnEnemy?.('hunter');if(!threat)break;
   const flank=i?1:-1,x=drop.x+Math.cos(a)*130-Math.sin(a)*flank*190,y=drop.y+Math.sin(a)*130+Math.cos(a)*flank*190;
   Object.assign(threat,{eventSupplyThreat:true,battlefieldEventId:event.id,battlefieldEventType:event.type,x,y,a:Math.atan2(p.y-y,p.x-x),fire:.9+i*.4});
  }
 }else{
  const p=playerFor(game),ally={ownerId:p.id,eventRescue:true,eventReconEscort:event.type===P.RECON_ESCORT,life:BATTLEFIELD_EVENT_BALANCE.rescueDuration+2,hp:60,maxHp:60,x:p.x-Math.cos(p.a)*90,y:p.y-Math.sin(p.a)*90,a:p.a,fire:.3,plane:event.type===P.RECON_ESCORT?(game.teamFaction==='central'||game.allyPlane==='fokker'?'dfw_cv':'re7'):(p.allyPlane||game.allyPlane)};
  (game.allies||=[]).push(ally);event.rescue=ally;event.endsAt=(game.t||0)+BATTLEFIELD_EVENT_BALANCE.rescueDuration;
  for(let i=0;i<2;i++){
   const threat=game.spawnEnemy?.('hunter');if(!threat)break;
   const side=i?1:-1,x=ally.x+Math.cos(ally.a)*180-Math.sin(ally.a)*side*240,y=ally.y+Math.sin(ally.a)*180+Math.cos(ally.a)*side*240,warning=.9+i*.5;
   Object.assign(threat,{eventRescueThreat:true,battlefieldEventId:event.id,battlefieldEventType:event.type,x,y,a:Math.atan2(ally.y-y,ally.x-x),eventThreatReadyAt:(game.t||0)+warning,fire:warning,directorFireHoldUntil:(game.t||0)+warning});
  }
 }
 const timeout=event.type===P.PHOTO_RECON?BATTLEFIELD_EVENT_BALANCE.reconTimeout:BATTLEFIELD_EVENT_BALANCE.objectiveTimeout,remaining=game.stageCombatWindow?.remaining;
 event.targets=targets;event.deadline=(game.t||0)+Math.min(timeout,Number.isFinite(remaining)?Math.max(0,remaining-BATTLEFIELD_EVENT_BALANCE.bossReserve):timeout);
 return event;
}

function scheduleNext(game,state){
 const span=BATTLEFIELD_EVENT_BALANCE.cooldownMax-BATTLEFIELD_EVENT_BALANCE.cooldownMin;
 state.nextOfferAt=(game.t||0)+BATTLEFIELD_EVENT_BALANCE.cooldownMin+(game.rng?.()??Math.random())*span;
}

export function recordBattlefieldOutcome(game,event,outcome){
 if(!['completed','failed'].includes(outcome))return;
 const state=eventState(game),pending=state.pending??={},win=outcome==='completed',region=event.region??game.worldRegion?.(),expiresAt=(game.t||0)+90;
 const result={eventId:event.id,region,expiresAt};
 if(['FORWARD_OBSERVER','ARTILLERY_SPOTTER'].includes(event.type))pending.artillery={...result,value:win?-1:1};
 if([P.BOMBER_INTERCEPT,'BOMBER_STREAM'].includes(event.type))pending.bomber={...result,value:win?-1:1};
 if(event.type===P.HIGH_VALUE_TARGET&&win)pending.formation={...result,value:true,remaining:2,expiresAt:(game.t||0)+230};
 if(event.type===P.BOMBER_INTERCEPT&&win)pending.airSupport={...result,remaining:3,expiresAt:(game.t||0)+300};
 if(event.type===P.RECON_ESCORT&&win&&event.rescue?.hp>0){pending.airSupport={...result,remaining:3,expiresAt:(game.t||0)+300};event.rescue.life=0;}
 if(event.type===P.PHOTO_RECON&&win)state.bossIntel={region,applied:false,bonus:1.35};
 if(event.type===P.SUPPLY_RECOVERY&&win)for(const p of game.players||[game])if(p.hp>0)p.hp=p.maxHp;
 if(event.type===P.ACE_CHALLENGE&&win){
  if(game.players&&game.pendingLevelUps){
   for(const p of game.players)if(p.hp>0&&(!p.status||p.status==='alive'))game.pendingLevelUps.push({id:++game.upgradeSequence,playerId:p.id,level:p.level,choices:null});
   if(!game.activeUpgrade)game.openUpgrade?.();
  }else if(game.state==='playing'){game.state='upgrade';game.event?.('upgrade','에이스 격추 · 강화 선택')}
 }
 if(event.type===P.RESCUE&&win&&event.rescue?.hp>0){
  const ally=event.rescue;pending.rescue={...result,remaining:3,expiresAt:(game.t||0)+300,ally:{ownerId:ally.ownerId,plane:ally.plane,hp:ally.hp,maxHp:ally.maxHp}};ally.life=0;
 }
 if(event.type==='AMMO_DEPOT'&&win&&region===7)pending.facility={...result,bossKind:'armored-harbor-fortress',expiresAt:(game.t||0)+120};
 return pending;
}

export function recordBattleSceneOutcome(game,result){
 if(!['intercepted','breakthrough'].includes(result.outcome))return false;
 const state=eventState(game),key=regionKey(game);
 if(state.lastSceneOutcome?.sceneId===result.sceneId&&state.lastSceneOutcome.regionKey===key)return false;
 if(result.region!==game.worldRegion?.())return false;
 state.lastSceneOutcome={...result,regionKey:key};
 (state.pending??={}).tactical={...result,regionKey:key,expiresAt:(game.t||0)+60};
 return true;
}

function beginEngagement(game,pattern,sceneId,endsAt){
 if(game.state!=='playing'||pattern==='RECOVERY'||pattern==='ACE_PRESSURE')return pattern;
 if(pattern==='ELITE_FORMATION')return pattern;
 const state=eventState(game),pending=state.pending||{},now=game.t||0,region=game.worldRegion?.();
 if(sceneId!=null&&state.engagement?.sceneId===sceneId&&state.engagement.region===region)return state.engagement.pattern??pattern;
 const take=key=>{const item=pending[key];delete pending[key];return item&&item.expiresAt>now&&(item.region==null||item.region===region)?item:null};
 // A successful mission's interception persists until a bomber operation is
 // actually cancelled. A fighter scene must not silently consume its benefit.
 let bomber=pending.bomber;
 if(bomber&&(bomber.expiresAt<=now||bomber.region!=null&&bomber.region!==region)){delete pending.bomber;bomber=null;}
 const applicableBomber=bomber&&(bomber.value===1||['BOMBER_RUN','ESCORT'].includes(pattern));
 if(applicableBomber)delete pending.bomber;
 const artillery=take('artillery'),tactical=take('tactical');
 const wave=key=>{
  const item=pending[key];if(!item)return null;
  if(item.expiresAt<=now||!crossRegionSupport(key)&&item.region!=null&&item.region!==region||item.remaining<=0){delete pending[key];return null}
  return item;
 };
 const consumeWave=(key,item)=>{if(--item.remaining<=0)delete pending[key]};
 const formation=wave('formation'),rescue=wave('rescue'),airSupport=wave('airSupport');
 if(formation)consumeWave('formation',formation);
 const consequence=tactical?.regionKey===regionKey(game)?tactical:null;
 if(applicableBomber){if(bomber.value===1)pattern='BOMBER_RUN';else pattern='HEAD_ON_PASS';}
 else if(!bomber&&consequence?.outcome==='breakthrough')pattern='BOMBER_RUN';
 else if(consequence?.outcome==='intercepted'&&['BOMBER_RUN','ESCORT'].includes(pattern))pattern='CROSS_ATTACK';
 state.engagement={sceneId,region,pattern,endsAt:Math.min(endsAt??now+18,now+18),formationWeakened:!!formation||consequence?.outcome==='intercepted',tacticalOutcome:consequence?.outcome||null,artillery:artillery?.value||0,supportAt:now+3};
 if(rescue?.ally){
  const p=playerFor(game),spec=rescue.ally;
  if(game.allies)game.allies=game.allies.filter(a=>a.life>0);
  const before=game.allies?.length||0;
  for(let i=0;i<5;i++){const side=(i-2)*64,back=88+Math.abs(i-2)*32;
   (game.allies||=[]).push({...spec,slot:i+2,eventRescueSupport:true,life:22,x:p.x-Math.cos(p.a)*back-Math.sin(p.a)*side,y:p.y-Math.sin(p.a)*back+Math.cos(p.a)*side,a:p.a,fire:.25+i*.07});
  }
  if(game.allies.length>before){consumeWave('rescue',rescue);game.event?.('ally','구출 편대 복귀 · 아군 전투기 5기 지원')}
 }
 if(airSupport){
  const p=playerFor(game),a=p.a||0,plane=game.teamFaction==='central'||game.allyPlane==='fokker'?'staaken':'handley-page';
  const before=game.friendlyBombers?.length||0;
  for(let i=0;i<2;i++){const side=(i?1:-1)*92,ox=p.x-Math.sin(a)*side,oy=p.y+Math.cos(a)*side;
   (game.friendlyBombers||=[]).push({ownerId:p.id||'p1',ox,oy,x:ox-Math.cos(a)*650,y:oy-Math.sin(a)*650,a,age:0,drop:.45+i*.28,left:5,airframe:plane,eventMissionSupport:true});
  }
  if(game.friendlyBombers.length>before){consumeWave('airSupport',airSupport);game.event?.('ally','폭격 지원 도착 · 2기 편대 폭격')}
 }
 return pattern;
}

function consumeArtilleryCancellation(game){
 const engagement=game.battlefieldEvents?.engagement;
 if(!engagement||engagement.endsAt<=(game.t||0)||engagement.region!==game.worldRegion?.()||engagement.artillery!==-1)return false;
 engagement.artillery=0;return true;
}

function applyReconIntel(game,state,region){
 const intel=state.bossIntel,addon=game.stageBoss,encounter=addon?.stages?.encounter;
 const clear=()=>{state.bossIntel=null;if(addon)addon.__missionReconTarget=null};
 if(!intel){if(addon)addon.__missionReconTarget=null;return}
 if(intel.region!==region){clear();return}
 if(intel.applied){const body=encounter?.bodies.get(intel.bodyId),part=intel.partId?body?.parts.get(intel.partId):null;if(addon?.stages?.phase!=='boss'||encounter?.id!==intel.encounterId||!body||body.dead||intel.partId&&(!part||part.destroyed)){clear();return}}
 if(!intel.applied&&addon?.stages?.phase==='boss'&&encounter){
  const liveBodies=[...encounter.bodies.values()].filter(b=>!b.dead);let target=null;
  for(const body of liveBodies){
   const parts=[...body.parts.values()].filter(p=>p.hittable&&!p.destroyed);if(!parts.length)continue;
   const prefer=parts.find(p=>/engine|gun|turret|barrel|generator|launcher|mount|front/i.test(p.id));
   target={bodyId:body.id,partId:(prefer||parts[0]).id,encounterId:encounter.id,bonus:intel.bonus};break;
  }
  if(!target){const body=liveBodies.find(b=>b.coreVulnerable);if(body)target={bodyId:body.id,partId:null,encounterId:encounter.id,bonus:intel.bonus}}
  if(!target)return;Object.assign(intel,target,{applied:true});
  if(!addon.__missionReconBaseHit){
   addon.__missionReconBaseHit=addon.hit;
   addon.hit=function(args){
    const weak=this.__missionReconTarget,active=this.stages?.encounter;
    const body=weak&&active?.bodies.get(weak.bodyId),part=weak?.partId?body?.parts.get(weak.partId):null;
    const allowed=weak&&active?.id===weak.encounterId&&body&&!body.dead&&args.bodyId===weak.bodyId&&args.partId===(weak.partId??null)&&(!weak.partId||part&&!part.destroyed);
    return this.__missionReconBaseHit.call(this,allowed?{...args,damage:args.damage*weak.bonus}:args);
   };
  }
  addon.__missionReconTarget=intel;game.event?.('wave','정찰 정보 확보 · 표시된 보스 약점 피해 +35%');
 }
}
function tickConsequences(game){
 if(game.state!=='playing')return;
 const state=game.battlefieldEvents,now=game.t||0,region=game.worldRegion?.();if(!state)return;
 applyReconIntel(game,state,region);
 for(const [key,item]of Object.entries(state.pending||{}))if(item.expiresAt<=now||!crossRegionSupport(key)&&item.region!=null&&item.region!==region)delete state.pending[key];
 const engagement=state.engagement;
 if(engagement&&engagement.endsAt>now&&engagement.region===region&&engagement.artillery===1&&now>=engagement.supportAt&&!scriptedBoss(game)){
  engagement.artillery=0;game.observedVolley?.(false);
 }
 // Only the depot's own harbor boss receives a short reload disruption.
 const active=state.facilityEffect;
 if(active&&(now>=active.endsAt||region!==7||active.body.dead)){
  if(active.body.t.coastalInterval===active.value)active.body.t.coastalInterval=active.previous;
  state.facilityEffect=null;
 }
 const facility=state.pending?.facility;
 if(facility&&!state.facilityEffect&&region===7&&scriptedBoss(game)){
  const body=[...game.stageBoss.stages.encounter?.bodies?.values()||[]].find(b=>!b.dead&&b.kind===facility.bossKind);
  if(body){const previous=body.t.coastalInterval;const value=(previous||2.5)*1.18;body.t.coastalInterval=value;state.facilityEffect={body,previous,value,endsAt:now+18};delete state.pending.facility}
 }
}

function finish(game,state,outcome,reason){
 const event=state.current;if(!event)return false;
 for(const target of event.targets||[]){target.missionTarget=false;target.eventExit=false;delete target.eventExitOrigin}
 if(outcome==='failed'){
  if(event.rescue)event.rescue.life=0;
  if(event.supplyDrop&&!event.supplyDrop.dead)event.supplyDrop.life=0;
 }
 if(outcome==='completed'&&event.type===P.HIGH_VALUE_TARGET){
  for(const wing of game.enemies||[])if(wing.hp>0&&wing.eventEscort&&wing.battlefieldEventId===event.id){
   game.breakEnemyFormation?.(wing,2.5);wing.directorFireHoldUntil=Math.max(wing.directorFireHoldUntil||0,(game.t||0)+2.5);wing.fire=Math.max(wing.fire||0,2.5);
  }
 }
 if(outcome==='completed'){
  const p=playerFor(game),reward=event.type===P.ACE_CHALLENGE?70:event.type===P.BOMBER_INTERCEPT?55:event.type===P.PHOTO_RECON?50:event.type===P.HIGH_VALUE_TARGET?45:40;
  for(let i=0;i<4;i++){(game.drops||=[]).push({x:p.x+Math.cos(i*1.7)*46,y:p.y+Math.sin(i*1.7)*46,value:i<3?Math.floor(reward/4):reward-3*Math.floor(reward/4),heal:false,battlefieldEvent:true})}
  (game.drops||=[]).push({x:p.x-60,y:p.y,value:0,heal:true,supply:true,life:16,vx:0,vy:0,battlefieldEvent:true});
 }
 recordBattlefieldOutcome(game,event,outcome);
 achievementMission(game,event,outcome);
 if(outcome==='completed'){
  const message={
   [P.HIGH_VALUE_TARGET]:'지휘관 격추 · 호위 붕괴 · 다음 2개 편대 지휘 약화',
   [P.BOMBER_INTERCEPT]:'폭격기 요격 성공 · 후속 교전 폭격 지원 확보',
   [P.RECON_ESCORT]:'정찰기 보호 성공 · 후속 교전 폭격 지원 확보',
   [P.RESCUE]:'아군 구출 성공 · 다음 교전 아군 5기 합류',
   [P.PHOTO_RECON]:'사진 정찰 완료 · 보스 약점 피해 +35%',
   [P.SUPPLY_RECOVERY]:'긴급 보급 회수 · 전원 완전 회복',
   [P.ACE_CHALLENGE]:'에이스 격추 · 강화 선택'
  }[event.type];
  if(message)game.event?.('wave',message);
 }
 state.result={id:event.id,type:event.type,outcome,reason:reason||null,rewardType:outcome==='completed'?event.type:null};state.history.push({type:event.type,outcome,time:game.t||0});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;
 return true;
}

function tick(game){
 tickConsequences(game);
 const state=eventState(game),event=state.current,now=game.t||0;
 if(event?.status==='active'){
  if(event.region!==game.worldRegion?.()||event.regionKey!==regionKey(game))return finish(game,state,'failed','regionChanged');
  if(scriptedBoss(game))return finish(game,state,'failed','bossArrived');
  const dt=Math.max(0,Math.min(.08,now-(event.lastTickAt??now)));event.lastTickAt=now;
  if(event.type===P.SUPPLY_RECOVERY){
   const drop=event.supplyDrop;if(drop?.dead)return finish(game,state,'completed');
   if(!drop||drop.life<=0||!game.drops?.includes(drop))return finish(game,state,'failed','timeExpired');
  }
  else if(event.type===P.RESCUE||event.type===P.RECON_ESCORT){
   const rescue=event.rescue;if(!rescue||rescue.life<=0||!game.allies?.includes(rescue))return finish(game,state,'failed','rescueLost');
   const threats=(game.enemies||[]).filter(e=>rescueThreatHits(e,rescue,event,now));
   if(threats.length){rescue.hp=Math.max(0,rescue.hp-BATTLEFIELD_EVENT_BALANCE.rescueThreatDamage*threats.length*dt);if(rescue.hp<=0)rescue.life=0}
   if(rescue.life<=0)return finish(game,state,'failed','rescueLost');if(now>=event.endsAt)return finish(game,state,'completed');
  }
  else if(event.type===P.BOMBER_INTERCEPT){for(const target of event.targets||[])if(target.hp>0&&target.eventExitOrigin){target.a=target.eventExitHeading;if(Math.hypot(target.x-target.eventExitOrigin.x,target.y-target.eventExitOrigin.y)>=(target.eventExitDistance||BATTLEFIELD_EVENT_BALANCE.bomberExitDistance))return finish(game,state,'failed','targetEscaped')}if(event.targets?.length&&event.targets.every(target=>target.hp<=0||target.deathHandled))return finish(game,state,'completed')}
  else if(event.type===P.PHOTO_RECON){
   const p=playerFor(game),wp=(event.waypoints||[]).find(w=>!w.done);
   if(wp){const inside=Math.hypot(p.x-wp.x,p.y-wp.y)<=BATTLEFIELD_EVENT_BALANCE.reconRadius;wp.progress=inside?wp.progress+dt:Math.max(0,wp.progress-dt*1.6);if(wp.progress>=BATTLEFIELD_EVENT_BALANCE.reconHold){wp.done=true;wp.doneAt=now;game.burst?.(wp.x,wp.y,'#a8e6f4',16)}}
   if((event.waypoints||[]).length&&event.waypoints.every(w=>w.done))return finish(game,state,'completed');
  }
  else if(event.targets?.some(target=>target.rivalEscaped))return finish(game,state,'failed','targetEscaped');
  else if(event.targets?.length&&event.targets.every(target=>target.hp<=0||target.deathHandled))return finish(game,state,'completed');
  if(now>=event.deadline)return finish(game,state,'failed','timeExpired');
 }
 if(canOffer(game))game.offerBattlefieldEvent();
}

export function installBattlefieldEvents(Game){
 if(Game.prototype.__battlefieldEvents170)return;Game.prototype.__battlefieldEvents170=true;
 Game.prototype.beginBattlefieldEngagement=function(pattern,sceneId,endsAt){return beginEngagement(this,pattern,sceneId,endsAt)};
 Game.prototype.recordBattlefieldOutcome=function(event,outcome){return recordBattlefieldOutcome(this,event,outcome)};
 Game.prototype.recordBattleSceneOutcome=function(result){return recordBattleSceneOutcome(this,result)};
 Game.prototype.tickBattlefieldConsequences=function(){return tickConsequences(this)};
 const steering=Game.prototype.dogfightSteering;
 if(steering)Game.prototype.dogfightSteering=function(e,contact,dt,turn){
  const mission=this.battlefieldEvents?.current,rescue=mission?.rescue;
  if(mission?.status==='active'&&e.eventRescueThreat&&e.battlefieldEventId===mission.id&&rescue?.hp>0&&rescue.life>0)contact=rescue;
  return steering.call(this,e,contact,dt,turn);
 };
 const observedVolley=Game.prototype.observedVolley,fieldVolley=Game.prototype.fieldVolley;
 if(observedVolley)Game.prototype.observedVolley=function(spotted){if(!consumeArtilleryCancellation(this))return observedVolley.call(this,spotted)};
 if(fieldVolley)Game.prototype.fieldVolley=function(e){if(e.fieldUnit==='railgun'&&consumeArtilleryCancellation(this)){e.fieldSalvoLeft=0;return}return fieldVolley.call(this,e)};
 Game.prototype.canOfferBattlefieldEvent=function(){return canOffer(this)};
 // Missions auto-start: the modal accept/decline step was a crash source, so
 // offers immediately activate and only surface a toast + the mission HUD.
 Game.prototype.offerBattlefieldEvent=function(preferred){
  if(!canOffer(this))return null;const state=eventState(this),type=chooseType(this,state,preferred);if(!type)return null;
  const event={id:++state.serial,type,region:this.worldRegion?.(),regionKey:regionKey(this),status:'active',offeredAt:this.t||0,startedAt:this.t||0,targets:[]},previous=this.battlefieldEventSpawning;
  state.current=event;
  try{this.battlefieldEventSpawning=true;spawnTargets(this,event)}finally{this.battlefieldEventSpawning=previous}
  if([P.HIGH_VALUE_TARGET,P.BOMBER_INTERCEPT,P.ACE_CHALLENGE].includes(type)&&!event.targets.length){state.current=null;state.nextOfferAt=(this.t||0)+BATTLEFIELD_EVENT_BALANCE.retryDelay;return null}
  scheduleNext(this,state);return event;
 };
 Game.prototype.acceptBattlefieldEvent=function(){
  const state=eventState(this),event=state.current;if(this.state!=='battlefield-event'||event?.status!=='offered')return false;
  event.status='active';event.region=this.worldRegion?.();event.regionKey=regionKey(this);event.startedAt=this.t||0;this.state='playing';scheduleNext(this,state);
  const previous=this.battlefieldEventSpawning;try{this.battlefieldEventSpawning=true;spawnTargets(this,event)}finally{this.battlefieldEventSpawning=previous}return true;
 };
 Game.prototype.declineBattlefieldEvent=function(){
  const state=eventState(this),event=state.current;if(this.state!=='battlefield-event'||event?.status!=='offered')return false;
  scheduleNext(this,state);state.result={id:event.id,type:event.type,outcome:'declined'};state.history.push({type:event.type,outcome:'declined',time:this.t||0});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;this.state='playing';return true;
 };
 Game.prototype.tickBattlefieldEvents=function(){return tick(this)};
 Game.prototype.installRegionalBattlefieldEvents?.();
 // Regional doctrine installs its own offer/tick hooks. Keep their authored
 // objectives while sharing the same stage window and common spawn contract.
 if(Game.prototype.__regionalBattlefieldEvents1){
  const regionalSpawn=Game.prototype._spawnRegionalTargets;
  Game.prototype._spawnRegionalTargets=function(event){
   const ace=event.type==='MOUNTAIN_PURSUIT',bombers=event.type==='BOMBER_STREAM',remaining=this.stageCombatWindow?.remaining;
   if(ace&&this.availableAcePilots&&!this.availableAcePilots().length)return false;
   if((ace||bombers)&&Number.isFinite(remaining)&&remaining<24+BATTLEFIELD_EVENT_BALANCE.bossReserve)return false;
   return regionalSpawn.call(this,event);
  };
  const regionalOffer=Game.prototype.offerBattlefieldEvent;
  Game.prototype.offerBattlefieldEvent=function(preferred){
   const previous=this.battlefieldEventSpawning;let event;
   try{this.battlefieldEventSpawning=true;event=regionalOffer.call(this,preferred)}finally{this.battlefieldEventSpawning=previous}
   if(event){
    event.region=this.worldRegion?.();event.regionKey=regionKey(this);
    const remaining=this.stageCombatWindow?.remaining;
    if(Number.isFinite(remaining))event.deadline=Math.min(event.deadline,(this.t||0)+Math.max(0,remaining-BATTLEFIELD_EVENT_BALANCE.bossReserve));
   }
   return event;
  };
  const regionalTick=Game.prototype.tickBattlefieldEvents;
  Game.prototype.tickBattlefieldEvents=function(){
   const state=this.battlefieldEvents,event=state?.current;
   if(event?.status==='active'&&(event.region!==this.worldRegion?.()||event.regionKey!==regionKey(this)||scriptedBoss(this))){
    tickConsequences(this);return finish(this,state,'failed',scriptedBoss(this)?'bossArrived':'regionChanged');
   }
   return regionalTick.call(this);
  };
 }
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){const result=update.call(this,dt,input);tickRuralFronts(this);this.tickBattlefieldEvents();return result};
}





