// Faction-split WWI bomb sprites: Cooper-pattern (Entente/player ordnance) and
// PuW-pattern (Central/enemy bombers). Hand-painted drafts stay in the asset bank;
// cells are 128px webp with the nose pointing right, matching the 'bomb' atlas key.
const FILES = { cooper: 'bomb-cooper.webp', puw: 'bomb-puw.webp', hales: 'bomb-hales.webp' };
const IMGS = new Map();
function img(v) {
  let im = IMGS.get(v);
  if (im === undefined) {
    if (typeof Image === 'undefined') return null;
    im = new Image(); im.decoding = 'async';
    im.src = new URL('./' + FILES[v] + '?v=bomb5', import.meta.url).href;
    IMGS.set(v, im);
  }
  return im;
}
if (typeof Image !== 'undefined') for (const v in FILES) img(v); // eager load alongside the FX atlas
export function bombSprite(c, v, x, y, w, angle = 0, alpha = 1) {
  const im = img(v);
  if (!im || !im.complete || !(im.naturalWidth > 0)) return false;
  const h = w * im.naturalHeight / im.naturalWidth;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle);
  c.globalAlpha *= Math.max(0, Math.min(1, alpha)); c.imageSmoothingEnabled = true;
  c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); return true;
}
