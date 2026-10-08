import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js?v=tame3';
import {BossHazards} from '../headon-stageboss-hazards.js?v=tame3';
import {armorAngleDelta} from '../trench-armor-layout.js?v=tame3';
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=tame3');
const {CoopGame}=await import('../coop-engine.js?v=tame3');
const tuning={maxHp:2400,partHp:280,damage:18,bulletSpeed:270,geometryScale:2.025,projectileDensity:.85,patternMultiplier:1};
const quiet={inputMode:'gamepad',fireHeld:false};
function engine(count,stage){
 const g=count===2?new CoopGame([{pilot:'fonck'},{pilot:'collishaw'}],{rng:()=>.5}):new Game('camel','fonck',()=>.5);
 g.viewWidth=390;g.viewHeight=844;g.update(.001,{});
 Object.assign(g.stageBoss.stages,{stageIndex:stage,phase:'explore',encounter:null});g.region=stage;
 for(const key of ['spawn','nextBossAt','nextHeavyAt','need','eventTimer','patrolTimer','allyTimer'])g[key]=Infinity;
 for(const p of g.players||[g]){p.need=Infinity;p.fire=Infinity;p.invuln=Infinity;}
 g.stageBoss.startBoss({x:g.x,y:g.y-240});return g;
}
for(const count of [1,2])for(const stage of [0,2,5,6,10,12,13,15])test(`native ${count}-player stage ${stage}: bosses receive actual movement, including high refresh and pause`,()=>{
 const g=engine(count,stage),ps=g.players||[g],input=count===2?{p1:quiet,p2:{...quiet,steer:.6}}:quiet;
 for(const dt of [.04,.02,1/240]){
  const before=ps.map(p=>({x:p.x,y:p.y}));g.update(dt,input);
  const frames=g.stageBoss.frameContext.players;
  for(let i=0;i<ps.length;i++){
   const vx=(ps[i].x-before[i].x)/dt,vy=(ps[i].y-before[i].y)/dt;
   assert(Math.hypot(vx,vy)>50,'native flight actually moved');
   assert(Math.abs(frames[i].vx-vx)<1e-7,'x velocity matches real flight');
   assert(Math.abs(frames[i].vy-vy)<1e-7,'y velocity matches real flight');
  }
 }
 const frozen=JSON.stringify(g.stageBoss.frameContext);g.state='paused';g.update(.04,input);
 assert.equal(JSON.stringify(g.stageBoss.frameContext),frozen);
 g.state='playing';g.update(.02,input);
 assert(g.stageBoss.frameContext.players.every(p=>Math.hypot(p.vx,p.vy)<1000),'pause does not accumulate displacement');
});
function boss(kind){const events=[],enc=createBossEncounter({id:'rhythm-'+kind,bossId:kind,tuning,x:0,y:-200,rng:()=>.5,emit:e=>events.push(e)});return{b:enc.bodies.values().next().value,events,enc};}
for(const kind of ['a7v-flak','mark-v-cruiser'])test(`${kind}: three swept beats, breathing gap, real paired mounts and destroyed-sector opening`,()=>{
 const {b,events}=boss(kind),r={clock:0,index:0,stage:'spin'},beats=[];b.rotation=r;
 for(let tick=0;tick<130;tick++){
  const before=events.length;b.rotatingFire(.02,r);
  const shots=events.slice(before).filter(e=>e.kind==='projectile');
  if(shots.length)beats.push({at:tick*.02,tags:[...new Set(shots.map(s=>s.tag))]});
 }
 assert(beats.length>=6);
 for(let i=1;i<beats.length;i++){
  const gap=beats[i].at-beats[i-1].at;
  assert(i%3===0?gap>=.76&&gap<=.82:gap>=.2&&gap<=.26,'three pulses then a longer exit window');
 }
 assert.equal(beats[0].tags.length,2);
 if(kind==='a7v-flak')assert.notDeepEqual(beats[0].tags,beats[3].tags,'fore/aft then flank batteries');
 const gun=b.parts.get(b.gunIds[0]);gun.hp=0;events.length=0;r.index=0;r.clock=0;b.rotatingFire(.02,r);
 assert(!events.some(e=>e.kind==='projectile'&&e.tag===b.gunTag(gun)));
 for(const g of b.liveGuns())g.aimAngle=g.baseAngle+.2;
 b.aim(1,[{alive:true,x:1000,y:1000}]);
 for(const g of b.liveGuns())assert(Math.abs(armorAngleDelta(g.aimAngle,g.baseAngle))<1e-9,'barrel does not counter-track the warned hull sweep');
});
function runBombs(events,p,dodge){
 const hits=[],hazards=new BossHazards({onDamage:(id,damage,h)=>hits.push({id,damage,age:h.age}),onStatus(){},onBarrierContact(){}});
 for(const e of events)hazards.spawn({...e,encounterId:'test'});
 const start={...p},speed=Math.hypot(p.vx,p.vy),nx=-p.vy/speed,ny=p.vx/speed;
 const step=events[0].radius/.52,side=dodge||0;
 for(let i=1;i<=130;i++){
  const t=i*.02,offset=side*step*Math.min(1,t/.9);
  // A bounded lateral manoeuvre into the visible gap, without teleporting.
  p.x=start.x+start.vx*t+nx*offset;p.y=start.y+start.vy*t+ny*offset;
  hazards.update(.02,{players:[p]});
 }
 return hits;
}
for(const heading of [-Math.PI/2,0,Math.PI/4])test(`L70 ${heading}: telegraphed carpet intercepts straight flight but has a reachable alternating exit`,()=>{
 const {b,events}=boss('zeppelin-l70'),p={id:'p1',alive:true,x:0,y:0,a:heading,vx:Math.cos(heading)*190,vy:Math.sin(heading)*190,radius:12};
 for(const pass of [0,1]){
  events.length=0;b.bombingRun(p,{left:-195,right:195,top:-422,bottom:422});
  const bombs=events.filter(e=>e.visual==='carpet-bomb');assert.equal(bombs.length,4);
  assert(bombs.every(e=>e.warning===1.2&&e.delay>=0&&!e.lockAtWarning));
  assert(runBombs(bombs,{...p},0).length>0,'straight flight is no longer an automatic dodge');
  const exit=pass===0?-1:1;
  assert.equal(runBombs(bombs,{...p},exit).length,0,'announced side gap is genuinely safe');
 }
});
test('L70 routes both cloud and exposed bombs through timed corridors without bypassing capsule/engine phases',()=>{
 const {b,enc,events}=boss('zeppelin-l70'),frame={players:[{id:'p1',alive:true,x:0,y:0,vx:0,vy:-190,radius:12}],bounds:{left:-195,right:195,top:-422,bottom:422}};
 b.timers.set('carpet',0);enc.update(.02,frame);assert.equal(events.filter(e=>e.visual==='carpet-bomb').length,4);assert(!b.coreVulnerable);
 b.hit({partId:'capsule',damage:99999});for(let i=0;i<60;i++)enc.update(.02,frame);
 assert.equal(b.phase,'exposed');assert(b.liveEngines().every(e=>e.hittable));
 events.length=0;b.timers.set('bombline',0);enc.update(.02,frame);
 const bombs=events.filter(e=>e.visual==='carpet-bomb');assert.equal(bombs.length,4);assert(bombs.every(e=>e.damage===tuning.damage*.7));
});
