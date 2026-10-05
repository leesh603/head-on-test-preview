import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import './_globals-stub.mjs';
import {PILOTS} from '../engine.js';
import {BOSS_CATALOG,STAGES,createBossEncounter} from '../headon-stageboss-patterns.js';
import {CAMPAIGN_DATA} from '../campaign-data.js';
import {MUSIC_REGIONS,CAMPAIGN_MUSIC,musicContextForGame} from '../music-context.js';
import {MUSIC_THEMES,ACE_MOTIFS,BOSS_ARRANGEMENTS,orchestralStep,signatureNotes} from '../music-score.js';
import {MUSIC_SAMPLES} from '../music-samples.js';
import {BattleMusic} from '../music.js';

const game=()=>({state:'playing',t:20,x:0,y:0,enemies:[],worldRegion:()=>0});
test('every actual region, campaign, ace and catalog boss has a score',()=>{
 assert.deepEqual(MUSIC_REGIONS,STAGES);
 for(const id of STAGES)assert(MUSIC_THEMES[id],id);
 for(const stage of CAMPAIGN_DATA.stages)assert(MUSIC_THEMES[CAMPAIGN_MUSIC[stage.id]],stage.id);
 assert.deepEqual(Object.keys(ACE_MOTIFS).sort(),Object.keys(PILOTS).sort());
 for(const id of Object.keys(BOSS_CATALOG))assert(BOSS_ARRANGEMENTS[id],id);
 assert.notEqual(CAMPAIGN_MUSIC['A-03'],CAMPAIGN_MUSIC['A-04']);
 assert.notEqual(MUSIC_REGIONS[8],MUSIC_REGIONS[7]);
});
test('Director recovery and expiry, real ace identity, and every non-playing state',()=>{
 const g=game();g.stage={id:'A-03'};assert.equal(musicContextForGame(g).theme,'verdun');
 g.battleDirector={pattern:'CROSS_ATTACK',endsAt:30};assert.equal(musicContextForGame(g).state,'COMBAT');
 g.battleDirector.pattern='RECOVERY';assert.equal(musicContextForGame(g).state,'CALM');
 g.battleDirector={pattern:'BOMBER_RUN',endsAt:10};assert.equal(musicContextForGame(g).state,'CALM');
 g.enemies=[{hp:50,type:'boss',bossPilot:'boelcke',campaignAce:'hantelmann'}];
 assert.equal(musicContextForGame(g).aceId,'boelcke');g.enemies[0].rivalEscaped=true;assert.equal(musicContextForGame(g).state,'CALM');
 for(const state of ['paused','upgrade','lost','won','hangar']){g.state=state;assert.equal(musicContextForGame(g).state,'IDLE');}
});
test('all real boss instances: priority, aggregate HP, final and return without mutations',()=>{
 for(const [bossId,entry] of Object.entries(BOSS_CATALOG)){
  const encounter=createBossEncounter({id:bossId,bossId,x:0,y:0,rng:()=>.5,emit(){},tuning:{maxHp:1000,partHp:100,damage:10,bulletSpeed:100}});
  const g=game();g.enemies=[{hp:100,bossPilot:'baron'}];g.stageBoss={stages:{phase:'boss',bossId,encounter}};
  const before=JSON.stringify(encounter.snapshot());assert.equal(musicContextForGame(g).bossId,bossId);assert.equal(JSON.stringify(encounter.snapshot()),before);
  for(const b of encounter.bodies.values())b.hp=b.maxHp*.2;
  assert.equal(musicContextForGame(g).state,'BOSS_FINAL',bossId);
  for(const b of encounter.bodies.values()){b.hp=0;b.dead=true;}
  assert.equal(musicContextForGame(g).state,'ACE',bossId);
 }
 const bossId='gotha-squadron',encounter=createBossEncounter({id:'multi',bossId,x:0,y:0,emit(){},tuning:{maxHp:900,partHp:100,damage:10,bulletSpeed:100}});
 [...encounter.bodies.values()][0].hp=1;const g=game();g.stageBoss={stages:{phase:'boss',bossId,encounter}};
 assert.equal(musicContextForGame(g).state,'BOSS','one damaged bomber is not the whole encounter');
});
test('Paris mechanics expose lock, beat, engine relief, approach and last stand',()=>{
 const make=bossId=>{const encounter=createBossEncounter({id:bossId,bossId,x:0,y:0,emit(){},tuning:{maxHp:1000,partHp:100,damage:10,bulletSpeed:100}});const g=game();g.stageBoss={stages:{phase:'boss',bossId,encounter}};return[g,[...encounter.bodies.values()][0]];};
 const [g,b]=make('paris-searchlight-fortress');b.rhythmBeat=2;b.locks.set('p',{remaining:1});
 assert.equal(musicContextForGame(g).locked,true);assert(musicContextForGame(g).pulse);
 b.phase='last-stand';assert.equal(musicContextForGame(g).state,'BOSS_FINAL');
 const [g2,b2]=make('paris-staaken-rvi');b2.runTarget={x:0,y:0};b2.runRemaining=4;
 const a=musicContextForGame(g2);b2.parts.get('engine-0').hp=0;b2.parts.get('engine-1').hp=0;
 const c=musicContextForGame(g2);assert(c.engines<a.engines);assert(c.urgency<a.urgency,'slower approach relaxes urgency');
});
test('each destroyed Fliegerzug car removes its own orchestral voice',()=>{
 const bossId='fliegerzug',encounter=createBossEncounter({id:bossId,bossId,x:0,y:0,emit(){},tuning:{maxHp:1000,partHp:100,damage:10,bulletSpeed:100}});
 const g=game();g.worldRegion=()=>8;g.stageBoss={stages:{phase:'boss',bossId,encounter}};
 const b=[...encounter.bodies.values()][0];
 const render=()=>{const notes=[],scene=musicContextForGame(g);for(let i=0;i<4;i++)orchestralStep(scene,i,i*.3,.3,.8,(...n)=>notes.push(n));return notes;};
 let before=render();
 const carIds=[...b.parts.values()].filter(p=>p.kind==='rail-car').map(p=>p.id).slice(0,3);
 for(const id of carIds){
  b.parts.get(id).hp=0;
  const after=render();assert.equal(musicContextForGame(g).cars[id],false);
  assert(before.length-after.length>=1,id);
  before=after;
 }
});
test('recordings have pinned provenance, valid PCM and matching hashes',()=>{
 const sources=JSON.parse(readFileSync(new URL('../music-bank/SOURCES.json',import.meta.url)));
 assert.equal(sources.license,'CC0-1.0');let bytes=0;
 for(const [instrument,samples] of Object.entries(MUSIC_SAMPLES))for(const s of samples){
  const raw=readFileSync(new URL('../music-bank/'+s.file,import.meta.url));bytes+=raw.length;
  assert.equal(raw.toString('ascii',0,4),'RIFF');assert.equal(raw.toString('ascii',8,12),'WAVE');
  assert.equal(raw.readUInt32LE(24),32000);assert.equal(raw.readUInt16LE(34),16);
  const record=sources.samples[instrument].find(r=>r.file===s.file);
  assert.equal(createHash('sha256').update(raw).digest('hex'),record.sha256);assert.equal(record.sourceSha256.length,64);
  assert(Math.abs((raw.length-44)/64000-s.duration)<.001);
 }
 assert(bytes<15*1024*1024,'bounded mobile download');
});
test('authored maps and boss variations differ; every emitted note has a real instrument',()=>{
 const hashes=new Set();
 for(const theme of Object.keys(MUSIC_THEMES)){
  const s=MUSIC_THEMES[theme],notes=[];
  const emit=(...n)=>{assert(MUSIC_SAMPLES[n[0]],n[0]);assert(n.slice(1).every(Number.isFinite));assert(n[3]>0);notes.push(n);};
  for(let i=0;i<s.beats*2*96;i++)orchestralStep({theme,state:'COMBAT'},i,i*.3,60/s.bpm/2,.7,emit);
  hashes.add(JSON.stringify(notes));assert(notes.length>100);
 }
 assert.equal(hashes.size,Object.keys(MUSIC_THEMES).length);
 for(const [bossId,entry] of Object.entries(BOSS_CATALOG)){
  const normal=[],final=[],scene={theme:STAGES[entry.stage],bossId,parts:1,engines:1,formation:1};
  for(let i=0;i<48;i++){orchestralStep({...scene,state:'BOSS'},i,i*.3,.3,.8,(...n)=>normal.push(n));orchestralStep({...scene,state:'BOSS_FINAL',parts:.2,engines:.2},i,i*.3,.3,.8,(...n)=>final.push(n));}
  assert.notDeepEqual(normal,final,bossId);
 }
 const motifs=new Set();for(const id of Object.keys(PILOTS)){const notes=[],seconds=signatureNotes(id,'rural',0,(...n)=>notes.push(n));assert(seconds>=3&&seconds<=6);motifs.add(JSON.stringify(notes));}
 assert.equal(motifs.size,Object.keys(PILOTS).length);
});
test('one signature per ace; pause, mute, boss priority and restart cancel scheduled cues',()=>{
 const m=new BattleMusic(),notes=[],stops=[];
 m.ctx={state:'running',currentTime:0};m.bus={gain:{setTargetAtTime(){}}};m.layer={disconnect(){}};
 m.bank={ready:true,note(...n){notes.push(n);},stop(predicate){stops.push(predicate);}};
 const g=game(),ace={hp:10,bossPilot:'baron'};g.enemies=[ace];
 m.setScene(musicContextForGame(g),false);m.schedule();assert.equal(m.signatureCount,1);
 for(let i=0;i<8;i++)m.setScene(musicContextForGame(g),false);
 m.schedule();assert.equal(m.signatureCount,1);
 m.setScene(null,true);const count=notes.length;m.schedule();assert.equal(notes.length,count);
 m.setScene(musicContextForGame(g),false);m.schedule();assert.equal(m.signatureCount,1);
 const step=m.step;m.setScene({...musicContextForGame(g),state:'BOSS',bossId:'paris-gun',ace:undefined},false);assert.equal(m.step,step,'same map transport survives ace to boss');
 assert(stops.length>0);m.reset();m.setScene(musicContextForGame(g),false);m.schedule();assert.equal(m.signatureCount,1,'restart permits a fresh intro');
});
