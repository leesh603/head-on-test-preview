import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FieldDelta,pack,unpack,seededRandom,NET_HZ,MAX_TETHER} from '../online-coop-protocol.js';
globalThis.Image??=class{set src(value){this._src=value;queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {OnlineCoopGame}=await import('../online-coop-game.js');
const {enableStageBoss}=await import('../stageboss-host.js?v=ui2');
const {BATTLE_DIRECTOR_PATTERNS:P}=await import('../battle-director169.js?v=ui2');
const start={seed:12345,runId:'online-test',players:[{pilot:'baron',plane:'fokker',faction:'central'},{pilot:'voss',plane:'fokker',faction:'central'}]};
function pair(){
 const messages=[],hostSession={role:'host',send:m=>{messages.push(structuredClone(m));guest.receive(JSON.parse(JSON.stringify(m)));return true;}},guestSession={role:'guest',send:m=>{host.receive(m);return true;}};
 const host=new OnlineCoopGame(hostSession,start),guest=new OnlineCoopGame(guestSession,start);clearInterval(host._netTimer);clearInterval(guest._netTimer);
 return{host,guest,messages,sync:()=>host.networkTick()};
}
test('seed / maps / sets / infinity survive bounded wire codec',()=>{
 const a=seededRandom(44),b=seededRandom(44);for(let i=0;i<100;i++)assert.equal(a(),b());
 const v={parts:new Map([['gun',{hp:20}]]),hit:new Set(['a']),timer:Infinity};v.world=v;const restored=unpack(JSON.parse(JSON.stringify(pack(v))));
 assert.equal(restored.parts.get('gun').hp,20);assert(restored.hit.has('a'));assert.equal(restored.timer,Infinity);assert(!('world'in restored));assert.equal(NET_HZ,15);
});
test('field delta sends descriptors once and removes obsolete properties',()=>{
 const d=new FieldDelta();assert.deepEqual(d.take('enemy',{type:'hunter',hp:10}).set,{type:'hunter',hp:10});assert.equal(d.take('enemy',{type:'hunter',hp:10}),null);assert.deepEqual(d.take('enemy',{hp:9}),{set:{hp:9},remove:['type']});
});
test('guest predicts movement immediately without running Director or collision',()=>{
 const {host,guest,sync}=pair();sync();let director=0,damage=0;guest.tickBattleDirector=()=>director++;guest.updateOrdnance=()=>damage++;
 const p=guest.player('p2'),prior=p.a,x=p.x;guest.localInput({p1:{angle:0}});guest.update(.02);assert.notEqual(p.a,prior);assert.notEqual(p.x,x);assert.equal(director,0);assert.equal(damage,0);assert.equal(guest.t,host.t);
});
test('enemy ID / scene / leader / HP / death reconcile to the host',()=>{
 const {host,guest,sync,messages}=pair();host.beginBattleDirectorPattern(P.CROSS_ATTACK);for(let i=0;i<250;i++)host.update(.02);sync();
 assert.deepEqual(guest.enemies.map(e=>e.id),host.enemies.map(e=>e.id));assert.equal(guest.battleDirector.sceneId,host.battleDirector.sceneId);
 for(const e of guest.enemies){const h=host.enemies.find(h=>h.id===e.id);assert.equal(e.hp,h.hp);assert.equal(e.formationLeader?.id,h.formationLeader?.id);}
 const enemy=host.enemies.find(e=>e.hp>0);enemy.hp=0;enemy.deathHandled=true;sync();assert.equal(guest.enemies.find(e=>e.id===enemy.id).hp,0);
 sync();for(const row of messages.at(-1).lanes.enemies)assert.equal(row.data,null,'unchanged descriptors do not repeat');
});
test('projectile coordinates are sent at birth only, with authoritative retirement',()=>{
 const {host,guest,sync,messages}=pair();const bullet={x:0,y:0,vx:520,vy:0,life:1,damage:12,ownerId:'p2',hit:new Set()};host.bullets.push(bullet);sync();assert.equal(guest.bullets.length,1);assert.equal(messages.at(-1).shots.length,1);
 bullet.x=50;sync();assert.equal(messages.at(-1).shots.length,0);assert.equal(guest.bullets[0].x,0);bullet.life=0;sync();assert.equal(guest.bullets.length,0);assert.equal(messages.at(-1).retired.length,1);
});
test('both clients see native boss parts, phase, HP and destruction',()=>{
 const {host,guest,sync}=pair();enableStageBoss(host,{teamFaction:'central',heavyHp:1.65});const encounter=host.stageBoss.startBoss({x:0,y:-500});sync();
 assert.equal(guest.stageBoss.stages.encounter.bossId,encounter.bossId);assert.equal(guest.stageBoss.stages.encounter.snapshot().hp,encounter.snapshot().hp);
 const body=[...encounter.bodies.values()][0],part=[...body.parts.values()][0];part.hp=0;body.phase='online-phase-test';body.hp-=50;sync();
 const copy=guest.stageBoss.stages.encounter.bodies.get(body.id);assert(copy.parts.get(part.id).destroyed);assert.equal(copy.phase,body.phase);assert.equal(copy.hp,body.hp);
});
test('shared XP pauses both; each pilot exclusively chooses their upgrade',()=>{
 const {host,guest,sync}=pair();host.awardXp(100);sync();assert.equal(guest.state,'upgrade');const first=host.activeUpgrade;
 assert.equal(guest.chooseUpgrade(first.id,first.choices[0].id),false);assert.equal(host.activeUpgrade,first);
 assert(host.chooseUpgrade(first.id,first.choices[0].id));sync();assert.equal(host.activeUpgrade.playerId,'p2');assert.equal(host.chooseUpgrade(host.activeUpgrade.id,host.activeUpgrade.choices[0].id),false);
 const second=host.activeUpgrade;guest.chooseUpgrade(second.id,second.choices[0].id);sync();assert(host.player('p2').upgrades[second.choices[0].id]);assert.deepEqual(guest.player('p2').upgrades,host.player('p2').upgrades);
});
test('one down keeps fighting, rescue restores them, both down ends both',()=>{
 const {host,guest,sync}=pair();host.downPlayer(host.player('p2'));sync();assert.equal(guest.player('p2').status,'downed');assert.equal(host.state,'playing');
 host.revive(host.player('p2'));sync();assert.equal(guest.player('p2').status,'alive');host.downPlayer(host.player('p1'));host.downPlayer(host.player('p2'));sync();assert.equal(host.state,'lost');assert.equal(guest.state,'lost');
});
test('very low positive HP stays alive on both clients until host declares death',()=>{
 const {host,guest,sync}=pair();host.player('p2').hp=.00001;sync();assert.equal(guest.player('p2').hp,.00001);assert.equal(guest.living().length,2);
});
test('guest dropout holds world safely and reconnect requires a full state',()=>{
 const {host,guest,sync,messages}=pair();host.receive({type:'peer',connected:false});assert.equal(host.state,'paused');assert.equal(host.resume(),false);host.receive({type:'peer',connected:true});sync();assert.equal(host.state,'playing');assert.equal(messages.at(-1).full,true);assert.equal(guest.state,'playing');
});
test('rejoined guest starts a fresh input/action sequence immediately',()=>{
 const {host}=pair();host.receive({type:'input',seq:800,input:{angle:1}});host.receive({type:'action',seq:800,action:'reload'});host.receive({type:'peer',connected:false});host.receive({type:'peer',connected:true});host.receive({type:'input',seq:1,input:{angle:0}});assert.equal(host._netRemoteInput.angle,0);host.receive({type:'action',seq:1,action:'skill'});assert.equal(host._netLastAction,1);
});
test('reconnect preserves a manual pause and the individual upgrade selection',()=>{
 for(const state of ['paused','upgrade']){
  const {host,guest,sync,messages}=pair();if(state==='paused')host.pause();else host.awardXp(100);
  const item=host.activeUpgrade;host.receive({type:'peer',connected:false});host.receive({type:'peer',connected:true});sync();
  assert.equal(host.state,state);assert.equal(guest.state,state);assert.equal(host.activeUpgrade,item);assert.equal(messages.at(-1).full,true);
 }
});
test('missed initial baseline and send backpressure recover with full state',()=>{
 const {host,guest,sync,messages}=pair();guest._netHaveBase=false;host._netFull=false;sync();assert.equal(guest._netHaveBase,false);host.receive({type:'resync'});sync();assert.equal(guest._netHaveBase,true);
 host.session.send=()=>false;sync();assert.equal(host._netFull,true);assert.equal(host._netDelta.previous.size,0);assert(messages.length>0);
});
test('every native regional boss can be replicated with intact Map parts',()=>{
 for(let region=0;region<17;region++){
  const {host,guest,sync}=pair();enableStageBoss(host,{teamFaction:'central',heavyHp:1.65});host.stageBoss.stages.stageIndex=region;const encounter=host.stageBoss.startBoss({x:0,y:-300});sync();assert.equal(guest.stageBoss.stages.encounter.bossId,encounter.bossId,'region '+region);for(const b of guest.stageBoss.stages.encounter.bodies.values())assert(b.parts instanceof Map);
 }
});
test('own camera is independent and tether never clamps players to a screen',()=>{
 const {host,guest,sync}=pair();host.player('p1').x=0;host.player('p2').x=800;sync();host.updateCamera(.04);guest.updateCamera(.04);assert.notEqual(host.camera.x,guest.camera.x);
 const p=host.player('p2');p.x=MAX_TETHER+20;const old=p.x;host.constrainMove(p,MAX_TETHER,0);assert(p.x<old);assert(p.x>MAX_TETHER,'soft correction, not a teleport');
});
test('online end bypasses every local and server ranking write',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');const result=app.slice(app.indexOf('function showCoopResult'),app.indexOf('function saveCoopResult'));assert(result.includes('if(run.online)'));assert(!result.slice(result.indexOf('if(run.online)'),result.indexOf('return showEndNickname')).includes('saveCoopLocal'));
 assert.match(app,/async function syncCoopRanking\(run,record\)\{if\(run.online\)return;/);
});
