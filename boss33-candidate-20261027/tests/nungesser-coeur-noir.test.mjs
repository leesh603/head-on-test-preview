import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PILOTS,PILOT_PLANES} from '../engine.js?v=tame3&rail=40';
import {CoopGame} from '../coop-engine.js?v=tame3&rail=40';
import {signatureState,nungesserAimOffset,NUNGESSER_BALANCE as B} from '../pilot-signature-state.js';
import {nungesserCombatStatus} from '../nungesser-combat.js';
import {nungesserState} from '../pilot-signature-state.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const setup=(coop=false,slot=0)=>{const world=coop?new CoopGame(slot?[{pilot:'fonck'},{pilot:'nungesser'}]:[{pilot:'nungesser'},{pilot:'fonck'}],{rng:()=>.5}):new Game(PILOT_PLANES.nungesser,'nungesser',()=>.5),p=coop?world.players[slot]:world;p.x=p.y=0;p.a=0;p.invuln=0;for(const other of world.players||[])if(other!==p){other.x=300;other.y=300;other.invuln=0;}return {world,p};};
const hostile=(y=24)=>({x:45,y,vx:185,vy:0,damage:10,life:2,enemy:true});
const graze=(world,p,b=hostile())=>{world.resolveHostileRound(b,-45,b.y);return b;};
const shot=(p,extra={})=>p.applySpecialRound({x:30,y:0,vx:520,vy:0,damage:20,life:1,gun:0,hit:new Set(),...extra});
const frame=(p,dt=.04)=>{const prior=p.beginRevisionFrame(dt,{});p.endRevisionFrame(prior);};

test('full-health near miss arms one actual paired piercing counter-volley in solo and either co-op slot',()=>{
 for(const [coop,slot]of [[false,0],[true,0],[true,1]]){
  const {world,p}=setup(coop,slot),before={damage:p.damage,rate:p.rate,speed:p.speed,turn:p.turn};graze(world,p);assert.equal(nungesserCombatStatus(p).ready,true);
  const b=shot(p),pair=world.bullets.filter(b=>b.nungesserCounter);assert.equal(pair.length,2);assert.ok(pair.every(b=>b.ownerId===p.id&&b.pierce&&b.hit instanceof Set));
  close(pair[0].damage,b.damage*B.counterDamage);close(Math.atan2(pair[0].vy,pair[0].vx),-B.counterAngle);close(Math.atan2(pair[1].vy,pair[1].vx),B.counterAngle);
  shot(p);assert.equal(world.bullets.filter(b=>b.nungesserCounter).length,2);assert.equal(nungesserCombatStatus(p).ready,false);
  for(const [key,value]of Object.entries(before))close(p[key],value);
 }
 assert.match(PILOTS.nungesser.passive,/반격/);
});
test('direct hits, wide misses, invulnerability, evade, dead rounds and flak collision margins earn no passive',()=>{
 for(const extra of [{y:0},{y:40},{y:18,flak:true},{life:0},{enemy:false},{rocket:true}]){
  const {world,p}=setup(),b={...hostile(),...extra};world.resolveHostileRound(b,-45,b.y);assert.equal(nungesserCombatStatus(p).ready,false,JSON.stringify(extra));
 }
 for(const key of ['invuln','evadeTime']){const {world,p}=setup();p[key]=.2;graze(world,p);assert.equal(nungesserCombatStatus(p).ready,false);}
 const {world,p}=setup();const hp=p.hp;graze(world,p,hostile(0));assert.ok(p.hp<hp);
});
test('graze is once per projectile and owner, bounded by cooldown, and unused reprisal expires',()=>{
 const {world,p}=setup(),b=graze(world,p);shot(p);const s=signatureState(p);s.clock+=2.1;graze(world,p,b);assert.equal(nungesserCombatStatus(p).ready,false);
 graze(world,p);assert.equal(nungesserCombatStatus(p).ready,true);s.clock+=2.1;assert.equal(nungesserCombatStatus(p).ready,false);shot(p);assert.equal(world.bullets.filter(b=>b.nungesserCounter).length,2);
});
test('transformed airframes graze outside their actual hull and automated stations do not spend the counter',()=>{
 for(const [length,width]of [[30,57],[39,58],[137,34]])for(const y of [width-2,width+15]){
  const {world,p}=setup();p.bomberTransfer={hullLength:length,hullWidth:width};graze(world,p,hostile(y));assert.equal(nungesserCombatStatus(p).ready,y>width);
 }
 const {world,p}=setup();graze(world,p);p.acquireAirframeTransfer('mgTransfer');p.bomberTransfer.entryTime=3;p.tickBomberTransfer(.01);p.skill();assert.ok(!shot(p,{transferGun:true,transferStation:0}).nungesserBreakthrough);assert(nungesserCombatStatus(p).ready);
});
test('ally, rocket, foreign-owner and non-MG rounds neither spend reprisal nor become breakthrough rounds',()=>{
 const {world,p}=setup();graze(world,p);p.skill();for(const extra of [{ally:true},{rocket:true},{ownerId:'p2'},{gun:undefined}]){const b=shot(p,extra);assert.ok(!b.nungesserBreakthrough);assert.equal(nungesserCombatStatus(p).ready,true);}
});
test('active uses entry grace only, real MG piercing, clean expiry and no low-health aim randomness',()=>{
 for(const coop of [false,true])for(const enhanced of [false,true]){
  const {world,p}=setup(coop);p.skillEnhanced=enhanced;assert.equal(p.skill(),true);assert.equal(p.skill(),false);assert.ok(p.skillTime>=3);close(p.invuln,B.entryGrace);assert.equal(shot(p).pierce,true);
  world.spawn=world.eventTimer=world.supplyTimer=world.flakTimer=1e6;
  for(let i=0;i<16;i++){world.update(.04,coop?[{},{}]:{});world.enemies=[];}
  assert.ok(p.skillTime>0);close(p.invuln,0);const hp=p.hp;p.hit(5);assert.ok(p.hp<hp,'active is vulnerable after entry grace');
  for(let i=0;i<120&&p.skillTime>0;i++){world.update(.04,coop?[{},{}]:{});world.enemies=[];}
  world.update(.04,coop?[{},{}]:{});assert.equal(nungesserCombatStatus(p).active,false);assert.ok(!shot(p).nungesserBreakthrough);assert.equal(signatureState(p).nungesser.shots.length,0);
  assert.equal(nungesserAimOffset(p,{a:0},()=>1),0);p.cooldown=0;p.invuln=0;assert.equal(p.skill(),true);close(p.invuln,B.entryGrace);
 }
});
test('swept gunfire interception consumes hostile bullet before a later player or patrol collision',()=>{
 for(const coop of [false,true]){
  const {world,p}=setup(coop);p.skill();frame(p);world.bullets.push(shot(p));
  const protectedTarget=coop?world.players[1]:{x:24,y:5,hp:70,maxHp:70,life:5,invuln:0};protectedTarget.x=24;protectedTarget.y=5;protectedTarget.invuln=0;if(!coop)world.patrols=[protectedTarget];
  const hp=protectedTarget.hp,b={x:20,y:5,vx:-500,vy:0,life:2,enemy:true,damage:20};world.resolveHostileRound(b,50,5);assert.equal(b.life,0);close(protectedTarget.hp,hp);assert.ok(signatureState(p).effects.some(e=>e.kind==='nungesserIntercept'));
 }
});
test('a collision earlier than interception still damages its target and grazing behind that target is not granted',()=>{
 const {world,p}=setup(true);p.skill();frame(p);world.bullets.push(shot(p));const other=world.players[1];other.x=50;other.y=5;other.invuln=0;const hp=other.hp;
 const b={x:20,y:5,vx:-500,vy:0,life:2,enemy:true,damage:20};world.resolveHostileRound(b,50,5);assert.ok(other.hp<hp);assert.equal(b.life,0);assert.ok(!signatureState(p).effects.some(e=>e.kind==='nungesserIntercept'));
});
test('active does not clear side/rear gunfire, detached explosions or another owner’s rounds',()=>{
 const {world,p}=setup();p.skill();p.invuln=0;frame(p);world.bullets.push(shot(p));const hp=p.hp;
 const rear={x:0,y:0,vx:500,vy:0,life:1,enemy:true,damage:12};world.resolveHostileRound(rear,-20,0);assert.ok(p.hp<hp);assert.ok(!signatureState(p).effects.some(e=>e.kind==='nungesserIntercept'));
 p.invuln=0;world.bullets=[];shot(p,{ownerId:'p2'});const foreign={x:20,y:5,vx:-500,vy:0,life:1,enemy:true,damage:12};world.resolveHostileRound(foreign,50,5);assert.equal(foreign.life,1);
});
test('interception work and passive rendering state stay bounded and do not affect other pilots',()=>{
 const {world,p}=setup();p.skill();for(let i=0;i<100;i++)world.bullets.push(shot(p));frame(p);assert.equal(signatureState(p).nungesser.shots.length,B.maxShots);
 const f=new Game('spad','fonck',()=>.5);f.invuln=0;const b=shot(f);assert.ok(!b.nungesserBreakthrough);assert.equal(nungesserCombatStatus(f).ready,false);
 const snapshot=JSON.stringify(p);nungesserCombatStatus(p);assert.equal(JSON.stringify(p),snapshot);
});
test('co-op snapshots omit projectile caches and restore them locally on demand',()=>{
 const {world,p}=setup(true);p.skill();world.bullets.push(shot(p));
 const packed=JSON.parse(JSON.stringify(signatureState(p)));assert.ok(!('shots' in packed.nungesser));assert.ok(!('pool' in packed.nungesser));
 p.pilotSignatureState=packed;const state=nungesserState(p);assert.deepEqual(state.shots,[]);assert.equal(state.pool,null);
});

test('co-op downing and revival discard an unused reprisal and old interception paths',()=>{
 const {world,p}=setup(true);graze(world,p);assert.equal(nungesserCombatStatus(p).ready,true);p.skill();world.bullets.push(shot(p));world.downPlayer(p);assert.equal(nungesserCombatStatus(p).ready,false);assert.equal(p.pilotSignatureState.nungesser,undefined);world.revive(p);assert.equal(nungesserCombatStatus(p).ready,false);assert.equal(nungesserCombatStatus(p).active,false);
});
