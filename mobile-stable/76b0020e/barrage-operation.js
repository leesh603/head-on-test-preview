// Special operation "포격지대 돌파": fly the length of a shelled corridor. No aircraft,
// only artillery on a fixed beat. Each shell is announced on a beat and lands two beats
// later, so the run reads like a rhythm game: read the pattern, move on the off-beat.
// Shells use the rural railway-gun telegraph and sounds; this file only schedules them
// and judges each landing (hit, graze, clear).

export const BARRAGE_BALANCE = Object.freeze({
 beat: .6,            // s per beat (100 BPM)
 warnBeats: 2,        // a shell lands this many beats after its telegraph appears
 lanes: 5,            // at most; a narrow (phone) view gets fewer so every lane is on screen
 laneWidth: 130,      // px at most
 minLanes: 3,
 viewShare: .88,      // the corridor uses at most this share of the view width
 radius: 60,          // px blast radius
 graze: 1.4,          // a landing between radius and radius × graze is a graze
 flightSeconds: 52,   // corridor length = pilot speed × this
 minLength: 7600,     // px
 limit: 90,           // s
 hitsAllowed: 3,      // the fourth hit fails the run
 hitDamage: .12,      // fraction of max hull per hit (never below 1 hull)
 segmentBeats: 8      // one pattern per segment
});

const B = BARRAGE_BALANCE;
const PATTERNS = ['line', 'zigzag', 'snake', 'target', 'line', 'walk', 'target', 'snake'];
const flying = p => p && p.hp > 0 && p.status !== 'downed';

export function corridorLanes(viewWidth = 1280) {
 const width = Math.min(B.lanes * B.laneWidth, Math.max(1, viewWidth) * B.viewShare);
 const lanes = Math.max(B.minLanes, Math.min(B.lanes, Math.floor(width / 110)));
 return {lanes, laneWidth: Math.min(B.laneWidth, width / lanes)};
}

export function startBarrageOperation(battle, player, rng, viewWidth = 1280) {
 const a = player.a || 0;
 const speed = player.speed || 160;
 battle.barrage = {...corridorLanes(viewWidth),
  ox: player.x, oy: player.y, ax: Math.cos(a), ay: Math.sin(a),
  length: Math.max(B.minLength, Math.round(speed * B.flightSeconds)),
  beat: 0, nextBeat: 1.5, shells: [], hits: 0, grazes: 0, clears: 0,
  gap: 2, side: 1, seed: Math.floor(rng() * 1e9), progress: 0, lastJudgement: null
 };
 return battle.barrage;
}

const along = (b, p) => (p.x - b.ox) * b.ax + (p.y - b.oy) * b.ay;
const lateral = (b, p) => -(p.x - b.ox) * b.ay + (p.y - b.oy) * b.ax;
const laneCenter = (b, lane) => (lane - (b.lanes - 1) / 2) * b.laneWidth;
const point = (b, s, l) => ({x: b.ox + b.ax * s - b.ay * l, y: b.oy + b.ay * s + b.ax * l});
const half = b => b.lanes * b.laneWidth / 2;
const laneOf = (b, l) => Math.max(0, Math.min(b.lanes - 1, Math.round(l / b.laneWidth + (b.lanes - 1) / 2)));
const rand = b => ((b.seed = (Math.imul(b.seed, 1664525) + 1013904223) >>> 0) / 4294967296);

// The shells for one beat, as {s, l} corridor coordinates. `ahead` is where the pilot
// will be when they land. Every pattern asks for at most one lane (130 px) of sideways
// travel per 1.2 s, which the slowest fighter (~160 px/s) can fly while keeping way.
function beatShells(b, ahead, playerLane, playerLateral) {
 const segment = Math.floor(b.beat / B.segmentBeats), step = b.beat % B.segmentBeats;
 const kind = PATTERNS[segment % PATTERNS.length], hard = segment >= PATTERNS.length;
 const row = gapLanes => Array.from({length: b.lanes}, (_, lane) => lane).filter(l => !gapLanes.includes(l)).map(l => ({s: ahead, l: laneCenter(b, l)}));
 switch (kind) {
  case 'line': // a wall every other beat with one open lane that moves by at most one
   if (step % 2) return [];
   b.gap = Math.max(0, Math.min(b.lanes - 1, b.gap + (rand(b) < .5 ? -1 : 1)));
   return row([b.gap]);
  case 'snake': // a wall on every beat; the open lane slides one lane every third beat (second when hard)
   if (step % (hard ? 2 : 3) === 0) {
    if (b.gap + b.side < 0 || b.gap + b.side > b.lanes - 1) b.side *= -1;
    b.gap += b.side;
   }
   return row([b.gap, ...(hard ? [] : [b.gap - b.side])]);
  case 'zigzag': // single heavy shells alternating sides of the pilot
   b.side *= -1;
   return [{s: ahead, l: playerLateral + b.side * b.laneWidth * .55}, ...(hard ? [{s: ahead + 140, l: playerLateral - b.side * b.laneWidth}] : [])];
  case 'target': // on the pilot's predicted point every beat: keep moving
   return [{s: ahead, l: playerLateral}, ...(step % 2 ? [] : [{s: ahead, l: laneCenter(b, Math.max(0, Math.min(b.lanes - 1, playerLane + (rand(b) < .5 ? -2 : 2))))}])];
  case 'walk': { // a creeping barrage: three rows whose open lane steps sideways row by row
   if (step % 4) return [];
   const start = laneOf(b, playerLateral), dir = start >= b.lanes - 1 ? -1 : start <= 0 ? 1 : rand(b) < .5 ? -1 : 1;
   return [0, 1, 2].flatMap(k => row([Math.max(0, Math.min(b.lanes - 1, start + dir * k))]).map(x => ({...x, s: ahead + k * 240})));
  }
  default: return [];
 }
}

// One tick. `spawnShell` draws a telegraph ({x,y,radius,warning}); `sound` plays a cue.
// Returns 'succeeded', 'failed' or null.
export function tickBarrageOperation(battle, pilots, dt, {spawnShell = () => {}, sound = () => {}, say = () => {}} = {}) {
 const b = battle.barrage;
 if (!b) return null;
 if (battle.downed) return 'failed'; // a lethal hit from anything else (dogfight-operation.js hit layer)
 const flyers = pilots.filter(flying);
 if (!flyers.length) return null;
 const lead = flyers[0], now = battle.elapsed;
 // Keep every pilot inside the corridor (no turning the run into a detour).
 for (const p of flyers) {
  const l = lateral(b, p), limit = half(b);
  if (Math.abs(l) > limit) {const s = along(b, p), q = point(b, s, Math.sign(l) * limit); p.x = q.x; p.y = q.y;}
 }
 b.progress = Math.max(b.progress, ...flyers.map(p => along(b, p)));
 // New beat: announce the shells that land two beats from now.
 while (now >= b.nextBeat) {
  const lead2 = flyers.reduce((best, p) => along(b, p) > along(b, best) ? p : best, lead);
  const v = Math.max(80, (lead2.vx != null ? lead2.vx * b.ax + lead2.vy * b.ay : lead2.speed) || lead2.speed || 160);
  const warn = B.beat * B.warnBeats, ahead = along(b, lead2) + v * warn, pl = lateral(b, lead2);
  for (const shell of beatShells(b, ahead, laneOf(b, pl), pl)) {
   const l = Math.max(-half(b) + B.radius * .5, Math.min(half(b) - B.radius * .5, shell.l));
   const at = point(b, shell.s, l);
   b.shells.push({...at, landAt: b.nextBeat + warn});
   spawnShell({...at, radius: B.radius, warning: warn - (now - b.nextBeat)});
  }
  sound(b.beat % 4 === 0 ? 'railGunFire' : 'railShellIncoming');
  b.beat++; b.nextBeat += B.beat;
 }
 // Landings.
 const landed = b.shells.filter(s => now >= s.landAt);
 if (landed.length) {
  b.shells = b.shells.filter(s => now < s.landAt);
  sound('railShellImpact');
  for (const p of flyers) {
   const d = Math.min(...landed.map(s => Math.hypot(p.x - s.x, p.y - s.y)));
   if (d < B.radius) {
    if ((p.invuln || 0) > 0) continue;
    b.hits++; b.lastJudgement = {kind: 'hit', at: now};
    p.hp = Math.max(1, p.hp - Math.ceil((p.maxHp || 100) * B.hitDamage));
    p.hitFlash = .2; p.invuln = Math.max(p.invuln || 0, .5); p.shake = 7;
    say(b.hits > B.hitsAllowed ? '포격에 격추 직전 · 돌파 실패' : `피격 ${b.hits}/${B.hitsAllowed + 1}`);
   } else if (d < B.radius * B.graze) {
    b.grazes++; b.lastJudgement = {kind: 'graze', at: now};
   } else b.clears++;
  }
 }
 if (b.hits > B.hitsAllowed) return 'failed';
 if (b.progress >= b.length) return 'succeeded';
 if (now >= B.limit) return 'failed';
 return null;
}

// Gold: no hit. Silver: one or two. Bronze: three. Twenty grazes lift one grade.
export function barrageGrade(b) {
 const base = b.hits === 0 ? 3 : b.hits <= 2 ? 2 : 1;
 return Math.min(3, base + (b.grazes >= 20 ? 1 : 0));
}
export const GRADE_RARITY = Object.freeze({3: 'rare', 2: 'magic', 1: 'normal'});

export function barrageSnapshot(battle) {
 const b = battle.barrage;
 if (!b) return null;
 return {ox: b.ox, oy: b.oy, ax: b.ax, ay: b.ay, length: b.length, half: half(b), lanes: b.lanes, progress: b.progress,
  hits: b.hits, grazes: b.grazes, beat: b.beat, nextBeat: b.nextBeat, lastJudgement: b.lastJudgement};
}

export function barrageOperationCard(battle, en = false) {
 const b = battle.barrage;
 if (!b) return null;
 const pct = Math.floor(100 * Math.min(1, b.progress / b.length));
 const recent = b.lastJudgement && battle.elapsed - b.lastJudgement.at < .7 ? b.lastJudgement.kind : null;
 const objective = recent === 'graze' ? (en ? `Close call · ${pct}%` : `아슬아슬 · ${pct}%`)
  : recent === 'hit' ? (en ? `Hit · ${pct}%` : `피격 · ${pct}%`)
  : (en ? `Break through · ${pct}%` : `포격선 돌파 · ${pct}%`);
 const left = Math.max(0, Math.ceil(B.limit - battle.elapsed));
 const meta = [(en ? 'Hits ' : '피격 ') + b.hits + '/' + (B.hitsAllowed + 1), (en ? 'Close calls ' : '아슬아슬 ') + b.grazes,
  left <= 15 ? (en ? `${left} s left` : `${left}초 남음`) : null].filter(Boolean).join(' · ');
 return {title: en ? 'BARRAGE RUN' : '포격지대 돌파', objective, meta, urgent: recent === 'hit'};
}

// Corridor edges and the finish line, in the caller's screen mapping.
export function drawBarrageOverlay(ctx, snapshot, toScreen, zoom) {
 if (!snapshot) return;
 const {ox, oy, ax, ay, length, half: h} = snapshot;
 const at = (s, l) => toScreen(ox + ax * s - ay * l, oy + ay * s + ax * l);
 ctx.save();
 ctx.lineWidth = 2.5 * zoom; ctx.setLineDash([16 * zoom, 12 * zoom]); ctx.strokeStyle = 'rgba(232,214,170,.55)';
 for (const side of [-1, 1]) {const a = at(snapshot.progress - 900, side * h), c = at(snapshot.progress + 1400, side * h); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();}
 ctx.setLineDash([]); ctx.lineWidth = 5 * zoom; ctx.strokeStyle = 'rgba(232,195,90,.9)';
 const f1 = at(length, -h), f2 = at(length, h); ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.stroke();
 ctx.restore();
}

// Reward: three upgrade drafts limited to the bomb family, rarity by grade.
export const BOMB_UPGRADE_IDS = Object.freeze(['rockets', 'mines', 'explosives', 'bomber', 'directFuse', 'fragmentationFuse']);
export function installBarrageDrafts(Game) {
 if (Game.prototype.__barrageDrafts) return;
 Game.prototype.__barrageDrafts = true;
 const check = Game.prototype.checkLevel;
 Game.prototype.checkLevel = function (...args) {
  if (this.state === 'playing' && this.bombDrafts > 0 && !this.world) {
   this.choicePoolIds = BOMB_UPGRADE_IDS;
   this.state = 'upgrade';
   this.event?.('upgrade', '포격지대 돌파 보상 · 폭탄 강화 선택');
   return;
  }
  return check.apply(this, args);
 };
 const roll = Game.prototype.rollChoices;
 Game.prototype.rollChoices = function (forceRarity = null, ...rest) {
  if (!(this.bombDrafts > 0)) return roll.call(this, forceRarity, ...rest);
  this.choicePoolIds = BOMB_UPGRADE_IDS;
  try {
   const picks = roll.call(this, forceRarity ?? this.bombDraftRarity ?? null, ...rest);
   if (!picks?.length) {this.bombDrafts = 0; delete this.choicePoolIds;}
   return picks;
  } finally {if (!(this.bombDrafts > 0)) delete this.choicePoolIds;}
 };
 const upgrade = Game.prototype.upgrade;
 Game.prototype.upgrade = function (id, ...rest) {
  if (!(this.bombDrafts > 0) || !BOMB_UPGRADE_IDS.includes(id) || this.state !== 'upgrade') return upgrade.call(this, id, ...rest);
  this.bombDrafts--;
  if (!this.bombDrafts) {delete this.choicePoolIds; delete this.bombDraftRarity;}
  const ok = upgrade.call(this, id, ...rest);
  if (!ok) {this.bombDrafts++; this.choicePoolIds = BOMB_UPGRADE_IDS;}
  return ok;
 };
}
