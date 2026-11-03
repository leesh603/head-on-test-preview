import {ParisGeschuetz} from './laon-gun.js';

export const LAON_STAGE=19;
export const LAON_MISSION=Object.freeze({seconds:180,shots:3,approach:900});
const players=g=>g.players||[g];
const paused=g=>g.state!=='playing'||!!g.pendingLevelUps?.length||g.online&&g.host===false;
const firstBody=g=>g.stageBoss?.stages.encounter?.bodies.values().next().value;
const live=e=>e.hp>0&&!e.expired&&!e.crashing&&!e.crashed;
export function clearLaonBattle(g){
 const b=g.laonBattle;if(b?.gun&&b.role==='defend')b.gun.dispose?.();
 g.laonBattle=null;
}
// The position is chosen once, at map entry. Neither discovery nor the camera
// changes it; the strategic gun is already loading while the pilot approaches.
export function ensureLaonBattle(g){
 const addon=g.stageBoss;if(addon?.stages.stageIndex!==LAON_STAGE){if(g.laonBattle)clearLaonBattle(g);return null;}
 if(g.laonBattle)return g.laonBattle;
 if(g.online&&g.host===false)return null;
 const role=addon.stages.teamFaction==='central'?'defend':'attack';
 const existing=addon.stages.encounter?.bossId===addon.stages.bossId?firstBody(g):null;
 const origin=existing?{x:existing.x,y:existing.y}:{x:g.x,y:g.y-LAON_MISSION.approach};
 const b=g.laonBattle={role,origin,elapsed:0,remaining:LAON_MISSION.seconds,shotCount:0,discovered:false,result:null,resolved:false,success:false,cleared:false,gun:null,raid:null};
 if(addon.stages.phase==='explore')addon.startBoss({...origin,presentArrival:false});
 if(role==='attack')b.gun=firstBody(g);
 else{
  const tuning=addon.hooks.getTuning({bossId:'paris-geschuetz',stageIndex:LAON_STAGE,loopIndex:addon.stages.loopIndex});
  b.gun=new ParisGeschuetz({id:addon.runId+':laon-friendly:'+addon.serial++,faction:'central',friendly:true,...origin,tuning,rng:g.rng,emit:e=>handleLaonCue(g,e)});
  b.raid=firstBody(g);b.raid?.setGun?.(b.gun);
 }
 g.event?.('wave',role==='attack'?'파리포 저지 작전 · 180초 안에 핵심부를 파괴하세요':'파리포 방어 작전 · 프랑스 공습을 막고 3회 사격을 완료하세요');
 return b;
}
// Each raid aircraft is a real enemy target and consumes the same regular and
// hard-cap slots as ordinary aircraft. Pending members wait; nothing is evicted.
export function laonAvailableSlots(g){
 const b=g.laonBattle,raid=b?.raid;if(!raid)return 0;
 const active=(raid.planes||[]).filter(p=>!p.destroyed&&p.mode!=='pending'&&p.mode!=='destroyed').length;
 const enemies=(g.enemies||[]).filter(live);
 const regular=enemies.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length;
 const limit=Math.max(0,g.regularEnemyLimit?.()??(g.mode==='coop2'?12:9));
 const hard=Math.max(0,(g.enemyCapacity?.()??60)-enemies.length-1);
 return Math.min(6,active+Math.min(Math.max(0,limit-regular),hard));
}
export function discoverLaonBattle(g){
 const b=g.laonBattle;if(!b||b.discovered||!b.gun)return;
 const z=g.camera?.zoom||1,w=(g.viewWidth||960)/z,h=(g.viewHeight||700)/z;
 // See an actual section of the installation, or register a real hit.
 const seen=players(g).some(p=>p.hp>0&&p.status!=='downed'&&Math.abs(p.x-b.origin.x)<w*.5+175&&p.y+h*.5>b.origin.y-335&&p.y-h*.5<b.origin.y+90);
 const hit=b.gun.hp<b.gun.maxHp||[...b.gun.parts.values()].some(p=>p.hp<p.maxHp);
 if(seen||hit){b.discovered=true;b.gun.discovered=true;g.event?.('wave',b.role==='attack'?'라온 포대 발견 · 탄약고와 장전 설비가 약점입니다':'아군 파리포 확인 · 접근하는 폭격기를 요격하세요');}
}
export function handleLaonCue(g,e){
 const b=g.laonBattle;if(!b)return false;
 if(e.type==='boss-enter'&&['paris-geschuetz','french-counter-battery'].includes(e.bossId))return true;
 if(!e.type?.startsWith('laon-')&&!(e.bossId===b.gun?.id&&['part-destroyed','body-defeated'].includes(e.type)))return false;
 if(e.type==='laon-shot'){
  b.shotCount=b.gun?.shotCount??e.shotCount??b.shotCount+1;
  g.event?.('bossSound','railGunFire520');g.shake=Math.max(g.shake||0,b.discovered?2.4:.6);
  g.event?.('wave',b.role==='attack'?'파리 피격 경보 · 누적 포격 '+b.shotCount+'회':'아군 파리포 발사 · '+b.shotCount+' / '+LAON_MISSION.shots);
 }
 if(e.type==='laon-loading')g.event?.('bossSound','railBreech');
 if(e.type==='laon-phase'&&e.phase==='return')g.event?.('bossSound','trainBrake');
 if(e.type==='laon-ammo-explosion'){g.combatBlast?.(e.x,e.y,e.radius||100,'enemy','structure','ammoCookoff');g.event?.('bossSound','metalBreak');g.shake=Math.max(g.shake||0,3);}
 if(e.type==='laon-bomb-impact'||e.type==='laon-counterbattery-impact'){
  const previous=g.combatFX?.at(-1);
  g.combatBlast?.(e.x,e.y,e.radius||55,'enemy',e.type==='laon-bomb-impact'?'bomb':'shell');g.shake=Math.max(g.shake||0,2);
  if(e.type==='laon-counterbattery-impact'){
   const effect=g.combatFX?.at(-1);
   if(effect&&effect!==previous)effect.artillerySound='artilleryImpact';
   g.event?.('bossSound','artilleryImpact');
  }
 }
 if(e.type==='laon-counterbattery-warning')g.event?.('wave','프랑스 대포대 사격 경고 · 관측기를 격추하세요');
 if(e.type==='laon-part-destroyed'||e.type==='part-destroyed'){
  const names={loader:'장전 설비',ammo:'탄약 적재장',recoil:'복좌 장치',barrel:'포신',breech:'약실'};
  if(names[e.partId])g.event?.('wave',names[e.partId]+' 파괴 · '+(e.partId==='barrel'||e.partId==='breech'?'포격 영구 중단':'포격 준비 지연'));
 }
 // Authored art draws the muzzle, moving ordnance, smoke and persistent debris.
 // A bounded cue history crosses the network with the mission snapshot.
 (b.cues??=[]).push({...e,at:b.elapsed});b.cues=b.cues.slice(-16);
 return true;
}
function settle(g,b,result){
 if(b.resolved)return;b.result=result;b.resolved=true;b.success=result==='victory';b.resultAt=b.elapsed;
 if(b.success){
  b.resultAge=0;b.exitReady=b.role==='attack';b.exitDelay=.34+(b.gun?.returnSeconds?.()??2.8)+.25;
  if(b.raid){b.raid.missionResolved=true;b.raid.bombs.length=0;b.raid.strikes.length=0;g.stageBoss?.hazards?.clear(g.stageBoss.stages.encounter?.id);}
  g.event?.('wave',b.role==='attack'?'파리포 저지 성공 · 포격 영구 중단':'파리포 방어 성공 · 3회 포격 완료');
 }else{
  g.state='lost';g.score=g.priorityKills??((g.kills||0)*100+Math.floor(g.t||0)*10);
  g.event?.('end',b.role==='attack'?'파리포 저지 실패 · 작전 제한시간 초과':'파리포 방어 실패 · 핵심부 파괴');
 }
}
// Called AFTER the raid encounter update and BEFORE reconciliation. Released
// ordnance resolves before the friendly gun fires; a same-frame lethal impact
// therefore prevents the third shot. Destroying an airborne threat never adds a shot.
export function tickLaonBattle(g,dt,frame={}){
 const b=ensureLaonBattle(g);if(!b||paused(g)||!Number.isFinite(dt)||dt<=0)return b;
 dt=Math.min(.05,dt);
 if(b.resolved){
  if(b.success&&b.role==='defend'&&!b.exitReady){b.elapsed+=dt;b.resultAge+=dt;b.gun.update(dt,{...frame,laonAirGroup:null});b.exitReady=b.resultAge>=b.exitDelay;}
  return b;
 }
 b.elapsed+=dt;
 if(b.role==='defend'){
  if(b.raid?.dead)b.raid.updateOrdnance?.(dt);
  if(!b.gun.dead)b.gun.update(dt,{...frame,laonAirGroup:b.raid});
 }
 b.shotCount=b.gun?.shotCount||0;discoverLaonBattle(g);
 if(b.gun)b.gun.cycleDuration=b.gun.cycleSeconds();
 if(b.role==='attack'){
  b.remaining=Math.max(0,LAON_MISSION.seconds-b.elapsed);
  if(b.gun?.dead)settle(g,b,'victory');
  else if(b.remaining<=0)settle(g,b,'failure');
 }else if(b.gun?.dead)settle(g,b,'failure');
 else if(b.shotCount>=LAON_MISSION.shots)settle(g,b,'victory');
 return b;
}
// Display-only state: callbacks, encounter cycles and the raid's back-reference
// to the gun stay on the authoritative host. Guests never run these clocks.
export function snapshotLaonBattle(g){
 const b=g.laonBattle;if(!b)return null;
 const select=(source,keys)=>Object.fromEntries(keys.filter(k=>source?.[k]!==undefined).map(k=>[k,source[k]]));
 const out=select(b,['role','origin','elapsed','remaining','shotCount','discovered','result','resolved','success','cleared','resultAt','resultAge','exitReady','exitDelay','airGroupDefeated','cues']);
 out.gun=select(b.gun,['id','kind','faction','friendly','x','y','hp','maxHp','dead','scale','parts','phase','phaseAge','phaseProgress','loaderProgress','clock','recoil','flash','smoke','shotCount','lastShotAt','cycleDuration','aaShots']);
 out.raid=b.raid?select(b.raid,['id','kind','faction','x','y','hp','maxHp','dead','scale','phase','clock','planes','bombs','strikes','finalAttack']):null;
 return out;
}
export function laonStatus(g,locale='ko'){
 const b=g.laonBattle;if(!b)return '';const en=locale==='en',gun=b.gun;
 const states=['정상','손상','파괴'],ids=['loader','ammo','recoil'];
 const names=en?{loader:'Loader',ammo:'Ammo',recoil:'Recuperator'}:{loader:'장전',ammo:'탄약',recoil:'복좌'};
 const detail=ids.map(id=>{const p=gun?.parts?.get(id),s=p?.destroyed?2:p&&p.hp<p.maxHp*.55?1:0;return names[id]+':'+(en?['OK','DMG','LOST'][s]:states[s]);}).join(' · ');
 const phase=en?gun?.phase:({loading:'장전 중',ready:'발사 직전',recoil:'반동',return:'복좌',reload:'재장전',destroyed:'포격 중단'})[gun?.phase]||'';
 const front=b.role==='attack'?(en?'STOP THE GUN ':'저지 제한 ')+Math.ceil(b.remaining)+'s · '+(en?'PARIS HITS ':'파리 포격 ')+b.shotCount:(en?'DEFEND GUN ':'아군 포격 ')+b.shotCount+' / '+LAON_MISSION.shots;
 return front+' · '+phase+'\n'+detail;
}
