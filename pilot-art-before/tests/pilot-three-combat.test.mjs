import './pilot-feedback-globals.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {Game,PILOTS} from '../engine.js?v=gal1&rail=42';
import {CoopGame,coopPlane} from '../coop-engine.js?v=gal1&rail=42';
import {tickThreePilot,beginThreeSkill} from '../pilot-three-combat.js';
import {drawThreeLocal} from '../pilot-three-view.js';
const quiet=p=>{for(const k of ['spawn','nextBossAt','nextHeavyAt','eventTimer','allyTimer','flakTimer','regionThreat','gustTimer','supplyTimer','fieldUnitTimer','gasTimer','patrolTimer'])p[k]=Infinity;p.checkLevel=()=>{};return p};
const solo=id=>quiet(new Game(coopPlane(id),id,()=>.5));
// Proctor and Lufbery moved to authored finite attacks (pilot-five-combat.js);
// pilot-three-combat.js now owns Schleich only.
test('Schleich intercepts frontal light rounds only; rear and heavy threats stay live',()=>{
 const p=solo('schleich');p.x=p.y=p.a=0;p.skill();
 const bullet=(x,y,extra={})=>({x,y,vx:-300,vy:0,life:2,enemy:true,...extra});
 const front=bullet(55,0),side=bullet(10,65),rear=bullet(-45,0,{vx:300}),heavy=bullet(55,0,{heavy:true}),away=bullet(55,0,{vx:300});p.bullets=[front,side,rear,heavy,away];tickThreePilot(p,.02);
 assert.equal(front.life,0);for(const b of [side,rear,heavy,away])assert.equal(b.life,2);assert.equal(p.identityState().three.deflections,1);
 const fast=bullet(150,0,{vx:-10000});p.bullets=[fast];tickThreePilot(p,.02);assert.equal(fast.life,0);
 p.skillTime=0;const base=p.incomingDamageMultiplier(null);p.skillTime=2;assert.equal(p.incomingDamageMultiplier(null),base,'no old all-direction 55% active mitigation');
});
test('co-op pilots keep independent deflection state; no repeated advance per frame',()=>{
 const w=quiet(new CoopGame([{pilot:'schleich'},{pilot:'schleich'}]));for(const p of w.players){p.skill();p.invuln=100}w.update(.02,[{},{}]);const [a,b]=w.players.map(p=>p.identityState().three);assert.notEqual(a,b);assert(Math.abs(a.age-.02)<1e-8);assert(Math.abs(b.age-.02)<1e-8);
});
test('tickThreePilot leaves proctor and lufbery to the five-ace module',()=>{
 for(const id of ['proctor','lufbery']){
  const p=solo(id);p.x=p.y=p.a=0;p.skill();p.rate=p.damage=1;tickThreePilot(p,.02);
  assert.equal(p.rate,1);assert.equal(p.damage,1);assert.equal(p.identityState().three?.target??null,null);
 }
});
test('five-ace copy describes real mechanics',()=>{
 assert.match(PILOTS.schleich.desc,/중화기/);assert.match(PILOTS.proctor.desc,/관통/);assert.match(PILOTS.lufbery.desc,/윙맨|동료|선회/);
});
