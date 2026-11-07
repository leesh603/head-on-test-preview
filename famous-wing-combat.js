import {squadronDamage,squadronDurability} from './squadron-elite-balance.js?v=09c75d146ae4289d';
/** Historical unit/airframe identities; finite attack choreography is game fiction. */
import {arrivalViewport} from './enemy-arrivals.js?v=09c75d146ae4289d';
import {combatImpactResult} from './combat-impact-result.js?v=09c75d146ae4289d';
import {rememberSquadronFlight,squadronClearance} from './legend-squadron-combat.js?v=09c75d146ae4289d';
import {canAdmitSquadron,announceSquadron} from './squadron-combat-state.js?v=09c75d146ae4289d';
export const FAMOUS_WING_BALANCE=Object.freeze({jasta18:{plane:'jasta18_fokkerd7',count:5,faction:'central',duration:25,hp:72,speed:120,warning:.7},lafayette:{plane:'lafayette_nieuport17',count:5,faction:'entente',duration:22,hp:68,speed:110,warning:1},bulletLife:1.2,bulletSpeed:375,burstGap:.15,damage:12});
const B=FAMOUS_WING_BALANCE,alive=e=>e&&e.hp>0&&!e.expired&&!e.crashing,host=g=>!g.online||g.host,pilot=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),stage=g=>`${g.stageBoss?.stages?.loopIndex||0}:${g.stageBoss?.stages?.orderPosition||0}:${g.stageBoss?.stages?.stageIndex}`;
const members=g=>(g.enemies||[]).filter(e=>e.famousWingGroup===g.famousWing?.groupId&&e.famousWingUnit===g.famousWing?.unitId&&alive(e));
const visible=(g,e,m=0)=>{const v=arrivalViewport(g);return Math.abs(e.x-v.x)<v.w+m&&Math.abs(e.y-v.y)<v.h+m};
let art;const loading=new Set(),retry=new Map();
export function configureFamousWingArt(hooks){art=hooks;loading.clear();retry.clear();}
function ready(id){if(typeof Image==='undefined')return true;if(art?.ready?.(id))return true;if(art&&!loading.has(id)&&Date.now()>=(retry.get(id)||0)){loading.add(id);Promise.resolve().then(()=>art.load(id)).then(()=>{if(!art.ready?.(id))retry.set(id,Date.now()+30000)}).catch(()=>retry.set(id,Date.now()+30000)).finally(()=>loading.delete(id));}return false;}
function priority(g){return g.stageBoss?.stages?.phase!=='explore'||g.stageCombatWindow?.ready||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||g.battlefieldEvents?.current?.status==='active'||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||g.eliteEnemies?.active||g.londonBattle||g.parisBattle||g.verdunBattle||(g.battleRecoveryUntil||0)>(g.t||0)||(g.bossPresentationAfter||0)>(g.t||0)||(g.enemies||[]).some(e=>alive(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));}
function setPhase(g,phase){const s=g.famousWing;s.phase=phase;s.age=0;for(const e of members(g)){e.famousWingPreparing=false;e.famousWingWarningLeft=0;if(e.famousWingPhase!=='exit'&&!(e.famousWingBreakUntil>(g.t||0)))e.famousWingPhase=phase;}}
function retreat(e,g){if(e.famousWingPhase==='exit')return;e.famousWingBankIn=false;e.famousWingPreparing=false;e.famousWingWarningLeft=0;e.famousWingPhase='exit';e.famousWingHeading=e.famousWingUnit==='lafayette'?Math.atan2(e.y-pilot(g).y,e.x-pilot(g).x):e.a+(e.famousWingLane<0?-.7:.7);e.missionTarget=false;e.fire=Infinity;e.famousWingSilenced=true;}
export function withdrawFamousWing(g,reason='priority'){if(!host(g)||!g.famousWing)return;g.famousWing.phase='exit';g.famousWing.outcome=reason;for(const e of members(g))retreat(e,g);}
/** Admission only: may warm artwork, never creates combat entities or consumes RNG. */
export function canSpawnFamousWing(g,id){const p=B[id],own=g.stageBoss?.stages?.teamFaction||g.teamFaction;if(!p||!host(g)||g.state!=='playing'||!(pilot(g).hp>0)||(g.players?.length&&!g.players.some(p=>p.hp>0&&p.status!=='downed'))||own===p.faction||!['central','entente'].includes(own)||g.mode==='campaign'||g.historicalMode||g.stage?.historicalAnchorDate||priority(g)||!canAdmitSquadron(g,id)||!ready(p.plane)||(g.stageCombatWindow?.remaining??Infinity)<p.duration+8)return false;
 const es=(g.enemies||[]).filter(alive);if(es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length+p.count>(g.regularEnemyLimit?.()??12)||es.length+p.count>(g.enemyCapacity?.()??65)-1)return false;
 return true;
}
export function spawnFamousWing(g,id){
 if(!canSpawnFamousWing(g,id))return false;
 const p=B[id];
 const q=pilot(g),v=arrivalViewport(g),group=(g.famousWingSerial||0)+1,created=[],base=(q.a||0)+Math.PI,target={x:q.x+Math.cos(q.a||0)*130,y:q.y+Math.sin(q.a||0)*130},prior=g.directorSpawning;const intercepts=[];let firstCross=0;g.directorSpawning=true;
 try{for(let i=0;i<p.count;i++){const n=g.enemies.length,e=g.spawnEnemy?.('scout')||(g.enemies.length>n?g.enemies.at(-1):null);if(!e)break;for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','directorSquad','directorFormation','frontRoute','eliteKind','personalityId','normalFormationFamily','formationLeader','isFormationCommander','directorSignals','dangerHeavy','dangerAimUntil','dangerAimAngle','airArrival','arrivalPending'])delete e[k];
  const a=base+(id==='jasta18'?(i%2?-.42:.42):0),dx=Math.cos(a),dy=Math.sin(a),side=id==='lafayette'?(i===0?0:i===1||i===3?-105:105):0;
  let center={x:v.x-dy*side,y:v.y+dx*side},distance=0;
  if(id==='jasta18'){
   // Predict once at admission. Each pass has its own future crossing point;
   // neither heading nor target follows the player after this calculation.
   const pace=Math.max(60,Math.min(420,(q.speed||150)*(q.airframeSpeed??1)*(q.pursuitSpeedFactor??1))),px=Math.cos(q.a||0)*pace,py=Math.sin(q.a||0)*pace;
   let edgeTime=Infinity;for(const [axis,velocity,half] of [['x',px-dx*p.speed,v.w],['y',py-dy*p.speed,v.h]])if(Math.abs(velocity)>.001)edgeTime=Math.min(edgeTime,(half+105-(q[axis]-v[axis])*Math.sign(velocity))/Math.abs(velocity));
   const cross=i?Math.max(firstCross+i*2.15,edgeTime):Math.max(1.25,edgeTime);if(!i)firstCross=cross;
   center={x:q.x+px*cross,y:q.y+py*cross};distance=p.speed*cross;intercepts.push({...center,at:cross});
  }else{for(const [axis,d,half] of [['x',-dx,v.w],['y',-dy,v.h]])if(Math.abs(d)>.001){const value=(half+105-(center[axis]-v[axis])*Math.sign(d))/Math.abs(d);if(distance===0||value<distance)distance=value;}distance=Math.max(100,distance);}

  const hp=Math.round(p.hp*squadronDurability(g)),back=id==='lafayette'?(i>=3?200+(i-3)*26:i*26):0;Object.assign(e,{type:'scout',ace:false,famousWingUnit:id,famousWingGroup:group,famousWingSlot:i,famousWingPhase:'entry',famousWingHeading:a,famousWingCruiseHeading:a,famousWingLane:id==='jasta18'?(i%2?-1:1):side,famousWingBankIn:true,famousWingIntercept:id==='jasta18'?{...center}:null,famousWingLastHp:hp,famousWingRounds:0,famousWingCoverUsed:false,arrivalAuthored:true,missionTarget:true,battlefieldEventId:id+':'+group,escortPlane:p.plane,visualScale:1,name:id==='jasta18'?'Jasta 18 · Raben':'Escadrille Lafayette',faction:p.faction,hp,maxHp:hp,speed:p.speed,dogfightCruise:p.speed,personalityCruise:p.speed,cruiseSpeedCap:p.speed,energySpeed:1,fire:Infinity,hitRadius:20,contactRadius:17,x:center.x-dx*(distance+back),y:center.y-dy*(distance+back),a:a+(id==='jasta18'?(i%2?-.24:.24):(side<0?-.2:side>0?.2:0))});created.push(e);
 }}finally{g.directorSpawning=prior}
 if(created.length!==p.count){g.enemies=g.enemies.filter(e=>!created.includes(e));return false;}
 g.famousWingSerial=group;g.famousWing={unitId:id,groupId:group,phase:'entry',age:0,elapsed:0,combatAge:0,activeIndex:0,rounds:0,stageKey:stage(g),lastTime:g.t||0,intercepts,coverQueue:[],reacted:false};announceSquadron(g,id,group);return created[0];
}
function crossingAim(g,e,delay=0){const p=pilot(g),s=g.famousWing,vx=s.playerVx??Math.cos(p.a)*(p.speed||150),vy=s.playerVy??Math.sin(p.a)*(p.speed||150),rx=p.x+vx*delay-e.x-Math.cos(e.a)*e.speed*delay,ry=p.y+vy*delay-e.y-Math.sin(e.a)*e.speed*delay,A=vx*vx+vy*vy-B.bulletSpeed**2,Q=2*(rx*vx+ry*vy),C=rx*rx+ry*ry,D=Q*Q-4*A*C,roots=Math.abs(A)<1e-6?[Q?-C/Q:0]:D>=0?[(-Q-Math.sqrt(D))/(2*A),(-Q+Math.sqrt(D))/(2*A)]:[];const time=Math.max(0,Math.min(.95,...roots.filter(t=>t>=0)));return Math.atan2(ry+vy*time,rx+vx*time);}
function prepare(g,e,cover=false){delete e.famousWingLastRound;e.famousWingBankIn=false;const s=g.famousWing;s.activeIndex=e.famousWingSlot;s.lockedHeading=e.a;s.rounds=0;s.cover=cover;s.warningVisible=0;if(s.unitId==='lafayette'&&s.rejoining&&!cover){s.rejoining=false;s.returning=true;const p=pilot(g),pace=Math.max(80,(p.speed||150)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1));for(const wing of members(g)){wing.famousWingCruiseHeading=wing.a;wing.speed=wing.dogfightCruise=wing.personalityCruise=wing.cruiseSpeedCap=pace;}}if(s.unitId==='jasta18')e.famousWingHeading=e.famousWingCruiseHeading+e.famousWingLane*.3;if(cover){const q=pilot(g);e.famousWingHeading=Math.atan2(q.y-e.y,q.x-e.x);for(const wing of members(g))if(wing!==e&&wing.famousWingPhase!=='exit'&&!(wing.famousWingBreakUntil>(g.t||0)))wing.famousWingHeading=wing.famousWingCruiseHeading+(wing.famousWingLane<0?-.24:.24);}e.famousWingRounds=0;e.famousWingCoverUsed=cover||e.famousWingCoverUsed;setPhase(g,'warning');e.famousWingPreparing=true;e.famousWingWarningLeft=B[s.unitId].warning;g.event?.('wave',s.unitId==='jasta18'?'Jasta 18 · 한 기만 사격 준비':cover?'라파예트 엄호 준비 · 준비 중인 기체를 맞혀 중단':'라파예트 선도기 사격 준비');}
function returnLaneClear(g,e){const pace=Math.max(80,(pilot(g).speed||150)*(pilot(g).airframeSpeed??1)*(pilot(g).pursuitSpeedFactor??1));return members(g).every(q=>{if(q===e)return true;const rx=e.x-q.x,ry=e.y-q.y,vx=(Math.cos(e.a)-Math.cos(q.a))*pace,vy=(Math.sin(e.a)-Math.sin(q.a))*pace,t=Math.max(0,Math.min(1.5,-(rx*vx+ry*vy)/(vx*vx+vy*vy||1)));return Math.hypot(rx+vx*t,ry+vy*t)>=90;});}
function rallyCourse(g,e){
 const p=pilot(g),a=p.a||0,pace=Math.max(80,(p.speed||150)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1)),back=e.famousWingSlot>=3?295:e.famousWingSlot?150:85,side=-e.famousWingLane*(e.famousWingSlot>=3?1.6:1),tx=p.x-Math.cos(a)*back-Math.sin(a)*side,ty=p.y-Math.sin(a)*back+Math.cos(a)*side;
 let vx=Math.cos(a)*pace+(tx-e.x)*.65,vy=Math.sin(a)*pace+(ty-e.y)*.65;
 // Reserve stations have separate fore/aft spacing. Smooth predictive yielding
 // keeps a returning cover from cutting across the next aircraft's run.
 for(const other of members(g)){if(other===e||other.famousWingPhase==='exit')continue;const rx=e.x-other.x,ry=e.y-other.y,d=Math.hypot(rx,ry);if(d<1||d>300)continue;const dx=Math.cos(e.a)*e.speed-Math.cos(other.a)*other.speed,dy=Math.sin(e.a)*e.speed-Math.sin(other.a)*other.speed,t=Math.max(0,Math.min(1.2,-(rx*dx+ry*dy)/(dx*dx+dy*dy||1))),near=Math.hypot(rx+dx*t,ry+dy*t),push=Math.max(0,120-near)*2.4+Math.max(0,95-d)*3;vx+=rx/d*push;vy+=ry/d*push;}
 // Opposing wingmen turn back around their own flank, rather than choosing
 // opposite shortest U-turns through the centre of the formation.
 const heading=e.famousWingLane&&Math.cos(e.a-a)<-.12?a-Math.sign(e.famousWingLane)*Math.PI/2:Math.atan2(vy,vx);return {heading,speed:Math.abs(angle(heading-e.a))>.6?75:Math.max(70,Math.min(380,Math.hypot(vx,vy)))};
}
function rejoin(g){const s=g.famousWing,es=members(g).filter(e=>e.famousWingPhase!=='exit');if(!es.length)return;const next=es.find(e=>e.famousWingSlot>s.activeIndex)||es[0];s.activeIndex=next.famousWingSlot;s.rejoining=true;setPhase(g,'rejoin');for(const e of es)e.famousWingBankIn=false;}
function nextCover(g){
 const s=g.famousWing,p=pilot(g),es=members(g).filter(e=>e.famousWingPhase!=='exit'),waiting=es.filter(e=>!e.famousWingCoverUsed&&(e.famousWingBreakUntil||0)<=(g.t||0)).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y));
 const ready=waiting.find(e=>visible(g,e,-20)&&Math.abs(angle(crossingAim(g,e,B.lafayette.warning)-e.a))<.24&&returnLaneClear(g,e));
 if(ready){prepare(g,ready,true);return true;}
 // A reserve has to make a real approach before announcing its cover burst.
 // Healthy aircraft stay in the rotation after firing instead of retiring.
 if(waiting.length){s.activeIndex=waiting[0].famousWingSlot;s.cover=true;s.rejoining=true;setPhase(g,'rejoin');for(const e of es)e.famousWingBankIn=false;return false;}
 if(es.some(e=>e.famousWingBreakUntil>(g.t||0)))return false;
 for(const e of es)e.famousWingCoverUsed=false;s.cover=false;s.reacted=false;rejoin(g);return false;
}
export function reactFamousWingHit(g,e){const s=g.famousWing;if(!host(g)||g.state!=='playing'||s?.unitId!=='lafayette'||e.famousWingGroup!==s.groupId||e.famousWingUnit!=='lafayette'||e.famousWingPhase==='exit'||['exit','idle'].includes(s.phase))return false;e.famousWingLastHp=e.hp;
 if(e.hp>e.maxHp*.35&&!e.crashing){
  if(e.famousWingBreakUntil>(g.t||0))return false;
  e.famousWingBreakUntil=(g.t||0)+1.8;e.famousWingSilenced=true;e.famousWingPreparing=false;e.famousWingWarningLeft=0;
  e.famousWingHeading=e.famousWingCruiseHeading+(e.famousWingLane<0?-.75:e.famousWingLane>0?.75:.15);
 }else retreat(e,g);
 // Cover continues on its own clock while the hit aircraft breaks away.
 if(s.reacted&&['cover-wait','warning','burst'].includes(s.phase)&&s.activeIndex!==e.famousWingSlot)return true;
 s.reacted=true;setPhase(g,'cover-wait');s.age=0;s.pendingCover=true;g.event?.('wave','라파예트 피격기 이탈 · 엄호 후 재합류');return true;}
export function tickFamousWing(g,dt){const s=g.famousWing;if(!s||!host(g)||!(dt>0))return;if(g.state!=='playing'){if(['lost','won','dead'].includes(g.state))withdrawFamousWing(g,'run-ended');return;}dt=Math.min(.04,dt);if((g.t||0)<s.lastTime)withdrawFamousWing(g,'restart');s.lastTime=g.t||0;
 const p=pilot(g);if(Number.isFinite(s.playerX)){s.playerVx=(p.x-s.playerX)/dt;s.playerVy=(p.y-s.playerY)/dt;}s.playerX=p.x;s.playerY=p.y;
 const es=members(g);rememberSquadronFlight(g,es,1.1);if(!['exit','idle'].includes(s.phase)){if(priority(g)||s.stageKey!==stage(g)||!(pilot(g).hp>0)||(g.players?.length&&!g.players.some(p=>p.hp>0&&p.status!=='downed'))){withdrawFamousWing(g,'priority');return;}if(!es.length){withdrawFamousWing(g,'destroyed');return;}s.elapsed+=dt;s.age+=dt;if(s.engagedAt!==undefined)s.combatAge=(s.combatAge||0)+dt;if(s.combatAge>=B[s.unitId].duration||s.elapsed>=B[s.unitId].duration+8){withdrawFamousWing(g,'timeout');return;}
  if(s.unitId==='lafayette')for(const e of g.enemies||[])if(e.famousWingGroup===s.groupId&&e.famousWingUnit===s.unitId&&e.hp<e.famousWingLastHp){reactFamousWingHit(g,e);e.famousWingLastHp=e.hp;}
  for(const e of es)if(e.famousWingBreakUntil&&e.famousWingBreakUntil<=(g.t||0)&&e.famousWingPhase!=='exit'){e.famousWingBreakUntil=0;e.famousWingSilenced=false;e.famousWingCoverUsed=false;e.famousWingPhase='cover-wait';}
  const active=es.find(e=>e.famousWingSlot===s.activeIndex&&e.famousWingPhase!=='exit'&&!(e.famousWingBreakUntil>(g.t||0)));
  if(s.phase==='entry'){if(active&&visible(g,active,s.unitId==='jasta18'?125:140))prepare(g,active);else if(!active){if(s.unitId==='lafayette')nextCover(g);else setPhase(g,'clear');}}
  // The rest of the visible warning is an escape window, not a homing aim.
  else if(s.phase==='warning'){if(active){if(s.age<=.35)active.famousWingHeading=crossingAim(g,active,Math.max(0,B[s.unitId].warning-s.age));s.warningVisible=(s.warningVisible||0)+(visible(g,active,0)?dt:0);active.famousWingWarningLeft=Math.max(0,B[s.unitId].warning-s.age,s.unitId==='jasta18'?.35-s.warningVisible:0);}if(!active){if(s.unitId==='lafayette')nextCover(g);else setPhase(g,'clear');}else if(s.age>=B[s.unitId].warning&&(s.unitId==='jasta18'?s.warningVisible>=.35&&Math.abs(angle(active.famousWingHeading-active.a))<.24:visible(g,active,-20)&&Math.abs(angle(active.famousWingHeading-active.a))<.24)){s.lockedHeading=active.famousWingHeading;setPhase(g,'burst');if(s.unitId==='jasta18'){const n=g.bullets?.length||0;fireFamousWing(g,active);s.rounds=(g.bullets?.length||0)>n?1:0;}}}
  else if(s.phase==='burst'){if(active&&s.rounds<3&&s.age>=s.rounds*(s.unitId==='jasta18'?.06:B.burstGap)){const n=g.bullets?.length||0;fireFamousWing(g,active);if((g.bullets?.length||0)>n)s.rounds++;}if(s.age>=.42&&s.rounds>=3||s.age>=1.62){if(s.unitId==='jasta18'&&active)retreat(active,g);setPhase(g,'clear');}}
  else if(s.phase==='clear'&&s.age>=(s.unitId==='jasta18'?.7:1.05)&&!g.bullets?.some(b=>b.famousWingGroup===s.groupId&&b.life>.35)){if(s.unitId==='jasta18'){const next=es.find(e=>e.famousWingSlot>s.activeIndex);if(next&&visible(g,next,125)&&Math.hypot(p.x-next.x,p.y-next.y)<390)prepare(g,next);else if(!next)withdrawFamousWing(g,'departed');}else if(s.cover){if(active)active.famousWingHeading=active.famousWingCruiseHeading;setPhase(g,'cover-wait');}else{s.openingPasses=(s.openingPasses||0)+1;setPhase(g,'watch');for(const wing of es)if(wing.famousWingSlot&&wing.famousWingPhase!=='exit')wing.famousWingHeading=wing.famousWingCruiseHeading+(wing.famousWingLane<0?-.18:.18);}}
  else if(s.phase==='watch'&&s.age>=.75){if((s.openingPasses||0)>=4)withdrawFamousWing(g,'departed');else rejoin(g);}
  else if(s.phase==='rejoin'&&active&&visible(g,active,-30)&&Math.hypot(p.x-active.x,p.y-active.y)<420&&Math.abs(angle(crossingAim(g,active,B.lafayette.warning)-active.a))<.24&&returnLaneClear(g,active))prepare(g,active,!!s.cover);
  else if(s.phase==='cover-wait'&&s.age>=.3&&!g.bullets?.some(b=>b.famousWingGroup===s.groupId&&b.life>0))nextCover(g);
 }
 for(const e of es)if(e.famousWingPhase==='exit'){e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=e.famousWingUnit==='lafayette'&&Math.abs(angle(e.famousWingHeading-e.a))>.5?90:Math.max(60,Math.min(320,(pilot(g).speed||150)*(pilot(g).airframeSpeed??1)*(pilot(g).pursuitSpeedFactor??1)))+120;if(!visible(g,e,110))g.enemies=g.enemies.filter(x=>x!==e);}if(!members(g).length)s.phase='idle';
}
export function famousWingSteering(g,e){if(e.famousWingGroup==null)return null;if(e.famousWingBreakUntil>(g.t||0))return {delta:angle(squadronClearance(g,e,e.famousWingHeading,members(g),'famousWingSlot',g.famousWing?.activeIndex??0,1.1)-e.a),turn:1.1};const s=g.famousWing;
 // A clearance manoeuvre changes this frame's speed; restore the intended
 // cruise before planning the next frame so a brief avoidance cannot persist.
 if(s?.unitId==='lafayette'&&e.famousWingPhase!=='exit'){const p=pilot(g),v=s.returning||s.cover?Math.max(80,(p.speed||150)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1)):B.lafayette.speed;e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=v;}
 if(s?.unitId==='jasta18'&&s.phase==='clear'&&e.famousWingPhase!=='exit'&&e.famousWingSlot>s.activeIndex){
  if(s.elapsed<(s.intercepts?.[e.famousWingSlot]?.at??0)+.2){e.famousWingHeading=e.famousWingCruiseHeading;e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=B.jasta18.speed;return {delta:angle(e.famousWingHeading-e.a),turn:1.1};}
  const p=pilot(g),lead=members(g).find(q=>q.famousWingSlot>s.activeIndex&&q.famousWingPhase!=='exit');
  const side=e.famousWingLane*(e===lead?48:115),ahead=e===lead?95:170+(e.famousWingSlot-lead.famousWingSlot)*45;
  const a=p.a||0,tx=p.x+Math.cos(a)*ahead-Math.sin(a)*side,ty=p.y+Math.sin(a)*ahead+Math.cos(a)*side;
  e.famousWingHeading=Math.atan2(ty-e.y,tx-e.x);
  const speed=Math.min(335,Math.max(155,(p.speed||150)*(p.airframeSpeed??1)+80));
  e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=speed;
  return {delta:angle(e.famousWingHeading-e.a),turn:1.45};
 }
 if(s?.unitId==='lafayette'&&s.phase==='rejoin'&&e.famousWingPhase!=='exit'){
  const p=pilot(g),active=e.famousWingSlot===s.activeIndex,rally=rallyCourse(g,e);
  e.famousWingHeading=active?crossingAim(g,e,B.lafayette.warning):rally.heading;
  const pace=Math.max(80,(p.speed||150)*(p.airframeSpeed??1)*(p.pursuitSpeedFactor??1)),range=Math.hypot(p.x-e.x,p.y-e.y),v=Math.abs(angle(e.famousWingHeading-e.a))>.5?90:Math.min(380,pace+(range>350?140:Math.max(-30,Math.min(70,(range-(active?120:180))*.5))));
  e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=active?(!returnLaneClear(g,e)?70:v):rally.speed;
 }
 if(s?.unitId==='lafayette'&&s.reacted&&e.famousWingPhase!=='exit'&&(e.famousWingSlot!==s.activeIndex||s.phase==='cover-wait')){const rally=rallyCourse(g,e);e.famousWingHeading=rally.heading;e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=rally.speed;}const turn=e.famousWingBankIn?.6:e.famousWingPhase==='exit'?.85:g.famousWing?.cover&&e.famousWingPreparing?.85:1.1,heading=s?.unitId==='lafayette'?squadronClearance(g,e,e.famousWingHeading,members(g),'famousWingSlot',s.activeIndex,turn):e.famousWingHeading;return {delta:angle(heading-e.a),turn};}
export function fireFamousWing(g,e){if(e.famousWingGroup==null)return false;e.fire=Infinity;const s=g.famousWing;if(!host(g)||g.state!=='playing'||s?.phase!=='burst'||s.groupId!==e.famousWingGroup||s.unitId!==e.famousWingUnit||e.famousWingSlot!==s.activeIndex||e.famousWingSilenced||(e.famousWingBreakUntil||0)>(g.t||0)||!alive(e)||e.famousWingRounds>=3||e.famousWingLastRound===s.activeIndex+':'+s.rounds||!visible(g,e,-20)||g.sunStrikeContains?.(e)||(g.bullets?.length||0)>=180)return true;const p=g.enemyCombatTarget?.(e)||pilot(g);if(!p||p.hp<=0||p.fogHidden||p.cloudConceal>0||p.kaiserFogTime>0||p.ballCloak>0)return true;
 const a=s.lockedHeading;if(Math.abs(angle(a-e.a))>.32)return true;s.engagedAt??=g.t||0;e.famousWingRounds++;e.famousWingLastRound=s.activeIndex+':'+s.rounds;(g.bullets??=[]).push({x:e.x+Math.cos(a)*25,y:e.y+Math.sin(a)*25,vx:Math.cos(a)*B.bulletSpeed,vy:Math.sin(a)*B.bulletSpeed,life:B.bulletLife,enemy:true,damage:squadronDamage(g,B.damage),visualType:'scout',sourceX:e.x,sourceY:e.y,famousWingGroup:s.groupId,famousWingUnit:s.unitId,famousWingSlot:e.famousWingSlot});e.muzzleFlash=.12;e.gunAim=a;g.event?.('enemyShot','');return true;}
export function installFamousWingCombat(Game){const p=Game.prototype;if(Object.hasOwn(p,'__famousWingCombat'))return;p.__famousWingCombat=true;const steer=p.dogfightSteering;p.dogfightSteering=function(e,...args){return famousWingSteering(this,e)||steer.call(this,e,...args);};const fire=p.fireEnemy;p.fireEnemy=function(e,...args){if(!fireFamousWing(this,e))return fire.call(this,e,...args);};const impact=p.specialRoundImpact;if(impact)p.specialRoundImpact=function(b,e,...args){const result=impact.call(this,b,e,...args),g=this.world||this.combatWorld?.()||this;if(combatImpactResult(b,e)?.damage>0)reactFamousWingHit(g,e);return result;};}

/** Asset-only prefetch, independent of combat admission and RNG. */
export function warmFamousWingArt(id){return B[id]?ready(B[id].plane):false;}

/** Allied detachments use the same pass-and-cover doctrine without the hostile
 * encounter's viewport gates, finite ambush lifetime or player-only targeting. */
export function alliedFamousWingOrder(world, wing, anchor) {
 const unit=wing.operationUnit||wing.operationReinforcement;
 if(!B[unit])return null;
 const flight=(world.patrols||[]).filter(p=>(p.operationUnit||p.operationReinforcement)===unit&&alive(p)).sort((a,b)=>a.slot-b.slot);
 const command=(world.alliedFamousWing??={unit,slot:0,until:0});
 if(command.unit!==unit){command.unit=unit;command.slot=0;command.until=0;}
 const now=world.t||0;
 if(wing.famousWingLastHp>wing.hp&&unit==='lafayette'){
  wing.famousWingBreakUntil=now+1.8;
  if(command.slot===wing.slot)command.until=now;
 }
 wing.famousWingLastHp=wing.hp;
 const able=flight.filter(p=>!(p.famousWingBreakUntil>now));
 if(command.until<=now||!able.some(p=>p.slot===command.slot)){
  const next=able.find(p=>p.slot>command.slot)||able[0];
  command.slot=next?.slot??-1;
  command.until=now+(unit==='jasta18'?2.6:3.4);
 }
 const attacking=command.slot===wing.slot&&!(wing.famousWingBreakUntil>now);
 if(attacking)return {attacking:true,interval:unit==='jasta18'?.14:B.burstGap};
 const heading=anchor.a||0,back=120+wing.slot*28,side=(wing.slot%2?1:-1)*(75+Math.floor(wing.slot/2)*48);
 return {attacking:false,waypoint:{
  x:anchor.x-Math.cos(heading)*back-Math.sin(heading)*side,
  y:anchor.y-Math.sin(heading)*back+Math.cos(heading)*side
 }};
}
