import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=raid3&rail=18');
const {CoopGame}=await import('../coop-engine.js?v=raid3&rail=18');
const {enableStageBoss,beginStageBossFrame,endStageBossFrame}=await import('../stageboss-host.js?v=raid3&rail=18');
function game(faction,coop,w=390,h=844){const pilot=faction==='central'?'baron':'fonck',g=coop?new CoopGame([{pilot},{pilot}],{rng:()=>.5}):new Game(faction==='central'?'fokker':'spad',pilot,()=>.5);g.viewWidth=w;g.viewHeight=h;g.region=3;g.spawn=Infinity;g.nextBossAt=Infinity;g.need=Infinity;for(const p of g.players||[g]){p.fire=Infinity;p.invuln=Infinity;}enableStageBoss(g,{teamFaction:faction,heavyHp:coop?1.65:1});g.stageBoss.stages.stageIndex=3;return g;}
function advance(g,n){for(let i=0;i<n;i++)g.update(.02,{});}
function shot(g,b,p,damage){const x=b.x+(p?.x||0),y=b.y+(p?.y||0);g.bullets.push({x:x-4,y,vx:520,vy:0,life:.15,enemy:false,ownerId:'p1',damage,hit:new Set()});}
for(const faction of ['central','entente'])for(const coop of [false,true])for(const [w,h] of [[390,844],[1280,800]])test(`real ${coop?'CoopGame':'Game'} ${faction} ${w}x${h}: ordinary projectile damage, pause, 120s bounded attack resources and cleanup`,()=>{
 const g=game(faction,coop,w,h),enc=g.stageBoss.startBoss({x:0,y:-120}),b=[...enc.bodies.values()][0],anchor=[b.x,b.y];advance(g,2);const target=[...b.parts.values()][0],before=target.hp;shot(g,b,target,target.hp);advance(g,2);assert(target.destroyed,`friendly projectile failed: ${before} -> ${target.hp}`);assert.deepEqual([b.x,b.y],anchor);
 const state=JSON.stringify([b.hp,b.phase,b.flameAge,b.mortarPlan,g.stageBoss.time]);g.state='paused';advance(g,50);assert.equal(JSON.stringify([b.hp,b.phase,b.flameAge,b.mortarPlan,g.stageBoss.time]),state);g.state='playing';
 for(let i=0;i<6000;i++){g.update(.02,{});assert.equal(g.stageBoss.hazards.pool.dropped,0);assert(g.stageBoss.hazards.pool.count<48);assert(g.particles.length<200);assert([b.x,b.y,b.hp].every(Number.isFinite));}assert.equal(g.state,'playing');assert.deepEqual([b.x,b.y],anchor);g.stageBoss.dispose();assert.equal(g.stageBoss.hazards.pool.count,0);assert.equal(b.mortarPlan??null,null);assert.equal(b.flameQueue?.length||0,0);
});
for(const faction of ['central','entente'])test(`production ${faction} spawn begins ahead of the actual view; approach discovers without repositioning`,()=>{
 const g=game(faction,false);g.t=100;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);const b=[...g.stageBoss.stages.encounter.bodies.values()][0],anchor=[b.x,b.y];assert(!b.discovered);assert(Math.hypot(b.x-g.x,b.y-g.y)>500);for(let i=0;i<700&&!b.discovered;i++)g.update(.02,{angle:-Math.PI/2});assert(b.discovered);assert.deepEqual([b.x,b.y],anchor);g.stageBoss.dispose();
});
