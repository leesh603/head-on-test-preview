import test from 'node:test';
import assert from 'node:assert/strict';
import {LIncomparable,ParisGun} from '../headon-stageboss-patterns.js?v=tame3&rail=38';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {railGunMuzzle} from '../rural-rail-artillery.js?v=tame3';
import {lincomparableRound} from '../lincomparable-raid.js?v=tame3';
import {bossSoundFor} from '../boss-feedback.js?v=tame3&rail=38';
const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,warningSeconds:1.4,railCycle:5.8,railMoveSeconds:3.6};
const frame={players:[{id:'p1',alive:true,x:0,y:0,vx:0,vy:-180,radius:12}],bounds:{left:-195,right:195,top:-422,bottom:422}};
function make(){const events=[],b=new LIncomparable({id:'heavy',x:0,y:-460,tuning,emit:e=>events.push(e)});return{b,events};}
function run(b,time,ctx=frame,dt=.02){for(let t=0;t<time-1e-8;t+=dt)b.update(Math.min(dt,time-t),ctx);}
function aim(b,ctx=frame){b.rail129.target=null;b.rail129.enter('aim');b.update(.02,ctx);}
function expose(b){for(const id of b.railCarOrder)b.hit({partId:id,damage:1e6});}
for(const [width,height] of [[1280,800],[390,844],[487.5,1055]])for(const coop of [false,true])test(`520 entry crosses actual ${width}x${height} ${coop?'coop':'solo'} field and waits for brake/aim`,()=>{
 const {b,events}=make(),ctx={...frame,bounds:{left:-width/2,right:width/2,top:-height/2,bottom:height/2},players:[{...frame.players[0]},...(coop?[{...frame.players[0],id:'p2',x:70}]:[])]},original=structuredClone(ctx);
 b.update(.02,ctx);const rail={...b.rail129.railTarget},start=b.y;run(b,3,ctx);assert(b.y<start&&b.y>ctx.bounds.top&&b.y<ctx.bounds.bottom);assert.deepEqual(b.rail129.pose,{x:b.x,y:b.y});
 run(b,2.7,ctx);assert.equal(b.entry,null);assert.equal(b.rail129.phase,'brake');assert(events.some(e=>e.type==='rural-rail-brake'));assert(!events.some(e=>e.type==='hazard'));
 run(b,1.25,ctx);assert.equal(b.rail129.phase,'aim');assert.equal(b.aimPlan.mode,'heavy-shell');run(b,1.9,ctx);assert.equal(events.filter(e=>e.visual==='rail-shell').length,1);assert(b.recovery>=3);
 assert.deepEqual(ctx,original);assert.deepEqual(b.rail129.railTarget,rail);assert.equal(events.filter(e=>e.type==='lincomparable-rail-discovered').length,1);
});
test('520 entry remains on screen with a moving pilot/camera and early track break has no position jump',()=>{
 const {b}=make();let ctx;for(let t=0;t<5.2;t+=.02){const y=-180*t;ctx={...frame,players:[{...frame.players[0],y}],bounds:{left:-195,right:195,top:y-422,bottom:y+422}};b.update(.02,ctx);if(t>2.6)assert(b.y>=ctx.bounds.top&&b.y<=ctx.bounds.bottom);}
 const pose=b.y,rail={...b.rail129.railTarget};b.hit({partId:'rail',damage:1e6});b.update(.02,ctx);assert.equal(b.entry,null);assert(Math.abs(b.y-pose)<20);assert.deepEqual(b.rail129.railTarget,rail);
});
test('rear destruction enters shock-link exactly once; one shell has delayed wave and directional residue',()=>{
 const {b,events}=make();aim(b);const phase1=structuredClone(b.aimPlan);b.hit({partId:'car-rear',damage:1e6});aim(b);const phase2=structuredClone(b.aimPlan);
 assert.equal(b.raidPhase,2);assert.equal(phase1.mode,'heavy-shell');assert.equal(phase2.mode,'shock-link');assert(phase2.waveDelay>phase1.waveDelay);assert.notDeepEqual(phase2.smoke,phase1.smoke);
 run(b,2);assert.equal(events.filter(e=>e.visual==='rail-shell').length,1);assert.equal(events.filter(e=>e.type==='phase-change'&&e.phase==='lincomparable-shock-link').length,1);
 const shots=events.filter(e=>e.type==='hazard'&&e.kind==='circle');assert.equal(shots.length,3);assert.equal(shots[2].x,phase2.smoke.x);assert.equal(shots[2].y,phase2.smoke.y);
});
for(const broken of [false,true])test(`520 last round uses original 28% gate and ${broken?'0.9':'3.2'}s derail, without repeating`,()=>{
 const {b,events}=make();aim(b);if(broken)b.hit({partId:'rail',damage:1e6});expose(b);b.hit({damage:1e6});assert.equal(b.hp,b.maxHp*.28);assert.equal(b.phase,'runaway');assert.equal(b.hit({damage:10}).damage,0);
 assert.equal(b.finalAim.remaining,2.8);assert.equal(b.finalAim.mode,'last-520');assert.deepEqual(b.finalAim.points[0],{x:0,y:0});run(b,broken?.92:2.6);assert.equal(events.filter(e=>e.tag==='heavy:last-520').length,0);if(broken)assert.equal(b.phase,'derailed');
 run(b,broken?1.9:.3);assert.equal(events.filter(e=>e.tag==='heavy:last-520').length,3);run(b,1);assert.equal(b.phase,'derailed');assert.equal(b.coreVulnerable,true);run(b,8);assert.equal(events.filter(e=>e.type==='lincomparable-last-520').length,1);assert.equal(events.filter(e=>e.type==='rail-runaway').length,1);assert.equal(events.filter(e=>e.tag==='heavy:last-520').length,3);
 const hp=b.hp;assert(b.hit({damage:20}).damage>0);assert(b.hp<hp);assert(b.hit({damage:1e6}).bodyDefeated);assert.equal(b.finalAim,null);
});
test('reloading weakpoint damage shrinks final danger; rail break reduces only the pending round',()=>{
 const loaded=make(),armored=make();for(const {b}of [loaded,armored]){aim(b);expose(b);}run(loaded.b,2);loaded.b.hit({damage:1e6});armored.b.hit({damage:1e6});
 assert(Math.abs(loaded.b.reloadStress-1)<1e-12);assert.equal(armored.b.reloadStress,0);assert(loaded.b.finalAim.radius<armored.b.finalAim.radius);assert(loaded.b.finalAim.wave<armored.b.finalAim.wave);
 const before=armored.b.finalAim.wave,remaining=armored.b.finalAim.remaining;armored.b.hit({partId:'rail',damage:1e6});assert(armored.b.finalAim.wave<before);assert.equal(armored.b.finalAim.remaining,remaining);
});
test('a pending final shot respects pause and dies with the derailed locomotive',()=>{
 const {b,events}=make();aim(b);expose(b);b.hit({partId:'rail',damage:1e6});b.hit({damage:1e6});const before=JSON.stringify([b.finalAim,b.rail129.time,b.railGun]);b.update(.25,{...frame,paused:true});assert.equal(JSON.stringify([b.finalAim,b.rail129.time,b.railGun]),before);
 run(b,.92);b.hit({damage:1e6});run(b,4);assert.equal(events.filter(e=>e.tag==='heavy:last-520').length,0);
});
test('final recoil/fire event starts at the rendered muzzle, not the impact point',()=>{
 const {b,events}=make();aim(b);expose(b);b.hit({damage:1e6});run(b,2.8);const e=events.findLast(e=>e.type==='heavy-gun-fired'),m=railGunMuzzle(b);assert.equal(e.x,m.x);assert.equal(e.y,m.y);assert.equal(e.heavy,true);
});
test('final locked forecast punishes straight flight but a finite-speed turn escapes without invulnerability',()=>{
 const fly=turn=>{
  const {b,events}=make();aim(b);expose(b);b.hit({damage:1e6});
  const hits=[],h=new BossHazards({onDamage:(id,damage)=>hits.push({id,damage}),onStatus(){},onBarrierContact(){}});let index=0,x=0,y=0,heading=-Math.PI/2,lockedTarget;
  for(let t=0;t<10;t+=.02){
   if(turn&&t>=1.4)heading=Math.min(0,heading+.02*3);
   const vx=Math.cos(heading)*180,vy=Math.sin(heading)*180;x+=vx*.02;y+=vy*.02;
   const p={...frame.players[0],x,y,vx,vy},ctx={players:[p],bounds:{left:x-195,right:x+195,top:y-422,bottom:y+422}};b.update(.02,ctx);
   if(b.finalAim?.locked){if(!lockedTarget)lockedTarget={...b.finalAim.target};else assert.deepEqual(b.finalAim.target,lockedTarget);}
   while(index<events.length){const e=events[index++];if(e.type==='hazard'&&e.tag==='heavy:last-520')h.spawn({...e,encounterId:'qa'});}h.update(.02,{players:[p]});
  }return hits;
 };assert(fly(false).some(h=>h.damage===tuning.damage*2.4));assert.deepEqual(fly(true),[]);
});
// Exercise emitted hazards and the real swept annulus with finite-speed flight,
// no invulnerability. Return inside after the short center blast in phase II.
for(const phase of [1,2,3])for(const width of [390,487.5,1280])for(const dt of [.02,.1])test(`520 phase ${phase} damage-free ${width}px route at ${dt}s simulation step`,()=>{
 const {b,events}=make(),plan=lincomparableRound({x:0,y:0},phase===1?1:2,{x:0,y:-350},{final:phase===3});b.fire520(plan);
 const hits=[],h=new BossHazards({onDamage:(id,damage)=>hits.push({id,damage}),onStatus(){},onBarrierContact(){}}),aimTime=phase===3?2.8:1.8;
 for(const e of events.filter(e=>e.type==='hazard'))h.spawn({...e,encounterId:'qa',delay:e.delay+aimTime});
 for(let t=0;t<10;t+=dt){const peak=phase===1?350:plan.radius+30,inside=plan.start-65,elapsed=t-aimTime;
  const distance=phase===1?Math.min(350,t*180):elapsed<.55?Math.min(peak,t*180):Math.max(inside,peak-(elapsed-.55)*180);
  const p={id:'p',alive:true,x:0,y:-distance,radius:12};assert(Math.abs(p.x)+p.radius<width/2);assert(Math.abs(p.y)+p.radius<422);h.update(dt,{players:[p]});
 }assert.deepEqual(hits,[]);assert.equal(h.pool.count,0);
});
test('train gun identity does not add a final shot or extended reload to Bruno',()=>{const b=new ParisGun({id:'b',x:0,y:0,tuning});assert.equal(b.finalAim,undefined);assert.equal(b.reloadStress,undefined);assert.equal(b.baseReload,.8);assert.equal(b.rail129.c.brakeSeconds,.65);});
// The locomotive call (chuffs, rail joints, whistle) plays once when the area boss arrives (app.js cut-in);
// discovery stays silent so it does not replay, and each final cue answers with the steam whistle.
test('rail entries stay quiet after the arrival call and final cues blow the steam whistle',()=>{for(const type of ['bruno-rail-discovered','lincomparable-rail-discovered'])assert.equal(bossSoundFor({type}),null);for(const type of ['bruno-iron-rain','lincomparable-last-520'])assert.equal(bossSoundFor({type}),'trainWhistle');});
