import test from 'node:test';
import assert from 'node:assert/strict';
import {fanSalvo,fireFanSalvo,barrageStrip} from '../boss-salvo-geometry.js';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {BOSS_CATALOG} from '../headon-stageboss-patterns.js';
import {fixture} from './stageboss-fixture94.mjs';

test('a committed three-beat fan hits a straight approach but has a traversable moving opening',()=>{
 const spec={x:0,y:0,angle:Math.PI/2,speed:180,damage:10,visual:'aa-shell',tag:'test',count:13,spread:1.65,beats:3,beat:.5,warning:.9,gap:2,gapIndex:2,step:1};
 const run=evade=>{
  let hits=0;const h=new BossHazards({onDamage:()=>hits++,onStatus(){},onBarrierContact(){}});
  for(const shot of fanSalvo(spec))h.spawn({...shot,encounterId:'test'});
  const player={id:'p1',alive:true,x:0,y:250,radius:12};
  for(let t=0;t<4;t+=.01){
   if(evade){const row=Math.max(0,Math.min(2,(t-spec.warning-250/spec.speed)/spec.beat));const a=spec.angle+((2+row+.5)/12-.5)*spec.spread;player.x=Math.cos(a)*250;player.y=Math.sin(a)*250;}
   h.update(.01,{players:[player]});
  }
  return hits;
 };
 assert(run(false)>0);assert.equal(run(true),0);
});

test('the same weapon cannot layer a new phrase over its preceding rounds and recovery',()=>{
 const events=[],b={id:'b',x:0,y:0,combatTime:0,parts:new Map(),emit:e=>events.push(e)};
 const spec={x:0,y:0,angle:0,speed:180,damage:10,tag:'gun',beats:2};
 assert(fireFanSalvo(b,spec));const count=events.length;b.combatTime=1;
 assert.equal(fireFanSalvo(b,spec),false);assert.equal(events.length,count);
 b.combatTime=8;assert(fireFanSalvo(b,spec));
});

test('artillery strips leave the stated opening on both phone and desktop bounds',()=>{
 for(const width of [320,390,800,1280]){
  const gate=width*.62,gap=100,bounds={left:0,right:width},shots=barrageStrip({bounds,y:100,gate,gap,damage:10});
  assert(shots.length>0);
  for(const h of shots){assert(Math.abs(h.x-gate)>=gap/2+h.radius);assert(h.warning>=1.25);}
  assert(shots.length<24);
 }
});

test('queued rounds follow a live weapon until firing, and destruction cancels its next beats',()=>{
 const f=fixture({stageIndex:5});const e=f.addon.startBoss({x:400,y:180}),b=e.bodies.values().next().value,p=b.parts.get('engine-0');
 fireFanSalvo(b,{x:b.x+p.x,y:b.y+p.y,angle:1.5,speed:180,damage:10,visual:'l70-broadside',tag:'source-test',sourcePartId:p.id,warning:1,beats:3});
 p.x+=25;f.addon.tick(.05,f.frame);
 const queued=[];f.addon.hazards.pool.visit(h=>{if(h.tag==='source-test')queued.push(h);});assert(queued.length);
 assert.equal(queued[0].x,b.x+p.x);
 p.hp=0;f.addon.tick(.05,f.frame);assert(queued.every(h=>!h.active));
 f.addon.dispose();
});

for(const faction of ['central','entente'])test(`formation ${faction} enters combat without allied defenders, then regroups after its attack phrase`,()=>{
 const f=fixture({stageIndex:9,teamFaction:faction});f.frame.defenders=[];
 const e=f.addon.startBoss({x:400,y:180}),b=e.bodies.values().next().value;
 for(let i=0;i<100;i++)f.addon.tick(.05,f.frame);
 assert(b.entryComplete);assert.notEqual(b.phase,'formation-arrival');
 b.finalUsed=true;b.finalAge=undefined;b.recoverLeft=0;
 b.aceCycle=faction==='central'?26.2:24.2;
 f.addon.tick(.05,f.frame);assert.equal(b.formationOrder.phase,'formation-recovery');
 f.addon.dispose();
});

// Native encounter path, no replacement boss simulator or HP/damage override.
for(const [id,entry]of Object.entries(BOSS_CATALOG))for(const width of [390,1280])test(`${id} ${width}: 75 seconds, pause, finite geometry, no pool overflow`,()=>{
 const f=fixture({stageIndex:entry.stage,teamFaction:entry.faction==='entente'?'central':'entente'});
 f.frame.bounds={left:-width/2,right:width/2,top:-422,bottom:422};
 f.frame.players=[{id:'p1',alive:true,x:0,y:180,radius:12,vx:0,vy:0},{id:'p2',alive:true,x:60,y:200,radius:12,vx:0,vy:0}];
 f.frame.londonTargets=f.frame.parisTargets=[{id:'district',x:0,y:160,hp:100}];
 f.hooks.getTuning=()=>({maxHp:4000,partHp:400,damage:18,bulletSpeed:270,regionalViewWidth:width,regionalViewHeight:844,patternMultiplier:3,projectileDensity:1});
 const e=f.addon.startBoss({x:0,y:-100});assert.equal(e.bossId,id);
 let peak=0;
 for(let i=0;i<1500;i++){
  f.addon.tick(.05,f.frame);peak=Math.max(peak,f.addon.hazards.pool.count);
  f.addon.hazards.pool.visit(h=>{assert(Number.isFinite(h.x)&&Number.isFinite(h.y));assert(h.damage>=0);});
 }
 assert.equal(f.addon.hazards.pool.dropped,0,`peak ${peak}`);assert(peak<400,`peak ${peak}`);
 const time=f.addon.time;f.addon.tick(.05,{...f.frame,paused:true});assert.equal(f.addon.time,time);
 f.addon.dispose();assert.equal(f.addon.hazards.pool.count,0);
});
