import {PILOT_AIRCRAFT} from './pilot-aircraft.js?v=09c75d146ae4289d';
import {FAMOUS_WING_BALANCE} from './famous-wing-combat.js?v=09c75d146ae4289d';
import {operationOutcome, SPECIAL_OPERATION_LIMIT, SPECIAL_OPERATION_WAVES, SPECIAL_OPERATION_EXIT_AT, SPECIAL_OPERATION_TRAIN_ESCAPE, SPECIAL_OPERATION_CARGO_HOLD, SPECIAL_OPERATION_DEMOLITION} from './special-operations.js?v=09c75d146ae4289d';

const live = entity => entity && entity.hp > 0 && !entity.expired && !entity.crashing && entity.life !== 0;
const pilots = game => game.players || [game];
const lead = game => pilots(game).find(player => live(player) && player.status !== 'downed');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pilotNear = (game, target, radius) => pilots(game).some(player =>
 live(player) && player.status !== 'downed' && distance(player, target) <= radius);
const RALLY_RADIUS = 165;
const SQUADRON_REQUIRED = 3;
const REPAIR_RADIUS = 210;
const REPAIR_TIME = 4;
const survivors = battle => battle.patrols.filter(patrol => patrol.operationEvacuated || live(patrol)).length;
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
  // Armoured, and sized to the pilot's own guns: stopping the train is a chase
  // of several passes under flak, not one burst from any build.
  const shot = Math.max(8, (player.damage || 8) * (game.globalDamageMult || 1));
  const engine = addRailCar(game, 'engine', x, y, Math.max(520, Math.round(shot * 90)));
  const flak = addRailCar(game, 'flak', x - sign * 110, y, Math.max(300, Math.round(shot * 50)));
  const cargo = addRailCar(game, 'cargo', x - sign * 220, y, 245);
  battle.train = {engine, flak, cargo, sign, x, y, originX: x, age: 0, secured: 0, nextFire: 2};
  battle.enemies.push(...[engine, flak, cargo].filter(Boolean));
 } else {
  if (id === 'prototype') {
   const plane = faction === 'central' ? 'fokker_f1' : 'salamander_trial';
   battle.patrols.push(addPatrol(game, plane, heading, position, 330, {operationTarget: true}));
   battle.testRoute = [
    at(at(position, heading, 560), heading - Math.PI / 2, 200),
    at(at(position, heading, 1120), heading + Math.PI / 2, 250),
    at(position, heading, 1720)
   ];
   battle.testLeg = 0;
   battle.patrols[0].frontEscortRoute = battle.testRoute[0];
   battle.patrols[0].operationCheckpoint = battle.testRoute[0];
  } else if (id === 'ace') {
   battle.acePilot = operation.acePilot ??= rescueCandidate(game, pilotData, faction);
   if (battle.acePilot) {
    const plane = PILOT_AIRCRAFT[battle.acePilot].defaultAircraft;
    battle.repair = 0;
    const loiter = at(position, heading, 210);
    battle.patrols.push(addPatrol(game, plane, heading, position, 315, {
     operationTarget: true, acePilot: battle.acePilot, speed: 105, frontEscortRoute: loiter
    }));
   }
  } else {
   const unit = faction === 'central' ? 'jasta18' : 'lafayette';
   battle.unit = unit;
   const profile = FAMOUS_WING_BALANCE[unit];
   for (let i = 0; i < profile.count; i++) {
    const side = (i % 2 ? 1 : -1) * Math.ceil(i / 2);
    const offset = at(at(position, heading, Math.abs(side) * 95), heading + Math.PI / 2, side * 215);
    battle.patrols.push(addPatrol(game, profile.plane, heading, offset, i ? 175 : 310, {
     operationTarget: true, operationUnit: unit, slot: i, speed: 105,
     frontEscortRoute: at(offset, heading, 145)
    }));
   }
  }
 }
 battle.script = OPERATION_SCRIPTS[id] ? 0 : null;
 game.operationBattle = battle;
 return battle;
}

// Each operation is a short story, not four identical waves: two or three
// scripted crises, each announced (toast + mission card countdown) and each
// answerable by the pilot. All use existing aircraft, AI and art.
const say = (game, text) => game.event?.('wave', text);
function alertFor(battle, ko, en, seconds = 0) {
 battle.alert = {text: [ko, en], until: battle.elapsed + Math.max(4, seconds), countdownTo: seconds ? battle.elapsed + seconds : null};
}
// A flight that goes straight for an escorted aircraft from one flank.
function diveFlight(game, battle, target, count, {type = 'hunter', distance = 560, side = 1} = {}) {
 const flank = (target.a ?? battle.heading) + side * 1.25, made = [];
 for (let i = 0; i < count; i++) {
  const position = at(target, flank + (i - (count - 1) / 2) * .16, distance + i * 30);
  const e = addEnemy(game, type);if (!e) break;
  Object.assign(e, {...position, a: Math.atan2(target.y - position.y, target.x - position.x), operationEnemy: true, missionTarget: true,
   fire: .55 + i * .2, operationEscortTarget: game.patrols?.includes(target) ? target : null, operationStrike: true});
  battle.enemies.push(e);made.push(e);
 }
 return made;
}
// A named enemy ace (the battlefield-event ace) sent after the escorted aircraft.
function interceptAce(game, battle, target) {
 const position = at(target, (target.a ?? battle.heading) + Math.PI * .8, 620);
 const e = addEnemy(game, 'boss');if (!e) return null;
 Object.assign(e, {...position, a: Math.atan2(target.y - position.y, target.x - position.x), eventAce: true, operationEnemy: true, missionTarget: true,
  fire: .5, operationEscortTarget: game.patrols?.includes(target) ? target : null, operationAce: true});
 battle.enemies.push(e);battle.ace = e;
 return e;
}
const OPERATION_SCRIPTS = Object.freeze({
 prototype: [
  {at: 9, run(game, battle, target) {
   battle.engineTrouble = battle.elapsed + 10;
   say(game, '시험기 엔진 고장 · 속도 저하 10초 · 추격조가 붙습니다');alertFor(battle, '시험기 감속 · 좌측 추격조', 'Prototype slowed · left flank', 10);
   diveFlight(game, battle, target, 2, {side: -1, distance: 480});
  }},
  {at: 22, run(game, battle, target) {
   diveFlight(game, battle, target, 3, {side: 1});
   say(game, '우측 급강하 공격조 접근 · 시험기를 노립니다');alertFor(battle, '우측 급강하 공격조', 'Strike flight · right flank');
  }},
  {at: 36, run(game, battle, target) {
   if (!interceptAce(game, battle, target)) return;
   say(game, '적 에이스 요격 · 이탈 전에 격추하세요');alertFor(battle, '적 에이스 요격', 'Intercept the enemy ace');
  }}
 ],
 cargo: [
  {at: 14, run(game, battle) {
   if (!live(battle.train.engine)) return;
   battle.train.speed = 98;say(game, '열차 가속 · 터널 진입 전에 기관차를 멈추세요');alertFor(battle, '열차 가속', 'Train accelerating');
  }},
  {at: 26, run(game, battle) {
   const player = lead(game);if (!player) return;
   for (const e of diveFlight(game, battle, player, 2, {type: 'scout', side: -1, distance: 520})) e.operationStrike = false;
   say(game, '열차 엄호기 출격');alertFor(battle, '열차 엄호기 출격', 'Train escorts airborne');
  }}
 ],
 squadron: [
  {at: 7, run(game, battle) {latchOn(game, battle, 1);}},
  {at: 20, run(game, battle) {latchOn(game, battle, 2);}},
  {at: 32, run(game, battle) {
   const survivors = battle.patrols.filter(live);
   for (const [index, member] of survivors.entries()) {
    diveFlight(game, battle, member, 1, {type: 'scout', side: index % 2 ? -1 : 1, distance: 500 + index * 38});
   }
   say(game, '적 편대가 흩어진 아군을 각개 추격합니다');alertFor(battle, '적 편대가 각개 추격 중', 'Enemy flight splits to pursue');
  }}
 ],
 ace: [
  {at: 0, run(game, battle, target) {
   target.hp = Math.round(target.maxHp * .55);
   say(game, '구출 대상 엔진 손상 · 근접 비행으로 재시동을 엄호하세요');
  }},
  {at: 12, run(game, battle, target) {
   if (!interceptAce(game, battle, target)) return;
   say(game, '적 에이스가 구출 대상을 추격 · 격추하세요');alertFor(battle, '적 에이스 추격', 'Enemy ace in pursuit');
  }},
  {at: 30, run(game, battle, target) {
   diveFlight(game, battle, target, 2, {side: -1});
   say(game, '추격조 합류');alertFor(battle, '추격조 합류', 'Pursuit flight closing');
  }}
 ]
});
// A pair of hunters fastens onto one squadron member at a time.
function latchOn(game, battle, round) {
 const members = battle.patrols.filter(live);if (!members.length) return;
 const scattered = members.filter(member => !member.operationRallied);
 const candidates = scattered.length ? scattered : members;
 const member = candidates[(round * 2 + 1) % candidates.length];
 diveFlight(game, battle, member, 2, {side: round % 2 ? 1 : -1, distance: 460});
 const number = member.slot + 1;
 say(game, `편대원 ${number}번기 추격당함 · 떼어내세요`);alertFor(battle, `${number}번기 추격당함`, `No. ${number} under pursuit`);
}
function runScript(game, battle) {
 const script = OPERATION_SCRIPTS[battle.id];if (!script || battle.script == null) return;
 const target = battle.patrols[0];
 while (battle.script < script.length && battle.elapsed >= script[battle.script].at) {
  const step = script[battle.script++];
  if (battle.train || battle.id === 'squadron' || live(target)) step.run(game, battle, target);
 }
 // Engine trouble: the escorted aircraft limps along, a sitting duck.
 if (live(target) && battle.engineTrouble != null) {
  if (battle.elapsed < battle.engineTrouble) target.speed = 95;
  else {target.speed = 170;battle.engineTrouble = null;say(game, '엔진 회복');}
 }
}

const operationThreats = battle => battle.enemies.filter(e => !e.operationRailCar && live(e)).length;

function spawnInterceptors(game, battle, wave, count, escortAttackers) {
 const player = lead(game);
 if (!player) return;
 const escorts = battle.patrols.filter(live);
 const train = battle.train?.engine;
 for (let i = 0; i < count; i++) {
  const escort = escorts[i % escorts.length];
  const attacksEscort = i < escortAttackers && !!escort;
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

function advanceTrain(game, battle, dt) {
 const train = battle.train;
 train.age += dt;
 const speed = live(train.engine) ? (train.speed || 72) : 0;
 train.x += train.sign * speed * dt;
 for (const [slot, car] of [train.engine, train.flak, train.cargo].entries()) {
  if (car) {car.x = train.x - train.sign * slot * 110; car.y = train.y;}
 }
 const player = lead(game);
 train.inRange = live(train.cargo) && pilotNear(game, train.cargo, 320);
 // Once the train is stopped, a demolition flight comes to blow the cargo
 // before it can be taken: shoot it down, then hold over the cargo.
 if (!live(train.engine) && !live(train.flak) && live(train.cargo) && !train.demolition) {
  const crew = player ? diveFlight(game, battle, train.cargo, 2, {side: 1, distance: 520}) : [];
  if (crew.length) {
   for (const aircraft of crew) aircraft.operationDemolition = true;
   train.demolition = {deadline: battle.elapsed + SPECIAL_OPERATION_DEMOLITION, crew};
   say(game, `적 폭파조 접근 · ${SPECIAL_OPERATION_DEMOLITION}초 안에 격추하세요`);
  }
 }
 const crew = train.demolition?.crew.filter(live).length || 0;
 if (train.demolition && crew && battle.elapsed >= train.demolition.deadline && live(train.cargo)) {
  train.cargo.hp = 0;train.demolished = true;say(game, '화물 폭파됨');
 }
 if (train.demolition && !crew && train.inRange) train.secured += dt;
 else train.secured = 0;
 if (!live(train.flak) || train.age < train.nextFire) return;
 if (!train.flak.operationFlakAiming) {
  const contact = pilots(game).filter(pilot => live(pilot) && pilot.status !== 'downed' && distance(pilot, train.flak) <= 520)
   .sort((a, b) => distance(a, train.flak) - distance(b, train.flak))[0];
  if (!contact) return;
  train.flak.operationFlakAiming = true;
  train.flakAim = {x: contact.x, y: contact.y};
  train.nextFire = train.age + .85;
  return;
 }
 train.flak.operationFlakAiming = false;
 train.nextFire = train.age + 1.45;
 const heading = Math.atan2(train.flakAim.y - train.flak.y, train.flakAim.x - train.flak.x);
 const spreadAngles = live(train.engine) ? [-.14, 0, .14] : [-.28, -.14, 0, .14, .28];
 for (const spread of spreadAngles) {
  const a = heading + spread, position = at(train.flak, a, 26);
  game.bullets.push({...position, vx: Math.cos(a) * 255, vy: Math.sin(a) * 255, life: 2, damage: 8, enemy: true, visualType: 'hunter'});
 }
}

const pursuerNear = (battle, target, radius) => battle.enemies.some(enemy =>
 enemy.operationEscortTarget === target && live(enemy) && distance(enemy, target) <= radius);

function advanceSquadron(game, battle) {
 const members = battle.patrols.filter(patrol => !patrol.operationEvacuated && live(patrol));
 for (const patrol of members) {
  if (!patrol.operationRallied && pilotNear(game, patrol, RALLY_RADIUS) && !pursuerNear(battle, patrol, 210)) {
   patrol.operationRallied = true;
   patrol.speed = 155;
   say(game, `편대원 ${patrol.slot + 1}번기 재합류`);
  }
 }
 const ready = members.filter(patrol => patrol.operationRallied);
 battle.rallied = ready.length;
 if (battle.elapsed >= 32 && ready.length >= SQUADRON_REQUIRED && !battle.squadronExit) {
  battle.squadronExit = at(ready[0], battle.heading, 510);
  say(game, '구출 편대 이탈 시작 · 최소 3기를 탈출시키세요');
 }
 if (!battle.squadronExit) return;
 for (const patrol of ready) {
  patrol.frontEscortRoute = battle.squadronExit;
  if (distance(patrol, battle.squadronExit) <= 95) {
   patrol.operationEvacuated = true;
   patrol.life = 0;
  }
 }
 battle.evacuated = battle.patrols.filter(patrol => patrol.operationEvacuated).length;
 battle.rallied -= ready.filter(patrol => patrol.operationEvacuated).length;
 battle.routeComplete = battle.evacuated >= SQUADRON_REQUIRED;
}

function advanceEscort(game, battle, target, dt) {
 if (battle.routeComplete) return;
 if (battle.id === 'prototype') {
  const gate = battle.testRoute[battle.testLeg];
  if (gate && distance(target, gate) <= 105 && pilotNear(game, target, 310)) {
   battle.testLeg++;
   target.frontEscortRoute = battle.testRoute[battle.testLeg] || gate;
   target.operationCheckpoint = battle.testRoute[battle.testLeg] || null;
   say(game, `시험 비행 검문점 통과 ${battle.testLeg}/${battle.testRoute.length}`);
  }
  if (battle.testLeg < battle.testRoute.length || battle.elapsed < SPECIAL_OPERATION_EXIT_AT) return;
 } else {
  if (battle.repair < REPAIR_TIME) {
   battle.repairing = pilotNear(game, target, REPAIR_RADIUS) && !pursuerNear(battle, target, 230);
   if (battle.repairing) battle.repair = Math.min(REPAIR_TIME, battle.repair + dt);
   if (battle.repair < REPAIR_TIME) return;
   target.speed = 170;
   say(game, '에이스 엔진 재시동 완료 · 철수 엄호');
  }
  if (battle.elapsed < 30) return;
 }
 if (!battle.exitStarted) {
  battle.exitStarted = true;
  battle.escape = at(target, target.a, 460);
  target.frontEscortRoute = battle.escape;
 }
 const remaining = distance(target, battle.escape);
 battle.routeComplete = remaining <= 95;
 battle.exitProgress = Math.max(0, Math.min(1, (460 - remaining) / (460 - 95)));
}

export function operationBattleProgress(battle) {
 const train = battle.train;
 const target = train?.cargo || battle.patrols[0];
 return {
  id: battle.id, elapsed: battle.elapsed, wave: battle.wave, threats: operationThreats(battle),
  hp: battle.id === 'squadron' ? Math.round(100 * survivors(battle) / battle.patrols.length)
   : Math.max(0, Math.min(100, Math.ceil(100 * (target?.hp || 0) / (target?.maxHp || 1)))),
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
 for (const patrol of battle.patrols) {
  if (live(patrol) && !game.patrols.includes(patrol)) patrol.expired = true;
 }
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
 runScript(game, battle);
 if (battle.train) advanceTrain(game, battle, dt);
 const target = battle.patrols[0];
 if (battle.id === 'squadron') advanceSquadron(game, battle);
 else if (live(target)) advanceEscort(game, battle, target, dt);
 const targetAlive = battle.train ? live(battle.train.cargo) : battle.id === 'squadron'
  ? survivors(battle) >= SQUADRON_REQUIRED
  : live(target);
 const threats = battle.id === 'squadron' ? 0 : battle.enemies.filter(enemy =>
  live(enemy) && (enemy.operationAce || enemy.operationStrike && enemy.operationEscortTarget === target)).length;
 return operationOutcome(battle.id, {
  elapsed: battle.elapsed, threats, targetAlive,
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

// Mission card: what is happening now, how long is left, how the protected unit is holding.
const CARD_TITLES = {prototype: ['시험기 호위', 'PROTOTYPE ESCORT'], cargo: ['비밀병기 탈취', 'SECRET CARGO RAID'], squadron: ['특수편대 구출', 'SQUADRON RESCUE'], ace: ['에이스 구출', 'ACE RESCUE']};
const UNIT_NAMES = {prototype: ['시험기', 'Prototype'], cargo: ['화물칸', 'Cargo'], ace: ['에이스', 'Ace']};
export function operationMissionCard(game, en = false) {
 const battle = game?.operationBattle;
 if (!battle) {
  const card=game?.online&&!game.host&&game.operationSnapshot?.cards?.[en?'en':'ko'];
  return Array.isArray(card)&&card.length===4?{title:card[0],objective:card[1],meta:card[2],urgent:card[3]}:null;
 }
 if (!CARD_TITLES[battle.id]) return null;
 const L = en ? 1 : 0, now = battle.elapsed, train = battle.train;
 const unit = train?.cargo || battle.patrols?.[0], hp = Math.max(0, Math.ceil(100 * (unit?.hp || 0) / (unit?.maxHp || 1)));
 const alert = battle.alert && now < battle.alert.until ? battle.alert : null;
 const demolish = train?.demolition?.crew.filter(live).length ? train.demolition.deadline : null;
 const countdown = demolish ?? alert?.countdownTo;
 const left = countdown == null ? null : Math.max(0, Math.ceil(countdown - now));
 let objective;
 if (demolish != null) objective = en ? `Stop demolition · ${left} s` : `폭파조 저지 · ${left}초`;
 else if (alert) objective = alert.text[L] + (left ? ` · ${left}${en ? ' s' : '초'}` : '');
 else if (train) {
  const tunnel = Math.max(0, Math.ceil(SPECIAL_OPERATION_TRAIN_ESCAPE - train.age));
  objective = live(train.engine) ? (en ? `Stop the engine · tunnel in ${tunnel} s` : `기관차 정지 · 터널까지 ${tunnel}초`)
   : live(train.flak) ? (en ? 'Silence the flak car' : '대공 화차 제압')
   : (en ? 'Stay over the cargo · ' : '화물 상공 유지 · ') + Math.floor(100 * Math.min(1, train.secured / SPECIAL_OPERATION_CARGO_HOLD)) + '%';
 } else if (battle.id === 'squadron') {
  objective = battle.squadronExit
   ? (en ? 'Extract aircraft · ' : '편대기 탈출 · ') + (battle.evacuated || 0) + '/' + SQUADRON_REQUIRED
   : battle.rallied >= SQUADRON_REQUIRED
    ? (en ? 'Cover the regrouped flight' : '재집결한 편대 엄호')
    : (en ? 'Fly close to rally · ' : '편대기에 접근해 재집결 · ') + (battle.rallied || 0) + '/' + SQUADRON_REQUIRED;
 } else if (battle.id === 'ace' && battle.repair < REPAIR_TIME) {
  objective = (en ? 'Fly alongside for restart · ' : '근접 엄호로 재시동 · ') + Math.floor(100 * battle.repair / REPAIR_TIME) + '%';
 } else if (battle.id === 'prototype' && battle.testLeg < battle.testRoute.length) {
  objective = (en ? 'Escort through test gates · ' : '시험 비행 검문점 호위 · ') + battle.testLeg + '/' + battle.testRoute.length;
 } else if (battle.routeComplete) objective = en ? 'Drive off the pursuit flight' : '남은 추격조 격퇴';
 else if (battle.exitStarted) objective = (en ? 'Cover the exit · ' : '이탈 엄호 · ') + Math.round(100 * (battle.exitProgress || 0)) + '%';
 else objective = en ? 'Hold off the pursuit flight' : '추격조 저지';
 const threats = operationThreats(battle), ace = live(battle.ace);
 const squadron = battle.id === 'squadron';
 const alive = squadron ? survivors(battle) : 0;
 const status = squadron ? (en ? `Survivors ${alive}/5` : `생존기 ${alive}/5`) : `${UNIT_NAMES[battle.id][L]} ${hp}%`;
 const timeLeft = Math.max(0, Math.ceil(SPECIAL_OPERATION_LIMIT - now));
 const meta = [status, ace ? (en ? 'Enemy ace' : '적 에이스') + ' ' + Math.ceil(100 * battle.ace.hp / (battle.ace.maxHp || 1)) + '%' : null,
  timeLeft <= 15 ? (en ? `${timeLeft} s left` : `${timeLeft}초 남음`) : threats ? (en ? `${threats} hostile` : `적기 ${threats}`) : null].filter(Boolean).join(' · ');
 return {title: CARD_TITLES[battle.id][L], objective, meta, urgent: left != null && left > 0 && left <= 3};
}
