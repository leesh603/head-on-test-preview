import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,step} from './stageboss-fixture94.mjs';
import {TRENCH_ARMOR_LAYOUT,armorAngleDelta,armorGunMuzzle,armorGunRecoil} from '../trench-armor-layout.js?v=478';
import {drawTrenchArmorGun} from '../trench-armor-gun-render.js?v=478';

for(const kind of ['a7v-flak','mark-v-cruiser']){
 const setup=()=>{const f=fixture({stageIndex:2,teamFaction:kind==='a7v-flak'?'entente':'central'});f.e=f.addon.startBoss({x:400,y:180});f.b=[...f.e.bodies.values()][0];return f};
 test(kind+': every fixed mount traverses smoothly within its gun port',()=>{
  const f=setup(),b=f.b,layout=TRENCH_ARMOR_LAYOUT[kind];
  for(let i=0;i<200;i++){
   f.frame.players=[{alive:true,x:b.x+Math.cos(i*.04)*350,y:b.y+Math.sin(i*.04)*350}];
   const before=new Map(b.liveGuns().map(g=>[g.id,g.aimAngle]));step(f,.05);
   for(const g of b.liveGuns()){
    assert.ok(Math.abs(armorAngleDelta(g.aimAngle,g.baseAngle))<=layout.gunArc+1e-10);
    assert.ok(Math.abs(armorAngleDelta(g.aimAngle,before.get(g.id)))<=layout.gunTurnSpeed*.05+1e-10);
   }
  }
 });
 test(kind+': a volley never snaps the barrel and emits from its rendered tip',()=>{
  const f=setup(),b=f.b,g=b.liveGuns()[0];b.aim(.1,f.frame.players);b.hullYaw=.13;b.syncMounts();
  const angle=g.aimAngle;b.impact(g,b.x-500,b.y+500);assert.equal(g.aimAngle,angle);
  const tip=armorGunMuzzle(kind,g,b.hullYaw,1),cue=f.log.cues.findLast(c=>c.type==='muzzle');
  assert.ok(cue);assert.ok(Math.abs(cue.x-b.x-tip.x)<1e-10);assert.ok(Math.abs(cue.y-b.y-tip.y)<1e-10);
 });
 test(kind+': recoil returns the barrel to its own mount without moving the housing',()=>{
  assert.equal(armorGunRecoil(kind,.18),0);assert.equal(armorGunRecoil(kind,0),0);
  assert.ok(armorGunRecoil(kind,.145)>0);
  const f=setup(),g=f.b.liveGuns()[0],at=[g.localX,g.localY];g.recoil=.145;
  const calls=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args])});
  drawTrenchArmorGun(ctx,g,kind,{naturalWidth:320});
  assert.deepEqual([g.localX,g.localY],at);assert.ok(calls.some(c=>c[0]==='clip'&&c[1]==='evenodd'));
  assert.equal(calls.filter(c=>c[0]==='drawImage').length,2);
 });
}
test('Mark V mirrored ports keep their barrel endpoints symmetric',()=>{
 const make=id=>({id,x:0,y:0,aimAngle:id==='sponson-left'?Math.PI:0,recoil:0});
 const left=armorGunMuzzle('mark-v-cruiser',make('sponson-left'));
 const right=armorGunMuzzle('mark-v-cruiser',make('sponson-right'));
 assert.ok(Math.abs(left.x+right.x)<1e-10);assert.ok(Math.abs(left.y-right.y)<1e-10);
});
