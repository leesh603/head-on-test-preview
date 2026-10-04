// Engagement markers in the HUD language (presentation only).
// One visual grammar for every "this enemy matters right now" cue:
//   corner brackets on the target + a small charcoal pill label above it.
//   tail  : bone brackets, progress ring fills; locked -> oxblood
//   headOn: amber brackets that close in, "HEAD-ON" pill (text only)
const FONT_FALLBACK = '"Noto Sans CJK KR","Noto Sans KR",Arial,sans-serif';
let fontFamily = null;
function family() {
  if (fontFamily) return fontFamily;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--astra-type').trim();
    fontFamily = v || FONT_FALLBACK;
  } catch { fontFamily = FONT_FALLBACK; }
  return fontFamily;
}

export const ENGAGEMENT_TONES = Object.freeze({
  bone: { line: '#e9e3d5', text: '#f5f2ea', fill: 'rgba(20,20,18,.82)', edge: 'rgba(232,226,212,.28)' },
  locked: { line: '#e0583f', text: '#fff1e8', fill: 'rgba(92,28,20,.9)', edge: 'rgba(255,170,150,.45)' },
  amber: { line: '#f0c24e', text: '#fff6dc', fill: 'rgba(58,44,12,.88)', edge: 'rgba(240,194,78,.5)' }
});

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
}

// Four L-shaped corners around (x, y). `gap` = half size of the box.
export function drawBrackets(c, x, y, gap, tone, width = 2, arm = 9) {
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  // soft dark underlay so the marks read on bright terrain and clouds
  for (const pass of [0, 1]) {
    c.strokeStyle = pass ? tone.line : 'rgba(12,12,10,.55)';
    c.lineWidth = pass ? width : width + 2.5;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const cx = x + sx * gap, cy = y + sy * gap;
      c.beginPath();
      c.moveTo(cx - sx * arm, cy); c.lineTo(cx, cy); c.lineTo(cx, cy - sy * arm);
      c.stroke();
    }
  }
  c.restore();
}

// Pill label centred at (x, y). Optional `icon(c, cx, cy, size, tone)` on the left,
// optional `progress` (0..1) drawn as a hairline under the text.
export function drawPill(c, x, y, text, tone, { icon = null, progress = null, alpha = 1 } = {}) {
  c.save();
  c.globalAlpha *= alpha;
  c.font = `700 11.5px ${family()}`;
  c.textBaseline = 'middle';
  const tw = c.measureText(text).width;
  const iconW = icon ? 24 : 0;
  const h = 22, padX = 10, w = Math.ceil(tw + padX * 2 + iconW);
  const left = Math.round(x - w / 2), top = Math.round(y - h / 2);
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 8; c.shadowOffsetY = 2;
  roundRect(c, left, top, w, h, h / 2);
  c.fillStyle = tone.fill; c.fill();
  c.shadowColor = 'transparent';
  c.lineWidth = 1; c.strokeStyle = tone.edge; c.stroke();
  if (icon) icon(c, left + padX + 8, y, 13, tone);
  c.fillStyle = tone.text; c.textAlign = 'left';
  c.fillText(text, left + padX + iconW, y + 0.5);
  if (progress != null) {
    const px = left + 9, pw = w - 18, py = top + h - 3.5;
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(px, py, pw, 1.5);
    c.fillStyle = tone.line; c.fillRect(px, py, pw * Math.max(0, Math.min(1, progress)), 1.5);
  }
  c.restore();
  return { w, h };
}

// Tail chase: progress ring + brackets on the target, pill above.
export function drawTailEngagement(c, x, y, progress, locked, label) {
  const tone = locked ? ENGAGEMENT_TONES.locked : ENGAGEMENT_TONES.bone;
  c.save();
  // track + progress ring
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(12,12,10,.45)'; c.lineWidth = 4.5;
  c.beginPath(); c.arc(x, y, 34, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = 'rgba(233,227,213,.22)'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, 34, 0, Math.PI * 2); c.stroke();
  if (progress > 0) {
    c.strokeStyle = tone.line; c.lineWidth = locked ? 3 : 2.2;
    c.beginPath(); c.arc(x, y, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress)); c.stroke();
  }
  c.restore();
  drawBrackets(c, x, y, 25, tone, locked ? 2.4 : 2);
  drawPill(c, x, y - 52, label, tone, { progress: locked ? null : progress });
}

// Head-on: amber brackets that snap inward during the cue, pill above.
export function drawHeadOnEngagement(c, x, y, label, age = 1, alpha = 1, onTarget = true) {
  const tone = ENGAGEMENT_TONES.amber;
  const k = Math.min(1, age / 0.16);
  const gap = 25 + (1 - k) * 14;
  if (onTarget) { c.save(); c.globalAlpha *= alpha; drawBrackets(c, x, y, gap, tone, 2.2); c.restore(); }
  drawPill(c, x, y - 52, label, tone, { alpha });
}
