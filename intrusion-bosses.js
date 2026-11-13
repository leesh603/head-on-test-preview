import {initializeRII,stepRIIMotion,stepRIICombat,beginRIIDestruction,stepRIIDestruction,locateRIIIntrusionHit} from './rii-intrusion.js';
import {stepGiantArrivalShadow} from './giant-intrusion-arrival.js';
import {initializeV1500,stepV1500Motion,stepV1500Combat,beginV1500Destruction,stepV1500Destruction} from './handley-page-v1500.js';
import {majorEncounterBlocked} from './encounter-admission.js';
import {hullOverlap} from './adriatic-boss-layout.js?v=tame3';
import {submarineObstacles,guardSubmarineMovement} from './naval-spacing.js?v=pandemonium394r2';
/** Host-authoritative optional encounters. No stage advancement or regular-boss rewards. */
import {isNewSubmarine,submarineSteering,stepSubmarineTorpedoes,placeSubmarineContact,submarinePhase} from './submarine-intrusion.js';
import {queueArtilleryMuzzle} from './artillery-fx.js?v=20261026';
import { intrusionLayout, ownHullClear } from './intrusion-boss-layouts.js';
import {MARITIME_PROFILES,isMaritimeIntrusion,maritimeAttackable,maritimeDamageMultiplier,stepMaritimeMotion,stepMaritimeTransit,stepMaritimeWreck,maritimeWeaponsReady,revealMaritimeDecoy,aimMaritimeGuns,queueMaritimeAttack,maritimeAttackInterval,placeMaritimeContact} from './maritime-intrusion.js';
import {enqueueIntrusionEquipmentReward} from './intrusion-equipment-rewards.js';
import {stepIntrusionSignature} from './intrusion-signatures.js';
export const intrusionProfiles = Object.freeze({
 ...MARITIME_PROFILES,
 bastion:{id:'bastion',name:'바스티옹',faction:'entente',mode:'armored-loiter',enabled:true,stages:[0,2,3,4,5,12],detail:'장갑을 벗겨 기낭을 노려라',independentBarrels:false,artStatus:'user-supplied whole turrets; no independent barrels; damaged barrels cease fire; destroyed turrets removed without wreck imagery'},
 'armed-svyatogor':{id:'armed-svyatogor',name:'무장형 스뱌토고르',faction:'entente',mode:'transmission-sweep',enabled:true,stages:[0,2,3,5],detail:'구동부를 끊고 기총 좌석을 제압하라',artStatus:'fictional armed operational Slesarev prototype; two internal engines and two driven propellers; six gunner assemblies'},
 'handley-page-v1500':{id:'handley-page-v1500',name:'핸들리 페이지 V/1500',faction:'entente',mode:'heavy-bombing-run',enabled:true,stages:[0,2,3,5],detail:'폭격 항로를 벗어나 앞뒤 엔진을 끊어라',artStatus:'Four Eagle engines in two tandem pairs; tractor two-blade and pusher four-blade propellers; gameplay gun arcs and Cooper asset reuse'},
 'twin-fortress': {id:'twin-fortress',name:'쌍동 공중요새',faction:'central',mode:'loiter',enabled:true,stages:[0,2,3,5,10],detail:'한쪽 포대를 무너뜨려라'},
 goliath:{id:'goliath',name:'골리앗',faction:'central',mode:'pass',enabled:true,stages:[0,4,5,15],detail:'외측 엔진을 끊어라'},
 leviathan:{id:'leviathan',name:'리바이어던',faction:'entente',mode:'s-pass',enabled:true,stages:[1,7,16],detail:'한쪽 외익을 무너뜨려라'},
 citadel:{id:'citadel',name:'시타델',faction:'entente',mode:'diagonal-broadside',enabled:true,stages:[2,3,4,5,12],detail:'현측 포대를 먼저 끊어라',artStatus:'intact-modules; damaged-engine-art-unavailable'},
 'linke-hofmann-r-ii':{id:'linke-hofmann-r-ii',name:'링케호프만 R.II',faction:'central',mode:'shared-drive-bomber',enabled:true,stages:[0,2,3,5],detail:'후방 기총을 피하고 공통 구동부를 끊어라'}
});
const giant=e=>['handley-page-v1500','linke-hofmann-r-ii'].includes(e?.profileId);
const finite=(n,d=0)=>Number.isFinite(n)?n:d, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const alive=g=>(g.players||[g]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
const emit=(g,e)=>(g.events||=[]).push(e);
const director=g=>g.intrusionDirector||(g.intrusionDirector={used:false,rolledRegions:{},serial:0});
const phase=e=>e&& !['resolved','destroyed'].includes(e.phase);
export const intrusionActive=g=>!!phase(g.intrusionBoss);
const local=(e,x,y)=>{const a=-(e.a+Math.PI/2),dx=(x-e.x)/e.scale,dy=(y-e.y)/e.scale;return{x:dx*Math.cos(a)-dy*Math.sin(a),y:dx*Math.sin(a)+dy*Math.cos(a)}};
export function intrusionWorldPoint(e,p){const a=e.a+Math.PI/2;return{x:e.x+e.scale*(p.x*Math.cos(a)-p.y*Math.sin(a)),y:e.y+e.scale*(p.x*Math.sin(a)+p.y*Math.cos(a))};}
/** Exact closest point of a segment in ellipse-normalized space (includes both endpoints). */
export function segmentHitsEllipse(a,b,s,pad=0){const c=Math.cos(-(s.angle||0)),n=Math.sin(-(s.angle||0)),rx=Math.max(.001,s.rx+pad),ry=Math.max(.001,s.ry+pad);const cv=p=>({x:((p.x-s.x)*c-(p.y-s.y)*n)/rx,y:((p.x-s.x)*n+(p.y-s.y)*c)/ry});a=cv(a);b=cv(b);const dx=b.x-a.x,dy=b.y-a.y,t=clamp(-(a.x*dx+a.y*dy)/(dx*dx+dy*dy||1),0,1);return(a.x+t*dx)**2+(a.y+t*dy)**2<=1;}
export const intrusionPartExposed=(e,id)=>e.profileId!=='qship'||id==='core'||maritimeWeaponsReady(e);
export function locateIntrusionHit(g,hit){const e=g.intrusionBoss;if(!e||!maritimeAttackable(e)||!['entering','active'].includes(e.phase)||!Number.isFinite(hit.x)||!Number.isFinite(hit.y))return null;if(e.profileId==='linke-hofmann-r-ii'){const partId=locateRIIIntrusionHit(e,hit.x,hit.y,Math.max(0,finite(hit.radius)),finite(hit.previousX,hit.x),finite(hit.previousY,hit.y),hit.actualExplosion===true);return partId?{partId,encounterId:e.encounterId,x:hit.x,y:hit.y}:null;}const b=local(e,hit.x,hit.y),a=local(e,finite(hit.previousX,hit.x),finite(hit.previousY,hit.y)),r=Math.max(0,finite(hit.radius))/e.scale;const targets=intrusionLayout(e.profileId).targets.filter(t=>e.parts[t.id]?.hp>0&&intrusionPartExposed(e,t.id)).sort((a,b)=>(a.id==='core')-(b.id==='core')||a.rx*a.ry-b.rx*b.ry);const t=targets.find(t=>segmentHitsEllipse(a,b,t,r));return t?{partId:t.id,encounterId:e.encounterId,x:hit.x,y:hit.y}:null;}
function clean(g,e){if(!e)return;g.bullets=(g.bullets||[]).filter(b=>b.intrusionEncounterId!==e.encounterId);e.hazards=[];e.shotCues=[];e.firingCourse=null;if(e.naval)e.naval.torpedoes=[];if(e.profileId==='linke-hofmann-r-ii'){e.riiShots=[];if(e.rii)e.rii.visualBombs=[];}if(e.profileId==='handley-page-v1500'){e.releasedBombs=[];e.v1500Shots=[];e.bayAmmo=0;}}
export function disposeIntrusion(g,reason='disposed'){const e=g.intrusionBoss;if(e){clean(g,e);const wasResolved=e.phase==='resolved';e.phase='resolved';e.reason=reason;e.phaseAge=0;if(giant(e)&&e.pendingFinalEquipment){e.pendingFinalEquipment=false;enqueueIntrusionEquipmentReward(g,e.encounterId);}if(!wasResolved)emit(g,{type:'intrusionResolved',encounterId:e.encounterId,bossId:e.profileId,reason});}return e;}
function retreat(g,e,reason){if(['retreating','resolved','destroyed'].includes(e.phase))return;clean(g,e);e.phase='retreating';e.phaseAge=0;e.reason=reason;emit(g,{type:'intrusionRetreat',encounterId:e.encounterId,bossId:e.profileId,reason});}
function reward(g,e,key,amount,heal=false){if(e.rewarded[key])return;e.rewarded[key]=true;const p=alive(g)[0]||g;const gems=amount>0?(g.xpGemSplits?.(amount)||[amount]):[];g.drops||=[];gems.forEach((v,i)=>g.drops.push({x:finite(p.x)+Math.cos(i*2.4)*45,y:finite(p.y)+Math.sin(i*2.4)*45,value:v,heal:false,bossReward:true,intrusionRewardId:`${e.encounterId}/${key}/${i}`}));if(heal)g.drops.push({x:finite(p.x),y:finite(p.y),value:0,heal:true,bossReward:true,intrusionRewardId:`${e.encounterId}/${key}/heal`});}
// Game-design armor exposure, not a claim of separate illustrated gasbag cavities.
export function bastionArmorMultiplier(e){const remaining=Object.values(e.parts||{}).filter(p=>p.kind==='armor'&&p.hp>0).length;return remaining>=4?.6:remaining>=2?1:1.25;}
/** Transmission loss is local encounter state, so host snapshots preserve the weakness. */
export function svyatogorPower(e){
 const live=id=>e.parts?.[id]?.hp>0;
 return live('engine_bay')?Number(live('drive_port'))+Number(live('drive_starboard')):0;
}
export function intrusionPartCanFire(e,id){const p=e.parts[id];return !!p&&p.hp>0&&maritimeAttackable(e)&&maritimeWeaponsReady(e)&&(!(e.profileId==='dreadnought'&&p.kind==='anti_air')||p.hp>p.maxHp*.5)&&(!['bastion','armed-svyatogor'].includes(e.profileId)||p.hp>p.maxHp*.5);}
function breakPart(g,e,id,broken){const p=e.parts[id];if(!p||p.state==='destroyed')return;(e.destroyedTurretAngles||={})[id]=finite(e.turretAngles?.[id]);p.hp=0;p.state='destroyed';broken.push(id);{const t=intrusionLayout(e.profileId).targets.find(t=>t.id===id);if(t&&id!=='core'&&g.combatBlast){const w=intrusionWorldPoint(e,t);g.combatBlast(w.x,w.y,Math.max(34,Math.min(90,Math.max(t.rx,t.ry)*e.scale*1.2)),'enemy','structure');}}reward(g,e,id,p.reward||0);for(const t of intrusionLayout(e.profileId).targets)if(t.dependencies?.includes(id))breakPart(g,e,t.id,broken);if(id!=='core')e.hp=Math.max(0,e.hp-e.maxHp*(p.kind==='wing'?.09:p.kind==='float'?.01:.025));if(e.profileId==='bastion'&&p.kind==='armor'){e.damage||={};e.damage.envelope='damaged';}emit(g,{type:'intrusionPartDestroyed',encounterId:e.encounterId,partId:id});}
export function hitIntrusionAt(g,hit){const e=g.intrusionBoss,located=hit.partId&&e&&maritimeAttackable(e)&&['entering','active'].includes(e.phase)&&e.parts[hit.partId]?.hp>0&&intrusionPartExposed(e,hit.partId)?{partId:hit.partId,encounterId:e.encounterId}:locateIntrusionHit(g,hit);if(!located)return{damage:0,actualDamage:0,broken:[]};if(hit.hitKey!=null&&e.hitKeys.includes(String(hit.hitKey)))return{damage:0,actualDamage:0,broken:[]};const exposed=e.profileId==='twin-fortress'&&located.partId==='core'&&Object.values(e.parts).filter(p=>p.kind==='turret_body'&&p.hp<=0).length>=2;const damage=Math.max(0,finite(hit.damage))*(exposed?1.3:1)*(e.profileId==='bastion'&&located.partId==='core'?bastionArmorMultiplier(e):1)*maritimeDamageMultiplier(e,located.partId);if(!damage)return{damage:0,actualDamage:0,broken:[]};revealMaritimeDecoy(e);if(hit.hitKey!=null)e.hitKeys.push(String(hit.hitKey));const p=e.parts[located.partId],actual=Math.min(p.hp,damage),broken=[];p.hp-=actual;(e.flash||={})[located.partId]=.12;p.state=p.hp<=0?'damaged':p.hp<=p.maxHp*.5?'damaged':'intact';if(located.partId==='core')e.hp=p.hp;else e.hp=Math.max(0,e.hp-actual*.2);if(p.hp<=0)breakPart(g,e,located.partId,broken);if(isNewSubmarine(e)&&Object.entries(e.parts).filter(([id])=>id!=='core').every(([,part])=>part.hp<=0))e.hp=0;e.parts.core.hp=e.hp;if(e.hp<=0){e.phase='destroyed';e.phaseAge=0;clean(g,e);if(e.profileId==='handley-page-v1500')beginV1500Destruction(g,e);if(e.profileId==='linke-hofmann-r-ii')beginRIIDestruction(g,e);if(!giant(e)&&g.combatBlast){const{L,S}=hull(e);for(let i=0;i<5;i++){const k=i/4-.5;g.combatBlast(e.x+Math.cos(e.a)*L*k*.8+Math.cos(e.a+Math.PI/2)*S*.18*(i%2?1:-1),e.y+Math.sin(e.a)*L*k*.8+Math.sin(e.a+Math.PI/2)*S*.18*(i%2?1:-1),70+i*8,'enemy','structure');}}if(!e.rewarded.final){e.rewarded.final=true;if(giant(e))e.pendingFinalEquipment=true;else enqueueIntrusionEquipmentReward(g,e.encounterId);g.kills=finite(g.kills)+1;const owner=g.players?.find(p=>p.id===hit.ownerId);if(owner)owner.kills=finite(owner.kills)+1;emit(g,{type:'intrusionDestroyed',bossId:e.profileId,encounterId:e.encounterId});}}return{...located,damage:actual,actualDamage:actual,broken};}
function blocked(g,c){return c.blocked||g.pendingLevelUps?.length||g._aceCombatActive?.size||g.eliteEnemies?.active||g.battlefieldMission?.status==='active'||g.ruralFronts?.active||g.stageBoss?.encounter?.active;}
function start(g,id,c){const profile=intrusionProfiles[id];if(!profile?.enabled)return null;const d=director(g),layout=intrusionLayout(id),w=Math.max(180,finite(c.width,800)),h=Math.max(240,finite(c.height,600)),maxHp=Math.round(finite(c.regularBossHp,2100*(1+finite(g.t)/150)*(1+1.2*finite(c.loopIndex)+.35*finite(c.loopIndex)**2))*(profile.hpRatio??(['loiter','armored-loiter'].includes(profile.mode)?.65:.55))),budget=Math.min(36,12+finite(c.stageIndex)*2+finite(c.loopIndex)*4),parts={};let weight=layout.targets.filter(t=>t.id!=='core'&&t.kind!=='decal').reduce((n,t)=>n+(t.kind==='wing'?2:1),0),assigned=0,cumulative=0;for(const t of layout.targets){if(t.kind==='decal')continue;const hp=t.id==='core'?maxHp:Math.round(maxHp*(t.kind==='wing'?.17:t.kind==='engine'?.065:.085));if(t.id!=='core')cumulative+=(t.kind==='wing'?2:1)/weight;const allocation=t.id==='core'?0:Math.round(budget*.6*cumulative)-assigned;if(t.id!=='core')assigned+=allocation;parts[t.id]={kind:t.kind,hp,maxHp:hp,state:'intact',reward:allocation};}
 const e={profileId:id,bossId:id,encounterId:`${g.runId||'run'}/intrusion/${++d.serial}`,phase:'reserved',phaseAge:0,age:0,activeAge:0,stageIndex:c.stageIndex,loopIndex:c.loopIndex||0,x:finite(g.x),y:finite(g.y)-h*(isMaritimeIntrusion(id)?.18:.7),a:-Math.PI/2,scale:isNewSubmarine(id)?Math.min(id==='m1'?400:320,h*.62)/layout.height:isMaritimeIntrusion(id)?Math.min((w-80)/layout.width,h*.66/layout.height):Math.min((w-128)/Math.max(layout.width,layout.height),h*.62/(['pass','s-pass','diagonal-broadside'].includes(profile.mode)?Math.max(layout.width,layout.height):layout.height)),width:w,height:h,maxHp,hp:maxHp,parts,turretAngles:{},hazards:[],shotCues:[],hitKeys:[],rewarded:{},finalReward:Math.round(budget*.6),attackClock:isMaritimeIntrusion(id)||id==='citadel'?1.2:.2,volley:0,route:null};g.intrusionBoss=e;if(id==='handley-page-v1500'){e.scale=Math.min(w*.78,620)/1774;initializeV1500(e);}if(id==='linke-hofmann-r-ii'){e.scale=Math.min(w*.78,620)/1800;initializeRII(e);}d.used=true;
 // Reject a known crowded contact before its name/HUD/cutin is announced.
 // The normal entering-time check still handles traffic arriving during warning.
 if(isMaritimeIntrusion(e)){
  const p=alive(g)[0]||g,a=finite(p.a,-Math.PI/2),vx=finite(p.vx,Math.cos(a)*finite(p.speed)),vy=finite(p.vy,Math.sin(a)*finite(p.speed)),lead=Math.min(w,h)*.18;
  if(!placeMaritimeContact(g,e,layout,finite(p.x)+vx*3+Math.cos(a)*lead,finite(p.y)+vy*3+Math.sin(a)*lead,false,a))rejectMaritimeContact(g,e);
 }
 return e;}
function rejectMaritimeContact(g,e){const d=director(g);d.used=false;d.rolledRegions[`${e.loopIndex||0}/${e.stageIndex}`]=true;disposeIntrusion(g,'traffic-blocked');}

export function forceIntrusionForTest(g,id,c={}){if(!intrusionProfiles[id])return null;return start(g,id,c);}
function visible(g,e,p){return Math.abs(p.x-finite(g.x))<e.width*.48&&Math.abs(p.y-finite(g.y))<e.height*.48;}
function intrusionVelocity(p){
 const heading=finite(p.a,-Math.PI/2),speed=finite(p.baseSpeed,p.speed||0)*finite(p.pilotFlightFraction,1);
 return {vx:finite(p.vx,Math.cos(heading)*speed),vy:finite(p.vy,Math.sin(heading)*speed)};
}
function citadelTurnImpact(g,e,p,warning){
 const {vx,vy}=intrusionVelocity(p),speed=Math.hypot(vx,vy),turn=e.citadelTurn||0;
 if(speed<10||Math.abs(turn)<.05)return predictBombImpact(g,e,p,warning);
 const heading=Math.atan2(vy,vx);
 const at=t=>({x:p.x+speed*(Math.sin(heading+turn*t)-Math.sin(heading))/turn,y:p.y+speed*(Math.cos(heading)-Math.cos(heading+turn*t))/turn});
 const impact=at(warning),approach=at(warning-.65);
 return visible(g,e,{x:impact.x-approach.x+p.x,y:impact.y-approach.y+p.y})?impact:null;
}
function predictBombImpact(g,e,p,warning,lateral=0,forward=0){
 const heading=finite(p.a,-Math.PI/2),{vx,vy}=intrusionVelocity(p);
 const x=p.x+vx*warning-Math.sin(heading)*lateral+Math.cos(heading)*forward;
 const y=p.y+vy*warning+Math.cos(heading)*lateral+Math.sin(heading)*forward;
 // Once placed, the warning stays in world space. On a continuing heading
 // the impact ring must enter the viewport at least 0.65s before detonation.
 const approach=warning-.65;
 if(visible(g,e,{x:x-vx*approach,y:y-vy*approach}))return{x,y};
 return null;
}
export function ownBodyClear(e,group,muzzle,angle,length=1500){if(intrusionLayout(e.profileId).shotOcclusion)return ownHullClear(e.profileId,group,muzzle,angle,length,Object.fromEntries(Object.entries(e.parts).map(([k,v])=>[k,v.state])));const end={x:muzzle.x+Math.cos(angle)*length,y:muzzle.y+Math.sin(angle)*length};return ownHullClear(e.profileId,group,muzzle,angle,length,Object.fromEntries(Object.entries(e.parts).map(([k,v])=>[k,v.state])))&&!intrusionLayout(e.profileId).targets.some(t=>t.id!==group&&e.parts[t.id]?.hp>0&&segmentHitsEllipse(muzzle,end,t,1));}
function airGunTarget(e,p){
 const {vx,vy}=intrusionVelocity(p);
 const lead=.85+clamp(Math.hypot(p.x-e.x,p.y-e.y)/310,.15,.8);
 return local(e,p.x+(vx-finite(e.worldVx))*lead,p.y+(vy-finite(e.worldVy))*lead);
}
// Complete turret artwork has only a narrow traverse. Commit the whole
// airframe to its firing course instead of rotating the warning at the pilot.
function commitFiringCourse(e){
 const pending=e.shotCues.filter(q=>!q.done);
 // A course held only for a signature attack leaves the regular attack clock alone.
 if(pending.length)e.firingCourse={signature:pending.every(q=>q.signature),a:e.a,speed:Math.max(0,finite(e.worldVx)*Math.cos(e.a)+finite(e.worldVy)*Math.sin(e.a)),remaining:Math.max(...pending.map(q=>q.warning+((q.rounds||1)-1)*.14-q.age))+.35};
}
function queueAttack(g,e){
 const l=intrusionLayout(e.profileId);
 // Dispatch by profile; an empty maritime solution must not fall through to air attacks.
 if(isMaritimeIntrusion(e))return queueMaritimeAttack(g,e,l,{alive,local,world:intrusionWorldPoint,visible,predictImpact:predictBombImpact,clear:ownBodyClear,canFire:intrusionPartCanFire});
 const ps=alive(g);if(!ps.length)return false;
 const p=ps[e.volley%ps.length],target=airGunTarget(e,p),guns=l.targets.filter(t=>t.muzzle),side=e.volley%2?-1:1;
 const group=gun=>e.profileId==='armed-svyatogor'?guns.indexOf(gun)%2:e.profileId==='bastion'?Math.floor((Number(gun.id.split('_').at(-1))-1)/2):gun.x<0?-1:1;
 const preferred=e.profileId==='armed-svyatogor'?e.volley%2:e.profileId==='bastion'?e.volley%3:side;
 const grouped=['armed-svyatogor','bastion','twin-fortress','leviathan','citadel'].includes(e.profileId);
 const eligible=[],lanes=[];
 for(const gun of guns){
  if(!intrusionPartCanFire(e,gun.id))continue;
  const barrelIndex=gun.muzzles?.length?e.volley%gun.muzzles.length:0,m=gun.muzzles?.[barrelIndex]||gun.muzzle,delta=finite(e.turretAngles[gun.id]),a=m.angle+delta,c=Math.cos(delta),s=Math.sin(delta);
  const muzzle={x:m.pivotX+(m.x-m.pivotX)*c-(m.y-m.pivotY)*s,y:m.pivotY+(m.x-m.pivotX)*s+(m.y-m.pivotY)*c},wp=intrusionWorldPoint(e,muzzle);
  const error=Math.atan2(Math.sin(Math.atan2(target.y-muzzle.y,target.x-muzzle.x)-a),Math.cos(Math.atan2(target.y-muzzle.y,target.x-muzzle.x)-a));
  // Test the actual target bearing, not a bearing already clamped to the mount.
  if(!visible(g,e,wp)||!ownBodyClear(e,gun.id,muzzle,a))continue;
  const choice={gun,barrelIndex,muzzle,wp,a};
  if(Math.abs(error)<=.22)eligible.push(choice);
  else if(['bastion','twin-fortress','citadel'].includes(e.profileId)){
   const dx=(target.x-muzzle.x)*e.scale,dy=(target.y-muzzle.y)*e.scale;
   // Fixed complete turrets can deny a visible approach lane, not falsely aim
   // through their stops. Do not fire away from the player into empty space.
   const along=dx*Math.cos(a)+dy*Math.sin(a),across=Math.abs(dx*Math.sin(a)-dy*Math.cos(a));
   if(along>0&&along<e.height*.8&&across<Math.min(240,e.width*.45))lanes.push({...choice,suppression:true,telegraphLength:Math.min(e.height*.8,Math.max(150,along+60))});
  }
 }
 // Keep each design's staggered battery rhythm, but never waste a whole cycle
 // on the opposite, ineligible side when an intact battery has a real solution.
 if(!eligible.length)eligible.push(...lanes);
 const chosen=eligible.some(q=>group(q.gun)===preferred)?preferred:eligible.length?group(eligible[0].gun):preferred;
 let queued=0;
 for(const {gun,barrelIndex,muzzle,wp,a,suppression=false,telegraphLength} of eligible){
  if(grouped&&group(gun)!==chosen)continue;
  e.shotCues.push({...wp,localMuzzle:muzzle,barrelIndex,localAngle:a,a:a+e.a+Math.PI/2,partId:gun.id,age:0,telegraphLength,aimMode:suppression?'lane':'target',warning:e.profileId==='citadel'?(suppression?1.4:1):suppression?1.05:.85,damage:16,speed:310,rounds:e.profileId==='bastion'?4:3,done:false});queued++;
 }
 if(e.profileId==='citadel'&&e.movementPhase==='broadside'&&visible(g,e,p)){
  // The suppression salvo belongs to the surviving broadside battery.
  const battery=l.targets.find(t=>t.muzzle&&Math.sign(t.x)===chosen&&intrusionPartCanFire(e,t.id));
  const impact=citadelTurnImpact(g,e,p,2);
  if(battery&&impact){e.hazards.push({kind:'bomb',sourcePartId:battery.id,...impact,radius:29,age:0,warning:2,damage:19,done:false});queued++;}
 }
 if(e.profileId!=='twin-fortress'&&e.profileId!=='citadel'&&e.profileId!=='bastion'&&(e.profileId!=='armed-svyatogor'||svyatogorPower(e)>0)&&visible(g,e,e)){
  for(let i=0;i<4;i++){
   const side=i<2?-1:1,outer=i%2===1;
   let sourcePartId;
   if(e.profileId==='armed-svyatogor')sourcePartId=side<0?'drive_port':'drive_starboard';
   else if(e.profileId==='goliath')sourcePartId=outer?(side<0?'engine_1':'engine_8'):(side<0?'wing_left':'wing_right');
   else if(e.profileId==='leviathan')sourcePartId=outer?(side<0?'engine_1':'engine_6'):(side<0?'wing_left':'wing_right');
   if(sourcePartId&&!intrusionPartCanFire(e,sourcePartId))continue;
   const warning=1.5+(e.profileId==='leviathan'?i*.18:0);
   const impact=predictBombImpact(g,e,p,warning,side*(outer?94:28),e.profileId==='leviathan'&&outer?65:0);
   if(impact){e.hazards.push({kind:'bomb',sourcePartId,...impact,radius:27,age:0,warning,damage:19,done:false});queued++;}
  }
 }
 if(queued){
  e.volley++;
  commitFiringCourse(e);
 }
 return queued>0;
}
function aimAirGuns(g,e,dt){
 if(isMaritimeIntrusion(e))return;
 const ps=alive(g);if(!ps.length)return;
 const target=airGunTarget(e,ps[e.volley%ps.length]);
 for(const gun of intrusionLayout(e.profileId).targets){
  if(!gun.muzzle||!intrusionPartCanFire(e,gun.id)||e.shotCues.some(q=>q.partId===gun.id))continue;
  const m=gun.muzzles?.[e.volley%gun.muzzles.length]||gun.muzzle;
  const aim=Math.atan2(target.y-m.y,target.x-m.x),diff=Math.atan2(Math.sin(aim-m.angle),Math.cos(aim-m.angle));
  const desired=clamp(diff,-m.arc,m.arc),current=finite(e.turretAngles[gun.id]);
  e.turretAngles[gun.id]=current+clamp(desired-current,-1.2*dt,1.2*dt);
 }
}
// 20261113: a second, independent attack clock per boss (see intrusion-signatures.js).
const SIGNATURE_API={commit:e=>{if(!isMaritimeIntrusion(e))commitFiringCourse(e);},sea:isMaritimeIntrusion,alive,local,world:intrusionWorldPoint,visible,layout:intrusionLayout,velocity:intrusionVelocity,newSubmarine:isNewSubmarine,muzzle:queueArtilleryMuzzle,
 predict:predictBombImpact,clear:ownBodyClear,canFire:intrusionPartCanFire,
 ready:e=>!isMaritimeIntrusion(e)||maritimeAttackable(e)&&maritimeWeaponsReady(e)&&(!isNewSubmarine(e)||submarinePhase(e)==='surfaced'),
 canBomb:e=>!isMaritimeIntrusion(e)&&(e.profileId!=='armed-svyatogor'||svyatogorPower(e)>0)};
const signature=(g,e,dt)=>stepIntrusionSignature(g,e,dt,SIGNATURE_API);
function combat(g,e,dt){
 if(e.profileId==='citadel'){
  const ps=alive(g),p=ps[e.volley%ps.length]||g,v=intrusionVelocity(p);
  const heading=Math.atan2(v.vy,v.vx),pilotId=p.id??null;
  if(e.citadelPilotId!==pilotId){e.citadelHeading=heading;e.citadelTurn=0;e.citadelPilotId=pilotId;}
  const change=heading-finite(e.citadelHeading,heading);
  const turn=clamp(Math.atan2(Math.sin(change),Math.cos(change))/dt,-1.5,1.5);
  e.citadelTurn=finite(e.citadelTurn)+(turn-finite(e.citadelTurn))*Math.min(1,dt*8);
  e.citadelHeading=heading;
  const broadside=e.movementPhase==='broadside';
  if(broadside&&!e.broadsideReady&&!e.shotCues.some(q=>!q.done))e.attackClock=Math.min(.25,e.attackClock);
  e.broadsideReady=broadside;
 }
 aimAirGuns(g,e,dt);
 aimMaritimeGuns(g,e,intrusionLayout(e.profileId),dt,{alive,local,world:intrusionWorldPoint,clear:ownBodyClear,predictImpact:predictBombImpact,canFire:intrusionPartCanFire});
 for(const q of e.shotCues){
  const count=q.rounds||1,last=q.warning+(count-1)*.14;
  if(!intrusionPartCanFire(e,q.partId)){q.done=true;q.age=last+.2;continue;}
  if(q.localMuzzle){Object.assign(q,intrusionWorldPoint(e,q.localMuzzle));q.a=q.localAngle+e.a+Math.PI/2;}
  q.age+=dt;
  if((q.attempted||0)>=count||q.age<q.warning+(q.attempted||0)*.14)continue;
  q.attempted=(q.attempted||0)+1;
  // A cue whose last round could not leave the barrel is spent: stop drawing its line.
  if(!visible(g,e,q)||!ownBodyClear(e,q.partId,q.localMuzzle,q.localAngle)){if(q.attempted>=count)q.done=true;continue;}
  let fired=false;
  for(const offset of q.offsets||[0]){
   if(!ownBodyClear(e,q.partId,q.localMuzzle,q.localAngle+offset))continue;
   (g.bullets||=[]).push({x:q.x,y:q.y,vx:Math.cos(q.a+offset)*(q.speed||270),vy:Math.sin(q.a+offset)*(q.speed||270),life:2.5,enemy:true,visualType:'boss',damage:q.damage,intrusionEncounterId:e.encounterId,encounterId:e.encounterId,sourceBossId:e.profileId,sourcePartId:q.partId,...(q.signature?{signature:q.signature}:{})});
   fired=true;
  }
  if(!fired&&q.attempted>=count)q.done=true;
  if(fired){q.fired=(q.fired||0)+1;q.done=true;if(e.firingCourse)e.firingCourse.discharged=true;queueArtilleryMuzzle(g,{x:q.x,y:q.y,angle:q.a,scale:.55,heavy:true});}
 }
 e.shotCues=e.shotCues.filter(q=>q.age<q.warning+((q.rounds||1)-1)*.14+.2);
 for(const b of e.hazards){if(b.sourcePartId&&!intrusionPartCanFire(e,b.sourcePartId)){b.done=true;b.age=b.warning+.35;continue;}b.age+=dt;if(!b.done&&b.age>=b.warning){b.done=true;if(isNewSubmarine(e)&&b.localMuzzle){e.naval.gunRecoil=1;const m=intrusionWorldPoint(e,b.localMuzzle);queueArtilleryMuzzle(g,{x:m.x,y:m.y,angle:e.a+(b.localAngle+Math.PI/2),scale:e.profileId==='m1'?1.1:.65,heavy:true});}for(const p of alive(g))if(Math.hypot(p.x-b.x,p.y-b.y)<b.radius+finite(p.r,12)){if(g.players)g.hitPlayer?.(p,b.damage);else g.hit?.(b.damage);}g.combatBlast?.(b.x,b.y,b.radius,'enemy','structure');}}e.hazards=e.hazards.filter(b=>b.age<b.warning+.35);e.attackClock-=dt;if(e.attackClock<=0){const queued=queueAttack(g,e);e.attackClock=!queued?.25:isMaritimeIntrusion(e)?maritimeAttackInterval(e):e.profileId==='armed-svyatogor'?(svyatogorPower(e)===2?4.2:svyatogorPower(e)===1?5.2:6.2):e.profileId==='bastion'?3.6:e.profileId==='twin-fortress'?3.8:e.profileId==='goliath'?3.2:e.profileId==='citadel'?(e.movementPhase==='broadside'?2.8:5):4.2;}signature(g,e,dt);breakIntrusionSilence(g,e);}
// 20261109: an intrusion boss may not go quiet for more than about five seconds
// while it is active. Measured on main, surfaced submarines fell silent for up
// to 43 s (the deck gun never lined up) and the R.II for about 6 s. After
// SILENCE.window seconds with no new shot, bomb, splash or torpedo, the boss
// drops one warned impact where the pilot is heading: a stick bomb from the
// air, a shell splash from the sea (the deck-gun splash: 1.8 s, 17). It only
// lands on screen; a disguised Q-ship keeps its cover and a Svyatogor with its
// transmission cut stays without bomb runs.
export const INTRUSION_SILENCE=Object.freeze({window:4,air:Object.freeze({radius:28,damage:19,warning:1.5}),sea:Object.freeze({radius:34,damage:17,warning:1.8})});
function threatCount(e){return e.shotCues.length+e.hazards.length+(e.naval?.torpedoes?.length||0)+(e.riiShots?.length||0)+(e.v1500Shots?.length||0)+(e.releasedBombs?.length||0);}
function breakIntrusionSilence(g,e){
 const now=finite(e.activeAge),n=threatCount(e);
 // A submarine's dive is its evasion: hidden and relocating, it cannot be shot
 // and does not shoot. The watch starts again when it is back on the surface.
 if(isNewSubmarine(e)&&submarinePhase(e)!=='surfaced'){e.silenceAt=now;e.silenceCount=n;return;}
 if(e.silenceAt==null||n>finite(e.silenceCount))e.silenceAt=now;
 e.silenceCount=n;
 if(now-e.silenceAt<INTRUSION_SILENCE.window)return;
 if(isMaritimeIntrusion(e)&&!isNewSubmarine(e)&&!maritimeWeaponsReady(e))return;
 // A Svyatogor with its transmission cut has lost its bomb runs by design.
 if(e.profileId==='armed-svyatogor'&&svyatogorPower(e)===0)return;
 const ps=alive(g),p=ps[finite(e.volley)%Math.max(1,ps.length)];if(!p)return;
 const sea=isMaritimeIntrusion(e),k=sea?INTRUSION_SILENCE.sea:INTRUSION_SILENCE.air;
 const impact=predictBombImpact(g,e,p,k.warning);if(!impact)return;
 // At sea the splash comes from a living, visible gun that clears its own
 // superstructure (a submarine's lobbed deck-gun splash needs no clear lane,
 // as in its own attack), as every authored splash does; no gun, no splash.
 let source={};
 if(sea){
  const guns=intrusionLayout(e.profileId).targets.filter(t=>t.muzzle&&intrusionPartCanFire(e,t.id)&&e.parts[t.id]?.hp>0&&(isNewSubmarine(e)||ownBodyClear(e,t.id,t.muzzle,t.muzzle.angle))).map(t=>({t,w:intrusionWorldPoint(e,t.muzzle)})).sort((a,b)=>Math.hypot(a.w.x-p.x,a.w.y-p.y)-Math.hypot(b.w.x-p.x,b.w.y-p.y));
  // Prefer a gun whose muzzle is on screen; a long hull whose only gun sits
  // just off screen still fires once the hull itself is in view.
  const gun=(guns.find(x=>visible(g,e,x.w))||(visible(g,e,{x:e.x,y:e.y})?guns[0]:null))?.t;
  if(!gun)return;
  source={sourcePartId:gun.id,localMuzzle:{x:gun.muzzle.x,y:gun.muzzle.y},localAngle:gun.muzzle.angle};
 }
 e.hazards.push({kind:sea?'naval-splash':'bomb',x:impact.x,y:impact.y,radius:k.radius,age:0,warning:k.warning,damage:k.damage,done:false,silenceBreak:true,...source});
 e.silenceAt=now;e.silenceCount=threatCount(e);
}
/** Citadel's diagonal approaches alternate around a short broadside hold; no teleporting turn. */
export function citadelRoute(age,width,height){
 const cycle=Math.floor(age/18),u=age%18,side=cycle%2?-1:1;
 const smooth=t=>t*t*(3-2*t);let x,y,a,phase;
 if(u<6){const k=smooth(u/6);x=side*width*(-.42+.62*k);y=height*(-.27+.19*k);a=Math.atan2(.19*height,side*.62*width);phase='approach';}
 else if(u<10){const k=(u-6)/4;x=side*width*(.20+.04*k);y=height*(-.08+.02*k);a=side>0?0:Math.PI;phase='broadside';}
 else{const k=smooth((u-10)/8);x=side*width*(.24+.18*k);y=height*(-.06-.21*k);a=Math.atan2(-.21*height,side*.18*width);phase='depart';}
 return{x,y,a,phase};
}
// Flight model (relative to the player, so the hull never rides on top of them):
// every mode steers an offset (rx,ry) toward a stand-off station with a damped spring,
// banks into lateral motion, and never snaps. Stations keep the hull clear of the player.
function hull(e){const l=intrusionLayout(e.profileId);return{L:l.height*e.scale,S:l.width*e.scale};}
function spring(e,tx,ty,dt,k=1.4,vmax=Infinity){
 // Upright stand-off stations rotate with travel: a giant wing need not be
 // pushed above the viewport merely because the player turned east.
 const {L,S}=hull(e),gap=Math.max(48,e.height*.06);
 if(Math.hypot(e.motionAnchor?.vx||0,e.motionAnchor?.vy||0)>10){
  const mode=intrusionProfiles[e.profileId].mode;
  if(['loiter','armored-loiter','transmission-sweep'].includes(mode)){
   const a=Math.atan2(e.motionAnchor.vy,e.motionAnchor.vx)+Math.PI/2,c=Math.cos(a),s=Math.sin(a);
   tx=clamp(tx,-e.width*.36,e.width*.36);
   const x=tx*c-ty*s;ty=tx*s+ty*c;tx=x;
   const d=Math.max(1,Math.hypot(tx,ty)),angle=Math.atan2(ty,tx)-(e.a+Math.PI/2);
   const margin=gap+Math.min(140,e.width*.11)+Math.min(40,Math.hypot(e.motionAnchor.vx,e.motionAnchor.vy)*.05),safe=1/Math.hypot(Math.cos(angle)/(S/2+margin),Math.sin(angle)/(L/2+margin));
   if(d<safe){tx*=safe/d;ty*=safe/d;}
   // A direct rejoin chord can cut through the pilot after a committed pass.
   // Walk the station around the same side of the clearance envelope instead.
   if(e.firingCourse&&segmentHitsEllipse({x:e.rx,y:e.ry},{x:tx,y:ty},{x:0,y:0,rx:S/2+gap,ry:L/2+gap,angle:e.a+Math.PI/2})){
    const from=Math.atan2(e.ry,e.rx),to=Math.atan2(ty,tx),delta=Math.atan2(Math.sin(to-from),Math.cos(to-from));
    const next=from+clamp(delta,-.35,.35),radius=Math.max(Math.hypot(tx,ty),Math.max(L,S)/2+gap)/Math.cos(.35);
    tx=Math.cos(next)*radius;ty=Math.sin(next)*radius;
   }
  }else{
   const clearance=Math.max(L,S)*.5+gap+30;
   if(Math.abs(tx)<clearance)ty=Math.min(ty,-Math.sqrt(clearance*clearance-tx*tx));
  }
 }
 e.rvx=finite(e.rvx);e.rvy=finite(e.rvy);const c=2*Math.sqrt(k);
 e.rvx+=((tx-e.rx)*k-e.rvx*c)*dt;e.rvy+=((ty-e.ry)*k-e.rvy*c)*dt;
 const v=Math.hypot(e.rvx,e.rvy);if(v>vmax){e.rvx*=vmax/v;e.rvy*=vmax/v;}
 e.rx+=e.rvx*dt;e.ry+=e.rvy*dt;
}
// Upright stations swing from ahead of the player out to alongside (lateral clearance = half span
// + gap), so broadside and nose turrets all get firing angles while the hull stays clear.
function flank(u,S,stationY,gap){const c=Math.cos(u);return{x:Math.sin(u)*(S/2+gap),y:stationY*(.3+.7*c*c)};}
function turnTo(e,a,rate,dt){const da=Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a));e.a+=clamp(da,-rate*dt,rate*dt);}
function routeMove(g,e,dt,cameraX=finite(g.x),cameraY=finite(g.y)){
 // Surface ships remain world-anchored rather than following the aircraft flight spring.
 if(isMaritimeIntrusion(e)){
  for(const id in e.flash||{})if((e.flash[id]-=dt)<=0)delete e.flash[id];
  if(e.phase==='retreating'){advanceMaritimeSafely(g,e,dt,stepMaritimeTransit);return;}
  if(e.phase==='destroyed'){advanceMaritimeSafely(g,e,dt,stepMaritimeWreck);return;}
  if(e.phase==='entering'){
   if(!e.contactPlaced){
    const p=alive(g)[0]||g,v=e.contactVelocity||{x:0,y:0},speed=Math.hypot(v.x,v.y);
    const bearing=speed>1?Math.atan2(v.y,v.x):finite(p.a,-Math.PI/2),turn=finite(e.contactTurnRate),a=bearing+turn*3;
    // Predict the measured curved flight only for the first water contact.
    // Afterwards the vessel retains its own world-space course and inertia.
    const dx=Math.abs(turn)>.001?speed*(Math.sin(a)-Math.sin(bearing))/turn:v.x*3;
    const dy=Math.abs(turn)>.001?speed*(Math.cos(bearing)-Math.cos(a))/turn:v.y*3;
    const lead=Math.min(e.width,e.height)*.18+(e.profileId==='qship'?Math.min(190,speed*.58):0);
    if(!placeMaritimeContact(g,e,intrusionLayout(e.profileId),finite(p.x)+dx+Math.cos(a)*lead,finite(p.y)+dy+Math.sin(a)*lead,true,a)){rejectMaritimeContact(g,e);return;}
    // The contact is still hidden: its first visible pose may already be aimed.
    // Visible tracking continues at the authored finite slew rate.
    aimMaritimeGuns(g,e,intrusionLayout(e.profileId),0,{alive,local,world:intrusionWorldPoint,clear:ownBodyClear,predictImpact:predictBombImpact,initialPose:true});
   }
   advanceMaritimeSafely(g,e,dt,stepMaritimeTransit);return; // One water contact, then world-space vessel inertia.
  }
  if(e.phase==='active'){if(isNewSubmarine(e))submarineSteering(g,e,dt,intrusionLayout(e.profileId),predictBombImpact);advanceMaritimeSafely(g,e,dt,stepMaritimeMotion);if(isNewSubmarine(e))stepSubmarineTorpedoes(g,e,dt);}
  return;
 }
 const p=intrusionProfiles[e.profileId],cx=cameraX,cy=cameraY,W=e.width,H=e.height,{L,S}=hull(e),gap=Math.max(48,H*.06);
 if(!Number.isFinite(e.rx)){e.rx=e.x-cx;e.ry=e.y-cy;e.rvx=0;e.rvy=0;}
 for(const id in e.flash||{})if((e.flash[id]-=dt)<=0)delete e.flash[id];
 smokeDamaged(g,e,dt);
 const upright=['loiter','armored-loiter','transmission-sweep'].includes(p.mode);
 // Upright station: nose up, centre above the player by half the hull plus a gap.
 const stationY=-Math.min(L/2+gap,Math.max(H*.12,H*.5-L*.32));
 if(e.phase==='retreating'){const f=e.a;e.rvx=finite(e.rvx)+Math.cos(f)*W*.9*dt;e.rvy=finite(e.rvy)+Math.sin(f)*W*.9*dt;e.rx+=e.rvx*dt;e.ry+=e.rvy*dt;e.x=cx+e.rx;e.y=cy+e.ry;return;}
 if(e.phase==='entering'){spring(e,0,upright||p.mode==='diagonal-broadside'?stationY:-(S/2+gap),dt,1.6,W*.9);if(!upright){turnTo(e,-Math.PI/2,1.2,dt);}e.a=upright?-Math.PI/2+clamp(e.rvx/(W*.6),-1,1)*.22:e.a;e.x=cx+e.rx;e.y=cy+e.ry;return;}
 if(e.phase!=='active'){if(e.phase==='destroyed'){e.rvx=finite(e.rvx)*.96;e.rvy=finite(e.rvy)*.96+H*.08*dt;e.rx+=e.rvx*dt;e.ry+=e.rvy*dt;}e.x=cx+e.rx;e.y=cy+e.ry;return;}
 const engines=Object.values(e.parts).filter(q=>q.kind==='engine'),slow=1-.24*engines.filter(q=>q.hp<=0).length/Math.max(1,engines.length);
 if(p.mode==='transmission-sweep'){
  // Heavy level-flight strafing sweep; destroyed transmission slows, rather than freezes,
  // the exit path. No invented additional engines and no regular-stage completion.
  const power=svyatogorPower(e),rate=power===2?1:power===1?.65:.3;
  e.routeAge=finite(e.routeAge)+dt*rate;const u=e.routeAge*.2,o=flank(u,S,stationY,gap);
  spring(e,o.x,o.y,dt,1.1*rate+.2,W*.5);
  e.a=-Math.PI/2+clamp(e.rvx/(W*.35),-1,1)*.24;
  e.movementPhase=power===0?'disabled-transmission':power===1?'damaged-transmission':'sweep';
 }else if(upright){
  const armored=p.mode==='armored-loiter',o=flank(e.activeAge*(armored?.16:.22),S,stationY,gap);
  spring(e,o.x,o.y,dt,(armored?.8:1.1)*slow,W*.4);
  e.a=-Math.PI/2+clamp(e.rvx/(W*.3),-1,1)*(armored?.12:.2);
 }else if(p.mode==='diagonal-broadside'){
  e.routeAge=finite(e.routeAge)+dt*slow;
  const t=citadelRoute(e.routeAge,W,H);
  // Same alternating route, lifted so the broadside hold stays clear of the player.
  spring(e,t.x,t.y-clamp(S/2+gap-H*.06,H*.12,H*.3),dt,1.3,W*.6);turnTo(e,t.a,.8,dt);e.movementPhase=t.phase;
 }else{
  // Pass / S-pass: cross the upper field nose-first, U-turn off screen, cross back.
  // First crossing starts from where the hull already is (no fly-away to the far side first).
  if(!e.passStarted){e.passStarted=true;e.routeAge=clamp((e.rx+W*.5+L*.15)/(2*(W*.5+L*.15)),0,.85)*9;}
  e.routeAge=finite(e.routeAge)+dt*slow;
  const cross=9,turn=3,cycle=cross+turn,leg=Math.floor(e.routeAge/cycle),u=e.routeAge%cycle,dir=leg%2?-1:1,X=W*.5+L*.15,laneY=-Math.min(S/2+gap,Math.max(H*.12,H*.5-S*.2));
  let tx,ty,ta;
  if(u<cross){const k=u/cross;tx=dir*(-X+2*X*k);ty=laneY+(p.mode==='s-pass'?Math.sin(k*Math.PI*2)*H*.07:0);ta=dir>0?0:Math.PI;}
  else{const k=(u-cross)/turn;tx=dir*X;ty=laneY-H*.18*Math.sin(k*Math.PI);ta=dir>0?-Math.PI*k:Math.PI+Math.PI*k;}
  spring(e,tx,ty,dt,1.8,W*.75);
  const vx=e.rvx,vy=e.rvy;if(Math.hypot(vx,vy)>W*.04)turnTo(e,Math.atan2(vy,vx),1.6,dt);else turnTo(e,ta,1.6,dt);
  e.movementPhase=u<cross?'pass':'turn';
 }
 e.x=cx+e.rx;e.y=cy+e.ry;
}
/** Hidden placement precedes a finite, forward arrival along the upper combat lane.
 * Hermite endpoints retain a small forward velocity: no reversal at the station,
 * no nose-up spring travelling tail-first down from the top edge. */
function stepAirArrival(e,dt,anchor){
 const {L,S}=hull(e),p=intrusionProfiles[e.profileId],gap=Math.max(48,e.height*.06);
 const upright=['loiter','armored-loiter','transmission-sweep'].includes(p.mode);
 const y=upright||p.mode==='diagonal-broadside'?-Math.min(L/2+gap,Math.max(e.height*.12,e.height*.5-L*.32)):-(S/2+gap);
 if(!e.airEntry){
  const distance=e.width*.5+Math.max(L,S)*.5+48;
  e.airEntry={age:0,distance,y};e.x=anchor.x-distance;e.y=anchor.y+y;
  e.a=Math.atan2(anchor.vy,anchor.vx+distance/3);e.worldVx=anchor.vx+distance/3;e.worldVy=anchor.vy;
 }
 const q=e.airEntry,oldX=e.x,oldY=e.y;q.age=Math.min(3,e.phaseAge);
 const t=q.age/3,t2=t*t,t3=t2*t,v0=q.distance/3,v1=e.width*.06;
 const rx=(2*t3-3*t2+1)*-q.distance+(t3-2*t2+t)*3*v0+(t3-t2)*3*v1;
 const dx=anchor.x+rx-e.x,dy=anchor.y+q.y-e.y;
 if(q.age>0&&Math.hypot(dx,dy)>1e-8){
  turnTo(e,Math.atan2(dy,dx),2.2,dt);
  const travel=Math.min((q.distance*.5+Math.hypot(anchor.vx,anchor.vy))*dt,Math.max(0,dx*Math.cos(e.a)+dy*Math.sin(e.a)));
  e.x+=Math.cos(e.a)*travel;e.y+=Math.sin(e.a)*travel;
 }
 e.worldVx=(e.x-oldX)/dt;e.worldVy=(e.y-oldY)/dt;
 e.rx=e.x-anchor.x;e.ry=e.y-anchor.y;e.rvx=e.worldVx-anchor.vx;e.rvy=e.worldVy-anchor.vy;
 for(const id in e.flash||{})if((e.flash[id]-=dt)<=0)delete e.flash[id];
}
// A pilot can break the firing pass. Cancel before the committed hull crosses
// their clearance corridor or leaves the encounter, then give a fresh warning.
function firingCourseSafe(g,e){
 const course=e.firingCourse,{L,S}=hull(e),look=.35;
 if(!course.discharged&&!e.shotCues.some(q=>!q.done&&intrusionPartCanFire(e,q.partId)))return false;
 const vx=Math.cos(course.a)*course.speed,vy=Math.sin(course.a)*course.speed;
 const ax=e.motionAnchor?.vx||0,ay=e.motionAnchor?.vy||0;
 const dx=e.x+vx*look-(finite(g.x)+ax*look),dy=e.y+vy*look-(finite(g.y)+ay*look);
 const a=course.a+Math.PI/2,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
 if(Math.abs(dx)>e.width*.5+(c*S+s*L)*.5||Math.abs(dy)>e.height*.5+(s*S+c*L)*.5)return false;

 return !alive(g).some(p=>{
  const from={x:p.x-e.x,y:p.y-e.y},to={x:from.x+(finite(p.vx,ax)-vx)*look,y:from.y+(finite(p.vy,ay)-vy)*look};
  const envelope={x:0,y:0,rx:S/2+finite(p.r,12),ry:L/2+finite(p.r,12),angle:a};
  // Do not indefinitely suppress an already close, stationary or separating
  // target. The course guard prevents a new incursion, not an invulnerability zone.
  if(segmentHitsEllipse(from,from,envelope))return false;
  return segmentHitsEllipse(from,to,envelope);
 });
}
// Preserve the inertial authored route and make the hull catch up with world
// travel through turns without replacing its bounded stand-off position.
function advanceMaritimeSafely(g,e,dt,advance){const previous=isNewSubmarine(e)?{x:e.x,y:e.y,a:e.a,wakeTrail:[...(e.naval?.wakeTrail||[])],wakeClock:e.naval?.wakeClock||0}:null;advance(e,dt);if(previous)guardSubmarineMovement(g,e,previous);}
function move(g,e,dt){
 if(giant(e))stepGiantArrivalShadow(g,e,dt);
 if(e.profileId==='linke-hofmann-r-ii'){if(e.phase==='destroyed')stepRIIDestruction(g,e,dt);else stepRIIMotion(g,e,dt);return;}
 if(e.profileId==='handley-page-v1500'){if(e.phase==='destroyed')stepV1500Destruction(g,e,dt);else stepV1500Motion(g,e,dt);return;}
 if(isMaritimeIntrusion(e))return routeMove(g,e,dt);
 const oldX=e.x,oldY=e.y,oldA=e.a;
 if(e.phase==='retreating'||e.phase==='destroyed'){
  for(const id in e.flash||{})if((e.flash[id]-=dt)<=0)delete e.flash[id];
  let vx=finite(e.worldVx),vy=finite(e.worldVy);
  if(e.phase==='retreating'){
   const speed=Math.max(170,Math.min(280,Math.hypot(vx,vy))),blend=1-Math.exp(-dt*1.4);
   vx+=(Math.cos(e.a)*speed-vx)*blend;vy+=(Math.sin(e.a)*speed-vy)*blend;
  }else{const drag=Math.exp(-dt*2.4);vx*=drag;vy=vy*drag+e.height*.08*dt;}
  e.x+=vx*dt;e.y+=vy*dt;e.worldVx=vx;e.worldVy=vy;
  smokeDamaged(g,e,dt);return;
 }
 if(!e.motionAnchor)e.motionAnchor={x:finite(g.x),y:finite(g.y),vx:0,vy:0};
 const anchor=e.motionAnchor,k=100,damping=20;
 anchor.vx+=((finite(g.x)-anchor.x)*k-anchor.vx*damping)*dt;
 anchor.vy+=((finite(g.y)-anchor.y)*k-anchor.vy*damping)*dt;
 anchor.x+=anchor.vx*dt;anchor.y+=anchor.vy*dt;
 // Warning is hidden; placement happens only once on the first entering step.
 if(e.phase==='reserved'||e.phase==='warning')return;
 if(e.phase==='entering'){stepAirArrival(e,dt,anchor);aimAirGuns(g,e,dt);return;}
 // A telegraphed pass is a real straight flight leg, not a frozen sprite
 // or a world-angle ray detached from the six-degree Bastion barrel artwork.
 if(e.phase==='active'&&e.firingCourse?.remaining>0&&!firingCourseSafe(g,e)){
  if(!e.firingCourse.discharged&&!e.firingCourse.signature)e.attackClock=Math.min(.25,e.attackClock);
  e.firingCourse.remaining=0;e.shotCues=e.shotCues.filter(q=>(q.attempted||0)>=(q.rounds||1));
 }
 if(e.phase==='active'&&e.firingCourse?.remaining>0){
  const course=e.firingCourse;course.remaining=Math.max(0,course.remaining-dt);
  if(!course.remaining&&!course.discharged&&!course.signature)e.attackClock=Math.min(.25,e.attackClock);
  if(e.profileId==='citadel'){
   const engines=Object.values(e.parts).filter(p=>p.kind==='engine');
   e.routeAge=finite(e.routeAge)+dt*(1-.24*engines.filter(p=>p.hp<=0).length/Math.max(1,engines.length));
   e.movementPhase=citadelRoute(e.routeAge,e.width,e.height).phase;
  }
  e.a=course.a;e.worldVx=Math.cos(e.a)*course.speed;e.worldVy=Math.sin(e.a)*course.speed;
  e.x+=e.worldVx*dt;e.y+=e.worldVy*dt;
  e.rx=e.x-anchor.x;e.ry=e.y-anchor.y;e.rvx=e.worldVx-anchor.vx;e.rvy=e.worldVy-anchor.vy;
  for(const id in e.flash||{})if((e.flash[id]-=dt)<=0)delete e.flash[id];
  smokeDamaged(g,e,dt);return;
 }
 routeMove(g,e,dt,anchor.x,anchor.y);
 const routeHeading=e.a;
 e.worldVx=(e.x-oldX)/dt;e.worldVy=(e.y-oldY)/dt;e.a=oldA;
 if(['entering','active'].includes(e.phase)&&Math.hypot(e.worldVx,e.worldVy)>8){
  const mode=intrusionProfiles[e.profileId].mode;
  const baseRate=['loiter','armored-loiter'].includes(mode)?.8:mode==='transmission-sweep'?.85:1;
  const velocityBearing=Math.atan2(e.worldVy,e.worldVx);
  const routeError=Math.atan2(Math.sin(routeHeading-velocityBearing),Math.cos(routeHeading-velocityBearing));
  // Keep each route's bank when it agrees with actual travel.
  const bearing=velocityBearing+(e.profileId==='citadel'?0:clamp(routeError,-.18,.18));
  const error=Math.atan2(Math.sin(bearing-e.a),Math.cos(bearing-e.a));
  // Catch up during a player turn, then return smoothly to the heavy hull's
  // normal slew. Keep the existing route so turning cannot strand the boss.
  turnTo(e,bearing,baseRate+(4-baseRate)*Math.min(1,Math.abs(error)/.5),dt);
 }
}
// Damaged or destroyed engines and drives trail smoke (visual only).
function smokeDamaged(g,e,dt){
 if(!g.smoke||!['active','retreating'].includes(e.phase))return;e.smokeClock=finite(e.smokeClock)-dt;if(e.smokeClock>0)return;e.smokeClock=.22;
 for(const t of intrusionLayout(e.profileId).targets){const q=e.parts[t.id];if(!q||!['engine','drive'].includes(q.kind)&&!/engine|drive/.test(t.id))continue;if(q.hp>q.maxHp*.55)continue;const w=intrusionWorldPoint(e,t);g.smoke(w.x,w.y,q.hp<=0);}
}
// Dover is reserved for the convoy and its authored bosses. Jutland has
// an early intercept budget, leaving three seconds for the normal retreat.
export function stepIntrusion(g,dt,c={}){
 const jutland=c.stageIndex===16&&Number.isFinite(c.intrusionRemaining);
 const remaining=jutland?c.intrusionRemaining:c.remaining;
 const reserve=jutland?26:40,enter=jutland?21:33,engage=jutland?17:30,retire=jutland?3:15;
if(g.online&&!g.host)return g.intrusionBoss;if(g.state&&g.state!=='playing'||g.pendingLevelUps?.length||c.paused||!(dt>0)||!Number.isFinite(dt))return g.intrusionBoss;const d=director(g);let e=g.intrusionBoss;if(!e||e.phase==='resolved'){if(majorEncounterBlocked(g,'intrusion'))return e;if(!['central','entente'].includes(c.faction||g.teamFaction)||d.used||c.orderPosition===0||!Number.isFinite(c.orderPosition)||c.phase!=='explore'||c.ready||!Number.isFinite(remaining)||remaining<reserve||blocked(g,c))return e;const key=`${c.loopIndex||0}/${c.stageIndex}`,eligible=Object.values(intrusionProfiles).filter(p=>p.enabled&&p.faction!==(c.faction||g.teamFaction)&&p.stages.includes(c.stageIndex));if(!eligible.length||d.rolledRegions[key])return e;d.rolledRegions[key]=true;const roll=typeof g.rng==='function'?g.rng():1;if(roll>=.25)return e;const pick=typeof g.rng==='function'?g.rng():0;e=start(g,eligible[Math.min(eligible.length-1,Math.floor(pick*eligible.length))].id,c);}
 if(e.phase==='resolved')return e;
 if(isMaritimeIntrusion(e)&&['reserved','warning'].includes(e.phase)){
  const p=alive(g)[0]||g,old=e.contactSample,previous=e.contactVelocity,elapsed=Math.min(dt,1);
  const v=old?{x:(finite(p.x)-old.x)/elapsed,y:(finite(p.y)-old.y)/elapsed}:{x:0,y:0};
  e.contactTurnRate=previous&&Math.hypot(previous.x,previous.y)>1&&Math.hypot(v.x,v.y)>1?Math.atan2(Math.sin(Math.atan2(v.y,v.x)-Math.atan2(previous.y,previous.x)),Math.cos(Math.atan2(v.y,v.x)-Math.atan2(previous.y,previous.x)))/elapsed:0;
  e.contactVelocity=v;e.contactSample={x:finite(p.x),y:finite(p.y)};
 }
 if(c.stageIndex!==e.stageIndex||c.phase&&c.phase!=='explore'){disposeIntrusion(g,'stage-priority');return e;}if((!jutland&&c.ready)||remaining<=retire||blocked(g,c))retreat(g,e,'priority');let left=Math.min(dt,1);while(left>0){const step=Math.min(left,.05);let shouldCombat=false;left-=step;e.age+=step;e.phaseAge+=step;if(e.phase==='reserved'){e.phase='warning';e.phaseAge=0;const p=intrusionProfiles[e.profileId];emit(g,{type:'intrusionWarning',encounterId:e.encounterId,bossId:e.profileId,name:p.name,detail:p.detail});}else if(e.phase==='warning'&&isNewSubmarine(e)&&e.phaseAge>=2.8&&!e.contactPlaced){if(e.phaseAge>=8)disposeIntrusion(g,'sea-lane-blocked');else if(e.phaseAge>=(e.placementRetryAt||0)){e.placementRetryAt=e.phaseAge+.25;placeSubmarineContact(g,e,intrusionLayout(e.profileId),hullOverlap,submarineObstacles(g,e));}}else if(e.phase==='warning'&&e.phaseAge>=4){if(!c.artReady||c.artReady(e.profileId)){if(remaining<enter)disposeIntrusion(g,'window-shrunk');else{e.phase='entering';e.phaseAge=0;}}else if(e.phaseAge>=8)disposeIntrusion(g,'art-unavailable');}else if(e.phase==='entering'&&e.phaseAge>=(isNewSubmarine(e)?1.2:3)){if(remaining<engage)disposeIntrusion(g,'window-shrunk');else{e.phase='active';e.phaseAge=0;e.routeAge=0;if(isNewSubmarine(e)){e.naval.phase='surfaced';e.naval.phaseAge=0;}}}else if(e.phase==='active'){e.activeAge+=step;if(e.activeAge>=45)retreat(g,e,'timeout');else shouldCombat=true;}else if(e.phase==='retreating'&&e.phaseAge>=3||e.phase==='destroyed'&&e.phaseAge>=(e.profileId==='handley-page-v1500'?2.9:e.profileId==='linke-hofmann-r-ii'?2.65:1)){disposeIntrusion(g,e.reason||'destroyed');}move(g,e,step);
 // Visible naval mounts and V/1500 defensive guns can cover the initial flypast.
 if(e.phase==='entering'&&(isMaritimeIntrusion(e)&&e.contactPlaced||e.profileId==='handley-page-v1500'))shouldCombat=true;
 if(shouldCombat){if(e.profileId==='handley-page-v1500'){stepV1500Combat(g,e,step);signature(g,e,step);breakIntrusionSilence(g,e);}else if(e.profileId==='linke-hofmann-r-ii'){stepRIICombat(g,e,step);signature(g,e,step);breakIntrusionSilence(g,e);if(e.riiSelfDestruct&&e.hp>0)hitIntrusionAt(g,{partId:'core',damage:e.hp,hitKey:'rii-drive-collapse'});}else combat(g,e,step);}}return e;}
export const updateIntrusions=stepIntrusion;




