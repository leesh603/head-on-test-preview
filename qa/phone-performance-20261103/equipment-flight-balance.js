import {wimperisTarget} from './flight-equipment.js';
// Shared equipment-only modifiers. Pilot bursts remain in their authored paths.
export function equipmentCruiseMultiplier(p){
 const mercedes=p.upgrades?.mercedesEngine?1+(1.55/1.2-1)*(p.mercedesOutput160||0):1;
 const pursuit=p.upgrades?.redScarf&&p.tailLocked?1.35/1.2:1;
 return mercedes*pursuit;
}
export function tickEquipmentCruise(p,dt,angleDiff){
 const previous=Number.isFinite(p.equipmentHeading)?p.equipmentHeading:p.a;
 const burst=p.skillTime>0||p.evadeTime>0||p.chargeTime>0||p.dreideckerActive||p.dreideckerChase>0||p.huntBoost>0||p.aceRetreat129;
 const stable=Math.abs(angleDiff(p.a,previous))/Math.max(dt,.001)<.52&&!(p.evadeTime>0)&&!(p.chargeTime>0)&&!(p.aceRetreat129);
 p.equipmentHeading=p.a;
 if(p.upgrades?.lufberyCircle)nearbyCoverCount(p);else delete p.equipmentCoverWings;
 p.equipmentStraight=Math.max(0,Math.min(1,(p.equipmentStraight||0)+(stable?dt/1.2:-dt/.75)));
 if(!burst||p.equipmentCruiseSpeed===undefined)p.equipmentCruiseSpeed=(p.baseSpeed||p.speed)*equipmentCruiseMultiplier(p);
}
export function equipmentRepairPickup(p){
 if(!p.upgrades?.sparkPlug||p.hp<=0||(p.equipmentRepairReadyAt||0)>(p.t||0))return;
 p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.12);p.equipmentRepairReadyAt=(p.t||0)+10;p.repairFlash151=.75;
}
export function nearbyCoverCount(p){
 const world=p.combatWorld?.()||p.world||p,owner=p.id||'p1',next=new Set();
 for(const wing of world.allies||[]){
  if(!wing.permanent||wing.aceWingman||(wing.ownerId||'p1')!==owner||!(wing.life>0)||wing.hp!==undefined&&wing.hp<=0)continue;
  const limit=p.equipmentCoverWings?.has(wing)?300:260;
  if(Math.hypot(wing.x-p.x,wing.y-p.y)<=limit)next.add(wing);
 }
 p.equipmentCoverWings=next;return next.size;
}

// Flight-derived close re-entry. No button, meter or pilot-specific bonus.
export const BISHOP_GLOVES=Object.freeze({range:.8,interval:.7,turn:Math.PI/4,window:1,duration:1.5,cooldown:3,minCruise:.7,targetRange:260,cone:Math.PI/8});
export function resetBishopGloves(p){
 for(const key of Object.keys(p))if(key.startsWith('bishopGloves'))delete p[key];
}
export function bishopGlovesInterval(p,base){
 return base*(p.upgrades?.flightGloves&&p.bishopGlovesTime>0&&!(p.invuln>0)&&p.hp>0?BISHOP_GLOVES.interval:1);
}
export function bishopGlovesLifetime(p,life){return life*(p.upgrades?.flightGloves?BISHOP_GLOVES.range:1);}
export function tickBishopGloves(p,dt,previous){
 if(!p.upgrades?.flightGloves){if(p.bishopGlovesTime!==undefined)resetBishopGloves(p);return;}
 if(!(dt>0))return;
 p.bishopGlovesTime=Math.max(0,(p.bishopGlovesTime||0)-dt);
 p.bishopGlovesCooldown=Math.max(0,(p.bishopGlovesCooldown||0)-dt);
 const dx=p.x-previous.x,dy=p.y-previous.y,d=Math.hypot(dx,dy),cruise=Math.max(1,p.baseSpeed||p.speed||1);
 const valid=p.hp>0&&p.status!=='downed'&&!(p.invuln>0)&&!(p.evadeTime>0)&&!(p.chargeTime>0)&&!(p.heineckeEscape>0)&&!(p.bishopTime>0)&&d>=cruise*BISHOP_GLOVES.minCruise*dt&&d<=cruise*5*dt;
 if(!valid){delete p.bishopGlovesHeading;delete p.bishopGlovesTurns;p.bishopGlovesTime=0;return;}
 const heading=Math.atan2(dy,dx),now=(p.bishopGlovesClock||0)+dt;
 p.bishopGlovesClock=now;
 const turns=p.bishopGlovesTurns??=[];
 if(Number.isFinite(p.bishopGlovesHeading))turns.push({at:now,turn:Math.abs(Math.atan2(Math.sin(heading-p.bishopGlovesHeading),Math.cos(heading-p.bishopGlovesHeading)))});
 p.bishopGlovesHeading=heading;
 while(turns.length&&turns[0].at<=now-BISHOP_GLOVES.window)turns.shift();
 if(p.bishopGlovesCooldown>0||turns.reduce((n,s)=>n+s.turn,0)+1e-8<BISHOP_GLOVES.turn)return;
 const target=wimperisTarget(p,{heading:p.a,range:BISHOP_GLOVES.targetRange,cone:BISHOP_GLOVES.cone});
 if(!target||target.entity.invuln>0||target.entity.invulnerable)return;
 p.bishopGlovesTime=BISHOP_GLOVES.duration;p.bishopGlovesCooldown=BISHOP_GLOVES.cooldown;turns.length=0;
}
