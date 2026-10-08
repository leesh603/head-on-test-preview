import test from 'node:test';
import assert from 'node:assert/strict';
import {MinenwerferBattery} from '../headon-stageboss-patterns.js?v=tame3&rail=13rail=14';
import {BossHazards,contains} from '../headon-stageboss-hazards.js?v=tame3';
import {bossHudModel} from '../headon-stageboss-hud.js?v=tame3&rail=13rail=14';
import {fixture,step} from './stageboss-fixture94.mjs';
const tuning={maxHp:1000,partHp:100,damage:12,bulletSpeed:160,mortarInterval:1.9};
const pilot={id:'p1',alive:true,x:0,y:150,vx:0,vy:-180,radius:12};
const frame={players:[pilot],bounds:{left:-640,right:640,top:-400,bottom:400}};
function make(){const events=[],b=new MinenwerferBattery({id:'minen',x:0,y:0,tuning,rng:()=>.5,emit:e=>events.push(e)});return{b,events};}
function run(b,time,ctx=frame){for(let t=0;t<time-1e-8;t+=.02)b.update(Math.min(.02,time-t),ctx);}
for(const [w,h]of [[390,844],[487.5,1055],[1280,800]])for(const coop of [false,true])test(`Minen ${w}x${h} ${coop?'coop':'solo'}: offscreen approach fires from fixed pits; identity waits for actual visibility`,()=>{
 const {b,events}=make(),ctx={players:[{...pilot,y:1000},...(coop?[{...pilot,id:'p2',x:40,y:1000}]:[])],bounds:{left:-w/2,right:w/2,top:1000-h/2,bottom:1000+h/2}},original=structuredClone(ctx);
 run(b,3,ctx);assert(!b.discovered);assert([...b.parts.values()].every(p=>!p.discovered));assert(events.some(e=>e.type==='mortar-launch'));assert(!events.some(e=>e.type==='trench-discovered'));assert.deepEqual(ctx,original);assert.deepEqual([b.x,b.y],[0,0]);
 for(const p of b.parts.values()){const camera={players:[{...pilot,x:p.x,y:p.y+120}],bounds:{left:p.x-w/2,right:p.x+w/2,top:p.y-h/2,bottom:p.y+h/2}};run(b,.7,camera);assert(p.discovered);}
 assert.equal(events.filter(e=>e.type==='trench-discovered').length,1);assert.equal(events.filter(e=>e.type==='minenwerfer-emplacement-found').length,3);
});
test('three guns reveal sequentially even when all are visible; no position/HP budget changes',()=>{
 const {b,events}=make();run(b,.02);assert.equal([...b.parts.values()].filter(p=>p.discovered).length,1);run(b,.3);assert.equal([...b.parts.values()].filter(p=>p.discovered).length,1);run(b,1);assert.equal([...b.parts.values()].filter(p=>p.discovered).length,3);assert.equal(b.maxHp,1200);assert.equal(b.hp,1200);assert.deepEqual(events.filter(e=>e.type==='mortar-launch').slice(0,2).map(e=>e.partId),['gun-left','main-gun']);
});
test('all mortar shells, flashes and sounds originate at each surviving physical tube mouth',()=>{
 const {b,events}=make();run(b,7);const launches=events.filter(e=>e.type==='mortar-launch'),shells=events.filter(e=>e.type==='hazard');assert(launches.some(e=>e.partId==='gun-right'));
 for(const e of shells){const gun=b.parts.get(e.tag.slice('minenwerfer-'.length)),m=b.muzzle(gun);assert.equal(e.sourceX,m.x);assert.equal(e.sourceY,m.y);assert.equal(e.visual,gun.id==='main-gun'?'minenwerfer-heavy':'minenwerfer-shell');assert.equal(e.warning,1.2);assert(launches.some(e=>e.partId===gun.id&&e.x===m.x&&e.y===m.y));}
});
test('HP 70% through ordinary local hits starts alternating encirclement and cross patterns',()=>{
 const {b,events}=make();run(b,1);b.hit({partId:'gun-left',damage:370});assert.equal(b.hp,830);run(b,20);assert.equal(b.raidPhase,2);assert.equal(b.liveGuns().length,3);assert(events.some(e=>e.phase==='minenwerfer-encirclement'));assert(events.some(e=>e.phase==='minenwerfer-crossing'));
});
for(const id of ['gun-left','gun-right'])test(`destroying ${id} removes enclosure, scheduled launches and source hazards`,()=>{
 const {b,events}=make();run(b,1);b.cooperative(frame.players,frame.bounds,b.liveGuns());assert(b.mortarPlan.shots.some(s=>s.partId===id));b.hit({partId:id,damage:999});assert(b.mortarPlan.shots.every(s=>s.partId!==id));assert(events.some(e=>e.type==='cancel-hazards'&&e.tag==='minenwerfer-'+id));const index=events.length;run(b,25);assert(events.slice(index).every(e=>e.type!=='mortar-launch'||e.partId!==id));assert(events.slice(index).every(e=>e.phase!=='minenwerfer-encirclement'));assert(events.slice(index).some(e=>e.phase==='minenwerfer-focused'));assert.equal(b.liveGuns().length,2);
});
test('central gun loss removes heavy shells and leaves independent side HP/destruction',()=>{
 const {b,events}=make();run(b,1);b.hitAt({x:b.x+b.parts.get('main-gun').x,y:b.y+b.parts.get('main-gun').y,damage:400});const index=events.length;run(b,25);assert(b.parts.get('main-gun').destroyed);assert.equal(b.hp,800);assert(events.slice(index).every(e=>e.visual!=='minenwerfer-heavy'));assert.equal(b.hit({damage:100}).blocked,true);assert.equal(b.hitAt({x:0,y:350,damage:100}).miss,true);
});
for(const count of [3,2,1])test(`final order scales for ${count} guns, has real recovery and never launches from a newly destroyed pit`,()=>{
 const {b,events}=make();run(b,1);for(const id of ['gun-left','gun-right'].slice(0,3-count))b.hit({partId:id,damage:999});if(count>1)for(const p of b.liveGuns())b.hit({partId:p.id,damage:310});run(b,3);assert(b.mortarPlan?.final);assert.equal(b.mortarPlan.shots.length,count===3?6:count===2?5:4);assert(events.some(e=>e.type==='minenwerfer-final-order'&&e.count===count));const old=b.mortarPlan;
 if(count>1){const dead=b.liveGuns()[0];b.hit({partId:dead.id,damage:999});assert(old.shots.every(s=>s.partId!==dead.id));const index=events.length;run(b,2);assert(events.slice(index).every(e=>e.type!=='mortar-launch'||e.partId!==dead.id));}
 for(let t=0;t<10&&b.mortarPlan;t+=.02)b.update(.02,frame);assert(b.recovery>2.9);assert.equal(b.mortarPlan,null);assert(b.finalCounts.has(count));
});
test('a surviving last gun gets its own final order after an earlier three-gun final',()=>{
 const {b,events}=make();run(b,1);for(const p of b.parts.values())b.hit({partId:p.id,damage:310});run(b,10);assert(b.finalCounts.has(3));b.hit({partId:'gun-left',damage:999});b.hit({partId:'gun-right',damage:999});run(b,4);assert(b.finalCounts.has(1));assert(events.some(e=>e.type==='minenwerfer-final-order'&&e.count===1));run(b,15);assert(events.some(e=>e.phase==='minenwerfer-last-prediction'));
});
for(const [w,h]of [[390,844],[487.5,1055],[1280,800]])for(const count of [3,2,1])test(`${count}-gun ${w}x${h} final: straight flight meets the last prediction, a warned reversal avoids real collision without invulnerability`,()=>{
 function route(turn){const {b,events}=make();run(b,1);for(const id of ['gun-left','gun-right'].slice(0,3-count))b.hit({partId:id,damage:999});const p={...pilot,x:0,y:0,vx:180,vy:0},hits=[],hazards=new BossHazards({onDamage:(...args)=>hits.push(args),onStatus(){},onBarrierContact(){}});b.finalOrder([p],{left:p.x-w/2,right:p.x+w/2,top:p.y-h/2,bottom:p.y+h/2},b.liveGuns());let index=events.length,angle=0;
  while(b.mortarPlan){const last=b.mortarPlan.shots.at(-1);if(turn&&last.fired)angle=Math.min(Math.PI,angle+2*.02);p.vx=Math.cos(angle)*180;p.vy=Math.sin(angle)*180;p.x+=p.vx*.02;p.y+=p.vy*.02;b.update(.02,{players:[p],bounds:{left:p.x-w/2,right:p.x+w/2,top:p.y-h/2,bottom:p.y+h/2}});while(index<events.length){const e=events[index++];if(e.type==='hazard')hazards.spawn({...e,encounterId:'qa'});if(e.type==='cancel-hazards')hazards.clearTagged('qa',e.tag);}hazards.update(.02,{players:[p]});}
  assert.equal(hazards.pool.dropped,0);return hits;}
 assert(route(false).length>0);assert.deepEqual(route(true),[]);
});
test('circle telegraph geometry matches real impact collision and previews fit narrow mobile bounds',()=>{
 const {b}=make(),bounds={left:-195,right:195,top:-422,bottom:422};b.finalOrder([{...pilot,x:180}],bounds,b.liveGuns());for(const p of b.mortarPlan.shots){assert(p.x-p.radius>=bounds.left);assert(p.x+p.radius<=bounds.right);assert(p.y-p.radius>=bounds.top);assert(p.y+p.radius<=bounds.bottom);assert(!contains({kind:'circle',...p},{x:p.x+p.radius+13,y:p.y,radius:12}));assert(contains({kind:'circle',...p},{x:p.x+p.radius+11,y:p.y,radius:12}));}
});
test('native HUD/cutin waits for discovery and pause freezes pending launch orders',()=>{
 const f=fixture({teamFaction:'entente',stageIndex:3}),e=f.addon.startBoss({x:400,y:-1500}),b=[...e.bodies.values()][0];step(f,3);assert.equal(bossHudModel(e),null);assert(!f.log.cues.some(e=>e.type==='boss-enter'));f.frame.bounds={left:-500,right:1300,top:-1800,bottom:-1000};f.frame.players=[{...pilot,x:400,y:-1400}];step(f,1);assert(bossHudModel(e));b.finalOrder(f.frame.players,f.frame.bounds,b.liveGuns());const state=JSON.stringify([b.x,b.y,b.mortarPlan,b.cycleClock]);f.frame.paused=true;step(f,2);assert.equal(JSON.stringify([b.x,b.y,b.mortarPlan,b.cycleClock]),state);
});
test('all three independent deaths clear the field once, transition and restart reset orders/discovery',()=>{
 const f=fixture({teamFaction:'entente',stageIndex:3}),e=f.addon.startBoss({x:400,y:180}),b=[...e.bodies.values()][0];step(f,2);b.finalOrder(f.frame.players,f.frame.bounds,b.liveGuns());b.hit({partId:'gun-left',damage:999});assert(!e.completed);b.hit({partId:'main-gun',damage:999});assert(!e.completed);b.hit({partId:'gun-right',damage:999});assert(e.completed);step(f,6,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.addon.hazards.pool.count,0);f.addon.dispose();assert.equal(b.mortarPlan,null);const fresh=fixture({teamFaction:'entente',stageIndex:3}),again=fresh.addon.startBoss({x:400,y:180});assert.equal([...again.bodies.values()][0].finalCounts.size,0);assert.equal(bossHudModel(again),null);
});
