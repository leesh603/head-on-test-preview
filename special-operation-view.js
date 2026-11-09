import {REGIONAL_ART} from './regional-boss-art-data352.js?v=tame3';
import {drawRailTrack} from './rail-render129.js?v=gal1';

const load = file => {
 if (typeof Image === 'undefined') return null;
 const image = new Image();
 image.src = new URL(file, import.meta.url).href;
 return image;
};
let atlas, track;
const frames = REGIONAL_ART['boss-fliegerzug-parts352'];

export function drawSpecialOperationTrain(ctx, game, width, height) {
 const train = game?.operationBattle?.train || game?.operationSnapshot?.battle?.train;
 if (!train) return;
 atlas ??= load('./boss-fliegerzug-parts352.webp');
 track ??= load('./boss-bruno-train115.webp');
 if (!atlas?.naturalWidth) return;
 const zoom = game.mode === 'coop2' ? game.camera?.zoom || 1 : 1;
 const start = train.originX, sign = train.sign;
 ctx.save();
 ctx.translate(width / 2, height / 2);
 ctx.scale(zoom, zoom);
 ctx.translate(-game.x, -game.y);
 drawRailTrack(ctx, {from:{x:start,y:train.y},axis:{x:sign,y:0},railTarget:{x:start+sign*8800,y:train.y}}, track);
 const cars = train.cars || [train.engine, train.flak, train.cargo].map(car => car && ({hp:car.hp, maxHp:car.maxHp}));
 for (const [slot, part] of ['loco', 'flak', 'hangar'].entries()) {
  const car = cars[slot], x = train.x - sign * slot * 110;
  if (!car || Math.abs(x-game.x)>width / zoom / 2 + 110) continue;
  const damaged = car.hp <= 0;
  const frame = frames[part + (damaged ? '-wreck' : '-normal')];
  ctx.save();
  ctx.translate(x, train.y);
  ctx.rotate(Math.PI / 2 * sign);
  ctx.filter=slot===2&&!damaged?'sepia(.25) saturate(.68)':'none';
  ctx.drawImage(atlas,...frame,-27,-53,54,106);
  ctx.restore();
 }
 ctx.restore();
}

export function drawOperationTargets(ctx, game, width, height, en = false) {
 const battle = game?.operationBattle || game?.operationSnapshot?.battle;
 if (!battle) return;
 const zoom = game.mode === 'coop2' ? game.camera?.zoom || 1 : 1;
 ctx.save();
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.font = '600 11px system-ui, sans-serif';
 ctx.lineWidth = 3;
 ctx.strokeStyle = 'rgba(20,17,13,.85)';
 function label(entity, text, color, guide = false) {
  let x = width / 2 + (entity.x - game.x) * zoom, y = height / 2 + (entity.y - game.y) * zoom - 25;
  if (x < 50 || x > width - 50 || y < 42 || y > height - 42) {
   if (!guide) return;
   const horizontal = x < 50 ? '‹ ' : x > width - 50 ? ' ›' : '';
   text = horizontal === '‹ ' ? horizontal + text : text + (horizontal || (y < 42 ? ' ↑' : ' ↓'));
   x = Math.max(50, Math.min(width - 50, x));
   y = Math.max(42, Math.min(height - 42, y));
  }
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
 }
 const friendly = '#dbecc2', danger = '#ffc19d';
 const patrols = (game.patrols || []).filter(patrol => patrol.operationTarget && patrol.hp > 0 && patrol.life !== 0);
 let nearest;
 for (const patrol of patrols) {
  if (patrol.operationRallied) continue;
  if (!nearest || Math.hypot(patrol.x-game.x, patrol.y-game.y) < Math.hypot(nearest.x-game.x, nearest.y-game.y)) nearest = patrol;
 }
 for (const patrol of patrols) {
  if (battle.id === 'squadron') {
   const status = patrol.operationRallied ? (en ? 'Rallied' : '합류') : (en ? 'Rendezvous' : '접근');
   label(patrol, (patrol.slot + 1) + ' · ' + status, patrol.operationRallied ? friendly : '#ffe6a8', patrol === nearest);
  } else {
   label(patrol, battle.id === 'ace' ? (en ? 'Rescue ace' : '구출 대상') : (en ? 'Prototype' : '시험기'), friendly, true);
   if (patrol.operationCheckpoint) label(patrol.operationCheckpoint, en ? 'Test gate' : '검문점', '#ffe6a8');
  }
 }
 for (const enemy of game.enemies || []) {
  if (enemy.hp <= 0 || enemy.expired) continue;
  if (enemy.operationDemolition) label(enemy, en ? 'Demolition crew' : '폭파조', danger);
  else if (enemy.operationAce) label(enemy, en ? 'Pursuit ace' : '추격 에이스', danger);
  else if (enemy.operationRailCar === 'flak') {
   label(enemy, enemy.operationFlakAiming ? (en ? 'Flak aiming' : '대공포 조준') : (en ? 'Flak car' : '대공 화차'), danger);
  } else if (enemy.operationRailCar === 'engine') label(enemy, en ? 'Engine' : '기관차', danger);
  else if (enemy.operationRailCar === 'cargo') label(enemy, en ? 'Secure intact' : '보존 · 확보', friendly);
 }
 ctx.restore();
}
