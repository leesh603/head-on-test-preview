// Flight-time equipment: no projectile guidance and no changes to damage budgets.
export const FLIGHT_EQUIPMENT=Object.freeze([
 Object.freeze({id:'strutterAirbrake',name:'소프위드 스트러터 에어브레이크',family:'SPEED',desc:'선회기동 중 잠시 감속해 좁게 돌아선 뒤 재가속합니다. 기체 전환 장비와 동시 장착할 수 없습니다.'}),
 Object.freeze({id:'wimperisSight',name:'윔페리스 폭격 조준기',family:'EXPLOSIVE',desc:'로켓·수류탄·투하 폭탄의 조준을 이동 표적의 예상 위치로 보정합니다.'})
]);
export const FLIGHT_EQUIPMENT_BALANCE=Object.freeze({brakeTime:.22,recoveryTime:.12,brakeSpeed:.85,evadeSpeed:2.35,turn:12*Math.PI/180,rocketAngle:.12,grenadeAngle:.16,cooperAngle:.10,bomberAngle:.14});
const B=FLIGHT_EQUIPMENT_BALANCE;
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const worldOf=p=>p.combatWorld?.()||p.world||p;
const enabled=p=>!!p?.upgrades?.wimperisSight;

// Read-only candidates: elites keep their own movement, collision and death loop.
export function equipmentTargets(w){
 return [...new Set([...(w?.enemies||[]),...(w?.eliteEnemies?.members||[])])].filter(e=>e&&e.hp>0&&e.alive!==false&&!e.dead&&!e.expired&&!e.dying&&!e.crashing&&!e.crashed&&!e.hidden&&!e.rivalEscaped);
}

export function flightEquipmentAllowed(p,id){
 if(p?.upgrades?.[id])return false;
 if(id==='wimperisSight')return (p.rockets||0)>0||(p.mineCount||0)>0||!!p.upgrades?.cooperRack||!!p.bomberTransfer&&p.bomberTransfer.kind!=='gunship'&&p.bomberTransfer.kind!=='airship';
 return id==='strutterAirbrake'&&!p.bomberTransfer&&!['bomberTransfer','mgTransfer','airshipTransfer'].some(id=>p.upgrades?.[id]);
}

export function beginAirbrake(p){
 if(!p.upgrades?.strutterAirbrake||p.bomberTransfer||!(p.evadeTime>0))return;
 p.strutterBrakeAge=0;p.strutterBrakeDuration=p.evadeTime;
 p.a+=(p.evadeDirection||1)*B.turn;
}
export function resetFlightEquipment(p){
 delete p.strutterBrakeAge;delete p.strutterBrakeDuration;delete p.wimperisCue;
}
// Integral rather than end-of-frame samples: .82s covers 1.507 cruise-seconds,
// versus 1.927 for normal evasion. Timer/collision/input code stays authoritative.
function brakeIntegral(t){
 t=Math.max(0,t);const hold=Math.min(t,B.brakeTime),r=clamp(t-B.brakeTime,0,B.recoveryTime);
 return hold*B.brakeSpeed+r*B.brakeSpeed+(B.evadeSpeed-B.brakeSpeed)*r*r/(2*B.recoveryTime)+Math.max(0,t-B.brakeTime-B.recoveryTime)*B.evadeSpeed;
}
export function airbrakeMovement(p,dt,ordinary){
 if(!p.upgrades?.strutterAirbrake||!Number.isFinite(p.strutterBrakeAge)||!(p.strutterBrakeDuration>0))return ordinary;
 if(p.bomberTransfer||p.chargeTime>0||p.vossReverse>0||p.heineckeEscape>0||p.hp<=0||p.status==='downed'){
  delete p.strutterBrakeAge;delete p.strutterBrakeDuration;return ordinary;
 }
 const start=p.strutterBrakeAge,end=Math.min(p.strutterBrakeDuration,start+dt),active=Math.max(0,end-start);
 const value=dt>0?(brakeIntegral(end)-brakeIntegral(start)+Math.max(0,dt-active)*ordinary)/dt:ordinary;
 p.strutterBrakeAge=start+dt;
 if(p.strutterBrakeAge>=p.strutterBrakeDuration){delete p.strutterBrakeAge;delete p.strutterBrakeDuration;}
 return value;
}

const observed=new WeakMap();
const values=x=>x instanceof Map?[...x.values()]:Object.values(x||{});
function pointFor(body,part){
 const raw=body.support129?.parts?.get?.(part.id);
 return raw&&body.support129.world?body.support129.world(raw.nx,raw.ny):{x:body.x+finite(part.x),y:body.y+finite(part.y)};
}
function candidatePoints(p){
 const w=worldOf(p),out=[];
 for(const e of equipmentTargets(w)){
  if(!(e?.hp>0)||e.dead||e.dying||e.crashing||e.crashed||e.hidden||e.rivalEscaped||e.supportInvulnUntil>w.t||p.canHitTarget?.(e)===false)continue;
  const body=e.stageBossBody;
  if(!body){if(Number.isFinite(e.x)&&Number.isFinite(e.y))out.push({x:e.x,y:e.y,key:e,entity:e});continue;}
  if(body.dead||body.hidden||body.protection>0||body.entryProtection>0)continue;
  for(const part of values(body.parts)){
   if(!part||part.destroyed||part.hidden||part.active===false||part.invulnerable||part.hittable===false||!(part.hp>0))continue;
   if(w.stageBoss?.showFloors&&body.partFloor?.(part.id)>=part.hp)continue;
   const point=pointFor(body,part),hit=body.locateHit?.({...point,previousX:point.x,previousY:point.y,radius:0});
   if(body.locateHit&&hit?.partId!==part.id)continue;
   out.push({...point,key:part,entity:e,body});
  }
  if(body.coreVulnerable!==false){
   const offset=body.coreOffset?.()||body.regionalCore||{x:0,y:0},point={x:body.x+finite(offset.x),y:body.y+finite(offset.y)},hit=body.locateHit?.({...point,radius:0});
   if(!body.locateHit||hit&&(hit.partId==null||hit.partId==='hull'))out.push({...point,key:body,entity:e,body});
  }
 }
 return out;
}
function velocity(point){
 const sample=observed.get(point.key);if(sample?.valid)return {vx:sample.vx,vy:sample.vy};
 const e=point.entity;if(point.body)return {vx:finite(point.body.vx),vy:finite(point.body.vy)};
 if(Number.isFinite(e.vx)&&Number.isFinite(e.vy))return {vx:e.vx,vy:e.vy};
 const speed=e.movingShip?finite(e.driveVelocity):e.stationary||e.surface?0:finite(e.speed)*finite(e.energySpeed,1);
 return {vx:Math.cos(finite(e.a))*speed,vy:Math.sin(finite(e.a))*speed};
}
export function sampleWimperisMotion(p){
 if(!enabled(p))return;const t=finite(worldOf(p).t);
 for(const point of candidatePoints(p)){
  const prior=observed.get(point.key);if(prior?.t===t)continue;
  const dt=t-(prior?.t??t),vx=dt>0?(point.x-prior.x)/dt:0,vy=dt>0?(point.y-prior.y)/dt:0;
  observed.set(point.key,{x:point.x,y:point.y,t,vx,vy,valid:dt>0&&dt<=.2&&Math.hypot(vx,vy)<900});
 }
}
export function wimperisTarget(p,{x=p.x,y=p.y,heading=p.a,range=650,cone=.3,time=0,speed=0,front=0}={}){
 let best=null,score=Infinity;
 for(const point of candidatePoints(p)){
  const dx=point.x-x,dy=point.y-y,d=Math.hypot(dx,dy);
  if(d>range||Math.abs(delta(Math.atan2(dy,dx),heading))>cone)continue;
  const v=velocity(point);let t=time;
  if(speed){t=Math.max(0,(d-front)/speed);for(let n=0;n<5;n++)t=Math.max(0,(Math.hypot(dx+v.vx*t,dy+v.vy*t)-front)/speed);if(t>2.4)continue;}
  const px=point.x+v.vx*t,py=point.y+v.vy*t;
  if(!Number.isFinite(px)||!Number.isFinite(py))continue;
  if(d<score){best={x:px,y:py,currentX:point.x,currentY:point.y,time:t,entity:point.entity};score=d;}
 }
 return best;
}
function cue(p,x,y){p.wimperisCue={x,y,until:finite(worldOf(p).t)+.16};}
export function wimperisOrdnance(p,type,heading,reach){
 if(!enabled(p))return null;
 const rocket=type==='rocket',target=wimperisTarget(p,{heading,range:rocket?650:220,time:rocket?0:1.15,speed:rocket?520:0,front:rocket?(p.bomberTransfer?.front??30):0});
 if(!target)return {angle:heading,distance:reach};
 const limit=rocket?B.rocketAngle:B.grenadeAngle,angle=heading+clamp(delta(Math.atan2(target.y-p.y,target.x-p.x),heading),-limit,limit);
 const distance=!rocket&&p.weaponMods?.EXPLOSIVE==='focus'?clamp(Math.hypot(target.x-p.x,target.y-p.y),95,155):reach;
 const travel=rocket?(p.bomberTransfer?.front??30)+520*target.time:distance;
 cue(p,p.x+Math.cos(angle)*travel,p.y+Math.sin(angle)*travel);
 return {angle,distance};
}
export function correctWimperisBomb(p,bomb){
 if(!enabled(p)||!bomb.cooperBomb&&!bomb.bomberTransfer)return bomb;
 bomb.wimperisPrepared=true;
 const cooper=!!bomb.cooperBomb,time=cooper?bomb.maxLife:bomb.maxLife||.85;
 const x=cooper?bomb.x:p.x,y=cooper?bomb.y:p.y,heading=cooper?Math.atan2(bomb.vy,bomb.vx):bomb.releaseAngle??p.a;
 const target=wimperisTarget(p,{x,y,heading,range:cooper?250:650,cone:cooper?.65:Math.PI*.55,time});
 if(!target)return bomb;
 bomb.wimperisAimed=true;
 const baseX=cooper?bomb.x+bomb.vx*time:bomb.wimperisCenterX??bomb.x,baseY=cooper?bomb.y+bomb.vy*time:bomb.wimperisCenterY??bomb.y;
 const length=cooper?Math.hypot(bomb.vx,bomb.vy)*time:Math.hypot(baseX-x,baseY-y);
 const cap=Math.min(cooper?12:56,length*Math.tan(cooper?B.cooperAngle:B.bomberAngle)),dx=target.x-baseX,dy=target.y-baseY,d=Math.hypot(dx,dy),k=d?Math.min(1,cap/d):0;
 bomb.x+=dx*k;bomb.y+=dy*k;
 // Cooper really moves from this corrected release point. Bombers retain the
 // aircraft release sx/sy and travel visually to their corrected landing x/y.
 if(cooper){bomb.sx=bomb.x;bomb.sy=bomb.y;}
 return bomb;
}
