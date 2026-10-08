import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,step} from './stageboss-fixture94.mjs';
import {contains} from '../headon-stageboss-hazards.js?v=raid4';
import {rotateMaan} from '../maan-layout.js?v=raid4';

function battle(team='entente',width=800){
 const f=fixture({teamFaction:team,stageIndex:13});f.frame.bounds={left:0,right:width,top:0,bottom:844};f.frame.players=[{id:'p1',alive:true,x:width/2,y:600,radius:12}];
 f.addon.startBoss({x:width/2,y:50});f.body=[...f.addon.stages.encounter.bodies.values()][0];f.events=[];
 for(const b of f.addon.stages.encounter.bodies.values()){const emit=b.emit;b.emit=e=>{f.events.push({...e,at:f.body.motionTime});emit(e);};}
 step(f,9.1);return f;
}
const destroy=(f,id)=>f.addon.hit({bodyId:f.body.id,partId:id,damage:1e6,faction:f.addon.stages.teamFaction});

test('Wüsten final cycle vents, fires three real gun shots, then stops every mount for a counterattack',()=>{
 const f=battle(),b=f.body;destroy(f,'radiator');b.hp=b.maxHp*.25;
 step(f,.1);assert.equal(b.pressureCycle.stage,'vent');const start=b.motionTime;
 step(f,2.65);assert.equal(f.events.filter(e=>e.type==='heavy-gun-fired').length,0);
 step(f,1.4);const shots=f.events.filter(e=>e.visual==='wusten-impact');assert.equal(shots.length,3);
 assert.ok(shots.every(e=>e.at>=start+2.7&&e.warning>=1.7));assert.ok(shots[1].at-shots[0].at>=.45);
 assert.equal(new Set(shots.map(e=>e.y)).size,3);
 step(f,2.6);assert.ok(b.serviceWindow>=3);const offset=f.events.length;
 step(f,2.5);assert.ok(b.serviceWindow>0);assert.equal(f.events.slice(offset).filter(e=>e.type==='hazard'||e.type==='muzzle').length,0);
 assert.equal(b.driveVelocity,0);assert.ok(f.events.some(e=>e.name==='overheat-service'));
});
test('Wüsten pending salvo respects main-gun destruction and final fallback only uses surviving side guns',()=>{
 const f=battle(),b=f.body;step(f,.3);assert.ok(b.heavyPlan);destroy(f,'heavy-gun');destroy(f,'sponson-left');destroy(f,'radiator');b.hp=b.maxHp*.25;
 const offset=f.events.length;step(f,8);const events=f.events.slice(offset);
 assert.equal(events.filter(e=>e.type==='heavy-gun-fired').length,0);
 assert.ok(!events.some(e=>e.type==='muzzle'&&['heavy-gun','sponson-left'].includes(e.partId)));
 assert.equal(events.filter(e=>e.visual==='wusten-impact').length,1);assert.ok(b.serviceWindow>0);
});
test('Wüsten steam leaves a real longitudinal dodge lane on mobile and PC at every hull angle',()=>{
 for(const width of [390,1280])for(const yaw of [0,.6,Math.PI]){
  const f=battle('entente',width),b=f.body;b.hullYaw=yaw;b.syncParts();destroy(f,'radiator');b.hp=b.maxHp*.25;step(f,.1);
  const vents=f.events.filter(e=>e.visual==='wusten-steam');assert.equal(vents.length,2);
  const r=b.parts.get('radiator');
  for(const y of [-80,0,80]){const q=rotateMaan(0,y,yaw),p={x:b.x+r.x+q.x,y:b.y+r.y+q.y,radius:12};assert.ok(vents.every(h=>!contains(h,p)));}
  assert.ok(vents.every(h=>h.warning>=1.15&&h.duration<=1.6));
 }
});
test('Wüsten retains nine independent parts; loss of every weapon leaves no invisible ring attacks',()=>{
 const f=battle(),b=f.body;assert.equal(b.parts.size,9);for(const p of b.parts.values())destroy(f,p.id);
 const offset=f.events.length;step(f,12);const events=f.events.slice(offset);
 assert.equal(b.driveVelocity,0);assert.ok(b.breached);
 assert.ok(!events.some(e=>e.kind==='projectile'||e.visual==='wusten-impact'||e.type==='muzzle'));
 assert.ok(events.some(e=>e.visual==='wusten-steam'));
});

test('Sinai prioritizes the approach flank and fires each of its four surviving side mounts in order',()=>{
 for(const side of [-1,1]){
  const f=battle('central'),b=f.body,q=rotateMaan(side*300,0,b.hullYaw);f.frame.players[0].x=b.x+q.x;f.frame.players[0].y=b.y+q.y;
  b.timers.set('broadside',.01);step(f,1.4);
  const shots=f.events.filter(e=>e.type==='muzzle'&&e.partId?.startsWith('sponson'));
  assert.equal(shots.length,4);assert.equal(new Set(shots.map(e=>e.partId)).size,4);
  assert.ok(shots.slice(0,2).every(e=>e.partId.includes(side<0?'left':'right')));
  for(let i=1;i<shots.length;i++)assert.ok(shots[i].at-shots[i-1].at>=.35);
 }
});
test('Sinai final alternates escort pressure and surviving-gun fire around a safe mobile/PC lane',()=>{
 for(const width of [390,1280]){
  const f=battle('central',width),b=f.body;b.hp=b.maxHp*.25;step(f,.1);const lane={...b.duneLane};assert.ok(b.encirclement);const start=b.motionTime;
  step(f,6.3);const artillery=f.events.filter(e=>e.visual==='sinai-impact');assert.ok(artillery.length>=2);
  assert.ok(f.events.some(e=>e.kind==='projectile'&&e.bossId!==b.id),'surviving escorts execute the final order using their production timer');
  assert.ok(artillery.filter(e=>!e.raidHeavy).every(e=>e.at>=start+2.1&&Math.abs(e.x-lane.x)-e.radius>=lane.width/2+12&&e.warning>=1.7));const finish=artillery.find(e=>e.raidHeavy);assert(finish&&finish.x===lane.x&&finish.at>=start+4&&finish.warning>=1.3&&finish.duration<.3);
  for(const h of f.events.filter(e=>e.kind==='projectile'))for(let i=0;i<=80;i++){
   const moving={...h,x:h.x+h.vx*i*.05,y:h.y+h.vy*i*.05};assert.ok(!contains(moving,{x:lane.x,y:lane.y+80,radius:12}),'escort rounds cannot seal the advertised central route');
  }
  assert.ok(b.serviceWindow>2.7);const offset=f.events.length;step(f,2);assert.ok(!f.events.slice(offset).some(e=>e.type==='hazard'));
 }
});
test('Sinai final never revives annihilated escorts; support destruction preserves existing cars and cancels launches',()=>{
 const f=battle('central'),b=f.body,cars=[...b.encounter.bodies.values()].filter(c=>c.leader);destroy(f,'support');assert.equal(cars.filter(c=>!c.dead).length,2);
 step(f,25);assert.equal([...b.encounter.bodies.values()].filter(c=>c.leader&&!c.dead).length,2);
 for(const car of cars)f.addon.hit({bodyId:car.id,damage:1e6,faction:'central'});b.hp=b.maxHp*.25;step(f,60);assert.equal([...b.encounter.bodies.values()].filter(c=>c.leader&&!c.dead).length,0);
 const intact=battle('central'),hull=intact.body;for(const car of hull.encounter.bodies.values())if(car.leader)intact.addon.hit({bodyId:car.id,damage:1e6,faction:'central'});
 hull.hp=hull.maxHp*.25;step(intact,60);assert.equal(hull.encounter.bodies.size,3,'intact support does not fabricate final escorts');
});
test('Sinai command loss interrupts a live encirclement and weakens rather than accelerates escort fire',()=>{
 const f=battle('central'),b=f.body;b.hp=b.maxHp*.25;step(f,2.6);assert.ok(b.encirclement);destroy(f,'command');assert.equal(b.encirclement,null);assert.equal(b.escortOrder,'withdraw');
 const remaining=[];f.addon.hazards.pool.visit(h=>remaining.push(h));assert.ok(!remaining.some(h=>h.tag==='sinai-command'));
 step(f,7.2);assert.ok(b.encirclement?.disrupted);assert.ok(b.encirclement.guns.length<=2);
 const offset=f.events.length;step(f,6.4);assert.ok(!f.events.slice(offset).some(e=>e.kind==='projectile'),'disrupted escort cooperation is withdrawn in the final');
});
test('Sinai retains twelve parts and all four track failures reduce mobility; fuel slows the hull and every disabled gun stops',()=>{
 const make=()=>{const f=battle('central');for(const key of ['broadside','corridor-barrage'])f.body.timers.set(key,1000);return f;};
 const drive=f=>{let distance=0;for(let i=0;i<60;i++){const x=f.body.x,y=f.body.y;step(f,.05);distance+=Math.hypot(f.body.x-x,f.body.y-y);}return distance;};
 const base=make(),baseline=drive(base);assert.equal(base.body.parts.size,12);
 for(const id of ['track-front-left','track-front-right','track-rear-left','track-rear-right','tank']){const f=make();destroy(f,id);assert.ok(drive(f)<baseline,id+' must reduce actual travel');}
 const f=battle('central');for(const id of ['lewis','sponson-left-front','sponson-right-front','sponson-left-rear','sponson-right-rear'])destroy(f,id);
 const offset=f.events.length;step(f,20);assert.ok(!f.events.slice(offset).some(e=>e.visual==='sinai-impact'||(e.type==='muzzle'&&e.bossId===f.body.id)));
});

test('Each individual Ma’an weapon remains destroyed and silent through later cycles while the other mounts keep fighting',()=>{
 for(const team of ['entente','central'])for(const id of team==='entente'?['heavy-gun','sponson-left','sponson-right','aa-left','aa-right']:['sponson-left-front','sponson-right-front','sponson-left-rear','sponson-right-rear','lewis']){
  const f=battle(team);destroy(f,id);const offset=f.events.length;step(f,22);const events=f.events.slice(offset).filter(e=>e.type==='muzzle'&&e.bossId===f.body.id);
  assert.ok(!events.some(e=>e.partId===id),id+' cannot fire after destruction');assert.ok(events.length>0,'other surviving mounts must continue fighting');assert.ok(f.body.parts.get(id).destroyed);
 }
});
