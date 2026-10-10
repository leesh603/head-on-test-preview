import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.Image??=class{set src(value){this._src=value;queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=gal1&rail=42');
const {CoopGame}=await import('../coop-engine.js?v=gal1&rail=42');
const {BossStages,buildStageRoute}=await import('../headon-stageboss-runtime.js?v=dover1');
const {STAGES}=await import('../headon-stageboss-patterns.js?v=dover1');
const {stageBossCollision}=await import('../stageboss-host.js?v=dover1');
const {prepareDoverAssets,drawDoverBoss,DOVER_ASSETS}=await import('../dover-night-view.js?v=dover1');
const {bossTactic}=await import('../boss-feedback.js?v=dover1');
const {musicContextForGame}=await import('../music-context.js?v=dover1');

test('Dover appears once per route and selects the opposing faction boss',()=>{
 for(const teamFaction of ['central','entente']){
  const s=new BossStages({teamFaction,stageIndex:17,rng:()=>.5});
  assert.equal(s.stage,'dover-night');assert.equal(s.bossId,teamFaction==='central'?'supermarine-nighthawk':'siemens-schuckert-r-viii');
 }
 const order=buildStageRoute(()=>.5);assert.equal(order.length,STAGES.length);assert.equal(new Set(order).size,STAGES.length);assert.equal(order.filter(r=>r===17).length,1);
});

test('Solo and co-op host moving aerial proxies at desktop and mobile scales',()=>{
 for(const coop of [false,true])for(const team of ['central','entente'])for(const width of [390,1280]){
  const pilot=team==='central'?'baron':'fonck',plane=team==='central'?'fokker':'camel';
  const g=coop?new CoopGame([{pilot},{pilot}],{rng:()=>.5}):new Game(plane,pilot,()=>.5);
  g.viewWidth=width;g.viewHeight=844;g.update(.001,{});const a=g.stageBoss;
  a.stages.stageIndex=17;a.stages.orderPosition=a.stages.order.indexOf(17);g.region=17;
  a.startBoss({x:g.x,y:g.y-300});g.invuln=Infinity;for(const p of g.players||[])p.invuln=Infinity;
  g.spawn=Infinity;g.nextBossAt=Infinity;g.nextHeavyAt=Infinity;
  const quiet={inputMode:'gamepad',fireHeld:false};
  for(let i=0;i<300;i++)g.update(.02,coop?{p1:quiet,p2:quiet}:quiet);
  const b=a.stages.encounter.bodies.values().next().value,proxy=g.enemies.find(e=>e.stageBossBody===b);
  assert(proxy);assert.equal(proxy.surface,false);assert.equal(proxy.stationary,false);assert.equal(proxy.x,b.x);assert.equal(proxy.y,b.y);assert.equal(proxy.a,b.a);
  assert(b.layout.width*b.geometryScale<=width*1.03);assert(Number.isFinite(b.x+b.y+b.a));
  const preferred=b.parts.get(team==='central'?'lamp':'drive-inner-left');
  if(preferred.destroyed)assert.equal(stageBossCollision(g,proxy,b.x+preferred.x,b.y+preferred.y,{collisionRadius:1}),false);
  const target=preferred.destroyed?[...b.parts.values()].find(p=>!p.destroyed&&p.hittable):preferred;assert(target);
  assert(stageBossCollision(g,proxy,b.x+target.x,b.y+target.y,{collisionRadius:1}));
  assert(bossTactic(a.stages.encounter,'ko').length);assert(bossTactic(a.stages.encounter,'en').length);
  const before=[b.x,b.y,b.motionTime,a.time];g.state='paused';g.update(.5,{});assert.deepEqual([b.x,b.y,b.motionTime,a.time],before);
  g.state='playing';assert.equal(musicContextForGame(g).theme,'dover-night');
  a.dispose();assert.equal(a.hazards.pool.count,0);
 }
});

test('Dover production art is nonempty WebP with registered alpha sprite pairs',()=>{
 for(const [key,name] of Object.entries(DOVER_ASSETS)){
  const bytes=readFileSync(new URL('../'+name,import.meta.url));assert(bytes.length>10000);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  if(key!=='sea'){assert.equal(bytes.toString('ascii',12,16),'VP8X');assert(bytes[20]&16,'Alpha flag');const size=key==='rotor'?[1254,1254]:key.endsWith('Coast')?[1024,1536]:[1536,1024];assert.equal(1+bytes.readUIntLE(24,3),size[0]);assert.equal(1+bytes.readUIntLE(27,3),size[1]);}
 }
});

test('Warned and active Nighthawk light stays on its moving lamp with a fixed bearing',()=>{
 const g=new Game('fokker','baron',()=>.5);g.viewWidth=960;g.viewHeight=844;g.update(.001,{});
 const a=g.stageBoss;a.stages.stageIndex=17;g.region=17;a.startBoss({x:0,y:-200});
 const b=a.stages.encounter.bodies.values().next().value,frame={players:[{id:'p1',alive:true,x:0,y:250,radius:10}],bounds:{left:-480,right:480,top:-420,bottom:424}};
 const bearings=new Map();let warning=false,active=false;
 for(let i=0;i<105;i++){
  a.tick(.02,frame);a.hazards.pool.visit(h=>{if(h.visual!=='dover-searchlight')return;
   const lamp=b.parts.get('lamp');assert.equal(h.x,b.x+lamp.x);assert.equal(h.y,b.y+lamp.y);
   const key=h.index+':'+h.generation;if(!bearings.has(key))bearings.set(key,h.angle);assert.equal(h.angle,bearings.get(key));warning||=h.phase==='warning';active||=h.phase==='active';
  });
 }
 assert(warning&&active);a.dispose();
});

test('Renderer swaps only the broken component and releases art on map exit',async()=>{
 const original=globalThis.Image,loaded=[];
 globalThis.Image=class{constructor(){this.naturalWidth=1536;this.naturalHeight=1024;loaded.push(this);}set src(v){this._src=v;}};
 try{
  await prepareDoverAssets(-1);const pending=prepareDoverAssets(17);
  for(const im of loaded){if(im._src?.includes('terrain'))im.onerror();else im.onload();}await pending;
  const stages=new BossStages({teamFaction:'central',stageIndex:17});
  const {createBossEncounter}=await import('../headon-stageboss-patterns.js?v=dover1');
  const e=createBossEncounter({id:'render',bossId:stages.bossId,x:0,y:0,tuning:{maxHp:1000,partHp:80,damage:10,bulletSpeed:200,geometryScale:.4}}),b=e.bodies.values().next().value;
  const draws=[],c=new Proxy({globalAlpha:1,drawImage(im){draws.push(im);}}, {get:(obj,key)=>key in obj?obj[key]:()=>{}});
  drawDoverBoss(c,b);assert.equal(draws.filter(im=>im===loaded[1]).length,10);assert.equal(draws.filter(im=>im===loaded[5]).length,6);
  b.hit({partId:'lamp',damage:1e6});draws.length=0;drawDoverBoss(c,b);assert.equal(draws.filter(im=>im===loaded[2]).length,1);
  b.hit({partId:'engine-left',damage:1e6});draws.length=0;drawDoverBoss(c,b);assert.equal(draws.filter(im=>im===loaded[5]).length,3,'only surviving propeller spins');
  await prepareDoverAssets(1);draws.length=0;drawDoverBoss(c,b);assert.equal(draws.length,0);
 }finally{await prepareDoverAssets(-1);globalThis.Image=original;}
});
