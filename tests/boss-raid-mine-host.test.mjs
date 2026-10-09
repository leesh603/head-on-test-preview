import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=tame3&rail=39');
const {enableStageBoss,endStageBossFrame}=await import('../stageboss-host.js?v=tame3&rail=39');

function setup(){
 const g=new Game('spad','fonck',()=>.5);g.viewWidth=390;g.viewHeight=844;g.state='playing';g.invuln=0;
 enableStageBoss(g,{teamFaction:'entente'});g.stageBoss.stages.stageIndex=4;g.region=4;
 const e=g.stageBoss.startBoss({x:0,y:-100}),b=e.bodies.values().next().value;
 // Isolate one real mine from native replenishment, not its host damage path.
 b.update=()=>{};b.basicClock=Infinity;
 b.command('spawn-minefield',{points:[{x:g.x,y:g.y}],sourceX:g.x-80,sourceY:g.y-100,warning:1,life:12,maxMines:26,fuse:3.2});
 return g;
}
function tick(g,seconds){for(let t=0;t<seconds;t+=.02)endStageBossFrame(g,.02);}
test('Drachen fuse warns, pauses, detonates and deals actual host damage',()=>{
 const g=setup(),hp=g.hp,field=g.hostileMinefields[0];tick(g,2.3);assert(field.fuseTag);assert.equal(g.hp,hp);
 const age=field.fuseAge;g.state='paused';tick(g,2);assert.equal(field.fuseAge,age);assert.equal(g.hp,hp);
 g.state='playing';tick(g,1);assert(field.fuseDetonated);assert(field.mines[0].dead);assert(g.hp<hp);
 g.stageBoss.dispose();
});
test('shooting an armed mine early cancels the warned fuse blast',()=>{
 const g=setup(),hp=g.hp,field=g.hostileMinefields[0];tick(g,2.3);assert(field.fuseTag);
 field.mines[0].dead=true;tick(g,.5);
 let queued=0;g.stageBoss.hazards.pool.visit(h=>{if(h.tag===field.fuseTag)queued++;});assert.equal(queued,0);
 tick(g,1);assert.equal(g.hp,hp);g.stageBoss.dispose();
});
