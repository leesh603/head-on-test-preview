import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Image??=class{set src(v){queueMicrotask(()=>this.onload?.())}};globalThis.document??={createElement:()=>({getContext:()=>null})};
const {OnlineCoopGame}=await import('../online-coop-game.js');const {enableStageBoss}=await import('../stageboss-host.js?v=tame3&rail=40');
for(const faction of ['central','entente'])test(`Verdun ${faction} host/guest retain real fortress orders, hatch/recoil, repairs and destruction`,()=>{
 const pilots=faction==='central'?['baron','voss']:['fonck','guynemer'],start={seed:135,runId:'verdun-online',players:pilots.map(pilot=>({pilot,plane:faction==='central'?'fokker':'spad',faction}))};let host,guest;
 const hs={role:'host',send:m=>{guest.receive(JSON.parse(JSON.stringify(m)));return true}},gs={role:'guest',send:m=>{host.receive(m);return true}};
 host=new OnlineCoopGame(hs,start);guest=new OnlineCoopGame(gs,start);clearInterval(host._netTimer);clearInterval(guest._netTimer);
 try{enableStageBoss(host,{teamFaction:faction});host.region=12;host.stageBoss.stages.stageIndex=12;const b=host.stageBoss.startBoss({x:0,y:-500}).bodies.values().next().value;
  const frame={players:host.players.map((p,i)=>({id:p.id,alive:true,x:20+i*30,y:0,vx:0,vy:0})),bounds:{left:-195,right:195,top:-422,bottom:422}};
  for(let i=0;i<450;i++)host.stageBoss.tick(.02,frame);b.hp=b.maxHp*.38;for(let i=0;i<150;i++)host.stageBoss.tick(.02,frame);host.networkTick();let copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert(copy.lastStand);assert.equal(copy.lastStand.index,b.lastStand.index);assert(Math.abs(copy.lastStand.age-b.lastStand.age)<.002);assert.equal(copy.fortScale,b.fortScale);
  for(const p of b.parts.values()){const q=copy.parts.get(p.id);assert(Math.abs(q.openAmount-p.openAmount)<.002);assert(Math.abs(q.recoil-p.recoil)<.002);assert(Math.abs(q.angle-p.angle)<.002);}
  const p=b.parts.get('aa-left');b.hit({partId:p.id,damage:1e9});host.networkTick();copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert(copy.parts.get(p.id).destroyed);assert.equal(copy.parts.get(p.id).repairRemaining,18);
  for(const part of b.parts.values()){part.hittable=true;b.hit({partId:part.id,damage:1e9});}for(let i=0;i<200;i++)host.stageBoss.tick(.02,frame);host.networkTick();copy=guest.stageBoss.stages.encounter.bodies.get(b.id);assert(copy.coreVulnerable);assert.equal(copy.parts.get(p.id).repairRemaining,0);
  b.hit({damage:1e9});host.networkTick();assert(guest.stageBoss.stages.encounter.bodies.get(b.id).dead);
 }finally{host.disposeOnline();guest.disposeOnline();}
});
