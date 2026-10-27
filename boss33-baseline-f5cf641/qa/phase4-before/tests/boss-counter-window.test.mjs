import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './stageboss-fixture94.mjs';
const tuning={maxHp:2400,partHp:240,damage:18,bulletSpeed:270,geometryScale:1,regionalViewWidth:390,regionalViewHeight:844};
// Announced counter windows multiply pilot damage through the runtime only;
// direct body.hit (explosions, scripted damage) stays unscaled.
test('counter windows multiply pilot damage only while announced',()=>{
 const f=fixture({stageIndex:9,teamFaction:'entente'});f.hooks.getTuning=()=>tuning;
 const b=[...f.addon.startBoss({x:0,y:-200}).bodies.values()][0];
 b.phase='encirclement';const plain=f.addon.hit({bodyId:b.id,damage:10}).damage;
 b.phase='formation-recovery';const opened=f.addon.hit({bodyId:b.id,damage:10}).damage;
 assert.equal(plain,10);assert.equal(opened,15);
 const direct=b.hit({damage:10}).damage;assert.equal(direct,10);
});
