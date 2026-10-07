import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,step} from './stageboss-fixture94.mjs';
import {MAAN_LAYOUT,rotateMaan} from '../maan-layout.js';
import {readFileSync,statSync} from 'node:fs';
function battle(team='entente'){const f=fixture({teamFaction:team,stageIndex:13});f.addon.startBoss({x:400,y:50});f.body=[...f.addon.stages.encounter.bodies.values()][0];f.emitted=[];const emit=f.body.emit;f.body.emit=e=>{f.emitted.push(e);emit(e);};return f;}
const destroy=(f,id)=>f.addon.hit({bodyId:f.body.id,partId:id,damage:1e6,faction:f.addon.stages.teamFaction});
test('Ma’an has opposite-faction experimental hulls and a nine-second protected arrival',()=>{
 for(const [team,kind]of [['entente','wustenpanzer'],['central','sinai-landship']]){const f=battle(team);assert.equal(f.body.kind,kind);assert.equal(f.body.locateHit({x:400,y:50}),null);assert.equal(f.body.hit({damage:99}).damage,0);step(f,9.1);assert.equal(f.body.entryAge,9);assert.ok(f.body.coreVulnerable);assert.ok(f.log.cues.some(e=>e.type==='maan-entry'&&e.stage==='doors'));}
});

// Independent separating-axis check uses the actual drawn rectangles; it does
// not use the avoidance helper to certify its own result.
function overlaps(a,aw,ah,b,bw,bh){
 const corners=(o,w,h)=>[-1,1].flatMap(x=>[-1,1].map(y=>{const p=rotateMaan(x*w/2,y*h/2,o.hullYaw||0);return{x:o.x+p.x,y:o.y+p.y};}));
 const ac=corners(a,aw,ah),bc=corners(b,bw,bh);
 for(const body of [a,b])for(const angle of [body.hullYaw||0,(body.hullYaw||0)+Math.PI/2]){
  const project=cs=>cs.map(p=>p.x*Math.cos(angle)+p.y*Math.sin(angle)),ap=project(ac),bp=project(bc);
  if(Math.max(...ap)<Math.min(...bp)||Math.max(...bp)<Math.min(...ap))return false;
 }return true;
}
test('Factory shatters once before forward emergence; arrival never slows the players',()=>{
 const f=battle(),b=f.body;let lastY=-Infinity;
 for(let i=0;i<180;i++){
  f.addon.tick(.05,f.frame);assert.ok(b.y>=lastY);lastY=b.y;
  const nose=rotateMaan(0,-b.layout.height/2,b.hullYaw);
  if(b.entryAge<2.8)assert.ok(b.y+nose.y<b.workshop.openingY);
  if(b.entryAge<b.entryDuration){assert.equal(b.coreVulnerable,false);assert.ok([...b.parts.values()].every(p=>!p.hittable));}
 }
 step(f,.1);assert.ok(b.y-b.layout.height/2>b.workshop.openingY);
 assert.deepEqual(f.emitted.filter(e=>e.type==='maan-entry').map(e=>e.stage),['alarm','ignition','doors','reveal','engaged']);
 assert.equal(f.log.status.length,0);assert.equal(b.workshop.destroyedAt,2.8);
 assert.equal(f.emitted.filter(e=>e.type==='maan-workshop-collapse').length,1);
 const anchor={...b.workshop};destroy(f,'track-left');step(f,80);
 assert.deepEqual(b.workshop,anchor);
});
test('Scouts lead the Sinai reveal and cannot fire or take hits during the protected entrance',()=>{
 const f=battle('central'),b=f.body,e=f.addon.stages.encounter;step(f,2);
 const cars=[...e.bodies.values()].filter(c=>c.leader);
 for(const car of cars){assert.equal(car.hidden,false);assert.ok(car.y>b.y+b.layout.height/2);assert.equal(car.locateHit({x:car.x,y:car.y}),null);assert.equal(car.hit({damage:500}).damage,0);}
 assert.ok(!f.log.cues.some(c=>c.type==='muzzle'));step(f,7.2);
 assert.ok(cars.every(c=>c.coreVulnerable));
});
test('Mobile and PC ground vehicles remain disjoint during arrival, turns, damaged tracks and reinforcements',()=>{
 for(const width of [390,1280]){
  const f=battle('central'),b=f.body;f.frame.bounds={left:400-width/2,right:400+width/2,top:0,bottom:700};
  let launches=0;const distance=new Map(),previous=new Map();
  for(let i=0;i<3200;i++){
   if(i===400){destroy(f,'track-front-left');destroy(f,'track-front-right');destroy(f,'command');destroy(f,'tank');b.hp=b.maxHp*.35;}
   if(i===900){const car=[...b.encounter.bodies.values()].find(c=>c.leader&&!c.dead);f.addon.hit({bodyId:car.id,damage:1e6,faction:'central'});}
   for(const [slot,p] of f.frame.players.entries()){p.x=400+Math.sin(i*.014+slot)*250;p.y=350+Math.cos(i*.009+slot)*240;}
   // An aircraft's camera can move away from the fixed ground arena.
   if(i>200){f.frame.bounds.left+=.07;f.frame.bounds.right+=.07;f.frame.bounds.top-=.1;f.frame.bounds.bottom-=.1;}
   f.addon.tick(.05,f.frame);
   const cars=[...b.encounter.bodies.values()].filter(c=>c.leader&&!c.dead&&!c.hidden);launches=Math.max(launches,b.encounter.bodies.size);
   for(const car of cars){const p=previous.get(car.id);if(p)distance.set(car.id,(distance.get(car.id)||0)+Math.hypot(car.x-p.x,car.y-p.y));previous.set(car.id,{x:car.x,y:car.y});}
   for(const car of cars)assert.equal(overlaps(b,b.layout.width,b.layout.height,car,40,70),false,`${width}px hull/car overlap at ${i}`);
   for(let a=0;a<cars.length;a++)for(let c=a+1;c<cars.length;c++)assert.equal(overlaps(cars[a],40,70,cars[c],40,70),false,`${width}px car/car overlap at ${i}`);
  }
  assert.ok(launches>=5,'destroyed scouts are replaced and late reinforcement is exercised');
  assert.ok([...distance.values()].filter(d=>d>100).length>=2,'avoidance must allow real driving, not park every car');
 }
});
test('Every component hitbox and gun muzzle rotates with its hull; swept shots hit narrow parts',()=>{
 for(const team of ['entente','central']){const f=battle(team);step(f,9.1);const b=f.body;for(const a of [-.52,0,.48]){b.hullYaw=a;b.syncParts();for(const p of b.parts.values()){const r=rotateMaan(p.localX,p.localY,a);assert.ok(Math.abs(p.x-r.x)<1e-8);assert.ok(Math.abs(p.y-r.y)<1e-8);const s={x:b.x+p.x,y:b.y+p.y};assert.equal(b.locateHit(s)?.partId,p.id);const m=b.muzzle(p,p.localX<0?-1:p.localX>0?1:0);assert.ok(Number.isFinite(m.x)&&Number.isFinite(m.y));}const p=b.parts.get(b.kind==='wustenpanzer'?'heavy-gun':'lewis'),r=rotateMaan(p.localX,p.localY-100,a),r2=rotateMaan(p.localX,p.localY+100,a);assert.ok(b.locateHit({previousX:b.x+r.x,previousY:b.y+r.y,x:b.x+r2.x,y:b.y+r2.y}));}}
});
test('Wüstenpanzer cooling failure vents, track loss changes drive, engine loss slows it',()=>{
 const f=battle();step(f,9.1);destroy(f,'radiator');destroy(f,'track-left');step(f,8);assert.ok(f.body.hullYaw<Math.PI);assert.ok(f.emitted.some(e=>e.type==='hazard'&&e.visual==='wusten-steam'));destroy(f,'engine');step(f,1);assert.ok(f.body.driveVelocity<=7.5);destroy(f,'track-right');step(f,1);assert.equal(f.body.driveVelocity,0);f.body.hp=f.body.maxHp*.25;step(f,.1);assert.equal(f.body.phase,'cooling-runaway');assert.ok(f.body.parts.get('radiator').destroyed);
});
test('Wüstenpanzer pressure release opens the hull and walks artillery between siege shots',()=>{
 const f=battle();step(f,9.1);const b=f.body;
 let siege=0,walking=0;for(let i=0;i<40;i++){step(f,1.4);for(const e of f.emitted.splice(0))if(e.type==='maan-tactic'&&e.name==='siege-shot')siege++;else if(e.type==='maan-tactic'&&e.name==='walking-barrage')walking++;}
 assert.ok(siege>=1&&walking>=1,'alternating heavy-gun tactics');
 f.addon.hit({bodyId:b.id,partId:'radiator',damage:1e6,faction:'entente'});step(f,3);
 assert.ok(b.serviceWindow>0||b.heat>.7);
});
test('Destroyed Wüstenpanzer mounts never fire again; steam has a real warning and bounded duration',()=>{
 const f=battle();step(f,9.1);destroy(f,'heavy-gun');destroy(f,'sponson-left');const offset=f.log.cues.length;step(f,25);assert.ok(!f.log.cues.slice(offset).some(e=>e.type==='muzzle'&&['heavy-gun','sponson-left'].includes(e.partId)));destroy(f,'radiator');step(f,8);const vents=f.emitted.filter(e=>e.type==='hazard'&&e.visual==='wusten-steam');assert.ok(vents.length);assert.ok(vents.every(e=>e.warning>=1&&e.duration<=2));
});
test('Sinai uses staggered broadside, front/rear track imbalance, and command-dependent irregular fire',()=>{
 const f=battle('central');step(f,17);const shots=f.emitted.filter(e=>e.type==='hazard'&&e.visual==='sinai-impact');assert.ok(shots.length>=4);assert.ok(!shots.some(e=>e.visual==='wusten-steam'));destroy(f,'track-front-left');destroy(f,'track-front-right');const yaw=f.body.hullYaw;step(f,2);assert.equal(f.body.phase,'differential-drive');assert.notEqual(f.body.hullYaw,yaw);destroy(f,'command');step(f,1);assert.equal(f.body.phase,'command-disrupted');destroy(f,'tank');step(f,5);assert.ok(f.emitted.some(e=>e.type==='hazard'&&e.visual==='sinai-fire'));
});
test('Sinai corridor barrage leaves the announced central gap and stops with command',()=>{
 const f=battle('central');step(f,9.1);const p=f.frame.players[0];p.x=400;p.y=380;
 f.body.timers.set('corridor-barrage',.01);const start=f.emitted.length;step(f,.2);
 const lane={...f.body.duneLane};assert.ok(lane.width>=80);
 const shots=f.emitted.slice(start).filter(e=>e.visual==='sinai-impact'&&e.tag==='sinai-command');
 for(const h of shots)assert(Math.abs(h.x-lane.x)-h.radius>=lane.width/2-12,`impact ${h.x} inside escape lane ${lane.x}`);
 destroy(f,'command');f.body.timers.set('corridor-barrage',.01);const after=f.emitted.length;step(f,1);
 assert.equal(f.emitted.slice(after).filter(e=>e.tag==='sinai-command').length,0,'command loss cancels coordinated barrage');
});
test('Sinai escorts are independently hittable ground bodies, capped at three; support destruction stops launches',()=>{
 const f=battle('central');step(f,9.1);const e=f.addon.stages.encounter;assert.equal(e.bodies.size,3);const car=[...e.bodies.values()].find(b=>b.leader);assert.ok(car.locateHit({x:car.x,y:car.y}));f.addon.hit({bodyId:car.id,damage:1e6,faction:'central'});assert.ok(car.dead);step(f,19);assert.equal([...e.bodies.values()].filter(b=>b.leader&&!b.dead).length,2);destroy(f,'support');for(const b of e.bodies.values())if(b.leader){b.dead=true;b.hp=0;}step(f,30);assert.equal([...e.bodies.values()].filter(b=>b.leader&&!b.dead).length,0);
});
test('Pause freezes arrival and attacks; destroying hull cleans escorts and transitions once',()=>{
 const f=battle('central');f.frame.paused=true;step(f,5);assert.equal(f.body.entryAge,0);f.frame.paused=false;step(f,9.1);for(const p of f.body.parts.values())destroy(f,p.id);f.addon.hit({bodyId:f.body.id,damage:1e6,faction:'central'});assert.ok(f.addon.stages.encounter.completed);step(f,3,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.log.stages.length,1);
});
test('Production Ma’an paths exist and independent layouts retain opposite silhouettes',()=>{
 for(const name of ['terrain-maan.webp','maan-workshop.webp','boss-maan-wusten.webp','boss-maan-wusten-wreck.webp','boss-maan-sinai.webp','boss-maan-sinai-wreck.webp','boss-maan-rolls-royce.webp'])assert.ok(statSync(new URL('../'+name,import.meta.url)).size>1000);
 assert.notEqual(MAAN_LAYOUT.wustenpanzer.width,MAAN_LAYOUT['sinai-landship'].width);assert.equal(MAAN_LAYOUT['sinai-landship'].parts.filter(p=>p[5]==='track').length,4);assert.equal(MAAN_LAYOUT.wustenpanzer.parts.filter(p=>p[5]==='track').length,2);
 const lab=readFileSync(new URL('../test-lab.html',import.meta.url),'utf8');assert.ok(lab.includes('value="13"'));
});

test('Ma’an boss ground stays world-locked and covers the viewport',async()=>{
 const previous=globalThis.Image;globalThis.Image=class{constructor(){this.naturalWidth=724;this.naturalHeight=2172;this.complete=true;}};
 try{const {paintMaan}=await import('../maan-view.js?v=ui5');const g={stageBoss:{stages:{phase:'boss',bossId:'wustenpanzer',encounter:{id:'first'}}},distance:12000,stageStartDistance:0};
 const ys=[];const c={fillRect(){},save(){},restore(){},drawImage(...a){ys.push(a[2]);}};
 paintMaan(c,g,0,0,600,500);const start=Math.min(...ys);
 ys.length=0;paintMaan(c,g,0,-120,600,500);assert.equal(Math.min(...ys)-start,120);
 ys.length=0;paintMaan(c,g,0,0,600,500);assert.ok(ys.length>0&&Math.min(...ys)<=0&&Math.max(...ys)+2172>=500);
 }finally{if(previous)globalThis.Image=previous;else delete globalThis.Image;}
});
