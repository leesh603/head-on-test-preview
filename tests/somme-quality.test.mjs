import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {createBossEncounter}=await import('../headon-stageboss-patterns.js?v=raid2');
const {landshipClearance,sommeMuzzle,sommePoint,syncSommeParts}=await import('../somme-boss-layout.js?v=raid2');
const {bossHudModel}=await import('../headon-stageboss-hud.js?v=raid2');
const bounds={left:0,right:800,top:0,bottom:844};
const players=[{id:'p1',alive:true,x:680,y:390,radius:12},{id:'p2',alive:true,x:140,y:420,radius:12}];
const tuning={maxHp:3000,damage:20,bulletSpeed:240,regionalViewWidth:800,regionalViewHeight:844};
function make(extra={}){const events=[];const e=createBossEncounter({id:'quality',bossId:'mark4-wedge',x:400,y:240,tuning:{...tuning,...extra},emit:q=>events.push(q)});return {e,events,bs:[...e.bodies.values()]};}
function advance(e,seconds,ctx={players,bounds}){for(let i=0;i<Math.round(seconds/.02);i++)e.update(.02,ctx);}

test('Mark I entrance uses the real three hulls and waits for visible movement before HUD',()=>{
 const {e,events,bs}=make({sommeApproach:true});assert.equal(bossHudModel(e),null);
 const first=[...bs.map(b=>[b.x,b.y])];assert(bs[0].y>bs[1].y);
 advance(e,5,{players,bounds:{...bounds,top:1000,bottom:1844}});
 assert(bs[1].x<first[1][0]&&bs[2].x>first[2][0],'female escorts must actually spread outward');
 assert.equal(e.markEntry.age,0);assert(!events.some(q=>q.type==='hazard'));assert.equal(bossHudModel(e),null);
 advance(e,1.5);assert(bs.every(b=>b.discovered));assert(bossHudModel(e));
 assert.equal(events.filter(q=>q.type==='somme-discovered').length,1);
 assert(bs.every((b,i)=>Math.hypot(b.x-first[i][0],b.y-first[i][1])>5));
});
test('Mark I final push uses actual staggered mounts, settled cannon and a quiet counter window',()=>{
 const {e,events,bs}=make();for(const b of bs)b.hit({damage:1700});
 advance(e,10.7);assert(e.markFinal);assert(bs.some(b=>b.driveDistance>20));
 const shells=events.filter(q=>q.visual==='somme-landship-shell');assert(shells.length>0);
 assert(shells.every(q=>q.warning>=1.45&&q.radius<=37));
 const guns=events.filter(q=>q.type==='muzzle');assert(guns.some(q=>q.bossId===bs[0].id));
 assert(guns.some(q=>q.weapon==='mg'));
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(landshipClearance(bs[i],bs[j])>=-.5);
 events.length=0;advance(e,3.2);assert(events.every(q=>q.type!=='hazard'));
 assert(bs.every(b=>b.phase==='mark1-counter'));advance(e,.3);assert(e.markFinal.done);
});
test('destroyed hulls and mounts never participate in last push and retain the exact wreck pose',()=>{
 const {e,events,bs}=make();bs[0].hit({damage:99999});bs[1].hit({damage:99999});
 const poses=bs.slice(0,2).map(b=>[b.x,b.y,b.hullYaw]);bs[2].hit({partId:'sponson-left',damage:99999});
 advance(e,15);assert(e.markFinal.done);assert.deepEqual(bs.slice(0,2).map(b=>[b.x,b.y,b.hullYaw]),poses);
 assert(events.filter(q=>q.type==='hazard').every(q=>q.bossId===bs[2].id&&q.tag!==bs[2].tag('sponson-left')));
 assert.equal(e.bodies.size,3);assert(!e.completed);
});
test('final push keeps fully broken tracks fixed while surviving sponsons defend',()=>{
 const {e,events,bs}=make();for(const b of bs){b.hit({partId:'track-left',damage:99999});b.hit({partId:'track-right',damage:99999});b.hit({damage:1500});}
 const pose=bs.map(b=>[b.x,b.y,b.hullYaw]);advance(e,11);assert.deepEqual(bs.map(b=>[b.x,b.y,b.hullYaw]),pose);
 assert(events.some(q=>q.visual==='somme-landship-shell'));
 for(const b of bs)for(const p of b.parts.values())if(p.muzzleLength){const m=sommeMuzzle(b,p);assert(Number.isFinite(m.x)&&Number.isFinite(m.y));}
});
test('QA sponson attack reaches the exposed outer mount before the overlapping track strip',()=>{
 for(const width of [390,1280])for(const yaw of [Math.PI,.8])for(const id of ['sponson-left','sponson-right']){
  const {bs}=make({regionalViewWidth:width}),b=bs[0];b.hullYaw=yaw;syncSommeParts(b);
  const p=b.parts.get(id),side=Math.sign(p.localX),q=sommePoint(b,p.localX+side*13,p.localY),dx=Math.cos(yaw)*side,dy=Math.sin(yaw)*side;
  const hit=b.hitAt({x:q.x-dx,y:q.y-dy,previousX:q.x+dx*3,previousY:q.y+dy*3,radius:0,damage:20});
  assert.equal(hit.partId,id);assert.equal(b.parts.get('track-left').hp,b.parts.get('track-left').maxHp);assert.equal(b.parts.get('track-right').hp,b.parts.get('track-right').maxHp);
 }
});
