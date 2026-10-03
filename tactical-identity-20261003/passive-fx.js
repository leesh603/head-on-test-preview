// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// In-world effects rather than HUD marks. Purely visual: reads the engine's existing
// hunt fields, never writes gameplay state.
//   prey          -> a gun-sight that settles with each stack (gold at tier III) and a thin crimson vapour; it thickens with each hunt stack
//                    (tier I wisp -> II sheds embers -> III a burning red streamer)
//   tier-up       -> a short spray of crimson sparks off the prey
//   about to drop -> the streamer thins out over the last 0.6 s before the reset
//   kill reward   -> crimson wingtip vapour trails off your own plane for the 4 s boost
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=508';

const memo = new WeakMap();
const st = g => { let s = memo.get(g); if (!s) memo.set(g, s = { tier: 0, burst: -9, burstAt: null, prey: null, trail: [], wing: [] }); return s; };
const clamp = q => Math.max(0, Math.min(1, q));
let VAPOR = null, EMBER = null, SOOTV = null;
function sprites() {
  if (VAPOR || typeof document === 'undefined') return;
  const mk = stops => { const k = document.createElement('canvas'); k.width = k.height = 48; const x = k.getContext('2d'), gr = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    for (const [o, c] of stops) gr.addColorStop(o, c); x.fillStyle = gr; x.fillRect(0, 0, 48, 48); return k; };
  VAPOR = mk([[0, 'rgba(150,40,32,.5)'], [.5, 'rgba(110,36,30,.24)'], [1, 'rgba(80,30,26,0)']]);
  SOOTV = mk([[0, 'rgba(10,10,12,.7)'], [.5, 'rgba(10,10,12,.3)'], [1, 'rgba(10,10,12,0)']]);
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
  sprites(); if (!EMBER) return false;
  if (g.pilot === 'baron') { drawRedFighter(c, g, point, t, px, py); drawSunHunter(c, g, point, t, px, py, 'back'); return drawBaronHunt(c, g, point, t, px, py); }
  if (g.pilot === 'berthold') drawBertholdWill(c, g, point, t, px, py);
  else if (g.pilot === 'mannock') drawMannockCover(c, g, point, t);
  else if (g.pilot === 'fonck') drawFonckFocus(c, g, point, t);
  else if (g.pilot === 'rickenbacker') { drawRickenbackerSwitch(c, g, point, t, px, py); drawRickenbackerRing(c, g, point, t, px, py, 'back'); }
  else if (g.pilot === 'ball') drawBallLone(c, g, point, t, px, py);
  else if (g.pilot === 'immelmann') drawImmelmannEagle(c, g, point, t, px, py);
  else if (g.pilot === 'jacobs') drawJacobsFalcon(c, g, point, t, px, py);
  else if (g.pilot === 'gontermann') drawGontermannHeat(c, g, point, t, px, py);
  else if (g.pilot === 'barker') drawBarkerDefiance(c, g, point, t, px, py);
  else if (g.pilot === 'nungesser') drawNungesserDeath(c, g, point, t, px, py);
  else if (g.pilot === 'baracca') drawBaraccaLance(c, g, point, t, px, py, 'back');
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
// The 94th's hoop seen in perspective: a tilted yellow tube; the far half is drawn behind the
// plane (back layer) and the near half over it (front layer), so it reads as a ring the plane
// sits inside, like the hat being tossed through the squadron ring.
function hoop(c, x, y, r, a, layer, tilt = -.38, squash = .42, w = 1) {
  const from = layer === 'back' ? Math.PI : 0, to = layer === 'back' ? Math.PI * 2 : Math.PI;
  const arc = () => { c.beginPath(); c.ellipse(x, y, r, r * squash, tilt, from, to); };
  c.lineCap = 'round';
  arc(); c.globalAlpha = a * .5; c.strokeStyle = 'rgba(40,22,2,.9)'; c.lineWidth = 7.5 * w; c.stroke();     // dark bed
  arc(); c.globalAlpha = a; c.strokeStyle = layer === 'back' ? '#c99a1c' : '#f2c230'; c.lineWidth = 5.2 * w; c.stroke(); // far side a touch darker
  c.beginPath(); c.ellipse(x, y - 1.2 * w, r, r * squash, tilt, from + .25, to - .25);                    // tube highlight
  c.globalAlpha = a * (layer === 'back' ? .35 : .85); c.strokeStyle = '#fff3b0'; c.lineWidth = 1.4 * w; c.stroke();
}
function hatGlyph(c, x, y, s) {                               // small Uncle-Sam top hat
  c.save(); c.translate(x, y);
  c.fillStyle = '#1f3f86'; c.fillRect(-s * .62, s * .18, s * 1.24, s * .2);           // brim
  c.fillStyle = '#f2efe6'; c.fillRect(-s * .38, -s * .62, s * .76, s * .82);          // crown
  c.fillStyle = '#c8332b'; for (let i = 0; i < 3; i++) c.fillRect(-s * .38 + i * s * .26, -s * .62, s * .12, s * .82);
  c.fillStyle = '#1f3f86'; c.fillRect(-s * .38, -s * .04, s * .76, s * .16);          // band
  c.restore();
}
export function drawRickenbackerRing(c, g, point, t, px, py, layer = 'back') {
  if (g.pilot !== 'rickenbacker') return false;
  const m = pst(g, () => ({ prev: null, sw: 0, arc: null, wing: [] }));
  m.ring ??= { k: 0, last: t, rounds: g.roundsFired || 0, stamps: [], pulse: -9 };
  const R = m.ring;
  (globalThis.__hoHoop ??= new WeakSet()).add(g);                 // the painted hoop replaces the legacy half-ring for this plane
  if (layer === 'back') {                                       // state advances once per frame, on the back pass
    const dt = Math.max(0, Math.min(.1, t - R.last)); R.last = t;
    const active = g.skillTime > 0;
    R.k = clamp(R.k + (active ? dt / .2 : -dt / .3));
    if (active && (g.roundsFired || 0) > R.rounds) {            // a burst went out: stamp the same targets the engine picks
      let n = 0;
      for (const e of g.enemies || []) { if (n >= 7) break; if (!(e.hp > 0) || e.surface || Math.hypot(e.x - g.x, e.y - g.y) > 780) continue;
        if (!R.stamps.some(s => s.e === e && t - s.t0 < .25)) R.stamps.push({ e, t0: t }); n++; }
      if (n) R.pulse = t;
    }
    R.rounds = g.roundsFired || 0;
    R.stamps = R.stamps.filter(s => t - s.t0 < .45 && s.e.hp > 0);
  }
  if (R.k <= .01 && !R.stamps.length) return true;
  c.save();
  for (const s of R.stamps) {                                   // hoop drops over each struck enemy, then fades
    const q = (t - s.t0) / .45, [x, y] = point(s.e.x, s.e.y), sz = sizeOf(s.e);
    const r = sz * (1.05 + .9 * Math.pow(1 - Math.min(1, q / .35), 2));
    hoop(c, x, y, r, (1 - q) * .9, layer, -.38, .42, .8);
  }
  if (R.k > .01) {
    const kick = Math.max(0, 1 - (t - R.pulse) / .2), r = 42 + 5 * kick, a = R.k * (.85 + .15 * kick), tilt = -.38 + Math.sin(t * 1.4) * .05;
    if (layer === 'front') {                                    // hat tossed through the hoop's left rim, under the near arc
      const hx = px - r * Math.cos(tilt) * .9, hy = py - r * Math.sin(tilt) * .9 - 8 + Math.sin(t * 1.6) * 1.2;   // brim sits on the left rim
      c.save(); c.translate(hx, hy); c.rotate(-.5 + Math.sin(t * 1.6) * .05); c.globalAlpha = R.k; hatGlyph(c, 0, 0, 17); c.restore();
    }
    hoop(c, px, py, r, a, layer, tilt);
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


// ---- Barker "불굴의 각성" / Undaunted: each hit taken adds +13% MG damage for 3 s (max 3).
//   embers kindle around his plane and swirl in a slow spiral, a ring of them per stack;
//   each new stack flares outward once
export function drawBarkerDefiance(c, g, point, t, px, py) {
  if (g.pilot !== 'barker') return false;
  sprites(); if (!EMBER) return false;
  const st = g.barkerStacks || 0, m = pst(g, () => ({ st: 0, flare: -9 }));
  if (st > m.st) m.flare = t; m.st = st;
  const k = clamp((g.barkerStackTime || 0) / .5);
  c.save(); c.globalCompositeOperation = 'lighter';
  if (st > 0) {
    const gr = c.createRadialGradient(px, py, 6, px, py, 34 + 6 * st);
    gr.addColorStop(0, 'rgba(255,120,40,' + (.18 + .08 * st) + ')'); gr.addColorStop(1, 'rgba(200,50,20,0)');
    c.globalAlpha = k; c.fillStyle = gr; c.beginPath(); c.arc(px, py, 34 + 6 * st, 0, Math.PI * 2); c.fill();
    for (let ring = 0; ring < st; ring++) for (let i = 0; i < 5; i++) {
      const a = t * (1.6 + ring * .5) * (ring % 2 ? -1 : 1) + i * Math.PI * 2 / 5 + ring, r = 22 + ring * 7 + 2 * Math.sin(t * 5 + i);
      const e = 3.4 + 1.2 * Math.sin(t * 9 + i + ring);
      c.globalAlpha = k * (.6 + .3 * Math.sin(t * 7 + i)); c.drawImage(EMBER, px + Math.cos(a) * r - e, py + Math.sin(a) * r - e, e * 2, e * 2);
    }
  }
  const q = (t - m.flare) / .35;
  if (q >= 0 && q < 1) for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 + m.flare, d = 16 + 34 * (1 - Math.pow(1 - q, 2)), e = 3 * (1 - q) + .8;
    c.globalAlpha = 1 - q; c.drawImage(EMBER, px + Math.cos(a) * d - e, py + Math.sin(a) * d - e, e * 2, e * 2);
  }
  c.restore();
  return true;
}

// ---- Luke "소이탄 사냥꾼" / Balloon Buster: burning enemies take +20% MG damage.
//   every enemy he has set alight carries a hot orange underglow and sheds rising embers,
//   so the bonus targets stand out from plain fire
export function drawLukeIgnited(c, g, point, t) {
  if (g.pilot !== 'luke') return false;
  sprites(); if (!EMBER) return false;
  const burns = g.pilotIdentity?.burns; if (!burns || !burns.size) return true;
  c.save(); c.globalCompositeOperation = 'lighter';
  let n = 0;
  for (const b of burns.values()) {
    const e = b.enemy; if (!e || !(e.hp > 0) || b.time <= 0 || n++ > 8) continue;
    const [x, y] = point(e.x, e.y), k = clamp(b.time / .6), R = sizeOf(e) * 1.6;
    const gr = c.createRadialGradient(x, y, 4, x, y, R);
    gr.addColorStop(0, 'rgba(255,150,60,.22)'); gr.addColorStop(.5, 'rgba(255,110,40,.16)'); gr.addColorStop(1, 'rgba(230,80,20,0)');
    c.globalAlpha = k * (.8 + .2 * Math.sin(t * 12 + x)); c.fillStyle = gr; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 7; i++) {
      const q = ((t * 1.4 + i / 7 + hash(e.x | 0, i)) % 1), ox = (hash(i, e.y | 0) - .5) * R * .9, em = 3.4 * (1 - q) + .8;
      c.globalAlpha = k * (1 - q) * .9; c.drawImage(EMBER, x + ox + Math.sin(q * 6 + i) * 4 - em, y - q * R * 1.3 - em, em * 2, em * 2);
    }
  }
  c.restore();
  return true;
}

// ---- McKeever & Powell "표적인계" / Handoff: the front gun tags an enemy, Powell's rear gun
// deals +30% to it for 3 s.  A green Very-pistol flare hangs over the tagged enemy, trailing a
// thin green smoke wisp, and dies out with the handoff timer.
export function drawMckeeverHandoff(c, g, point, t) {
  if (g.pilot !== 'mckeever') return false;
  sprites(); if (!VAPOR) return false;
  const s = g.pilotIdentity, e = s?.handoff, ht = s?.handoffTime || 0;
  const m = pst(g, () => ({ e: null, t0: 0, trail: [] }));
  if (!e || !(e.hp > 0) || ht <= 0) { m.e = null; m.trail = []; return true; }
  if (e !== m.e) { m.e = e; m.t0 = t; m.trail = []; }
  const [x, y] = point(e.x, e.y), k = clamp(ht / .5), pop = clamp((t - m.t0) / .25);
  const fx = x + Math.sin(t * 2.2) * 3, fy = y - sizeOf(e) * (.9 + .3 * pop) + Math.sin(t * 3.1) * 2;
  push(m.trail, { x: fx, y: fy }, t, .6);
  c.save();
  for (const p of m.trail) { const age = (t - p.t) / .6, w = 3 + 7 * age;
    c.globalAlpha = (1 - age) * .35 * k; c.drawImage(VAPOR, p.x - w + age * 4, p.y - w + age * 10, w * 2, w * 2); }
  c.globalCompositeOperation = 'lighter';
  const flick = .8 + .2 * Math.sin(t * 31);
  const gr = c.createRadialGradient(fx, fy, 0, fx, fy, 14);
  gr.addColorStop(0, 'rgba(235,255,225,1)'); gr.addColorStop(.3, 'rgba(120,255,120,.75)'); gr.addColorStop(1, 'rgba(40,200,60,0)');
  c.globalAlpha = k * flick; c.fillStyle = gr; c.beginPath(); c.arc(fx, fy, 14, 0, Math.PI * 2); c.fill();
  c.restore();
  return true;
}


// ---- Nungesser "죽음의 기사" / Knight of Death: the lower his HP, the faster he fires and flies.
//   a cold spectral glow gathers around his plane and pale blue-white wisps stream off the
//   fuselage, growing as HP falls toward 20%
export function drawNungesserDeath(c, g, point, t, px, py) {
  if (g.pilot !== 'nungesser') return false;
  sprites(); if (!VAPOR) return false;
  const m = pst(g, () => ({ trail: [] }));
  push(m.trail, { x: g.x, y: g.y, a: g.a || 0 }, t, .45);
  const k = clamp((1 - (g.hp || 0) / Math.max(1, g.maxHp || 1)) / .8); if (k <= .03) return true;
  c.save(); c.globalCompositeOperation = 'lighter';
  const gr = c.createRadialGradient(px, py, 8, px, py, 40);
  gr.addColorStop(0, 'rgba(150,200,255,' + (.14 * k) + ')'); gr.addColorStop(1, 'rgba(120,170,255,0)');
  c.globalAlpha = .85 + .15 * Math.sin(t * 6); c.fillStyle = gr; c.beginPath(); c.arc(px, py, 40, 0, Math.PI * 2); c.fill();
  const n = m.trail.length;
  for (const side of [-1, 0, 1]) for (let i = 1; i < n; i++) {
    const p0 = m.trail[i - 1], p1 = m.trail[i], u = i / n, off = side * 9;
    const wob = (q, p) => Math.sin((t - p.t) * 22 + side * 2) * 3 * (t - p.t) * 3;
    const [x0, y0] = point(p0.x - Math.sin(p0.a) * (off + wob(0, p0)) - Math.cos(p0.a) * 10, p0.y + Math.cos(p0.a) * (off + wob(0, p0)) - Math.sin(p0.a) * 10);
    const [x1, y1] = point(p1.x - Math.sin(p1.a) * (off + wob(0, p1)) - Math.cos(p1.a) * 10, p1.y + Math.cos(p1.a) * (off + wob(0, p1)) - Math.sin(p1.a) * 10);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineCap = 'round';
    c.globalAlpha = k * u * (side ? .45 : .7); c.strokeStyle = side ? '#9cc8ff' : '#e8f3ff'; c.lineWidth = (side ? 1.6 : 2.4) * (.4 + .6 * u) * (.7 + .5 * k); c.stroke();
  }
  c.restore();
  return true;
}

// ---- Bishop "근접기습" / Close Ambush: inside 360 px, the closer the target the harder he hits (to +65%).
//   his muzzle blaze swells as he closes in, and at point-blank range hot sparks spray off the
//   flash toward the nearest enemy
export function drawBishopClose(c, g, point, t, px, py) {
  if (g.pilot !== 'bishop') return false;
  sprites(); if (!EMBER) return false;
  let best = null, bd = 360;
  for (const e of g.enemies || []) { if (!(e.hp > 0) || e.surface) continue; const d = Math.hypot(e.x - g.x, e.y - g.y); if (d < bd) { bd = d; best = e; } }
  if (!best) return true;
  const p = 1 - bd / 360, firing = (g.muzzleFlash || 0) > 0; if (!firing || p <= .05) return true;
  const a = g.a || 0, nx = px + Math.cos(a) * 26, ny = py + Math.sin(a) * 26, r = 8 + 18 * p;
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = .4 + .5 * p; c.drawImage(EMBER, nx - r, ny - r, r * 2, r * 2);
  if (p > .4) { const [ex, ey] = point(best.x, best.y), ta = Math.atan2(ey - ny, ex - nx);
    for (let i = 0; i < 6; i++) { const q = ((t * 6 + i / 6) % 1), sa = ta + (hash(i, Math.floor(t * 6)) - .5) * .6, d = 8 + q * 40 * p, e = 2.2 * (1 - q) + .6;
      c.globalAlpha = (1 - q) * p; c.drawImage(EMBER, nx + Math.cos(sa) * d - e, ny + Math.sin(sa) * d - e, e * 2, e * 2); } }
  c.restore();
  return true;
}

// ---- Boelcke "딕타 뵐케" / Dicta: +25% MG damage on an enemy's flank or rear.
//   enemies that currently show him their flank or tail get a cold steel glint along the exposed
//   side (the side facing him), so the openings in the furball read at a glance
export function drawBoelckeDicta(c, g, point, t) {
  if (g.pilot !== 'boelcke') return false;
  sprites(); if (!EMBER) return false;
  let n = 0;
  c.save(); c.lineCap = 'round';
  for (const e of g.enemies || []) {
    if (n >= 4 || !(e.hp > 0) || e.surface || e.stageBossBody) continue;
    const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy); if (d > 560 || d < 30) continue;
    const toMe = Math.atan2(dy, dx), head = e.a ?? 0, off = Math.abs(Math.atan2(Math.sin(toMe - head), Math.cos(toMe - head)));
    if (off < Math.PI / 3) continue;                              // he is in front of it: no opening
    n++;
    const [x, y] = point(e.x, e.y), R = sizeOf(e) * .95, k = clamp((off - Math.PI / 3) / .5) * clamp((560 - d) / 120);
    const span = .9, sweep = (t * 1.8 + n) % 1;
    c.beginPath(); c.arc(x, y, R, toMe - span / 2, toMe + span / 2);
    c.globalAlpha = .35 * k; c.strokeStyle = '#9fb7cf'; c.lineWidth = 4; c.stroke();
    c.globalAlpha = .85 * k; c.strokeStyle = '#eef5ff'; c.lineWidth = 1.4; c.stroke();
    const ga = toMe - span / 2 + span * sweep;                    // glint running along the arc
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * (1 - Math.abs(sweep - .5) * 1.6);
    c.drawImage(EMBER, x + Math.cos(ga) * R - 4, y + Math.sin(ga) * R - 4, 8, 8); c.globalCompositeOperation = 'source-over';
  }
  c.restore();
  return true;
}


// ---- Richthofen on the red Albatros ("붉은 전투기 조종사" / Red Fighter Pilot: +12% speed and turn).
// No hunt marks on this airframe; the always-on agility shows in the air instead: in hard turns
// crimson-tinged vortices peel off both wingtips, stronger the tighter he turns.
export function drawRedFighter(c, g, point, t, px, py) {
  if (g.pilot !== 'baron' || !g.isRedHunter?.()) return false;
  const m = pst(g, () => ({ trail: [], a: g.a || 0, lt: t, rate: 0 }));
  const dt = Math.max(1e-3, Math.min(.1, t - m.lt)), da = Math.atan2(Math.sin((g.a || 0) - m.a), Math.cos((g.a || 0) - m.a));
  m.rate = m.rate * .8 + Math.abs(da / dt) * .2; m.a = g.a || 0; m.lt = t;
  push(m.trail, { x: g.x, y: g.y, a: g.a || 0, k: clamp((m.rate - .5) / 1.4) }, t, .42);
  const n = m.trail.length; if (n < 2) return true;
  c.save(); c.lineCap = 'round';
  for (const side of [-1, 1]) for (let i = 1; i < n; i++) {
    const p0 = m.trail[i - 1], p1 = m.trail[i], k = (p0.k + p1.k) / 2; if (k <= .02) continue;
    const u = i / n, off = 19;
    const [x0, y0] = point(p0.x - Math.sin(p0.a) * off * side, p0.y + Math.cos(p0.a) * off * side);
    const [x1, y1] = point(p1.x - Math.sin(p1.a) * off * side, p1.y + Math.cos(p1.a) * off * side);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.globalAlpha = k * u * .5; c.strokeStyle = '#c8352c'; c.lineWidth = 6 * u; c.stroke();
    c.globalAlpha = k * u * .9; c.strokeStyle = '#fff0ea'; c.lineWidth = 1.8 * u; c.stroke();
  }
  c.restore();
  return true;
}


// ---- Baracca active "검은 말의 돌파" / Prancing-horse charge: a straight invulnerable dash that
// pierces everything in its path.  Drawn as a cavalry lance charge: a long couched lance thrust
// out ahead of the nose with an Italian tricolour pennant streaming off it, a pressure cone
// splitting the air at the tip, speed streaks peeling past, and a spark burst + shock ring on
// every plane the lance runs through.  (Lance replaced by a black wedge enveloping the plane.)
export function drawBaraccaLance(c, g, point, t, px, py, layer = 'back') {
  if (g.pilot !== 'baracca') return false;
  sprites(); if (!EMBER) return false;
  const m = pst(g, () => ({ k: 0, last: t, hits: 0, bursts: [], wake: [] }));
  (globalThis.__hoLance ??= new WeakSet()).add(g);
  const charging = (g.chargeTime || 0) > 0;
  if (layer === 'back') {
    const dt = Math.max(0, Math.min(.1, t - m.last)); m.last = t;
    if (charging && !m.on) m.start = t; m.on = charging;
    m.k = clamp(m.k + (charging ? dt / .08 : -dt / .25));
    const hits = g.chargeHits?.size || 0;
    if (charging && hits > m.hits) {                         // a new plane run through: burst at the nearest enemy ahead
      let best = null, bd = 1e9;
      for (const e of g.enemies || []) { if (!(e.hp >= 0)) continue; const d = Math.hypot(e.x - g.x, e.y - g.y); if (d < bd) { bd = d; best = e; } }
      if (best && bd < 160) m.bursts.push({ x: best.x, y: best.y, a: g.a || 0, t0: t });
    }
    m.hits = charging ? hits : 0;
    m.bursts = m.bursts.filter(b => t - b.t0 < .5);
    if (m.px !== undefined && t > m.pt) { const dx = g.x - m.px, dy = g.y - m.py; if (Math.hypot(dx, dy) > 2) m.mv = { dx, dy }; }
    m.px = g.x; m.py = g.y; m.pt = t;
    push(m.wake, { x: g.x, y: g.y, a: g.a || 0 }, t, .35);
  }
  const a = g.a || 0, ca = Math.cos(a), sa = Math.sin(a);
  c.save(); c.lineCap = 'round';
  if (layer === 'back' && m.k > .01) {                        // speed streaks + churned air behind
    for (let i = 0; i < 10; i++) {
      const q = ((t * 5 + i / 10) % 1), side = (hash(i, 3) - .5) * 70, back = 20 + q * 150, len = 30 + 40 * hash(i, 7);
      const x0 = px - ca * back - sa * side, y0 = py - sa * back + ca * side;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 - ca * len, y0 - sa * len);
      c.globalAlpha = m.k * (1 - q) * .55; c.strokeStyle = '#f2f0e8'; c.lineWidth = 1.3; c.stroke();
    }
    for (const p of m.wake) { const age = (t - p.t) / .35, [x, y] = point(p.x, p.y), w = 10 + 22 * age;
      c.globalAlpha = m.k * (1 - age) * .22; c.drawImage(VAPOR, x - w, y - w, w * 2, w * 2); }
  }
  // dark veil: a soft black membrane of driven air streaming around the plane and drawing to a
  // point ahead — reads as a lance only through its silhouette. No outlines; built from layered,
  // feathered smoke so the edges stay soft and keep moving.
  if (layer === 'back' && m.k > .01) {
    const k = m.k, mv = m.mv, ang = mv && Math.hypot(mv.dx, mv.dy) > 2 ? Math.atan2(mv.dy, mv.dx) : a;
    c.save(); c.translate(px, py); c.rotate(ang);
    const tip = 96 + 16 * k, back = -70;
    // 1) soft body: several stacked, slightly jittered tapering sheets (feathered by alpha stacking)
    for (let l = 0; l < 5; l++) {
      const w = 34 + l * 7, j = Math.sin(t * 17 + l * 1.9) * 2, tp = tip - l * 9;
      const gr = c.createLinearGradient(back, 0, tp, 0);
      gr.addColorStop(0, 'rgba(6,7,9,0)'); gr.addColorStop(.4, 'rgba(8,9,11,' + (.26 - l * .03) + ')'); gr.addColorStop(.92, 'rgba(5,6,8,' + (.5 - l * .07) + ')'); gr.addColorStop(1, 'rgba(5,6,8,.2)');
      c.beginPath(); c.moveTo(tp, j * .3);
      c.bezierCurveTo(tp * .55, -w * .12 + j * .5, tp * .1, -w * .8, back, -w * .82 + j);
      c.lineTo(back, w * .82 - j);
      c.bezierCurveTo(tp * .1, w * .8, tp * .55, w * .12 - j * .5, tp, -j * .3); c.closePath();
      c.globalAlpha = k; c.fillStyle = gr; c.fill();
    }
    // 2) streaming smoke filaments peeling off the veil and rushing back past the plane
    for (let i = 0; i < 16; i++) {
      const q = ((t * 3.2 + hash(i, 5)) % 1), side = i % 2 ? 1 : -1, lane = .25 + .75 * hash(i, 11);
      const x = tip * (1 - q * 1.15) - q * 90, wHere = 6 + 36 * lane * Math.min(1, (tip - x) / (tip - back));
      const y = side * wHere + Math.sin(t * 9 + i) * 3, r = 6 + 16 * q;
      c.globalAlpha = k * Math.sin(Math.PI * q) * .75; c.drawImage(SOOTV, x - r, y - r, r * 2, r * 2);
    }
    // 3) a dense, dark point where the veil gathers ahead of the nose
    const pg = c.createRadialGradient(tip - 14, 0, 0, tip - 14, 0, 26);
    pg.addColorStop(0, 'rgba(4,5,7,.55)'); pg.addColorStop(1, 'rgba(4,5,7,0)');
    c.globalAlpha = k; c.fillStyle = pg; c.beginPath(); c.ellipse(tip - 14, 0, 30, 12, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  if (layer === 'front') for (const b of m.bursts) {          // impact: sparks thrown forward + shock ring
    const q = (t - b.t0) / .5, [x, y] = point(b.x, b.y);
    c.globalCompositeOperation = 'lighter';
    c.beginPath(); c.arc(x, y, 14 + 46 * (1 - Math.pow(1 - q, 3)), 0, Math.PI * 2);
    c.globalAlpha = (1 - q) * .8; c.strokeStyle = '#fff3d6'; c.lineWidth = 3 * (1 - q) + .6; c.stroke();
    for (let i = 0; i < 14; i++) { const sa2 = b.a + (hash(i, b.t0) - .5) * 2.2, d = (10 + 60 * hash(b.t0, i)) * (1 - Math.pow(1 - q, 2)), e = 3 * (1 - q) + .6;
      c.globalAlpha = 1 - q; c.drawImage(EMBER, x + Math.cos(sa2) * d - e, y + Math.sin(sa2) * d - e, e * 2, e * 2); }
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
  return true;
}


// ---- Richthofen (red Albatros) active "태양을 등진 사냥꾼" / Hunter from the Sun: for 4 s enemies in
// a 650 px / ±36° cone ahead can't fire.  Diving out of the sun: a blazing sun sits behind his
// tail, hard god-rays fan forward through the cone with lens-flare ghosts along the axis, and
// every enemy caught in it is dazzled (white glare star + flinching halo).
export function drawSunHunter(c, g, point, t, px, py, layer = 'back') {
  if (g.pilot !== 'baron' || !g.isRedHunter?.()) return false;
  sprites(); if (!EMBER) return false;
  const m = pst(g, () => ({}));
  m.sun ??= { k: 0, last: t, t0: -9 };
  const S = m.sun;
  (globalThis.__hoSun ??= new WeakSet()).add(g);
  const on = (g.skillTime || 0) > 0;
  if (layer === 'back') { const dt = Math.max(0, Math.min(.1, t - S.last)); S.last = t; if (on && S.k === 0) S.t0 = t; S.k = clamp(S.k + (on ? dt / .25 : -dt / .35)); }
  if (S.k <= .01) return true;
  const k = S.k, a = g.a || 0, ca = Math.cos(a), sa = Math.sin(a), R = 650, half = Math.PI / 5;
  const sx = px - ca * 70, sy = py - sa * 70;                    // the sun, just behind his tail
  c.save();
  if (layer === 'back') {
    // god-rays: a fan of hard, slowly breathing beams through the strike cone
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const u = i / 8 * 2 - 1, ra = a + u * half * .95 + Math.sin(t * 1.3 + i) * .02, w = (.025 + .02 * hash(i, 4)) * (1 + .3 * Math.sin(t * 2.1 + i * 1.7));
      const L = R * (.8 + .2 * hash(i, 9)), gr = c.createLinearGradient(sx, sy, sx + Math.cos(ra) * L, sy + Math.sin(ra) * L);
      gr.addColorStop(0, 'rgba(255,240,200,.32)'); gr.addColorStop(.5, 'rgba(255,214,140,.12)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = gr; c.globalAlpha = k; c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(sx + Math.cos(ra - w) * L, sy + Math.sin(ra - w) * L); c.lineTo(sx + Math.cos(ra + w) * L, sy + Math.sin(ra + w) * L); c.closePath(); c.fill();
    }
    // the sun disc + corona
    const pulse = 1 + .06 * Math.sin(t * 5), flash = Math.max(0, 1 - (t - S.t0) / .35);
    const cor = c.createRadialGradient(sx, sy, 0, sx, sy, 120 * pulse);
    cor.addColorStop(0, 'rgba(255,255,240,.95)'); cor.addColorStop(.12, 'rgba(255,236,180,.8)'); cor.addColorStop(.35, 'rgba(255,190,110,.25)'); cor.addColorStop(1, 'rgba(255,160,80,0)');
    c.globalAlpha = k; c.fillStyle = cor; c.beginPath(); c.arc(sx, sy, 120 * pulse, 0, Math.PI * 2); c.fill();
    if (flash > 0) { c.globalAlpha = flash * .6; c.fillStyle = 'rgba(255,250,230,1)'; c.beginPath(); c.arc(sx, sy, 40 + 260 * (1 - flash), 0, Math.PI * 2); c.fill(); }
    for (let i = 0; i < 6; i++) {                                // star spikes off the sun
      const sa2 = t * .4 + i * Math.PI / 3, L = 70 + 20 * Math.sin(t * 3 + i);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(sa2) * L, sy + Math.sin(sa2) * L);
      c.globalAlpha = k * .5; c.strokeStyle = '#fff6dc'; c.lineWidth = 1.5; c.stroke();
    }
  } else {
    // lens-flare ghosts strung along the axis ahead, and dazzled enemies in the cone
    c.globalCompositeOperation = 'lighter';
    for (const [d, r, col] of [[120, 10, 'rgba(255,220,150,.35)'], [210, 18, 'rgba(160,220,255,.22)'], [300, 7, 'rgba(255,255,255,.4)'], [420, 26, 'rgba(255,190,120,.16)']]) {
      const gx = sx + ca * d, gy = sy + sa * d, gr = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      gr.addColorStop(0, col); gr.addColorStop(.7, col.replace(/[\d.]+\)$/, '0.06)')); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = k; c.fillStyle = gr; c.beginPath(); c.arc(gx, gy, r, 0, Math.PI * 2); c.fill();
    }
    let n = 0;
    for (const e of g.enemies || []) {
      if (n >= 8 || !g.sunStrikeContains?.(e)) continue; n++;
      const [x, y] = point(e.x, e.y), tw = .8 + .2 * Math.sin(t * 17 + n), L = 14 * tw;
      c.globalAlpha = k * .9; c.strokeStyle = '#ffffff'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x - L, y - 6); c.lineTo(x + L, y - 6); c.moveTo(x, y - 6 - L); c.lineTo(x, y - 6 + L); c.stroke();
      c.globalAlpha = k * .55; c.drawImage(EMBER, x - 12, y - 18, 24, 24);
      c.beginPath(); c.arc(x, y, sizeOf(e) * (.9 + .08 * Math.sin(t * 9 + n)), 0, Math.PI * 2);
      c.globalAlpha = k * .35; c.strokeStyle = '#ffe9b8'; c.lineWidth = 2; c.stroke();
    }
  }
  c.restore();
  return true;
}

// Front layer (drawn after the player's plane): only effects that must sit over the plane.
export function drawPassiveFxFront(c, g, point, t, px, py) {
  sprites(); if (!EMBER) return;
  if (g.pilot === 'rickenbacker') drawRickenbackerRing(c, g, point, t, px, py, 'front');
  else if (g.pilot === 'baracca') drawBaraccaLance(c, g, point, t, px, py, 'front');
  else if (g.pilot === 'baron') drawSunHunter(c, g, point, t, px, py, 'front');
  else if (g.pilot === 'luke') drawLukeIgnited(c, g, point, t);
  else if (g.pilot === 'mckeever') drawMckeeverHandoff(c, g, point, t);
  else if (g.pilot === 'bishop') drawBishopClose(c, g, point, t, px, py);
  else if (g.pilot === 'boelcke') drawBoelckeDicta(c, g, point, t);
}
