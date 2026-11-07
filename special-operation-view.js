import {REGIONAL_ART} from './regional-boss-art-data352.js?v=09c75d146ae4289d';
import {drawRailTrack} from './rail-render129.js?v=09c75d146ae4289d';

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
