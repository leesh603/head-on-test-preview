// Run from a full clone: node --test tests/mobile-perf-20261002.mjs
// CPU-only microbenchmarks: node tests/mobile-perf-20261002.mjs --benchmark
// Baseline is immutable v499. No network, assets, or third-party packages needed.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const current=process.env.HEADON_CURRENT_DIR||root;
const BASE='ce0110523bf5d08f4cfa7467490a649bb6f2cb59';
// war-ambience.js gained moving vehicles, trench skirmishes and an fx-art
// import in 44fa7b75 (ground battlefield life). Its rendering baseline is
// re-pinned there; the other files still compare against the v499 baseline.
const baseFor={'war-ambience.js':'e8e96a13'};
const expected={
 'collision-grid.js':'a5880fad5179f930754e79e9b62e75a682d6eeef',
 'war-ambience.js':'811e536be242a0fe93335432163080b568b19a03',
 'flight-viewport.js':'1173ff0687fbce51a7d102266ee9e252075abea6'
};
// data: modules cannot resolve relative specifiers, so files that grew a
// top-level import compile from source instead; dependencies are injected
// the way runtime importers provide them (fx-art's draw entry is fx()).
const depsFor={'war-ambience.js':{fx:()=>true}};
const load=(file,data)=>{
 const text=data.toString('utf8');
 if(!/^import\b/m.test(text))return import('data:text/javascript;base64,'+data.toString('base64'));
 const deps=depsFor[file]||{},names=Object.keys(deps);
 const code=text.split('\n').filter(line=>!/^import\b/.test(line.trim())).join('\n')
  .replace(/\bexport (function|const|let|class)\b/g,'$1');
 return new Function(...names,code+'\nreturn {drawWarAmbience};')(...names.map(n=>deps[n]));
};
const original={},modified={};
for(const file of Object.keys(expected)){
 const data=process.env.HEADON_BASELINE_DIR?readFileSync(resolve(process.env.HEADON_BASELINE_DIR,file)):execFileSync('git',['show',`${baseFor[file]||BASE}:${file}`],{cwd:root});
 assert.equal(createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'),expected[file],`baseline blob: ${file}`);
 original[file]=await load(file,data);
 modified[file]=await load(file,readFileSync(resolve(current,file)));
}
const OldGrid=original['collision-grid.js'].EnemyCollisionGrid;
const NewGrid=modified['collision-grid.js'].EnemyCollisionGrid;
const oldDraw=original['war-ambience.js'].drawWarAmbience;
const newDraw=modified['war-ambience.js'].drawWarAmbience;
const oldViewport=original['flight-viewport.js'].installFlightViewport;
const newViewport=modified['flight-viewport.js'].installFlightViewport;
const radius=e=>e.radius;
function random(seed=1){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function pair(enemies){const a=new OldGrid(radius),b=new NewGrid(radius);a.build(enemies);b.build(enemies);return[a,b]}
function same(a,b,bullet,enemies){const x=a.query(bullet,enemies),y=b.query(bullet,enemies);assert.equal(x.length,y.length);for(let i=0;i<x.length;i++)assert.equal(x[i],y[i]);}
function context(record=false){
 const log=[],out={globalAlpha:1};
 const methods=['save','restore','beginPath','arc','fill','stroke','fillRect','moveTo','quadraticCurveTo','drawImage',
  'translate','rotate','scale','setTransform','lineTo','closePath','ellipse','rect','strokeRect','clearRect','fillText'];
 for(const method of methods)out[method]=(...args)=>{if(record)log.push([method,...args.map(v=>v&&typeof v==='object'?'canvas':v)])};
 // Canvas calls beyond the list stay silent no-ops; the recorded stream only
 // needs the listed ones. Property reads/writes pass through to `out`.
 const c=new Proxy(out,{get(t,p){return p in t?t[p]:()=>{}},
  set(t,p,v){if(record)log.push([p,v]);t[p]=v;return true}});
 return {c,log};
}
globalThis.document={createElement(){const {c}=context();c.createRadialGradient=()=>({addColorStop(){}});return{getContext:()=>c}}};
function environment(dvh=false,raf=true){
 const listeners=()=>{const m=new Map();return{addEventListener(k,f){if(!m.has(k))m.set(k,[]);m.get(k).push(f)},emit(k,e={}){for(const f of m.get(k)||[])f(e)}}};
 const styles=new Map(),writes=[],queue=new Map(),scrolls=[];let nextId=0;
 const doc=Object.assign(listeners(),{documentElement:{style:{setProperty(k,v){styles.set(k,v);writes.push(['set',k,v])},removeProperty(k){styles.delete(k);writes.push(['remove',k])}},requestFullscreen(){return Promise.resolve()}}});
 const win=Object.assign(listeners(),{innerHeight:800,scrollY:153,CSS:{supports:()=>dvh},visualViewport:Object.assign(listeners(),{height:780,scale:1}),matchMedia:()=>({matches:false}),scrollTo:v=>scrolls.push(v)});
 if(raf){win.requestAnimationFrame=f=>{const id=nextId++;queue.set(id,f);return id};win.cancelAnimationFrame=id=>queue.delete(id)}
 const flush=()=>{const callbacks=[...queue.values()];queue.clear();for(const f of callbacks)f()};
 return{doc,win,styles,writes,queue,scrolls,flush};
}
function benchmark(){
 const rng=random(91),enemies=Array.from({length:120},(_,i)=>({x:(rng()-.5)*1600,y:(rng()-.5)*1600,radius:12+rng()*24,stageBossBody:i===0}));
 const spread=Array.from({length:360},()=>({x:(rng()-.5)*1600,y:(rng()-.5)*1600,collisionRadius:2}));
 const volleys=Array.from({length:360},(_,i)=>({x:(Math.floor(i/6)%30-15)*24,y:Math.floor(i/180)*240,collisionRadius:2}));
 const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
 function gridRun(Type,bullets,frames){const g=new Type(radius);let checksum=0;const t=performance.now();for(let f=0;f<frames;f++){g.build(enemies);for(const b of bullets)checksum+=g.query(b).length}return{ms:performance.now()-t,checksum,cacheHits:g.stats().cacheHits||0}}
 function measure(fnA,fnB){for(let i=0;i<4;i++){fnA();fnB()}const a=[],b=[];for(let i=0;i<9;i++){if(i%2){b.push(fnB());a.push(fnA())}else{a.push(fnA());b.push(fnB())}}const before=median(a),after=median(b);return{beforeMs:+before.toFixed(3),afterMs:+after.toFixed(3),reductionPercent:+((1-after/before)*100).toFixed(1)}}
 const result={environment:{node:process.version,kind:'CPU microbenchmark; not phone FPS, GPU time, temperature or battery measurement'},grid:{}};
 for(const[name,bullets]of[['spread',spread],['volleys',volleys]]){
  const old=gridRun(OldGrid,bullets,1),now=gridRun(NewGrid,bullets,1);assert.equal(old.checksum,now.checksum);
  result.grid[name]={enemies:120,projectilesPerFrame:360,framesPerSample:200,...measure(()=>gridRun(OldGrid,bullets,200).ms,()=>gridRun(NewGrid,bullets,200).ms),cachedQueriesPerFrame:now.cacheHits};
 }
 const {c}=context();
 const drawRun=draw=>{const t=performance.now();for(let i=0;i<10000;i++)draw(c,3,1200+i*.35,600+i*.1,390,844,i/60);return performance.now()-t};
 result.ambience={framesPerSample:10000,region:3,canvas:'no-op drawing context; JS computation only',...measure(()=>drawRun(oldDraw),()=>drawRun(newDraw))};
 const countSin=draw=>{const sin=Math.sin;let count=0;Math.sin=(...args)=>{count++;return sin(...args)};try{for(let i=0;i<600;i++)draw(c,3,1700+i*.2,600+i*.1,390,844,i/60)}finally{Math.sin=sin}return count};
 result.ambience.sinCalls600Frames={before:countSin(oldDraw),after:countSin(newDraw)};
 const burst=install=>{const e=environment();const v=install(e.doc,e.win);v.lock();e.writes.length=0;for(let i=0;i<100;i++){e.win.visualViewport.height=700+i/10;e.win.visualViewport.emit('resize');e.win.visualViewport.emit('scroll')}const queued=e.queue.size;e.flush();return{queuedCallbacks:queued,styleWrites:e.writes.length}};
 result.viewport200Events={before:burst(oldViewport),after:burst(newViewport)};
 console.log(JSON.stringify(result,null,2));
}
if(process.argv.includes('--benchmark'))benchmark();
else{
 test('20,000 seeded broad-phase comparisons retain identical enemy identities and order',()=>{
  const rng=random(182);let count=0;
  for(let scene=0;scene<200;scene++){
   const enemies=Array.from({length:16+Math.floor(rng()*150)},(_,i)=>({x:(rng()-.5)*10000,y:(rng()-.5)*10000,radius:8+rng()*80,stageBossBody:i%47===0,hullLength:i%19===0?180:0,hullWidth:70}));
   if(scene%4===0)enemies[3]=null;
   const[a,b]=pair(enemies);
   for(let j=0;j<100;j++){const bullet={x:(rng()-.5)*10000,y:(rng()-.5)*10000,collisionRadius:j%5?3:80,actualExplosion:j%9===0,explosionRadius:400};same(a,b,bullet,enemies);count++}
  }
  assert.equal(count,20000);
 });
 test('numeric-key boundaries and distant negative/positive cells never alias',()=>{
  const cells=[-16386,-16385,-16384,-16383,-1,0,1,16382,16383,16384,16385,1000000,-1000000];
  const enemies=cells.flatMap(x=>cells.map(y=>({x:x*128+64,y:y*128+64,radius:0})));
  const[a,b]=pair(enemies);for(const e of enemies){same(a,b,e,enemies);assert.deepEqual(b.query(e),[e])}
 });
 test('last rectangle cache preserves replacements, borrowed-result mutation and rebuilds',()=>{
  const enemies=Array.from({length:30},(_,i)=>({x:i,y:i,radius:3}));const[a,b]=pair(enemies),bullet={x:20,y:20,collisionRadius:1};
  same(a,b,bullet,enemies);same(a,b,bullet,enemies);assert.equal(b.stats().cacheHits,1);
  enemies[2]={x:2,y:2,radius:3,replaced:true};b.result.length=0;same(a,b,bullet,enemies);
  b.clear();a.clear();a.build(enemies);b.build(enemies);same(a,b,bullet,enemies);
  enemies.pop();same(a,b,bullet,enemies);
  const other=[...enemies];same(a,b,bullet,other);
 });
 test('small populations, complex bosses, invalid radii and large explosions retain fallback behavior',()=>{
  for(const n of [0,1,15,16,30]){
   const enemies=Array.from({length:n},(_,i)=>({x:i*100,y:i*90,radius:i===2?NaN:20,stageBossBody:i===1}));
   if(n>3)enemies[3].x=Infinity;
   const[a,b]=pair(enemies);
   for(const bullet of [{x:0,y:0},{x:NaN,y:0},{x:0,y:Infinity},{x:0,y:0,actualExplosion:true},{x:0,y:0,actualExplosion:true,explosionRadius:100000}])same(a,b,bullet,enemies);
  }
 });
 test('unsafe huge coordinates return full candidates instead of a non-advancing loop',()=>{
  const e=Array.from({length:16},()=>({x:0,y:0,radius:5}));const g=new NewGrid(radius);g.build(e);assert.equal(g.query({x:1e30,y:0}),e);assert.equal(g.query({x:0,y:-1e30}),e);
 });
 test('bucket retention shrinks after a crowded frame and clear drops enemy references',()=>{
  const g=new NewGrid(radius);g.build(Array.from({length:1500},(_,i)=>({x:i*150,y:0,radius:1})));g.build(Array.from({length:16},(_,i)=>({x:i,y:0,radius:1})));assert.ok(g.bucketPool.length<=512);g.clear();assert.equal(g.source,null);assert.equal(g.result.length,0);assert.equal(g.cells.size,0);assert.equal(g.cached,false);
 });
 test('1,800 ambience frames retain exactly the same Canvas commands and values across all 12 regions',()=>{
  let frames=0;
  for(let region=0;region<12;region++)for(const[W,H]of [[390,844],[844,390],[1280,720]])for(let i=0;i<50;i++){
   const cx=(i-25)*347.13,cy=(i%7-3)*561.3,t=i*7.17;
   const a=context(true),b=context(true);oldDraw(a.c,region,cx,cy,W,H,t);newDraw(b.c,region,cx,cy,W,H,t);assert.deepEqual(b.log,a.log);frames++;
  }
  assert.equal(frames,1800);
 });
 test('ambience cache preserves moving phases, region changes and viewport-range boundaries',()=>{
  for(let i=0;i<600;i++){
   const region=i<300?3:11,cx=419.9+i*.02,cy=-340+i*.03;const a=context(true),b=context(true);oldDraw(a.c,region,cx,cy,390,844,i/60);newDraw(b.c,region,cx,cy,390,844,i/60);assert.deepEqual(b.log,a.log);
  }
 });
 test('viewport bursts schedule one callback, write one latest height, and ignore unchanged height',()=>{
  const e=environment(),v=newViewport(e.doc,e.win);v.lock();e.writes.length=0;
  for(let i=0;i<100;i++){e.win.visualViewport.height=600+i;e.win.visualViewport.emit('resize');e.win.visualViewport.emit('scroll')}
  assert.equal(e.queue.size,1);e.flush();assert.equal(e.writes.length,1);assert.equal(e.styles.get('--flight-height'),'699px');
  e.win.emit('resize');e.flush();assert.equal(e.writes.length,1);
 });
 test('unlock cancels pending work, leaves hangar events idle, and restores scroll',()=>{
  const e=environment(),v=newViewport(e.doc,e.win);v.lock();e.win.emit('resize');assert.equal(e.queue.size,1);v.unlock();assert.equal(e.queue.size,0);assert.equal(e.styles.has('--flight-height'),false);assert.equal(e.scrolls.at(-1).top,153);
  for(let i=0;i<100;i++)e.win.emit('resize');assert.equal(e.queue.size,0);v.lock();assert.equal(e.styles.get('--flight-height'),'780px');
 });
 test('pinch, dvh, orientation and no-rAF fallback retain viewport behavior',()=>{
  const e=environment(),v=newViewport(e.doc,e.win);v.lock();e.writes.length=0;e.win.visualViewport.scale=2;e.win.visualViewport.height=600;e.win.emit('resize');e.flush();assert.equal(e.writes.length,0);e.win.visualViewport.scale=1;e.win.emit('orientationchange');e.flush();assert.equal(e.styles.get('--flight-height'),'600px');
  const d=environment(true),dv=newViewport(d.doc,d.win);dv.lock();d.writes.length=0;for(let i=0;i<50;i++)d.win.emit('resize');d.flush();assert.equal(d.writes.length,0);
  const n=environment(false,false),nv=newViewport(n.doc,n.win);nv.lock();n.win.visualViewport.height=640;n.win.emit('resize');assert.equal(n.styles.get('--flight-height'),'640px');
 });
 test('touch prevention remains sortie-only and leaves one-finger dialog scrolling usable',()=>{
  const e=environment(),v=newViewport(e.doc,e.win);let prevented=0;
  const event=(dialog,fingers)=>({cancelable:true,target:{closest:()=>dialog?{}:null},touches:Array(fingers),preventDefault(){prevented++}});
  e.doc.emit('touchmove',event(false,1));assert.equal(prevented,0);v.lock();e.doc.emit('touchmove',event(false,1));assert.equal(prevented,1);e.doc.emit('touchmove',event(true,1));assert.equal(prevented,1);e.doc.emit('touchmove',event(true,2));assert.equal(prevented,2);v.unlock();e.doc.emit('gesturechange',event(false,2));assert.equal(prevented,2);
 });
}
