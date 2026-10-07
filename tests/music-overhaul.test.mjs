import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import './_globals-stub.mjs';
import {PILOTS} from '../engine.js?v=ui3';

import {BOSS_CATALOG,STAGES,createBossEncounter} from '../headon-stageboss-patterns.js';
import {CAMPAIGN_DATA} from '../campaign-data.js';
import {MUSIC_REGIONS,CAMPAIGN_MUSIC,musicContextForGame} from '../music-context.js';
import {REGIONAL_VARIATIONS,ACE_MOTIFS,BOSS_ARRANGEMENTS} from '../music-score.js';
import {BattleMusic,MUSIC_THEME_IDS} from '../music.js?v=ui3';

const game=()=>({state:'playing',t:20,x:0,y:0,enemies:[],worldRegion:()=>0});
function capture(){
 const m=new BattleMusic(),notes=[];
 m.ctx={state:'running',currentTime:0};m.bus={gain:{setTargetAtTime(){}}};
 m.tone=(...n)=>notes.push(['tone',...n]);m.drum=(...n)=>notes.push(['drum',...n]);
 const advance=(seconds)=>{const end=m.ctx.currentTime+seconds;for(;m.ctx.currentTime<end;m.ctx.currentTime+=.05)m.schedule();};
 return {m,notes,advance};
}
test('all seven original calm scores, especially rural, retain exact 80-second note/drum sequences',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./music-original-fixture.json',import.meta.url)));
 for(const [mode,hash] of Object.entries(fixture.hashes)){
  const {m,notes}=capture();m.setScene({theme:mode==='trench'?'trenches':mode,state:'CALM',intensity:.2},false);
  for(let tick=0;tick<1600;tick++){m.ctx.currentTime=tick*.05;m.schedule();}
  assert.equal(createHash('sha256').update(JSON.stringify(notes)).digest('hex'),hash,mode);
 }
});
test('Director combat adds a beat-locked groove then releases without changing the rural song',()=>{
 const {m,notes,advance}=capture();m.setScene({theme:'rural',state:'CALM',intensity:.2},false);advance(3);
 const oldStep=m.step;m.setScene({theme:'rural',state:'COMBAT',intensity:.8,pattern:'CROSS_ATTACK'},false);
 assert.equal(m.step,oldStep);advance(5);assert(m.intensity>.75);
 const combat=notes.slice();assert(combat.some(n=>n[0]==='tone'&&n[6]===680),'driving bass groove');
 assert(combat.some(n=>n[0]==='drum'&&n[2]===true&&n[3]>.55),'audible snare backbeat');
 m.setScene({theme:'rural',state:'CALM',intensity:.12,pattern:'RECOVERY'},false);advance(10);
 assert(m.intensity<.2);notes.length=0;advance(3);assert(!notes.some(n=>n[0]==='tone'&&n[6]===680));
 assert.equal(m.tempo,88);
});
test('every actual region, campaign, ace and catalog boss has a score',()=>{
 assert.deepEqual(MUSIC_REGIONS,STAGES);
 for(const id of STAGES)assert(MUSIC_THEME_IDS.includes(id),id);
 for(const stage of CAMPAIGN_DATA.stages)assert(MUSIC_THEME_IDS.includes(CAMPAIGN_MUSIC[stage.id]),stage.id);
 assert.deepEqual(Object.keys(ACE_MOTIFS).sort(),Object.keys(PILOTS).sort());
 assert.deepEqual(Object.keys(BOSS_ARRANGEMENTS).sort(),Object.keys(BOSS_CATALOG).sort());
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
test('actual scene routing plays the boss score immediately; final stays on its transport and defeat returns',()=>{
 for(const bossId of Object.keys(BOSS_CATALOG)){
  const {m,notes,advance}=capture();m.setScene({theme:'rural',state:'CALM',intensity:.2},false);advance(2);
  m.setScene({theme:'rural',state:'BOSS',bossId,encounterId:'one',intensity:.6},false);
  assert.equal(m.mode,'boss:'+bossId);assert(m.bossTrack());notes.length=0;advance(2);
  assert(notes.some(n=>n[0]==='tone'&&n[3]>.1),bossId);assert(notes.every(n=>n.slice(1).filter(v=>typeof v==='number').every(Number.isFinite)));
  const step=m.step;m.setScene({theme:'rural',state:'BOSS_FINAL',bossId,encounterId:'one',intensity:.9,parts:.2},false);
  assert.equal(m.step,step);advance(1);assert.equal(m.scene.state,'BOSS_FINAL');
  m.setScene({theme:'rural',state:'COMBAT',intensity:.6},false);assert.equal(m.mode,'rural');assert.equal(m.bossTrack(),null);
 }
});
test('all new regional motifs and all boss final arrangements remain distinct and finite',()=>{
 const maps=new Set();
 for(const theme of Object.keys(REGIONAL_VARIATIONS)){
  const {m,notes,advance}=capture();m.setScene({theme,state:'COMBAT',intensity:.7},false);advance(30);
  assert(notes.length>40);assert(notes.every(n=>n.slice(1).filter(v=>typeof v==='number').every(Number.isFinite)),theme);maps.add(JSON.stringify(notes));
 }
 assert.equal(maps.size,Object.keys(REGIONAL_VARIATIONS).length);
 const bosses=new Set();
 for(const bossId of Object.keys(BOSS_CATALOG)){
  const render=state=>{const {m,notes,advance}=capture();m.setScene({theme:'rural',state,bossId,intensity:.8,parts:state==='BOSS'?1:.2},false);advance(16);return notes;};
  const normal=render('BOSS');assert.notDeepEqual(normal,render('BOSS_FINAL'),bossId);bosses.add(JSON.stringify(normal));
 }
 assert.equal(bosses.size,Object.keys(BOSS_CATALOG).length);
});
test('rail cars lose separate voices and bomber engine loss reduces its pulse',()=>{
 const {m,notes}=capture();const base={theme:'cambrai',state:'BOSS',bossId:'fliegerzug',intensity:.7,cars:{'car-rear':true,'car-middle':true,'car-front':true}};
 m.setScene(base,false);
 const render=()=>{notes.length=0;for(let i=0;i<16;i++)m.bossVariation(i,i*.3,.3,33);return notes.length;};
 let count=render();for(const id of Object.keys(base.cars)){base.cars[id]=false;const after=render();assert.equal(count-after,1,id);count=after;}
 m.setScene({...base,bossId:'paris-staaken-rvi',engines:1},false);notes.length=0;m.bossVariation(2,0,.3,33);const full=notes.at(-1)[4];
 m.scene.engines=.25;notes.length=0;m.bossVariation(2,0,.3,33);assert(notes.at(-1)[4]<full);
});
test('32 beat-locked ace signatures play once, survive mute/pause, and stop before bosses',()=>{
 const motifs=new Set();
 for(const id of Object.keys(ACE_MOTIFS)){
  const {m,notes,advance}=capture(),ace={hp:10},scene={theme:'rural',state:'ACE',ace,aceId:id,intensity:.7};
  m.setScene(scene,false);advance(7);assert.equal(m.signatureCount,1,id);motifs.add(JSON.stringify(notes));
  m.setScene(null,true);const count=notes.length;advance(2);assert.equal(notes.length,count);
  m.setScene(scene,false);advance(2);assert.equal(m.signatureCount,1);
  m.setScene({...scene,state:'BOSS',bossId:'paris-gun',ace:undefined},false);assert.equal(m.intro,null);assert.equal(m.mode,'boss:paris-gun');
  m.reset();m.setScene(scene,false);advance(1);assert.equal(m.signatureCount,1);
 }
 assert.equal(motifs.size,Object.keys(ACE_MOTIFS).length);
});
test('synth sources including ambience and delayed notes are stopped on pause/mute/restart',()=>{
 const param=()=>({value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelAndHoldAtTime(){},cancelScheduledValues(){}});
 const sources=[],node=()=>({connect(){},disconnect(){}}),source=()=>{const n={...node(),frequency:param(),playbackRate:param(),start(t){this.started=t;},stop(t){this.stopped=t;}};sources.push(n);return n;};
 const m=new BattleMusic();m.ctx={currentTime:5,createOscillator:source,createBufferSource:source,createGain:()=>({...node(),gain:param()}),createBiquadFilter:()=>({...node(),frequency:param(),Q:{value:0}})};
 m.bus={...node(),gain:param()};m.noise={};m.tone(50,5,2,.1);m.drum(6,true,.5);m.amb('rural',5,3);assert.equal(m.voices.size,3);
 m.setState('idle',false);assert(sources.every(s=>s.stopped<=5.09));for(const s of sources)s.onended();assert.equal(m.voices.size,0);
 m.tone(50,8,2,.1);m.setState('rural',true);assert.equal(sources.at(-1).stopped,5);sources.at(-1).onended();
 m.tone(50,9,2,.1);m.reset();assert.equal(sources.at(-1).stopped,5);sources.at(-1).onended();assert.equal(m.voices.size,0);
});

test('stage bosses use low-register threat harmony independent of pastoral map melodies',()=>{
 for(const bossId of Object.keys(BOSS_CATALOG)){
  const render=theme=>{const {m,notes,advance}=capture();m.setScene({theme,state:'BOSS',bossId,intensity:.8,parts:1},false);advance(12);return notes;};
  const notes=render('rural');assert.deepEqual(notes,render('sea'),bossId+' threat harmony follows the boss');
  const tones=notes.filter(n=>n[0]==='tone');assert(tones.length>20,bossId);
  assert(tones.every(n=>n[1]<=56),bossId+' no bright upper melody');
  assert(tones.some(n=>n[1]>=34&&n[1]<=44&&n[4]>=.19),bossId+' audible low string pulse');
 }
});

test('every ace introduction stays in the dark register and final boss tempo adds pressure',()=>{
 for(const aceId of Object.keys(ACE_MOTIFS)){
  const {m,notes,advance}=capture();m.setScene({theme:'sky',state:'ACE',aceId,ace:{hp:100},intensity:.8},false);advance(8);
  assert(notes.filter(n=>n[0]==='tone').every(n=>n[1]<=56),aceId+' low introduction');
 }
 const normal=capture(),final=capture();
 for(const [c,state] of [[normal,'BOSS'],[final,'BOSS_FINAL']]){c.m.setScene({theme:'rural',state,bossId:'sms-stuttgart',intensity:.8},false);c.advance(15);}
 assert(final.m.tempo>normal.m.tempo+7);assert(final.notes.length>normal.notes.length);
});
