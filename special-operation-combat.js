import {PILOT_AIRCRAFT} from './pilot-aircraft.js?v=09c75d146ae4289d';
import {FAMOUS_WING_BALANCE} from './famous-wing-combat.js?v=09c75d146ae4289d';
import {operationOutcome, SPECIAL_OPERATION_WAVES, SPECIAL_OPERATION_EXIT_AT, SPECIAL_OPERATION_TRAIN_ESCAPE, SPECIAL_OPERATION_CARGO_HOLD} from './special-operations.js?v=09c75d146ae4289d';

const live = entity => entity && entity.hp > 0 && !entity.expired && !entity.crashing && entity.life !== 0;
const pilots = game => game.players || [game];
const lead = game => pilots(game).find(player => live(player) && player.status !== 'downed');
const at = (entity, heading, distance) => ({
 x: entity.x + Math.cos(heading) * distance,
 y: entity.y + Math.sin(heading) * distance
});

function addPatrol(game, plane, heading, position, maxHp, details = {}) {
 const patrol = {
  ...position, a: heading, plane, maxHp, hp: maxHp, life: Infinity,
  speed: 170, fire: .4, invuln: .5, hitFlash: 0, think: 0, pass: 0,
  altitude: lead(game)?.altitude, waypoint: at(position, heading, 400), ...details
 };
 (game.patrols ??= []).push(patrol);
 return patrol;
}

function addEnemy(game, type) {
 const old = game.directorSpawning;
 game.directorSpawning = true;
 try {
  return game.spawnEnemy(type);
 } finally {
  game.directorSpawning = old;
 }
}

function rescueCandidate(game, pilotData, faction) {
 const occupied = new Set(pilots(game).flatMap(player => [player.pilot, player.aceWingmanPilotId, player.rescuedAcePilotId]));
 const candidates = Object.keys(PILOT_AIRCRAFT).filter(id => pilotData[id]?.faction === faction && !occupied.has(id) && PILOT_AIRCRAFT[id]?.defaultAircraft);
 return candidates[Math.floor(game.rng() * candidates.length)];
}

function addRailCar(game, key, x, y, hp) {
 const car = addEnemy(game, 'bomber');
 if (!car) return null;
 Object.assign(car, {
  x, y, a: 0, speed: 0, hp, maxHp: hp, hitRadius: 47,
  operationRailCar: key, operationEnemy: true, missionTarget: true,
  stationary: true, surface: true, fire: Infinity
 });
 return car;
}

export function startOperationBattle(game, id, pilotData, operation = {}) {
 const player = lead(game);
 if (!player || game.online && !game.host) return null;
 const faction = game.stageBoss.stages.teamFaction;
 const heading = player.a || 0, position = at(player, heading, 220);
 const battle = {id, faction, heading, elapsed: 0, wave: 0, nextSweep: 6, enemies: [], patrols: [], routeComplete: false};
 if (id === 'cargo') {
  const sign = Math.cos(heading) >= 0 ? 1 : -1;
  const y = position.y, x = player.x + sign * 140;
  const engine = addRailCar(game, 'engine', x, y, 150);
  const flak = addRailCar(game, 'flak', x - sign * 110, y, 110);
  const cargo = addRailCar(game, 'cargo', x - sign * 220, y, 245);
  battle.train = {engine, flak, cargo, sign, x, y, originX: x, age: 0, secured: 0, nextFire: 2};
  battle.enemies.push(...[engine, flak, cargo].filter(Boolean));
 } else {
  battle.escape = at(position, heading, 440);
  if (id === 'prototype') {
   const plane = faction === 'central' ? 'fokker_f1' : 'salamander_trial';
   battle.patrols.push(addPatrol(game, plane, heading, position, 330, {operationTarget: true}));
   battle.testRoute = [at(position, heading, 420), at(position, heading + 1.4, 380), at(position, heading + Math.PI, 320), at(position, heading - 1.4, 380)];
   battle.testLeg = 0;
  } else if (id === 'ace') {
   battle.acePilot = operation.acePilot ??= rescueCandidate(game, pilotData, faction);
   if (battle.acePilot) {
    const plane = PILOT_AIRCRAFT[battle.acePilot].defaultAircraft;
    battle.patrols.push(addPatrol(game, plane, heading, position, 315, {operationTarget: true, acePilot: battle.acePilot}));
   }
  } else {
   const unit = faction === 'central' ? 'jasta18' : 'lafayette';
   battle.unit = unit;
   const profile = FAMOUS_WING_BALANCE[unit];
   for (let i = 0; i < profile.count; i++) {
    const offset = at(position, heading + Math.PI / 2, (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 54);
    battle.patrols.push(addPatrol(game, profile.plane, heading, offset, i ? 175 : 310, {operationTarget: true, operationUnit: unit, slot: i}));
   }
  }
 }
 game.operationBattle = battle;
 return battle;
}

const operationThreats = battle => battle.enemies.filter(e => !e.operationRailCar && live(e)).length;

function spawnInterceptors(game, battle, wave, count, escortAttackers) {
 const player = lead(game);
 if (!player) return;
 const escort = battle.patrols[0];
 const train = battle.train?.engine;
 for (let i = 0; i < count; i++) {
  const attacksEscort = i < escortAttackers && live(escort);
  const anchor = attacksEscort ? escort : live(train) && i === 0 ? train : player;
  const opponent = addEnemy(game, attacksEscort || i === 1 && wave > 0 ? 'hunter' : 'scout');
  if (!opponent) break;
  const side = (i + wave) % 2 ? -1 : 1;
  const flank = (anchor.a ?? battle.heading) + side * (wave % 2 ? 1.45 : .8);
  const position = at(anchor, flank, 330 + Math.floor(i / 2) * 75);
  Object.assign(opponent, {
   ...position, a: Math.atan2(anchor.y - position.y, anchor.x - position.x),
   operationEnemy: true, missionTarget: true, fire: .85 + i * .3,
   operationEscortTarget: attacksEscort ? escort : null
  });
  battle.enemies.push(opponent);
 }
}

function advanceTrain(game, train, dt) {
 train.age += dt;
 const speed = live(train.engine) ? 72 : 0;
 train.x += train.sign * speed * dt;
 for (const [slot, car] of [train.engine, train.flak, train.cargo].entries()) {
  if (car) {car.x = train.x - train.sign * slot * 110; car.y = train.y;}
 }
 const player = lead(game);
 train.inRange = live(train.cargo) && pilots(game).some(pilot =>
  live(pilot) && pilot.status !== 'downed' && Math.hypot(pilot.x-train.cargo.x,pilot.y-train.cargo.y) < 320);
 if (!live(train.engine) && !live(train.flak) && train.inRange) train.secured += dt;
 if (!player || !live(train.flak) || train.age < train.nextFire || Math.hypot(player.x - train.flak.x, player.y - train.y) > 520) return;
 train.nextFire = train.age + 2.6;
 const heading = Math.atan2(player.y - train.flak.y, player.x - train.flak.x);
 for (const spread of [-.14, 0, .14]) {
  const a = heading + spread, position = at(train.flak, a, 26);
  game.bullets.push({...position, vx: Math.cos(a) * 255, vy: Math.sin(a) * 255, life: 2, damage: 8, enemy: true, visualType: 'hunter'});
 }
}

export function operationBattleProgress(battle) {
 const train = battle.train;
 const target = train?.cargo || battle.patrols[0];
 return {
  id: battle.id, elapsed: battle.elapsed, wave: battle.wave, threats: operationThreats(battle),
  hp: Math.max(0, Math.min(100, Math.ceil(100 * (target?.hp || 0) / (target?.maxHp || 1)))),
  routeComplete: battle.routeComplete, exitProgress: battle.exitProgress || 0,
  train: train ? {
   x: train.x, y: train.y, originX: train.originX, sign: train.sign,
   secured: train.secured, inRange: train.inRange,
   cars: [train.engine, train.flak, train.cargo].map(car => car ? {hp: car.hp, maxHp: car.maxHp} : null)
  } : null
 };
}

export function tickOperationBattle(game, dt) {
 const battle = game.operationBattle;
 if (!battle || game.state !== 'playing' || game.online && !game.host || !lead(game)) return null;
 battle.elapsed += dt;
 battle.enemies = battle.enemies.filter(e => e.operationRailCar || live(e) && game.enemies.includes(e));
 const active = operationThreats(battle);
 const limit = battle.train ? 6 : 8;
 const waveAt = SPECIAL_OPERATION_WAVES[battle.wave] ?? Infinity;
 if (battle.elapsed >= waveAt) {
  const count = Math.min(limit - active, battle.train ? 3 : 4);
  spawnInterceptors(game, battle, battle.wave, count, battle.wave === 0 ? 1 : 2);
  battle.wave++;
  battle.nextSweep = battle.elapsed + 6;
 } else if (battle.elapsed >= battle.nextSweep && waveAt - battle.elapsed > 3 &&
            battle.elapsed < SPECIAL_OPERATION_WAVES.at(-1)) {
  const floor = battle.train ? 3 : 4;
  if (active < floor) {
   spawnInterceptors(game, battle, battle.wave, floor - active, 0);
   battle.nextSweep = battle.elapsed + 6;
  }
 }
 if (battle.train) advanceTrain(game, battle.train, dt);
 const target = battle.patrols[0];
 if (live(target) && battle.testRoute && !target.frontEscortRoute) {
  const next = battle.testRoute[battle.testLeg];
  if (Math.hypot(target.x-next.x,target.y-next.y)<95) battle.testLeg=(battle.testLeg+1)%battle.testRoute.length;
  target.operationWaypoint=battle.testRoute[battle.testLeg];
 }
 if (live(target) && battle.elapsed >= SPECIAL_OPERATION_EXIT_AT && !battle.routeComplete) {
  if (!target.frontEscortRoute) battle.escape = at(target, target.a, 460);
  for (const patrol of battle.patrols) patrol.frontEscortRoute = battle.escape;
  const remaining = Math.hypot(target.x - battle.escape.x, target.y - battle.escape.y);
  battle.routeComplete = remaining <= 90;
  battle.exitProgress = Math.max(0, Math.min(1, (460 - remaining) / (460 - 90)));
 }
 return operationOutcome(battle.id, {
  elapsed: battle.elapsed, threats: operationThreats(battle),
  targetAlive: battle.train ? live(battle.train.cargo) : live(target),
  routeComplete: battle.routeComplete,
  escaped: battle.train && battle.train.age >= SPECIAL_OPERATION_TRAIN_ESCAPE && live(battle.train.engine),
  transportDisabled: battle.train && battle.train.secured >= SPECIAL_OPERATION_CARGO_HOLD,
  cargoIntact: !battle.train || live(battle.train.cargo)
 });
}

export function clearOperationBattle(game) {
 const battle = game.operationBattle;
 if (!battle) return;
 game.enemies = game.enemies.filter(enemy => !enemy.operationEnemy);
 game.patrols = game.patrols.filter(patrol => !patrol.operationTarget);
 game.bullets = [];
 delete game.operationBattle;
}

export function applyOperationReward(game, battle) {
 const player = lead(game);
 if (!player) return null;
 switch (battle.id) {
  case 'prototype':
   game.operationManufacturing = true;
   return '신형기 양산';
  case 'cargo':
   return player.grantCapturedEquipment()?.name || null;
  case 'squadron':
   game.operationReinforcement = battle.unit;
   return FAMOUS_WING_BALANCE[battle.unit].faction === 'central' ? '야스타 18 합류' : '라파예트 합류';
  case 'ace':
   return player.joinRescuedAce(battle.acePilot) ? '에이스 파일럿 합류' : null;
  default:
   return null;
 }
}

export function refreshOperationReinforcement(game) {
 delete game.alliedFamousWing;
 game.patrols = (game.patrols || []).filter(patrol => !patrol.operationReinforcement);
 const unit = game.operationReinforcement, profile = FAMOUS_WING_BALANCE[unit];
 const player = lead(game);
 if (!profile || !player) return;
 const stage = game.stageBoss.stages.orderPosition;
 const health = Math.min(245, profile.hp + stage * 8 + player.maxHp * .2);
 const position = at(player, player.a, -180);
 for (let i = 0; i < profile.count; i++) {
  const wing = at(position, player.a + Math.PI / 2, (i - (profile.count - 1) / 2) * 63);
  addPatrol(game, profile.plane, player.a, wing, health, {
   slot: i, operationReinforcement: unit, damageMultiplier: Math.min(1.8, 1 + stage * .07 + (player.commandBonus || 0) * .25)
  });
 }
}

export function expireOperationRewards(game) {
 delete game.operationManufacturing;
 delete game.operationReinforcement;
 delete game.alliedFamousWing;
 game.patrols = (game.patrols || []).filter(patrol => !patrol.manufactured && !patrol.operationReinforcement);
 game.friendlyBombers = (game.friendlyBombers || []).filter(bomber => !bomber.manufactured);
 for (const player of pilots(game)) {
  player.expireCapturedEquipment?.();
  for (const key of ['PilotId', 'Armament', 'Introduced', 'RespawnAt']) delete player['rescuedAce' + key];
 }
 game.allies = (game.allies || []).filter(ally => ally.aceSource !== 'rescue');
}
