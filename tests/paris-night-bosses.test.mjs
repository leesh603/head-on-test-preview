import test from 'node:test';
import assert from 'node:assert/strict';
import {BossEncounter} from '../headon-stageboss-core.js';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {ParisSearchlightFortress,ParisStaakenRVI,PARIS_FORTRESS_PARTS,PARIS_STAAKEN_PARTS,PARIS_FORTRESS_LAYOUT,PARIS_STAAKEN_LAYOUT} from '../paris-night-bosses.js';

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
const destroyLights=f=>{for(const p of f.body.parts.values())if(p.kind==='searchlight')destroy(f,p.id);};

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
 assert.deepEqual(body.locateHit({x:200,y:-66}),{partId:null});
 assert.equal(body.locateHit({x:200,y:-120}),null);assert.equal(body.locateHit({x:0,y:170}),null);
});

test('Large source-art layout is shared and injected coordinates preserve a single nearest-part route',()=>{
 assert.equal(PARIS_FORTRESS_LAYOUT.width,1180);assert.equal(PARIS_FORTRESS_LAYOUT.height,879);
 assert.equal(PARIS_STAAKEN_LAYOUT.width,1120);assert.equal(PARIS_STAAKEN_LAYOUT.height,630);
 for(const reverse of [false,true]){
  const parts=PARIS_FORTRESS_PARTS.map(p=>({...p,...p.id==='light-nw'?{x:0,y:0,radius:60}:p.id==='light-ne'?{x:15,y:0,radius:40}:{}}));
  const body=new ParisSearchlightFortress({id:'overlap',tuning,layout:{...PARIS_FORTRESS_LAYOUT,parts:reverse?parts.reverse():parts},x:0,y:0});
  assert.deepEqual(body.locateHit({x:13,y:0}),{partId:'light-ne'});
  const before=body.parts.get('light-nw').hp,result=body.hitAt({x:13,y:0,damage:12});
  assert.equal(result.partId,'light-ne');assert.equal(body.parts.get('light-ne').hp,78);assert.equal(body.parts.get('light-nw').hp,before);assert.equal(body.hp,body.maxHp);
 }
});

test('Destroying command cannot bypass rhythm and one impact never damages command and core together',()=>{
 const f=fixture(ParisSearchlightFortress),command=f.body.parts.get('command');
 const attack={x:f.body.x+command.x,y:f.body.y+command.y,damage:1000};
 const partHit=f.body.hitAt(attack);assert.equal(partHit.partId,'command');assert.equal(f.body.hp,f.body.maxHp);
 assert.equal(f.body.coreVulnerable,false);assert.equal(f.body.hitAt(attack).damage,0);
 step(f,f.body.scanSeconds()+.04);const coreHit=f.body.hitAt({...attack,damage:100});assert.equal(coreHit.partId,undefined);assert.equal(coreHit.damage,170);
 step(f,f.body.openingSeconds()+.04);assert.equal(f.body.coreVulnerable,false);assert.equal(f.body.hitAt(attack).damage,0);
});

test('Fortress plays a warned four-beat phrase, then a safe amplified core opening',()=>{
  const f=fixture(ParisSearchlightFortress),before=JSON.stringify(f.frame.players);
  assert.equal(f.body.hit({damage:100}).blocked,true);step(f,f.body.scanSeconds()+.04);
  const beams=f.events.filter(e=>e.kind==='searchlight');assert.equal(f.events.filter(e=>e.type==='paris-light-beat').length,4);
  assert.ok(beams.length>=8);assert.ok(beams.every(e=>e.warning===1.15&&e.duration>=1.4&&e.duration<=1.8&&e.damage===0&&Math.abs(e.angularSpeed)===.42));
  assert.equal(f.body.phase,'cooldown');assert.ok(f.body.coreVulnerable);assert.equal(f.hazards.pool.count,0);
  assert.equal(f.body.hit({damage:100}).damage,170);const count=f.events.length;step(f,2.6);
  assert.equal(f.events.slice(count).filter(e=>e.type==='hazard').length,0);assert.equal(JSON.stringify(f.frame.players),before);
  step(f,.3);assert.equal(f.body.phase,'scan');assert.equal(f.body.coreVulnerable,false);
});

test('Fortress detection triggers concentrated flak and MG only while lit',()=>{
  const dark=fixture(ParisSearchlightFortress),lit=fixture(ParisSearchlightFortress);
  step(dark,2,{...dark.frame,isIlluminated:()=>false});step(lit,2,{...lit.frame,isIlluminated:()=>true});
  assert.equal(shots(dark).length,0);assert.ok(shots(lit).length>=20);
  assert.ok(lit.events.some(e=>e.visual==='black-flak'&&e.damage>tuning.damage));
  assert.ok(lit.events.some(e=>e.type==='paris-light-lock'));
});

test('Fortress searches all four quadrants and covers both co-op players with real beam detection',()=>{
 for(const [dx,dy] of [[0,-950],[950,0],[0,950],[-950,0]]){
  const f=fixture(ParisSearchlightFortress);Object.assign(f.frame.players[0],{x:f.body.x+dx,y:f.body.y+dy});step(f,1.8);
  assert.ok(f.statuses.some(([,status])=>status.type==='searchlight'),JSON.stringify([dx,dy]));
  assert.ok(f.events.some(e=>e.type==='paris-light-lock'),JSON.stringify([dx,dy]));
 }
 const f=fixture(ParisSearchlightFortress);f.frame.players=[{id:'p1',alive:true,x:400,y:-800},{id:'p2',alive:true,x:400,y:1100}];step(f,1.8);
 assert.ok(f.events.some(e=>e.type==='paris-light-lock'&&e.targetId==='p1'));assert.ok(f.events.some(e=>e.type==='paris-light-lock'&&e.targetId==='p2'));
});

test('A brief exposure produces strong two-second pursuit after the player leaves the light',()=>{
 const f=fixture(ParisSearchlightFortress);step(f,.02,{...f.frame,isIlluminated:()=>true});
 const initial=shots(f).length;assert.ok(initial>=12);assert.ok(f.events.some(e=>e.visual==='black-flak'&&e.warning<=.2));
 step(f,1.8,{...f.frame,isIlluminated:()=>false});assert.ok(shots(f).length>initial+24);
 step(f,.4,{...f.frame,isIlluminated:()=>false});const stopped=shots(f).length;
 step(f,1,{...f.frame,isIlluminated:()=>false});assert.equal(shots(f).length,stopped);assert.equal(f.body.locks.size,0);
});

test('Actual searchlight geometry marks a player and provokes fire through the hazard adapter',()=>{
  const f=fixture(ParisSearchlightFortress);step(f,.02);
  const beam=f.events.find(e=>e.kind==='searchlight');const angle=beam.angle+beam.angularSpeed*.25;
  Object.assign(f.frame.players[0],{x:beam.x+Math.cos(angle)*280,y:beam.y+Math.sin(angle)*280});step(f,1.5);
  assert.ok(f.statuses.some(([,status])=>status.type==='searchlight'));assert.ok(f.events.some(e=>e.type==='paris-light-lock'));
});

test('destroying the final AA batteries lets DrI follow the complete light corridor without spending a roll',()=>{
 for(const adapter of ['velocity','heading-only']){
 const f=fixture(ParisSearchlightFortress),p=f.frame.players[0];destroy(f,'aa-left');destroy(f,'aa-right');
 Object.assign(f.body,{x:800,y:700});Object.assign(p,{x:800,y:980,vx:0,vy:-120});
 f.frame.bounds={left:0,right:2000,top:0,bottom:2000};
 let heading=-Math.PI/2,want=Math.PI,lastBeat=-1,maxTurn=0,maxSpeed=0,maxRange=0;
 for(let time=0;time<f.body.scanSeconds()+.1;time+=.01){
  // Standard turn/forward flight only: use the common diagonal corridor
  // signposted by each warning, then turn toward command after lights end.
  const beat=Math.min(3,Math.floor(time/f.body.beatSeconds()));
  if(beat!==lastBeat){want=Math.PI*1.25+beat*Math.PI/2;lastBeat=beat;}
  if(time>f.body.beatSeconds()*3+f.body.warningSeconds()+f.body.activeSeconds()+.025)want=Math.atan2(f.body.y+190-p.y,f.body.x-p.x);
  const error=Math.atan2(Math.sin(want-heading),Math.cos(want-heading));
  const turn=Math.max(-3.8*.01,Math.min(3.8*.01,error));heading+=turn;maxTurn=Math.max(maxTurn,Math.abs(turn)/.01);
  p.vx=Math.cos(heading)*120;p.vy=Math.sin(heading)*120;p.x+=p.vx*.01;p.y+=p.vy*.01;
  maxSpeed=Math.max(maxSpeed,Math.hypot(p.vx,p.vy));
  maxRange=Math.max(maxRange,Math.hypot(p.x-f.body.x,p.y-f.body.y));
  if(adapter==='heading-only'){p.a=heading;p.vx=0;p.vy=0;}
  f.encounter.update(.01,f.frame);f.hazards.update(.01,f.frame);
  assert.ok(p.x>=0&&p.x<=2000&&p.y>=0&&p.y<=2000);
 }
 assert.equal(f.events.filter(e=>e.type==='paris-light-beat').length,4);
 assert.ok(maxSpeed<=120+1e-9&&maxTurn<=3.8+1e-9);
 assert.ok(maxRange<600,'The escape route stays in attack range of the fortress');
 assert.equal(f.statuses.length,0,'No beam may illuminate the normal-flight corridor');
 assert.equal(f.hits.length,0,'Actual hazard damage callbacks must stay empty without immunity');
 assert.equal(f.events.filter(e=>e.type==='paris-light-lock').length,0);
 assert.equal(f.body.phase,'cooldown');assert.ok(f.body.coreVulnerable);assert.equal(f.hazards.pool.count,0);
 assert.ok(Math.hypot(p.x-f.body.x,p.y-f.body.y-190)<140,'Normal flight returns to command before the attack window');
 }
});

test('Every fortress mount changes the encounter and remains as a destroyed part',()=>{
  const f=fixture(ParisSearchlightFortress);
  destroy(f,'light-nw');step(f,1);assert.ok(!f.events.some(e=>e.tag===f.body.id+':light-nw'&&e.type==='hazard'));
  destroy(f,'aa-left');destroy(f,'mg-right');const count=f.events.length;
  step(f,1,{...f.frame,isIlluminated:()=>true});assert.ok(!f.events.slice(count).some(e=>e.type==='muzzle'&&['aa-left','mg-right'].includes(e.partId)));
  destroy(f,'generator-left');assert.equal(f.body.phase,'scan');assert.equal(f.body.generators(),1);assert.equal(f.body.openingSeconds(),3.8);
  destroy(f,'generator-right');assert.equal(f.body.phase,'cooldown');step(f,4.7);assert.equal(f.body.phase,'cooldown');step(f,.3);
  const after=f.events.length;step(f,f.body.scanSeconds()+.04);assert.ok(!f.events.slice(after).some(e=>e.type==='hazard'&&e.tag===f.body.id+':light-main'));
  step(f,5);destroy(f,'command');assert.equal(f.body.coreVulnerable,false);assert.equal(f.body.hit({damage:100}).blocked,true);
  for(const id of ['light-ne','light-sw','light-se','light-main'])destroy(f,id);
  step(f,10);assert.equal(f.body.phase,'last-stand');assert.equal(f.body.parts.size,12);assert.ok(f.body.parts.get('generator-left').destroyed);assert.ok(f.body.parts.get('generator-right').destroyed);
});

test('All lights destroyed immediately opens a persistent last stand, including during normal blackout',()=>{
 for(const inOpening of [false,true]){
  const f=fixture(ParisSearchlightFortress);if(inOpening)step(f,f.body.scanSeconds()+.02);
  destroyLights(f);assert.equal(f.body.phase,'last-stand');assert.ok(f.body.coreVulnerable);
  assert.ok(f.events.some(e=>e.type==='phase-change'&&e.phase==='last-stand'));
  assert.equal(f.hazards.pool.count,0);assert.equal(f.body.hit({damage:100}).damage,170);
  const after=f.events.length;step(f,10);const attacks=f.events.slice(after).filter(e=>e.type==='hazard');
  assert.ok(attacks.some(e=>e.visual==='aa-flak'&&e.warning===.8));assert.ok(attacks.some(e=>e.kind==='projectile'&&e.warning===.65));
  assert.ok(attacks.every(e=>e.partId&&e.tag===f.body.id+':'+e.partId&&e.sourceX!=null&&e.sourceY!=null&&e.damage<tuning.damage));
  assert.ok(!attacks.some(e=>e.kind==='searchlight'));assert.equal(f.body.phase,'last-stand');
  const count=attacks.length;step(f,5);assert.ok(f.events.slice(after).filter(e=>e.type==='hazard').length>count);
  destroy(f,'generator-left');destroy(f,'generator-right');assert.equal(f.body.phase,'last-stand');
 }
});

test('Last-stand gun destruction cancels warned shells and suppresses only that source',()=>{
 const f=fixture(ParisSearchlightFortress);destroyLights(f);step(f,.4);
 const tag=f.body.id+':aa-left';let pending=0;f.hazards.pool.visit(h=>{if(h.tag===tag&&h.phase==='warning')pending++;});assert.equal(pending,1);
 destroy(f,'aa-left');destroy(f,'mg-right');f.hazards.pool.visit(h=>assert.notEqual(h.tag,tag));
 assert.ok(f.events.some(e=>e.type==='cancel-hazards'&&e.tag===tag));const after=f.events.length;step(f,10);
 const attacks=f.events.slice(after).filter(e=>e.type==='hazard');
 assert.ok(attacks.some(e=>e.partId==='aa-right'));assert.ok(attacks.some(e=>e.partId==='mg-left'));
 assert.ok(!f.events.slice(after).some(e=>['aa-left','mg-right'].includes(e.partId)&&['hazard','muzzle'].includes(e.type)));
});

test('Outer lights and both generators disabled enter last stand in either order with main lamp intact',()=>{
 const outer=['light-nw','light-ne','light-sw','light-se'],power=['generator-left','generator-right'];
 for(const order of [[...outer,...power],[...power,...outer]]){
  const f=fixture(ParisSearchlightFortress);assert.equal(f.body.functioningLights(),5);
  for(const id of order.slice(0,-1))destroy(f,id);
  assert.ok(f.body.functioningLights()>0);assert.notEqual(f.body.phase,'last-stand');
  const before=f.events.length;destroy(f,order.at(-1));
  assert.equal(f.body.functioningLights(),0);assert.equal(f.body.phase,'last-stand');assert.ok(f.body.coreVulnerable);
  assert.equal(f.body.parts.get('light-main').destroyed,false);assert.equal(f.body.parts.get('light-main').hp,tuning.partHp);
  assert.ok(f.events.slice(before).some(e=>e.type==='cancel-hazards'&&e.tag===f.body.id+':light-main'));
  assert.deepEqual(f.events.slice(before).filter(e=>e.type==='phase-change').map(e=>e.phase),['last-stand']);
  step(f,8);assert.ok(f.events.slice(before).some(e=>e.type==='hazard'&&e.partId==='aa-left'));
  assert.ok(!f.events.slice(before).some(e=>e.kind==='searchlight'));assert.equal(f.body.phase,'last-stand');
 }
});

test('Destroying all remaining guns is a real disarm reward with no hidden attacks',()=>{
 const f=fixture(ParisSearchlightFortress);destroyLights(f);step(f,4);
 assert.ok(f.hazards.pool.count>0);for(const id of ['aa-left','aa-right','mg-left','mg-right'])destroy(f,id);
 assert.equal(f.hazards.pool.count,0);const after=f.events.length;step(f,30);
 assert.ok(!f.events.slice(after).some(e=>e.type==='hazard'||e.type==='muzzle'));
 assert.equal(f.body.phase,'last-stand');assert.ok(f.body.coreVulnerable);assert.equal(f.body.hit({damage:100}).damage,170);
});

test('Last stand pauses without advancing weapons and waits for a living target',()=>{
 const f=fixture(ParisSearchlightFortress);destroyLights(f);f.frame.players[0].alive=false;
 const after=f.events.length,left=f.body.lastStandIn;step(f,10);assert.equal(f.body.lastStandIn,left);assert.equal(f.events.length,after);
 f.frame.players[0].alive=true;step(f,.4);const timer=f.body.lastStandIn,events=f.events.length,ages=[];f.hazards.pool.visit(h=>ages.push(h.age));
 step(f,5,{...f.frame,paused:true});assert.equal(f.body.lastStandIn,timer);assert.equal(f.events.length,events);
 const pausedAges=[];f.hazards.pool.visit(h=>pausedAges.push(h.age));assert.deepEqual(pausedAges,ages);
 step(f,2);assert.ok(f.events.length>events);assert.equal(f.body.phase,'last-stand');
});

test('Last stand rotates cooperative targets without increasing weapon density',()=>{
 const f=fixture(ParisSearchlightFortress);f.body.t={...f.body.t,projectileDensity:20};
 f.frame.players=[{id:'p1',x:300,y:600,alive:true,radius:12},{id:'p2',x:500,y:600,alive:true,radius:12},{id:'dead',x:400,y:600,alive:false}];
 destroyLights(f);let peak=0;for(let i=0;i<6000;i++){f.encounter.update(.02,f.frame);f.hazards.update(.02,f.frame);peak=Math.max(peak,f.hazards.pool.count);}
 const attacks=f.events.filter(e=>e.type==='hazard');assert.ok(peak<=12);assert.ok(attacks.length<300);
 for(const id of ['aa-left','aa-right','mg-left','mg-right'])for(const targetId of ['p1','p2'])assert.ok(attacks.some(e=>e.partId===id&&e.targetId===targetId));
 assert.ok(attacks.every(e=>e.targetId!=='dead'));assert.equal(f.body.phase,'last-stand');
});

test('Warned last-stand AA punishes standing still while normal forward flight clears the impacts',()=>{
 const still=fixture(ParisSearchlightFortress),moving=fixture(ParisSearchlightFortress);destroyLights(still);destroyLights(moving);
 step(still,1.45);for(let i=0;i<73;i++){
  moving.frame.players[0].x+=120*.02;moving.frame.players[0].vx=120;moving.encounter.update(.02,moving.frame);moving.hazards.update(.02,moving.frame);
 }
 assert.ok(still.hits.some(([,damage,h])=>h.visual==='aa-flak'&&damage>0));assert.equal(moving.hits.length,0);
 assert.ok(still.events.filter(e=>e.type==='hazard'&&e.partId==='aa-left').every(e=>e.radius===32&&e.warning===.8&&e.damage===tuning.damage*.65));
});

test('Staaken schedules real district bombs, flies toward them, and leaves city damage to the host',()=>{
  const f=fixture(ParisStaakenRVI),before=JSON.stringify(f.frame.parisTargets),start={x:f.body.x,y:f.body.y};step(f,32);
  assert.ok(f.events.some(e=>e.type==='city-bomb-warning'&&e.seconds===8));const bombs=f.events.filter(e=>e.type==='city-bomb');assert.ok(bombs.length>=2);
  assert.ok(bombs.every(e=>e.damage===16&&e.rackId.startsWith('bomb-bay-')&&e.seconds===1.3&&f.frame.parisTargets.some(t=>t.id===e.targetId)));
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

test('Staaken racks weaken and cancel their own payload; both destroyed stop the run',()=>{
  const f=fixture(ParisStaakenRVI);step(f,2.2);f.body.hit({partId:'bomb-bay-left',damage:45});assert.ok(f.events.some(e=>e.type==='paris-bomb-weakened'&&e.strength===.75));
  step(f,12);const bombs=f.events.filter(e=>e.type==='city-bomb');assert.ok(bombs.length);assert.equal(bombs.find(e=>e.rackId==='bomb-bay-left').damage,8);assert.equal(bombs.find(e=>e.rackId==='bomb-bay-right').damage,16);
  step(f,7);destroy(f,'bomb-bay-left');assert.equal(f.body.payloadStrength(),.5);assert.equal(f.body.coreVulnerable,false);
  assert.ok(f.events.some(e=>e.type==='city-bomb-rack-abort'&&e.rackId==='bomb-bay-left'));
  const before=f.events.length;step(f,18);assert.ok(f.events.slice(before).some(e=>e.type==='city-bomb'&&e.rackId==='bomb-bay-right'&&e.damage===16));
  assert.ok(!f.events.slice(before).some(e=>e.type==='city-bomb'&&e.rackId==='bomb-bay-left'));
  destroy(f,'bomb-bay-right');assert.equal(f.body.phase,'payload-lost');assert.equal(f.body.coreVulnerable,true);
  const count=f.events.filter(e=>e.type==='city-bomb').length;step(f,25);assert.equal(f.events.filter(e=>e.type==='city-bomb').length,count);
  assert.ok(f.events.some(e=>e.type==='cancel-hazards'&&e.tag===f.body.id+':bomb-bay-right'));
});

test('Destroying all gun arcs creates a bullet-free approach; rotated mounts stay on the hull',()=>{
  const f=fixture(ParisStaakenRVI);f.body.a=-Math.PI/2;f.body.rotateMounts();
  f.frame.players[0].x=f.body.x;f.frame.players[0].y=f.body.y-400;f.body.gunfire(5,f.frame.players);
  assert.ok(shots(f).length>0);for(const p of [...f.body.parts.values()])if(p.kind==='gun')destroy(f,p.id);
  const count=shots(f).length;step(f,12);assert.equal(shots(f).length,count);
  const p=f.body.parts.get('engine-0');assert.ok(Math.abs(Math.hypot(p.x,p.y)-Math.hypot(p.localX,p.localY))<1e-8);
  assert.equal(f.body.parts.size,11);assert.ok([...f.body.parts.values()].filter(p=>p.kind==='gun').every(p=>p.destroyed));
});

test('Source-art side gun housings and complete bomb racks keep independent nearest-hit routes',()=>{
 const expected={'gun-left':[-49,-7,18],'gun-right':[52,-7,18],'bomb-bay-left':[-81,-3,30],'bomb-bay-right':[82,-3,30]};
 for(const [id,[x,y,radius]] of Object.entries(expected)){
  const part=PARIS_STAAKEN_PARTS.find(p=>p.id===id);assert.deepEqual([part.x,part.y,part.radius],[x,y,radius]);
 }
 for(const scale of [1,.5])for(const heading of [-Math.PI/2,.37,Math.PI/2])for(const reverse of [false,true]){
  const body=new ParisStaakenRVI({id:'rack-route',tuning:{...tuning,geometryScale:scale},layout:{...PARIS_STAAKEN_LAYOUT,parts:reverse?[...PARIS_STAAKEN_PARTS].reverse():PARIS_STAAKEN_PARTS},x:300,y:300});
  body.a=heading;body.rotateMounts();
  for(const id of Object.keys(expected)){
   const target=body.parts.get(id),before=new Map([...body.parts].map(([key,p])=>[key,p.hp]));
   const attack={x:body.x+target.x,y:body.y+target.y,radius:4,damage:10};
   assert.deepEqual(body.locateHit(attack),{partId:id});assert.equal(body.hitAt(attack).partId,id);
   for(const [other,p] of body.parts)assert.equal(p.hp,before.get(other)-(other===id?10:0),other);
   assert.equal(body.hp,body.maxHp,'One rack/gun impact cannot leak into the core');
  }
 }
});

test('Boss attacks are bounded over a long fight, player frames remain unchanged',()=>{
  for(const Ctor of [ParisSearchlightFortress,ParisStaakenRVI]){const f=fixture(Ctor),before=JSON.stringify(f.frame.players);step(f,120);
    assert.ok(f.hazards.pool.count<=512);assert.equal(JSON.stringify(f.frame.players),before);assert.ok(f.events.length<5000);
  }
});
