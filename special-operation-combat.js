import {PILOT_AIRCRAFT} from './pilot-aircraft.js?v=09c75d146ae4289d';
import {FAMOUS_WING_BALANCE} from './famous-wing-combat.js?v=09c75d146ae4289d';
import {operationOutcome, SPECIAL_OPERATION_WAVES, SPECIAL_OPERATION_EXIT_AT, SPECIAL_OPERATION_TRAIN_ESCAPE, SPECIAL_OPERATION_CARGO_HOLD, SPECIAL_OPERATION_DEMOLITION} from './special-operations.js?v=09c75d146ae4289d';

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
  // Armoured, and sized to the pilot's own guns: stopping the train is a chase
  // of several passes under flak, not one burst from any build.
  const shot = Math.max(8, (player.damage || 8) * (game.globalDamageMult || 1));
  const engine = addRailCar(game, 'engine', x, y, Math.max(520, Math.round(shot * 90)));
  const flak = addRailCar(game, 'flak', x - sign * 110, y, Math.max(300, Math.round(shot * 50)));
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
 battle.script = OPERATION_SCRIPTS[id] ? 0 : null;
 game.operationBattle = battle;
 return battle;
}

// Each operation is a short story, not four identical waves: two or three
// scripted crises, each announced (toast + mission card countdown) and each
// answerable by the pilot. All use existing aircraft, AI and art.
const say = (game, text) => game.event?.('wave', text);
function alertFor(battle, text, seconds = 0) {
 battle.alert = {text, until: battle.elapsed + Math.max(4, seconds), countdownTo: seconds ? battle.elapsed + seconds : null};
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
   say(game, '시험기 엔진 고장 · 속도 저하 10초 · 추격조가 붙습니다');alertFor(battle, '엔진 고장 · 시험기 감속', 10);
   diveFlight(game, battle, target, 2, {side: -1, distance: 480});
  }},
  {at: 22, run(game, battle, target) {
   diveFlight(game, battle, target, 3, {side: 1});
   say(game, '급강하 공격조 접근 · 시험기를 노립니다');alertFor(battle, '급강하 공격조 접촉', 3);
  }},
  {at: 36, run(game, battle, target) {
   if (!interceptAce(game, battle, target)) return;
   say(game, '적 에이스 요격 · 이탈 전에 격추하세요');alertFor(battle, '적 에이스가 시험기를 추격', 0);
  }}
 ],
 cargo: [
  {at: 14, run(game, battle) {
   battle.train.speed = 98;say(game, '열차 가속 · 터널 진입 전에 기관차를 멈추세요');alertFor(battle, '열차 가속', 0);
  }},
  {at: 26, run(game, battle) {
   const player = lead(game);if (!player) return;
   for (const e of diveFlight(game, battle, player, 2, {type: 'scout', side: -1, distance: 520})) e.operationStrike = false;
   say(game, '열차 엄호기 출격');alertFor(battle, '열차 엄호기', 0);
  }}
 ],
 squadron: [
  {at: 7, run(game, battle) {latchOn(game, battle, 1);}},
  {at: 20, run(game, battle) {latchOn(game, battle, 2);}},
  {at: 32, run(game, battle) {
   const leader = battle.patrols[0];if (!live(leader)) return;
   diveFlight(game, battle, leader, 5, {type: 'scout', side: 1, distance: 640});
   say(game, '적 대편대 돌입 · 편대장을 지키세요');alertFor(battle, '적 대편대 돌입', 4);
  }}
 ],
 ace: [
  {at: 0, run(game, battle, target) {
   target.hp = Math.round(target.maxHp * .55);battle.engineTrouble = battle.elapsed + 15;
   say(game, '구출 대상 피격 · 엔진 손상으로 감속 중');alertFor(battle, '에이스 엔진 손상', 15);
  }},
  {at: 17, run(game, battle, target) {
   if (!interceptAce(game, battle, target)) return;
   say(game, '적 에이스가 구출 대상을 추격 · 격추하세요');alertFor(battle, '적 에이스 추격', 0);
  }},
  {at: 30, run(game, battle, target) {
   diveFlight(game, battle, target, 2, {side: -1});
   say(game, '추격조 합류');alertFor(battle, '추격조 합류', 3);
  }}
 ]
});
// A pair of hunters fastens onto one squadron member at a time.
function latchOn(game, battle, round) {
 const members = battle.patrols.filter(live);if (!members.length) return;
 const member = members[(round * 2 + 1) % members.length];
 diveFlight(game, battle, member, 2, {side: round % 2 ? 1 : -1, distance: 460});
 say(game, `편대원 ${(member.slot ?? 0) + 1}번기 추격당함 · 떼어내세요`);alertFor(battle, `${(member.slot ?? 0) + 1}번기 추격당함`, 0);
}
function runScript(game, battle) {
 const script = OPERATION_SCRIPTS[battle.id];if (!script || battle.script == null) return;
 const target = battle.patrols[0];
 while (battle.script < script.length && battle.elapsed >= script[battle.script].at) {
  const step = script[battle.script++];
  if (battle.train || live(target)) step.run(game, battle, target);
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

function advanceTrain(game, battle, dt) {
 const train = battle.train;
 train.age += dt;
 const speed = live(train.engine) ? (train.speed || 72) : 0;
 train.x += train.sign * speed * dt;
 for (const [slot, car] of [train.engine, train.flak, train.cargo].entries()) {
  if (car) {car.x = train.x - train.sign * slot * 110; car.y = train.y;}
 }
 const player = lead(game);
 train.inRange = live(train.cargo) && pilots(game).some(pilot =>
  live(pilot) && pilot.status !== 'downed' && Math.hypot(pilot.x-train.cargo.x,pilot.y-train.cargo.y) < 320);
 // Once the train is stopped, a demolition flight comes to blow the cargo
 // before it can be taken: shoot it down, then hold over the cargo.
 if (!live(train.engine) && !live(train.flak) && live(train.cargo) && !train.demolition) {
  const player = lead(game);
  const crew = player ? diveFlight(game, battle, train.cargo, 2, {side: 1, distance: 520}) : [];
  if (crew.length) {
   train.demolition = {deadline: battle.elapsed + SPECIAL_OPERATION_DEMOLITION, crew};
   say(game, `적 폭파조 접근 · ${SPECIAL_OPERATION_DEMOLITION}초 안에 격추하세요`);alertFor(battle, '폭파조가 화물을 노림', SPECIAL_OPERATION_DEMOLITION);
  }
 }
 const crew = train.demolition?.crew.filter(live).length || 0;
 if (train.demolition && crew && battle.elapsed >= train.demolition.deadline && live(train.cargo)) {
  train.cargo.hp = 0;train.demolished = true;say(game, '화물 폭파됨');
 }
 if (!live(train.engine) && !live(train.flak) && train.inRange && train.demolition && !crew) train.secured += dt;
 if (!player || !live(train.flak) || train.age < train.nextFire || Math.hypot(player.x - train.flak.x, player.y - train.y) > 520) return;
 train.nextFire = train.age + 1.8;
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
 runScript(game, battle);
 if (battle.train) advanceTrain(game, battle, dt);
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

// Mission card: what is happening now, how long is left, how the protected unit is holding.
const CARD_TITLES = {prototype: ['시험기 호위', 'PROTOTYPE ESCORT'], cargo: ['비밀병기 탈취', 'SECRET CARGO RAID'], squadron: ['특수편대 구출', 'SQUADRON RESCUE'], ace: ['에이스 구출', 'ACE RESCUE']};
const UNIT_NAMES = {prototype: ['시험기', 'Prototype'], cargo: ['화물칸', 'Cargo'], squadron: ['편대장', 'Leader'], ace: ['에이스', 'Ace']};
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
 const left = alert?.countdownTo != null ? Math.max(0, Math.ceil(alert.countdownTo - now)) : null;
 let objective;
 if (alert) objective = alert.text + (left ? ` · ${left}${en ? ' s' : '초'}` : '');
 else if (train) {
  const tunnel = Math.max(0, Math.ceil(SPECIAL_OPERATION_TRAIN_ESCAPE - train.age));
  objective = live(train.engine) ? (en ? `Stop the engine · tunnel in ${tunnel} s` : `기관차 정지 · 터널까지 ${tunnel}초`)
   : live(train.flak) ? (en ? 'Silence the flak car' : '대공 화차 제압')
   : (en ? `Hold over the cargo · ${Math.round(100 * Math.min(1, train.secured / SPECIAL_OPERATION_CARGO_HOLD))}%` : `화물 확보 · ${Math.round(100 * Math.min(1, train.secured / SPECIAL_OPERATION_CARGO_HOLD))}%`);
 } else if (now >= SPECIAL_OPERATION_EXIT_AT) objective = (en ? 'Clear the exit route · ' : '이탈 경로 확보 · ') + Math.round(100 * (battle.exitProgress || 0)) + '%';
 else objective = (en ? 'Protect · exit in ' : '보호 · 이탈까지 ') + Math.ceil(SPECIAL_OPERATION_EXIT_AT - now) + (en ? ' s' : '초');
 const threats = operationThreats(battle), ace = live(battle.ace);
 const meta = [`${UNIT_NAMES[battle.id][L]} ${hp}%`, ace ? (en ? 'Enemy ace' : '적 에이스') + ' ' + Math.ceil(100 * battle.ace.hp / (battle.ace.maxHp || 1)) + '%' : null, threats ? (en ? `${threats} hostile` : `적기 ${threats}`) : null].filter(Boolean).join(' · ');
 return {title: CARD_TITLES[battle.id][L], objective, meta, urgent: !!alert && left != null && left > 0 && left <= 3};
}
