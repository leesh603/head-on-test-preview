export const BATTLEFIELD_EVENT_TYPES=Object.freeze({
 HIGH_VALUE_TARGET:'HIGH_VALUE_TARGET',RESCUE:'RESCUE',BOMBER_INTERCEPT:'BOMBER_INTERCEPT',ACE_CHALLENGE:'ACE_CHALLENGE',PHOTO_RECON:'PHOTO_RECON',RECON_ESCORT:'RECON_ESCORT',SUPPLY_RECOVERY:'SUPPLY_RECOVERY'
});

export const BATTLEFIELD_EVENT_BALANCE=Object.freeze({
 firstOfferAt:95,cooldownMin:120,cooldownMax:165,retryDelay:8,rescueDuration:18,objectiveTimeout:70,bomberExitDistance:980,rescueThreatRange:260,rescueThreatDamage:9,compactWidth:720,compactDangerCap:7,dangerCap:10,reconCount:5,reconCountCompact:4,reconRadius:130,reconMinGap:280,reconHold:1,reconTimeout:90
});

const TYPES=Object.values(BATTLEFIELD_EVENT_TYPES);
const P=BATTLEFIELD_EVENT_TYPES;
const liveAce=game=>(game.enemies||[]).some(e=>e.hp>0&&!e.expired&&!e.rivalEscaped&&(e.bossPilot||e.type==='boss'));
const scriptedBoss=game=>game.stageBoss?.stages?.phase==='boss';
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;

function eventState(game){
 return game.battlefieldEvents??=(game.battlefieldEvents={nextOfferAt:BATTLEFIELD_EVENT_BALANCE.firstOfferAt,serial:0,current:null,lastType:null,history:[],result:null});
}

function dangerCount(game){
 const p=playerFor(game),w=(game.viewWidth||960)*.72,h=(game.viewHeight||700)*.72;
 return(game.enemies||[]).filter(e=>e.hp>0&&Math.abs(e.x-p.x)<w&&Math.abs(e.y-p.y)<h).length;
}

function canOffer(game){
 const state=eventState(game),compact=(game.viewWidth||960)<=BATTLEFIELD_EVENT_BALANCE.compactWidth;
 if(game.mode==='campaign'||game.state!=='playing'||(game.t||0)<state.nextOfferAt||state.current)return false;
 if(game.battleDirectorPattern!=='RECOVERY'||scriptedBoss(game)||liveAce(game)||game.eliteEnemies?.active)return false;
 return dangerCount(game)<=(compact?BATTLEFIELD_EVENT_BALANCE.compactDangerCap:BATTLEFIELD_EVENT_BALANCE.dangerCap);
}

function chooseType(game,state,preferred){
 if(TYPES.includes(preferred))return preferred;
 const available=TYPES.filter(type=>type!==state.lastType),pool=available.length?available:TYPES;
 return pool[Math.floor((game.rng?.()??Math.random())*pool.length)%pool.length];
}

function markTarget(target,event){
 if(!target)return null;target.missionTarget=true;target.battlefieldEventId=event.id;target.battlefieldEventType=event.type;return target;
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
   for(let tries=0;tries<24&&!wp;tries++){const ang=rng()*Math.PI*2,d=240+rng()*(reach-240),x=p.x+Math.cos(ang)*d,y=p.y+Math.sin(ang)*d;if(waypoints.every(w=>Math.hypot(w.x-x,w.y-y)>=BATTLEFIELD_EVENT_BALANCE.reconMinGap))wp={x,y,index:i,progress:0,done:false}}
   waypoints.push(wp||{x:p.x+Math.cos(i*2.4)*reach*.72,y:p.y+Math.sin(i*2.4)*reach*.72,index:i,progress:0,done:false});
  }
  event.waypoints=waypoints;
 }else if(event.type===P.SUPPLY_RECOVERY){
  const p=playerFor(game),a=p.a||0,drop={x:p.x+Math.cos(a)*460,y:p.y+Math.sin(a)*460,value:0,heal:true,healFraction:1,supply:true,vx:0,vy:0,life:80,battlefieldEvent:true,eventMissionSupply:true};
  (game.drops||=[]).push(drop);event.supplyDrop=drop;
 }else{
  const p=playerFor(game),ally={ownerId:p.id,eventRescue:true,eventReconEscort:event.type===P.RECON_ESCORT,life:BATTLEFIELD_EVENT_BALANCE.rescueDuration+2,hp:60,maxHp:60,x:p.x-Math.cos(p.a)*90,y:p.y-Math.sin(p.a)*90,a:p.a,fire:.3,plane:event.type===P.RECON_ESCORT?(game.teamFaction==='central'||game.allyPlane==='fokker'?'dfw_cv':'re7'):(p.allyPlane||game.allyPlane)};
  (game.allies||=[]).push(ally);event.rescue=ally;event.endsAt=(game.t||0)+BATTLEFIELD_EVENT_BALANCE.rescueDuration;
  for(let i=0;i<2;i++){const threat=game.spawnEnemy?.('hunter');if(threat)Object.assign(threat,{eventRescueThreat:true,battlefieldEventId:event.id,x:ally.x+(i?130:-130),y:ally.y-100,a:Math.PI/2,fire:.35})}
 }
 event.targets=targets;event.deadline=(game.t||0)+(event.type===P.PHOTO_RECON?BATTLEFIELD_EVENT_BALANCE.reconTimeout:BATTLEFIELD_EVENT_BALANCE.objectiveTimeout);
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

function beginEngagement(game,pattern,sceneId,endsAt){
 if(pattern==='RECOVERY'||pattern==='ACE_PRESSURE')return pattern;
 const state=eventState(game),pending=state.pending||{},now=game.t||0,region=game.worldRegion?.();
 const take=key=>{const item=pending[key];delete pending[key];return item&&item.expiresAt>now&&(item.region==null||item.region===region)?item:null};
 const bomber=take('bomber'),artillery=take('artillery');
 const consumeWave=key=>{
  const item=pending[key];if(!item)return null;
  if(item.expiresAt<=now||item.region!=null&&item.region!==region){delete pending[key];return null}
  if(--item.remaining<=0)delete pending[key];return item;
 };
 const formation=consumeWave('formation'),rescue=consumeWave('rescue'),airSupport=consumeWave('airSupport');
 if(bomber?.value===1)pattern='BOMBER_RUN';
 else if(bomber?.value===-1&&['BOMBER_RUN','ESCORT'].includes(pattern))pattern='HEAD_ON_PASS';
 state.engagement={sceneId,region,endsAt:Math.min(endsAt??now+18,now+18),formationWeakened:!!formation,artillery:artillery?.value||0,supportAt:now+3};
 if(rescue){
  const p=playerFor(game),spec=rescue.ally;
  for(let i=0;i<5;i++){const side=(i-2)*64,back=88+Math.abs(i-2)*32;
   (game.allies||=[]).push({...spec,slot:i+2,eventRescueSupport:true,life:22,x:p.x-Math.cos(p.a)*back-Math.sin(p.a)*side,y:p.y-Math.sin(p.a)*back+Math.cos(p.a)*side,a:p.a,fire:.25+i*.07});
  }
  game.event?.('ally','구출 편대 복귀 · 아군 전투기 5기 지원');
 }
 if(airSupport){
  const p=playerFor(game),a=p.a||0,plane=game.teamFaction==='central'||game.allyPlane==='fokker'?'staaken':'handley-page';
  for(let i=0;i<2;i++){const side=(i?1:-1)*92,ox=p.x-Math.sin(a)*side,oy=p.y+Math.cos(a)*side;
   (game.friendlyBombers||=[]).push({ownerId:p.id||'p1',ox,oy,x:ox-Math.cos(a)*650,y:oy-Math.sin(a)*650,a,age:0,drop:.45+i*.28,left:5,airframe:plane,eventMissionSupport:true});
  }
  game.event?.('ally','폭격 지원 도착 · 2기 편대 폭격');
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
 if(!intel)return;
 if(intel.region!==region){state.bossIntel=null;return}
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
    const allowed=weak&&active?.id===weak.encounterId&&args.bodyId===weak.bodyId&&args.partId===(weak.partId??null)&&(!weak.partId||!active.bodies.get(weak.bodyId)?.parts.get(weak.partId)?.destroyed);
    return this.__missionReconBaseHit.call(this,allowed?{...args,damage:args.damage*weak.bonus}:args);
   };
  }
  addon.__missionReconTarget=intel;game.event?.('wave','정찰 정보 확보 · 표시된 보스 약점 피해 +35%');
 }else if(intel.applied&&addon?.stages?.phase==='explore')state.bossIntel=null;
}
function tickConsequences(game){
 if(game.state!=='playing')return;
 const state=game.battlefieldEvents,now=game.t||0,region=game.worldRegion?.();if(!state)return;
 applyReconIntel(game,state,region);
 for(const [key,item]of Object.entries(state.pending||{}))if(item.expiresAt<=now||item.region!=null&&item.region!==region)delete state.pending[key];
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
 if(outcome==='completed'){
  const p=playerFor(game),reward=event.type===P.ACE_CHALLENGE?70:event.type===P.BOMBER_INTERCEPT?55:event.type===P.PHOTO_RECON?50:event.type===P.HIGH_VALUE_TARGET?45:40;
  for(let i=0;i<4;i++){(game.drops||=[]).push({x:p.x+Math.cos(i*1.7)*46,y:p.y+Math.sin(i*1.7)*46,value:i<3?Math.floor(reward/4):reward-3*Math.floor(reward/4),heal:false,battlefieldEvent:true})}
  (game.drops||=[]).push({x:p.x-60,y:p.y,value:0,heal:true,supply:true,life:16,vx:0,vy:0,battlefieldEvent:true});
 }
 recordBattlefieldOutcome(game,event,outcome);
 state.result={id:event.id,type:event.type,outcome,reason:reason||null,rewardType:outcome==='completed'?event.type:null};state.history.push({type:event.type,outcome,time:game.t||0});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;
 return true;
}

function tick(game){
 tickConsequences(game);
 const state=eventState(game),event=state.current,now=game.t||0;
 if(event?.status==='active'){
  const dt=Math.max(0,Math.min(.08,now-(event.lastTickAt??now)));event.lastTickAt=now;
  if(event.type===P.SUPPLY_RECOVERY){
   const drop=event.supplyDrop;if(drop?.dead)return finish(game,state,'completed');
   if(!drop||drop.life<=0||!game.drops?.includes(drop))return finish(game,state,'failed','timeExpired');
  }
  else if(event.type===P.RESCUE||event.type===P.RECON_ESCORT){const rescue=event.rescue,threats=(game.enemies||[]).filter(e=>e.hp>0&&e.eventRescueThreat&&e.battlefieldEventId===event.id&&Math.hypot(e.x-rescue.x,e.y-rescue.y)<BATTLEFIELD_EVENT_BALANCE.rescueThreatRange);if(threats.length){rescue.hp=Math.max(0,rescue.hp-BATTLEFIELD_EVENT_BALANCE.rescueThreatDamage*threats.length*dt);if(rescue.hp<=0)rescue.life=0}if(!rescue||rescue.life<=0||!game.allies?.includes(rescue))return finish(game,state,'failed','rescueLost');if(now>=event.endsAt)return finish(game,state,'completed')}
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
 Game.prototype.tickBattlefieldConsequences=function(){return tickConsequences(this)};
 const observedVolley=Game.prototype.observedVolley,fieldVolley=Game.prototype.fieldVolley;
 if(observedVolley)Game.prototype.observedVolley=function(spotted){if(!consumeArtilleryCancellation(this))return observedVolley.call(this,spotted)};
 if(fieldVolley)Game.prototype.fieldVolley=function(e){if(e.fieldUnit==='railgun'&&consumeArtilleryCancellation(this)){e.fieldSalvoLeft=0;return}return fieldVolley.call(this,e)};
 Game.prototype.canOfferBattlefieldEvent=function(){return canOffer(this)};
 // Missions auto-start: the modal accept/decline step was a crash source, so
 // offers immediately activate and only surface a toast + the mission HUD.
 Game.prototype.offerBattlefieldEvent=function(preferred){
  if(!canOffer(this))return null;const state=eventState(this),type=chooseType(this,state,preferred),event={id:++state.serial,type,status:'active',offeredAt:this.t||0,startedAt:this.t||0,targets:[]};
  state.current=event;scheduleNext(this,state);spawnTargets(this,event);return event;
 };
 Game.prototype.acceptBattlefieldEvent=function(){
  const state=eventState(this),event=state.current;if(this.state!=='battlefield-event'||event?.status!=='offered')return false;
  event.status='active';event.startedAt=this.t||0;this.state='playing';scheduleNext(this,state);spawnTargets(this,event);return true;
 };
 Game.prototype.declineBattlefieldEvent=function(){
  const state=eventState(this),event=state.current;if(this.state!=='battlefield-event'||event?.status!=='offered')return false;
  scheduleNext(this,state);state.result={id:event.id,type:event.type,outcome:'declined'};state.history.push({type:event.type,outcome:'declined',time:this.t||0});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;this.state='playing';return true;
 };
 Game.prototype.tickBattlefieldEvents=function(){return tick(this)};
 Game.prototype.installRegionalBattlefieldEvents?.();
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){const result=update.call(this,dt,input);this.tickBattlefieldEvents();return result};
}
