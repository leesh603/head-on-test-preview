import {drawCombatSprite} from './combat-sprite-draw.js';
import {warmRaster} from './raster-warm.js';

// One shared decode for small-arms contact, combustion and water displacement.
const cell = 256;
const disabled = typeof location !== 'undefined' && new URLSearchParams(location.search).get('fx') === '0';
const atlas = !disabled && typeof Image !== 'undefined' ? new Image() : null;
let ready = false;
export const materialArtReady = !atlas ? Promise.resolve(false) : new Promise(resolve => {
  atlas.decoding = 'async';
  atlas.onload = async () => {
    // Decode while preparing the sortie. An image load alone does not rasterize
    // WebP, so drawing the first tiny tracer impact could block on this whole sheet.
    if (atlas.decode) await atlas.decode().catch(() => {});
    ready = atlas.naturalWidth === 4 * cell && atlas.naturalHeight === 6 * cell;
    atlas.onload = atlas.onerror = null;
    if (ready && typeof requestAnimationFrame === 'function') warmRaster(atlas);
    resolve(ready);
  };
  atlas.onerror = () => { atlas.onload = atlas.onerror = null; resolve(false); };
  atlas.src = new URL('./fx-combat-materials-v1.webp', import.meta.url).href;
});

export const materialAtlas = atlas;

export const materialRows = Object.freeze({linen: 0, metal: 1, air: 2, fuel: 3, powder: 4, water: 5});
const pivotX = [72, 72, 128, 48, 48, 128];

export function drawMaterialFrame(ctx, row, frame, x, y, width, height, angle, alpha) {
  if (!ready || !(alpha > 0 && width > 0 && height > 0)) return false;
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.globalAlpha *= Math.min(1, alpha);
  ctx.imageSmoothingEnabled = true;
  drawCombatSprite(ctx,'fx',atlas, frame * cell, row * cell, cell, cell,
    -pivotX[row] * width / cell, -height / 2, width, height);
  ctx.restore();
  return true;
}
