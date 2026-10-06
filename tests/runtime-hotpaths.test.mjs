import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
const BASE='636f45bd35cfce2d383d5d4102dd9f76ed1caac5';
const before=file=>execFileSync('git',['show',`${BASE}:${file}`],{encoding:'utf8'});
const after=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const context=c=>vm.createContext(c);
const plain=x=>JSON.parse(JSON.stringify(x));
function cloud(source){
 const c=context({roleArtReady:new Promise(()=>{}),roleReady:()=>false,roleImage:()=>null,fxsHas:()=>false,fxsImage:()=>null});
 vm.runInContext(source.replace(/^import .*$/gm,'').replaceAll('export ','')+'\nthis.install=installCloudCover;',c);
 class World{enemyCombatTarget(){return this.contact||this}update(){}}
 c.install(World);let seed=3;const g=new World();Object.assign(g,{x:20,y:30,a:.4,hp:80,maxHp:100,pilot:'nungesser',cloudConceal:.8,t:10,rng:()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32)});
 for(let i=0;i<500;i++)g['field'+i]=i;return{g,seed:()=>seed};
}
test('cloud aim keeps target reads, coordinates, thresholds and RNG without cloning world fields',()=>{
 const a=cloud(before('cloud-cover1.js')),b=cloud(after('cloud-cover1.js'));
 for(const type of ['scout','boss','bomber'])for(const flag of ['ace','elite','formationLeader','ordinary']){
  const ea={type,[flag]:true},eb={...ea};
  for(const conceal of [0,.7,.9,1.1,1.3,1.7,2.1,1,.3,0]){
   for(const s of [a,b]){s.g.cloudConceal=conceal;s.g.t+=.2;s.g.x+=3;s.g.y-=2}
   const ca=a.g.enemyCombatTarget(ea),cb=b.g.enemyCombatTarget(eb);
   for(const key of Object.keys(ca))assert.equal(cb[key],typeof ca[key]==='function'?b.g[key]:ca[key],key);
   assert.deepEqual(plain(ea),plain(eb));assert.equal(a.seed(),b.seed());
  }
 }
 const oldX=b.g.x;b.g.cloudConceal=.8;const c=b.g.enemyCombatTarget({type:'scout'});assert.deepEqual(Object.keys(c),['x','y']);c.x=0;assert.equal(b.g.x,oldX);
});
function drawing(){
 const log=[];let reads=0,created=0;
 const canvas=()=>{const cv={id:'canvas'+created++,width:8,height:8};
  const raw={getImageData:()=>{reads++;const d=new Uint8ClampedArray(cv.width*cv.height*4);for(let i=3;i<d.length;i+=4)d[i]=i%7?255:0;return{data:d}},createRadialGradient:()=>({addColorStop(){}})};
  for(const k of ['save','restore','translate','rotate','drawImage','fillRect','beginPath','ellipse','arc','stroke','fill','moveTo','lineTo'])raw[k]=(...v)=>log.push([k,...v.map(x=>typeof x==='object'?x.id||'image':x)]);
  const ctx=new Proxy(raw,{set(o,k,v){log.push(['set',k,v]);o[k]=v;return true}});cv.getContext=()=>ctx;return cv;
 };
 return{log,canvas,reads:()=>reads,created:()=>created};
}
function damage(source){
 const d=drawing(),c=context({document:{createElement:d.canvas},damageDecals:[{id:'decal',width:5,height:7}],damageCache:new Map(),damageOpaque:new WeakMap()});
 vm.runInContext(source.slice(source.indexOf('function damageSeed('),source.indexOf('export const aircraftReady=')),c);
 return{...d,c,base:{id:'base',width:12,height:14},draw(key,stage){return c.damagedSprite(this.base,key,stage)}};
}
test('all five damage stages preserve exact draw commands with one silhouette readback',()=>{
 const a=damage(before('aircraft.js')),b=damage(after('aircraft.js'));
 for(let stage=1;stage<=5;stage++){a.draw('camel#stage'+stage,stage);b.draw('camel#stage'+stage,stage)}
 assert.deepEqual(b.log,a.log);assert.equal(a.reads(),5);assert.equal(b.reads(),1);
 b.base={id:'new',width:14,height:18};b.draw('new',1);assert.equal(b.reads(),2);
});
test('late aircraft loads retain unrelated sprites; replacement invalidates all its damage variants',()=>{
 const source=after('aircraft.js'),c=context({painted:new Map(),cache:new Map(),shadows:new Map(),flashes:new Map(),damageCache:new Map()});
 vm.runInContext(source.slice(source.indexOf('function setPainted('),source.indexOf('// Load the detailed')),c);
 const a={},b={};c.painted.set('a',a);c.painted.set('b',b);c.cache.set('a',a);c.cache.set('aliasA',a);c.cache.set('b',b);
 for(const m of [c.shadows,c.flashes,c.damageCache]){m.set('a',{});m.set('b',{})}c.damageCache.set('a#stage2',{});c.flashes.set('a#d2',{});
 c.setPainted('c',{});assert.equal(c.cache.get('a'),a);assert.equal(c.cache.get('b'),b);
 c.setPainted('a',{});assert(!c.cache.has('a'));assert(!c.cache.has('aliasA'));assert.equal(c.cache.get('b'),b);assert(!c.damageCache.has('a#stage2'));assert(!c.flashes.has('a#d2'));
});
function effects(source){
 const d=drawing(),c=context({document:{createElement:d.canvas},URL,URLSearchParams});
 vm.runInContext(source.replaceAll('export ','').replaceAll('import.meta.url',JSON.stringify('file:///fx-sample-preview.js')),c);
 vm.runInContext("BOOM.atlas={id:'atlas'};BOOM.rects={};for(const f of Object.keys(BOOM_TIME))for(let i=0;i<20;i++)BOOM.rects[f+i]=[i,0,8,8];boomSprites();atlas={id:'atlas'};rects.set('spark',[0,0,8,8]);",c);
 const ctx=d.canvas().getContext('2d');d.log.length=0;return{...d,c,draw:(r,t)=>c.drawBoom(ctx,r,100,200,t)};
}
test('four explosion families preserve every canvas command across their full lifetimes',()=>{
 const a=effects(before('fx-sample-preview.js')),b=effects(after('fx-sample-preview.js'));
 for(const fam of ['hit','air','ground','heavy']){
  const ra={fam,wx:13.7,wy:-93.2,d:170,rot:.3},rb={...ra};
  for(let frame=0;frame<150;frame++){a.log.length=b.log.length=0;a.draw(ra,frame/60);b.draw(rb,frame/60);assert.deepEqual(b.log,a.log,`${fam} frame ${frame}`)}
 }
});
test('tint churn retains frequently used canvases and stays bounded at 48 entries',()=>{
 const x=effects(after('fx-sample-preview.js')),hot=x.c.fxsTintedCanvas('spark','hot');
 for(let i=0;i<180;i++){assert.equal(x.c.fxsTintedCanvas('spark','hot'),hot);x.c.fxsTintedCanvas('spark','color'+i)}
 assert.equal(vm.runInContext('tintCache.size',x.c),48);
});
test('the final HUD entry throttles the whole wrapper chain, including special ammo labels',()=>{
 const source=after('app.js'),start=source.indexOf('hud=()=>{if(!game||performance.now()-hudAt<90)return;'),end=source.indexOf('\n',start);
 let calls=0;const c=context({hud:()=>{},game:{plane:'fokker',weapon:{guns:2}},plane:'fokker',hudAt:-Infinity,now:0,performance:{now:()=>c.now},hudWithDynamicLocale:()=>{calls++;c.hudAt=c.now},localizedEquippedWeapon:()=>'',__attr(){},__txt(){},$:()=>({})});
 vm.runInContext(source.slice(start,end),c);for(let i=0;i<600;i++){c.now=i*1000/60;c.hud()}assert.equal(calls,100);
});
if(process.argv.includes('--benchmark')){
 const run=(g,n)=>{const e={type:'scout',_jit:.7};let checksum=0;const t=performance.now();for(let i=0;i<n;i++){g.t=i/60;const c=g.enemyCombatTarget(e);checksum+=c.x+c.y+c.hp}return{ms:performance.now()-t,checksum}};
 const a=cloud(before('cloud-cover1.js')),b=cloud(after('cloud-cover1.js'));run(a.g,5000);run(b.g,5000);
 const old=run(a.g,50000),now=run(b.g,50000);assert.equal(now.checksum,old.checksum);console.log('Cloud partial-concealment CPU, 50k queries:',{beforeMs:old.ms,afterMs:now.ms});
}
