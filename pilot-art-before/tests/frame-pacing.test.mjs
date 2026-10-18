import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const view=readFileSync(new URL('../stageboss-view.js',import.meta.url),'utf8');
function loop(source=app,options={}){
 const frames=[],samples=[],scheduled=[],resizes=[];
 const c=vm.createContext({mobileDisplay:true,hiFpsMode:false,batterySaver:false,renderStamp:-1e9,__perfResize:false,
  performance:{now:()=>0},requestAnimationFrame:f=>scheduled.push(f),resize:()=>resizes.push(1),
  frameInner:t=>frames.push(t),__perfFrame:ms=>samples.push(ms),...options});
 vm.runInContext(source.slice(source.indexOf('function frame(now){'),source.indexOf('roster();syncStartHint();resize();requestAnimationFrame(frame);')),c);
 return{c,frames,samples,scheduled,resizes,run:t=>c.frame(t)};
}
function timeline(hz,seconds=10,jitter=false){return Array.from({length:hz*seconds+1},(_,i)=>i*1000/hz+(jitter&&i%2?.8:0))}
function oldFrames(times,saver=false){let stamp=-1e9;const result=[];for(const t of times){const cap=saver?24:15.9;if(t-stamp>=0&&t-stamp<cap)continue;stamp=t;result.push(t)}return result}
test('60/90/120/144 Hz displays retain 60 rendered frames per second',()=>{
 for(const hz of [60,90,120,144]){const x=loop();for(const t of timeline(hz))x.run(t);assert(Math.abs(x.frames.length-601)<=1,`${hz} Hz: ${x.frames.length}`);assert.equal(x.samples.length,x.frames.length)}
});
test('timestamp jitter does not drop every other 60 Hz frame',()=>{
 const times=timeline(60,10,true),x=loop();times.forEach(x.run);assert.equal(x.frames.length,times.length);
 assert(oldFrames(times).length<times.length*.8,'baseline reproduces missed frames');
});
test('skipped callbacks neither sample performance nor resize the canvas',()=>{
 const x=loop();x.run(0);x.c.__perfResize=true;x.run(8.333);assert.equal(x.samples.length,1);assert.equal(x.resizes.length,0);assert.equal(x.c.__perfResize,true);
 x.run(16.667);assert.equal(x.resizes.length,1);assert.equal(x.samples.length,2);
});
test('desktop and high-FPS setting render every callback; saver retains its 24 ms budget',()=>{
 for(const options of [{mobileDisplay:false},{hiFpsMode:true}]){const x=loop(app,options);timeline(144,1).forEach(x.run);assert.equal(x.frames.length,145)}
 for(const hz of [60,90,120,144]){const x=loop(app,{batterySaver:true});timeline(hz).forEach(x.run);assert(Math.abs(x.frames.length-417)<=1,`${hz} Hz saver: ${x.frames.length}`)}
});
test('resume and settings changes do not catch up a backlog or stall',()=>{
 const x=loop();[0,8.33,16.67,5000,5008.33,5016.67].forEach(x.run);assert.equal(x.frames.length,4);
 x.c.hiFpsMode=true;x.run(5025);x.c.hiFpsMode=false;x.run(5033.33);x.run(5041.67);assert.equal(x.frames.length,6);
});
function hud(){
 const nodes=new Map(),node=()=>({textContent:'',style:{},classList:{toggle(){}},setAttribute(){},append(){}});
 const c=vm.createContext({performance:{now:()=>c.now},now:0,document:{body:node(),getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)}},
  bossHudModel:e=>{c.calls++;return{...e.snapshot(),bossId:e.id,name:e.id}},getLocale:()=> 'ko',BOSS_NAMES_EN:{},bossTactic:()=>'',calls:0});
 vm.runInContext(view.slice(view.indexOf('let sbHudAt='),view.indexOf('const buildingGroup=')).replace('export function','function'),c);
 const encounter=id=>({id,completed:false,hp:100,snapshot(){return{hp:this.hp,maxHp:100,fraction:this.hp/100,aliveParts:2,totalParts:2}}});
 const e=encounter('boss'),g={state:'playing',stageBoss:{stages:{phase:'boss',encounter:e}}};
 return{c,g,e,nodes,encounter,run:t=>{c.now=t;c.updateStageBossHud(g)}};
}
test('boss aggregation follows the existing 90 ms HUD cadence',()=>{
 const x=hud();for(let i=0;i<600;i++)x.run(i*1000/60);assert.equal(x.c.calls,100);x.e.hp=42;x.run(10010);assert.match(x.nodes.get('stageBossParts').textContent,/42 \/ 100/);
});
test('boss swap/completion/loss/reset refresh immediately inside the throttle window',()=>{
 const x=hud();x.run(0);x.g.stageBoss.stages.encounter=x.encounter('next');x.run(1);assert.equal(x.nodes.get('stageBossTitle').textContent,'next');assert.equal(x.c.calls,2);
 x.g.stageBoss.stages.encounter.completed=true;x.run(2);assert.equal(vm.runInContext('sbHudModel',x.c),null);
 x.g.stageBoss.stages.encounter=x.encounter('third');x.run(3);assert.equal(x.c.calls,3);
 x.g.state='lost';x.run(4);assert.equal(vm.runInContext('sbHudModel',x.c),null);
 x.g.state='playing';x.run(5);assert.equal(x.c.calls,4);x.g.stageBoss=null;x.run(6);assert.equal(vm.runInContext('sbHudEncounter',x.c),null);
});
test('co-op XP continues refreshing without a boss model',()=>{
 const x=hud();x.g.mode='coop2';x.g.players=[{id:'p1',level:2,xp:5,need:10}];x.g.stageBoss.stages.encounter=null;x.run(100);assert.equal(x.nodes.get('p1XpLabel').textContent,'P1 · LV. 2');x.g.players[0].level=3;x.run(200);assert.equal(x.nodes.get('p1XpLabel').textContent,'P1 · LV. 3');
});
console.log('Pacing reproduction (10 seconds):',Object.fromEntries([60,90,120,144].map(hz=>{const times=timeline(hz,10,true),x=loop();times.forEach(x.run);return[hz,{before:oldFrames(times).length,after:x.frames.length}]})));
