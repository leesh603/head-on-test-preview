export const BATTLE_DIRECTOR_PATTERNS=Object.freeze({
 HEAD_ON_PASS:'HEAD_ON_PASS',CROSS_ATTACK:'CROSS_ATTACK',PINCER:'PINCER',CHASE:'CHASE',ESCORT:'ESCORT',
 BOMBER_RUN:'BOMBER_RUN',DECOY:'DECOY',ELITE_FORMATION:'ELITE_FORMATION',ACE_PRESSURE:'ACE_PRESSURE',RECOVERY:'RECOVERY'
});

export const BATTLE_DIRECTOR_BALANCE=Object.freeze({
 firstSceneAt:18,sceneMin:22,sceneMax:28,recoveryDuration:7,recentWindow:3,
 compactWidth:720,compactSoloCap:8,compactCoopCap:10,soloCap:11,coopCap:14,actionInterval:.48,
 headOnIntent:6,crossIntent:6.5,pincerIntent:4.5,chaseIntent:5,escortIntent:7,bomberIntent:8
});

const P=BATTLE_DIRECTOR_PATTERNS;
let S,directorAircraftEligible,angleDiff;
const TACTICS=[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.CHASE,P.ESCORT,P.DECOY,P.BOMBER_RUN];
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;
const activeAce=game=>(game.enemies||[]).some(e=>e.hp>0&&!e.expired&&!e.rivalEscaped&&(e.bossPilot||e.type==='boss'));
const scriptedBoss=game=>game.stageBoss?.stages?.phase==='boss';
const regular=e=>e?.hp>0&&!e.bossPilot&&!e.bossMinion&&!e.battlefieldEventId&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.missionTarget&&['scout','hunter','bomber'].includes(e.type);
const suspended=game=>scriptedBoss(game)||game.battlefieldEvents?.current?.status==='active'||!!game.londonBattle||!!game.eliteEnemies?.active&&game.battleDirectorPattern!==P.ELITE_FORMATION;
const living=(game,squad)=>squad?.members.filter(e=>e.hp>0&&!e.expired&&game.enemies.includes(e))||[];

function directorState(game){
 return game.battleDirector??=(game.battleDirector={pattern:null,startedAt:0,endsAt:0,nextSceneAt:BATTLE_DIRECTOR_BALANCE.firstSceneAt,nextActionAt:Infinity,queue:[],history:[],sceneId:0,combatSinceRecovery:0,eliteRequested:false});
}

function weightedChoice(game,state,candidates){
 const recent=state.history.slice(-BATTLE_DIRECTOR_BALANCE.recentWindow),last=recent.at(-1);
 const choices=candidates.filter(pattern=>pattern!==last),pool=choices.length?choices:candidates;
 const weighted=pool.map(pattern=>({pattern,weight:recent.includes(pattern)?.24:1}));
 let roll=(game.rng?.()??Math.random())*weighted.reduce((sum,item)=>sum+item.weight,0);
 for(const item of weighted){roll-=item.weight;if(roll<=0)return item.pattern}
 return weighted.at(-1)?.pattern||P.HEAD_ON_PASS;
}

function choosePattern(game,state){
 if(activeAce(game))return P.ACE_PRESSURE;
 if(!state.patternDeck?.length)state.patternDeck=[...TACTICS];
 const pool=state.patternDeck.filter(p=>p!==state.lastCombatPattern);
 if(!pool.length){state.patternDeck=[...TACTICS];return choosePattern(game,state)}
 const next=weightedChoice(game,state,pool);
 state.patternDeck=state.patternDeck.filter(p=>p!==next);return next;
}

function action(type,layout,count=1){return Array.from({length:count},(_,index)=>({type,layout,index,count}))}
function planFor(pattern,time,compact){
 const pressure=time<120?3:time<360?4:compact?5:6;
 if(pattern===P.HEAD_ON_PASS)return action('hunter','headOn',pressure);
 if(pattern===P.CROSS_ATTACK)return action('hunter','cross',Math.max(2,pressure));
 if(pattern===P.PINCER)return action('hunter','pincer',2);
 if(pattern===P.CHASE)return action('hunter','chase',pressure);
 if(pattern===P.DECOY)return action('hunter','decoy',pressure);
 if(pattern===P.ESCORT)return[...action('bomber','escort',1),...action('hunter','escort',pressure-1)];
 if(pattern===P.BOMBER_RUN){const bombers=time<360?1:2;return[...action('bomber','bomber',bombers),...action('hunter','bomber',pressure-bombers)]}
 return[];
}

function beginPattern(game,state,pattern=choosePattern(game,state)){
 const now=game.t||0,compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth;
 for(const e of living(game,state.squad))breakFormation(e,now,pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:2.5);
 state.squad=null;
 state.pattern=pattern;state.startedAt=now;state.sceneId++;state.eliteRequested=false;
 state.endsAt=now+(pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:pattern===P.ACE_PRESSURE?20:BATTLE_DIRECTOR_BALANCE.sceneMin+(game.rng?.()??Math.random())*(BATTLE_DIRECTOR_BALANCE.sceneMax-BATTLE_DIRECTOR_BALANCE.sceneMin));
 state.nextActionAt=now+.35;state.queue=planFor(pattern,now,compact).map((item,index,items)=>({...item,index,count:items.length}));state.history.push(pattern);state.history=state.history.slice(-12);
 if(TACTICS.includes(pattern)||pattern===P.PINCER)state.lastCombatPattern=pattern;
 if(pattern===P.RECOVERY)state.combatSinceRecovery=0;else if(pattern!==P.ACE_PRESSURE)state.combatSinceRecovery++;
 game.battleDirectorPattern=pattern;game.spawn=Math.max(game.spawn||0,pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:1.2);
 if(pattern!==P.ACE_PRESSURE){
  const p=playerFor(game);
  for(const e of game.enemies||[])if(directorAircraftEligible(game,e)&&!e.directorSquad){
   e.directorLayout='recovery';e.directorIntentUntil=state.endsAt;e.directorEscort=null;
   e.directorBreakUntil=state.endsAt;e.fire=Math.max(e.fire||0,state.endsAt-now);
   e.combatPassState=S.DISENGAGE;e.combatPassTimer=state.endsAt-now;
   e.combatPassHeading=Math.atan2(e.y-p.y,e.x-p.x);
  }
 }
 return pattern;
}

function place(game,e,layout,index,count){
 const p=playerFor(game),a=Number.isFinite(p.a)?p.a:-Math.PI/2,side=index-(count-1)/2;
 let forward=480,lateral=side*65;
 if(layout==='cross'){forward=320;lateral=(index%2?1:-1)*(260+Math.floor(index/2)*55)}
 else if(layout==='pincer'){forward=320;lateral=(index%2?1:-1)*360}
 else if(layout==='chase'){forward=-150-Math.floor(index/2)*30;lateral=side*55}
 else if(layout==='decoy'){forward=index?470:320;lateral=index?(index%2?1:-1)*110:0}
 else if(layout==='escort'||layout==='bomber'){forward=e.type==='bomber'?520:layout==='bomber'?410:610;lateral=side*65}
 e.x=p.x+Math.cos(a)*forward-Math.sin(a)*lateral;e.y=p.y+Math.sin(a)*forward+Math.cos(a)*lateral;
 e.a=layout==='chase'?a:Math.atan2(p.y-e.y,p.x-e.x);e.directorPattern=game.battleDirectorPattern;e.directorSceneId=game.battleDirector.sceneId;
 if(!directorAircraftEligible(game,e))return;
 if(layout==='pincer'){
  const duration=BATTLE_DIRECTOR_BALANCE.pincerIntent,offset=(index%2?1:-1)*110;
  e.directorLayout=layout;e.directorIntentUntil=game.t+duration;e.combatPassState=S.REPOSITION;e.combatPassTimer=duration;e.combatPassCooldown=0;e.combatPassSide=index%2?1:-1;
  e.combatPassWaypoint={x:p.x+Math.cos(a)*140-Math.sin(a)*offset,y:p.y+Math.sin(a)*140+Math.cos(a)*offset};return;
 }
 const state=game.battleDirector,squad=state.squad??={leader:e,members:[],target:p,layout,startedAt:game.t};
 squad.members.push(e);e.directorSquad=squad;e.directorSlot=squad.members.length-1;
 e.isFormationCommander=e===squad.leader;e.directorTarget=squad.target;
 if(!e.isFormationCommander){e.formationLeader=squad.leader;e.formationBack=70+e.directorSlot*15;e.formationOffset=(e.directorSlot%2?1:-1)*70}
 // Seed the existing pass states once. Waypoints are reused by the pass layer.
 const duration=state.endsAt-game.t;
 e.directorLayout=layout;e.directorIntentUntil=(game.t||0)+duration;
 e.combatPassState=S.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=0;e.combatPassSide=index%2?1:-1;
 if(e.isFormationCommander)e.combatPassTimer=layout==='cross'?2.2:3;
 if(layout==='cross'||layout==='bomber'){
  if(layout==='bomber'){e.a=a+Math.PI;e.combatPassState=S.COMMIT;e.combatPassTimer=Infinity}
  e.combatPassHeading=e.a;
 }else if(layout==='pincer'||layout==='chase'||layout==='escort'){
  e.combatPassState=S.REPOSITION;e.combatPassTimer=duration;
  const offset=layout==='pincer'?(index%2?1:-1)*110:side*95,front=layout==='pincer'?140:-120;
  e.combatPassWaypoint={x:p.x+Math.cos(a)*front-Math.sin(a)*offset,y:p.y+Math.sin(a)*front+Math.cos(a)*offset};
  if(layout==='escort'){
   e.directorEscort=game.enemies.find(target=>target!==e&&target.hp>0&&target.type==='bomber'&&target.directorSceneId===e.directorSceneId)||null;
   e.directorEscortOffset=side*95;
  }
 }
 if(e.type==='bomber'){e.combatPassState=S.COMMIT;e.combatPassHeading=e.a;e.combatPassTimer=duration}
 if(squad.broken||!(squad.leader.hp>0))breakFormation(e,game.t,2.5);
}

function breakFormation(e,now,duration,heading=e.a+(e.directorSlot%2?1:-1)*.95){
 delete e.formationLeader;delete e.directorTarget;delete e.directorSquad;
 e.isFormationCommander=false;e.directorFormationBroken=true;e.directorEscort=null;
 e.directorLayout='recovery';e.directorIntentUntil=e.directorBreakUntil=now+duration;
 e.combatPassState=S.DISENGAGE;e.combatPassHeading=heading;e.combatPassTimer=duration;
 e.combatPassCooldown=.6;e.personalityDecisionUntil=0;e.fire=Math.max(e.fire||0,duration);
}

function tickSquadron(game,state,dt){
 const squad=state.squad;if(!squad||squad.broken)return;
 const members=living(game,squad),now=game.t||0;
 if(!members.includes(squad.leader)){
  squad.broken=true;for(const e of members)breakFormation(e,now,2.5);return;
 }
 if(!(squad.target?.hp>0)||squad.target.status==='downed')squad.target=playerFor(game);
 for(const e of members)e.directorTarget=squad.target;
}

function sharePass(game,e,contact,dt,baseTurn,steer){
 const squad=e.directorSquad;if(!squad||squad.broken||e!==squad.leader||!['headOn','cross'].includes(squad.layout)||contact.fogHidden||baseTurn<=0)return;
 const before=e.combatPassState,intent=e.directorIntentUntil;let result;
 // Let the installed dogfight pass advance; only share its beat and headings.
 e.directorIntentUntil=0;try{result=steer.call(game,e,contact,dt,baseTurn)}finally{e.directorIntentUntil=e.defensivePressure?0:intent}
 for(const wing of living(game,squad)){
  wing.combatPassState=e.combatPassState;wing.combatPassTimer=e.combatPassTimer;
  if(before!==e.combatPassState&&e.combatPassState===S.ATTACK_PASS)wing.combatPassHeading=Math.atan2(contact.y-wing.y,contact.x-wing.x);
  if(before!==e.combatPassState&&e.combatPassState===S.DISENGAGE){wing.combatPassHeading=wing.a+(wing.directorSlot%2?1:-1)*.8;wing.fire=Math.max(wing.fire||0,1.05)}
 }
 return result;
}

function squadSteering(game,e,contact,dt,baseTurn){
 if(!contact||baseTurn<=0||e.bossPilot)return null;
 const now=game.t||0;
 if(e.directorBreakUntil>now)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.65};
 if(e.directorBreakUntil){delete e.directorBreakUntil;e.directorIntentUntil=0;e.directorLayout=null;e.combatPassState=S.APPROACH;e.combatPassTimer=0}
 const squad=e.directorSquad;if(!squad||squad.broken||contact.fogHidden)return null;
 const p=squad.target;if(p.kaiserFogTime>0||p.ballCloak>0)return null;
 const slot=e.directorSlot||0,side=slot%2?1:-1,row=Math.floor(slot/2),heading=p.a??0;
 let x=p.x,y=p.y;
 const offset=(forward,lateral)=>{x=p.x+Math.cos(heading)*forward-Math.sin(heading)*lateral;y=p.y+Math.sin(heading)*forward+Math.cos(heading)*lateral};
 if(squad.layout==='chase')offset(-90-row*30,slot?side*(40+row*20):0);
 else if(squad.layout==='decoy'){
  if(e===squad.leader){offset(160,Math.sin((now-squad.startedAt)*1.3)*105);e.fire=Math.max(e.fire||0,.4)}
  else offset(-125,side*(85+row*25));
 }else if(squad.layout==='escort'||squad.layout==='bomber'){
  const bomber=squad.members.find(w=>w.type==='bomber'&&w.hp>0);
  if(e.type==='bomber')return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.16};
  const close=bomber&&Math.hypot(p.x-bomber.x,p.y-bomber.y)<(squad.layout==='bomber'?380:280);
  if(bomber&&!close){const forward=squad.layout==='bomber'?100:-85;x=bomber.x+Math.cos(bomber.a)*forward-Math.sin(bomber.a)*side*(65+row*20);y=bomber.y+Math.sin(bomber.a)*forward+Math.cos(bomber.a)*side*(65+row*20)}
 }else{
  const phase=squad.leader.combatPassState;
  if([S.ATTACK_PASS,S.COMMIT,S.DISENGAGE].includes(phase))return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*(phase===S.DISENGAGE?.65:phase===S.COMMIT?.18:.72)};
  if(squad.layout==='cross')offset(phase===S.REPOSITION?180:70,side*(phase===S.REPOSITION?260+row*40:90+row*35));
  else offset(phase===S.REPOSITION?230:140,slot?side*(50+row*35):0);
 }
 e.combatPassWaypoint={x,y};
 return{delta:angleDiff(Math.atan2(y-e.y,x-e.x),e.a),turn:baseTurn};
}

function directorCap(game){
 const compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth,coop=game.mode==='coop2';
 return compact?(coop?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap):(coop?BATTLE_DIRECTOR_BALANCE.coopCap:BATTLE_DIRECTOR_BALANCE.soloCap);
}

function tickDirector(game,dt){
 if(game.mode==='campaign'||game.state!=='playing')return;
 const state=directorState(game),now=game.t||0;
 if(suspended(game)){for(const e of living(game,state.squad))breakFormation(e,now,2.5);state.squad=null;state.pattern=null;state.queue.length=0;state.nextSceneAt=Math.max(state.nextSceneAt,now+5);game.battleDirectorPattern=null;return}
 if(activeAce(game)&&state.pattern!==P.ACE_PRESSURE)beginPattern(game,state,P.ACE_PRESSURE);
 const completed=state.squad&&!state.queue.length&&!living(game,state.squad).length;
 if(state.pattern&&(now>=state.endsAt||completed)){
  const finished=state.pattern;
  if(finished===P.RECOVERY||finished===P.ACE_PRESSURE)beginPattern(game,state);
  else beginPattern(game,state,P.RECOVERY);
 }
 if(!state.pattern&&now>=state.nextSceneAt)beginPattern(game,state);
 if(!state.pattern)return;
 tickSquadron(game,state,dt);
 game.eventTimer=Math.max(game.eventTimer||0,state.endsAt-now+.5);
 if(state.pattern===P.ELITE_FORMATION&&!state.eliteRequested){
  if(game.eliteEnemies&&!game.eliteEnemies.active&&!activeAce(game)){state.eliteRequested=!!game.eliteEnemies.spawnEncounter?.()}
  else if(now-state.startedAt>.8){state.queue=action('hunter','cross',(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth?2:3);state.nextActionAt=now;state.eliteRequested=true}
 }
 if(now<state.nextActionAt||!state.queue.length)return;
 const live=(game.enemies||[]).filter(regular).length,room=directorCap(game)-live;
 if(room<(state.squad?1:Math.min(3,state.queue.length))){state.nextActionAt=now+.3;return}
 const next=state.queue[0],previous=game.directorSpawning;let e;
 game.directorSpawning=true;try{e=game.spawnEnemy?.(next.type)}finally{game.directorSpawning=previous}
 if(!e){state.nextActionAt=now+.3;return}
 state.queue.shift();place(game,e,next.layout,next.index,next.count);
 state.nextActionAt=now+BATTLE_DIRECTOR_BALANCE.actionInterval;
}

export function installBattleDirector(Game,deps={}){
 if(Game.prototype.__battleDirector169)return;Game.prototype.__battleDirector169=true;
 S=deps.passStates;directorAircraftEligible=deps.directorAircraftEligible;angleDiff=deps.angleDiff||((a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)));
 if(!S||typeof directorAircraftEligible!=='function')throw new Error('Battle Director requires dogfight pass dependencies');
 Game.prototype.tickBattleDirector=function(dt){return tickDirector(this,dt)};
 Game.prototype.beginBattleDirectorPattern=function(pattern){if(!Object.values(P).includes(pattern))return null;return beginPattern(this,directorState(this),pattern)};
 Game.prototype.directorMobSpawnsSuppressed=function(){return!!this.battleDirectorPattern&&this.battleDirectorPattern!==P.ACE_PRESSURE&&!suspended(this)&&!activeAce(this)};
 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  const squad=e.directorSquad;let base=sharePass(this,e,contact,dt,baseTurn,steer);
  if(squad&&!squad.broken&&e===squad.leader&&e.type!=='bomber'&&!base)base=steer.call(this,e,contact,dt,baseTurn);
  if(e.defensivePressure&&base)return base;
  return squadSteering(this,e,contact,dt,baseTurn)||base||steer.call(this,e,contact,dt,baseTurn);
 };
 const target=Game.prototype.enemyCombatTarget;
 Game.prototype.enemyCombatTarget=function(e){const contact=target.call(this,e),p=e.directorTarget;return e.directorSquad&&!e.directorSquad.broken&&p?.hp>0&&!p.kaiserFogTime&&!p.ballCloak&&!contact.fogHidden?p:contact};
 const regularLimit=Game.prototype.regularEnemyLimit;
 Game.prototype.regularEnemyLimit=function(){const base=regularLimit.call(this);if((this.viewWidth||960)>BATTLE_DIRECTOR_BALANCE.compactWidth)return base;return Math.min(base,this.mode==='coop2'?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap)};
 const interval=Game.prototype.regularSpawnInterval;
 Game.prototype.regularSpawnInterval=function(){const base=interval.call(this),pattern=this.battleDirectorPattern;if(pattern===P.RECOVERY)return base*3.2;if(pattern===P.ACE_PRESSURE||pattern===P.ELITE_FORMATION||pattern===P.BOMBER_RUN)return base*1.7;return pattern?base*1.25:base};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){this.tickBattleDirector(Math.min(.04,Math.max(0,dt||0)));return update.call(this,dt,input)};
}
