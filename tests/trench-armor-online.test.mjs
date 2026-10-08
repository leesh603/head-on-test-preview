import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.());}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
const {OnlineCoopGame}=await import('../online-coop-game.js');
const {enableStageBoss}=await import('../stageboss-host.js?v=tame3&rail=16');
const {renderStageBossLayer}=await import('../headon-stageboss-render.js?v=tame3');
for(const [kind,faction,pilots]of [['a7v-flak','entente',['fonck','guynemer']],['mark-v-cruiser','central',['baron','voss']]])test(kind+': real host/guest protocol retains counter-driven belts, rotating guns, marks and part destruction',()=>{
 const start={seed:135,runId:'trench-online-'+kind,players:pilots.map(pilot=>({pilot,plane:pilot==='fonck'?'camel':pilot==='guynemer'?'guynemer_spad':'fokker',faction}))};
 let host,guest;const hostSession={role:'host',send:m=>{guest.receive(JSON.parse(JSON.stringify(m)));return true;}},guestSession={role:'guest',send:m=>{host.receive(m);return true;}};
 host=new OnlineCoopGame(hostSession,start);guest=new OnlineCoopGame(guestSession,start);clearInterval(host._netTimer);clearInterval(guest._netTimer);
 try{enableStageBoss(host,{teamFaction:faction,heavyHp:1.65});host.stageBoss.stages.stageIndex=2;host.region=2;const e=host.stageBoss.startBoss({x:0,y:-120}),b=[...e.bodies.values()][0];assert.equal(b.kind,kind);
  for(let i=0;i<150;i++)b.drive(.02,0,.5);host.networkTick();let copy=guest.stageBoss.stages.encounter.bodies.get(b.id);
  assert(copy.leftTrack.speed>0&&copy.rightTrack.speed<0);assert(Math.abs(copy.hullYaw-b.hullYaw)<.001);assert(copy.trackMarks.length>0);
  let model;renderStageBossLayer(guest.stageBoss,{drawBody:b=>model=b,drawPart(){},drawHazard(){}});assert(model.leftTrack.speed>0&&model.rightTrack.speed<0);assert.equal(model.geometryScale,b.t.geometryScale);
  b.hit({partId:b.gunIds[0],damage:1e9});b.hit({partId:'track-left',damage:1e9});for(let i=0;i<50;i++)b.drive(.02,35,.5);host.networkTick();copy=guest.stageBoss.stages.encounter.bodies.get(b.id);
  assert(copy.parts.get(b.gunIds[0]).destroyed);assert(copy.parts.get('track-left').destroyed);assert.equal(copy.leftTrack.speed,0);assert(Math.abs(copy.angularVelocity)<=.141);
 }finally{host.disposeOnline();guest.disposeOnline();}
});
