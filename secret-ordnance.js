import {combatImpactResult} from './combat-impact-result.js?v=d7a0cfcfc455802b';
import {hasSecretWeapon,secretWeaponEffect} from './secret-weapons.js?v=d7a0cfcfc455802b';
import {cameraTargetPoint} from './wwi-equipment.js?v=d7a0cfcfc455802b';

const ROCKET='lePrieurSalvo', DAVIS='davisRecoilless', PUW='puw50';
export const SECRET_ORDNANCE=Object.freeze({
 rocket:Object.freeze({count:8,period:6.8,stagger:.064,speed:550,life:1.55,damage:52,splash:.34,radius:56}),
 davis:Object.freeze({speed:550,range:660,cone:.34,damageScale:1.55,armorScale:1.4,rearSpeed:300,rearLife:.23,rearDamageScale:.14}),
 puw:Object.freeze({count:4,period:8.8,spacing:72,maxRun:2.35,fallTime:.64,velocityRetention:.32,damage:110,radius:62})
});
const worldOf=p=>p.combatWorld?.()||p.world||p;
const clock=p=>worldOf(p).t||0;
const power=(p,base)=>p.payloadPower?.(base)??base;
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const previousPuwPose=new WeakMap();

function mount(x,y,a,fore,side=0){
 const cos=Math.cos(a),sin=Math.sin(a);
 return {x:x+fore*cos-side*sin,y:y+fore*sin+side*cos};
}

function ballistic(x,y,a,speed,life,damage,collisionRadius,id){
 return {x,y,previousX:x,previousY:y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
  life,damage,collisionRadius,pierce:false,secretWeapon:id,sweptProjectile:true,
  rangeExtended:true,heavyRoundPrepared:true,synthesisChild:true};
}

function tickLePrieur(p,now,{cue,sound,emit}){
 const state=secretWeaponEffect(p,ROCKET),balance=SECRET_ORDNANCE.rocket;
 if(state.remaining==null){
  if(state.readyAt>now)return;
  state.readyAt=now+balance.period;
  state.remaining=balance.count;
  state.nextLaunch=now;
 }
 if(state.nextLaunch>now)return;
 const index=balance.count-state.remaining,side=index%2?-1:1,rack=Math.floor(index/2);
 const width=p.bomberTransfer?.hullWidth?Math.min(1.7,p.bomberTransfer.hullWidth/31):1;
 const a=p.a+side*(.027+.072*rack),pos=mount(p.x,p.y,p.a,13,(13+6*rack)*side*width);
 const round=ballistic(pos.x,pos.y,a,balance.speed,balance.life,power(p,balance.damage),8,ROCKET);
 emit(p,{...round,rocket:true});
 cue(p,'lePrieurIgnition',pos,{a,slot:index,life:.44});
 sound(p,'secretLePrieurIgnition');
 if(--state.remaining===0){delete state.remaining;delete state.nextLaunch;}
 else state.nextLaunch+=balance.stagger;
}

function releasePuw(p,pose,vx,vy,index,{cue,sound}){
 const balance=SECRET_ORDNANCE.puw,g=worldOf(p),pos=mount(pose.x,pose.y,pose.a,-5);
 const bomb={...pos,sx:pos.x,sy:pos.y,vx:vx*balance.velocityRetention,vy:vy*balance.velocityRetention,
  ownerId:p.id||'p1',secretWeapon:PUW,sprite:'puw',releaseAngle:pose.a,life:balance.fallTime,
  maxLife:balance.fallTime,radius:balance.radius,damage:power(p,balance.damage),puwIndex:index};
 (g.friendlyBombs??=[]).push(bomb);
 cue(p,'puwDrop',pos,{a:pose.a,slot:index,life:.26});
 sound(p,'secretPuwDrop');
}

function tickPuw(p,dt,now,previous,fx){
 const latest={x:p.x,y:p.y,a:p.a},fallback=previousPuwPose.get(p);
 previousPuwPose.set(p,latest);
 const from=fallback??(Number.isFinite(previous?.x)&&Number.isFinite(previous?.y)?previous:null);
 if(!from)return;
 const balance=SECRET_ORDNANCE.puw,state=secretWeaponEffect(p,PUW);
 if(state.remaining>0&&now>state.runUntil){delete state.remaining;delete state.nextDistance;delete state.runUntil;}
 const dx=latest.x-from.x,dy=latest.y-from.y,travel=Math.hypot(dx,dy);
 // Map repositions are ineligible as release segments. Normal sortie and boost
 // movement both stay below this world-speed limit.
 if(!(travel>.05)||travel>dt*1500)return;
 const vx=dx/dt,vy=dy/dt;
 if(!state.remaining){
  if(state.readyAt>now)return;
  state.readyAt=now+balance.period;
  state.runUntil=now+balance.maxRun;
  state.remaining=balance.count-1;
  state.nextDistance=balance.spacing;
  releasePuw(p,latest,vx,vy,0,fx);
  return;
 }
 let next=state.nextDistance;
 while(next<=travel&&state.remaining>0){
  const q=next/travel,startAngle=from.a??fallback?.a??latest.a;
  const pose={x:from.x+dx*q,y:from.y+dy*q,a:startAngle+angleDelta(latest.a,startAngle)*q};
  releasePuw(p,pose,vx,vy,balance.count-state.remaining,fx);
  state.remaining--;
  next+=balance.spacing;
 }
 if(state.remaining>0)state.nextDistance=next-travel;
 else{delete state.remaining;delete state.nextDistance;delete state.runUntil;}
}

export function tickSecretOrdnance(p,dt,previous,fx){
 if(p.heineckeEscape>0||p.isBomberEntering?.()){clearSecretOrdnanceTransient(p);return;}
 const now=clock(p);
 if(hasSecretWeapon(p,ROCKET))tickLePrieur(p,now,fx);
 if(hasSecretWeapon(p,PUW))tickPuw(p,dt,now,previous,fx);
}

export function clearSecretOrdnanceTransient(p){
 previousPuwPose.delete(p);
 const rocket=p.secretWeaponState?.effects?.[ROCKET],puw=p.secretWeaponState?.effects?.[PUW];
 if(rocket){delete rocket.remaining;delete rocket.nextLaunch;}
 if(puw){delete puw.remaining;delete puw.nextDistance;delete puw.runUntil;}
}

function davisTarget(p,config){
 let best=null,distance=config.range;
 for(const lane of ['','Rear']){
  const key='wwiHythe'+lane;
  if(!(p[key+'Visible']>0))continue;
  const point=cameraTargetPoint(p,p[key+'AnalyzedId'],p[key+'AnalyzedPartId']);
  if(!point||point.target.invuln>0||point.target.invulnerable||p.canHitTarget?.(point.target)===false)continue;
  const dx=point.x-p.x,dy=point.y-p.y,range=Math.hypot(dx,dy);
  const nose=p.bomberTransfer?.front??38;
  if(range<=nose+10||range>distance||Math.abs(angleDelta(Math.atan2(dy,dx),p.a))>config.cone)continue;
  best=point;
  distance=range;
 }
 return best;
}

export function fireSecretDavis(p,baseDamage,{cue,sound,emit}){
 if(!hasSecretWeapon(p,DAVIS)||!p.upgrades?.hytheCamera)return false;
 const balance=SECRET_ORDNANCE.davis,point=davisTarget(p,balance);
 if(!point)return false;
 const target=point.target.stageBossBody||point.target;
 const lead=Math.min(.65,Math.hypot(point.x-p.x,point.y-p.y)/balance.speed);
 const vx=Number.isFinite(target.vx)?target.vx:0,vy=Number.isFinite(target.vy)?target.vy:0;
 const wanted=Math.atan2(point.y+vy*lead-p.y,point.x+vx*lead-p.x);
 const a=p.a+Math.max(-balance.cone,Math.min(balance.cone,angleDelta(wanted,p.a)));
 const front=mount(p.x,p.y,a,p.bomberTransfer?.front??38),back=mount(p.x,p.y,a,-(p.bomberTransfer?.rear??25));
 const forward=ballistic(front.x,front.y,a,balance.speed,1.36,baseDamage*balance.damageScale,9,DAVIS);
 const rear=ballistic(back.x,back.y,a+Math.PI,balance.rearSpeed,balance.rearLife,baseDamage*balance.rearDamageScale,4,DAVIS);
 // Keep existing heavy contact handling, while the countershot cancels the
 // standard moteur recoil and both ends use the Davis-specific impact cues.
 emit(p,{...forward,motorCannon:true,recoil113:true,cannonDetonated:true,secretDavisShell:true});
 emit(p,{...rear,secretAirRound:true,secretDavisRear:true});
 cue(p,'davisShot',front,{a,rearX:back.x,rearY:back.y,life:.83});
 sound(p,'secretDavisShot');
 const g=worldOf(p);
 g.shake=Math.max(g.shake||0,4);
 return true;
}

export function secretOrdnanceDamageScale(b,target){
 if(!b.secretDavisShell)return 1;
 const armored=target.stageBossBody||target.finalArenaTarget||target.armored||target.heavyArmor||target.heavyBomber||target.missionTank||target.navalVessel;
 return armored?SECRET_ORDNANCE.davis.armorScale:1;
}

export function secretOrdnanceAllowsTarget(b,target){
 return !b?.secretDavisRear||!(target.stageBossBody||target.finalArenaTarget||target.groundFacility||target.heavyBomber||target.type==='zeppelin');
}

export function secretOrdnanceContact(p,b,target,{cue,sound}){
 if(b.secretWeapon!==ROCKET&&b.secretWeapon!==DAVIS)return false;
 if(b.secretDavisRear)return true;
 const impact=combatImpactResult(b,target),x=impact?.impactX??b.x,y=impact?.impactY??b.y;
 const a=Math.atan2(b.vy,b.vx),pos={x,y};
 if(b.secretWeapon===ROCKET){
  if(b.rocketDetonated)return true;
  b.rocketDetonated=true;
  const config=SECRET_ORDNANCE.rocket,splashDamage=b.damage*config.splash;
  const bossDamage=new Map();
  if(target.stageBossBody)bossDamage.set(target.stageBossBody,p.explosionDamage?.(splashDamage)??splashDamage);
  p.queueExplosionDamage(x,y,config.radius,splashDamage,{exclude:target,presentation:false,bomberSalvo:{bossDamage,bossCap:splashDamage}});
  cue(p,'lePrieurImpact',pos,{a,radius:p.explosionRadius?.(config.radius)??config.radius,life:.60});
  sound(p,'secretLePrieurImpact');
 }else{
  if(b.secretDavisContacted)return true;
  b.secretDavisContacted=true;
  cue(p,'davisImpact',pos,{a,armored:secretOrdnanceDamageScale(b,target)>1,life:.63});
  sound(p,'secretDavisImpact');
 }
 return true;
}

export function tickSecretPuwBomb(world,bomb,dt,detonate){
 const step=Math.min(dt,Math.max(0,bomb.life));
 bomb.x+=bomb.vx*step;
 bomb.y+=bomb.vy*step;
 bomb.life-=step;
 if(bomb.life>0)return;
 // Overlapping boss proxies share this single bomb's budget.
 bomb.bomberSalvo={bossDamage:new Map(),bossCap:bomb.damage};
 detonate(world,bomb);
}

export function secretPuwImpact(p,b,{cue,sound}){
 cue(p,'puwImpact',b,{a:b.releaseAngle,slot:b.puwIndex,radius:p.explosionRadius?.(b.radius)??b.radius,life:1.15});
 sound(p,'secretPuwImpact');
}
