import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {Game}=await import('../engine.js?v=gal1&rail=42');
const {CoopGame}=await import('../coop-engine.js?v=gal1&rail=42');
const {beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash,enemyCrashScale}=await import('../aircraft-crash.js?v=gal1');
const {attachCombatFeedback,combatVisualPose,impactMaterial,drawCombatFeedback,COMBAT_CRASH_PROFILES,combatFlightSound}=await import('../combat-feedback.js?v=gal1');

const rng=()=>{let n=17;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296)};
const quiet=g=>{for(const k of ['spawn','nextBossAt','nextHeavyAt','eventTimer','flakTimer','patrolTimer','gasTimer','regionThreat','fieldUnitTimer'])g[k]=Infinity;return g};
const snapshot=g=>({x:g.x,y:g.y,a:g.a,hp:g.hp,kills:g.kills,ammo:g.ammo,bullets:g.bullets.map(b=>[b.x,b.y,b.damage,b.life]),enemies:g.enemies.map(e=>[e.x,e.y,e.a,e.hp,e.fire]),drops:g.drops.map(d=>[d.x,d.y,d.value,d.heal])});
test('presentation preserves simulation, RNG, input response and rewards',()=>{
 const a=quiet(new Game('fokker','baron',rng())),b=quiet(new Game('fokker','baron',rng()));attachCombatFeedback(b);
 for(let i=0;i<150;i++){const input={angle:i<70?0:Math.PI/2};a.update(.016,input);b.update(.016,input);assert.deepEqual(snapshot(b),snapshot(a))}
 assert.equal(a.rng(),b.rng());assert.notEqual(a.a,-Math.PI/2);assert.equal(combatVisualPose(b).bank,1);
});
test('regular deaths crash naturally through the entity path without duplicate wreck copies',()=>{
 const g=quiet(new Game('fokker','baron',rng())),s=attachCombatFeedback(g,{key:()=> 'camel'});
 const e={x:0,y:0,a:0,hp:0,maxHp:30,type:'scout',speed:100,crashStyle:'glide'};g.enemies=[e];g.region=g.worldRegion();
 g.update(.016,{});
 assert.equal(e.crashing,true);assert.equal(s.wrecks.length,0);
 g.burst(e.x,e.y,'#f2aa52',30);g.event('kill','');assert.equal(s.wrecks.length,0);
 for(let i=0;i<60;i++)g.update(.016,{});
 assert(!g.enemies.includes(e));assert.equal(s.wrecks.length,0);
});
test('boss deaths retain their existing explosion and crash lifecycle',()=>{
 const g=quiet(new Game()),s=attachCombatFeedback(g);g.enemies=[{x:0,y:0,hp:0,type:'boss',bossPilot:'voss'}];g.burst(0,0,'#f2aa52',36,'aircraftHeavy');assert.equal(s.wrecks.length,0);assert(g.combatFX.some(f=>f.killExplosion));
});
test('material derives from airframe hit position, without a critical damage system',()=>{
 const e={x:0,y:0,a:0};assert.equal(impactMaterial(e,{x:20,y:0}),'metal');assert.equal(impactMaterial(e,{x:0,y:20}),'fabric');assert.equal(impactMaterial(e,{x:-10,y:0}),'wood');assert.equal(impactMaterial({...e,surface:true},{x:0,y:30}),'metal');
});
test('wreck presentation pauses with the game and drains after the crash completes',()=>{
 const g=quiet(new Game()),s=attachCombatFeedback(g);g.viewWidth=390;
 for(let i=0;i<3;i++){const w={x:0,y:0,a:0,type:'scout',key:'camel',scale:1,style:'spin',age:0};beginAircraftCrash(w,()=>.5);w.crashT=w.crashDuration=5;s.wrecks.push(w)}
 assert.equal(s.wrecks.length,3);g.state='paused';const timer=s.wrecks[0].crashT;g.update(.04,{});assert.equal(s.wrecks[0].crashT,timer);
 g.state='playing';g.enemies=[];for(const w of s.wrecks)w.crashT=.2;for(let i=0;i<70;i++)g.update(.04,{});assert.equal(s.wrecks.length,0);assert(s.trail.length<=24);
});
test('co-op instance hooks preserve player-owned firing and shared rewards',()=>{
 const make=()=>quiet(new CoopGame([{pilot:'baron',plane:'fokker'},{pilot:'voss',plane:'fokker'}],{rng:rng()}));const a=make(),b=make();attachCombatFeedback(b);
 for(let i=0;i<25;i++){a.update(.016,{});b.update(.016,{});assert.deepEqual(snapshot(b),snapshot(a))}
 assert.equal(a.rng(),b.rng());
});


test('an actual bullet kill has identical collision, kill credit, drops and RNG',()=>{
 const a=quiet(new Game('fokker','baron',rng())),b=quiet(new Game('fokker','baron',rng())),state=attachCombatFeedback(b,{key:()=> 'camel'});
 for(const g of [a,b]){g.region=g.worldRegion();const e=g.spawnEnemy('scout');Object.assign(e,{x:0,y:-120,a:Math.PI/2,hp:8,fire:100});g.bullets.push({x:0,y:-120,vx:0,vy:0,life:1,damage:50,enemy:false,hit:new Set()});g.update(.016,{})}
 assert(a.kills>0);assert.deepEqual(snapshot(b),snapshot(a));assert.equal(a.rng(),b.rng());assert.equal(state.wrecks.length,0);assert.equal(state.impacts.length,1);
});

test('only nearby blast produces haptics and a small camera reaction',()=>{
 const g=quiet(new Game()),pulses=[],state=attachCombatFeedback(g,{pulse:k=>pulses.push(k)});g.combatBlast(g.x+600,g.y,50);assert.deepEqual(pulses,[]);g.combatBlast(g.x+100,g.y,50);assert.deepEqual(pulses,['explosion']);assert(state.camera<=1.1);
});


test('one physical close crossing and one swept near-miss each emit one cue',()=>{
 const e={x:160,y:60,a:Math.PI,hp:30,maxHp:30,type:'hunter'},bullet={x:180,y:40,vx:-600,vy:0,life:10,enemy:true};
 const world={t:0,state:'playing',x:0,y:0,a:0,hp:100,maxHp:100,enemies:[e],bullets:[bullet],events:[],particles:[],burst(){},event(){},update(dt){this.t+=dt;e.x-=200*dt;bullet.previousX=bullet.x;bullet.previousY=bullet.y;bullet.x+=bullet.vx*dt}};
 const cues=[];attachCombatFeedback(world,{play:name=>cues.push(name)});for(let i=0;i<160;i++)world.update(.02);
 assert.equal(cues.filter(c=>c==='closePass').length,1);assert.equal(cues.filter(c=>c==='whizz').length,1);
});

test('shared ace choreography preserves trajectory, smoke cadence and final crash',()=>{
 const e={x:10,y:20,a:0,speed:100,crashStyle:'spin'},calls=[],host={rng:()=>.5,smoke:(...args)=>calls.push(['smoke',...args]),burst:(...args)=>calls.push(['burst',...args]),event:(...args)=>calls.push(['event',...args])};
 beginAircraftCrash(e,host.rng);advanceAircraftCrash(host,e,.04);
 assert.equal(e.crashT,.76);assert.equal(e.a,1.75*.04);assert(Math.abs(e.x-13.6)<.01);assert(Math.abs(e.y-20)<.1);assert.equal(e.crashSpeed,90*(1-.65*.04));
 assert(calls[0][0]==='smoke'&&calls[0][3]===true);
 advanceAircraftCrash(host,e,.04);assert.equal(calls.length,1);
 for(let i=0;i<18;i++)advanceAircraftCrash(host,e,.04);
 assert.equal(e.crashed,true);assert.equal(calls.filter(c=>c[0]==='burst').length,1);assert.deepEqual(calls.find(c=>c[0]==='burst').slice(3),['#f2aa52',30,'aircraft']);assert(calls.every(c=>c[0]!=='event'));
});

test('machine-gun recoil is subpixel, axial and follows muzzle decay without firing jitter',()=>{
 const g={t:0,x:0,y:0,a:0,hp:100,maxHp:100,muzzleFlash:.04,enemies:[],bullets:[],burst(){},event(){},update(dt){this.t+=dt}};
 attachCombatFeedback(g);
 for(const flash of [.04,.03,.02,.01,0]){g.muzzleFlash=flash;g.update(.016);const p=combatVisualPose(g);assert(Math.abs(p.x)<=.18);assert.equal(Math.abs(p.y),0);assert.equal(Math.abs(p.roll),0);assert(Math.abs(p.x+.18*flash/.04)<1e-12)}
 g.muzzleFlash=.04;g.cannonRecoil129=.2;g.update(.016);assert.equal(Math.abs(combatVisualPose(g).x),0,'do not stack on existing cannon recoil');
});

test('regular wreck uses the same ace artwork and shrinks as it falls',()=>{
 const g=quiet(new Game()),state=attachCombatFeedback(g,{key:()=> 'camel',scale:()=>.85});
 const w={x:0,y:0,a:0,type:'scout',key:'camel',scale:.85,style:'spin',age:0};beginAircraftCrash(w,()=>.5);w.crashDuration=w.crashT=1.15;
 state.wrecks.push(w);
 for(let i=0;i<25;i++)g.update(.04,{});
 const actual=[],expected=[],sprites=[];
 drawCombatFeedback({},g,(x,y)=>[x,y],{fx:(...args)=>actual.push(args),planeSprite:(...args)=>sprites.push(args)});
 drawAircraftCrash({},w,w.x,w.y,g.t,(...args)=>expected.push(args));
 assert.deepEqual(actual,expected);assert(sprites.every(s=>s[5]===.85*enemyCrashScale(w)));assert.equal(sprites.length,2);assert(g.particles.some(p=>p.smoke));
});

test('single and co-op crash completion never changes rewards, target lists or simulation RNG',()=>{
 for(const make of [()=>new Game('fokker','baron',rng()),()=>new CoopGame([{pilot:'baron',plane:'fokker'},{pilot:'voss',plane:'fokker'}],{rng:rng()})]){
  const a=quiet(make()),b=quiet(make()),state=attachCombatFeedback(b);
  for(const g of [a,b]){g.region=g.worldRegion();const e=g.spawnEnemy('scout');Object.assign(e,{x:0,y:-120,a:Math.PI/2,hp:8,fire:100});g.bullets.push({x:0,y:-120,vx:0,vy:0,life:1,damage:50,enemy:false,ownerId:g.players?.[0].id,hit:new Set()})}
  for(let i=0;i<90;i++){a.update(.02,{});b.update(.02,{});assert.deepEqual(snapshot(b),snapshot(a))}
  assert.equal(a.rng(),b.rng());assert.equal(state.wrecks.length,0);assert.equal(b.events.filter(e=>e.type==='kill').length,a.events.filter(e=>e.type==='kill').length);
 }
});

test('sustained hits follow the struck airframe and emit bounded damage trails without changing its flight',()=>{
 const e={x:100,y:0,a:0,hp:60,maxHp:100,type:'hunter',speed:100},sounds=[];
 const g={t:0,state:'playing',x:0,y:0,a:0,hp:100,maxHp:100,viewWidth:390,enemies:[e],bullets:[],burst(){},event(){},specialRoundImpact(){},update(dt){this.t+=dt;e.x+=100*dt}};
 const s=attachCombatFeedback(g,{play:(name,arg)=>sounds.push([name,arg])});
 for(let i=0;i<4;i++){g.specialRoundImpact({x:e.x+20,y:e.y,vx:300,vy:0},e);g.update(.02)}
 assert.equal(e.hp,60);assert.equal(e.x,108);assert.equal(s.damage.get(e).engine,4);assert.equal(s.damage.get(e).streak,4);assert(s.plumes.length>0);
 const fx=[];drawCombatFeedback({},g,(x,y)=>[x,y],{fx:(...args)=>fx.push(args),planeSprite(){}});
 const lastSpark=fx.filter(f=>f[1]==='armorSpark').at(-1);assert(lastSpark[2]>125,'impact follows moving nose instead of lingering behind');
 assert.equal(sounds.filter(([k])=>k==='materialImpact').at(-1)[1].streak,4);
 for(let i=0;i<150;i++)g.update(.02);assert(s.plumes.length<=32);assert.equal(s.impacts.length,0);
});


test('heavy approach is a single cue and close-pass wind/engine duck expire',()=>{
 const e={x:1100,y:60,a:Math.PI,hp:50,maxHp:50,type:'bomber'},cues=[];
 const g={t:0,state:'playing',x:0,y:0,a:0,hp:100,maxHp:100,enemies:[e],bullets:[],burst(){},event(){},update(dt){this.t+=dt;e.x-=400*dt}};
 const s=attachCombatFeedback(g,{play:n=>cues.push(n)});let duck=false;
 for(let i=0;i<190;i++){g.update(.02);duck ||= combatFlightSound(g).duck}
 assert.equal(cues.filter(n=>n==='formationPass').length,1);assert.equal(cues.filter(n=>n==='closePass').length,1);assert(duck);assert.equal(combatFlightSound(g).duck,false);assert.equal(s.passes.length,0);
});

test('HEAD-ON highlights real crossing rounds only and caps compact tracer draws',()=>{
 const e={x:300,y:0,a:Math.PI,hp:50,maxHp:50,type:'hunter'},bullets=Array.from({length:30},(_,i)=>({x:100+i,y:0,vx:i%2?400:-400,vy:0,life:1,enemy:!!(i%2)}));
 const g={t:0,state:'playing',x:0,y:0,a:0,hp:100,maxHp:100,viewWidth:390,enemies:[e],bullets,burst(){},event(){},update(dt){this.t+=dt;e.x-=200*dt}};
 attachCombatFeedback(g);g.update(.02);g.update(.02);const before=structuredClone(bullets),draws=[];
 drawCombatFeedback({},g,(x,y)=>[x,y],{fx:(...args)=>draws.push(['fx',...args]),planeSprite(){},bolt:(...args)=>draws.push(args)});
 assert.equal(draws.length,12);assert(draws.some(d=>d[4]==='#f2d9a0'));assert(draws.some(d=>d[4]==='#f0965a'));assert.deepEqual(g.bullets,before);
});
