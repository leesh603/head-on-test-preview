// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// In-world effects rather than HUD marks. Purely visual: reads the engine's existing
// hunt fields, never writes gameplay state.
//   prey          -> a gun-sight that settles with each stack (gold at tier III) and a thin crimson vapour; it thickens with each hunt stack
//                    (tier I wisp -> II sheds embers -> III a burning red streamer)
//   tier-up       -> a short spray of crimson sparks off the prey
//   about to drop -> the streamer thins out over the last 0.6 s before the reset
//   kill reward   -> crimson wingtip vapour trails off your own plane for the 4 s boost
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=472';

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
  else if (g.pilot === 'mannock') drawMannockCover(c, g, point, t);
  else if (g.pilot === 'fonck') drawFonckFocus(c, g, point, t);
  else if (g.pilot === 'rickenbacker') { drawRickenbackerSwitch(c, g, point, t, px, py); drawRickenbackerRing(c, g, point, t, px, py); }
  else if (g.pilot === 'ball') drawBallLone(c, g, point, t, px, py);
  else if (g.pilot === 'immelmann') drawImmelmannEagle(c, g, point, t, px, py);
  else if (g.pilot === 'jacobs') drawJacobsFalcon(c, g, point, t, px, py);
  else if (g.pilot === 'gontermann') drawGontermannHeat(c, g, point, t, px, py);
  return false;
}

// ---- Mannock "동료의 수호자" / Guardian of Comrades: enemies lining up on an ally take +30% MG damage.
//   threat      -> a short amber aim-glint off the enemy's nose toward the ally it is lining up
//   marked foe  -> a slow ring of amber sparks orbits that enemy (it is the one to shoot)
//   ally        -> a soft pale-gold guard glow while it is being covered
const AMB = 'rgba(255,186,90,';
export function drawMannockCover(c, g, point, t) {
  if (g.pilot !== 'mannock' || typeof g.mannockCoverTarget !== 'function') return false;
  sprites(); if (!EMBER) return false;
  c.save(); c.lineCap = 'round';
  let shown = 0;
  for (const e of g.enemies || []) {
    if (shown >= 4 || !(e.hp > 0)) continue;
    const ally = g.mannockCoverTarget(e); if (!ally) continue;
    if (Math.hypot(e.x - g.x, e.y - g.y) > 1100) continue;
    shown++;
    const [ex, ey] = point(e.x, e.y), [ax, ay] = point(ally.x, ally.y), d = Math.hypot(ax - ex, ay - ey) || 1, ux = (ax - ex) / d, uy = (ay - ey) / d;
    // short aim glint off the enemy's nose toward the ally it is lining up (no screen-long lines)
    { const L = Math.min(90, d * .45), gr = c.createLinearGradient(ex + ux * 22, ey + uy * 22, ex + ux * (22 + L), ey + uy * (22 + L));
      gr.addColorStop(0, AMB + '.9)'); gr.addColorStop(1, AMB + '0)');
      c.beginPath(); c.moveTo(ex + ux * 22, ey + uy * 22); c.lineTo(ex + ux * (22 + L), ey + uy * (22 + L));
      c.globalAlpha = .9; c.strokeStyle = gr; c.lineWidth = 2.4; c.stroke(); }
    // ally guard glow
    c.globalCompositeOperation = 'lighter'; const gr = 30 + 3 * Math.sin(t * 4);
    c.globalAlpha = .6; c.drawImage(EMBER, ax - gr, ay - gr, gr * 2, gr * 2);
    // orbiting amber sparks on the marked enemy
    const R = 30;
    for (let i = 0; i < 6; i++) { const a = t * 2.2 + i * Math.PI / 3, s = 3.6 + 1.2 * Math.sin(t * 6 + i);
      c.globalAlpha = .85; c.drawImage(EMBER, ex + Math.cos(a) * R - s, ey + Math.sin(a) * R - s, s * 2, s * 2); }
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
  return shown > 0;
}

// shared: a tiny per-game memo
const pmemo = new WeakMap();
const pst = (g, init) => { let s = pmemo.get(g); if (!s) pmemo.set(g, s = init()); return s; };
const sizeOf = e => e.heavyBomber ? 60 : e.bossPilot ? 46 : e.type === 'bomber' ? 34 : 28;

// ---- Fonck "정밀 조준" / Precision: hold the same target and damage climbs to +35%.
//   four cold-white light shards close in on the target as the aim holds (iris focusing);
//   when the focus is complete they meet in a crisp star glint that keeps twinkling
export function drawFonckFocus(c, g, point, t) {
  if (g.pilot !== 'fonck') return false;
  sprites(); if (!EMBER) return false;
  const s = g.pilotIdentity, e = s?.target, f = s?.focus || 0;
  if (!e || !(e.hp > 0) || f <= 0) return false;
  const [x, y] = point(e.x, e.y), sz = sizeOf(e), r = sz * (.45 + 1.25 * (1 - f)), rot = Math.PI / 4 + (1 - f) * .9;
  c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const a = rot + i * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), len = 6 + 10 * f;
    c.beginPath(); c.moveTo(x + ca * (r + len), y + sa * (r + len)); c.lineTo(x + ca * r, y + sa * r);
    c.globalAlpha = .25 + .6 * f; c.strokeStyle = '#9cc4ff'; c.lineWidth = 4; c.stroke();
    c.globalAlpha = .5 + .5 * f; c.strokeStyle = '#f4f8ff'; c.lineWidth = 1.4; c.stroke();
  }
  if (f >= .999) {                                                   // full focus: twinkling star glint
    const tw = .75 + .25 * Math.sin(t * 14), L = 14 * tw;
    c.globalAlpha = .9; c.strokeStyle = '#ffffff'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.moveTo(x, y - L); c.lineTo(x, y + L); c.stroke();
    c.globalAlpha = .55 * tw; c.drawImage(EMBER, x - 9, y - 9, 18, 18);
  }
  c.restore();
  return true;
}

// ---- Rickenbacker "빠른 표적전환" / Quick Switch: hitting a new enemy within 2 s stacks +10% (max 3, 3 s).
//   each switch throws a quick white-blue arc from the last enemy to the new one;
//   while stacks are live his plane streams red-white-blue ribbons from the wingtips (longer per stack)
export function drawRickenbackerSwitch(c, g, point, t, px, py) {
  if (g.pilot !== 'rickenbacker') return false;
  sprites(); if (!EMBER) return false;
  const s = g.pilotIdentity; if (!s) return false;
  const m = pst(g, () => ({ prev: null, sw: 0, arc: null, wing: [] }));
  const cur = s.lastHit && s.lastHit.hp > 0 ? { x: s.lastHit.x, y: s.lastHit.y } : null;
  if ((s.switches || 0) > m.sw && m.prev && cur) m.arc = { a: m.prev, b: cur, t0: t };
  m.sw = s.switches || 0; if (cur) m.prev = cur;
  c.save(); c.lineCap = 'round';
  if (m.arc) {
    const q = (t - m.arc.t0) / .3;
    if (q >= 0 && q < 1) {
      const [ax, ay] = point(m.arc.a.x, m.arc.a.y), [bx, by] = point(m.arc.b.x, m.arc.b.y), mx = (ax + bx) / 2 - (by - ay) * .18, my = (ay + by) / 2 + (bx - ax) * .18;
      const head = Math.min(1, q * 2.2), tail = Math.max(0, q * 2.2 - .9);
      const P = u => { const v = 1 - u; return [v * v * ax + 2 * v * u * mx + u * u * bx, v * v * ay + 2 * v * u * my + u * u * by]; };
      c.beginPath(); for (let k = 0; k <= 12; k++) { const [x, y] = P(tail + (head - tail) * k / 12); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - q) * .6; c.strokeStyle = '#7fb2ff'; c.lineWidth = 5; c.stroke();
      c.globalAlpha = 1 - q; c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.stroke();
      const [hx, hy] = P(head); c.globalAlpha = 1 - q; c.drawImage(EMBER, hx - 6, hy - 6, 12, 12);
      c.globalCompositeOperation = 'source-over';
    }
  }
  const stacks = s.switches || 0, life = clamp((s.switchTime || 0) / .6);
  push(m.wing, { x: g.x, y: g.y, a: g.a || 0 }, t, .12 + .1 * stacks);
  if (stacks > 0) {
    const span = 16, cols = ['#d23b33', '#f4f1ea', '#2f5fb0'];
    for (const side of [-1, 1]) for (let band = 0; band < 3; band++) {
      const off = span + (band - 1) * 2.2;
      c.beginPath(); let first = true;
      for (const p of m.wing) { const [x, y] = point(p.x - Math.sin(p.a) * off * side, p.y + Math.cos(p.a) * off * side); first ? c.moveTo(x, y) : c.lineTo(x, y); first = false; }
      c.lineTo(px - Math.sin(g.a || 0) * off * side, py + Math.cos(g.a || 0) * off * side);
      c.globalAlpha = .75 * life; c.strokeStyle = cols[band]; c.lineWidth = 1.8; c.stroke();
    }
  }
  c.restore();
  return true;
}

// ---- Ball "고독한 사냥꾼" / Lone Hunter: no ally within 320 px -> +15% MG damage.
//   while he flies alone a cold moonlit sheen rims his plane and a thin silver vapour trails
//   behind; it melts away as soon as a friendly comes close
export function drawBallLone(c, g, point, t, px, py) {
  if (g.pilot !== 'ball') return false;
  sprites(); if (!VAPOR) return false;
  const s = g.pilotIdentity, alone = !!s?.alone;
  const m = pst(g, () => ({ k: 0, last: t, trail: [] }));
  const dt = Math.max(0, Math.min(.1, t - m.last)); m.last = t;
  m.k = clamp(m.k + (alone ? dt / .4 : -dt / .25));
  push(m.trail, { x: g.x, y: g.y, a: g.a || 0 }, t, .5);
  if (m.k <= .01) return true;
  c.save(); c.lineCap = 'round';
  c.beginPath(); let first = true;
  for (const p of m.trail) { const [x, y] = point(p.x - Math.cos(p.a) * 16, p.y - Math.sin(p.a) * 16); first ? c.moveTo(x, y) : c.lineTo(x, y); first = false; }
  c.globalAlpha = .22 * m.k; c.strokeStyle = '#dfe8f2'; c.lineWidth = 5; c.stroke();
  c.globalAlpha = .4 * m.k; c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.stroke();
  const gr = c.createRadialGradient(px, py, 10, px, py, 40);
  gr.addColorStop(0, 'rgba(210,225,245,0)'); gr.addColorStop(.6, 'rgba(200,220,245,.22)'); gr.addColorStop(1, 'rgba(190,210,240,0)');
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = m.k * (.85 + .15 * Math.sin(t * 2.4)); c.fillStyle = gr; c.beginPath(); c.arc(px, py, 40, 0, Math.PI * 2); c.fill();
  c.restore();
  return true;
}

// ---- Rickenbacker active "햇 인 더 링" / Hat in the Ring: while active, every burst also fires
// rounds at up to 7 enemies within 780 px. Show the squadron ring on himself and stamp it on
// each enemy the burst reaches.
function hatGlyph(c, x, y, s) {                               // small Uncle-Sam top hat
  c.save(); c.translate(x, y);
  c.fillStyle = '#1f3f86'; c.fillRect(-s * .62, s * .18, s * 1.24, s * .2);           // brim
  c.fillStyle = '#f2efe6'; c.fillRect(-s * .38, -s * .62, s * .76, s * .82);          // crown
  c.fillStyle = '#c8332b'; for (let i = 0; i < 3; i++) c.fillRect(-s * .38 + i * s * .26, -s * .62, s * .12, s * .82);
  c.fillStyle = '#1f3f86'; c.fillRect(-s * .38, -s * .04, s * .76, s * .16);          // band
  c.restore();
}
function tricolorRing(c, x, y, r, a, w = 1) {                    // the 94th's ring: a bold yellow hoop
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.globalAlpha = a * .55; c.strokeStyle = 'rgba(40,24,4,.9)'; c.lineWidth = 6.4 * w; c.stroke();
  c.globalAlpha = a; c.strokeStyle = '#f2c230'; c.lineWidth = 4.2 * w; c.stroke();
  c.globalAlpha = a * .8; c.strokeStyle = '#fff1a8'; c.lineWidth = 1.2 * w; c.beginPath(); c.arc(x, y, r - 1 * w, Math.PI * 1.05, Math.PI * 1.7); c.stroke();
}
export function drawRickenbackerRing(c, g, point, t, px, py) {
  if (g.pilot !== 'rickenbacker') return false;
  const m = pst(g, () => ({ prev: null, sw: 0, arc: null, wing: [] }));
  m.ring ??= { k: 0, last: t, rounds: g.roundsFired || 0, stamps: [], pulse: -9 };
  const R = m.ring, dt = Math.max(0, Math.min(.1, t - R.last)); R.last = t;
  const active = g.skillTime > 0;
  R.k = clamp(R.k + (active ? dt / .2 : -dt / .3));
  if (active && (g.roundsFired || 0) > R.rounds) {             // a burst went out: stamp the same targets the engine picks
    let n = 0;
    for (const e of g.enemies || []) { if (n >= 7) break; if (!(e.hp > 0) || e.surface || Math.hypot(e.x - g.x, e.y - g.y) > 780) continue;
      if (!R.stamps.some(s => s.e === e && t - s.t0 < .25)) R.stamps.push({ e, t0: t }); n++; }
    if (n) R.pulse = t;
  }
  R.rounds = g.roundsFired || 0;
  R.stamps = R.stamps.filter(s => t - s.t0 < .45 && s.e.hp > 0);
  if (R.k <= .01 && !R.stamps.length) return true;
  c.save(); c.lineCap = 'round';
  // stamps on the struck enemies: the ring snaps down onto each plane, then fades
  for (const s of R.stamps) {
    const q = (t - s.t0) / .45, [x, y] = point(s.e.x, s.e.y), sz = sizeOf(s.e);
    const r = sz * (1.05 + .9 * Math.pow(1 - Math.min(1, q / .35), 2));
    tricolorRing(c, x, y, r, (1 - q) * .9, .8);
  }
  // the ring on himself, with the hat riding the top; it kicks outward on each burst
  if (R.k > .01) {
    const kick = Math.max(0, 1 - (t - R.pulse) / .2), r = 40 + 5 * kick, a = R.k * (.85 + .15 * kick);
    tricolorRing(c, px, py, r, a);
    const ha = -Math.PI * .72 + Math.sin(t * 1.6) * .08, hx = px + Math.cos(ha) * r, hy = py + Math.sin(ha) * r;
    c.save(); c.translate(hx, hy); c.rotate(-.42 + Math.sin(t * 1.6) * .06); c.globalAlpha = R.k; hatGlyph(c, 0, 0, 17); c.restore();
  }
  c.restore();
  return true;
}

// ---- Immelmann "독일의 독수리" / Eagle: right after a big turn, 1.5 s of tighter spread and +20% fire rate.
//   the turn he just made is drawn behind him as a pale-gold feathered swoosh that fades with the buff
export function drawImmelmannEagle(c, g, point, t, px, py) {
  if (g.pilot !== 'immelmann') return false;
  sprites(); if (!EMBER) return false;
  const m = pst(g, () => ({ trail: [], last: 0 }));
  push(m.trail, { x: g.x, y: g.y, a: g.a || 0 }, t, .55);
  const e = g.eagleTime || 0; if (e <= 0) return true;
  const k = clamp(e / .4) * clamp((1.5 - e) / .08 + .3), n = m.trail.length;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 1; i < n; i++) {                                     // tapered gold swoosh (older = thinner)
    const p0 = m.trail[i - 1], p1 = m.trail[i], u = i / n, [x0, y0] = point(p0.x, p0.y), [x1, y1] = point(p1.x, p1.y);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.globalAlpha = k * u * .35; c.strokeStyle = '#f5d27a'; c.lineWidth = 2 + 9 * u; c.stroke();
    c.globalAlpha = k * u * .8; c.strokeStyle = '#fff6da'; c.lineWidth = .8 + 1.6 * u; c.stroke();
  }
  c.globalCompositeOperation = 'lighter';                           // a few feathers peeling off the swoosh
  for (let i = 0; i < n; i += 4) {
    const p = m.trail[i]; if (hash(p.t * 11, 3) > .35) continue;
    const age = (t - p.t) / .55, [x, y] = point(p.x, p.y), side = hash(p.t, 8) > .5 ? 1 : -1, d = 6 + 14 * age;
    const fx = x - Math.sin(p.a) * d * side, fy = y + Math.cos(p.a) * d * side;
    c.save(); c.translate(fx, fy); c.rotate(p.a + side * (.6 + age)); c.globalAlpha = k * (1 - age) * .9;
    c.fillStyle = '#ffe9b0'; c.beginPath(); c.ellipse(0, 0, 5, 1.6, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.restore();
  return true;
}

// ---- Jacobs "선회전의 베테랑" / Black Falcon: stacks of extra fire rate (max 3).
//   black-falcon wisps: a pair of dark vapour ribbons off the wingtips, heavier with each stack
export function drawJacobsFalcon(c, g, point, t, px, py) {
  if (g.pilot !== 'jacobs') return false;
  sprites(); if (!VAPOR) return false;
  const m = pst(g, () => ({ trail: [] }));
  push(m.trail, { x: g.x, y: g.y, a: g.a || 0 }, t, .5);
  const st = g.jacobsStacks || 0; if (st <= 0) return true;
  const k = clamp((g.jacobsStackTime || 0) / .6);
  c.save(); c.lineCap = 'round';
  const W = (q, side) => { const off = 17; return point(q.x - Math.sin(q.a) * off * side - Math.cos(q.a) * 6, q.y + Math.cos(q.a) * off * side - Math.sin(q.a) * 6); };
  const n = m.trail.length;
  for (const side of [-1, 1]) for (let i = 1; i < n; i++) {        // tapered dark wingtip vapour, heavier per stack
    const u = i / n, [x0, y0] = W(m.trail[i - 1], side), [x1, y1] = W(m.trail[i], side);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.globalAlpha = (.12 + .1 * st) * k * u; c.strokeStyle = '#151417'; c.lineWidth = (1 + 1.4 * st) * (.3 + .7 * u); c.stroke();
  }
  c.restore();
  return true;
}

// ---- Gontermann "점화 조준" / Ignition Sight: hold aim 1.5 s -> incendiary rounds every 1.2 s.
//   his gun muzzles heat up while the aim holds (dull red -> white-orange), and once primed a
//   small flame licks from the muzzle and embers spill back off the nose
export function drawGontermannHeat(c, g, point, t, px, py) {
  if (g.pilot !== 'gontermann') return false;
  sprites(); if (!EMBER) return false;
  const f = g.pilotIdentity?.focus || 0; if (f <= .02) return true;
  const a = g.a || 0, ca = Math.cos(a), sa = Math.sin(a), primed = f >= .999;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const side of [-1, 1]) {
    const mx = px + ca * 22 - sa * 5 * side, my = py + sa * 22 + ca * 5 * side, r = 4 + 6 * f + (primed ? 2 * Math.sin(t * 20 + side) : 0);
    c.globalAlpha = .35 + .55 * f; c.drawImage(EMBER, mx - r, my - r, r * 2, r * 2);
    if (primed) {                                                   // flame lick off the muzzle
      const L = 10 + 4 * Math.sin(t * 23 + side * 2);
      const gr = c.createLinearGradient(mx, my, mx + ca * L, my + sa * L); gr.addColorStop(0, 'rgba(255,236,190,.95)'); gr.addColorStop(1, 'rgba(255,110,40,0)');
      c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + ca * L, my + sa * L); c.globalAlpha = .9; c.strokeStyle = gr; c.lineWidth = 3; c.lineCap = 'round'; c.stroke();
    }
  }
  if (primed) for (let i = 0; i < 4; i++) {                        // embers spilling back
    const q = ((t * 1.7 + i / 4) % 1), side = i % 2 ? 1 : -1, d = 18 - q * 34, e = 2.2 * (1 - q) + .6;
    c.globalAlpha = (1 - q) * .9; c.drawImage(EMBER, px + ca * d - sa * (5 + q * 6) * side - e, py + sa * d + ca * (5 + q * 6) * side - e, e * 2, e * 2);
  }
  c.restore();
  return true;
}
