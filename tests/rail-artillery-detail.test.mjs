import test from 'node:test';
import assert from 'node:assert/strict';
import {ParisGun,LIncomparable} from '../headon-stageboss-patterns.js?v=cb1';
import {RAIL_GUN_RIGS,railRecoil,railSuspension,railGunMuzzle} from '../rural-rail-artillery.js?v=cb1';
import {renderStageBossLayer} from '../headon-stageboss-render.js?v=cb1&rail=1';
import {bossSoundFor} from '../boss-feedback.js?v=cb1&rail=1';
const frame={players:[{id:'p',alive:true,x:300,y:300}],bounds:{left:-480,right:480,top:-400,bottom:600}};
const make=Type=>{const events=[];const b=new Type({id:'b',x:0,y:-400,faction:Type===ParisGun?'central':'entente',tuning:{maxHp:2400,partHp:250,damage:20,bulletSpeed:270,warningSeconds:1.55,railCycle:7.5},emit:e=>events.push(e)});return{b,events};};
function aim(b){b.rail129.velocity=0;b.rail129.enter('aim');b.rail129.target=null;b.update(.02,frame);}
function run(b,time,dt=.02){for(let t=0;t<time-1e-8;t+=dt)b.update(Math.min(dt,time-t),frame);}
for(const Type of [ParisGun,LIncomparable]){
 test(`${Type.name} actual shells each drive a separate recoil and muzzle sound`,()=>{
  const {b,events}=make(Type);aim(b);run(b,3);const shells=events.filter(e=>e.visual==='rail-shell'),fired=events.filter(e=>e.type==='heavy-gun-fired');
  assert.equal(fired.length,Type===ParisGun?5:1);assert.equal(fired.length,shells.length);assert.equal(b.railGun.shotCount,fired.length);
  assert(fired.every(e=>e.railArtillery&&bossSoundFor(e,b.kind)===(Type===ParisGun?'railGunFire':'railGunFire520')));
 });
 test(`${Type.name} recoil returns to zero, traverses within its mount and respects pause`,()=>{
  const {b}=make(Type);aim(b);run(b,1.6);b.railGun.shotAge=.035;assert.equal(railRecoil(b),RAIL_GUN_RIGS[b.kind].kick);
  const muzzle=railGunMuzzle(b);assert(Number.isFinite(muzzle.x+muzzle.y));assert(Math.abs(b.railGun.angle)<=RAIL_GUN_RIGS[b.kind].traverse);
  assert(Math.abs(railSuspension(b))<=RAIL_GUN_RIGS[b.kind].bodyKick+1.8);
  const state=JSON.stringify(b.railGun);b.update(.25,{...frame,paused:true});assert.equal(JSON.stringify(b.railGun),state);
  b.barrage=null;b.railGun.shotAge=2;assert.equal(railRecoil(b),0);assert.equal(railSuspension(b),0);
 });
 test(`${Type.name} broken rail allows local recoil without moving the rail or wreck`,()=>{
  const {b}=make(Type);b.hit({partId:'car-rear',damage:9999});b.hit({partId:'rail',damage:9999});run(b,2);
  const fixed={...b.rail129.railTarget},position=[b.x,b.y],wreck={...b.parts.get('car-rear').detachedPose};aim(b);run(b,4,.25);
  assert.deepEqual(b.rail129.railTarget,fixed);assert.deepEqual([b.x,b.y],position);assert(Math.abs(b.parts.get('car-rear').detachedPose.y-wreck.y)<.02);assert(b.railGun.shotCount>0);
 });
}
test('snapshot carries gun rig through the real renderer and ammo loss changes the loading animation',()=>{
 const {b,events}=make(ParisGun);for(const id of b.railCarOrder)b.hit({partId:id,damage:9999});aim(b);run(b,3.35);
 assert(b.railGun.manual);assert.equal(b.rail129.c.reloadSeconds,b.baseReload*1.6);assert(b.railGun.load>0&&b.railGun.load<1);
 const models=[];renderStageBossLayer({stages:{encounter:{bodies:new Map([[b.id,b]])}},hazards:{pool:{visit(){}}}},{drawBody:x=>models.push(x),drawPart(){},drawHazard(){}});
 assert.equal(models[0].railGun,b.railGun);assert.equal(models[0].railCars.filter(p=>p.destroyed).length,3);assert.equal(events.filter(e=>e.type==='rural-rail-load').length,1);
});
test('movement audio is rate-limited and no action sound continues after disposal',()=>{
 const {b,events}=make(ParisGun);run(b,5);const rolls=events.filter(e=>e.type==='rural-rail-roll');assert(rolls.length>3&&rolls.length<12);assert(events.some(e=>e.type==='rural-rail-brake'));assert.equal(b.entry,null);
 run(b,1);assert(events.some(e=>e.type==='rural-rail-brake'));b.dead=true;b.dispose();const n=events.length;b.update(20,frame);assert.equal(events.length,n);
});
