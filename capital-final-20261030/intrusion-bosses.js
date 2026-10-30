/** Host-authoritative optional encounters. No stage advancement or regular-boss rewards. */
import {queueArtilleryMuzzle} from './artillery-fx.js?v=capital-final-20261030';
import { intrusionLayout, ownHullClear } from './intrusion-boss-layouts.js?v=capital-final-20261030';
import {MARITIME_PROFILES,isMaritimeIntrusion,maritimeAttackable,maritimeDamageMultiplier,stepMaritimeMotion,stepMaritimeTransit,stepMaritimeWreck,maritimeWeaponsReady,revealMaritimeDecoy,aimMaritimeGuns,queueMaritimeAttack,maritimeAttackInterval} from './maritime-intrusion.js?v=capital-final-20261030';
import {enqueueIntrusionEquipmentReward} from './intrusion-equipment-rewards.js';
export const intrusionProfiles = Object.freeze({
 ...MARITIME_PROFILES,
 bastion:{id:'bastion',name:'바스티옹',faction:'entente',mode:'armored-loiter',enabled:true,stages:[0,2,3,4,5,12],detail:'장갑을 벗겨 기낭을 노려라',independentBarrels:false,artStatus:'user-supplied whole turrets; no independent barrels; damaged barrels cease fire; destroyed turrets removed without wreck imagery'},
 'armed-svyatogor':{id:'armed-svyatogor',name:'무장형 스뱌토고르',faction:'entente',mode:'transmission-sweep',enabled:true,stages:[0,2,3,5],detail:'구동부를 끊고 기총 좌석을 제압하라',artStatus:'fictional armed operational Slesarev prototype; two internal engines and two driven propellers; six gunner assemblies'},
 'twin-fortress': {id:'twin-fortress',name:'쌍동 공중요새',faction:'central',mode:'loiter',enabled:true,stages:[0,2,3,5,10],detail:'한쪽 포대를 무너뜨려라'},
 goliath:{id:'goliath',name:'골리앗',faction:'central',mode:'pass',enabled:true,stages:[0,4,5,15,17],detail:'외측 엔진을 끊어라'},
 leviathan:{id:'leviathan',name:'리바이어던',faction:'entente',mode:'s-pass',enabled:true,stages:[1,7,16,17],detail:'한쪽 외익을 무너뜨려라'},
 citadel:{id:'citadel',name:'시타델',faction:'entente',mode:'diagonal-broadside',enabled:true,stages:[2,3,4,5,12],detail:'현측 포대를 먼저 끊어라',artStatus:'intact-modules; damaged-engine-art-unavailable'}
});
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
export function locateIntrusionHit(g,hit){const e=g.intrusionBoss;if(!e||!maritimeAttackable(e)||!['entering','active'].includes(e.phase)||!Number.isFinite(hit.x)||!Number.isFinite(hit.y))return null;const b=local(e,hit.x,hit.y),a=local(e,finite(hit.previousX,hit.x),finite(hit.previousY,hit.y)),r=Math.max(0,finite(hit.radius))/e.scale;const targets=intrusionLayout(e.profileId).targets.filter(t=>e.parts[t.id]?.hp>0&&intrusionPartExposed(e,t.id)).sort((a,b)=>(a.id==='core')-(b.id==='core')||a.rx*a.ry-b.rx*b.ry);const t=targets.find(t=>segmentHitsEllipse(a,b,t,r));return t?{partId:t.id,encounterId:e.encounterId,x:hit.x,y:hit.y}:null;}
function clean(g,e){if(!e)return;g.bullets=(g.bullets||[]).filter(b=>b.intrusionEncounterId!==e.encounterId);e.hazards=[];e.shotCues=[];}
export function disposeIntrusion(g,reason='disposed'){const e=g.intrusionBoss;if(e){clean(g,e);const wasResolved=e.phase==='resolved';e.phase='resolved';e.reason=reason;e.phaseAge=0;if(!wasResolved)emit(g,{type:'intrusionResolved',encounterId:e.encounterId,bossId:e.profileId,reason});}return e;}
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
function breakPart(g,e,id,broken){const p=e.parts[id];if(!p||p.state==='destroyed')return;p.hp=0;p.state='destroyed';broken.push(id);{const t=intrusionLayout(e.profileId).targets.find(t=>t.id===id);if(t&&id!=='core'&&g.combatBlast){const w=intrusionWorldPoint(e,t);g.combatBlast(w.x,w.y,Math.max(34,Math.min(90,Math.max(t.rx,t.ry)*e.scale*1.2)),'enemy','structure');}}reward(g,e,id,p.reward||0);for(const t of intrusionLayout(e.profileId).targets)if(t.dependencies?.includes(id))breakPart(g,e,t.id,broken);if(id!=='core')e.hp=Math.max(0,e.hp-e.maxHp*(p.kind==='wing'?.09:p.kind==='float'?.01:.025));if(e.profileId==='bastion'&&p.kind==='armor'){e.damage||={};e.damage.envelope='damaged';}emit(g,{type:'intrusionPartDestroyed',encounterId:e.encounterId,partId:id});}
export function hitIntrusionAt(g,hit){const e=g.intrusionBoss,located=hit.partId&&e&&maritimeAttackable(e)&&['entering','active'].includes(e.phase)&&e.parts[hit.partId]?.hp>0&&intrusionPartExposed(e,hit.partId)?{partId:hit.partId,encounterId:e.encounterId}:locateIntrusionHit(g,hit);if(!located)return{damage:0,actualDamage:0,broken:[]};if(hit.hitKey!=null&&e.hitKeys.includes(String(hit.hitKey)))return{damage:0,actualDamage:0,broken:[]};const exposed=e.profileId==='twin-fortress'&&located.partId==='core'&&Object.values(e.parts).filter(p=>p.kind==='turret_body'&&p.hp<=0).length>=2;const damage=Math.max(0,finite(hit.damage))*(exposed?1.3:1)*(e.profileId==='bastion'&&located.partId==='core'?bastionArmorMultiplier(e):1)*maritimeDamageMultiplier(e,located.partId);if(!damage)return{damage:0,actualDamage:0,broken:[]};revealMaritimeDecoy(e);if(hit.hitKey!=null)e.hitKeys.push(String(hit.hitKey));const p=e.parts[located.partId],actual=Math.min(p.hp,damage),broken=[];p.hp-=actual;(e.flash||={})[located.partId]=.12;p.state=p.hp<=0?'damaged':p.hp<=p.maxHp*.5?'damaged':'intact';if(located.partId==='core')e.hp=p.hp;else e.hp=Math.max(0,e.hp-actual*.2);if(p.hp<=0)breakPart(g,e,located.partId,broken);e.parts.core.hp=e.hp;if(e.hp<=0){e.phase='destroyed';e.phaseAge=0;clean(g,e);if(g.combatBlast){const{L,S}=hull(e);for(let i=0;i<5;i++){const k=i/4-.5;g.combatBlast(e.x+Math.cos(e.a)*L*k*.8+Math.cos(e.a+Math.PI/2)*S*.18*(i%2?1:-1),e.y+Math.sin(e.a)*L*k*.8+Math.sin(e.a+Math.PI/2)*S*.18*(i%2?1:-1),70+i*8,'enemy','structure');}}if(!e.rewarded.final){e.rewarded.final=true;enqueueIntrusionEquipmentReward(g,e.encounterId);g.kills=finite(g.kills)+1;const owner=g.players?.find(p=>p.id===hit.ownerId);if(owner)owner.kills=finite(owner.kills)+1;emit(g,{type:'intrusionDestroyed',bossId:e.profileId,encounterId:e.encounterId});}}return{...located,damage:actual,actualDamage:actual,broken};}
function blocked(g,c){return c.blocked||g.pendingLevelUps?.length||g._aceCombatActive?.size||g.eliteEnemies?.active||g.battlefieldMission?.status==='active'||g.ruralFronts?.active||g.stageBoss?.encounter?.active;}
function start(g,id,c){const profile=intrusionProfiles[id];if(!profile?.enabled)return null;const d=director(g),layout=intrusionLayout(id),w=Math.max(180,finite(c.width,800)),h=Math.max(240,finite(c.height,600)),maxHp=Math.round(finite(c.regularBossHp,2100*(1+finite(g.t)/150)*(1+1.2*finite(c.loopIndex)+.35*finite(c.loopIndex)**2))*(profile.hpRatio??(['loiter','armored-loiter'].includes(profile.mode)?.65:.55))),budget=Math.min(36,12+finite(c.stageIndex)*2+finite(c.loopIndex)*4),parts={};let weight=layout.targets.filter(t=>t.id!=='core'&&t.kind!=='decal').reduce((n,t)=>n+(t.kind==='wing'?2:1),0),assigned=0,cumulative=0;for(const t of layout.targets){if(t.kind==='decal')continue;const hp=t.id==='core'?maxHp:Math.round(maxHp*(t.kind==='wing'?.17:t.kind==='engine'?.065:.085));if(t.id!=='core')cumulative+=(t.kind==='wing'?2:1)/weight;const allocation=t.id==='core'?0:Math.round(budget*.6*cumulative)-assigned;if(t.id!=='core')assigned+=allocation;parts[t.id]={kind:t.kind,hp,maxHp:hp,state:'intact',reward:allocation};}
 const e={profileId:id,bossId:id,encounterId:`${g.runId||'run'}/intrusion/${++d.serial}`,phase:'reserved',phaseAge:0,age:0,activeAge:0,stageIndex:c.stageIndex,loopIndex:c.loopIndex||0,x:finite(g.x),y:finite(g.y)-h*(isMaritimeIntrusion(id)?.18:.7),a:-Math.PI/2,scale:isMaritimeIntrusion(id)?Math.min((w-80)/layout.width,h*.66/layout.height):Math.min((w-128)/Math.max(layout.width,layout.height),h*.62/(['pass','s-pass','diagonal-broadside'].includes(profile.mode)?Math.max(layout.width,layout.height):layout.height)),width:w,height:h,maxHp,hp:maxHp,parts,turretAngles:{},hazards:[],shotCues:[],hitKeys:[],rewarded:{},finalReward:Math.round(budget*.6),attackClock:1.2,volley:0,route:null};g.intrusionBoss=e;d.used=true;return e;}
export function forceIntrusionForTest(g,id,c={}){if(!intrusionProfiles[id])return null;return start(g,id,c);}
function visible(g,e,p){return Math.abs(p.x-finite(g.x))<e.width*.48&&Math.abs(p.y-finite(g.y))<e.height*.48;}
export function ownBodyClear(e,group,muzzle,angle,length=1500){if(intrusionLayout(e.profileId).shotOcclusion)return ownHullClear(e.profileId,group,muzzle,angle,length,Object.fromEntries(Object.entries(e.parts).map(([k,v])=>[k,v.state])));const end={x:muzzle.x+Math.cos(angle)*length,y:muzzle.y+Math.sin(angle)*length};return ownHullClear(e.profileId,group,muzzle,angle,length,Object.fromEntries(Object.entries(e.parts).map(([k,v])=>[k,v.state])))&&!intrusionLayout(e.profileId).targets.some(t=>t.id!==group&&e.parts[t.id]?.hp>0&&segmentHitsEllipse(muzzle,end,t,1));}
function queueAttack(g,e){const l=intrusionLayout(e.profileId);if(queueMaritimeAttack(g,e,l,{alive,local,world:intrusionWorldPoint,visible,clear:ownBodyClear,canFire:intrusionPartCanFire}))return;const ps=alive(g);if(!ps.length)return;const p=ps[e.volley%ps.length],target=local(e,p.x,p.y),guns=l.targets.filter(t=>t.muzzle&&intrusionPartCanFire(e,t.id)),side=e.volley%2?-1:1;for(const gun of guns){if(e.profileId==='armed-svyatogor'&&guns.indexOf(gun)%2!==e.volley%2)continue;if(e.profileId==='bastion'&&Math.floor((Number(gun.id.split('_').at(-1))-1)/2)!==e.volley%3)continue;if(e.profileId==='twin-fortress'&&gun.x*side<0)continue;if((e.profileId==='leviathan'||e.profileId==='citadel')&&gun.x*side<0)continue;const barrelIndex=gun.muzzles?.length?e.volley%gun.muzzles.length:0,m=gun.muzzles?.[barrelIndex]||gun.muzzle,aim=Math.atan2(target.y-m.y,target.x-m.x),diff=Math.atan2(Math.sin(aim-m.angle),Math.cos(aim-m.angle)),delta=finite(e.turretAngles[gun.id]),a=m.angle+delta,c=Math.cos(delta),s=Math.sin(delta),mx=m.pivotX+(m.x-m.pivotX)*c-(m.y-m.pivotY)*s,my=m.pivotY+(m.x-m.pivotX)*s+(m.y-m.pivotY)*c;const muzzle={x:mx,y:my},wp=intrusionWorldPoint(e,muzzle);if(Math.abs(clamp(diff,-m.arc,m.arc)-delta)>.22)continue;if(!visible(g,e,wp)||!ownBodyClear(e,gun.id,muzzle,a))continue;e.shotCues.push({...wp,localMuzzle:muzzle,barrelIndex,localAngle:a,a:a+e.a+Math.PI/2,partId:gun.id,age:0,warning:e.profileId==='bastion'?1.2:1,damage:16,done:false});}
 if(e.profileId==='citadel'&&e.movementPhase==='broadside'&&visible(g,e,p)){e.hazards.push({kind:'bomb',x:p.x,y:p.y,radius:29,age:0,warning:2,damage:19,done:false});}
 if(e.profileId!=='twin-fortress'&&e.profileId!=='citadel'&&e.profileId!=='bastion'&&(e.profileId!=='armed-svyatogor'||svyatogorPower(e)>0)&&visible(g,e,e)){const safeGap=96;for(let i=0;i<(e.profileId==='armed-svyatogor'&&svyatogorPower(e)===1?2:4);i++){const side=(e.profileId==='armed-svyatogor'&&svyatogorPower(e)===1?i%2===0:i<2)?-1:1,x=p.x+side*(safeGap/2+32+(i%2)*64),y=p.y+(e.profileId==='leviathan'?(i%2)*65:0)-45;if(visible(g,e,{x,y}))e.hazards.push({kind:'bomb',x,y,radius:27,age:0,warning:1.5+(e.profileId==='leviathan'?i*.18:0),damage:19,done:false});}}
 e.volley++;}
function aimAirGuns(g,e,dt){
 if(isMaritimeIntrusion(e))return;
 const ps=alive(g);if(!ps.length)return;
 const target=local(e,ps[e.volley%ps.length].x,ps[e.volley%ps.length].y);
 for(const gun of intrusionLayout(e.profileId).targets){
  if(!gun.muzzle||!intrusionPartCanFire(e,gun.id)||e.shotCues.some(q=>q.partId===gun.id&&q.age<q.warning+.2))continue;
  const m=gun.muzzles?.[e.volley%gun.muzzles.length]||gun.muzzle;
  const aim=Math.atan2(target.y-m.y,target.x-m.x),diff=Math.atan2(Math.sin(aim-m.angle),Math.cos(aim-m.angle));
  const desired=clamp(diff,-m.arc,m.arc),current=finite(e.turretAngles[gun.id]);
  e.turretAngles[gun.id]=current+clamp(desired-current,-1.2*dt,1.2*dt);
 }
}
function combat(g,e,dt){aimAirGuns(g,e,dt);aimMaritimeGuns(g,e,intrusionLayout(e.profileId),dt,{alive,local,canFire:intrusionPartCanFire});for(const q of e.shotCues){if(!intrusionPartCanFire(e,q.partId)){q.done=true;q.age=q.warning+.2;continue;}if(q.localMuzzle){Object.assign(q,intrusionWorldPoint(e,q.localMuzzle));q.a=q.localAngle+e.a+Math.PI/2;}q.age+=dt;if(!q.done&&q.age>=q.warning){q.done=true;if(intrusionPartCanFire(e,q.partId)&&visible(g,e,q)&&ownBodyClear(e,q.partId,q.localMuzzle,q.localAngle)){let fired=false;for(const offset of q.offsets||[0]){if(!ownBodyClear(e,q.partId,q.localMuzzle,q.localAngle+offset))continue;(g.bullets||=[]).push({x:q.x,y:q.y,vx:Math.cos(q.a+offset)*(q.speed||270),vy:Math.sin(q.a+offset)*(q.speed||270),life:2.5,enemy:true,visualType:'boss',damage:q.damage,intrusionEncounterId:e.encounterId,encounterId:e.encounterId,sourceBossId:e.profileId,sourcePartId:q.partId});fired=true;}if(fired)queueArtilleryMuzzle(g,{x:q.x,y:q.y,angle:q.a,scale:.55,heavy:true});}}}e.shotCues=e.shotCues.filter(q=>q.age<q.warning+.2);for(const b of e.hazards){if(b.sourcePartId&&!intrusionPartCanFire(e,b.sourcePartId)){b.done=true;b.age=b.warning+.35;continue;}b.age+=dt;if(!b.done&&b.age>=b.warning){b.done=true;for(const p of alive(g))if(Math.hypot(p.x-b.x,p.y-b.y)<b.radius+finite(p.r,12)){if(g.players)g.hitPlayer?.(p,b.damage);else g.hit?.(b.damage);}g.combatBlast?.(b.x,b.y,b.radius,'enemy','structure');}}e.hazards=e.hazards.filter(b=>b.age<b.warning+.35);e.attackClock-=dt;if(e.attackClock<=0){queueAttack(g,e);e.attackClock=isMaritimeIntrusion(e)?maritimeAttackInterval(e):e.profileId==='armed-svyatogor'?(svyatogorPower(e)===2?4.2:svyatogorPower(e)===1?5.2:6.2):e.profileId==='bastion'?3.6:e.profileId==='twin-fortress'?3.8:e.profileId==='goliath'?3.2:e.profileId==='citadel'?(e.movementPhase==='broadside'?2.8:5):4.2;}}
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
  if(e.phase==='retreating'){stepMaritimeTransit(e,dt);return;}
  if(e.phase==='destroyed'){stepMaritimeWreck(e,dt);return;}
  if(e.phase==='entering'){
   if(!e.contactPlaced){const p=alive(g)[0]||g,v=e.contactVelocity||{x:0,y:0},a=Math.hypot(v.x,v.y)>1?Math.atan2(v.y,v.x):finite(p.a,-Math.PI/2),lead=Math.min(e.width,e.height)*.18;e.x=finite(p.x)+v.x*3+Math.cos(a)*lead;e.y=finite(p.y)+v.y*3+Math.sin(a)*lead;e.contactPlaced=true;}
   stepMaritimeTransit(e,dt);return; // One water contact, then world-space vessel inertia.
  }
  if(e.phase==='active')stepMaritimeMotion(e,dt);
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
// Preserve the inertial authored route and make the hull catch up with world
// travel through turns without replacing its bounded stand-off position.
function move(g,e,dt){
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
 routeMove(g,e,dt,anchor.x,anchor.y);
 e.worldVx=(e.x-oldX)/dt;e.worldVy=(e.y-oldY)/dt;e.a=oldA;
 if(['entering','active'].includes(e.phase)&&Math.hypot(e.worldVx,e.worldVy)>8){
  const mode=intrusionProfiles[e.profileId].mode;
  const baseRate=['loiter','armored-loiter'].includes(mode)?.8:mode==='transmission-sweep'?.85:1;
  const bearing=Math.atan2(e.worldVy,e.worldVx);
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
export function stepIntrusion(g,dt,c={}){if(g.state&&g.state!=='playing'||g.pendingLevelUps?.length||c.paused||!(dt>0)||!Number.isFinite(dt))return g.intrusionBoss;const d=director(g);let e=g.intrusionBoss;if(!e||e.phase==='resolved'){if(!['central','entente'].includes(c.faction||g.teamFaction)||d.used||c.orderPosition===0||!Number.isFinite(c.orderPosition)||c.phase!=='explore'||c.ready||!Number.isFinite(c.remaining)||c.remaining<40||blocked(g,c))return e;const key=`${c.loopIndex||0}/${c.stageIndex}`,eligible=Object.values(intrusionProfiles).filter(p=>p.enabled&&p.faction!==(c.faction||g.teamFaction)&&p.stages.includes(c.stageIndex));if(!eligible.length||d.rolledRegions[key])return e;d.rolledRegions[key]=true;const roll=typeof g.rng==='function'?g.rng():1;if(roll>=.25)return e;const pick=typeof g.rng==='function'?g.rng():0;e=start(g,eligible[Math.min(eligible.length-1,Math.floor(pick*eligible.length))].id,c);}
 if(e.phase==='resolved')return e;if(isMaritimeIntrusion(e)&&['reserved','warning'].includes(e.phase)){const p=alive(g)[0]||g,old=e.contactSample;e.contactVelocity=old?{x:(finite(p.x)-old.x)/Math.min(dt,1),y:(finite(p.y)-old.y)/Math.min(dt,1)}:{x:0,y:0};e.contactSample={x:finite(p.x),y:finite(p.y)};}if(c.stageIndex!==e.stageIndex||c.phase&&c.phase!=='explore'){disposeIntrusion(g,'stage-priority');return e;}if(c.ready||c.remaining<=15||blocked(g,c))retreat(g,e,'priority');let left=Math.min(dt,1);while(left>0){const step=Math.min(left,.05);let shouldCombat=false;left-=step;e.age+=step;e.phaseAge+=step;if(e.phase==='reserved'){e.phase='warning';e.phaseAge=0;const p=intrusionProfiles[e.profileId];emit(g,{type:'intrusionWarning',encounterId:e.encounterId,bossId:e.profileId,name:p.name,detail:p.detail});}else if(e.phase==='warning'&&e.phaseAge>=4){if(!c.artReady||c.artReady(e.profileId)){if(c.remaining<33)disposeIntrusion(g,'window-shrunk');else{e.phase='entering';e.phaseAge=0;}}else if(e.phaseAge>=8)disposeIntrusion(g,'art-unavailable');}else if(e.phase==='entering'&&e.phaseAge>=3){if(c.remaining<30)disposeIntrusion(g,'window-shrunk');else{e.phase='active';e.phaseAge=0;e.routeAge=0;}}else if(e.phase==='active'){e.activeAge+=step;if(e.activeAge>=45)retreat(g,e,'timeout');else shouldCombat=true;}else if(e.phase==='retreating'&&e.phaseAge>=3||e.phase==='destroyed'&&e.phaseAge>=1){disposeIntrusion(g,e.reason||'destroyed');}move(g,e,step);if(shouldCombat)combat(g,e,step);}return e;}
export const updateIntrusions=stepIntrusion;




