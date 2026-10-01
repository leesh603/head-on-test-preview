// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// Purely visual: reads the engine's existing hunt fields, never writes gameplay state.
//
// What the player should be able to read at a glance:
//   1. which enemy is the current prey       -> crimson lock brackets that snap in on designation
//   2. how far the hunt bonus has stacked    -> three arc segments around the prey; the next one
//                                               fills while you keep hitting, a pulse on each tier,
//                                               and the live bonus (+15 / +30 / +45%) next to it
//   3. that the stack is about to drop       -> lit segments dim and flicker in the last 0.6 s
//                                               before the 2.2 s no-hit reset
//   4. the kill reward (+20% speed, 4 s)     -> crimson aura + draining timer arc on your own plane
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=adriatic20261001';

const RED = '#c8322a', RED_HOT = '#ff8a4c', RED_DEEP = '#5e1410', GOLD = '#f6cf72', AMBER = '#ffb04a';
const memo = new WeakMap(); // per-game: last tier, pulse clock, kill flash
const st = g => { let s = memo.get(g); if (!s) memo.set(g, s = { tier: 0, pulse: -9, pulseTier: 0, boost: 0, kill: -9 }); return s; };
const ease = q => 1 - Math.pow(1 - Math.max(0, Math.min(1, q)), 3);

function glowStroke(c, w, col, glow, a) {
  c.save(); c.globalAlpha *= a * .45; c.strokeStyle = glow; c.lineWidth = w * 3.2; c.globalCompositeOperation = 'lighter'; c.stroke(); c.restore();
  c.save(); c.globalAlpha *= a; c.strokeStyle = '#140504aa'; c.lineWidth = w + 2.2; c.stroke(); c.restore(); // dark bed so it reads on bright ground
  c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.restore();
}

function label(c, text, x, y, col, a) {
  c.save(); c.globalAlpha *= a; c.font = '700 11px "Bebas Neue","Oswald",system-ui,sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.lineWidth = 3; c.strokeStyle = '#120403d9'; c.strokeText(text, x, y); c.fillStyle = col; c.fillText(text, x, y); c.restore();
}

export function drawBaronHunt(c, g, point, t, px, py) {
  if (g.pilot !== 'baron') return false;
  const s = st(g);
  const tgt = g.huntTarget, alive = tgt && g.huntTargetAlive?.(tgt);
  // ---- prey reticle
  if (alive) {
    const [x, y] = point(tgt.x, tgt.y);
    const sz = g.huntTargetElite ? 24 : tgt.heavyBomber ? 60 : tgt.bossPilot ? 46 : tgt.type === 'bomber' ? 34 : 28;
    const tier = g.huntTier ? g.huntTier() : 0, engaged = !!g.huntEngaged;
    if (tier > s.tier) { s.pulse = t; s.pulseTier = tier; }
    s.tier = tier;
    const designate = g.huntDesignate > 0 ? 1 - g.huntDesignate / .35 : 1, lock = ease(designate);
    const since = engaged ? t - (g.huntLastHit ?? t) : 0, warn = engaged && since > B.resetAfter - .6;
    const flick = warn ? .45 + .55 * (Math.sin(t * 38) > 0 ? 1 : .35) : 1;
    const R = sz * .85 + 10;
    c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
    // lock brackets: fly in from 2.2x on designation, breathe slowly while idle, clamp tight when engaged
    const breathe = engaged ? 0 : Math.sin(t * 3.2) * 2, br = (R + 6 + breathe) * (1 + (1 - lock) * 1.2), arm = Math.max(8, sz * .36);
    const rot = engaged ? 0 : (1 - lock) * .8;
    c.rotate(rot);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.beginPath(); c.moveTo(sx * br, sy * (br - arm)); c.lineTo(sx * br, sy * br); c.lineTo(sx * (br - arm), sy * br);
      glowStroke(c, 2.4, engaged ? RED_HOT : RED, RED, lock * (engaged ? 1 : .8));
    }
    c.rotate(-rot);
    // ring-sight wires: four short cross-wire ticks and an inner bead, tighter when engaged
    const wire = engaged ? .22 : .3;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * R * (1 - wire), Math.sin(a) * R * (1 - wire)); c.lineTo(Math.cos(a) * R * (1 + .16), Math.sin(a) * R * (1 + .16)); glowStroke(c, 1.4, engaged ? RED_HOT : RED, RED, .8 * lock); }
    // three tier segments (top -> clockwise), next one fills with hunt progress
    const seg = Math.PI * 2 / 3, gap = .34, start = -Math.PI / 2 - seg / 2 + gap / 2;
    const prog = engaged && tier < 3 ? ((g.huntEngage || 0) % B.stackInterval) / B.stackInterval : 0;
    for (let i = 0; i < 3; i++) {
      const a0 = start + i * seg, a1 = a0 + seg - gap;
      c.beginPath(); c.arc(0, 0, R, a0, a1);
      glowStroke(c, 1.6, RED_DEEP, RED_DEEP, .55 * lock);                            // empty track
      if (i < tier) { c.beginPath(); c.arc(0, 0, R, a0, a1); glowStroke(c, 2.8, tier === 3 ? GOLD : AMBER, AMBER, lock * flick); }
      else if (i === tier && prog > 0) { c.beginPath(); c.arc(0, 0, R, a0, a0 + (a1 - a0) * prog); glowStroke(c, 2.4, RED, RED, .85 * lock); }
    }
    // tier-up pulse: a ring that kicks outward + brief bloom
    const pq = (t - s.pulse) / .38;
    if (pq >= 0 && pq < 1) {
      c.beginPath(); c.arc(0, 0, R * (1 + ease(pq) * .75), 0, Math.PI * 2);
      glowStroke(c, 3 * (1 - pq) + .6, s.pulseTier === 3 ? GOLD : RED_HOT, RED_HOT, 1 - pq);
    }
    // tier chevrons + live bonus, under the target so they never fight the nameplate above it
    if (engaged) {
      const cy = br + 11, w = 7;
      for (let i = 0; i < 3; i++) { const cx = (i - 1) * (w * 2 + 3); c.beginPath(); c.moveTo(cx - w, cy - 3); c.lineTo(cx, cy + 3); c.lineTo(cx + w, cy - 3);
        glowStroke(c, i < tier ? 2.4 : 1.4, i < tier ? (tier === 3 ? GOLD : AMBER) : RED_DEEP, AMBER, (i < tier ? flick : .6) * lock); }
      if (tier > 0) label(c, '+' + Math.round((B.tierDamage[tier] - 1) * 100) + '%', 3 * w + 6, cy, tier === 3 ? GOLD : '#ffb59f', lock * flick);
    }
    c.restore();
  }
  // ---- kill reward on own plane: +20% speed for 4 s
  const boost = g.huntBoost || 0;
  if (boost > 0 && s.boost <= 0) s.kill = t;
  s.boost = boost;
  if (boost > 0) {
    const q = boost / B.killBoostTime, fadeIn = Math.min(1, (t - s.kill) / .12);
    c.save(); c.translate(px, py); c.lineCap = 'round';
    const gr = c.createRadialGradient(0, 0, 6, 0, 0, 54);
    gr.addColorStop(0, 'rgba(255,90,60,.34)'); gr.addColorStop(.55, 'rgba(210,40,30,.14)'); gr.addColorStop(1, 'rgba(160,20,20,0)');
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = fadeIn * (.8 + .2 * Math.sin(t * 12)); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // four notched pips = the 4 s reward, draining clockwise
    const pips = 4, segA = Math.PI * 2 / pips, gapA = .22, left = q * pips;
    for (let i = 0; i < pips; i++) {
      const a0 = -Math.PI / 2 + i * segA + gapA / 2, a1 = a0 + segA - gapA, fill = Math.max(0, Math.min(1, left - i));
      c.beginPath(); c.arc(0, 0, 40, a0, a1); glowStroke(c, 1.4, RED_DEEP, RED_DEEP, .55 * fadeIn);
      if (fill > 0) { c.beginPath(); c.arc(0, 0, 40, a0, a0 + (a1 - a0) * fill); glowStroke(c, 3, RED_HOT, RED_HOT, fadeIn); }
    }
    // kill confirmation burst
    const kq = (t - s.kill) / .45;
    if (kq >= 0 && kq < 1) { c.beginPath(); c.arc(0, 0, 40 + ease(kq) * 34, 0, Math.PI * 2); glowStroke(c, 3 * (1 - kq) + .5, GOLD, RED_HOT, 1 - kq); }
    label(c, 'SPD +20%', 34, -38, '#ffcbb8', fadeIn * Math.min(1, boost / .5));
    c.restore();
  }
  return true;
}
