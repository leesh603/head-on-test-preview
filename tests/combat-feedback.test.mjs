import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {Game}=await import('../engine.js?v=525');
const {CoopGame}=await import('../coop-engine.js?v=525');
const {attachCombatFeedback,combatVisualPose,impactMaterial,WRECK_STYLES}=await import('../combat-feedback.js?v=525');
const rng=()=>{let n=17;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296)};
const quiet=g=>{for(const k of ['spawn','nextBossAt','nextHeavyAt','eventTimer','flakTimer','patrolTimer','gasTimer','regionThreat','fieldUnitTimer'])g[k]=Infinity;return g};
const snapshot=g=>({x:g.x,y:g.y,a:g.a,hp:g.hp,kills:g.kills,ammo:g.ammo,bullets:g.bullets.map(b=>[b.x,b.y,b.damage,b.life]),enemies:g.enemies.map(e=>[e.x,e.y,e.a,e.hp,e.fire]),drops:g.drops.map(d=>[d.x,d.y,d.value,d.heal])});
test('presentation preserves simulation, RNG, input response and rewards',()=>{
 const a=quiet(new Game('fokker','baron',rng())),b=quiet(new Game('fokker','baron',rng()));attachCombatFeedback(b);
 for(let i=0;i<150;i++){const input={angle:i<70?0:Math.PI/2};a.update(.016,input);b.update(.016,input);assert.deepEqual(snapshot(b),snapshot(a))}
 assert.equal(a.rng(),b.rng());assert.notEqual(a.a,-Math.PI/2);assert(combatVisualPose(b).bank<1);
});
test('regular deaths vary, stay visual-only and do not consume extra RNG',()=>{
 const g=quiet(new Game('fokker','baron',rng())),s=attachCombatFeedback(g,{key:()=> 'camel'});
 for(let i=0;i<17;i++){const e={x:i*12,y:0,a:0,hp:0,type:'scout',speed:100};g.enemies=[e];g.burst(e.x,0,'#f2aa52',30);g.event('kill','');if(i<5)assert.equal(s.wrecks.at(-1).style,WRECK_STYLES[i]);if(i===16)assert.equal(g.events.at(-1).combatSound,'kill')}
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
 assert.equal(s.wrecks.length,5);g.state='paused';const age=s.wrecks[0].age;g.update(.04,{});assert.equal(s.wrecks[0].age,age);
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
