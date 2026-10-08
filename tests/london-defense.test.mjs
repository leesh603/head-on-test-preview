import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter,LondonRaidApron} from '../headon-stageboss-patterns.js';
import {apronPanelHull,netContact,apronPoint} from '../london-apron369.js';
import {renderStageBossLayer} from '../headon-stageboss-render.js';
import {handleLondonCue,tickLondonBattle} from '../london-battle.js';
import {fixture,step} from './stageboss-fixture94.mjs';

const tuning={maxHp:1000,partHp:100,damage:12,bulletSpeed:160};
function flight(players=[]){
 const events=[],encounter=createBossEncounter({id:'london',bossId:'gotha-squadron',x:400,y:180,tuning,emit:e=>events.push({...e,time:ctx.time}),rng:()=>.5});
 const ctx={time:0,players,bounds:{left:0,right:800,top:0,bottom:800},londonTargets:[{id:'west',x:170,y:390,hp:120},{id:'docks',x:400,y:515,hp:120},{id:'east',x:630,y:390,hp:120}]};
 const advance=seconds=>{for(let i=0;i<Math.ceil(seconds/.05);i++){ctx.time+=.05;encounter.update(.05,ctx);}};
 return{events,encounter,ctx,advance,bodies:[...encounter.bodies.values()]};
}
for(const count of [1,2])test(`Gotha flight protects distinct real districts and re-enters with ${count} players`,()=>{
 const f=flight(Array.from({length:count},(_,i)=>({id:'p'+i,alive:true,x:100+i*400,y:600})));
 const before=f.bodies.map(b=>b.y);f.advance(2);assert.ok(f.bodies.every((b,i)=>b.y>before[i]));assert.equal(f.events.filter(e=>e.type==='city-bomb').length,0);
 f.advance(50);const bombs=f.events.filter(e=>e.type==='city-bomb');
 for(const target of f.ctx.londonTargets)assert.ok(bombs.filter(e=>e.targetId===target.id).length>=2);
 for(const bomb of bombs){assert.ok(Math.abs(bomb.sourceX-bomb.x)<55);assert.ok(Math.abs(bomb.sourceY-bomb.y)<5);assert.equal(bomb.damage,18);}
 assert.equal(f.encounter.maxHpBudget,1000);assert.equal(f.bodies.length,3);
});
test('engine loss delays actual arrival; both engines retain the falling defeat',()=>{
 const a=flight(),b=flight();b.bodies[0].hit({partId:'engine-left',damage:1000});a.advance(18);b.advance(18);
 const first=f=>f.events.find(e=>e.type==='city-bomb'&&e.bossId.endsWith(':0'))?.time;
 assert.ok(first(b)>first(a));b.bodies[0].hit({partId:'engine-right',damage:1000});assert.equal(b.bodies[0].phase,'gliding');b.events.length=0;b.advance(5);
 assert.ok(b.bodies[0].dead);assert.ok(b.events.some(e=>e.type==='aa-effect'&&e.kind==='aaWreckSmoke'));assert.ok(!b.events.some(e=>e.type==='city-bomb'&&e.bossId.endsWith(':0')));
});
test('bomb bay destruction aborts warned and final runs without disabling other Gothas',()=>{
 const f=flight();f.advance(6);assert.ok(f.bodies[0].runTarget);f.bodies[0].hit({partId:'bomb-bay',damage:1000});
 assert.equal(f.bodies[0].runTarget,null);assert.ok(f.events.some(e=>e.type==='city-bomb-abort'));f.events.length=0;f.advance(35);
 assert.ok(!f.events.some(e=>e.type==='city-bomb'&&e.bossId.endsWith(':0')));assert.ok(f.events.some(e=>e.type==='city-bomb'&&e.bossId.endsWith(':1')));
 f.bodies[1].hit({damage:10000});f.bodies[0].hit({damage:f.bodies[0].hp*.97/.7});f.advance(.1);assert.ok(f.encounter.finalBombing);assert.equal(f.events.filter(e=>e.type==='gotha-final-bombing').length,1);
 f.events.length=0;f.advance(35);assert.ok(f.events.some(e=>e.type==='city-bomb'&&e.bossId.endsWith(':2')));assert.ok(!f.events.some(e=>e.type==='city-bomb'&&e.bossId.endsWith(':0')));
});
test('rear gun destruction cancels its shots; empty targets never create fake city objectives',()=>{
 const f=flight([{id:'p',alive:true,x:185,y:-800}]);f.bodies[0].hit({partId:'rear-gun',damage:1000});assert.ok(f.events.some(e=>e.type==='cancel-hazards'&&e.tag==='london:gotha:0-rear'));
 f.ctx.londonTargets=[];f.events.length=0;f.advance(35);assert.ok(!f.events.some(e=>e.type==='city-bomb-warning'||e.type==='city-bomb'));assert.ok(!f.events.some(e=>e.tag==='london:gotha:0-rear'));
});
test('city bomb resolves existing district damage once and all three lost districts fail defence',()=>{
 const f=flight(),g={worldRegion:()=>11,teamFaction:'entente',state:'playing',t:0,kills:0,viewWidth:800,enemies:[],bullets:[],event(){},stageBoss:{stages:{phase:'boss',encounter:f.encounter}}};
 handleLondonCue(g,{type:'boss-enter'});const d=g.londonBattle.districts[0];handleLondonCue(g,{type:'city-bomb',targetId:d.id,runId:'bomb',seconds:1.3,damage:18});tickLondonBattle(g,1.4);assert.equal(d.hp,102);tickLondonBattle(g,1);assert.equal(d.hp,102);
 for(const district of g.londonBattle.districts)district.hp=0;tickLondonBattle(g,.05);assert.equal(g.state,'lost');
});
test('London encounter pause, independent defeat and stage cleanup remain intact',()=>{
 const f=fixture({stageIndex:11});f.frame.londonTargets=[{id:'city',x:400,y:390,hp:120}];const e=f.addon.startBoss({x:400,y:180});step(f,4);const poses=[...e.bodies.values()].map(b=>[b.x,b.y,b.a,b.entryAge]);f.frame.paused=true;step(f,5);assert.deepEqual([...e.bodies.values()].map(b=>[b.x,b.y,b.a,b.entryAge]),poses);
 f.frame.paused=false;const bodies=[...e.bodies.values()];f.addon.hit({bodyId:bodies[0].id,damage:10000});assert.ok(!e.completed);for(const b of bodies.slice(1))f.addon.hit({bodyId:b.id,damage:10000});step(f,4,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.addon.stages.encounter,null);assert.equal(f.addon.hazards.pool.count,0);
});

for(const width of [390,1280])for(const count of [1,2])test(`Apron ${width}px / ${count} players: arrival, shared net pose and a permanent final escape route`,()=>{
 const f=fixture({stageIndex:11,teamFaction:'central'});f.hooks.getTuning=()=>({...tuning,regionalViewWidth:width,regionalViewHeight:844});f.frame.players=f.frame.players.slice(0,count);
 const e=f.addon.startBoss({x:400,y:250}),b=[...e.bodies.values()][0];assert.equal(b.kind,'london-apron-raid');const startDepth=b.apronPoseOverride.depth;step(f,1);assert.ok(b.apronPoseOverride.depth>startDepth);assert.equal(f.log.damage.length,0);
 step(f,3);const pose=b.apronPoseOverride;assert.deepEqual(apronPoint(384,216,pose,b.apronScale),{x:0,y:-40*b.apronScale});
 for(const id of ['light','gun']){const p=b.parts.get(id);assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y}).partId,id);}
 b.hit({partId:'airship-0',damage:10000});b.hit({partId:'airship-2',damage:10000});step(f,8);
 assert.ok(b.finalBlockade);assert.equal(f.log.cues.filter(e=>e.type==='apron-final-blockade').length,1);assert.equal(b.phase,'final-blockade');
 const hazards=[];f.addon.hazards.pool.visit(h=>{if(h.kind==='net')hazards.push(h);});assert.equal(hazards.length,1);assert.equal(hazards[0].tag,'apron-airship-1');
 assert.deepEqual(hazards[0].vertices,apronPanelHull(1,b.apronPoseOverride,b.apronScale,b.x,b.y));
 const open=apronPanelHull(0,b.apronPoseOverride,b.apronScale,b.x,b.y),x=open.reduce((s,p)=>s+p.x,0)/4;
 for(let y=Math.min(...open.map(p=>p.y))-35;y<Math.max(...open.map(p=>p.y))+35;y+=3)assert.equal(netContact({x,y,radius:12},hazards[0].vertices),null);
 let rendered;renderStageBossLayer(f.addon,{drawBody:value=>rendered=value,drawPart(){},drawHazard(){}});assert.deepEqual(rendered.apronPoseOverride,b.apronPoseOverride);assert.ok(rendered.parts.find(p=>p.id==='airship-0').destroyed);
 const before=JSON.stringify([b.apronTime,b.apronPoseOverride,b.timers]);f.frame.paused=true;step(f,3);assert.equal(JSON.stringify([b.apronTime,b.apronPoseOverride,b.timers]),before);
 f.frame.paused=false;b.hit({partId:'airship-1',damage:10000});step(f,4,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.addon.hazards.pool.count,0);assert.equal(f.addon.stages.encounter,null);
});
test('Apron light and gun destruction remove their own attacks while preserving existing mines',()=>{
 const f=fixture({stageIndex:11,teamFaction:'central'});const e=f.addon.startBoss({x:400,y:250}),b=[...e.bodies.values()][0];step(f,14);
 assert.ok(f.log.cues.some(e=>e.type==='spawn-minefield'));let beam=false;f.addon.hazards.pool.visit(h=>{if(h.tag==='raid-light')beam=true});assert.ok(beam);
 b.hit({partId:'light',damage:10000});b.hit({partId:'gun',damage:10000});f.log.cues.length=0;step(f,20);
 f.addon.hazards.pool.visit(h=>assert.ok(h.tag!=='raid-light'&&h.tag!=='raid-gun'));assert.ok(!f.log.cues.some(e=>e.type==='muzzle'&&e.partId==='gun'));assert.ok(f.log.cues.some(e=>e.type==='spawn-minefield'));
 assert.ok(!b.finalBlockade,'weapon damage cannot count as a destroyed airship');assert.equal(b.live().length,3);
});
test('Apron illumination increases aimed flak and alternates warning times without extra mines',()=>{
 function volley(lit){const events=[],b=new LondonRaidApron({id:'apron',x:400,y:250,tuning,emit:e=>events.push(e),rng:()=>.5});const ctx={players:[{id:'p',alive:true,x:400,y:550,vx:80,vy:0}],bounds:{left:0,right:800,top:0,bottom:800},isIlluminated:()=>lit};for(let i=0;i<140;i++){b.motionTime=i*.05;b.update(.05,ctx);}return events;}
 const dark=volley(false),lit=volley(true),flak=events=>events.filter(e=>e.type==='hazard'&&e.tag==='raid-gun');assert.equal(flak(dark).length,3);assert.equal(flak(lit).length,3);assert.deepEqual(flak(lit).map(e=>e.warning),[1.05,1.53,2.01]);assert.deepEqual(flak(dark).map(e=>e.warning),[1.4,1.88,2.36]);assert.deepEqual(dark.filter(e=>e.type==='spawn-minefield'),lit.filter(e=>e.type==='spawn-minefield'));
});
