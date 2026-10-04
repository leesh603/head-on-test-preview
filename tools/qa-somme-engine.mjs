import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload?.())}};
globalThis.document={createElement:()=>({getContext:()=>null})};
const {Game}=await import('../engine.js?v=519'),{CoopGame}=await import('../coop-engine.js?v=519'),{enableStageBoss,endStageBossFrame,stageBossCollision,damageStageBoss}=await import('../stageboss-host.js?v=519'),{sommePoint,landshipClearance}=await import('../somme-boss-layout.js?v=519');
const results=[];
for(const mode of ['solo','coop'])for(const faction of ['central','entente'])for(const width of [390,1440]){
 const pilot=faction==='central'?'baron':'fonck';
 const g=mode==='solo'?new Game(faction==='central'?'fokker':'spad',pilot,()=>.5):new CoopGame([{pilot},{pilot}],{rng:()=>.5});
 g.viewWidth=width;g.viewHeight=844;g.nextHeavyAt=Infinity;g.nextBossAt=Infinity;g.region=10;
 enableStageBoss(g,{teamFaction:faction});g.stageBoss.stages.stageIndex=10;
 const e=g.stageBoss.startBoss({x:g.x,y:g.y-120}),b=[...e.bodies.values()][0];endStageBossFrame(g,.02);
 const p=b.parts.get(faction==='central'?'track-left':'observer'),point=sommePoint(b,p.hitLocalX,p.localY),proxy=g.enemies.find(q=>q.stageBossBody===b);
 const shot={...point,previousX:point.x-30,previousY:point.y,ownerId:'p1',radius:1};assert(stageBossCollision(g,proxy,shot.x,shot.y,shot));const hp=b.hp;damageStageBoss(g,proxy,shot,20);assert.equal(hp-b.hp,16);
 for(const p of g.players||[g])p.invuln=Infinity;
 let maxHazards=0,minClearance=Infinity;
 for(let i=0;i<1500;i++){
  if(mode==='solo')g.update(.04,{inputMode:'gamepad',fireHeld:false,angle:-Math.PI/2+Math.sin(i*.01)*.25});else g.update(.04,{});
  maxHazards=Math.max(maxHazards,g.stageBoss.hazards.pool.count);
  if(faction==='central'){const bs=[...e.bodies.values()];for(let a=0;a<3;a++)for(let j=a+1;j<3;j++)minClearance=Math.min(minClearance,landshipClearance(bs[a],bs[j]));}
 }
 assert.equal(g.stageBoss.hazards.pool.dropped,0);assert(maxHazards<80);assert(minClearance>=-.5);
 results.push({mode,faction,width,simulatedSeconds:60,state:g.state,maxHazards,dropped:g.stageBoss.hazards.pool.dropped,minClearance:Number.isFinite(minClearance)?minClearance:null,hostDamage:16});
}
writeFileSync(new URL('../qa/somme-r2/engine-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
