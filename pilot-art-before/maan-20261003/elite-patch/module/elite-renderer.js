import {ELITE_KINDS} from './elite-config.js';

const defaultCrop = {};

function loadImage(source) {
  if (!source) return null;
  if (typeof Image !== 'undefined' && typeof source === 'string') {
    const image = new Image(); image.src = source; return image;
  }
  return source;
}

export function createEliteAssets(options = {}) {
  return {
    lePrieur: loadImage(options.lePrieur || './assets/le-prieur-squadron.webp'),
    schlachtstaffel: loadImage(options.schlachtstaffel || './assets/halberstadt-cliv-squadron.webp'),
    rocket: loadImage(options.rocket),
    crop: {...defaultCrop, ...(options.crop || {})},
    drawPlayerRocket: options.drawPlayerRocket || null
  };
}

function drawAircraft(ctx, image, crop, x, y, angle, size, flash = false) {
  if (!image?.complete && image?.naturalWidth === 0) return false;
  const iw = crop?.sw || image.naturalWidth || image.width;
  const ih = crop?.sh || image.naturalHeight || image.height;
  if (!iw || !ih) return false;
  const h = size, w = h * iw / ih;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
  ctx.imageSmoothingEnabled = false;
  if (flash) ctx.filter = 'brightness(1.85) sepia(.25)';
  if (crop) ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -w / 2, -h / 2, w, h);
  else ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

function drawFallbackSilhouette(ctx, member, x, y) {
  // Emergency-only diagnostic mark. Production integration should fail the
  // asset preflight before gameplay instead of displaying this branch.
  ctx.save(); ctx.translate(x, y); ctx.rotate(member.a + Math.PI / 2);
  ctx.fillStyle = member.eliteKind === ELITE_KINDS.SCHLACHTSTAFFEL ? '#7d765f' : '#9cae83';
  ctx.fillRect(-4, -20, 8, 40); ctx.fillRect(-22, -4, 44, 8); ctx.restore();
}

function drawHostileRocket(ctx, projectile, x, y, assets) {
  const angle = Math.atan2(projectile.vy, projectile.vx);
  ctx.save();
  ctx.strokeStyle = '#ff4c24'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - Math.cos(angle) * 13, y - Math.sin(angle) * 13); ctx.lineTo(x - Math.cos(angle) * 34, y - Math.sin(angle) * 34); ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  if (assets.drawPlayerRocket) {
    ctx.filter = 'sepia(1) saturate(7) hue-rotate(325deg) brightness(1.12)';
    assets.drawPlayerRocket(ctx, x, y, angle + Math.PI / 2, 42);
  } else if (assets.rocket?.complete || assets.rocket?.naturalWidth) {
    ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2); ctx.filter = 'sepia(1) saturate(7) hue-rotate(325deg) brightness(1.12)';
    ctx.drawImage(assets.rocket, -9, -21, 18, 42);
  }
  ctx.restore();
}

export function renderEliteLayer(ctx, system, camera, assets, time = 0) {
  if (!ctx || !system) return;
  const point = camera?.point || ((x, y) => [x - (camera?.x || 0), y - (camera?.y || 0)]);
  for (const member of system.members) {
    const [x, y] = point(member.x, member.y);
    const isHeavy = member.eliteKind === ELITE_KINDS.SCHLACHTSTAFFEL;
    const image = isHeavy ? assets.schlachtstaffel : assets.lePrieur;
    const crop = assets.crop?.[member.eliteKind];
    const drawn = drawAircraft(ctx, image, crop, x, y, member.a, isHeavy ? 86 : 66, member.hitFlash > 0);
    if (!drawn) drawFallbackSilhouette(ctx, member, x, y);
    if (member.telegraph > 0) {
      const pulse = .55 + Math.sin(time * 18) * .2;
      ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(member.gunAim) * 150, y + Math.sin(member.gunAim) * 150); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 27 + member.telegraph * 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const hp = Math.max(0, member.hp / member.maxHp);
    ctx.fillStyle = '#20241e'; ctx.fillRect(x - 22, y - 34, 44, 3);
    ctx.fillStyle = isHeavy ? '#d8b26c' : '#df8c67'; ctx.fillRect(x - 22, y - 34, 44 * hp, 3);
  }
  for (const projectile of system.projectiles) {
    const [x, y] = point(projectile.x, projectile.y);
    if (projectile.kind === 'eliteRocket') drawHostileRocket(ctx, projectile, x, y, assets);
    else {
      const rear = projectile.kind === 'eliteRearTracer';
      ctx.strokeStyle = rear ? '#ff6f55' : '#ffb04d'; ctx.lineWidth = rear ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - projectile.vx * .025, y - projectile.vy * .025); ctx.stroke();
    }
  }
}

export function assertEliteAssetsReady(assets) {
  const missing = [];
  if (!assets?.lePrieur?.naturalWidth && !assets?.lePrieur?.width) missing.push('le-prieur-squadron.webp');
  if (!assets?.schlachtstaffel?.naturalWidth && !assets?.schlachtstaffel?.width) missing.push('halberstadt-cliv-squadron.webp');
  if (missing.length) throw new Error(`Elite patch assets unavailable: ${missing.join(', ')}`);
  return true;
}
