// Special operation "에이스 결투": one enemy ace, one ring of sky, no other aircraft.
// The fight is scored by tail position, not by a wave count. Sitting on the other
// aircraft's six (close, behind its tail, nose on it) fills that side's gauge; a full
// gauge is a decisive burst: a third of the ace's hull, or a heavy hit on the pilot.
// The ace keeps its own tactics (enemy-ace-tactics.js); this file only frames the duel.

import {medalDisplayName} from './equipment-names.js';
import {passiveMedalName} from './passive-medal-copy.js';

export const DOGFIGHT_BALANCE = Object.freeze({
 arenaRadius: 920,     // px from the start point; both aircraft are held inside
 tailRange: 380,       // px: farther than this is not "on the tail"
 tailMin: 90,          // px: closer than this is an overshoot, not a firing position
 tailCone: .8,         // rad off the target's tail (≈46°)
 noseCone: .6,         // rad: the chaser's nose must point at the target
 fillSeconds: 2.6,     // seconds on the tail (they add up across passes) to fill a gauge
 decay: .05,           // gauge lost per second off the tail
 contested: .3,        // gauge lost per second while the other side sits on your tail
 grace: 1.6,           // s after a decisive burst when no gauge fills
 wins: 3,              // decisive bursts needed by either side
 aceBurst: 1 / 3,      // fraction of the ace's max hull per player burst
 pilotBurst: .24,      // fraction of the pilot's max hull per ace burst
 limit: 90,            // s; on time the side with more bursts wins, ties fail
 speedBand: [1.08, 1.2], // ace cruise speed relative to the pilot, so a tail can be held or shaken
 contactRadius: 10,    // px body contact with the duel ace (an ordinary ace uses ~30)
 offTailDamage: .4     // gun rounds that hit the duel ace from off its tail (head-on, deflection)
});

const B = DOGFIGHT_BALANCE;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const live = e => e && e.hp > 0 && !e.expired && !e.crashing && !e.rivalEscaped;
const flying = p => p && p.hp > 0 && p.status !== 'downed';

// True when `chaser` sits on `target`'s six.
export function onTail(chaser, target) {
 const dx = chaser.x - target.x, dy = chaser.y - target.y, d = Math.hypot(dx, dy);
 if (d > B.tailRange || d < B.tailMin) return false;
 const behind = Math.abs(wrap(Math.atan2(dy, dx) - (target.a + Math.PI))) < B.tailCone;
 const nose = Math.abs(wrap(Math.atan2(-dy, -dx) - chaser.a)) < B.noseCone;
 return behind && nose;
}

export function startDogfightOperation(battle, player, spawnAce) {
 const heading = player.a || 0;
 const fight = battle.dogfight = {
  cx: player.x, cy: player.y, r: B.arenaRadius,
  player: 0, ace: 0, wins: 0, losses: 0, graceUntil: 0, last: null, aceName: ''
 };
 const ace = spawnAce({x: player.x + Math.cos(heading) * 640, y: player.y + Math.sin(heading) * 640});
 if (ace) {
  Object.assign(ace, {
   a: heading + Math.PI, dogfightAce: true, operationAce: true,
   // The ordinary 75 s sortie limit sends an ace home; in a duel it stays.
   aceSpawnT: Infinity,
   // Planes pass over each other in a turning fight; a duel is not won or lost by ramming.
   contactRadius: B.contactRadius
  });
  fight.aceName = ace.name || '';
  matchSpeed(ace, player);
 }
 battle.ace = ace;
 return fight;
}

function matchSpeed(ace, player) {
 const base = player.speed || 160;
 const lo = base * B.speedBand[0], hi = base * B.speedBand[1];
 ace.speed = Math.max(lo, Math.min(hi, ace.speed || base));
 if (ace.cruiseSpeedCap != null) ace.cruiseSpeedCap = Math.max(lo, Math.min(hi, ace.cruiseSpeedCap));
}

function hold(entity, fight) {
 const dx = entity.x - fight.cx, dy = entity.y - fight.cy, d = Math.hypot(dx, dy);
 if (d <= fight.r) return false;
 entity.x = fight.cx + dx / d * fight.r;
 entity.y = fight.cy + dy / d * fight.r;
 return true;
}

// One tick. `pilots` are the live player aircraft; `say` posts a toast.
// Returns 'succeeded', 'failed' or null.
export function tickDogfightOperation(battle, pilots, dt, say = () => {}) {
 const fight = battle.dogfight, ace = battle.ace;
 if (!fight) return null;
 if (battle.downed) return 'failed';
 if (!ace || ace.hp <= 0 || ace.crashing) return ace ? 'succeeded' : 'failed';
 if (!live(ace)) return 'failed';
 const flyers = pilots.filter(flying);
 if (!flyers.length) return null;
 for (const p of flyers) hold(p, fight);
 if (hold(ace, fight)) ace.a = Math.atan2(fight.cy - ace.y, fight.cx - ace.x);
 matchSpeed(ace, flyers[0]);
 const now = battle.elapsed, step = Math.max(0, Math.min(.1, dt));
 const pilotTail = flyers.some(p => onTail(p, ace));
 const aceTail = flyers.find(p => onTail(ace, p)) || null;
 fight.pilotTail = pilotTail; fight.aceTail = !!aceTail;
 ace.dogfightOffTail = !pilotTail;
 if (now >= fight.graceUntil) {
  const fill = (gauge, mine, theirs) => mine && !theirs ? Math.min(1, gauge + step / B.fillSeconds)
   : Math.max(0, gauge - (theirs ? B.contested : B.decay) * step);
  fight.player = fill(fight.player, pilotTail, !!aceTail);
  fight.ace = fill(fight.ace, !!aceTail, pilotTail);
 }
 if (fight.player >= 1) {
  fight.wins++; fight.player = fight.ace = 0; fight.graceUntil = now + B.grace; fight.last = {side: 'pilot', at: now};
  const burst = Math.ceil(ace.maxHp * B.aceBurst);
  ace.hp = fight.wins >= B.wins ? 0 : Math.max(1, ace.hp - burst);
  ace.hitFlash = .25;
  say(fight.wins >= B.wins ? '결정타 · 에이스 격추' : `결정타 ${fight.wins}/${B.wins} · 꼬리를 놓치지 마세요`);
  if (fight.wins >= B.wins) return 'succeeded';
 } else if (fight.ace >= 1) {
  fight.losses++; fight.player = fight.ace = 0; fight.graceUntil = now + B.grace; fight.last = {side: 'ace', at: now};
  const target = aceTail || flyers[0];
  // A duel loss costs the mission, never the run: the burst stops at 1 hull.
  target.hp = Math.max(1, target.hp - Math.ceil((target.maxHp || 100) * B.pilotBurst));
  target.hitFlash = .25;
  say(fight.losses >= B.wins ? '에이스에게 꼬리를 내줬습니다' : `꼬리 잡힘 ${fight.losses}/${B.wins} · 급선회로 떼어내세요`);
  if (fight.losses >= B.wins) return 'failed';
 }
 if (now >= B.limit) return fight.wins > fight.losses ? 'succeeded' : 'failed';
 return null;
}

export function dogfightSnapshot(battle) {
 const f = battle.dogfight, ace = battle.ace;
 if (!f) return null;
 return {cx: f.cx, cy: f.cy, r: f.r, player: f.player, ace: f.ace, wins: f.wins, losses: f.losses,
  pilotTail: !!f.pilotTail, aceTail: !!f.aceTail, last: f.last,
  aceX: ace?.x, aceY: ace?.y, aceHp: ace ? Math.max(0, Math.ceil(100 * ace.hp / (ace.maxHp || 1))) : 0, aceName: f.aceName};
}

export function dogfightOperationCard(battle, en = false) {
 const f = battle.dogfight;
 if (!f) return null;
 const dots = (n, mark) => Array.from({length: B.wins}, (_, i) => i < n ? mark : '○').join('');
 const gauge = Math.round(100 * Math.max(f.player, f.ace));
 const objective = f.aceTail && !f.pilotTail
  ? (en ? `On your tail · break · ${gauge}%` : `꼬리 잡힘 · 급선회 · ${gauge}%`)
  : f.pilotTail
   ? (en ? `On its tail · ${gauge}%` : `꼬리 물기 · ${gauge}%`)
   : (en ? 'Get on its tail' : '에이스 꼬리 잡기');
 const left = Math.max(0, Math.ceil(B.limit - battle.elapsed));
 const meta = [(en ? 'You ' : '나 ') + dots(f.wins, '●'), (en ? 'Ace ' : '적 ') + dots(f.losses, '●'),
  left <= 15 ? (en ? `${left} s left` : `${left}초 남음`) : null].filter(Boolean).join(' · ');
 return {title: en ? 'ACE DUEL' : '에이스 결투', objective, meta, urgent: !!(f.aceTail && !f.pilotTail && f.ace > .66)};
}

// World-space overlay: the arena edge and each side's gauge as an arc around the
// aircraft being chased. Screen mapping is the caller's (same as mission guides).
export function drawDogfightOverlay(ctx, snapshot, toScreen, zoom, player) {
 if (!snapshot) return;
 const center = toScreen(snapshot.cx, snapshot.cy);
 ctx.save();
 const near = player ? Math.hypot(player.x - snapshot.cx, player.y - snapshot.cy) / snapshot.r : 0;
 ctx.globalAlpha = Math.max(.18, Math.min(.8, (near - .6) * 2));
 ctx.setLineDash([14 * zoom, 12 * zoom]);
 ctx.lineWidth = 2.5 * zoom;
 ctx.strokeStyle = 'rgba(232,214,170,.9)';
 ctx.beginPath(); ctx.arc(center.x, center.y, snapshot.r * zoom, 0, Math.PI * 2); ctx.stroke();
 ctx.setLineDash([]);
 ctx.globalAlpha = 1;
 const arc = (x, y, value, color) => {
  if (!(value > .01)) return;
  const s = toScreen(x, y), r = 34 * zoom;
  ctx.lineWidth = 4 * zoom; ctx.strokeStyle = 'rgba(20,17,13,.55)';
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(s.x, s.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * value); ctx.stroke();
 };
 if (Number.isFinite(snapshot.aceX)) arc(snapshot.aceX, snapshot.aceY, snapshot.player, '#e8c35a');
 if (player) arc(player.x, player.y, snapshot.ace, '#d9483b');
 ctx.restore();
}

// Outermost roundDamageMultiplier and hit layers for the duel: guns bite fully only from
// the six, and being shot down ends the duel instead of the run.
export function installDogfightDuel(Game) {
 if (Game.prototype.__dogfightDuel) return;
 Game.prototype.__dogfightDuel = true;
 const damage = Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier = function (b, e) {
  const m = damage.call(this, b, e);
  return e?.dogfightAce && e.dogfightOffTail ? m * B.offTailDamage : m;
 };
 // A lethal hit in the duel ends the duel, not the run: the pilot limps out on 1 hull
 // and the operation fails (same spirit as the Heinecke parachute, no use spent).
 const hit = Game.prototype.hit;
 Game.prototype.hit = function (n, ...rest) {
  // Every minigame operation (duel, barrage run, air race) shares this rule.
  const battle = (this.world || this).operationBattle, minigame = battle && (battle.dogfight || battle.barrage || battle.race);
  if (minigame && !battle.downed && this.invuln <= 0 && this.hp > 0 && Number(n) >= this.hp) {
   battle.downed = true;
   this.hp = 1; this.invuln = Math.max(this.invuln || 0, 1.5); this.hitFlash = .16;
   this.burst?.(this.x, this.y, '#ffce8e', 9); this.smoke?.(this.x, this.y, true);
   this.event?.('wave', battle.dogfight ? '격추 직전 · 결투에서 이탈합니다' : '격추 직전 · 작전에서 이탈합니다');
   return;
  }
  return hit.call(this, n, ...rest);
 };
}

// Reward: one medal the pilot does not own yet, picked at random and granted at once
// (no draft). With all four special slots full it takes the temporary fifth slot
// that captured equipment uses, so it never replaces anything.
export const DUEL_MEDALS = Object.freeze(['ironCross', 'passiveMedal']);
export function grantDuelMedal(game, p, faction = 'central') {
 const pool = DUEL_MEDALS.filter(id => !p?.upgrades?.[id]);
 for (let i = pool.length - 1; i > 0; i--) {const j = Math.floor(game.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];}
 for (const id of pool) {
  const full = p.legendaryCount?.() >= 4;
  if (full && p.capturedEquipmentId) return null;
  p._capturedEquipmentGrant = id;
  try {
   if (!p.upgrade(id, 'legendary')) continue;
   if (full) p.capturedEquipmentId = id;
   return id === 'ironCross' ? medalDisplayName(faction) : passiveMedalName(faction);
  } finally {delete p._capturedEquipmentGrant;}
 }
 return null;
}
