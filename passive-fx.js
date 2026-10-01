// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// Purely visual: reads the engine's existing hunt fields, never writes gameplay state.
// Kept deliberately quiet so it reads at a glance without cluttering the dogfight:
//   prey        -> four thin crimson corner brackets (snap in on designation)
//   hunt stacks -> three small pips under the prey; the next pip fills while you keep
//                  hitting, lit pips are amber, all three go gold at the top tier
//   about to drop -> pips dim over the last 0.6 s before the 2.2 s no-hit reset
//   kill reward -> one thin crimson arc around your plane draining over the 4 s boost
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=464';

const CRIMSON = '#c4382c', AMBER = '#f0a24a', GOLD = '#f3cf78', TRACK = 'rgba(30,10,8,.55)';
const memo = new WeakMap();
const st = g => { let s = memo.get(g); if (!s) memo.set(g, s = { tier: 0, pop: -9, boost: 0, kill: -9 }); return s; };
const clamp = q => Math.max(0, Math.min(1, q));
const easeOut = q => 1 - Math.pow(1 - clamp(q), 3);

// one crisp line with a soft dark bed underneath so it holds on bright fields
function line(c, w, col, a) {
  c.save(); c.globalAlpha *= a * .5; c.strokeStyle = 'rgba(20,6,4,.8)'; c.lineWidth = w + 2; c.stroke(); c.restore();
  c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.restore();
}

export function drawBaronHunt(c, g, point, t, px, py) {
  if (g.pilot !== 'baron') return false;
  const s = st(g);
  const tgt = g.huntTarget;
  if (tgt && g.huntTargetAlive?.(tgt)) {
    const [x, y] = point(tgt.x, tgt.y);
    const sz = g.huntTargetElite ? 24 : tgt.heavyBomber ? 60 : tgt.bossPilot ? 46 : tgt.type === 'bomber' ? 34 : 28;
    const tier = g.huntTier ? g.huntTier() : 0, engaged = !!g.huntEngaged;
    if (tier > s.tier) s.pop = t;
    s.tier = tier;
    const lock = easeOut(g.huntDesignate > 0 ? 1 - g.huntDesignate / .35 : 1);
    const since = engaged ? t - (g.huntLastHit ?? t) : 0;
    const hold = engaged ? 1 - .6 * clamp((since - (B.resetAfter - .6)) / .6) : 1;
    const pop = 1 + .12 * Math.max(0, 1 - (t - s.pop) / .22);
    const col = tier === 3 ? GOLD : CRIMSON;
    c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
    // brackets: fly in on designation, a small pop on each tier-up
    const r = (sz * .78 + 6) * (1 + (1 - lock) * .9) * pop, arm = Math.max(6, sz * .26);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.beginPath(); c.moveTo(sx * r, sy * (r - arm)); c.lineTo(sx * r, sy * r); c.lineTo(sx * (r - arm), sy * r);
      line(c, engaged ? 2 : 1.5, col, lock * (engaged ? 1 : .75));
    }
    // stack pips under the prey
    if (engaged) {
      const prog = tier < 3 ? ((g.huntEngage || 0) % B.stackInterval) / B.stackInterval : 0, gap = 10, py0 = r + 9;
      for (let i = 0; i < 3; i++) {
        const cx = (i - 1) * gap;
        c.beginPath(); c.arc(cx, py0, 3.2, 0, Math.PI * 2);
        c.globalAlpha = .9 * lock; c.fillStyle = TRACK; c.fill();
        const f = i < tier ? 1 : i === tier ? prog : 0;
        if (f > 0) { c.beginPath(); c.arc(cx, py0, 3.2 * (i < tier ? 1 : .45 + .55 * f), 0, Math.PI * 2);
          c.globalAlpha = lock * hold * (i < tier ? 1 : .55); c.fillStyle = tier === 3 ? GOLD : AMBER; c.fill(); }
      }
    }
    c.restore();
  }
  // kill reward: a thin draining arc around your own plane
  const boost = g.huntBoost || 0;
  if (boost > 0 && s.boost <= 0) s.kill = t;
  s.boost = boost;
  if (boost > 0) {
    const q = boost / B.killBoostTime, a = clamp((t - s.kill) / .15) * clamp(boost / .4);
    const r = 34 + 6 * Math.max(0, 1 - (t - s.kill) / .3);
    c.save(); c.translate(px, py); c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q);
    line(c, 2, CRIMSON, a * .9);
    c.restore();
  }
  return true;
}
