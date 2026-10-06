import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TAILING_BALANCE,BATTLE_DIRECTOR_PATTERNS as P} from '../engine.js?v=sink4';


const quiet=g=>{for(const key of ['spawn','eventTimer','nextBossAt','nextHeavyAt','_zeppelinSchedule','flakTimer','regionThreat','fieldUnitTimer','gasTimer','gustTimer','patrolTimer'])g[key]=Infinity;return g};
const setup=(plane='spad')=>{const g=quiet(new Game(plane,'fonck',()=>.5));Object.assign(g,{x:0,y:0,a:0});return g};
const target=(extra={})=>({x:200,y:0,a:0,type:'hunter',hp:100,maxHp:100,speed:80,fire:99,...extra});

 test('valid rear entry receives weak matching before lock; lock is stronger without heading assistance',()=>{
 const g=setup(),e=target();g.enemies=[e];const pose={x:g.x,y:g.y,a:g.a};g.updateTailLock(.12);
 assert.equal(g.tailLocked,false);assert(g.pursuitSpeedFactor<1);assert(g.pursuitSpeedFactor>.93);
 const acquiring=g.pursuitSpeedFactor;g.updateTailLock(TAILING_BALANCE.lockTime);for(let i=0;i<20;i++)g.updateTailLock(.04);
 assert.equal(g.tailLocked,true);assert(g.pursuitSpeedFactor<acquiring);assert.deepEqual({x:g.x,y:g.y,a:g.a},pose);
 e.x=85;for(let i=0;i<20;i++)g.updateTailLock(.04);assert(g.pursuitSpeedFactor<.87,'close-range braking adds bounded protection against overshoot');
 const closeFactor=g.pursuitSpeedFactor;e.y=300;g.updateTailLock(.04);assert(g.pursuitSpeedFactor>closeFactor,'loss of genuine geometry releases matching even during grace');
 });

 test('airborne mission fighters, formation leaders and aces remain eligible; grounded and heavy targets do not',()=>{
 for(const extra of [{missionTarget:true},{formationCommand:true},{type:'boss',bossPilot:'bishop',ace:true}]){
  const g=setup(),e=target(extra);g.enemies=[e];g.updateTailLock(TAILING_BALANCE.lockTime);assert.equal(g.tailLocked,true,JSON.stringify(extra));
 }
 for(const extra of [{surface:true},{stationary:true},{fieldUnit:'balloon'},{navalVessel:true},{type:'zeppelin'},{heavyBomber:true}]){
  const g=setup();g.enemies=[target(extra)];g.updateTailLock(1);assert.equal(g.tailLocked,false,JSON.stringify(extra));
 }
 });

 test('leader loss disrupts only the ordinary formation, delays fire, uses a bounded break, and recovers',()=>{
 const g=setup();g.t=400;g.beginBattleDirectorPattern(P.PINCER);for(let i=0;i<3;i++){g.t+=.5;g.tickBattleDirector(.04)}
 const group=g.enemies.filter(e=>e.directorSceneId===g.battleDirector.sceneId),leader=group.find(e=>e.formationCommand),wing=group.find(e=>e.formationLeader===leader);
 assert(leader&&wing);assert.equal(wing.directorLayout,'pincer');assert.equal(wing.directorFormation,true);
 const initialHeading=wing.a;leader.hp=0;g.update(.01,{});assert(wing.formationCollapseUntil>g.t+2.4);assert.equal(wing.formationLeader,null);assert.equal(wing.patrolTarget,null);
 const steering=g.dogfightSteering(wing,g,.04,1.7);assert(Math.abs(steering.delta)>0);assert(steering.turn<=1.7);assert(Math.abs(wing.a-initialHeading)<.1,'no heading teleport');
 const rounds=g.bullets.length;g.fireEnemy(wing);assert.equal(g.bullets.length,rounds);assert(wing.fire>2);
 assert.equal(g.breakEnemyFormation(wing,3),false,'repeat disruption does not stack');
 g.t=wing.formationCollapseUntil+.1;g.update(.01,{});assert.equal(wing.formationCollapseUntil,0);assert.equal(wing.formationBreakHeading,null);assert.equal(wing.formationLeader,null);
 });

 test('a consumed commander outcome breaks the next directed group at entry only',()=>{
 const g=setup();g.viewWidth=600;g.t=400;g.battlefieldEvents={pending:{formation:{value:true,expiresAt:418,region:g.worldRegion()}}};g.beginBattleDirectorPattern(P.CROSS_ATTACK);
 for(let i=0;i<3;i++){g.t+=.5;g.tickBattleDirector(.04)}
 const group=g.enemies.filter(e=>e.directorSceneId===1);assert.equal(group.length,4);assert(group.every(e=>e.formationCollapseUntil>g.t));
 g.battlefieldEvents.engagement.endsAt=0;g.beginBattleDirectorPattern(P.CROSS_ATTACK);for(let i=0;i<3;i++){g.t+=.5;g.tickBattleDirector(.04)}
 assert(g.enemies.filter(e=>e.directorSceneId===2).every(e=>!e.formationCollapseUntil));
 });

 test('elite command loss creates a 2.6s real break and only later formations can regroup',async()=>{
 const {EliteEnemySystem}=await import('../elite-patch/module/elite-core.js?v=sink4');
 for(const stage of [4,7]){
  let time=400;const host={random:()=>.5,getTime:()=>time,getPlayer:()=>({x:0,y:0}),getPlayerFaction:()=> 'central',getNormalStats:()=>({hp:30,damage:10,speed:100}),getAceStats:()=>({hp:700,damage:40}),getProgressStage:()=>stage,damagePlayer:()=>{}};
  const system=new EliteEnemySystem(host),squadron=system.spawnEncounter(),leader=squadron.leader;
  const wing=squadron.members.find(m=>m!==leader),pose={x:wing.x,y:wing.y,a:wing.a};system.damageMember(leader,1e6);
  assert.equal(squadron.leader,null);assert.equal(wing.formationLeader,null);assert.equal(squadron.breakUntil,time+2.6);
  system.update(.04);assert.notDeepEqual({x:wing.x,y:wing.y},pose);assert(Math.abs(wing.a-pose.a)<=1.4*.04+1e-9);assert.equal(system.projectiles.length,0);
  time+=2.7;system.update(.04);assert.equal(squadron.leader,null,'independent combat resumes before regroup');
  time+=7;system.update(.04);assert.equal(!!squadron.leader,stage===7,'stage 4 group loses command permanently, stage 7 survivors regroup');
 }
 });

 test('short explosion disruption rejoins its living commander instead of permanently removing the group',()=>{
 const g=setup();g.t=400;g.beginBattleDirectorPattern(P.PINCER);for(let i=0;i<3;i++){g.t+=.5;g.tickBattleDirector(.04)}
 const leader=g.enemies.find(e=>e.formationCommand),wing=g.enemies.find(e=>e.formationLeader===leader);assert(leader&&wing);
 g.breakEnemyFormation(leader,.7);g.breakEnemyFormation(wing,.7);assert.equal(wing.formationLeader,null);
 g.t+=.8;g.update(.01,{});assert.equal(leader.formationCommand,true);assert.equal(wing.formationLeader,leader);
 });

const coopFormation=async()=>{
 const {CoopGame}=await import('../coop-engine.js?v=sink4');

 const world=quiet(new CoopGame([{plane:'camel',pilot:'fonck'},{plane:'camel',pilot:'bishop'}],{rng:()=>.5}));
 world.t=400;world.beginBattleDirectorPattern(P.PINCER);for(let i=0;i<3;i++){world.t+=.5;world.tickBattleDirector(.04)}
 const leader=world.enemies.find(e=>e.formationCommand),wing=world.enemies.find(e=>e.formationLeader===leader);assert(leader&&wing);
 return {world,leader,wing};
};

 test('actual co-op updates recognize leader loss and expire the break into independent combat',async()=>{
 const {world,leader,wing}=await coopFormation();leader.hp=0;world.update(.04,{});
 assert(wing.formationCollapseUntil>world.t+2.5);assert.equal(wing.formationLeader,null);const until=wing.formationCollapseUntil;
 world.update(.04,{});assert.equal(wing.formationCollapseUntil,until,'next frame never prolongs the consumed death break');
 world.t=until+.1;world.update(.04,{});assert.equal(wing.formationCollapseUntil,0);assert.equal(wing.formationLeader,null);assert.equal(wing.formationBreakHeading,null);
 });

 test('actual co-op updates return a briefly disrupted wing to its living commander',async()=>{
 const {world,leader,wing}=await coopFormation();world.breakEnemyFormation(wing,.7);assert.equal(wing.formationLeader,null);assert.equal(wing.formationResumeLeader,leader);
 world.t+=.8;world.update(.04,{});assert.equal(wing.formationCollapseUntil,0);assert.equal(wing.formationLeader,leader);assert.equal(wing.formationResumeLeader,null);
 });

 test('commander death during a short co-op blast upgrades to the full death break exactly once',async()=>{
 const {world,leader,wing}=await coopFormation();world.breakEnemyFormation(wing,.7);const temporaryUntil=wing.formationCollapseUntil;
 world.t+=.2;leader.hp=0;world.update(.04,{});assert(wing.formationCollapseUntil>=world.t+2.5);assert(wing.formationCollapseUntil>temporaryUntil+2);assert.equal(wing.formationResumeLeader,null);
 const fullUntil=wing.formationCollapseUntil;world.update(.04,{});assert.equal(wing.formationCollapseUntil,fullUntil);
 world.t=fullUntil+.1;world.update(.04,{});assert.equal(wing.formationLeader,null);assert.equal(wing.formationCollapseUntil,0);
 });

 test('elite short disruption delegates from Game and restores command; death during it upgrades the full break',async()=>{
 const {EliteEnemySystem}=await import('../elite-patch/module/elite-core.js?v=sink4');
 const g=setup();g.t=400;
 const host={random:()=>.5,getTime:()=>g.t,getPlayer:()=>g,getPlayerFaction:()=> 'central',getNormalStats:()=>({hp:30,damage:10,speed:100}),getAceStats:()=>({hp:700,damage:40}),getProgressStage:()=>7,damagePlayer:()=>{}};
 const system=g.eliteEnemies=new EliteEnemySystem(host),squadron=system.spawnEncounter(),leader=squadron.leader,wing=squadron.members.find(m=>m!==leader);
 assert.equal(g.breakEnemyFormation(wing,.7),true);assert.equal(squadron.leader,null);assert.equal(squadron.formationResumeLeader,leader);assert.equal(wing.formationResumeLeader,leader);
 const until=squadron.breakUntil;assert.equal(system.disruptFormation(wing,.8),false);assert.equal(squadron.breakUntil,until,'short disruptions never accumulate');
 g.t+=.8;system.update(.04);assert.equal(squadron.leader,leader);assert.equal(wing.formationLeader,leader);assert.equal(wing.formationCollapseUntil,0);
 g.breakEnemyFormation(wing,.7);const temporaryUntil=squadron.breakUntil;g.t+=.2;system.damageMember(leader,1e6);
 assert.equal(squadron.breakUntil,g.t+2.6);assert(squadron.breakUntil>temporaryUntil+2);assert.equal(squadron.formationResumeLeader,null);assert.equal(wing.formationResumeLeader,null);
 const deathUntil=squadron.breakUntil;system.update(.04);assert.equal(squadron.breakUntil,deathUntil);
 g.t=deathUntil+.1;system.update(.04);assert.equal(squadron.leader,null);assert.equal(wing.formationCollapseUntil,0);
 g.t+=7;system.update(.04);assert(squadron.leader?.alive,'late survivors regroup after the full death consequence');
 });

 test('co-op Director followers preserve their own pincer approach rather than copying leader heading',async()=>{
 const {world,leader,wing}=await coopFormation();
 leader.a=0;wing.a=1.2;wing.directorFormation=true;
 world.update(.01,{});assert.ok(Math.abs(wing.a-leader.a)>.8,'manual Director path survives legacy follower snap');
 });
