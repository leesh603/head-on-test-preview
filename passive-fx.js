// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// In-world effects rather than HUD marks. Purely visual: reads the engine's existing
// hunt fields, never writes gameplay state.
//   prey          -> a gun-sight that settles with each stack (gold at tier III) and a thin crimson vapour; it thickens with each hunt stack
//                    (tier I wisp -> II sheds embers -> III a burning red streamer)
//   tier-up       -> a short spray of crimson sparks off the prey
//   about to drop -> the streamer thins out over the last 0.6 s before the reset
//   kill reward   -> crimson wingtip vapour trails off your own plane for the 4 s boost
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=470';

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
    // target mark: a gun-sight on the prey. It swings in on designation and the aim settles with
    // each hunt stack (ring tightens, sway dies down); gold and dead-steady at tier III.
    { const [tx, ty] = point(tgt.x, tgt.y), sz = g.huntTargetElite ? 24 : tgt.heavyBomber ? 60 : tgt.bossPilot ? 46 : tgt.type === 'bomber' ? 34 : 28;
      const lvl = engaged ? tier : 0, settle = lvl / 3;
      const sway = (1 - settle) * (engaged ? 3 : 5) * lock;
      const x = tx + Math.sin(t * 2.3) * sway + (1 - lock) * sz * 1.4, y = ty + Math.cos(t * 1.7) * sway - (1 - lock) * sz * .8;
      const pop = 1 + .1 * Math.max(0, 1 - (t - s.burst) / .22);
      const R = (sz * (1.05 - .1 * settle) + 8) * (1 + (1 - lock) * .7) * pop;
      const col = engaged && tier === 3 ? '#f3cf78' : '#ff5a44', w = engaged ? 1.8 : 1.4, al = lock * (engaged ? .95 : .7);
      const stroke = () => { c.globalAlpha = al * .45; c.strokeStyle = 'rgba(20,6,4,.8)'; c.lineWidth = w + 2; c.stroke(); c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
      c.lineCap = 'round';
      c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); stroke();
      const rot = (1 - lock) * 1.2;                               // cross-wires: open centre so the plane stays visible
      c.beginPath();
      for (let i = 0; i < 4; i++) { const a = rot + i * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        c.moveTo(x + ca * R * .55, y + sa * R * .55); c.lineTo(x + ca * R * 1.22, y + sa * R * 1.22); }
      stroke(); }
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

// ---- Berthold "강철의 의지" / Iron Will: 40% of each hit is deferred and paid over 4 s.
//   hit absorbed  -> a steel "clang": cold white-blue sparks glancing off the hull + a brief iron sheen ring
//   damage owed   -> the plane trails dark oily smoke with a few embers while the deferred damage
//                    is still being paid; thicker the more is owed, gone once the debt clears
const bmemo = new WeakMap();
const bst = g => { let s = bmemo.get(g); if (!s) bmemo.set(g, s = { owed: 0, clang: -9, seed: 0, trail: [] }); return s; };
let STEEL = null, SOOT = null;
function bsprites() {
  if (STEEL || typeof document === 'undefined') return;
  const mk = stops => { const k = document.createElement('canvas'); k.width = k.height = 48; const x = k.getContext('2d'), gr = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    for (const [o, c] of stops) gr.addColorStop(o, c); x.fillStyle = gr; x.fillRect(0, 0, 48, 48); return k; };
  STEEL = mk([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(200,225,255,.8)'], [.6, 'rgba(120,160,220,.22)'], [1, 'rgba(90,130,200,0)']]);
  SOOT = mk([[0, 'rgba(38,34,32,.75)'], [.5, 'rgba(34,30,28,.38)'], [1, 'rgba(30,26,24,0)']]);
}
export function drawBertholdWill(c, g, point, t, px, py) {
  if (g.pilot !== 'berthold') return false;
  sprites(); bsprites(); if (!STEEL) return false;
  const s = bst(g), debts = g.pilotIdentity?.debts || [];
  const owed = debts.reduce((a, d) => a + (d.amount || 0), 0);
  if (owed > s.owed + .5) { s.clang = t; s.seed = (s.seed + 1) % 97; }
  s.owed = owed;
  c.save();
  // smoke while damage is owed
  const k = clamp(owed / Math.max(8, (g.maxHp || 100) * .12));
  push(s.trail, { x: g.x, y: g.y, a: g.a || 0 }, t, .55);
  if (k > .02) {
    const n = s.trail.length;
    for (let i = 0; i < n - 1; i++) {
      const p = s.trail[i], age = (t - p.t) / .55; if (i % 2) continue;
      const bx = p.x - Math.cos(p.a) * 14, by = p.y - Math.sin(p.a) * 14, [x, y] = point(bx, by);
      const w = 6 + 16 * age * (.6 + .6 * k), drift = (hash(p.t * 9, i) - .5) * 8 * age;
      c.globalAlpha = (1 - age) * (.25 + .6 * k); c.drawImage(SOOT, x - w + drift, y - w - age * 6, w * 2, w * 2);
    }
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n - 1; i++) {
      const p = s.trail[i], age = (t - p.t) / .55; if (hash(p.t * 17, 5) > .05 + .12 * k) continue;
      const [x, y] = point(p.x - Math.cos(p.a) * 14, p.y - Math.sin(p.a) * 14), e = 1.6 + 1.6 * hash(p.t, 2);
      c.globalAlpha = (1 - age) * .9; c.drawImage(EMBER, x - e + (hash(p.t, 6) - .5) * 10 * age, y - e - age * 8, e * 2, e * 2);
    }
    c.globalCompositeOperation = 'source-over';
  }
  // steel clang on each absorbed hit
  const q = (t - s.clang) / .32;
  if (q >= 0 && q < 1) {
    c.globalCompositeOperation = 'lighter';
    const r = 26 + 10 * (1 - Math.pow(1 - q, 3));
    for (let j = 0; j < 3; j++) {                                  // three glinting armour-plate arcs, not a bubble
      const a0 = hash(j, s.seed) * Math.PI * 2; c.beginPath(); c.arc(px, py, r, a0, a0 + .7);
      c.globalAlpha = (1 - q) * .8; c.strokeStyle = '#dbe9ff'; c.lineWidth = 2.4 * (1 - q) + .6; c.stroke(); }
    for (let i = 0; i < 9; i++) {
      const a = hash(i, s.seed) * Math.PI * 2, d = (12 + 30 * hash(s.seed, i)) * (1 - Math.pow(1 - q, 2)), ln = 6 * (1 - q) + 2;
      const x0 = px + Math.cos(a) * (14 + d), y0 = py + Math.sin(a) * (14 + d);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * ln, y0 + Math.sin(a) * ln);
      c.globalAlpha = 1 - q; c.strokeStyle = '#f2f7ff'; c.lineWidth = 1.4; c.stroke();
    }
    c.globalAlpha = (1 - q) * .6; c.drawImage(STEEL, px - 22, py - 22, 44, 44);
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
  return true;
}

// Single entry for the renderer. Returns true only when the pilot's legacy marker should be skipped.
export function drawPassiveFx(c, g, point, t, px, py) {
  if (g.pilot === 'baron') return drawBaronHunt(c, g, point, t, px, py);
  if (g.pilot === 'berthold') drawBertholdWill(c, g, point, t, px, py);
  return false;
}
