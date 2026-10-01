import test from 'node:test';
import assert from 'node:assert/strict';
import {GIK,Ca4} from '../alps-bomber-combat.js?v=472';
import {ALPS_BOMBER_LAYOUT,alpsPoint,alpsMuzzle,alpsHullExtents} from '../alps-bomber-layout.js?v=472';
import {StageBossAddon} from '../headon-stageboss-runtime.js?v=472';
import {enableStageBoss,stageBossCollision,damageStageBoss} from '../stageboss-host.js?v=472';
import {renderStageBossLayer} from '../headon-stageboss-render.js?v=472';

const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:1.45,mobileBoss:false,patternMultiplier:1,projectileDensity:1};
const frame={players:[{id:'p1',alive:true,x:40,y:-400,vx:0,vy:0,radius:12},{id:'p2',alive:true,x:80,y:440,vx:0,vy:0,radius:12}],bounds:{left:-400,right:400,top:-500,bottom:550}};
function make(Boss=GIK,extra={}){const events=[],b=new Boss({id:'test',x:0,y:0,tuning:{...tuning,...extra},rng:()=>.5,emit:e=>events.push(e)});return{b,events};}
function step(b,seconds,f=frame){for(let i=0;i<Math.round(seconds/.02);i++){b.motionTime=(b.motionTime||0)+.02;b.update(.02,f);}}
function addon(Boss=GIK){const cues=[],damage=[],a=new StageBossAddon({runId:'test',teamFaction:Boss===GIK?'entente':'central',stageIndex:6,hooks:{getTuning:()=>({...tuning}),onCue:e=>cues.push(e),onDamage:(...v)=>damage.push(v),onStatus(){},onBarrierContact(){},spawnMinion(){},countMinions:()=>0,onBuildingImpact:()=>false,onEncounterCleared(){},onStageChange(){},clearEncounterOwned(){}}});const enc=a.startBoss({x:0,y:0});return{a,b:[...enc.bodies.values()][0],cues,damage};}
for(const Boss of [GIK,Ca4]){
 test(Boss.name+' uses one rotated pose for live art mounts and swept hits',()=>{
  const {b}=make(Boss);step(b,5);assert.ok(Math.abs(b.hullYaw)>.05);const extent=alpsHullExtents(b);assert.ok(extent.halfWidth>ALPS_BOMBER_LAYOUT[b.kind].width*b.t.geometryScale/2);
  for(const p of b.parts.values()){const q=alpsPoint(b,p.localX,p.localY);assert.ok(Math.hypot(q.x-b.x-p.x,q.y-b.y-p.y)<1e-9);if(!p.hittable)continue;assert.equal(b.locateHit(q)?.partId,p.id);const a=alpsPoint(b,p.localX-80,p.localY);assert.ok(b.locateHit({...q,previousX:a.x,previousY:a.y}));}
  const s=b.t.geometryScale,q=alpsPoint(b,130*s,(Boss===GIK?-36:-90)*s);assert.deepEqual(b.locateHit(q),{partId:null});const empty=alpsPoint(b,135*s,100*s);assert.equal(b.locateHit(empty),null);
 });
 test(Boss.name+' flight is independent of players and camera bounds',()=>{
  const a=make(Boss).b,b=make(Boss).b;for(let i=0;i<1200;i++){a.update(.02,frame);b.update(.02,{...frame,players:[{id:'other',alive:true,x:i*60,y:-10000}],bounds:{left:10000,right:11000,top:10000,bottom:11000}});assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(a.driveVelocity,b.driveVelocity);}
 });
 test(Boss.name+' part damage transfers once, and hull damage does not alter part HP',()=>{
  const {b}=make(Boss),part=b.part('leftEngine'),before=b.hp;const r=b.hit({partId:part.id,damage:20});assert.equal(r.damage,20);assert.equal(before-b.hp,16);const hp=part.hp;b.hit({damage:20});assert.equal(part.hp,hp);
 });
 test(Boss.name+' engine destruction slows flight without teleport or invulnerability',()=>{
  const a=make(Boss).b,b=make(Boss).b;step(a,1);step(b,1);b.hit({partId:'leftEngine',damage:9999});const prev=[b.x,b.y];step(b,.02);assert.ok(Math.hypot(b.x-prev[0],b.y-prev[1])<2);assert.equal(b.hidden,false);const clock=b.routeClock,intactClock=a.routeClock;step(b,3);step(a,3.02);assert.ok(b.routeClock-clock<(a.routeClock-intactClock)*.95);assert.ok(b.hit({damage:30}).damage>0);assert.ok(b.imbalance>0&&b.imbalance<23);
 });
 test(Boss.name+' has no anonymous center suppression after all guns are lost',()=>{
  const {b,events}=make(Boss);for(const id of Boss===GIK?['cannon','rearGun']:['frontGun','rearGun'])b.hit({partId:id,damage:9999});events.length=0;step(b,24);b.suppressive(.05,frame.players);assert.equal(events.some(e=>e.kind==='projectile'),false);
 });
}
test('GIK locks warning direction, fires later from its current muzzle and honors cannon destruction',()=>{
 const {b,events}=make();b.timers.set('alps-cannon',0);step(b,.02);assert.ok(b.cannonLock);const angle=b.cannonLock.angle;assert.equal(events.some(e=>e.visual==='alps-cannon'||e.type==='heavy-gun-fired'),false);
 step(b,1.1,{...frame,players:[{...frame.players[0],x:-450,y:-80}]});assert.equal(b.cannonLock.angle,angle);assert.equal(events.some(e=>e.visual==='alps-cannon'),false);
 step(b,.16);const h=events.find(e=>e.visual==='alps-cannon'),q=alpsMuzzle(b,'cannon',angle);assert.ok(h);assert.ok(Math.hypot(h.x-q.x,h.y-q.y)<1.2);assert.ok(Math.abs(Math.atan2(h.vy,h.vx)-angle)<1e-9);assert.equal(h.warning,0);assert.ok(Math.abs(b.hullYaw-(angle+Math.PI/2))<.03,'aircraft nose must face its locked cannon course at launch');assert.equal(events.filter(e=>e.type==='heavy-gun-fired').length,1);
 const c=make();c.b.timers.set('alps-cannon',0);step(c.b,.1);c.b.hit({partId:'cannon',damage:9999});step(c.b,2);assert.equal(c.events.some(e=>e.visual==='alps-cannon'),false);
});
test('GIK does not fire its nose cannon backwards, and rear gun has its own sector',()=>{
 const f=make();step(f.b,10,{...frame,players:[frame.players[1]]});assert.equal(f.events.some(e=>e.visual==='alps-cannon'),false);assert.ok(f.events.some(e=>e.visual==='alps-mg'));
 const c=make(Ca4);step(c.b,5,{...frame,players:[frame.players[0]]});assert.ok(c.events.some(e=>e.tag==='test:frontGun'));assert.equal(c.events.some(e=>e.tag==='test:rearGun'),false);
});
test('Ca4 keeps an entire warned lane clear, locks strike coordinates and rotates the gap',()=>{
 const {b,events}=make(Ca4),lanes=[];
 for(let run=0;run<3;run++){b.startBombRun(frame.bounds);lanes.push(b.bombLane);const safe=b.laneWarnings.find(l=>l.safe),rect={left:safe.x-safe.width/2,right:safe.x+safe.width/2};
  const start=events.length;step(b,1.26,{...frame,bounds:{left:800,right:1600,top:700,bottom:1400}});const bombs=events.slice(start).filter(e=>e.visual==='carpet-bomb');assert.equal(bombs.length,8);for(const h of bombs){assert.ok(h.x+h.radius<rect.left||h.x-h.radius>rect.right);assert.ok(h.x>=frame.bounds.left&&h.x<=frame.bounds.right);assert.equal(h.airborneBomb,true);assert.ok(Number.isFinite(h.sourceX));}b.bombRunRemaining=0;
 }
 assert.deepEqual(lanes,[0,1,2]);
});
test('Ca4 keeps a usable gap at phone world widths',()=>{
 for(const width of [200,300,430]){const {b,events}=make(Ca4);b.startBombRun({left:0,right:width,top:0,bottom:600});step(b,1.26);const safe=b.laneWarnings.find(l=>l.safe);const bombs=events.filter(e=>e.visual==='carpet-bomb');for(const h of bombs)assert.ok(Math.abs(h.x-safe.x)>h.radius+12);}
});
test('Ca4 opens the bay for a run and cancels all warned payloads on rupture',()=>{
 const {a,b,cues}=addon(Ca4);b.startBombRun(frame.bounds);assert.equal(b.part('bombBay').hittable,true);for(let i=0;i<64;i++)a.tick(.02,frame);assert.ok(a.hazards.pool.count>0);
 const hp=b.hp;b.hit({partId:'bombBay',damage:9999});assert.equal(b.bayRuptured,true);assert.ok(hp-b.hp>=b.maxHp*.16);let payloads=0;a.hazards.pool.visit(h=>{if(h.tag===b.id+':payload')payloads++;});assert.equal(payloads,0);for(let i=0;i<1200;i++)a.tick(.02,frame);assert.equal(b.bombRunRemaining,0);assert.ok(cues.some(e=>e.type==='internal-explosion'));
});
test('Ca4 bay closes after a timed window and remains exposed in the final phase',()=>{
 const {b}=make(Ca4);assert.equal(b.part('bombBay').hittable,false);assert.equal(b.hit({partId:'bombBay',damage:999}).damage,0);b.startBombRun(frame.bounds);step(b,3.4);assert.equal(b.part('bombBay').hittable,false);b.hp=b.maxHp*.3;step(b,.02);assert.equal(b.part('bombBay').hittable,true);
});
test('destruction clears owned hazards; paused frames freeze warnings and route',()=>{
 for(const Boss of [GIK,Ca4]){const {a,b}=addon(Boss);if(Boss===GIK)b.timers.set('alps-cannon',0);else b.startBombRun(frame.bounds);a.tick(.02,frame);const pos=[b.x,b.y,b.cannonRemaining,b.bombRunRemaining];a.tick(.05,{...frame,paused:true});assert.deepEqual([b.x,b.y,b.cannonRemaining,b.bombRunRemaining],pos);b.hit({damage:99999});a.reconcile({blocked:true});assert.ok(a.defeatSequence);assert.equal(a.hazards.pool.count,0);}
});
test('actual host collision and damage route uses the rotated mount once',()=>{
 const {b}=make(),enc={bodies:new Map([[b.id,b]])};step(b,3);const p=b.part('leftEngine'),shot={x:b.x+p.x,y:b.y+p.y,ownerId:'p1',collisionRadius:2},e={stageBossBody:b};const g={state:'playing',pendingLevelUps:[],teamFaction:'entente',stageBoss:{stages:{encounter:enc},hit:a=>b.hit(a)}};
 assert.equal(stageBossCollision(g,e,shot.x,shot.y,shot),true);const hp=b.hp;damageStageBoss(g,e,shot,20);assert.equal(hp-b.hp,16);assert.equal(g.stageBossLastOwner,'p1');
});
test('actual host produces one cannon sound at launch and one payload rupture blast',()=>{
 const events=[],blasts=[],g={state:'playing',t:0,distance:0,x:0,y:0,hp:100,maxHp:100,teamFaction:'central',enemies:[],bullets:[],events:[],pendingLevelUps:[],worldRegion:()=>6,event:(...v)=>events.push(v),combatBlast:(...v)=>blasts.push(v),burst(){},smoke(){},shake:0};
 const a=enableStageBoss(g,{teamFaction:'central'});a.stages.stageIndex=6;const b=[...a.startBoss({x:0,y:0}).bodies.values()][0];b.startBombRun(frame.bounds);b.hit({partId:'bombBay',damage:9999});assert.equal(blasts.filter(v=>v[2]===80).length,1);assert.equal(blasts.length,2);
 a.hooks.onCue({type:'hazard-activated',kind:'circle',visual:'carpet-bomb',bossId:b.id,x:0,y:0,radius:40});assert.equal(blasts.length,2,'authored impact must not get another generic blast');
 const q={...g,teamFaction:'entente',enemies:[],bullets:[],stageBoss:null};const c=enableStageBoss(q,{teamFaction:'entente'});c.stages.stageIndex=6;const d=[...c.startBoss({x:0,y:0}).bodies.values()][0];events.length=0;d.timers.set('alps-cannon',0);for(let i=0;i<64;i++)c.tick(.02,frame);assert.equal(events.filter(v=>v[0]==='bossSound'&&v[1]==='heavyShot').length,1);
});
test('renderer model carries bomber local mounts, current yaw and damage feedback',()=>{
 const {a,b}=addon();b.part('leftEngine').hitFlash=.1;b.hullYaw=.2;b.syncParts();let model,parts=[];renderStageBossLayer(a,{drawBody:m=>model=m,drawPart:p=>parts.push(p),drawHazard(){}});assert.equal(model.parts.length,ALPS_BOMBER_LAYOUT.gik.parts.length);assert.equal(model.hullYaw,.2);assert.equal(model.parts[0].localX,b.part('leftEngine').localX);assert.equal(parts[0].hitFlash,.1);
});
test('loop and coop HP is accepted once, with bounded live hazards in a long encounter',()=>{
 for(const Boss of [GIK,Ca4]){
  const {a,b}=addon(Boss);b.t.maxHp=b.maxHp;b.t.patternMultiplier=3;b.t.projectileDensity=1;
  const hp=b.maxHp;let peak=0;for(let i=0;i<6000;i++){a.tick(.02,frame);peak=Math.max(peak,a.hazards.pool.count);}
  assert.equal(b.maxHp,hp);assert.ok(peak<80);assert.equal(a.hazards.pool.dropped,0);
  const makeScaled=make(Boss,{maxHp:hp*3});assert.equal(makeScaled.b.maxHp,hp*3);assert.ok(Math.abs(makeScaled.b.part('leftEngine').maxHp-b.part('leftEngine').maxHp*3)<1e-9);
  a.dispose();assert.equal(a.hazards.pool.count,0);
 }
});
