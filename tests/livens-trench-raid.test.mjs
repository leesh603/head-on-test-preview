import test from 'node:test';
import assert from 'node:assert/strict';
import {LivensFlameProjector} from '../headon-stageboss-patterns.js?v=adr1';
import {BossHazards,contains} from '../headon-stageboss-hazards.js?v=adr1';
import {bossHudModel} from '../headon-stageboss-hud.js?v=adr1';
import {fixture,step} from './stageboss-fixture94.mjs';
const tuning={maxHp:1000,partHp:100,damage:12,bulletSpeed:160,flameInterval:4.4};
const frame={players:[{id:'p1',alive:true,x:0,y:170,vx:0,vy:0,radius:12}],bounds:{left:-195,right:195,top:-422,bottom:422}};
function make(){const events=[],b=new LivensFlameProjector({id:'livens',x:0,y:0,tuning,rng:()=>.5,emit:e=>events.push(e)});return{b,events};}
function run(b,time,ctx=frame){for(let t=0;t<time-1e-8;t+=.02)b.update(Math.min(.02,time-t),ctx);}
function counter(b){for(let t=0;t<12&&b.recovery<=0;t+=.02)b.update(.02,frame);assert(b.recovery>0);assert(b.coreVulnerable);}
for(const [w,h]of [[390,844],[487.5,1055],[1280,800]])for(const coop of [false,true])test(`Livens ${w}x${h} ${coop?'coop':'solo'} encounter waits for visible buried nozzle, never moves facility`,()=>{
 const {b,events}=make(),ctx={players:[...frame.players.map(p=>({...p})),...(coop?[{...frame.players[0],id:'p2',x:70}]:[])],bounds:{left:-w/2,right:w/2,top:-h/2,bottom:h/2}},far={...ctx,players:ctx.players.map(p=>({...p,y:1400})),bounds:{left:-w/2,right:w/2,top:1000,bottom:1000+h}};
 run(b,5,far);assert.equal(b.discovered,false);assert.equal(b.nozzleRevealed,false);assert.equal(events.length,0);const original=structuredClone(ctx);run(b,.85,ctx);assert.equal(b.nozzleRevealed,false);assert(events.some(e=>e.type==='livens-pressure-rise'));
 run(b,.1,ctx);assert(b.nozzleRevealed&&b.discovered);assert(events.some(e=>e.type==='livens-soil-burst'));assert(!events.some(e=>e.type==='hazard'));run(b,.6,ctx);const flame=events.find(e=>e.visual==='livens-flame');assert(flame);assert(flame.warning>=1.15);assert.equal(flame.x,b.x+b.nozzleMount.x);assert.equal(flame.y,b.y+b.nozzleMount.y);assert.equal(b.x,0);assert.equal(b.y,0);assert.deepEqual(ctx,original);
});
test('entry cannot finish its reveal while the nozzle leaves actual camera bounds',()=>{const {b}=make();run(b,.5);const age=b.trenchEntry.age;run(b,2,{...frame,bounds:{left:1000,right:1400,top:1000,bottom:1800}});assert.equal(b.nozzleRevealed,false);assert.equal(b.trenchEntry.age,age);run(b,1);assert(b.discovered);});
test('normal counter window allows 70% and 35% phases with live fuel tanks and no HP inflation',()=>{
 const {b,events}=make();counter(b);b.hit({damage:300});b.update(.02,frame);assert.equal(b.raidPhase,2);assert.equal(b.hp,700);assert([...b.parts.values()].every(p=>!p.destroyed));
 b.hit({damage:350});b.update(.02,frame);assert.equal(b.raidPhase,3);assert.equal(b.hp,350);assert.equal(b.maxHp,tuning.maxHp);assert(events.some(e=>e.phase==='livens-sweep'));assert(events.some(e=>e.phase==='livens-unstable'));
});
test('track locks before discharge; phase II sweeps and phase III pulses then rotates',()=>{
 const {b,events}=make();run(b,1.6);const angle=b.lockedFlameAngle;run(b,1,{...frame,players:[{...frame.players[0],x:800,y:800}]});assert.equal(b.lockedFlameAngle,angle);
 counter(b);b.hit({damage:300});run(b,8);assert(events.some(e=>e.visual==='livens-flame'&&e.angularSpeed!==0));counter(b);b.hit({damage:350});const count=events.filter(e=>e.visual==='livens-flame').length;run(b,11);const next=events.filter(e=>e.visual==='livens-flame').slice(count);assert(next.some(e=>e.duration===.95));assert(next.some(e=>Math.abs(e.angularSpeed)===.95));
});
test('damaged and destroyed tanks keep warned leak locations tied to their authored parts',()=>{
 const {b,events}=make();counter(b);b.hit({damage:300});b.hit({partId:'tank-l1',damage:60});run(b,6);const p=b.parts.get('tank-l1');assert(events.some(e=>e.visual==='livens-leak'&&e.radius===40&&e.x===b.x+p.x&&e.y===b.y+p.y));b.hit({partId:p.id,damage:1000});assert(events.some(e=>e.visual==='livens-leak'&&e.radius===54&&e.warning===.65));
});
test('firestorm uses three separate jets with collision-free gaps and a three-second counter window',()=>{
 const {b,events}=make();counter(b);b.hit({damage:780});run(b,2.5);assert(b.stormTriggered);const first=events.find(e=>e.type==='livens-firestorm');assert(first);let gaps=0,recovery=0,maxJets=0;
 for(let t=0;t<17;t+=.02){b.update(.02,frame);if(b.stormActive&&b.lockedFlameAngle==null){assert(b.flameGap>0);gaps++;}if(!b.stormActive&&b.recovery>2.8)recovery++;maxJets=Math.max(maxJets,b.lockedFlameAngle==null?0:1);}
 assert(gaps>=50);assert(recovery>0);assert.equal(maxJets,1);assert.equal(events.filter(e=>e.type==='livens-firestorm').length,1);assert(events.some(e=>e.phase==='livens-depressurized'));
 const jets=events.filter(e=>e.visual==='livens-flame'&&e.length===685);assert.equal(jets.length,3);assert(jets[0].angularSpeed>0&&jets[1].angularSpeed<0&&jets[2].angularSpeed>0);
});
test('pressure rupture interrupts current jet and weakens the remaining final jets',()=>{
 const {b,events}=make();counter(b);b.hit({damage:780});run(b,2.5);assert(b.stormActive);b.hit({partId:'pressure',damage:1000});assert.equal(b.lockedFlameAngle,null);assert(events.some(e=>e.type==='cancel-hazards'&&e.tag==='livens-flame'));assert(events.some(e=>e.visual==='livens-pressure'));const at=events.length;run(b,12);const jets=events.slice(at).filter(e=>e.visual==='livens-flame');assert(jets.length>=2);assert(jets.every(e=>e.length===475&&e.thickness===38&&e.damage===tuning.damage*.65));
});
test('real hazard clock and the visible nozzle stay synchronized through warnings and rotation',()=>{
 const f=fixture({teamFaction:'central',stageIndex:3}),e=f.addon.startBoss({x:400,y:180}),b=[...e.bodies.values()][0];f.frame.players=[{...frame.players[0],x:400,y:350}];step(f,5);assert(b.coreVulnerable);b.hit({damage:300});
 for(let t=0;t<10;t+=.05){f.addon.tick(.05,f.frame);f.addon.hazards.pool.visit(h=>{if(h.visual==='livens-flame'){assert(Math.abs(h.angle-b.nozzleAngle)<1e-8);assert.equal(h.x,b.x+b.nozzleMount.x);assert.equal(h.y,b.y+b.nozzleMount.y);}});}assert.equal(f.addon.hazards.pool.dropped,0);
});
test('HUD and cutin discovery cue wait for visible exposure; pause freezes all timers',()=>{
 const f=fixture({teamFaction:'central',stageIndex:3}),e=f.addon.startBoss({x:400,y:180}),b=[...e.bodies.values()][0];assert.equal(bossHudModel(e),null);assert(!f.log.cues.some(e=>e.type==='boss-enter'));step(f,1.1);assert(bossHudModel(e));assert.equal(f.log.cues.filter(e=>e.type==='trench-discovered').length,1);const state=JSON.stringify([b.trenchEntry,b.flameAge,b.flameQueue,b.recovery]);b.update(.25,{...f.frame,paused:true});assert.equal(JSON.stringify([b.trenchEntry,b.flameAge,b.flameQueue,b.recovery]),state);
});
for(const phase of [1,2,3,'storm'])test(`actual flame collision has a finite-speed maneuver route for ${phase}`,()=>{
 const {b,events}=make();counter(b);if(phase!==1)b.hit({damage:phase===2?300:phase===3?650:780});
 const hits=[],h=new BossHazards({onDamage:(id,damage)=>hits.push({id,damage}),onStatus(){},onBarrierContact(){}});let index=events.length,angle=Math.PI/2,dir=1;
 for(let t=0;t<17;t+=.02){
  if(b.lockedFlameAngle!=null)dir=b.flameAngSpeed<0?-1:1;angle+=dir*1.125*.02;const p={id:'p1',alive:true,x:Math.cos(angle)*160,y:b.nozzleMount.y+Math.sin(angle)*160,radius:12};b.update(.02,{...frame,players:[p]});
  while(index<events.length){const e=events[index++];if(e.type==='hazard')h.spawn({...e,encounterId:'qa'});if(e.type==='cancel-hazards')h.clearTagged('qa',e.tag);}h.update(.02,{players:[p]});
 }assert.deepEqual(hits,[]);assert.equal(h.pool.dropped,0);
});
test('flame travelling front and empty nozzle interior match actual contains() geometry',()=>{
 const h={kind:'beam',visual:'livens-flame',x:0,y:0,angle:0,length:645,muzzleLength:85,thickness:54,warning:1.15,delay:0,duration:1.8,age:1.18};assert(!contains(h,{x:300,y:0,radius:12}));assert(!contains(h,{x:30,y:0,radius:12}));h.age=1.7;assert(contains(h,{x:300,y:0,radius:12}));assert(!contains(h,{x:300,y:130,radius:12}));
});
test('death/transition and restart clear all old warning hazards and queued final attacks',()=>{
 const f=fixture({teamFaction:'central',stageIndex:3}),e=f.addon.startBoss({x:400,y:180}),b=[...e.bodies.values()][0];step(f,5);b.hit({damage:1000});step(f,6,{advance:true});assert.equal(f.addon.hazards.pool.count,0);assert.equal(f.log.clears.length,1);f.addon.dispose();const fresh=fixture({teamFaction:'central',stageIndex:3});const next=fresh.addon.startBoss({x:400,y:180});assert.equal([...next.bodies.values()][0].stormTriggered,false);assert.equal(bossHudModel(next),null);
});
