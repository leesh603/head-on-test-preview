import {FLIGHT_EQUIPMENT,flightEquipmentAllowed,correctWimperisBomb,sampleWimperisMotion,equipmentTargets} from './flight-equipment.js';
import {combatImpactResult} from './combat-impact-result.js';
export {equipmentTargets};

export const WWI_EQUIPMENT=Object.freeze([
 Object.freeze({id:'buckinghamBelt',name:'버킹엄 소이탄 탄띠',desc:'기관총 3회 연속 명중으로 적 기체에 불을 붙입니다.',family:'GUN'}),
 Object.freeze({id:'cooperRack',name:'쿠퍼 소형 폭탄 랙',desc:'4초마다 전방 적을 향해 소형 폭탄 2발을 연속 투하합니다.',family:'EXPLOSIVE'}),
 Object.freeze({id:'fieryGrapnel',name:'파이어리 그래프넬',desc:'6초마다 근접 교차한 적기에 화염 갈고리를 걸어 3초간 불태웁니다. 직접 피해는 기관총 강화의 50%를 반영합니다 (최대 +50%).',family:'GUN'}),
 Object.freeze({id:'flechettes',name:'플레셰트 강철 화살탄',desc:'5초마다 전방 표적을 최대 12° 보정 조준해 관통 화살탄 12발을 3발씩 대칭 연사합니다. 기관총 강화의 50% 반영 (최대 +50%). 중장갑 피해 25%.',family:'GUN'}),
 Object.freeze({id:'veryPistol',name:'베리 신호권총',desc:'9초마다 최근 직접 명중한 전방 표적을 우선 지정해 6초간 집중 공격을 유도합니다. 표적 소실 시 남은 시간 안에서 1회 재지정합니다.',family:'FORMATION'}),
 Object.freeze({id:'hytheCamera',name:'하이스 건 카메라',desc:'공중사격 훈련용 카메라의 각색. 전방·후방 주무장 각각 3회 연속 명중으로 표적을 분석합니다. 6초간 해당 표적에 기관총·직접 기관총 액티브 피해 +30%, 공격 준비를 드러내고 망원경·퐁크 점사가 분석 표적을 우선합니다.',family:'GUN'})
]);

export const WWI_BALANCE=Object.freeze({
 burn:Object.freeze({duration:3,grapnelDuration:3,dps:10,aerostatDps:18,bossDpsCap:6,aerostatBossDpsCap:10}),
 buckingham:Object.freeze({hits:3,hitGap:1.5}),
 cooper:Object.freeze({cooldown:4,stagger:.18,fuse:.55,radius:66,damage:70}),
 grapnel:Object.freeze({cooldown:6,proximity:40,maxCable:110,speed:720,life:.18,damage:42,collisionRadius:8,cableDuration:2.2}),
 flechettes:Object.freeze({cooldown:5,count:12,burst:3,stagger:.08,minDamage:12,maxDamage:16,speed:590,life:.76,spread:.06,laneWidth:24,aimCone:Math.PI/15,collisionRadius:2,heavyMultiplier:.25}),
 veryPistol:Object.freeze({cooldown:9,duration:6}),
 hytheCamera:Object.freeze({hits:3,hitGap:1.5,visibility:6,damageMultiplier:1.3})
});

const IDS=new Set([...WWI_EQUIPMENT,...FLIGHT_EQUIPMENT].map(e=>e.id));
const INSTALLED=Symbol.for('headon.wwi-equipment.v1');
const handledImpacts=new WeakMap();
const ownerId=owner=>owner?.id??'p1';
const combatWorld=owner=>owner?.combatWorld?.()||owner?.world||owner;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const segmentMetric=(ax0,ay0,ax1,ay1,bx0,by0,bx1=bx0,by1=by0)=>{const rx=ax0-bx0,ry=ay0-by0,dx=(ax1-bx1)-rx,dy=(ay1-by1)-ry,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,-(rx*dx+ry*dy)/length)):0,qx=rx+dx*t,qy=ry+dy*t;return{t,distance:Math.hypot(qx,qy),ax:ax0+(ax1-ax0)*t,ay:ay0+(ay1-ay0)*t,bx:bx0+(bx1-bx0)*t,by:by0+(by1-by0)*t};};
const activeOwner=(owner,world)=>!(owner?.hp!=null&&owner.hp<=0)&&owner?.status!=='downed'&&(!world?.state||world.state==='playing');
const hasEquipment=(owner,id)=>!!owner?.upgrades?.[id];
const valuesOf=value=>value instanceof Map?[...value.values()]:Array.isArray(value)?value:Object.values(value||{});

function ownedWings(owner,world=combatWorld(owner)){
 const id=ownerId(owner);
 return (world?.allies||[]).filter(wing=>wing&&wing.ownerId===id&&wing.life>0&&!(wing.hp!=null&&wing.hp<=0));
}

export function wwiEquipmentAllowed(owner,id){
 if(!owner||!IDS.has(id)||hasEquipment(owner,id))return false;
 if(FLIGHT_EQUIPMENT.some(e=>e.id===id))return flightEquipmentAllowed(owner,id);
 if((id==='buckinghamBelt'||id==='hytheCamera')&&owner.cow37)return false;
 if(id==='veryPistol')return ownedWings(owner).length>0||(owner.permanentWingman||0)>0||!!owner.upgrades?.aceWingman;
 return true;
}

function privateMachineGunRound(owner,round,allowActive=false){
 if(!round||round.enemy||round.patrol||round.ally||round.formation||round.rocket||round.motorCannon||round.cow37||round.mauserRound||round.blast||round.actualExplosion||round.fieryGrapnel||round.flechette||round.nungesserCounter||(round.fiveAceRound||round.pilotRearActive)&&!allowActive)return false;
 if(round.ownerId!=null&&round.ownerId!==ownerId(owner))return false;
 return Number.isInteger(round.gun);
}

function targetId(owner,target){
 if(target?.tailId!=null)return target.tailId;
 if(typeof owner?.tailIdFor==='function')return owner.tailIdFor(target);
 const raw=target?.id??target?.stageBossBody?.id;
 if(raw!=null)return `wwi-${raw}`;
 const world=combatWorld(owner);world.wwiTargetSequence=(world.wwiTargetSequence||0)+1;
 return target.tailId=`wwi-target-${world.wwiTargetSequence}`;
}

function isBossTarget(target){
 return !!(target?.stageBossBody||target?.bossPilot||target?.campaignAce||target?.ace||target?.type==='boss'||target?.type==='zeppelin');
}

function closestImpact(round,target,center=target){
 const x1=finite(round?.x,finite(center?.x)),y1=finite(round?.y,finite(center?.y)),x0=finite(round?.previousX,x1),y0=finite(round?.previousY,y1),tx1=finite(center?.x,finite(target?.x)),ty1=finite(center?.y,finite(target?.y)),tx0=center===target?finite(target?.previousX,tx1):tx1,ty0=center===target?finite(target?.previousY,ty1):ty1;
 const ax=x0-tx0,ay=y0-ty0,dx=(x1-tx1)-ax,dy=(y1-ty1)-ay,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/length)):1;
 return{x:x0+(x1-x0)*t,y:y0+(y1-y0)*t};
}

function storeBurnAnchor(target,round,accepted){
 const body=target.stageBossBody,partId=accepted?.partId??null;
 const part=partId!=null?body?.parts?.get?.(partId):null,center=part?partPoint(body,part):target;
 const point=Number.isFinite(accepted?.impactX)&&Number.isFinite(accepted?.impactY)?{x:accepted.impactX,y:accepted.impactY}:closestImpact(round,target,center);
 const support=body?.support129;
 if(support){
  const a=finite(support.angle,finite(body.hullYaw)),dx=point.x-finite(support.x,body.x),dy=point.y-finite(support.y,body.y),width=Math.max(1,finite(support.width,1)),height=Math.max(1,finite(support.height,1));
  target.burnAnchorSpace='support129';target.burnLocalX=(dx*Math.cos(a)+dy*Math.sin(a))/width;target.burnLocalY=(-dx*Math.sin(a)+dy*Math.cos(a))/height;
 }else{
  const host=body||target,a=finite(body?.hullYaw,finite(body?.angle,finite(host.a))),dx=point.x-finite(host.x),dy=point.y-finite(host.y);
  target.burnAnchorSpace=body?'body':'entity';target.burnLocalX=dx*Math.cos(a)+dy*Math.sin(a);target.burnLocalY=-dx*Math.sin(a)+dy*Math.cos(a);
 }
 target.burnBodyId=body?.id??null;target.burnPartId=partId;
}

function igniteSharedBurn(owner,target,round,accepted){
 if(!target||!(target.hp>0))return;
 const aerostat=target.fieldUnit==='balloon'||target.type==='zeppelin'||/zeppelin|hma23|drachen/.test(target.stageBossBody?.kind||''),dps=isBossTarget(target)?(aerostat?WWI_BALANCE.burn.aerostatBossDpsCap:WWI_BALANCE.burn.bossDpsCap):(aerostat?WWI_BALANCE.burn.aerostatDps:WWI_BALANCE.burn.dps);
 // All incendiary equipment uses the existing target burn slot. An active fire
 // keeps its remaining duration and strongest source, so repeated belts cannot
 // create stacks or hold a boss alight forever.
 const starting=!(target.burnTime>0),current=starting?0:target.burnDps||0;
 if(starting){target.burnTime=round?.fieryGrapnel?WWI_BALANCE.burn.grapnelDuration:WWI_BALANCE.burn.duration;target.fuelFxAge=0;storeBurnAnchor(target,round,accepted);}
 target.burnDps=Math.max(current,dps);
 if(dps>=current){target.burnOwnerId=ownerId(owner);target.burnSupport=false;target.wwiBurnOwnerId=ownerId(owner);target.wwiBurnDps=dps;}
}

// Front and independently fired rear guns each keep one bounded preparation lane.
function noteMachineGunHit(owner,round,target,now){
 const id=targetId(owner,target),rear=round.pilotRear?'Rear':'';
 for(const [equipment,label,balance] of [['buckinghamBelt','Buckingham',WWI_BALANCE.buckingham],['hytheCamera','Hythe',WWI_BALANCE.hytheCamera]]){
  if(!hasEquipment(owner,equipment))continue;
  const key=`wwi${label}${rear}`;
  // A quad volley is one trigger even if its pellets reach the target in different frames.
  if(round.wwiVolleyAt!=null&&round.wwiVolleyAt<=(owner[key+'VolleyAt']??-Infinity))continue;
  owner[key+'VolleyAt']=round.wwiVolleyAt;owner[key+'VolleyTargetId']=id;
  const continuing=owner[key+'TargetId']===id&&now-(owner[key+'LastHitAt']??-Infinity)<=balance.hitGap;
  owner[key+'Hits']=continuing?(owner[key+'Hits']||0)+1:1;owner[key+'TargetId']=id;owner[key+'LastHitAt']=now;
  if(owner[key+'Hits']<balance.hits)continue;
  owner[key+'Hits']=0;
  if(equipment==='buckinghamBelt')igniteSharedBurn(owner,target,round,combatImpactResult(round,target));
  else{owner[key+'AnalyzedId']=id;owner[key+'Visible']=balance.visibility;owner.wwiHytheShutter=.38;}
 }
}

// Luke consumes the real equipment DOT slot, never a second copy in its pilot Map.
export function equipmentBurn(owner,target,{consume=false}={}){
 if(!(target?.burnTime>0)||target.burnOwnerId!==ownerId(owner)||target.wwiBurnOwnerId!==ownerId(owner)||target.burnDps!==target.wwiBurnDps)return null;
 const burn={time:target.burnTime,dps:target.burnDps,point:wwiBurnPoint(target),partId:target.burnPartId??null};
 if(consume){target.burnTime=0;target.burnDps=0;for(const key of ['wwiBurnOwnerId','wwiBurnDps','burnAnchorSpace','burnPartId','burnBodyId','burnLocalX','burnLocalY'])delete target[key];}
 return burn;
}

const equipmentGunScale=owner=>1+Math.min(.5,.5*Math.max(0,finite(owner.gunUpgradeBonus)));

function attachGrapnel(owner,round,target,accepted){
 const body=target.stageBossBody,part=accepted?.partId!=null?(body?.parts?.get?.(accepted.partId)||valuesOf(body?.parts).find(p=>p.id===accepted.partId)):null,center=part?partPoint(body,part):body||target,point=closestImpact(round,target,center),host=body||target,a=finite(body?.hullYaw,finite(body?.angle,finite(host.a))),dx=point.x-finite(host.x),dy=point.y-finite(host.y);
 owner.wwiGrapnel={targetId:targetId(owner,target),localX:dx*Math.cos(a)+dy*Math.sin(a),localY:-dx*Math.sin(a)+dy*Math.cos(a),age:0,life:WWI_BALANCE.grapnel.cableDuration,maxLife:WWI_BALANCE.grapnel.cableDuration};owner.wwiGrapnelCable=owner.wwiGrapnel;
 igniteSharedBurn(owner,target,round,accepted);
}

export function installWWIEquipment(Game){
 const prototype=Game?.prototype;if(!prototype)throw new TypeError('installWWIEquipment requires a Game constructor');
 if(Object.hasOwn(prototype,INSTALLED))return Game;
 Object.defineProperty(prototype,INSTALLED,{value:true});
 const apply=prototype.applySpecialRound;
 prototype.applySpecialRound=function(round,type){
  const result=apply?apply.call(this,round,type):round;
  if(result&&privateMachineGunRound(this,result,true)){
   const preparing=privateMachineGunRound(this,result);
   if(preparing){result.wwiVolleyAt=finite(combatWorld(this)?.t,finite(this.t));result.wwiMachineGun=true;}
   if(preparing&&hasEquipment(this,'buckinghamBelt'))result.wwiIncendiary=true;
   if(hasEquipment(this,'hytheCamera')){
    const ids=['','Rear'].filter(lane=>this[`wwiHythe${lane}Visible`]>0).map(lane=>this[`wwiHythe${lane}AnalyzedId`]);
    if(ids.length){result.wwiCameraTargetId=ids[0];result.wwiCameraTargetIds=ids;}
   }
  }
  return result;
 };
 const impact=prototype.specialRoundImpact;
 prototype.specialRoundImpact=function(round,target){
  const result=impact?.call(this,round,target),accepted=combatImpactResult(round,target);
  // Collision alone is insufficient: protected parts and phase floors report zero.
  if(!(accepted?.damage>0)||this.canHitTarget&&!this.canHitTarget(target,round)||round?.ownerId!=null&&round.ownerId!==ownerId(this))return result;
  let targets=handledImpacts.get(round);if(!targets){targets=new WeakSet();handledImpacts.set(round,targets);}if(targets.has(target))return result;targets.add(target);
  const now=finite(combatWorld(this)?.t,finite(this.t));
  const direct=privateMachineGunRound(this,round,true)||!round.enemy&&!round.ally&&!round.patrol&&!round.formation&&!round.actualExplosion&&(round.cow37||round.upgradeRocket);
  if(direct&&(hasEquipment(this,'veryPistol')||hasEquipment(this,'mauserAceKiller'))){target.wwiDirectHitAt??={};target.wwiDirectHitAt[ownerId(this)]=now;if(hasEquipment(this,'veryPistol')){this.wwiVeryLastHitId=targetId(this,target);this.wwiVeryLastHitAt=now;}}
  if(round.wwiMachineGun&&privateMachineGunRound(this,round))noteMachineGunHit(this,round,target,now);
  if(round.fieryGrapnel)attachGrapnel(this,round,target,accepted);
  return result;
 };
 return Game;
}

function pushBullet(owner,round,world=combatWorld(owner)){
 world.bullets??=[];
 round.ownerId=ownerId(owner);round.enemy=false;round.rangeExtended=true;round.hit??=new Set();world.bullets.push(round);
 return round;
}

function bombVelocity(owner,previousPose,dt){
 const vx=Number.isFinite(owner.vx)?owner.vx:Number.isFinite(previousPose?.x)&&dt>0?(owner.x-previousPose.x)/dt:Math.cos(finite(owner.a))*finite(owner.baseSpeed??owner.speed);
 const vy=Number.isFinite(owner.vy)?owner.vy:Number.isFinite(previousPose?.y)&&dt>0?(owner.y-previousPose.y)/dt:Math.sin(finite(owner.a))*finite(owner.baseSpeed??owner.speed);
 return{x:vx,y:vy};
}

function unavailableTarget(owner,target,world=combatWorld(owner)){
 const body=target?.stageBossBody;
 return target?.supportInvulnUntil>world?.t||owner.canHitTarget&&!owner.canHitTarget(target)||!!(body&&(body.dead||body.hidden||body.protection>0||body.entryProtection>0));
}

function cooperHasTarget(owner,world,x,y,vx,vy){
 const b=WWI_BALANCE.cooper,x1=x+vx*b.fuse,y1=y+vy*b.fuse,hx=Math.cos(finite(owner.a)),hy=Math.sin(finite(owner.a));
 const eligible=point=>{const forward=(point.x-x)*hx+(point.y-y)*hy;if(forward<0)return false;return segmentMetric(x,y,x1,y1,point.x,point.y).distance<=b.radius+(point.radius||17);};
 for(const target of equipmentTargets(world)){
  if(!(target?.hp>0)||target.dying||target.crashing||target.rivalEscaped||unavailableTarget(owner,target,world))continue;
  if(target.stageBossBody){for(const part of liveParts(target.stageBossBody,owner)){const q=partPoint(target.stageBossBody,part);if(eligible({...q,radius:part.radius||24}))return true;}const body=target.stageBossBody;if(body.coreVulnerable&&eligible({x:body.x,y:body.y,radius:body.coreRadius||28}))return true;}
  else if(eligible({x:target.x,y:target.y,radius:defaultHitRadius(target)}))return true;
 }
 return false;
}

function cooperBomb(owner,world,x,y,vx,vy,damage){
 const bomb={ownerId:ownerId(owner),cooperBomb:true,sprite:'cooper',sx:x,sy:y,x,y,vx,vy,age:0,life:WWI_BALANCE.cooper.fuse,maxLife:WWI_BALANCE.cooper.fuse,radius:WWI_BALANCE.cooper.radius,damage};
 correctWimperisBomb(owner,bomb);(world.friendlyBombs??=[]).push(bomb);return bomb;
}

function beginCooperDrop(owner,world,previousPose,dt){
 const b=WWI_BALANCE.cooper,a=finite(owner.a),velocity=bombVelocity(owner,previousPose,dt),sideX=-Math.sin(a)*11,sideY=Math.cos(a)*11,damage=typeof owner.payloadPower==='function'?owner.payloadPower(b.damage):b.damage;
 if(!cooperHasTarget(owner,world,owner.x,owner.y,velocity.x,velocity.y))return false;
 cooperBomb(owner,world,owner.x-sideX,owner.y-sideY,velocity.x,velocity.y,damage);
 owner.wwiCooperSecondIn=b.stagger;owner.wwiCooperSecondDamage=damage;
 owner.wwiCooperCooldown=b.cooldown;
 return true;
}

function tickCooperSecond(owner,world,dt,previousPose){
 if(!(owner.wwiCooperSecondIn>0))return;
 owner.wwiCooperSecondIn-=dt;
 if(owner.wwiCooperSecondIn>0)return;
 const a=finite(owner.a),velocity=bombVelocity(owner,previousPose,dt);
 cooperBomb(owner,world,owner.x-Math.sin(a)*11,owner.y+Math.cos(a)*11,velocity.x,velocity.y,owner.wwiCooperSecondDamage);
 for(const key of ['wwiCooperSecondIn','wwiCooperSecondX','wwiCooperSecondY','wwiCooperSecondVx','wwiCooperSecondVy','wwiCooperSecondDamage'])delete owner[key];
}

export function isWWIFlyingTarget(target){
 if(!target||!(target.hp>0)||target.dying||target.crashing||target.crashed||target.rivalEscaped)return false;
 if(target.fieldUnit==='balloon')return true;
 if(target.combatLayer!=null)return target.combatLayer==='air';
 if(target.stageBossBody)return !!target.stageBossBody.formationBoss129;
 return !target.surface&&!target.stationary&&!target.fieldUnit&&!target.navalVessel&&!target.missionGround&&!target.missionTank&&!target.groundEscort&&!target.londonInstallation;
}

function grapnelTarget(owner,world,dt,previousPose){
 const b=WWI_BALANCE.grapnel,x0=finite(previousPose?.x,owner.x),y0=finite(previousPose?.y,owner.y);let best=null,bestDistance=Infinity;
 for(const target of equipmentTargets(world)){
  if(!isWWIFlyingTarget(target)||unavailableTarget(owner,target,world))continue;
  const tx1=finite(target.x),ty1=finite(target.y),tx0=finite(target.wwiPreviousX,finite(target.previousX,tx1-finite(target.vx)*dt)),ty0=finite(target.wwiPreviousY,finite(target.previousY,ty1-finite(target.vy)*dt));
  const points=target.stageBossBody?liveParts(target.stageBossBody,owner).map(part=>{const q=partPoint(target.stageBossBody,part);return{...q,radius:part.radius||24};}):[{x:tx1,y:ty1,radius:target.hullLength?Math.hypot(tx1-owner.x,ty1-owner.y)/Math.sqrt(((tx1-owner.x)*Math.cos(target.a||0)+(ty1-owner.y)*Math.sin(target.a||0))**2/target.hullLength**2+(-(tx1-owner.x)*Math.sin(target.a||0)+(ty1-owner.y)*Math.cos(target.a||0))**2/(target.hullWidth||defaultHitRadius(target))**2)||defaultHitRadius(target):defaultHitRadius(target)}];
  if(target.stageBossBody?.coreVulnerable)points.push({x:target.stageBossBody.x,y:target.stageBossBody.y,radius:target.stageBossBody.coreRadius||28});
  for(const point of points){
   const moving=target.stageBossBody?segmentMetric(x0,y0,owner.x,owner.y,point.x,point.y):segmentMetric(x0,y0,owner.x,owner.y,tx0,ty0,tx1,ty1),limit=(point.radius||17)+b.proximity;
   const radius=point.radius||17,cx=point.x-owner.x,cy=point.y-owner.y,centerDistance=Math.hypot(cx,cy),cable=Math.max(0,centerDistance-radius);
   if(Math.hypot((owner.x-x0)-(tx1-tx0),(owner.y-y0)-(ty1-ty0))>.25&&moving.distance<=limit&&cable<=b.maxCable&&moving.distance<bestDistance){const scale=centerDistance?cable/centerDistance:0;best={target,point:{x:owner.x+cx*scale,y:owner.y+cy*scale}};bestDistance=moving.distance;}
  }
 }
 return best;
}

function fireGrapnel(owner,contact,world=combatWorld(owner)){
 const b=WWI_BALANCE.grapnel,target=contact.target,dx=contact.point.x-owner.x,dy=contact.point.y-owner.y;
 const a=Math.hypot(dx,dy)>.001?Math.atan2(dy,dx):Math.atan2(target.y-owner.y,target.x-owner.x);
 // Even an overlapping launch must survive a full .04 s frame before collision.
 pushBullet(owner,{x:owner.x,y:owner.y,previousX:owner.x,previousY:owner.y,vx:Math.cos(a)*b.speed,vy:Math.sin(a)*b.speed,life:Math.min(b.maxCable/b.speed,b.life),damage:b.damage*equipmentGunScale(owner),collisionRadius:b.collisionRadius,fieryGrapnel:true,sweptProjectile:true,wwiTargetId:targetId(owner,target),specialColor:'#ff8b43'},world);
}

function flechetteTargetAhead(owner,world){
 const b=WWI_BALANCE.flechettes,reach=b.speed*b.life,heading=finite(owner.a),c=Math.cos(heading),s=Math.sin(heading);
 let chosen=null,best=Infinity;
 for(const e of equipmentTargets(world)){
  if(!(e.hp>0)||e.dying||e.crashing||e.rivalEscaped||unavailableTarget(owner,e,world))continue;
  const points=e.stageBossBody?liveParts(e.stageBossBody,owner).map(p=>({...partPoint(e.stageBossBody,p),radius:p.radius||24})):[{x:e.x,y:e.y,radius:defaultHitRadius(e)}];
  if(e.stageBossBody?.coreVulnerable)points.push({x:e.stageBossBody.x,y:e.stageBossBody.y,radius:e.stageBossBody.coreRadius||28});
  for(const p of points){
   const dx=p.x-owner.x,dy=p.y-owner.y,forward=dx*c+dy*s,side=Math.abs(-dx*s+dy*c);
   if(forward<0||forward>reach+p.radius||side>b.laneWidth/2+forward*Math.tan(b.aimCone)+p.radius)continue;
   const lead=Math.min(.3,Math.hypot(dx,dy)/b.speed),speed=finite(e.speed)*(e.airframeSpeed??1);
   const aim=Math.atan2(dy+Math.sin(finite(e.a))*speed*lead,dx+Math.cos(finite(e.a))*speed*lead),score=Math.hypot(dx,dy)+side*.5;
   if(score<best){best=score;chosen=heading+Math.max(-b.aimCone,Math.min(b.aimCone,angleDelta(aim,heading)));}
  }
 }
 return chosen==null?null:{a:chosen};
}

function fireFlechettes(owner,world=combatWorld(owner),start=0){
 const b=WWI_BALANCE.flechettes,den=Math.max(1,b.burst-1),heading=flechetteTargetAhead(owner,world)?.a??finite(owner.a);
 for(let i=start;i<Math.min(b.count,start+b.burst);i++){
  const t=(i%b.burst)/den,a=heading+(t-.5)*b.spread,lane=(t-.5)*b.laneWidth,damage=(b.minDamage+(b.maxDamage-b.minDamage)*(i%3)/2)*equipmentGunScale(owner),x=owner.x+Math.cos(owner.a)*20-Math.sin(owner.a)*lane,y=owner.y+Math.sin(owner.a)*20+Math.cos(owner.a)*lane;
  pushBullet(owner,{x,y,previousX:x,previousY:y,vx:Math.cos(a)*b.speed,vy:Math.sin(a)*b.speed,life:b.life,damage,pierce:true,flechette:true,sweptProjectile:true,collisionRadius:b.collisionRadius,specialColor:'#d9d7c8',heavyTargetMultiplier:b.heavyMultiplier},world);
 }
}

function liveParts(body,owner){
 if(!body||body.dead||body.hidden||body.protection>0||body.entryProtection>0)return [];
 const world=combatWorld(owner);
 return valuesOf(body.parts).filter(part=>{
  if(!part||part.destroyed||part.hidden||part.active===false||part.invulnerable||part.hittable===false||!(part.hp>0))return false;
  if(world?.stageBoss?.showFloors&&body.partFloor?.(part.id)>=part.hp)return false;
  const point=partPoint(body,part),hit=body.locateHit?.({...point,previousX:point.x,previousY:point.y,radius:0});
  return !body.locateHit||hit?.partId===part.id;
 });
}

function partPoint(body,part){
 const raw=body?.support129?.parts?.get?.(part.id);
 if(raw&&typeof body.support129.world==='function')return body.support129.world(raw.nx,raw.ny);
 return{x:finite(body?.x)+finite(part?.x),y:finite(body?.y)+finite(part?.y)};
}

export function wwiBurnPoint(target){
 if(!target)return null;
 const body=target.stageBossBody,space=target.burnAnchorSpace;
 if(space==='support129'&&body?.support129){
  const support=body.support129;
  if(typeof support.world==='function')return support.world(target.burnLocalX,target.burnLocalY);
  const a=finite(support.angle,finite(body.hullYaw)),x=target.burnLocalX*Math.max(1,finite(support.width,1)),y=target.burnLocalY*Math.max(1,finite(support.height,1));
  return{x:finite(support.x,body.x)+x*Math.cos(a)-y*Math.sin(a),y:finite(support.y,body.y)+x*Math.sin(a)+y*Math.cos(a)};
 }
 const host=space==='body'&&body?body:target,a=finite(body?.hullYaw,finite(body?.angle,finite(host.a))),x=finite(target.burnLocalX),y=finite(target.burnLocalY);
 return{x:finite(host.x)+x*Math.cos(a)-y*Math.sin(a),y:finite(host.y)+x*Math.sin(a)+y*Math.cos(a)};
}

function veryTarget(owner,world=combatWorld(owner),excludeId=null){
 let best=null,bestPart=null,bestDistance=Infinity;
 const now=finite(world.t,finite(owner.t)),recent=now-(owner.wwiVeryLastHitAt??-Infinity)<=1?owner.wwiVeryLastHitId:null;
 const priority=target=>targetId(owner,target)===recent?0:1;
 const better=(target,d)=>!best||priority(target)<priority(best)||priority(target)===priority(best)&&d<bestDistance;
 const forward=point=>Math.abs(angleDelta(Math.atan2(point.y-owner.y,point.x-owner.x),finite(owner.a)))<=Math.PI/2;
 for(const target of equipmentTargets(world)){
  if(targetId(owner,target)===excludeId||!(target?.hp>0)||target.dying||target.crashing||target.rivalEscaped||unavailableTarget(owner,target,world))continue;
  let part=null,point=target;
  if(target.stageBossBody){
   for(const candidate of liveParts(target.stageBossBody,owner)){const q=partPoint(target.stageBossBody,candidate);if(!forward(q))continue;const d=(q.x-owner.x)**2+(q.y-owner.y)**2;if(d<=650**2&&better(target,d)){best=target;bestPart=candidate;bestDistance=d;}}
   if(best===target||!target.stageBossBody.coreVulnerable)continue;
  }
  if(!forward(point))continue;
  const d=(point.x-owner.x)**2+(point.y-owner.y)**2;if(d<=650**2&&better(target,d)){best=target;bestPart=part;bestDistance=d;}
 }
 return best?{target:best,part:bestPart}:null;
}

function beginVerySignal(owner,world=combatWorld(owner)){
 if(!ownedWings(owner,world).length)return false;
 const chosen=veryTarget(owner,world);if(!chosen)return false;
 owner.wwiVeryRetargeted=false;owner.wwiVeryTargetId=targetId(owner,chosen.target);owner.wwiVeryPartId=chosen.part?.id??null;owner.wwiVeryTime=WWI_BALANCE.veryPistol.duration;owner.wwiVeryCooldown=WWI_BALANCE.veryPistol.cooldown;owner.wwiVery={x:owner.x,y:owner.y,a:finite(owner.a),age:0,life:owner.wwiVeryTime,maxLife:WWI_BALANCE.veryPistol.duration,targetId:owner.wwiVeryTargetId,partId:owner.wwiVeryPartId};
 return true;
}

function clearTransient(owner){
 owner.wwiFlechetteRemaining=0;owner.wwiHytheShutter=0;
 for(const key of Object.keys(owner))if(/^wwi(?:BuckinghamRear|HytheRear|VeryLastHit)/.test(key))delete owner[key];
 owner.wwiVeryTime=0;owner.wwiVeryTargetId=null;owner.wwiVeryPartId=null;owner.wwiVery=null;owner.wwiGrapnel=null;owner.wwiGrapnelCable=null;owner.wwiHytheVisible=0;owner.wwiHytheHits=0;owner.wwiHytheTargetId=null;owner.wwiBuckinghamHits=0;owner.wwiBuckinghamTargetId=null;
 for(const key of ['wwiCooperSecondIn','wwiCooperSecondX','wwiCooperSecondY','wwiCooperSecondVx','wwiCooperSecondVy','wwiCooperSecondDamage'])delete owner[key];
}

export function tickWWIEquipment(owner,world,dt,previousPose){
 if(!owner||!Number.isFinite(dt)||dt<=0)return;
 sampleWimperisMotion(owner);
 if(!WWI_EQUIPMENT.some(({id})=>hasEquipment(owner,id)))return;
 world??=combatWorld(owner);if(!activeOwner(owner,world)){clearTransient(owner);return;}
 for(const lane of ['', 'Rear']){
  const key='wwiHythe'+lane;owner[key+'Visible']=Math.max(0,(owner[key+'Visible']||0)-dt);
  if(finite(world.t,finite(owner.t))-(owner[key+'LastHitAt']??-Infinity)>WWI_BALANCE.hytheCamera.hitGap){owner[key+'Hits']=0;owner[key+'TargetId']=null;}
 }
 owner.wwiHytheShutter=Math.max(0,(owner.wwiHytheShutter||0)-dt);
 if(owner.wwiGrapnel){owner.wwiGrapnel.age+=dt;owner.wwiGrapnel.life-=dt;owner.wwiGrapnelCable=owner.wwiGrapnel;if(!(owner.wwiGrapnel.life>0))owner.wwiGrapnel=owner.wwiGrapnelCable=null;}
 if(owner.wwiVeryTime>0){owner.wwiVeryTime=Math.max(0,owner.wwiVeryTime-dt);if(owner.wwiVery){owner.wwiVery.age+=dt;owner.wwiVery.life=owner.wwiVeryTime;}if(!owner.wwiVeryTime){owner.wwiVeryTargetId=null;owner.wwiVeryPartId=null;owner.wwiVery=null;}}
 if(hasEquipment(owner,'cooperRack')){
  tickCooperSecond(owner,world,dt,previousPose);owner.wwiCooperCooldown=Math.max(0,(owner.wwiCooperCooldown||0)-dt);
  if(owner.wwiCooperCooldown<=0&&!owner.wwiCooperSecondIn)beginCooperDrop(owner,world,previousPose,dt);
 }
 if(hasEquipment(owner,'fieryGrapnel')){
  owner.wwiGrapnelCooldown=Math.max(0,(owner.wwiGrapnelCooldown||0)-dt);
  if(owner.wwiGrapnelCooldown<=0){const contact=grapnelTarget(owner,world,dt,previousPose);if(contact){fireGrapnel(owner,contact,world);owner.wwiGrapnelCooldown=WWI_BALANCE.grapnel.cooldown;}}
 }
 if(hasEquipment(owner,'flechettes')){
  owner.wwiFlechetteCooldown=Math.max(0,(owner.wwiFlechetteCooldown||0)-dt);
  const b=WWI_BALANCE.flechettes;
  if(owner.wwiFlechetteRemaining>0){
   owner.wwiFlechetteNext=(owner.wwiFlechetteNext||0)-dt;
   while(owner.wwiFlechetteNext<=0&&owner.wwiFlechetteRemaining>0){fireFlechettes(owner,world,b.count-owner.wwiFlechetteRemaining);owner.wwiFlechetteRemaining-=b.burst;owner.wwiFlechetteNext+=b.stagger;}
  }else if(owner.wwiFlechetteCooldown<=0&&flechetteTargetAhead(owner,world)){
   fireFlechettes(owner,world);owner.wwiFlechetteRemaining=b.count-b.burst;owner.wwiFlechetteNext=b.stagger;owner.wwiFlechetteCooldown=b.cooldown;
  }
 }
 if(hasEquipment(owner,'veryPistol')){
  owner.wwiVeryCooldown=Math.max(0,(owner.wwiVeryCooldown||0)-dt);
  if(owner.wwiVeryCooldown<=0&&!beginVerySignal(owner,world))owner.wwiVeryCooldown=.25;
 }
}

export function resolveWWITarget(owner,id){return id==null?null:equipmentTargets(combatWorld(owner)).find(target=>target.tailId===id||target.id===id||target.id!=null&&`wwi-${target.id}`===id||target.stageBossBody?.id===id)||null;}

export function wwiWingTarget(owner,wing){
 if(!hasEquipment(owner,'veryPistol')||!(owner.wwiVeryTime>0)||wing&&wing.ownerId!==ownerId(owner))return null;
 let target=resolveWWITarget(owner,owner.wwiVeryTargetId),part=owner.wwiVeryPartId!=null&&target?.stageBossBody?liveParts(target.stageBossBody,owner).find(p=>p.id===owner.wwiVeryPartId):null;
 const missing=!target||owner.wwiVeryPartId!=null&&!part;
 if(missing&&!owner.wwiVeryRetargeted){
  owner.wwiVeryRetargeted=true;const chosen=veryTarget(owner,combatWorld(owner),owner.wwiVeryTargetId);
  if(chosen){target=chosen.target;part=chosen.part;owner.wwiVeryTargetId=targetId(owner,target);owner.wwiVeryPartId=part?.id??null;if(owner.wwiVery){owner.wwiVery.targetId=owner.wwiVeryTargetId;owner.wwiVery.partId=owner.wwiVeryPartId;}}
 }
 if(!target||!(target.hp>0)||unavailableTarget(owner,target)||owner.wwiVeryPartId!=null&&!part){owner.wwiVery=null;owner.wwiVeryTime=0;owner.wwiVeryTargetId=null;owner.wwiVeryPartId=null;return null;}
 return part?{...partPoint(target.stageBossBody,part),target,partId:part.id}:{x:target.x,y:target.y,target,partId:null};
}

function defaultHitRadius(target){
 return finite(target?.hitRadius,target?.heavyBomber?55:target?.type==='zeppelin'?42:target?.type==='bomber'?23:target?.type==='boss'?19:17);
}

export function wwiSweptProjectileHit(round,target,radius=defaultHitRadius(target)){
 if(!round?.sweptProjectile||!target||target.stageBossBody)return false;
 const x1=finite(round.x),y1=finite(round.y),x0=finite(round.previousX,x1),y0=finite(round.previousY,y1),tx1=finite(target.x),ty1=finite(target.y),tx0=finite(target.wwiPreviousX,finite(target.previousX,tx1)),ty0=finite(target.wwiPreviousY,finite(target.previousY,ty1));
 const ax=x0-tx0,ay=y0-ty0,dx=(x1-tx1)-ax,dy=(y1-ty1)-ay,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/length)):0,qx=ax+dx*t,qy=ay+dy*t,r=Math.max(0,finite(typeof radius==='function'?radius(target):radius))+Math.max(0,finite(round.collisionRadius));
 if(target.hullLength){const a=finite(target.a),ca=Math.cos(a),sa=Math.sin(a),pad=Math.max(0,finite(round.collisionRadius)),l=target.hullLength+pad,w=target.hullWidth+pad,u=(ax*ca+ay*sa)/l,v=(-ax*sa+ay*ca)/w,du=(dx*ca+dy*sa)/l,dv=(-dx*sa+dy*ca)/w,t=(du*du+dv*dv)?Math.max(0,Math.min(1,-(u*du+v*dv)/(du*du+dv*dv))):0;return (u+du*t)**2+(v+dv*t)**2<=1;}return qx*qx+qy*qy<=r*r;
}

export function wwiProjectileDamageMultiplier(round,target,owner){
 if(!round?.flechette){
  const ids=round?.wwiCameraTargetIds||[round?.wwiCameraTargetId];
  if(owner&&(!hasEquipment(owner,'hytheCamera')||round.ownerId!=null&&round.ownerId!==ownerId(owner)))return 1;
  const valid=owner?['','Rear'].filter(lane=>owner[`wwiHythe${lane}Visible`]>0).map(lane=>owner[`wwiHythe${lane}AnalyzedId`]):ids;
  return ids.some(id=>id!=null&&valid.includes(id)&&[target?.tailId,target?.id,`wwi-${target?.id}`].includes(id))?WWI_BALANCE.hytheCamera.damageMultiplier:1;
 }
 const heavy=!!(target?.navalVessel||target?.missionTank||target?.armored||target?.heavyArmor||target?.stageBossBody&&target.combatLayer!=='air'&&!/trench|balloon|drachen/.test(target.stageBossBody.kind||''));
 return heavy?WWI_BALANCE.flechettes.heavyMultiplier:1;
}

function cameraHazardCue(world,now,body){
 let best=null,bestRemaining=Infinity;
 world?.stageBoss?.hazards?.pool?.visit?.(hazard=>{
  if(hazard?.phase!=='warning'||!(hazard.damage>0)||!(hazard.bossId===body.id||hazard.bossId===body.kind))return;
  const elapsed=Math.max(0,finite(hazard.age)-finite(hazard.delay)),remaining=Math.max(0,finite(hazard.warning)-elapsed);
  if(remaining<bestRemaining){bestRemaining=remaining;best={kind:'boss-warning',x:hazard.x,y:hazard.y,radius:hazard.radius||0,angle:hazard.angle,until:now+remaining,bossId:hazard.bossId,partId:hazard.sourcePartId||null};}
 });
 return best;
}

// Shared target selection only: the active never advances the analysis hit lanes.
export function analyzedEquipmentTarget(owner,{x=owner.x,y=owner.y,heading=owner.a,range=620,cone=.36}={}){
 if(!hasEquipment(owner,'hytheCamera'))return null;
 const ids=['','Rear'].filter(lane=>owner[`wwiHythe${lane}Visible`]>0).map(lane=>owner[`wwiHythe${lane}AnalyzedId`]);
 let best=null,distance=range;
 for(const id of ids){
  const e=resolveWWITarget(owner,id);if(!e||unavailableTarget(owner,e)||e.invuln>0||e.invulnerable)continue;
  const d=Math.hypot(e.x-x,e.y-y),a=Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-y,e.x-x)-heading),Math.cos(Math.atan2(e.y-y,e.x-x)-heading)));
  if(d<=distance&&a<=cone){best=e;distance=d;}
 }
 return best;
}

export function currentCameraCue(owner,world=combatWorld(owner)){
 if(!hasEquipment(owner,'hytheCamera')||!world||!activeOwner(owner,world))return null;
 const lane=owner.wwiHytheVisible>0?'':owner.wwiHytheRearVisible>0?'Rear':null;if(lane===null)return null;
 const now=finite(world.t,finite(owner.t)),candidates=[],analyzed=resolveWWITarget(owner,owner[`wwiHythe${lane}AnalyzedId`]||owner[`wwiHythe${lane}TargetId`]);if(!analyzed||!(analyzed.hp>0))return null;
 for(const enemy of [analyzed]){
  if(enemy!==analyzed||!(enemy?.hp>0))continue;
  const id=enemy.tailId??enemy.id??enemy.stageBossBody?.id??null;
  if(enemy.dangerAimUntil>now&&Number.isFinite(enemy.dangerAim))candidates.push({kind:'enemy-aim',targetId:id,x:enemy.x,y:enemy.y,angle:enemy.dangerAim,until:enemy.dangerAimUntil});
  if(enemy.precisionWarning?.time>0)candidates.push({kind:'precision-warning',targetId:id,x:enemy.x,y:enemy.y,targetX:enemy.precisionWarning.x,targetY:enemy.precisionWarning.y,until:now+enemy.precisionWarning.time});
  // Elite rocket warnings are driven by rocketTimer/telegraph, not the
  // initialized aimTimer/warningTimer slots that their AI never advances.
  if(enemy.telegraph>0&&enemy.rocketTimer>0&&Number.isFinite(enemy.gunAim))candidates.push({kind:'enemy-aim',targetId:id,x:enemy.x,y:enemy.y,angle:enemy.gunAim,until:now+enemy.rocketTimer});
 }
 const hazard=analyzed.stageBossBody?cameraHazardCue(world,now,analyzed.stageBossBody):null;if(hazard&&(hazard.bossId===analyzed.stageBossBody.id||hazard.bossId===analyzed.stageBossBody.kind))candidates.push(hazard);
 const cuePattern=/(?:warning|warn|aim)/i;
 for(const cue of analyzed.stageBossBody?world.bossCues||[]:[])if(cue?.life>0&&cuePattern.test(String(cue.type||cue.kind||''))&&(cue.bossId===analyzed.stageBossBody.id||cue.bossId===analyzed.stageBossBody.kind||cue.bossId==null&&(world.enemies||[]).filter(e=>e.hp>0&&e.stageBossBody).length===1))candidates.push({kind:'boss-cue',type:cue.type||cue.kind,x:cue.x,y:cue.y,angle:cue.angle,until:now+cue.life,bossId:cue.bossId,partId:cue.partId||null});
 if(!candidates.length)return null;
 candidates.sort((a,b)=>(a.until??Infinity)-(b.until??Infinity)||Math.hypot(finite(a.x)-owner.x,finite(a.y)-owner.y)-Math.hypot(finite(b.x)-owner.x,finite(b.y)-owner.y));
 return candidates[0];
}

