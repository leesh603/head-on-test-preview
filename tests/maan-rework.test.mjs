import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {fixture,step} from './stageboss-fixture94.mjs';
import {MAAN_ENTRY} from '../maan-layout.js';
import {MAAN_SAND,tickMaanWeather,maanSandCover} from '../maan-weather.js';
import {periodicSandPixels,maanGroundTiles} from '../maan-ground.js';
import {bossTactic} from '../boss-feedback.js';
const battle=(team='entente',width=800)=>{const f=fixture({teamFaction:team,stageIndex:13});f.frame.bounds.right=width;f.addon.startBoss({x:width/2,y:50});f.body=[...f.addon.stages.encounter.bodies.values()][0];f.emitted=[];const emit=f.body.emit;f.body.emit=e=>{f.emitted.push(e);emit(e);};return f;};
const destroy=(f,id)=>f.addon.hit({bodyId:f.body.id,partId:id,damage:1e6,faction:f.addon.stages.teamFaction});

test('Both factions rupture one world-anchored workshop before translating, with identical cue order',()=>{
 for(const team of ['entente','central']){
  const f=battle(team),anchor={...f.body.entryAnchor};step(f,3.9);assert.equal(f.body.x,anchor.x);assert.equal(f.body.y,anchor.y);
  f.frame.players.forEach(p=>{p.x+=500;p.y+=500});f.frame.bounds={left:-1000,right:3000,top:-1000,bottom:3000};step(f,.2);
  assert.deepEqual(f.body.entryAnchor,anchor);assert.equal(f.body.y,anchor.y);
  while(f.body.entryAge<7)f.addon.tick(.01,f.frame);assert.equal(f.body.entryAge,7);assert.equal(f.body.x,anchor.x);assert.equal(f.body.y,anchor.y+f.body.layout.height*MAAN_ENTRY.travel);
  assert.deepEqual(f.emitted.filter(e=>e.type==='maan-entry').map(e=>e.stage),['alarm','ignition','doors','engaged']);
 }
});
test('Sinai escorts stay hidden, invulnerable and silent until the workshop breakthrough completes',()=>{
 const f=battle('central'),cars=[...f.addon.stages.encounter.bodies.values()].filter(b=>b.leader);step(f,6.8);
 for(const car of cars){assert(car.hidden);assert.equal(car.locateHit(car),null);assert.equal(car.hit({damage:1e6}).damage,0);assert.equal(car.age,0);}
 assert(!f.log.cues.some(c=>c.type==='muzzle'));step(f,.3);assert(cars.every(c=>!c.hidden&&c.age>0));
});
test('Regional sand drifts in world space, caps allocations, freezes on pause and clears on region exit',()=>{
 for(const width of [390,1440]){
  const g={state:'playing',x:0,y:0,viewWidth:width,stageBoss:{stages:{stageIndex:13}}};tickMaanWeather(g,.1);const s=g.maanWeather.cells[0],x=s.x;
  tickMaanWeather(g,4);assert.equal(s.x-x,s.vx*4);assert(maanSandCover(g.maanWeather,s.x,s.y));assert(!maanSandCover(g.maanWeather,s.x+s.rx*2,s.y));
  g.state='paused';const frozen=JSON.stringify(g.maanWeather);tickMaanWeather(g,10);assert.equal(JSON.stringify(g.maanWeather),frozen);g.state='playing';
  for(let i=0;i<3000;i++){tickMaanWeather(g,.05);assert(g.maanWeather.cells.length<=(width<720?MAAN_SAND.mobileCap:MAAN_SAND.cap));}
  g.stageBoss.stages.stageIndex=0;tickMaanWeather(g,.1);assert.equal(g.maanWeather,null);
 }
});
test('Wüstenpanzer loses live target coordinates under sand; heavy impact creates a warned hollow shock ring',()=>{
 const f=battle();step(f,7.1);const p=f.frame.players[0];p.x=333;p.y=444;step(f,.1);const captured={...f.body.lastSeen};p.sandCover=true;p.x=900;p.y=1200;
 const start=f.emitted.length;step(f,7);assert.deepEqual(f.body.lastSeen,captured);assert(f.body.sandBlind);
 const events=f.emitted.slice(start),rings=events.filter(e=>e.visual==='maan-sand-ring');assert(rings.length);assert(!events.some(e=>e.visual==='wusten-mg'||e.visual==='wusten-shell'));
 for(const h of rings){assert.equal(h.x,captured.x);assert.equal(h.y,captured.y);assert(h.warning>=1.8&&h.innerRadius>0&&h.radiusLimit<=140&&h.ringWidth<h.radiusStart);}
});
test('Sinai salvos leave a full pilot-radius corridor on PC/mobile through the final explosion',()=>{
 for(const width of [390,1440]){
  const f=battle('central',width);step(f,7.1);f.body.timers.set('broadside',.01);const start=f.emitted.length;step(f,.1);const lane={...f.body.duneLane};
  f.frame.players[0].x+=250;f.frame.players[0].y+=200;step(f,1.3);
  const shots=f.emitted.slice(start).filter(e=>e.visual==='sinai-impact');assert.equal(shots.length,width<500?3:4);
  for(const h of shots){assert(Math.abs(h.x-lane.x)-h.radius-12>lane.width/2);assert(h.warning>=1.6);assert.equal(h.vx,undefined);}
  assert(lane.remaining>=1.14+1.6+.4);assert.equal(f.body.duneLane.x,lane.x);
 }
});
test('Destroyed Sinai command never acquires the pilot position even outside sand',()=>{
 const make=(x,y)=>{const f=battle('central');step(f,7.1);destroy(f,'command');f.frame.players[0].x=x;f.frame.players[0].y=y;f.body.timers.set('broadside',.01);step(f,1.4);return f.emitted.filter(e=>e.visual==='sinai-impact').map(e=>[e.x,e.y]);};
 assert.deepEqual(make(100,220),make(730,520));
});
test('Sand and command component choices appear in the existing Korean tactical hint',()=>{
 for(const team of ['entente','central']){const f=battle(team);step(f,7.1);assert(bossTactic(f.addon.stages.encounter).length>0);assert(bossTactic(f.addon.stages.encounter,'en').length>0);}
});
test('Periodic ground has exact opposite edges, preserves constant brightness and covers negative/subpixel camera positions',()=>{
 const w=40,h=48,data=new Uint8ClampedArray(w*h*4);for(let i=0;i<data.length;i+=4)data.set([117,94,62,255],i);
 const b=periodicSandPixels(data,w,h,3);for(let i=0;i<b.data.length;i+=4)assert.deepEqual([...b.data.subarray(i,i+4)],[117,94,62,255]);
 for(let i=0;i<data.length;i+=4)data[i]=(i/4)%255;const q=periodicSandPixels(data,w,h,3);
 for(let y=0;y<q.height;y++)assert.deepEqual([...q.data.subarray(y*q.width*4,y*q.width*4+4)],[...q.data.subarray((y*q.width+q.width-1)*4,(y*q.width+q.width)*4)]);
 assert.deepEqual([...q.data.subarray(0,q.width*4)],[...q.data.subarray((q.height-1)*q.width*4)]);
 for(const [x,y]of [[0,0],[-1150.75,-2100.5],[1920.2,1840.7]]){const tiles=maanGroundTiles(x,y,1440,1000,1104,1104);assert(Math.min(...tiles.map(t=>t.x))<=0);assert(Math.max(...tiles.map(t=>t.x+t.width))>=1440);assert(Math.min(...tiles.map(t=>t.y))<=0);assert(Math.max(...tiles.map(t=>t.y+t.height))>=1000);}
});
test('Rupture cue is consumed once and blasts the workshop anchor for either faction',async()=>{
 const old=globalThis.Image;globalThis.Image=class{};
 try{const {handleMaanCue}=await import('../maan-view.js?v=maan-qa-cues');for(const team of ['entente','central']){
  const f=battle(team),blasts=[],g={x:9999,y:9999,event(){},combatBlast:(...a)=>blasts.push(a),shake:0};assert.equal(handleMaanCue(g,{type:'maan-entry',stage:'doors'},f.body),true);assert.equal(blasts.length,2);assert(blasts.every(b=>b[1]===f.body.entryAnchor.y&&Math.abs(b[0]-f.body.entryAnchor.x)<200));
  assert.equal(handleMaanCue(g,{type:'unrelated'},f.body),false);
 }}finally{globalThis.Image=old;}
});
test('Versioned atlas/ground exports exist; weather draws before damage telegraphs',()=>{
 for(const f of ['boss-maan-wusten-r2.webp','boss-maan-sinai-r2.webp','maan-workshop-r2.webp','terrain-maan-r2.webp','boss-maan-wusten-cut-in-r2.webp','boss-maan-sinai-cut-in-r2.webp'])assert(statSync(new URL('../'+f,import.meta.url)).size>10000);
 const view=readFileSync(new URL('../stageboss-view.js',import.meta.url),'utf8');assert(view.indexOf("drawMaanWeather(c,g)")<view.indexOf('drawMaanHazard(c,h)'));
});
