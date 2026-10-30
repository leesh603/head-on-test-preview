import {drawEnemyProjectile} from '../../projectiles.js?v=pilotfx20261018';
import {ELITE_KINDS} from './elite-config.js';

const defaultCrop = {};

function loadImage(source) {
  if (!source) return null;
  if (typeof Image !== 'undefined' && typeof source === 'string') {
    const image = new Image();
    let retries = 0;
    image.onerror = () => {
      // Recover transient/stale error responses without retaining a broken sprite.
      const retry = ++retries;
      setTimeout(() => { image.src = source + (source.includes('?') ? '&' : '?') + 'eliteRetry=' + retry; }, Math.min(10000, 500 * 2 ** Math.min(retry - 1, 5)));
    };
    image.src = source; return image;
  }
  return source;
}

export function createEliteAssets(options = {}) {
  const assets = {
    lePrieur: loadImage(options.lePrieur || './assets/le-prieur-squadron.webp'),
    schlachtstaffel: loadImage(options.schlachtstaffel || './assets/halberstadt-cliv-squadron.webp'),
    junkers: loadImage(options.junkers || './assets/junkers-j1-squadron.webp'),
    salamander: loadImage(options.salamander || './assets/salamander-squadron.webp'),
    rocket: loadImage(options.rocket),
    crop: {...defaultCrop, ...(options.crop || {})},
    drawPlayerRocket: options.drawPlayerRocket || null,
    get ready() { return [this.lePrieur, this.schlachtstaffel, this.junkers, this.salamander].every(image => image?.complete && image.naturalWidth > 0); }
  };
  return assets;
}

function drawAircraft(ctx, image, crop, x, y, angle, size, flash = false) {
  if (!image?.complete || !image.naturalWidth) return false;
  const iw = crop?.sw || image.naturalWidth || image.width;
  const ih = crop?.sh || image.naturalHeight || image.height;
  if (!iw || !ih) return false;
  const h = size, w = h * iw / ih;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (flash) ctx.filter = 'brightness(1.85) sepia(.25)';
  if (crop) ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -w / 2, -h / 2, w, h);
  else ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

export function renderEliteLayer(ctx, system, camera, assets, time = 0) {
  if (!ctx || !system) return;
  const point = camera?.point || ((x, y) => [x - (camera?.x || 0), y - (camera?.y || 0)]);
  for (const member of system.members) {
    const [x, y] = point(member.x, member.y);
    const kind = member.eliteKind;
    const isHeavy = kind === ELITE_KINDS.SCHLACHTSTAFFEL;
    const image = kind === ELITE_KINDS.JUNKERS ? assets.junkers : kind === ELITE_KINDS.SALAMANDER ? assets.salamander : isHeavy ? assets.schlachtstaffel : assets.lePrieur;
    const size = kind === ELITE_KINDS.JUNKERS ? 86 : kind === ELITE_KINDS.SALAMANDER ? 74 : isHeavy ? 86 : 66;
    const crop = assets.crop?.[kind];
    const drawn = drawAircraft(ctx, image, crop, x, y, member.a, size, member.hitFlash > 0);
    if (!drawn) continue;
    if (member.telegraph > 0) {
      const pulse = .55 + Math.sin(time * 18) * .2;
      ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(member.gunAim) * 150, y + Math.sin(member.gunAim) * 150); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 27 + member.telegraph * 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const barY = y - size / 2 - 9;
    const hp = Math.max(0, member.hp / member.maxHp);
    ctx.fillStyle = '#20241e'; ctx.fillRect(x - 22, barY, 44, 3);
    ctx.fillStyle = kind === ELITE_KINDS.JUNKERS ? '#c9d4dc' : isHeavy || kind === ELITE_KINDS.SALAMANDER ? '#d8b26c' : '#df8c67'; ctx.fillRect(x - 22, barY, 44 * hp, 3);
    if (member.formationCommand) {
      const cy = barY - 8, r = 4.6;
      ctx.fillStyle = '#e8c26a';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 ? r * .45 : r, ang = -Math.PI / 2 + i * Math.PI / 5;
        ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(20,14,6,.75)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fill();
    }
  }
  for (const projectile of system.projectiles) {
    const [x, y] = point(projectile.x, projectile.y);
    drawEnemyProjectile(ctx,projectile,x,y,time);
  }
}

