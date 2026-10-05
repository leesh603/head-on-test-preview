import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload?.())}};
globalThis.document={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=478'),{CoopGame}=await import('../coop-engine.js?v=478'),{enableStageBoss,endStageBossFrame,stageBossCollision,damageStageBoss}=await import('../stageboss-host.js?v=478');
const results=[];
for(const mode of ['solo','coop'])for(const faction of ['central','entente'])for(const width of [390,1440]){
 const pilot=faction==='central'?'baron':'fonck';
 const g=mode==='solo'?new Game(faction==='central'?'fokker':'spad',pilot,()=>.5):new CoopGame([{pilot},{pilot}],{rng:()=>.5});
 g.viewWidth=width;g.viewHeight=844;g.nextHeavyAt=Infinity;g.nextBossAt=Infinity;g.region=14;
 enableStageBoss(g,{teamFaction:faction});g.stageBoss.stages.stageIndex=14;g.stageBoss.stages.orderPosition=g.stageBoss.stages.order.indexOf(14);
 const e=g.stageBoss.startBoss({x:g.x,y:g.y-280}),b=[...e.bodies.values()][0];
 for(const p of g.players||[g])p.invuln=Infinity;
 let maxHazards=0,maxSand=0,hostDamage=null;
 for(let i=0;i<1500;i++){
  if(mode==='solo')g.update(.04,{inputMode:'gamepad',fireHeld:false,angle:-Math.PI/2+Math.sin(i*.01)*.25});else g.update(.04,{});
  assert.equal(g.state,'playing');assert(Number.isFinite(b.x)&&Number.isFinite(b.y));
  maxHazards=Math.max(maxHazards,g.stageBoss.hazards.pool.count);maxSand=Math.max(maxSand,g.maanWeather?.cells.length||0);
  if(i===185){
   const p=b.parts.get('observer'),point={x:b.x+p.x,y:b.y+p.y},proxy=g.enemies.find(q=>q.stageBossBody===b);
   const shot={...point,previousX:point.x-2,previousY:point.y,ownerId:'p1',radius:1};assert(stageBossCollision(g,proxy,shot.x,shot.y,shot));const hp=p.hp;damageStageBoss(g,proxy,shot,20);hostDamage=hp-p.hp;assert(hostDamage>0);
  }
 }
 assert.equal(b.entryAge,5);assert.equal(g.stageBoss.hazards.pool.dropped,0);assert(maxHazards<80);assert(maxSand<=(width<720?2:3));
 const frozen=JSON.stringify({clock:b.clock,entry:b.entryAge,x:b.x,y:b.y});g.state='paused';g.update(.5,{});assert.equal(JSON.stringify({clock:b.clock,entry:b.entryAge,x:b.x,y:b.y}),frozen);
 g.state='playing';
 const proxy=g.enemies.find(q=>q.stageBossBody===b);assert(proxy);
 for(const p of b.parts.values())if(!p.destroyed){const point={x:b.x+p.x,y:b.y+p.y},shot={...point,previousX:point.x,previousY:point.y,radius:1,ownerId:'p1'};assert(stageBossCollision(g,proxy,shot.x,shot.y,shot));damageStageBoss(g,proxy,shot,1e9);}
 if(mode==='solo')g.update(.04,{inputMode:'gamepad',fireHeld:false,angle:0});else g.update(.04,{});
 assert.equal(b.captured.size,3);assert.equal(b.coreVulnerable,true);
 const core={x:b.x,y:b.y,previousX:b.x,previousY:b.y,radius:1,ownerId:'p1'};assert(stageBossCollision(g,proxy,core.x,core.y,core));damageStageBoss(g,proxy,core,1e9);assert(b.dead);
 results.push({mode,faction,width,simulatedSeconds:60,state:'playing',boss:b.kind,maxHazards,maxSand,dropped:g.stageBoss.hazards.pool.dropped,hostDamage,pauseFrozen:true,allSectorsCaptured:true,nativeCoreDefeated:true});
}
mkdirSync(new URL('../qa/gallipoli/',import.meta.url),{recursive:true});writeFileSync(new URL('../qa/gallipoli/engine-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
