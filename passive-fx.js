import {isAlbatrosHunter} from './albatros-hunter-fx.js';
import {fx as pilotTexture} from './fx-art.js?v=tame3';
import {createPilotReadability} from './pilot-readability-fx.js?v=gal1';
const pilotReadability=createPilotReadability(pilotTexture);
// Passive-state FX (sample: Richthofen "사냥 본능" / Hunting Instinct).
// In-world effects rather than HUD marks. Purely visual: reads the engine's existing
// hunt fields, never writes gameplay state.
//   prey          -> a gun-sight that settles with each stack (gold at tier III) and a thin crimson vapour; it thickens with each hunt stack
//                    (tier I wisp -> II sheds embers -> III a burning red streamer)
//   tier-up       -> a short spray of crimson sparks off the prey
//   about to drop -> the streamer thins out over the last 0.6 s before the reset
//   kill reward   -> crimson wingtip vapour trails off your own plane for the 4 s boost
import {RICHTHOFEN_DRI_BALANCE as B} from './engine.js?v=merge20261017&airbattle=20261025&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021&cityart=20261022&harbor=20261021&td4=20261026&kfb=1027&momentum=20261027';


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

// Berthold's held damage is shown by attached cloth in the shared front layer.
// Keep the old export for callers; the retired damage-debt/steel effect is unused.
export function drawBertholdWill(){return false;}

// Single entry for the renderer. Returns true only when the pilot's legacy marker should be skipped.
export function drawPassiveFx(c, g, point, t, px, py) {
  if(isAlbatrosHunter(g))return true; // Shared signature renderer owns both Albatros layers.
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

// The real wing aircraft's recoil and short muzzle carry Mannock's faster fire.
export function drawMannockCover(){return false;}

// shared: a tiny per-game memo
const pmemo = new WeakMap();
const pst = (g, init) => { let s = pmemo.get(g); if (!s) pmemo.set(g, s = init()); return s; };
const sizeOf = e => e.heavyBomber ? 60 : e.bossPilot ? 46 : e.type === 'bomber' ? 34 : 28;

// ---- Fonck "정밀 조준" / Precision: hold the same target and damage climbs to +35%.
//   four cold-white light shards close in on the target as the aim holds (iris focusing);
//   when the focus is complete they meet in a crisp star glint that keeps twinkling
export function drawFonckFocus(c, g, point, t) {
 return pilotReadability.fonck(c,g,point,t,sizeOf);
}

// Rickenbacker's confirmed switch is owned by the shared signature observer.
export function drawRickenbackerSwitch(c,g){return g.pilot==='rickenbacker';}

// ---- Ball "고독한 사냥꾼" / Lone Hunter: no ally within 320 px -> +15% MG damage.
//   while he flies alone a cold moonlit sheen rims his plane and a thin silver vapour trails
//   behind; it melts away as soon as a friendly comes close
export function drawBallLone(c, g, point, t, px, py) {
 return pilotReadability.ball(c,g,point,t,px,py);
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
  if (!(g.hp > 0) || g.status === 'downed') { delete m.ring; return true; }
  m.ring ??= { k: 0, last: t, rounds: g.roundsFired || 0, stamps: [], pulse: -9 };
  const R = m.ring;
  (globalThis.__hoHoop ??= new WeakSet()).add(g);                 // the painted hoop replaces the legacy half-ring for this plane
  if (layer === 'back') {                                       // state advances once per frame, on the back pass
    const dt = Math.max(0, Math.min(.1, t - R.last)); R.last = t;
    const active = g.skillTime > 0;
    R.k = clamp(R.k + (active ? dt / .2 : -dt / .3));
    if (active && (g.roundsFired || 0) > R.rounds) {            // a burst went out: stamp the same targets the engine picks
      let n = 0;
      for (const e of g.enemies || []) { if (n >= 7) break; if (!(e.hp > 0) || (e.surface && !e.stageBossBody) || Math.hypot(e.x - g.x, e.y - g.y) > 780) continue;
        if (!R.stamps.some(s => s.e === e && t - s.t0 < .25)) R.stamps.push({ e, t0: t }); n++; }
      if (n) R.pulse = t;
    }
    R.rounds = g.roundsFired || 0;
    {const _st=R.stamps;let _w=0;for(let _i=0;_i<_st.length;_i++){const s=_st[_i];if(t-s.t0<.45&&s.e.hp>0)_st[_w++]=s}_st.length=_w}
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

// ---- Immelmann: one short, neutral slipstream follows the real attack window.
export function drawImmelmannEagle(c,g,point,t,px,py){
 if(g.pilot!=='immelmann')return false;
 const m=pst(g,()=>({trail:[]})),e=g.eagleTime||0;
 if(e<=0||g.immelmannTurn){m.trail.length=0;return true;}
 push(m.trail,{x:g.x,y:g.y,a:g.a||0},t,.22);
 const n=m.trail.length;if(n<2)return true;
 c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle='#bdcbc8';c.lineWidth=1.1;
 for(let i=1;i<n;i++){
  const p0=m.trail[i-1],p1=m.trail[i],u=i/n;
  const [x0,y0]=point(p0.x-Math.cos(p0.a)*20,p0.y-Math.sin(p0.a)*20);
  const [x1,y1]=point(p1.x-Math.cos(p1.a)*20,p1.y-Math.sin(p1.a)*20);
  c.globalAlpha=.22*u*clamp(e/.3);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();
 }
 c.restore();return true;
}

// ---- Jacobs "선회전의 베테랑" / Black Falcon: stacks of extra fire rate (max 3).
//   black-falcon wisps: a pair of dark vapour ribbons off the wingtips, heavier with each stack
// Actual suppression is rendered on the struck aircraft.
export function drawJacobsFalcon(c,g){return g.pilot==='jacobs';}

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
// Shared authored death/defiance layers own this pilot in solo and co-op.
export function drawBarkerDefiance(c,g){return g.pilot==='barker';}

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
// Shared authored death/defiance layers own this pilot in solo and co-op.
export function drawNungesserDeath(c,g){return g.pilot==='nungesser';}

// Bishop: compact painted contact sparks follow confirmed close-range damage.
export function drawBishopClose(c,g){return g.pilot==='bishop';}

// ---- Boelcke "딕타 뵐케" / Dicta: +25% MG damage on an enemy's flank or rear.
//   enemies that currently show him their flank or tail get a cold steel glint along the exposed
//   side (the side facing him), so the openings in the furball read at a glance
// Shared command-flight rendering uses compact painted reflections and confirmed impacts.
export function drawBoelckeDicta(c,g){return g.pilot==='boelcke';}



// ---- Richthofen on the red Albatros ("붉은 전투기 조종사" / Red Fighter Pilot: +12% speed and turn).
// The shared signature renderer reads the real turn rate for painted wingtip fans.
// Compatibility entry: the shared signature view draws the Albatros agility.
export function drawRedFighter(c,g,point,t,px,py){return isAlbatrosHunter(g);}


// Compatibility: Baracca's dark charge uses the shared authored-texture view.
export function drawBaraccaLance(c,g){return g.pilot==='baracca';}

// Compatibility entry: Sun Hunter is drawn once by the shared signature view.
export function drawSunHunter(c,g,point,t,px,py,layer='back'){return isAlbatrosHunter(g);}

// Front layer (drawn after the player's plane): only effects that must sit over the plane.
export function drawPassiveFxFront(c, g, point, t, px, py) {
  if(isAlbatrosHunter(g))return;
  sprites(); if (!EMBER) return;
  if (g.pilot === 'rickenbacker') drawRickenbackerRing(c, g, point, t, px, py, 'front');
  else if (g.pilot === 'baracca') drawBaraccaLance(c, g, point, t, px, py, 'front');
  else if (g.pilot === 'baron') drawSunHunter(c, g, point, t, px, py, 'front');
  else if (g.pilot === 'luke') drawLukeIgnited(c, g, point, t);
  else if (g.pilot === 'mckeever') drawMckeeverHandoff(c, g, point, t);
  else if (g.pilot === 'bishop') drawBishopClose(c, g, point, t, px, py);
  else if (g.pilot === 'boelcke') drawBoelckeDicta(c, g, point, t);
}
