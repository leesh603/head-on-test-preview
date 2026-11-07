// AI versions of the pilot abilities run on the wingman, with its own timers.
// A wingman never invokes the player's skill or publishes a skill/cut-in event.
const profiles = {
 baron: ['pursuit', 'hunt'],
 voss: ['outnumbered', 'reverse'],
 boelcke: ['flank', 'rally'],
 udet: ['underFire', 'reverse'],
 goering: ['formation', 'rally'],
 immelmann: ['turn', 'reverse'],
 huffzky: ['rear', 'rear'],
 berthold: ['underFire', 'guard'],
 wolff: ['unhurt', 'dive'],
 loewenhardt: ['headOn', 'dive'],
 jacobs: ['flank', 'fan'],
 gontermann: ['pursuit', 'ignite'],
 lothar: ['retarget', 'hunt'],
 sachsenberg: ['armor', 'dive'],
 schleich: ['armor', 'guard'],
 fonck: ['precision', 'salvo'],
 collishaw: ['formation', 'rally'],
 baracca: ['headOn', 'charge'],
 guynemer: ['cannon', 'rockets'],
 bishop: ['close', 'bomb'],
 mannock: ['formation', 'rally'],
 mckeever: ['rear', 'rear'],
 hawker: ['retarget', 'hunt'],
 mccudden: [null, 'repair'],
 nungesser: ['closePursuit', 'charge'],
 rickenbacker: ['outnumbered', 'charge'],
 ball: ['alone', 'ambush'],
 barker: ['underFire', 'guard'],
 luke: ['balloon', 'ignite'],
 proctor: ['fresh', 'salvo'],
 lufbery: ['formation', 'guard'],
 navarre: ['pierce', 'salvo'],
 frommherz: ['precision', 'salvo'],
 friedrich_karl: ['pursuit', 'rockets'],
 robinson: ['pursuit', 'ignite'],
};

const durations = {
 hunt: 3.4, reverse: 1.1, rally: 3, rear: 2.5, guard: 2.4,
 dive: 2.5, fan: 1.4, ignite: 3, salvo: 1.6, charge: 3,
 rockets: 1.5, bomb: 1, ambush: 2.2, repair: 0,
};

const isLive = entity => entity?.hp > 0 && entity.life !== 0 && !entity.expired && !entity.crashing;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function tacticalContext(world, owner, wing, target, state, passive) {
 const countFriends = ['formation', 'alone', 'pierce'].includes(passive);
 const friends = countFriends ? [owner, ...(world.players || []).filter(player => player !== owner), ...(world.allies || [])] : [];
 const nearbyFriends = friends.filter(friend => friend !== wing && friend.life !== 0 &&
  (friend.hp == null || isLive(friend)) && distance(friend, wing) < 240).length;
 const nearbyEnemies = !['outnumbered', 'pierce'].includes(passive) ? 0 : (world.enemies || []).filter(enemy => isLive(enemy) && !enemy.surface && distance(enemy, wing) < 320).length;
 const bearing = Math.atan2(wing.y - target.y, wing.x - target.x);
 const aspect = Math.abs(angleDelta(bearing, target.a || 0));
 const sinceHit = state.clock - state.lastDamage;
 return {nearbyFriends, nearbyEnemies, aspect, sinceHit};
}

export function tickAceWingPilot(wing, dt, cooldown) {
 if (!profiles[wing.acePilot]) return;
 const state = wing._netAcePilotState ??= {
  clock: 0, readyAt: 1.4, activeUntil: 0, lastDamage: -Infinity,
  target: null, roundsOnTarget: 0, cannonAt: 1.5, mode: null,
 };
 state.clock += dt;
 state.cooldown = cooldown;
 if (state.clock >= state.activeUntil) state.mode = null;
}

export function aceWingFlightTuning(wing) {
 const mode = wing._netAcePilotState?.mode;
 if (mode === 'reverse' || mode === 'ambush') return {speed: 1.08, turn: 1.3};
 if (mode === 'dive' || mode === 'charge') return {speed: 1.27, turn: mode === 'dive' ? .92 : 1.12};
 if (mode === 'hunt') return {speed: .92, turn: 1.25};
 return null;
}

export function aceWingDamageTaken(wing, damage) {
 const state = wing._netAcePilotState;
 if (!state) return damage;
 state.lastDamage = state.clock;
 if (wing.acePilot === 'barker' && damage >= wing.hp && state.clock >= state.readyAt) {
  activate(wing, state, 'guard');
 }
 if (state.mode === 'guard') damage *= .62;
 if (profiles[wing.acePilot]?.[0] === 'armor') damage *= .82;
 if (wing.acePilot === 'barker' && state.mode === 'guard') damage = Math.min(damage, Math.max(0, wing.hp - 1));
 return damage;
}

function activate(wing, state, mode) {
 state.mode = mode;
 state.activeUntil = state.clock + durations[mode];
 state.readyAt = state.clock + state.cooldown;
 if (mode === 'repair') {
  wing.hp = Math.min(wing.maxHp, wing.hp + wing.maxHp * .4);
  wing.hitFlash = 0;
 } else if (mode === 'reverse' || mode === 'ambush') {
  wing.invuln = Math.max(wing.invuln || 0, .7);
 }
 return mode;
}

export function aceWingDefensiveSkill(wing, target) {
 const state = wing._netAcePilotState;
 if (!state || state.clock < state.readyAt || state.mode) return;
 const mode = profiles[wing.acePilot][1], health = wing.hp / wing.maxHp;
 if ((mode === 'repair' && health < .8) || (mode === 'guard' && (health < .62 || state.clock - state.lastDamage < .8))) {
  activate(wing, state, mode);
 } else if (mode === 'reverse' && isLive(target) && !target.surface && distance(target, wing) < 210) {
  const bearing = Math.atan2(target.y - wing.y, target.x - wing.x);
  if (Math.abs(angleDelta(bearing, wing.a)) > 1.9) activate(wing, state, mode);
 }
}

export function aceWingFireProfile(world, owner, wing, target, gap) {
 const state = wing._netAcePilotState;
 if (!state) return {damage: 1, cadence: 1, volley: []};
 const [passive, active] = profiles[wing.acePilot];
 const switched = state.target !== target;
 const retargeted = switched && state.target && state.target.hp <= 0;
 if (switched) {
  state.target = target;
  state.roundsOnTarget = 0;
  state.retargetUntil = retargeted ? state.clock + 2.5 : 0;
 }
 state.roundsOnTarget++;
 const {nearbyFriends, nearbyEnemies, aspect, sinceHit} = tacticalContext(world, owner, wing, target, state, passive);
 let damage = 1, cadence = 1, mode = state.mode, triggered = null;
 const cleanApproach = gap < 420;
 if (state.clock >= state.readyAt && !mode && !['repair', 'rear'].includes(active) &&
  (active === 'salvo' ? gap < 560 : active === 'ambush' ? cleanApproach && aspect > 1.6 : cleanApproach)) {
  triggered = mode = activate(wing, state, active);
 }

 switch (passive) {
  case 'pursuit': damage += Math.min(.28, (state.roundsOnTarget - 1) * .07); break;
  case 'closePursuit': if (gap < 290) damage += Math.min(.28, (state.roundsOnTarget - 1) * .09); break;
  case 'outnumbered': damage += Math.min(.25, nearbyEnemies * .05); break;
  case 'flank': if (aspect > 1.7) damage += .24; break;
  case 'headOn': if (!target.surface && aspect < .75) damage += .25; break;
  case 'formation': cadence += Math.min(.24, nearbyFriends * .08); break;
  case 'underFire': if (sinceHit < 2.5) damage += .24; break;
  case 'turn': if (state.clock < (state.turnUntil || 0)) cadence += .22; break;
  case 'unhurt': damage += Math.min(.22, Math.min(sinceHit, state.clock) * .04); break;
  case 'retarget': if (state.clock < state.retargetUntil) cadence += .35; break;
  case 'close': damage += Math.max(0, 1 - gap / 340) * .48; break;
  case 'alone': if (!nearbyFriends) damage += .3; break;
  case 'balloon': if (target.type === 'zeppelin' || target.fieldUnit === 'balloon' || target.stageBossBody?.airshipBoss) damage += .34; break;
  case 'fresh': if (switched && !target.surface && !target.stageBossBody && !target.bossPilot && !target.eliteKind &&
   ['fighter', 'hunter', 'scout'].includes(target.type) && Number.isFinite(target.fire)) target.fire = Math.max(.28, target.fire); break;
 }
 if (mode === 'hunt' || mode === 'dive' || mode === 'charge' || mode === 'rear') cadence *= 1.4;
 if (mode === 'hunt' || mode === 'guard' || mode === 'ambush') damage *= 1.28;
 if (mode === 'rally') cadence *= 1.28;

 const cannon = passive === 'cannon' && state.clock >= state.cannonAt;
 if (cannon) state.cannonAt = state.clock + 2.8;
 const airburst = triggered === 'rockets';
 const bomb = triggered === 'bomb';
 const volley = triggered === 'salvo' ? [-.045, .045] : triggered === 'fan' || airburst ? [-.13, .13] : triggered === 'rally' ? [-.08, .08] : [];
 return {damage, cadence, cannon, airburst, bomb, volley,
  pierce: mode === 'salvo' || mode === 'reverse' || mode === 'charge' && wing.acePilot === 'nungesser' || passive === 'pierce' && nearbyEnemies > nearbyFriends + 1,
  ignite: mode === 'ignite',
 };
}

export function aceWingAimCone(wing) {
 return profiles[wing.acePilot]?.[0] === 'precision' ? .21 : .16;
}

export function noteAceWingTurn(wing, turn) {
 const state = wing._netAcePilotState;
 if (state && wing.acePilot === 'immelmann' && Math.abs(turn) > .7) state.turnUntil = state.clock + .7;
}

export function aceWingRearShot(wing, enemies, canEngage) {
 const state = wing._netAcePilotState;
 if (!state || profiles[wing.acePilot][0] !== 'rear' || state.clock < (state.rearAt || 0)) return null;
 let range = 290, target = null;
 for (const enemy of enemies) {
  if (!isLive(enemy) || !canEngage(enemy)) continue;
  const gap = distance(enemy, wing);
  if (gap >= range) continue;
  const bearing = Math.atan2(enemy.y - wing.y, enemy.x - wing.x);
  if (Math.abs(angleDelta(bearing, wing.a)) < 2.1) continue;
  target = enemy;
  range = gap;
 }
 if (!target) return null;
 if (!state.mode && state.clock >= state.readyAt) activate(wing, state, 'rear');
 state.rearAt = state.clock + (state.mode === 'rear' ? .27 : .82);
 return {target, damage: state.mode === 'rear' ? 11 : 5};
}
