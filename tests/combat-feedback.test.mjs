import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {Game}=await import('../engine.js?v=529');
const {CoopGame}=await import('../coop-engine.js?v=529');
const {beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash}=await import('../aircraft-crash.js?v=529');
const {attachCombatFeedback,combatVisualPose,impactMaterial,drawCombatFeedback,COMBAT_CRASH_PROFILES,combatFlightSound}=await import('../combat-feedback.js?v=529');
const rng=()=>{let n=17;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296)};
const quiet=g=>{for(const k of ['spawn','nextBossAt','nextHeavyAt','eventTimer','flakTimer','patrolTimer','gasTimer','regionThreat','fieldUnitTimer'])g[k]=Infinity;return g};
const snapshot=g=>({x:g.x,y:g.y,a:g.a,hp:g.hp,kills:g.kills,ammo:g.ammo,bullets:g.bullets.map(b=>[b.x,b.y,b.damage,b.life]),enemies:g.enemies.map(e=>[e.x,e.y,e.a,e.hp,e.fire]),drops:g.drops.map(d=>[d.x,d.y,d.value,d.heal])});
test('presentation preserves simulation, RNG, input response and rewards',()=>{
 const a=quiet(new Game('fokker','baron',rng())),b=quiet(new Game('fokker','baron',rng()));attachCombatFeedback(b);
 for(let i=0;i<150;i++){const input={angle:i<70?0:Math.PI/2};a.update(.016,input);b.update(.016,input);assert.deepEqual(snapshot(b),snapshot(a))}
 assert.equal(a.rng(),b.rng());assert.notEqual(a.a,-Math.PI/2);assert(combatVisualPose(b).bank<1);
});
test('regular deaths reuse ace crashes, stay visual-only and reserve rare large explosions',()=>{
 const g=quiet(new Game('fokker','baron',rng())),s=attachCombatFeedback(g,{key:()=> 'camel'});
 for(let i=0;i<17;i++){const e={x:i*12,y:0,a:0,hp:0,type:'scout',speed:100};g.enemies=[e];g.burst(e.x,0,'#f2aa52',30);g.event('kill','');if(i<5){assert.equal(s.wrecks.at(-1).style,COMBAT_CRASH_PROFILES[i]);assert.equal(s.wrecks.at(-1).scale,1);assert(s.wrecks.at(-1).crashT>=1.15);}if(i===16)assert.equal(g.events.at(-1).combatSound,'kill')}
 assert(s.wrecks.length<=10);assert.equal(g.kills,0);assert.equal(g.drops.length,0);assert(g.combatFX.some(f=>f.killExplosion));
});
test('boss deaths retain their existing explosion and crash lifecycle',()=>{
 const g=quiet(new Game()),s=attachCombatFeedback(g);g.enemies=[{x:0,y:0,hp:0,type:'boss',bossPilot:'voss'}];g.burst(0,0,'#f2aa52',36,'aircraftHeavy');assert.equal(s.wrecks.length,0);assert(g.combatFX.some(f=>f.killExplosion));
});
test('material derives from airframe hit position, without a critical damage system',()=>{
 const e={x:0,y:0,a:0};assert.equal(impactMaterial(e,{x:20,y:0}),'metal');assert.equal(impactMaterial(e,{x:0,y:20}),'fabric');assert.equal(impactMaterial(e,{x:-10,y:0}),'wood');assert.equal(impactMaterial({...e,surface:true},{x:0,y:30}),'metal');
});
test('compact wrecks and trails are capped; pause does not advance presentation',()=>{
 const g=quiet(new Game()),s=attachCombatFeedback(g);g.viewWidth=390;
 for(let i=0;i<12;i++){g.enemies=[{x:0,y:0,hp:0,a:0,type:'hunter'}];g.burst(0,0,'#f2aa52',30)}
 assert.equal(s.wrecks.length,5);g.state='paused';const timer=s.wrecks[0].crashT;g.update(.04,{});assert.equal(s.wrecks[0].crashT,timer);
 g.state='playing';g.enemies=[];for(let i=0;i<70;i++)g.update(.04,{});assert.equal(s.wrecks.length,0);assert(s.trail.length<=24);
});
test('co-op instance hooks preserve player-owned firing and shared rewards',()=>{
 const make=()=>quiet(new CoopGame([{pilot:'baron',plane:'fokker'},{pilot:'voss',plane:'fokker'}],{rng:rng()}));const a=make(),b=make();attachCombatFeedback(b);
 for(let i=0;i<25;i++){a.update(.016,{});b.update(.016,{});assert.deepEqual(snapshot(b),snapshot(a))}
 assert.equal(a.rng(),b.rng());
});


test('an actual bullet kill has identical collision, kill credit, drops and RNG',()=>{
 const a=quiet(new Game('fokker','baron',rng())),b=quiet(new Game('fokker','baron',rng())),state=attachCombatFeedback(b,{key:()=> 'camel'});
 for(const g of [a,b]){g.region=g.worldRegion();const e=g.spawnEnemy('scout');Object.assign(e,{x:0,y:-120,a:Math.PI/2,hp:8,fire:100});g.bullets.push({x:0,y:-120,vx:0,vy:0,life:1,damage:50,enemy:false,hit:new Set()});g.update(.016,{})}
 assert(a.kills>0);assert.deepEqual(snapshot(b),snapshot(a));assert.equal(a.rng(),b.rng());assert.equal(state.wrecks.length,1);assert.equal(state.impacts.length,1);
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
 const e={x:10,y:20,a:0,speed:100},calls=[],host={rng:()=>.5,smoke:(...args)=>calls.push(['smoke',...args]),burst:(...args)=>calls.push(['burst',...args]),event:(...args)=>calls.push(['event',...args])};
 beginAircraftCrash(e,host.rng);advanceAircraftCrash(host,e,.04);
 assert.equal(e.crashT,1.1099999999999999);assert.equal(e.a,3.5*.04);assert.equal(e.x,10);assert.equal(e.y,24.8);assert.equal(e.crashSpeed,120*(1-.7*.04));
 assert.deepEqual(calls,[['smoke',10,24.8,true]]);
 advanceAircraftCrash(host,e,.04);assert.equal(calls.length,1);
 for(let i=0;i<27;i++)advanceAircraftCrash(host,e,.04);
 assert.equal(e.crashed,true);assert.equal(calls.filter(c=>c[0]==='burst').length,1);assert.deepEqual(calls.find(c=>c[0]==='burst').slice(3),['#f2aa52',36,'bomb']);assert.deepEqual(calls.at(-1),['event','kill','']);
});

test('machine-gun recoil is subpixel, axial and follows muzzle decay without firing jitter',()=>{
 const g={t:0,x:0,y:0,a:0,hp:100,maxHp:100,muzzleFlash:.04,enemies:[],bullets:[],burst(){},event(){},update(dt){this.t+=dt}};
 attachCombatFeedback(g);
 for(const flash of [.04,.03,.02,.01,0]){g.muzzleFlash=flash;g.update(.016);const p=combatVisualPose(g);assert(Math.abs(p.x)<=.18);assert.equal(Math.abs(p.y),0);assert.equal(Math.abs(p.roll),0);assert(Math.abs(p.x+.18*flash/.04)<1e-12)}
 g.muzzleFlash=.04;g.cannonRecoil129=.2;g.update(.016);assert.equal(Math.abs(combatVisualPose(g).x),0,'do not stack on existing cannon recoil');
});

test('regular wreck uses the same ace artwork at full aircraft scale throughout its fall',()=>{
 const g=quiet(new Game()),state=attachCombatFeedback(g,{key:()=> 'camel',scale:()=>.85});
 g.enemies=[{x:0,y:0,a:0,hp:0,type:'scout',speed:100}];g.burst(0,0,'#f2aa52',30);g.enemies=[];
 for(let i=0;i<25;i++)g.update(.04,{});
 const w=state.wrecks[0],actual=[],expected=[],sprites=[];
 drawCombatFeedback({},g,(x,y)=>[x,y],{fx:(...args)=>actual.push(args),planeSprite:(...args)=>sprites.push(args)});
 drawAircraftCrash({},w,w.x,w.y,g.t,(...args)=>expected.push(args));
 assert.deepEqual(actual,expected);assert(sprites.every(s=>s[5]===.85));assert.equal(sprites.length,2);assert(g.particles.some(p=>p.smoke));
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

test('wing breakup draws clipped pieces of the original painted sprite at unchanged scale',()=>{
 const g=quiet(new Game()),s=attachCombatFeedback(g,{key:()=> 'camel'});
 for(let i=0;i<4;i++){g.enemies=[{x:0,y:0,a:0,hp:0,type:'scout',speed:100}];g.burst(0,0,'#f2aa52',30)}
 s.wrecks=s.wrecks.filter(w=>w.style==='breakup');g.enemies=[];const clips=[],sprites=[],c={save(){},restore(){},translate(){},rotate(){},beginPath(){},rect(){},clip(rule){clips.push(rule)}};
 drawCombatFeedback(c,g,(x,y)=>[x,y],{fx(){},planeSprite:(...args)=>sprites.push(args)});
 assert.deepEqual(clips,['evenodd',undefined]);assert.equal(sprites.length,3);assert(sprites.every(a=>a[4]==='camel'&&a[5]===1));
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
 drawCombatFeedback({},g,(x,y)=>[x,y],{fx:(...args)=>draws.push(args),planeSprite(){}});
 assert.equal(draws.length,12);assert(draws.some(d=>d[1]==='tracerCream'));assert(draws.some(d=>d[1]==='tracerOrange'));assert.deepEqual(g.bullets,before);
});
