const shuffle = (items, rng) => {
 const result = [...items];
 for (let i = result.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  [result[i], result[j]] = [result[j], result[i]];
 }
 return result;
};

export const SPECIAL_OPERATIONS = Object.freeze({
 prototype: Object.freeze({title: '시험기 호위', maps: ['city', 'trenches', 'alps', 'somme'], reward: '신형기 양산'}),
 cargo: Object.freeze({title: '비밀병기 탈취', maps: ['cambrai'], reward: '노획 특수장비'}),
 squadron: Object.freeze({title: '특수편대 구출', maps: ['trenches', 'trenches-hell', 'somme', 'city'], reward: '특수편대 합류'}),
 ace: Object.freeze({title: '에이스 구출', maps: ['alps', 'city', 'trenches-hell', 'somme'], reward: '에이스 파일럿 합류'}),
 submarine: Object.freeze({title: '유보트 전대 작전', maps: ['sea', 'jutland'], reward: '노획 특수장비'}),
 // Minigame operations: each scores one skill instead of holding off waves.
 dogfight: Object.freeze({title: '에이스 결투', maps: ['sky', 'arras', 'somme', 'verdun', 'alps'], reward: '훈장'}),
 race: Object.freeze({title: '공중질주', maps: ['sky', 'alps', 'sea', 'gallipoli', 'maan'], reward: '최고 속도 증가'}),
 barrage: Object.freeze({title: '포격지대 돌파', maps: ['trenches', 'trenches-hell', 'somme', 'verdun', 'rural'], reward: '폭탄 계열 강화 3회'})
});

export const SPECIAL_OPERATION_AFTER = 4;
export const SPECIAL_OPERATION_LIMIT = 96;
export const SPECIAL_OPERATION_WAVES = Object.freeze([0, 14, 28, 42]);
export const SPECIAL_OPERATION_EXIT_AT = 46;
// The train reaches its tunnel: shorter, so the chase is a chase.
export const SPECIAL_OPERATION_TRAIN_ESCAPE = 62;
export const SPECIAL_OPERATION_CARGO_HOLD = 5;
export const SPECIAL_OPERATION_RAIL_CAR_LENGTH = 162;
// Seconds the demolition flight needs to blow a stopped cargo car.
export const SPECIAL_OPERATION_DEMOLITION = 14;
// Ace rescue: the pilot holds a tight ring beside the damaged ace while its engine is
// restarted. Leaving the ring bleeds the restart; a pursuer inside `pause` px of the ace
// halts it. The ring is wide enough for the fastest fighter to orbit inside.
// Squadron rescue: hover by each scattered aircraft to rally it; rallied aircraft fall in
// behind the pilot in a line and are led out through an exit gate.
// Prototype escort: a wing slot beside the prototype. Flying in it lets the prototype run
// at full speed; leaving it slows the prototype down for its pursuers.
export const SPECIAL_OPERATION_SLOT = Object.freeze({abeam: 95, radius: 80, fast: 180, slow: 112, cover: .5});
// Outermost hitPatrol layer: a wingman in the slot screens the prototype (half damage).
export function installEscortCover(Game) {
 if (Game.prototype.__escortCover) return;
 Game.prototype.__escortCover = true;
 const hitPatrol = Game.prototype.hitPatrol;
 Game.prototype.hitPatrol = function (p, damage, ...rest) {
  const battle = this.operationBattle;
  const covered = battle?.id === 'prototype' && battle.inSlot && p?.operationTarget && battle.patrols?.[0] === p;
  return hitPatrol.call(this, p, covered ? damage * SPECIAL_OPERATION_SLOT.cover : damage, ...rest);
 };
}
// Train chase: guns bite on a strafing run along the rails (heading within `cone` of the
// track, inside `lane` px of it); crossing passes glance off the armour. The flak car
// cannot depress onto a pilot riding right over it (`blind` px).
export const SPECIAL_OPERATION_STRAFE = Object.freeze({cone: .5, lane: 90, strafe: 1.6, offAxis: .5, blind: 130});
export const strafingRun = (pilot, train) => !!pilot && !!train && Math.abs(Math.sin(pilot.a || 0)) <= SPECIAL_OPERATION_STRAFE.cone
 && Math.abs(pilot.y - train.y) <= SPECIAL_OPERATION_STRAFE.lane;
// Outermost roundDamageMultiplier layer for the rail cars.
export function installRailStrafe(Game) {
 if (Game.prototype.__railStrafe) return;
 Game.prototype.__railStrafe = true;
 const damage = Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier = function (b, e) {
  const base = damage.call(this, b, e), train = (this.world || this).operationBattle?.train;
  if (!e?.operationRailCar || !train) return base;
  return base * (strafingRun(this, train) ? SPECIAL_OPERATION_STRAFE.strafe : SPECIAL_OPERATION_STRAFE.offAxis);
 };
}
// Periscope hunt (Entente U-boat operation): each contact arrives submerged, shows only its
// wake and stays down for `hide` s. A pilot holding inside `markRadius` px of it for `markTime` s
// forces it up for a `pinned` s window; unforced, it dives again after `window` s.
export const SPECIAL_OPERATION_PERISCOPE = Object.freeze({window: 4.5, hide: 14, markRadius: 140, markTime: 1.5, pinned: 7});
export const SPECIAL_OPERATION_RALLY = Object.freeze({dwell: 2.5, spacing: 70, exitDistance: 1700, exitRadius: 120});
export const SPECIAL_OPERATION_REPAIR = Object.freeze({radius: 190, time: 10, decay: .6, strikeEvery: 7, pause: 170});

// Keep the opening, the Laon/Paris approach and the faction capital in the
// route. The rail operation is drawn separately from regular Cambrai.
export function planOperationRoute(stages, pools, faction, rng) {
 const early = shuffle(pools.early, rng).slice(0, 2);
 const mid = shuffle(pools.mid, rng).slice(0, 3);
 const late = shuffle(pools.late.filter(i => !['london', 'berlin', 'paris-night'].includes(stages[i])), rng)[0];
 const index = name => stages.indexOf(name);
 return [pools.opening, ...early, ...mid, late, index('laon'), index('paris-night'), index(faction === 'entente' ? 'berlin' : 'london')];
}

export function rollOperationChoices(stages, route, rng) {
 const used = new Set(route.map(i => stages[i]));
 const available = Object.entries(SPECIAL_OPERATIONS).map(([id, spec]) => {
  const maps = shuffle(spec.maps.filter(map => stages.includes(map) && (id==='cargo'||!used.has(map))), rng);
  return {id, maps};
 }).filter(choice => choice.maps.length);
 return shuffle(available, rng).slice(0, 2).map(({id, maps}) => ({id, stageIndex: stages.indexOf(maps[0])}));
}

export function chooseOperation(offer, id) {
 if (offer?.phase !== 'offer') return null;
 const choice = offer.choices.find(option => option.id === id);
 if (!choice) return null;
 return {...offer, ...choice, phase: 'active'};
}

export function operationOutcome(id, {elapsed, targetAlive, escaped = false, routeComplete = false, threats = 0, transportDisabled = false, cargoIntact = true}) {
 if (!targetAlive || escaped || !cargoIntact || elapsed >= SPECIAL_OPERATION_LIMIT) return 'failed';
 if (id === 'cargo') return transportDisabled ? 'succeeded' : null;
 return routeComplete && threats === 0 ? 'succeeded' : null;
}
