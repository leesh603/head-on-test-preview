import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {OnlineCoopGame}=await import('../online-coop-game.js');
const {enableStageBoss,beginStageBossFrame}=await import('../stageboss-host.js?v=raid3&rail=18');
const {pack,unpack}=await import('../online-coop-protocol.js');
const {renderStageBossLayer}=await import('../headon-stageboss-render.js?v=raid3');
test('harbor host/guest retain the real crane release, airborne mine, gun warning and facility damage',()=>{
 const start={seed:135,runId:'harbor-online',players:['baron','voss'].map(pilot=>({pilot,plane:'fokker',faction:'central'}))};let host,guest;
 const hostSession={role:'host',send:m=>{guest.receive(JSON.parse(JSON.stringify(m)));return true;}},guestSession={role:'guest',send:m=>{host.receive(m);return true;}};
 host=new OnlineCoopGame(hostSession,start);guest=new OnlineCoopGame(guestSession,start);clearInterval(host._netTimer);clearInterval(guest._netTimer);
 try{enableStageBoss(host,{teamFaction:'central',heavyHp:1.65});host.stageBoss.stages.stageIndex=7;host.region=7;const enc=host.stageBoss.startBoss({x:0,y:-120}),b=enc.bodies.values().next().value;
  const frame={players:host.players.map(p=>({id:p.id,alive:true,x:p.x,y:p.y})),bounds:{left:-500,right:500,top:-600,bottom:600}};b.hit({partId:'gun-left',damage:1e9});b.startCrane(frame.players,frame.bounds);
  for(let i=0;i<500;i++){host.stageBoss.tick(.02,frame);if(b.craneReleaseClock>0)break;}assert(b.craneReleaseClock>0);beginStageBossFrame(host,.1);host.networkTick();
  let copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert.equal(copy.craneState,b.craneState);assert(Math.abs(copy.craneAngle-b.craneAngle)<.001);assert(Math.abs(copy.craneReleaseClock-b.craneReleaseClock)<.001);assert.deepEqual(guest.hostileMinefields.map(f=>f.mines),unpack(pack(host.hostileMinefields.map(f=>f.mines))));assert.equal(guest.hostileMinefields[0].dropMode,'harbor-vertical');assert.equal(guest.hostileMinefields[0].mines[0].triggerRadius,36);
  let model;renderStageBossLayer(guest.stageBoss,{drawBody:b=>model=b,drawPart(){},drawHazard(){}});assert.equal(model.craneReleaseClock,copy.craneReleaseClock);assert(model.parts.find(p=>p.id==='gun-left').destroyed);
  for(let i=0;i<300;i++){host.stageBoss.tick(.02,frame);if(host.bossCues.some(c=>c.harborGun))break;}assert(host.bossCues.some(c=>c.harborGun));host.networkTick();assert.deepEqual(guest.bossCues,unpack(pack(host.bossCues)));
  const field=host.hostileMinefields[0],mine=field.mines[0];host.hostileMinefields=[field];field.warning=0;mine.deploying=false;mine.x=mine.y=0;host.players[0].x=40;host.players[0].y=0;host.players[1].x=300;host.players[1].y=300;host.players[0].invuln=0;const hp=host.players[0].hp;host.updateHazards(.01);host.tickRevisionWorld(.01);assert.equal(mine.dead,false);assert.equal(host.players[0].hp,hp);host.players[0].x=35;host.updateHazards(.01);assert(mine.dead);assert(host.players[0].hp<hp);
  for(const id of ['gun-right','gun-front-left','seaplane-facility','crane-pivot'])b.hit({partId:id,damage:1e9});host.networkTick();copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert(copy.parts.get('seaplane-facility').destroyed);assert.equal(copy.craneState,'collapsed');assert(copy.coreVulnerable);assert.equal(copy.launchRun,null);
 }finally{host.disposeOnline();guest.disposeOnline();}
});
