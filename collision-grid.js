// Broad phase only. Exact hit tests, enemy order, damage and RNG remain in engine.js?v=imm1
// Buckets contain original indices; complex stage bosses always use the exact path.
// Integer keys avoid allocating "x,y" strings in the projectile hot path.
// The numeric domain is injective and fits 30 bits. Distant cells retain the
// original string key, so long flights and negative coordinates cannot alias.
const CELL_OFFSET=16384,CELL_STRIDE=32768;
const cellKey=(x,y)=>x>=-CELL_OFFSET&&x<CELL_OFFSET&&y>=-CELL_OFFSET&&y<CELL_OFFSET
 ?(x+CELL_OFFSET)*CELL_STRIDE+y+CELL_OFFSET:x+','+y;
const byIndex=(a,b)=>a-b;
export class EnemyCollisionGrid{
 constructor(radiusFor,cellSize=128){
  this.radiusFor=radiusFor;this.cellSize=cellSize;this.cells=new Map();this.bucketPool=[];
  this.global=[];this.indices=[];this.result=[];this.source=null;this.count=0;this.maxRadius=0;
  this.queries=0;this.candidates=0;this.fullCandidates=0;this.fallbacks=0;
  this.usedBuckets=0;this.cached=false;this.cacheHits=0;this.x0=this.x1=this.y0=this.y1=0;
 }
 clear(){
  this.cached=false;this.cells.clear();
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
  const indices=this.indices;
  if(this.cached&&x0===this.x0&&x1===this.x1&&y0===this.y0&&y1===this.y1){this.cacheHits++;}
  else{
   indices.length=0;
   for(const i of this.global)indices.push(i);
   for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
    const bucket=this.cells.get(cellKey(x,y));if(bucket)for(const i of bucket)indices.push(i);
   }
   indices.sort(byIndex);
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
