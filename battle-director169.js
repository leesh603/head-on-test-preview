export const BATTLE_DIRECTOR_PATTERNS=Object.freeze({
 HEAD_ON_PASS:'HEAD_ON_PASS',CROSS_ATTACK:'CROSS_ATTACK',PINCER:'PINCER',CHASE:'CHASE',ESCORT:'ESCORT',DECOY:'DECOY',
 BOMBER_RUN:'BOMBER_RUN',BAIT:'BAIT',VETERAN_FORMATION:'VETERAN_FORMATION',ELITE_FORMATION:'ELITE_FORMATION',ACE_PRESSURE:'ACE_PRESSURE',RECOVERY:'RECOVERY'
});

export const BATTLE_DIRECTOR_BALANCE=Object.freeze({
 firstSceneAt:6,sceneMin:18,sceneMax:23,recoveryDuration:4.5,recentWindow:3,
 compactWidth:720,compactSoloCap:8,compactCoopCap:10,soloCap:11,coopCap:14,actionInterval:.48,
 formationBreakDuration:2.6,headOnIntent:7,crossIntent:7,pincerIntent:7,chaseIntent:7,escortIntent:8,bomberIntent:8,decoyIntent:7,decoyWingIntent:7
});

const P=BATTLE_DIRECTOR_PATTERNS;
let S,directorAircraftEligible,planes,attachPersonality,angleDiff;
// Only unit/squadron paint schemes from the aircraft catalog, never ace fits.
export const DIRECTOR_LIVERIES=Object.freeze({central:Object.freeze(['jasta11_fokkerd7','jasta18_fokkerd7','jasta27_fokkerd7','jasta43_fokkerd7']),entente:Object.freeze(['dazzle_camel','checker_se5a'])});
const playerFor=game=>game.players?.find(p=>p?.hp>0&&(!p.status||p.status==='alive'))||game;
const activeAce=game=>(game.enemies||[]).some(e=>e.hp>0&&!e.expired&&!e.rivalEscaped&&(e.bossPilot||e.type==='boss'));
const scriptedBoss=game=>game.stageBoss?.stages?.phase==='boss';
const suspended=game=>scriptedBoss(game)||game.battlefieldEvents?.current?.status==='active'||!!game.londonBattle||(game.eliteEnemies?.active&&game.battleDirectorPattern!==P.ELITE_FORMATION);
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
 const time=game.t||0,candidates=time<120?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.CHASE,P.DECOY]:time<360?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.BAIT,P.ESCORT,P.DECOY,P.BOMBER_RUN]:[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.BAIT,P.ESCORT,P.DECOY,P.BOMBER_RUN,P.VETERAN_FORMATION,P.ELITE_FORMATION];
 return weightedChoice(game,state,candidates);
}

function action(type,layout,count=1){return Array.from({length:count},(_,index)=>({type,layout,index,count}))}
function planFor(pattern,time,compact){
 const pressure=time<120?(compact?3:4):time<360?(compact?4:5):compact?4:6;
 if(pattern===P.HEAD_ON_PASS)return action('hunter','headOn',Math.max(2,pressure));
 if(pattern===P.CROSS_ATTACK)return action('hunter','cross',Math.max(2,pressure));
 if(pattern===P.PINCER)return action('hunter','pincer',2);
 if(pattern===P.CHASE)return action(time<180?'scout':'hunter','chase',Math.max(2,pressure));
 if(pattern===P.DECOY)return[...action('scout','decoy',1),...action('hunter','decoyWing',Math.max(2,pressure-1))];
 if(pattern===P.BAIT)return action('hunter','bait',3);
 if(pattern===P.VETERAN_FORMATION)return action('hunter','veteran',3);
 if(pattern===P.ESCORT)return[...action('bomber','bomber',1),...action('hunter','escort',Math.max(1,pressure-1))];
 if(pattern===P.BOMBER_RUN)return[...action('bomber','bomber',Math.min(2,Math.max(1,pressure-2))),...action('hunter','escort',pressure-Math.min(2,Math.max(1,pressure-2)))];
 return[];
}

function beginPattern(game,state,pattern=choosePattern(game,state)){
 const now=game.t||0,compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth;
 pattern=game.beginBattlefieldEngagement?.(pattern,state.sceneId+1,now+18)||pattern;
 const player=playerFor(game);state.anchor={x:player.x,y:player.y,a:player.a};state.phase=pattern===P.RECOVERY?'quiet':'approach';state.spawned=0;state.dispersed=false;state.clearSince=null;state.formationBroken=false;
 state.pattern=pattern;state.startedAt=now;state.sceneId++;state.eliteRequested=false;
 state.endsAt=now+(pattern===P.RECOVERY?BATTLE_DIRECTOR_BALANCE.recoveryDuration:pattern===P.ACE_PRESSURE?20:BATTLE_DIRECTOR_BALANCE.sceneMin+(game.rng?.()??Math.random())*(BATTLE_DIRECTOR_BALANCE.sceneMax-BATTLE_DIRECTOR_BALANCE.sceneMin));
 state.nextActionAt=now+.35;state.queue=planFor(pattern,now,compact);state.history.push(pattern);state.history=state.history.slice(-6);
 if(pattern===P.RECOVERY)state.combatSinceRecovery=0;else if(pattern!==P.ACE_PRESSURE)state.combatSinceRecovery++;
 game.battleDirectorPattern=pattern;game.spawn=pattern===P.RECOVERY?Math.min(game.spawn||0,1.1):Math.max(game.spawn||0,1.2);
 if(pattern!==P.ACE_PRESSURE){
  const p=playerFor(game),duration=Math.max(1,state.endsAt-now);
  for(const e of game.enemies||[])if(directorAircraftEligible(game,e)){
   if(e.directorSquad){releaseSquadMember(e);delete e.directorSquad;e.directorBreakUntil=state.endsAt}
   e.directorLayout='recovery';e.directorIntentUntil=state.endsAt;e.directorEscort=null;
   e.combatPassState=S.DISENGAGE;e.combatPassTimer=duration;
   e.combatPassHeading=Math.atan2(e.y-p.y,e.x-p.x);
  }
 }
 return pattern;
}

function place(game,e,layout,index,count){
 const p=game.battleDirector?.anchor||playerFor(game),a=Number.isFinite(p.a)?p.a:-Math.PI/2,side=index-(count-1)/2;
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
 if(e.type==='bomber')e.dangerHeavy=true;
 joinSquadron(game,e,layout,index);
 // Seed the existing pass states once. Waypoints are reused by the pass layer.
 const duration=BATTLE_DIRECTOR_BALANCE[`${layout}Intent`]||7;
 e.directorLayout=layout;e.directorAnchorHeading=a;e.directorIntentStartedAt=game.t||0;e.directorIntentUntil=(game.t||0)+duration;
 if(layout==='chase'||layout==='decoyWing'){
  e.directorCruise={speed:e.speed,dogfight:e.dogfightCruise,personality:e.personalityCruise,cap:e.cruiseSpeedCap};
  e.speed=Math.min(265,Math.max(e.speed,(p.speed||170)*1.3));e.dogfightCruise=e.speed;e.personalityCruise=e.speed;e.cruiseSpeedCap=Math.max(e.cruiseSpeedCap||0,e.speed);
 }
 if(layout==='headOn'||layout==='cross'){
  e.directorRallyUntil=game.battleDirector.startedAt+2.2;
  e.directorRallyHeading=layout==='headOn'?a+Math.PI:a+(index%2?-1:1)*Math.PI/2;
  e.a=e.directorRallyHeading;
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
   e.directorEscortOffset=count===1?95:side*150;
   const bomber=e.directorEscort;if(bomber){const offset=e.directorEscortOffset;e.a=bomber.a;e.x=bomber.x-Math.cos(bomber.a)*90-Math.sin(bomber.a)*offset;e.y=bomber.y-Math.sin(bomber.a)*90+Math.cos(bomber.a)*offset;}
  }
 }
 if(e.isFormationCommander&&e.combatPassState===S.APPROACH)e.combatPassTimer=3;
}

function joinSquadron(game,e,layout,index){
 const tactic=layout==='pincer'?'cross':layout==='bomber'&&(game.battleDirectorPattern===P.ESCORT||game.battleDirectorPattern===P.BOMBER_RUN)?'escort':layout;
 if(!['headOn','cross','chase','bait','escort','veteran','decoyWing'].includes(tactic))return;
 const previous=game.enemies.find(w=>w!==e&&w.directorSceneId===e.directorSceneId&&w.directorSquad?.tactic===tactic);
 const squad=previous?.directorSquad||{tactic,leader:e,members:[],target:playerFor(game),until:game.battleDirector.endsAt,startedAt:game.t||0};
 squad.members.push(e);e.directorSquad=squad;e.directorSlot=squad.members.length-1;e.directorTarget=squad.target;
 e.isFormationCommander=squad.leader===e;e.formationCommand=e.isFormationCommander;
 if(!e.isFormationCommander){e.formationLeader=squad.leader;e.formationBack=65;e.formationOffset=index%2?75:-75}
 if(tactic==='veteran'){
  const paint=DIRECTOR_LIVERIES[e.faction],key=paint[e.directorSlot%paint.length],base=key==='checker_se5a'?'se5a':key==='dazzle_camel'?'camel':'fokkerd7';
  e.escortPlane=key;attachPersonality?.(planes,e,base);e.dangerMarksman=e.directorSlot===1;
 }else if(tactic==='cross')e.dangerMarksman=e.directorSlot===1;
 e.dangerPursuit=tactic==='chase';
}

function releaseSquadMember(e){
 if(e.formationLeader!==null)delete e.formationLeader;e.isFormationCommander=false;e.directorIntentUntil=0;e.directorEscort=null;
 e.combatPassTimer=0;e.combatPassCooldown=.6;e.personalityDecisionUntil=0;e.dogfightMode='APPROACH';
 delete e.directorTarget;e.pursuitEngaged=false;e.dangerAimUntil=0;
}

function tickSquadrons(game,dt){
 const now=game.t||0,seen=new Set();
 for(const e of game.enemies||[]){const squad=e.directorSquad;if(!squad||seen.has(squad))continue;seen.add(squad);
  const living=squad.members.filter(w=>w.hp>0&&!w.expired&&game.enemies.includes(w));
  if(now>=squad.until||game.stageBoss?.stages?.phase==='boss'){
   for(const w of living){releaseSquadMember(w);delete w.directorSquad}continue;
  }
  if(!squad.broken&&(!living.includes(squad.leader)||squad.leader.hp<=0)){
   squad.broken=true;squad.collapseUntil=now+2.5;squad.regroupAt=squad.tactic==='veteran'?now+6:Infinity;
   for(const w of living){releaseSquadMember(w);w.fire=Math.max(w.fire||0,2.5);w.combatPassState=S.DISENGAGE;w.combatPassHeading=w.a+(w.directorSlot%2?1:-1)*.95;w.combatPassTimer=2.5}
  }
  if(squad.broken){
   if(now>=squad.regroupAt&&living.length>=2){
    squad.broken=false;squad.leader=living[0];squad.startedAt=now;
    living.forEach((w,i)=>{w.isFormationCommander=i===0;w.formationCommand=i===0;if(i)w.formationLeader=squad.leader;w.directorTarget=squad.target;w.combatPassState=S.REPOSITION;w.combatPassTimer=2;w.fire=Math.max(w.fire||0,.7)});
   }else continue;
  }
  if(!(squad.target?.hp>0)||squad.target.status==='downed')squad.target=playerFor(game);
  for(const w of living)w.directorTarget=squad.target;
  // The Director's existing pass states supply the shared attack/Break beat.
  const leader=squad.leader;
  if(['headOn','cross','veteran'].includes(squad.tactic)){
   leader.combatPassTimer=Math.max(0,(leader.combatPassTimer||0)-dt);
   if(leader.combatPassTimer===0){
    const state=leader.combatPassState;
    leader.combatPassState=state===S.COMMIT?S.DISENGAGE:state===S.DISENGAGE?S.REPOSITION:state===S.REPOSITION?S.APPROACH:S.COMMIT;
    leader.combatPassTimer=leader.combatPassState===S.COMMIT?1.4:leader.combatPassState===S.DISENGAGE?1.3:leader.combatPassState===S.REPOSITION?2.2:3;
    if(leader.combatPassState===S.COMMIT)for(const w of living)w.combatPassHeading=w.a;
    if(leader.combatPassState===S.DISENGAGE)for(const w of living){w.combatPassHeading=w.a+(w.directorSlot%2?1:-1)*.7;w.fire=Math.max(w.fire||0,1.2)}
   }
  }
 }
}

function squadSteering(game,e,contact,dt,baseTurn){
 const squad=e.directorSquad;if(!squad||!contact||baseTurn<=0)return null;
 const now=game.t||0;
 if(squad.broken){if(now<squad.collapseUntil)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.65};return null}
 if(e.dangerAimUntil>now)return{delta:angleDiff(e.dangerAim,e.a),turn:baseTurn};
 const target=squad.target||contact;if(contact.fogHidden||target.kaiserFogTime>0||target.ballCloak>0)return null;
 const heading=Number.isFinite(target.a)?target.a:Math.atan2(target.y-e.y,target.x-e.x),slot=e.directorSlot||0,side=slot%2?1:-1;
 let x=target.x,y=target.y,turn=baseTurn;
 const offset=(forward,lateral)=>{x=target.x+Math.cos(heading)*forward-Math.sin(heading)*lateral;y=target.y+Math.sin(heading)*forward+Math.cos(heading)*lateral};
 if(squad.tactic==='chase'){
  offset(-95-slot*35,slot===0?0:side*48);
  e.pursuitEngaged=Math.hypot(e.x-target.x,e.y-target.y)<320&&Math.abs(angleDiff(Math.atan2(target.y-e.y,target.x-e.x),e.a))<.6;
 }else if(squad.tactic==='bait'){
  if(slot===0){offset(170,Math.sin((now-squad.startedAt)*1.3)*130);e.fire=Math.max(e.fire||0,.4)}
  else offset(-140,side*95);
 }else if(squad.tactic==='escort'){
  const bomber=squad.members.find(w=>w.type==='bomber'&&w.hp>0);
  if(e===bomber)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.16};
  if(bomber&&Math.hypot(target.x-bomber.x,target.y-bomber.y)>280){x=bomber.x-Math.cos(bomber.a)*75-Math.sin(bomber.a)*side*100;y=bomber.y-Math.sin(bomber.a)*75+Math.cos(bomber.a)*side*100}
 }else{
  const state=squad.leader.combatPassState;
  if(state===S.COMMIT||state===S.DISENGAGE)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*(state===S.DISENGAGE?.65:.18)};
  if(squad.tactic==='cross')offset(state===S.REPOSITION?160:20,side*(state===S.REPOSITION?250:80));
  else if(squad.tactic==='headOn')offset(180,slot===0?0:side*55);
  else if(e!==squad.leader){const leader=squad.leader;x=leader.x-Math.cos(leader.a)*(70+slot*15)-Math.sin(leader.a)*side*75;y=leader.y-Math.sin(leader.a)*(70+slot*15)+Math.cos(leader.a)*side*75;turn=baseTurn*.9}
 }
 e.combatPassWaypoint={x,y};
 return{delta:angleDiff(Math.atan2(y-e.y,x-e.x),e.a),turn};
}

function linkFormation(game,e){
 if(!regular(e)||!['scout','hunter'].includes(e.type))return;
 e.directorFormation=true;
 if(!e.directorSquad){
  const peers=game.enemies.filter(other=>other!==e&&regular(other)&&other.directorSceneId===e.directorSceneId&&['scout','hunter'].includes(other.type));
  const leader=peers.find(other=>other.formationCommand)||peers[0]||e;
  leader.formationCommand=true;leader.directorFormation=true;
  if(leader!==e){e.formationLeader=leader;e.formationBack=70+Math.floor(peers.length/2)*38;e.formationOffset=(peers.length%2?1:-1)*(60+Math.floor(peers.length/2)*35)}
  game.assignNormalFormationLivery?.(e,leader,peers.length);
 }
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

// Read the existing scene's surviving group; no new wave types or stat scaling.
function sceneRhythm(game,state,now){
 if(state.pattern===P.RECOVERY){state.phase='quiet';return}
 if(state.pattern===P.ACE_PRESSURE||state.pattern===P.ELITE_FORMATION)return;
 const age=now-state.startedAt,remaining=state.endsAt-now;
 const group=(game.enemies||[]).filter(e=>e.hp>0&&e.directorSceneId===state.sceneId),live=group.length;
 if(!state.queue.length&&state.spawned>0&&live===0){
  state.clearSince??=now;state.endsAt=Math.min(state.endsAt,state.clearSince+3.2);
  state.phase='quiet';game.spawn=Math.max(game.spawn||0,state.endsAt-now+.4);return;
 }
 // Losing half a formation has a visible consequence: survivors break apart
 // once, then resume the existing pass/reattack state machine.
 if(!state.formationBroken&&state.spawned>=2&&!state.queue.length&&live<=state.spawned/2){
  state.formationBroken=true;
  for(const e of group)if(directorAircraftEligible(game,e)){
   e.directorRallyUntil=0;e.directorIntentUntil=0;e.directorEscort=null;
   e.combatPassState=S.DISENGAGE;e.combatPassTimer=.85;e.directorBreakUntil=now+.85;
   e.combatPassHeading=e.a+(e.combatPassSide||1)*.65;
  }
 }
 state.phase=remaining<=2.5?'quiet':remaining<=5?'cleanup':state.spawned>1&&live<=1&&!state.queue.length?'collapse':age<3?'approach':age<7?'formation':'melee';
 if(age<3)game.spawn=Math.max(game.spawn||0,3-age);
 if(state.phase==='cleanup'||state.phase==='quiet'){
  // Pause only ordinary replacement spawns, leaving bosses, objectives and live
  // bullets authoritative. The next scene still starts on the existing cadence.
  game.spawn=Math.max(game.spawn||0,remaining+.4);
  if(!state.dispersed){state.dispersed=true;const p=playerFor(game);
   for(const e of group)if(directorAircraftEligible(game,e)){
    e.directorLayout='recovery';e.directorIntentUntil=state.endsAt;e.directorEscort=null;
    e.combatPassState=S.DISENGAGE;e.combatPassTimer=remaining;e.combatPassHeading=Math.atan2(e.y-p.y,e.x-p.x);
   }
  }
 }
}

function tickDirector(game,dt){
 if(game.state!=='playing')return;maintainFormations(game);if(game.mode==='campaign')return;
 const state=directorState(game),now=game.t||0;
 if(suspended(game)){state.suspended=true;for(const e of game.enemies||[])if(e.directorSquad){releaseSquadMember(e);delete e.directorSquad}state.pattern=null;state.queue.length=0;state.nextSceneAt=Math.max(state.nextSceneAt,now+5);state.nextActionAt=Infinity;game.battleDirectorPattern=null;return}
 state.suspended=false;
 const completed=state.pattern&&state.pattern!==P.RECOVERY&&state.pattern!==P.ELITE_FORMATION&&!state.queue.length&&now-state.startedAt>1.5&&!(game.enemies||[]).some(e=>e.directorSquad&&e.hp>0);
 if(completed){beginPattern(game,state,P.RECOVERY);return}
 if(state.pattern&&now>=state.endsAt){state.pattern=null;state.queue.length=0;state.nextSceneAt=now;game.battleDirectorPattern=null}
 if(!state.pattern&&now>=state.nextSceneAt)beginPattern(game,state);
 if(!state.pattern)return;
 sceneRhythm(game,state,now);
 game.eventTimer=Math.max(game.eventTimer||0,state.endsAt-now+.5);
 if(state.pattern===P.ELITE_FORMATION&&!state.eliteRequested){
  if(game.eliteEnemies&&!game.eliteEnemies.active&&!activeAce(game)){state.eliteRequested=!!game.eliteEnemies.spawnEncounter?.()}
  else if(now-state.startedAt>.8){state.queue=action('hunter','cross',(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth?2:3);state.nextActionAt=now;state.eliteRequested=true}
 }
 if(state.phase==='quiet'||state.phase==='cleanup'||now<state.nextActionAt||!state.queue.length)return;
 const live=(game.enemies||[]).filter(regular).length;if(live>=directorCap(game)){state.nextActionAt=now+.7;return}
 const next=state.queue.shift();let e;
 game.directorSpawning=true;try{e=game.spawnEnemy?.(next.type)}finally{game.directorSpawning=false}
 if(e){place(game,e,next.layout,next.index,next.count);linkFormation(game,e);state.spawned++}else state.queue.unshift(next);
 state.nextActionAt=now+BATTLE_DIRECTOR_BALANCE.actionInterval;
}

export function installBattleDirector(Game,deps={}){
 if(Game.prototype.__battleDirector169)return;Game.prototype.__battleDirector169=true;
 S=deps.passStates;directorAircraftEligible=deps.directorAircraftEligible;
 planes=deps.planes;attachPersonality=deps.attachPersonality;angleDiff=deps.angleDiff||((a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)));
 if(!S||typeof directorAircraftEligible!=='function')throw new Error('Battle Director requires dogfight pass dependencies');
 Game.prototype.maintainEnemyFormations=function(){return maintainFormations(this)};
 Game.prototype.breakEnemyFormation=function(e,duration){const world=this.combatWorld?.()||this;if(e?.eliteKind)return world.eliteEnemies?.disruptFormation?.(e,duration)||false;return breakFormation(world,e,duration)};
 const steering=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){if(e?.formationCollapseUntil>(this.t||0))return{delta:Math.atan2(Math.sin(e.formationBreakHeading-e.a),Math.cos(e.formationBreakHeading-e.a)),turn:baseTurn*.85};return squadSteering(this,e,contact,dt,baseTurn)||steering.call(this,e,contact,dt,baseTurn)};
 const fire=Game.prototype.fireEnemy;
 Game.prototype.fireEnemy=function(e,...args){if(e.directorSquad&&!this.directorShotReady(e))return;if(e?.formationCollapseUntil>(this.t||0)){e.fire=Math.max(e.fire||0,e.formationCollapseUntil-(this.t||0)+.2);return}return fire.call(this,e,...args)};
 const target=Game.prototype.enemyCombatTarget;
 Game.prototype.enemyCombatTarget=function(e){const contact=target.call(this,e);if(contact.fogHidden)return contact;if(e.directorSquad&&!e.directorSquad.broken&&e.directorTarget?.hp>0&&!e.directorTarget.kaiserFogTime)return e.directorTarget;return contact};
 Game.prototype.directorShotReady=function(e){
  if(!e.dangerMarksman||e.directorSquad?.broken)return true;
  if(!(e.dangerAimUntil>0)){e.dangerAim=e.a;e.dangerAimUntil=(this.t||0)+.38;e.fire=.38;return false}
  if((this.t||0)<e.dangerAimUntil){e.fire=e.dangerAimUntil-(this.t||0);return false}
  e.dangerAimUntil=0;return true;
 };
 Game.prototype.directorMobSpawnsSuppressed=function(){const state=this.battleDirector;return !!(state&&state.pattern&&!state.suspended&&state.pattern!==P.ACE_PRESSURE&&!activeAce(this))};
 Game.prototype.tickBattleDirector=function(dt){if(this.state==='playing')tickSquadrons(this,Math.min(.04,Math.max(0,dt||0)));return tickDirector(this,dt)};
 Game.prototype.beginBattleDirectorPattern=function(pattern){if(!Object.values(P).includes(pattern))return null;return beginPattern(this,directorState(this),pattern)};

 const regularLimit=Game.prototype.regularEnemyLimit;
 Game.prototype.regularEnemyLimit=function(){const base=regularLimit.call(this);if((this.viewWidth||960)>BATTLE_DIRECTOR_BALANCE.compactWidth)return base;return Math.min(base,this.mode==='coop2'?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap)};
 const interval=Game.prototype.regularSpawnInterval;
 Game.prototype.regularSpawnInterval=function(){const base=interval.call(this),pattern=this.battleDirectorPattern;if(pattern===P.RECOVERY)return base*1.65;if(pattern===P.ACE_PRESSURE||pattern===P.ELITE_FORMATION)return base*1.7;return pattern?base*2.2:this.mode!=='campaign'&&this.t<120?base*.82:base};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){if(this.state==='playing')maintainFormations(this);const result=update.call(this,dt,input);if(this.state==='playing')maintainFormations(this);this.tickBattleDirector(Math.min(.04,Math.max(0,dt||0)));return result};
}
