import {squadronDamage,squadronCourierDamage,squadronHp} from './squadron-elite-balance.js?v=b3bf991d11fc7798';
/** Historical squadron identities; pursuit/escort choreography is game fiction. */
import {arrivalViewport} from './enemy-arrivals.js?v=b3bf991d11fc7798';
import {rememberSquadronFlight,squadronClearance} from './legend-squadron-combat.js?v=b3bf991d11fc7798';
import {canAdmitSquadron,announceSquadron} from './squadron-combat-state.js?v=b3bf991d11fc7798';
export const EXPANSION_BALANCE=Object.freeze({duration:24,jasta5:{plane:'jasta5_patrol',count:5,faction:'central',hp:70},spa65:{plane:'spad',count:5,faction:'entente',hp:62},courierPlane:'dfw_cv',courierHp:80,warning:.65,acquire:.42,breakAngle:.35,quiet:1.25,maxBursts:7,maxBreaks:3});
// 20261107 Jasta 5 stays in the fight: seven passes (was four), departs after a
// third broken lock (was two).
const B=EXPANSION_BALANCE,live=e=>e&&e.hp>0&&!e.expired&&!e.crashing,host=g=>!g.online||g.host,pilot=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),pace=g=>Math.max(60,Math.min(320,(pilot(g).speed||150)*(pilot(g).airframeSpeed??1)*(pilot(g).pursuitSpeedFactor??1)));
const stage=g=>`${g.stageBoss?.stages?.loopIndex||0}:${g.stageBoss?.stages?.orderPosition||0}:${g.stageBoss?.stages?.stageIndex}`;
const members=g=>(g.enemies||[]).filter(e=>live(e)&&e.expansionWingGroup===g.expansionWing?.groupId&&e.expansionWingUnit===g.expansionWing?.unitId);
const courier=g=>(g.patrols||[]).find(p=>p.spa65Courier&&p.expansionWingGroup===g.expansionWing?.groupId);
// Give every surviving gun a first pass, then allow two-round relay bursts.
const relaySalvo=es=>es.some(e=>!e.expansionRelayVisits)?1:2;
const visible=(g,e,m=0)=>{const v=arrivalViewport(g);return Math.abs(e.x-v.x)<v.w+m&&Math.abs(e.y-v.y)<v.h+m};
// Lead by turning the aircraft itself; fired rounds retain their original velocity.
function flightLeadHeading(e,c,roundSpeed=330){
 const rx=c.x-e.x,ry=c.y-e.y,vx=Math.cos(c.a)*c.speed,vy=Math.sin(c.a)*c.speed,A=vx*vx+vy*vy-roundSpeed*roundSpeed,B=2*(rx*vx+ry*vy),C=rx*rx+ry*ry,D=B*B-4*A*C;
 const roots=Math.abs(A)<1e-6?(Math.abs(B)>1e-6?[-C/B]:[]):D>=0?[(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)]:[],future=roots.filter(t=>Number.isFinite(t)&&t>0),t=future.length?Math.min(1.8,...future):0;
 return Math.atan2(ry+vy*t,rx+vx*t);
}
function setSpeed(e,v){e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=v;}
let art;const pending=new Set(),retry=new Map();
export function configureExpansionArt(hooks){art=hooks;pending.clear();retry.clear();}
function ready(id){if(typeof Image==='undefined')return true;if(art?.ready?.(id))return true;if(art&&!pending.has(id)&&Date.now()>=(retry.get(id)||0)){pending.add(id);Promise.resolve().then(()=>art.load(id)).then(()=>{if(!art.ready?.(id))retry.set(id,Date.now()+30000)}).catch(()=>retry.set(id,Date.now()+30000)).finally(()=>pending.delete(id));}return false;}
function blocked(g){return g.stageBoss?.stages?.phase!=='explore'||g.stageCombatWindow?.ready||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||g.battlefieldEvents?.current?.status==='active'||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||g.eliteEnemies?.active||g.londonBattle||g.parisBattle||g.verdunBattle||(g.battleRecoveryUntil||0)>(g.t||0)||(g.bossPresentationAfter||0)>(g.t||0)||(g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));}
function bank(e,es){e.expansionPhase='exit';e.expansionPreparing=false;e.expansionWarningLeft=0;const cx=es.reduce((n,q)=>n+q.x,0)/es.length,cy=es.reduce((n,q)=>n+q.y,0)/es.length,cross=-(e.x-cx)*Math.sin(e.a)+(e.y-cy)*Math.cos(e.a);e.expansionHeading=e.a+(Math.abs(cross)>15?Math.sign(cross)*.55:0);e.missionTarget=false;e.fire=Infinity;setSpeed(e,80);}
export function withdrawExpansionWing(g,reason='priority'){if(!host(g)||!g.expansionWing)return;g.expansionWing.phase='exit';g.expansionWing.outcome=reason;const es=members(g);for(const e of es)bank(e,es);const c=courier(g);if(live(c)){c.expansionPhase='exit';c.expansionHeading=c.a+.55;c.speed=80;c.fire=Infinity;}}
/** Admission only: may warm artwork, never creates combat entities or consumes RNG. */
export function canSpawnExpansionWing(g,id){const profile=B[id],own=g.stageBoss?.stages?.teamFaction||g.teamFaction,p=pilot(g);if(!profile||!host(g)||g.state!=='playing'||!(p.hp>0)||(g.players?.length&&!g.players.some(p=>p.hp>0&&p.status!=='downed'))||!['central','entente'].includes(own)||own===profile.faction||g.mode==='campaign'||g.historicalMode||g.stage?.historicalAnchorDate||blocked(g)||!canAdmitSquadron(g,id)||!ready(profile.plane)||(id==='spa65'&&!ready(B.courierPlane))||(g.stageCombatWindow?.remaining??Infinity)<B.duration+8)return false;
 const es=(g.enemies||[]).filter(live);if(es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length+profile.count>(g.regularEnemyLimit?.()??12)||es.length+profile.count>(g.enemyCapacity?.()??65)-1)return false;
 // Conservative minimum native patrol cap: never borrow the optional fourth slot.
 if(id==='spa65'&&(g.patrols||[]).filter(p=>p.hp>0&&p.life>0).length>=3)return false;
 return true;
}
export function spawnExpansionWing(g,id){
 if(!canSpawnExpansionWing(g,id))return false;
 const profile=B[id],p=pilot(g);
 const v=arrivalViewport(g),a=p.a||0,dx=Math.cos(a),dy=Math.sin(a),distance=Math.min(Math.abs(dx)>.001?(v.w+110)/Math.abs(dx):Infinity,Math.abs(dy)>.001?(v.h+110)/Math.abs(dy):Infinity),group=(g.expansionSerial||0)+1,created=[],before=g.directorSpawning;g.directorSpawning=true;
 try{for(let i=0;i<profile.count;i++){const count=g.enemies.length,e=g.spawnEnemy?.('scout')||(g.enemies.length>count?g.enemies.at(-1):null);if(!e)break;for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','directorSquad','directorFormation','frontRoute','eliteKind','personalityId','normalFormationFamily','formationLeader','isFormationCommander','directorSignals','dangerHeavy','dangerAimUntil','dangerAimAngle','airArrival','arrivalPending'])delete e[k];const back=distance+(id==='spa65'?120+(i===2?20:i*22):(i===2?-35:i*35)),side=[-75,75,0,-145,145][i],hp=squadronHp(g,profile.hp,id==='spa65');Object.assign(e,{type:'scout',ace:false,expansionWingUnit:id,expansionWingGroup:group,expansionSlot:i,expansionFlankSide:Math.sign(side)||1,expansionPhase:'chase',expansionHeading:a,expansionPreparing:false,expansionFireIn:.7+i*.5,arrivalAuthored:true,missionTarget:true,battlefieldEventId:id+':'+group,escortPlane:profile.plane,visualScale:1,name:id==='jasta5'?'Jasta 5 · Green Tails':'SPA 65 · Escort Interception',faction:profile.faction,hp,maxHp:hp,speed:Math.min(380,pace(g)+120),energySpeed:1,fire:Infinity,hitRadius:20,contactRadius:17,x:v.x-dx*back-dy*side,y:v.y-dy*back+dx*side,a});setSpeed(e,e.speed);created.push(e);}}
 finally{g.directorSpawning=before}
 if(created.length!==profile.count){g.enemies=g.enemies.filter(e=>!created.includes(e));return false;}
 if(id==='spa65'){const token=`spa65-courier:${group}`,c={id:token,spa65Courier:true,courierSpa65:true,expansionWingGroup:group,expansionWingUnit:id,expansionPhase:'chase',expansionHeading:a,x:v.x-dx*distance-dy*35,y:v.y-dy*distance+dx*35,a,plane:B.courierPlane,faction:'central',hp:B.courierHp,maxHp:B.courierHp,life:60,speed:Math.min(360,pace(g)+100),fire:Infinity,invuln:0,hitFlash:0,altitude:p.altitude,think:Infinity,pass:0,target:null,waypoint:{x:v.x+dx*2000,y:v.y+dy*2000}};(g.patrols??=[]).push(c);}
 g.expansionSerial=group;g.expansionWing={unitId:id,groupId:group,phase:'chase',age:0,elapsed:0,acquired:0,activeIndex:2,retries:0,bursts:0,rounds:0,relayAge:0,relayIndex:2,stageKey:stage(g),lastTime:g.t||0};announceSquadron(g,id,group);return created[0];
}
function quiet(g,broken){const s=g.expansionWing;s.phase='quiet';s.age=0;s.acquired=0;s.broken=broken;for(const e of members(g)){e.expansionPreparing=false;e.expansionWarningLeft=0;e.expansionHeading=e.a+(e.expansionFlankSide||1)*.4;setSpeed(e,Math.max(80,pace(g)-30));}if(broken)g.event?.('wave','야스타 5 조준 끊김 · 조용한 선회 틈에 반격');}
export function tickExpansionWing(g,dt){const s=g.expansionWing;if(!s||!host(g)||!(dt>0))return;if(g.state!=='playing'){if(['lost','won','dead'].includes(g.state))withdrawExpansionWing(g,'run-ended');return;}dt=Math.min(.04,dt);if((g.t||0)<s.lastTime)withdrawExpansionWing(g,'restart');s.lastTime=g.t||0;
 let es=members(g),c=courier(g);if(s.unitId==='spa65')rememberSquadronFlight(g,es);if(!['exit','idle'].includes(s.phase)){if(blocked(g)||s.stageKey!==stage(g)||!(pilot(g).hp>0)){withdrawExpansionWing(g,'priority');return;}s.elapsed+=dt;s.age+=dt;const expired=s.unitId==='spa65'?s.elapsed>=B.duration+8||(s.engagedAt!=null&&s.elapsed-s.engagedAt>=B.duration):s.elapsed>=B.duration;if(expired){withdrawExpansionWing(g,'timeout');return;}
  if(s.unitId==='spa65'){if(!c||c.hp<=0||c.crashing){withdrawExpansionWing(g,'courier-lost');return;}if(!es.length){withdrawExpansionWing(g,'courier-saved');g.event?.('wave','연락기 보호 성공 · 남은 비행은 조용히 이탈');return;}if(!s.courierEntered&&(visible(g,c,-60)&&es.every(e=>visible(g,e,-20))||s.elapsed>=5.5)){s.courierEntered=true;s.relayAge=0;s.relayRounds=0;c.speed=pace(g);g.event?.('wave','아군 연락기 피격 위험 · 추격기를 끊거나 탄환을 가로막으세요');}
   s.relayAge+=dt;const current=es.find(e=>e.expansionSlot===s.relayIndex)||es[0];if(s.relayIndex!==current.expansionSlot){s.relayRounds=0;s.relayAge=0;}s.relayIndex=current.expansionSlot;const relay=es.indexOf(current);
   const candidates=es.slice(relay+1).concat(es.slice(0,relay)).filter(e=>Math.hypot(c.x-e.x,c.y-e.y)<330);
   candidates.sort((a,b)=>(a.expansionRelayVisits||0)-(b.expansionRelayVisits||0));
   const next=s.courierEntered&&s.relayAge>=relaySalvo(es)*1.4&&((s.relayRounds||0)>=relaySalvo(es)||s.relayAge>=5.5)&&(candidates[0]||(es.length===1?current:null));
   if(next){s.relayIndex=next.expansionSlot;s.relayAge=0;s.relayRounds=0;next.expansionFireIn=Math.min(next.expansionFireIn,.12);s.relayCount=(s.relayCount||0)+1;}
   for(const e of es){const active=e.expansionSlot===s.relayIndex;e.expansionRole=active?'tail-gun':'flanking';if(!s.courierEntered)setSpeed(e,Math.min(380,pace(g)+120));else if(active)setSpeed(e,Math.min(380,c.speed+(Math.hypot(c.x-e.x,c.y-e.y)>100?35:-5)));e.expansionFireIn-=dt;if(active&&s.courierEntered&&(s.relayRounds||0)<relaySalvo(es)&&e.expansionFireIn<=0){const n=g.bullets?.length||0;fireExpansionWing(g,e);e.expansionFireIn=(g.bullets?.length||0)>n?.55:.12;}}
  }else{
   const p=pilot(g),selected=es.find(e=>e.expansionSlot===s.activeIndex),active=selected||es[0];if(!selected&&active&&['warning','burst'].includes(s.phase)){s.activeIndex=active.expansionSlot;quiet(g,false);return;}if(!active){withdrawExpansionWing(g,'destroyed');return;}s.activeIndex=active.expansionSlot;
   if(s.phase==='chase'){if(s.retries>0&&s.age>6){withdrawExpansionWing(g,'evaded');return;}const d=Math.hypot(p.x-active.x,p.y-active.y),delta=Math.abs(angle(flightLeadHeading(active,{x:p.x,y:p.y,a:p.a,speed:pace(g)},420)-active.a));for(const e of es){const range=Math.hypot(p.x-e.x,p.y-e.y),gain=range>350?120:e===active?Math.max(-25,Math.min(35,(range-130)*.5)):35;setSpeed(e,Math.max(60,Math.min(380,pace(g)+gain)));}if(d<80){quiet(g,true);return;}s.acquired=visible(g,active,-20)&&delta<.27&&d<370?s.acquired+dt:0;if(s.acquired>=B.acquire){s.phase='warning';s.age=0;s.playerHeading=p.a||0;s.lockedHeading=active.a;active.expansionPreparing=true;active.expansionWarningLeft=B.warning;for(const e of es)e.expansionHeading=e.a;g.event?.('wave','야스타 5 꼬리 조준 · 방향을 꺾어 준비 사격을 끊으세요');}}
   else if(s.phase==='warning'){active.expansionWarningLeft=Math.max(0,B.warning-s.age);if(Math.abs(angle((p.a||0)-s.playerHeading))>=B.breakAngle){quiet(g,true);return;}if(s.age>=B.warning){s.phase='burst';s.age=0;s.rounds=0;active.expansionPreparing=false;}}
   else if(s.phase==='burst'){if(s.rounds<3&&s.age>=s.rounds*.15){const n=g.bullets?.length||0;fireExpansionWing(g,active);if((g.bullets?.length||0)>n)s.rounds++;}if(s.age>=.36&&s.rounds>=3||s.age>=1.56){s.bursts++;quiet(g,false);}}
   else if(s.phase==='quiet'&&s.age>=B.quiet){if((s.broken&&s.retries>=B.maxBreaks-1)||s.bursts>=B.maxBursts){withdrawExpansionWing(g,'departed');return;}if(s.broken)s.retries++;s.activeIndex=es[(es.findIndex(e=>e.expansionSlot===s.activeIndex)+1)%es.length].expansionSlot;s.phase='chase';s.age=0;s.acquired=0;const p=pilot(g);for(const e of es){const side=-(e.x-p.x)*Math.sin(p.a)+(e.y-p.y)*Math.cos(p.a);e.expansionFlankSide=Math.abs(side)>5?Math.sign(side):(e.expansionSlot?1:-1);}}
  }
 }
 // This is the courier's only integration path. Native patrol crash motion remains native.
 c=courier(g);if(c&&live(c)&&c.life>0){if(c.expansionPhase==='exit')c.speed=pace(g)+120;c.invuln=Math.max(0,(c.invuln||0)-dt);c.hitFlash=Math.max(0,(c.hitFlash||0)-dt);c.life-=dt;const turn=angle(c.expansionHeading-c.a);c.a+=Math.max(-.7*dt,Math.min(.7*dt,turn));c.x+=Math.cos(c.a)*c.speed*dt;c.y+=Math.sin(c.a)*c.speed*dt;c.fire=Infinity;if(c.expansionPhase==='exit'&&!visible(g,c,110))g.patrols=g.patrols.filter(p=>p!==c);}
 for(const e of es)if(e.expansionPhase==='exit'){setSpeed(e,pace(g)+120);if(!visible(g,e,110))g.enemies=g.enemies.filter(x=>x!==e);}if(!members(g).length&&!(courier(g)?.hp>0))s.phase='idle';
}
// Formation separation changes only steering and speed, never positions.
// Predict closest approach so the yielding wing rolls out before silhouettes overlap.
function separatedHeading(g,e,heading,yielding){if(!yielding)return heading;const other=members(g).filter(x=>x!==e).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(!other)return heading;const rx=e.x-other.x,ry=e.y-other.y,vx=Math.cos(e.a)*e.speed-Math.cos(other.a)*other.speed,vy=Math.sin(e.a)*e.speed-Math.sin(other.a)*other.speed,d=Math.hypot(rx,ry),t=Math.max(0,Math.min(1.1,-(rx*vx+ry*vy)/(vx*vx+vy*vy||1))),near=Math.hypot(rx+vx*t,ry+vy*t);if(d<280&&near<95){const cross=-Math.sin(other.a)*rx+Math.cos(other.a)*ry,side=Math.abs(cross)>3?Math.sign(cross):(e.expansionSlot?1:-1);heading=other.a+side*1.05;if(d<160)setSpeed(e,Math.max(65,Math.min(e.speed,other.speed-45)));e.expansionYielding=true;}else e.expansionYielding=false;return heading;}
function escortSeparation(g,e,heading,target){
 const es=members(g);for(const wing of es)wing.expansionAvoidSlot=wing.expansionSlot===g.expansionWing.relayIndex?0:wing.expansionSlot+1;
 const traffic=[{x:target.x,y:target.y,a:target.a,speed:target.speed,expansionAvoidSlot:-1},...es];
 return squadronClearance(g,e,heading,traffic,'expansionAvoidSlot',-1,1.05,e.expansionSlot===g.expansionWing.relayIndex?50:80);
}
export function expansionSteering(g,e){if(e.expansionWingGroup==null)return null;const s=g.expansionWing,target=s?.unitId==='spa65'?courier(g):pilot(g);const chase=e.expansionPhase!=='exit'&&(s?.unitId==='spa65'||s?.phase==='chase');let tx=target?.x,ty=target?.y;const inactive=s?.unitId==='jasta5'?e.expansionSlot!==s.activeIndex:e.expansionSlot!==s?.relayIndex;
 if(chase&&target&&s.unitId==='spa65'){
  // Bring the whole five-aircraft group into view before slowing the courier.
  // Each reserve then tracks its own moving slot instead of circling a shared point.
  if(!s.courierEntered)return {delta:angle(e.expansionHeading-e.a),turn:1.05};
  if(inactive){const side=[-95,95,0,-145,145][e.expansionSlot]??0,back=[155,155,230,65,65][e.expansionSlot]??155,a=target.a||0;
   tx-=Math.cos(a)*back+Math.sin(a)*side;ty+=Math.cos(a)*side-Math.sin(a)*back;
   const vx=Math.cos(a)*target.speed+(tx-e.x)*.8,vy=Math.sin(a)*target.speed+(ty-e.y)*.8;
   setSpeed(e,Math.max(60,Math.min(380,Math.hypot(vx,vy))));
   return {delta:angle(escortSeparation(g,e,Math.atan2(vy,vx),target)-e.a),turn:1.05};
  }
 }
 if(chase&&target&&inactive&&(s.unitId==='jasta5'||inactive)){const a=target.a||0,side=(s.unitId==='spa65'&&e.expansionSlot===2?(s.relayIndex===0?-1:1):(e.expansionFlankSide||(e.expansionSlot===0?-1:1)))*(e.expansionSlot>=3?155:s.unitId==='jasta5'?115:105),back=s.unitId==='jasta5'?(e.expansionSlot>=3?180:e.expansionSlot===2?190:120):e.expansionSlot>=3?45:80;tx-=Math.cos(a)*back+Math.sin(a)*side;ty+=Math.cos(a)*side-Math.sin(a)*back;}
 let heading=chase&&target?Math.atan2(ty-e.y,tx-e.x):e.expansionHeading;if(chase&&inactive&&s.unitId==='jasta5'){const ca=Math.cos(target.a),sa=Math.sin(target.a),dx=tx-e.x,dy=ty-e.y,forward=Math.max(30,pace(g)+(dx*ca+dy*sa)*.65),side=(-dx*sa+dy*ca)*.65,vx=ca*forward-sa*side,vy=sa*forward+ca*side;heading=Math.atan2(vy,vx);setSpeed(e,Math.max(60,Math.min(380,Math.hypot(vx,vy))));}if(chase&&s.unitId==='spa65'&&!inactive)heading=escortSeparation(g,e,flightLeadHeading(e,target),target);if(chase&&s.unitId==='jasta5'&&!inactive)heading=flightLeadHeading(e,{x:target.x,y:target.y,a:target.a,speed:pace(g)},420);if(e.expansionPhase==='exit'&&s.unitId==='spa65')heading=squadronClearance(g,e,heading,members(g),'expansionSlot',s.relayIndex,1.05,100);if(e.expansionPhase!=='exit'&&s.unitId!=='spa65')heading=separatedHeading(g,e,heading,inactive||(s.unitId==='jasta5'&&s.phase==='chase'));return {delta:angle(heading-e.a),turn:1.05};}
export function fireExpansionWing(g,e){if(e.expansionWingGroup==null)return false;e.fire=Infinity;const s=g.expansionWing;if(!host(g)||g.state!=='playing'||!live(e)||e.expansionPhase==='exit'||s?.groupId!==e.expansionWingGroup||s.unitId!==e.expansionWingUnit||!visible(g,e,-20)||g.sunStrikeContains?.(e)||(g.bullets?.length||0)>=180)return true;
 const target=s.unitId==='spa65'?courier(g):pilot(g);if(!target||target.hp<=0||target.fogHidden||target.kaiserFogTime>0||target.ballCloak>0||target.cloudConceal>0)return true;let heading=e.a;
 if(s.unitId==='jasta5'){if(s.phase!=='burst'||s.rounds>=3||e.expansionSlot!==s.activeIndex||e.expansionLastRound===s.bursts+':'+s.rounds)return true;heading=s.lockedHeading;e.expansionLastRound=s.bursts+':'+s.rounds;}
 else{if(e.expansionSlot!==s.relayIndex||s.phase!=='chase'||!s.courierEntered||(s.relayRounds||0)>=relaySalvo(members(g))||!visible(g,target,-20)||Math.hypot(target.x-e.x,target.y-e.y)>340||Math.abs(angle(flightLeadHeading(e,target)-e.a))>.15)return true;}
 if(s.unitId==='spa65'){
  const rx=target.x-e.x-Math.cos(heading)*25,ry=target.y-e.y-Math.sin(heading)*25,vx=Math.cos(heading)*330-Math.cos(target.a)*target.speed,vy=Math.sin(heading)*330-Math.sin(target.a)*target.speed,t=(rx*vx+ry*vy)/(vx*vx+vy*vy||1);
  if(t<0||t>1.7||Math.hypot(rx-vx*t,ry-vy*t)>14)return true;
 }
 (g.bullets??=[]).push({x:e.x+Math.cos(heading)*25,y:e.y+Math.sin(heading)*25,vx:Math.cos(heading)*(s.unitId==='jasta5'?420:330),vy:Math.sin(heading)*(s.unitId==='jasta5'?420:330),life:1.8,enemy:true,damage:s.unitId==='spa65'?squadronCourierDamage(g):squadronDamage(g,10),visualType:'scout',sourceX:e.x,sourceY:e.y,expansionWingGroup:s.groupId,expansionWingUnit:s.unitId,expansionSlot:e.expansionSlot});if(s.unitId==='spa65'){s.engagedAt??=s.elapsed;if(!s.relayRounds)e.expansionRelayVisits=(e.expansionRelayVisits||0)+1;s.relayRounds=(s.relayRounds||0)+1;}e.muzzleFlash=.12;e.gunAim=heading;g.event?.('enemyShot','');return true;}
export function installExpansionCombat(Game){const p=Game.prototype;if(Object.hasOwn(p,'__expansionCombat'))return;p.__expansionCombat=true;const steer=p.dogfightSteering;p.dogfightSteering=function(e,...args){return expansionSteering(this,e)||steer.call(this,e,...args)};const fire=p.fireEnemy;p.fireEnemy=function(e,...args){if(!fireExpansionWing(this,e))return fire.call(this,e,...args)};
 const patrol=p.updatePatrols;if(patrol)p.updatePatrols=function(...args){if(this._expansionPatrolGuard)return patrol.apply(this,args);const held=(this.patrols||[]).filter(p=>p.spa65Courier&&p.hp>0&&!p.crashing&&p.life>0);if(!held.length)return patrol.apply(this,args);this._expansionPatrolGuard=true;this._expansionHeldCouriers=held;this.patrols=this.patrols.filter(p=>!held.includes(p));try{return patrol.apply(this,args)}finally{for(const c of held)if(!this.patrols.includes(c))this.patrols.push(c);delete this._expansionHeldCouriers;delete this._expansionPatrolGuard;}};
 const spawn=p.spawnPatrol;if(spawn)p.spawnPatrol=function(...args){const held=this._expansionHeldCouriers;if(this._expansionSpawnGuard||!held?.length)return spawn.apply(this,args);this._expansionSpawnGuard=true;this.patrols.push(...held);try{return spawn.apply(this,args)}finally{this.patrols=this.patrols.filter(p=>!held.includes(p));delete this._expansionSpawnGuard;}};
}

/** Asset-only prefetch, independent of combat admission and RNG. */
export function warmExpansionArt(id){if(!B[id])return false;const ok=ready(B[id].plane);return id==='spa65'?ready(B.courierPlane)&&ok:ok;}
