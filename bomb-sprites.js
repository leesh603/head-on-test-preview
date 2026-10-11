// Faction-split WWI bomb sprites: Cooper-pattern (Entente/player ordnance) and
// PuW-pattern (Central/enemy bombers). Hand-painted drafts stay in the asset bank;
// cells are 128px webp with the nose pointing right, matching the 'bomb' atlas key.
const FILES = { cooper: 'bomb-cooper.webp', puw: 'bomb-puw.webp', hales: 'bomb-hales.webp' };
// Every variant draws into the same short-and-chubby box so on-screen size is uniform.
const BOX_W = 1.5, BOX_H = 0.58; // call w=52 -> ~78x30px
const IMGS = new Map();
function img(v) {
  let im = IMGS.get(v);
  if (im === undefined) {
    if (typeof Image === 'undefined') return null;
    im = new Image(); im.decoding = 'async';
    im.src = new URL('./' + FILES[v] + '?v=bomb11', import.meta.url).href;
    IMGS.set(v, im);
  }
  return im;
}
if (typeof Image !== 'undefined') for (const v in FILES) img(v); // eager load alongside the FX atlas
export function bombSprite(c, v, x, y, w, angle = 0, alpha = 1) {
  const im = img(v);
  if (!im || !im.complete || !(im.naturalWidth > 0)) return false;
  const dw = w * BOX_W, dh = w * BOX_H;
  c.save(); c.translate(x, y); if (angle) c.rotate(angle);
  c.globalAlpha *= Math.max(0, Math.min(1, alpha)); c.imageSmoothingEnabled = true;
  try { c.filter = 'brightness(1.22) saturate(1.05)'; } catch (_) {}
  c.drawImage(im, -dw / 2, -dh / 2, dw, dh); c.restore(); return true;
}
