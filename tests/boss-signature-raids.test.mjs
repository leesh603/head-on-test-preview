import test from 'node:test';
import assert from 'node:assert/strict';
import {shellMarch,broadsideBreak,impactPulse} from '../boss-raid-strikes.js';
import {BossHazards} from '../headon-stageboss-hazards.js';
import {fixture} from './stageboss-fixture94.mjs';
import {LivensFlameProjector} from '../headon-stageboss-patterns.js';

test('artillery landing points stay fixed while the source mount moves; destroying it cancels the remaining order',()=>{
 const f=fixture({stageIndex:5}),e=f.addon.startBoss({x:400,y:100}),b=e.bodies.values().next().value,part=b.parts.get('engine-0');
 const target={x:320,y:440,vx:110,vy:0};shellMarch(b,{source:{x:b.x+part.x,y:b.y+part.y},partId:part.id,target,visual:'carpet-bomb',tag:'landing-regression'});
 const before=[];f.addon.hazards.pool.visit(h=>{if(h.tag==='landing-regression')before.push([h.x,h.y]);});
 part.x+=65;target.x+=300;f.addon.tick(.05,f.frame);
 const after=[];f.addon.hazards.pool.visit(h=>{if(h.tag==='landing-regression')after.push([h.x,h.y]);});assert.deepEqual(after,before);
 part.hp=0;f.addon.tick(.05,f.frame);let remaining=0;f.addon.hazards.pool.visit(h=>{if(h.tag==='landing-regression')remaining++;});assert.equal(remaining,0);f.addon.dispose();
});

test('broadside alternates openings, commits a heavy final row and will not overlap its own recovery',()=>{
 const events=[],boss={id:'ship',x:0,y:0,combatTime:0,t:{damage:18},parts:new Map([['gun',{id:'gun',x:0,y:0}]]),emit:e=>events.push(e)};
 const spec={source:{x:0,y:0},partId:'gun',angle:Math.PI/2,visual:'zubian-shell',tag:'actual-gun'};
 assert(broadsideBreak(boss,spec)>0);const shots=events.filter(e=>e.type==='hazard');assert.equal(shots.length,35);
 const heavy=shots.filter(e=>e.raidHeavy);assert.equal(heavy.length,13);assert(heavy.every(e=>e.delay>shots[0].delay+.8));
 boss.combatTime=2;assert.equal(broadsideBreak(boss,spec),0);boss.combatTime=8;assert(broadsideBreak(boss,spec)>0);
});

test('Livens pressure pulse is visible collision throughout its short travel; pressure destruction removes heavy damage',()=>{
 const events=[],b=new LivensFlameProjector({id:'flame',x:0,y:0,tuning:{maxHp:1000,partHp:100,damage:18,bulletSpeed:270},emit:e=>events.push(e)});
 b.beginFlame('pulse',{id:'p',x:0,y:400});let hit=0;const h=new BossHazards({onDamage:()=>hit++,onStatus(){},onBarrierContact(){}});
 const flame=events.find(e=>e.kind==='beam');assert(flame.raidHeavy);assert(flame.duration<=.5);h.spawn({...flame,encounterId:'test'});
 for(let t=0;t<2;t+=.01)h.update(.01,{players:[{id:'p',x:0,y:400,radius:12,alive:true}]});assert(hit>0);
 b.parts.get('pressure').hp=0;events.length=0;b.beginFlame('pulse',{id:'p',x:0,y:400});assert.equal(events.find(e=>e.kind==='beam').raidHeavy,false);
});

globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=tame3&rail=18');
const {enableStageBoss,endStageBossFrame}=await import('../stageboss-host.js?v=tame3&rail=18');
function strikeTrial(rollAt){
 const g=new Game('spad','fonck',()=>.5);g.viewWidth=390;g.viewHeight=844;g.invuln=0;enableStageBoss(g,{teamFaction:'entente'});g.stageBoss.stages.stageIndex=4;
 const e=g.stageBoss.startBoss({x:0,y:-100}),b=e.bodies.values().next().value;b.update=()=>{};b.basicClock=Infinity;
 impactPulse(b,{x:g.x,y:g.y,radius:90,warning:1.25,visual:'city-flak-shell',tag:'evade-trial'});
 const initial=g.hp;let rolled=false;
 // Hold position deliberately to isolate the real Game.evade immunity from
 // locomotion: an avoided hit cannot be attributed to leaving the circle.
 for(let t=0;t<1.8;t+=.01){g.t+=.01;g.invuln=Math.max(0,g.invuln-.01);g.evadeCooldown=Math.max(0,g.evadeCooldown-.01);if(rollAt!==null&&!rolled&&t>=rollAt){assert(g.evade());rolled=true;}endStageBossFrame(g,.01);}
 const result={lost:initial-g.hp,maxHp:g.maxHp};g.stageBoss.dispose();return result;
}
test('actual host heavy impact punishes ignoring the tell, precise evade negates it, early evade does not',()=>{
 const ignored=strikeTrial(null),timed=strikeTrial(1.05),early=strikeTrial(.1);
 assert(ignored.lost>=ignored.maxHp*.72);assert.equal(timed.lost,0);assert(early.lost>=early.maxHp*.72);
});

test('heavy mine chain uses real shootable mines; early destruction prevents its finishing impact',()=>{
 for(const shoot of [false,true]){
  const g=new Game('spad','fonck',()=>.5);g.invuln=0;enableStageBoss(g,{teamFaction:'entente'});g.stageBoss.stages.stageIndex=4;
  const b=g.stageBoss.startBoss({x:0,y:-100}).bodies.values().next().value;b.update=()=>{};b.basicClock=Infinity;
  b.command('spawn-minefield',{points:[{x:g.x,y:g.y}],sourceX:-80,sourceY:-100,warning:1,life:8,fuse:3.2,blastRadius:105,blastHeavy:true,maxMines:26});
  const initial=g.hp;for(let t=0;t<3.6;t+=.02){if(shoot&&t>2.4)g.hostileMinefields[0].mines[0].dead=true;endStageBossFrame(g,.02);}
  if(shoot)assert.equal(g.hp,initial);else assert(initial-g.hp>=g.maxHp*.72);g.stageBoss.dispose();
 }
});

test('walking artillery catches unchanged forward flight while a finite-speed turn escapes the entire committed order',()=>{
 const fly=turn=>{const events=[],boss={id:'rail',x:0,y:0,t:{damage:18},parts:new Map(),emit:e=>events.push(e)},p={id:'p',x:0,y:0,vx:0,vy:-180,radius:12,alive:true};
  shellMarch(boss,{source:{x:-100,y:-300},target:p,visual:'rail-shell',tag:'walking'});
  let hits=0,heading=-Math.PI/2;const h=new BossHazards({onDamage:()=>hits++,onStatus(){},onBarrierContact(){}});for(const e of events)h.spawn({...e,encounterId:'e'});
  for(let t=0;t<4;t+=.01){if(turn&&t>=.45)heading=Math.min(0,heading+.03);p.x+=Math.cos(heading)*1.8;p.y+=Math.sin(heading)*1.8;h.update(.01,{players:[p]});}return hits;
 };
 assert(fly(false)>=2);assert.equal(fly(true),0);
});
