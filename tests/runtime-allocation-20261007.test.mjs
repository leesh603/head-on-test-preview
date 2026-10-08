import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {nungesserRoundReaction} from '../pilot-signature-state.js?v=r5';
import {beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash,enemyCanCrash,enemyCrashScale} from '../aircraft-crash.js?v=r5';

// Immutable production implementations, rather than copies of the new loops.
const BASE='4b0dbb171104088a816a10efd5c274c8e2888b60';
const old=file=>execFileSync('git',['show',`${BASE}:${file}`],{encoding:'utf8'});
const now=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const globals={Math,nungesserRoundReaction,
 highRiskDamage:(base,hp,s={})=>base+(hp||0)*(s.maxHpFraction??(s.fieldShell?.025:s.aceSpecial?.04:0)),
 angleDiff:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),live:p=>p?.status==='alive'&&p.hp>0,
 squared:(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2};
function method(source,name,prototype=false){
 const start=source.indexOf(prototype?`Game.prototype.${name}=function`:` ${name}(`);
 assert(start>=0,name);const brace=source.indexOf('{',start);let depth=1,end=brace+1;
 while(depth){const c=source[end++];if(c==='{')depth++;if(c==='}')depth--;assert(end<=source.length)}
 return vm.runInNewContext(prototype?'('+source.slice(source.indexOf('function',start),end)+')':`({${source.slice(start,end)}}).${name}`,globals);
}
const engine=[old('engine.js'),now('engine.js')],coop=[old('coop-engine.js'),now('coop-engine.js')];
const seeded=()=>{let n=17;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/2**32)};
function world(data){
 const g=structuredClone(data),calls=[];
 g.hit=n=>calls.push(['player',g.id,n,g.damageSource?.impactX,g.damageSource?.impactY]);
 g.hitPlayer=(p,n)=>calls.push(['player',p.id,n,p.damageSource?.impactX,p.damageSource?.impactY]);
 g.hitPatrol=(p,n)=>calls.push(['patrol',p.id,n]);g.hitFormationAlly=(p,n)=>calls.push(['ally',p.id,n]);
 g.player=id=>g.players.find(p=>p.id===id);g.living=()=>g.players.filter(globals.live);
 g.revisionDecoyTarget=()=>g.decoy;g.patrolCanEngage=()=>true;
 return {g,calls};
}
for(const isCoop of [false,true])test(`swept ${isCoop?'coop':'solo'} impacts preserve first target, damage and Nungesser reactions over 5000 cases`,()=>{
 const methods=(isCoop?coop:engine).map(s=>method(s,'resolveHostileRound',!isCoop)),r=seeded();
 for(let k=0;k<5000;k++){
  const unit=id=>({id,x:Math.round(r()*160-80),y:Math.round(r()*60-30),hp:r()<.2?0:20,maxHp:100,
   life:r()<.2?0:1,status:r()<.2?'downed':'alive',state:'playing',pilot:k%3?'baron':'nungesser',a:0,skillTime:k%7?0:1,invuln:k%7?0:1});
  const data={...unit('p1'),players:[unit('p1'),unit('p2')],patrols:Array.from({length:k%5},(_,i)=>unit('a'+i)),allies:Array.from({length:k%4},(_,i)=>unit('f'+i))};
  // Include starts inside hitboxes, stationary rounds, flak and exact ties.
  if(k%11===0){for(const p of [...data.players,...data.patrols,...data.allies])p.x=p.y=0;data.x=data.y=0}
  const b={x:k%13?100:0,y:k%2?0:25,vx:400,vy:0,life:1,damage:19,flak:!!(k%2),formationBoss129:!!(k%3),aceSpecial:!!(k%5)},results=[];
  for(const f of methods){const {g,calls}=world(data),round=structuredClone(b);f.call(g,round,k%13?-100:0,0);results.push(plain({calls,round,signature:g.pilotSignatureState,players:g.players.map(p=>p.pilotSignatureState)}))}
  assert.deepEqual(results[1],results[0],`case ${k}`);
 }
});
test('hunt and command selection preserve priority, exclusions, range and stable ties',()=>{
 const hunt=engine.map(s=>method(s,'pickHuntTarget',true)),focus=engine.map(s=>method(s,'goeringFocusTarget')),r=seeded();
 const flags=['stageBossBody','bossMinion','surface','fieldUnit','navalVessel','missionGround','groundEscort','stationary','rivalEscaped','crashed'];
 for(let i=0;i<2000;i++){
  const g={x:0,y:0,a:0,pilot:i%7?'goering':'baron',enemies:Array.from({length:i%61},(_,j)=>({id:j,hp:j%11?100:0,x:Math.round(r()*1600-800),y:Math.round(r()*1600-800),type:j%3?'scout':'bomber',bossPilot:j%9===0?'voss':null,heavyBomber:j%5===0,[flags[j%flags.length]]:j%17===0})),eliteEnemies:{members:Array.from({length:i%5},(_,j)=>({id:'elite'+j,x:j*20,y:30,alive:!!(j%2)}))}};
  if(i%13===0)for(const e of g.enemies)e.x=e.y=0;
  const expected=hunt[0].call(g),actual=hunt[1].call(g);assert.equal(actual?.target,expected?.target);assert.equal(actual?.elite,expected?.elite);
  assert.equal(focus[1].call(g),focus[0].call(g));
 }
 const g={x:0,y:0,a:0,pilot:'goering',enemies:[{x:700,y:0,hp:10},{x:1,y:0},{x:1,y:0,hp:0}]};
 assert.equal(focus[1].call(g),undefined);
});
test('coop target hysteresis, fog, downed players, cloak and patrol priority match',()=>{
 const fns=coop.map(s=>method(s,'enemyCombatTarget')),r=seeded();
 for(let k=0;k<2000;k++){
  const data={players:Array.from({length:2},(_,i)=>({id:'p'+i,x:r()*300,y:r()*300,hp:k%(i+3)?100:0,status:k%(i+5)?'alive':'downed',kaiserFogTime:k%(i+7)?0:2,pilot:'ball',ballCloak:k%11?0:1,ballGhost:{x:-300,y:-300}})),patrols:[],decoy:k%17?null:{x:10,y:20}};
  const e={x:r()*300,y:r()*300,a:0,targetPlayerId:'p'+k%2};if(k%13===0){data.patrols.push({hp:1,life:1,x:1,y:2});e.patrolTarget=data.patrols[0]}
  const results=fns.map(f=>{const {g}=world(data),enemy={...e,patrolTarget:e.patrolTarget?g.patrols[0]:null};return plain({target:f.call(g,enemy),id:enemy.targetPlayerId})});
  assert.deepEqual(results[1],results[0]);
 }
});
function module(source,extra={}){const c=vm.createContext({Math,...extra});vm.runInContext(source.replace(/^import .*$/gm,'').replaceAll('export ',''),c);return c}
test('wing and patrol decisions keep exact movement and RNG over 600 frames',()=>{
 const wing=[old('engagement-flow174.js'),now('engagement-flow174.js')].map(s=>module(s));
 const data={t:0,enemies:Array.from({length:50},(_,j)=>({x:j*17-250,y:(j%5)*30,hp:100})),allies:Array.from({length:6},(_,i)=>({x:-100,y:i*10,a:0,slot:i,engagementState:'HOME'}))};
 const worlds=wing.map(()=>structuredClone(data)),owner={x:0,y:0,a:0,speed:170,pilot:'baron',upgrades:{}};
 for(let frame=0;frame<600;frame++)for(let v=0;v<2;v++){const g=worlds[v];g.t+=.02;for(const w of g.allies)wing[v].wingmanEngagementStep(g,owner,w,{x:-80,y:w.slot*20},.02);if(v)assert.deepEqual(plain(g),plain(worlds[0]))}
 // Reuse the unchanged steering and balance rather than duplicating the AI.
 const balance=engine[0].slice(engine[0].indexOf('export const PATROL_BALANCE='),engine[0].indexOf(';',engine[0].indexOf('export const PATROL_BALANCE='))+1).replace('export ','');
 const fns=engine.map(s=>{const c=vm.createContext({...globals,patrolEngagementStep:wing[0].patrolEngagementStep});vm.runInContext(balance,c);const start=s.indexOf('Game.prototype.updatePatrols=function');return vm.runInContext('('+s.slice(start+'Game.prototype.updatePatrols='.length,s.indexOf('\n};',start)+2)+')',c)});
 const gs=fns.map(()=>({x:0,y:0,t:0,id:'p1',patrolTimer:1000,patrolTargetTimer:0,enemies:structuredClone(data.enemies),patrols:Array.from({length:6},(_,j)=>({x:-100,y:j*20,a:0,hp:j?100:0,life:100,speed:185,think:0,pass:0,fire:0})),bullets:[],rng:seeded(),patrolCanEngage:e=>e.hp>0,supportAuraAt:()=>1}));
 const snapshot=g=>plain({...g,enemies:g.enemies.map(e=>({...e,patrolTarget:g.patrols.indexOf(e.patrolTarget)})),patrols:g.patrols.map(p=>({...p,target:g.enemies.indexOf(p.target)}))});
 for(let i=0;i<600;i++)for(let j=0;j<2;j++){gs[j].t+=.02;fns[j].call(gs[j],.02);if(j)assert.deepEqual(snapshot(gs[j]),snapshot(gs[0]))}
 assert.equal(gs[1].rng(),gs[0].rng());
});
test('signature expiry and burning-target transition keep effects and cue timing',()=>{
 const mods=[old('pilot-signature-state.js'),now('pilot-signature-state.js')].map(s=>module(s));
 const p=()=>({id:'p1',pilot:'luke',x:0,y:0,a:0,hp:100,maxHp:100,state:'playing',skillTime:0}),ps=mods.map(p);
 for(let i=0;i<60;i++)for(let j=0;j<2;j++)mods[j].signatureCue(ps[j],i%2?'incendiaryImpact':'shotAccent',{life:.1+i*.01,target:{x:i,y:10,hp:i%3?10:0}});
 const ref=mods[1].signatureState(ps[1]).effects;
 for(let i=0;i<180;i++)for(let j=0;j<2;j++){mods[j].advancePilotSignature(ps[j],.02);if(j)assert.deepEqual(plain(ps[j]),plain(ps[0]))}
 assert.equal(mods[1].signatureState(ps[1]).effects,ref);assert.equal(ref.length,0);
});
test('combat FX preserve draws, sound, state and decay for a full moving encounter',()=>{
 const deps={beginAircraftCrash,advanceAircraftCrash,drawAircraftCrash,enemyCanCrash,enemyCrashScale};
 const mods=[old('combat-feedback.js'),now('combat-feedback.js')].map(s=>module(s,deps));
 const states=mods.map(c=>{const e={x:700,y:30,a:Math.PI,hp:30,maxHp:100,type:'hunter',speed:200},g={t:0,state:'playing',x:0,y:0,a:0,hp:100,maxHp:100,viewWidth:390,enemies:[e],bullets:[],particles:[],events:[],burst(){},smoke(){},event(){},specialRoundImpact(){},update(dt){this.t+=dt;e.x-=200*dt}},sounds=[];const state=c.attachCombatFeedback(g,{play:(...args)=>sounds.push(args)});return{c,g,e,state,sounds}});
 const refs=['impacts','plumes','passes','wrecks','trail'].map(k=>states[1].state[k]);
 for(let i=0;i<600;i++){
  const results=states.map(({c,g,e,state,sounds})=>{if(i%7===0)g.specialRoundImpact({x:e.x+20,y:e.y,vx:400,vy:0},e);if(i===200)e.hp=0;g.update(.02);const draws=[];const ctx=new Proxy({}, {get:()=> (...args)=>draws.push(args),set:(o,k,v)=>{draws.push([k,v]);return true}});c.drawCombatFeedback(ctx,g,(x,y)=>[x,y],{fx:(...args)=>draws.push(args),planeSprite:(...args)=>draws.push(args)});return plain({draws,sounds,impacts:state.impacts,plumes:state.plumes,passes:state.passes,pose:c.combatVisualPose(e)})});
  assert.deepEqual(results[1],results[0],`frame ${i}`);
 }
 for(const [i,k]of ['impacts','plumes','passes','wrecks','trail'].entries())assert.equal(states[1].state[k],refs[i]);
});
test('Ma’an QA rejects other layout-based bosses and retains both desert hulls',()=>{
 const source=now('app.js'),start=source.indexOf(' const maanInspect='),end=source.indexOf(' const advanceVerdun=',start);
 const body=kind=>({id:kind,kind,layout:{},phase:'advance',entryAge:10,entryDuration:9,x:0,y:0,hp:100,maxHp:100,parts:new Map([['gun',{id:'gun',hp:10,maxHp:10,x:1,y:2,destroyed:false}]])});
 for(const kind of ['paris-staaken-rvi','paris-searchlight-fortress','wustenpanzer','sinai-landship']){
  const b=body(kind),bodies=new Map([[kind,b]]),game={stageBoss:{stages:{encounter:{bodies}}},bullets:[]},c=vm.createContext({game});
  vm.runInContext(source.slice(start,end)+'\nthis.inspect=maanInspect;this.probe=maanProbe;',c);
  if(kind.startsWith('paris')){assert.equal(c.inspect(),null);assert.equal(c.probe('gun'),false);assert.equal(game.bullets.length,0)}
  else{assert.equal(c.inspect().kind,kind);assert.equal(c.inspect().entry,10);assert.equal(c.probe('gun'),true);assert.equal(game.bullets.length,1)}
 }
});
if(process.argv.includes('--benchmark')){
 const rounds=coop.map(s=>method(s,'resolveHostileRound')),hunts=engine.map(s=>method(s,'pickHuntTarget',true));
 const data={x:0,y:0,hp:100,players:[{id:'p1',x:0,y:0,hp:100,status:'alive'},{id:'p2',x:100,y:0,hp:100,status:'alive'}],patrols:Array.from({length:6},(_,i)=>({id:i,x:i*30,y:30,hp:100,life:1})),allies:Array.from({length:4},(_,i)=>({id:i,x:i*30,y:-30,hp:100,life:1}))};
 const gs=rounds.map(()=>world(data).g),b={x:300,y:200,life:1,damage:10,formationBoss129:true};
 const h={x:0,y:0,enemies:Array.from({length:80},(_,i)=>({x:i*5,y:i*3,hp:100,type:'bomber',heavyBomber:i%3===0})),eliteEnemies:{members:[]}};
 for(const [label,fns,hosts,args]of [['coop swept rounds',rounds,gs,[b,-300,200]],['hunt target',hunts,[h,h],[]]]){
  const samples=[[],[]];for(let n=0;n<9;n++)for(const j of n%2?[1,0]:[0,1]){let checksum=0;const start=performance.now();for(let i=0;i<50000;i++)checksum+=!!fns[j].apply(hosts[j],args);if(n>1)samples[j].push(performance.now()-start)}
  const med=x=>x.sort((a,b)=>a-b)[Math.floor(x.length/2)];console.log(label,{beforeMs:med(samples[0]),afterMs:med(samples[1]),queries:50000});
 }
}
