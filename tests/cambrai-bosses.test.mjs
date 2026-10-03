import test from 'node:test';import assert from 'node:assert/strict';
import {Fliegerzug,TreffasWagen} from '../headon-stageboss-patterns.js?v=514';
import {treffasPoint,treffasGunMuzzle} from '../cambrai-layout.js?v=514';
import {advanceCambraiBug} from '../cambrai-bug-flight.js?v=514';
import {Game} from '../engine.js?v=514';import {CoopGame} from '../coop-engine.js?v=514';
import {enableStageBoss,beginStageBossFrame,endStageBossFrame} from '../stageboss-host.js?v=514';
import {fixture,step} from './stageboss-fixture94.mjs';
const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025};
const frame={players:[{id:'p1',alive:true,x:-100,y:220,vx:20,vy:0},{id:'p2',alive:true,x:120,y:240,vx:0,vy:0}],bounds:{left:-480,right:480,top:-400,bottom:400}};
function boss(Type){const events=[],b=new Type({id:'b',x:0,y:0,faction:'entente',tuning,emit:e=>events.push(e),rng:()=>.4});return{b,events};}
function run(b,seconds,ctx=frame){for(let i=0;i<Math.ceil(seconds/.02);i++)b.update(.02,ctx);}
test('Fliegerzug uses the supplied HP once and retains a finishable locomotive after all five wagons',()=>{
 const {b}=boss(Fliegerzug);assert.equal(b.hp,tuning.maxHp);
 for(const id of b.railCarOrder){const p=b.parts.get(id),hp=b.hp;b.hit({partId:id,damage:99999});assert.ok(Math.abs(b.hp-(hp-p.maxHp))<1e-8);assert.equal(b.hit({partId:id,damage:99}).damage,0);}
 assert.equal(b.dead,false);assert.ok(Math.abs(b.hp-b.maxHp*.3)<1e-8);assert.equal(b.coreVulnerable,true);
 b.hit({damage:99999});assert.equal(b.phase,'runaway');run(b,4);assert.equal(b.phase,'derailed');assert.equal(b.hit({damage:99999}).bodyDefeated,true);assert.equal(b.locateHit({x:b.x,y:b.y}),null);
});
test('armoured hull cannot erase the locomotive reserve or bypass the carriage objective',()=>{const {b}=boss(Fliegerzug);b.hit({damage:999999});assert.equal(b.hp,b.maxHp*.3);assert.equal(b.coreVulnerable,false);assert.equal(b.hit({damage:100}).damage,0);assert.throws(()=>b.hit({damage:NaN}));});
test('each launch order freezes its target and alternates between co-op pilots',()=>{
 const {b,events}=boss(Fliegerzug);b.countMinions129=()=>0;const a=b.parts.get('car-launch-a'),c=b.parts.get('car-launch-b');
 assert.ok(b.prepareBug(a,frame.players));assert.ok(b.prepareBug(c,frame.players));const targets=b.launchPrep.map(q=>({...q.target}));assert.deepEqual(targets.map(t=>t.id),['p1','p2']);
 run(b,1.2,{...frame,players:frame.players.map(p=>({...p,x:900,y:900}))});const bugs=events.filter(e=>e.minion==='bug');assert.equal(bugs.length,2);assert.deepEqual(bugs.map(e=>[e.passTargetX,e.passTargetY]),targets.map(t=>[t.x,t.y]));assert.ok(bugs.every(e=>e.launchPortId&&Number.isFinite(e.a)));
});
test('destroying one launch car cancels its order while the other launch car still launches',()=>{
 const {b,events}=boss(Fliegerzug);b.countMinions129=()=>0;for(const id of ['car-launch-a','car-launch-b'])b.prepareBug(b.parts.get(id),frame.players);
 b.hit({partId:'car-launch-a',damage:99999});run(b,1.2);assert.deepEqual(events.filter(e=>e.minion==='bug').map(e=>e.launchPortId),['car-launch-b']);
 b.hit({partId:'car-launch-b',damage:99999});events.length=0;run(b,20);assert.equal(events.some(e=>e.minion==='bug'),false);assert.equal(b.launchPrep.length,0);
});
test('supply car loss slows train reload and surviving weapon cars alone keep firing',()=>{
 const {b,events}=boss(Fliegerzug);b.countMinions129=()=>5;b.hit({partId:'car-supply',damage:99999});b.hit({partId:'car-flak',damage:99999});b.hit({partId:'car-rear',damage:99999});events.length=0;run(b,20);assert.equal(b.rail129.c.reloadSeconds,b.baseReload*1.7);assert.equal(events.some(e=>e.type==='hazard'),false);assert.equal(events.some(e=>e.minion==='bug'),false);
});
test('detached trailing wagons retain independent world poses and cannot be backed through',()=>{
 const {b}=boss(Fliegerzug);run(b,.7);b.hit({partId:'car-launch-a',damage:99999});const p=b.parts.get('car-supply'),start={...p.detachedPose},engineY=b.y;run(b,25);assert.ok(b.y<engineY-40);
 assert.ok(p.detachedPose.age>24);assert.ok(Math.abs(p.detachedPose.y-start.y)<100);assert.ok(Math.abs(p.x)>1);assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y}).partId,p.id);
 for(const q of [b.parts.get('car-flak')])assert.ok(Math.abs(b.y+q.y-p.detachedPose.y)>218);
});
test('fixed-course Bug reaches its committed point even at low frame rate and never retargets',()=>{
 const e={hp:10,x:0,y:0,a:-Math.PI/2,speed:186,bugTargetX:250,bugTargetY:160};assert.equal(advanceCambraiBug(e,.02),false);const angle=e.a;
 for(let i=0;i<20&&!advanceCambraiBug(e,.4);i++)assert.equal(e.a,angle);
 assert.equal(e.x,250);assert.equal(e.y,160);assert.ok(e.launchAge>.6);assert.equal(e.a,angle);
});
test('malformed or zero-range Bug orders remain finite and do not orbit',()=>{for(const target of [{},{bugTargetX:0,bugTargetY:0}]){const e={hp:10,x:0,y:0,speed:186,...target};for(let i=0;i<200;i++)if(advanceCambraiBug(e,.02))break;assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.a));assert.ok(Math.abs(e.bugRange-e.bugTravel)<1e-6);}});
test('Treffas part damage drains the shared gauge once; two losses expose the surviving hull',()=>{const {b}=boss(TreffasWagen);for(const id of ['rudder','turret']){const hp=b.hp,p=b.parts.get(id);b.hit({partId:id,damage:99999});assert.equal(b.hp,hp-p.maxHp);assert.equal(b.hit({partId:id,damage:99999}).damage,0);}assert.equal(b.coreVulnerable,true);assert.equal(b.hitAt({x:b.x,y:b.y,damage:99999}).bodyDefeated,true);});
test('damaging a remaining part never heals a core already below its reserved HP',()=>{for(const Type of [Fliegerzug,TreffasWagen]){const {b}=boss(Type);b.hp=100;const id=Type===Fliegerzug?'car-flak':'wheel-left';b.hit({partId:id,damage:20});assert.ok(b.hp<=100);}});
test('Treffas drives only along its heading and brakes before reversing',()=>{const {b}=boss(TreffasWagen);let reversed=false;for(let i=0;i<2400;i++){const x=b.x,y=b.y,v=b.driveVelocity;b.update(.02,frame);assert.ok(Math.abs(b.x-x)<1e-9);assert.ok(Math.abs(b.driveVelocity-v)<=28*.02+1e-8);if(v>0&&b.driveVelocity<0)reversed=true;assert.ok(b.y>=b.startY-66&&b.y<=b.startY+141);assert.ok(Number.isFinite(b.y-y));}assert.ok(reversed);assert.ok(b._churn.length<=48);});
test('single wheel and steering damage cause smooth drift; two wheels stop all motion and debris',()=>{const {b,events}=boss(TreffasWagen);run(b,1);b.hit({partId:'wheel-left',damage:99999});b.hit({partId:'rudder',damage:99999});for(let i=0;i<50;i++){const a=b.heading;b.update(.02,frame);assert.ok(Math.abs(b.heading-a)<=.11*.02+1e-9);}assert.ok(b.heading<0);b.hit({partId:'wheel-right',damage:99999});const pose=[b.x,b.y,b.heading,b.wheelRoll];events.length=0;run(b,5);assert.equal(b.phase,'emplacement');assert.deepEqual([b.x,b.y,b.heading,b.wheelRoll],pose);assert.equal(events.some(e=>e.visual==='treffas-debris'),false);});
test('Treffas gun traverses, locks and fires from the measured visible barrel tip',()=>{const {b,events}=boss(TreffasWagen);b.planFlak(frame.players[0]);const points=b.flakLock.points.map(p=>({...p}));let angle=b.gunAngle;for(let i=0;i<400&&!events.some(e=>e.visual==='black-flak');i++){b.update(.02,{...frame,players:frame.players.map(p=>({...p,x:450,y:-200}))});assert.ok(Math.abs(b.gunAngle-angle)<=1.3*.02+1e-9);angle=b.gunAngle;}const shells=events.filter(e=>e.visual==='black-flak');assert.equal(shells.length,3);assert.deepEqual(shells.map(e=>({x:e.x,y:e.y})),points);const flash=events.find(e=>e.type==='muzzle'&&e.partId==='turret');assert.ok(flash);assert.ok(shells.every(s=>s.sourceX===flash.x&&s.sourceY===flash.y));const tip=treffasGunMuzzle({...b,parts:new Map([['turret',{recoil:0}]])});assert.ok(Math.hypot(tip.x-flash.x,tip.y-flash.y)<1e-8);});
test('turret destruction cancels its unlaunched salvo and leaves only the visible hull guns',()=>{const {b,events}=boss(TreffasWagen);b.planFlak(frame.players[0]);b.hit({partId:'turret',damage:99999});assert.equal(b.flakLock,null);events.length=0;run(b,8);assert.equal(events.some(e=>e.visual==='black-flak'),false);assert.ok(events.some(e=>e.visual==='treffas-mg'));});
test('fixed emplacement alternates a bracket with an aimed line; telegraphs leave usable gaps',()=>{const {b}=boss(TreffasWagen);for(const id of ['wheel-left','wheel-right'])b.hit({partId:id,damage:99999});b.planFlak(frame.players[0]);assert.equal(b.flakLock.mode,'bracket');assert.equal(b.flakLock.points.length,4);b.flakLock=null;b.planFlak(frame.players[0]);assert.equal(b.flakLock.mode,'line');assert.equal(b.flakLock.points.length,3);assert.ok(Math.hypot(b.flakLock.points[0].x-b.flakLock.points[1].x,b.flakLock.points[0].y-b.flakLock.points[1].y)>2*(32+12));});
test('rotated Treffas wheel ends and turret stay hittable; transparent axle gaps do not absorb shots',()=>{const {b}=boss(TreffasWagen);b.heading=.12;run(b,.02);for(const id of ['wheel-left','wheel-right','turret','rudder']){const p=b.parts.get(id),q=treffasPoint(b,p.mountX,p.mountY);assert.equal(b.locateHit(q).partId,id);}const end=treffasPoint(b,-112,100);assert.equal(b.locateHit(end).partId,'wheel-left');assert.equal(b.locateHit(treffasPoint(b,-75,40)),null);});
function host(coop,faction='central'){
 const g=coop?new CoopGame(faction==='central'?[{pilot:'baron'},{pilot:'voss'}]:[{pilot:'fonck'},{pilot:'fonck'}],{rng:()=>.4}):new Game(faction==='central'?'albatros':'spad',faction==='central'?'baron':'fonck',()=>.4);
 g.viewWidth=390;g.viewHeight=844;g.region=8;enableStageBoss(g,{teamFaction:faction,heavyHp:coop?1.65:1});g.stageBoss.stages.stageIndex=8;
 for(const p of g.players||[g]){p.x=120;p.y=160;p.invuln=9999;}return g;
}
for(const coop of [false,true])test(`real ${coop?'co-op':'solo'} host launches the committed Bug, expires launch smoke, pauses and clears ownership`,()=>{
 const g=host(coop),enc=g.stageBoss.startBoss({x:0,y:-450}),b=[...enc.bodies.values()][0],car=b.parts.get('car-launch-a');
 b.prepareBug(car,[{id:'p1',alive:true,x:200,y:360}]);for(let i=0;i<65;i++){g.t+=.02;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}
 const bug=g.enemies.find(e=>e.bugDrone);assert.ok(bug);assert.equal(bug.launchPortId,car.id);const target=[bug.bugTargetX,bug.bugTargetY];
 g.state='paused';const pose=[bug.x,bug.y,bug.launchAge];beginStageBossFrame(g,.5);assert.deepEqual([bug.x,bug.y,bug.launchAge],pose);g.state='playing';
 for(let i=0;i<40;i++){g.t+=.02;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}assert.ok(bug.launchAge>bug.launchSeconds);assert.deepEqual([bug.bugTargetX,bug.bugTargetY],target);
 bug.hp=0;beginStageBossFrame(g,.02);assert.equal(g.bossCues.some(c=>c.minionId===bug.id),false);g.stageBoss.dispose();assert.equal(g.enemies.some(e=>e.encounterId===enc.id),false);assert.equal(g.stageBoss.hazards.pool.count,0);
});
for(const faction of ['central','entente'])test(`${faction} Cambrai fast-loop battle stays bounded for 120 seconds and pause freezes pending orders`,()=>{const f=fixture({stageIndex:8,teamFaction:faction});f.hooks.getTuning=()=>({...tuning,patternMultiplier:3,regionalViewWidth:390,regionalViewHeight:844});f.addon.startBoss({x:400,y:300});step(f,2);const b=[...f.addon.stages.encounter.bodies.values()][0],before=JSON.stringify([b.x,b.y,b.launchPrep,b.flakLock,f.addon.time]);f.frame.paused=true;step(f,1);assert.equal(JSON.stringify([b.x,b.y,b.launchPrep,b.flakLock,f.addon.time]),before);f.frame.paused=false;step(f,120);assert.equal(f.addon.hazards.pool.dropped,0);assert.ok(f.addon.hazards.pool.count<100);f.addon.dispose();assert.equal(f.addon.hazards.pool.count,0);});
