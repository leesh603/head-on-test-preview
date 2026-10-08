import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_CATALOG,createBossEncounter} from '../headon-stageboss-patterns.js';
import {BASIC_BARRAGES,updateBasicBarrage} from '../boss-basic-barrage.js';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {fixture} from './stageboss-fixture94.mjs';
const tuning={maxHp:2400,partHp:240,damage:18,bulletSpeed:270,geometryScale:1,regionalViewHeight:844};
for(const width of [390,1280])for(const id of Object.keys(BOSS_CATALOG))test(`${id}: ordinary projectiles exist independently of raid ordnance at ${width}px`,()=>{
 const shots=[],cues=[],e=createBossEncounter({id,bossId:id,tuning:{...tuning,regionalViewWidth:width},x:0,y:-140,rng:()=>.5,emit:h=>{if(h.type==='hazard'&&h.tag?.endsWith(':basic-fire'))shots.push(h);if(h.basicFire)cues.push(h);}});
 const ctx={players:[{id:'pilot',alive:true,x:0,y:140,radius:12}],bounds:{left:-width/2,right:width/2,top:-422,bottom:422}};
 for(let t=0;t<45;t+=.05)e.update(.05,ctx);
 assert(shots.length>=5,`${id} never fired its ordinary weapon`);assert(cues.length>0);
 for(const h of shots){assert.equal(h.kind,'projectile');assert(!h.raidHeavy);assert(h.damage>0&&h.damage<tuning.damage);assert(h.delay>=.6);assert(h.duration<=4.2);assert(Number.isFinite(h.vx)&&Number.isFinite(h.vy));if(h.sourcePartId)assert([...e.bodies.values()].some(b=>b.id===h.bossId&&b.parts.has(h.sourcePartId)));}
});
test('A7V ordinary fire alone pressures the pilot, survives mechanism timers being idle, and stops with its four guns',()=>{
 const f=fixture({stageIndex:2,teamFaction:'entente'});f.hooks.getTuning=()=>tuning;f.frame.players=[{id:'pilot',alive:true,x:0,y:220,radius:12}];f.frame.bounds={left:-195,right:195,top:-422,bottom:422};
 const b=f.addon.startBoss({x:0,y:0}).bodies.values().next().value;b.entryAge=3;b.phase='fortress';b.update=(dt,ctx)=>b.aim(dt,ctx.players);
 for(let t=0;t<7;t+=.02)f.addon.tick(.02,f.frame);
 assert(f.log.damage.length>0);assert(f.log.cues.some(e=>e.type==='muzzle'&&b.parts.has(e.partId)));
 for(const id of b.gunIds)b.hit({partId:id,damage:1e6});const n=f.log.damage.length;
 assert.equal(f.addon.hazards.pool.count,0);for(let t=0;t<5;t+=.02)f.addon.tick(.02,f.frame);assert.equal(f.log.damage.length,n);
});
test('ordinary fire respects pause, native recovery and warned heavy finishers',()=>{
 const events=[],h=new BossHazards({onDamage(){},onStatus(){},onBarrierContact(){}});
 const e=createBossEncounter({id:'e',bossId:'a7v-flak',tuning,x:0,y:0,emit:v=>{events.push(v);if(v.type==='hazard')h.spawn({...v,encounterId:'e'});if(v.type==='cancel-hazards')h.clearTagged('e',v.tag);}}),b=e.bodies.values().next().value;
 const ctx={players:[{id:'p',alive:true,x:0,y:240}]};b.entryAge=3;b.phase='fortress';b.basicClock=0;updateBasicBarrage(b,.02,ctx);assert(h.pool.count>0);
 const n=events.length;updateBasicBarrage(b,.02,{...ctx,paused:true});assert.equal(events.length,n);
 b.rotation={stage:'recover'};updateBasicBarrage(b,.02,ctx);assert.equal(h.pool.count,0);
 b.rotation=null;b.combatTime=2;b.basicClock=0;updateBasicBarrage(b,.02,ctx);assert(h.pool.count>0);
 b.emit({type:'hazard',bossId:b.id,kind:'circle',x:0,y:240,radius:70,damage:18,warning:1.2,duration:.23,raidHeavy:true});let ordinary=0;h.pool.visit(v=>{if(v.tag?.endsWith(':basic-fire'))ordinary++;});assert.equal(ordinary,0);
 b.basicClock=0;const count=events.filter(v=>v.type==='hazard').length;updateBasicBarrage(b,.5,ctx);assert.equal(events.filter(v=>v.type==='hazard').length,count);
});
test('source destruction during a basic warning cancels the volley before any damage',()=>{
 const f=fixture({stageIndex:2,teamFaction:'entente'});f.hooks.getTuning=()=>tuning;f.frame.players=[{id:'p',alive:true,x:0,y:220,radius:12}];const b=f.addon.startBoss({x:0,y:0}).bodies.values().next().value;
 b.entryAge=3;b.phase='fortress';b.update=()=>{};b.basicClock=0;f.addon.tick(.02,f.frame);let part;f.addon.hazards.pool.visit(h=>{part=h.sourcePartId;});assert(part);b.hit({partId:part,damage:1e6});assert.equal(f.addon.hazards.pool.count,0);assert.equal(f.log.damage.length,0);
});
test('co-op and high projectile-density tuning do not multiply ordinary volley size',()=>{
 const totals=[];for(const players of [[{id:'a',alive:true,x:0,y:250}],[{id:'a',alive:true,x:0,y:250},{id:'b',alive:true,x:30,y:250}]]){
 const shots=[],e=createBossEncounter({id:'e',bossId:'a7v-flak',tuning:{...tuning,projectileDensity:20},x:0,y:0,emit:h=>{if(h.type==='hazard')shots.push(h);}}),b=e.bodies.values().next().value;
 b.entryAge=3;b.phase='fortress';for(let t=0;t<12;t+=.02){b.combatTime=t;updateBasicBarrage(b,.02,{players});}totals.push(shots.length);assert(shots.length>30&&shots.length<80);
 }assert.equal(totals[0],totals[1]);
});
test('ordinary volley hits a stationary pilot but a finite-speed lateral dodge clears the committed rounds',()=>{
 const trial=move=>{const f=fixture({stageIndex:2,teamFaction:'entente'});f.hooks.getTuning=()=>tuning;const p={id:'p',alive:true,x:0,y:220,radius:12};f.frame.players=[p];
 const b=f.addon.startBoss({x:0,y:0}).bodies.values().next().value;b.entryAge=3;b.phase='fortress';b.update=()=>{};b.basicClock=0;f.addon.tick(.02,f.frame);b.basicClock=Infinity;
 for(let t=0;t<2.6;t+=.01){if(move&&t>.15)p.x+=140*.01;f.addon.tick(.01,f.frame);}return f.log.damage.length;};
 assert(trial(false)>0);assert.equal(trial(true),0);
});
