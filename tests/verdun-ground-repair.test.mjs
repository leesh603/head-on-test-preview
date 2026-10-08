import test from 'node:test';
import assert from 'node:assert/strict';
import {FortDouaumont,FortSouville,VERDUN_FORT_LAYOUT,verdunFortExtents} from '../verdun-fortresses.js?v=train1';
import {verdunGroundTiles} from '../verdun-ground.js?v=train1';

const frame={players:[{id:'p1',alive:true,x:0,y:400,radius:10}],bounds:{left:-480,right:480,top:-350,bottom:650}};
function fort(Ctor){const events=[];return{events,b:new Ctor({id:'fort',x:0,y:0,tuning:{maxHp:4000,damage:20,bulletSpeed:260,regionalViewWidth:960},emit:e=>events.push(e)})};}
function tick(b,seconds){for(let t=0;t<seconds-1e-9;t+=.05)b.update(.05,frame);}
const destroy=(b,id)=>b.hit({partId:id,damage:1e9});

test('ground covers negative and large world coordinates on PC/mobile without clamping',()=>{
 for(const [w,h]of [[960,700],[390,844],[1500,900]])for(const [cx,cy]of [[0,0],[-2001,-7981],[1e6,2e6]]){
  const q=verdunGroundTiles(cx,cy,w,h,1054);
  assert(q.length<=9);assert(Math.min(...q.map(t=>t.x))<=0);assert(Math.max(...q.map(t=>t.x+t.size))>=w);
  assert(Math.min(...q.map(t=>t.y))<=0);assert(Math.max(...q.map(t=>t.y+t.size))>=h);
  const moved=verdunGroundTiles(cx+.25,cy+.5,w,h,1054);
  const first=q[0],same=moved.find(t=>Math.abs(t.x-(first.x-.25))<1e-7&&Math.abs(t.y-(first.y-.5))<1e-7);
  assert(same,'ground moves at native world speed, including subpixel camera motion');
 }
});
test('enlarged hull and outer gun hits retain the same world extents at all view sizes',()=>{
 for(const Ctor of [FortDouaumont,FortSouville]){
  const {b}=fort(Ctor),cfg=VERDUN_FORT_LAYOUT[b.kind],hull=verdunFortExtents(b);
  assert(cfg.width>=1394);assert.equal(hull.halfWidth,cfg.width*b.fortScale/2);
  for(const p of b.parts.values())if(p.hittable)assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y}).partId,p.id);
 }
});
test('both fortresses repair AA after 18 seconds with warning and a fresh attack grace period',()=>{
 for(const Ctor of [FortDouaumont,FortSouville]){
  const {b,events}=fort(Ctor),p=b.parts.get('aa-left');destroy(b,p.id);tick(b,14.9);
  assert(p.destroyed&&!p.hittable);assert(!events.some(e=>e.type==='hazard'&&e.tag===b.tag(p.id)));
  tick(b,.2);assert(events.some(e=>e.type==='fort-aa-repairing'&&e.partId===p.id));
  tick(b,3);assert(!p.destroyed&&p.hittable);assert.equal(p.hp,p.maxHp);
  assert.equal(events.filter(e=>e.type==='fort-aa-restored').length,1);
  events.length=0;tick(b,1);assert(!events.some(e=>e.type==='hazard'&&e.tag===b.tag(p.id)));
  tick(b,2);assert(events.some(e=>e.type==='hazard'&&e.tag===b.tag(p.id)));
 }
});
test('repaired AA cannot repeatedly drain or heal the fortress core HP budget',()=>{
 for(const Ctor of [FortDouaumont,FortSouville]){
  const {b}=fort(Ctor);destroy(b,'aa-left');const hp=b.hp;tick(b,18.1);assert.equal(b.hp,hp);
  const result=destroy(b,'aa-left');assert(result.damage>0);assert.equal(result.bodyDamage,0);assert.equal(b.hp,hp);
 }
});
test('ammunition destruction cancels a pending repair permanently',()=>{
 for(const Ctor of [FortDouaumont,FortSouville]){
  const {b,events}=fort(Ctor);destroy(b,'aa-left');
  if(Ctor===FortDouaumont){destroy(b,'heavy-left');destroy(b,'ammo-left');}
  else{destroy(b,'observer');destroy(b,'command');destroy(b,'ammo');}
  tick(b,25);assert(b.parts.get('aa-left').destroyed);assert.equal(b.parts.get('aa-left').repairRemaining,0);
  assert(!events.some(e=>e.type==='fort-aa-restored'&&e.partId==='aa-left'));
 }
});
test('defeated or paused native encounters cannot repair AA',async()=>{
 const {BossEncounter}=await import('../headon-stageboss-core.js?v=train1');
 const {b,events}=fort(FortDouaumont);destroy(b,'aa-left');const encounter=new BossEncounter({id:'encounter',bossId:b.kind,bodies:[b]});
 const remaining=b.parts.get('aa-left').repairRemaining;encounter.update(0,frame);assert.equal(b.parts.get('aa-left').repairRemaining,remaining);
 for(const id of ['heavy-left','heavy-right','ammo-left','ammo-right'])destroy(b,id);
 b.hit({damage:b.hp});encounter.update(50,frame);assert(b.parts.get('aa-left').destroyed);assert(!events.some(e=>e.type==='fort-aa-restored'));
});
