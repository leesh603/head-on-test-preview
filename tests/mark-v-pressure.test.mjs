import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js';
import {fixture} from './stageboss-fixture94.mjs';
const tuning={maxHp:2400,partHp:280,damage:18,bulletSpeed:270,geometryScale:1,projectileDensity:1};
test('sponson fan has distinct evenly spaced trajectories even at traverse limit',()=>{
 const events=[],b=createBossEncounter({id:'mark',bossId:'mark-v-cruiser',tuning,x:0,y:0,emit:e=>events.push(e)}).bodies.values().next().value;
 for(const id of b.gunIds){events.length=0;const gun=b.parts.get(id);gun.aimAngle=gun.baseAngle+b.layout.gunArc;b.fireGun(gun,{count:11,spread:1.45});
 const angles=events.filter(e=>e.kind==='projectile').map(e=>Math.atan2(e.vy,e.vx));assert.equal(new Set(angles.map(a=>a.toFixed(7))).size,11);
 for(let i=1;i<angles.length;i++)assert(Math.abs(Math.atan2(Math.sin(angles[i]-angles[i-1]),Math.cos(angles[i]-angles[i-1]))-.11)<1e-8);
 }
});
for(const width of [390,1280])for(const side of [-1,1])test(`phase one rotates a live sponson into the nose/rear blind spot and actually hits, ${width}/${side}`,()=>{
 const f=fixture({stageIndex:2,teamFaction:'central'});f.hooks.getTuning=()=>tuning;
 f.frame.bounds={left:-width/2,right:width/2,top:-422,bottom:422};f.frame.players=[{id:'pilot',alive:true,x:0,y:side*260,radius:12}];
 const b=f.addon.startBoss({x:0,y:0}).bodies.values().next().value;
 for(let t=0;t<18;t+=.02)f.addon.tick(.02,f.frame);
 assert.equal(b.combatPhase,1);assert(f.log.damage.length>0,'stationary pilot in old blind spot must be hit');assert(Math.abs(b.hullYaw-Math.PI)>.4);
 f.addon.dispose();
});
