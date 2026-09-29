// HEAD-ON FX layer (painted atlas). ON by default on this branch; ?fxs=0 rolls
// back to the previous FX (?fx=0 still disables all sprite FX). Swaps the listed FX keys for the sample atlas in
// fx-sample/, adds tracer / rocket-trail / bomb-fall drawing hooks, and
// otherwise leaves every renderer untouched. Remove this file and the few
// `FXS` lines in fx-art.js / app.js to drop the preview.
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
  shipBow: 'shipBow3'
};
const rects = new Map();
let atlas = null;

export const fxsReady = !FXS || typeof Image === 'undefined' ? Promise.resolve(false) :
  fetch(new URL('./fx-sample/fx-sample.json', import.meta.url)).then(r => r.json()).then(m => new Promise(res => {
    const im = new Image();
    im.onload = () => { atlas = im; for (const [k, r] of Object.entries(m.rects)) rects.set(k, r); res(true); };
    im.onerror = () => res(false);
    im.src = new URL('./fx-sample/' + m.image + '?v=' + m.version, import.meta.url).href;
  })).catch(() => false);

const resolve = key => (rects.has(key) ? key : ALIAS[key]);
export function fxsHas(key) { return FXS && !!atlas && rects.has(resolve(key) || ''); }

export function fxsDraw(c, key, x, y, w, h = w, angle = 0, alpha = 1) {
  const r = rects.get(resolve(key));
  if (!r || !(w > 0) || !(h > 0)) return false;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle);
  c.globalAlpha *= Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  c.imageSmoothingEnabled = true;
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
  const ck = resolve(key) + color; if (tintCache.has(ck)) return tintCache.get(ck);
  const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
  const g = cv.getContext('2d'); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, cv.width, cv.height);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0);
  if (tintCache.size > 48) tintCache.clear();
  tintCache.set(ck, cv); return cv;
}
export function fxsTint(c, key, color, x, y, w, h = w, angle = 0, alpha = 1) {
  const cv = fxsTintedCanvas(key, color); if (!cv) return false;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle); c.globalAlpha *= alpha;
  c.drawImage(cv, -w / 2, -h / 2, w, h); c.restore(); return true;
}

// ---- hooks used by the preview edits -------------------------------------

// Machine-gun round: tinted glow + white-hot core, head at the bullet position.
export function fxsTracer(c, x, y, vx, vy, color, weight = 2) {
  if (!fxsHas('tracerCore')) return false;
  const a = Math.atan2(vy, vx), len = 14 + weight * 5, th = 4.5 + weight * 1.5;
  const cx = x - Math.cos(a) * len * 0.42, cy = y - Math.sin(a) * len * 0.42;
  fxsTint(c, 'tracerGlow', color, cx, cy, len * 1.1, th * 1.8, a, 0.45);
  fxsDraw(c, 'tracerCore', cx, cy, len, th, a, 1);
  return true;
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
