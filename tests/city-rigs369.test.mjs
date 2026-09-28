import test from 'node:test';
import assert from 'node:assert/strict';
import {LondonApron,DrachenMineNet} from '../headon-stageboss-patterns.js';
import {apronPose,apronPoint,apronPanelHull,netContact,drawAttachedApron} from '../london-apron369.js';
const tuning={maxHp:1000,partHp:100,damage:10,bulletSpeed:100,geometryScale:2.025};
for(const width of [390,1280])test(`registered hit geometry ${width}`,()=>{
 const b=new LondonApron({id:'test',x:500,y:500,tuning:{...tuning,regionalViewWidth:width,regionalViewHeight:800}});
 for(const p of b.parts.values())assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y,radius:0}).partId,p.id);
 assert.equal(b.locateHit({x:500,y:500-190*b.apronScale}),null);
 for(const p of b.parts.values())b.hit({partId:p.id,damage:100});
 assert.ok(b.coreVulnerable);
 assert.deepEqual(b.locateHit({x:500,y:500-135*b.apronScale}),{partId:null});
 assert.equal(b.locateHit({x:500-260*b.apronScale,y:500-135*b.apronScale}),null);
 const d=new DrachenMineNet({id:'d',x:500,y:500,tuning:{...tuning,regionalViewWidth:width,regionalViewHeight:800}});
 for(const p of d.parts.values())assert.equal(d.locateHit({x:d.x+p.x,y:d.y+p.y}).partId,p.id);
 assert.equal(d.locateHit({x:500-220*d.cityArtScale,y:500+140*d.cityArtScale}),null);
});
test('net stays pinned; hull and collision share coordinates',()=>{
 for(let t=0;t<30;t+=.25){const pose=apronPose(t);
 assert.deepEqual(apronPoint(384,216,pose,1),{x:0,y:-40});
 for(let i=0;i<3;i++){
 const v=apronPanelHull(i,pose,1),p={x:v.reduce((s,p)=>s+p.x,0)/4,y:v.reduce((s,p)=>s+p.y,0)/4,radius:8};
 const n=netContact(p,v);assert.ok(n);assert.equal(netContact({...p,x:p.x+n.x,y:p.y+n.y},v),null);
 }}
});
test('only three attached hazards; destroyed bay cancelled',()=>{
 const events=[],b=new LondonApron({id:'b',x:0,y:0,tuning,emit:e=>events.push(e)});
 const ctx={players:[],bounds:{left:-500,right:500,top:-400,bottom:400}};
 for(let i=0;i<300;i++)b.update(.1,ctx);
 assert.equal(events.filter(e=>e.type==='hazard').length,3);
 assert.ok(events.filter(e=>e.type==='hazard').every(e=>e.kind==='net'&&e.vertices.length===4));
 b.hit({partId:'balloon-1',damage:100});assert.equal(events.at(-2).tag,'apron-balloon-1');
});
test('renderer preserves full source height and rigid hull',()=>{
 const draws=[],c=new Proxy({globalAlpha:1,drawImage:(...a)=>draws.push(a)}, {get:(o,k)=>k in o?o[k]:()=>{}});
 const im={naturalWidth:768,naturalHeight:512};
 drawAttachedApron(c,{x:0,y:0,apronScale:1,parts:[],motionTime:0},im,im);
 assert.equal(draws.length,49);assert.deepEqual(draws[0].slice(-4),[-384,-256,768,216]);
 assert.ok(draws.slice(1).every(a=>a.at(-1)===512));
});
