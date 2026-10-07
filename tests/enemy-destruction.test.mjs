import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {Game}=await import('../engine.js?v=perf2');
const {enemyCanCrash,enemyCrashScale}=await import('../aircraft-crash.js?v=perf2');
const {CoopGame}=await import('../coop-engine.js?v=perf2');


test('airborne wrecks shrink while ground and heavy targets retain their death path',()=>{
 assert(enemyCanCrash({type:'scout'}));
 assert(enemyCanCrash({type:'boss',bossPilot:'voss'}));
 for(const target of [{type:'scout',surface:true},{type:'bomber',heavyBomber:true},{type:'zeppelin'},{type:'boss',stageBossBody:true}])
  assert.equal(enemyCanCrash(target),false);
 const wreck={crashDuration:.8,crashT:.8};
 assert.equal(enemyCrashScale(wreck),1);
 wreck.crashT=.4;
 assert(enemyCrashScale(wreck)<1&&enemyCrashScale(wreck)>.5);
 wreck.crashT=0;
 assert(Math.abs(enemyCrashScale(wreck)-.72)<1e-9);
 assert(Math.abs(enemyCrashScale({crashDuration:1,crashT:0,crashStyle:'spin'})-.5)<1e-9);
});

test('solo and co-op keep a destroyed fighter until the crash finishes',()=>{
 const solo=new Game('fokker','baron',()=>.5);
 solo.spawn=solo.eventTimer=solo.flakTimer=solo.supplyTimer=1e9;
 const enemy={type:'scout',x:solo.x+100,y:solo.y,a:0,speed:90,hp:0,maxHp:30};
 solo.enemies=[enemy];
 solo.update(.016);
 assert(enemy.crashing&&solo.enemies.includes(enemy));
 for(let i=0;i<55;i++)solo.update(.016);
 assert(!solo.enemies.includes(enemy));

 const coop=new CoopGame([{pilot:'baron',plane:'fokker'},{pilot:'voss',plane:'fokker'}],{rng:()=>.5});
 const wing={type:'hunter',x:coop.x+100,y:coop.y,a:0,speed:100,hp:0,maxHp:30};
 coop.enemies=[wing];
 coop.updateOrdnance(0);
 assert(wing.crashing&&coop.enemies.includes(wing));
 coop.updateEnemies(.81);
 coop.updateOrdnance(0);
 assert(!coop.enemies.includes(wing));
});
