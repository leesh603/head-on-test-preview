import test from 'node:test';
import assert from 'node:assert/strict';
import {BossEncounter} from '../headon-stageboss-core.js?v=527&b=326';
import {BossHazards} from '../headon-stageboss-hazards.js?v=527';
import {FortDouaumont,FortSouville,VERDUN_FORT_LAYOUT,verdunFortMuzzle,verdunFortCollapseSites} from '../verdun-fortresses.js?v=527';
import {BossStages} from '../headon-stageboss-runtime.js?v=527';
import {BOSS_CATALOG,STAGES,createBossEncounter} from '../headon-stageboss-patterns.js?v=527';
import {fixture as nativeFixture,step as nativeStep} from './stageboss-fixture94.mjs';
import {existsSync} from 'node:fs';

const ctx={players:[{id:'p1',alive:true,x:380,y:560,vx:28,vy:-12,radius:10},{id:'p2',alive:true,x:620,y:590,vx:-18,vy:0,radius:10}],bounds:{left:0,right:960,top:0,bottom:700}};
function fixture(Ctor,extra={}){
 const events=[],hazards=new BossHazards({onDamage(){},onStatus(){},onBarrierContact(){}});
 const b=new Ctor({id:'verdun:body',x:480,y:280,faction:Ctor===FortDouaumont?'central':'entente',rng:()=>.5,tuning:{maxHp:4000,partHp:400,damage:20,bulletSpeed:260,regionalViewWidth:960,regionalViewHeight:700,patternMultiplier:1,...extra},emit:e=>{events.push(e);if(e.type==='hazard')hazards.spawn({...e,encounterId:'verdun'});if(e.type==='cancel-hazards')hazards.clearTagged('verdun',e.tag);}});
 const encounter=new BossEncounter({id:'verdun',bossId:b.kind,bodies:[b]});return{b,events,hazards,encounter};
}
function tick(f,seconds,frame=ctx){for(let i=0;i<Math.ceil(seconds/.05);i++){f.encounter.update(.05,frame);f.hazards.update(.05,frame);}}
function destroy(b,id){return b.hit({partId:id,damage:1e9});}
function activeHazards(f,tag){const a=[];f.hazards.pool.visit(h=>{if(!tag||h.tag===tag)a.push(h);});return a;}

test('fortresses retain one native body and distinct, measured silhouettes',()=>{
 const d=fixture(FortDouaumont),s=fixture(FortSouville);
 assert.equal(d.encounter.bodies.size,1);assert.equal(s.encounter.bodies.size,1);assert(d.b.ownsMotion129&&s.b.ownsMotion129);
 assert.equal(d.b.parts.size,9);assert.equal(s.b.parts.size,12);assert(VERDUN_FORT_LAYOUT['fort-souville'].width>VERDUN_FORT_LAYOUT['fort-douaumont'].width);
 assert(VERDUN_FORT_LAYOUT['fort-souville'].height<VERDUN_FORT_LAYOUT['fort-douaumont'].height);
 const pose=[d.b.x,d.b.y,s.b.x,s.b.y];tick(d,12);tick(s,12);assert.deepEqual([d.b.x,d.b.y,s.b.x,s.b.y],pose);
});
test('protected hull never consumes shots and part damage drains HUD health exactly once',()=>{
 const {b}=fixture(FortDouaumont),p=b.parts.get('mg-left'),hp=b.hp;
 assert.equal(b.hit({damage:100}).blocked,true);assert.equal(b.locateHit({x:b.x,y:b.y+b.regionalCore.y}),null);
 const r=b.hit({partId:p.id,damage:50});assert.equal(r.damage,50);assert.equal(r.bodyDamage,50);assert.equal(b.hp,hp-50);
 destroy(b,p.id);const after=b.hp;assert.equal(destroy(b,p.id).damage,0);assert.equal(b.hp,after);assert.equal(b.parts.get(p.id),p);assert(p.destroyed);
});
test('Douaumont has outer crossfire before heavy predictive gun activation',()=>{
 const f=fixture(FortDouaumont);tick(f,7);assert(f.events.some(e=>e.visual==='verdun-mg'));assert(f.events.some(e=>e.visual==='verdun-aa-shell'));assert(!f.events.some(e=>e.visual==='verdun-heavy-shell'));
 tick(f,9);const shots=f.events.filter(e=>e.visual==='verdun-heavy-shell');assert(shots.length>0);assert(shots.every(e=>e.warning>=1.65&&e.sourceX!=null&&e.once));
});
test('Douaumont unlocks flank ammo, cookoff starves that flank, and both heavy/ammo pairs expose the final core',()=>{
 const f=fixture(FortDouaumont),b=f.b;assert.equal(b.parts.get('ammo-left').hittable,false);assert.equal(destroy(b,'ammo-left').damage,0);
 destroy(b,'heavy-left');assert.equal(b.parts.get('ammo-left').hittable,true);const interval=b.reloadInterval('left');destroy(b,'ammo-left');assert(b.reloadInterval('left')>interval);assert.equal(b.coreVulnerable,false);
 destroy(b,'heavy-right');destroy(b,'ammo-right');assert.equal(b.coreVulnerable,true);assert.equal(b.phase,'verdun-core');assert.equal(f.events.filter(e=>e.type==='ammo-cookoff').length,2);
 const hp=b.hp;destroy(b,'ammo-left');assert.equal(b.hp,hp);b.hit({damage:hp});assert(b.dead&&f.encounter.completed);assert.equal(b.parts.size,9);
});
test('Douaumont control loss cancels committed guns and reduces the next heavy volley',()=>{
 const f=fixture(FortDouaumont),b=f.b;b.heavyActive=true;b.timers.set('heavy-left',0);tick(f,5);assert(f.events.some(e=>e.tag===b.tag('heavy-left')));
 destroy(b,'control');assert.equal(activeHazards(f,b.tag('heavy-left')).length,0);assert.equal(b.parts.get('heavy-left').salvo,null);assert.equal(b.parts.get('heavy-right').salvo,null);
 f.events.length=0;b.timers.set('heavy-left',0);tick(f,5);const shots=f.events.filter(e=>e.visual==='verdun-heavy-shell'&&e.tag===b.tag('heavy-left'));assert.equal(shots.length,1);assert(shots[0].warning>=2);
});
test('destroyed fortress weapons never fire or retain pending hazard warnings',()=>{
 const f=fixture(FortDouaumont),b=f.b;b.heavyActive=true;tick(f,20);destroy(b,'heavy-left');destroy(b,'mg-right');destroy(b,'aa-left');f.events.length=0;tick(f,15);
 for(const id of ['heavy-left','mg-right','aa-left']){assert(!f.events.some(e=>e.type==='hazard'&&e.tag===b.tag(id)));assert.equal(activeHazards(f,b.tag(id)).length,0);}
});
test('Souville hidden gun pits open sequentially and close without deleting parts',()=>{
 const f=fixture(FortSouville),p=f.b.parts.get('pit-left');assert.equal(p.hittable,false);assert.equal(destroy(f.b,p.id).damage,0);tick(f,1.2);assert(p.hittable&&p.revealed);tick(f,3.9);assert.equal(p.hittable,false);assert.equal(p.revealed,false);assert.equal(f.b.parts.get(p.id),p);
 assert(f.events.some(e=>e.type==='fort-pit-open'&&e.partId==='pit-center'));assert(f.events.some(e=>e.visual==='verdun-ambush-shell'));
});
test('Souville observer destruction cancels outside artillery warnings and all later shelling',()=>{
 const f=fixture(FortSouville),b=f.b;b.observerBarrage(ctx.players,ctx.bounds);const initial=activeHazards(f,b.tag('observer'));assert.equal(initial.length,4);assert(initial.every(h=>h.sourceY<ctx.bounds.top&&h.warning>=2));
 const locked={...b.observerLock};ctx.players[0].x+=100;assert.deepEqual(b.observerLock,locked);ctx.players[0].x-=100;
 destroy(b,'observer');assert.equal(b.observerLock,null);assert.equal(activeHazards(f,b.tag('observer')).length,0);f.events.length=0;tick(f,25);assert(!f.events.some(e=>e.visual==='verdun-offscreen-shell'));
});
test('Souville command loss prevents new reserve activation; existing activated pits remain destructible',()=>{
 const f=fixture(FortSouville);tick(f,12);assert.equal(f.b.parts.get('reserve-left').active,true);assert.equal(f.b.parts.get('reserve-right').active,false);destroy(f.b,'command');tick(f,30);assert.equal(f.b.parts.get('reserve-right').active,false);
 const g=fixture(FortSouville);destroy(g.b,'command');tick(g,35);assert(!g.events.some(e=>e.type==='fort-reserve-active'));
});
test('Souville ruins expose underground ammunition and chain damage weakens interior defenses',()=>{
 const f=fixture(FortSouville),b=f.b;destroy(b,'observer');destroy(b,'command');assert.equal(b.parts.get('ammo').hittable,true);assert.equal(b.coreVulnerable,false);
 const p=b.parts.get('pit-center'),hp=p.hp;destroy(b,'ammo');assert(p.hp<hp);assert.equal(b.coreVulnerable,true);assert.equal(b.phase,'verdun-underground');assert.equal(f.events.filter(e=>e.type==='ammo-cookoff').length,1);
 tick(f,8);assert(f.events.some(e=>e.visual==='verdun-core-shell'));b.hit({damage:b.hp});assert(b.dead&&f.encounter.completed);assert.equal(activeHazards(f).length,0);
});
test('huge fortress world scale, swept hitboxes and rotating muzzle coordinates agree on PC and mobile',()=>{
 for(const Ctor of [FortDouaumont,FortSouville])for(const width of [390,960]){
  const {b}=fixture(Ctor,{regionalViewWidth:width,regionalViewHeight:844});const layout=VERDUN_FORT_LAYOUT[b.kind];assert(b.fortScale>=.8);assert(layout.width*b.fortScale>=656);if(width===390)assert(layout.width*b.fortScale>width*1.6);
  const p=b.parts.values().next().value;assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y}).partId,p.id);
  assert.equal(b.locateHit({previousX:b.x+p.x-p.hitRadiusX-40,previousY:b.y+p.y,x:b.x+p.x+p.hitRadiusX+40,y:b.y+p.y,radius:2}).partId,p.id);
  p.angle=.9;const m=verdunFortMuzzle(b,p);assert.equal(m.x,b.x+p.x+Math.cos(p.angle)*p.muzzleLength);assert.equal(m.y,b.y+p.y+Math.sin(p.angle)*p.muzzleLength);
 }
});
test('final collapse covers the fortress in a timed sequence and retains destroyed part locations',()=>{
 for(const Ctor of [FortDouaumont,FortSouville]){const {b}=fixture(Ctor),p=b.parts.values().next().value;destroy(b,p.id);const sites=verdunFortCollapseSites(b);assert.equal(sites.length,b.parts.size+1);assert(sites.every((q,i)=>!i||q.at>sites[i-1].at));assert.equal(sites.at(-1).final,true);assert(sites.at(-1).at>4);assert(Math.max(...sites.map(q=>q.x))-Math.min(...sites.map(q=>q.x))>450*b.fortScale);assert.equal(sites.find(q=>q.partId===p.id).x,b.x+p.x);}
});
test('Verdun is stage 12 with the opposite faction fortress and one native encounter HP budget',()=>{
 assert.equal(STAGES[12],'verdun');
 for(const [teamFaction,bossId]of [['entente','fort-douaumont'],['central','fort-souville']]){
  const s=new BossStages({teamFaction,stageIndex:12});assert.equal(s.bossId,bossId);assert.notEqual(BOSS_CATALOG[bossId].faction,teamFaction);
  const f=nativeFixture({stageIndex:12,teamFaction}),e=f.addon.startBoss({x:0,y:-560}),b=e.bodies.values().next().value;
  assert.equal(e.bossId,bossId);assert.equal(e.bodies.size,1);assert.equal(e.maxHpBudget,1000);assert.equal(b.t.mobileBoss,false);assert.equal(b.t.motionMultiplier,0);
  const direct=createBossEncounter({id:'direct',bossId,tuning:b.t,x:0,y:-560,emit(){},rng:()=>.5});assert.equal(direct.bodies.values().next().value.kind,bossId);
 }
});
test('Verdun appends to the existing introductory stage order and remains in subsequent loops',()=>{
 const s=new BossStages({teamFaction:'entente',rng:()=>.5});assert.deepEqual(s.order,[0,2,1,5,3,7,9,4,8,10,11,6,12,13]);
 for(let i=0;i<14;i++){const e=createBossEncounter({id:'rotation-'+i,bossId:s.bossId,tuning:{maxHp:100,partHp:10,damage:5,bulletSpeed:160},x:0,y:0,emit(){},rng:()=>.5});for(const b of e.bodies.values()){b.dead=true;b.hp=0;}s.attach(e);s.poll();s.advance(false);}
 assert.equal(s.loopIndex,1);assert.equal(new Set(s.order).size,14);assert(s.order.includes(12));assert(s.order.includes(8));
});
function clearNativeFortress(f){
 const b=f.addon.stages.encounter.bodies.values().next().value;
 if(b.kind==='fort-douaumont')for(const id of ['heavy-left','heavy-right','ammo-left','ammo-right'])destroy(b,id);
 else for(const id of ['observer','command','ammo'])destroy(b,id);
 b.hit({damage:b.hp});return b;
}
test('native runtime pauses fortress attacks and runs the full ordered 4.8 second collapse before one reward',()=>{
 for(const teamFaction of ['entente','central']){
  const f=nativeFixture({stageIndex:12,teamFaction}),e=f.addon.startBoss({x:380,y:-520}),b=e.bodies.values().next().value;nativeStep(f,8);
  const state=JSON.stringify({clock:b.clock,hp:b.hp,x:b.x,y:b.y,parts:[...b.parts.values()]});f.frame.paused=true;nativeStep(f,4);assert.equal(JSON.stringify({clock:b.clock,hp:b.hp,x:b.x,y:b.y,parts:[...b.parts.values()]}),state);f.frame.paused=false;
  clearNativeFortress(f);f.addon.reconcile({blocked:true});assert.equal(f.addon.defeatSequence.duration,4.8);assert.equal(f.addon.hazards.pool.count,0);assert.equal(f.log.clears.length,0);
  nativeStep(f,2);const age=f.addon.defeatSequence.age;f.frame.paused=true;nativeStep(f,3);assert.equal(f.addon.defeatSequence.age,age);f.frame.paused=false;
  nativeStep(f,2.7);assert.equal(f.log.clears.length,0);nativeStep(f,.2);assert.equal(f.log.clears.length,1);assert.equal(f.addon.stages.stageIndex,12);
  const pulses=f.log.cues.filter(q=>q.type==='boss-destruction-pulse'),sites=verdunFortCollapseSites(b);assert.equal(pulses.length,sites.length);assert.deepEqual(pulses.map(q=>[q.partId,q.x,q.y,q.final]),sites.map(q=>[q.partId,q.x,q.y,!!q.final]));
  f.addon.reconcile({blocked:false});f.addon.reconcile({blocked:false});assert.equal(f.log.clears.length,1);assert.equal(f.log.stages.length,1);assert.notEqual(f.addon.stages.stageIndex,12);
 }
});
function hostGame(){
 const log={smoke:[],blasts:[]},g={state:'playing',mode:'survival',runId:'verdun-host',t:0,x:0,y:0,a:-Math.PI/2,hp:120,maxHp:120,id:'p1',kills:0,priorityKills:0,distance:0,region:12,viewWidth:390,viewHeight:844,events:[],enemies:[],bullets:[],drops:[],pendingLevelUps:[],rng:()=>.5,
  reserveEnemySlots(){},clearRegionalHazards(){},hit(){},event(type,text){this.events.push({type,text});},burst(){},smoke(x,y,dark){log.smoke.push({x,y,dark});},combatBlast(x,y,radius){log.blasts.push({x,y,radius});},spawnEnemy(){const e={hp:100,maxHp:100,speed:160};this.enemies.push(e);return e;}};
 return{g,log};
}
test('host Verdun tuning, forward spawn and local bullet impact preserve native ownership and other spawn rates',async()=>{
 const {enableStageBoss,beginStageBossFrame,damageStageBoss,stageSpawnInterval,STAGE_NAMES}=await import('../stageboss-host.js?v=527');
 const {g,log}=hostGame(),a=enableStageBoss(g,{teamFaction:'entente'});a.stages.stageIndex=12;g.t=91;beginStageBossFrame(g,.01);
 const b=a.stages.encounter.bodies.values().next().value,e=g.enemies.find(e=>e.stageBossBody===b);assert.equal(STAGE_NAMES[12],'베르됭');assert(b.y<=g.y-500);assert(Math.abs(b.x-g.x)<1e-9);assert.equal(b.fortScale,.8);assert.equal(b.t.geometryScale,1);
 assert.equal(stageSpawnInterval(g,2),2/.22);a.stages.stageIndex=0;assert.equal(stageSpawnInterval(g,2),2/.55);a.stages.stageIndex=12;
 const p=b.parts.get('mg-left'),shot={x:b.x+p.x,y:b.y+p.y,ownerId:'p1'},hp=b.hp;damageStageBoss(g,e,shot,35);assert.equal(b.hp,hp-35);assert.equal(g.stageBossLastOwner,'p1');assert.deepEqual(log.smoke.at(-1),{x:shot.x,y:shot.y,dark:false});assert(g.events.some(e=>e.type==='impact'));
});
test('host stores fortress wreck pose after completed collapse and clears it at the next stage',async()=>{
 const {enableStageBoss}=await import('../stageboss-host.js?v=527');const {g}=hostGame(),a=enableStageBoss(g,{teamFaction:'central'});a.stages.stageIndex=12;
 const e=a.startBoss({x:70,y:-580}),b=clearNativeFortress({addon:a});a.reconcile({blocked:true});
 const frame={players:[{id:'p1',alive:true,x:0,y:0,radius:10}],bounds:{left:-195,right:195,top:-422,bottom:422}};
 for(let i=0;i<98;i++){a.tick(.05,frame);a.reconcile({blocked:true});}
 assert.equal(g.priorityKills,1);assert.equal(g.verdunWrecks.length,1);assert.equal(g.verdunWrecks[0],b);assert.equal(g.verdunWrecks[0].x,70);assert.equal(g.verdunWrecks[0].y,-580);assert.equal(a.stages.phase,'clear-pending');assert.equal(e.completed,true);
 a.reconcile({blocked:false});assert.equal(g.verdunWrecks.length,0);assert.equal(g.verdunBattle,null);assert.notEqual(a.stages.stageIndex,12);assert.equal(g.priorityKills,1);
});
test('direct Verdun entry loads terrain and both fortress atlas layers without a transition',async()=>{
 const oldImage=globalThis.Image,requests=[];
 globalThis.Image=class{naturalWidth=1774;naturalHeight=887;set src(value){this.url=value;if(value){requests.push(value);queueMicrotask(()=>this.onload?.());}}};
 try{
  const {paintVerdun,drawVerdunFort,releaseVerdunAssets}=await import('../verdun-art.js?v=527');
  const draws=[],c=new Proxy({globalAlpha:1,drawImage(...a){draws.push(a)}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  paintVerdun(c,{},0,0,960,700);drawVerdunFort(c,fixture(FortDouaumont).b);drawVerdunFort(c,fixture(FortSouville).b);
  for(const name of ['terrain-verdun-r8.webp','boss-douaumont-atlas-r8.webp','boss-douaumont-parts-r8.webp','boss-souville-atlas-r8.webp','boss-souville-parts-r8.webp']){
   assert(requests.some(url=>url.includes(name)),name+' must load on direct entry');assert(existsSync(new URL('../'+name,import.meta.url)));
  }
  assert(draws.length>20,'the terrain, body and individual parts must all render');releaseVerdunAssets();
 }finally{globalThis.Image=oldImage;}
});
