import test from 'node:test';
import assert from 'node:assert/strict';
import {LondonApron,DrachenMineNet} from '../headon-stageboss-patterns.js?v=508';
import {apronPose,apronPoint,apronPanelHull,netContact,drawAttachedApron} from '../london-apron369.js';
const tuning={maxHp:1000,partHp:100,damage:10,bulletSpeed:100,geometryScale:2.025};
for(const width of [390,1280])test(`registered hit geometry ${width}`,()=>{
 const b=new LondonApron({id:'test',x:500,y:500,tuning:{...tuning,regionalViewWidth:width,regionalViewHeight:800}});
 for(const p of b.parts.values())assert.equal(b.locateHit({x:b.x+p.x,y:b.y+p.y,radius:0}).partId,p.id);
 assert.equal(b.locateHit({x:500,y:500-190*b.apronScale}),null);
 const first=b.parts.get('airship-0');b.hit({partId:first.id,damage:first.maxHp});
 assert.equal(b.locateHit({x:b.x+first.x,y:b.y+first.y}),null);assert.ok(!b.dead);
 for(const p of b.parts.values())b.hit({partId:p.id,damage:p.maxHp});
 assert.ok(b.dead);assert.equal(b.hp,0);
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
 b.hit({partId:'airship-1',damage:1000});assert.ok(events.some(e=>e.type==='cancel-hazards'&&e.tag==='apron-airship-1'));
});
test('renderer preserves full source height and rigid hull',()=>{
 const draws=[],c=new Proxy({globalAlpha:1,drawImage:(...a)=>draws.push(a)}, {get:(o,k)=>k in o?o[k]:()=>{}});
 const im={naturalWidth:768,naturalHeight:512};
 drawAttachedApron(c,{x:0,y:0,apronScale:1,parts:[],motionTime:0},im,im);
 assert.equal(draws.length,51);assert.deepEqual(draws[0].slice(-4),[-384,-256,256,216]);
 assert.equal(draws.filter(a=>a.at(-1)===512).length,48);
});
test('net is durable and transfers damage to the matching hull once',()=>{
 const b=new LondonApron({id:'b',x:0,y:0,tuning}),v=apronPanelHull(0,apronPose(0),b.apronScale),x=v.reduce((s,p)=>s+p.x,0)/4,y=v.reduce((s,p)=>s+p.y,0)/4;
 const h=b.locateHit({x,y});assert.equal(h.partId,'net-0');b.hit({...h,damage:100});
 assert.equal(b.hp,962);assert.ok(Math.abs(b.parts.get('airship-0').hp-(1000/3-38))<.001);assert.equal(b.parts.get('airship-1').hp,1000/3);
});
for(const Type of [LondonApron,DrachenMineNet])test(Type.name+' has staggered guns and no gun survives its airship',()=>{
 const events=[],b=new Type({id:'b',x:0,y:0,tuning,emit:e=>events.push(e)}),ctx={players:[{id:'p',x:0,y:200,alive:true}],bounds:{left:-640,right:640,top:-400,bottom:400}};
 for(let i=0;i<250;i++)b.update(.02,ctx);
 for(let j=0;j<3;j++)assert.ok(events.some(e=>e.visual==='city-mg'&&e.tag==='gun-'+j));
 b.hit({partId:'airship-0',damage:1000});events.length=0;
 for(let i=0;i<250;i++)b.update(.02,ctx);
 assert.ok(!events.some(e=>e.visual==='city-mg'&&e.tag==='gun-0'));assert.ok(events.some(e=>e.visual==='city-mg'));
});
test('Drachen survivors regenerate staggered mines from their own visible mounts',()=>{
 const events=[],b=new DrachenMineNet({id:'b',x:0,y:0,tuning,rng:()=>.37,emit:e=>events.push(e)}),ctx={players:[{id:'p',x:0,y:210,alive:true}],bounds:{left:-640,right:640,top:-400,bottom:400}};
 b.hit({partId:'airship-0',damage:1000});b.hit({partId:'airship-1',damage:1000});
 for(let i=0;i<600;i++)b.update(.05,ctx);
 const mines=events.filter(e=>e.type==='spawn-minefield');assert.ok(mines.length>35);assert.ok(b.netWave>=8);
 assert.ok(mines.every(e=>e.points.length===1&&e.maxMines===26&&e.sourceX>0));
 assert.ok(mines.some(e=>e.warning===2.1));
 b.hit({partId:'airship-2',damage:1000});events.length=0;for(let i=0;i<100;i++)b.update(.05,ctx);assert.equal(events.length,0);
});
