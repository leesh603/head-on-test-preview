import test from 'node:test';
import assert from 'node:assert/strict';
import {ParisGun,LIncomparable} from '../headon-stageboss-patterns.js?v=tame3&rail=41';
import {brunoSalvo} from '../bruno-raid.js?v=tame3&rail=41';
import {BossHazards} from '../headon-stageboss-hazards.js';
const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,warningSeconds:1.15,railCycle:5.4,barrageInterval:.26};
const frame={players:[{id:'p1',alive:true,x:0,y:0,vx:0,vy:-180,radius:12}],bounds:{left:-480,right:480,top:-350,bottom:350}};
function make(Type=ParisGun){const events=[],b=new Type({id:'bruno',x:0,y:-460,tuning,faction:'central',emit:e=>events.push(e)});return {b,events};}
function run(b,time,ctx=frame){for(let t=0;t<time-1e-8;t+=.02)b.update(Math.min(.02,time-t),ctx);}
function aim(b,ctx=frame){b.rail129.target=null;b.rail129.enter('aim');b.update(.02,ctx);}
function expose(b){for(const id of b.railCarOrder)b.hit({partId:id,damage:1e6});}
for(const [w,h] of [[1280,800],[487.5,1055],[390,844]])for(const coop of [false,true])test(`entry: ${w}x${h} ${coop?'coop':'solo'} actual body crosses visible rail without camera/player writes`,()=>{
 const {b,events}=make(),ctx={players:[{...frame.players[0]},...(coop?[{...frame.players[0],id:'p2',x:50}]:[])],bounds:{left:-w/2,right:w/2,top:-h/2,bottom:h/2}};
 const original=structuredClone(ctx);b.update(.02,ctx);const track={...b.rail129.railTarget},start=b.y;assert.equal(b.phase,'arrival');assert.equal(events.some(e=>e.type==='hazard'),false);
 run(b,1.8,ctx);assert(b.y<start);assert(b.y<ctx.bounds.bottom&&b.y>ctx.bounds.top);assert.deepEqual(b.rail129.pose,{x:b.x,y:b.y});assert.deepEqual(b.rail129.railTarget,track);
 run(b,2.1,ctx);assert.equal(b.entry,null);assert(b.y>=ctx.bounds.top+150&&b.y<ctx.players[0].y-120);assert.deepEqual(ctx,original);assert(events.some(e=>e.type==='rural-rail-brake'));assert.equal(events.some(e=>e.type==='hazard'),false);
 run(b,.8,ctx);assert.equal(b.rail129.phase,'aim');assert.equal(b.aimPlan.mode,'ranging');assert.equal(events.filter(e=>e.type==='bruno-rail-discovered').length,1);
});
test('entry also stays visible while the real camera follows a forward-flying player',()=>{
 const {b}=make();let visible=0;for(let t=0;t<3.8;t+=.02){const y=-180*t,ctx={players:[{...frame.players[0],y}],bounds:{left:-240,right:240,top:y-527,bottom:y+527}};b.update(.02,ctx);if(t>1.4){assert(b.y>=ctx.bounds.top&&b.y<=ctx.bounds.bottom);visible++;}}assert(visible>100);assert.equal(b.entry,null);
});
test('an early rail break interrupts the entry without reflecting the train to a different position',()=>{
 const {b}=make();let y=0;for(let t=0;t<3;t+=.02){y=-180*t;b.update(.02,{players:[{...frame.players[0],y}],bounds:{left:-240,right:240,top:y-527,bottom:y+527}});}
 const before=b.y,track={...b.rail129.railTarget};b.hit({partId:'rail',damage:1e6});b.update(.02,{...frame,players:[{...frame.players[0],y}]});assert.equal(b.entry,null);assert(Math.abs(b.y-before)<20);assert.deepEqual(b.rail129.railTarget,track);assert.deepEqual(b.rail129.pose,{x:b.x,y:b.y});
});
test('partial rear damage enters Phase II while its gun is still intact, with delayed AA after the salvo',()=>{
 const {b,events}=make(),rear=b.parts.get('car-rear');b.hit({partId:rear.id,damage:rear.maxHp*.5});const ctx={...frame,players:[{...frame.players[0],x:200,y:b.y+rear.y}]};aim(b,ctx);assert.equal(b.raidPhase,2);assert.equal(rear.destroyed,false);assert.equal(b.aimPlan.mode,'tracking');run(b,3,ctx);assert(events.some(e=>e.visual==='rail-shell'));assert(b.aaClock>0&&b.aaClock<=.3);run(b,.12,ctx);assert(b.aaPlan);run(b,.48,ctx);assert(events.some(e=>e.visual==='rail-mg'));run(b,10,ctx);assert.equal(events.filter(e=>e.phase==='bruno-tracking').length,1);
});
test('observer loss interrupts an unfired plan, preserves its old sector, and never reacquires a fleeing pilot',()=>{
 const {b,events}=make();b.hit({partId:'car-rear',damage:1e6});aim(b);const old={...b.aimPlan.target};b.hit({partId:'car-middle',damage:1e6});const far={...frame,players:[{...frame.players[0],x:1000,y:1000}]};run(b,.1,far);assert(b.aimPlan.blind);assert.deepEqual(b.aimPlan.target,{...old,vx:0,vy:0});run(b,3,far);assert(events.filter(e=>e.visual==='rail-shell').every(e=>e.x<500&&e.y<500));
});
for(const broken of [false,true])test(`existing 28% runaway triggers iron rain exactly once, then derails (${broken?'broken':'intact'} rail)`,()=>{
 const {b,events}=make();aim(b);if(broken)b.hit({partId:'rail',damage:1e6});expose(b);b.hit({damage:1e6});assert.equal(b.hp,b.maxHp*.28);assert.equal(b.phase,'runaway');assert.equal(b.coreVulnerable,false);assert.equal(b.hit({damage:100}).damage,0);const plan=structuredClone(b.barrage);
 assert.equal(plan.points.length,broken?2:6);assert.deepEqual(plan.points[0],{x:0,y:0});run(b,broken?.92:3.3);const shots=events.filter(e=>e.type==='hazard'&&e.tag==='bruno:iron-rain');assert.equal(shots.length,plan.points.length);assert.deepEqual(shots.map(e=>({x:e.x,y:e.y})),plan.points);
 assert.equal(events.filter(e=>e.type==='bruno-iron-rain').length,1);assert.equal(events.filter(e=>e.type==='rail-runaway').length,1);assert.equal(b.phase,'derailed');assert.equal(b.coreVulnerable,true);const n=shots.length;run(b,3);assert.equal(events.filter(e=>e.type==='hazard'&&e.tag==='bruno:iron-rain').length,n);assert(b.hit({damage:1e6}).bodyDefeated);
});
test('breaking the rail during iron rain cancels its committed hazards and pending shots',()=>{
 const {b,events}=make();aim(b);expose(b);b.hit({damage:1e6});run(b,.35);const fired=events.filter(e=>e.type==='hazard'&&e.tag==='bruno:iron-rain').length;b.hit({partId:'rail',damage:1e6});assert.equal(b.barrage,null);assert(events.some(e=>e.type==='cancel-hazards'&&e.tag==='bruno:iron-rain'));run(b,.7);assert.equal(b.phase,'derailed');assert.equal(events.filter(e=>e.type==='hazard'&&e.tag==='bruno:iron-rain').length,fired);
});
test('iron rain first impact covers the current pilot even at a viewport edge',()=>{const p={x:185,y:485,vx:180,vy:0},plan=brunoSalvo(p,2,0,{left:-195,right:195,top:-500,bottom:500},{final:true,starved:true});assert.deepEqual(plan.points[0],{x:p.x,y:p.y});});
for(const width of [390,487.5,960])for(const mode of ['ranging','tracking','cross','iron-rain'])test(`telegraphed ${mode} has a damage-free flight route on ${width}px playfield`,()=>{
 const phase=mode==='ranging'?1:2,shot=mode==='cross'?1:0,bounds={left:-width/2,right:width/2,top:-500,bottom:500};
 const plan=brunoSalvo({x:0,y:0,vx:0,vy:-180},phase,shot,bounds,{final:mode==='iron-rain',starved:true});
 assert(plan.points.every(p=>p.x>=bounds.left+plan.radius+28&&p.x<=bounds.right-plan.radius-28&&p.y>=bounds.top+plan.radius+28&&p.y<=bounds.bottom-plan.radius-28));
 // Test actual hazard activation/collision with a lateral turn, rather than
 // checking only that a geometric gap exists. Start at the targeted position.
 let best=Infinity;
 for(const direction of [-1,1]){const hits=[],h=new BossHazards({onDamage:()=>hits.push(1),onStatus(){},onBarrierContact(){}});for(let i=0;i<plan.points.length;i++)h.spawn({encounterId:'qa',kind:'circle',...plan.points[i],damage:18,warning:plan.warning,delay:i*plan.interval,duration:plan.duration,radius:plan.radius,once:true});
  for(let t=0;t<4;t+=.02){const x=direction*Math.min(width/2-20,t*180),p={id:'p',alive:true,x,y:0,radius:12};h.update(.02,{players:[p]});}best=Math.min(best,hits.length);assert.equal(h.pool.count,0);
 }assert.equal(best,0);
});
test('the two train guns retain distinct entry timing and salvo identities',()=>{const {b}=make(LIncomparable);assert(b.entry);assert.equal(b.raidPhase,1);aim(b);assert.equal(b.aimPlan.mode,'heavy-shell');run(b,2);assert.equal(b.railGun.shotCount,1);assert.equal(b.rail129.c.aimSeconds,1.8);assert.equal(b.barrage,null);});
