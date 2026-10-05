import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload?.())}};
globalThis.document={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=479'),{CoopGame}=await import('../coop-engine.js?v=479'),{enableStageBoss,endStageBossFrame,stageBossCollision,damageStageBoss}=await import('../stageboss-host.js?v=479');
const results=[];
for(const mode of ['solo','coop'])for(const faction of ['central','entente'])for(const width of [390,1440]){
 const pilot=faction==='central'?'baron':'fonck';
 const g=mode==='solo'?new Game(faction==='central'?'fokker':'spad',pilot,()=>.5):new CoopGame([{pilot},{pilot}],{rng:()=>.5});
 g.viewWidth=width;g.viewHeight=844;g.nextHeavyAt=Infinity;g.nextBossAt=Infinity;g.region=14;
 enableStageBoss(g,{teamFaction:faction});g.stageBoss.stages.stageIndex=14;g.stageBoss.stages.orderPosition=g.stageBoss.stages.order.indexOf(14);
 const e=g.stageBoss.startBoss({x:g.x,y:g.y-280}),b=[...e.bodies.values()][0];
 for(const p of g.players||[g])p.invuln=Infinity;
 let maxHazards=0,maxSand=0,hostDamage=null,maxInterceptors=0,repairedLeft=false;
 const interceptorIds=new Set();
 for(let i=0;i<1500;i++){
  if(mode==='solo')g.update(.04,{inputMode:'gamepad',fireHeld:false,angle:-Math.PI/2+Math.sin(i*.01)*.25});else g.update(.04,{});
  assert.equal(g.state,'playing');assert(Number.isFinite(b.x)&&Number.isFinite(b.y));
  const fighters=g.enemies.filter(e=>e.gallipoliInterceptor&&e.hp>0);maxInterceptors=Math.max(maxInterceptors,fighters.length);assert(fighters.length<=4);for(const e of fighters){interceptorIds.add(e.id);assert.equal(e.escortPlane,b.faction==='central'?'eindecker':'nieuport11');if(e.launchAge<1.2){assert(Math.abs(e.a-Math.PI/2)<1e-8);assert(Math.abs(e.x-(b.x-460))<1e-8);assert(e.y>=b.y-215);assert(e.fire>1.6);}}
  if(i>700&&b.parts.get('left').hp===b.parts.get('left').maxHp)repairedLeft=true;
  maxHazards=Math.max(maxHazards,g.stageBoss.hazards.pool.count);maxSand=Math.max(maxSand,g.maanWeather?.cells.length||0);
  if(i===185){
   const p=b.parts.get('observer'),point={x:b.x+p.x,y:b.y+p.y},proxy=g.enemies.find(q=>q.stageBossBody===b);
   const shot={...point,previousX:point.x-2,previousY:point.y,ownerId:'p1',radius:1};assert(stageBossCollision(g,proxy,shot.x,shot.y,shot));const hp=p.hp;damageStageBoss(g,proxy,shot,20);hostDamage=hp-p.hp;assert(hostDamage>0);const left=b.parts.get('left'),hit={x:b.x+left.x,y:b.y+left.y,previousX:b.x+left.x,previousY:b.y+left.y,ownerId:'p1',radius:1};damageStageBoss(g,proxy,hit,1e9);assert(left.destroyed);
  }
 }
 assert.equal(b.entryAge,5);assert.equal(g.stageBoss.hazards.pool.dropped,0);assert(maxHazards<80);assert(maxSand<=(width<720?2:3));
 assert(repairedLeft);assert(interceptorIds.size>=4);
 const pausedState=()=>JSON.stringify({clock:b.clock,entry:b.entryAge,x:b.x,y:b.y,sortie:b.sortieRemaining,angles:[...b.parts.values()].map(p=>p.angle),repair:[...b.parts.values()].map(p=>p.repairRemaining)});
 const frozen=pausedState();g.state='paused';g.update(.5,{});assert.equal(pausedState(),frozen);
 g.state='playing';
 const proxy=g.enemies.find(q=>q.stageBossBody===b);assert(proxy);
 const core={x:b.x,y:b.y,previousX:b.x,previousY:b.y,radius:1,ownerId:'p1'};assert(stageBossCollision(g,proxy,core.x,core.y,core));damageStageBoss(g,proxy,core,1e9);assert(b.commandDestroyed);assert(!b.dead);
 const left=b.parts.get('left'),hit={x:b.x+left.x,y:b.y+left.y,previousX:b.x+left.x,previousY:b.y+left.y,ownerId:'p1'};damageStageBoss(g,proxy,hit,1e9);assert(left.destroyed);
 const cutoff=new Set(g.enemies.filter(e=>e.gallipoliInterceptor).map(e=>e.id));for(let i=0;i<500;i++){if(mode==='solo')g.update(.04,{inputMode:'gamepad',fireHeld:false,angle:0});else g.update(.04,{});assert(left.destroyed);for(const e of g.enemies.filter(e=>e.gallipoliInterceptor))assert(cutoff.has(e.id));}
 for(const p of b.parts.values())if(!p.destroyed){const point={x:b.x+p.x,y:b.y+p.y},shot={...point,previousX:point.x,previousY:point.y,radius:1,ownerId:'p1'};assert(stageBossCollision(g,proxy,shot.x,shot.y,shot));damageStageBoss(g,proxy,shot,1e9);}
 assert(b.dead);assert.equal(b.hp,0);
 results.push({mode,faction,width,simulatedSeconds:60,state:'playing',boss:b.kind,maxHazards,maxSand,dropped:g.stageBoss.hazards.pool.dropped,hostDamage,pauseFrozen:true,maxInterceptors,totalSorties:interceptorIds.size,repairedLeft,commandFirst:true,repairAndSortiesStopped:true,nativeFortressDefeated:true});
}
mkdirSync(new URL('../qa/gallipoli/',import.meta.url),{recursive:true});writeFileSync(new URL('../qa/gallipoli/engine-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
