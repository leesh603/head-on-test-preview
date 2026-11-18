import {drawMaterialFrame, materialRows} from './combat-material-art.js';

// The puncture, crown, collapsing rim and foam are painted at the same world pivot.
export function drawWaterContact(c, x, y, diameter, progress, angle = 0, alpha = 1) {
  if (!(progress >= 0 && progress < 1)) return false;
  const frame = progress < .10 ? 0 : progress < .34 ? 1 : progress < .63 ? 2 : 3;
  const spread = diameter * (.78 + .22 * progress);
  const fade = Math.min(1, (1 - progress) / .28);
  return drawMaterialFrame(c, materialRows.water, frame, x, y, spread, spread, angle, alpha * fade);
}
