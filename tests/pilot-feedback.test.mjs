import './pilot-feedback-globals.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PILOTS,PILOT_PLANES} from '../engine.js?v=504';
import {advanceBurns1918} from '../pilot-lifecycle196.js?v=504';
import {CoopGame,coopPlane} from '../coop-engine.js?v=504';
import {CampaignGame} from '../campaign.js?v=504';
const solo=id=>new Game(coopPlane(id),id,()=>.5);
const enemy=(x,y,a=Math.PI)=>({x,y,a,hp:10000,maxHp:10000,type:'scout',speed:0,fire:999,wobble:0});
const quiet=g=>{for(const k of ['spawn','nextBossAt','_zeppelinSchedule','nextHeavyAt','eventTimer','allyTimer','flakTimer','regionThreat','gustTimer','supplyTimer','fieldUnitTimer','gasTimer','patrolTimer','threatTimer'])g[k]=Infinity;g.spawnEnemy=()=>null;g.checkLevel=()=>{};return g};
const frame=(p,dt=.02)=>{const old=p.beginRevisionFrame(dt,{});p.endRevisionFrame(old)};

test('legacy solo wings acquire one owner and execute commands; cooperative unowned wings never borrow an owner',()=>{
 for(const id of ['boelcke','collishaw','goering','brumowski']){
  const expected=id==='goering'?1:2;const p=solo(id);p.identityState();p.ensureWingmen();for(const a of p.allies)delete a.ownerId;
  p.ensureWingmen();assert.equal(p.allies.length,expected);assert.equal(p.permanentWingCount(),expected);
  for(const a of p.allies){assert.equal(a.ownerId,'p1');assert.equal(p.updatePilotWing(a,.02),true)}
 }
 const w=new CoopGame([{pilot:'boelcke'},{pilot:'brumowski'}]);const stranger={x:0,y:0,a:0,slot:0,permanent:true,life:10,fire:1};w.allies.push(stranger);
 assert.equal(w.players[0].updatePilotWing(stranger,.02),false);assert.equal(stranger.ownerId,undefined);
 for(const p of w.players)assert.equal(p.permanentWingCount(),2);
});

test('Collishaw activation makes a physical outward flight and fires from two flanks at divided targets',()=>{
 const p=solo('collishaw');p.x=p.y=p.a=0;p.identityState();p.ensureWingmen();p.enemies=[enemy(270,-110),enemy(300,110)];
 for(let t=0;t<1;t+=.02)for(const a of p.allies)p.updatePilotWing(a,.02);
 const before=p.allies.map(a=>a.y);p.skill();let maxStep=0;
 for(let t=0;t<1.8;t+=.02){frame(p);for(const a of p.allies){const x=a.x,y=a.y;p.updatePilotWing(a,.02);assert.equal(Math.sign(a.y),Math.sign(before[a.slot]),'wings spread from their own side');maxStep=Math.max(maxStep,Math.hypot(a.x-x,a.y-y))}}
 assert(p.allies.every((a,i)=>Math.abs(a.y)>Math.abs(before[i])+75));assert(maxStep<=330*.02+1e-8);
 assert(p.bullets.some(b=>b.ally&&b.y<0)&&p.bullets.some(b=>b.ally&&b.y>0));
 assert(p.identityState().feedback.ghosts.some(g=>g.scale===.78));
});

test('Boelcke wings divide two targets and make a visible flank-to-rear maneuver instead of extra summons',()=>{
 const p=solo('boelcke');p.x=p.y=p.a=0;p.identityState();p.ensureWingmen();p.enemies=[enemy(250,-60,0),enemy(320,60,0)];p.skill();
 let outward=false,flash=false;for(let t=0;t<3;t+=.02){frame(p);for(const a of p.allies){p.updatePilotWing(a,.02);outward||=Math.abs(a.y)>100;flash||=p.identityState().fx.some(f=>f.key==='muzzleTwin')}}
 assert(outward);assert.equal(p.allies.filter(a=>a.permanent).length,2);assert.equal(p.allies.length,6);assert(p.allies[0].x<p.enemies[0].x&&p.allies[1].x<p.enemies[1].x);
 assert(flash);assert(p.identityState().feedback.ghosts.length>0);
});

test('Udet below 50% durability overheats with sparks; healthy runs stay clean',()=>{
 const g=quiet(solo('udet'));g.update(.016,{});g.maxHp=100;
 g.hp=50;g.update(.016,{});assert.equal(g.fxOverheat,.35);
 const spark=g.particles.find(p=>p.maxLife===.6&&(p.color==='#ffb45e'||p.color==='#ff6436'));
 assert(spark,'expected an overheat spark');assert(Math.abs(spark.vx+Math.cos(g.a)*30)<=23);
 g.hp=51;g.update(.016,{});assert.equal(g.fxOverheat,0);
 g.hp=100;g.update(.016,{});assert.equal(g.fxOverheat,0);
});

test('all 27 active lifecycles stay bounded and clear transient feedback after expiry',()=>{
 assert.equal(Object.keys(PILOTS).length,27);
 for(const id of Object.keys(PILOTS))for(const enhanced of [false,true])for(const mode of ['solo','coop','campaign']){
  const coop=mode==='coop',g=quiet(coop?new CoopGame([{pilot:id},{pilot:id}]):mode==='campaign'?new CampaignGame(PILOTS[id].faction==='central'?'C-02':'A-02',id):solo(id)),p=coop?g.players[0]:g;p.invuln=100;p.skillEnhanced=enhanced;
  assert.equal(p.skill(),true,id);const duration=p.skillTime;
  for(let t=0;t<duration+.8;t+=.04){g.update(.04,coop?[{},{}]:{});const s=p.identityState();assert(s.fx.length<=24,id);assert((s.feedback?.ghosts.length||0)<=8,id);assert(Number.isFinite(p.x+p.y+p.hp),id)}
  assert.equal(p.skillTime,0,id);const count=p.identityState().fx.length;assert.equal(p.skill(),false,id+' cooldown');assert.equal(p.identityState().fx.length,count);
 }
});

test('gontermann burn on a stageBoss proxy routes damage to the body, not the getter hp',()=>{
 const hits=[];const body={hp:500,dead:false,hit(a){this.hp-=a.damage;hits.push(a.damage);return{damage:a.damage}}};
 const proxy={x:0,y:0,burnTime:3,burnDps:40,stageBossBody:body};
 Object.defineProperty(proxy,'hp',{get:()=>body.hp});
 const world={state:'playing',enemies:[proxy],smoke(){},burst(){}};
 advanceBurns1918(world,.02);assert.equal(hits.length,1);assert.ok(body.hp<500);
 const e={hp:100,burnTime:3,burnDps:40,x:0,y:0};world.enemies=[e];
 advanceBurns1918(world,.02);assert.ok(e.hp<100);
});
