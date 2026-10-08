import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,UPGRADES} from '../engine.js?v=gun1';


test('random sortie bonus drafts exactly three normal non-legendary upgrades',()=>{
 const g=new Game('fokker','baron',()=>.5);
 const picks=g.rollChoices('normal');
 assert.equal(picks.length,3);
 assert.ok(picks.every(p=>p.rarity==='normal'));
 assert.ok(picks.every(p=>!p.legendary&&!p.uniqueOnly));
 assert.ok(picks.every(p=>UPGRADES.some(u=>u.id===p.id)));
 assert.equal(new Set(picks.map(p=>p.id)).size,3);
});
