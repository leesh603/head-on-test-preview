import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js?v=sink2';
import {FORMATION_MANUAL_BALANCE} from '../augmentation-overhaul150.js?v=sink2';


const expected=[
 ['normal',.20,.10,'피해 +20%, 공격 속도 +10%'],
 ['magic',.30,.15,'피해 +30%, 공격 속도 +15%'],
 ['rare',.45,.20,'피해 +45%, 공격 속도 +20%']
];

test('Formation Gunnery Manual uses nerfed independent damage and fire-rate tiers',()=>{
 assert.deepEqual([...FORMATION_MANUAL_BALANCE.damage],[.20,.30,.45]);
 assert.deepEqual([...FORMATION_MANUAL_BALANCE.rate],[.10,.15,.20]);
 for(const [rarity,damage,rate,label] of expected){
  const g=new Game('fokkerd7','goering',()=>.5);
  g.state='upgrade';
  assert.equal(g.upgrade('command',rarity),true);
  assert.equal(g.commandBonus,damage);
  assert.equal(g.commandRateBonus,rate);
  assert.match(g.augmentationDescription('command',rarity),new RegExp(label.replace(/[+]/g,'\\+')));
 }
});
