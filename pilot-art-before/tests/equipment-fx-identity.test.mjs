import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js?v=gal1&rail=42';
function pilot(id){const g=new Game('fokker','baron',()=>.5);g.state='upgrade';g.upgrade(id,'legendary');g.state='playing';g.invuln=0;g.a=0;return g}
test('armor visual is driven by mitigated small arms, without changing mitigation',()=>{
 const g=pilot('steelPlate'),base=new Game('fokker','baron',()=>.5),s={x:g.x,y:g.y+30,bullet:{}};
 assert.equal(g.incomingDamageMultiplier(s),base.incomingDamageMultiplier(s)*.7);
 assert.equal(g.equipmentArmorFlash,.24);assert.equal(g.equipmentImpactAngle,Math.PI/2);
 for(const kind of ['flak','heavyShell','gas']){g.equipmentArmorFlash=0;const source={...s,bullet:{[kind]:true}};
  assert.equal(g.incomingDamageMultiplier(source),base.incomingDamageMultiplier(source));assert.equal(g.equipmentArmorFlash,0);
 }
});
test('front emblem remains directional and its existing timer owns the visual',()=>{
 const g=pilot('prancingHorse'),base=new Game('fokker','baron',()=>.5),front={x:30,y:0,bullet:{}},back={x:-30,y:0,bullet:{}};
 assert.equal(g.incomingDamageMultiplier(front),base.incomingDamageMultiplier(front)*.75);assert.equal(g.equipmentImpactAngle,0);
 g.prancingHorseFlash160=0;assert.equal(g.incomingDamageMultiplier(back),base.incomingDamageMultiplier(back));assert.equal(g.prancingHorseFlash160,0);
});
test('armor timer is owner-local and expires through the existing update',()=>{
 const a=pilot('steelPlate'),b=pilot('steelPlate');a.incomingDamageMultiplier({x:20,y:0,bullet:{}});
 a.tickAugmentationSystems(.1);assert(Math.abs(a.equipmentArmorFlash-.14)<1e-9);assert.equal(b.equipmentArmorFlash,undefined);
 a.tickAugmentationSystems(.2);assert.equal(a.equipmentArmorFlash,0);
});
