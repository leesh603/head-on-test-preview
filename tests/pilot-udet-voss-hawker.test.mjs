import './pilot-feedback-globals.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,VOSS_REVERSE} from '../engine.js?v=tame3';
import {CoopGame,coopPlane} from '../coop-engine.js?v=tame3';

import {signatureState,advancePilotSignature,pilotSignatureReaction} from '../pilot-signature-state.js';
import {createPilotSignatureRenderer} from '../pilot-signature-renderer.js?v=tame3';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function session(id,mode='solo'){
 const world=mode==='solo'?new Game(coopPlane(id),id,()=>.5):new CoopGame([{pilot:id},{pilot:id}],{rng:()=>.5});
 const p=world.players?.[0]||world;Object.assign(p,{x:0,y:0,a:0,invuln:0,fire:Infinity});
 if(world.players)Object.assign(world.players[1],{x:1200,y:0,fire:Infinity});
 return {world,p};
}
function canvas(){
 const stack=[],text=[];
 return {globalAlpha:1,text,depth:0,save(){stack.push(this.globalAlpha);this.depth++},restore(){this.globalAlpha=stack.pop();this.depth--},translate(){},rotate(){},scale(){},measureText(){return {width:6}},strokeText(){},fillText(ch){text.push(ch)}};
}
function render(p,layer='under'){
 const calls=[],marks=[],c=canvas(),draw=createPilotSignatureRenderer({fx:(_c,key,x,y,w,h,a,opacity)=>{calls.push({key,x,y,w,h,a,opacity});return true},icon:(_c,key)=>marks.push(key),insignia:(_c,key)=>{marks.push(key);return true}});
 const state=signatureState(p),before=JSON.stringify({x:p.x,y:p.y,a:p.a,hp:p.hp,damage:p.damage,speed:p.speed,turn:p.turn,rate:p.rate,skillTime:p.skillTime,effects:state.effects});
 draw(c,p,0,0,layer);
 assert.equal(JSON.stringify({x:p.x,y:p.y,a:p.a,hp:p.hp,damage:p.damage,speed:p.speed,turn:p.turn,rate:p.rate,skillTime:p.skillTime,effects:state.effects}),before);
 assert.equal(c.depth,0);for(const call of calls)for(const v of [call.x,call.y,call.w,call.h,call.a,call.opacity])assert.ok(Number.isFinite(v));
 return {calls,marks,text:c.text.join('')};
}

for(const mode of ['solo','coop']){
 test(`${mode} Udet activation has brief equipment-style motto, no LO emblem or graze reaction`,()=>{
  const {p}=session('udet',mode),hp=p.hp;p.skill();near(p.hp,hp);near(p.skillDuration(),2.6);near(p.skillCooldown(),18);assert.equal(p.udetBoost,0);
  advancePilotSignature(p,.05);assert.equal(render(p,'front').text,'Du doch nicht!!');assert.equal(render(p,'under').text,'');assert.deepEqual(render(p).marks,[]);
  assert.equal(pilotSignatureReaction(p,'hit',{target:{x:40,y:0}}),null);
  p.skillTime=0;for(let i=0;i<15;i++)advancePilotSignature(p,.05);assert.equal(render(p,'front').text,'');
 });
 test(`${mode} Voss retains nearby-enemy scaling, reverse skill and six afterimages`,()=>{
  const {world,p}=session('voss',mode);p.ensureRevisionPilot();
  for(const count of [0,1,6,8]){
   world.enemies=Array.from({length:count},()=>({x:100,y:0,hp:100}));world.enemies.push({x:400,y:0,hp:100},{x:50,y:0,hp:0});
   const prior=p.beginRevisionFrame(.02,{}),mult=1+Math.min(6,count)*.04;near(p.revisionDamageMult,mult);near(p.speed,prior.speed*mult);near(p.turn,prior.turn*mult);near(p.rate,prior.rate);p.endRevisionFrame(prior);
  }
  const hp=p.hp,a=p.a;world.bullets.push({enemy:true,life:2},{enemy:false,life:2});assert.ok(p.skill());near(p.hp,hp);near(p.a,a);near(p.skillDuration(),2.4);assert.ok(p.invuln>=.45);assert.equal((world.revisionDecoys||[]).filter(d=>d.identityDecoy).length,6);
 });
 test(`${mode} Hawker retains turn drag, straight-flight speed and active gun platform`,()=>{
  const {p}=session('hawker',mode);p.ensureRevisionPilot();near(p.handlingDragMult,.75);p.straightCharge=1;
  let prior=p.beginRevisionFrame(.02,{steer:0});near(p.speed,prior.speed*1.2);near(p.turn,prior.turn);near(p.rate,prior.rate);near(p.revisionDamageMult,1);p.endRevisionFrame(prior);
  prior=p.beginRevisionFrame(.02,{steer:1});near(p.straightCharge,.96);p.endRevisionFrame(prior);
  const hp=p.hp;p.skill();near(p.hp,hp);near(p.skillDuration(),5);near(p.skillCooldown(),20);prior=p.beginRevisionFrame(.02,{});near(p.rate,prior.rate);assert.notEqual(p.unlimitedAmmo,true);p.endRevisionFrame(prior);
 });
}

test('Voss passive FX require living enemies inside 400 and use wing wake, not cowling',()=>{
 const {world,p}=session('voss');signatureState(p).turnRate=1.5;
 world.enemies=[{x:400,y:0,hp:100},{x:50,y:0,hp:0}];assert.equal(render(p).calls.length,0);
 world.enemies.push({x:100,y:0,hp:100});const fx=render(p);assert.deepEqual(fx.marks,[]);
 for(const key of ['vaporTrail','smokeWisp','windStreak'])assert.ok(fx.calls.some(c=>c.key===key),key);
 assert.ok(fx.calls.some(c=>c.y>20)&&fx.calls.some(c=>c.y<-20));signatureState(p).turnRate=0;assert.ok(!render(p).calls.some(c=>c.key==='smokeWisp'));
 p.skillTime=1;assert.equal(render(p).calls.length,0);
});

test('Hawker passive gun FX follow actual own gun directions and real projectile trajectories',()=>{
 const {world,p}=session('hawker');Object.assign(p,{straightCharge:1,muzzleFlash:.055,reloadTime:0});p.gunDirection=()=>Math.PI/3;
 const round={x:90,y:35,vx:300,vy:400,life:1,gun:0,ownerId:p.id};world.bullets=[round,{...round,ownerId:'other'},{...round,enemy:true},{...round,rocket:true},{...round,life:0}];
 const fx=render(p);assert.equal(fx.calls.filter(c=>c.key==='tracerCream').length,1);near(fx.calls.find(c=>c.key==='tracerCream').a,Math.atan2(400,300));near(fx.calls.find(c=>c.key==='muzzle').a,Math.PI/3);assert.ok(fx.calls.some(c=>c.key==='gunSmoke'));
 world.bullets=[];p.muzzleFlash=0;assert.equal(render(p).calls.length,0);p.straightCharge=0;p.muzzleFlash=.055;{const c2=render(p).calls;assert.ok(c2.length>0);assert.ok(!c2.some(c=>c.key==='tracerCream'));}
});
