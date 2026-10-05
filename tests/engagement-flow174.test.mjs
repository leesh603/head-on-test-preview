import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,BATTLE_DIRECTOR_PATTERNS as P} from '../engine.js?v=477';
import {wingmanEngagementStep,patrolEngagementStep} from '../engagement-flow174.js?v=477';

test('ordinary wingmen split nearby targets, fly their own passes and return within the leash',()=>{
 const enemies=[{x:210,y:-60,hp:100},{x:230,y:70,hp:100}],owner={x:0,y:0,a:0,speed:170,upgrades:{},pilot:'baron'};
 const wings=[{x:-65,y:-45,a:0,slot:0,engagementState:'HOME'},{x:-65,y:45,a:0,slot:1,engagementState:'HOME'}];
 const world={t:0,enemies,allies:wings},homes=[{x:-70,y:-65},{x:-70,y:65}];
 world.t+=.04;for(let j=0;j<2;j++)wingmanEngagementStep(world,owner,wings[j],homes[j],.04);
 assert.notEqual(wings[0].engagementTarget,wings[1].engagementTarget);
 for(let i=1;i<100;i++){world.t+=.04;for(let j=0;j<2;j++)wingmanEngagementStep(world,owner,wings[j],homes[j],.04)}
 assert(wings.some(w=>['PASS','BREAK','RETURN'].includes(w.engagementState)));
 world.enemies=[];for(let i=0;i<300;i++){world.t+=.04;for(let j=0;j<2;j++)wingmanEngagementStep(world,owner,wings[j],homes[j],.04)}
 assert(wings.every(w=>w.engagementState==='HOME'));
 assert(wings.every((w,j)=>Math.hypot(w.x-homes[j].x,w.y-homes[j].y)<90));
});

test('patrols pass through a contact, extend, reposition and reengage',()=>{
 const p={x:0,y:0,a:0,slot:0,speed:185,personalityTurn:2.25,personality:{preferredRange:210}},target={x:190,y:0,a:0,hp:100};
 const seen=new Set();
 for(let i=0;i<170;i++){patrolEngagementStep(p,target,{x:0,y:0},.04);seen.add(p.combatPassState);p.x+=Math.cos(p.a)*p.speed*.04;p.y+=Math.sin(p.a)*p.speed*.04}
 for(const state of ['ATTACK_PASS','COMMIT','DISENGAGE','REPOSITION','REENGAGE'])assert(seen.has(state),state);
 assert(Number.isFinite(p.x)&&Number.isFinite(p.y));
});

test('Director reserves opening slots, suppresses background spawns and delays fire after leader loss',()=>{
 const g=new Game('fokker','baron',()=>.5);g.state='playing';g.viewWidth=600;g.t=2;
 for(let i=0;i<3;i++)g.spawnEnemy('scout');assert(g.mobSpawnsSuppressed());
 g.enemies=[];g.t=20;g.beginBattleDirectorPattern(P.HEAD_ON_PASS);
 assert(g.mobSpawnsSuppressed());
 while(g.battleDirector.queue.length){g.t+=.5;g.tickBattleDirector(.04)}
 const group=g.enemies.filter(e=>e.directorSceneId===g.battleDirector.sceneId);
 assert.equal(group.length,3);const leader=group.find(e=>!e.formationLeader),followers=group.filter(e=>e.formationLeader===leader);
 assert.equal(followers.length,2);assert.notEqual(followers[0].formationOffset,followers[1].formationOffset);
 assert(g.dogfightSteering(followers[0],g,.04,1.7).turn>0);
 leader.hp=0;g.tickBattleDirector(.04);
 assert(followers[0].formationLeader==null);assert(followers[0].fire>=2.4);
 g.beginBattleDirectorPattern(P.RECOVERY);assert.equal(g.mobSpawnsSuppressed(),true);
});

test('Director tactics keep distinct approach geometry at mid and late pressure',()=>{
 const scene=(pattern,time)=>{const g=new Game('fokker','baron',()=>.5);g.state='playing';g.viewWidth=960;g.t=time;g.beginBattleDirectorPattern(pattern);while(g.battleDirector.queue.length){g.t+=.5;g.tickBattleDirector(.04)}return g};
 const cross=scene(P.CROSS_ATTACK,200),groups=new Map();
 for(const e of cross.enemies){const side=Math.sign(e.x-cross.x);groups.set(side,(groups.get(side)||0)+1)}
 assert(groups.get(-1)>=2&&groups.get(1)>=2);
 const chase=scene(P.CHASE,200);assert(chase.enemies.length>=4&&chase.enemies.every(e=>e.y>chase.y&&e.speed>chase.speed));
 const escort=scene(P.ESCORT,200),bomber=escort.enemies.find(e=>e.type==='bomber');assert(bomber&&escort.enemies.filter(e=>e.formationLeader===bomber).length>=3);
 const decoy=scene(P.DECOY,80),lead=decoy.enemies.find(e=>e.directorLayout==='decoy');assert(lead&&lead.y<decoy.y&&decoy.enemies.filter(e=>e.directorLayout==='decoyWing').every(e=>e.y>decoy.y));
 const run=scene(P.BOMBER_RUN,400);assert.equal(run.enemies.filter(e=>e.type==='bomber').length,2);assert(run.enemies.filter(e=>e.type==='hunter').length>=3);
});
