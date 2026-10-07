import './pilot-feedback-globals.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js?v=sortie1';
import {CoopGame} from '../coop-engine.js?v=sortie1';
import {signatureState,advancePilotSignature} from '../pilot-signature-state.js';
import {createPilotSignatureRenderer} from '../pilot-signature-renderer.js?v=sortie1';
import {drawImmelmannEagle} from '../passive-fx.js?v=sortie1';

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
