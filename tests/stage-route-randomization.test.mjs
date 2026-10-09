import test from 'node:test';
import assert from 'node:assert/strict';
import {BossStages,STAGE_ROUTE_POOLS,buildStageRoute} from '../headon-stageboss-runtime.js?v=tame3&rail=39';


test('route always opens rural and moves Arras into the randomized mid pool',()=>{
 const low=buildStageRoute(()=>0),high=buildStageRoute(()=>.999999);
 assert.equal(low[0],0);assert.equal(high[0],0);assert.notDeepEqual(low,high);
 assert.deepEqual(new Set(low.slice(1,4)),new Set(STAGE_ROUTE_POOLS.early));
 assert.deepEqual(new Set(low.slice(4,11)),new Set(STAGE_ROUTE_POOLS.mid));
 assert.deepEqual(new Set(low.slice(11)),new Set(STAGE_ROUTE_POOLS.late));
 assert(STAGE_ROUTE_POOLS.mid.includes(9));assert(!STAGE_ROUTE_POOLS.early.includes(9));
 assert.equal(new Set(low).size,17);
});

test('normal run starts rural while explicit Test Lab starts remain exact',()=>{
 const normal=new BossStages({teamFaction:'central',rng:()=>0});
 assert.equal(normal.stageIndex,0);assert.equal(normal.order[0],0);
 const direct=new BossStages({teamFaction:'central',stageIndex:12,rng:()=>0});
 assert.equal(direct.stageIndex,12);
});
