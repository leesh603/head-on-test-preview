import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game} from '../engine.js';
import {ensureParisBattle,handleParisCue,tickParisBattle} from '../paris-night-battle.js';
import {BossStages} from '../headon-stageboss-runtime.js';
import {createBossEncounter} from '../headon-stageboss-patterns.js';
import {PARIS_ART_LAYOUTS,PARIS_PART_CLIPS} from '../paris-night-atlas.js';
const game=()=>({x:0,y:0,t:0,state:'playing',kills:0,viewWidth:960,viewHeight:700,events:[],combatBlast(){},event(type,text){this.events.push({type,text})},stageBoss:{stages:{stageIndex:15,teamFaction:'entente',encounter:{completed:false,bodies:new Map()}}}});
test('Paris keeps faction-specific independent boss IDs and appended route',()=>{
 for(const [team,id] of [['central','paris-searchlight-fortress'],['entente','paris-staaken-rvi']]){
  const stages=new BossStages({teamFaction:team,stageIndex:15});assert.equal(stages.bossId,id);assert.equal(stages.stage,'paris-night');assert.equal(stages.order.at(-2),15);
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
test('Fortress anchors to the parade square without restricting either player flight',()=>{
 const g=game(),b=ensureParisBattle(g);const body={kind:'paris-searchlight-fortress',x:900,y:500};g.stageBoss.stages.encounter.bodies.set('b',body);handleParisCue(g,{type:'boss-enter'});assert.equal(body.x,b.origin.x);assert.equal(body.y,b.origin.y-460);
 g.players=[{x:-5000,y:5000},{x:5000,y:-5000}];const before=structuredClone(g.players);tickParisBattle(g,.02);assert.deepEqual(g.players,before);
});
test('Atlas pairs are nonempty real alpha WebP files and all local references exist',async()=>{
 for(const name of ['paris-fortress-parts1918.webp','paris-fortress-wreck1918.webp','paris-staaken-parts1918.webp','paris-staaken-wreck1918.webp','terrain-paris-night1918.webp','paris-fortress-preview1918.webp','paris-staaken-preview1918.webp']){
  const bytes=await readFile(new URL('../'+name,import.meta.url));assert(bytes.length>10000);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
 for(const [key,layout] of Object.entries(PARIS_ART_LAYOUTS))for(const p of layout.parts){const r=PARIS_PART_CLIPS[key][p.id];assert(r&&r.length===4);assert(p.x>=r[0]&&p.x<=r[0]+r[2]&&p.y>=r[1]&&p.y<=r[1]+r[3]);}
 const encounter=createBossEncounter({id:'p',bossId:'paris-staaken-rvi',tuning:{maxHp:1000,partHp:80,damage:10,bulletSpeed:200,geometryScale:1},x:0,y:0});assert.equal([...encounter.bodies.values()][0].parts.size,11);
});

test('Paris mobile sizing keeps the airframe, mounts and core collision at one scale',()=>{
 for(const pilot of ['baron','fonck'])for(const width of [487,1280]){
  const g=new Game(pilot==='baron'?'fokker':'camel',pilot,()=>.5);g.viewWidth=width;g.update(.001);
  const a=g.stageBoss;a.stages.stageIndex=15;g.region=15;
  a.startBoss({x:0,y:0});const b=a.stages.encounter.bodies.values().next().value;
  assert.equal(b.t.geometryScale,1);assert.equal(b.coreRadius,pilot==='baron'?55:45);
  assert.equal(b.parts.get(pilot==='baron'?'light-nw':'engine-0').radius,pilot==='baron'?51:35);
  assert.equal(b.layout.width,pilot==='baron'?1180:1120);
 }
});
test('Destroying one rack cancels only its own pending city bombs',()=>{
 const g=game(),b=ensureParisBattle(g);for(const [bossId,rackId] of [['b','bomb-bay-left'],['b','bomb-bay-right'],['other','bomb-bay-left']])handleParisCue(g,{type:'city-bomb',bossId,rackId,targetId:'rail',seconds:1,damage:16});
 handleParisCue(g,{type:'city-bomb-rack-abort',sourceBossId:'b',rackId:'bomb-bay-left'});assert.equal(b.bombs.length,2);tickParisBattle(g,2);assert.equal(b.cityDamage,32);
});

test('Paris never caches an undecoded map and rebuilds it after image reload',async()=>{
 const {prepareParisArt,releaseParisArt,paintParis}=await import('../paris-night-art.js');
 const oldImage=globalThis.Image,oldDocument=globalThis.document,images=[],layers=[],draws=[];
 globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=1254;this.naturalHeight=1254;images.push(this);}};
 globalThis.document={createElement(){const layer={getContext:()=>({drawImage(im){layer.source=im;},createLinearGradient:()=>({addColorStop(){}}),fillRect(){}})};layers.push(layer);return layer;}};
 const c={save(){},restore(){},drawImage(layer){draws.push(layer);}};
 try{
  releaseParisArt();const first=prepareParisArt();paintParis(c,game(),0,0,960,700);
  assert.equal(layers.length,0);assert.equal(draws.length,0);
  for(const im of images){im.complete=true;im.onload();}await first;
  paintParis(c,game(),0,0,960,700);assert.equal(layers.length,1);assert.equal(layers[0].source,images[0]);
  const second=prepareParisArt();paintParis(c,game(),0,0,960,700);assert.equal(draws.length,1);
  for(const im of images.slice(5)){im.complete=true;im.onload();}await second;
  paintParis(c,game(),0,0,960,700);assert.equal(layers.length,2);assert.equal(layers[1].source,images[5]);
 }finally{releaseParisArt();if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
});
