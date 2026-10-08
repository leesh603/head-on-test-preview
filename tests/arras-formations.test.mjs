import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {CoopGame} from '../coop-engine.js';
import {enableStageBoss,stageBossBounds} from '../stageboss-host.js';
import {bossHudModel} from '../headon-stageboss-hud.js';

function sortie({width=960,height=700,coop=false,faction='entente',seed=.5}={}){
 const g=coop?new CoopGame([{pilot:'collishaw',plane:'sopwith'},{pilot:'ball',plane:'se5a'}],{rng:()=>seed}):new Game(faction==='entente'?'camel':'fokker','collishaw',()=>seed);
 g.state='playing';g.viewWidth=width;g.viewHeight=height;g.spawn=g.nextBossAt=g.eventTimer=g.flakTimer=g.regionThreat=g.patrolTimer=Infinity;
 for(const p of g.players||[g]){p.invuln=Infinity;p.fire=Infinity;}
 const a=enableStageBoss(g,{teamFaction:faction});a.stages.stageIndex=9;g.region=9;g.spawnPatrol();
 const e=a.startBoss({x:g.x,y:g.y-180}),b=[...e.bodies.values()][0];
 return {g,a,b,e};
}
function advance(f,seconds,input={}){for(let i=0;i<seconds/.02;i++){for(const p of f.g.players||[f.g])p.fire=Infinity;f.g.update(.02,input);}}
for(const spec of [{width:960,height:700},{width:390,height:844},{width:1280,height:800,coop:true}]){
 test(`Jasta real-round entrance and crash, ${spec.width}px ${spec.coop?'coop':'solo'}`,()=>{
  const f=sortie(spec),victims=[...f.g.patrols],hits=[],shots=new Set();const original=f.g.hitPatrol;
  f.g.hitPatrol=function(p,d,b){const hp=p.hp;original.call(this,p,d,b);if(p.hp<hp)hits.push({p,hp:p.hp,b,onScreen:f.b.visible(p,stageBossBounds(this))});};
  assert.equal(bossHudModel(f.e),null);
  for(let i=0;i<2500&&!f.b.entryComplete;i++){advance(f,.02);for(const b of f.g.bullets)if(b.formationBoss129)shots.add(b.sourceBossId||b.sourceMinionId);}
  assert.equal(f.b.entryComplete,true,'entry must finish by actual kills');
  assert.ok(hits.length>8);assert.ok(hits.every(h=>h.b?.formationBoss129),'only real boss rounds cause damage');
  assert.equal(victims.filter(p=>p.hp===0&&p.crashed).length,2,'both original NPCs finish their crash');
  assert.ok(hits.filter(h=>h.hp===0).every(h=>h.onScreen),'every fatal hit inside viewport');
  assert.equal(shots.size,5,'leader and all four original aircraft shoot');
  assert.equal(f.g.patrolLosses,2);assert.ok(bossHudModel(f.e));
  assert.equal(f.g.enemies.filter(e=>e.bossMinion&&e.hp>0).length,4);
 });
}
test('Jasta preserves player control, permanent and temporary augmentation wingmen',()=>{
 const f=sortie({width:390,height:844});f.g.permanentWingman=2;f.g.ensureWingmen();f.g.spawnAlly();const allies=[...f.g.allies];
 const before=f.g.x;advance(f,1,{turn:1});assert.notEqual(f.g.x,before);
 for(const ally of allies){const b={x:ally.x+40,y:ally.y,vx:300,vy:0,life:1,damage:1000,formationBoss129:true};f.g.resolveHostileRound(b,ally.x-40,ally.y);assert.ok(ally.life>0);assert.notEqual(ally.hp,0);}
});
test('Jasta tactics differ; final uses survivor roles once and supplies a recovery',()=>{
 const f=sortie();f.b.entryComplete=true;f.b.recoverLeft=0;advance(f,.1);const wings=f.g.enemies.filter(e=>e.bossMinion);const phases=new Set();
 for(let i=0;i<1300;i++){advance(f,.02);phases.add(f.b.phase);}
 for(const phase of ['encirclement','echelon-assault','concentrated-assault','sun-hunt'])assert.ok(phases.has(phase));
 wings[0].hp=0;wings[3].hp=0;advance(f,.05);f.b.hit({damage:f.b.maxHp*.7});advance(f,.1);
 assert.equal(f.b.phase,'red-total-assault');assert.equal(f.b.finalRoles.length,2);assert.ok(!f.b.finalRoles.includes(wings[0].formationRole));
 const count=f.g.enemies.filter(e=>e.bossMinion).length;advance(f,12);assert.ok(f.b.finalUsed);assert.equal(f.b.finalAge,undefined);
 assert.ok(f.g.enemies.filter(e=>e.bossMinion).length<=count,'no resurrection');
});
test('Jasta destruction advances region exactly once and restart creates a fresh five',()=>{
 const f=sortie();f.b.entryComplete=true;advance(f,.1);f.b.hit({damage:f.b.hp});advance(f,3.5);
 assert.notEqual(f.a.stages.stageIndex,9);assert.equal(f.g.enemies.filter(e=>e.encounterId===f.e.id).length,0);
 const next=sortie();advance(next,.05);assert.equal(next.g.enemies.filter(e=>e.bossMinion).length,4);
});
