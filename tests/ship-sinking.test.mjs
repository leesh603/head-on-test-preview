import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image=class {set src(v){queueMicrotask(()=>this.onload?.());}};
globalThis.document={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=dread-opaque-2');
const {CoopGame}=await import('../coop-engine.js?v=dread-opaque-2');
const {updateNavalFleet}=await import('../fleet-naval1.js?v=dread-opaque-2');
const {sinkingPhase,drawSinkingShip,FLEET_SINK_DURATION}=await import('../ship-sinking.js?v=dread-opaque-2');
function game(coop=false){const g=coop?new CoopGame([{pilot:'fonck'},{pilot:'guynemer'}],{rng:()=>.5}):new Game('spad','fonck',()=>.5);g.region=1;g.worldRegion=()=>g.region;g.invuln=Infinity;g.nextHeavyAt=Infinity;g.nextBossAt=Infinity;return g;}
test('Enemy death captured after native cleanup initialized sinkAge; snapshot survives removal',()=>{
 for(const coop of [false,true]){const g=game(coop),e=g.spawnMovingFleet()[0];e.a=.63;e.hp=0;e.sinkAge=0;const credit=[g.kills,g.priorityKills];updateNavalFleet(g,.04);assert.equal(g.shipSinkPuffs.length,1);const p=g.shipSinkPuffs[0];assert.equal(p.ship.a,.63);assert(e.expired);g.enemies=g.enemies.filter(q=>q!==e);e.x+=500;e.a=2;updateNavalFleet(g,.04);assert.equal(g.shipSinkPuffs.length,1);assert.equal(p.ship.a,.63);assert.notEqual(p.x,e.x);assert.deepEqual([g.kills,g.priorityKills],credit);}
});
test('Ally and enemy sunk hulls both persist visually and are captured only once',()=>{
 const g=game(),enemy=g.spawnMovingFleet()[0],ally=g.spawnMovingFleet('entente')[0];enemy.hp=ally.hp=0;for(let i=0;i<10;i++)updateNavalFleet(g,.04);assert.equal(g.shipSinkPuffs.length,2);assert.equal(g.friendlyShips.includes(ally),false);assert(g.shipSinkPuffs.every(p=>p.age>.35));
});
test('Native solo and cooperative cleanup hand off sunk ships before removing combat corpses',()=>{
 for(const coop of [false,true]){const g=game(coop),e=g.spawnMovingFleet()[0];e.hp=0;g.update(.04,{});assert.equal(g.shipSinkPuffs.length,1);assert.equal(g.shipSinkPuffs[0].ship.hp,0);g.update(.04,{});assert.equal(g.shipSinkPuffs.length,1);assert(!g.enemies.includes(e));}
});
test('Paused sinking and region transitions freeze or clear the detached surface effects',()=>{
 const g=game(),e=g.spawnMovingFleet()[0];e.hp=0;updateNavalFleet(g,.04);const age=g.shipSinkPuffs[0].age;g.state='paused';updateNavalFleet(g,1);assert.equal(g.shipSinkPuffs[0].age,age);g.state='playing';g.region=0;updateNavalFleet(g,.04);assert.equal(g.shipSinkPuffs.length,0);
});
test('Surface aftermath survives after the opaque hull is gone then is removed',()=>{
 const g=game(),e=g.spawnMovingFleet()[0];e.hp=0;for(let i=0;i<65;i++)updateNavalFleet(g,.04);assert.equal(g.shipSinkPuffs.length,1);assert.equal(sinkingPhase(g.shipSinkPuffs[0].age,FLEET_SINK_DURATION).progress,1);for(let i=0;i<20;i++)updateNavalFleet(g,.04);assert.equal(g.shipSinkPuffs.length,0);
});
test('Progress is monotonic, ends before surface water, and scales to boss durations',()=>{
 for(const duration of [3.1,3.2,4.4]){let last=0;for(let age=0;age<duration;age+=.01){const p=sinkingPhase(age,duration);assert(p.progress>=last);assert(p.tail>=0&&p.tail<=1);last=p.progress;}const p=sinkingPhase(duration*.8,duration);assert.equal(p.progress,1);assert(p.tail>0);assert(sinkingPhase(duration,duration).done);}
});
test('Hull callback is fully opaque even under a fading caller, restores context and never scales',()=>{
 const stack=[],ops=[];const c={globalAlpha:.73,save(){stack.push(this.globalAlpha);ops.push(['save']);},restore(){this.globalAlpha=stack.pop();ops.push(['restore']);},translate(x,y){ops.push(['translate',x,y]);},rotate(a){ops.push(['rotate',a]);},beginPath(){},rect(){},moveTo(x,y){ops.push(['point',x,y]);},lineTo(x,y){ops.push(['point',x,y]);},closePath(){},clip(){ops.push(['clip']);},scale(){throw Error('Hull must not shrink');}};
 const pose={x:120,y:-80,yaw:.85,width:100,height:500,age:1.2,duration:4.4};let calls=0;drawSinkingShip(c,pose,()=>{assert.equal(c.globalAlpha,1);assert(ops.some(o=>o[0]==='clip'));assert.deepEqual(ops.slice(-2),[['rotate',-.85],['translate',-120,80]]);calls++;});assert.equal(calls,1);assert.equal(c.globalAlpha,.73);assert.equal(stack.length,0);pose.age=3.8;drawSinkingShip(c,pose,()=>calls++);assert.equal(calls,1);
});
