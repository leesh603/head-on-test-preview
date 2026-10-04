export const BATTLEFIELD_EVENT_TYPES=Object.freeze({
 HIGH_VALUE_TARGET:'HIGH_VALUE_TARGET',RESCUE:'RESCUE',BOMBER_INTERCEPT:'BOMBER_INTERCEPT',ACE_CHALLENGE:'ACE_CHALLENGE'
});

export const BATTLEFIELD_EVENT_BALANCE=Object.freeze({
 firstOfferAt:95,cooldownMin:120,cooldownMax:165,retryDelay:8,rescueDuration:18,objectiveTimeout:70,bomberExitDistance:980,rescueThreatRange:260,rescueThreatDamage:9,compactWidth:720,compactDangerCap:7,dangerCap:10
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
 }else{
  const p=playerFor(game),ally={ownerId:p.id,eventRescue:true,life:BATTLEFIELD_EVENT_BALANCE.rescueDuration+2,hp:60,maxHp:60,x:p.x-Math.cos(p.a)*90,y:p.y-Math.sin(p.a)*90,a:p.a,fire:.3,plane:p.allyPlane||game.allyPlane};
  (game.allies||=[]).push(ally);event.rescue=ally;event.endsAt=(game.t||0)+BATTLEFIELD_EVENT_BALANCE.rescueDuration;
  for(let i=0;i<2;i++){const threat=game.spawnEnemy?.('hunter');if(threat)Object.assign(threat,{eventRescueThreat:true,battlefieldEventId:event.id,x:ally.x+(i?130:-130),y:ally.y-100,a:Math.PI/2,fire:.35})}
 }
 event.targets=targets;event.deadline=(game.t||0)+BATTLEFIELD_EVENT_BALANCE.objectiveTimeout;
 return event;
}

function scheduleNext(game,state){
 const span=BATTLEFIELD_EVENT_BALANCE.cooldownMax-BATTLEFIELD_EVENT_BALANCE.cooldownMin;
 state.nextOfferAt=(game.t||0)+BATTLEFIELD_EVENT_BALANCE.cooldownMin+(game.rng?.()??Math.random())*span;
}

function finish(game,state,outcome,reason){
 const event=state.current;if(!event)return false;
 for(const target of event.targets||[]){target.missionTarget=false;target.eventExit=false;delete target.eventExitOrigin}
 if(outcome==='completed'){
  const p=playerFor(game),reward=event.type===P.ACE_CHALLENGE?70:event.type===P.BOMBER_INTERCEPT?55:event.type===P.HIGH_VALUE_TARGET?45:40;
  for(let i=0;i<4;i++){(game.drops||=[]).push({x:p.x+Math.cos(i*1.7)*46,y:p.y+Math.sin(i*1.7)*46,value:i<3?Math.floor(reward/4):reward-3*Math.floor(reward/4),heal:false,battlefieldEvent:true})}
  (game.drops||=[]).push({x:p.x-60,y:p.y,value:0,heal:true,supply:true,life:16,vx:0,vy:0,battlefieldEvent:true});
 }
 state.result={id:event.id,type:event.type,outcome,reason:reason||null};state.history.push({type:event.type,outcome,time:game.t||0});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;
 return true;
}

function tick(game){
 const state=eventState(game),event=state.current,now=game.t||0;
 if(event?.status==='active'){
  const dt=Math.max(0,Math.min(.08,now-(event.lastTickAt??now)));event.lastTickAt=now;
  if(event.type===P.RESCUE){const rescue=event.rescue,threats=(game.enemies||[]).filter(e=>e.hp>0&&e.eventRescueThreat&&e.battlefieldEventId===event.id&&Math.hypot(e.x-rescue.x,e.y-rescue.y)<BATTLEFIELD_EVENT_BALANCE.rescueThreatRange);if(threats.length){rescue.hp=Math.max(0,rescue.hp-BATTLEFIELD_EVENT_BALANCE.rescueThreatDamage*threats.length*dt);if(rescue.hp<=0)rescue.life=0}if(!rescue||rescue.life<=0||!game.allies?.includes(rescue))return finish(game,state,'failed','rescueLost');if(now>=event.endsAt)return finish(game,state,'completed')}
  else if(event.type===P.BOMBER_INTERCEPT){for(const target of event.targets||[])if(target.hp>0&&target.eventExitOrigin){target.a=target.eventExitHeading;if(Math.hypot(target.x-target.eventExitOrigin.x,target.y-target.eventExitOrigin.y)>=(target.eventExitDistance||BATTLEFIELD_EVENT_BALANCE.bomberExitDistance))return finish(game,state,'failed','targetEscaped')}if(event.targets?.length&&event.targets.every(target=>target.hp<=0||target.deathHandled))return finish(game,state,'completed')}
  else if(event.targets?.some(target=>target.rivalEscaped))return finish(game,state,'failed','targetEscaped');
  else if(event.targets?.length&&event.targets.every(target=>target.hp<=0||target.deathHandled))return finish(game,state,'completed');
  if(now>=event.deadline)return finish(game,state,'failed','timeExpired');
 }
 if(canOffer(game))game.offerBattlefieldEvent();
}

export function installBattlefieldEvents(Game){
 if(Game.prototype.__battlefieldEvents170)return;Game.prototype.__battlefieldEvents170=true;
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
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){const result=update.call(this,dt,input);this.tickBattlefieldEvents();return result};
}
