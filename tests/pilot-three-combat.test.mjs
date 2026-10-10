import './pilot-feedback-globals.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {Game,PILOTS} from '../engine.js?v=gal1&rail=42';
import {CoopGame,coopPlane} from '../coop-engine.js?v=gal1&rail=42';
import {tickThreePilot,beginThreeSkill} from '../pilot-three-combat.js';
import {drawThreeLocal} from '../pilot-three-view.js';
const quiet=p=>{for(const k of ['spawn','nextBossAt','nextHeavyAt','eventTimer','allyTimer','flakTimer','regionThreat','gustTimer','supplyTimer','fieldUnitTimer','gasTimer','patrolTimer'])p[k]=Infinity;p.checkLevel=()=>{};return p};
const solo=id=>quiet(new Game(coopPlane(id),id,()=>.5));
const enemy=(x,y)=>({x,y,a:Math.PI,hp:10000,maxHp:10000,type:'scout',speed:0,fire:Infinity});
test('Proctor uses real ammo, pauses between bursts, and changes fixed lane only on the next beat',()=>{
 const p=solo('proctor');p.x=p.y=p.a=0;p.skill();let first=0,gap=0,later=0;
 for(let i=0;i<60;i++){const rounds=p.roundsFired;p.update(.02,{inputMode:'gamepad',fireHeld:true,angle:i<15?0:.3});const n=p.roundsFired-rounds;if(i<14)first+=n;if(i>=17&&i<29)gap+=n;if(i>=32)later+=n;}
 assert(first>0);assert.equal(gap,0);assert(later>0);assert(p.bullets.some(b=>b.proctorSalvo&&b.pierce));
 const q=solo('proctor');q.a=0;q.skill();tickThreePilot(q,.1);q.a=.5;assert.equal(q.gunDirection(0),0);assert.equal(q.gunDirection(1),0);
 const ammo=q.ammo.slice();for(let i=0;i<20;i++)q.update(.02,{inputMode:'gamepad',fireHeld:false});assert.deepEqual(q.ammo,ammo);
});
test('Schleich intercepts frontal light rounds only; rear and heavy threats stay live',()=>{
 const p=solo('schleich');p.x=p.y=p.a=0;p.skill();
 const bullet=(x,y,extra={})=>({x,y,vx:-300,vy:0,life:2,enemy:true,...extra});
 const front=bullet(55,0),side=bullet(10,65),rear=bullet(-45,0,{vx:300}),heavy=bullet(55,0,{heavy:true}),away=bullet(55,0,{vx:300});p.bullets=[front,side,rear,heavy,away];tickThreePilot(p,.02);
 assert.equal(front.life,0);for(const b of [side,rear,heavy,away])assert.equal(b.life,2);assert.equal(p.identityState().three.deflections,1);
 p.skillTime=0;const base=p.incomingDamageMultiplier(null);p.skillTime=2;assert.equal(p.incomingDamageMultiplier(null),base,'no old all-direction 55% active mitigation');
});
test('Lufbery hands off within the forward sector and loses dead/out-of-sector targets',()=>{
 const p=solo('lufbery');p.x=p.y=p.a=0;p.enemies=[enemy(200,-110),enemy(210,110),enemy(-200,0)];p.skill();tickThreePilot(p,.02);const first=p.identityState().three.target;assert(first);const aim=p.gunDirection();assert(Math.abs(aim)>.4);
 for(let i=0;i<23;i++)tickThreePilot(p,.02);assert.notEqual(p.identityState().three.target,first);assert.notEqual(p.identityState().three.target,p.enemies[2]);
 p.enemies[0].hp=p.enemies[1].hp=0;tickThreePilot(p,.02);assert.equal(p.identityState().three.target,null);
});
test('co-op pilots keep independent target and deflection state; no repeated advance per frame',()=>{
 const w=quiet(new CoopGame([{pilot:'lufbery'},{pilot:'lufbery'}]));for(const p of w.players){p.skill();p.invuln=100}w.update(.02,[{},{}]);const [a,b]=w.players.map(p=>p.identityState().three);assert.notEqual(a,b);assert(Math.abs(a.age-.02)<1e-8);assert(Math.abs(b.age-.02)<1e-8);
});
test('new pilot muzzle textures require firing and disappear during reload; copy describes real mechanics',()=>{
 for(const id of ['proctor','lufbery']){const p=solo(id);p.skill();tickThreePilot(p,.02);const keys=[];const draw=()=>{keys.length=0;drawThreeLocal({},p,(_,key)=>keys.push(key));return keys.some(k=>k.startsWith('muzzle'))};p.muzzleFlash=0;assert.equal(draw(),false);p.muzzleFlash=.1;p.reloadTime=0;assert.equal(draw(),true);p.reloadTime=1;assert.equal(draw(),false)}
 assert.match(PILOTS.schleich.desc,/중화기/);assert.match(PILOTS.proctor.desc,/재조준/);assert.match(PILOTS.lufbery.desc,/차례/);
});
