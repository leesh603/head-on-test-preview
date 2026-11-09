import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,step} from './stageboss-fixture94.mjs';
import {createJutlandRoute,jutlandPoint,tickJutlandRoute} from '../jutland-route.js';
import {JUTLAND_ENTRY_SECONDS,jutlandRotate} from '../jutland-boss.js';

function battle(team='entente'){
 const f=fixture({stageIndex:16,teamFaction:team});
 f.e=f.addon.startBoss({x:400,y:0});f.b=f.e.bodies.values().next().value;
 return f;
}
const hazards=f=>f.addon.hazards.pool.records.filter(h=>h.active&&h.visual==='jutland-shell');

test('Jutland fields only one enemy flagship with a shorter total durability budget',()=>{
 for(const team of ['central','entente']){
  const f=battle(team);
  assert.equal(f.e.bossId,'jutland-grand-fleet');assert.equal(f.e.bodies.size,1);assert.equal(f.e.maxHpBudget,780);
  assert.notEqual(f.b.faction,team);assert.deepEqual([...f.b.parts.keys()],['bow','director','aft']);
 }
});

test('rotated weakpoint coordinates and swept hull collision remain authoritative',()=>{
 const f=battle();
 assert.equal(f.b.hit({damage:100}).damage,0);
 step(f,JUTLAND_ENTRY_SECONDS+.2);
 const p=f.b.parts.get('bow'),hp=f.b.hp,v=jutlandRotate(p.localX,p.localY,f.b.hullYaw);
 assert(Math.abs(p.x-v.x)<1e-8);
 assert.equal(f.b.locateHit({x:f.b.x+p.x,y:f.b.y+p.y,radius:1}).partId,p.id);
 assert.equal(f.b.locateHit({x:f.b.x+1500,y:f.b.y}),null);
 assert.equal(f.b.hit({partId:p.id,damage:10}).damage,10);
 assert.equal(f.b.hp,hp-10);assert.equal(p.hp,p.maxHp-10);
 assert.throws(()=>f.b.hit({damage:NaN}));
});

test('a physical broadside warns bounded impacts, opens a counter window, and never spawns aircraft',()=>{
 const f=battle();
 for(let n=0;n<320&&!hazards(f).length;n++)step(f,.05);
 step(f,.45);
 assert.equal(hazards(f).length,4);
 assert(hazards(f).every(h=>h.warning===1.8));
 assert.equal(f.b.attackStep,'fall');
 step(f,3.1);assert.equal(f.b.attackStep,'reload');assert(f.b.counterWindow()>1);
 step(f,60);assert.equal(f.log.minions.length,0);
 assert(f.log.cues.some(e=>e.phase==='jutland-broadside-turn'));
});

test('destroying the director cancels waiting impacts and disabling both guns ends native fire',()=>{
 const f=battle();
 for(let n=0;n<320&&!hazards(f).length;n++)step(f,.05);
 assert(hazards(f).length>0);
 f.b.hit({partId:'director',damage:1e6});assert.equal(hazards(f).length,0);
 assert.equal(f.b.attackTime,4.2);
 for(const id of ['bow','aft'])f.b.hit({partId:id,damage:1e6});
 assert.equal(f.b.attackStep,'disarmed');
 step(f,35);assert.equal(hazards(f).length,0);
});

function advanceTo(f,phase,move=()=>{}){
 for(let n=0;n<320&&f.b.attackStep!==phase;n++){move();step(f,.05);}
 assert.equal(f.b.attackStep,phase);
}
const shotsFrom=(f,id)=>hazards(f).filter(h=>h.sourcePartId===id);
function assertLaneCenter(shots,lane){
 assert(shots.length>0);
 for(const axis of ['x','y']){
  const center=shots.reduce((sum,h)=>sum+h[axis],0)/shots.length;
  assert(Math.abs(center-lane[axis])<1e-7,'the frozen lane center is kept for '+lane.id);
 }
}

test('the production host keeps authored lane centers and timings against a moving pilot',()=>{
 const f=battle(),p=f.frame.players[0];
 p.vx=62;p.vy=0;f.frame.players.length=1;
 const move=()=>{p.x+=p.vx*.05;};
 advanceTo(f,'aim',move);
 const locked=structuredClone(f.b.pending.lanes);
 assert.equal(locked.length,2);
 advanceTo(f,'fall',move);
 assert.equal(shotsFrom(f,'bow').length,2);
 assert.equal(shotsFrom(f,'aft').length,0);
 for(let n=0;n<7;n++){move();step(f,.05);}
 assert.equal(shotsFrom(f,'aft').length,0);
 move();step(f,.05);
 assert.equal(shotsFrom(f,'aft').length,2);
 assert(f.b.parts.get('aft').recoil>0&&f.b.parts.get('bow').recoil===0);
 for(const lane of locked)assertLaneCenter(shotsFrom(f,lane.id),lane);
 assert(Math.max(...shotsFrom(f,'bow').map(h=>h.radius))<Math.max(...shotsFrom(f,'aft').map(h=>h.radius)));
 advanceTo(f,'reload',move);
 assert(f.log.damage.length>0,'a pilot keeping their course can be hit by the committed broadside');
});

for(const [lost,live] of [['bow','aft'],['aft','bow']])test('losing '+lost+' frees only its lane during aim and impact warning',()=>{
 const aiming=battle();advanceTo(aiming,'aim');
 const keptLane=aiming.b.pending.lanes.find(l=>l.id===live);
 aiming.b.hit({partId:lost,damage:1e6});advanceTo(aiming,'fall');
 step(aiming,.45);
 assert.equal(shotsFrom(aiming,lost).length,0);
 assertLaneCenter(shotsFrom(aiming,live),keptLane);
 const warning=battle();advanceTo(warning,'fall');
 step(warning,.45);
 const original=shotsFrom(warning,live).map(h=>[h.x,h.y,h.delay]);
 warning.b.hit({partId:lost,damage:1e6});
 assert.equal(shotsFrom(warning,lost).length,0);
 assert.deepEqual(shotsFrom(warning,live).map(h=>[h.x,h.y,h.delay]),original);
 assert(warning.log.cues.some(e=>e.phase==='jutland-'+lost+'-lost'));
});

test('the stern gun can be stopped after the bow gun has fired',()=>{
 const f=battle();advanceTo(f,'fall');
 assert.equal(shotsFrom(f,'bow').length,2);
 f.b.hit({partId:'aft',damage:1e6});
 step(f,.6);
 assert.equal(shotsFrom(f,'bow').length,2);assert.equal(shotsFrom(f,'aft').length,0);
 assert.equal(f.b.parts.get('aft').recoil,0);
});

test('the last salvo extends both authored lanes to three rounds each without overlapping another volley',()=>{
 const f=battle();f.b.hp=f.b.maxHp*.32;advanceTo(f,'fall');
 step(f,.45);
 assert.equal(shotsFrom(f,'bow').length,3);
 assert.equal(shotsFrom(f,'aft').length,3);
 assert(f.log.cues.some(e=>e.phase==='jutland-last-salvo'));
 let peak=0;
 for(let n=0;n<230;n++){peak=Math.max(peak,hazards(f).length);step(f,.05);}
 assert.equal(peak,6);
});

test('pause freezes the flagship, then sinking resolves rewards and hazards once',()=>{
 const f=battle();step(f,7);
 const state=()=>[f.b.x,f.b.y,f.b.hullYaw,f.b.attackTime,f.addon.hazards.serial],before=state();
 f.frame.paused=true;step(f,4);assert.deepEqual(state(),before);
 f.frame.paused=false;f.b.hit({damage:1e9});assert(f.e.completed);
 step(f,5,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.log.cleanup.length,1);assert.equal(hazards(f).length,0);
});

test('the North Sea route is world-anchored and ignores circling mileage',()=>{
 const g={x:10,y:20,a:-Math.PI/2,stageBoss:{stages:{stageIndex:16,phase:'explore'}},event(){}};
 g.jutlandRoute=createJutlandRoute(g);g.distance=1e9;tickJutlandRoute(g);assert.equal(g.jutlandRoute.maxForward,0);
 g.players=[g,{...jutlandPoint(g.jutlandRoute,6000,-7000)}];tickJutlandRoute(g);
 assert(Math.abs(g.players[1].x-g.jutlandRoute.x+3600)<1e-8);assert.equal(g.jutlandRoute.maxForward,6000);
 g.stageBoss.stages.stageIndex=0;tickJutlandRoute(g);assert.equal(g.jutlandRoute,null);
});
