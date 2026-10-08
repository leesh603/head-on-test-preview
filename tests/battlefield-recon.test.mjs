import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {Game}=await import('../engine.js?v=tame3&rail=15');
const {BATTLEFIELD_EVENT_BALANCE,BATTLEFIELD_EVENT_TYPES}=await import('../battlefield-events170.js?v=tame3');


const make=()=>{
 const g=new Game('fokker','baron',()=>.5);
 g.state='playing';g.t=BATTLEFIELD_EVENT_BALANCE.firstOfferAt+1;g.battleDirectorPattern='RECOVERY';g.enemies=[];
 return g;
};

const offer=g=>g.offerBattlefieldEvent(BATTLEFIELD_EVENT_TYPES.PHOTO_RECON);

const step=(g,seconds,perStep)=>{
 const n=Math.ceil(seconds/.05);
 for(let i=0;i<n;i++){g.t+=.05;perStep?.();g.tickBattlefieldEvents()}
};

test('photo recon offer scatters sequential waypoints without enemy targets',()=>{
 const g=make(),ev=offer(g);
 assert.ok(ev,'offer accepted');
 assert.equal(ev.type,'PHOTO_RECON');
 assert.equal(ev.targets.length,0);
 assert.equal(ev.waypoints.length,BATTLEFIELD_EVENT_BALANCE.reconCount);
 for(const wp of ev.waypoints){assert.equal(wp.done,false);assert.ok(Math.hypot(wp.x-g.x,wp.y-g.y)>=240)}
 for(let i=1;i<ev.waypoints.length;i++)assert.ok(Math.hypot(ev.waypoints[i].x-ev.waypoints[i-1].x,ev.waypoints[i].y-ev.waypoints[i-1].y)>=BATTLEFIELD_EVENT_BALANCE.reconMinGap*.99);
 assert.ok(ev.deadline-g.t>=80);
});

test('holding over each waypoint captures them in order and completes with supply drops',()=>{
 const g=make(),ev=offer(g);
 for(const wp of ev.waypoints){
  // First waypoint drains while the player stays away from it.
  if(wp===ev.waypoints[0]){g.x=wp.x+400;g.y=wp.y;step(g,.4);assert.equal(wp.done,false);assert.equal(wp.progress,0)}
  g.x=wp.x;g.y=wp.y;
  step(g,1.3);
  assert.equal(wp.done,true,'waypoint captured');
 }
 step(g,.1);
 const result=g.battlefieldEvents.result;
 assert.equal(result.outcome,'completed');
 const drops=(g.drops||[]).filter(d=>d.battlefieldEvent);
 assert.ok(drops.some(d=>d.heal&&d.supply),'heal supply drop awarded');
 assert.ok(drops.filter(d=>!d.heal).length>=4,'xp drops awarded');
});

test('recon mission fails when the deadline passes',()=>{
 const g=make(),ev=offer(g);
 step(g,1);
 g.t=ev.deadline+.01;
 g.tickBattlefieldEvents();
 assert.equal(g.battlefieldEvents.result.outcome,'failed');
 assert.equal(g.battlefieldEvents.result.reason,'timeExpired');
});
