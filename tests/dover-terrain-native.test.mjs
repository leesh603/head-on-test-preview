import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {doverPatrolChart,doverPatrolSpawn,doverHullMargin} from '../dover-patrol-chart.js?v=dover3';
import {doverCoastPoint,paintDoverTerrain} from '../dover-terrain-render.js?v=dover6';

function trace(){
 const draws=[],transforms=[],layers=[];
 const c=new Proxy({globalAlpha:1,drawImage(...args){draws.push(args)},transform(...args){transforms.push(args)}},{get:(o,k)=>k in o?o[k]:()=>{}});
 return {c,draws,transforms,layers,renderer:{draw(_c,s){layers.push(s)}}};
}
const coast={naturalWidth:887,naturalHeight:1774};

test('Open Dover water uses its original detailed sea material without a giant landscape or offscreen coast draws',()=>{
 const chart=doverPatrolChart({x:0,y:0}),v=.5,a=doverCoastPoint(chart,v,-1),b=doverCoastPoint(chart,v,1),t=trace();
 paintDoverTerrain(t.c,chart,(a.x+b.x)/2,a.y,390,844,coast,t.renderer);
 assert.deepEqual(t.layers.map(x=>x.key),['sea']);assert.equal(t.draws.length,0);
});

test('Both visible shores use original ground materials and bounded native-density texture meshes on PC and mobile',()=>{
 const chart=doverPatrolChart({x:0,y:0});
 for(const w of [390,1280])for(const side of [-1,1]){
  const p=doverCoastPoint(chart,.3,side),t=trace();paintDoverTerrain(t.c,chart,p.x-side*170,p.y,w,844,coast,t.renderer);
  assert.deepEqual(t.layers.map(x=>x.key),['sea','rural']);assert(t.draws.length>0&&t.draws.length<170);
  assert(t.transforms.flat().every(Number.isFinite));
  const scales=t.transforms.map(([a,b,c,d])=>Math.max(Math.hypot(a,b),Math.hypot(c,d))).sort((a,b)=>a-b);
  assert(scales[Math.floor(scales.length/2)]<1,'the authored cliff pixels are reduced, not enlarged six times');
  assert.equal(t.draws.length,t.transforms.length);
 }
});

test('Camera movement preserves the same world-anchored coast texture through segment and material joins',()=>{
 const chart=doverPatrolChart({x:0,y:0});
 for(const side of [-1,1])for(const row of [.11,.3,.61,.87]){
  const p=doverCoastPoint(chart,row,side),frames=[];
  for(const [dx,dy] of [[0,0],[7,45],[7,450]]){
   const t=trace(),cx=p.x-side*170+dx,cy=p.y+dy;paintDoverTerrain(t.c,chart,cx,cy,1280,800,coast,t.renderer);
   const vertices=new Map();
   for(let i=0;i<t.transforms.length;i++){
    const m=t.transforms[i],world=[...m.slice(0,4),m[4]+cx-640,m[5]+cy-400].map(x=>Math.round(x*1e6)/1e6);
    vertices.set(JSON.stringify(world),[t.draws[i][6],t.draws[i][8]]);
   }
   frames.push(vertices);
  }
  for(const frame of frames.slice(1)){
   let overlap=0;
   for(const [world,source] of frames[0])if(frame.has(world)){assert.deepEqual(frame.get(world),source);overlap++;}
   assert(overlap>8,'moving across coastline segments and material periods retains shared world texture coordinates');
  }
 }
});

test('Full patrol hulls remain clear of both rendered coast materials across the finite chart',()=>{
 const g={x:0,y:0},chart=doverPatrolChart(g);
 for(const [hullLength,hullWidth] of [[135,36],[171,46]])for(let row=2;row<98;row++)for(const x of [chart.left,chart.right]){
  const radius=doverHullMargin({hullLength,hullWidth}),q=doverPatrolSpawn(g,x,chart.top+chart.height*row/100,radius);
  for(let i=0;i<32;i++){
   const a=i*Math.PI/16,px=q.x+Math.cos(a)*Math.hypot(hullLength,hullWidth),py=q.y+Math.sin(a)*Math.hypot(hullLength,hullWidth),v=(py-chart.top)/chart.height;
   assert(px>doverCoastPoint(chart,v,-1).x+187,'no hull pixels on the English coast');
   assert(px<doverCoastPoint(chart,v,1).x-164,'no hull pixels on the French coast');
  }
 }
});

test('The coastal material is a real alpha WebP at its untouched authored pixel dimensions',()=>{
 const b=readFileSync(new URL('../terrain-dover-chalk-material-v6.webp',import.meta.url));
 assert.equal(createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex'),'9f3b1b1ed531861604683d4480d1a6a28539816b','review the measured alpha coastline clearance whenever the authored material changes');
 assert(b.length>100000);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',12,16),'VP8L');
 const bits=b.readUInt32LE(21);assert(bits&(1<<28),'lossless alpha flag');
 assert.equal(1+(bits&16383),coast.naturalWidth);assert.equal(1+((bits>>>14)&16383),coast.naturalHeight);
});
