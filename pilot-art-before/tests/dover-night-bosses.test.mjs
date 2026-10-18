import test from 'node:test';
import assert from 'node:assert/strict';
import {BossEncounter} from '../headon-stageboss-core.js';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {SupermarineNighthawk,SiemensSchuckertRVIII,DOVER_NIGHTHAWK_LAYOUT,DOVER_RVIII_LAYOUT,DOVER_PART_CLIPS} from '../dover-night-bosses.js';

const tuning={maxHp:1200,partHp:100,damage:20,bulletSpeed:240,geometryScale:1};
function fixture(Ctor,options={}){
  const events=[],hits=[],statuses=[],hazards=new BossHazards({onDamage:(...v)=>hits.push(v),onStatus:(...v)=>statuses.push(v),onBarrierContact:()=>{}});
  const body=new Ctor({id:'dover:body',tuning:{...tuning,...options.tuning},x:700,y:430,emit:event=>{
    events.push(event);
    if(event.type==='hazard')hazards.spawn({...event,encounterId:'dover'});
    if(event.type==='cancel-hazards')hazards.clearTagged('dover',event.tag);
  }});
  const encounter=new BossEncounter({id:'dover',bossId:body.kind,bodies:[body]});
  const frame={players:[
    {id:'one',x:500,y:760,vx:0,vy:-100,radius:12,alive:true},
    {id:'two',x:900,y:760,vx:0,vy:-100,radius:12,alive:true}
  ],bounds:{left:0,right:1400,top:0,bottom:920},isIlluminated:p=>hazards.isIlluminated(p)};
  return{body,encounter,events,hazards,frame,hits,statuses};
}
function step(f,seconds,ctx=f.frame){for(let i=0;i<Math.ceil(seconds/.02);i++){f.encounter.update(.02,ctx);f.hazards.update(.02,ctx);}}
function stepUntil(f,predicate,limit=20,ctx=f.frame){for(let i=0;i<Math.ceil(limit/.02)&&!predicate();i++){f.encounter.update(.02,ctx);f.hazards.update(.02,ctx);}assert.ok(predicate(),'timed out waiting for combat phase');}
const destroy=(f,id)=>f.body.hit({partId:id,damage:1e6});
const attacks=f=>f.events.filter(e=>e.type==='hazard');
function worldAt(body,x,y){
  const rotation=body.a+Math.PI/2,c=Math.cos(rotation),s=Math.sin(rotation),scale=body.geometryScale;
  return{x:body.x+(x*c-y*s)*scale,y:body.y+(x*s+y*c)*scale};
}
function artCorners(body){
  const w=body.layout.width/2,h=body.layout.height/2;
  return[worldAt(body,-w,-h),worldAt(body,w,-h),worldAt(body,w,h),worldAt(body,-w,h)];
}

test('Dover sprite contract is centered, bounded, unique, and matches every wreck clip',()=>{
  for(const [layout,key,count] of [[DOVER_NIGHTHAWK_LAYOUT,'nighthawk',9],[DOVER_RVIII_LAYOUT,'rviii',11]]){
    assert.deepEqual([layout.width,layout.height],[1200,800]);assert.equal(layout.parts.length,count);
    assert.equal(new Set(layout.parts.map(p=>p.id)).size,count);assert.deepEqual(Object.keys(DOVER_PART_CLIPS[key]).sort(),layout.parts.map(p=>p.id).sort());
    const clips=Object.entries(DOVER_PART_CLIPS[key]);for(const [id,[x,y,w,h]] of clips){
      assert.ok(w>0&&h>0,id);assert.ok(x>=-600&&y>=-400&&x+w<=600&&y+h<=400,id);
    }
    for(let i=0;i<clips.length;i++)for(let j=i+1;j<clips.length;j++){
      const [a,[ax,ay,aw,ah]]=clips[i],[b,[bx,by,bw,bh]]=clips[j];
      assert.ok(ax+aw<=bx||bx+bw<=ax||ay+ah<=by||by+bh<=ay,`${key}: ${a} overlaps ${b}`);
    }
  }
});

test('Both bodies expose standard snapshot fields and route only the tight painted silhouette',()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const f=fixture(Ctor),b=f.body;b.coreVulnerable=true;for(const p of b.parts.values())p.hp=0;
    assert.equal(typeof b.t,'object');assert.equal(typeof b.kind,'string');assert.equal(typeof b.faction,'string');assert.ok(Number.isFinite(b.a));assert.equal(b.coreVulnerable,true);
    assert.deepEqual(b.locateHit({x:b.x+500,y:b.y+40,radius:0}),{partId:null});
    assert.equal(b.locateHit({x:b.x+500,y:b.y+300,radius:0}),null,'transparent canvas corner must miss');
    const snap=f.encounter.snapshot();assert.equal(snap.totalParts,b.parts.size);assert.equal(snap.bossId,b.kind);assert.equal(snap.shielded,false);
  }
});

test('Part-first collision remains exact after heading and geometry scale changes',()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII])for(const scale of [.5,1]){
    const body=new Ctor({id:'route',tuning:{...tuning,geometryScale:scale},x:300,y:300});body.a=.43;body.rotateMounts();
    for(const target of body.parts.values()){
      const before=target.hp,attack={x:body.x+target.x,y:body.y+target.y,radius:2,damage:11};
      assert.deepEqual(body.locateHit(attack),{partId:target.id});assert.equal(body.hitAt(attack).partId,target.id);assert.equal(target.hp,before-11);assert.equal(body.hp,body.maxHp);
    }
  }
});

test('Swept shots cannot tunnel through rotated small mounts at minimum encounter scales',()=>{
  const cases=[[SupermarineNighthawk,.26,'gun-left'],[SiemensSchuckertRVIII,.32,'gun-nose']];
  for(const [Ctor,scale,id] of cases){
    const body=new Ctor({id:'sweep',tuning:{...tuning,geometryScale:scale},x:400,y:350});
    body.a=.41;body.rotateMounts();const part=body.parts.get(id),length=520*.04,ux=Math.cos(body.a+Math.PI/2),uy=Math.sin(body.a+Math.PI/2);
    const attack={previousX:body.x+part.x-ux*length/2,previousY:body.y+part.y-uy*length/2,x:body.x+part.x+ux*length/2,y:body.y+part.y+uy*length/2,radius:0,damage:9};
    assert.equal(body.locateHit({x:attack.previousX,y:attack.previousY,radius:0}),null,`${id} entry endpoint is clear`);
    assert.equal(body.locateHit({x:attack.x,y:attack.y,radius:0}),null,`${id} exit endpoint is clear`);
    assert.deepEqual(body.locateHit(attack),{partId:id});
    assert.equal(body.hitAt(attack).partId,id);assert.equal(part.hp,body.t.partHp-9);
  }
});

test('Swept hull routing catches painted wing and core crossings but preserves transparent gaps',()=>{
  const body=new SupermarineNighthawk({id:'hull-sweep',tuning:{...tuning,geometryScale:.26},x:420,y:360});
  body.a=.37;body.rotateMounts();body.coreVulnerable=true;for(const part of body.parts.values())part.hp=0;
  const sweep=(a,b)=>{const p=worldAt(body,...a),q=worldAt(body,...b);return{previousX:p.x,previousY:p.y,x:q.x,y:q.y,radius:0};};
  const core=sweep([-40,-370],[40,-370]);
  assert.equal(body.locateHit({x:core.previousX,y:core.previousY,radius:0}),null);
  assert.equal(body.locateHit({x:core.x,y:core.y,radius:0}),null);
  assert.deepEqual(body.locateHit(core),{partId:null},'20.8px step must cross the narrow forward fuselage');
  const wing=sweep([575,-275],[575,-195]);
  assert.equal(body.locateHit({x:wing.previousX,y:wing.previousY,radius:0}),null);
  assert.equal(body.locateHit({x:wing.x,y:wing.y,radius:0}),null);
  assert.deepEqual(body.locateHit(wing),{partId:null},'20.8px step must cross the tapered wing tip');
  assert.equal(body.locateHit(sweep([260,-160],[340,-160])),null,'same-size step through the interplane gap must miss');
});

test('Airframe extents remain rotation-aware while zero-speed flight never snaps to a viewport edge',()=>{
  const bounds={left:0,right:500,top:0,bottom:500};
  for(const [Ctor,scale,rotation] of [[SupermarineNighthawk,.26,.4],[SiemensSchuckertRVIII,.32,.47]]){
    const body=new Ctor({id:'bounds',tuning:{...tuning,geometryScale:scale},x:-80,y:700});body.a=rotation-Math.PI/2;body.rotateMounts();
    const before=[body.x,body.y],extent=body.airframeExtents(),corners=artCorners(body);body.fly(.04,[],bounds,0,0,0);
    assert.deepEqual([body.x,body.y],before);assert.ok(corners.every(p=>Math.abs(p.x-before[0])<=extent.x+1e-8&&Math.abs(p.y-before[1])<=extent.y+1e-8));
  }
  const cramped={left:0,right:260,top:0,bottom:180},body=new SiemensSchuckertRVIII({id:'cramped',tuning:{...tuning,geometryScale:.32},x:90,y:70});
  body.a=.47-Math.PI/2;body.rotateMounts();const before=[body.x,body.y];body.fly(.04,[],cramped,0,0,0);
  assert.deepEqual([body.x,body.y],before,'an undersized viewport must not snap the aircraft to center');
});

test('Nighthawk locks fixed warnings, alternates co-op targets, then grants a quiet recovery',()=>{
  const f=fixture(SupermarineNighthawk);step(f,5.4);
  const lights=attacks(f).filter(e=>e.kind==='searchlight'),targets=new Set(attacks(f).map(e=>e.targetId).filter(Boolean));
  assert.equal(lights.length,3);assert.ok(lights.every(e=>e.warning===1.1&&e.angularSpeed===0&&e.sourcePartId==='lamp'));
  assert.deepEqual([...targets].sort(),['one','two']);
  const cannon=attacks(f).filter(e=>e.visual==='davis-cannon');assert.equal(cannon.length,2);assert.ok(cannon.every(e=>e.kind==='projectile'&&Math.abs(Math.hypot(e.vx,e.vy)-550)<1e-9));
  assert.ok(cannon.every(e=>e.radius===8&&e.warning===1.35&&e.duration===1.6&&e.length===880));
  const lightBombs=attacks(f).filter(e=>e.visual==='nighthawk-light-bomb');assert.equal(lightBombs.length,4);assert.ok(lightBombs.every(e=>e.sourcePartId===null&&e.launchPartId==='bomb-rack'&&e.tag===f.body.id+':released-bombs'&&e.once));
  const thirdLight=f.events.map(e=>e.type).lastIndexOf('dover-search-warning'),rackWarning=f.events.findIndex(e=>e.type==='dover-light-bomb-warning'),cannonWarning=f.events.findIndex(e=>e.type==='dover-cannon-warning');
  assert.ok(thirdLight<rackWarning&&rackWarning<cannonWarning);assert.ok(f.events[cannonWarning].safeGap===80);assert.equal(f.body.phase,'cannon');
  step(f,1.92);assert.equal(f.body.phase,'recovery');assert.equal(f.body.coreVulnerable,true);const count=attacks(f).length;
  step(f,3.5);assert.equal(attacks(f).length,count,'recovery is a real attack gap');step(f,.32);assert.equal(f.body.phase,'sortie-depart');assert.equal(f.body.coreVulnerable,false);
});

test('Destroyed Nighthawk mounts cease and cancel their queued hazards',()=>{
  const f=fixture(SupermarineNighthawk);step(f,.05);assert.ok(attacks(f).some(e=>e.sourcePartId==='lamp'));
  destroy(f,'lamp');assert.ok(f.events.some(e=>e.type==='cancel-hazards'&&e.tag===f.body.id+':lamp'));
  let lampPending=0;f.hazards.pool.visit(h=>{if(h.sourcePartId==='lamp')lampPending++;});assert.equal(lampPending,0);
  const after=f.events.length;step(f,15);assert.ok(!f.events.slice(after).some(e=>e.type==='hazard'&&e.sourcePartId==='lamp'));
  destroy(f,'gun-left');destroy(f,'davis-cannon');const later=f.events.length;step(f,12);
  assert.ok(!f.events.slice(later).some(e=>e.type==='hazard'&&['gun-left','davis-cannon'].includes(e.sourcePartId)));
  const rack=fixture(SupermarineNighthawk);stepUntil(rack,()=>attacks(rack).some(e=>e.visual==='nighthawk-light-bomb'),6);const released=attacks(rack).filter(e=>e.visual==='nighthawk-light-bomb');assert.equal(released.length,1);
  let airborne=0;rack.hazards.pool.visit(h=>{if(h.tag===rack.body.id+':released-bombs')airborne++;});assert.equal(airborne,1);destroy(rack,'bomb-rack');let afterLoss=0;rack.hazards.pool.visit(h=>{if(h.tag===rack.body.id+':released-bombs')afterLoss++;});assert.equal(afterLoss,airborne);
  step(rack,14);assert.equal(attacks(rack).filter(e=>e.visual==='nighthawk-light-bomb').length,1,'destroyed rack stops the two releases still queued');
});

test('Nighthawk engine and wing losses slow and yaw it, then leave a persistent vulnerable last stand',()=>{
  const f=fixture(SupermarineNighthawk);step(f,.05);const full=f.body.currentSpeed;
  destroy(f,'engine-left');step(f,.05);assert.ok(f.body.currentSpeed<full);assert.ok(f.body.hullYaw>0);
  destroy(f,'engine-right');assert.equal(f.body.phase,'last-stand');assert.equal(f.body.coreVulnerable,true);const slow=f.body.currentSpeed;step(f,14);
  assert.equal(f.body.phase,'last-stand');assert.equal(f.body.coreVulnerable,true);assert.ok(f.body.currentSpeed<=slow);assert.ok(attacks(f).some(e=>e.sourcePartId==='davis-cannon'));
  for(const id of ['lamp','davis-cannon','gun-left','gun-right','bomb-rack'])if(!f.body.parts.get(id).destroyed)destroy(f,id);
  const after=attacks(f).length;step(f,15);assert.equal(attacks(f).length,after);assert.equal(f.body.hit({damage:50}).damage,50);
});

test('R.VIII uses tagged ordinary turret fire and a two-sided warned bomb ladder with a safe center',()=>{
  const f=fixture(SiemensSchuckertRVIII);stepUntil(f,()=>f.body.phase==='recovery',20);
  const shots=attacks(f).filter(e=>e.tag===f.body.id+':basic-fire'),bombs=attacks(f).filter(e=>e.visual==='rviii-bomb');
  assert.ok(shots.length>=5);assert.ok(shots.every(e=>e.kind==='projectile'&&e.visual==='rviii-gun'&&e.delay>=.6&&e.damage<f.body.t.damage));
  assert.ok(f.events.some(e=>e.type==='charge-warning'&&e.basicFire));assert.equal(bombs.length,8);assert.ok(bombs.every(e=>e.warning===1.05&&e.sourcePartId===null&&e.launchPartId.startsWith('bomb-bay-')));
  assert.ok(f.events.some(e=>e.type==='dover-bomb-warning'&&e.safeGap===76&&Number.isFinite(e.exitAngle)));
  assert.deepEqual([...new Set(attacks(f).map(e=>e.targetId).filter(Boolean))].sort(),['one','two']);
  assert.equal(f.body.phase,'recovery');assert.equal(f.body.coreVulnerable,true);const count=attacks(f).length;step(f,3.7);assert.equal(attacks(f).length,count);
  step(f,.32);assert.equal(f.body.phase,'sortie-depart');assert.equal(f.body.coreVulnerable,false);
});

test('Released R.VIII bombs survive their bay while destruction cancels every unlaunched drop',()=>{
  const f=fixture(SiemensSchuckertRVIII);
  const released=()=>attacks(f).filter(e=>e.visual==='rviii-bomb');
  stepUntil(f,()=>released().length===1,20);
  assert.equal(released().length,1);assert.equal(released()[0].launchPartId,'bomb-bay-right');
  let activeBefore=0;f.hazards.pool.visit(h=>{if(h.tag===f.body.id+':released-bombs')activeBefore++;});assert.equal(activeBefore,1);
  destroy(f,'bomb-bay-right');let activeAfter=0;f.hazards.pool.visit(h=>{if(h.tag===f.body.id+':released-bombs')activeAfter++;});assert.equal(activeAfter,activeBefore,'a bomb in the air is independent of its destroyed rack');
  stepUntil(f,()=>f.body.phase==='recovery',5);assert.equal(released().filter(e=>e.launchPartId==='bomb-bay-right').length,1,'right rack cannot launch queued bombs after destruction');
  assert.equal(released().filter(e=>e.launchPartId==='bomb-bay-left').length,4,'surviving rack completes its staggered half of the run');
  f.body.coreVulnerable=true;f.body.hit({damage:f.body.maxHp});let afterDeath=0;f.hazards.pool.visit(h=>{if(h.tag===f.body.id+':released-bombs')afterDeath++;});assert.equal(afterDeath,0,'defeat clears detached ordnance owned by the encounter');
});

test('Each aircraft performs one honest hidden bombing sortie, then returns hittable for a long recovery',()=>{
  for(const [Ctor,count,rows] of [[SupermarineNighthawk,20,5],[SiemensSchuckertRVIII,24,6]]){
    const f=fixture(Ctor,{tuning:{geometryScale:.32}});stepUntil(f,()=>f.body.phase==='sortie-hidden',30);assert.equal(f.body.hidden,true);assert.equal(f.body.coreVulnerable,false);
    const part=[...f.body.parts.values()].find(p=>!p.destroyed),shot={x:f.body.x+part.x,y:f.body.y+part.y,radius:4,damage:50};
    assert.equal(f.body.locateHit(shot),null);assert.deepEqual(f.body.hit({partId:part.id,damage:50}),{damage:0,blocked:true});
    stepUntil(f,()=>attacks(f).filter(e=>e.sortie).length===count,3);const bombs=attacks(f).filter(e=>e.sortie);assert.equal(bombs.length,count);
    assert.ok(bombs.every(e=>e.kind==='circle'&&e.airborneBomb&&e.sourcePartId===null&&e.tag===f.body.id+':released-bombs'));
    const warning=f.events.find(e=>e.type==='dover-bomb-warning'&&e.sortie);assert.ok(warning&&warning.safeGap===80&&warning.seconds===1.25);assert.deepEqual([warning.rows,warning.lanes,warning.count],[rows,4,count]);
    stepUntil(f,()=>f.body.phase==='sortie-recovery',15);assert.equal(f.body.hidden,false);assert.equal(f.body.coreVulnerable,true);assert.ok(f.body.locateHit({x:f.body.x+f.body.coreOffset().x,y:f.body.y+f.body.coreOffset().y,radius:2}));
    step(f,20);assert.equal(f.events.filter(e=>e.type==='phase-change'&&e.phase==='sortie-hidden').length,1);
  }
});

test('Destroyed payload prevents the dedicated sortie instead of dropping from an empty rack',()=>{
  for(const [Ctor,ids] of [[SupermarineNighthawk,['bomb-rack']],[SiemensSchuckertRVIII,['bomb-bay-left','bomb-bay-right']]]){
    const f=fixture(Ctor);for(const id of ids)destroy(f,id);step(f,35);
    assert.equal(f.events.some(e=>e.type==='phase-change'&&e.phase==='sortie-hidden'),false);assert.equal(attacks(f).some(e=>e.sortie),false);
  }
});

test('Dover ordinary fire obeys the density gate, recovery pause, and shared mount cancellation',()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const f=fixture(Ctor),blocked={...f.frame,canBasicFire:()=>false};step(f,1.2,blocked);
    assert.equal(attacks(f).filter(e=>e.tag===f.body.id+':basic-fire').length,0);
    f.body.basicClock=0;step(f,.03,{...f.frame,canBasicFire:()=>true});
    const ordinary=attacks(f).filter(e=>e.tag===f.body.id+':basic-fire');assert.ok(ordinary.length>=5);assert.ok(ordinary.every(e=>e.delay>=.6&&e.duration<=4.2&&e.damage>0&&e.damage<f.body.t.damage));
    const source=ordinary.find(e=>e.sourcePartId)?.sourcePartId;assert.ok(source);destroy(f,source);let queued=0;f.hazards.pool.visit(h=>{if(h.tag===f.body.id+':basic-fire')queued++;});assert.equal(queued,0);
    f.body.phase='recovery';f.body.phaseClock=0;f.body.basicClock=0;const before=attacks(f).length;step(f,.1,{...f.frame,canBasicFire:()=>true});assert.equal(attacks(f).length,before);
  }
});

test('R.VIII drive damage is asymmetric and propulsion loss cannot softlock its shield',()=>{
  const f=fixture(SiemensSchuckertRVIII);step(f,.05);const full=f.body.currentSpeed;
  destroy(f,'drive-outer-left');step(f,.05);assert.ok(f.body.currentSpeed<full);assert.ok(f.body.hullYaw>0);
  destroy(f,'drive-inner-left');step(f,.05);assert.ok(f.body.hullYaw>0);destroy(f,'drive-inner-right');
  assert.equal(f.body.drives(),1);assert.equal(f.body.phase,'last-stand');assert.equal(f.body.coreVulnerable,true);
  step(f,30);assert.equal(f.body.phase,'last-stand');assert.equal(f.body.coreVulnerable,true);assert.ok(f.body.currentSpeed>0&&f.body.currentSpeed<full);
  assert.equal(f.body.hit({damage:80}).damage,80);
});

test('R.VIII weapon destruction removes each lane, clears warnings, and preserves an attack-free core opening',()=>{
  const f=fixture(SiemensSchuckertRVIII);step(f,4.9);assert.ok(f.hazards.pool.count>0);
  for(const id of ['gun-nose','gun-dorsal','gun-tail','bomb-bay-left','bomb-bay-right'])destroy(f,id);
  assert.equal(f.body.phase,'last-stand');assert.equal(f.body.coreVulnerable,true);let weaponHazards=0;
  f.hazards.pool.visit(h=>{if(['gun','payload'].includes(f.body.parts.get(h.sourcePartId)?.kind))weaponHazards++;});assert.equal(weaponHazards,0);
  const after=attacks(f).length;step(f,30);assert.equal(attacks(f).length,after);assert.equal(f.body.hit({damage:75}).damage,75);
});

test('Pause freezes combat and death cancels every tagged hazard for both aircraft',()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const f=fixture(Ctor);step(f,2);const state=[f.body.x,f.body.y,f.body.a,f.body.flightSpeed,f.body.turnVelocity,f.body.bank,f.body.phase,f.body.phaseClock,f.body.beat,f.events.length],ages=[];f.hazards.pool.visit(h=>ages.push(h.age));
    step(f,4,{...f.frame,paused:true});assert.deepEqual([f.body.x,f.body.y,f.body.a,f.body.flightSpeed,f.body.turnVelocity,f.body.bank,f.body.phase,f.body.phaseClock,f.body.beat,f.events.length],state);const afterAges=[];f.hazards.pool.visit(h=>afterAges.push(h.age));assert.deepEqual(afterAges,ages);
    f.body.coreVulnerable=true;const result=f.body.hit({damage:f.body.maxHp});assert.equal(result.bodyDefeated,true);assert.equal(f.body.dead,true);
    assert.equal(f.events.filter(e=>e.type==='cancel-hazards').slice(-f.body.parts.size).length,f.body.parts.size);assert.equal(f.hazards.pool.count,0);
    const count=f.events.length;step(f,5);assert.equal(f.events.length,count);
  }
});

test('Long fights remain finite, within a bounded flypast envelope, and inside the fixed hazard pool',()=>{
  for(const Ctor of [SupermarineNighthawk,SiemensSchuckertRVIII]){
    const f=fixture(Ctor),w=f.frame.bounds.right-f.frame.bounds.left,h=f.frame.bounds.bottom-f.frame.bounds.top;for(let i=0;i<6000;i++){f.encounter.update(.02,f.frame);f.hazards.update(.02,f.frame);assert.ok(Number.isFinite(f.body.x+f.body.y+f.body.a+f.body.currentSpeed+f.body.bank));assert.ok(f.body.x>f.frame.bounds.left-w&&f.body.x<f.frame.bounds.right+w&&f.body.y>f.frame.bounds.top-h&&f.body.y<f.frame.bounds.bottom+h);}
    assert.ok(f.hazards.pool.count<=512);assert.ok(f.events.length<2500);for(const h of attacks(f))for(const key of ['x','y','damage','duration','warning'])assert.ok(Number.isFinite(h[key]),key);
  }
});
