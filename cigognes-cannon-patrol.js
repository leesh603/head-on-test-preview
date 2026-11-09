import {squadronDamage,squadronCannonDamage,squadronDurability} from './squadron-elite-balance.js';
import {canAdmitSquadron,announceSquadron} from './squadron-combat-state.js';
/** Cigognes-inspired cannon patrol. The mixed formation and attack script are game fiction. */
import {arrivalViewport} from './enemy-arrivals.js';
export const CIGOGNES_BALANCE=Object.freeze({count:5,first:24,interval:115,maxDuration:26,reserve:8,speed:142,turn:.9,prepare:.4,lock:.45,reload:2.6,shots:4,damage:26});
// 20261107: four 37 mm shells (was three) on a 2.6 s reload (was 3.0 s): the cannon stays a threat.
const B=CIGOGNES_BALANCE,live=e=>e&&e.hp>0&&!e.expired&&!e.crashing,host=g=>!g.online||g.host;
const pilot=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
const hasPilot=g=>g.players?.length?g.players.some(p=>p.hp>0&&p.status!=='downed'):g.hp>0;
function escapeSpeed(g,e){const p=pilot(g),v=Math.max(80,(p.speed||150)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1))+120;e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=v;}
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const key=g=>`${g.stageBoss?.stages?.loopIndex||0}:${g.stageBoss?.stages?.orderPosition||0}:${g.stageBoss?.stages?.stageIndex}`;
let art;const loading=new Set(),retry=new Map();
export function configureCigognesArt(hooks){art=hooks;loading.clear();retry.clear();}
function ready(){if(typeof Image==='undefined')return true;let all=true;for(const id of ['spad12','stork_spad']){if(art?.ready?.(id))continue;all=false;if(art&&!loading.has(id)&&Date.now()>=(retry.get(id)||0)){loading.add(id);Promise.resolve().then(()=>art.load(id)).then(()=>{if(!art.ready(id))retry.set(id,Date.now()+30000)}).catch(()=>retry.set(id,Date.now()+30000)).finally(()=>loading.delete(id));}}return all&&art?.fxReady?.();}
export const cigognesActive=g=>['entry','aim','locked','reload','turn'].includes(g.cigognesPatrol?.phase);
function blocked(g){return !g.stageBoss?.stages||g.stageBoss.stages.phase!=='explore'||g.stageCombatWindow?.ready||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||g.battlefieldEvents?.current?.status==='active'||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||g.eliteEnemies?.active||g.londonBattle||g.parisBattle||g.verdunBattle||(g.bossPresentationAfter||0)>(g.t||0)||(g.battleRecoveryUntil||0)>(g.t||0)||(g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));}
const visible=(g,e,margin=0)=>{const v=arrivalViewport(g);return Math.abs(e.x-v.x)<v.w+margin&&Math.abs(e.y-v.y)<v.h+margin};
const members=g=>(g.enemies||[]).filter(e=>e.cigognesRole&&e.cigognesGroup!=null&&e.cigognesGroup===g.cigognesPatrol?.groupId&&live(e));
function withdraw(g,reason){const s=g.cigognesPatrol;if(!s)return;s.phase='exit';s.outcome=reason;s.nextIn=B.interval;for(const e of members(g)){e.cigognesPhase='exit';escapeSpeed(g,e);e.cigognesHeading=e.a+(e.cigognesSide||0)*.38;e.cigognesSilenced=true;e.missionTarget=false;e.fire=Infinity;}}
function room(g,n){const es=(g.enemies||[]).filter(live);return es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length+n<=(g.regularEnemyLimit?.()??12)&&es.length+n<=(g.enemyCapacity?.()??65)-1;}
/** Admission only: may warm artwork, never creates combat entities or consumes RNG. */
export function canSpawnCigognesPatrol(g){
 if(!canAdmitSquadron(g,'cigognes'))return false;
 const own=g.stageBoss?.stages?.teamFaction||g.teamFaction;
 if(!host(g)||g.state!=='playing'||!hasPilot(g)||own!=='central'||g.mode==='campaign'||g.historicalMode||g.stage?.historicalAnchorDate||blocked(g)||(g.enemies||[]).some(e=>live(e)&&e.cigognesRole)||!room(g,B.count)||!ready()||(g.stageCombatWindow?.remaining??Infinity)<B.maxDuration+B.reserve)return false;
 return true;
}
export function spawnCigognesPatrol(g){
 if(!canSpawnCigognesPatrol(g))return false;
 const p=pilot(g),v=arrivalViewport(g),a=(p.a||0)+Math.PI,dx=Math.cos(a),dy=Math.sin(a),distance=Math.min(Math.abs(dx)>.001?(v.w+100)/Math.abs(dx):Infinity,Math.abs(dy)>.001?(v.h+100)/Math.abs(dy):Infinity),group=(g.cigognesSerial||0)+1,created=[];
 const prior=g.directorSpawning;g.directorSpawning=true;
 try{for(let i=0;i<B.count;i++){
  const count=g.enemies.length,e=g.spawnEnemy?.('scout')||(g.enemies.length>count?g.enemies.at(-1):null);if(!e)break;
  for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','directorSquad','directorFormation','frontRoute','eliteKind','personalityId','normalFormationFamily','formationLeader','isFormationCommander','directorSignals','dangerHeavy','dangerAimUntil','dangerAimAngle','airArrival','arrivalPending'])delete e[k];
  const rank=Math.ceil(i/2),side=i===0?0:i%2?-1:1,back=rank*70,hp=Math.round((i?50:102)*squadronDurability(g));
  Object.assign(e,{type:'scout',ace:false,cigognesRole:i?'escort':'cannon',cigognesGroup:group,cigognesSide:side,cigognesRank:rank,cigognesPhase:'entry',cigognesHeading:a,arrivalAuthored:true,missionTarget:true,battlefieldEventId:'cigognes:'+group,escortPlane:i?'stork_spad':'spad12',visualScale:i?1:1.06,name:i?'시고뉴 호위기':'시고뉴 37 mm 기관포기',planeName:i?'SPAD':'SPAD XII',faction:'entente',hp,maxHp:hp,speed:B.speed,dogfightCruise:B.speed,personalityCruise:B.speed,cruiseSpeedCap:B.speed,energySpeed:1,fire:Infinity,hitRadius:20,contactRadius:17,x:v.x-dx*(distance+back)-dy*side*108,y:v.y-dy*(distance+back)+dx*side*108,a});created.push(e);
 }}finally{g.directorSpawning=prior}
 if(created.length!==B.count){g.enemies=g.enemies.filter(e=>!created.includes(e));return false;}
 g.cigognesSerial=group;g.cigognesPatrol={phase:'entry',groupId:group,stageKey:key(g),elapsed:0,age:0,shots:0,nextIn:B.interval,lastTime:g.t||0};announceSquadron(g,'cigognes',group);g.event?.('wave','시고뉴 기관포 편대 접근 · 한 발을 피하고 재장전 중 파고드세요');return created[0];
}
function phase(g,s,name){s.phase=name;s.age=0;if(name==='reload'){const lead=members(g).find(e=>e.cigognesRole==='cannon');s.reloadHeading=lead?.a??0;s.bankSide=s.shots%2?1:-1;}for(const e of members(g)){e.cigognesPhase=name;e.fire=e.cigognesRole==='escort'&&name==='aim'?.18:Infinity;}g.event?.('wave',name==='locked'?'37 mm 조준 고정 · 옆으로 이탈':name==='reload'?'기관포 재장전 · 공격 기회':'기관포 재조준');}
export function tickCigognesPatrol(g,dt){
 if(!host(g)||!(dt>0)||g.mode==='campaign')return;let s=g.cigognesPatrol;
 if(g.state!=='playing'){if(s&&cigognesActive(g)&&['dead','lost','won'].includes(g.state))withdraw(g,'run-ended');return;}
 dt=Math.min(.04,dt);if(!s)s=g.cigognesPatrol={phase:'idle',nextIn:B.first,stageKey:key(g),lastTime:g.t||0};
 if((g.t||0)<s.lastTime){withdraw(g,'restart');s.nextIn=B.first;}s.lastTime=g.t||0;
 const es=members(g),leader=es.find(e=>e.cigognesRole==='cannon');for(const e of es)e.cigognesFlash=Math.max(0,(e.cigognesFlash||0)-dt);
 if(cigognesActive(g)){
  if(!leader){withdraw(g,'leader-lost');return;}if(blocked(g)||s.stageKey!==key(g)||!hasPilot(g)){withdraw(g,'priority');return;}
  s.elapsed+=dt;s.age+=dt;if(s.elapsed>=B.maxDuration){withdraw(g,'timeout');return;}
  if(s.phase==='entry'&&visible(g,leader,-20))phase(g,s,'aim');
  else if(s.phase==='aim'&&s.age>=B.prepare){s.lockedAim=leader.a;leader.cigognesHeading=leader.a;phase(g,s,'locked');}
  else if(s.phase==='locked'&&s.age>=B.lock){
   fireCigognes(g,leader);
   // A hidden/offscreen/suppressed shot must not spend the three-shell budget.
   if(leader.cigognesFiredCycle===s.shots){s.shots++;phase(g,s,'reload');}
   else phase(g,s,'turn');
  }
  else if(s.phase==='reload'){
   if(s.age>=B.reload){if(s.shots>=B.shots){withdraw(g,'departed');return;}phase(g,s,'turn');}
   else if(s.age>=.65)for(const escort of es)if(escort.cigognesRole==='escort')fireCigognes(g,escort);
  }
  else if(s.phase==='turn'){const p=pilot(g),a=Math.atan2(p.y-leader.y,p.x-leader.x);if(s.age>1.2&&visible(g,leader,-30)&&Math.abs(angle(a-leader.a))<.18){leader.cigognesHeading=leader.a;phase(g,s,'aim');}}
 }
 for(const e of es)if(e.cigognesPhase==='exit'&&!visible(g,e,110))g.enemies=g.enemies.filter(x=>x!==e);
 if(!members(g).length&&!cigognesActive(g)){s.phase='idle';if(!g.squadronManaged&&!blocked(g)){s.nextIn=Math.max(0,s.nextIn-dt);if(!s.nextIn)spawnCigognesPatrol(g);}}
}
export function cigognesSteering(g,e){if(!e.cigognesRole)return null;const s=g.cigognesPatrol,p=pilot(g);if(e.cigognesPhase==='exit')escapeSpeed(g,e);let heading=e.cigognesHeading;
 if(e.cigognesPhase!=='exit'){
  if(e.cigognesRole==='cannon'){
   if(s?.phase==='aim'||s?.phase==='turn')heading=Math.atan2(p.y-e.y,p.x-e.x);
   const range=Math.hypot(p.x-e.x,p.y-e.y),pace=Math.max(80,(p.speed||150)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1));
   // Recover contact after the head-on pass; slow while banking, then close.
   const recovery=s?.phase==='turn',v=recovery?(Math.abs(angle(heading-e.a))>.55?200:range>260||!visible(g,e,-45)?Math.min(380,pace+200):Math.max(B.speed,pace)):['aim','locked'].includes(s?.phase)&&Math.cos(p.a-e.a)>.65?Math.max(B.speed,pace):B.speed;
   e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=v;
   // A shallow bank belongs to the reload, never to the locked cannon shot.
   if(s?.phase==='reload')heading=s.reloadHeading+(s.bankSide||1)*.48*Math.min(1,s.age/1.1);
  }else{const lead=members(g).find(x=>x.cigognesRole==='cannon');if(lead){
   const a=lead.a,side=e.cigognesSide,spread=s?.phase==='reload'?145:120;
   const tx=lead.x-Math.cos(a)*80*(e.cigognesRank||1)-Math.sin(a)*side*spread,ty=lead.y-Math.sin(a)*80*(e.cigognesRank||1)+Math.cos(a)*side*spread;
   // Pursue ahead of the moving station, not a stationary point behind it.
   const along=(tx-e.x)*Math.cos(a)+(ty-e.y)*Math.sin(a),leadTarget=(s?.phase==='turn'||s?.phase==='aim')?Math.atan2(p.y-lead.y,p.x-lead.x):s?.phase==='reload'?(s.reloadHeading+(s.bankSide||1)*.48*Math.min(1,s.age/1.1)):lead.cigognesHeading,rate=Math.max(-B.turn,Math.min(B.turn,angle(leadTarget-a)*3));
   const v=Math.max(60,Math.min(Math.min(450,Math.max(245,lead.speed+160)),lead.speed-side*rate*spread+along*.34));
   e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=v;
   heading=Math.atan2(ty+Math.sin(a)*v*.8-e.y,tx+Math.cos(a)*v*.8-e.x);
  }}
 }
 return {delta:angle(heading-e.a),turn:e.cigognesRole==='cannon'?B.turn:1.15};
}
export function fireCigognes(g,e){if(!e.cigognesRole)return false;e.fire=Infinity;
 if(!host(g)||g.state!=='playing'||e.cigognesSilenced||!live(e)||!visible(g,e,-15)||g.sunStrikeContains?.(e)||(g.bullets?.length||0)>=180)return true;
 const p=g.enemyCombatTarget?.(e)||pilot(g);if(!p||p.hp<=0||p.fogHidden||p.kaiserFogTime>0||p.ballCloak>0||p.cloudConceal>0)return true;
 const s=g.cigognesPatrol,cannon=e.cigognesRole==='cannon';
 if(cannon?(s?.phase!=='locked'||s.age<B.lock||e.cigognesFiredCycle===s.shots):(!['aim','locked','reload'].includes(s?.phase)||s.phase==='reload'&&s.age<.65||e.cigognesEscortCycle===s.shots||s['escortFlank'+e.cigognesSide]===s.shots))return true;
 const aim=cannon?s.lockedAim:e.a,range=Math.hypot(p.x-e.x,p.y-e.y);
 const leadTime=Math.min(.9,range/320),pace=(p.speed||150)*(p.airframeSpeed??1);
 const delta=Math.abs(angle(Math.atan2(p.y+Math.sin(p.a)*pace*leadTime-e.y,p.x+Math.cos(p.a)*pace*leadTime-e.x)-e.a));
 // Escorts only threaten their outward flank; the central lane remains open.
 if(!cannon){
  const lead=members(g).find(member=>member.cigognesRole==='cannon');
  if(!lead||delta>.23||range>340||((p.x-lead.x)*-Math.sin(lead.a)+(p.y-lead.y)*Math.cos(lead.a))*e.cigognesSide<80)return true;
 }
 if(cannon)e.cigognesFiredCycle=s.shots;else{e.cigognesEscortCycle=s.shots;s['escortFlank'+e.cigognesSide]=s.shots;}
 const speed=cannon?270:320;(g.bullets??=[]).push({x:e.x+Math.cos(aim)*27,y:e.y+Math.sin(aim)*27,vx:Math.cos(aim)*speed,vy:Math.sin(aim)*speed,life:cannon?2.2:1.6,enemy:true,sourceX:e.x,sourceY:e.y,cigognesGroup:e.cigognesGroup,cigognesCannon:cannon,collisionRadius:cannon?5:2,damage:cannon?squadronCannonDamage(g,B.damage):squadronDamage(g,9),visualType:'scout'});e.cigognesFlash=cannon?.38:.12;e.muzzleFlash=cannon?0:.12;e.gunAim=aim;g.event?.(cannon?'heavyShot':'enemyShot','');return true;
}
export function installCigognesPatrol(Game){const p=Game.prototype;if(Object.hasOwn(p,'__cigognesPatrol'))return;p.__cigognesPatrol=true;
 const steer=p.dogfightSteering;p.dogfightSteering=function(e,...args){return cigognesSteering(this,e)||steer.call(this,e,...args);};
 const fire=p.fireEnemy;p.fireEnemy=function(e,...args){if(!fireCigognes(this,e))return fire.call(this,e,...args);};
}

export function withdrawCigognesPatrol(g,reason='priority'){withdraw(g,reason);}

/** Asset-only prefetch, independent of combat admission and RNG. */
export function warmCigognesArt(id){return ready();}
