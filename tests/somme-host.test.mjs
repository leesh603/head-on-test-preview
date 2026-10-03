import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {CoopGame}=await import('../coop-engine.js?v=514');
const {Game}=await import('../engine.js?v=514');
const {enableStageBoss,beginStageBossFrame,endStageBossFrame,stageBossCollision,damageStageBoss}=await import('../stageboss-host.js?v=514');
const {sommePoint}=await import('../somme-boss-layout.js?v=514');
for(const mode of ['solo','coop'])for(const faction of ['central','entente'])test(`Somme ${mode}/${faction} uses real host collision, one HP budget and bounded hazards`,()=>{
 const pilot=faction==='central'?'baron':'fonck',g=mode==='solo'?new Game(faction==='central'?'fokker':'spad',pilot,()=>.5):new CoopGame([{pilot},{pilot}],{rng:()=>.5});
 g.viewWidth=390;g.viewHeight=844;g.region=10;enableStageBoss(g,{teamFaction:faction,heavyHp:mode==='coop'?1.65:1});g.stageBoss.stages.stageIndex=10;const enc=g.stageBoss.startBoss({x:g.x,y:g.y-90}),b=[...enc.bodies.values()][0],budget=enc.maxHpBudget;
 endStageBossFrame(g,.02);assert.equal(enc.bodies.size,faction==='central'?3:1);assert.equal([...enc.bodies.values()].reduce((n,b)=>n+b.maxHp,0),budget);
 const p=b.parts.get(faction==='central'?'track-left':'observer'),q=sommePoint(b,p.hitLocalX,p.localY),proxy=g.enemies.find(e=>e.stageBossBodyId===b.id||e.bossBodyId===b.id||e.id===b.id),shot={x:q.x,y:q.y,previousX:q.x-40,previousY:q.y,ownerId:'p1',radius:1};assert(proxy,'host body proxy missing');
 assert.equal(stageBossCollision(g,proxy,shot.x,shot.y,shot),true);const hp=b.hp;damageStageBoss(g,proxy,shot,20);assert.equal(hp-b.hp,16);assert.equal(g.stageBossLastOwner,'p1');
 for(const pilot of g.players||[g])pilot.invuln=Infinity;
 for(let i=0;i<2400;i++){g.t+=.05;beginStageBossFrame(g,.05);endStageBossFrame(g,.05);}assert.equal(g.stageBoss.hazards.pool.dropped,0);assert(g.stageBoss.hazards.pool.count<80);
 g.stageBoss.dispose();assert.equal(g.stageBoss.hazards.pool.count,0);
});
