// Broad phase only. Exact hit tests, enemy order, damage and RNG remain in engine.js?v=bomb19
// Buckets contain original indices; complex stage bosses always use the exact path.
// Integer keys avoid allocating "x,y" strings in the projectile hot path.
// The numeric domain is injective and fits 30 bits. Distant cells retain the
// original string key, so long flights and negative coordinates cannot alias.
const CELL_OFFSET=16384,CELL_STRIDE=32768;
const cellKey=(x,y)=>x>=-CELL_OFFSET&&x<CELL_OFFSET&&y>=-CELL_OFFSET&&y<CELL_OFFSET
 ?(x+CELL_OFFSET)*CELL_STRIDE+y+CELL_OFFSET:x+','+y;
const byIndex=(a,b)=>a-b;
const QUERY_CACHE_LIMIT=64;
// Four cell bounds fit exactly in 46 bits in the common coordinate domain.
// The span is at most 256 cells (query's existing safety limit).
const queryKey=(x0,x1,y0,y1)=>x0>=-CELL_OFFSET&&x0<CELL_OFFSET&&y0>=-CELL_OFFSET&&y0<CELL_OFFSET
 ?cellKey(x0,y0)*65536+(x1-x0)*256+y1-y0:x0+','+x1+','+y0+','+y1;
export class EnemyCollisionGrid{
 constructor(radiusFor,cellSize=128){
  this.radiusFor=radiusFor;this.cellSize=cellSize;this.cells=new Map();this.bucketPool=[];
  this.global=[];this.indices=[];this.result=[];this.source=null;this.count=0;this.maxRadius=0;
  this.scratchIndices=this.indices;this.queryCache=new Map();this.queryPool=[];this.usedQueries=0;
  this.queryMisses=0;this.queryReuse=0;this.queryCacheEnabled=true;
  this.queries=0;this.candidates=0;this.fullCandidates=0;this.fallbacks=0;
  this.usedBuckets=0;this.cached=false;this.cacheHits=0;this.x0=this.x1=this.y0=this.y1=0;
 }
 clear(){
  this.cached=false;this.cells.clear();
  this.queryCache.clear();
  for(let i=0;i<this.usedQueries;i++)this.queryPool[i].length=0;
  this.usedQueries=0;this.indices=this.scratchIndices;
  this.queryMisses=0;this.queryReuse=0;this.queryCacheEnabled=true;
  for(let i=0;i<this.usedBuckets;i++)this.bucketPool[i].length=0;
  this.usedBuckets=0;
  this.global.length=this.indices.length=this.result.length=0;this.source=null;this.count=0;
 }
 build(enemies){
  this.clear();this.source=enemies;this.count=enemies.length;this.maxRadius=0;let used=0;
  for(let i=0;i<enemies.length;i++){
   const e=enemies[i];if(!e)continue;
   const radius=e.hullLength?Math.max(Math.abs(e.hullLength),Math.abs(e.hullWidth)):this.radiusFor(e);
   if(e.stageBossBody||!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(radius)||radius>256){this.global.push(i);continue;}
   this.maxRadius=Math.max(this.maxRadius,Math.max(0,radius));
   const key=cellKey(Math.floor(e.x/this.cellSize),Math.floor(e.y/this.cellSize));
   let bucket=this.cells.get(key);
   if(!bucket){bucket=this.bucketPool[used]||(this.bucketPool[used]=[]);used++;this.cells.set(key,bucket);}
   bucket.push(i);
  }
  this.usedBuckets=used;
  // Do not retain unbounded bucket arrays after exceptionally crowded scenes.
  if(this.bucketPool.length>Math.max(512,used))this.bucketPool.length=Math.max(512,used);
 }
 query(b,enemies=this.source){
  this.queries++;this.fullCandidates+=enemies.length;
  if(enemies!==this.source||enemies.length!==this.count||enemies.length<16){return this.full(enemies);}
  const padding=b.actualExplosion?Math.abs(b.explosionRadius):Math.abs(b.collisionRadius||0);
  const r=this.maxRadius+padding;
  if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(r))return this.full(enemies);
  const x0=Math.floor((b.x-r)/this.cellSize),x1=Math.floor((b.x+r)/this.cellSize);
  const y0=Math.floor((b.y-r)/this.cellSize),y1=Math.floor((b.y+r)/this.cellSize);
  // Unsafe integer cell coordinates can otherwise make x++ / y++ stop advancing.
  if(!Number.isSafeInteger(x0)||!Number.isSafeInteger(x1)||!Number.isSafeInteger(y0)||!Number.isSafeInteger(y1)||(x1-x0+1)*(y1-y0+1)>256)return this.full(enemies);
  let indices=this.indices;
  if(this.cached&&x0===this.x0&&x1===this.x1&&y0===this.y0&&y1===this.y1){this.cacheHits++;}
  else{
   const key=this.queryCacheEnabled?queryKey(x0,x1,y0,y1):null,saved=this.queryCacheEnabled&&this.queryCache.get(key);
   if(saved){indices=saved;this.cacheHits++;this.queryReuse++;}
   else{
    // Sparse one-off queries cannot repay cache bookkeeping. Fall back to the
    // original scratch path for the rest of this build when reuse is low.
    if(this.queryCacheEnabled&&++this.queryMisses>=32&&this.queryReuse*4<this.queryMisses)this.queryCacheEnabled=false;
    const slot=this.usedQueries,retain=this.queryCacheEnabled&&slot<QUERY_CACHE_LIMIT;
    indices=retain?(this.queryPool[slot]??=[]):this.scratchIndices;
    indices.length=0;
    for(const i of this.global)indices.push(i);
    for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
     const bucket=this.cells.get(cellKey(x,y));if(bucket)for(const i of bucket)indices.push(i);
    }
    indices.sort(byIndex);
    if(retain){this.queryCache.set(key,indices);this.usedQueries++;}
   }
   this.indices=indices;
   this.x0=x0;this.x1=x1;this.y0=y0;this.y1=y1;this.cached=true;
  }
  // Cache indices, not enemy objects: preserve source replacements and rebuild
  // the borrowed output even when a caller modified its previous result.
  const out=this.result;out.length=0;
  for(const i of indices)out.push(enemies[i]);this.candidates+=out.length;return out;
 }
 full(enemies){this.cached=false;this.fallbacks++;this.candidates+=enemies.length;return enemies;}
 stats(){return {queries:this.queries,candidates:this.candidates,fullCandidates:this.fullCandidates,
  fallbacks:this.fallbacks,buckets:this.cells.size,retainedBuckets:this.bucketPool.length,cacheHits:this.cacheHits};}
}
