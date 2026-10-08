import './pilot-feedback-globals.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js?v=tame3&rail=12';
import {CoopGame} from '../coop-engine.js?v=tame3&rail=12';
import {signatureState,advancePilotSignature} from '../pilot-signature-state.js';
import {createPilotSignatureRenderer} from '../pilot-signature-renderer.js?v=tame3';
import {drawImmelmannEagle} from '../passive-fx.js?v=tame3&rail=12';

test('solo and cooperative Immelmann keep the reversal and piercing volley with compact visual cues',()=>{
 for(const coop of [false,true]){
  const world=coop?new CoopGame([{pilot:'immelmann'},{pilot:'baron'}],{rng:()=>.5}):new Game('eindecker','immelmann',()=>.5),p=world.players?.[0]||world;
  p.invuln=Infinity;for(const k of ['spawn','nextBossAt','nextHeavyAt','eventTimer','allyTimer','fieldUnitTimer'])world[k]=Infinity;
  const heading=p.a;p.skill();assert(p.immelmannTurn);
  const calls=[],draw=createPilotSignatureRenderer({fx(c,key,x,y,w,h,a,opacity){calls.push({key,w,h,opacity});return true},icon(){assert.fail('No Immelmann badge')}});
  const c={globalAlpha:1,save(){},restore(){},translate(){},rotate(){}};
  for(let i=0;i<12;i++){world.update(.04,coop?[{},{}]:{});signatureState(p);draw(c,p,0,0);}
  assert(calls.filter(q=>q.key==='vaporTrail').every(q=>q.w<=44&&q.h<=7&&q.opacity<=.1));
  assert(!calls.some(q=>q.key==='windStreak'));
  for(let i=0;i<12;i++)world.update(.04,coop?[{},{}]:{});
  assert.equal(p.immelmannTurn,null);assert(Math.abs(Math.abs(Math.atan2(Math.sin(p.a-heading),Math.cos(p.a-heading)))-Math.PI)<.2);
  assert(world.bullets.some(b=>b.pierce&&b.damage>=p.damage*3.5));
 }
});
test('Eagle passive draws only a thin neutral trail and clears outside its real buff window',()=>{
 const p={pilot:'immelmann',x:0,y:0,a:0,eagleTime:1.2},strokes=[],c={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes.push([this.strokeStyle,this.lineWidth,this.globalAlpha])}};
 for(let t=0;t<.3;t+=.025){p.x=t*100;drawImmelmannEagle(c,p,(x,y)=>[x,y],t,p.x,p.y);}
 assert(strokes.length>0);assert(strokes.every(([color,w,a])=>color==='#bdcbc8'&&w<=1.1&&a<=.22));
 const n=strokes.length;p.eagleTime=0;drawImmelmannEagle(c,p,(x,y)=>[x,y],1,0,0);assert.equal(strokes.length,n);
 p.eagleTime=1;p.immelmannTurn={};drawImmelmannEagle(c,p,(x,y)=>[x,y],1.1,0,0);assert.equal(strokes.length,n);
});

test('solo and cooperative Immelmann slow through the apex and finish the roll before firing',()=>{
 for(const coop of [false,true]){
  const world=coop?new CoopGame([{pilot:'immelmann'},{pilot:'baron'}],{rng:()=>.5}):new Game('eindecker','immelmann',()=>.5),p=world.players?.[0]||world;
  const heading=p.a,baseSpeed=p.baseSpeed,speed=p.speed;p.skill();
  const samples=[];
  for(let i=0;i<=100;i++){
   const q=i/100;p.immelmannTurn.elapsed=q*.9;
   const prior=p.beginRevisionFrame(0,{}),m=p.immelmannTurn;
   samples.push(Math.cos(p.a-heading)*p.speed/speed);
   if(Math.abs(q-.28)<1e-8)assert(p.speed/speed<1e-12,'Ground speed vanishes at vertical pitch');
   if(m?.fired){assert.equal(m.pitch,Math.PI);assert.equal(m.roll,Math.PI);assert(Math.abs(p.immelmannAltitude)<1e-12,'Volley leaves a level aircraft');}
   p.endRevisionFrame(prior);assert.equal(p.baseSpeed,baseSpeed);assert.equal(p.speed,speed);
  }
  for(let i=1;i<samples.length;i++)assert(Math.abs(samples[i]-samples[i-1])<.09,'Ground velocity is continuous at reversal');
  assert.equal(p.immelmannTurn,null);assert.equal(p.immelmannAltitude,0);
  const volley=world.bullets.filter(b=>b.pierce&&b.formation);
  assert.equal(volley.length,5);assert(volley.every(b=>Math.cos(Math.atan2(b.vy,b.vx)-heading)<-.98));
 }
});
