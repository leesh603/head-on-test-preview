import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=tame3&rail=40');
const {CoopGame}=await import('../coop-engine.js?v=tame3&rail=40');

function sortie(team,count,width){
 const pilots=team==='entente'?['fonck','collishaw']:['baron','voss'];
 const g=count===2?new CoopGame(pilots.map(pilot=>({pilot})),{rng:()=>.5}):new Game(team==='entente'?'camel':'fokker',pilots[0],()=>.5);
 g.viewWidth=width;g.viewHeight=844;g.update(.001,{});g.region=11;g.stageBoss.stages.stageIndex=11;g.stageBoss.stages.phase='explore';g.stageBoss.stages.encounter=null;
 g.need=Infinity;g.fire=Infinity;g.spawn=Infinity;g.nextHeavyAt=Infinity;
 for(const p of g.players||[g]){p.hp=100000;p.maxHp=100000;p.fire=Infinity;}
 const encounter=g.stageBoss.startBoss({x:g.x,y:g.y-240});return{g,encounter};
}
for(const team of ['entente','central'])for(const count of [1,2])for(const width of [390,1280])test(`London real engine: ${team}, ${count} players, ${width}px, run and restart`,()=>{
 const {g,encounter}=sortie(team,count,width);assert.equal(encounter.bossId,team==='entente'?'gotha-squadron':'london-apron-raid');
 assert.doesNotThrow(()=>{for(let i=0;i<1800;i++)g.update(1/60,{inputMode:'gamepad',fireHeld:false});});
 assert.ok([...encounter.bodies.values()].every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));assert.ok(g.londonBattle);
 if(team==='entente'){assert.equal(g.londonBattle.districts.length,3);assert.ok(g.londonBattle.districts.some(d=>d.hp<d.maxHp),'actual host resolves district hits');}
 else{const b=[...encounter.bodies.values()][0];assert.ok(b.apronStarted);const p=b.parts.get('light');g.stageBoss.hitAt({x:b.x+p.x,y:b.y+p.y,damage:100000,faction:'central'});assert.ok(p.destroyed);}
 const fresh=sortie(team,count,width);assert.ok(fresh.encounter!==encounter);assert.ok([...fresh.encounter.bodies.values()].every(b=>b.hp===b.maxHp));assert.equal(fresh.g.londonBattle.bombs.length,0);
});
