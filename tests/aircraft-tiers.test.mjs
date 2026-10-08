import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PLANES,WEAPONS} from '../engine.js?v=gun1';
import '../campaign.js?v=gun1';
import {AIRCRAFT_TIERS,TIER_XP_GAIN,aircraftTierFor,registerAircraftTiers,aircraftGunSpreadMultiplier,aircraftTailPursuit,aircraftReloadMultiplier} from '../aircraft-tiers.js?v=gun1';


test('every playable runtime/campaign fit has a tier and one or two clear operating traits',()=>{
 const ids=Object.getOwnPropertyNames(PLANES);
 assert.ok(ids.length>100,'include non-enumerable campaign fits');
 for(const id of ids){
  const profile=aircraftTierFor(id);
  assert.ok(profile,id);
  assert.ok(profile.tier>=1&&profile.tier<=5,id);
  assert.ok(profile.identity.length>=1&&profile.identity.length<=2,id);
  assert.ok(profile.description.length<=32,id+' hangar copy must remain compact');
  assert.ok(PLANES[id].handling,id+' needs a real flight fit');
 }
});

test('tier registration preserves airframe weaknesses, existing weapons, and non-enumerable fits',()=>{
 const local={};
 const before=new Map();
 for(const id of Object.getOwnPropertyNames(PLANES)){
  const p=PLANES[id];
  before.set(id,{speed:p.speed,turn:p.turn,hp:p.hp,handling:p.handling,personality:p.personality,guns:WEAPONS[id].guns});
  Object.defineProperty(local,id,{value:{...p},enumerable:Object.prototype.propertyIsEnumerable.call(PLANES,id)});
 }
 assert.deepEqual(registerAircraftTiers(local),[]);
 assert.deepEqual(registerAircraftTiers(local),[],'idempotent after late registrations');
 for(const [id,b]of before){
  assert.equal(local[id].speed,b.speed,id);assert.equal(local[id].turn,b.turn,id);assert.equal(local[id].hp,b.hp,id);
  assert.equal(local[id].handling,b.handling,id);assert.equal(local[id].personality,b.personality,id);assert.equal(WEAPONS[id].guns,b.guns,id);
  assert.equal(local[id].xpCostMultiplier,1,id+' no duplicate growth correction');
  assert.equal(local[id].xpGainMultiplier,TIER_XP_GAIN[local[id].tier],id);
 }
 assert.equal(Object.prototype.propertyIsEnumerable.call(local,'be2c'),false);
});

test('growth rewards an early weak start without making late basic performance disappear',()=>{
 const early=PLANES.eindecker,late=PLANES.fokkerd7;
 assert.equal(aircraftTierFor('eindecker').tier,1);assert.equal(aircraftTierFor('fokkerd7').tier,5);
 assert.equal(early.speed,118);assert.equal(early.turn,2.55);assert.equal(WEAPONS.eindecker.guns,1);
 assert.ok(early.speed<late.speed);assert.ok(early.hp<late.hp);assert.ok(WEAPONS.eindecker.guns<WEAPONS.fokkerd7.guns);
 const xpForSameEncounters=100;
 assert.equal(xpForSameEncounters*TIER_XP_GAIN[1],128);
 assert.equal(xpForSameEncounters*TIER_XP_GAIN[2],118);
 assert.equal(xpForSameEncounters*TIER_XP_GAIN[3],100);
 assert.equal(xpForSameEncounters*TIER_XP_GAIN[4],100);
 assert.equal(xpForSameEncounters*TIER_XP_GAIN[5],88);
});

test('Eindecker precision/pursuit changes do not steer, accelerate, add gun damage or reload ammo',()=>{
 const g={plane:'eindecker',a:.3,speed:108,damage:12,ammo:[224]};
 const before=structuredClone(g);
 assert.equal(aircraftGunSpreadMultiplier(g),.72);
 const pursuit=aircraftTailPursuit(g);
 assert.equal(pursuit.tailMatchStrength,1.14);assert.equal(pursuit.tailGraceBonus,.04);
 assert.deepEqual(g,before);
 assert.equal(aircraftGunSpreadMultiplier({plane:'fokkerd7'}),1);
 assert.ok(aircraftGunSpreadMultiplier({plane:'se5a'})<1,'existing steady-gun role');
});

test('liveries share generation and growth, including campaign aliases and dedicated pilot craft',()=>{
 for(const profile of Object.values(AIRCRAFT_TIERS)){
  const family=AIRCRAFT_TIERS[profile.baseId];
  assert.equal(profile.tier,family.tier,profile.id);assert.equal(profile.xpGainMultiplier,family.xpGainMultiplier,profile.id);
 }
 assert.equal(aircraftTierFor('goering_fokkerd7').tier,5);
 assert.equal(aircraftTierFor('fokker_d7_campaign').tier,5);
 assert.equal(aircraftTierFor('baracca_nieuport').tier,3);
 assert.equal(aircraftTierFor('barker_snipe').tier,5);
 assert.equal(aircraftTierFor('jasta4_albatros').baseId,'albatros_d5a');
 assert.equal(aircraftTierFor('pierozzi_macchi').baseId,'macchi_m5');
 assert.equal(aircraftTierFor('unknown'),null);
});

test('existing flight handling makes turn, energy and heavy fits observably different',()=>{
 const manoeuvre=id=>{
  const g=new Game(id,'fonck',()=>.5);g.airframeSpeed=1;g.a=0;
  for(let i=0;i<25;i++)g.flyAirframe(.04,{steer:1});
  const yaw=g.a,retained=g.airframeSpeed;
  for(let i=0;i<25;i++)g.flyAirframe(.04,{});
  return {yaw,retained,recovered:g.airframeSpeed};
 };
 const turn=manoeuvre('fokker'),energy=manoeuvre('fokkerd7'),fast=manoeuvre('spad'),heavy=manoeuvre('re7');
 assert.ok(turn.yaw>energy.yaw&&turn.yaw>fast.yaw,'low-speed turn choice');
 assert.ok(energy.retained>turn.retained,'D.VII energy retention');
 assert.ok(fast.recovered>heavy.recovered,'Boom & Zoom recovery');
 assert.ok(heavy.yaw<turn.yaw,'heavy weakness preserved');
 assert.equal(WEAPONS.bristol_duo.bidirectional,true,'Bristol crossfire reason');
 assert.equal(WEAPONS.halberstadt_duo.bidirectional,true,'Halberstadt support crossfire');
});

test('distinct models sharing old livery fits get a bounded actual operating difference',()=>{
 assert.ok(aircraftGunSpreadMultiplier({plane:'jasta4_albatros'})<aircraftGunSpreadMultiplier({plane:'albatros'}),'D.Va model precision');
 assert.ok(aircraftTailPursuit({plane:'pierozzi_macchi'}).tailMatchStrength>1,'Macchi pursuit');
 assert.ok(aircraftReloadMultiplier({plane:'staaken_dark'})<aircraftReloadMultiplier({plane:'gotha'}),'Staaken sustained fire');
 assert.ok(aircraftReloadMultiplier({plane:'gotha_night'})<1,'night bomber sustained fire');
 assert.equal(aircraftGunSpreadMultiplier({plane:'mccudden_se5a'}),1,'dedicated fit untouched');
 assert.deepEqual(aircraftTailPursuit({plane:'nungesser_nieuport24'}),{},'dedicated fit untouched');
});
