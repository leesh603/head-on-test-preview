export const BATTLE_DIRECTOR_PATTERNS=Object.freeze({
 HEAD_ON_PASS:'HEAD_ON_PASS',CROSS_ATTACK:'CROSS_ATTACK',PINCER:'PINCER',CHASE:'CHASE',ESCORT:'ESCORT',DECOY:'DECOY',
 BOMBER_RUN:'BOMBER_RUN',ELITE_FORMATION:'ELITE_FORMATION',ACE_PRESSURE:'ACE_PRESSURE',RECOVERY:'RECOVERY'
});

export const BATTLE_DIRECTOR_BALANCE=Object.freeze({
 firstSceneAt:6,sceneMin:18,sceneMax:23,recoveryDuration:4.5,recentWindow:3,
 compactWidth:720,compactSoloCap:8,compactCoopCap:10,soloCap:11,coopCap:14,actionInterval:.48,
 headOnIntent:7,crossIntent:7,pincerIntent:7,chaseIntent:7,escortIntent:8,bomberIntent:8,decoyIntent:7,decoyWingIntent:7
});

const P=BATTLE_DIRECTOR_PATTERNS;
let S,directorAircraftEligible;
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;
const activeAce=game=>(game.enemies||[]).some(e=>e.hp>0&&!e.expired&&!e.rivalEscaped&&(e.bossPilot||e.type==='boss'));
const scriptedBoss=game=>game.stageBoss?.stages?.phase==='boss';
const regular=e=>e?.hp>0&&!e.bossPilot&&!e.heavyBomber&&!e.surface&&!e.stationary&&!e.missionTarget&&['scout','hunter','bomber'].includes(e.type);

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
 if(activeAce(game)&&state.history.at(-1)!==P.ACE_PRESSURE)return P.ACE_PRESSURE;
 if(state.combatSinceRecovery>=1)return P.RECOVERY;
 const time=game.t||0,candidates=time<120?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.CHASE,P.DECOY]:time<360?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.ESCORT,P.DECOY,P.BOMBER_RUN]:[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.ESCORT,P.DECOY,P.BOMBER_RUN,P.ELITE_FORMATION];
 return weightedChoice(game,state,candidates);
}

function action(type,layout,count=1){return Array.from({length:count},(_,index)=>({type,layout,index,count}))}
function planFor(pattern,time,compact){
 const pressure=time<120?(compact?3:4):time<360?(compact?4:5):compact?4:6;
 if(pattern===P.HEAD_ON_PASS)return action('hunter','headOn',pressure);
 if(pattern===P.CROSS_ATTACK)return action('hunter','cross',pressure);
 if(pattern===P.PINCER)return action('hunter','pincer',pressure);
 if(pattern===P.CHASE)return action(time<180?'scout':'hunter','chase',pressure);
 if(pattern===P.ESCORT)return[...action('bomber','bomber',1),...action('hunter','escort',pressure-1)];
 if(pattern===P.DECOY)return[...action('scout','decoy',1),...action('hunter','decoyWing',pressure-1)];
 if(pattern===P.BOMBER_RUN)return[...action('bomber','bomber',Math.min(2,pressure-2)),...action('hunter','escort',pressure-Math.min(2,pressure-2))];
 return[];
}

function beginPattern(game,state,pattern=choosePattern(game,state)){
 const now=game.t||0,compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth;
 state.pattern=pattern;state.phase='ENTRY';state.startedAt=now;state.sceneId++;state.eliteRequested=false;state.leaders={};
 state.endsAt=now+(pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:pattern===P.ACE_PRESSURE?20:BATTLE_DIRECTOR_BALANCE.sceneMin+(game.rng?.()??Math.random())*(BATTLE_DIRECTOR_BALANCE.sceneMax-BATTLE_DIRECTOR_BALANCE.sceneMin));
 state.nextActionAt=now+.35;state.queue=planFor(pattern,now,compact);state.history.push(pattern);state.history=state.history.slice(-6);
 if(pattern===P.RECOVERY)state.combatSinceRecovery=0;else if(pattern!==P.ACE_PRESSURE)state.combatSinceRecovery++;
 game.battleDirectorPattern=pattern;game.spawn=pattern===P.RECOVERY?Math.min(game.spawn||0,1.1):Math.max(game.spawn||0,1.2);
 if(pattern===P.RECOVERY){
  const p=playerFor(game);
  for(const e of game.enemies||[])if(directorAircraftEligible(game,e)){
   e.directorLayout='recovery';e.directorIntentUntil=state.endsAt;e.directorEscort=null;
   e.combatPassState=S.DISENGAGE;e.combatPassTimer=BATTLE_DIRECTOR_BALANCE.recoveryDuration;
   e.combatPassHeading=Math.atan2(e.y-p.y,e.x-p.x);
  }
 }
 return pattern;
}

function place(game,e,layout,index,count){
 const p=playerFor(game),a=Number.isFinite(p.a)?p.a:-Math.PI/2,side=index-(count-1)/2;
 let forward=layout==='headOn'?720:500,lateral=side*115;
 if(layout==='cross'){forward=80;lateral=(index%2?1:-1)*500+Math.floor(index/2)*28}
 else if(layout==='pincer'){forward=320;lateral=(index%2?1:-1)*360+Math.floor(index/2)*26}
 else if(layout==='chase'){forward=-220;lateral=side*100}
 else if(layout==='escort'){forward=440;lateral=side*95}
 else if(layout==='bomber'){forward=610;lateral=side*180}
 else if(layout==='decoy'){forward=490;lateral=0}
 else if(layout==='decoyWing'){forward=-190;lateral=(index%2?1:-1)*(170+index*22)}
 e.x=p.x+Math.cos(a)*forward-Math.sin(a)*lateral;e.y=p.y+Math.sin(a)*forward+Math.cos(a)*lateral;
 e.a=layout==='chase'?a:Math.atan2(p.y-e.y,p.x-e.x);e.directorPattern=game.battleDirectorPattern;e.directorSceneId=game.battleDirector.sceneId;
 if(!directorAircraftEligible(game,e))return;
 // Seed the existing pass states once. Waypoints are reused by the pass layer.
 const duration=BATTLE_DIRECTOR_BALANCE[`${layout}Intent`];
 e.directorLayout=layout;e.directorIntentUntil=(game.t||0)+duration;
 if(layout==='chase'||layout==='decoyWing'){
  e.directorCruise={speed:e.speed,dogfight:e.dogfightCruise,personality:e.personalityCruise,cap:e.cruiseSpeedCap};
  e.speed=Math.min(265,Math.max(e.speed,(p.speed||170)*1.3));e.dogfightCruise=e.speed;e.personalityCruise=e.speed;e.cruiseSpeedCap=Math.max(e.cruiseSpeedCap||0,e.speed);
 }
 e.combatPassState=S.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=0;e.combatPassSide=index%2?1:-1;
 if(layout==='cross'||layout==='bomber'){
  e.a=layout==='cross'?a+(index%2?-1:1)*Math.PI/2:a+Math.PI;
  e.combatPassState=S.COMMIT;e.combatPassHeading=e.a;e.combatPassTimer=duration;
 }else if(layout==='pincer'||layout==='chase'||layout==='escort'||layout==='decoyWing'){
  e.combatPassState=S.REPOSITION;e.combatPassTimer=duration;
  const offset=layout==='pincer'?(index%2?1:-1)*110:side*95,front=layout==='pincer'?140:-120;
  e.combatPassWaypoint={x:p.x+Math.cos(a)*front-Math.sin(a)*offset,y:p.y+Math.sin(a)*front+Math.cos(a)*offset};
  if(layout==='escort'){
   e.directorEscort=game.enemies.find(target=>target!==e&&target.hp>0&&target.type==='bomber'&&target.directorSceneId===e.directorSceneId)||null;
   e.directorEscortOffset=side*95;
  }
 }
 const state=game.battleDirector,group=layout==='decoyWing'?'wing':layout==='bomber'&&index>0?'bomber'+index:layout==='cross'||layout==='pincer'?String(index%2):'main';
 if(!state.leaders[group])state.leaders[group]=e;
 else{
  const leader=state.leaders[group];e.formationLeader=leader;e.directorFormation=true;
  const slot=Math.floor(index/2)+1,offset=(index%2?1:-1)*(55+slot*11),back=58+slot*22;
  e.formationBack=back;e.formationOffset=offset;
  e.x=leader.x-Math.cos(leader.a)*back-Math.sin(leader.a)*offset;
  e.y=leader.y-Math.sin(leader.a)*back+Math.cos(leader.a)*offset;
  e.a=leader.a;
 }
}

function directorCap(game){
 const compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth,coop=game.mode==='coop2';
 return compact?(coop?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap):(coop?BATTLE_DIRECTOR_BALANCE.coopCap:BATTLE_DIRECTOR_BALANCE.soloCap);
}

function tickDirector(game,dt){
 if(game.mode==='campaign'||game.state!=='playing')return;
 const state=directorState(game),now=game.t||0;
 if(scriptedBoss(game)){state.pattern=null;state.queue.length=0;state.nextSceneAt=Math.max(state.nextSceneAt,now+5);game.battleDirectorPattern=null;return}
 if(state.pattern&&state.pattern!==P.RECOVERY&&!state.queue.length&&now-state.startedAt>7&&!game.enemies.some(e=>e.hp>0&&e.directorSceneId===state.sceneId))state.endsAt=now;
 if(state.pattern&&now>=state.endsAt){state.pattern=null;state.phase='CLEANUP';state.queue.length=0;state.nextSceneAt=now;game.battleDirectorPattern=null}
 if(!state.pattern&&now>=state.nextSceneAt)beginPattern(game,state);
 if(!state.pattern)return;
 if(state.pattern!==P.RECOVERY){
  const age=now-state.startedAt,commitEnd=[P.CROSS_ATTACK,P.PINCER].includes(state.pattern)?7:5,phase=state.queue.length?'ENTRY':age<3.5?'APPROACH':age<commitEnd?'TACTIC':age<commitEnd+2?'BREAK':'REGROUP';
  if(phase!==state.phase){state.phase=phase;if(phase==='BREAK')for(const e of game.enemies||[])if(e.directorSceneId===state.sceneId&&directorAircraftEligible(game,e)){e.combatPassState=S.DISENGAGE;e.combatPassTimer=2.3;e.combatPassHeading=e.a+(e.combatPassSide||1)*.32}}
 }
 game.eventTimer=Math.max(game.eventTimer||0,state.endsAt-now+.5);
 if(state.pattern===P.ELITE_FORMATION&&!state.eliteRequested){
  if(game.eliteEnemies&&!game.eliteEnemies.active&&!activeAce(game)){state.eliteRequested=!!game.eliteEnemies.spawnEncounter?.()}
  else if(now-state.startedAt>.8){state.queue=action('hunter','cross',(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth?2:3);state.nextActionAt=now;state.eliteRequested=true}
 }
 if(now<state.nextActionAt||!state.queue.length)return;
 const live=(game.enemies||[]).filter(regular).length;if(live>=directorCap(game)){state.nextActionAt=now+.7;return}
 const next=state.queue.shift(),e=game.spawnEnemy?.(next.type);if(e)place(game,e,next.layout,next.index,next.count);else state.queue.unshift(next);
 state.nextActionAt=now+BATTLE_DIRECTOR_BALANCE.actionInterval;
}

export function installBattleDirector(Game,deps={}){
 if(Game.prototype.__battleDirector169)return;Game.prototype.__battleDirector169=true;
 S=deps.passStates;directorAircraftEligible=deps.directorAircraftEligible;
 if(!S||typeof directorAircraftEligible!=='function')throw new Error('Battle Director requires dogfight pass dependencies');
 Game.prototype.tickBattleDirector=function(dt){return tickDirector(this,dt)};
 Game.prototype.beginBattleDirectorPattern=function(pattern){if(!Object.values(P).includes(pattern))return null;return beginPattern(this,directorState(this),pattern)};
 const regularLimit=Game.prototype.regularEnemyLimit;
 Game.prototype.regularEnemyLimit=function(){const base=regularLimit.call(this);if((this.viewWidth||960)>BATTLE_DIRECTOR_BALANCE.compactWidth)return base;return Math.min(base,this.mode==='coop2'?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap)};
 const interval=Game.prototype.regularSpawnInterval;
 Game.prototype.regularSpawnInterval=function(){const base=interval.call(this),pattern=this.battleDirectorPattern;if(pattern===P.RECOVERY)return base*1.65;if(pattern===P.ACE_PRESSURE||pattern===P.ELITE_FORMATION)return base*1.7;return pattern?base*2.2:this.mode!=='campaign'&&this.t<120?base*.82:base};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){const result=update.call(this,dt,input);this.tickBattleDirector(Math.min(.04,Math.max(0,dt||0)));return result};
}
