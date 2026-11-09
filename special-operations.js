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
 ace: Object.freeze({title: '에이스 구출', maps: ['alps', 'city', 'trenches-hell', 'somme'], reward: '에이스 파일럿 합류'})
});

export const SPECIAL_OPERATION_AFTER = 4;
export const SPECIAL_OPERATION_LIMIT = 96;
export const SPECIAL_OPERATION_WAVES = Object.freeze([0, 14, 28, 42]);
export const SPECIAL_OPERATION_EXIT_AT = 46;
// The train reaches its tunnel: shorter, so the chase is a chase.
export const SPECIAL_OPERATION_TRAIN_ESCAPE = 62;
export const SPECIAL_OPERATION_CARGO_HOLD = 3;
// Seconds the demolition flight needs to blow a stopped cargo car.
export const SPECIAL_OPERATION_DEMOLITION = 14;

// Keep the opening, the Laon/Paris approach and the faction capital in the
// route. Reserve Cambrai for the rail operation and sample the other bands.
export function planOperationRoute(stages, pools, faction, rng) {
 const early = shuffle(pools.early, rng).slice(0, 2);
 const mid = shuffle(pools.mid.filter(i => stages[i] !== 'cambrai'), rng).slice(0, 3);
 const late = shuffle(pools.late.filter(i => !['london', 'berlin', 'paris-night'].includes(stages[i])), rng)[0];
 const index = name => stages.indexOf(name);
 return [pools.opening, ...early, ...mid, late, index('laon'), index('paris-night'), index(faction === 'entente' ? 'berlin' : 'london')];
}

export function rollOperationChoices(stages, route, rng) {
 const used = new Set(route.map(i => stages[i]));
 const available = Object.entries(SPECIAL_OPERATIONS).map(([id, spec]) => {
  const maps = shuffle(spec.maps.filter(map => stages.includes(map) && !used.has(map)), rng);
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
