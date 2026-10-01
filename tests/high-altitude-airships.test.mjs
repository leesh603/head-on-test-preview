import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js?v=airships20261001';
import {StageBossAddon} from '../headon-stageboss-runtime.js?v=airships20261001';
import {airshipPoint,airshipScale} from '../airship-layout.js?v=airships20261001';

const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,projectileDensity:1,engineInterval:2.6,engineShotCount:3,gasInterval:6.2,launchInterval:3.4,panicInterval:2.8};
function setup(id){let enc;const events=[];enc=createBossEncounter({id:'airship-'+id,bossId:id,tuning:{...tuning},x:100,y:30,rng:()=>.5,emit:e=>{
 const b=enc?.bodies.get(e.bossId),part=b?.parts.get(e.partId||e.sourcePartId||e.launchPortId),bay=e.tag?.startsWith('l70-bay')?b?.parts.get(e.tag.slice(4)):null;
 events.push({...e,mountAtEmission:part?b.point(part):bay?b.point(bay):null});
 }});const body=[...enc.bodies.values()][0];return{enc,body,events,frame:{players:[{id:'p1',alive:true,x:240,y:440,vx:30,vy:10,radius:12}],bounds:{left:-900,top:-700,right:900,bottom:900}}};}
function step(f,seconds){for(let i=0;i<Math.round(seconds/.02);i++)f.enc.update(.02,f.frame);}
function reveal(f){f.body.hit({partId:'capsule',damage:99999});step(f,1.12);assert.equal(f.body.phase,'exposed');}

for(const id of ['zeppelin-l70','hma23'])test(id+': engine loss slows the existing flight path without a position jump',()=>{
 const f=setup(id);if(id==='zeppelin-l70')reveal(f);step(f,4);const b=f.body,before=b.driveVelocity;
 for(const p of b.engines())b.hit({partId:p.id,damage:99999});const old={x:b.x,y:b.y};f.enc.update(.02,f.frame);
 assert.ok(Math.hypot(b.x-old.x,b.y-old.y)<1);assert.ok(b.driveVelocity<before*.35);
 for(let i=0;i<3000;i++){const x=b.x,y=b.y,yaw=b.hullYaw;f.enc.update(.02,f.frame);assert.ok(Math.hypot(b.x-x,b.y-y)<2);assert.ok(Math.abs(b.hullYaw-yaw)<=.16*.02+1e-8);
  for(const p of b.parts.values()){const q=b.point(p);assert.ok(Math.hypot(b.x+p.x-q.x,b.y+p.y-q.y)<1e-8);}}
});
test('L70 observer stays on a finite tether, opens the same large rotated hull, and engine hitboxes follow visible mounts',()=>{
 const f=setup('zeppelin-l70');step(f,3);const b=f.body,p=b.parts.get('capsule');assert.ok(Math.hypot(p.localX,p.localY)<155*airshipScale(b));
 assert.equal(b.locateHit({x:b.x,y:b.y}),null);assert.equal(b.locateHit(b.point(p)).partId,'capsule');reveal(f);
 for(const p of b.liveEngines())assert.equal(b.locateHit(b.point(p)).partId,p.id);
 const q=airshipPoint(b,170*airshipScale(b),0);assert.ok(b.locateHit({...q,previousX:q.x-50,previousY:q.y,radius:1}));
});
test('L70 releases successive bombs from the current open bay toward locked, telegraphed positions',()=>{
 const f=setup('zeppelin-l70');reveal(f);f.body.timers.set('bomb-run',0);step(f,.02);f.frame.players[0].x+=350;step(f,1.6);
 const bombs=f.events.filter(e=>e.airborneBomb);assert.equal(bombs.length,5);
 for(const e of bombs){assert.ok(e.mountAtEmission);assert.ok(Math.hypot(e.sourceX-e.mountAtEmission.x,e.sourceY-e.mountAtEmission.y)<1e-8);assert.equal(e.warning,1.2);}
 assert.ok(bombs.at(-1).x-bombs[0].x<320,'the salvo must not continue following the player');
});
test('destroying an open L70 bomb bay cancels the unreleased portion of its salvo',()=>{
 const f=setup('zeppelin-l70');reveal(f);f.body.timers.set('bomb-run',0);step(f,.02);const bay=f.body.parts.get(f.body.bombRun.bayId);
 assert.equal(bay.hittable,true);f.body.hit({partId:bay.id,damage:99999});f.events.length=0;step(f,1.8);assert.equal(f.events.some(e=>e.airborneBomb),false);assert.equal(f.body.bombRun,null);
});
test('L70 destroyed engine mounts and both bomb bays stop their own attacks',()=>{
 const f=setup('zeppelin-l70');reveal(f);step(f,3);const shots=f.events.filter(e=>e.visual==='l70-broadside');assert.ok(shots.length>0);
 for(const e of shots)assert.ok(Math.hypot(e.x-e.mountAtEmission.x,e.y-e.mountAtEmission.y)<1e-8);
 for(const p of f.body.engines())f.body.hit({partId:p.id,damage:99999});
 for(const p of f.body.parts.values())if(p.kind==='bomb-bay'){p.hittable=true;f.body.hit({partId:p.id,damage:99999});}
 f.events.length=0;step(f,15);assert.equal(f.events.some(e=>e.visual==='l70-broadside'||e.airborneBomb),false);
});
test('HMA ports warn before launching, emit from their live rotating mounts, and destroyed prepared ports stay silent',()=>{
 const f=setup('hma23');f.body.timers.set('launch-wave',0);step(f,.02);const prepared=[...f.body.parts.values()].filter(p=>p.launchWarmup>0);assert.equal(prepared.length,2);
 assert.equal(f.events.some(e=>e.type==='spawn-minion'),false);f.body.hit({partId:prepared[0].id,damage:99999});step(f,1.2);
 const launched=f.events.filter(e=>e.type==='spawn-minion');assert.equal(launched.length,1);assert.equal(launched[0].launchPortId,prepared[1].id);
 assert.ok(Math.hypot(launched[0].x-launched[0].mountAtEmission.x,launched[0].y-launched[0].mountAtEmission.y)<1e-8);
});
test('HMA side engine destruction halves launches on its own side and does not suppress the other side',()=>{
 const f=setup('hma23');f.body.hit({partId:'engine-0',damage:99999});
 for(let i=0;i<4;i++){f.body.prepareLaunch(f.frame.players);step(f,1.12);f.body.timers.set('launch-wave',99);}
 const launches=f.events.filter(e=>e.type==='spawn-minion');assert.ok(launches.some(e=>e.launchSide===1));assert.ok(launches.filter(e=>e.launchSide===-1).length<launches.filter(e=>e.launchSide===1).length);
});
test('HMA guns defend during the launch phase and their destruction stops both fans and targeted flak',()=>{
 const f=setup('hma23');step(f,7);assert.equal(f.body.coreVulnerable,false);assert.ok(f.events.some(e=>e.visual==='carrier-flak'));assert.ok(f.events.some(e=>e.visual==='black-flak'));
 for(const e of f.events.filter(e=>e.visual==='carrier-flak'||e.visual==='black-flak'))assert.ok(Math.hypot((e.sourceX??e.x)-e.mountAtEmission.x,(e.sourceY??e.y)-e.mountAtEmission.y)<1e-8);
 for(const id of ['gun-left','gun-right'])f.body.hit({partId:id,damage:99999});f.events.length=0;step(f,9);assert.equal(f.events.some(e=>e.type==='hazard'),false);
});
test('HMA all ports destroyed exposes the hull without a final launch from the wrecked ports',()=>{
 const f=setup('hma23');f.body.prepareLaunch(f.frame.players);for(let i=0;i<4;i++)f.body.hit({partId:'port-'+i,damage:99999});
 assert.equal(f.body.coreVulnerable,true);assert.ok(f.body.hp<f.body.maxHp);f.events.length=0;step(f,8);assert.equal(f.events.some(e=>e.type==='spawn-minion'),false);
 const q=airshipPoint(f.body,175*airshipScale(f.body),0);assert.ok(f.body.locateHit(q));
});
test('port armor gives a real damage window and component damage transfers to hull exactly once',()=>{
 const a=setup('hma23'),b=setup('hma23');b.body.parts.get('port-0').hatch=1;
 const ca=a.body.hit({partId:'port-0',damage:100}),cb=b.body.hit({partId:'port-0',damage:100});assert.equal(ca.damage,65);assert.equal(cb.damage,100);assert.equal(b.body.maxHp-b.body.hp,65);
});
test('runtime pause freezes airship timers and defeat clears owned fire before the 4.2-second collapse',()=>{
 let cleared=0,cleanup=0;const addon=new StageBossAddon({runId:'sky',teamFaction:'central',stageIndex:5,rng:()=>.5,hooks:{getTuning:()=>({...tuning}),onDamage(){},onStatus(){},onBarrierContact(){},spawnMinion(){},countMinions:()=>0,onBuildingImpact:()=>false,onCue(){},onEncounterCleared(){cleared++;},onStageChange(){},clearEncounterOwned(){cleanup++;}}});
 const enc=addon.startBoss({x:0,y:0}),b=[...enc.bodies.values()][0],frame=setup('hma23').frame;addon.tick(.04,frame);const pose=[b.x,b.y,b.flightClock,b.timers.get('launch-wave')];addon.tick(.04,{...frame,paused:true});assert.deepEqual([b.x,b.y,b.flightClock,b.timers.get('launch-wave')],pose);
 for(let i=0;i<4;i++)b.hit({partId:'port-'+i,damage:99999});b.hit({damage:99999});addon.tick(.02,frame);assert.equal(addon.hazards.pool.count,0);assert.equal(addon.defeatSequence.duration,4.2);assert.equal(cleanup,1);
 for(let i=0;i<210;i++){addon.tick(.02,frame);addon.reconcile({blocked:false});}assert.equal(cleared,1);addon.dispose();
});
