import test from 'node:test';
import assert from 'node:assert/strict';
import {HEINECKE,heineckeRemaining,triggerHeinecke,tickHeinecke} from '../heinecke-rettungsfallschirm.js?v=perf3';

const player=()=>({t:0,x:120,y:90,a:0,hp:100,maxHp:100,invuln:0,upgrades:{heineckeRettungsfallschirm:1},events:[],event(type,text){this.events.push({type,text})},burst(){},smoke(){}});
test('fatal hit escapes, returns behind with 40% HP and two seconds of protection',()=>{
 const p=player();assert.equal(triggerHeinecke(p,100),true);assert.equal(p.hp,1);assert.equal(p.heineckeEscape,3);assert.equal(p.heineckeUses,1);
 assert.equal(tickHeinecke(p,2.99),true);assert.equal(p.hp,1);
 tickHeinecke(p,.01);assert.equal(p.x,120-HEINECKE.reentryDistance);assert.equal(p.y,90);assert.equal(p.hp,40);assert.equal(p.invuln,2);assert.deepEqual(p.events.map(e=>e.type),['heinecke','heineckeReturn']);
});
test('fixed 180 second cooldown and two uses ignore general cooldown reductions',()=>{
 const p=player();p.cooldownMult=.5;assert.equal(triggerHeinecke(p,100),true);tickHeinecke(p,3);p.invuln=0;p.hp=40;
 p.t=179.99;assert.equal(heineckeRemaining(p)>0,true);assert.equal(triggerHeinecke(p,40),false);
 p.t=180;assert.equal(heineckeRemaining(p),0);assert.equal(triggerHeinecke(p,40),true);
 tickHeinecke(p,3);p.invuln=0;p.hp=40;p.t=1000;assert.equal(triggerHeinecke(p,40),false);assert.equal(p.heineckeUses,2);
});
test('nonfatal damage, no equipment, and independent coop player state',()=>{
 const a=player(),b=player();assert.equal(triggerHeinecke(a,99),false);assert.equal(triggerHeinecke(a,100),true);assert.equal(triggerHeinecke(b,100),true);assert.equal(a.heineckeUses,1);assert.equal(b.heineckeUses,1);
 const c=player();c.upgrades={};assert.equal(triggerHeinecke(c,100),false);
});
