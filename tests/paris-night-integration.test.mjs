import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game} from '../engine.js';
import {ensureParisBattle,handleParisCue,tickParisBattle} from '../paris-night-battle.js';
import {BossStages} from '../headon-stageboss-runtime.js';
import {createBossEncounter} from '../headon-stageboss-patterns.js';
import {PARIS_ATLAS_RECTS} from '../paris-night-atlas.js';
const game=()=>({x:0,y:0,t:0,state:'playing',kills:0,viewWidth:960,viewHeight:700,events:[],combatBlast(){},event(type,text){this.events.push({type,text})},stageBoss:{stages:{stageIndex:15,teamFaction:'entente',encounter:{completed:false,bodies:new Map()}}}});
test('Paris keeps faction-specific independent boss IDs and appended route',()=>{
 for(const [team,id] of [['central','paris-searchlight-fortress'],['entente','paris-staaken-rvi']]){
  const stages=new BossStages({teamFaction:team,stageIndex:15});assert.equal(stages.bossId,id);assert.equal(stages.stage,'paris-night');assert.equal(stages.order.at(-1),15);
 }
});
test('City warning abort cancels only the unlaunched run, never already dropped bombs',()=>{
 const g=game(),b=ensureParisBattle(g);handleParisCue(g,{type:'city-bomb-warning',runId:'a'});handleParisCue(g,{type:'city-bomb',runId:'a',targetId:'rail',seconds:1.3,damage:32});handleParisCue(g,{type:'city-bomb-abort',runId:'a'});
 assert.equal(b.warnings.length,0);assert.equal(b.bombs.length,1);tickParisBattle(g,1.4);assert.equal(b.cityDamage,32);assert.equal(g.state,'playing');
});
test('City cumulative damage loses before district exhaustion, including a released last salvo',()=>{
 const g=game(),b=ensureParisBattle(g);b.cityDamage=112;g.stageBoss.stages.encounter.completed=true;
 handleParisCue(g,{type:'city-bomb',runId:'last',targetId:'rail',seconds:.01,damage:16});tickParisBattle(g,.02);
 assert.equal(b.cityDamage,128);assert.equal(g.state,'lost');assert(b.districts.every(d=>d.hp>0));assert.equal(g.events.filter(e=>e.type==='end').length,1);
});
test('Paused/upgrade city state freezes timers; leaving Paris releases its state',()=>{
 const g=game(),b=ensureParisBattle(g);handleParisCue(g,{type:'city-bomb',runId:'a',targetId:'rail',seconds:1,damage:32});g.state='paused';tickParisBattle(g,3);assert.equal(b.bombs[0].left,1);
 g.state='playing';g.pendingLevelUps=[1];tickParisBattle(g,3);assert.equal(b.bombs[0].left,1);g.stageBoss.stages.stageIndex=11;tickParisBattle(g,3);assert.equal(g.parisBattle,null);
});
test('Fortress anchors to the authored parade square and both players stay inside city',()=>{
 const g=game(),b=ensureParisBattle(g);const body={kind:'paris-searchlight-fortress',x:900,y:500};g.stageBoss.stages.encounter.bodies.set('b',body);handleParisCue(g,{type:'boss-enter'});assert.equal(body.x,b.origin.x);assert.equal(body.y,b.origin.y-940);
 g.players=[{x:-5000,y:5000},{x:5000,y:-5000}];tickParisBattle(g,.02);for(const p of g.players){assert(Math.abs(p.x)<1536);assert(Math.abs(p.y)<1536);}
});
test('Atlas pairs are nonempty real alpha WebP files and all local references exist',async()=>{
 for(const name of ['paris-fortress-parts1918.webp','paris-staaken-parts1918.webp','terrain-paris-night1918.webp','paris-fortress-preview1918.webp','paris-staaken-preview1918.webp']){
  const bytes=await readFile(new URL('../'+name,import.meta.url));assert(bytes.length>10000);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
 for(const rects of Object.values(PARIS_ATLAS_RECTS)){assert.equal(rects.length,16);assert(rects.every(r=>r.length===4&&r[2]>15&&r[3]>15));}
 const encounter=createBossEncounter({id:'p',bossId:'paris-staaken-rvi',tuning:{maxHp:1000,partHp:80,damage:10,bulletSpeed:200,geometryScale:1},x:0,y:0});assert.equal([...encounter.bodies.values()][0].parts.size,10);
});

test('Paris mobile sizing keeps the airframe, mounts and core collision at one scale',()=>{
 for(const pilot of ['baron','fonck'])for(const width of [487,1280]){
  const g=new Game(pilot==='baron'?'fokker':'camel',pilot,()=>.5);g.viewWidth=width;g.update(.001);
  const a=g.stageBoss;a.stages.stageIndex=15;g.region=15;
  a.startBoss({x:0,y:0});const b=a.stages.encounter.bodies.values().next().value,s=Math.min(1,width/620);
  assert.equal(b.t.geometryScale,s);assert.equal(b.coreRadius,(pilot==='baron'?53:45)*s);
  assert.equal(b.parts.get(pilot==='baron'?'light-nw':'engine-0').radius,(pilot==='baron'?27:19)*s);
  assert.ok((pilot==='baron'?500:540)*s<=width);
 }
});
