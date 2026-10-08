import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './stageboss-fixture94.mjs';
import {bossHudModel} from '../headon-stageboss-hud.js?v=lc2';
import {alpsMuzzle,alpsHullExtents,alpsAngleDelta} from '../alps-bomber-layout.js?v=lc2';
function rig(width=390){const f=fixture({teamFaction:'entente',stageIndex:6});f.frame.bounds={left:-width/2,right:width/2,top:-422,bottom:422};f.frame.players=[{id:'p1',alive:true,x:0,y:100,vx:0,vy:0,a:-Math.PI/2,radius:12}];f.e=f.addon.startBoss({x:105,y:-180});f.b=[...f.e.bodies.values()][0];return f;}
function tick(f,seconds,before=()=>{}){for(let i=0;i<Math.round(seconds/.02);i++){before(f,.02);f.addon.tick(.02,f.frame);}}
function combat(f){tick(f,12);assert.equal(f.b.entry,null);f.log.damage.length=0;f.addon.hazards.clear(f.e.id);f.b.recovery=0;}
test('GIK enters physically, waits for visible ridge pass and launches a real warned first shell',()=>{
 const f=rig(),start=[f.b.x,f.b.y];assert.equal(bossHudModel(f.e),null);tick(f,.4);assert.notDeepEqual([f.b.x,f.b.y],start);assert.equal(f.log.cues.some(c=>c.type==='heavy-gun-fired'),false);
 let launches=0;tick(f,10,()=>{if(f.b.cannonLock){const a=f.b.cannonLock.angle;assert.ok(Number.isFinite(a));}if(f.log.cues.filter(c=>c.type==='heavy-gun-fired').length>launches){launches++;assert.ok(f.b.discovered);}});
 assert.equal(f.b.entry,null);assert.ok(launches>=1);assert.ok(bossHudModel(f.e));assert.equal(f.log.cues.filter(c=>c.type==='alps-discovered').length,1);assert.ok(f.b.t.geometryScale<1.45);assert.ok(f.b.inView(f.frame.bounds));
});
test('GIK visibility gates entry clock without moving camera or roster',()=>{const f=rig();f.b.x=3000;const p={...f.frame.players[0]},bounds={...f.frame.bounds};tick(f,.5);assert.equal(f.b.entry.age,0);assert.equal(f.b.discovered,false);assert.deepEqual(f.frame.players[0],p);assert.deepEqual(f.frame.bounds,bounds);assert.ok(f.b.x>2800);});
test('GIK HP 68 / 32 thresholds change real strafe flight and precision lead',()=>{const f=rig(1280);combat(f);const b=f.b;assert.equal(b.phase,1);b.hit({damage:(b.hp-b.maxHp*.68)/.85+.001});tick(f,.04);assert.equal(b.phase,2);b.hit({damage:(b.hp-b.maxHp*.32)/.85+.001});tick(f,.04);assert.equal(b.phase,3);assert.equal(b.finalUsed,false);assert.ok(f.log.cues.some(c=>c.phase==='alps-phase-2'));assert.ok(f.log.cues.some(c=>c.phase==='alps-phase-3'));});
function final(f,dodge){combat(f);f.b.hit({damage:(f.b.hp-f.b.maxHp*.2)/.85});let locks=0,last=null;
 tick(f,18,(f,dt)=>{const p=f.frame.players[0],lock=f.b.cannonLock;
  if(lock&&lock!==last){last=lock;locks++;}
  if(dodge&&lock){const q=alpsMuzzle(f.b,'cannon',lock.angle),nx=-Math.sin(lock.angle),ny=Math.cos(lock.angle),perp=(p.x-q.x)*nx+(p.y-q.y)*ny;
   let sign=perp>=0?1:-1;if(p.x*nx*sign>135)sign=-sign;
   p.vx=Math.abs(perp)<70?nx*sign*145:0;p.vy=Math.abs(perp)<70?ny*sign*145:0;p.x+=p.vx*dt;p.y+=p.vy*dt;
  }else{p.vx=0;p.vy=0;}
 });return locks;
}
test('GIK iron cage forces movement; reading frozen lines avoids actual damaging projectiles',()=>{const idle=rig(),dodge=rig();const a=final(idle,false),b=final(dodge,true);assert.ok(a>=3&&b>=3);assert.ok(idle.log.damage.length>0,'standing in locks must be dangerous');assert.equal(dodge.log.damage.length,0,'sidestepping warned lines needs no invulnerability');assert.equal(dodge.b.ironCage,null);assert.ok(dodge.log.cues.some(c=>c.phase==='gik-recovery'));assert.equal(dodge.log.cues.filter(c=>c.phase==='gik-iron-cage').length,1);});
test('GIK cannon destruction interrupts the final, rear mount never replaces cannon rounds',()=>{const f=rig();combat(f);f.b.hit({damage:(f.b.hp-f.b.maxHp*.2)/.85});tick(f,2);assert.ok(f.b.ironCage);f.b.hit({partId:'cannon',damage:9999});f.log.cues.length=0;tick(f,10);assert.equal(f.b.cannonLock,null);assert.equal(f.log.cues.some(c=>c.type==='heavy-gun-fired'),false);assert.ok(f.log.cues.some(c=>c.phase==='gik-recovery'));});
test('GIK pose and all warnings freeze when paused; death cancels final and advances once',()=>{const f=rig();combat(f);f.b.hit({damage:(f.b.hp-f.b.maxHp*.2)/.85});tick(f,2);const before=JSON.stringify([f.b.x,f.b.y,f.b.ironCage,f.b.cannonLock]);f.addon.tick(.05,{...f.frame,paused:true});assert.equal(JSON.stringify([f.b.x,f.b.y,f.b.ironCage,f.b.cannonLock]),before);f.b.hit({damage:99999});f.addon.reconcile({blocked:true});assert.equal(f.addon.hazards.pool.count,0);tick(f,3);f.addon.reconcile({blocked:false});f.addon.reconcile({blocked:false});assert.equal(f.log.stages.length,1);f.addon.dispose();assert.equal(f.addon.hazards.pool.count,0);});
