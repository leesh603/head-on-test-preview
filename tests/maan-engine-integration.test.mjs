import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=sfx2&rail=13rail=14');
const {CoopGame}=await import('../coop-engine.js?v=sfx2&rail=13rail=14');
const {stageBossCollision,damageStageBoss}=await import('../stageboss-host.js?v=sfx2&rail=13rail=14');

function sortie(team,count,width){
 const pilots=team==='entente'?['fonck','collishaw']:['baron','voss'];
 const g=count===2?new CoopGame(pilots.map(pilot=>({pilot})),{rng:()=>.5}):new Game(team==='entente'?'camel':'fokker',pilots[0],()=>.5);
 g.viewWidth=width;g.viewHeight=844;g.update(.001,{});g.region=13;g.stageBoss.stages.stageIndex=13;g.stageBoss.stages.orderPosition=g.stageBoss.stages.order.indexOf(13);g.stageBoss.stages.phase='explore';g.stageBoss.stages.encounter=null;
 g.need=Infinity;g.fire=Infinity;g.spawn=Infinity;g.nextHeavyAt=Infinity;
 for(const p of g.players||[g]){p.hp=100000;p.maxHp=100000;p.fire=Infinity;}
 const encounter=g.stageBoss.startBoss({x:g.x,y:g.y-240});return{g,encounter,b:[...encounter.bodies.values()][0]};
}
for(const team of ['entente','central'])for(const count of [1,2])for(const width of [390,1280])test(`Ma’an production engine: ${team}, ${count} players, ${width}px, damage/final/pause/restart`,()=>{
 const {g,encounter,b}=sortie(team,count,width);
 const tick=n=>{for(let i=0;i<n*60;i++)g.update(1/60,{inputMode:'gamepad',fireHeld:false});};
 tick(9.2);assert.equal(b.entryAge,9);
 const p=b.parts.get(team==='entente'?'radiator':'command'),point={x:b.x+p.x,y:b.y+p.y},proxy=g.enemies.find(q=>q.stageBossBody===b);
 const shot={...point,previousX:point.x-2,previousY:point.y,ownerId:'p1',radius:1};assert.ok(stageBossCollision(g,proxy,shot.x,shot.y,shot));
 const hp=p.hp;damageStageBoss(g,proxy,shot,20);assert.ok(p.hp<hp,'actual host routes part damage');
 g.stageBoss.hit({bodyId:b.id,partId:p.id,damage:1e6,faction:team});b.hp=b.maxHp*.25;
 tick(30);assert.equal(g.state,'playing');assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));assert.equal(g.stageBoss.hazards.pool.dropped,0);assert.ok(g.maanWeather?.cells.length>0);
 assert.ok(team==='entente'?b.runawayStarted:b.finalStarted);assert.ok(g.stageBoss.hazards.pool.count<80);
 const frozen=JSON.stringify({x:b.x,y:b.y,entry:b.entryAge,heat:b.heat,cycle:b.pressureCycle,final:b.encirclement,weather:g.maanWeather});g.state='paused';g.update(.5,{});assert.equal(JSON.stringify({x:b.x,y:b.y,entry:b.entryAge,heat:b.heat,cycle:b.pressureCycle,final:b.encirclement,weather:g.maanWeather}),frozen);
 g.state='playing';for(const part of b.parts.values())g.stageBoss.hit({bodyId:b.id,partId:part.id,damage:1e6,faction:team});g.stageBoss.hit({bodyId:b.id,damage:1e6,faction:team});assert.ok(encounter.completed);tick(4);
 assert.equal(g.stageBoss.hazards.pool.count,0);assert.ok([...encounter.bodies.values()].every(q=>q.dead));
 assert.notEqual(g.stageBoss.stages.stageIndex,13,'actual host advances out of Ma’an after defeat');assert.equal(g.maanWeather,null);
 const fresh=sortie(team,count,width);assert.notEqual(fresh.encounter,encounter);assert.equal(fresh.b.hp,fresh.b.maxHp);assert.ok([...fresh.b.parts.values()].every(q=>!q.destroyed));assert.equal(team==='entente'?fresh.b.pressureCycle:fresh.b.encirclement,null);
});
