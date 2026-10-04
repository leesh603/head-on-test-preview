import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,step} from './stageboss-fixture94.mjs';
import {MAAN_LAYOUT,rotateMaan} from '../maan-layout.js';
import {readFileSync,statSync} from 'node:fs';
function battle(team='entente'){const f=fixture({teamFaction:team,stageIndex:13});f.addon.startBoss({x:400,y:50});f.body=[...f.addon.stages.encounter.bodies.values()][0];f.emitted=[];const emit=f.body.emit;f.body.emit=e=>{f.emitted.push(e);emit(e);};return f;}
const destroy=(f,id)=>f.addon.hit({bodyId:f.body.id,partId:id,damage:1e6,faction:f.addon.stages.teamFaction});
test('Ma’an has opposite-faction experimental hulls and a seven-second protected arrival',()=>{
 for(const [team,kind]of [['entente','wustenpanzer'],['central','sinai-landship']]){const f=battle(team);assert.equal(f.body.kind,kind);assert.equal(f.body.locateHit({x:400,y:50}),null);assert.equal(f.body.hit({damage:99}).damage,0);step(f,7.1);assert.equal(f.body.entryAge,7);assert.ok(f.body.coreVulnerable);assert.ok(f.log.cues.some(e=>e.type==='maan-entry'&&e.stage==='doors'));}
});
test('Every component hitbox and gun muzzle rotates with its hull; swept shots hit narrow parts',()=>{
 for(const team of ['entente','central']){const f=battle(team);step(f,7.1);const b=f.body;for(const a of [-.52,0,.48]){b.hullYaw=a;b.syncParts();for(const p of b.parts.values()){const r=rotateMaan(p.localX,p.localY,a);assert.ok(Math.abs(p.x-r.x)<1e-8);assert.ok(Math.abs(p.y-r.y)<1e-8);const s={x:b.x+p.x,y:b.y+p.y};assert.equal(b.locateHit(s)?.partId,p.id);const m=b.muzzle(p,p.localX<0?-1:p.localX>0?1:0);assert.ok(Number.isFinite(m.x)&&Number.isFinite(m.y));}const p=b.parts.get(b.kind==='wustenpanzer'?'heavy-gun':'lewis'),r=rotateMaan(p.localX,p.localY-100,a),r2=rotateMaan(p.localX,p.localY+100,a);assert.ok(b.locateHit({previousX:b.x+r.x,previousY:b.y+r.y,x:b.x+r2.x,y:b.y+r2.y}));}}
});
test('Wüstenpanzer cooling failure vents, track loss changes drive, engine loss slows it',()=>{
 const f=battle();step(f,7.1);destroy(f,'radiator');destroy(f,'track-left');step(f,8);assert.ok(f.body.hullYaw<0);assert.ok(f.emitted.some(e=>e.type==='hazard'&&e.visual==='wusten-steam'));destroy(f,'engine');step(f,1);assert.ok(f.body.driveVelocity<=7.5);destroy(f,'track-right');step(f,1);assert.equal(f.body.driveVelocity,0);f.body.hp=f.body.maxHp*.25;step(f,.1);assert.equal(f.body.phase,'cooling-runaway');assert.ok(f.body.parts.get('radiator').destroyed);
});
test('Destroyed Wüstenpanzer mounts never fire again; steam has a real warning and bounded duration',()=>{
 const f=battle();step(f,7.1);destroy(f,'heavy-gun');destroy(f,'sponson-left');const offset=f.log.cues.length;step(f,25);assert.ok(!f.log.cues.slice(offset).some(e=>e.type==='muzzle'&&['heavy-gun','sponson-left'].includes(e.partId)));destroy(f,'radiator');step(f,8);const vents=f.emitted.filter(e=>e.type==='hazard'&&e.visual==='wusten-steam');assert.ok(vents.length);assert.ok(vents.every(e=>e.warning>=1&&e.duration<=2));
});
test('Sinai uses staggered broadside, front/rear track imbalance, and command-dependent irregular fire',()=>{
 const f=battle('central');step(f,15);const shots=f.emitted.filter(e=>e.type==='hazard'&&e.visual==='sinai-impact');assert.ok(shots.length>=4);assert.ok(!shots.some(e=>e.visual==='wusten-steam'));destroy(f,'track-front-left');destroy(f,'track-front-right');const yaw=f.body.hullYaw;step(f,2);assert.equal(f.body.phase,'differential-drive');assert.ok(f.body.hullYaw>yaw);destroy(f,'command');step(f,1);assert.equal(f.body.phase,'command-disrupted');destroy(f,'tank');step(f,5);assert.ok(f.emitted.some(e=>e.type==='hazard'&&e.visual==='sinai-fire'));
});
test('Sinai escorts are independently hittable ground bodies, capped at three; support destruction stops launches',()=>{
 const f=battle('central');step(f,7.1);const e=f.addon.stages.encounter;assert.equal(e.bodies.size,3);const car=[...e.bodies.values()].find(b=>b.leader);assert.ok(car.locateHit({x:car.x,y:car.y}));f.addon.hit({bodyId:car.id,damage:1e6,faction:'central'});assert.ok(car.dead);step(f,19);assert.equal([...e.bodies.values()].filter(b=>b.leader&&!b.dead).length,2);destroy(f,'support');for(const b of e.bodies.values())if(b.leader){b.dead=true;b.hp=0;}step(f,30);assert.equal([...e.bodies.values()].filter(b=>b.leader&&!b.dead).length,0);
});
test('Pause freezes arrival and attacks; destroying hull cleans escorts and transitions once',()=>{
 const f=battle('central');f.frame.paused=true;step(f,5);assert.equal(f.body.entryAge,0);f.frame.paused=false;step(f,7.1);for(const p of f.body.parts.values())destroy(f,p.id);f.addon.hit({bodyId:f.body.id,damage:1e6,faction:'central'});assert.ok(f.addon.stages.encounter.completed);step(f,3,{advance:true});assert.equal(f.log.clears.length,1);assert.equal(f.log.stages.length,1);
});
test('Production Ma’an paths exist and independent layouts retain opposite silhouettes',()=>{
 for(const name of ['terrain-maan.webp','maan-workshop.webp','boss-maan-wusten.webp','boss-maan-wusten-wreck.webp','boss-maan-sinai.webp','boss-maan-sinai-wreck.webp','boss-maan-rolls-royce.webp'])assert.ok(statSync(new URL('../'+name,import.meta.url)).size>1000);
 assert.notEqual(MAAN_LAYOUT.wustenpanzer.width,MAAN_LAYOUT['sinai-landship'].width);assert.equal(MAAN_LAYOUT['sinai-landship'].parts.filter(p=>p[5]==='track').length,4);assert.equal(MAAN_LAYOUT.wustenpanzer.parts.filter(p=>p[5]==='track').length,2);
 const lab=readFileSync(new URL('../test-lab.html',import.meta.url),'utf8');assert.ok(lab.includes('value="13"'));
});

test('Ma’an boss ground stays world-locked and covers the viewport',async()=>{
 const previous=globalThis.Image;globalThis.Image=class{constructor(){this.naturalWidth=724;this.naturalHeight=2172;this.complete=true;}};
 try{const {paintMaan}=await import('../maan-view.js?v=styles537');const g={stageBoss:{stages:{phase:'boss',bossId:'wustenpanzer',encounter:{id:'first'}}},distance:12000,stageStartDistance:0};
 const ys=[];const c={fillRect(){},save(){},restore(){},drawImage(...a){ys.push(a[2]);}};
 paintMaan(c,g,0,0,600,500);const start=Math.min(...ys);
 ys.length=0;paintMaan(c,g,0,-120,600,500);assert.equal(Math.min(...ys)-start,120);
 ys.length=0;paintMaan(c,g,0,0,600,500);assert.ok(ys.length>0&&Math.min(...ys)<=0&&Math.max(...ys)+2172>=500);
 }finally{if(previous)globalThis.Image=previous;else delete globalThis.Image;}
});
