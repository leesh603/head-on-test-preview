import {drawRailTrack} from './rail-render129.js?v=gal1&smooth=20261115';
import {SPECIAL_OPERATION_RAIL_CAR_LENGTH, SPECIAL_OPERATION_SLOT, SPECIAL_OPERATION_RALLY, SPECIAL_OPERATION_REPAIR, SPECIAL_OPERATION_STRAFE, SPECIAL_OPERATION_PERISCOPE} from './special-operations.js?v=tension20261107';
import {dogfightSnapshot,drawDogfightOverlay} from './dogfight-operation.js';
import {barrageSnapshot,drawBarrageOverlay} from './barrage-operation.js';
import {drawRaceOverlay,raceSnapshot} from './race-operation.js';

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
 atlas = load('./operation-cargo-train-ink-20261115.webp');
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

// Operation labels are shaped once into a cached bitmap (stroke + fill, font set by
// drawOperationTargets) and blitted each frame; Korean text shaping per label per
// frame was a steady phone cost. Distances are rounded to 10 m so keys stay few.
const opLabelCache = new Map();
function opLabelBlit(ctx, text, x, y, color) {
 if (typeof ctx.getTransform !== 'function' || typeof ctx.drawImage !== 'function') { ctx.fillStyle = color; ctx.strokeText(text, x, y); ctx.fillText(text, x, y); return; }
 const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1, key = text + '\u0001' + color + '\u0001' + sc.toFixed(3);
 let e = opLabelCache.get(key);
 if (!e) {
  const doc = globalThis.document;
  if (!doc?.createElement) { ctx.fillStyle = color; ctx.strokeText(text, x, y); ctx.fillText(text, x, y); return; }
  const c = doc.createElement('canvas'), g = c.getContext('2d');
  if (!g) { ctx.fillStyle = color; ctx.strokeText(text, x, y); ctx.fillText(text, x, y); return; }
  g.font = ctx.font; const w = Math.ceil(g.measureText(text).width + 8), h = 22;
  c.width = Math.max(1, Math.ceil(w * sc)); c.height = Math.ceil(h * sc);
  g.setTransform(sc, 0, 0, sc, 0, 0); g.font = ctx.font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = ctx.lineWidth; g.strokeStyle = ctx.strokeStyle; g.fillStyle = color;
  g.strokeText(text, w / 2, h / 2); g.fillText(text, w / 2, h / 2);
  e = { c, w, h }; opLabelCache.set(key, e); if (opLabelCache.size > 64) opLabelCache.delete(opLabelCache.keys().next().value);
 }
 let dx = x - e.w / 2, dy = y - e.h / 2;
 if (!m.b && !m.c) { dx = (Math.round(dx * m.a + m.e) - m.e) / m.a; dy = (Math.round(dy * m.d + m.f) - m.f) / m.d; }
 ctx.drawImage(e.c, dx, dy, e.w, e.h);
}

// guideTop: lowest edge of the top HUD (canvas px), so mission guides never slide under the cards.
// guideBottom: height of the bottom control zone (canvas px); on touch screens it clears the
// action/maneuver buttons, matching drawEdgePointer in app.js.
// guideAvoid: DOM boxes over the field (canvas px, e.g. the kill-streak counter); a mission
// guide that would print over one drops below it.
export function drawOperationTargets(ctx, game, width, height, en = false, guideTop = 0, guideBottom = 105, guideAvoid = null) {
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
 // Prototype escort: the wing slot beside the prototype.
 if(battle?.id==='prototype'){
  const slot=battle.slot&&battle.testLeg<(battle.testRoute?.length||0)?{...battle.slot,inSlot:battle.inSlot}:battle.slotState;
  if(slot){const x=width/2+(slot.x-game.x)*zoom,y=height/2+(slot.y-game.y)*zoom;
   ctx.save();ctx.lineWidth=2.5*zoom;ctx.setLineDash(slot.inSlot?[]:[8*zoom,7*zoom]);ctx.strokeStyle=slot.inSlot?'#e8c35a':'rgba(219,236,194,.8)';
   ctx.beginPath();ctx.arc(x,y,SPECIAL_OPERATION_SLOT.radius*.55*zoom,0,Math.PI*2);ctx.stroke();ctx.restore();}
 }
 // Squadron rescue: a dwell arc around each aircraft being rallied, and the exit banner.
 if(battle?.id==='squadron'){
  for(const p of (game.patrols||[]))if(p.operationTarget&&p.rallyDwell>0&&!p.operationRallied&&p.hp>0){
   const x=width/2+(p.x-game.x)*zoom,y=height/2+(p.y-game.y)*zoom;
   ctx.save();ctx.lineWidth=4*zoom;ctx.strokeStyle='#dbecc2';ctx.beginPath();ctx.arc(x,y,40*zoom,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p.rallyDwell/SPECIAL_OPERATION_RALLY.dwell));ctx.stroke();ctx.restore();
  }
  const exit=battle.squadronExit;
  if(exit){prepareMapExitSignal();const x=width/2+(exit.x-game.x)*zoom,y=height/2+(exit.y-game.y)*zoom,w=150*zoom;
   if(exitSignal?.naturalWidth){ctx.save();ctx.drawImage(exitSignal,x-w/2,y-w*exitSignal.naturalHeight/exitSignal.naturalWidth/2,w,w*exitSignal.naturalHeight/exitSignal.naturalWidth);ctx.restore();}
  }
 }
 // Ace rescue: the restart ring and its progress around the damaged ace.
 if(battle?.id==='ace'){
  const ace=battle.patrols?.[0]||(game.patrols||[]).find(p=>p.operationTarget&&p.acePilot);
  const repair=battle.repair==null?battle.repairState:battle.repair<SPECIAL_OPERATION_REPAIR.time?{fraction:battle.repair/SPECIAL_OPERATION_REPAIR.time,blocked:!!battle.repairBlocked,repairing:!!battle.repairing}:null;
  if(ace&&repair){
   const x=width/2+(ace.x-game.x)*zoom,y=height/2+(ace.y-game.y)*zoom,r=SPECIAL_OPERATION_REPAIR.radius*zoom;
   ctx.save();ctx.lineWidth=2.5*zoom;ctx.setLineDash([10*zoom,8*zoom]);ctx.strokeStyle=repair.blocked?'rgba(217,72,59,.8)':'rgba(219,236,194,.75)';
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   ctx.lineWidth=5*zoom;ctx.strokeStyle=repair.blocked?'#d9483b':'#e8c35a';ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*repair.fraction);ctx.stroke();ctx.restore();
  }
 }
 // Train chase: the strafing lane along the rails and the flak car's blind spot.
 const train=battle?.train;
 if(train&&(train.cars?train.cars[0]?.hp>0||train.cars[1]?.hp>0:train.engine?.hp>0||train.flak?.hp>0)){
  const y=height/2+(train.y-game.y)*zoom,lane=SPECIAL_OPERATION_STRAFE.lane*zoom;
  ctx.save();ctx.lineWidth=2*zoom;ctx.setLineDash([14*zoom,10*zoom]);ctx.strokeStyle=train.strafing?'rgba(232,195,90,.85)':'rgba(219,236,194,.45)';
  for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,y+side*lane);ctx.lineTo(width,y+side*lane);ctx.stroke();}
  const flakAlive=train.cars?train.cars[1]?.hp>0:train.flak?.hp>0;
  if(flakAlive){const fx=width/2+(train.x-train.sign*SPECIAL_OPERATION_RAIL_CAR_LENGTH-game.x)*zoom;
   ctx.setLineDash([4*zoom,6*zoom]);ctx.strokeStyle='rgba(219,236,194,.7)';ctx.beginPath();ctx.arc(fx,y,SPECIAL_OPERATION_STRAFE.blind*zoom,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
 // Periscope hunt: the wake mark over a submerged U-boat and the marking arc.
 const hunt=battle?.naval?.hunt,sub=game.intrusionBoss;
 if(hunt&&sub?.encounterId===hunt.id&&sub.phase==='active'&&['diving','submerged'].includes(sub.naval?.phase)){
  const x=width/2+(sub.x-game.x)*zoom,y=height/2+(sub.y-game.y)*zoom,r=SPECIAL_OPERATION_PERISCOPE.markRadius*zoom,t=game.t||0;
  ctx.save();ctx.lineWidth=2*zoom;ctx.setLineDash([6*zoom,8*zoom]);ctx.strokeStyle=hunt.over?'rgba(232,195,90,.85)':'rgba(219,236,194,.55)';
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='rgba(240,248,255,.9)';ctx.lineWidth=2.5*zoom;const a=sub.a||0,k=10+Math.sin(t*6)*2;
  for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(a+side*.45)*k*2.4*zoom,y-Math.sin(a+side*.45)*k*2.4*zoom);ctx.stroke();}
  if(hunt.mark>0){ctx.lineWidth=5*zoom;ctx.strokeStyle='#e8c35a';ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,hunt.mark/SPECIAL_OPERATION_PERISCOPE.markTime));ctx.stroke();}
  ctx.restore();
 }
 const duel=battle?.dogfight?(battle.ace?dogfightSnapshot(battle):battle.dogfight):null;
 const run=battle?.barrage?(battle.barrage.shells?barrageSnapshot(battle):battle.barrage):null;
 const race=battle?.race?(battle.race.lastFrame!==undefined||battle.race.rivalSpeed?raceSnapshot(battle):battle.race):null;
 if(race)drawRaceOverlay(ctx,race,(x,y)=>({x:width/2+(x-game.x)*zoom,y:height/2+(y-game.y)*zoom}),zoom,game.players?.find(p=>p.hp>0)||game);
 if(run)drawBarrageOverlay(ctx,run,(x,y)=>({x:width/2+(x-game.x)*zoom,y:height/2+(y-game.y)*zoom}),zoom);
 if(duel)drawDogfightOverlay(ctx,duel,(x,y)=>({x:width/2+(x-game.x)*zoom,y:height/2+(y-game.y)*zoom}),zoom,game.players?.find(p=>p.hp>0)||game);
 const encounter=mission?.status==='active'?game.stageBoss?.stages?.encounter:null;
 let hardware;
 if(encounter?.bossId==='hms-zubian'){
  hardware=[];
  for(const b of encounter.bodies?.values?.()||[])for(const p of b.parts?.values?.()||[]){
   if(!p.destroyed&&/gun|mortar|engine/i.test(p.kind+' '+p.id))
    hardware.push({x:width/2+(b.x+p.x-game.x)*zoom,y:height/2+(b.y+p.y-game.y)*zoom,r:24*zoom});
  }
  }else if(encounter?.bossId==='naval10-black-flight'){
  hardware=[];
  for(const e of game.enemies||[])if(e.encounterId===encounter.id&&e.bossMinion&&e.hp>0)
   hardware.push({x:width/2+(e.x-game.x)*zoom,y:height/2+(e.y-game.y)*zoom,r:24*zoom});
 }
 function label(entity, text, color, guide = false, missionGuide = false) {
  let x = width / 2 + (entity.x - game.x) * zoom, y = height / 2 + (entity.y - game.y) * zoom;
  const exit = missionGuide && entity.kind === 'exit';
  if (!exit) y -= 25;
  const side=missionGuide?Math.min(width/2,Math.max(68,ctx.measureText(text).width/2+16)):50,top=missionGuide?Math.max(Math.min(155,height*.22),guideTop):42,bottom=height-(missionGuide?guideBottom:42);
  if (x < side || x > width - side || y < top || y > bottom) {
   if (!guide) return;
   const horizontal = x < side ? '‹ ' : x > width - side ? ' ›' : '';
   text = horizontal === '‹ ' ? horizontal + text : text + (horizontal || (y < top ? ' ↑' : ' ↓'));
   x = Math.max(side, Math.min(width - side, x));
   y = Math.max(top, Math.min(bottom, y));
  } else if (exit) y = Math.max(top, y - Math.max(25, 66*zoom));
  if(missionGuide&&guideAvoid?.length){
   const half=ctx.measureText(text).width*.5+3;
   for(const a of guideAvoid)if(x+half>a.l&&x-half<a.r&&y+11>a.t&&y-11<a.b)y=Math.min(bottom,a.b+12);
  }
  if(missionGuide){
   const direction=y>height/2?-1:1;
   if(hardware?.length){
    const half=ctx.measureText(text).width*.5+3;
    const clearText=row=>!guidePositions.some(p=>Math.abs(p.x-x)<half+p.half&&Math.abs(p.y-row)<19);
    const clearMount=row=>!hardware.some(p=>Math.abs(x-p.x)<half+p.r&&Math.abs(row-p.y)<p.r+9);
    const anchor=y,steps=Math.ceil((bottom-top)/21);
    let fallback;
    for(let i=0;i<=steps*2;i++){
     const row=anchor+Math.ceil(i/2)*21*(i%2?direction:-direction);
     if(row<top||row>bottom||!clearText(row))continue;
     fallback??=row;
     if(clearMount(row)){fallback=row;break;}
    }
    y=fallback??anchor;
   }else for(let i=0;i<6&&guidePositions.some(p=>Math.abs(p.x-x)<side*2&&Math.abs(p.y-y)<18);i++)y=Math.max(top,Math.min(bottom,y+direction*20));
   guidePositions.push({x,y,half:side-12});
  }
  opLabelBlit(ctx, text, x, y, color);
 }
 const friendly = '#dbecc2', danger = '#ffc19d';
 if(mission?.status==='active'&&mission.region===game.stageBoss?.stages.stageIndex)for(const point of (mission.guides||[]).slice(0,6)){
  const distance=Math.round(Math.hypot(point.x-game.x,point.y-game.y)/10)*10;
  label(point,(point.label?.[en?1:0]||'')+' · '+distance+'m',point.kind==='exit'?'#ffe6a8':point.kind==='ally'?friendly:danger,true,true);
 }
 if(!battle){ctx.restore();return;}
 if(battle.naval){
  const afloat=battle.naval.ships.filter(ship=>ship.hp>0);
  for(const [i,ship] of afloat.entries()){
   const name=battle.naval.escort?ship.name:(en?'Transport '+(i+1):ship.name);
   label(ship,name+' · '+Math.ceil(100*ship.hp/ship.maxHp)+'%',friendly,i===0,true);
  }
 }
 const patrols = (game.patrols || []).filter(patrol => patrol.operationTarget && patrol.hp > 0 && patrol.life !== 0);
 let nearest;
 for (const patrol of patrols) {
  if (patrol.operationRallied) continue;
  if (!nearest || Math.hypot(patrol.x-game.x, patrol.y-game.y) < Math.hypot(nearest.x-game.x, nearest.y-game.y)) nearest = patrol;
 }
 for (const patrol of patrols) {
  if (patrol.raceRival) {label(patrol, en ? 'Rival' : '라이벌', danger);continue;}
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
  else if (enemy.operationAce && !enemy.dogfightAce) label(enemy, en ? 'Pursuit ace' : '추격 에이스', danger);
  else if (enemy.operationRailCar === 'flak') {
   label(enemy, enemy.operationFlakAiming ? (en ? 'Flak aiming' : '대공포 조준') : (en ? 'Flak car' : '대공 화차'), danger);
  } else if (enemy.operationRailCar === 'engine') label(enemy, en ? 'Engine' : '기관차', danger);
  else if (enemy.operationRailCar === 'cargo') label(enemy, en ? 'Secure intact' : '보존 · 확보', friendly);
 }
 ctx.restore();
}
