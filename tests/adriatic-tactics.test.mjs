import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js?v=tame3&rail=18';
const tuning={maxHp:2400,partHp:280,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,splitProtection:0,broadsideInterval:1.8,mortarInterval:2.05,chargeInterval:3.05,suppressiveInterval:3.1};
const frame={players:[{id:'p1',alive:true,x:100,y:200,vx:30,vy:0,radius:12},{id:'p2',alive:true,x:300,y:250,vx:0,vy:-20,radius:12}],bounds:{left:-200,right:600,top:-450,bottom:450}};
function setup(id){const events=[],enc=createBossEncounter({id:'tactics-'+id,bossId:id,tuning:{...tuning},x:200,y:-100,rng:()=>.5,emit:e=>events.push(e)});return{enc,b:[...enc.bodies.values()][0],events};}
function run(f,seconds){for(let i=0;i<Math.ceil(seconds/.02);i++)f.enc.update(.02,frame);}
test('Stuttgart initial five-plane flight precedes first guns and hangar opens at 80% even on a lethal hit',()=>{
 const f=setup('sms-stuttgart');run(f,.1);assert.equal(f.events.filter(e=>e.type==='spawn-minion').length,5);assert.equal(f.b.support129.projectiles.count,0);
 f.b.hit({damage:99999});assert.equal(f.b.hp,1920);assert.equal(f.b.support129.phase,2);assert(f.events.some(e=>e.type==='hangar-cover-ejected'));
 run(f,3);assert(f.events.some(e=>e.type==='charge-warning'));assert(f.b.support129.projectiles.count>0);
});
test('Stuttgart cannot skip evasive navigation, final warning, staggered final sorties or defeat',()=>{
 const f=setup('sms-stuttgart'),s=f.b.support129;f.b.hit({damage:99999});f.b.hit({damage:99999});assert.equal(s.phase,3);assert.equal(f.b.hp,1200);
 f.b.hit({damage:99999});assert.equal(s.phase,4);assert.equal(f.b.hp,600);f.b.hit({damage:99999});assert(f.b.hp>0);
 f.events.length=0;run(f,3.3);const launches=f.events.filter(e=>e.type==='seaplane-launch');assert.equal(launches.length,4,'one initial flight plus three final sorties');assert.equal(s.finalWave,3);assert(s.effects.count<160);assert(s.projectiles.count<=256);
 f.b.hit({damage:99999});assert(f.b.dead);assert(f.enc.completed);assert(f.events.some(e=>e.type==='support-cleanup'));
});
test('Stuttgart hangar/fuel destruction stops the final flight while guns and engine stay independently destructible',()=>{
 for(const facility of ['hangar','fuel']){const f=setup('sms-stuttgart'),s=f.b.support129;f.b.hit({damage:99999});f.b.hit({partId:facility,damage:99999});while(s.phase<4)f.b.hit({damage:99999});run(f,.1);f.events.length=0;run(f,3.3);assert.equal(f.events.some(e=>e.type==='spawn-minion'),false,facility);}
 const f=setup('sms-stuttgart'),s=f.b.support129;run(f,4);const speed=s.driveVelocity;f.b.hit({partId:'boiler',damage:99999});run(f,.02);assert(s.driveVelocity<speed*.4);
 for(let i=0;i<4;i++)f.b.hit({partId:'gun'+i,damage:99999});s.projectiles.clear();run(f,5);assert.equal(s.projectiles.count,0);
});

function split(f,bySeam=false){f.b.hit(bySeam?{partId:'seam',damage:99999}:{damage:99999});run(f,2.72);return [...f.enc.bodies.values()];}
test('Zubian ranges each co-op player, warns alternating broadsides, and splits by either hull HP or seam damage',()=>{
 for(const bySeam of [false,true]){const f=setup('hms-zubian');run(f,.1);assert.equal(f.events.filter(e=>e.tag==='zubian-entry').length,2);f.events.length=0;run(f,5);assert(f.events.some(e=>e.type==='muzzle'));assert(f.events.some(e=>e.visual==='zubian-shell'));const halves=split(f,bySeam);assert.equal(halves.length,2);assert(f.events.some(e=>e.type==='split-start'));assert(f.events.some(e=>e.type==='split'));assert.equal(halves.reduce((n,b)=>n+b.hp,0),bySeam?2400:1200);}
});
test('Zubian paired, bow-only and stern-only last stands use distinct attacks and remain defeatable',()=>{
 for(const mode of ['paired','front','rear']){const f=setup('hms-zubian'),halves=split(f),bow=halves.find(b=>b.role==='front'),stern=halves.find(b=>b.role==='rear');
  if(mode==='paired')for(const b of halves)b.hit({damage:b.hp*.55});else halves.find(b=>b.role!==mode).hit({damage:99999});
  f.events.length=0;run(f,15);const phases=f.events.filter(e=>e.type==='phase-change').map(e=>e.phase);
  if(mode==='paired'){assert(phases.includes('zubian-pincer'));assert(f.events.some(e=>e.tag==='zubian-crossfire'));assert(f.events.some(e=>e.visual==='torpedo-charge'));}
  if(mode==='front'){assert(bow.soloEnraged);assert(phases.includes('zubian-bow-rush'));assert(f.events.some(e=>e.visual==='torpedo-charge'));assert(!f.events.some(e=>e.visual==='zubian-mortar'));}
  if(mode==='rear'){assert(stern.soloEnraged);assert(phases.includes('zubian-stern-barrage'));assert(f.events.some(e=>e.tag==='zubian-final-mortar'));assert(!f.events.some(e=>e.visual==='torpedo-charge'));}
  for(const b of halves)if(!b.dead)b.hit({damage:99999});assert(f.enc.completed);
 }
});
test('Zubian engine loss slows both hulls and gun loss cancels warned weapons in their last stands',()=>{
 const f=setup('hms-zubian'),halves=split(f);for(const b of halves){b.phase=b.role==='front'?'stalking':'rear-mortar';b.finalClock=99;b.timers.set('charge',99);b.hp=b.maxHp*.4;}
 run(f,.02);const speeds=halves.map(b=>b.driveVelocity);
 halves.forEach(b=>b.hit({partId:b.engine().id,damage:99999}));run(f,.02);halves.forEach((b,i)=>assert(b.driveVelocity<speeds[i]*.4));
 halves.forEach(b=>b.hit({partId:b.gun().id,damage:99999}));f.events.length=0;run(f,20);assert(!f.events.some(e=>e.visual==='zubian-shell'||e.visual==='zubian-mortar'||e.visual==='torpedo-charge'));
});

import {Game} from '../engine.js?v=tame3&rail=18';
import {CoopGame} from '../coop-engine.js?v=tame3&rail=18';
import {enableStageBoss,beginStageBossFrame,endStageBossFrame,redirectStuttgartSortie} from '../stageboss-host.js?v=tame3&hints=1&rail=18';
import {fixture,step} from './stageboss-fixture94.mjs';
import {pack,unpack} from '../online-coop-protocol.js';
import {drawSupportEffects,drawSupportShip} from '../stuttgart-render129.js?v=tame3';
function host(coop){const g=coop?new CoopGame([{pilot:'fonck'},{pilot:'guynemer'}],{rng:()=>.5}):new Game('spad','fonck',()=>.5);g.viewWidth=390;g.viewHeight=844;g.region=1;enableStageBoss(g,{teamFaction:'entente',heavyHp:coop?1.65:1});g.stageBoss.stages.stageIndex=1;for(const p of g.players||[g]){p.x=0;p.y=0;p.invuln=9999;}return g;}
function tickHost(g,seconds){for(let i=0;i<Math.ceil(seconds/.02);i++){g.t+=.02;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}}
for(const coop of [false,true])test(`real ${coop?'co-op':'solo'} Stuttgart host keeps final sortie active at the six-aircraft cap`,()=>{
 const g=host(coop),enc=g.stageBoss.startBoss({x:0,y:-200}),b=[...enc.bodies.values()][0];tickHost(g,.1);
 let flight=g.enemies.filter(e=>e.bossMinion);assert.equal(flight.length,5);assert(flight.every(e=>e.escortPlane==='hansa_brandenburg_cc'&&Math.abs(e.x)<195&&Math.abs(e.y)<422));
 b.hit({damage:99999});tickHost(g,.5);flight=g.enemies.filter(e=>e.bossMinion&&e.hp>0);assert.equal(flight.length,6);
 b.hit({damage:99999});b.hit({damage:99999});tickHost(g,3.1);assert.equal(b.support129.finalWave,3);assert.equal(g.enemies.filter(e=>e.bossMinion&&e.hp>0).length,6);assert(flight.every(e=>Number.isFinite(e.passTargetX)));assert(flight.some(e=>e.passAge<1));
 g.state='paused';const pose=JSON.stringify([b.x,b.y,b.support129.phaseAge,flight.map(e=>[e.x,e.y,e.passAge])]);tickHost(g,.5);assert.equal(JSON.stringify([b.x,b.y,b.support129.phaseAge,flight.map(e=>[e.x,e.y,e.passAge])]),pose);
 g.state='playing';b.hit({damage:99999});tickHost(g,.2);b.hit({damage:99999});tickHost(g,.02);assert.equal(g.stageBoss.defeatSequence.duration,4.4);tickHost(g,4.5);assert.equal(g.enemies.some(e=>e.encounterId===enc.id),false);g.stageBoss.dispose();
});
test('final sortie orders redirect exactly two owned live aircraft without teleporting or changing the cap',()=>{
 const planes=Array.from({length:6},(_,i)=>({x:i*10,y:20,hp:10,life:1,bossMinion:true,encounterId:'e',behavior:'attack-pass',escortPlane:'hansa_brandenburg_cc',passLocked:true}));planes.push({...planes[0],encounterId:'other'});const positions=planes.map(e=>[e.x,e.y]);
 for(let wave=0;wave<3;wave++)assert.equal(redirectStuttgartSortie(planes,{encounterId:'e',wave,targetX:100,targetY:200}),2);
 assert(planes.slice(0,6).every(e=>e.passLocked===false&&e.passAge===0&&e.life===3.5));assert.equal(planes[6].passLocked,true);assert.deepEqual(planes.map(e=>[e.x,e.y]),positions);
});
for(const teamFaction of ['central','entente'])test(`${teamFaction} Adriatic mobile battle keeps hazards bounded and waits for sinking before clear`,()=>{
 const f=fixture({stageIndex:1,teamFaction});f.hooks.getTuning=()=>({...tuning,projectileDensity:.7,splitProtection:.1});const enc=f.addon.startBoss({x:400,y:200}),b=[...enc.bodies.values()][0];
 if(b.support129){b.hit({damage:99999});b.hit({damage:99999});b.hit({damage:99999});}else{b.hit({damage:99999});step(f,2.8);}
 step(f,120);assert.equal(f.addon.hazards.pool.dropped,0);assert(f.addon.hazards.pool.count<80);for(const body of enc.bodies.values()){assert([body.x,body.y,body.hp].every(Number.isFinite));assert(body.x>=f.frame.bounds.left&&body.x<=f.frame.bounds.right);if(body.support129){assert.equal(body.support129.projectiles.dropped,0);assert.equal(body.support129.effects.dropped,0);}body.hit({damage:99999});}
 f.addon.reconcile({blocked:true});assert.equal(f.addon.defeatSequence.duration,4.4);step(f,4);assert.equal(f.log.clears.length,0);step(f,.5,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.addon.hazards.pool.count,0);
});
test('Stuttgart effects and actual ship render from the serialized co-op guest pools',()=>{
 const f=setup('sms-stuttgart');run(f,3);const guest=unpack(pack(f.b.support129));assert.equal(typeof guest.projectiles.visit,'undefined');const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(()=>{})});
 assert.doesNotThrow(()=>drawSupportEffects(c,guest));assert.doesNotThrow(()=>drawSupportShip(c,guest,{ship:{},cover:{}}));
});
for(const count of [1,2])test(`${count}-pilot mobile Zubian brackets a locked route then closes it with a separately warned finishing shell`,()=>{
 const f=setup('hms-zubian'),mobile={players:frame.players.slice(0,count),bounds:{left:5,right:395,top:-422,bottom:422}};
 f.b.hit({damage:99999});for(let i=0;i<140;i++)f.enc.update(.02,mobile);const stern=[...f.enc.bodies.values()].find(b=>b.role==='rear');f.events.length=0;
 stern.mortar(mobile.players,{crossAngle:0});const h=f.events.filter(e=>e.tag==='zubian-mortar');assert.equal(h.length,3);assert(h.every(e=>e.warning>=1.1));assert(h.slice(0,-1).every(e=>e.y>mobile.players[0].y+60));assert(h.at(-1).raidHeavy);assert(h.at(-1).warning>=h[0].warning+.9);assert.equal(h.at(-1).duration,.23);
 for(let i=0;i<6000;i++)f.enc.update(.02,mobile);for(const b of f.enc.bodies.values()){assert(Number.isFinite(b.x)&&Number.isFinite(b.y));assert(b.x>=mobile.bounds.left-160&&b.x<=mobile.bounds.right+160,'painted half stays within sight while hull clearance yields');}
});
