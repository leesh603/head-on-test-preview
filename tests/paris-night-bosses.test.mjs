import test from 'node:test';
import assert from 'node:assert/strict';
import {BossEncounter} from '../headon-stageboss-core.js';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {ParisSearchlightFortress,ParisStaakenRVI,PARIS_FORTRESS_PARTS,PARIS_STAAKEN_PARTS} from '../paris-night-bosses.js';

const tuning={maxHp:1000,partHp:90,damage:18,bulletSpeed:220,geometryScale:1};
function fixture(Ctor){
  const events=[],hits=[],statuses=[],hazards=new BossHazards({onDamage:(...args)=>hits.push(args),onStatus:(...args)=>statuses.push(args),onBarrierContact:()=>{}});
  const body=new Ctor({id:'paris:body',tuning,x:400,y:180,faction:Ctor===ParisStaakenRVI?'central':'entente',emit:e=>{
    events.push(e);if(e.type==='hazard')hazards.spawn({...e,encounterId:'paris'});
    if(e.type==='cancel-hazards')hazards.clearTagged('paris',e.tag);
  }});
  const encounter=new BossEncounter({id:'paris',bossId:body.kind,bodies:[body]});
  const frame={players:[{id:'p',x:400,y:610,vx:0,vy:0,radius:12,alive:true}],bounds:{left:0,right:800,top:0,bottom:900},parisTargets:[{id:'west',x:270,y:460,hp:120,maxHp:120},{id:'east',x:535,y:520,hp:120,maxHp:120}],isIlluminated:p=>hazards.isIlluminated(p)};
  return{body,encounter,events,hazards,frame,hits,statuses};
}
function step(f,seconds,ctx=f.frame){for(let i=0;i<Math.ceil(seconds/.02);i++){f.encounter.update(.02,ctx);f.hazards.update(.02,ctx);}}
const destroy=(f,id)=>f.body.hit({partId:id,damage:1000});
const shots=f=>f.events.filter(e=>e.type==='hazard'&&e.kind==='projectile');

test('Paris mounts are independent, scaled, and isolated from legacy boss classes',()=>{
  for(const [Ctor,parts] of [[ParisSearchlightFortress,PARIS_FORTRESS_PARTS],[ParisStaakenRVI,PARIS_STAAKEN_PARTS]]){
    const f=fixture(Ctor);assert.equal(f.body.parts.size,parts.length);assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
    assert.ok(f.body.ownsMotion129);for(const p of parts)assert.ok(f.body.parts.has(p.id));
    assert.throws(()=>new Ctor({id:'bad',tuning:{...tuning,damage:0}}),/Current boss tuning/);
  }
});

test('Scaled Staaken core collision follows the smaller wing and fuselage silhouette',()=>{
 const body=new ParisStaakenRVI({id:'mobile',tuning:{...tuning,geometryScale:.5},x:0,y:0});
 body.a=-Math.PI/2;body.coreVulnerable=true;for(const p of body.parts.values())p.hp=0;
 assert.deepEqual(body.locateHit({x:100,y:-32}),{partId:null});
 assert.equal(body.locateHit({x:100,y:-64}),null);assert.equal(body.locateHit({x:0,y:100}),null);
});

test('Fortress plays a warned four-beat phrase, then a safe amplified core opening',()=>{
  const f=fixture(ParisSearchlightFortress),before=JSON.stringify(f.frame.players);
  assert.equal(f.body.hit({damage:100}).blocked,true);step(f,4.22);
  const beams=f.events.filter(e=>e.kind==='searchlight');assert.equal(f.events.filter(e=>e.type==='paris-light-beat').length,4);
  assert.ok(beams.length>=8);assert.ok(beams.every(e=>e.warning>=.65&&e.damage===0&&Math.abs(e.angularSpeed)>0));
  assert.equal(f.body.phase,'cooldown');assert.ok(f.body.coreVulnerable);assert.equal(f.hazards.pool.count,0);
  assert.equal(f.body.hit({damage:100}).damage,145);const count=f.events.length;step(f,2);
  assert.equal(f.events.slice(count).filter(e=>e.type==='hazard').length,0);assert.equal(JSON.stringify(f.frame.players),before);
  step(f,.6);assert.equal(f.body.phase,'scan');assert.equal(f.body.coreVulnerable,false);
});

test('Fortress detection triggers concentrated flak and MG only while lit',()=>{
  const dark=fixture(ParisSearchlightFortress),lit=fixture(ParisSearchlightFortress);
  step(dark,2,{...dark.frame,isIlluminated:()=>false});step(lit,2,{...lit.frame,isIlluminated:()=>true});
  assert.equal(shots(dark).length,0);assert.ok(shots(lit).length>=20);
  assert.ok(lit.events.some(e=>e.visual==='black-flak'&&e.damage>tuning.damage));
  assert.ok(lit.events.some(e=>e.type==='paris-light-lock'));
});

test('Actual searchlight geometry marks a player and provokes fire through the hazard adapter',()=>{
  const f=fixture(ParisSearchlightFortress);step(f,.02);
  const beam=f.events.find(e=>e.kind==='searchlight');const angle=beam.angle+beam.angularSpeed*.25;
  Object.assign(f.frame.players[0],{x:beam.x+Math.cos(angle)*280,y:beam.y+Math.sin(angle)*280});step(f,1);
  assert.ok(f.statuses.some(([,status])=>status.type==='searchlight'));assert.ok(f.events.some(e=>e.type==='paris-light-lock'));
});

test('Every fortress mount changes the encounter and remains as a destroyed part',()=>{
  const f=fixture(ParisSearchlightFortress);
  destroy(f,'light-nw');step(f,1);assert.ok(!f.events.some(e=>e.tag===f.body.id+':light-nw'&&e.type==='hazard'));
  destroy(f,'aa-left');destroy(f,'mg-right');const count=f.events.length;
  step(f,1,{...f.frame,isIlluminated:()=>true});assert.ok(!f.events.slice(count).some(e=>e.type==='muzzle'&&['aa-left','mg-right'].includes(e.partId)));
  destroy(f,'generator');assert.equal(f.body.phase,'cooldown');step(f,3.5);assert.equal(f.body.phase,'cooldown');step(f,.7);
  const after=f.events.length;step(f,4.3);assert.ok(!f.events.slice(after).some(e=>e.type==='hazard'&&e.tag===f.body.id+':light-main'));
  destroy(f,'command');assert.equal(f.body.coreVulnerable,true);
  for(const id of ['light-ne','light-sw','light-se','light-main'])destroy(f,id);
  step(f,10);assert.equal(f.body.phase,'cooldown');assert.equal(f.body.parts.size,11);assert.ok(f.body.parts.get('generator').destroyed);
});

test('Staaken schedules real district bombs, flies toward them, and leaves city damage to the host',()=>{
  const f=fixture(ParisStaakenRVI),before=JSON.stringify(f.frame.parisTargets),start={x:f.body.x,y:f.body.y};step(f,32);
  assert.ok(f.events.some(e=>e.type==='city-bomb-warning'&&e.seconds===8));const bombs=f.events.filter(e=>e.type==='city-bomb');assert.ok(bombs.length>=2);
  assert.ok(bombs.every(e=>e.damage===32&&e.seconds===1.3&&f.frame.parisTargets.some(t=>t.id===e.targetId)));
  assert.notDeepEqual({x:f.body.x,y:f.body.y},start);assert.equal(JSON.stringify(f.frame.parisTargets),before);
  assert.ok(f.events.some(e=>e.airborneBomb&&e.sourceX!=null&&e.sourceY!=null));
});

test('Four engines change speed and run time; asymmetric losses produce yaw',()=>{
  const f=fixture(ParisStaakenRVI);step(f,2.2);assert.ok(f.body.runTarget);const before=f.body.runRemaining;
  destroy(f,'engine-0');step(f,1);assert.equal(f.body.currentSpeed,84);assert.ok(Math.abs((before-f.body.runRemaining)-.8)<.05);
  destroy(f,'engine-1');step(f,.1);assert.equal(f.body.currentSpeed,65.1);assert.ok(Math.abs(f.body.hullYaw)>.1);assert.equal(f.body.coreVulnerable,true);
  destroy(f,'engine-2');step(f,.1);assert.equal(f.body.currentSpeed,45.15);destroy(f,'engine-3');assert.equal(f.body.phase,'gliding');assert.equal(f.body.runTarget,null);
  assert.ok(f.events.some(e=>e.type==='city-bomb-abort'));const bombCount=f.events.filter(e=>e.type==='city-bomb').length;
  step(f,6.1);assert.equal(f.body.dead,true);assert.equal(f.events.filter(e=>e.type==='city-bomb').length,bombCount);
});

test('Distant city targets keep a real distance/speed estimate after payload arming expires',()=>{
  const f=fixture(ParisStaakenRVI);f.frame.parisTargets=[{id:'distant',x:2600,y:800,hp:120,maxHp:120}];step(f,2.2);
  assert.ok(f.body.runRemaining>8);const fullEngineETA=f.body.runRemaining/f.body.speedRatio();
  destroy(f,'engine-0');step(f,.02);assert.ok(f.body.runRemaining/f.body.speedRatio()>fullEngineETA*1.2);
  step(f,10);assert.equal(f.body.armingWork,0);assert.ok(f.body.runRemaining>0);
  const distance=Math.max(0,Math.hypot(f.body.runTarget.x-f.body.x,f.body.runTarget.y-f.body.y)-210);
  assert.ok(Math.abs(f.body.runRemaining/f.body.speedRatio()-distance/f.body.currentSpeed)<1e-8);
  assert.equal(f.events.filter(e=>e.type==='city-bomb').length,0);
});

test('Staaken bomb-bay damage weakens bombing and destruction cancels the current run',()=>{
  const f=fixture(ParisStaakenRVI);step(f,2.2);f.body.hit({partId:'bomb-bay',damage:45});assert.ok(f.events.some(e=>e.type==='paris-bomb-weakened'&&e.strength===.5));
  step(f,12);const bombs=f.events.filter(e=>e.type==='city-bomb');assert.ok(bombs.length);assert.equal(bombs[0].damage,16);
  step(f,7);destroy(f,'bomb-bay');assert.equal(f.body.phase,'payload-lost');assert.equal(f.body.coreVulnerable,true);
  const count=f.events.filter(e=>e.type==='city-bomb').length;step(f,25);assert.equal(f.events.filter(e=>e.type==='city-bomb').length,count);
  assert.ok(f.events.some(e=>e.type==='cancel-hazards'&&e.tag===f.body.id+':bomb-bay'));
});

test('Destroying all gun arcs creates a bullet-free approach; rotated mounts stay on the hull',()=>{
  const f=fixture(ParisStaakenRVI);f.body.a=-Math.PI/2;f.body.rotateMounts();
  f.frame.players[0].x=f.body.x;f.frame.players[0].y=f.body.y-400;f.body.gunfire(2,f.frame.players);
  assert.ok(shots(f).length>0);for(const p of [...f.body.parts.values()])if(p.kind==='gun')destroy(f,p.id);
  const count=shots(f).length;step(f,12);assert.equal(shots(f).length,count);
  const p=f.body.parts.get('engine-0');assert.ok(Math.abs(Math.hypot(p.x,p.y)-Math.hypot(p.localX,p.localY))<1e-8);
  assert.equal(f.body.parts.size,10);assert.ok([...f.body.parts.values()].filter(p=>p.kind==='gun').every(p=>p.destroyed));
});

test('Boss attacks are bounded over a long fight, player frames remain unchanged',()=>{
  for(const Ctor of [ParisSearchlightFortress,ParisStaakenRVI]){const f=fixture(Ctor),before=JSON.stringify(f.frame.players);step(f,120);
    assert.ok(f.hazards.pool.count<=512);assert.equal(JSON.stringify(f.frame.players),before);assert.ok(f.events.length<5000);
  }
});
