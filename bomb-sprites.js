// Faction-split WWI bomb sprites: Cooper-pattern (Entente/player ordnance) and
// PuW-pattern (Central/enemy bombers). Hand-painted drafts stay in the asset bank;
// originals point nose-right, matching the 'bomb' atlas key.
const FILES = { cooper: 'bomb-cooper.webp', puw: 'bomb-puw.webp', hales: 'bomb-hales.webp' };
// Match other ordnance in length, while preserving each bomb's own proportions.
const BOX_W = 0.7; // call w=52 -> 36px long before altitude/pitch scaling
const IMGS = new Map();
function img(v) {
  let im = IMGS.get(v);
  if (im === undefined) {
    if (typeof Image === 'undefined') return null;
    im = new Image(); im.decoding = 'async';
    // Bake the small, muted flight sprite once. No full-size decode sampling or
    // canvas colour filter per bomb/frame; keep the detailed bank originals intact.
    im.onload = () => {
      if (typeof document === 'undefined') return;
      const sprite = document.createElement('canvas');
      sprite.width = 160; sprite.height = Math.max(1, Math.round(160 * im.naturalHeight / im.naturalWidth));
      const g = sprite.getContext('2d'); if (!g) return;
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.filter = 'saturate(0.82) brightness(0.98)';
      g.drawImage(im, 0, 0, sprite.width, sprite.height);
      IMGS.set(v, sprite);
    };
    im.src = new URL('./' + FILES[v] + '?v=bomb20', import.meta.url).href;
    IMGS.set(v, im);
  }
  return im;
}
if (typeof Image !== 'undefined') for (const v in FILES) img(v); // eager load alongside the FX atlas
export function bombSprite(c, v, x, y, w, angle = 0, alpha = 1, pitch = 1) {
  if (!FILES[v] || !(w > 0)) return false;
  const im = img(v);
  const iw = im?.naturalWidth || im?.width, ih = im?.naturalHeight || im?.height;
  if (!im || ('complete' in im && !im.complete) || !(iw > 0) || !(ih > 0)) return false;
  const length = w * BOX_W, dw = length * pitch, dh = length * ih / iw;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle);
  c.globalAlpha *= Math.max(0, Math.min(1, alpha)); c.imageSmoothingEnabled = true;
  c.drawImage(im, -dw / 2, -dh / 2, dw, dh); c.restore(); return true;
}

// Top-down projection: follow the release-to-impact bearing, never screen-down.
// Pitch is shown by gentle foreshortening, not a sideways wobble or random spin.
export function bombFallPose(sx, sy, tx, ty, progress, releaseAngle = Math.PI / 2, out = {}) {
  const p = Math.max(0, Math.min(1, progress)), fall = p * p;
  const dx = tx - sx, dy = ty - sy;
  out.x = sx + dx * p; out.y = sy + dy * p;
  out.angle = dx * dx + dy * dy > 1 ? Math.atan2(dy, dx) : releaseAngle;
  out.scale = 1.05 - 0.37 * fall; out.pitch = 1 - 0.28 * fall;
  return out;
}
