// HEAD-ON FX layer (painted atlas). ON by default on this branch; ?fxs=0 rolls
// back to the previous FX (?fx=0 still disables all sprite FX). Swaps the listed FX keys for the sample atlas in
// fx-sample/, adds tracer / rocket-trail / bomb-fall drawing hooks, and
// otherwise leaves every renderer untouched. Remove this file and the few
// `FXS` lines in fx-art.js / app.js?v=perf1 to drop the preview.
const params = typeof location === 'undefined' ? null : new URLSearchParams(location.search);
export const FXS = params?.get('fxs') !== '0' && params?.get('fx') !== '0';

// Engine keys that resolve to a sample cell (aliases follow fx-role3's families).
const ALIAS = {
  explosion0: 'airblast0', explosion1: 'airblast1', explosion2: 'airblast2', explosion3: 'airblast3',
  bombfx0: 'mortarImpact0', bombfx1: 'mortarImpact1', bombfx2: 'mortarImpact2', bombfx3: 'mortarImpact3',
  explosionDust0: 'mortarImpact0', explosionDust1: 'mortarImpact1', explosionDust2: 'mortarImpact2', explosionDust3: 'mortarImpact3',
  smokeOil: 'smokeDark', engineSmoke: 'smokeGray', gunSmoke: 'smokePuff', wreckSmoke: 'smokeHeavy',
  smokeWisp: 'mistPuff', explosionSmoke: 'smokeHeavy', armorSpark: 'spark', fire: 'fireGround',
  fireSmall: 'fireEngine', ricochet: 'spark',
  shellBurst0: 'cowImpact0', shellBurst1: 'cowImpact1', shellBurst2: 'cowImpact2', shellBurst3: 'cowImpact3',
  explosionHot0: 'cowImpact0', explosionHot1: 'cowImpact1', explosionHot2: 'cowImpact2', explosionHot3: 'cowImpact3',
  explosionOily0: 'bossBlast0', explosionOily1: 'bossBlast1', explosionOily2: 'bossBlast2', explosionOily3: 'bossBlast3',
  fire0: 'fireGround', fire1: 'fireGround', fire2: 'fireGround', fire3: 'fireGround',
  splashTiny: 'navalSplash3', splashShell: 'navalSplash3', waterColumn: 'navalSplash3', foamRing: 'navalFoam3',
  smokeDust: 'dustPuff', dirtMix: 'dustPuff', wreckGust: 'shockRing',
  tracerOrange: 'tracerEnemy', tracerCream: 'tracerCore', tracerAmber: 'tracerCore', tracerViolet: 'tracerCore',
  gas: 'gasCloud2', gasSmall: 'gasCloud0', gasThin: 'gasCloud3', mist: 'mistPuff', gunSmokeThin: 'smokePuff',
  muzzlePistol: 'muzzle', debris: 'debrisShard',
  mineBlast0: 'navalSplash3', mineBlast1: 'navalSplash3', mineBlast2: 'navalFoam3', mineBlast3: 'navalFoam3',
  shipBow: 'shipBow3',
  bomb: 'bombBody', grenade: 'grenadeBody', mine: 'mineBody', shell: 'shellHeavy'
};
const rects = new Map();
const contain = new Set();
let atlas = null;

export const fxsReady = !FXS || typeof Image === 'undefined' ? Promise.resolve(false) :
  fetch(new URL('./fx-sample/fx-sample.json', import.meta.url), { cache: 'no-cache' }).then(r => r.json()).then(m => new Promise(res => {
    const im = new Image();
    im.onload = () => { atlas = im; for (const [k, r] of Object.entries(m.rects)) rects.set(k, r); for (const k of m.contain || []) contain.add(k); res(true); };
    im.onerror = () => res(false);
    im.src = new URL('./fx-sample/' + m.image + '?v=' + m.version, import.meta.url).href;
  })).catch(() => false);

const resolve = key => (rects.has(key) ? key : ALIAS[key]);
export function fxsHas(key) { return FXS && !!atlas && rects.has(resolve(key) || ''); }

export function fxsDraw(c, key, x, y, w, h = w, angle = 0, alpha = 1) {
  const k = resolve(key), r = rects.get(k);
  if (!r || !(w > 0) || !(h > 0)) return false;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle);
  c.globalAlpha *= Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  c.imageSmoothingEnabled = true;
  if (contain.has(k)) { const f = Math.min(w / r[2], h / r[3]); w = r[2] * f; h = r[3] * f; }
  c.drawImage(atlas, r[0], r[1], r[2], r[3], -w / 2, -h / 2, w, h);
  c.restore(); return true;
}

const cellCache = new Map();
export function fxsImage(key) {
  const k = resolve(key), r = rects.get(k);
  if (!r || typeof document === 'undefined') return null;
  if (cellCache.has(k)) return cellCache.get(k);
  const cv = document.createElement('canvas'); cv.width = r[2]; cv.height = r[3];
  cv.getContext('2d').drawImage(atlas, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  Object.defineProperties(cv, { naturalWidth: { value: r[2] }, naturalHeight: { value: r[3] } });
  cellCache.set(k, cv); return cv;
}

const tintCache = new Map();
export function fxsTintedCanvas(key, color) {
  const src = fxsImage(key); if (!src) return null;
  const ck = resolve(key) + color; if (tintCache.has(ck)) { const cached=tintCache.get(ck); tintCache.delete(ck); tintCache.set(ck,cached); return cached; }
  const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
  const g = cv.getContext('2d'); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, cv.width, cv.height);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0);
  // Evict one cold tint instead of discarding all hot canvases at once.
  if (tintCache.size >= 48) tintCache.delete(tintCache.keys().next().value);
  tintCache.set(ck, cv); return cv;
}
export function fxsTint(c, key, color, x, y, w, h = w, angle = 0, alpha = 1) {
  const cv = fxsTintedCanvas(key, color); if (!cv) return false;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle); c.globalAlpha *= alpha;
  if (contain.has(resolve(key))) { const f = Math.min(w / cv.width, h / cv.height); w = cv.width * f; h = cv.height * f; }
  c.drawImage(cv, -w / 2, -h / 2, w, h); c.restore(); return true;
}

// ---- hooks used by the preview edits -------------------------------------

// Machine-gun round: tinted glow + white-hot core, head at the bullet position.
export function fxsTracer(c, x, y, vx, vy, color, weight = 2) {
  if (!fxsHas('tracerCore')) return false;
  const a = Math.atan2(vy, vx), len = 14 + weight * 5, th = 4.5 + weight * 1.5;
  const cx = x - Math.cos(a) * len * 0.42, cy = y - Math.sin(a) * len * 0.42;
  fxsTint(c, 'tracerGlow', color, cx, cy, len * 1.1, th * 1.8, a, 0.45);
  // core follows the heat colour too (lighter), so the upgrade ramp reads on the round itself
  fxsTint(c, 'tracerCore', lighten(color, 0.45), cx, cy, len, th, a, 1);
  return true;
}
function lighten(hex, k) {
  const n = parseInt(hex.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}

// Rocket: smoke ribbon + exhaust behind the body (called before the body is drawn).
export function fxsRocketTrail(c, x, y, angle, bodyLen = 52) {
  if (!fxsHas('rocketTrail')) return false;
  const back = (d) => [x - Math.cos(angle) * d, y - Math.sin(angle) * d];
  const [tx, ty] = back(bodyLen * 0.5 + 60);
  fxsDraw(c, 'rocketTrail', tx, ty, 132, 26, angle, 0.9);
  const [fx_, fy] = back(bodyLen * 0.5 + 12);
  const flick = 0.85 + 0.15 * Math.sin(performance.now() * 0.05 + x);
  fxsDraw(c, 'rocketFlame', fx_, fy, 34 * flick, 12, angle, 1);
  return true;
}

// Bomb fall: shrinking body over a growing ground shadow, both on the aim point.
export function fxsBombFall(c, drawBody, sx, sy, tx, ty, p) {
  if (!fxsHas('bombShadow')) return false;
  const e = p * p; // accelerating fall
  const x = sx + (tx - sx) * p, y = sy + (ty - sy) * p;
  // shadow sharpens and grows as the bomb nears the ground
  fxsDraw(c, 'bombShadow', tx + 10 * (1 - e), ty + 14 * (1 - e), 22 + 18 * e, 11 + 9 * e, 0, 0.35 + 0.55 * e);
  // body shrinks with altitude read from the top-down camera
  const s = 1.55 - 0.75 * e;
  c.save(); c.globalAlpha *= 0.98;
  drawBody(x, y, s, Math.atan2(ty - sy, tx - sx) + p * 0.6);
  c.restore();
  // aim ring tightens
  c.save(); c.strokeStyle = 'rgba(245,230,200,.55)'; c.lineWidth = 1.2; c.setLineDash([3, 4]);
  c.beginPath(); c.arc(tx, ty, 28 - 12 * e, 0, Math.PI * 2); c.stroke(); c.restore();
  return true;
}

// Volumetric explosion flipbooks (tools/fx-sample/boom.py → fx-sample/fx-boom.webp).
// 20-frame sequences per family, cross-faded so the fireball grows and cools
// continuously instead of stepping through four stills. Mine / naval blasts keep
// their existing art on purpose.
const BOOM = { atlas: null, rects: null, n: 20 };
if (FXS && typeof Image !== 'undefined') {
  fetch(new URL('./fx-sample/fx-boom.json', import.meta.url), { cache: 'no-cache' }).then(r => r.json()).then(m => {
    const im = new Image();
    im.onload = () => { BOOM.atlas = im; BOOM.rects = m.rects; BOOM.n = m.frames; };
    im.src = new URL('./fx-sample/' + m.image + '?v=' + m.version, import.meta.url).href;
  }).catch(() => {});
}
// Each blast is timed in real seconds, not in the engine's short lifetime:
// fireball frames 0-7 play over `fire` s, the smoke frames stretch over the rest
// and keep rising / thinning after the engine drops the combatFX entry.
// Purely visual; engine timings, damage and radii are untouched.
const BOOM_FAMILY = {
  cow: ['hit', 2.6, 170], moteur: ['hit', 2.5, 160], lePrieur: ['hit', 2.3, 150], cannon: ['hit', 2.6, 130], pop: ['hit', 2.8, 120], charge: ['hit', 2.8, 180],
  bomb: ['ground', 2.8, 280], mortar: ['ground', 2.9, 290], shell: ['ground', 2.6, 240], structure: ['ground', 2.6, 310], 'carpet-bomb': ['ground', 2.8, 280],
  'zubian-mortar': ['ground', 2.8, 280], 'minenwerfer-heavy': ['ground', 2.8, 290], 'minenwerfer-shell': ['ground', 2.6, 250],
  bossFinal: ['heavy', 3.1, 400], hydrogen: ['heavy', 3.2, 400], aircraftHeavy: ['heavy', 3.2, 320],
  aircraft: ['air', 3.8, 230], aircraftMedium: ['air', 3.6, 240], blast: ['air', 2.9, 210]
};
//            fire s, total s, fragments, debris, ring, light, scorch
const BOOM_TIME = {
  hit:    [.16, .75, 0, 0, 0, .5, 0],
  air:    [.26, 1.35, 4, 0, 0, .75, 0],
  ground: [.30, 1.7, 0, 7, 1, .8, 1],
  heavy:  [.42, 2.1, 6, 5, 1, .7, 0]
};
const BOOM_TAIL = new Map();
let PUFF = null, GLOW = null, SCORCH = null;
function boomSprites() {
  if (PUFF || typeof document === 'undefined') return;
  const mk = (stops) => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return k; };
  PUFF = mk([[0, 'rgba(92,86,80,.55)'], [.55, 'rgba(84,78,72,.28)'], [1, 'rgba(80,74,68,0)']]);
  SCORCH = mk([[0, 'rgba(28,20,14,.78)'], [.55, 'rgba(34,26,18,.5)'], [1, 'rgba(40,30,20,0)']]);
  GLOW = mk([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,150,60,.55)'], [.6, 'rgba(230,90,30,.16)'], [1, 'rgba(200,60,20,0)']]);
}
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
function drawBoom(c, r, x, y, age) {
  const [fire, T, nFrag, nDeb, ring, light, scorch] = BOOM_TIME[r.fam], d0 = r.d, n = BOOM.n;
  if (age >= T) return false;
  const s = age / T, fade = r.fam === 'hit' || r.fam === 'air' ? 1 : Math.min(1, (1 - s) / .4);
  // frame index: 0..7 over the fireball, 7..n-1 over the remaining time (ease-out so smoke lingers)
  const fp = age < fire ? 7 * Math.pow(age / fire, .85) : 7 + (n - 8) * (1 - Math.pow(1 - (age - fire) / (T - fire), 1.6));
  const i = Math.min(n - 1, Math.floor(fp)), u = fp - i, grow = .9 + .32 * Math.min(1, age / (T * .7));
  const d = d0 * grow, rise = age > fire ? (age - fire) * d0 * .09 : 0, wind = age * d0 * .03;
  c.save(); c.translate(x, y);
  if (scorch) { c.globalAlpha = .38 * Math.min(1, age / .12) * Math.min(1, (T - age) / .6); c.globalCompositeOperation = 'multiply';
    c.drawImage(PUFF, -d0 * .34, -d0 * .3, d0 * .68, d0 * .6); c.globalCompositeOperation = 'source-over'; }
  if (light && age < fire * 1.3) { const a = Math.pow(1 - age / (fire * 1.3), 1.4) * light, R = d0 * (.9 + age / fire * .5);
    c.globalCompositeOperation = 'screen'; c.globalAlpha = a * .5; c.drawImage(GLOW, -R, -R, R * 2, R * 2); c.globalCompositeOperation = 'source-over'; }
  if (ring && age > .02 && age < .34) { const q = (age - .02) / .32, R = d0 * (.22 + q * .62);
    c.globalAlpha = (1 - q) * .42; c.strokeStyle = r.fam === 'ground' ? '#e2d4b4' : '#fff2da'; c.lineWidth = Math.max(1.5, d0 * .03 * (1 - q));
    c.beginPath(); c.ellipse(0, 0, R, R * .96, 0, 0, Math.PI * 2); c.stroke(); }
  // dirt clods (ground) / flaming wreckage (air, heavy): arcing, trailing smoke
  const frag = (k, flame) => { const life = flame ? .8 : .7;
    if (age > life) return;
    // Fragment seeds/directions are fixed for this explosion, not this frame.
    const fragments=r.fragments||(r.fragments=[]),id=k*2+(flame?1:0);
    let f=fragments[id];if(!f){const a=hash(r.wx+k*3.1,r.wy-k*1.7)*Math.PI*2,v=d0*(flame?1.25:1.0)*(.6+hash(k,r.wx)*.7);f=fragments[id]=[Math.cos(a)*v,Math.sin(a)*v];}
 const P = (t) => { const e = 1 - Math.exp(-3.2 * t); return [f[0] * e / 3.2 * 2.2, f[1] * e / 3.2 * 2.2 - (flame ? 0 : d0 * .5 * t * (1 - t / life) * 1.6)]; };
    for (let j = 7; j >= 1; j--) { const ts = age - j * .045; if (ts < 0) continue; const [px, py] = P(ts), sz = d0 * (flame ? .08 : .07) * (1 + (age - ts) * 3.5); if (flame && px * px + py * py < d0 * d0 * .12) continue;
      c.globalAlpha = (1 - j / 8) * (1 - age / life) * (flame ? .95 : .55); c.drawImage(PUFF, px - sz, py - sz - (age - ts) * d0 * .05, sz * 2, sz * 2); }
    const [px, py] = P(age), f1 = 1 - age / life;
    if (flame) { if (px * px + py * py > d0 * d0 * .1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = f1 * .85; const g = d0 * .045 * (.6 + f1 * .6); c.drawImage(GLOW, px - g, py - g, g * 2, g * 2); c.globalCompositeOperation = 'source-over'; } }
    else { const [qx, qy] = P(Math.max(0, age - .05)); c.globalAlpha = Math.min(1, f1 * 2) * .7; c.strokeStyle = '#3a2d22'; c.lineCap = 'round'; c.lineWidth = Math.max(1.4, d0 * .011);
      c.beginPath(); c.moveTo(qx, qy); c.lineTo(px, py); c.stroke(); } };
  for (let k = 0; k < nDeb; k++) frag(k, false);
  // flipbook
  c.save(); c.translate(wind, -rise); c.rotate(r.rot + age * .05); c.imageSmoothingEnabled = true;
  const thin = age > fire ? 1 - .38 * Math.min(1, (age - fire) / (T * .5)) : 1;
  const draw = (j, a) => { const rc = BOOM.rects[r.fam + Math.min(n - 1, j)]; if (!rc || a <= 0) return; c.globalAlpha = a * fade * thin; c.drawImage(BOOM.atlas, rc[0], rc[1], rc[2], rc[3], -d / 2, -d / 2, d, d); };
  draw(i, 1); if (i < n - 1) draw(i + 1, u);
  c.restore();
  for (let k = 0; k < nFrag; k++) frag(k + 11, true); // trails skip the core so the fireball stays clean
  c.restore(); return true;
}
export function fxsBoomTail(c, list, toScreen, t) {
  if (!FXS || !BOOM.atlas || !BOOM_TAIL.size) return;
  const live = new Set(list || []);
  for (const [f, r] of BOOM_TAIL) {
    if (r.end == null) { if (live.has(f) && f.life > 0) continue; r.end = t; }
    const age = r.ml + (t - r.end);
    if (!(t >= r.end) || r.end - t > 1) { BOOM_TAIL.delete(f); continue; }
    const [x, y] = toScreen(r.wx, r.wy);
    if (!drawBoom(c, r, x, y, age)) BOOM_TAIL.delete(f);
  }
}
export function fxsBoom(c, f, x, y, radius = 0) {
  if (!FXS || !BOOM.atlas) return false;
  const src = f.fxSource || f.kind || (f.killExplosion ? 'aircraft' : ''), spec = BOOM_FAMILY[src];
  if (!spec) return false;
  boomSprites();
  const [fam, k, cap] = spec, rr = radius || f.radius || 60;
  let r = BOOM_TAIL.get(f);
  if (!r) { r = { wx: f.x, wy: f.y, fam, d: Math.min(cap, Math.max(48, rr * k)), rot: (hash(f.x, f.y) - .5) * .5, ml: f.maxLife || .65 };
    if (BOOM_TAIL.size < 96) BOOM_TAIL.set(f, r); }
  const age = Math.max(0, Math.min(1, 1 - f.life / f.maxLife)) * r.ml;
  drawBoom(c, r, x, y, age);
  return true;
}

// Burning ground (hydrogen balloon fire, wreck fires): a scatter of looping flame tongues
// (tools/fx-sample/flame.py) over a scorched, fire-lit patch, with smoke and embers rising.
// Zone radius / life / damage stay in the engine; this only replaces the single painted blob.
const FLAME = { atlas: null, rects: null, n: 12, v: 3 };
if (FXS && typeof Image !== 'undefined') {
  fetch(new URL('./fx-sample/fx-flame.json', import.meta.url), { cache: 'no-cache' }).then(r => r.json()).then(m => {
    const im = new Image();
    im.onload = () => { FLAME.atlas = im; FLAME.rects = m.rects; FLAME.n = m.frames; FLAME.v = m.variants; };
    im.src = new URL('./fx-sample/' + m.image + '?v=' + m.version, import.meta.url).href;
  }).catch(() => {});
}
let ZONE_T = -1, ZONE_N = 0; // per-frame budget: only the first few fire zones get smoke / cross-fades
export function fxsFireZone(c, f, x, y, t = 0, fade = 1, under = null) {
  if (!FXS || !FLAME.atlas) return false;
  boomSprites();
  if (t !== ZONE_T) { ZONE_T = t; ZONE_N = 0; }
  const rich = ZONE_N++ < 3;
  const R = f.radius || 100, seed = f.seed || Math.abs(Math.trunc((f.x || 0) * 31 + (f.y || 0) * 17)) % 997;
  const left = f.maxLife ? Math.min(1, f.life / Math.min(2.5, f.maxLife)) : 1; // flames die down over the last seconds
  const flick = .9 + .1 * Math.sin(t * 9.1 + seed) * Math.sin(t * 5.3);
  c.save();
  // scorched ground + firelight
  c.globalAlpha = .75 * fade;
  c.drawImage(SCORCH, x - R * .85, y - R * .7, R * 1.7, R * 1.4);
  c.globalCompositeOperation = 'screen'; c.globalAlpha = .85 * fade * flick * (.4 + .6 * left);
  c.drawImage(GLOW, x - R * .85, y - R * .75, R * 1.7, R * 1.5);
  c.globalCompositeOperation = 'source-over';
  if (under) { c.save(); under(); c.restore(); }
  // flames, back to front
  const n = Math.max(5, Math.min(12, Math.round(R / 14))), list = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + seed * .7, rr = Math.sqrt((i + .5) / n) * R * .56 * (.85 + .3 * hash(seed, i));
    list.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * .8, h: R * (.66 + .44 * hash(i, seed)) * (1 - .4 * rr / R), v: (seed + i) % FLAME.v, ph: hash(i * 7, seed) });
  }
  list.sort((p, q) => p.y - q.y);
  for (const p of list) {
    const h = p.h * (.25 + .75 * left) * (.94 + .06 * flick), w = h * 64 / 96;
    const fp = (t * 13 + p.ph * FLAME.n) % FLAME.n, i = Math.floor(fp), u = fp - i;
    const draw = (j, al) => { const rc = FLAME.rects['flame' + p.v + '_' + (j % FLAME.n)]; if (!rc || al <= 0) return;
      c.globalAlpha = al * fade; c.drawImage(FLAME.atlas, rc[0], rc[1], rc[2], rc[3], p.x - w / 2, p.y - h * .92, w, h); };
    draw(i, 1); if (rich) draw(i + 1, u);
  }
  // smoke plume leaning downwind + embers drifting up (looping, seeded)
  if (rich) for (let k = 0; k < 2; k++) {                       // two light puffs, not a column
    const per = 3.4, q = ((t + k * per / 2 + hash(k, seed) * per * .15) % per) / per, ox = (hash(seed, k + 3) - .5) * R * .5;
    const sz = R * (.45 + q * .6);
    fxsDraw(c, 'smokeHeavy', x + ox + q * R * .5, y - R * .25 - q * R * .7, sz, sz, k + q * .6, fade * .5 * Math.sin(Math.min(1, q * 2.5) * Math.PI * .5) * (1 - q) * (.3 + .7 * left));
  }
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < (rich ? 6 : 3); k++) {
    const per = 1.3, q = ((t + hash(k, seed + 1) * per) % per) / per, ox = (hash(seed + 2, k) - .5) * R * 1.1;
    const g = 3 + 3 * hash(k, 9); c.globalAlpha = fade * left * (1 - q) * .8;
    c.drawImage(GLOW, x + ox + Math.sin(q * 6 + k) * 6 - g, y - q * R * .9 - g, g * 2, g * 2);
  }
  c.restore();
  return true;
}

// Flamethrower dressing for the Livens projector (drawn in the beam's local frame: x along the jet).
// Wraps the baked flame field with: a white-hot nozzle bloom, a soft additive heat halo instead of
// the hard clip edge, a rolling fireball head at the front, burning fuel droplets thrown ahead,
// and oily black smoke boiling off the outer edges and the head and rising downwind.
export function fxsFlameDressing(c, h, span, halfAt, frame) {
  if (!FXS || typeof document === 'undefined') return false;
  boomSprites(); if (!GLOW) return false;
  const { front, tail, t } = span, L = front - tail; if (L <= 0) return false;
  const seed = (h.id ? String(h.id).length * 13 : 7) + (h.bossId ? String(h.bossId).length : 0);
  c.save(); c.translate(h.x, h.y); c.rotate(h.angle);
  // soft heat halo: the flame field again, wider and additive, so edges glow instead of cutting off
  if (frame) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .16;
    c.beginPath(); const n = 24;
    for (let i = 0; i <= n; i++) { const d = tail + L * i / n; c.lineTo(d, -halfAt(d) * 1.45 - 4); }
    for (let i = n; i >= 0; i--) { const d = tail + L * i / n; c.lineTo(d, halfAt(d) * 1.45 + 4); }
    c.closePath(); c.clip(); c.drawImage(frame, 0, -h.thickness * 3.6, h.length, h.thickness * 7.2); c.restore();
  }
  c.globalCompositeOperation = 'lighter';
  // nozzle bloom
  if (tail < 8) { const r = h.thickness * 1.6 * (.9 + .15 * Math.sin(t * 40));
    c.globalAlpha = .9; c.drawImage(GLOW, -r * .4, -r, r * 2, r * 2); }
  // rolling fireball head while the jet is still travelling / at full reach
  const hw = Math.max(10, halfAt(Math.max(tail, front - 30)) || h.thickness);
  c.globalCompositeOperation = 'source-over';
  if (BOOM.atlas) for (let i = 0; i < 4; i++) {                 // rolling fireballs: painted explosion frames tumbling at the head
    const ph = (t * 2.2 + i / 4) % 1, fi = 2 + Math.floor(ph * 5), rc = BOOM.rects['air' + fi]; if (!rc) continue;
    const r = hw * (1.5 + .9 * ph) * (.85 + .3 * hash(i, seed)), x = front - hw * .9 + ph * hw * 1.4, y = (hash(i, seed + 2) - .5) * hw * 1.1;
    c.save(); c.translate(x, y); c.rotate(i * 1.7 + t * 2); c.globalAlpha = .8 * (1 - ph * .7) * Math.min(1, L / 80);
    c.drawImage(BOOM.atlas, rc[0], rc[1], rc[2], rc[3], -r, -r, r * 2, r * 2); c.restore();
  }
  c.globalCompositeOperation = 'lighter';
  // burning droplets thrown ahead of / off the jet
  for (let i = 0; i < 18; i++) {
    const q = ((t * 1.9 + hash(i, seed + 3)) % 1), d = tail + L * (.35 + .65 * hash(i, seed)) + q * 70, side = (hash(seed, i) - .5) * 2;
    if (d > front + 60) continue;
    const y = side * (halfAt(Math.min(front, d)) || hw) * (.6 + q * .7) + q * q * 18, e = 3.2 * (1 - q) + 1;
    c.globalAlpha = (1 - q) * .9; c.drawImage(GLOW, d - e, y - e, e * 2, e * 2);
  }
  c.globalCompositeOperation = 'source-over';
  // oily smoke boiling off the edges and the head (drawn last so it veils the outer flame)
  const puffs = Math.min(14, 4 + Math.floor(L / 40));
  for (let i = 0; i < puffs; i++) {
    const q = ((t * .9 + i / puffs + hash(i, seed + 7) * .3) % 1), along = tail + L * (.25 + .75 * hash(i, seed + 1));
    const side = i % 2 ? 1 : -1, hwi = halfAt(Math.min(front, along)) || hw;
    const x = along + q * 40, y = side * (hwi * .85 + q * 46), sz = (22 + hwi) * (.6 + q * 1.1);
    fxsDraw(c, i % 3 ? 'smokeDark' : 'smokeHeavy', x, y, sz * 1.4, sz * 1.4, i + q, .85 * Math.sin(Math.PI * Math.min(1, q * 1.3)) * Math.min(1, L / 120));
  }
  for (let i = 0; i < 3; i++) {                                   // thick smoke cap rolling off the head
    const q = ((t * 1.2 + i / 3) % 1), sz = hw * (2 + q * 2.2);
    fxsDraw(c, 'smokeHeavy', front + hw * .6 + q * 40, (hash(i, seed) - .5) * hw * 1.4, sz, sz, i + q, .7 * Math.sin(Math.PI * Math.min(1, q * 1.4)));
  }
  c.restore();
  return true;
}
