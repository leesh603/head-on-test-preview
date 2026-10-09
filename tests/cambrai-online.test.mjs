import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.());}};globalThis.document??={createElement:()=>({getContext:()=>null})};
const {OnlineCoopGame}=await import('../online-coop-game.js');const {enableStageBoss}=await import('../stageboss-host.js?v=tame3&rail=39');const {renderStageBossLayer}=await import('../headon-stageboss-render.js?v=tame3');
const near=(a,b)=>assert.ok(Math.abs(a-b)<.002,`${a} != ${b}`);
for(const faction of ['central','entente'])test(`Cambrai ${faction} host/guest retain launch origins, heavy wheel motion, pending attacks and damage`,()=>{
 const pilots=faction==='central'?['baron','voss']:['fonck','guynemer'],start={seed:135,runId:'cambrai-online',players:pilots.map(pilot=>({pilot,plane:faction==='central'?'fokker':'spad',faction}))};let host,guest;
 const hs={role:'host',send:m=>{guest.receive(JSON.parse(JSON.stringify(m)));return true;}},gs={role:'guest',send:m=>{host.receive(m);return true;}};
 host=new OnlineCoopGame(hs,start);guest=new OnlineCoopGame(gs,start);clearInterval(host._netTimer);clearInterval(guest._netTimer);
 try{enableStageBoss(host,{teamFaction:faction,heavyHp:1.65});host.region=8;host.stageBoss.stages.stageIndex=8;const b=host.stageBoss.startBoss({x:0,y:0}).bodies.values().next().value;b.hp=b.maxHp*.4;
  const frame={players:host.players.map((p,i)=>({id:p.id,alive:true,x:120+i*30,y:faction==='central'?620:-230,vx:0,vy:0})),bounds:{left:-500,right:500,top:-400,bottom:1500}};
  for(let i=0;i<100;i++)host.stageBoss.tick(.02,frame);host.networkTick();let copy=guest.stageBoss.stages.encounter.bodies.get(b.id),model;renderStageBossLayer(guest.stageBoss,{drawBody:b=>model=b,drawPart(){},drawHazard(){}});
  assert.equal(copy.combatPhase,3);near(copy.x,b.x);near(copy.y,b.y);
  if(faction==='central'){assert(copy.finalRaid);const p=b.parts.get('car-launch-a');assert(p.launchWarmup>0);near(copy.parts.get(p.id).launchWarmup,p.launchWarmup);assert.deepEqual(copy.parts.get(p.id).launchTarget,p.launchTarget);
   for(let i=0;i<100;i++)host.stageBoss.tick(.02,frame);host.networkTick();const bugs=host.enemies.filter(e=>e.bugDrone);assert(bugs.length);assert.deepEqual(guest.enemies.filter(e=>e.bugDrone).map(e=>e.launchPortId),bugs.map(e=>e.launchPortId));
   b.hit({partId:'car-launch-a',damage:1e9});host.networkTick();copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert(copy.parts.get('car-launch-a').destroyed);near(copy.parts.get('car-supply').detachedPose.y,b.parts.get('car-supply').detachedPose.y);assert.equal(copy.parts.get('car-launch-a').launchWarmup,0);
  }else{assert(copy.finalDrive);near(copy.wheelRollLeft,b.wheelRollLeft);near(copy.wheelRollRight,b.wheelRollRight);near(model.wheelRollLeft,b.wheelRollLeft);near(model.wheelRollRight,b.wheelRollRight);near(copy.heading,b.heading);assert.notEqual(copy.wheelRollLeft,copy.wheelRollRight);
   for(const id of ['wheel-left','wheel-right'])b.hit({partId:id,damage:1e9});host.networkTick();copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert.equal(copy.finalDrive,null);assert.equal(copy.driveVelocity,0);assert(copy.coreVulnerable);assert(copy.parts.get('wheel-left').destroyed);b.hit({partId:'turret',damage:1e9});host.networkTick();assert.equal(guest.stageBoss.stages.encounter.bodies.get(b.id).flakLock,null);
  }
 }finally{host.disposeOnline();guest.disposeOnline();}
});
