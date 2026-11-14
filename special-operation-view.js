import {drawRailTrack} from './rail-render129.js?v=rail-exit-icon-c8bbf960-20261111';
import {operationBattleProgress,operationMissionCard} from './special-operation-combat.js?v=earned-rewards-7ccfad1b-20261114';
import {SPECIAL_OPERATIONS, SPECIAL_OPERATION_LIMIT, SPECIAL_OPERATION_WAVES, SPECIAL_OPERATION_EXIT_AT, SPECIAL_OPERATION_TRAIN_ESCAPE, SPECIAL_OPERATION_CARGO_HOLD, SPECIAL_OPERATION_RAIL_CAR_LENGTH} from './special-operations.js?v=arras-cargo-icons-4529781a-20261112';

const englishTitles = {prototype: 'Prototype escort', cargo: 'Secret cargo raid', squadron: 'Squadron rescue', ace: 'Ace rescue'};
const seconds = (remaining, en) => Math.max(0, Math.ceil(remaining)) + (en ? 's' : '초');

export function operationHudModel(progress, en) {
 const {id, elapsed, wave, hp, threats, routeComplete, exitProgress, train} = progress;
 const engineActive = train?.cars[0]?.hp > 0;
 const deadline = engineActive ? SPECIAL_OPERATION_TRAIN_ESCAPE : SPECIAL_OPERATION_LIMIT;
 const title = (en ? englishTitles[id] : SPECIAL_OPERATIONS[id].title) + ' · ' + seconds(deadline - elapsed, en);
 const health = (en ? (train ? 'Cargo ' : 'Escort ') : (train ? '화물 ' : '호위기 ')) + hp + '%';
 if (train) {
  const car = (index, label) => label + ' ' + (train.cars[index]?.hp > 0
   ? Math.ceil(100 * train.cars[index].hp / train.cars[index].maxHp) + '%' : (en ? 'down' : '격파'));
  const detail = [car(0, en ? 'Engine' : '기관차'), car(1, en ? 'Flak' : '대공차'), health].join(' · ');
  const secured = Math.min(SPECIAL_OPERATION_CARGO_HOLD, Math.floor(train.secured || 0));
  const hint = engineActive || train.cars[1]?.hp > 0
   ? (en ? 'Disable the engine and flak. Spare the cargo.' : '기관차와 대공차를 공격하고 화물차는 보존')
   : (train.inRange ? (en ? 'Securing ' : '화물 확보 중 ') : (en ? 'Approach cargo · ' : '화물차에 접근 · ')) +
     secured + '/' + seconds(SPECIAL_OPERATION_CARGO_HOLD, en);
  return {title, detail, hint, hp};
 }
 const detail = health + ' · ' + (en ? 'Pursuers ' : '추격기 ') + (threats ?? 0) + (en ? '' : '기') +
  ' · ' + (en ? 'Wave ' : '공세 ') + wave + '/' + SPECIAL_OPERATION_WAVES.length;
 const hint = routeComplete ? (en ? 'Escort clear · defeat remaining pursuers' : '호위기 이탈 완료 · 남은 추격기 격퇴')
  : elapsed < SPECIAL_OPERATION_EXIT_AT
   ? (en ? 'Escape run in ' : '이탈 시작까지 ') + seconds(SPECIAL_OPERATION_EXIT_AT - elapsed, en)
   : (en ? 'Escape route ' : '이탈 진행 ') + Math.floor(100 * (exitProgress || 0)) + '%';
 return {title, detail, hint, hp};
}

export function updateOperationHud(game, locale) {
 const slot = document.getElementById('stageBossHud');
 const battle = game && !['lost', 'won', 'operation-result'].includes(game.state)
  ? game.operationBattle || game.operationSnapshot?.battle : null;
 const progress = game?.operationBattle && battle ? operationBattleProgress(battle) : battle;
 if (!progress && slot.dataset.operationHud) {
  delete slot.dataset.operationHud;
  slot.setAttribute('aria-label', locale === 'en' ? 'Regional boss health' : '지역 보스 내구도');
 }
 if (!progress) return false;
 const model = operationHudModel(progress, locale === 'en');
 const card = operationMissionCard(game, locale === 'en');
 if (card) {model.detail = card.meta;model.hint = card.objective;}
 if (!slot.dataset.operationHud) {
  slot.dataset.operationHud = 'true';
  slot.querySelectorAll('.gate-tick').forEach(node => node.remove());
  delete document.getElementById('stageBossHp').parentElement.dataset.gateEnc;
 }
 slot.classList.remove('hidden', 'gate-armored');
 const bar = document.getElementById('stageBossHp');
 bar.style.width = model.hp + '%';
 slot.setAttribute('aria-valuenow', String(model.hp));
 slot.setAttribute('aria-valuemax', '100');
 slot.setAttribute('aria-label', progress.id === 'squadron'
  ? (locale === 'en' ? 'Squadron survival' : '편대 생존율')
  : (locale === 'en' ? 'Protected target health' : '보호 대상 내구도'));
 document.getElementById('stageBossTitle').textContent = model.title;
 document.getElementById('stageBossParts').textContent = model.detail;
 let hint = document.getElementById('stageBossTactic');
 if (!hint) {
  hint = document.createElement('small');
  hint.id = 'stageBossTactic';
  slot.append(hint);
 }
 hint.textContent = model.hint;
 document.body.classList.add('stageboss-playing');
 return true;
}

const load = file => {
 if (typeof Image === 'undefined') return null;
 const image = new Image();
 image.decoding = 'async';
 image.src = new URL(file, import.meta.url).href;
 return image;
};
let atlas, track, trainReady;
const CAR_FRAME_WIDTH = 330, CAR_FRAME_HEIGHT = 114;
const exitSignalUrl = new URL('./mission-exit-signal.webp', import.meta.url).href;
let exitSignal;
const missionView = game => game?.online&&!game.host?game.mapMissionSnapshot:game?.mapMission;

export function prepareMapExitSignal() {
 if (!exitSignal && typeof Image !== 'undefined') {
  exitSignal = new Image();
  exitSignal.decoding = 'async';
  exitSignal.src = exitSignalUrl;
 }
}

export function drawMapExitSignals(ctx, game, view) {
 const mission = missionView(game);
 if (!mission || mission.region !== game.stageBoss?.stages.stageIndex) return;
 if (mission.exitSignal) drawSignal(mission.exitSignal);
 if (mission.status === 'active') for (const point of mission.guides || []) {
  if (point.kind === 'exit') drawSignal(point);
 }
 function drawSignal(point) {
  const width = 172;
  if (Math.abs(point.x-view.x)>view.width/2+width/2 || Math.abs(point.y-view.y)>view.height/2+width/2) return;
  prepareMapExitSignal();
  if (!exitSignal?.naturalWidth) return;
  const height = width*exitSignal.naturalHeight/exitSignal.naturalWidth;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(exitSignal,point.x-width/2,point.y-height/2,width,height);
  ctx.restore();
 }
}

export function prepareSpecialOperationTrain() {
 if (trainReady || typeof Image === 'undefined') return trainReady;
 atlas = load('./operation-cargo-train.webp');
 track = load('./boss-bruno-train115.webp');
 return trainReady = Promise.all([atlas,track].map(image=>image.decode?.().catch(()=>{})));
}

export function drawSpecialOperationTrain(ctx, game, width, height) {
 const train = game?.operationBattle?.train || game?.operationSnapshot?.battle?.train;
 if (!train) return;
 prepareSpecialOperationTrain();
 const zoom = game.mode === 'coop2' ? game.camera?.zoom || 1 : 1;
 const start = train.originX, sign = train.sign;
 ctx.save();
 ctx.translate(width / 2, height / 2);
 ctx.scale(zoom, zoom);
 ctx.translate(-game.x, -game.y);
 ctx.save();
 ctx.translate(0,train.y);
 ctx.scale(1,.5);
 drawRailTrack(ctx, {from:{x:start,y:0},axis:{x:sign,y:0},railTarget:{x:start+sign*8800,y:0}}, track);
 ctx.restore();
 const cars = train.cars || [train.engine, train.flak, train.cargo].map(car => car && ({hp:car.hp, maxHp:car.maxHp}));
 if (atlas?.naturalWidth) for (const [slot,car] of cars.entries()) {
  const length = SPECIAL_OPERATION_RAIL_CAR_LENGTH;
  const x = train.x - sign * slot * length;
  if (!car || Math.abs(x-game.x)>width / zoom / 2 + length) continue;
  const damaged = car.hp <= 0;
  ctx.save();
  ctx.translate(x, train.y);
  if(sign<0)ctx.rotate(Math.PI);
  ctx.imageSmoothingEnabled=true;
  const height = length * CAR_FRAME_HEIGHT / CAR_FRAME_WIDTH;
  ctx.drawImage(atlas,slot*CAR_FRAME_WIDTH,damaged?CAR_FRAME_HEIGHT:0,CAR_FRAME_WIDTH,CAR_FRAME_HEIGHT,-length/2,-height/2,length,height);
  ctx.restore();
 }
 ctx.restore();
}

// guideTop: lowest edge of the top HUD (canvas px), so mission guides never slide under the cards.
export function drawOperationTargets(ctx, game, width, height, en = false, guideTop = 0) {
 const battle = game?.operationBattle || game?.operationSnapshot?.battle;
 const mission=missionView(game);
 if (!battle&&!mission) return;
 const zoom = game.mode === 'coop2' ? game.camera?.zoom || 1 : 1;
 ctx.save();
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.font = '600 11px system-ui, sans-serif';
 ctx.lineWidth = 3;
 ctx.strokeStyle = 'rgba(20,17,13,.85)';
 const guidePositions=[];
 function label(entity, text, color, guide = false, missionGuide = false) {
  let x = width / 2 + (entity.x - game.x) * zoom, y = height / 2 + (entity.y - game.y) * zoom;
  const exit = missionGuide && entity.kind === 'exit';
  if (!exit) y -= 25;
  const side=missionGuide?Math.min(width/2,Math.max(68,ctx.measureText(text).width/2+16)):50,top=missionGuide?Math.max(Math.min(155,height*.22),guideTop):42,bottom=height-(missionGuide?105:42);
  if (x < side || x > width - side || y < top || y > bottom) {
   if (!guide) return;
   const horizontal = x < side ? '‹ ' : x > width - side ? ' ›' : '';
   text = horizontal === '‹ ' ? horizontal + text : text + (horizontal || (y < top ? ' ↑' : ' ↓'));
   x = Math.max(side, Math.min(width - side, x));
   y = Math.max(top, Math.min(bottom, y));
  } else if (exit) y = Math.max(top, y - Math.max(25, 66*zoom));
  if(missionGuide){const direction=y>height/2?-1:1;for(let i=0;i<6&&guidePositions.some(p=>Math.abs(p.x-x)<side*2&&Math.abs(p.y-y)<18);i++)y=Math.max(top,Math.min(bottom,y+direction*20));guidePositions.push({x,y});}
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
 }
 const friendly = '#dbecc2', danger = '#ffc19d';
 if(mission?.status==='active'&&mission.region===game.stageBoss?.stages.stageIndex)for(const point of (mission.guides||[]).slice(0,6)){
  const distance=Math.round(Math.hypot(point.x-game.x,point.y-game.y)/10)*10;
  label(point,(point.label?.[en?1:0]||'')+' · '+distance+'m',point.kind==='exit'?'#ffe6a8':point.kind==='ally'?friendly:danger,true,true);
 }
 if(!battle){ctx.restore();return;}
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
