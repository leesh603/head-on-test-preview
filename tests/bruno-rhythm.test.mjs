import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {brunoRhythmSalvo,brunoFragments,brunoSalvo} from '../bruno-raid.js?v=tame3';
import {RuralRailBoss} from '../rural-rail-combat.js?v=tame3';
import {BossHazards} from '../headon-stageboss-hazards.js';
const target={x:0,y:0,vx:0,vy:-180};
const tuning={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,warningSeconds:1.15,railCycle:5.4};
const bounds=width=>({left:-width/2,right:width/2,top:-500,bottom:500});
function make(kind='paris-gun',width=390){
 const events=[],hits=[],hazards=new BossHazards({onDamage:(id,n,h)=>hits.push({id,n,visual:h.visual}),onStatus(){},onBarrierContact(){}});
 const b=new RuralRailBoss({id:'bruno',x:0,y:-190,tuning,faction:'central',emit:e=>{
  events.push({...e,time:b?.ruralClock||0});
  if(e.type==='hazard')hazards.spawn({...e,encounterId:'qa'});
  if(e.type==='cancel-hazards')hazards.clearTagged('qa',e.tag);
 }},kind);
 const frame={players:[{...target,id:'p1',alive:true,radius:12}],bounds:bounds(width)};
 const step=(dt=.02,ctx=frame)=>{b.update(dt,ctx);hazards.update(dt,ctx);};
 const run=(seconds,dt=.02)=>{for(let t=0;t<seconds-1e-8;t+=dt)step(Math.min(dt,seconds-t));};
 const aim=()=>{b.rail129.target=null;b.rail129.enter('aim');step();};
 return{b,events,hits,hazards,frame,step,run,aim};
}
function damageOnRoute(plan,follow,coop=false){
 const hits=[],h=new BossHazards({onDamage:id=>hits.push(id),onStatus(){},onBarrierContact(){}});
 for(const p of plan.points){
  h.spawn({encounterId:'qa',kind:'circle',...p,damage:18,delay:2*plan.beat+p.at,warning:plan.warning,duration:plan.duration,once:true});
  if(p.heavy)for(const f of brunoFragments(plan,p))h.spawn({...f,encounterId:'qa',damage:5.76,delay:2*plan.beat+p.at+plan.warning});
 }
 let side=0;const dt=1/120;
 for(let t=dt;t<2*plan.beat+plan.end+.1;t+=dt){
  if(follow){
   // Bounded 150 world-units/s lateral route; no teleport and no immunity.
   const next=plan.gaps.find(g=>2*plan.beat+g.at+.16>=t)||plan.gaps.at(-1);
   const delta=next.side-side;side+=Math.max(-150*dt,Math.min(150*dt,delta));
  }
  const players=[{id:'p1',alive:true,radius:12,x:target.vx*t+plan.nx*side,y:target.vy*t+plan.ny*side}];
  if(coop)players.push({...players[0],id:'p2',x:players[0].x+plan.nx*24,y:players[0].y+plan.ny*24});
  h.update(dt,{players});
 }
 assert.equal(h.pool.count,0);assert.equal(h.pool.dropped,0);return hits;
}
for(const width of [320,390,487.5,640,720,840,960])for(const phase of [1,2])for(const shot of [0,1]){
 test(`${width}px phase ${phase} side ${shot}: real hits on straight flight, no hits through gaps`,()=>{
  const plan=brunoRhythmSalvo(target,phase,shot,bounds(width));
  for(let row=0;row<4;row++){const p=plan.points.filter(p=>p.row===row);assert(p.length>=6&&p.length<=10);}
  assert(damageOnRoute(plan,false).length>0,'ordinary forward flight must not trivialize the pattern');
  assert.equal(damageOnRoute(plan,true).length,0,'telegraphed route must remain open, including fragments');
 });
}
test('eight real fragments do not cross their heavy round escape corridor',()=>{
 for(const shot of [0,1]){const plan=brunoRhythmSalvo(target,2,shot,bounds(390)),p=plan.points.find(p=>p.heavy),gap=plan.gaps[p.row],shots=brunoFragments(plan,p);assert.equal(shots.length,8);
  const sign=Math.sign((p.x-gap.x)*plan.nx+(p.y-gap.y)*plan.ny);
  for(const s of shots)assert((s.vx*plan.nx+s.vy*plan.ny)*sign>0);
 }
});
test('native controller exposes all four beats and no first/second beat damage',()=>{
 const {b,events,aim,run}=make();aim();assert.equal(b.brunoBeat,1);run(.8);assert.equal(b.brunoBeat,2);
 assert.equal(events.filter(e=>e.type==='hazard').length,0);run(.84);assert.equal(b.brunoBeat,3);run(.82);assert.equal(b.brunoBeat,4);
 run(1.8);assert.equal(events.filter(e=>e.type==='heavy-gun-fired').length,4);assert(events.filter(e=>e.kind==='projectile').length>=8);
 const cues=events.filter(e=>e.beat===2||e.beat===3);assert(Math.abs(cues[1].time-cues[0].time-.8)<.04);
});
for(const width of [390,720,960])for(const dt of [1/120,1/30,.25])test(`${width}px dt ${dt}: real pool empty for the entire 3.2s counter window`,()=>{
 const {b,events,hazards,aim,step}=make('paris-gun',width);aim();let started=false,seconds=0,n=0;
 for(let t=0;t<15;t+=dt){step(dt);if(b.recovery>0){if(!started){started=true;n=events.filter(e=>e.type==='hazard').length;}seconds+=dt;
  assert.equal(hazards.pool.count,0,'no lingering projectile during counter');assert.equal(events.filter(e=>e.type==='hazard').length,n);
 }else if(started)break;}
 assert(started);assert(seconds>=3.2-dt-.02);assert.equal(hazards.pool.dropped,0);
});
test('observer destruction cancels unfired rhythm and never samples the new player position',()=>{
 const {b,aim,step,frame}=make();b.hit({partId:'car-rear',damage:1e6});aim();const old={...b.aimPlan.target};b.hit({partId:'car-middle',damage:1e6});frame.players[0].x=9999;frame.players[0].y=9999;step();
 assert(b.aimPlan.blind);assert.deepEqual(b.aimPlan.target,{...old,vx:0,vy:0});assert(b.aimPlan.points.every(p=>p.x<1000&&p.y<1000));
});
test('co-op target selection alternates by existing rail shot counter',()=>{
 const {b,frame,aim,run}=make();frame.players.push({...frame.players[0],id:'p2',x:120});aim();assert.equal(b.aimPlan.target.x,0);run(2);aim();assert.equal(b.aimPlan.target.x,120);
});
test('pause freezes rhythm cues, shell schedule, and recovery clock',()=>{
 const {b,events,aim,run,step,frame}=make();aim();run(2);const state=structuredClone(b.barrage),clock=b.ruralClock,n=events.length;for(let i=0;i<20;i++)step(.1,{...frame,paused:true});
 assert.equal(b.ruralClock,clock);assert.deepEqual(b.barrage,state);assert.equal(events.length,n);
});
for(const broken of [false,true])test(`original sequential parts, 28% iron rain and derail preserved: rail broken=${broken}`,()=>{
 const {b,aim,run,events,hazards}=make();aim();run(2);if(broken)b.hit({partId:'rail',damage:1e6});
 assert.equal(b.hit({partId:'car-front',damage:1e6}).damage,0);for(const id of b.railCarOrder)b.hit({partId:id,damage:1e6});b.hit({damage:1e6});
 assert.equal(b.hp,b.maxHp*.28);assert.equal(b.barrage.points.length,broken?2:6);assert.equal(b.recovery,0);assert.equal(b.brunoAttackUntil,0);
 assert(!hazards.pool.records.some(h=>h.active&&h.tag==='bruno:bruno-salvo'));run(broken?.95:3.35);assert(b.derailed129);assert(b.coreVulnerable);assert.equal(events.filter(e=>e.type==='bruno-iron-rain').length,1);
});
test('520mm keeps its original round, aim timing, damage and smoke',()=>{
 const {b,events,aim,run}=make('lincomparable');aim();assert.equal(b.rail129.c.aimSeconds,1.8);assert.equal(b.aimPlan.mode,'heavy-shell');assert.equal(b.aimPlan.rhythm,undefined);run(2);
 assert.equal(b.railGun.shotCount,1);assert.equal(b.barrage,null);assert.equal(events.filter(e=>e.visual==='rail-shell').length,1);assert(events.some(e=>e.visual==='rural-rail-shock'));assert(events.some(e=>e.visual==='rural-rail-smoke'));
});

for(const width of [320,390,487.5,640,720,840,960])test(`${width}px: both co-op pilots fit the moving gap`,()=>{
 for(const shot of [0,1])assert.equal(damageOnRoute(brunoRhythmSalvo(target,2,shot,bounds(width)),true,true).length,0);
});
test('Bruno recovery renders from the body snapshot assetKey, not an absent kind',()=>{
 // Canvas contract test only, not a screenshot or a real browser play test.
 const source=readFileSync(new URL('../rural-rail-render.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/export function /g,'function ');
 const scope={RURAL_CARS:[],RAIL_GUN_RIGS:{},railSuspension:()=>0,getLocale:()=> 'ko'};
 runInNewContext(source+';this.draw=drawRuralRail;',scope);
 const text=[],c=new Proxy({fillText:value=>text.push(value)},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 scope.draw(c,{assetKey:'paris-gun',recovery:3.2,railCars:[]},{},{});
 assert(text.includes('재장전 · 반격'));
 text.length=0;scope.draw(c,{assetKey:'paris-gun',recovery:0,railCars:[]},{},{});assert.equal(text.length,0);
});
test('gap warnings remain attached until the last committed shell resolves',()=>{
 const {b,aim,run,step}=make();aim();run(4.3);assert(b.barrage?.rhythm);assert.equal(b.barrage.index,b.barrage.points.length);assert.equal(b.recovery,0);
 while(b.ruralClock<b.brunoAttackUntil+.02)step();assert.equal(b.barrage,null);assert(b.recovery>0);
});
test('latest main pre-placed markers are preserved for the entire rhythm salvo',()=>{
 const {b,events,aim,run}=make();aim();run(1.65);const plan=b.barrage,shots=events.filter(e=>e.kind==='circle'&&e.visual==='rail-shell');
 assert.equal(shots.length,plan.points.length);
 shots.forEach((s,i)=>{assert.equal(s.delay,0);assert.equal(s.warning,plan.warning+plan.points[i].at);assert.equal(s.radius,plan.points[i].radius);});
});
test('latest main 520mm final shrapnel fan is preserved',()=>{
 const {b,events,aim,run}=make('lincomparable');aim();for(const id of b.railCarOrder)b.hit({partId:id,damage:1e6});b.hit({damage:1e6});run(3);
 const shards=events.filter(e=>e.visual==='rail-shrapnel');assert.equal(shards.length,8);assert(shards.every(e=>e.kind==='projectile'&&e.duration===2.4&&e.damage===tuning.damage*.3));
});
