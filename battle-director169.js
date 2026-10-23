import {ordinaryFighter,fighterAim,fighterRoundSpeed} from './dogfight-pass165.js?v=gal1';
import {regionalPatternPool,regionalEscortTarget,regionalScenePlacement,regionalExitHeading,regionalSteering,regionalAircraftEligible,regionalShotReady,regionalCombatTarget} from './regional-air-tactics.js?v=regionalair20261018';

export const BATTLE_DIRECTOR_PATTERNS=Object.freeze({
 HEAD_ON_PASS:'HEAD_ON_PASS',CROSS_ATTACK:'CROSS_ATTACK',PINCER:'PINCER',CHASE:'CHASE',ESCORT:'ESCORT',DECOY:'DECOY',
 LUFBERY_CIRCLE:'LUFBERY_CIRCLE',BOMBER_RUN:'BOMBER_RUN',BAIT:'BAIT',VETERAN_FORMATION:'VETERAN_FORMATION',ELITE_FORMATION:'ELITE_FORMATION',ACE_PRESSURE:'ACE_PRESSURE',RECOVERY:'RECOVERY'
});

export const BATTLE_DIRECTOR_BALANCE=Object.freeze({
 firstSceneAt:6,sceneMin:14,sceneMax:18,recoveryDuration:3,eliteRecoveryDuration:7,aceRecoveryDuration:8,recentWindow:3,
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
 const recent=state.history.filter(p=>p!==P.RECOVERY&&p!==P.ACE_PRESSURE).slice(-BATTLE_DIRECTOR_BALANCE.recentWindow),last=recent.at(-1);
 const choices=candidates.filter(pattern=>pattern!==last),pool=choices.length?choices:candidates;
 const weighted=pool.map(pattern=>({pattern,weight:recent.includes(pattern)?.24:1}));
 let roll=(game.rng?.()??Math.random())*weighted.reduce((sum,item)=>sum+item.weight,0);
 for(const item of weighted){roll-=item.weight;if(roll<=0)return item.pattern}
 return weighted.at(-1)?.pattern||P.HEAD_ON_PASS;
}

function choosePattern(game,state){
 if(activeAce(game)&&state.history.at(-1)!==P.ACE_PRESSURE)return P.ACE_PRESSURE;
 if(state.combatSinceRecovery>=1)return P.RECOVERY;
 const time=game.t||0;
 if(time>=120&&(state.scenesSinceCircle||0)>=4)return P.LUFBERY_CIRCLE;
 const candidates=time<120?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.CHASE,P.DECOY]:time<360?[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.BAIT,P.ESCORT,P.DECOY,P.BOMBER_RUN,P.LUFBERY_CIRCLE]:[P.HEAD_ON_PASS,P.CROSS_ATTACK,P.PINCER,P.CHASE,P.BAIT,P.ESCORT,P.DECOY,P.BOMBER_RUN,P.VETERAN_FORMATION,P.ELITE_FORMATION,P.LUFBERY_CIRCLE];
 return weightedChoice(game,state,regionalPatternPool(game,candidates));
}

function action(type,layout,count=1){return Array.from({length:count},(_,index)=>({type,layout,index,count}))}
function planFor(pattern,time,compact){
 const pressure=time<120?(compact?5:6):time<360?(compact?6:7):compact?6:8;
 if(pattern===P.HEAD_ON_PASS)return action('hunter','headOn',Math.max(2,pressure));
 if(pattern===P.CROSS_ATTACK)return action('hunter','cross',Math.max(2,pressure));
 if(pattern===P.PINCER)return action('hunter','pincer',Math.max(3,pressure));
 if(pattern===P.CHASE)return action(time<180?'scout':'hunter','chase',Math.max(2,pressure));
 if(pattern===P.DECOY)return[...action('scout','decoy',1),...action('hunter','decoyWing',Math.max(2,pressure-1))];
 if(pattern===P.BAIT)return action('hunter','bait',3);
 if(pattern===P.LUFBERY_CIRCLE)return action('hunter','circle',Math.min(6,pressure));
 if(pattern===P.VETERAN_FORMATION)return action('hunter','veteran',pressure);
 if(pattern===P.ESCORT)return[...action('bomber','bomber',1),...action('hunter','escort',Math.max(1,pressure-1))];
 if(pattern===P.BOMBER_RUN)return[...action('bomber','bomber',Math.min(2,Math.max(1,pressure-2))),...action('hunter','escort',pressure-Math.min(2,Math.max(1,pressure-2)))];
 return[];
}

// Authored flight slots, in aircraft-heading coordinates; never render offsets.
export const DIRECTOR_FORMATION_SHAPES=Object.freeze({
 circle:['circle'],headOn:['vic','line','echelon'],veteran:['diamond','vic','echelon'],chase:['trail','echelon','vic'],
 cross:['scissors','alternating'],pincer:['claws','alternating'],bait:['hook'],decoy:['hook'],decoyWing:['claws'],escort:['box'],bomber:['line']
});
export function directorFormationSlot(shape,index,count=6){
 const rank=Math.ceil(index/2),side=index%2?-1:1;
 if(shape==='line')return{back:0,lateral:(index-(count-1)/2)*82};
 if(shape==='trail')return{back:index*92,lateral:index%2?24:-24};
 if(shape==='echelon')return{back:index*64,lateral:index*66};
 if(shape==='diamond'&&index<4)return[{back:0,lateral:0},{back:78,lateral:-82},{back:78,lateral:82},{back:156,lateral:0}][index];
 return{back:rank*78,lateral:index?side*rank*82:0};
}
function chooseShape(game,state,pattern){
 const layout={LUFBERY_CIRCLE:'circle',HEAD_ON_PASS:'headOn',CROSS_ATTACK:'cross',PINCER:'pincer',CHASE:'chase',VETERAN_FORMATION:'veteran',BAIT:'bait',DECOY:'decoy',ESCORT:'escort',BOMBER_RUN:'bomber'}[pattern];
 const choices=DIRECTOR_FORMATION_SHAPES[layout]||['vic'];
 state.lastShapes??={};const pool=choices.filter(v=>v!==state.lastShapes[pattern]);
 const options=pool.length?pool:choices,shape=options[Math.min(options.length-1,Math.floor((game.rng?.()??.5)*options.length))];
 state.lastShapes[pattern]=shape;return shape;
}

function beginPattern(game,state,pattern=choosePattern(game,state)){
 const now=game.t||0,compact=(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth;
 const previous=state.pattern;
 pattern=game.beginBattlefieldEngagement?.(pattern,state.sceneId+1,now+18)||pattern;
 const player=playerFor(game);state.anchor={x:player.x,y:player.y,a:player.a,speed:player.speed};state.phase=pattern===P.RECOVERY?'quiet':'approach';state.spawned=0;state.dispersed=false;state.clearSince=null;state.formationBroken=false;
 if(pattern===P.LUFBERY_CIRCLE)state.scenesSinceCircle=0;else if(pattern!==P.RECOVERY&&pattern!==P.ACE_PRESSURE)state.scenesSinceCircle=(state.scenesSinceCircle||0)+1;
 state.pattern=pattern;state.startedAt=now;state.sceneId++;state.eliteRequested=false;
 const rest=state.recoveryDuration??(previous===P.ACE_PRESSURE?BATTLE_DIRECTOR_BALANCE.aceRecoveryDuration:previous===P.ELITE_FORMATION?BATTLE_DIRECTOR_BALANCE.eliteRecoveryDuration:BATTLE_DIRECTOR_BALANCE.recoveryDuration);state.recoveryDuration=null;
 state.endsAt=now+(pattern===P.RECOVERY?rest:pattern===P.ACE_PRESSURE?20:BATTLE_DIRECTOR_BALANCE.sceneMin+(game.rng?.()??Math.random())*(BATTLE_DIRECTOR_BALANCE.sceneMax-BATTLE_DIRECTOR_BALANCE.sceneMin));
 state.shape=chooseShape(game,state,pattern);
 state.nextActionAt=now+.35;state.queue=planFor(pattern,now,compact);
 // Crossing elements and the decoy's covering pair arrive in separate beats.
 for(const entry of state.queue)entry.delay=entry.layout==='decoyWing'?1.5:entry.layout==='cross'&&state.shape==='alternating'?Math.floor(entry.index/2)*1.15:entry.layout==='pincer'&&state.shape==='alternating'?(entry.index%2)*.9:0;state.history.push(pattern);state.history=state.history.slice(-6);
 if(pattern===P.RECOVERY)state.combatSinceRecovery=0;else if(pattern!==P.ACE_PRESSURE)state.combatSinceRecovery++;
 game.battleDirectorPattern=pattern;game.spawn=pattern===P.RECOVERY?Math.min(game.spawn||0,1.1):Math.max(game.spawn||0,1.2);
 {
  const p=playerFor(game),duration=Math.max(1,state.endsAt-now);
  for(const e of game.enemies||[])if(directorAircraftEligible(game,e)&&!e.battlefieldEventId){
   if(e.directorSquad){releaseSquadMember(e);delete e.directorSquad;e.directorBreakUntil=state.endsAt}
   e.directorLayout='recovery';e.directorIntentUntil=state.endsAt;e.directorEscort=null;
   e.combatPassState=S.DISENGAGE;e.combatPassTimer=duration;
   e.combatPassHeading=regionalExitHeading(game,e,Math.atan2(e.y-p.y,e.x-p.x));
  }
 }
 return pattern;
}

function place(game,e,layout,index,count){
 const flank=layout==='cross'||layout==='pincer',p=flank?playerFor(game):game.battleDirector?.anchor||playerFor(game),side=index-(count-1)/2;
 const span=Math.min(280,(game.viewWidth||960)*.3);
 let forward=layout==='headOn'?Math.max(260,((p.speed||170)+e.speed)*.85+210):240,lateral=side*55;
 if(layout==='cross'){forward=(p.speed||170)*.85+100+(index%2)*70;lateral=(index%2?1:-1)*span+Math.floor(index/2)*24}
 else if(layout==='pincer'){forward=(p.speed||170)*.85+200+(index%2)*100;lateral=(index%2?1:-1)*(span+65)+Math.floor(index/2)*26}
 else if(layout==='chase'){forward=-220;lateral=side*60}
 else if(layout==='escort'){forward=440;lateral=side*95}
 else if(layout==='bomber'){forward=310;lateral=side*120}
 else if(layout==='decoy'){forward=160;lateral=0}
 else if(layout==='decoyWing'){forward=-100;lateral=(index%2?1:-1)*(span+index*12)}
 else if(layout==='bait'){forward=index? -160:190;lateral=index?(index%2?-1:1)*155:0}
 else if(layout==='veteran'){forward=400;lateral=side*82}
 const protectedTarget=['escort','bomber'].includes(layout)?regionalEscortTarget(game,p):null;
 const route=regionalScenePlacement(game,{anchor:p,layout,index,count,forward,lateral,protectedTarget}),a=route.a;
 if(flank&&ordinaryFighter(e)){
  // Solve the entry's crossing point after the existing visible preparation.
  // Regional yaw/lanes remain distinct, but cannot consume the firing window.
  const entrySide=index%2?1:-1,rank=Math.floor(index/2),pa=Number.isFinite(p.a)?p.a:-Math.PI/2;
  const yaw=angleDiff(a,pa)*entrySide,cy=Math.cos(yaw),sy=Math.sin(yaw);
  const regionalLane=-(route.x-p.x)*Math.sin(a)+(route.y-p.y)*Math.cos(a);
  const lane=Math.max(105,Math.min(190,Math.abs(regionalLane)*.55))+rank*24;
  const pv=Math.min(360,(p.speed||170)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1)),round=fighterRoundSpeed(game),cruise=e.speed*(e.energySpeed??1);
  const f=(pv-round*sy)*lane/(round*cy)+(pv-cruise*sy)*.85+(index%2)*60,l=entrySide*(lane+cruise*cy*.85);
  route.x=p.x+Math.cos(pa)*f-Math.sin(pa)*l;route.y=p.y+Math.sin(pa)*f+Math.cos(pa)*l;
 }
 const shape=game.battleDirector.shape,slot=directorFormationSlot(shape,index,count);
 if(['headOn','veteran','chase'].includes(layout)){
  // One heading for the entire shape; alternating regional yaw used to fold
  // both wings into each other before their entry was visible.
  const common=game.battleDirector.anchor.a,front=layout==='chase'?-260:Math.max(400,forward);
  const f=front+(layout==='chase'?-slot.back:slot.back),l=(layout==='chase'?1:-1)*slot.lateral;
  route.x=p.x+Math.cos(common)*f-Math.sin(common)*l;route.y=p.y+Math.sin(common)*f+Math.cos(common)*l;
 }
 const originSlot=directorFormationSlot(shape,0,count);e.directorShape=shape;e.directorFormationSlot={back:slot.back-originSlot.back,lateral:slot.lateral-originSlot.lateral};
 e.x=route.x;e.y=route.y;e.regionalSceneRegion=route.region;e.regionalExitOffset=route.exit;e.directorProtectedTarget=route.protectedTarget;
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
 // A common 0.85-second visible formation movement precedes the attack.
 // Position is set only on arrival; all subsequent motion uses actual steering.
 e.directorReadyAt=(game.t||0)+.85;e.directorEntrySide=index%2?1:-1;
 e.directorEntryAnchor={x:protectedTarget?.x??p.x,y:protectedTarget?.y??p.y,a};e.directorFireHoldUntil=e.directorReadyAt;
 e.directorIntentUntil=e.directorReadyAt+duration;
 if(layout==='cross'||layout==='pincer')e.a=a-e.directorEntrySide*Math.PI/2;
 else if(layout==='decoy')e.a=a;
 else if(layout==='decoyWing')e.a=a+e.directorEntrySide*.65;
 else if(layout==='headOn')e.a=a+Math.PI+(index%2?1:-1)*.35;
 else if(layout==='chase')e.a=a+(index%2?1:-1)*.35;
 // The marksman's existing telegraph overlaps the visible entry instead of
 // starting another aim lock after the short crossing window has opened.
 if(ordinaryFighter(e)&&e.dangerMarksman){e.dangerAim=e.a;e.dangerAimUntil=e.directorReadyAt;}
 e.fire=ordinaryFighter(e)?.85+index*.14:Math.max(e.fire||0,.85);
 if(layout==='circle'&&e.directorSquad){
  const squad=e.directorSquad,anchor=game.battleDirector.anchor;
  const radius=(game.viewWidth||960)<=720?155:195;
  squad.circle??={x:anchor.x+Math.cos(anchor.a)*340,y:anchor.y+Math.sin(anchor.a)*340,radius,a:anchor.a,start:game.t||0};
  const phase=anchor.a+index*Math.PI*2/count;e.directorCirclePhase=phase;
  e.x=squad.circle.x+Math.cos(phase)*radius;e.y=squad.circle.y+Math.sin(phase)*radius;e.a=phase+Math.PI/2;
  e.combatPassHeading=e.a;e.directorLaunchAt=e.directorReadyAt;e.directorChoreographyDone=false;
 }

 if(ordinaryFighter(e)&&['headOn','cross','pincer','chase','bait','veteran','decoyWing'].includes(layout)){
  const stagger=layout==='cross'||layout==='pincer'?(index%2)*.35+Math.floor(index/2)*.18:layout==='chase'?index*.22:Math.floor((index+1)/2)*.16;
  e.directorLaunchAt=e.directorReadyAt+stagger;e.directorFireHoldUntil=e.directorLaunchAt;
  e.directorChoreographyDone=false;e.directorBeat=null;
  if(['headOn','veteran','chase'].includes(layout)){e.a=game.battleDirector.anchor.a+(layout==='chase'?0:Math.PI);e.combatPassHeading=e.a;}
 }


}

function joinSquadron(game,e,layout,index){
 const tactic=layout==='bomber'&&(game.battleDirectorPattern===P.ESCORT||game.battleDirectorPattern===P.BOMBER_RUN)?'escort':layout;
 if(!['headOn','cross','chase','bait','escort','veteran','decoyWing','decoy','pincer','circle'].includes(tactic))return;
 const previous=game.enemies.find(w=>w!==e&&w.directorSceneId===e.directorSceneId&&w.directorSquad?.tactic===tactic);
 const squad=previous?.directorSquad||{tactic,leader:e,members:[],target:playerFor(game),until:game.battleDirector.endsAt,startedAt:game.t||0};
 if(tactic==='escort'&&!squad.escortTarget)squad.escortTarget=e.directorProtectedTarget||regionalEscortTarget(game,e);
 squad.members.push(e);e.directorSquad=squad;e.directorSlot=squad.members.length-1;e.directorTarget=squad.target;
 e.isFormationCommander=squad.leader===e;e.formationCommand=e.isFormationCommander;
 if(!e.isFormationCommander){const slot=e.directorFormationSlot||directorFormationSlot('vic',e.directorSlot);e.formationLeader=squad.leader;e.formationBack=slot.back;e.formationOffset=slot.lateral}
 if(tactic==='veteran'){
  const paint=DIRECTOR_LIVERIES[e.faction],key=paint[e.directorSlot%paint.length],base=key==='checker_se5a'?'se5a':key==='dazzle_camel'?'camel':'fokkerd7';
  e.escortPlane=key;attachPersonality?.(planes,e,base);e.dangerMarksman=e.directorSlot===1;
 }else if(tactic==='cross')e.dangerMarksman=e.directorSlot===1;
 e.dangerPursuit=tactic==='chase';
}

function releaseSquadMember(e){
 if(e.formationLeader!==null)delete e.formationLeader;e.isFormationCommander=false;e.directorIntentUntil=0;e.directorEscort=null;
 e.combatPassTimer=0;e.combatPassCooldown=.6;e.personalityDecisionUntil=0;e.dogfightMode='APPROACH';
 delete e.directorTarget;e.pursuitEngaged=false;e.dangerAimUntil=0;e.directorChoreographyDone=true;e.directorBeat=null;
}

function tickSquadrons(game,dt){
 const now=game.t||0,seen=new Set();
 for(const e of game.enemies||[]){const squad=e.directorSquad;if(!squad||seen.has(squad))continue;seen.add(squad);
  const living=squad.members.filter(w=>w.hp>0&&!w.expired&&game.enemies.includes(w));
  if(now>=squad.until||game.stageBoss?.stages?.phase==='boss'){
   for(const w of living){releaseSquadMember(w);delete w.directorSquad}continue;
  }
  if(squad.escortTarget&&(!(squad.escortTarget.hp>0)||squad.escortTarget.expired||!game.enemies.includes(squad.escortTarget))){
   const lost=squad.escortTarget;
   if(e.directorSceneId===game.battleDirector?.sceneId)game.battleDirector.queue.length=0;
   for(const w of living){
    const away=Math.atan2(w.y-lost.y,w.x-lost.x);
    releaseSquadMember(w);delete w.directorSquad;w.directorLayout='recovery';w.directorIntentUntil=now+1.6;w.directorBreakUntil=now+1.6;
    w.combatPassState=S.DISENGAGE;w.combatPassHeading=regionalExitHeading(game,w,away);w.combatPassTimer=1.6;w.fire=Math.max(w.fire||0,1.4);
   }
   continue;
  }
  if(!squad.broken&&(!living.includes(squad.leader)||squad.leader.hp<=0)){
   squad.broken=true;squad.collapseUntil=now+2.5;squad.regroupAt=squad.tactic==='veteran'?now+6:Infinity;
   for(const w of living){releaseSquadMember(w);w.fire=Math.max(w.fire||0,2.5);w.combatPassState=S.DISENGAGE;w.combatPassHeading=regionalExitHeading(game,w,w.a);w.combatPassTimer=2.5}
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
  if(!squad.passActive&&!living.some(w=>w.directorLaunchAt&&!w.directorChoreographyDone)&&['headOn','cross','veteran'].includes(squad.tactic)){
   leader.combatPassTimer=Math.max(0,(leader.combatPassTimer||0)-dt);
   if(leader.combatPassTimer===0){
    const state=leader.combatPassState;
    leader.combatPassState=state===S.COMMIT?S.DISENGAGE:state===S.DISENGAGE?S.REPOSITION:state===S.REPOSITION?S.APPROACH:S.COMMIT;
    leader.combatPassTimer=leader.combatPassState===S.COMMIT?1.4:leader.combatPassState===S.DISENGAGE?1.3:leader.combatPassState===S.REPOSITION?2.2:3;
    if(leader.combatPassState===S.COMMIT)for(const w of living)w.combatPassHeading=w.a;
    if(leader.combatPassState===S.DISENGAGE)for(const w of living){w.combatPassHeading=regionalExitHeading(game,w,w.a);w.fire=Math.max(w.fire||0,1.2)}
   }
  }
 }
}

function circleSteering(game,e,contact,baseTurn){
 const squad=e.directorSquad,circle=squad?.circle,now=game.t||0;
 if(!circle||squad.broken||squad.passActive||!contact||contact.fogHidden||contact.ballCloak>0||contact.kaiserFogTime>0||baseTurn<=0||e.directorLayout==='recovery'||e.directorBreakUntil>now)return null;
 const age=now-circle.start,living=squad.members.filter(w=>w.hp>0&&!w.expired);
 const exitDistance=Math.max(260,Math.min(360,(game.viewWidth||960)*.4));
 if(age>10||age>2&&Math.hypot(contact.x-circle.x,contact.y-circle.y)>exitDistance){
  for(const w of living){
   w.directorChoreographyDone=true;w.directorIntentUntil=now+3;
   w.directorCruise??={speed:w.speed,dogfight:w.dogfightCruise,personality:w.personalityCruise,cap:w.cruiseSpeedCap};
   w.speed=Math.min(265,Math.max(w.speed,(contact.speed||170)*1.3));w.dogfightCruise=w.speed;w.personalityCruise=w.speed;w.cruiseSpeedCap=Math.max(w.cruiseSpeedCap||0,w.speed);
  }
  releasePass(squad);return null;
 }
 const active=age>2?Math.floor((age-2)/1.65)%living.length:-1,peeling=living[active]===e&&(age-2)%1.65<.95;
 if(peeling&&now>=e.directorReadyAt){
  e.directorBeat='peel';e.combatPassState=S.COMMIT;e.combatPassHeading=fighterAim(game,e,contact);
  return{delta:angleDiff(e.combatPassHeading,e.a),turn:baseTurn};
 }
 // Follow the next arc point. Nose-directed native fire protects the aircraft
 // ahead; nobody fires radially or gains an artificial rotating turret.
 const phase=Math.atan2(e.y-circle.y,e.x-circle.x)+.48;
 const x=circle.x+Math.cos(phase)*circle.radius,y=circle.y+Math.sin(phase)*circle.radius;
 e.directorBeat=age<.85?'assemble':active>=0?'rejoin':'circle';e.combatPassState=S.APPROACH;
 const heading=Math.atan2(y-e.y,x-e.x);e.combatPassHeading=heading;
 return{delta:angleDiff(heading,e.a),turn:baseTurn};
}

// The squad's opening is flown through normal turn rates and shot gates.
// It owns no positions, projectiles, damage, extra enemies, or frame effects.
function choreographySteering(game,e,contact,baseTurn){
 const squad=e.directorSquad,now=game.t||0;
 if(e.directorLayout==='circle')return null;
 if(!squad||squad.broken||!e.directorLaunchAt||e.directorChoreographyDone||!contact||contact.fogHidden||contact.ballCloak>0||contact.kaiserFogTime>0||baseTurn<=0||e.directorBreakUntil>now||e.directorLayout==='recovery')return null;
 const age=now-e.directorLaunchAt;
 const beat=age<0?'assemble':age<2.1?'attack':age<3.15?'break':age<4.4?'regroup':'free';
 if(beat==='free'){
  e.directorChoreographyDone=true;e.directorBeat='free';e.directorIntentUntil=0;e.directorRallyUntil=0;
  e.combatPassState=S.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=.2;e.combatPassHeading=null;e.combatPassWaypoint=null;
  if(squad.members.every(w=>w.hp<=0||w.directorChoreographyDone||!w.directorLaunchAt))releasePass(squad);
  return null;
 }
 if(e.directorBeat!==beat){
  e.directorBeat=beat;e.combatPassState=beat==='attack'?S.COMMIT:beat==='break'?S.DISENGAGE:beat==='regroup'?S.REPOSITION:S.APPROACH;
  if(beat==='break')e.directorBreakHeading=regionalExitHeading(game,e,e.a+(e.directorEntrySide||1)*.65);
 }
 let heading=e.a;
 if(beat==='attack'){
  heading=e.dangerAimUntil>now?e.dangerAim:fighterAim(game,e,contact);
  e.combatPassHeading=heading;
 }else if(beat==='break'){
  heading=e.directorBreakHeading;e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil,e.directorLaunchAt+3.15);
 }else{
  e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil,e.directorLaunchAt+(beat==='assemble'?0:4.4));
  const leader=squad.leader,slot=e.directorFormationSlot;
  if(beat==='assemble'&&e!==leader&&['headOn','veteran','chase'].includes(e.directorLayout)){
   const x=leader.x-Math.cos(leader.a)*slot.back-Math.sin(leader.a)*slot.lateral,y=leader.y-Math.sin(leader.a)*slot.back+Math.cos(leader.a)*slot.lateral;
   heading=Math.hypot(x-e.x,y-e.y)>45?Math.atan2(y-e.y,x-e.x):leader.a;
  }else if(beat==='regroup'){
   const a=e.directorEntryAnchor.a,side=e.directorEntrySide||1,rank=Math.floor((e.directorSlot||0)/2);
   const x=contact.x-Math.cos(a)*(170+rank*70)-Math.sin(a)*side*(190+rank*65),y=contact.y-Math.sin(a)*(170+rank*70)+Math.cos(a)*side*(190+rank*65);
   heading=Math.atan2(y-e.y,x-e.x);
  }else heading=e.combatPassHeading??e.a;
 }
 return{delta:angleDiff(heading,e.a),turn:baseTurn};
}

function intentSteering(game,e,contact,dt,baseTurn){
 const now=game.t||0,squad=e.directorSquad;
 if(!e.directorReadyAt||!squad||squad.broken||!contact||baseTurn<=0||e.directorBreakUntil>now||!(e.directorIntentUntil>now)||e.directorLayout==='recovery')return null;
 const anchor=e.directorEntryAnchor,a=anchor.a,side=e.directorEntrySide,layout=e.directorLayout;
 const prep=now<e.directorReadyAt;
 if(!prep&&(squad.passActive||squad.leader.combatPassState===S.DISENGAGE||layout==='headOn'&&[S.COMMIT,S.REPOSITION].includes(squad.leader.combatPassState)))return null;
 let heading,x,y;
 const point=(p,f,l)=>{x=p.x+Math.cos(a)*f-Math.sin(a)*l;y=p.y+Math.sin(a)*f+Math.cos(a)*l;};
 if(prep){
  e.fire=Math.max(e.fire||0,e.directorReadyAt-now);
  heading=layout==='headOn'||layout==='bomber'?a+Math.PI:layout==='cross'||layout==='pincer'?a-side*Math.PI/2:layout==='escort'?e.directorEscort?.a??a+Math.PI:layout==='decoyWing'?a+side*.65:a;
 }else if(layout==='cross'||layout==='pincer'){
  // Arrive from separate flanks, then fly the existing short firing pass.
  // A stale rear waypoint lets a fast player outrun the entire entry.
  const age=now-e.directorReadyAt,distance=Math.hypot(contact.x-e.x,contact.y-e.y);
  heading=fighterAim(game,e,contact);
  if(age>1.6||distance<420&&Math.abs(angleDiff(heading,e.a))<.6){releasePass(squad);return null;}
 }else if(layout==='decoy'){
  heading=now-e.directorReadyAt<2.4?a:a+side*.8;
  e.fire=Math.max(e.fire||0,.3);
 }else if(layout==='decoyWing'){
  point(contact,-125,side*55);
 }else if(layout==='headOn'){
  const distance=Math.hypot(contact.x-e.x,contact.y-e.y);
  if(ordinaryFighter(e)&&distance<470)heading=fighterAim(game,e,contact);
  else point(contact,40,(e.directorSlot-(squad.members.length-1)/2)*45);
 }else if(layout==='bomber')heading=e.combatPassHeading??a+Math.PI;
 else return null;
 if(heading===undefined){const wp=e.combatPassWaypoint||(e.combatPassWaypoint={x:0,y:0});wp.x=x;wp.y=y;heading=Math.atan2(y-e.y,x-e.x);}
 return{delta:angleDiff(heading,e.a),turn:baseTurn*(prep?1.15:1)};
}

// Hand the existing pass cycle back to its owner after a tactical entry.
function releasePass(squad){
 squad.passActive=true;
 for(const e of squad.members){e.directorRallyUntil=0;e.combatPassState=S.APPROACH;e.combatPassTimer=0;e.combatPassCooldown=0;e.combatPassHeading=null;e.combatPassWaypoint=null;}
}

function squadSteering(game,e,contact,dt,baseTurn){
 const squad=e.directorSquad;if(!squad||!contact||baseTurn<=0)return null;
 const now=game.t||0;
 if(squad.broken){if(now<squad.collapseUntil)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.65};return null}
 if(e.dangerAimUntil>now)return{delta:angleDiff(e.dangerAim,e.a),turn:baseTurn};
 if(squad.passActive||e.directorChoreographyDone)return null;
 const target=contact||squad.target;if(contact.fogHidden||target.kaiserFogTime>0||target.ballCloak>0)return null;
 const heading=Number.isFinite(target.a)?target.a:Math.atan2(target.y-e.y,target.x-e.x),slot=e.directorSlot||0,side=slot%2?1:-1;
 let x=target.x,y=target.y,turn=baseTurn;
 const offset=(forward,lateral)=>{x=target.x+Math.cos(heading)*forward-Math.sin(heading)*lateral;y=target.y+Math.sin(heading)*forward+Math.cos(heading)*lateral};
 if(squad.tactic==='chase'){
  offset(-95-slot*35,slot===0?0:side*48);
  e.pursuitEngaged=Math.hypot(e.x-target.x,e.y-target.y)<420&&Math.abs(angleDiff(Math.atan2(target.y-e.y,target.x-e.x),e.a))<.6;
  if(e===squad.leader&&e.pursuitEngaged){releasePass(squad);return null;}
 }else if(squad.tactic==='bait'){
  if(slot===0){offset(170,Math.sin((now-squad.startedAt)*1.3)*130);e.fire=Math.max(e.fire||0,.4)}
  else offset(-140,side*95);
 }else if(squad.tactic==='escort'){
  const bomber=squad.members.find(w=>w.type==='bomber'&&w.hp>0);
  const facility=squad.escortTarget?.hp>0&&(game.enemies||[]).includes(squad.escortTarget)?squad.escortTarget:null;
  if(e===bomber)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*.16};
  if(facility){
   const threat=Math.hypot(target.x-facility.x,target.y-facility.y);
   if(threat>420){const phase=(now-squad.startedAt)*.55+slot*2.1,radius=105+slot*18;x=facility.x+Math.cos(phase)*radius;y=facility.y+Math.sin(phase)*radius;e.fire=Math.max(e.fire||0,.25)}
   else offset(-80,side*(55+slot*22));
  }else if(bomber&&Math.hypot(target.x-bomber.x,target.y-bomber.y)<=340&&ordinaryFighter(e)){const wp=e.combatPassWaypoint||(e.combatPassWaypoint={x:0,y:0});wp.x=target.x;wp.y=target.y;return{delta:angleDiff(fighterAim(game,e,target),e.a),turn:baseTurn};
  }else if(bomber&&Math.hypot(target.x-bomber.x,target.y-bomber.y)>280){const a=Number.isFinite(bomber.a)?bomber.a:heading;x=bomber.x-Math.cos(a)*75-Math.sin(a)*side*100;y=bomber.y-Math.sin(a)*75+Math.cos(a)*side*100}
 }else{
  const state=squad.leader.combatPassState;
  if(state===S.COMMIT||state===S.DISENGAGE)return{delta:angleDiff(e.combatPassHeading??e.a,e.a),turn:baseTurn*(state===S.DISENGAGE?.65:.18)};
  if(squad.tactic==='cross')offset(state===S.REPOSITION?160:20,side*(state===S.REPOSITION?250:80));
  else if(squad.tactic==='headOn')offset(180,slot===0?0:side*55);
  else if(e!==squad.leader){const leader=squad.leader;x=leader.x-Math.cos(leader.a)*(70+slot*15)-Math.sin(leader.a)*side*75;y=leader.y-Math.sin(leader.a)*(70+slot*15)+Math.cos(leader.a)*side*75;turn=baseTurn*.9}
 }
 const wp=e.combatPassWaypoint||(e.combatPassWaypoint={x:0,y:0});wp.x=x;wp.y=y;
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
 e.formationBreakHeading=e.directorSceneId?regionalExitHeading(game,e,e.a):e.a+side*1.05;e.formationCollapseUntil=now+duration;
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
   e.combatPassHeading=regionalExitHeading(game,e,e.a);
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
    e.combatPassState=S.DISENGAGE;e.combatPassTimer=remaining;e.combatPassHeading=regionalExitHeading(game,e,Math.atan2(e.y-p.y,e.x-p.x));
   }
  }
 }
}

function tickDirector(game,dt){
 if(game.state!=='playing')return;maintainFormations(game);if(game.mode==='campaign')return;
 const state=directorState(game),now=game.t||0;
 const ace=activeAce(game),elite=!!game.eliteEnemies?.active,previousAce=state.hadAce,previousElite=state.hadElite;
 state.hadAce=ace;state.hadElite=elite;
 if(!ace&&previousAce)state.recoveryDuration=BATTLE_DIRECTOR_BALANCE.aceRecoveryDuration;
 if(!elite&&previousElite)state.recoveryDuration=Math.max(state.recoveryDuration||0,BATTLE_DIRECTOR_BALANCE.eliteRecoveryDuration);
 if(state.recoveryDuration)game.battleRecoveryUntil=Math.max(game.battleRecoveryUntil||0,now+state.recoveryDuration);
 if(suspended(game)){
  const mission=game.battlefieldEvents?.current;
  for(const e of game.enemies||[]){
   if(e.directorSquad){releaseSquadMember(e);delete e.directorSquad}
   if(!state.suspended&&mission?.status==='active'&&regular(e)&&!e.battlefieldEventId&&directorAircraftEligible(game,e)){
    const p=playerFor(game),end=mission.deadline||now+8;
    e.directorLayout='recovery';e.directorIntentUntil=end;e.combatPassState=S.DISENGAGE;e.combatPassTimer=Math.max(1,end-now);e.combatPassHeading=regionalExitHeading(game,e,Math.atan2(e.y-p.y,e.x-p.x));
   }
  }
  state.suspended=true;state.pattern=null;state.queue.length=0;state.nextSceneAt=Math.max(state.nextSceneAt,now+5);state.nextActionAt=Infinity;game.battleDirectorPattern=null;return;
 }
 state.suspended=false;
 if(state.recoveryDuration&&!ace&&!elite){beginPattern(game,state,P.RECOVERY);return}
 if(game.stageCombatWindow?.approaching&&!ace){
  if(state.pattern!==P.RECOVERY)beginPattern(game,state,P.RECOVERY);
  for(const e of game.enemies||[])if(e.directorLayout==='recovery'&&directorAircraftEligible(game,e)){e.directorIntentUntil=Math.max(e.directorIntentUntil||0,now+1);e.combatPassTimer=Math.max(e.combatPassTimer||0,1)}
  state.endsAt=Math.max(state.endsAt,now+1);state.queue.length=0;return;
 }
 // Ace pressure lasts until the last ace leaves; the first kill cannot start rest.
 if(ace){if(state.pattern!==P.ACE_PRESSURE)beginPattern(game,state,P.ACE_PRESSURE);state.endsAt=now+1;return}
 const completed=state.pattern&&state.pattern!==P.RECOVERY&&state.pattern!==P.ELITE_FORMATION&&!state.queue.length&&now-state.startedAt>1.5&&!(game.enemies||[]).some(e=>e.directorSquad&&e.hp>0);
 if(completed){beginPattern(game,state,P.RECOVERY);return}
 if(state.pattern&&now>=state.endsAt){state.pattern=null;state.queue.length=0;state.nextSceneAt=now;game.battleDirectorPattern=null}
 if(!state.pattern&&now>=state.nextSceneAt)beginPattern(game,state);
 if(!state.pattern)return;
 sceneRhythm(game,state,now);
 game.eventTimer=Math.max(game.eventTimer||0,state.endsAt-now+.5);
 if(state.pattern===P.ELITE_FORMATION&&!state.eliteRequested){
  if(game.eliteEnemies&&!game.eliteEnemies.active&&!activeAce(game)){state.eliteRequested=!!game.eliteEnemies.spawnEncounter?.();state.hadElite=!!game.eliteEnemies.active}
  else if(now-state.startedAt>.8){state.queue=action('hunter','cross',(game.viewWidth||960)<=BATTLE_DIRECTOR_BALANCE.compactWidth?2:3);state.nextActionAt=now;state.eliteRequested=true}
 }
 if(state.phase==='quiet'||state.phase==='cleanup'||now<state.nextActionAt||!state.queue.length)return;
 const live=(game.enemies||[]).filter(regular).length;if(live>=directorCap(game)){state.nextActionAt=now+.7;return}
 // Arrive as one squad, but spread the spawn cost over a few frames:
 // at most two new aircraft per tick, the rest join on following ticks.
 const slots=Math.min(state.queue.length,Math.max(0,directorCap(game)-live),2);
 for(let i=0;i<slots;i++){
  const due=state.queue.findIndex(item=>now>=state.startedAt+.35+(item.delay||0));if(due<0)break;const [next]=state.queue.splice(due,1);let e;
  game.directorSpawning=true;try{e=game.spawnEnemy?.(next.type)}finally{game.directorSpawning=false}
  if(e){
   place(game,e,next.layout,next.index,next.count);linkFormation(game,e);
   // Existing formation paint can retune a regional two-seater to its ordinary
   // fighter fit. Seed intent using that final airframe instead of a stale fit.
   if(!e.directorSquad&&directorAircraftEligible(game,e))place(game,e,next.layout,next.index,next.count);
   state.spawned++;
  }
  else{state.queue.unshift(next);break;}
 }
 state.nextActionAt=state.queue.length?now+.05:now+BATTLE_DIRECTOR_BALANCE.actionInterval;
}

export function directorCombatTarget(game,e,contact){
 const players=game.players||[game],chosen=e.directorSquad?.target;
 // Keep ghosts, patrols, decoys, partial-cloud contacts and regional concealment.
 if(!e.directorSquad||e.directorSquad.broken||!contact||contact.fogHidden||!players.includes(contact)||!players.includes(chosen)||chosen.hp<=0||chosen.status==='downed'||chosen.ballCloak>0||chosen.kaiserFogTime>0||(chosen.cloudConceal||0)>0)return contact;
 return regionalCombatTarget(game,e,chosen);
}

export function installBattleDirector(Game,deps={}){
 if(Game.prototype.__battleDirector169)return;Game.prototype.__battleDirector169=true;
 S=deps.passStates;directorAircraftEligible=deps.directorAircraftEligible;
 planes=deps.planes;attachPersonality=deps.attachPersonality;angleDiff=deps.angleDiff||((a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)));
 if(!S||typeof directorAircraftEligible!=='function')throw new Error('Battle Director requires dogfight pass dependencies');
 Game.prototype.maintainEnemyFormations=function(){return maintainFormations(this)};
 Game.prototype.breakEnemyFormation=function(e,duration){const world=this.combatWorld?.()||this;if(e?.eliteKind)return world.eliteEnemies?.disruptFormation?.(e,duration)||false;return breakFormation(world,e,duration)};
 const steering=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){if(e?.formationCollapseUntil>(this.t||0))return{delta:Math.atan2(Math.sin(e.formationBreakHeading-e.a),Math.cos(e.formationBreakHeading-e.a)),turn:baseTurn*.85};const result=e?.defensivePressure?steering.call(this,e,contact,dt,baseTurn):circleSteering(this,e,contact,baseTurn)||choreographySteering(this,e,contact,baseTurn)||intentSteering(this,e,contact,dt,baseTurn)||squadSteering(this,e,contact,dt,baseTurn)||steering.call(this,e,contact,dt,baseTurn);return regionalSteering(this,e,contact,baseTurn,result)};
 const fire=Game.prototype.fireEnemy;
 Game.prototype.fireEnemy=function(e,...args){if(regionalAircraftEligible(e)&&!regionalShotReady(this,e,this.enemyCombatTarget(e))){e.fire=Math.max(e.fire||0,.12);return}if(e.directorSquad&&!this.directorShotReady(e))return;if(e?.formationCollapseUntil>(this.t||0)){e.fire=Math.max(e.fire||0,e.formationCollapseUntil-(this.t||0)+.2);return}return fire.call(this,e,...args)};
 const target=Game.prototype.enemyCombatTarget;
 Game.prototype.enemyCombatTarget=function(e){const base=target.call(this,e),contact=regionalCombatTarget(this,e,base);return directorCombatTarget(this,e,contact)};
 Game.prototype.directorShotReady=function(e){
  if(e.directorFireHoldUntil>(this.t||0)){e.fire=Math.max(e.fire||0,e.directorFireHoldUntil-(this.t||0));return false;}
  if(ordinaryFighter(e)&&e.directorLayout==='cross'&&e.directorReadyAt){e.dangerAimUntil=0;return true;}
  if(!e.dangerMarksman||e.directorSquad?.broken)return true;
  if(!(e.dangerAimUntil>0)){e.dangerAim=e.a;e.dangerAimUntil=(this.t||0)+.38;e.fire=.38;return false}
  if((this.t||0)<e.dangerAimUntil){e.fire=e.dangerAimUntil-(this.t||0);return false}
  e.dangerAimUntil=0;return true;
 };
 Game.prototype.directorMobSpawnsSuppressed=function(){if(this.battlefieldEventSpawning||this.bossMechanicSpawn)return false;if(this.battlefieldEvents?.current?.status==='active'||this.stageCombatWindow?.approaching&&this.stageBoss?.stages.phase==='explore')return true;const state=this.battleDirector;return !!(state&&state.pattern&&!state.suspended&&state.pattern!==P.ACE_PRESSURE&&!activeAce(this))};
 Game.prototype.tickBattleDirector=function(dt){if(this.state==='playing')tickSquadrons(this,Math.min(.04,Math.max(0,dt||0)));return tickDirector(this,dt)};
 Game.prototype.beginBattleDirectorPattern=function(pattern){if(!Object.values(P).includes(pattern))return null;return beginPattern(this,directorState(this),pattern)};

 const regularLimit=Game.prototype.regularEnemyLimit;
 Game.prototype.regularEnemyLimit=function(){const base=regularLimit.call(this);if((this.viewWidth||960)>BATTLE_DIRECTOR_BALANCE.compactWidth)return base;return Math.min(base,this.mode==='coop2'?BATTLE_DIRECTOR_BALANCE.compactCoopCap:BATTLE_DIRECTOR_BALANCE.compactSoloCap)};
 const interval=Game.prototype.regularSpawnInterval;
 Game.prototype.regularSpawnInterval=function(){const base=interval.call(this),pattern=this.battleDirectorPattern;if(pattern===P.RECOVERY)return base*1.65;if(pattern===P.ACE_PRESSURE||pattern===P.ELITE_FORMATION)return base*1.7;return pattern?base*2.2:this.mode!=='campaign'&&this.t<120?base*.82:base};
 const update=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){if(this.state==='playing')maintainFormations(this);const result=update.call(this,dt,input);if(this.state==='playing')maintainFormations(this);this.tickBattleDirector(Math.min(.04,Math.max(0,dt||0)));return result};
}
