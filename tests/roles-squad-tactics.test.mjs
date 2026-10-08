import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PLANES,PILOTS,BATTLE_DIRECTOR_PATTERNS as P,angleDiff} from '../engine.js?v=gun1';
import {CoopGame} from '../coop-engine.js?v=gun1';

import {AIRCRAFT_MASTER} from '../aircraft-master.js';
import {DIRECTOR_LIVERIES} from '../battle-director169.js?v=gun1';

const quiet=g=>{for(const key of ['spawn','eventTimer','nextBossAt','nextHeavyAt','_zeppelinSchedule','flakTimer','regionThreat','fieldUnitTimer','gasTimer','gustTimer','patrolTimer','supplyTimer','allyTimer'])g[key]=Infinity;g.invuln=Infinity;return g};
function scene(pattern,coop=false){
 const g=quiet(coop?new CoopGame([{pilot:'fonck',plane:'camel'},{pilot:'mannock',plane:'se5a'}],{rng:()=>.2}):new Game('camel','fonck',()=>.2));
 g.t=400;g.beginBattleDirectorPattern(pattern);
 for(let i=0;i<8;i++){g.t+=.5;g.tickBattleDirector(.04)}
 return g;
}

test('roles are independent of performance tier and preserve pilot records',()=>{
 const cases={eindecker:'GROWTH',airco_dh2:'GROWTH',fokker:'TURN',camel:'TURN',se5a:'INTERCEPTOR',spad:'INTERCEPTOR',albatros:'HEAVY',spad12:'HEAVY',bristol_duo:'FORMATION',fokkerd7:'FORMATION'};
 for(const [plane,role]of Object.entries(cases))assert.equal(new Game(plane,'fonck',()=>.2).aircraftCombatRole().id,role);
 assert.equal(new Game('loewenhardt_fokkerd7','loewenhardt',()=>.2).aircraftCombatRole().mode,'late');
 assert.equal(PLANES.eindecker.speed,118);assert.equal(PLANES.eindecker.hp,85);assert.equal(PILOTS.loewenhardt.cooldown,17);
});
test('early aircraft retain growth cost after the app imports campaign aircraft',async()=>{
 await import('../campaign.js?v=gun1');

 const g=new Game('eindecker','immelmann',()=>.2),late=new Game('fokkerd7','fonck',()=>.2);
 assert.equal(g.xpCostMultiplier,.72);assert.equal(g.need,4);assert(g.levelRequirement(40)<late.levelRequirement(40));
 assert.equal(new Game('airco_dh2','hawker',()=>.2).xpCostMultiplier,.8);
 g.xp=4;g.checkLevel();assert.equal(g.level,2);assert.equal(g.state,'upgrade');
});
test('interceptor straight exit restores energy without raising cruise or turn',()=>{
 const g=new Game('udet_fokkerdv','udet',()=>.2),control=new Game('udet_fokkerdv','udet',()=>.2);control.aircraftCombatRole=()=>null;
 g.airframeSpeed=control.airframeSpeed=.6;const speed=g.speed,turn=g.turn;
 for(let i=0;i<40;i++){g.flyAirframe(.02,{});control.flyAirframe(.02,{})}
 assert(g.airframeSpeed>control.airframeSpeed);assert(g.airframeSpeed<=1);assert.equal(g.speed,speed);assert.equal(g.turn,turn);
});
test('steady heavy fire converges but retains projectile speed, power and special rounds',()=>{
 const g=new Game('albatros','boelcke',()=>.8);g.a=0;
 const round=()=>({gun:0,vx:Math.cos(.1)*520,vy:Math.sin(.1)*520,damage:12});
 g.aircraftStraightTime=0;const loose=g.applySpecialRound(round());g.aircraftStraightTime=1;const steady=g.applySpecialRound(round());
 assert(Math.abs(Math.atan2(steady.vy,steady.vx))<Math.abs(Math.atan2(loose.vy,loose.vx)));
 assert.equal(steady.damage,loose.damage);assert(Math.abs(Math.hypot(steady.vx,steady.vy)-520)<1e-6);
 g.skillTime=2;const skill=g.applySpecialRound(round());assert(Math.abs(angleDiff(Math.atan2(skill.vy,skill.vx),Math.atan2(loose.vy,loose.vx)))<1e-8);
});
test('turn airframes ease closing speed while maintaining a real tail lock',()=>{
 const g=quiet(new Game('camel','fonck',()=>.2)),control=quiet(new Game('camel','fonck',()=>.2));control.aircraftCombatRole=()=>null;
 for(const p of [g,control]){const e=p.spawnEnemy('hunter');Object.assign(p,{x:0,y:0,a:0});Object.assign(e,{x:200,y:0,a:0,speed:80});p.updateTailLock(.6);assert(p.tailLocked);for(let i=0;i<20;i++)p.updateTailLock(.04)}
 assert(g.pursuitSpeedFactor<control.pursuitSpeedFactor);assert(g.pursuitSpeedFactor>=.78);assert.equal(g.x,control.x);assert.equal(g.a,control.a);
});
test('formation airframe widens real wing slots while pilot and Lufbery formations retain priority',()=>{
 const g=new Game('fokkerd7','fonck',()=>.2);g.a=0;
 const wing=g.wingFormationTarget({slot:0},2);assert.equal(wing.y,70*1.45);assert.equal(g.allies.length,0);
 g.skillTime=1;assert.equal(g.wingFormationTarget({slot:0},2).y,70);
 g.skillTime=0;g.upgrades.lufberyCircle=1;const circle=g.wingFormationTarget({slot:0},2);assert.equal(Math.hypot(circle.x-g.x,circle.y-g.y),88);
});

for(const [pattern,tactic]of [[P.CHASE,'chase'],[P.CROSS_ATTACK,'cross'],[P.BAIT,'bait'],[P.ESCORT,'escort'],[P.HEAD_ON_PASS,'headOn'],[P.VETERAN_FORMATION,'veteran']]){
 test(`${pattern} has a real leader, shared target and distinct steering`,()=>{
  const g=scene(pattern),members=g.enemies.filter(e=>e.directorSquad),squad=members[0]?.directorSquad;
  assert(squad);assert.equal(squad.tactic,tactic);assert(members.length>=2);assert.equal(members.filter(e=>e.isFormationCommander).length,1);
  for(const w of members.filter(e=>e!==squad.leader))assert.equal(w.formationLeader,squad.leader);
  for(const e of members.filter(e=>e.type!=='bomber')){const s=g.dogfightSteering(e,g,1/60,1.7);assert(Number.isFinite(s.delta));assert(Number.isFinite(s.turn));assert.equal(e.directorTarget,g)}
 });
}
test('chase, cross, bait and escort use different combat geometry',()=>{
 const chase=scene(P.CHASE),cg=chase.enemies[0];chase.dogfightSteering(cg,chase,.02,1.7);assert(cg.combatPassWaypoint.y>chase.y);
 const cross=scene(P.CROSS_ATTACK),cm=cross.enemies.filter(e=>e.directorSquad);cm[0].directorSquad.leader.combatPassState='REPOSITION';
 for(const e of cm)cross.dogfightSteering(e,cross,.02,1.7);assert(cm[0].combatPassWaypoint.x*cm[1].combatPassWaypoint.x<0);
 const bait=scene(P.BAIT),bm=bait.enemies.filter(e=>e.directorSquad);for(const e of bm)bait.dogfightSteering(e,bait,.02,1.7);
 assert(bm[0].combatPassWaypoint.y<bait.y);assert(bm[1].combatPassWaypoint.y>bait.y);
 const escort=scene(P.ESCORT),b=escort.enemies.find(e=>e.type==='bomber'),w=escort.enemies.find(e=>e.type==='hunter');escort.dogfightSteering(w,escort,.02,1.7);
 assert(Math.hypot(w.combatPassWaypoint.x-b.x,w.combatPassWaypoint.y-b.y)<160);
});
test('commander death gives a 2.5-second natural Break and releases pursuit/formation',()=>{
 const g=scene(P.CHASE),squad=g.enemies[0].directorSquad,wing=squad.members[1],heading=wing.a;
 squad.leader.hp=0;g.tickBattleDirector(.04);assert(squad.broken);assert.equal(wing.formationLeader,undefined);assert.equal(wing.a,heading);assert(wing.fire>=2.5);assert.equal(wing.isFormationCommander,false);
 const steer=g.dogfightSteering(wing,g,.02,1.7);assert(Math.abs(steer.delta)>.5);assert(steer.turn<1.7);
 g.t+=2.6;g.tickBattleDirector(.04);const normal=g.dogfightSteering(wing,g,.02,1.7);assert(Number.isFinite(normal.delta));assert.equal(wing.directorTarget,undefined);
});
test('veteran survivors re-form after the break without healing or cloning a leader',()=>{
 const g=scene(P.VETERAN_FORMATION),squad=g.enemies[0].directorSquad,hp=squad.members[1].hp;
 squad.leader.hp=0;g.tickBattleDirector(.04);g.t+=6.1;g.tickBattleDirector(.04);
 assert.equal(squad.broken,false);assert.equal(squad.leader,squad.members[1]);assert.equal(squad.leader.hp,hp);assert.equal(squad.members[2].formationLeader,squad.leader);
});
test('veteran paint pools contain only real non-exclusive aircraft and authored files',()=>{
 for(const pool of Object.values(DIRECTOR_LIVERIES))for(const key of pool){assert(AIRCRAFT_MASTER[key]);assert.equal(AIRCRAFT_MASTER[key].exclusivePilotId,null)}
 const g=scene(P.VETERAN_FORMATION);for(const e of g.enemies.filter(e=>e.directorSquad))assert(DIRECTOR_LIVERIES[e.faction].includes(e.escortPlane));
});
test('Director fighters retain their requested type while random background pressure remains unchanged',()=>{
 const g=quiet(new Game('fokker','baron',()=>.1));g.t=400;g.beginBattleDirectorPattern(P.VETERAN_FORMATION);
 for(let i=0;i<8;i++){g.t+=.5;g.tickBattleDirector(.04)}
 assert.equal(g.enemies.length,3);assert(g.enemies.every(e=>e.type==='hunter'&&!e.dangerHeavy));assert.equal(g.directorSpawning,false);
 const background=g.spawnEnemy('hunter');assert.equal(background.type,'bomber');assert.equal(background.directorSquad,undefined);
});
test('marksman telegraph precedes an actual unchanged forward shot',()=>{
 for(const coop of [false,true]){
  const g=scene(P.CROSS_ATTACK,coop),e=g.enemies.find(e=>e.dangerMarksman),before=g.bullets.length;
  g.fireEnemy(e);assert(e.dangerAimUntil>g.t);assert.equal(g.bullets.length,before);
  g.t+=.4;g.fireEnemy(e);assert(g.bullets.length>before);assert.equal(e.dangerAimUntil,0);assert.equal(e.fire,2.5);
 }
});
test('co-op commander collapse runs in the shared Director tick',()=>{
 const g=scene(P.CHASE,true),squad=g.enemies[0].directorSquad;assert.equal(squad.target,g.players[0]);squad.leader.hp=0;g.tickBattleDirector(.04);
 assert(squad.broken);assert.equal(squad.members[1].formationLeader,undefined);
});
test('scene expiration releases ordinary AI; ace escorts never acquire the new traits',()=>{
 const g=scene(P.CHASE),wing=g.enemies[1];g.t=g.battleDirector.endsAt+.1;g.tickBattleDirector(.04);assert.equal(wing.directorSquad,undefined);assert.equal(wing.formationLeader,undefined);
 g.bossDeck=['goering'];g.spawnEnemy('boss');const boss=g.enemies.at(-1);g.update(.01,{});
 for(const e of g.enemies.filter(e=>e===boss||e.formationLeader===boss)){assert.equal(e.directorSquad,undefined);assert.equal(e.dangerMarksman,undefined);assert.equal(e.isFormationCommander,undefined)}
});
