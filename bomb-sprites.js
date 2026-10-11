// Faction-split WWI bomb sprites: Cooper-pattern (Entente/player ordnance) and
// PuW-pattern (Central/enemy bombers). Hand-painted drafts stay in the asset bank;
// cells are 128px webp with the nose pointing right, matching the 'bomb' atlas key.
const FILES = { cooper: 'bomb-cooper.webp', puw: 'bomb-puw.webp', hales: 'bomb-hales.webp' };
// Slender variants draw wider so every faction's bomb keeps the same on-screen thickness.
const SIZE_K = { cooper: 1.3, puw: 2.6, hales: 1.55 };
const IMGS = new Map();
function img(v) {
  let im = IMGS.get(v);
  if (im === undefined) {
    if (typeof Image === 'undefined') return null;
    im = new Image(); im.decoding = 'async';
    im.src = new URL('./' + FILES[v] + '?v=bomb8', import.meta.url).href;
    IMGS.set(v, im);
  }
  return im;
}
if (typeof Image !== 'undefined') for (const v in FILES) img(v); // eager load alongside the FX atlas
export function bombSprite(c, v, x, y, w, angle = 0, alpha = 1) {
  const im = img(v);
  if (!im || !im.complete || !(im.naturalWidth > 0)) return false;
  w *= SIZE_K[v] || 1;
  const h = w * im.naturalHeight / im.naturalWidth;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle);
  c.globalAlpha *= Math.max(0, Math.min(1, alpha)); c.imageSmoothingEnabled = true;
  try { c.filter = 'brightness(1.22) saturate(1.05)'; } catch (_) {}
  c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); return true;
}
