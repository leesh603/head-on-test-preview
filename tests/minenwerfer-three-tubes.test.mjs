import test from 'node:test';
import assert from 'node:assert/strict';
import {MINEN_TUBES,MINEN_ART,minenRecoilOffset} from '../minenwerfer-art-layout.js';
import {MinenwerferBattery} from '../headon-stageboss-patterns.js';
const make=()=>new MinenwerferBattery({id:'minen',x:310,y:-700,tuning:{maxHp:1000,partHp:100,damage:12,bulletSpeed:160,mortarInterval:1.9},rng:()=>.5});
test('three complete installations retain their HP budget and each accepts hits at all three mortar mounts',()=>{
 const b=make();assert.equal(b.parts.size,3);assert.equal(b.maxHp,1200);
 for(const p of b.parts.values())for(let i=0;i<3;i++){
  const t=MINEN_TUBES[i],x=b.x+p.x+t.x,y=b.y+p.y+t.y,before=p.hp;
  assert.deepEqual(b.locateHit({x,y}),{partId:p.id,tube:i});
  assert.equal(b.hitAt({x,y,damage:11}).damage,11);assert.equal(p.hp,before-11);
 }
 assert.equal(b.hp,1200-99);const p=b.parts.get('gun-left');b.hit({partId:p.id,damage:9999});
 for(const t of MINEN_TUBES)assert.equal(b.locateHit({x:b.x+p.x+t.x,y:b.y+p.y+t.y}),null);
 assert.equal(b.parts.get('main-gun').hp,367);assert.equal(b.parts.get('gun-right').hp,367);
});
test('fast rounds sweep every physical tube; timber paths and empty space do not absorb hits',()=>{
 const b=make();for(const p of b.parts.values())for(const t of MINEN_TUBES){
  const x=b.x+p.x+t.x,y=b.y+p.y+t.y;
  assert.equal(b.locateHit({x:x+120,y,previousX:x-120,previousY:y,radius:2})?.partId,p.id);
 }
 const p=b.parts.get('main-gun');assert.equal(b.locateHit({x:b.x+p.x+100,y:b.y+p.y+170}),null);
});
test('actual mortar shots alternate tubes and recoil only the firing tube smoothly, then recover; pause freezes recoil',()=>{
 const b=make(),events=[];b.emit=e=>events.push(e);const p=b.parts.get('main-gun');
 for(let i=0;i<3;i++){
  b.shell(p,0,0);assert.equal(p.mortarTube,i);assert.equal(p.mortarRecoils[i],MINEN_ART.recoilDuration);assert.equal(minenRecoilOffset(p,i),0);
  const launch=events.findLast(e=>e.type==='mortar-launch'),shot=events.findLast(e=>e.type==='hazard');
  assert.deepEqual([launch.x,launch.y],[shot.sourceX,shot.sourceY]);assert.equal(shot.sourceTube,i);
  b.update(.1,{paused:true});assert.equal(p.mortarRecoil,MINEN_ART.recoilDuration);
  b.recovery=10;b.update(.2,{});b.update(.2,{});assert.equal(minenRecoilOffset(p,i),0);
 }
});
globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=tame3&rail=37');
const {CoopGame}=await import('../coop-engine.js?v=tame3&rail=37');
const {enableStageBoss}=await import('../stageboss-host.js?v=tame3&rail=37');
for(const coop of [false,true])for(const [w,h]of [[390,844],[1280,800]])test(`native ${coop?'coop':'solo'} ${w}: ordinary projectiles damage all NINE mounts without multiplying installation HP`,()=>{
 const g=coop?new CoopGame([{pilot:'fonck'},{pilot:'fonck'}],{rng:()=>.5}):new Game('spad','fonck',()=>.5);
 g.viewWidth=w;g.viewHeight=h;g.region=3;g.spawn=Infinity;g.nextBossAt=Infinity;g.need=Infinity;
 for(const p of g.players||[g]){p.fire=Infinity;p.invuln=Infinity;p.need=Infinity;}
 enableStageBoss(g,{teamFaction:'entente'});g.stageBoss.stages.stageIndex=3;
 const enc=g.stageBoss.startBoss({x:0,y:-120}),b=[...enc.bodies.values()][0],initial=b.hp;
 g.update(.02,{});
 for(const p of b.parts.values())for(const t of MINEN_TUBES){
  const x=b.x+p.x+t.x,y=b.y+p.y+t.y,before=p.hp;
  g.bullets.push({x:x-20,y,vx:520,vy:0,life:.15,enemy:false,ownerId:'p1',damage:7,hit:new Set()});
  g.update(.02,{});assert.ok(p.hp<before,`${p.id}: mount at ${t.x} missed`);
 }
 assert.ok(b.hp<=initial-63);assert.equal(b.hp,[...b.parts.values()].reduce((sum,p)=>sum+p.hp,0));assert.equal(b.parts.size,3);g.stageBoss.dispose();
});
