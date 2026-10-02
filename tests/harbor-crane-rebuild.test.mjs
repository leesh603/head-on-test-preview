import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js?v=503';
import {StageBossAddon} from '../headon-stageboss-runtime.js?v=503';
import {enableStageBoss} from '../stageboss-host.js?v=503';
import {harborCranePose,harborMuzzle,harborLaunchPoint,harborSegmentHit} from '../harbor-crane-layout.js?v=503';
const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,patternMultiplier:1,projectileDensity:1,coastalInterval:2.5,harborLaunchInterval:5.6};
const frame=()=>({players:[{id:'p1',alive:true,x:40,y:360,vx:12,vy:-8,radius:12}],bounds:{left:-900,top:-700,right:900,bottom:900}});
function fixture(teamFaction='entente'){
 const events=[],launched=[],hits=[];let cleanups=0,cleared=0;
 const addon=new StageBossAddon({runId:'harbor',teamFaction,stageIndex:7,rng:()=>.5,hooks:{getTuning:()=>({...tuning}),onDamage:(...a)=>hits.push(a),onStatus(){},onBarrierContact(){},spawnMinion:e=>launched.push(e),countMinions:()=>0,onBuildingImpact:()=>false,onCue:e=>events.push(e),clearEncounterOwned(){cleanups++;},onEncounterCleared(){cleared++;},onStageChange(){}}});
 const enc=addon.startBoss({x:100,y:20}),body=[...enc.bodies.values()][0];return{addon,enc,body,events,launched,hits,frame:frame(),counts:()=>({cleanups,cleared})};
}
const tick=(f,s)=>{for(let i=0;i<Math.round(s/.02);i++)f.addon.tick(.02,f.frame);};
const destroy=(f,id)=>f.body.hit({partId:id,damage:999999});
test('harbor remains stationary and all four authored gun mounts can be hit independently',()=>{
 const f=fixture(),b=f.body;tick(f,20);assert.deepEqual([b.x,b.y],[100,20]);assert.equal(b.liveGuns().length,4);
 for(const p of b.liveGuns())assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y}).partId,p.id);
 destroy(f,'gun-left');assert.equal(b.liveGuns().length,3);assert.equal(b.parts.get('gun-right').destroyed,false);
});
test('crane arm hitbox spans the rotating visible lattice and protected core does not consume shots',()=>{
 const f=fixture(),b=f.body;b.craneAngle=-.3;b.syncCrane();const {pivot,tip}=harborCranePose(b);
 assert.equal(b.locateHit({x:pivot.x,y:pivot.y}),null);
 assert.equal(b.locateHit({x:pivot.x+(tip.x-pivot.x)*.85,y:pivot.y+(tip.y-pivot.y)*.85}).partId,'crane-arm');
 assert.ok(harborSegmentHit({x:tip.x,y:tip.y+80,previousX:tip.x,previousY:tip.y-80},pivot,tip,2));
 const pose=harborCranePose(b);b.craneAngle+=.6;b.syncCrane();assert.ok(Math.hypot(b.parts.get('crane-arm').x+b.x-harborCranePose(b).arm.x,b.parts.get('crane-arm').y+b.y-harborCranePose(b).arm.y)<1e-9);assert.ok(harborCranePose(b).tip.y!==pose.tip.y);
});
test('crane warning is harmless, sweep follows its load, and rotation does not snap to the player',()=>{
 const f=fixture(),b=f.body;b.startCrane(f.frame.players);const locked=[b.craneStart,b.craneEnd],warning=b.craneWarn;
 f.frame.players[0].x+=400;
 for(let i=0;i<Math.floor(warning/.02)-2;i++){
  const a=b.craneAngle,load=harborCranePose(b).load;f.frame.players=[{id:'p1',alive:true,...load,radius:12}];f.addon.tick(.02,f.frame);assert.ok(Math.abs(b.craneAngle-a)<=.55*.02+1e-8);
  const h=f.addon.hazards.pool.records.find(h=>h.active&&h.visual==='harbor-swing');assert.ok(h);assert.equal(h.phase,'warning');assert.ok(Math.hypot(h.x-harborCranePose(b).load.x,h.y-harborCranePose(b).load.y)<1e-8);
 }
 assert.equal(f.hits.some(a=>a[2].visual==='harbor-swing'),false);assert.deepEqual([b.craneStart,b.craneEnd],locked);
 tick(f,.08);assert.equal(b.craneState,'sweep');
 for(let i=0;i<80;i++){const a=b.craneAngle;f.frame.players=[{id:'p1',alive:true,...harborCranePose(b).load,radius:12}];f.addon.tick(.02,f.frame);assert.ok(Math.abs(b.craneAngle-a)<.7*.02+1e-8);}
 assert.ok(f.hits.some(a=>a[2].visual==='harbor-swing'));
});
test('destroying the boom cancels the live sweep and pending mine drop, and exposes its pivot immediately',()=>{
 const f=fixture(),b=f.body;b.startCrane(f.frame.players);tick(f,b.craneWarn+.12);destroy(f,'crane-arm');assert.equal(b.parts.get('crane-pivot').hittable,true);assert.equal(b.phase,'breached');assert.equal(b.craneState,'collapsed');
 assert.equal(f.addon.hazards.pool.records.some(h=>h.active&&h.tag==='harbor-crane'),false);f.events.length=0;tick(f,8);assert.equal(f.events.some(e=>e.type==='spawn-minefield'),false);
});
test('live crane drops bounded shootable mines from the exact chain endpoint toward locked targets',()=>{
 const f=fixture(),b=f.body;const drops=[],emit=b.emit;b.emit=e=>{if(e.type==='spawn-minefield')drops.push({...e,actual:harborCranePose(b).load});emit(e);};
 b.startCrane(f.frame.players);const target={...b.craneTarget};f.frame.players[0].x+=300;tick(f,b.craneWarn+2.84);
 assert.equal(drops.length,1);const e=drops[0];assert.ok(Math.hypot(e.sourceX-e.actual.x,e.sourceY-e.actual.y)<1e-8);assert.equal(e.warning,1.2);assert.equal(e.maxMines,9);assert.equal(e.points.length,3);assert.equal(e.points[1].x,target.x);
 assert.ok(e.points.every(p=>p.x>f.frame.bounds.left&&p.x<f.frame.bounds.right&&p.y>f.frame.bounds.top&&p.y<f.frame.bounds.bottom));
});
test('ammo destruction detonates once, removes mine replenishment and reduces a three-round salvo to one',()=>{
 const healthy=fixture(),weak=fixture();for(const f of [healthy,weak]){f.body.craneClock=99;f.body.timers.set('harbor-guns',0);}destroy(weak,'ammo-storage');destroy(weak,'ammo-storage');
 assert.equal(weak.events.filter(e=>e.type==='ammo-detonation').length,1);tick(healthy,.7);tick(weak,.7);
 assert.equal(healthy.addon.hazards.pool.records.filter(h=>h.active&&h.visual==='harbor-shell').length,3);assert.equal(weak.addon.hazards.pool.records.filter(h=>h.active&&h.visual==='harbor-shell').length,1);
 weak.body.startCrane(weak.frame.players);tick(weak,.02);const hook=weak.addon.hazards.pool.records.find(h=>h.active&&h.visual==='harbor-swing');assert.equal(hook.radius,9*tuning.geometryScale);assert.equal(hook.damage,tuning.damage*.5);
 tick(weak,weak.body.craneWarn+3);assert.equal(weak.events.some(e=>e.type==='spawn-minefield'),false);
});
test('guns traverse smoothly, each round leaves its actual barrel, and a destroyed gun cancels queued rounds',()=>{
 const f=fixture(),b=f.body;b.craneClock=99;const shots=[],emit=b.emit;b.emit=e=>{if(e.type==='hazard'&&e.visual==='harbor-shell'){const gun=b.parts.get(e.tag.slice(7));shots.push({...e,actual:harborMuzzle(b,gun)});}emit(e);};
 for(let i=0;i<100;i++){const angles=b.liveGuns().map(p=>p.angle);f.addon.tick(.02,f.frame);b.liveGuns().forEach((p,j)=>assert.ok(Math.abs(p.angle-angles[j])<=.72*.02+1e-8));}
 b.timers.set('harbor-guns',0);tick(f,.02);assert.equal(shots.length,1);destroy(f,'gun-left');tick(f,.7);assert.equal(shots.length,1);assert.ok(Math.hypot(shots[0].x-shots[0].actual.x,shots[0].y-shots[0].actual.y)<1e-8);
});
test('the launch dock warns, releases two seaplanes sequentially from its rail, and destruction cancels preparation',()=>{
 for(const faction of ['entente','central']){
  const f=fixture(faction),b=f.body;b.prepareSortie(f.frame.players);tick(f,.8);assert.equal(f.launched.length,0);assert.ok(b.parts.get('seaplane-facility').launchWarmup>0);tick(f,.5);assert.equal(f.launched.length,2);
  for(const e of f.launched){const q=harborLaunchPoint(b);assert.ok(Math.hypot(e.x-q.x,e.y-q.y)<1e-8);assert.equal(e.minion,faction==='entente'?'seaplane-central':'seaplane-entente');}
  b.prepareSortie(f.frame.players);destroy(f,'seaplane-facility');tick(f,4);assert.equal(f.launched.length,2);assert.equal(b.launchRun,null);
 }
});
test('three external losses expose the pivot, destroying it collapses the boom and reveals only the central core',()=>{
 const f=fixture(),b=f.body;for(const id of ['gun-left','gun-right','ammo-storage'])destroy(f,id);assert.equal(b.parts.get('crane-pivot').hittable,true);destroy(f,'crane-pivot');assert.equal(b.parts.get('crane-arm').destroyed,true);assert.equal(b.coreVulnerable,true);assert.equal(b.craneState,'collapsed');
 const q=harborCranePose(b).pivot;assert.deepEqual(b.locateHit(q),{partId:null});assert.equal(b.locateHit({x:b.x+240,y:b.y}),null);assert.ok(b.hit({damage:999999}).bodyDefeated);
});
test('component damage transfers once and mandatory core exposure cannot be skipped',()=>{
 const f=fixture(),b=f.body,old=b.hp;const hit=b.hit({partId:'gun-left',damage:100});assert.equal(hit.damage,100);assert.equal(old-b.hp,35);assert.equal(b.hit({damage:999999}).damage,0);
});
test('pause freezes crane pose and preparation; defeat removes all owned attacks before the stationary collapse',()=>{
 const f=fixture(),b=f.body;b.startCrane(f.frame.players);b.prepareSortie(f.frame.players);tick(f,.2);const before=[b.craneAngle,b.craneClock,b.launchRun.clock];f.addon.tick(.05,{...f.frame,paused:true});assert.deepEqual([b.craneAngle,b.craneClock,b.launchRun.clock],before);
 destroy(f,'crane-arm');destroy(f,'crane-pivot');b.hit({damage:999999});tick(f,.02);assert.equal(f.addon.hazards.pool.count,0);assert.equal(f.counts().cleanups,1);assert.equal(f.addon.defeatSequence.duration,4.4);const emitted=f.launched.length;
 tick(f,4.5);f.addon.reconcile({blocked:false});assert.equal(f.launched.length,emitted);assert.equal(f.counts().cleared,1);assert.equal(f.counts().cleanups,1);
});
function hostFixture(){
 const blasts=[],g={state:'playing',t:0,distance:0,x:0,y:0,hp:100,maxHp:100,teamFaction:'entente',enemies:[],bullets:[],events:[],pendingLevelUps:[],worldRegion:()=>7,event(){},combatBlast:(...args)=>blasts.push(args)};
 const addon=enableStageBoss(g,{teamFaction:'entente'});addon.stages.stageIndex=7;const enc=addon.startBoss({x:0,y:0}),body=[...enc.bodies.values()][0];return{g,addon,enc,body,blasts};
}
test('real host does not explode a still-attached swinging mine when its warning finishes',()=>{
 const f=hostFixture();f.addon.accept({type:'hazard-activated',bossId:f.body.id,kind:'circle',visual:'harbor-swing',x:20,y:80,radius:36},f.enc.id,tuning);assert.equal(f.blasts.length,0);
 f.addon.accept({type:'hazard-activated',bossId:f.body.id,kind:'circle',visual:'harbor-mine',x:20,y:80,radius:36},f.enc.id,tuning);assert.equal(f.blasts.length,1);
});
test('real host deploys shootable crane mines from the payload and keeps the shared nine-mine budget',()=>{
 const f=hostFixture(),points=[{x:20,y:200},{x:140,y:200},{x:260,y:200}];
 for(let i=0;i<5;i++)f.addon.accept({type:'spawn-minefield',bossId:f.body.id,points,sourceX:320,sourceY:160,warning:1.2,life:8.5,maxMines:9},f.enc.id,tuning);
 const fields=f.g.hostileMinefields,mines=fields.flatMap(a=>a.mines).filter(m=>!m.dead);assert.equal(mines.length,9);assert.ok(mines.every(m=>m.hp===18&&m.deploying&&m.x===320&&m.y===160));assert.ok(fields.every(a=>a.encounterId===f.enc.id&&a.deploySeconds===1.2));
});
