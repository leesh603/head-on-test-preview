export const BATTLE_DIRECTOR_PATTERNS=Object.freeze({
 HEAD_ON_PASS:'HEAD_ON_PASS',CROSS_ATTACK:'CROSS_ATTACK',PINCER:'PINCER',CHASE:'CHASE',ESCORT:'ESCORT',
 BOMBER_RUN:'BOMBER_RUN',ELITE_FORMATION:'ELITE_FORMATION',ACE_PRESSURE:'ACE_PRESSURE',RECOVERY:'RECOVERY'
});

export const BATTLE_DIRECTOR_BALANCE=Object.freeze({
 firstSceneAt:18,sceneMin:22,sceneMax:28,recoveryDuration:7,recentWindow:3,
 compactWidth:720,compactSoloCap:8,compactCoopCap:10,soloCap:11,coopCap:14,actionInterval:.48,
 formationBreakDuration:2.6,headOnIntent:6,crossIntent:6.5,pincerIntent:4.5,chaseIntent:5,escortIntent:7,bomberIntent:8
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
 if(state.combatSinceRecovery>=2)return P.RECOVERY;
 const time=game.t||0,candidates=time<120?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.CHASE]:time<360?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.ESCORT,P.BOMBER_RUN]:[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.ESCORT,P.BOMBER_RUN,P.ELITE_FORMATION];
 return weightedChoice(game,state,candidates);
}

function action(type,layout,count=1){return Array.from({length:count},(_,index)=>({type,layout,index,count}))}
function planFor(pattern,time,compact){
 const pressure=time<120?1:time<360?2:compact?2:3;
 if(pattern===P.HEAD_ON_PASS)return action('hunter','headOn',pressure);
 if(pattern===P.CROSS_ATTACK)return action('hunter','cross',Math.max(2,pressure));
 if(pattern===P.PINCER)return action('hunter','pincer',2);
 if(pattern===P.CHASE)return action(time<180?'scout':'hunter','chase',pressure);
 if(pattern===P.ESCORT)return[...action('bomber','bomber',1),...action('hunter','escort',Math.min(2,pressure))];
 if(pattern===P.BOMBER_RUN)return action('bomber','bomber',time<420?1:2);
 return[];
}

function beginPattern(game,state,pattern=choosePattern(game,state)){
 const now=game.t||0,compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth;
 pattern=game.beginBattlefieldEngagement?.(pattern,state.sceneId+1,now+18)||pattern;
 state.pattern=pattern;state.startedAt=now;state.sceneId++;state.eliteRequested=false;
 state.endsAt=now+(pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:pattern===P.ACE_PRESSURE?20:BATTLE_DIRECTOR_BALANCE.sceneMin+(game.rng?.()??Math.random())*(BATTLE_DIRECTOR_BALANCE.sceneMax-BATTLE_DIRECTOR_BALANCE.sceneMin));
 state.nextActionAt=now+.35;state.queue=planFor(pattern,now,compact);state.history.push(pattern);state.history=state.history.slice(-6);
 if(pattern===P.RECOVERY)state.combatSinceRecovery=0;else if(pattern!==P.ACE_PRESSURE)state.combatSinceRecovery++;
 game.battleDirectorPattern=pattern;game.spawn=Math.max(game.spawn||0,pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:1.2);
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
 let forward=500,lateral=side*115;
 if(layout==='cross'){forward=80;lateral=(index%2?1:-1)*500+side*55}
 else if(layout==='pincer'){forward=320;lateral=(index%2?1:-1)*360}
 else if(layout==='chase'){forward=-360;lateral=side*100}
 else if(layout==='escort'){forward=440;lateral=side*95}
 else if(layout==='bomber'){forward=610;lateral=side*180}
 e.x=p.x+Math.cos(a)*forward-Math.sin(a)*lateral;e.y=p.y+Math.sin(a)*forward+Math.cos(a)*lateral;
 e.a=layout==='chase'?a:Math.atan2(p.y-e.y,p.x-e.x);e.directorPattern=game.battleDirectorPattern;e.directorSceneId=game.battleDirector.sceneId;
 if(!directorAircraftEligible(game,e))return;
 // Seed the existing pass states once. Waypoints are reused by the pass layer.
 const duration=BATTLE_DIRECTOR_BALANCE[`${layout}Intent`];
 e.directorLayout=layout;e.directorIntentUntil=(game.t||0)+duration;
 e.combatPassState=S.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=0;e.combatPassSide=index%2?1:-1;
 if(layout==='cross'||layout==='bomber'){
  e.a=layout==='cross'?a+(index%2?-1:1)*Math.PI/2:a+Math.PI;
  e.combatPassState=S.COMMIT;e.combatPassHeading=e.a;e.combatPassTimer=duration;
 }else if(layout==='pincer'||layout==='chase'||layout==='escort'){
  e.combatPassState=S.REPOSITION;e.combatPassTimer=duration;
  const offset=layout==='pincer'?(index%2?1:-1)*110:side*95,front=layout==='pincer'?140:-120;
  e.combatPassWaypoint={x:p.x+Math.cos(a)*front-Math.sin(a)*offset,y:p.y+Math.sin(a)*front+Math.cos(a)*offset};
  if(layout==='escort'){
   e.directorEscort=game.enemies.find(target=>target!==e&&target.hp>0&&target.type==='bomber'&&target.directorSceneId===e.directorSceneId)||null;
   e.directorEscortOffset=side*95;
  }
 }
}

function linkFormation(game,e){
 if(!regular(e)||!['scout','hunter'].includes(e.type))return;
 const peers=game.enemies.filter(other=>other!==e&&regular(other)&&other.directorSceneId===e.directorSceneId&&['scout','hunter'].includes(other.type));
 const leader=peers.find(other=>other.formationCommand)||peers[0]||e;
 leader.formationCommand=true;leader.directorFormation=true;e.directorFormation=true;
 if(leader!==e){e.formationLeader=leader;e.formationBack=70+Math.floor(peers.length/2)*38;e.formationOffset=(peers.length%2?1:-1)*(60+Math.floor(peers.length/2)*35)}
 game.assignNormalFormationLivery?.(e,leader,peers.length);
 const outcome=game.battlefieldEvents?.engagement;
 if(outcome?.formationWeakened&&outcome.sceneId===e.directorSceneId&&outcome.endsAt>(game.t||0))game.breakEnemyFormation(e);
}

function breakFormation(game,e,duration=BATTLE_DIRECTOR_BALANCE.formationBreakDuration,leaderLost=false){
 if(!e||e.hp<=0||e.surface||e.stationary||e.fieldUnit||e.navalVessel)return false;
 const now=game.t||0;
 const commander=e.formationLeader||e.formationResumeLeader;
 leaderLost=leaderLost||!!(commander&&(commander.hp<=0||!(game.enemies||[]).includes(commander)));
 // Leader death replaces a short live-leader disruption once; repeated explosions cannot extend it.
 if(e.formationCollapseUntil>now&&(!leaderLost||e.formationDeathBreak))return false;
 if(leaderLost)duration=BATTLE_DIRECTOR_BALANCE.formationBreakDuration;
 e.formationDeathBreak=leaderLost;
 const side=Math.sign(e.formationOffset)||e.combatPassSide||(game.rng?.()<.5?-1:1);
 e.formationBreakHeading=e.a+side*1.05;e.formationCollapseUntil=now+duration;
 e.formationResumeLeader=!leaderLost&&commander?.hp>0?commander:null;e.formationResumeCommand=!leaderLost&&!!(e.formationCommand||e.formationResumeCommand);
 e.formationLeader=null;e.formationReturning=false;e.formationCommand=false;e.directorIntentUntil=0;e.directorEscort=null;
 e.patrolTarget=null;e.personalityDecisionUntil=0;e.personalityManeuver=null;e.defensivePressure=false;
 e.attackPassTime=0;e.attackPassHeading=null;e.reengageCooldown=duration;e.combatPassState=S.DISENGAGE;e.combatPassTimer=duration;e.combatPassWaypoint=null;e.combatPassHeading=e.formationBreakHeading;
 e.fire=Math.max(e.fire||0,duration+.2);return true;
}

function maintainFormations(game){
 const now=game.t||0;
 for(const e of game.enemies||[]){
  if(e.hp<=0)continue;
  const leader=e.formationLeader||e.formationResumeLeader;
  // Boss/ace escorts keep their existing encounter mechanics; only ordinary aircraft groups use this feature.
  if(leader&&!leader.bossPilot&&!leader.stageBossBody&&!leader.bossMinion&&(leader.hp<=0||!(game.enemies||[]).includes(leader)))breakFormation(game,e,undefined,true);
  if(e.formationCollapseUntil&&e.formationCollapseUntil<=now){
   e.formationLeader=e.formationResumeLeader?.hp>0&&(game.enemies||[]).includes(e.formationResumeLeader)?e.formationResumeLeader:null;e.formationCommand=!!e.formationResumeCommand;e.formationResumeLeader=null;e.formationResumeCommand=false;
   e.formationCollapseUntil=0;e.formationDeathBreak=false;e.formationBreakHeading=null;e.combatPassState=S.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=.4;e.combatPassHeading=null;e.personalityDecisionUntil=0;e.patrolTarget=null;
  }
 }
}

function directorCap(game){
 const compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth,coop=game.mode==='coop2';
 return compact?(coop?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap):(coop?BATTLE_DIRECTOR_BALANCE.coopCap:BATTLE_DIRECTOR_BALANCE.soloCap);
}

function tickDirector(game,dt){
 if(game.state!=='playing')return;maintainFormations(game);if(game.mode==='campaign')return;
 const state=directorState(game),now=game.t||0;
 if(scriptedBoss(game)){state.pattern=null;state.queue.length=0;state.nextSceneAt=Math.max(state.nextSceneAt,now+5);game.battleDirectorPattern=null;return}
 if(state.pattern&&now>=state.endsAt){state.pattern=null;state.queue.length=0;state.nextSceneAt=now;game.battleDirectorPattern=null}
 if(!state.pattern&&now>=state.nextSceneAt)beginPattern(game,state);
 if(!state.pattern)return;
 game.eventTimer=Math.max(game.eventTimer||0,state.endsAt-now+.5);
 if(state.pattern===P.ELITE_FORMATION&&!state.eliteRequested){
  if(game.eliteEnemies&&!game.eliteEnemies.active&&!activeAce(game)){state.eliteRequested=!!game.eliteEnemies.spawnEncounter?.()}
  else if(now-state.startedAt>.8){state.queue=action('hunter','cross',(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth?2:3);state.nextActionAt=now;state.eliteRequested=true}
 }
 if(now<state.nextActionAt||!state.queue.length)return;
 const live=(game.enemies||[]).filter(regular).length;if(live>=directorCap(game)){state.nextActionAt=now+.7;return}
 const next=state.queue.shift(),e=game.spawnEnemy?.(next.type);if(e){place(game,e,next.layout,next.index,next.count);linkFormation(game,e)}
 state.nextActionAt=now+BATTLE_DIRECTOR_BALANCE.actionInterval;
}

export function installBattleDirector(Game,deps={}){
 if(Game.prototype.__battleDirector169)return;Game.prototype.__battleDirector169=true;
 S=deps.passStates;directorAircraftEligible=deps.directorAircraftEligible;
 if(!S||typeof directorAircraftEligible!=='function')throw new Error('Battle Director requires dogfight pass dependencies');
 Game.prototype.maintainEnemyFormations=function(){return maintainFormations(this)};
 Game.prototype.breakEnemyFormation=function(e,duration){const world=this.combatWorld?.()||this;if(e?.eliteKind)return world.eliteEnemies?.disruptFormation?.(e,duration)||false;return breakFormation(world,e,duration)};
 const steering=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){if(e?.formationCollapseUntil>(this.t||0))return{delta:Math.atan2(Math.sin(e.formationBreakHeading-e.a),Math.cos(e.formationBreakHeading-e.a)),turn:baseTurn*.85};return steering.call(this,e,contact,dt,baseTurn)};
 const fire=Game.prototype.fireEnemy;
 Game.prototype.fireEnemy=function(e,...args){if(e?.formationCollapseUntil>(this.t||0)){e.fire=Math.max(e.fire||0,e.formationCollapseUntil-(this.t||0)+.2);return}return fire.call(this,e,...args)};
 Game.prototype.tickBattleDirector=function(dt){return tickDirector(this,dt)};
 Game.prototype.beginBattleDirectorPattern=function(pattern){if(!Object.values(P).includes(pattern))return null;return beginPattern(this,directorState(this),pattern)};
 const regularLimit=Game.prototype.regularEnemyLimit;
 Game.prototype.regularEnemyLimit=function(){const base=regularLimit.call(this);if((this.viewWidth||960)>BATTLE_DIRECTOR_BALANCE.compactWidth)return base;return Math.min(base,this.mode==='coop2'?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap)};
 const interval=Game.prototype.regularSpawnInterval;
 Game.prototype.regularSpawnInterval=function(){const base=interval.call(this),pattern=this.battleDirectorPattern;if(pattern===P.RECOVERY)return base*3.2;if(pattern===P.ACE_PRESSURE||pattern===P.ELITE_FORMATION||pattern===P.BOMBER_RUN)return base*1.7;return pattern?base*1.25:base};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){if(this.state==='playing')maintainFormations(this);const result=update.call(this,dt,input);if(this.state==='playing')maintainFormations(this);this.tickBattleDirector(Math.min(.04,Math.max(0,dt||0)));return result};
}
