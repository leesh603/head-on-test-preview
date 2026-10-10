import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {Game}=await import('../engine.js?v=gal1&rail=42');
const {DOGFIGHT_PASS_STATES}=await import('../dogfight-pass165.js?v=gal1');


const quiet=g=>{for(const key of ['spawn','eventTimer','nextBossAt','nextHeavyAt','_zeppelinSchedule','flakTimer','regionThreat','fieldUnitTimer','gasTimer','gustTimer','patrolTimer'])g[key]=Infinity;return g};

test('directed head-on exits into Break as soon as the aircraft cross',()=>{
 const g=quiet(new Game('camel','fonck',()=>.5)),e=g.spawnEnemy('hunter');g.t=20;
 Object.assign(e,{x:0,y:0,a:0,directorLayout:'headOn',directorIntentUntil:26,combatPassState:DOGFIGHT_PASS_STATES.COMMIT,combatPassTimer:4,combatPassHeading:0});
 g.dogfightSteering(e,{x:-80,y:20,a:Math.PI},.04,1.7);assert.equal(e.combatPassState,DOGFIGHT_PASS_STATES.DISENGAGE);assert.equal(e.combatPassHeading,0);
});
