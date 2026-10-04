import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js?v=524';
import {sommePoint,sommeMuzzle,landshipClearance} from '../somme-boss-layout.js?v=524';
import {renderStageBossLayer} from '../headon-stageboss-render.js?v=524';
import {fixture,step} from './stageboss-fixture94.mjs';
const tuning={maxHp:3000,partHp:360,damage:20,bulletSpeed:240,regionalViewWidth:800,regionalViewHeight:600,patternMultiplier:1};
const context={players:[{id:'a',alive:true,x:320,y:470,vx:35,vy:0},{id:'b',alive:true,x:540,y:460,vx:0,vy:-20}],bounds:{left:0,right:800,top:0,bottom:600}};
function encounter(bossId,extra={}){const events=[];const e=createBossEncounter({id:'somme',bossId,tuning:{...tuning,...extra},x:400,y:230,emit:event=>events.push(event),rng:()=>.5});return{e,events,b:[...e.bodies.values()][0]};}
function tick(e,n=1,ctx=context){for(let t=0;t<n;t+=.05)e.update(.05,ctx);}
test('Mark I is three independent hulls with one conserved HP budget and retained wrecks',()=>{
 const {e,b}=encounter('mark4-wedge');assert.equal(e.bodies.size,3);assert.equal(e.maxHpBudget,tuning.maxHp);assert.deepEqual([...e.bodies.values()].map(b=>b.tankRole),['male','female','female']);
 const next=[...e.bodies.values()][1];b.hit({damage:99999});assert.equal(next.hp,next.maxHp);assert.equal(e.completed,false);
 const drawn=[];renderStageBossLayer({stages:{encounter:e},hazards:{pool:{visit(){}}}},{drawBody:b=>drawn.push(b),drawPart(){},drawHazard(){}});assert.equal(drawn.length,3);assert.equal(drawn[0].destroying,true);assert.equal(drawn[0].tankRole,'male');
 next.hit({damage:99999});assert.equal(e.completed,false);[...e.bodies.values()][2].hit({damage:99999});assert.equal(e.completed,true);
});
test('part damage transfers once, blocked/dead parts do not drain the body',()=>{
 for(const id of ['mark4-wedge','morser-battery']){const {b}=encounter(id),p=[...b.parts.values()][0],hp=b.hp,r=b.hit({partId:p.id,damage:p.maxHp*10});assert.equal(r.damage,p.maxHp);assert.equal(hp-b.hp,p.maxHp*.8);const after=b.hp;assert.equal(b.hit({partId:p.id,damage:99999}).damage,0);assert.equal(b.hp,after);}
});
test('observer cancels committed tracking and subsequent blind barrage ignores player position',()=>{
 const {e,b,events}=encounter('morser-battery');b.planBarrage(context.players,context.bounds);assert.equal(b.lock.mode,'tracked');const captured=b.lock.x;context.players[0].x+=100;assert.equal(b.lock.x,captured);context.players[0].x-=100;
 b.hit({partId:'observer',damage:99999});assert.equal(b.lock,null);assert(events.some(e=>e.type==='cancel-hazards'&&e.tag===b.tag('barrage')));
 const p1=[{id:'x',alive:true,x:50,y:80}],p2=[{id:'x',alive:true,x:750,y:560}];b.wave=0;b.planBarrage(p1,context.bounds);const q={x:b.lock.x,y:b.lock.y};b.lock=null;b.wave=0;b.planBarrage(p2,context.bounds);assert.equal(b.lock.mode,'blind');assert.deepEqual({x:b.lock.x,y:b.lock.y},q);
 tick(e,1);assert(events.some(e=>e.visual==='somme-heavy-shell'&&e.warning>=2));
});
test('barrage leaves the advertised corridor clear and has bounded warnings on mobile',()=>{
 for(const width of [390,800]){const {b,events}=encounter('morser-battery',{regionalViewWidth:width}),bounds={left:0,right:width,top:0,bottom:844},players=[{id:'p',alive:true,x:width*.5,y:500}];b.planBarrage(players,bounds);b.launchBarrage();const q=b.salvo,shots=events.filter(e=>e.visual==='somme-heavy-shell');assert(shots.length>0);assert(shots.length<=5);for(const shot of shots){assert(Math.abs(shot.x-q.gate)-shot.radius>=q.width/2);assert(shot.x-shot.radius>=bounds.left);assert(shot.x+shot.radius<=bounds.right);assert(shot.warning>=1.5);}}
});
test('ammo cookoff happens once, slows reload, and two heavy mounts or both support nodes expose the core',()=>{
 const {b,events}=encounter('morser-battery');assert.equal(b.hit({damage:100}).blocked,true);const original=b.reloadInterval();b.hit({partId:'ammo',damage:99999});assert(b.reloadInterval()>original);const hp=b.hp;b.hit({partId:'ammo',damage:99999});assert.equal(b.hp,hp);assert.equal(events.filter(e=>e.type==='internal-explosion').length,1);assert.equal(b.coreVulnerable,false);b.hit({partId:'observer',damage:99999});assert.equal(b.coreVulnerable,true);
 const other=encounter('morser-battery').b;other.hit({partId:'gun-left',damage:99999});assert.equal(other.coreVulnerable,false);other.hit({partId:'twin-aa',damage:99999});assert.equal(other.coreVulnerable,true);
});
test('one track slows independent movement; two tracks stop position and heading',()=>{
 const healthy=encounter('mark4-wedge'),hurt=encounter('mark4-wedge');hurt.b.hit({partId:'track-left',damage:99999});tick(healthy.e,1);tick(hurt.e,1);const distance=b=>Math.hypot(b.x-400,b.y-130);assert(distance(hurt.b)<distance(healthy.b));
 hurt.b.hit({partId:'track-right',damage:99999});const pose=[hurt.b.x,hurt.b.y,hurt.b.hullYaw];tick(hurt.e,5);assert.deepEqual([hurt.b.x,hurt.b.y,hurt.b.hullYaw],pose);assert.equal(hurt.b.phase,'tracks-disabled');assert(hurt.e.bodies.get('somme:mark1:1').driveMoving);
});
test('destroying a sponson cancels its windup and no dead mount fires',()=>{
 const {e,b,events}=encounter('mark4-wedge');b.timers.set('sponson-left',0);tick(e,.1);assert.equal(b.salvo.partId,'sponson-left');b.hit({partId:'sponson-left',damage:99999});assert.equal(b.salvo,null);events.length=0;tick(e,15);assert(!events.some(e=>e.type==='hazard'&&e.tag===b.tag('sponson-left')));
 for(const other of e.bodies.values())for(const id of ['sponson-left','sponson-right'])other.hit({partId:id,damage:99999});events.length=0;tick(e,12);assert.equal(events.filter(e=>e.type==='hazard').length,0);
});
test('rotated swept hitboxes, live mount coordinates and muzzle renderer data agree',()=>{
 const {b}=encounter('mark4-wedge');const p=b.parts.get('track-left'),q=sommePoint(b,p.hitLocalX,p.localY);assert.equal(b.locateHit({x:q.x,y:q.y,radius:0}).partId,p.id);assert.equal(b.locateHit({previousX:q.x-90,previousY:q.y,x:q.x+90,y:q.y,radius:1}).partId,p.id);
 const gun=b.parts.get('sponson-left'),m=sommeMuzzle(b,gun);assert.equal(m.x,b.x+gun.x+Math.cos(gun.angle)*gun.muzzleLength);assert.equal(m.y,b.y+gun.y+Math.sin(gun.angle)*gun.muzzleLength);
});
test('pause freezes Somme windup/motion; complete encounter clears its owned hazards',()=>{
 const f=fixture({stageIndex:10,teamFaction:'entente'}),e=f.addon.startBoss({x:400,y:230}),b=[...e.bodies.values()][0];b.timers.set('barrage',0);step(f,.2);const state=JSON.stringify({clock:b.clock,lock:b.lock,x:b.x,y:b.y});f.frame.paused=true;step(f,3);assert.equal(JSON.stringify({clock:b.clock,lock:b.lock,x:b.x,y:b.y}),state);f.frame.paused=false;
 for(const p of b.parts.values())b.hit({partId:p.id,damage:99999});b.hit({damage:99999});f.addon.reconcile({blocked:true});let count=0;f.addon.hazards.pool.visit(()=>count++);assert.equal(count,0);
});
test('rotating tanks separate over a full route cycle and yield to an immobilized tank',()=>{
 for(const width of [390,800]){const {e,b}=encounter('mark4-wedge',{regionalViewWidth:width}),ctx={...context,bounds:{left:400-width/2,right:400+width/2,top:0,bottom:844}};b.hit({partId:'track-left',damage:99999});b.hit({partId:'track-right',damage:99999});const pose=[b.x,b.y,b.hullYaw];
  for(let i=0;i<2200;i++){e.update(.05,ctx);const bs=[...e.bodies.values()];for(let a=0;a<3;a++)for(let j=a+1;j<3;j++)assert(landshipClearance(bs[a],bs[j])>=-.5,'tank silhouette overlaps');}assert.deepEqual([b.x,b.y,b.hullYaw],pose);
 }
});
test('observed heavy barrage places its safe corridor beside the captured pilot',()=>{
 const {b}=encounter('morser-battery');b.planBarrage(context.players,context.bounds);assert(Math.abs(b.lock.x-b.lane.x)>b.lane.width/2);assert.equal(b.lane.x,b.lock.gate);
});
