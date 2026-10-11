import test from 'node:test';
import assert from 'node:assert/strict';
import {TRENCH_SECTORS,trenchSoldierPose,trenchSupportPose,drawTrenchFrontline,TRENCH_LIMITS} from '../trench-frontline.js';

test('assault tracks have two bounds, cover, scatter, withdrawal and finite casualties',()=>{
 const p={},states=new Set();
 for(const s of TRENCH_SECTORS.filter(s=>s.role==='assault'))for(let n=0;n<s.count;n++){
  let previous=null;
  for(let t=0;t<34;t+=.05){
   trenchSoldierPose(s,n,t,p);states.add(p.state);
   assert.ok(Number.isFinite(p.along+p.forward+p.heading));assert.ok(p.alpha>=0&&p.alpha<=1);
   assert.ok(Math.abs(p.along)<55&&p.forward>=-20&&p.forward<=70,'inside authored dry apron');
   // Except the deliberate hit/pose transition, movement is continuous.
   if(previous&&p.state!=='fallen'&&previous.state!=='fallen')assert.ok(Math.hypot(p.along-previous.along,p.forward-previous.forward)<4,'no loop teleport');
   previous={...p};
  }
 }
 for(const state of ['advance','cover','scatter','prone','withdraw','fallen','fire'])assert.ok(states.has(state),state);
 const s=TRENCH_SECTORS[0];trenchSoldierPose(s,s.count-1,29,p);assert.equal(p.alpha,0);
});

test('defenders hold while assault groups move; rear parties remain on their routes',()=>{
 const a={},b={};trenchSoldierPose(TRENCH_SECTORS[0],1,11,a);trenchSoldierPose(TRENCH_SECTORS[1],1,11,b);
 assert.equal(a.state,'advance');assert.equal(b.state,'fire');assert.ok(a.forward>30);assert.equal(Math.abs(b.forward),0);
 for(const s of TRENCH_SECTORS){let prev=null;for(let t=0;t<=68;t+=.05){trenchSupportPose(s.rear,t,a);
  assert.ok(a.x>=Math.min(...s.rear.map(p=>p[0]))-.001&&a.x<=Math.max(...s.rear.map(p=>p[0]))+.001);
  assert.ok(a.y>=Math.min(...s.rear.map(p=>p[1]))-.001&&a.y<=Math.max(...s.rear.map(p=>p[1]))+.001);
  if(prev)assert.ok(Math.hypot(a.x-prev.x,a.y-prev.y)<1,'continuous at route reversal');prev={...a};
 }}
});

test('long camera travel has hard troop/FX ceilings and cannot alter canvas state',()=>{
 const c={globalAlpha:.63},fxKeys=new Set();
 for(const density of [1,.65])for(let n=0;n<600;n++){
  let draws=0,fx=0;
  const stats=drawTrenchFrontline(c,n*67-9000,n*37-4000,density===1?1920:390,density===1?1080:844,1254,n*.19,density,{unit(){draws++},fx(c,key){fx++;fxKeys.add(key)}});
  assert.ok(stats.troops<=(density===1?TRENCH_LIMITS.troops:TRENCH_LIMITS.mobileTroops));
  assert.ok(stats.sectors<=(density===1?6:3));assert.ok(fx<=(density===1?48:24));assert.ok(draws<=stats.troops+1);
  assert.equal(c.globalAlpha,.63);
 }
 assert.ok(fxKeys.has('muzzle')&&fxKeys.has('dirtBurst')&&fxKeys.has('smokeDust')&&fxKeys.has('fireGround'));
 assert.ok(![...fxKeys].some(k=>/airblast|explosionHot|flameJet/.test(k)));
});
