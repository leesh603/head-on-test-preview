import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PILOTS,PILOT_PLANES} from '../engine.js?v=bs1';
import {CoopGame} from '../coop-engine.js?v=bs1';

import {nungesserSmokeStage,nungesserAimOffset,signatureState} from '../pilot-signature-state.js';
import {createPilotSignatureRenderer} from '../pilot-signature-renderer.js?v=bs1';
const solo=()=>new Game(PILOT_PLANES.nungesser,'nungesser',()=>.5);
const setup=coop=>{const world=coop?new CoopGame([{pilot:'nungesser'},{pilot:'fonck'}],{rng:()=>.5}):solo();return {world,p:coop?world.players[0]:world};};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('black heart uses three health stages and never changes offensive or movement stats',()=>{
 const g=solo();assert.equal(PILOTS.nungesser.passive,'죽음의 기사');assert.equal(PILOTS.nungesser.skill,'죽음의 기사');
 for(const [health,stage] of [[1,0],[.61,0],[.6,1],[.4,2],[.2,3],[.01,3]]){
  g.hp=g.maxHp*health;assert.equal(nungesserSmokeStage(g),stage);
  const before={speed:g.speed,rate:g.rate,damage:g.damage,turn:g.turn};const prior=g.beginRevisionFrame(.02,{});
  for(const key of Object.keys(before))close(g[key],before[key]);g.endRevisionFrame(prior);
 }
});
test('aim instability is small, health-dependent and limited to enemies aiming at Nungesser',()=>{
 const g=solo(),e={x:g.x-100,y:g.y,a:0,type:'scout'};
 for(const [health,limit] of [[1,0],[.6,.015],[.4,.03],[.2,.045]]){
  g.hp=g.maxHp*health;close(nungesserAimOffset(g,e,()=>1),limit);close(nungesserAimOffset(g,e,()=>0),-limit);
 }
 close(nungesserAimOffset(g,{...e,a:Math.PI},()=>1),0);
 close(nungesserAimOffset(g,{...e,fieldUnit:'railgun'},()=>1),0);
 close(nungesserAimOffset(new Game('camel','fonck'),e,()=>1),0);
 const world=new CoopGame([{pilot:'nungesser'},{pilot:'fonck'}],{rng:()=>.5});world.rng=()=>1;world.players[0].hp=world.players[0].maxHp*.2;
 world.enemyCombatTarget=()=>world.players[0];world.enemyVolley({...e});close(Math.atan2(world.bullets[0].vy,world.bullets[0].vx),.045);
 world.bullets=[];world.enemyCombatTarget=()=>world.players[1];world.enemyVolley({...e});close(Math.atan2(world.bullets[0].vy,world.bullets[0].vx),0);
});
test('solo and coop: active rounds pass through, near misses tear smoke once and ordinary pilots still take hits',()=>{
 for(const coop of [false,true]){
  const {world,p}=setup(coop);p.hp=p.maxHp*.2;p.invuln=0;assert.equal(p.skill(),true);const hp=p.hp;
  const b={x:p.x+45,y:p.y,vx:400,vy:0,damage:20,enemy:true,life:2};world.resolveHostileRound(b,p.x-45,p.y);
  close(p.hp,hp);assert.equal(b.life,0);assert.ok(signatureState(p).effects.some(e=>e.kind==='deathDeflect'));assert.equal(p.hitFlash,0);assert.ok(signatureState(p).effects.some(e=>e.kind==='smokeTear'));
  world.resolveHostileRound(b,p.x-45,p.y);
  p.skillTime=0;p.invuln=0;const hit={...b,nungesserSmokeOwners:undefined,life:2};world.resolveHostileRound(hit,p.x-45,p.y);assert.ok(p.hp<hp);assert.equal(hit.life,0);
  if(coop){const other=world.players[1],health=other.hp;other.invuln=0;const bullet={x:other.x+20,y:other.y,vx:100,vy:0,damage:10,enemy:true,life:1};world.resolveHostileRound(bullet,other.x-20,other.y);assert.ok(other.hp<health);assert.equal(bullet.life,0);}
 }
});
test('solo and coop: exactly three seconds, firing enabled, clean expiry and reuse, including Iron Cross',()=>{
 for(const coop of [false,true])for(const enhanced of [false,true]){
  const {world,p}=setup(coop);p.skillEnhanced=enhanced;p.invuln=0;p.fire=0;p.skill();close(p.skillTime,enhanced?4.05:3);close(p.invuln,enhanced?4.05:3);assert.equal(p.skill(),false);
  const hp=p.hp;for(let i=0;i<74;i++){world.update(.04,coop?[{},{}]:{});p.hit(10);close(p.hp,hp);world.enemies=[];}
  assert.ok(p.skillTime>0);assert.ok(p.roundsFired>0);
  for(let i=0;i<40&&p.skillTime>0;i++)world.update(.04,coop?[{},{}]:{});world.update(.04,coop?[{},{}]:{});close(p.skillTime,0);close(p.invuln,0);
  assert.ok(signatureState(p).effects.some(e=>e.kind==='deathKnightEnd'));p.hit(10);assert.ok(p.hp<hp);
  p.cooldown=0;assert.equal(p.skill(),true);close(p.skillTime,enhanced?4.05:3);
 }
});
test('painted smoke, low-health embers, extinction and split exit use no insignia or impact sparks',()=>{
 const p=solo(),draw=createPilotSignatureRenderer({fx(c,key){calls.push(key)},icon(){assert.fail('No icon')},insignia(){assert.fail('No coffin')}});
 const calls=[],c={globalAlpha:1,save(){},restore(){},translate(){},rotate(){}};signatureState(p);p.hp=p.maxHp*.2;
 draw(c,p,0,0);assert.ok(calls.includes('fireSmall'));calls.length=0;p.skill();signatureState(p).effects=[];
 draw(c,p,0,0);draw(c,p,0,0,'front');assert.ok(calls.includes('smokeDark'));assert.ok(!calls.includes('armorSpark'));
 const snapshot=JSON.stringify(p);draw(c,p,0,0);assert.equal(JSON.stringify(p),snapshot);
});
