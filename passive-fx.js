// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// In-world effects rather than HUD marks. Purely visual: reads the engine's existing
// hunt fields, never writes gameplay state.
//   prey          -> trails a thin crimson vapour; it thickens with each hunt stack
//                    (tier I wisp -> II sheds embers -> III a burning red streamer)
//   tier-up       -> a short spray of crimson sparks off the prey
//   about to drop -> the streamer thins out over the last 0.6 s before the reset
//   kill reward   -> crimson wingtip vapour trails off your own plane for the 4 s boost
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=464';

const memo = new WeakMap();
const st = g => { let s = memo.get(g); if (!s) memo.set(g, s = { tier: 0, burst: -9, burstAt: null, prey: null, trail: [], wing: [] }); return s; };
const clamp = q => Math.max(0, Math.min(1, q));
let VAPOR = null, EMBER = null;
function sprites() {
  if (VAPOR || typeof document === 'undefined') return;
  const mk = stops => { const k = document.createElement('canvas'); k.width = k.height = 48; const x = k.getContext('2d'), gr = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    for (const [o, c] of stops) gr.addColorStop(o, c); x.fillStyle = gr; x.fillRect(0, 0, 48, 48); return k; };
  VAPOR = mk([[0, 'rgba(150,40,32,.5)'], [.5, 'rgba(110,36,30,.24)'], [1, 'rgba(80,30,26,0)']]);
  EMBER = mk([[0, 'rgba(255,236,200,1)'], [.25, 'rgba(255,140,70,.8)'], [.6, 'rgba(220,50,30,.25)'], [1, 'rgba(180,30,20,0)']]);
}
const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
// short world-space history (seconds); cleared if time runs backwards (restart)
function push(list, p, t, keep) { if (list.length && list[list.length - 1].t > t) list.length = 0; const last = list[list.length - 1]; if (!last || t - last.t > 1 / 90) list.push({ ...p, t }); while (list.length && t - list[0].t > keep) list.shift(); }

export function drawBaronHunt(c, g, point, t, px, py) {
  if (g.pilot !== 'baron') return false;
  sprites(); if (!VAPOR) return false;
  const s = st(g);
  const tgt = g.huntTarget, alive = tgt && g.huntTargetAlive?.(tgt);
  if (tgt !== s.prey) { s.prey = tgt; s.trail = []; s.tier = 0; }
  c.save();
  if (alive) {
    const tier = g.huntTier ? g.huntTier() : 0, engaged = !!g.huntEngaged;
    if (tier > s.tier) { s.burst = t; s.burstAt = { x: tgt.x, y: tgt.y }; }
    s.tier = tier;
    const since = engaged ? t - (g.huntLastHit ?? t) : 0;
    const hold = engaged ? 1 - .7 * clamp((since - (B.resetAfter - .6)) / .6) : 1;
    const lock = clamp(g.huntDesignate > 0 ? 1 - g.huntDesignate / .35 : 1);
    const k = (engaged ? [.4, .6, .78, .95][tier] : .28) * hold * lock;   // faint wisp when merely designated
    const keep = .35 + .2 * tier;
    push(s.trail, { x: tgt.x, y: tgt.y }, t, keep);
    const n = s.trail.length;
    for (let i = 0; i < n - 1; i++) {
      const p = s.trail[i], age = (t - p.t) / keep, [x, y] = point(p.x, p.y);
      const w = (6 + 4 * tier) * (.5 + age * 1.4), a = (1 - age) * (1 - age) * k * .5;
      if (a <= .01) continue;
      const drift = (hash(p.t * 10, i) - .5) * 6 * age;
      c.globalAlpha = a; c.drawImage(VAPOR, x - w + drift, y - w + drift, w * 2, w * 2);
    }
    if (engaged && tier >= 2) {                                            // embers shed from tier II up
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n - 1; i++) {
        const p = s.trail[i], age = (t - p.t) / keep; if (hash(p.t * 13, 7) > .1 + .08 * (tier - 2)) continue;
        const [x, y] = point(p.x, p.y), e = 2 + 2 * hash(p.t * 7, 3);
        c.globalAlpha = (1 - age) * hold * .9; c.drawImage(EMBER, x - e + (hash(p.t, 9) - .5) * 14 * age, y - e + (hash(p.t, 4) - .5) * 14 * age, e * 2, e * 2);
      }
      c.globalCompositeOperation = 'source-over';
    }
    if (engaged && tier === 3) {                                           // red heat on the prey at the top tier
      const [x, y] = point(tgt.x, tgt.y), r = 22 + 3 * Math.sin(t * 9);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .28 * hold; c.drawImage(VAPOR, x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over';
    }
  } else { s.trail = []; s.tier = 0; }
  const bq = (t - s.burst) / .4;                                           // tier-up spark spray
  if (bq >= 0 && bq < 1 && s.burstAt) {
    const [x, y] = point(s.burstAt.x, s.burstAt.y);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      const a = hash(i, s.burst) * Math.PI * 2, d = (14 + 26 * hash(s.burst, i)) * (1 - Math.pow(1 - bq, 2)), e = 2.5 * (1 - bq) + .8;
      c.globalAlpha = 1 - bq; c.drawImage(EMBER, x + Math.cos(a) * d - e, y + Math.sin(a) * d - e, e * 2, e * 2);
    }
    c.globalCompositeOperation = 'source-over';
  }
  const boost = g.huntBoost || 0;                                          // kill reward: crimson wingtip vapour
  if (boost > 0) {
    const span = 17, a0 = g.a || 0;
    push(s.wing, { x: g.x, y: g.y, a: a0 }, t, .32);
    const fade = clamp(boost / .5) * clamp((B.killBoostTime - boost) / .1 + .2);
    for (const side of [-1, 1]) {
      c.beginPath(); let first = true;
      for (const p of s.wing) { const [x, y] = point(p.x - Math.sin(p.a) * span * side, p.y + Math.cos(p.a) * span * side); if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y); }
      c.lineTo(px - Math.sin(a0) * span * side, py + Math.cos(a0) * span * side);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.globalAlpha = .35 * fade; c.strokeStyle = '#b8261e'; c.lineWidth = 4; c.stroke();
      c.globalAlpha = .7 * fade; c.strokeStyle = '#ffd9cc'; c.lineWidth = 1.2; c.stroke();
    }
  } else s.wing = [];
  c.restore();
  return true;
}
