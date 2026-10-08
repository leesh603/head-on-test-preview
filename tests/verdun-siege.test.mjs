import test from 'node:test';
import assert from 'node:assert/strict';
import {FortDouaumont,FortSouville,verdunFortMuzzle} from '../verdun-fortresses.js?v=sfx2';
const frame={players:[{id:'p1',alive:true,x:0,y:400,vx:0,vy:0},{id:'p2',alive:true,x:60,y:430,vx:0,vy:0}],bounds:{left:-195,right:195,top:-422,bottom:422}};
function fixture(Ctor){const events=[],b=new Ctor({id:'fort',x:0,y:-200,tuning:{maxHp:4000,damage:20,bulletSpeed:260,verdunScale:.8},emit:e=>events.push({...e,at:b.clock})});return{b,events};}
function tick(b,seconds){for(let t=0;t<seconds-1e-9;t+=.02)b.update(.02,frame);}
const destroy=(b,id)=>b.hit({partId:id,damage:1e9});
test('Douaumont final shells use living heavy muzzles, alternate flanks and leave the phone centre open',()=>{
 const {b,events}=fixture(FortDouaumont);b.hp=b.maxHp*.44;tick(b,9.1);assert(b.lastStand);tick(b,14);
 const end=events.find(e=>e.phase==='verdun-recovery').at,shots=events.filter(e=>e.visual==='verdun-heavy-shell'&&e.at<end);assert(shots.length>=2);assert(shots.every(e=>Math.abs(e.x)>e.radius+35));
 assert(shots.some(e=>e.x<0)&&shots.some(e=>e.x>0));assert.equal(events.filter(e=>e.phase==='douaumont-last-barrage').length,1);
 for(const e of shots){const p=b.parts.get(e.tag.split(':').at(-1));assert(p&&!p.destroyed);assert(Math.hypot(e.sourceX-b.x-p.x,e.sourceY-b.y-p.y)>p.muzzleLength-10);}
});
test('Douaumont destroying the last heavy cancels its queued fire and opens a genuine recovery interval',()=>{
 const {b,events}=fixture(FortDouaumont);b.hp=b.maxHp*.44;tick(b,10);for(const id of ['heavy-left','heavy-right'])destroy(b,id);events.length=0;tick(b,.02);assert(b.recovery>3);
 tick(b,2.5);assert(!events.some(e=>e.type==='hazard'));assert.equal(b.lastStand,null);
});
test('no fortress fires from an invented central gun after all weapons are destroyed',()=>{
 for(const Ctor of [FortDouaumont,FortSouville]){const {b,events}=fixture(Ctor);for(const p of b.parts.values()){p.hittable=true;destroy(b,p.id);}events.length=0;tick(b,25);assert(!events.some(e=>e.type==='hazard'||e.type==='muzzle'));}
});
test('a gun recoils along its barrel, keeping its shot origin on the illustrated tip',()=>{
 const {b,events}=fixture(FortDouaumont),p=b.parts.get('heavy-left');p.angle=.72;const before=verdunFortMuzzle(b,p);b.shell(p,{x:0,y:300});const after=verdunFortMuzzle(b,p),shot=events.find(e=>e.type==='hazard');assert(Math.hypot(before.x-after.x,before.y-after.y)>0);assert.equal(shot.sourceX,after.x);assert.equal(shot.sourceY,after.y);tick(b,.3);assert.equal(p.recoil,0);
});
test('part art eases through damage, opening and repair while ammunition immediately cancels rebuilding',()=>{
 const {b}=fixture(FortDouaumont),p=b.parts.get('aa-left');destroy(b,p.id);tick(b,.1);assert(p.damageBlend>0&&p.damageBlend<1);tick(b,16);assert(p.repairBlend>0&&p.repairBlend<1);destroy(b,'heavy-left');destroy(b,'ammo-left');assert.equal(p.repairRemaining,0);tick(b,10);assert(p.destroyed);
});
test('paused fortress updates freeze attacks, rebuilds, transitions and final orders',()=>{
 const {b}=fixture(FortDouaumont);destroy(b,'aa-left');b.hp=b.maxHp*.44;tick(b,9.1);const before=JSON.stringify([b.clock,b.lastStand,b.recovery,[...b.parts.values()]]);b.update(10,{...frame,paused:true});assert.equal(JSON.stringify([b.clock,b.lastStand,b.recovery,[...b.parts.values()]]),before);
});
test('Souville final pits keep a phone escape corridor and destroyed pits never take a turn',()=>{
 const {b,events}=fixture(FortSouville);b.hp=b.maxHp*.38;b.parts.get('pit-left').hittable=true;destroy(b,'pit-left');tick(b,20);
 const end=events.find(e=>e.phase==='verdun-recovery').at,shots=events.filter(e=>e.type==='hazard'&&e.at<end);assert(shots.length>0);assert(shots.every(e=>e.tag!==b.tag('pit-left')));assert(shots.every(e=>Math.abs(e.x)>e.radius+35));assert.equal(events.filter(e=>e.phase==='souville-last-resistance').length,1);
});
test('Souville observation and command loss weaken final resistance without reactivating reserves',()=>{
 const healthy=fixture(FortSouville),weak=fixture(FortSouville);for(const f of [healthy,weak]){f.b.hp=f.b.maxHp*.38;f.b.parts.get('reserve-left').active=true;}
 destroy(weak.b,'observer');destroy(weak.b,'command');tick(healthy.b,25);tick(weak.b,25);
 const count=f=>{const end=f.events.find(e=>e.phase==='verdun-recovery').at;return f.events.filter(e=>e.type==='hazard'&&e.at<end).length;};assert(count(weak)<count(healthy));const end=weak.events.find(e=>e.phase==='verdun-recovery').at;assert(!weak.events.some(e=>e.type==='hazard'&&e.at<end&&e.tag===weak.b.tag('reserve-left')));assert(!weak.b.parts.get('reserve-right').active);
});
test('Souville pit guns fade with their physical hatch and cancelled ammo repair stays cancelled',()=>{
 const {b}=fixture(FortSouville),p=b.parts.get('pit-left');tick(b,1.2);assert(p.openAmount>0&&p.openAmount<1);tick(b,.4);assert.equal(p.openAmount,1);tick(b,3.5);assert(!p.revealed);assert(p.openAmount>0&&p.openAmount<1);tick(b,.5);assert.equal(p.openAmount,0);
 destroy(b,'aa-left');destroy(b,'observer');destroy(b,'command');destroy(b,'ammo');assert.equal(b.parts.get('aa-left').repairRemaining,0);tick(b,20);assert(b.parts.get('aa-left').destroyed);
});
