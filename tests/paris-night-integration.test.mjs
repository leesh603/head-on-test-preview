import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game} from '../engine.js';
import {ensureParisBattle,handleParisCue,tickParisBattle,parisStatus} from '../paris-night-battle.js';
import {BossStages} from '../headon-stageboss-runtime.js';
import {createBossEncounter} from '../headon-stageboss-patterns.js';
import {PARIS_ART_LAYOUTS,PARIS_PART_CLIPS} from '../paris-night-atlas.js';
import {bossTactic} from '../boss-feedback.js';
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
  const scale=pilot==='baron'?1:.56;
  assert.equal(b.t.geometryScale,scale);assert.equal(b.coreRadius,(pilot==='baron'?55:45)*scale);
  const target=b.parts.get(pilot==='baron'?'light-nw':'engine-0');
  assert.equal(target.radius,(pilot==='baron'?51:35)*scale);
  assert.equal(b.layout.width*scale,pilot==='baron'?1180:627.2);
  if(pilot==='fonck'){
   b.a=-Math.PI/2;b.rotateMounts();
   assert.equal(b.locateHit({x:b.x+target.x,y:b.y+target.y,radius:4}).partId,'engine-0');
   assert.equal(b.locateHit({x:b.x-279,y:b.y-142,radius:4}),null,'Old oversized engine position is no longer hittable');
  }
 }
});

test('Fortress HUD separates its final battery defense from a quiet blackout',()=>{
 const g=game(),b=ensureParisBattle(g);b.role='attack';
 g.stageBoss.stages.encounter.bossId='paris-searchlight-fortress';
 const gun={kind:'gun',destroyed:false},body={kind:'paris-searchlight-fortress',phase:'last-stand',coreVulnerable:true,parts:new Map([['aa-left',gun]])};
 g.stageBoss.stages.encounter.bodies.set('b',body);
 assert.equal(parisStatus(g),'탐조등 제압 · 잔여 포대 회피 · 지휘부 공격');
 assert.equal(bossTactic(g.stageBoss.stages.encounter),'포격 예고와 기관총 사격 회피 · 남은 포대부터 제압');
 gun.destroyed=true;assert.equal(parisStatus(g),'포대 제압 · 지휘부 공격');
 assert.equal(bossTactic(g.stageBoss.stages.encounter),'방공 무장 제압 · 노출된 지휘부를 공격하세요');
 body.phase='cooldown';assert.equal(parisStatus(g),'소등 · 지휘부 공격');
});
test('Destroying one rack cancels only its own pending city bombs',()=>{
 const g=game(),b=ensureParisBattle(g);for(const [bossId,rackId] of [['b','bomb-bay-left'],['b','bomb-bay-right'],['other','bomb-bay-left']])handleParisCue(g,{type:'city-bomb',bossId,rackId,targetId:'rail',seconds:1,damage:16});
 handleParisCue(g,{type:'city-bomb-rack-abort',sourceBossId:'b',rackId:'bomb-bay-left'});assert.equal(b.bombs.length,2);tickParisBattle(g,2);assert.equal(b.cityDamage,32);
});

test('Paris waits for decoded city art and uses fresh pixels after image reload',async()=>{
 const {prepareParisArt,releaseParisArt,paintParis}=await import('../paris-night-art.js');
 const oldImage=globalThis.Image,images=[],draws=[];
 globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=2048;this.naturalHeight=2048;images.push(this);}};
 const c={save(){},restore(){},fillRect(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},drawImage(im){draws.push(im);}};
 try{
  releaseParisArt();const first=prepareParisArt();paintParis(c,game(),0,0,960,700);
  assert.equal(draws.length,0);
  for(const im of images){im.complete=true;im.onload();}await first;
  paintParis(c,game(),0,0,960,700);assert.equal(draws.length,1);assert.equal(draws[0],images[0]);
  const second=prepareParisArt();paintParis(c,game(),0,0,960,700);assert.equal(draws.length,1);
  for(const im of images.slice(5)){im.complete=true;im.onload();}await second;
  paintParis(c,game(),0,0,960,700);assert.equal(draws.length,2);assert.equal(draws[1],images[5]);
 }finally{releaseParisArt();if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;}
});
test('Paris remains urban across the old boundary and distant positive/negative city edges',async()=>{
 const {prepareParisArt,releaseParisArt,paintParis}=await import('../paris-night-art.js');
 const {PARIS_SIZE}=await import('../paris-night-battle.js');
 const oldImage=globalThis.Image,images=[];
 globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1254;this.naturalHeight=1254;images.push(this);}};
 const pending=prepareParisArt();for(const im of images)im.onload();await pending;
 const g=game(),b=ensureParisBattle(g),original=structuredClone(b.districts);
 try{
  for(const [w,h] of [[1280,900],[390,844]])for(const [cx,cy] of [[0,-460],[-1200,0],[1800,300],[-2051,0],[2045,2339],[0,-1757],[0,2339],[7200,-4800],[-24576,24576]]){
   const rectangles=[],stack=[];let t={x:0,y:0,sx:1,sy:1};
   const c={save(){stack.push({...t});},restore(){t=stack.pop();},fillRect(){},beginPath(){},rect(){},clip(){},
    translate(x,y){t.x+=x*t.sx;t.y+=y*t.sy;},scale(x,y){t.sx*=x;t.sy*=y;},
    drawImage(im,sx,sy,sw,sh,x,y,width,height){assert.equal(im,images[0]);assert.equal(sx,27);assert.equal(sy,25);assert.equal(sw,1200);assert.equal(sh,1204);const x1=t.x+x*t.sx,y1=t.y+y*t.sy,x2=x1+width*t.sx,y2=y1+height*t.sy;rectangles.push([Math.min(x1,x2),Math.min(y1,y2),Math.max(x1,x2),Math.max(y1,y2)]);}};
   paintParis(c,g,cx,cy,w,h,{draw(){assert.fail('Paris must never expose rural terrain');}});
   for(let x=0;x<=w;x+=w/8)for(let y=0;y<=h;y+=h/8)assert(rectangles.some(r=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]),'Unpainted city pixel at '+[cx,cy,x,y]);
   assert(rectangles.length<=4,'Only visible city sections are drawn');
  }
  assert.equal(PARIS_SIZE,4096);assert.deepEqual(b.districts,original,'Bombing objectives keep their existing world positions');
 }finally{releaseParisArt();if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;}
});
